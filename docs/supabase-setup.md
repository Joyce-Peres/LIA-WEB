---
title: (Opcional/Futuro) Setup do Supabase (Auth Google + Schema)
description: Referência opcional para integrar Supabase no futuro. O MVP atual funciona 100% em modo local, sem serviços externos.
author: Joyce
date: 2025-12-21
---

# Setup do Supabase (Auth Google + Schema)

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
  - `http://localhost:5173`
  - `http://localhost:5173/auth/callback`

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

Crie um arquivo `.env` (ou `.env.local`) na raiz do projeto, baseado no `.env.example`, e defina:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-public-key>
```

## 5. Verificação local

1. Instale dependências:

```bash
npm install
```

2. Rode a aplicação:

```bash
npm run dev
```

Se `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` estiverem ausentes, o app falha rápido com uma mensagem clara (ver `src/lib/env.ts`).


