import asyncio
import unicodedata
import urllib.parse
from datetime import datetime
from playwright.async_api import async_playwright

def normalizar_texto(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto or "")
    texto = "".join(char for char in texto if not unicodedata.combining(char))
    return texto.lower()

def limpar_link(url: str) -> str:
    if not url: return ""
    import urllib.parse
    url = str(url).strip()
    parsed = urllib.parse.urlparse(url)
    qs = urllib.parse.parse_qs(parsed.query)
    
    if "indeed.com" in parsed.netloc and "jk" in qs:
        return f"https://br.indeed.com/viewjob?jk={qs['jk'][0]}"
        
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip('/')

async def buscar_vagas_por_parametros(estado: str, cidade: str, termos_busca: list, raio: int):
    """
    Realiza a raspagem de vagas.
    raio: 0 = cidade exata, 1 = cidades vizinhas (raio padrao).
    Retorna uma lista de vagas encontradas:
    [{'plataforma': 'Indeed', 'titulo': 'Vaga X', 'link': '...', 'cidade': '...', 'termo': '...'}, ...]
    """
    vagas_encontradas = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        for termo in termos_busca:
            
            # ==========================================
            # 1. SÓLIDES
            # ==========================================
            try:
                await page.goto("https://vagas.solides.com.br/vagas", wait_until="networkidle")
                await page.wait_for_timeout(2000)

                vaga_input = page.locator('input[placeholder="Digite o nome da vaga ou cargo"]')
                cidade_input = page.locator('input[placeholder="Digite o nome da cidade"]')
                
                await vaga_input.fill(termo)
                await cidade_input.click()
                await cidade_input.fill("") 
                await cidade_input.type(cidade, delay=150) 
                
                opcao_texto = f"{cidade} - {estado}".upper()
                # A Sólides costuma ter opções no formato "Itajaí - SC".
                opcao_cidade = page.get_by_text(f"{cidade} - {estado}").first
                
                # Se não achar com caixa exata, tenta regex ignore case
                if await opcao_cidade.count() == 0:
                    opcao_cidade = page.locator(f"text=/{cidade} - {estado}/i").first
                
                if await opcao_cidade.count() > 0:
                    await opcao_cidade.wait_for(state="visible", timeout=3000)
                    await opcao_cidade.click()
                    
                    await page.wait_for_timeout(1000)
                    await page.locator('button:has-text("Buscar vagas")').click()
                    await page.wait_for_timeout(5000)

                    links = await page.locator("a[href*='/vaga/']").element_handles()
                    hrefs_vistos = set()
                    
                    for link in links[:10]:
                        endereco = await link.get_attribute("href")
                        if not endereco or endereco in hrefs_vistos: continue
                        hrefs_vistos.add(endereco)

                        texto = (await link.inner_text()).replace("\n", " | ").strip()
                        if not texto or texto.lower() == "ver mais detalhes": continue

                        if normalizar_texto(termo) in normalizar_texto(texto):
                            detail_url = limpar_link(f"https://vagas.solides.com.br{endereco}")
                            vagas_encontradas.append({
                                'plataforma': 'Sólides',
                                'titulo': texto,
                                'link': detail_url,
                                'cidade': cidade,
                                'termo': termo
                            })
            except Exception as e:
                print(f"Erro na Sólides: {e}")

            # ==========================================
            # 2. LINKEDIN
            # ==========================================
            try:
                termo_url = urllib.parse.quote(termo)
                cidade_url = urllib.parse.quote(f"{cidade}, {estado}")
                
                distancia_param = ""
                if raio == 0:
                    distancia_param = "&distance=0" # Força cidade exata
                
                url_linkedin = f"https://br.linkedin.com/jobs/search?keywords={termo_url}&location={cidade_url}&trk=public_jobs_jobs-search-bar_search-submit{distancia_param}"
                
                await page.goto(url_linkedin, wait_until="domcontentloaded")
                await page.wait_for_timeout(4000)

                botao_fechar = page.locator('button.modal__dismiss, button[aria-label="Descartar"], button[aria-label="Dismiss"]')
                if await botao_fechar.count() > 0:
                    await botao_fechar.first.click()
                    await page.wait_for_timeout(1000)

                vagas_linkedin = await page.locator("ul.jobs-search__results-list > li").element_handles()
                for vaga in vagas_linkedin[:10]:
                    titulo_el = await vaga.query_selector("h3.base-search-card__title")
                    if not titulo_el: continue
                    titulo = (await titulo_el.inner_text()).strip()
                    
                    link_el = await vaga.query_selector("a.base-card__full-link")
                    link = limpar_link(await link_el.get_attribute("href")) if link_el else ""
                    
                    if normalizar_texto(termo) in normalizar_texto(titulo):
                        vagas_encontradas.append({
                            'plataforma': 'LinkedIn',
                            'titulo': titulo,
                            'link': link,
                            'cidade': cidade,
                            'termo': termo
                        })
            except Exception as e:
                print(f"Erro no LinkedIn: {e}")

            # ==========================================
            # 3. INDEED
            # ==========================================
            try:
                termo_url = urllib.parse.quote(termo)
                cidade_url_indeed = urllib.parse.quote(f"{cidade}, {estado}")
                
                distancia_param = ""
                if raio == 0:
                    distancia_param = "&radius=0"
                
                url_indeed = f"https://br.indeed.com/jobs?q={termo_url}&l={cidade_url_indeed}{distancia_param}"
                
                await page.goto(url_indeed)
                await page.wait_for_timeout(4000) 

                vagas_indeed = await page.locator("div.job_seen_beacon").element_handles()
                for vaga in vagas_indeed[:10]:
                    link_el = await vaga.query_selector("h2.jobTitle a, a.jcs-JobTitle, a[id^='job_']")
                    if not link_el: continue
                    
                    titulo = (await link_el.inner_text()).strip()
                    link_parcial = await link_el.get_attribute("href")
                    link = limpar_link(f"https://br.indeed.com{link_parcial}") if link_parcial else ""
                    
                    if normalizar_texto(termo) in normalizar_texto(titulo):
                        vagas_encontradas.append({
                            'plataforma': 'Indeed',
                            'titulo': titulo,
                            'link': link,
                            'cidade': cidade,
                            'termo': termo
                        })
            except Exception as e:
                print(f"Erro no Indeed: {e}")

        await browser.close()
        return vagas_encontradas

if __name__ == "__main__":
    # Teste rápido
    vagas = asyncio.run(buscar_vagas_por_parametros("SC", "Itajaí", ["RH"], 0))
    print(vagas)
