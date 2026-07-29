import logging
import os
from datetime import datetime
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
ESTADO, CIDADE, TERMOS, REPORTAR_ERRO = range(4)

# Variável temporária para armazenar configurações antes de salvar
user_data_temp = {}

SITE_URL = "https://site-de-orienta-o-profissional-1.onrender.com"

def get_main_menu_keyboard():
    keyboard = [
        [InlineKeyboardButton("🔍 Buscar Vagas Agora", callback_data="buscar_agora")],
        [InlineKeyboardButton("⏸️ Iniciar / Parar Alertas", callback_data="toggle_ativo")],
        [InlineKeyboardButton("⚙️ Alterar Minha Vaga/Horário/Local", callback_data="reconfigurar")],
        [InlineKeyboardButton("⚠️ Reportar Erro", callback_data="reportar_erro_btn")],
        [InlineKeyboardButton("🌐 Acessar Site Oficial", url=SITE_URL)]
    ]
    return InlineKeyboardMarkup(keyboard)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    chat_id = str(update.effective_chat.id)
    user = database.get_user(chat_id)
    
    # Suporta invocação tanto por comando (update.message) quanto por botão (update.callback_query)
    msg_origin = update.message if update.message else update.callback_query.message
    
    if user:
        mensagem = (
            "👋 *Olá novamente!* Seu robô de vagas já está configurado.\n\n"
            f"📍 *Local:* {user['cidade']} - {user['estado']}\n"
            f"🎯 *Vagas (Palavras-chave):* {user['termos']}\n"
            f"🕒 *Horário de Alertas:* {user['horario_inicio']} às {user['horario_fim']}\n"
            f"🔄 *Alertas Ativos:* {'Sim ✅' if user['ativo'] else 'Não ❌'}\n\n"
            "Escolha uma opção abaixo:"
        )
        await msg_origin.reply_text(mensagem, reply_markup=get_main_menu_keyboard(), parse_mode='Markdown')
        return ConversationHandler.END
    else:
        mensagem = (
            "🤖 *Bem-vindo ao Robô de Vagas Inteligente!*\n\n"
            "Eu vou trabalhar para você buscando as melhores vagas no LinkedIn, Indeed e Sólides, e te enviarei os links diretamente aqui no Telegram!\n\n"
            "Para eu começar a trabalhar, preciso saber o que você busca.\n"
            "➡️ *Qual a sigla do seu Estado?* (ex: SC, SP, RJ):"
        )
        await msg_origin.reply_text(mensagem, parse_mode='Markdown')
        return ESTADO

