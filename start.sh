#!/usr/bin/env bash
# Inicia a API do FastAPI (que o Web App consome) no plano principal
uvicorn server:app --host 0.0.0.0 --port ${PORT:-10000}
