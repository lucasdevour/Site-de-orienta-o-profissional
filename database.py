import sqlite3
import json
from typing import Dict, Any, Optional

DB_NAME = "monitor_vagas.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

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
        estado TEXT DEFAULT '',
        cidade TEXT DEFAULT '',
        termos TEXT DEFAULT '',
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

    # Migrações seguras para bancos existentes
    for col in ("estado", "cidade", "termos"):
        try:
            cursor.execute(f"ALTER TABLE usuarios_web ADD COLUMN {col} TEXT DEFAULT ''")
        except sqlite3.OperationalError:
            pass

    conn.commit()
    conn.close()

def get_curriculo_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Busca o currículo JSON associado ao e-mail do usuário."""
    if not email:
        return None
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        "SELECT dados_json FROM curriculos WHERE email = ? ORDER BY data_atualizacao DESC LIMIT 1",
        (email,)
    )
    row = cursor.fetchone()
    conn.close()

    if row and row["dados_json"]:
        try:
            return json.loads(row["dados_json"])
        except Exception:
            return None
    return None