async def configurar_estado(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    chat_id = str(update.effective_chat.id)
    estado = update.message.text.upper().strip()
    if len(estado) != 2:
        await update.message.reply_text("❌ Por favor, digite apenas a sigla com 2 letras (ex: SC):")
        return ESTADO
    
    user_data_temp[chat_id] = {'estado': estado}
    await update.message.reply_text("Perfeito! 🏙️ Agora digite o nome da sua *Cidade* (ex: Itajaí):", parse_mode='Markdown')
    return CIDADE

async def configurar_cidade(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    chat_id = str(update.effective_chat.id)
    cidade = update.message.text.strip().title()
    user_data_temp[chat_id]['cidade'] = cidade
    user_data_temp[chat_id]['raio'] = 1 # Padrão: buscar na cidade e redondezas
    
    mensagem = (
        "💼 *Para qual vaga você deseja se candidatar?*\n\n"
        "💡 *Dica:* Seja inteligente com as palavras-chave. Se você quer ser eletricista, digite: `Eletricista, Manutenção Elétrica, Instalação`\n\n"
        "Digite as palavras-chave separadas por vírgula:"
    )
    await update.message.reply_text(mensagem, parse_mode='Markdown')
    return TERMOS

async def configurar_termos(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    chat_id = str(update.effective_chat.id)
    termos = update.message.text.strip()
    user_data_temp[chat_id]['termos'] = termos
    
    mensagem = (
        "🕒 *Qual o melhor horário para eu te enviar as vagas?*\n\n"
        "Como não posso rodar 24h por dia, escolha o turno que você tem tempo para analisar as oportunidades:"
    )
    keyboard = [
        [InlineKeyboardButton("🌅 Manhã (10:00 às 12:00)", callback_data="hora_10_12")],
        [InlineKeyboardButton("🌇 Tarde (16:00 às 18:00)", callback_data="hora_16_18")],
        [InlineKeyboardButton("🌃 Noite (20:00 às 22:00)", callback_data="hora_20_22")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(mensagem, reply_markup=reply_markup, parse_mode='Markdown')
    return ConversationHandler.END

# ---- Callbacks (Botões em Linha) ----

async def lidar_botoes(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    chat_id = str(query.message.chat_id)
    
    # Processa os botões de horário (Finaliza o onboarding)
    if query.data.startswith("hora_"):
        if query.data == "hora_10_12":
            inicio, fim = "10:00", "12:00"
        elif query.data == "hora_16_18":
            inicio, fim = "16:00", "18:00"
        else:
            inicio, fim = "20:00", "22:00"
            
        if chat_id in user_data_temp:
            user_data_temp[chat_id]['horario_inicio'] = inicio
            user_data_temp[chat_id]['horario_fim'] = fim
            user_data_temp[chat_id]['ativo'] = 1
            
            # Salva no banco de dados
            database.upsert_user(chat_id, user_data_temp[chat_id])
            
            await query.edit_message_text(
                "✅ *Tudo configurado com sucesso!*\n\n"
                f"A partir de agora eu buscarei vagas de {user_data_temp[chat_id]['termos']} em {user_data_temp[chat_id]['cidade']} "
                f"e te mandarei um alerta sempre no turno das {inicio} às {fim}.\n\n"
                "Para acessar o menu, digite /start",
                parse_mode='Markdown'
            )
            # Mostra o menu principal logo após o onboarding
            await start(update, context)
        else:
            await query.edit_message_text("Sessão expirada. Digite /start para tentar novamente.")
        return

    # A partir daqui, exige usuário cadastrado
    user = database.get_user(chat_id)
    if not user:
        await query.edit_message_text("Usuário não encontrado. Digite /start")
        return
        
    if query.data == "buscar_agora":
        await query.message.reply_text("🔍 Iniciando busca intensiva pelas plataformas. Isso pode demorar até 2 minutinhos...")
        termos = [t.strip() for t in user['termos'].split(',')]
        
        vagas = await buscar_vagas_por_parametros(
            estado=user['estado'],
            cidade=user['cidade'],
            termos_busca=termos,
            raio=user['raio']
        )
        
        await enviar_vagas_para_usuario(context.bot, chat_id, vagas)
        
    elif query.data == "reconfigurar":
        await query.message.reply_text("Vamos reconfigurar seu robô.\n\n➡️ Digite a sigla do seu *Estado* (ex: SC):", parse_mode='Markdown')
        # Precisamos de um jeito de forçar a entrada na ConversationHandler.
        # A ConversationHandler no main.py pegará os inputs de texto, mas para isso precisamos sinalizar o estado
        # O ideal é que o botão invoque a instrução, mas não pode entrar na ConversationHandler magicamente sem o handler ativo.
        # Por isso, o botão reconfigurar pede para a pessoa digitar /start ou um comando específico se a ConversationHandler não suportar entry_point por callback.
        
        # Como o callback_query não está como entry_point, orientamos o usuário:
        await query.message.reply_text("Para começar a alteração do zero, envie o comando /configurar")
        
    elif query.data == "toggle_ativo":
        novo_status = 0 if user['ativo'] else 1
        database.upsert_user(chat_id, {'ativo': novo_status})
        
        texto_status = "✅ Alertas **Retomados**!" if novo_status else "⏸️ Alertas **Pausados**."
        await query.message.reply_text(f"{texto_status}\n\nPara ver o menu novamente, digite /start", parse_mode='Markdown')
        
    elif query.data == "reportar_erro_btn":
        await query.message.reply_text(
            "⚠️ *Reportar um Erro*\n\n"
            "Por favor, descreva em uma mensagem o que deu errado, qual erro apareceu, ou o que você estava tentando fazer.\n\n"
            "Envie o comando /erro seguido da sua mensagem.\n"
            "Exemplo:\n`/erro Quando cliquei em buscar, a tela travou.`", parse_mode='Markdown'
        )

# ---- Comandos Auxiliares ----

async def comando_configurar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("⚙️ Iniciando reconfiguração.\n\n➡️ Digite a sigla do seu *Estado* (ex: SC):", parse_mode='Markdown')
    return ESTADO

async def comando_erro(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if context.args:
        mensagem_erro = " ".join(context.args)
    else:
        # Se usou apenas /erro sem nada
        mensagem_erro = update.message.text.replace('/erro', '').strip()
        
    if not mensagem_erro:
        await update.message.reply_text("Você precisa digitar o erro após o comando. Exemplo:\n`/erro Não recebi nenhuma vaga hoje`", parse_mode='Markdown')
        return
        
    chat_id = str(update.effective_chat.id)
    user = update.effective_user.first_name
    data_hora = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    
    # Salvar em um arquivo de texto
    with open("erros_telegram.txt", "a", encoding="utf-8") as f:
        f.write(f"[{data_hora}] User: {user} (ID: {chat_id}) - Erro: {mensagem_erro}\n")
        
    await update.message.reply_text("✅ *Seu erro foi enviado com sucesso ao administrador!*\nObrigado por nos ajudar a melhorar o sistema.", parse_mode='Markdown')

async def cancelar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("❌ Operação cancelada. Digite /start para voltar ao menu principal.")
    return ConversationHandler.END

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
        await bot.send_message(chat_id=chat_id, text="ℹ️ Nenhuma vaga nova foi encontrada desta vez. Tente mudar suas palavras-chave caso demore muito.")
    else:
        await bot.send_message(chat_id=chat_id, text=f"✅ {vagas_novas} vagas fresquinhas enviadas acima!")

def get_conversation_handler():
    return ConversationHandler(
        entry_points=[
            CommandHandler("start", start),
            CommandHandler("configurar", comando_configurar)
        ],
        states={
            ESTADO: [MessageHandler(filters.TEXT & ~filters.COMMAND, configurar_estado)],
            CIDADE: [MessageHandler(filters.TEXT & ~filters.COMMAND, configurar_cidade)],
            TERMOS: [MessageHandler(filters.TEXT & ~filters.COMMAND, configurar_termos)]
        },
        fallbacks=[CommandHandler("cancelar", cancelar)],
    )

def get_extra_handlers():
    # Retorna handlers soltos que não fazem parte do ConversationHandler
    return [
        CallbackQueryHandler(lidar_botoes),
        CommandHandler("erro", comando_erro)
    ]
