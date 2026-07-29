#!/usr/bin/env bash
# Inicia o robô do Telegram em segundo plano
python main.py &

# Inicia a API do FastAPI (que o React consome) no plano principal
uvicorn server:app --host 0.0.0.0 --port ${PORT:-10000}
