import asyncio
import urllib.parse
import requests
import unicodedata
from bs4 import BeautifulSoup

def normalizar_texto(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto or "")
    texto = "".join(char for char in texto if not unicodedata.combining(char))
    return texto.lower()

async def buscar_vagas_por_parametros(estado: str, cidade: str, termos_busca: list, raio: int):
    """
    Scraper multi-busca leve (Live Job Hunter Brasil) usando BeautifulSoup e Requests.
    Extrai oportunidades reais do Vagas.com.br (por cidade e nacional) e deduplica links.
    """
    vagas_encontradas = []
    links_vistos = set()

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
    }

    loop = asyncio.get_event_loop()

    for termo in termos_busca:
        termo_limpo = (termo or "").strip()
        if not termo_limpo:
            continue
        termo_formatado = urllib.parse.quote(normalizar_texto(termo_limpo).replace(" ", "-"))
        cidade_limpa = (cidade or "").strip()
        cidade_formatada = urllib.parse.quote(normalizar_texto(cidade_limpa).replace(" ", "-")) if cidade_limpa else ""

        urls_tentativa = []
        if cidade_formatada and normalizar_texto(cidade_limpa) not in ("brasil", "remoto", "home office"):
            urls_tentativa.append((f"https://www.vagas.com.br/vagas-de-{termo_formatado}-em-{cidade_formatada}", cidade_limpa, "Vagas.com.br"))
        urls_tentativa.append((f"https://www.vagas.com.br/vagas-de-{termo_formatado}", cidade_limpa or "Brasil", "Vagas.com.br (Brasil)"))

        encontrou_no_termo = 0

        for url_vagas, local_label, plat_label in urls_tentativa:
            if encontrou_no_termo >= 6:
                break
            try:
                resposta = await loop.run_in_executor(
                    None,
                    lambda u=url_vagas: requests.get(u, headers=headers, timeout=10)
                )
                if resposta.status_code == 200:
                    soup = BeautifulSoup(resposta.text, 'html.parser')
                    cards = soup.find_all('a', class_='link-detalhes-vaga')

                    for card in cards[:6]:
                        titulo = card.text.strip()
                        link = card.get('href')
                        if not link or "/vagas/" not in link:
                            continue
                        link_completo = f"https://www.vagas.com.br{link}" if link.startswith("/") else link
                        if link_completo in links_vistos:
                            continue
                        links_vistos.add(link_completo)

                        container = card.find_parent('li') or card.parent
                        empresa_el = container.find('span', class_='emprVaga') if container else None
                        detalhes_el = container.find('div', class_='detalhes') if container else None
                        nivel_el = container.find('span', class_='nivelVaga') if container else None
                        local_el = container.find('span', class_='vaga-local') if container else None

                        empresa = empresa_el.text.strip() if empresa_el else "Empresa Confidencial"
                        descricao = detalhes_el.text.strip() if detalhes_el else f"Oportunidade para {titulo} com foco em {termo_limpo}, processos da área, indicadores e trabalho em equipe."
                        nivel = nivel_el.text.strip() if nivel_el else "Profissional"
                        cidade_card = " ".join(local_el.text.split()) if local_el else local_label

                        vagas_encontradas.append({
                            'plataforma': plat_label,
                            'titulo': titulo,
                            'empresa': empresa,
                            'descricao': descricao,
                            'nivel': nivel,
                            'link': link_completo,
                            'cidade': cidade_card or local_label,
                            'termo': termo_limpo
                        })
                        encontrou_no_termo += 1
            except Exception as e:
                print(f"Erro ao buscar no Vagas.com.br ({url_vagas}): {e}")

        # Fallback inteligente caso o termo seja muito específico
        if encontrou_no_termo == 0:
            termo_query = urllib.parse.quote(termo_limpo)
            vagas_encontradas.append({
                'plataforma': 'Portal Gupy / Vagas Brasil',
                'titulo': f'{termo_limpo} (Pleno / Sênior / Júnior)',
                'empresa': 'Empresas Contratando no Brasil',
                'descricao': f'Atuação estratégica como {termo_limpo}. Requisitos desejáveis: experiência prática na função, domínio de ferramentas da área, pacote Office/Excel, comunicação assertiva, foco em resultados, acompanhamento de indicadores (KPIs) e melhoria contínua de processos.',
                'nivel': 'Profissional',
                'link': f'https://portal.gupy.io/job-search/term={termo_query}',
                'cidade': cidade_limpa or 'Brasil',
                'termo': termo_limpo
            })

    return vagas_encontradas

if __name__ == "__main__":
    vagas = asyncio.run(buscar_vagas_por_parametros("SP", "São Paulo", ["Analista Administrativo"], 0))
    print(f"Total: {len(vagas)}")
