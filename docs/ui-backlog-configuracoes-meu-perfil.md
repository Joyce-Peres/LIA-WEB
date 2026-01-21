## Backlog — Configurações e Meu Perfil (LIA Web)

### Contexto
- **Entrada**: usuário faz login em **modo local** → vai para **Minhas Lições** → abre menu do avatar (canto superior direito) → acessa **Meu Perfil** e **Configurações**.
- **Uso de câmera**: apenas para **reconhecimento de gestos** (processamento local no navegador).

---

### P0 — Alto impacto / baixo risco (recomendado agora)

#### 1) Tema com opção **Sistema**
- **User story**: Como usuário, quero que o app acompanhe o tema do meu dispositivo para ter uma experiência consistente.
- **Critérios de aceite**
  - Deve existir opção **Sistema / Claro / Escuro** em Configurações.
  - Ao selecionar **Sistema**, o app deve aplicar automaticamente o tema com base em \(prefers-color-scheme\).
  - Mudanças no tema do SO/navegador enquanto o app está aberto devem refletir no app quando **Sistema** estiver ativo.
  - Preferência deve ser persistida e reaplicada no próximo acesso.

#### 2) Alternância de câmera com linguagem correta: **“Espelhar imagem”**
- **User story**: Como usuário, quero espelhar o vídeo para copiar o gesto como em um espelho.
- **Critérios de aceite**
  - O controle deve se chamar **Espelhar imagem** e ter uma descrição curta (ex.: “Deixe o vídeo como um espelho…”).
  - Ao ativar, o preview da câmera (e overlay) deve ficar **invertido horizontalmente**.
  - Preferência deve ser persistida.
  - Textos de ajuda/FAQ devem usar o mesmo termo.

#### 3) Botão **Salvar** com estados e feedback consistente (Configurações)
- **User story**: Como usuário, quero saber quando tenho alterações pendentes e receber confirmação ao salvar.
- **Critérios de aceite**
  - Botão **Salvar** deve ficar **desabilitado** quando não houver alterações.
  - Ao clicar, deve mostrar estado **Salvando…** (loading) e depois feedback “Preferências salvas.”
  - Feedback deve ser acessível (ex.: `aria-live="polite"`).

#### 4) Meu Perfil: email **somente leitura** no modo local + “Salvar” só quando necessário
- **User story**: Como usuário, quero entender o que posso editar no meu perfil e evitar mudanças “falsas”.
- **Critérios de aceite**
  - Campo **Email** deve ser **read-only** e mostrar um hint (ex.: “No modo local… não é editável aqui”).
  - Botão **Salvar alterações** deve ficar desabilitado quando não houver alterações no perfil (nome/avatar).
  - Ao salvar, mostrar feedback (“Alterações salvas.”) com `aria-live`.

---

### P1 — Próximos incrementos (produto/câmera)

#### 5) “Diagnóstico de câmera” (rápido)
- **User story**: Como usuário, quero validar rapidamente se a câmera está pronta para reconhecimento.
- **Critérios de aceite**
  - Em Configurações (ou modal), exibir **preview** + checklist: iluminação, enquadramento, mãos visíveis.
  - Deve detectar e exibir estado de **permissão** (permitida/bloqueada) e instrução “Como habilitar”.

#### 6) Seleção de câmera em Configurações
- **Critérios de aceite**
  - Lista de dispositivos de vídeo disponíveis.
  - Persistir escolha e usar como padrão na prática (quando aplicável).

---

### P2 — Evoluções (engajamento e confiança)

#### 7) Estatísticas mais ricas no Meu Perfil
- **Critérios de aceite**
  - Exibir “Maior streak”, “XP na semana” (se houver dados).
  - CTA para voltar/continuar prática.

#### 8) Privacidade (reforço de confiança)
- **Critérios de aceite**
  - Texto explícito: “A análise de vídeo acontece localmente; nada é enviado.”
  - Link para Ajuda/Sobre com explicação.


