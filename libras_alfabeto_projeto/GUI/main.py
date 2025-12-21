import tkinter as tk
from tkinter import ttk, messagebox
import cv2
import mediapipe as mp
from PIL import Image, ImageTk
import random
import numpy as np
from collections import deque, defaultdict
import time
import joblib
from tensorflow.keras.models import load_model
from pathlib import Path

class AplicativoLibras:
    def __init__(self, root):
        # Configuração de cores e estilo
        self.configurar_cores()
        
        # Configuração da janela principal
        self.root = root
        self.root.title("LIA")
        self.root.state('zoomed')
        self.root.configure(bg=self.COR_FUNDO)
        
        # Configuração do MediaPipe
        self.configurar_mediapipe()
        
        # Estado do aplicativo
        self.inicializar_estado()
        # Pré-carrega modelo e rótulos logo no início
        if not self.modelo_gestos or not self.le_gestos:
            self.modelo_gestos, self.le_gestos = self.carregar_modelo_gestos()
        
        # Estrutura de seções e níveis
        self.secoes = {
            "Alfabeto": {
                1: ["A", "E", "I", "O", "U"],
                2: ["B", "C", "D", "G", "L"],
                3: ["M", "N", "P", "Q", "R"],
                4: ["S", "T", "V", "W"],
                5: ["H", "J", "K", "X"],
                6: ["W", "Y", "Z"]
            },
            "Números": {
                1: ["1", "2", "3", "4", "5"],
                2: ["6", "7", "8", "9", "10"]
            },
            "Dias da Semana": {
                1: ["SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA"],
                2: ["QUINTA-FEIRA", "SEXTA-FEIRA", "SABADO", "DOMINGO"]
            },
            "Tempo": {
                1: ["HORAS", "MINUTOS"],
                2: ["ONTEM","AMANHA", "AGORA"],
                3: ["MES", "ANO"]
            },
            "Perguntas": {
                1: ["QUANDO", "ONDE"],
                2: ["O QUE", "POR QUE"]
            },
            "Saudações": {
                1: ["OI", "TCHAU", "TUDO BEM"],
                2: ["POR FAVOR", "OBRIGADO", "DESCULPA"]
            },
            "Família": {
                1: ["PAI", "MÃE", "IRMÃO", "IRMÃ"],
                2: ["AVÔ", "AVÓ", "PADRASTO", "MADRASTA"],
                3: ["TIO", "TIA", "PRIMO", "PRIMA"],
                4: ["CUNHADA", "CUNHADO", "SOGRO", "SOGRA"],
                5: ["NAMORADO", "NAMORADA", "NOIVO", "NOIVA"],
                6: ["ESPOSO", "ESPOSA", "FILHO", "FILHA"]
            },
            "Alimentos": {
                1: ["MAÇÃ", "LARANJA", "UVA", "MELANCIA"],
                2: ["LIMÃO", "MELÃO", "TOMATE", "ABACAXI"],
                3: ["BATATA", "CENOURA", "BETERRABA", "CEBOLA"],
                4: ["ABOBRINHA", "PEPINO", "ALHO", "MANDIOCA"],
                5: ["ÁGUA", "SUCO", "LEITE", "CAFÉ", "REFRIGERANTE"]
            },
            "Cores": {
                1: ["AZUL", "AMARELO", "VERDE", "VERMELHO"],
                2: ["ROSA", "ROXO", "LARANJA", "BRANCO", "PRETO"]
            },
            "Animais": {
                1: ["CÃO", "GATO", "PEIXE", "CAVALO", "PÁSSARO"],
                2: ["MACACO", "LEÃO", "BALEIA"],
                3: ["FORMIGA", "ABELHA", "BORBOLETA", "MINHOCA"]
            },
            "Adjetivos": {
                1: ["BONITO", "FEIO", "ALTO", "BAIXO"],
                2: ["GRANDE", "PEQUENO", "VELHO", "NOVO"],
                3: ["RÁPIDO", "DEVAGAR", "QUENTE", "FRIO"]
            }
        }

        self.icones_secoes = {
            "Alfabeto": "🔤", "Números": "🔢", "Dias da Semana": "📅",
            "Tempo": "⏰", "Perguntas": "❓", "Saudações": "👋",
            "Família": "👨‍👩‍👧‍👦", "Alimentos": "🍎", "Cores": "🎨",
            "Animais": "🐶", "Adjetivos": "📝"
        }
        
        for secao in self.secoes:
            self.niveis_completos[secao] = []
        
        # Inicializa seções liberadas
        self.secoes_liberadas = ["Alfabeto"]
        
        self.mostrar_tela_inicial()

    def configurar_cores(self):
        """Define as cores padrão do aplicativo"""
        self.COR_PRIMARIA = "#6A0DAD"  # Roxo
        self.COR_SECUNDARIA = "#FFD700"  # Dourado
        self.COR_FUNDO = "#F5F5F5"  # Cinza claro
        self.COR_TEXTO_CLARO = "#FFFFFF"  # Branco
        self.COR_TEXTO_ESCURO = "#333333"  # Cinza escuro
        self.COR_SUCESSO = "#2E8B57"  # Verde para sucesso
        self.COR_ERRO = "#DC143C"  # Vermelho para erro
        self.COR_BLOQUEADO = "#CCCCCC"  # Cinza
        self.COR_CARD = "#FFFFFF"  # Branco para cards
        self.COR_BORDA = "#E0E0E0"  # Cinza claro para bordas
        self.COR_SOMBRA = "#DDDDDD"  # Cor para sombra

    def configurar_mediapipe(self):
        """Configura o MediaPipe para detecção de mãos - criado uma vez só"""
        self.mp_hands = mp.solutions.hands
        if not hasattr(self, 'hands') or self.hands is None:
            self.hands = self.mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                min_detection_confidence=0.7,
                min_tracking_confidence=0.5
            )
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles

    def inicializar_estado(self):
        """Inicializa o estado do aplicativo"""
        self.cap = None
        self.running = False
        self.frame_count = 0
        self.skip_frames = 1  # Reduzido para melhor performance
        self.nivel_atual = 1
        self.pontuacao = 0
        self.gesto_alvo = None
        self.buffer_gestos = deque(maxlen=30)
        self.historico_predicoes = deque(maxlen=15)
        self.frames_sem_maos = 0
        self.RESET_THRESHOLD = 10
        self.niveis_completos = {}
        self.secoes_liberadas = ["Alfabeto"]
        self.tempo_inicio = 0
        self.tempo_gasto = 0
        self.ultimo_gesto_reconhecido = None
        self.modelo_gestos, self.le_gestos = self.carregar_modelo_gestos()
        self.camera_timeout = 5  # Timeout de 5 segundos para inicialização da câmera

    def carregar_modelo_gestos(self):
        """Carrega o modelo de gestos e o rotulador"""
        try:
            modelos_dir = Path("modelos")
            modelo_path = modelos_dir / "modelo_gestos.h5"
            rotulador_path = modelos_dir / "rotulador_gestos.pkl"
            
            if not modelo_path.exists() or not rotulador_path.exists():
                messagebox.showerror("Erro", 
                    "Modelo de gestos não encontrado!\n\n"
                    "Verifique se os arquivos estão em:\n"
                    f"{modelo_path}\n{rotulador_path}")
                return None, None
            
            modelo = load_model(modelo_path)
            le = joblib.load(rotulador_path)
            print(f"Modelo carregado. Classes: {list(le.classes_)}")
            return modelo, le
        except Exception as e:
            messagebox.showerror("Erro", f"Falha ao carregar modelo: {str(e)}")
            return None, None

    # Métodos de interface
    def mostrar_tela_inicial(self):
        """Tela de splash com logo"""
        self.limpar_tela()

        # Canvas para desenhar círculo roxo
        canvas_size = 350  # Tamanho do círculo
        splash_canvas = tk.Canvas(self.root, width=canvas_size, height=canvas_size,
                                bg=self.COR_FUNDO, highlightthickness=0)
        splash_canvas.place(relx=0.5, rely=0.5, anchor="center")

        # Desenha círculo roxo
        splash_canvas.create_oval(0, 0, canvas_size, canvas_size, fill=self.COR_PRIMARIA, outline="")

        # Emoji 👋
        splash_canvas.create_text(canvas_size/2, canvas_size/2 - 50,
                                text="👋", font=("Helvetica", 100), fill=self.COR_SECUNDARIA)

        # Texto LIA
        splash_canvas.create_text(canvas_size/2, canvas_size/2 + 70,
                                text="LIA", font=("Helvetica", 100, "bold"), fill=self.COR_TEXTO_CLARO)

        self.root.after(1500, self.mostrar_tela_secoes)

    def mostrar_tela_secoes(self):
        """Tela com seções e níveis"""
        self.limpar_tela()
        self.configurar_estilo_progressbar()
        
        main_frame = tk.Frame(self.root, bg=self.COR_FUNDO)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Cabeçalho
        self.criar_cabecalho_secoes(main_frame)
        
        # Container com rolagem para os cards
        container = tk.Frame(main_frame, bg=self.COR_FUNDO)
        container.pack(fill=tk.BOTH, expand=True)
        
        canvas = tk.Canvas(container, bg=self.COR_FUNDO, highlightthickness=0)
        scrollbar = ttk.Scrollbar(container, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg=self.COR_FUNDO)
        
        scrollable_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Organizar seções em grade responsiva
        colunas = max(3, min(4, self.root.winfo_screenwidth() // 300))
        
        for i, secao in enumerate(self.secoes):
            card = self.criar_card(scrollable_frame, secao)
            card.grid(row=i // colunas, column=i % colunas, 
                     padx=10, pady=10, sticky="nsew")
        
        # Configurar expansão uniforme
        for col in range(colunas):
            scrollable_frame.columnconfigure(col, weight=1, uniform="group1")
        
        for row in range((len(self.secoes) + colunas - 1) // colunas):
            scrollable_frame.rowconfigure(row, weight=1)
        
        # Rodapé
        self.criar_rodape_secoes(main_frame)

    def configurar_estilo_progressbar(self):
        """Configura o estilo da barra de progresso"""
        style = ttk.Style()
        style.configure("Custom.Horizontal.TProgressbar", 
                       troughcolor=self.COR_FUNDO, 
                       background=self.COR_PRIMARIA,
                       bordercolor=self.COR_BORDA,
                       lightcolor=self.COR_PRIMARIA,
                       darkcolor=self.COR_PRIMARIA)

    def criar_cabecalho_secoes(self, parent):
        """Cria o cabeçalho da tela de seções"""
        header_frame = tk.Frame(parent, bg=self.COR_FUNDO)
        header_frame.pack(fill=tk.X, pady=(0, 20))
        
        # Título
        tk.Label(header_frame, text="Seções", font=("Helvetica", 26, "bold"),
                bg=self.COR_FUNDO, fg=self.COR_PRIMARIA).pack(side=tk.LEFT)
        
        # Botão Sobre redondo
        btn_sobre_canvas = tk.Canvas(header_frame, width=40, height=40, 
                                    bg=self.COR_FUNDO, highlightthickness=0)
        btn_sobre_canvas.pack(side=tk.LEFT, padx=10)

        # Adicionar texto "💡" no centro (emoji de lâmpada)
        btn_sobre_canvas.create_text(20, 20, text="💡", 
                                font=("Segoe UI Emoji", 16),
                                fill=self.COR_TEXTO_ESCURO)

        # Tornar o canvas clicável
        btn_sobre_canvas.bind("<Button-1>", lambda e: self.mostrar_sobre())
        btn_sobre_canvas.bind("<Enter>", lambda e: btn_sobre_canvas.itemconfig(circulo, fill=self.COR_SECUNDARIA))
        btn_sobre_canvas.bind("<Leave>", lambda e: btn_sobre_canvas.itemconfig(circulo, fill=self.COR_PRIMARIA))
        
        # Informações à direita
        info_frame = tk.Frame(header_frame, bg=self.COR_FUNDO)
        info_frame.pack(side=tk.RIGHT, padx=10)
        
        # Pontuação
        tk.Label(info_frame, text=f"🏆 Pontuação: {self.pontuacao}",
                font=("Helvetica", 18, "bold"), bg=self.COR_FUNDO,
                fg=self.COR_PRIMARIA).pack(side=tk.LEFT, padx=10)
        
        # Progresso geral
        total_secoes = len(self.secoes)
        secoes_liberadas = len(self.secoes_liberadas)
        progresso_geral = (secoes_liberadas / total_secoes) * 100
        
        progress_frame = tk.Frame(info_frame, bg=self.COR_FUNDO)
        progress_frame.pack(side=tk.LEFT, padx=10)
        
        tk.Label(progress_frame, text="📊 Progresso Geral:", font=("Helvetica", 18),
                bg=self.COR_FUNDO, fg=self.COR_TEXTO_ESCURO).pack(side=tk.LEFT)
        
        progress_bar = ttk.Progressbar(progress_frame, orient=tk.HORIZONTAL, length=150,
                                     mode='determinate', style="Custom.Horizontal.TProgressbar")
        progress_bar['value'] = progresso_geral
        progress_bar.pack(side=tk.LEFT, padx=5)
        
        tk.Label(progress_frame, text=f"{secoes_liberadas}/{total_secoes}",
                font=("Helvetica", 14), bg=self.COR_FUNDO,
                fg=self.COR_TEXTO_ESCURO).pack(side=tk.LEFT)

    def criar_rodape_secoes(self, parent):
        """Cria o rodapé da tela de seções"""
        footer_frame = tk.Frame(parent, bg=self.COR_FUNDO)
        footer_frame.pack(fill=tk.X, pady=(10, 0))

        
        tk.Button(footer_frame, text="Sair", font=("Helvetica", 14),
                 bg=self.COR_ERRO, fg=self.COR_TEXTO_CLARO, padx=20, pady=5,
                 command=self.sair).pack(side=tk.RIGHT, padx=10)
        
    def mostrar_sobre(self):
        """Exibe informações sobre o projeto"""
        sobre_texto = (
            "LIA - Libras Inteligência Artificial\n\n"
            "O LIA é um aplicativo inovador projetado para facilitar o aprendizado da Língua Brasileira de Sinais (Libras) "
            "por meio de tecnologia de reconhecimento de gestos com inteligência artificial.\n\n"
            "🔹 Funcionalidades:\n"
            "• Reconhecimento de gestos em tempo real\n"
            "• Aprendizado por níveis e seções temáticas\n"
            "• Interface intuitiva e amigável\n\n"
            "🔹 Tecnologias utilizadas:\n"
            "• MediaPipe para detecção de mãos\n"
            "• Redes neurais con TensorFlow/Keras\n"
            "• Interface gráfica com Tkinter\n\n"
            "Este projeto visa promover a inclusão e acessibilidade, tornando o aprendizado de Libras "
            "acessível a todos."
        )
        messagebox.showinfo("Sobre o LIA", sobre_texto)
        
    def criar_card(self, parent, secao):
        """Cria um card estilizado para cada seção"""
        secao_liberada = secao in self.secoes_liberadas
        cor_titulo = self.COR_PRIMARIA if secao_liberada else self.COR_BLOQUEADO
        
        card_frame = tk.Frame(parent, bg=self.COR_CARD, bd=0,
                            highlightbackground=self.COR_BORDA,
                            highlightthickness=1, padx=15, pady=15)
        
        # Cabeçalho do card
        header_frame = tk.Frame(card_frame, bg=self.COR_CARD)
        header_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Ícone e título
        tk.Label(header_frame, text=self.icones_secoes.get(secao, "📁"),
                font=("Helvetica", 26), bg=self.COR_CARD, fg=cor_titulo).pack(side=tk.LEFT, padx=(0, 10))
        
        tk.Label(header_frame, text=secao, font=("Helvetica", 18, "bold"),
                bg=self.COR_CARD, fg=cor_titulo).pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        # Barra de progresso
        total_niveis = len(self.secoes[secao])
        niveis_completos = len(self.niveis_completos[secao])
        progresso = (niveis_completos / total_niveis) * 100 if total_niveis > 0 else 0
        
        progress_frame = tk.Frame(card_frame, bg=self.COR_CARD)
        progress_frame.pack(fill=tk.X, pady=5)
        
        tk.Label(progress_frame, text="Progresso:", font=("Helvetica", 14),
                bg=self.COR_CARD, fg=self.COR_TEXTO_ESCURO).pack(side=tk.LEFT, anchor="w")
        
        progress_bar = ttk.Progressbar(progress_frame, orient=tk.HORIZONTAL, length=100,
                                     mode='determinate', style="Custom.Horizontal.TProgressbar")
        progress_bar['value'] = progresso
        progress_bar.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        tk.Label(progress_frame, text=f"{niveis_completos}/{total_niveis}",
                font=("Helvetica", 14), bg=self.COR_CARD,
                fg=self.COR_TEXTO_ESCURO).pack(side=tk.LEFT)
        
        # Botões de nível em grade
        niveis_frame = tk.Frame(card_frame, bg=self.COR_CARD)
        niveis_frame.pack(fill=tk.BOTH, expand=True, pady=(10, 0))
        
        num_niveis = len(self.secoes[secao])
        colunas = 6 if num_niveis > 6 else num_niveis
        
        for i, nivel in enumerate(self.secoes[secao].keys()):
            nivel_completo = nivel in self.niveis_completos[secao]
            nivel_liberado = (nivel == 1 and secao_liberada) or nivel_completo
            cor_botao = self.COR_PRIMARIA if nivel_liberado else self.COR_BLOQUEADO
            estado = tk.NORMAL if nivel_liberado else tk.DISABLED
            
            btn_frame = tk.Frame(niveis_frame, bg=self.COR_CARD)
            btn_frame.grid(row=i // colunas, column=i % colunas, padx=3, pady=3)
            
            btn_nivel = tk.Button(btn_frame, text=str(nivel), font=("Helvetica", 14, "bold"),
                                width=3, height=1, bg=cor_botao, fg=self.COR_TEXTO_CLARO,
                                bd=0, state=estado,
                                command=lambda s=secao, n=nivel: self.iniciar_nivel(s, n))
            
            if nivel_completo:
                btn_nivel.config(relief=tk.SUNKEN)
            
            btn_nivel.pack()
        
        return card_frame

    def mostrar_tela_parabens(self):
        """Tela de parabéns ao completar nível"""
        self.limpar_tela()
        
        parabens_frame = tk.Frame(self.root, bg=self.COR_FUNDO)
        parabens_frame.place(relx=0.5, rely=0.5, anchor="center")
        
        tk.Button(self.root, text="✕", font=("Helvetica", 16),
                bg=self.COR_FUNDO, fg=self.COR_ERRO, bd=0,
                command=self.mostrar_tela_secoes).place(relx=0.95, rely=0.05, anchor="ne")
        
        tk.Label(parabens_frame, text="🎉 Parabéns! 🎉", font=("Helvetica", 24, "bold"),
                bg=self.COR_FUNDO, fg=self.COR_PRIMARIA).pack(pady=20)
        
        tk.Label(parabens_frame, 
                text=f"Você completou o nível {self.nivel_atual} da seção {self.secao_atual}!",
                font=("Helvetica", 16), bg=self.COR_FUNDO,
                fg=self.COR_TEXTO_ESCURO).pack(pady=10)
        
        # Exibir tempo gasto formatado
        minutos = int(self.tempo_gasto // 60)
        segundos = int(self.tempo_gasto % 60)
        tempo_formatado = f"{minutos} min {segundos} seg" if minutos > 0 else f"{segundos} segundos"
        
        tk.Label(parabens_frame, text=f"⏱️ Tempo gasto: {tempo_formatado}",
                font=("Helvetica", 14), bg=self.COR_FUNDO,
                fg=self.COR_SECUNDARIA).pack(pady=5)
        
        tk.Label(parabens_frame, text=f"🏆 Pontuação atual: {self.pontuacao}",
                font=("Helvetica", 14), bg=self.COR_FUNDO,
                fg=self.COR_SECUNDARIA).pack(pady=5)
        
        botoes_frame = tk.Frame(parabens_frame, bg=self.COR_FUNDO)
        botoes_frame.pack(pady=30)
        
        # Verifica se é o nível FINAL da seção atual
        niveis_na_secao = len(self.secoes[self.secao_atual])
        eh_nivel_final = (self.nivel_atual == niveis_na_secao)
        
        # Só mostra "Próxima Seção" se for o nível final
        if eh_nivel_final:
            # Verifica se há próxima seção
            secoes = list(self.secoes.keys())
            index_atual = secoes.index(self.secao_atual)
            if index_atual < len(secoes) - 1:
                proxima_secao = secoes[index_atual + 1]
                tk.Button(botoes_frame, text=f"Próxima Seção ({proxima_secao})",
                        font=("Helvetica", 14, "bold"), bg=self.COR_PRIMARIA,
                        fg=self.COR_TEXTO_CLARO, padx=20, pady=10,
                        command=lambda: self.iniciar_nivel(proxima_secao, 1)).pack(side=tk.LEFT, padx=10)

        # Botão para próximo nível (só aparece se não for o nível final)
        if self.nivel_atual < niveis_na_secao:
            tk.Button(botoes_frame, text=f"Próximo Nível ({self.nivel_atual + 1})",
                    font=("Helvetica", 14, "bold"), bg=self.COR_PRIMARIA,
                    fg=self.COR_TEXTO_CLARO, padx=20, pady=10,
                    command=self.ir_para_proximo_nivel).pack(side=tk.LEFT, padx=10)
        
        tk.Button(botoes_frame, text="Vo ltar às Seções", font=("Helvetica", 14),
                bg=self.COR_SECUNDARIA, fg=self.COR_TEXTO_ESCURO, padx=20, pady=10,
                command=self.mostrar_tela_secoes).pack(side=tk.LEFT, padx=10)

    def ir_para_proximo_nivel(self):
        """Avança para o próximo nível"""
        proximo_nivel = self.nivel_atual + 1
        self.iniciar_nivel(self.secao_atual, proximo_nivel)

    def iniciar_nivel(self, secao, nivel):
        """Inicia um nível com tela de carregamento"""
        self.limpar_tela()
        self.criar_tela_carregamento(secao, nivel)
        self.root.after(100, lambda: self.carregar_nivel_background(secao, nivel, 0))

    def carregar_nivel_background(self, secao, nivel, progresso):
        """Atualiza o progresso em background con estágios específicos"""
        if progresso <= 33:
            self.loading_stage.config(text="Inicializando câmera...")
            if progresso == 10:
                self.pre_iniciar_camera()
        elif progresso <= 66:
            self.loading_stage.config(text="Carregando modelo de reconhecimento...")
        else:
            self.loading_stage.config(text="Preparando interface...")
        
        if progresso <= 100:
            self.loading_progress['value'] = progresso
            self.loading_percent.config(text=f"{progresso}%")
            self.root.update_idletasks()
            
            incremento = 1 if progresso > 90 else 2 if progresso > 50 else 5
            self.root.after(50, lambda: self.carregar_nivel_background(
                secao, nivel, progresso + incremento))
        else:
            self.loading_frame.destroy()
            self.iniciar_nivel_real(secao, nivel)

    def criar_tela_carregamento(self, secao, nivel):
        """Cria a tela de carregamento com mais informações"""
        self.loading_frame = tk.Frame(self.root, bg=self.COR_FUNDO)
        self.loading_frame.place(relx=0.5, rely=0.5, anchor="center")
        
        tk.Label(self.loading_frame, text=f"Preparando nível {nivel} de {secao}...",
                font=("Helvetica", 18, "bold"), bg=self.COR_FUNDO,
                fg=self.COR_PRIMARIA).pack(pady=10)
        
        # Adiciona mensagem de estágio de carregamento
        self.loading_stage = tk.Label(self.loading_frame, text="Inicializando componentes...",
                                    font=("Helvetica", 12), bg=self.COR_FUNDO,
                                    fg=self.COR_TEXTO_ESCURO)
        self.loading_stage.pack(pady=5)
        
        # Adiciona um spinner de carregamento
        self.loading_spinner = tk.Label(self.loading_frame, text="⏳", font=("Helvetica", 24),
                                      bg=self.COR_FUNDO, fg=self.COR_PRIMARIA)
        self.loading_spinner.pack(pady=10)
        
        self.loading_progress = ttk.Progressbar(self.loading_frame, orient=tk.HORIZONTAL,
                                              length=300, mode='determinate')
        self.loading_progress.pack(pady=10)
        
        self.loading_percent = tk.Label(self.loading_frame, text="0%", font=("Helvetica", 14),
                                      bg=self.COR_FUNDO, fg=self.COR_TEXTO_ESCURO)
        self.loading_percent.pack(pady=5)
        
        # Animação do spinner
        self.animar_spinner()

    def animar_spinner(self):
        """Anima o spinner de carregamento"""
        spinners = ["⏳", "⌛", "⏳", "⌛"]
        if hasattr(self, 'loading_spinner'):
            current = self.loading_spinner.cget("text")
            idx = (spinners.index(current) + 1) % len(spinners) if current in spinners else 0
            self.loading_spinner.config(text=spinners[idx])
            self.root.after(300, self.animar_spinner)

    def pre_iniciar_camera(self):
        """Pré-inicia a câmera em modo leve para reduzir tempo de espera"""
        try:
            # Configuração leve para inicialização rápida
            self.cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            if self.cap.isOpened():
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)  # Resolução menor inicial
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                self.cap.set(cv2.CAP_PROP_FPS, 15)
                
                # Lê um frame para "aquecer" a câmera
                ret, frame = self.cap.read()
                if ret:
                    self.cap.release()  # Libera para ser reiniciada corretamente depois
                    self.cap = None
        except Exception as e:
            print(f"Erro na pré-inicialização da câmera: {e}")

    def iniciar_nivel_real(self, secao, nivel):
        """Inicia o nível após o carregamento"""
        self.secao_atual = secao
        self.nivel_atual = nivel
        self.letras_nivel = self.secoes[secao][nivel]
        self.letra_atual_idx = 0
        self.tempo_inicio = time.time()
        
        # Frame principal
        main_frame = tk.Frame(self.root, bg=self.COR_FUNDO)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        main_frame.rowconfigure(1, weight=1)
        main_frame.columnconfigure(0, weight=1)
        
        # Barra superior
        self.criar_barra_superior(main_frame)
        
        # Frame do conteúdo principal
        content_frame = tk.Frame(main_frame, bg=self.COR_FUNDO)
        content_frame.grid(row=1, column=0, sticky="nsew", padx=0, pady=10)
        content_frame.columnconfigure(0, weight=18)
        content_frame.columnconfigure(1, weight=1)
        content_frame.rowconfigure(0, weight=1)
        
        # Frame do gesto alvo
        left_frame = self.criar_frame_gesto_alvo(content_frame)
        
        # Frame da câmera
        right_frame = self.criar_frame_camera(content_frame)
        
        # Controles inferiores
        self.criar_controles_inferiores(main_frame)
        
        self.atualizar_progresso()
        self.iniciar_camera()
        self.proxima_letra()
        self.atualizar_tempo()

    def criar_barra_superior(self, parent):
        """Cria la barra superior do nível"""
        top_frame = tk.Frame(parent, bg=self.COR_PRIMARIA)
        top_frame.grid(row=0, column=0, sticky="ew", padx=0, pady=0, ipady=10)
        
        # Botão voltar
        tk.Button(top_frame, text="← Voltar", font=("Helvetica", 12, "bold"),
                 bg=self.COR_PRIMARIA, fg=self.COR_TEXTO_CLARO, bd=0,
                 command=self.mostrar_tela_secoes).pack(side=tk.LEFT, padx=10)
        
        # Título
        tk.Label(top_frame, text=f"{self.secao_atual} - Nível {self.nivel_atual}",
                font=("Helvetica", 16, "bold"), bg=self.COR_PRIMARIA,
                fg=self.COR_TEXTO_CLARO).pack(side=tk.LEFT, expand=True)
        
        # Informações (tempo e pontuação)
        info_frame = tk.Frame(top_frame, bg=self.COR_PRIMARIA)
        info_frame.pack(side=tk.RIGHT, padx=10)
        
        # Timer
        timer_frame = tk.Frame(info_frame, bg=self.COR_PRIMARIA)
        timer_frame.pack(side=tk.LEFT, padx=(0, 20))
        
        tk.Label(timer_frame, text="⏱️ ", font=("Helvetica", 12),
                bg=self.COR_PRIMARIA, fg=self.COR_SECUNDARIA).pack(side=tk.LEFT)
        
        self.tempo_label = tk.Label(timer_frame, text="00:00", font=("Helvetica", 12, "bold"),
                                  bg=self.COR_PRIMARIA, fg=self.COR_TEXTO_CLARO)
        self.tempo_label.pack(side=tk.LEFT)
        
        # Pontuação
        pontos_frame = tk.Frame(info_frame, bg=self.COR_PRIMARIA)
        pontos_frame.pack(side=tk.LEFT)
        
        tk.Label(pontos_frame, text="🏆 ", font=("Helvetica", 12),
                bg=self.COR_PRIMARIA, fg=self.COR_SECUNDARIA).pack(side=tk.LEFT)
        
        self.pontuacao_label = tk.Label(pontos_frame, text=f"{self.pontuacao}",
                                      font=("Helvetica", 12, "bold"),
                                      bg=self.COR_PRIMARIA, fg=self.COR_TEXTO_CLARO)
        self.pontuacao_label.pack(side=tk.LEFT)

    def criar_frame_gesto_alvo(self, parent):
        """Cria o frame do gesto alvo com a letra e imagem correspondente"""
        frame = tk.Frame(parent, bg=self.COR_CARD, bd=1, relief=tk.RAISED,
                        highlightbackground=self.COR_BORDA, highlightthickness=1)
        frame.grid(row=0, column=0, sticky="nsew", padx=(0, 10), pady=0)
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(1, weight=1)
        
        tk.Label(frame, text="Gesto Alvo", font=("Helvetica", 14, "bold"),
                bg=self.COR_CARD, fg=self.COR_PRIMARIA, pady=10).grid(row=0, column=0, sticky="ew")
        
        # Container para a letra and imagem
        content_frame = tk.Frame(frame, bg=self.COR_CARD)
        content_frame.grid(row=1, column=0, sticky="nsew", padx=20, pady=20)
        content_frame.columnconfigure(0, weight=1)
        content_frame.rowconfigure(0, weight=1)
        content_frame.rowconfigure(1, weight=1)
        
        # Label para a letra grande
        self.gesto_alvo_label = tk.Label(content_frame, text="", font=("Helvetica", 72, "bold"),
                                    bg=self.COR_CARD, fg=self.COR_PRIMARIA)
        self.gesto_alvo_label.grid(row=0, column=0, sticky="s")
        
        # Label para a imagem da letra em libras
        self.imagem_letra_label = tk.Label(content_frame, bg=self.COR_CARD)
        self.imagem_letra_label.grid(row=1, column=0, sticky="n", pady=(20, 0))
        
        return frame

    def criar_frame_camera(self, parent):
        """Cria o frame da câmera"""
        frame = tk.Frame(parent, bg=self.COR_CARD, bd=1, relief=tk.RAISED,
                        highlightbackground=self.COR_BORDA, highlightthickness=1)
        frame.grid(row=0, column=1, sticky="nsew", padx=(10, 0), pady=0)
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(1, weight=1)
        
        tk.Label(frame, text="Sua Câmera", font=("Helvetica", 14, "bold"),
                bg=self.COR_CARD, fg=self.COR_PRIMARIA, pady=10).grid(row=0, column=0, sticky="ew")
        
        # Definir um tamanho fixo para o container da câmera
        video_container = tk.Frame(frame, bg="white", width=640, height=480, padx=0, pady=0)
        video_container.grid(row=1, column=0, sticky="nsew", padx=10, pady=10)
        video_container.grid_propagate(False)  # Isso impede que o frame redimensione
        
        self.video_label = tk.Label(video_container, bg="white")
        self.video_label.pack(fill=tk.BOTH, expand=True)
        
        return frame

    def criar_controles_inferiores(self, parent):
        """Cria os controles inferiores"""
        control_frame = tk.Frame(parent, bg=self.COR_FUNDO)
        control_frame.grid(row=2, column=0, sticky="ew", padx=10, pady=(0, 5))
        
        control_frame.columnconfigure(0, weight=1)
        control_frame.columnconfigure(1, weight=3)
        control_frame.columnconfigure(2, weight=1)
        
        self.btn_camera = tk.Button(control_frame, text="⏸️ Parar Câmera",
                                  font=("Helvetica", 12, "bold"), bg=self.COR_PRIMARIA,
                                  fg=self.COR_TEXTO_CLARO, bd=0, padx=15, pady=8,
                                  command=self.toggle_camera)
        self.btn_camera.grid(row=0, column=0, padx=5, pady=5, sticky="w")
        
        self.feedback_label = tk.Label(control_frame, text="Mostre o gesto para a câmera",
                                     font=("Helvetica", 14), bg=self.COR_FUNDO,
                                     fg=self.COR_TEXTO_ESCURO)
        self.feedback_label.grid(row=0, column=1, padx=5, pady=5, sticky="ew")
        
        self.progress_frame = tk.Frame(control_frame, bg=self.COR_FUNDO)
        self.progress_frame.grid(row=0, column=2, padx=5, pady=5, sticky="e")
        
        self.progress_label = tk.Label(self.progress_frame, text="Progresso:",
                                     font=("Helvetica", 12), bg=self.COR_FUNDO,
                                     fg=self.COR_TEXTO_ESCURO)
        self.progress_label.pack(side=tk.LEFT)
        
        self.progress_bar = ttk.Progressbar(self.progress_frame, orient=tk.HORIZONTAL,
                                         length=150, mode='determinate')
        self.progress_bar.pack(side=tk.LEFT, padx=5)
        
        self.progress_text = tk.Label(self.progress_frame, text="0/0",
                                    font=("Helvetica", 12), bg=self.COR_FUNDO,
                                    fg=self.COR_TEXTO_ESCURO)
        self.progress_text.pack(side=tk.LEFT)

    # Métodos de controle
    def atualizar_tempo(self):
        """Atualiza o timer na interface"""
        if hasattr(self, 'tempo_inicio') and self.tempo_inicio > 0:
            tempo_decorrido = time.time() - self.tempo_inicio
            minutos = int(tempo_decorrido // 60)
            segundos = int(tempo_decorrido % 60)
            self.tempo_label.config(text=f"{minutos:02d}:{segundos:02d}")
        
        self.root.after(1000, self.atualizar_tempo)

    def atualizar_progresso(self):
        """Atualiza a barra de progresso"""
        total = len(self.letras_nivel)
        atual = self.letra_atual_idx
        self.progress_bar['maximum'] = total
        self.progress_bar['value'] = atual
        self.progress_text.config(text=f"{atual}/{total}")

    def proxima_letra(self):
        """Avança para a próxima letra e atualiza a imagem correspondente"""
        if self.letra_atual_idx < len(self.letras_nivel):
            self.gesto_alvo = self.letras_nivel[self.letra_atual_idx]
            self.gesto_alvo_label.config(text=self.gesto_alvo)
            self.letra_atual_idx += 1
            self.feedback_label.config(text="Mostre o gesto para a câmera", fg=self.COR_TEXTO_ESCURO)
            self.atualizar_progresso()
            
            # Atualizar a imagem da letra em libras
            self.atualizar_imagem_letra()
        else:
            self.tempo_gasto = time.time() - self.tempo_inicio
            
            if self.nivel_atual not in self.niveis_completos[self.secao_atual]:
                self.niveis_completos[self.secao_atual].append(self.nivel_atual)
            
            # CORREÇÃO: Lógica de desbloqueio de seções
            if self.nivel_atual == len(self.secoes[self.secao_atual]):
                # Completa a seção atual
                if self.secao_atual not in self.secoes_liberadas:
                    self.secoes_liberadas.append(self.secao_atual)
                
                # Desbloqueia a próxima seção se existir
                secoes = list(self.secoes.keys())
                index_atual = secoes.index(self.secao_atual)
                if index_atual < len(secoes) - 1:
                    proxima_secao = secoes[index_atual + 1]
                    if proxima_secao not in self.secoes_liberadas:
                        self.secoes_liberadas.append(proxima_secao)
            
            self.mostrar_tela_parabens()

    def atualizar_imagem_letra(self):
        """Atualiza a imagem da letra em libras correspondente"""
        if not hasattr(self, 'gesto_alvo') or not self.gesto_alvo:
            return
        
        # Caminho para a pasta com as imagens das letras
        letra = self.gesto_alvo.lower()  # Assumindo que as imagens estão em minúsculo
        caminho_imagem = f"libras_alfabeto_projeto/imagens/{letra}.png"  # Ajuste o caminho conforme necessário
        
        try:
            # Carrega la imagem e redimensiona
            img = Image.open(caminho_imagem)
            img = img.resize((200, 200), Image.LANCZOS)  # Tamanho ajustável
            img = ImageTk.PhotoImage(img)
            
            # Atualiza o label da imagem
            self.imagem_letra_label.config(image=img)
            self.imagem_letra_label.image = img  # Mantém uma referência
            
        except FileNotFoundError:
            # Se a imagem não existir, mostra um placeholder
            self.imagem_letra_label.config(text="Imagem não disponível", 
                                        font=("Helvetica", 14),
                                        fg=self.COR_ERRO)
        except Exception as e:
            print(f"Erro ao carregar imagem: {e}")
            self.imagem_letra_label.config(text="Erro ao carregar imagem",
                                        font=("Helvetica", 14),
                                        fg=self.COR_ERRO)

    def toggle_camera(self):
        """Liga/desliga a câmera"""
        if self.running:
            self.parar_camera()
            self.btn_camera.config(text="▶️ Iniciar Câmera")
        else:
            self.iniciar_camera()
            self.btn_camera.config(text="⏸️ Parar Câmera")

    # Métodos de câmera e reconhecimento
    def iniciar_camera(self):
        """Inicia a câmera con configurações otimizadas"""
        if self.running:
            return
            
        try:
            start_time = time.time()
            self.cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            
            # Configura timeout para inicialização
            while not self.cap.isOpened() and (time.time() - start_time) < self.camera_timeout:
                time.sleep(0.1)
                
            if not self.cap.isOpened():
                messagebox.showerror("Erro", "Timeout ao acessar a câmera")
                return
            
            # Configurações con tamanho fixo que corresponde ao display
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)  # Resolução fixa
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 20)  # FPS reduzido para melhor performance
            
            # Configurações de buffer para reduzir latência
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            self.running = True
            self.frame_count = 0
            self.skip_frames = 1  # Processa mais frames
            
            # Feedback visual
            self.feedback_label.config(text="Câmera iniciada - Ajustando...")
            
            self.atualizar_frame()
        except Exception as e:
            messagebox.showerror("Erro", f"Falha ao iniciar câmera: {str(e)}")
            self.cap = None

    def atualizar_frame(self):
        """Atualiza o frame da câmera con tratamento de erros"""
        if not self.running:
            return
            
        try:
            self.frame_count += 1
            ret, frame = self.cap.read()
            
            if not ret:
                print("Erro ao capturar frame - tentando reiniciar câmera")
                self.reiniciar_camera()
                return
                
            if self.frame_count % (self.skip_frames + 1) == 0:
                frame = self.processar_frame(frame)
                self.mostrar_frame(frame)
                
        except Exception as e:
            print(f"Erro no loop da câmera: {e}")
            self.reiniciar_camera()
        finally:
            if self.running:
                self.root.after(30, self.atualizar_frame)

    def reiniciar_camera(self):
        """Tenta reiniciar a câmera em caso de falha"""
        self.parar_camera()
        time.sleep(0.5)
        self.iniciar_camera()

    def processar_frame(self, frame):
        """Processa o frame para detecção de mãos"""
        frame = cv2.flip(frame, 1)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(frame_rgb)
        
        if results.multi_hand_landmarks:
            self.frames_sem_maos = 0
            for hand_landmarks in results.multi_hand_landmarks:
                self.mp_drawing.draw_landmarks(
                    frame_rgb,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS,
                    self.mp_drawing_styles.get_default_hand_landmarks_style(),
                    self.mp_drawing_styles.get_default_hand_connections_style()
                )
            
            landmarks = self.processar_landmarks(results)
            self.buffer_gestos.append(landmarks)
            
            # Reconhece o gesto quando o buffer estiver cheio
            if len(self.buffer_gestos) == 30:
                self.reconhecer_gesto()
        else:
            self.frames_sem_maos += 1
            if self.frames_sem_maos > self.RESET_THRESHOLD and self.buffer_gestos:
                self.buffer_gestos.clear()
                self.feedback_label.config(text="Mãos não detectadas", fg=self.COR_ERRO)
        
        return frame_rgb

    def reconhecer_gesto(self):
        """Reconhece o gesto usando o modelo carregado"""
        if not self.modelo_gestos or not self.le_gestos or not self.gesto_alvo:
            self.reconhecer_gesto_simulado()
            return
    
        try:
            entrada = np.array(self.buffer_gestos).reshape(1, 30, 126)
            preds = self.modelo_gestos.predict(entrada, verbose=0)[0]
            classe_idx = np.argmax(preds)
            confianca = preds[classe_idx]
            gesto_reconhecido = self.le_gestos.classes_[classe_idx]

            # 🔹 Normaliza para ignorar mão esquerda/direita
            gesto_normalizado = gesto_reconhecido.replace("_DIR", "").replace("_ESQ", "")
            alvo_normalizado = self.gesto_alvo.replace("_DIR", "").replace("_ESQ", "")

            self.historico_predicoes.append(gesto_normalizado)
            
            contagem = defaultdict(int)
            for g in self.historico_predicoes:
                contagem[g] += 1
            gesto_final = max(contagem.items(), key=lambda x: x[1])[0]
            
            if confianca > 0.7 and gesto_final == alvo_normalizado:
                self.pontuacao += 10 * self.nivel_atual
                self.pontuacao_label.config(text=f"{self.pontuacao}")
                self.feedback_label.config(
                    text=f"✅ Correto! {gesto_final}",
                    foreground=self.COR_SUCESSO
                )
                self.root.after(1500, self.proxima_letra)
                self.buffer_gestos.clear()
                self.historico_predicoes.clear()
            elif gesto_reconhecido != self.ultimo_gesto_reconhecido:
                self.feedback_label.config(
                    text=f"Reconhecido: {gesto_reconhecido} (Mostre: {self.gesto_alvo})",
                    foreground=self.COR_SECUNDARIA
                )
            
            self.ultimo_gesto_reconhecido = gesto_reconhecido
            
        except Exception as e:
            print(f"Erro ao reconhecer gesto: {str(e)}")
            self.feedback_label.config(
                text="Erro no reconhecimento. Tente novamente",
                foreground=self.COR_ERRO
            )

    def processar_landmarks(self, results):
        """Processa os landmarks das mãos"""
        landmarks = []
        if results.multi_hand_landmarks:
            for hand in results.multi_hand_landmarks:
                landmarks.extend([[lm.x, lm.y, lm.z] for lm in hand.landmark])
        
        landmarks = landmarks[:42]  # Limita a 2 mãos
        if len(landmarks) < 42:
            landmarks.extend([[0, 0, 0]] * (42 - len(landmarks)))
        
        return np.array(landmarks).flatten()

    def mostrar_frame(self, frame):
        """Mostra o frame na interface con tamanho fixo"""
        img = Image.fromarray(frame)
        
        # Tamanho fixo para a imagem (pode ajustar conforme necessário)
        new_width = 640
        new_height = 480
        
        img = img.resize((new_width, new_height), Image.LANCZOS)
        img = ImageTk.PhotoImage(image=img)
        
        self.video_label.imgtk = img
        self.video_label.config(image=img)

    def parar_camera(self):
        """Para a câmera"""
        self.running = False
        if self.cap:
            self.cap.release()
        self.cap = None
        # Se o widget ainda existir, mostra tela preta
        if hasattr(self, "video_label") and self.video_label.winfo_exists():
            try:
                img = np.zeros((480, 640, 3), dtype=np.uint8)  # imagem preta
                img = Image.fromarray(img)
                img = ImageTk.PhotoImage(image=img)
                self.video_label.config(image=img)
                self.video_label.image = img  # manter referência
            except Exception as e:
                print("Aviso ao parar câmera:", e)

    def limpar_tela(self):
        """Limpa todos os widgets"""
        self.parar_camera()
        for widget in self.root.winfo_children():
            widget.destroy()

    def sair(self):
        """Fecha o aplicativo"""
        self.parar_camera()
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = AplicativoLibras(root)
    root.protocol("WM_DELETE_WINDOW", app.sair)
    root.mainloop()