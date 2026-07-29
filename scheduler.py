import asyncio
from datetime import datetime
import logging
from telegram.ext import ContextTypes
import database
from scraper import buscar_vagas_por_parametros

logger = logging.getLogger(__name__)

async def rotina_busca_vagas(context: ContextTypes.DEFAULT_TYPE):
    logger.info("Iniciando rotina de busca de vagas...")
    
    # 1. Checa se é fim de semana (0=Segunda, 6=Domingo)
    dia_semana = datetime.now().weekday()
    if dia_semana >= 5: # 5 e 6 são Sabado e Domingo
        logger.info("Fim de semana, pulando execução automática.")
        return
        
    hora_atual = datetime.now().strftime("%H:%M")
    
    usuarios = database.get_all_active_users()
    for user in usuarios:
        inicio = user.get('horario_inicio', "08:00")
        fim = user.get('horario_fim', "18:00")
        
        # Verifica se está na janela do usuario
        if not (inicio <= hora_atual <= fim):
            continue
            
        logger.info(f"Buscando vagas para usuário {user['chat_id']}")
        termos = user['termos'].split(',') if user['termos'] else ["RH"]
        termos = [t.strip() for t in termos]
        
        try:
            vagas = await buscar_vagas_por_parametros(
                estado=user['estado'], 
                cidade=user['cidade'], 
                termos_busca=termos, 
                raio=user['raio']
            )
            
            from bot import enviar_vagas_para_usuario
            await enviar_vagas_para_usuario(context.bot, user['chat_id'], vagas)
        except Exception as e:
            logger.error(f"Erro ao processar usuário {user['chat_id']}: {e}")
