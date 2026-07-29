import asyncio
from playwright.async_api import async_playwright
import urllib.parse

async def testar_linkedin():
    async with async_playwright() as p:
        print("Iniciando o robô explorador do LinkedIn...")
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        termo = "Recursos Humanos"
        cidade = "Itajaí"
        
        termo_url = urllib.parse.quote(termo)
        cidade_url = urllib.parse.quote(cidade)
        
        url_linkedin = f"https://br.linkedin.com/jobs/search?keywords={termo_url}&location={cidade_url}&trk=public_jobs_jobs-search-bar_search-submit"
        
        print(f"Acessando: {url_linkedin}")
        await page.goto(url_linkedin, wait_until="domcontentloaded")
        await page.wait_for_timeout(5000) 

        # --- CAÇADOR DE POP-UP DE LOGIN ---
        print("Verificando se o LinkedIn jogou o pop-up na tela...")
        try:
            # Procura botões de fechar comuns no LinkedIn (o "X")
            botao_fechar = page.locator('button.modal__dismiss, button[aria-label="Descartar"], button[aria-label="Dismiss"]')
            
            # Se ele encontrar o botão na tela, ele clica
            if await botao_fechar.count() > 0:
                print("Pop-up detectado! Fechando...")
                await botao_fechar.first.click()
                await page.wait_for_timeout(2000) # Espera a animação de fechar sumir
            else:
                print("Nenhum pop-up bloqueando a visão desta vez.")
        except Exception as e:
            print("Erro ao tentar fechar pop-up (ou ele não existia).")
        # ----------------------------------

        print("Procurando os cartões de vagas...")
        vagas = await page.locator("ul.jobs-search__results-list > li").element_handles()
        
        if not vagas:
            print("❌ Não conseguimos carregar a lista. O LinkedIn mudou a estrutura ou bloqueou a visualização.")
        else:
            print(f"✅ Sucesso! Encontramos {len(vagas)} vagas na página inicial.")
            print("Extraindo os dados das 5 primeiras...\n")
            
            for i, vaga in enumerate(vagas[:5]):
                try:
                    titulo_element = await vaga.query_selector("h3.base-search-card__title")
                    titulo = await titulo_element.inner_text() if titulo_element else "Sem Título"
                    
                    link_element = await vaga.query_selector("a.base-card__full-link")
                    link = await link_element.get_attribute("href") if link_element else "Sem Link"
                    
                    empresa_element = await vaga.query_selector("h4.base-search-card__subtitle")
                    empresa = await empresa_element.inner_text() if empresa_element else "Empresa Desconhecida"

                    print(f"--- VAGA {i+1} ---")
                    print(f"Cargo: {titulo.strip()}")
                    print(f"Empresa: {empresa.strip()}")
                    print(f"Link: {link.split('?')[0]}") 
                    print("-" * 20)
                except Exception as e:
                    print(f"Erro ao ler a vaga {i+1}: {e}")

        print("\nFinalizando teste do LinkedIn...")
        await browser.close()

asyncio.run(testar_linkedin())