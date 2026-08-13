# MiCA Token Assessment Platform

**A full-stack compliance assessment tool for evaluating crypto-asset tokens against the EU Markets in Crypto-Assets Regulation (MiCA — Regulation (EU) 2023/1114).**

Built as part of [Zulia Networks](https://github.com/MoncaDaniel), a compliance advisory practice for crypto-asset issuers, and used in a real client engagement to assess a token issuance against MiCA's whitepaper, issuer, and AML requirements.

> This repository contains no client data. See [Confidentiality note](#confidentiality-note) below.

---

## Case study: why this exists

MiCA due diligence on a token project is, in practice, a compliance analyst reading a whitepaper, a GitHub repo, and a website, then answering the same ~40 structured questions every time — issuer identification, tokenomics disclosure, AML controls, whitepaper completeness under Art. 19, and so on. Doing that by hand in a spreadsheet doesn't scale past one or two engagements, and it produces no consistent audit trail.

This platform was built to run that process as software:

- An analyst pastes in the project's whitepaper URL, website, and GitHub repo.
- Claude (via the Anthropic Messages API, using structured tool calls rather than free-text generation) reads the source documents and pre-fills all ~40 scored fields across the 10 MiCA sections — each with a **Yes/No/N/A answer, a confidence score, a direct citation from the source text, and a one-sentence justification**. The analyst reviews and overrides the AI's suggestions field by field; nothing is auto-approved.
- A weighted scoring engine converts the reviewed answers into a PASS / REVIEW / FAIL flag.
- A Draft → Submit → Review workflow (Analyst → Reviewer → Admin) mirrors how a real compliance team signs off on an assessment, with a full audit log of who did what.
- The final assessment exports as a formatted PDF report a client or regulator can actually read.

It was used to run a real MiCA compliance assessment for a client's token project. That engagement is the reason most of the design decisions below exist — the AI pre-fill exists because re-reading the same whitepaper structure by hand for every field was the actual bottleneck; the citation+confidence fields exist because "the AI said so" is not an acceptable answer in a compliance report; the review workflow exists because a single analyst's judgment shouldn't be the only check before something goes to a client.

---

## Why this is relevant beyond crypto compliance

This isn't really a MiCA tool that happens to use AI — it's a template for a broader problem: **using an LLM to accelerate a structured legal/regulatory review without letting it replace the human judgment or the audit trail.** The specific patterns here (tool-call extraction instead of free text, mandatory citation + confidence per field, human review before anything is "approved," full action logging) are the same patterns that matter for CRA/NIS2/AI Act/Data Act compliance tooling generally — see [eu-digital-compliance-reference](https://github.com/MoncaDaniel/eu-digital-compliance-reference), [oss-license-compliance-reference](https://github.com/MoncaDaniel/oss-license-compliance-reference), and [software-licensing-contracts-reference](https://github.com/MoncaDaniel/software-licensing-contracts-reference) for the same philosophy applied to other EU digital regulation.

---

## Confidentiality note

- This repository contains **no real client data**. The only seeded content is a synthetic "Sample Token" record and three demo accounts (see below).
- `.env` (real credentials) and `uploads/` (user-submitted documents in any real deployment) are git-ignored and were never committed — confirmed against the full commit history before this repository was made public.
- The actual client engagement that used this platform is referenced here only in general terms. No client name, token name, or document from that engagement appears in this codebase.

---

## Features

- 10-section guided assessment wizard covering all MiCA due-diligence areas
- AI-assisted pre-fill: Claude extracts and cites evidence for ~40 fields from whitepaper/website/repo URLs, with a confidence score per field
- Auto-scoring engine with configurable section weights
- PASS / REVIEW / FAIL flag computed from weighted overall score
- Draft → Submit → Review workflow with role-based access (Analyst / Reviewer / Admin)
- PDF report export with cover page, score table, and section-by-section detail
- Full audit log for every user action

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server Components for server-side PDF generation and DB access without a separate API layer |
| Language | TypeScript 5 | End-to-end type safety; Prisma types propagate to the UI |
| AI extraction | Claude (Anthropic Messages API), structured tool calls | Forces every field to come back as `{answer, confidence, citation, justification}` instead of free text — see [`src/lib/ai/extraction.ts`](src/lib/ai/extraction.ts) and [`src/lib/ai/prompts.ts`](src/lib/ai/prompts.ts) |
| Database | PostgreSQL 15 + Prisma 5 | Type-safe queries, schema-first migrations |
| Auth | NextAuth v4 | Credentials-based, role-aware sessions |
| PDF export | `@react-pdf/renderer` | Server-side PDF generation via API route |
| Forms | React Hook Form + Zod | Schema validation shared between client and server |

Full architecture notes: [ARCHITECTURE.md](ARCHITECTURE.md). Full field-by-field specification for all 10 MiCA sections: [SPEC.md](SPEC.md).

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn
- An Anthropic API key (only required for the AI pre-fill feature — the manual wizard works without it)

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/MoncaDaniel/zulia-mica-assessment.git
cd zulia-mica-assessment
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/mica_assessment"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
ANTHROPIC_API_KEY="sk-ant-..."   # optional, only needed for AI pre-fill
```

### 3. Create the database

```bash
createdb mica_assessment
npm run db:migrate
npm run db:generate
npm run db:seed   # seeds demo users + one synthetic "Sample Token" assessment
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Accounts (seeded, local dev only)

| Email | Password | Role |
|---|---|---|
| analyst@mica-esma.tool | password123 | ANALYST |
| reviewer@mica-esma.tool | password123 | REVIEWER |
| admin@mica-esma.tool | password123 | ADMIN |

**Change these before any real deployment** — they exist purely to let a local `npm run dev` instance be explored end-to-end.

---

## Database Commands

```bash
npm run db:migrate    # Run pending migrations
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:seed       # Seed demo data
npm run db:studio     # Open Prisma Studio (visual DB browser)
npm run db:reset      # Reset DB and re-run all migrations (DESTRUCTIVE)
```

---

## Scoring Logic

| Section | Weight |
|---|---|
| S10 MiCA Compliance | 25% |
| S08 AML / Financial Crime | 20% |
| S06 Whitepaper | 15% |
| S02 Issuer & Legal | 15% |
| S04 Tokenomics | 10% |
| S09 Technical | 10% |
| S05 Team & Advisors | 5% |

- **Yes** = 1 point, **No** = 0 points, **N/A** = excluded from denominator
- Some fields are **inverted** (No = compliant): `inbuiltAnonymisation`, `securityIncidents`, `illicitActivities`, `passiveRevenueRights`
- Section score = `(points / eligible_fields) × 100`
- Overall score = weighted average of the 7 scored sections

| Score | Flag |
|---|---|
| > 75% | PASS |
| 50–75% | REVIEW |
| < 50% | FAIL |

---

## Disclaimer

This tool produces a structured compliance **assessment aid**, not a compliance certification or legal opinion. The AI pre-fill is a starting draft for an analyst to verify against source documents, not a substitute for that review. Any PASS/REVIEW/FAIL flag reflects the weighted scoring model above, not a determination by qualified legal counsel. Real MiCA compliance decisions should be reviewed by qualified counsel before being relied upon.

---

## Production Deployment

### Environment variables needed

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<strong-random-secret>
ANTHROPIC_API_KEY=<your-key>
```

### Build

```bash
npm run build
npm start
```

### Recommended hosting

- **Database**: Supabase, Neon, or Railway (PostgreSQL)
- **App**: Vercel, Railway, or Fly.io
