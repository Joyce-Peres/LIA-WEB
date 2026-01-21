---
title: (Opcional/Futuro) Setup do Supabase (Auth Google + Schema)
description: (Arquivado) Referência opcional para integração futura. O projeto atual não usa Supabase.
author: Joyce
date: 2025-12-21
---

# Setup do Supabase (Auth Google + Schema)

> Status atual do projeto: **NÃO usamos Supabase**.  
> Este arquivo existe apenas como **referência futura** e pode ficar desatualizado conforme o app evolui em modo local.

Este guia cobre a configuração **manual** do Supabase para a Story 1.2:

- criar projeto no Supabase
- habilitar **Google OAuth**
- aplicar o SQL de `profiles` com **RLS**
- configurar variáveis de ambiente no projeto

## 1. Criar projeto no Supabase

1. Crie um projeto em `Supabase Dashboard`.
2. Guarde:
   - **Project URL**
   - **anon public key**

## 2. Habilitar Google OAuth

Esta parte tem 2 sistemas envolvidos:

- **Google Cloud Console** (onde você cria o Client ID/Secret)
- **Supabase Dashboard** (onde você habilita o provider e cola as credenciais)

### 2.1 Google Cloud Console (criar credenciais)

1. No Google Cloud Console, crie/seleciona um projeto.
2. Configure a **OAuth consent screen** (se ainda não existir).
3. Crie credenciais OAuth:
   - **Credentials → Create credentials → OAuth client ID**
   - Tipo: **Web application**

#### Authorized redirect URI (obrigatório)

No Google Cloud Console, adicione como redirect URI o callback do Supabase (GoTrue):

- `https://<project-ref>.supabase.co/auth/v1/callback`

> Dica: o `<project-ref>` é o “slug” do seu projeto no Supabase. Você pode obtê-lo no Project URL.

4. Copie e guarde:
   - **Client ID**
   - **Client Secret** (não comite isso em repositório)

### 2.2 Supabase Dashboard (habilitar provider)

1. No Supabase: **Authentication → Providers → Google**.
2. Habilite o provider e preencha:
   - Client ID
   - Client Secret

### Callback/Redirect URLs

Existem 2 níveis de URL:

- **Callback do Supabase** (fica no Google Cloud Console): `https://<project-ref>.supabase.co/auth/v1/callback`
- **Redirect da aplicação** (fica no Supabase Auth URL configuration): seu domínio do app

No Supabase, configure também (quando aplicável):

- **Authentication → URL Configuration → Site URL**: use a URL principal do seu app (produção)
- **Additional Redirect URLs**: inclua o ambiente local:
  - `http://localhost:4200`
  - `http://localhost:4200/auth/callback`

> Observação: o app redireciona para `/auth/callback` durante o fluxo OAuth. Se essa URL não estiver permitida, o Supabase pode bloquear o retorno do login.

## 3. Aplicar schema `profiles` + RLS

1. Abra **SQL Editor** no Supabase.
2. Cole e execute o conteúdo do arquivo:
   - `supabase/sql/01_profiles.sql`

O script cria:
- `public.profiles`
- RLS habilitado
- policies:
  - `"Usuários podem ver todos os perfis"` (SELECT)
  - `"Usuários podem editar apenas seu perfil"` (UPDATE)

## 4. Configurar variáveis de ambiente no projeto

> Nota: o app atual é **Angular** e não usa Vite. Angular não lê `VITE_*`.

Quando/Se a integração com Supabase for adicionada, defina as credenciais em **configuração de ambiente do Angular** (ex.: arquivos de environment) ou via **build-time replacements** do Angular CLI, evitando commitar chaves no repositório.

```env
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_ANON_KEY=<sua-anon-public-key>
```

## 5. Verificação local

1. Instale dependências:

```bash
cd lia-web
npm install
```

2. Rode a aplicação:

```bash
npm start
```

O app estará disponível em `http://localhost:4200`.

> Observação: este projeto (MVP) não depende de Supabase. Esta checagem só faz sentido quando a integração remota for implementada.


