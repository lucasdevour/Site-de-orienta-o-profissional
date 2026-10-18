import os
import sqlite3
import bcrypt
import json
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import database
from scraper import buscar_vagas_por_parametros
from job_matcher import analisar_compatibilidade

app = FastAPI(title="Monitor de Vagas & Career Suite API")

# Inicia o banco de dados e garante que as tabelas existem
database.init_db()

# Configurando CORS para permitir o Frontend acessar a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_NAME = "monitor_vagas.db"
SUITE_HTML_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "webapp", "public", "suite.html")

class UserLogin(BaseModel):
    email: str
    senha: str

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

@app.get("/")
def root():
    return {"message": "SaaS Career Engine Backend Running (Web-Only)!", "suite_url": "/suite"}

@app.get("/suite")
def serve_career_suite():
    if os.path.exists(SUITE_HTML_PATH):
        return FileResponse(SUITE_HTML_PATH, media_type="text/html")
    raise HTTPException(status_code=404, detail="Dashboard index.html não encontrado.")

# Cadastro
@app.post("/api/cadastro")
def cadastrar(user: UserLogin, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT email FROM usuarios_web WHERE email = ?", (user.email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
        
    hashed_password = bcrypt.hashpw(user.senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    cursor.execute("INSERT INTO usuarios_web (email, senha) VALUES (?, ?)", (user.email, hashed_password))
    db.commit()
    return {"message": "Cadastro realizado com sucesso!"}

# Login
@app.post("/api/login")
def login(user: UserLogin, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM usuarios_web WHERE email = ?", (user.email,))
    row = cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")
        
    try:
        if not bcrypt.checkpw(user.senha.encode('utf-8'), row['senha'].encode('utf-8')):
            raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")
    except ValueError:
        raise HTTPException(status_code=401, detail="Conta desatualizada. Crie um novo cadastro.")
    
    return {"message": "Login bem-sucedido!", "email": row['email']}

# Salvar Currículo (Recebe um Dicionário livre)
@app.post("/api/curriculo")
async def salvar_curriculo(request: Request, db: sqlite3.Connection = Depends(get_db)):
    data = await request.json()
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="E-mail não fornecido.")

    cursor = db.cursor()
    cursor.execute("SELECT id FROM curriculos WHERE email = ?", (email,))
    row = cursor.fetchone()
    
    dados_json = json.dumps(data)
    
    if row:
        cursor.execute("UPDATE curriculos SET dados_json = ? WHERE email = ?", (dados_json, email))
    else:
        cursor.execute("INSERT INTO curriculos (email, dados_json) VALUES (?, ?)", (email, dados_json))
        
    db.commit()
    return {"message": "Currículo salvo com sucesso em JSON!"}

# Carregar Currículo
@app.get("/api/curriculo/{email}")
def carregar_curriculo(email: str, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT dados_json FROM curriculos WHERE email = ?", (email,))
    row = cursor.fetchone()
    
    if not row:
        return {}
    
    return json.loads(row['dados_json'])

# Buscar Preferências de Busca de Vagas (Estado, Cidade, Termos)
@app.get("/api/preferencias/{email}")
@app.get("/api/bot-config/{email}")
def get_preferencias(email: str, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT estado, cidade, termos FROM usuarios_web WHERE email = ?", (email,))
    row = cursor.fetchone()
    if not row:
        return {"estado": "", "cidade": "", "termos": ""}
    return {
        "estado": row["estado"] or "",
        "cidade": row["cidade"] or "",
        "termos": row["termos"] or ""
    }

# Salvar Preferências de Busca de Vagas
@app.post("/api/preferencias")
@app.post("/api/bot-config")
async def save_preferencias(request: Request, db: sqlite3.Connection = Depends(get_db)):
    data = await request.json()
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="E-mail não fornecido.")
    cursor = db.cursor()
    cursor.execute(
        "UPDATE usuarios_web SET estado = ?, cidade = ?, termos = ? WHERE email = ?",
        (data.get("estado", ""), data.get("cidade", ""), data.get("termos", ""), email)
    )
    db.commit()
    return {"message": "Preferências de busca salvas com sucesso!"}

# Etapa 1: Buscar Vagas ao Vivo + Ranking Automático com Job Matcher ATS Score
@app.post("/api/buscar-vagas")
async def api_buscar_vagas(request: Request, db: sqlite3.Connection = Depends(get_db)):
    data = await request.json()
    email = data.get("email")
    estado = data.get("estado", "SC")
    cidade = data.get("cidade", "Itajaí")
    termos_raw = data.get("termos", "")
    curriculo_json = data.get("curriculo")

    if email and not curriculo_json:
        curriculo_json = database.get_curriculo_by_email(email)

    if email and not termos_raw:
        cursor = db.cursor()
        cursor.execute("SELECT estado, cidade, termos FROM usuarios_web WHERE email = ?", (email,))
        row = cursor.fetchone()
        if row:
            estado = estado or row["estado"] or "SC"
            cidade = cidade or row["cidade"] or "Itajaí"
            termos_raw = row["termos"] or ""

    termos_lista = [t.strip() for t in termos_raw.split(",") if t.strip()]
    if not termos_lista:
        termos_lista = ["Administrativo"]

    vagas = await buscar_vagas_por_parametros(
        estado=estado,
        cidade=cidade,
        termos_busca=termos_lista,
        raio=1
    )

    from recruitxray import auditar_vaga_recruitxray

    vagas_enriquecidas = []
    for vaga in vagas:
        match_info = analisar_compatibilidade(vaga, curriculo_json=curriculo_json, termos_usuario=termos_raw)
        xray_info = auditar_vaga_recruitxray(vaga)
        vagas_enriquecidas.append({
            **vaga,
            "match": match_info,
            "recruitxray": xray_info
        })

    # Ordena priorizando menor risco de golpe e maior compatibilidade ATS
    vagas_enriquecidas.sort(
        key=lambda v: (v["recruitxray"]["risk_category"] == "HIGH", -v["match"]["match_score"])
    )

    return {
        "total": len(vagas_enriquecidas),
        "vagas": vagas_enriquecidas
    }

# Etapa 1: Analisar Compatibilidade ATS (Job Matcher) entre Currículo e Vaga específica
@app.post("/api/match-vaga")
async def match_vaga(request: Request):
    data = await request.json()
    email = data.get("email")
    curriculo_json = data.get("curriculo")
    termos = data.get("termos", "")

    if not curriculo_json and email:
        curriculo_json = database.get_curriculo_by_email(email)

    vaga = {
        "titulo": data.get("titulo", ""),
        "descricao": data.get("descricao", ""),
        "nivel": data.get("nivel", ""),
        "termo": data.get("termo", "")
    }
    return analisar_compatibilidade(vaga, curriculo_json=curriculo_json, termos_usuario=termos)

# Etapa 2: Kit de Candidatura (Injobman: Currículo ATS + Carta) e Coaching (HireMe: Entrevista 80/20 + Salário)
@app.post("/api/preparar-candidatura")
async def preparar_candidatura(request: Request):
    from career_coach import gerar_kit_candidatura
    data = await request.json()
    email = data.get("email")
    curriculo_json = data.get("curriculo")
    termos = data.get("termos", "")

    if not curriculo_json and email:
        curriculo_json = database.get_curriculo_by_email(email)

    vaga = {
        "titulo": data.get("titulo", "Profissional"),
        "empresa": data.get("empresa", "Empresa Contratante"),
        "cidade": data.get("cidade", "Brasil"),
        "descricao": data.get("descricao", ""),
        "nivel": data.get("nivel", ""),
        "termo": data.get("termo", "")
    }
    return gerar_kit_candidatura(vaga, curriculo_json=curriculo_json, termos_usuario=termos)

# Etapa 3: Auditoria Forense de Vaga / Recrutador (RecruitXray)
@app.post("/api/auditar-vaga")
async def auditar_vaga(request: Request):
    from recruitxray import auditar_vaga_recruitxray
    data = await request.json()
    vaga = {
        "titulo": data.get("titulo", ""),
        "empresa": data.get("empresa", ""),
        "descricao": data.get("descricao", ""),
        "link": data.get("link", ""),
        "plataforma": data.get("plataforma", "")
    }
    return auditar_vaga_recruitxray(vaga)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)


