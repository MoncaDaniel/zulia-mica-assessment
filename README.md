# MiCA Token Assessment Platform

A full-stack compliance assessment tool for evaluating crypto-asset tokens against the EU Markets in Crypto-Assets Regulation (MiCA — EU 2023/1114).

Built for Zulia Networks LLC by compliance analysts, for compliance analysts.

---

## Features

- 10-section guided assessment wizard covering all MiCA due-diligence areas
- Auto-scoring engine with configurable section weights
- PASS / REVIEW / FAIL flag computed from weighted overall score
- Draft → Submit → Review workflow with role-based access
- PDF report export with cover page, score table, and section details
- Full audit log for every user action
- Three roles: ANALYST, REVIEWER, ADMIN

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

## Local Setup

### 1. Clone and install

```bash
cd mica-assessment
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
```

### 3. Create the database

```bash
# Create the database (PostgreSQL)
createdb mica_assessment

# Run Prisma migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed demo users and an example assessment
npm run db:seed
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Accounts (seeded)

| Email | Password | Role |
|---|---|---|
| analyst@zulia.network | password123 | ANALYST |
| reviewer@zulia.network | password123 | REVIEWER |
| admin@zulia.network | password123 | ADMIN |

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

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/         # Sign-in page
│   ├── (dashboard)/
│   │   ├── dashboard/        # Assessment list with summary cards
│   │   └── assessments/
│   │       ├── new/          # Create assessment form
│   │       └── [id]/
│   │           ├── page.tsx  # 10-section wizard
│   │           └── report/   # Read-only report view
│   └── api/
│       ├── auth/[...nextauth]/
│       └── assessments/[id]/
│           ├── sections/     # POST: save section data + score
│           ├── submit/       # POST: compute overall score, move to SUBMITTED
│           ├── review/       # POST: approve or reject
│           └── export/       # GET: stream PDF
├── components/
│   ├── forms/                # One form component per section (S01–S10)
│   ├── assessment/           # WizardLayout, SectionNav, ScoreDisplay
│   ├── dashboard/            # AssessmentTable, StatusBadge
│   └── pdf/                  # ReportTemplate (@react-pdf/renderer)
├── lib/
│   ├── scoring.ts            # Section and overall score computation
│   ├── pdf.ts                # PDF generation wrapper
│   └── auth.ts               # NextAuth config
└── types/
    └── assessment.ts         # Zod schemas for all 10 sections
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

## PDF Export

PDFs are generated server-side via `@react-pdf/renderer` at `GET /api/assessments/[id]/export`. The report includes:

1. Cover page (token name, score, flag, analyst)
2. Executive summary with score table
3. One page per section with all field values
4. Conclusion with recommended next steps
5. Audit-proof footer on every page

---

## Production Deployment

### Environment variables needed

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<strong-random-secret>
```

### Build

```bash
npm run build
npm start
```

### Recommended hosting

- **Database**: Supabase, Neon, or Railway (PostgreSQL)
- **App**: Vercel, Railway, or Fly.io
- **File storage**: Not required (no file uploads in base version)
