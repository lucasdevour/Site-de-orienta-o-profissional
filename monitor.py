import asyncio
import unicodedata
from datetime import datetime
import time
import gspread # type: ignore
from playwright.async_api import async_playwright
import requests
import urllib.parse


# --- NORMALIZAR TEXTO ---
def normalizar_texto(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto or "")
    texto = "".join(char for char in texto if not unicodedata.combining(char))
    return texto.lower()

# --- NORMALIZAR URL ---
def limpar_link(url: str) -> str:
    if not url: return ""
    import urllib.parse
    url = str(url).strip()
    parsed = urllib.parse.urlparse(url)
    qs = urllib.parse.parse_qs(parsed.query)
    
    if "indeed.com" in parsed.netloc and "jk" in qs:
        return f"https://br.indeed.com/viewjob?jk={qs['jk'][0]}"
        
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip('/')

# --- MOTOR PRINCIPAL DO ROBÔ ---
async def buscar_vagas():
    print("Conectando ao Google Sheets...")
    conta = gspread.service_account(filename="credenciais.json")
    planilha = conta.open("Histórico de Vagas Sólides").sheet1

    # --- O PULO DO GATO: MEMÓRIA DO ROBÔ ---
    print("Carregando vagas já enviadas anteriormente para evitar duplicados...")
    # Puxa todos os links da coluna 5 (Coluna E, onde salvamos os links)
    links_existentes = planilha.col_values(5)
    # Criamos um "set" para a busca ser instantânea
    links_salvos = set(limpar_link(link) for link in links_existentes if link)
    print(f"Memória carregada! Já temos {len(links_salvos)} links registrados.")

    async with async_playwright() as p:
        print("Iniciando o robô...")
        browser = await p.chromium.launch(headless=True)
        
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        cidade_alvo = "Itajaí"
        termos_busca = ["RH", "Recursos Humanos", "Recrutamento", "Psicologo"]

        for termo in termos_busca:
            print(f"\n{'='*40}")
            print(f"🚀 INICIANDO VARREDURA: '{termo}' em '{cidade_alvo}'")
            print(f"{'='*40}")

            # ==========================================
            # 1. BUSCA NA SÓLIDES
            # ==========================================
            print("\n[1/3] SÓLIDES: Procurando...")
            await page.goto("https://vagas.solides.com.br/vagas", wait_until="networkidle")
            await page.wait_for_timeout(2000)

            vaga_input = page.locator('input[placeholder="Digite o nome da vaga ou cargo"]')
            cidade_input = page.locator('input[placeholder="Digite o nome da cidade"]')
            
            await vaga_input.fill(termo)
            await cidade_input.click()
            await cidade_input.fill("") 
            await cidade_input.type(cidade_alvo, delay=150) 
            
            try:
                opcao_cidade = page.get_by_text(f"{cidade_alvo} - SC").first
                await opcao_cidade.wait_for(state="visible", timeout=5000)
                await opcao_cidade.click()
                
                await page.wait_for_timeout(1000)
                await page.locator('button:has-text("Buscar vagas")').click()
                await page.wait_for_timeout(7000)

                links = await page.locator("a[href*='/vaga/']").element_handles()
                vagas_reais_solides = 0
                hrefs_vistos = set()
                
                for link in links[:10]:
                    endereco = await link.get_attribute("href")
                    if not endereco or endereco in hrefs_vistos: continue
                    hrefs_vistos.add(endereco)

                    texto = (await link.inner_text()).replace("\n", " | ").strip()
                    if not texto or texto.lower() == "ver mais detalhes": continue

                    if normalizar_texto(termo) in normalizar_texto(texto):
                        detail_url = limpar_link(f"https://vagas.solides.com.br{endereco}")
                        
                        # VERIFICAÇÃO DE DUPLICIDADE
                        if detail_url in links_salvos:
                            print(f"⏭️ [Sólides] Ignorando vaga repetida: {texto}")
                            continue

                        vagas_reais_solides += 1
                        data_hoje = datetime.now().strftime("%d/%m/%Y %H:%M")

                        print(f"✅ [Sólides] NOVA Vaga Encontrada: {texto}")
                        planilha.append_row([data_hoje, "Sólides", texto, cidade_alvo, detail_url, "Pendente"])
                        links_salvos.add(detail_url) # Adiciona na memória temporária para essa rodada
                        
                if vagas_reais_solides == 0:
                    print(f"❌ Nenhuma vaga nova para '{termo}' na Sólides.")
            except Exception as e:
                print(f"⚠️ Erro ao buscar na Sólides: O menu de cidade pode não ter carregado.")


            # ==========================================
            # 2. BUSCA NO LINKEDIN
            # ==========================================
            print("\n[2/3] LINKEDIN: Procurando...")
            termo_url = urllib.parse.quote(termo)
            cidade_url = urllib.parse.quote(cidade_alvo)
            url_linkedin = f"https://br.linkedin.com/jobs/search?keywords={termo_url}&location={cidade_url}&trk=public_jobs_jobs-search-bar_search-submit"
            
            await page.goto(url_linkedin, wait_until="domcontentloaded")
            await page.wait_for_timeout(5000)

            try:
                botao_fechar = page.locator('button.modal__dismiss, button[aria-label="Descartar"], button[aria-label="Dismiss"]')
                if await botao_fechar.count() > 0:
                    await botao_fechar.first.click()
                    await page.wait_for_timeout(2000)
            except Exception:
                pass

            vagas_linkedin = await page.locator("ul.jobs-search__results-list > li").element_handles()
            vagas_reais_lk = 0
            
            for vaga in vagas_linkedin[:10]:
                try:
                    titulo_el = await vaga.query_selector("h3.base-search-card__title")
                    if not titulo_el: continue
                    titulo = (await titulo_el.inner_text()).strip()
                    
                    link_el = await vaga.query_selector("a.base-card__full-link")
                    link = limpar_link(await link_el.get_attribute("href")) if link_el else ""
                    
                    if normalizar_texto(termo) in normalizar_texto(titulo):
                        
                        # VERIFICAÇÃO DE DUPLICIDADE
                        if link in links_salvos:
                            print(f"⏭️ [LinkedIn] Ignorando vaga repetida: {titulo}")
                            continue

                        vagas_reais_lk += 1
                        data_hoje = datetime.now().strftime("%d/%m/%Y %H:%M")
                        
                        print(f"✅ [LinkedIn] NOVA Vaga Encontrada: {titulo}")
                        planilha.append_row([data_hoje, "LinkedIn", titulo, cidade_alvo, link, "Pendente"])
                        links_salvos.add(link)
                except Exception:
                    pass
            
            if vagas_reais_lk == 0:
                print(f"❌ Nenhuma vaga nova para '{termo}' no LinkedIn.")


            # ==========================================
            # 3. BUSCA NO INDEED
            # ==========================================
            print("\n[3/3] INDEED: Procurando...")
            cidade_indeed = "Itajaí, SC"
            cidade_url_indeed = urllib.parse.quote(cidade_indeed)
            url_indeed = f"https://br.indeed.com/jobs?q={termo_url}&l={cidade_url_indeed}"
            
            await page.goto(url_indeed)
            await page.wait_for_timeout(5000) 

            vagas_indeed = await page.locator("div.job_seen_beacon").element_handles()
            vagas_reais_indeed = 0
            
            for vaga in vagas_indeed[:10]:
                try:
                    link_el = await vaga.query_selector("h2.jobTitle a, a.jcs-JobTitle, a[id^='job_']")
                    if not link_el: continue
                    
                    titulo = (await link_el.inner_text()).strip()
                    link_parcial = await link_el.get_attribute("href")
                    link = limpar_link(f"https://br.indeed.com{link_parcial}") if link_parcial else ""
                    
                    if normalizar_texto(termo) in normalizar_texto(titulo):
                        
                        # VERIFICAÇÃO DE DUPLICIDADE
                        if link in links_salvos:
                            print(f"⏭️ [Indeed] Ignorando vaga repetida: {titulo}")
                            continue

                        vagas_reais_indeed += 1
                        data_hoje = datetime.now().strftime("%d/%m/%Y %H:%M")
                        
                        print(f"✅ [Indeed] NOVA Vaga Encontrada: {titulo}")
                        planilha.append_row([data_hoje, "Indeed", titulo, cidade_alvo, link, "Pendente"])
                        links_salvos.add(link)
                except Exception:
                    pass
            
            if vagas_reais_indeed == 0:
                print(f"❌ Nenhuma vaga nova para '{termo}' no Indeed.")

        print("\n🎉 Rodada completa! Todas as plataformas foram verificadas com sucesso.")
        await browser.close()

asyncio.run(buscar_vagas())