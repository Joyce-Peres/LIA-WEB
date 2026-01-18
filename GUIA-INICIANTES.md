# 🚀 Guia Completo para Iniciantes - Projeto LIA-WEB

Bem-vinda ao projeto LIA-WEB! Este guia vai te ajudar a configurar tudo do zero, mesmo sem experiência com Angular ou Node.js.

## 📚 O que você vai instalar

1. **Node.js** - Ambiente que permite executar JavaScript no computador
2. **Git** - Sistema de controle de versão para baixar e gerenciar o código
3. **Editor de Código** - Visual Studio Code (VS Code) para editar os arquivos
4. **Dependências do projeto** - Bibliotecas que o projeto precisa para funcionar

---

## 🛠️ Passo 1: Instalar o Node.js

O Node.js é essencial para rodar o projeto Angular.

### Windows:

1. **Acesse** [https://nodejs.org/](https://nodejs.org/)
2. **Baixe** a versão **LTS** (Long Term Support) - no momento recomenda-se versão 18 ou superior
3. **Execute** o instalador baixado
4. **Siga** o assistente de instalação (deixe todas as opções padrão marcadas)
5. **Importante**: Marque a opção "Automatically install the necessary tools" se aparecer

### Verificar instalação:

Abra o **PowerShell** ou **Prompt de Comando** e digite:

```powershell
node --version
```

Deve aparecer algo como: `v18.x.x` ou `v20.x.x`

Agora verifique o npm:

```powershell
npm --version
```

Deve aparecer algo como: `10.x.x` ou `11.x.x`

✅ Se aparecer as versões, está tudo certo!

---

## 🔧 Passo 2: Instalar o Git

O Git permite baixar o código do projeto e trabalhar em equipe.

### Windows:

1. **Acesse** [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. **Baixe** o instalador
3. **Execute** e siga o assistente
4. **Recomendações durante a instalação:**
   - Use o editor padrão (Vim ou selecione "Use Visual Studio Code")
   - Deixe as demais opções como padrão

### Verificar instalação:

No **PowerShell** ou **Prompt de Comando**:

```powershell
git --version
```

Deve aparecer: `git version 2.x.x`

✅ Instalado com sucesso!

### Configurar Git (primeira vez):

Configure seu nome e email (serão usados nos commits):

```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"
```

---

## 💻 Passo 3: Instalar o Visual Studio Code

O VS Code é o editor de código mais popular e recomendado para Angular.

1. **Acesse** [https://code.visualstudio.com/](https://code.visualstudio.com/)
2. **Baixe** o instalador para Windows
3. **Execute** e siga o assistente
4. **Recomendações:** Marque todas as opções de "Adicionar ao PATH" e "Adicionar ao menu de contexto"

### Extensões recomendadas no VS Code:

Depois de instalar o VS Code, abra-o e instale estas extensões:

1. **Angular Language Service** - Suporte para Angular
2. **ESLint** - Linter para código JavaScript/TypeScript
3. **Prettier** - Formatador de código
4. **GitLens** - Ferramentas avançadas para Git

Para instalar: Clique no ícone de extensões (quadradinho) na barra lateral esquerda, pesquise pelo nome e clique em "Install".

---

## 📥 Passo 4: Clonar o Projeto

Agora vamos baixar o código do projeto.

1. **Abra o PowerShell** (ou Terminal do VS Code)

2. **Navegue** até a pasta onde quer salvar o projeto:

```powershell
# Exemplo: criar uma pasta "Projetos" em Documentos
cd ~\Documents
mkdir Projetos
cd Projetos
```

3. **Clone o repositório:**

```powershell
git clone https://github.com/Joyce-Peres/LIA-WEB.git
```

4. **Entre na pasta do projeto:**

```powershell
cd LIA-WEB
```

5. **Mude para a branch de desenvolvimento:**

```powershell
git checkout feature/development
```

---

## 📦 Passo 5: Instalar as Dependências do Projeto

As dependências são todas as bibliotecas que o projeto precisa.

1. **Entre na pasta do Angular:**

```powershell
cd lia-web
```

2. **Instale as dependências** (pode demorar alguns minutos):

```powershell
npm install
```

Você verá muitas mensagens aparecendo. É normal! O npm está baixando e instalando tudo automaticamente.

⏱️ **Aguarde até ver a mensagem final** (pode levar de 3 a 10 minutos dependendo da sua internet)

✅ Quando terminar sem erros, está pronto!

### Se aparecer erros:

- **Erro de permissão**: Execute o PowerShell como administrador
- **Erro de rede**: Verifique sua conexão com a internet
- **Erro de versão do Node**: Certifique-se de que instalou Node 18 ou superior

---

## ▶️ Passo 6: Rodar o Projeto

Agora o momento mais esperado: ver o projeto funcionando!

### Iniciar o servidor de desenvolvimento:

```powershell
npm start
```

Ou, alternativamente:

```powershell
npm run start
```

Você verá mensagens de compilação. Aguarde até aparecer algo como:

```
** Angular Live Development Server is listening on localhost:4200 **
✔ Compiled successfully.
```

### Abrir no navegador:

Abra seu navegador favorito (Chrome, Edge, Firefox) e acesse:

```
http://localhost:4200
```

🎉 **Parabéns! O projeto está rodando!**

### Para parar o servidor:

No terminal onde está rodando, pressione:

```
Ctrl + C
```

Confirme com `S` ou `Y` se perguntar.

---

## 🧪 Passo 7: Rodar os Testes

O projeto usa Jest para testes automatizados.

### Rodar todos os testes:

```powershell
npm test
```

### Rodar testes em modo watch (re-executa ao salvar):

```powershell
npm run test:watch
```

---

## 📁 Estrutura do Projeto (Resumo)

Entendendo onde está cada coisa:

```
LIA-WEB/
├── lia-web/                    # Pasta principal do Angular
│   ├── src/                    # Código-fonte
│   │   ├── app/               # Componentes e serviços Angular
│   │   │   ├── core/         # Serviços principais
│   │   │   ├── features/     # Funcionalidades (páginas)
│   │   │   └── shared/       # Componentes compartilhados
│   │   ├── assets/           # Imagens, vídeos, modelos ML
│   │   └── styles.css        # Estilos globais
│   ├── package.json          # Lista de dependências
│   └── angular.json          # Configuração do Angular
├── docs/                      # Documentação do projeto
└── README.md                  # Instruções básicas
```

---

## 🔄 Comandos Git Úteis

### Atualizar seu código com as mudanças mais recentes:

```powershell
git pull origin feature/development
```

### Ver o status dos seus arquivos:

```powershell
git status
```

### Ver em qual branch você está:

```powershell
git branch
```

### Criar uma nova branch para trabalhar:

```powershell
git checkout -b minha-nova-funcionalidade
```

---

## 📝 Comandos NPM Úteis

### Instalar uma nova dependência:

```powershell
npm install nome-do-pacote
```

### Atualizar dependências:

```powershell
npm update
```

### Limpar cache (se tiver problemas):

```powershell
npm cache clean --force
```

### Reinstalar tudo do zero:

```powershell
# Deletar pasta node_modules e arquivo package-lock.json
rm -r node_modules
rm package-lock.json

# Instalar novamente
npm install
```

---

## 🆘 Problemas Comuns e Soluções

### 1. "npm não é reconhecido como comando"

**Solução:** 
- Reinicie o terminal/PowerShell após instalar o Node.js
- Se não funcionar, reinicie o computador

### 2. "Porta 4200 já está em uso"

**Solução:**
- Feche qualquer outro processo rodando na porta 4200
- Ou rode em outra porta: `ng serve --port 4300`

### 3. Erros de compilação do Angular

**Solução:**
```powershell
# Limpar e reinstalar
rm -r node_modules
rm package-lock.json
npm install
```

### 4. "Cannot find module '@angular/...'"

**Solução:**
```powershell
npm install
```

### 5. Código não está atualizando no navegador

**Solução:**
- Limpe o cache do navegador (Ctrl + Shift + Delete)
- Ou use modo anônimo/privado
- Ou force reload (Ctrl + F5)

---

## 📞 Precisa de Ajuda?

- **Documentação Angular:** [https://angular.io/docs](https://angular.io/docs)
- **Documentação Node.js:** [https://nodejs.org/docs](https://nodejs.org/docs)
- **Fale com Joyce:** Tire dúvidas diretamente com ela!

---

## ✅ Checklist Final

Antes de começar a desenvolver, certifique-se de que:

- [ ] Node.js instalado (versão 18+)
- [ ] Git instalado e configurado
- [ ] VS Code instalado com extensões
- [ ] Projeto clonado
- [ ] Branch `feature/development` ativa
- [ ] Dependências instaladas (`npm install` concluído)
- [ ] Projeto roda sem erros (`npm start`)
- [ ] Testes rodam (`npm test`)

---

## 🎯 Próximos Passos

Agora que está tudo configurado:

1. **Explore o código** - Comece pelos arquivos em `src/app`
2. **Leia a documentação** - Veja os arquivos na pasta `docs/`
3. **Faça pequenas mudanças** - Teste editar um texto ou cor
4. **Aprenda Angular** - Tutorial oficial: [angular.io/tutorial](https://angular.io/tutorial)
5. **Pratique Git** - Faça commits das suas mudanças

Boa sorte e bem-vinda ao time! 🚀

---

**Última atualização:** Janeiro de 2026
**Mantido por:** Joyce Peres
