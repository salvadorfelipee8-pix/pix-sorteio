# SorteioMax — Fase 3: Painel Admin

## Arquivos entregues

### Novos arquivos (copiar para o projeto):

```
middleware.ts                                         ← raiz do projeto
scripts/gerar-senha-admin.mjs

lib/classes/admin-auth-service.ts
lib/classes/admin-service.ts
lib/classes/congelamento-service.ts

app/admin/layout.tsx
app/admin/page.tsx
app/admin/login/page.tsx
app/admin/sorteios/page.tsx
app/admin/sorteios/novo/page.tsx
app/admin/sorteios/[id]/editar/page.tsx
app/admin/sorteios/[id]/participantes/page.tsx
app/admin/auditoria/page.tsx

app/api/admin/auth/route.ts
app/api/admin/metrics/route.ts
app/api/admin/sorteios/route.ts
app/api/admin/sorteios/[id]/route.ts
app/api/admin/sorteios/[id]/congelar/route.ts
app/api/admin/sorteios/[id]/participantes/route.ts
app/api/admin/auditoria/logs/route.ts
app/api/admin/auditoria/export/route.ts
```

---

## Passo 1 — Instalar dependência obrigatória

```bash
npm install jose
```

> `jose` é necessário para JWT no Edge Runtime (middleware.ts).
> `bcryptjs` já está no projeto. ✅

---

## Passo 2 — Gerar hash da senha admin

```bash
node scripts/gerar-senha-admin.mjs SuaSenhaSegura123
```

O script imprime as 3 variáveis prontas para copiar.

---

## Passo 3 — Variáveis de ambiente

Adicionar no Vercel em **Settings > Environment Variables**:

| Variável               | Valor                        |
|------------------------|------------------------------|
| `ADMIN_EMAIL`          | admin@sorteiomax.com         |
| `ADMIN_PASSWORD_HASH`  | (gerado no Passo 2)          |
| `ADMIN_JWT_SECRET`     | (gerado no Passo 2)          |

Também adicionar no `.env.local` para desenvolvimento local.

---

## Passo 4 — Copiar os arquivos

Copiar toda a estrutura de pastas deste ZIP para a raiz do projeto,
**substituindo** qualquer arquivo com mesmo nome.

---

## Passo 5 — Build e deploy

```bash
git add .
git commit -m "feat(admin): painel admin completo - fase 3"
git push origin develop
```

Depois PR develop → main para deploy na Vercel.

---

## Acesso

- URL: `https://pix-sorteio.vercel.app/admin`
- Login: `https://pix-sorteio.vercel.app/admin/login`

---

## Funcionalidades entregues

| Feature                        | Status |
|-------------------------------|--------|
| Login admin com JWT + cookie   | ✅     |
| Proteção de rotas middleware   | ✅     |
| Dashboard com 4 métricas       | ✅     |
| Listagem de sorteios           | ✅     |
| Criar sorteio (CRUD)           | ✅     |
| Editar sorteio (CRUD)          | ✅     |
| Ativar sorteio (RASCUNHO→ATIVO)| ✅     |
| Congelamento de base SHA-256   | ✅     |
| Listagem de participantes      | ✅     |
| Busca de participantes         | ✅     |
| Logs de auditoria              | ✅     |
| Exportação CSV auditoria       | ✅     |
| Sidebar responsiva             | ✅     |
| Design Luxury Dark (ouro/menta)| ✅     |

---

## Alertas de impacto entre classes

- `CongelamentoService` muda status do sorteio para `AGUARDANDO_SORTEIO`
  → CotaService deve verificar esse status antes de reservar
- `AdminService.editarSorteio` permite mudar `totalCotas`
  → Se reduzir abaixo de `cotasVendidas`, vai gerar inconsistência
  → Valide no frontend antes de salvar
