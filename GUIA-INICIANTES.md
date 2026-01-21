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

## 📥 Passo 4: Rodar o projeto (sem duplicar documentação)

Para manter a documentação do repositório **sem redundância**, o passo a passo “canônico” para rodar localmente fica no `README.md`.

1. Siga o guia principal: `README.md` (seção “Rodar localmente”).
2. Use o hub para entender onde cada doc vive: `docs/index.md`.

Se você preferir, aqui vai o **mínimo** necessário (equivalente ao README):

```powershell
git clone https://github.com/Joyce-Peres/LIA-WEB.git
cd LIA-WEB\lia-web
npm install
npm start
```

## 📚 Próximos passos (onde aprender mais)

- Arquitetura e decisões: `docs/architeture.md`
- Requisitos: `docs/prd.md`
- ML (ambiente Python): `lia-web/SETUP-AMBIENTE.md`
- ML (conversão para web): `docs/model-conversion.md`

---

**Última atualização:** Janeiro de 2026  
**Mantido por:** Joyce Peres
