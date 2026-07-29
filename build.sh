#!/usr/bin/env bash
# Saia do script se houver erro
set -o errexit

pip install -r requirements.txt
playwright install chromium
