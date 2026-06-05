# 🏆 SorteioMax

**Plataforma de sorteios PIX premium — 100% legal, transparente e segura.**

> Sorteios baseados na Loteria Federal da Caixa · Design Luxury Dark · Conformidade SPA/MF

---

## 🚀 Setup Rápido (do zero)

### Pré-requisitos (todos gratuitos)
| Ferramenta | Uso | Link |
|---|---|---|
| Node.js 18+ | Runtime | https://nodejs.org |
| Git | Versionamento | https://git-scm.com |
| VS Code | Editor | https://code.visualstudio.com |
| Conta GitHub | Repositório | https://github.com |
| Conta Vercel | Deploy gratuito | https://vercel.com |
| Conta Supabase | PostgreSQL gratuito | https://supabase.com |
| Conta Asaas | PIX sandbox gratuito | https://asaas.com |
| Conta Resend | Email 3k/mês grátis | https://resend.com |

### 1. Clone e instale

```bash
git clone https://github.com/SEU_USER/sorteiomax.git
cd sorteiomax
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
# Edite .env.local com suas chaves
```

### 3. Configure o banco (Supabase gratuito)
1. Acesse https://supabase.com e crie um projeto
2. Copie a `DATABASE_URL` do painel: *Settings → Database → Connection String*
3. Cole em `.env.local`

```bash
npm run db:push    # Cria as tabelas
npm run db:studio  # Visualiza os dados (opcional)
```

### 4. Configure o Asaas (PIX sandbox)
1. Acesse https://asaas.com e crie conta
2. Vá em *Integrações → API* e copie a chave sandbox
3. Cole em `ASAAS_API_KEY` no `.env.local`

### 5. Rode localmente

```bash
npm run dev
# Acesse: http://localhost:3000
```

---

## 📁 Estrutura do Projeto

```
sorteiomax/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes (serverless)
│   ├── sorteios/[slug]/    # Página de cada sorteio
│   ├── minha-conta/        # Área do participante
│   ├── admin/              # Painel administrativo
│   └── page.tsx            # Landing page
├── components/             # Componentes React
│   ├── ui/                 # Design system (Navbar, Footer, Timer...)
│   ├── sorteio/            # Cards, seleção de cotas
│   ├── pagamento/          # QR Code, status PIX
│   └── admin/              # Dashboard admin
├── lib/
│   ├── classes/            # OOP — serviços do negócio
│   ├── prisma.ts           # Cliente do banco
│   └── container.ts        # Injeção de dependências
├── prisma/
│   └── schema.prisma       # Schema do banco de dados
├── PROJECT_INSTRUCTIONS.md # Instruções mestras do projeto
└── README.md               # Este arquivo
```

---

## 🌿 Git Flow

```bash
# Feature nova
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature

# Trabalhar...
git commit -m "feat(modulo): descrição"

# Pull Request → develop → testes → main
```

**Branches:** `main` · `develop` · `feature/*` · `fix/*` · `hotfix/*`

---

## 🚀 Deploy na Vercel (gratuito)

1. Push para o GitHub
2. Acesse https://vercel.com → *New Project* → importe o repo
3. Configure as variáveis de ambiente no painel da Vercel
4. Deploy automático a cada push na `main`

---

## 📖 Documentação completa

Consulte `PROJECT_INSTRUCTIONS.md` para:
- Design System completo
- Arquitetura e classes OOP
- Motor de sorteio (Loteria Federal)
- Compliance legal (SPA/MF, LGPD)
- Roadmap por fases
- Como escrever instruções para o Claude

---

## ⚖️ Legal

Operamos conforme a **Lei 5.768/71** e **Decreto 70.951/72**.
Autorização obrigatória da **SPA/MF** para cada campanha.
Proibida participação de menores de 18 anos.
