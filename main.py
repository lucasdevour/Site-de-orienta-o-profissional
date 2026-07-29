import logging
import os
from telegram.ext import ApplicationBuilder, CallbackQueryHandler
from bot import get_conversation_handler, lidar_botoes
from scheduler import rotina_busca_vagas
import database

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# Puxa o Token da Variável de Ambiente configurada no Render (seguro)
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")

def main():
    # 1. Iniciar Banco de Dados
    database.init_db()
    
    # 2. Configurar o Bot
    app = ApplicationBuilder().token(TOKEN).build()
    
    # Adicionar Handlers
    app.add_handler(get_conversation_handler())
    app.add_handler(CallbackQueryHandler(lidar_botoes))
    
    # 3. Iniciar Scheduler nativo do python-telegram-bot
    # Vai rodar a cada 3600 segundos (1 hora), começando 10 segundos após ligar
    app.job_queue.run_repeating(rotina_busca_vagas, interval=3600, first=10)
    
    # 4. Rodar o Bot
    print("🤖 Bot iniciado com sucesso. Pressione Ctrl+C para parar.")
    app.run_polling()

if __name__ == '__main__':
    main()
