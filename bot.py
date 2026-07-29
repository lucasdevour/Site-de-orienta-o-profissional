import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ContextTypes,
    ConversationHandler,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
)
import database
from scraper import buscar_vagas_por_parametros

logger = logging.getLogger(__name__)

# Estados para a conversa de configuração
ESTADO, CIDADE, TERMOS, RAIO, HORARIO_INICIO, HORARIO_FIM = range(6)

# Variável temporária para armazenar configurações antes de salvar
user_data_temp = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = str(update.effective_chat.id)
    
    # Verifica se existe um token (Deep Link) Ex: /start TOKEN123
    if context.args and len(context.args) > 0:
        token = context.args[0]
        user_web = database.link_telegram_token(chat_id, token)
        if user_web:
            nome = user_web['nome'] or 'Candidato'
            await update.message.reply_text(
                f"🎉 Sucesso, {nome}! Sua conta da plataforma web foi vinculada ao Telegram.\n\n"
                "A partir de agora você receberá alertas de vagas diretamente aqui."
            )
            # Continua o fluxo para pedir Estado e Cidade se for a primeira vez
        else:
            await update.message.reply_text("❌ Ops! O link que você clicou parece estar inválido ou expirado.")
            
    user = database.get_user(chat_id)
    
    if user:
        mensagem = (
            "👋 Olá novamente! Seu robô de vagas já está configurado.\n\n"
            f"📍 *Cidade:* {user['cidade']} - {user['estado']}\n"
            f"🎯 *Termos:* {user['termos']}\n"
            f"🕒 *Horário:* {user['horario_inicio']} às {user['horario_fim']}\n"
            f"🔄 *Ativo:* {'Sim' if user['ativo'] else 'Não'}"
        )
        keyboard = [
            [InlineKeyboardButton("🔍 Buscar Vagas Agora", callback_data="buscar_agora")],
            [InlineKeyboardButton("⚙️ Reconfigurar", callback_data="reconfigurar")],
            [InlineKeyboardButton("⏸️ Pausar/Retomar Alertas", callback_data="toggle_ativo")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text(mensagem, reply_markup=reply_markup, parse_mode='Markdown')
        return ConversationHandler.END
    else:
        mensagem = (
            "👋 Bem-vindo ao *Monitor de Vagas*!\n\n"
            "Eu vou buscar vagas no Indeed, LinkedIn e Sólides para você automaticamente.\n"
            "Para começar, vamos configurar suas preferências.\n\n"
            "Digite a sigla do seu *Estado* (ex: SC, SP, RJ):"
        )
        await update.message.reply_text(mensagem, parse_mode='Markdown')
        return ESTADO

async def configurar_estado(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    chat_id = str(update.effective_chat.id)
    estado = update.message.text.upper().strip()
    if len(estado) != 2:
        await update.message.reply_text("Por favor, digite apenas a sigla com 2 letras (ex: SC):")
        return ESTADO
    
    user_data_temp[chat_id] = {'estado': estado}
    await update.message.reply_text("Perfeito! Agora digite o nome da sua *Cidade* (ex: Itajaí):", parse_mode='Markdown')
    return CIDADE

async def configurar_cidade(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    chat_id = str(update.effective_chat.id)
    cidade = update.message.text.strip().title()
    user_data_temp[chat_id]['cidade'] = cidade
    
    await update.message.reply_text(
        "Você quer buscar vagas em cidades vizinhas também ou apenas na cidade exata?\n\n"
        "Digite *0* para APENAS a cidade exata.\n"
        "Digite *1* para incluir cidades próximas.",
        parse_mode='Markdown'
    )
    return RAIO

async def configurar_raio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    chat_id = str(update.effective_chat.id)
    raio_str = update.message.text.strip()
    if raio_str not in ['0', '1']:
        await update.message.reply_text("Opção inválida. Digite 0 ou 1:")
        return RAIO
        
    user_data_temp[chat_id]['raio'] = int(raio_str)
    await update.message.reply_text(
        "Quais cargos/termos você quer buscar? Separe por vírgula.\n"
        "(ex: RH, Recursos Humanos, Psicólogo)",
        parse_mode='Markdown'
    )
    return TERMOS

async def configurar_termos(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    chat_id = str(update.effective_chat.id)
    termos = update.message.text.strip()
    user_data_temp[chat_id]['termos'] = termos
    
    await update.message.reply_text(
        "A que horas eu devo *iniciar* as buscas diárias? (De Seg a Sex)\n"
        "Digite no formato HH:MM (ex: 09:00 ou 13:00):",
        parse_mode='Markdown'
    )
    return HORARIO_INICIO

async def configurar_horario_inicio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    chat_id = str(update.effective_chat.id)
    horario_inicio = update.message.text.strip()
    user_data_temp[chat_id]['horario_inicio'] = horario_inicio
    
    await update.message.reply_text(
        "E a que horas devo *parar* as buscas? (ex: 17:00 ou 18:00):",
        parse_mode='Markdown'
    )
    return HORARIO_FIM

async def configurar_horario_fim(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    chat_id = str(update.effective_chat.id)
    horario_fim = update.message.text.strip()
    user_data_temp[chat_id]['horario_fim'] = horario_fim
    user_data_temp[chat_id]['ativo'] = 1
    
    database.upsert_user(chat_id, user_data_temp[chat_id])
    
    keyboard = [[InlineKeyboardButton("🔍 Buscar Vagas Agora", callback_data="buscar_agora")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "✅ Tudo configurado! Seu robô já está ativo e buscando vagas de Segunda a Sexta no horário escolhido.",
        reply_markup=reply_markup
    )
    return ConversationHandler.END

async def cancelar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Configuração cancelada. Digite /start para tentar novamente.")
    return ConversationHandler.END

async def lidar_botoes(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    chat_id = str(query.message.chat_id)
    user = database.get_user(chat_id)
    
    if not user:
        await query.edit_message_text("Usuário não encontrado. Digite /start")
        return
        
    if query.data == "buscar_agora":
        await query.message.reply_text("🔍 Iniciando busca sob demanda. Isso pode demorar alguns minutos...")
        termos = [t.strip() for t in user['termos'].split(',')]
        
        vagas = await buscar_vagas_por_parametros(
            estado=user['estado'],
            cidade=user['cidade'],
            termos_busca=termos,
            raio=user['raio']
        )
        
        await enviar_vagas_para_usuario(context.bot, chat_id, vagas)
        
    elif query.data == "reconfigurar":
        await query.message.reply_text("Digite a sigla do seu *Estado* (ex: SC):", parse_mode='Markdown')
        # Precisaríamos iniciar a ConversationHandler aqui via um commando, ou apenas informar o usuário
        await query.message.reply_text("Para reconfigurar, envie o comando /configurar")
        
    elif query.data == "toggle_ativo":
        novo_status = 0 if user['ativo'] else 1
        database.upsert_user(chat_id, {'ativo': novo_status})
        texto = "✅ Alertas retomados!" if novo_status else "⏸️ Alertas pausados."
        await query.edit_message_text(texto)

async def comando_configurar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Iniciando reconfiguração. Digite a sigla do seu *Estado* (ex: SC):", parse_mode='Markdown')
    return ESTADO

async def enviar_vagas_para_usuario(bot, chat_id, vagas):
    vagas_novas = 0
    for vaga in vagas:
        if database.check_and_save_vaga(chat_id, vaga['link']):
            vagas_novas += 1
            mensagem = (
                f"🚨 *Nova Vaga Encontrada!*\n\n"
                f"*Cargo:* {vaga['titulo']}\n"
                f"*Local:* {vaga['cidade']}\n"
                f"*Plataforma:* {vaga['plataforma']}"
            )
            keyboard = [[InlineKeyboardButton("🔗 Candidatar-se", url=vaga['link'])]]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            try:
                await bot.send_message(chat_id=chat_id, text=mensagem, reply_markup=reply_markup, parse_mode='Markdown')
            except Exception as e:
                logger.error(f"Erro ao enviar para {chat_id}: {e}")
                
    if vagas_novas == 0:
        await bot.send_message(chat_id=chat_id, text="ℹ️ Nenhuma vaga nova foi encontrada desta vez.")
    else:
        await bot.send_message(chat_id=chat_id, text=f"✅ {vagas_novas} vagas novas enviadas.")

def get_conversation_handler():
    return ConversationHandler(
        entry_points=[
            CommandHandler("start", start),
            CommandHandler("configurar", comando_configurar)
        ],
        states={
            ESTADO: [MessageHandler(filters.TEXT & ~filters.COMMAND, configurar_estado)],
            CIDADE: [MessageHandler(filters.TEXT & ~filters.COMMAND, configurar_cidade)],
            RAIO: [MessageHandler(filters.TEXT & ~filters.COMMAND, configurar_raio)],
            TERMOS: [MessageHandler(filters.TEXT & ~filters.COMMAND, configurar_termos)],
            HORARIO_INICIO: [MessageHandler(filters.TEXT & ~filters.COMMAND, configurar_horario_inicio)],
            HORARIO_FIM: [MessageHandler(filters.TEXT & ~filters.COMMAND, configurar_horario_fim)],
        },
        fallbacks=[CommandHandler("cancelar", cancelar)],
    )
