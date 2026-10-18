import requests
from bs4 import BeautifulSoup

def test_catho():
    url = "https://www.catho.com.br/vagas/eletricista/sc/itajai/"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    res = requests.get(url, headers=headers)
    print("Catho status:", res.status_code)
    soup = BeautifulSoup(res.text, "html.parser")
    vagas_tags = soup.find_all("a")
    vagas = []
    for a in vagas_tags:
        if a.get('href') and '/vagas/' in a.get('href') and '-sc/' in a.get('href'):
            titulo = a.text.strip()
            if titulo and len(titulo) > 3:
                vagas.append({'titulo': titulo, 'link': a.get('href')})
    print("Catho vagas encontradas:", vagas[:5])

def test_jooble():
    url = "https://br.jooble.org/rss/vagas-de-emprego-eletricista/Itaja%C3%AD%2C-SC"
    headers = {"User-Agent": "Mozilla/5.0"}
    res = requests.get(url, headers=headers)
    print("Jooble status:", res.status_code)
    soup = BeautifulSoup(res.text, "xml")
    items = soup.find_all("item")
    print("Jooble vagas:", [i.title.text for i in items][:5])

try: test_catho()
except Exception as e: print("Catho fail", e)
try: test_jooble()
except Exception as e: print("Jooble fail", e)
