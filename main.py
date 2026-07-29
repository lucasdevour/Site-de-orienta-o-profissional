import logging
from telegram.ext import ApplicationBuilder, CallbackQueryHandler
from bot import get_conversation_handler, lidar_botoes
from scheduler import rotina_busca_vagas
import database

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# ⚠️ Você deve colocar o TOKEN do seu Bot no Telegram aqui:
TOKEN = "8868236529:AAEIesQl5720YXKze5X-BlQ7Jjyp2aP6JW0"

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
