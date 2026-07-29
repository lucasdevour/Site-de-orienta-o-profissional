import sqlite3
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import database

app = FastAPI()

# Inicia o banco de dados e garante que as tabelas existem
database.init_db()

# Configurando CORS para permitir o React acessar a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # URL do Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_NAME = "monitor_vagas.db"

import bcrypt
import json
import secrets

# Modelos Pydantic para validar os dados
class UserLogin(BaseModel):
    email: str
    senha: str

# Dependência do Banco de Dados
def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Rota Básica de Teste
@app.get("/")
def root():
    return {"message": "SaaS Backend Running!"}

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
        # Se a senha no banco não for um hash válido (conta velha), bloqueia
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
    # Verifica se já tem um currículo
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
        return {} # Se não tiver currículo, retorna vazio sem erro
    
    return json.loads(row['dados_json'])

# Gerar Link do Telegram
@app.get("/api/telegram-link/{email}")
def gerar_telegram_link(email: str, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT email, telegram_chat_id FROM usuarios_web WHERE email = ?", (email,))
    row = cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        
    if row['telegram_chat_id']:
        # Já está vinculado
        return {"vinculado": True, "link": "https://t.me/Alerta_e_Busca_Vagas_Bot"}
        
    # Gera um token seguro de 8 caracteres
    token = secrets.token_hex(4).upper()
    
    cursor.execute("UPDATE usuarios_web SET telegram_token = ? WHERE email = ?", (token, email))
    db.commit()
    
    # Substitua 'MonitorVagasBot' pelo username real do seu bot
    deep_link = f"https://t.me/Alerta_e_Busca_Vagas_Bot?start={token}"
    return {"vinculado": False, "link": deep_link}

# Buscar configurações do Bot
@app.get("/api/bot-config/{email}")
def get_bot_config(email: str, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT telegram_chat_id FROM usuarios_web WHERE email = ?", (email,))
    row = cursor.fetchone()
    
    if not row or not row['telegram_chat_id']:
        return {"vinculado": False}
        
    chat_id = row['telegram_chat_id']
    cursor.execute("SELECT estado, cidade, termos, ativo FROM usuarios WHERE chat_id = ?", (chat_id,))
    bot_row = cursor.fetchone()
    
    if not bot_row:
        # Cria o perfil padrão se não existir (Ocorrerá no 1º pareamento)
        cursor.execute("INSERT INTO usuarios (chat_id, estado, cidade, raio, termos, horario_inicio, horario_fim, ativo) VALUES (?, ?, ?, 1, ?, '09:00', '18:00', 1)", (chat_id, '', '', ''))
        db.commit()
        return {"vinculado": True, "estado": "", "cidade": "", "termos": "", "ativo": 1}
        
    return {"vinculado": True, "estado": bot_row['estado'] or "", "cidade": bot_row['cidade'] or "", "termos": bot_row['termos'] or "", "ativo": bot_row['ativo']}

# Salvar configurações do Bot
@app.post("/api/bot-config")
async def save_bot_config(request: Request, db: sqlite3.Connection = Depends(get_db)):
    data = await request.json()
    email = data.get("email")
    cursor = db.cursor()
    cursor.execute("SELECT telegram_chat_id FROM usuarios_web WHERE email = ?", (email,))
    row = cursor.fetchone()
    
    if row and row['telegram_chat_id']:
        cursor.execute("UPDATE usuarios SET estado = ?, cidade = ?, termos = ? WHERE chat_id = ?", 
                      (data.get('estado'), data.get('cidade'), data.get('termos'), row['telegram_chat_id']))
        db.commit()
    return {"message": "Configurações do robô salvas!"}

if __name__ == "__main__":
    import uvicorn
    # Isso só roda se usar `python server.py`. Melhor usar via uvicorn terminal.
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
