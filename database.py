import sqlite3
from typing import List, Dict, Any

DB_NAME = "monitor_vagas.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Tabela de Usuários do Telegram
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS usuarios (
        chat_id TEXT PRIMARY KEY,
        estado TEXT,
        cidade TEXT,
        raio INTEGER, -- 0 para cidade exata, 1 para cidades vizinhas
        termos TEXT, -- separado por virgula
        horario_inicio TEXT, -- formato HH:MM
        horario_fim TEXT, -- formato HH:MM
        ativo INTEGER DEFAULT 1
    )
    ''')
    
    # Tabela de Vagas Enviadas
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS vagas_enviadas (
        chat_id TEXT,
        link_vaga TEXT,
        data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (chat_id, link_vaga),
        FOREIGN KEY(chat_id) REFERENCES usuarios(chat_id)
    )
    ''')

    # Tabela de Usuários do Web App (SaaS)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS usuarios_web (
        email TEXT PRIMARY KEY,
        senha TEXT,
        nome TEXT,
        telefone TEXT,
        momento TEXT,
        resumo TEXT,
        experiencias TEXT,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Tabela de Currículos Flexíveis (Armazena os 30+ campos em JSON)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS curriculos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        dados_json TEXT,
        data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(email) REFERENCES usuarios_web(email)
    )
    ''')
    
    # Migrações seguras (adiciona as colunas novas se elas não existirem)
    try:
        cursor.execute("ALTER TABLE usuarios_web ADD COLUMN telegram_token TEXT")
    except sqlite3.OperationalError:
        pass # A coluna já existe
        
    try:
        cursor.execute("ALTER TABLE usuarios_web ADD COLUMN telegram_chat_id TEXT")
    except sqlite3.OperationalError:
        pass # A coluna já existe
    
    conn.commit()
    conn.close()

def upsert_user(chat_id: str, data: Dict[str, Any]):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Checa se existe
    cursor.execute('SELECT chat_id FROM usuarios WHERE chat_id = ?', (chat_id,))
    row = cursor.fetchone()
    
    if row:
        # Atualiza os campos providenciados
        for key, value in data.items():
            cursor.execute(f'UPDATE usuarios SET {key} = ? WHERE chat_id = ?', (value, chat_id))
    else:
        # Insere novo
        campos = ['chat_id'] + list(data.keys())
        valores = [chat_id] + list(data.values())
        placeholders = ', '.join(['?'] * len(campos))
        cursor.execute(f'INSERT INTO usuarios ({", ".join(campos)}) VALUES ({placeholders})', valores)
        
    conn.commit()
    conn.close()

def get_user(chat_id: str) -> Dict[str, Any]:
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM usuarios WHERE chat_id = ?', (chat_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    return None

def get_all_active_users() -> List[Dict[str, Any]]:
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM usuarios WHERE ativo = 1')
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def check_and_save_vaga(chat_id: str, link_vaga: str) -> bool:
    """Retorna True se a vaga é nova (e já salva), False se já foi enviada."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    try:
        cursor.execute('INSERT INTO vagas_enviadas (chat_id, link_vaga) VALUES (?, ?)', (chat_id, link_vaga))
        conn.commit()
        eh_nova = True
    except sqlite3.IntegrityError:
        # Vaga já existe
        eh_nova = False
        
    conn.close()
    return eh_nova

def link_telegram_token(chat_id: str, token: str) -> dict:
    """Procura pelo token na tabela de usuarios_web e atualiza com o chat_id"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM usuarios_web WHERE telegram_token = ?', (token,))
    user_web = cursor.fetchone()
    
    if user_web:
        cursor.execute('UPDATE usuarios_web SET telegram_chat_id = ?, telegram_token = NULL WHERE email = ?', 
                      (chat_id, user_web['email']))
        conn.commit()
        conn.close()
        return dict(user_web)
    
    conn.close()
    return None
