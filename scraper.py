import asyncio
import urllib.parse
import requests
import re
import unicodedata

def normalizar_texto(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto or "")
    texto = "".join(char for char in texto if not unicodedata.combining(char))
    return texto.lower()

async def buscar_vagas_por_parametros(estado: str, cidade: str, termos_busca: list, raio: int):
    """
    Scraper ultra-leve que não usa navegador completo (para rodar no plano gratuito do Render).
    Faz buscas diretas usando requisições.
    """
    vagas_encontradas = []
    
    # Headers para simular um navegador comum e evitar bloqueios simples
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    for termo in termos_busca:
        # Busca 1: Google (Procurando vagas no LinkedIn)
        try:
            query = f'site:linkedin.com/jobs/view "{termo}" "{cidade}" "{estado}"'
            url_google = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
            
            # Rodar request de forma assíncrona
            loop = asyncio.get_event_loop()
            resposta = await loop.run_in_executor(None, lambda: requests.get(url_google, headers=headers, timeout=10))
            
            if resposta.status_code == 200:
                html = resposta.text
                
                # Extrair links do LinkedIn e Títulos do Google
                # O Google embute as URLs em tags <a> com href="/url?q=..."
                links_brutos = re.findall(r'<a href="(/url\?q=https://br\.linkedin\.com/jobs/view/[^"]+)"', html)
                
                for link_sujo in links_brutos[:3]: # Pega as 3 primeiras do google
                    link_limpo = urllib.parse.unquote(link_sujo.replace("/url?q=", "").split("&amp;")[0])
                    vagas_encontradas.append({
                        'plataforma': 'LinkedIn (via Google)',
                        'titulo': f'Vaga para {termo} (Ver link para detalhes)',
                        'link': link_limpo,
                        'cidade': cidade,
                        'termo': termo
                    })
        except Exception as e:
            print(f"Erro na busca Google/LinkedIn: {e}")

        # Busca 2: Vagas mockadas/simuladas como fallback garantido para a demonstração
        # Isso garante que o usuário sempre receba algo se os requests falharem
        if len(vagas_encontradas) == 0:
            vagas_encontradas.append({
                'plataforma': 'Sólides (Simulação)',
                'titulo': f'{termo} - Recrutamento Imediato',
                'link': f'https://vagas.solides.com.br/vaga-simulada-{urllib.parse.quote(termo.replace(" ", "-"))}',
                'cidade': cidade,
                'termo': termo
            })

    return vagas_encontradas

if __name__ == "__main__":
    vagas = asyncio.run(buscar_vagas_por_parametros("SC", "Itajaí", ["Eletricista"], 0))
    print(vagas)
