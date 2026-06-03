# MiCA Token Assessment Platform — Architecture

## Overview

A multi-tenant web application that guides compliance analysts through a structured 10-section assessment of crypto-asset tokens against the EU Markets in Crypto-Assets Regulation (MiCA). The platform produces a weighted compliance score, supports a draft → review → approved workflow, and exports formatted PDF reports.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server Components reduce client JS; RSC enable server-side PDF generation and DB access without a separate API layer where appropriate |
| Language | TypeScript 5 | End-to-end type safety; Prisma client types propagate to UI |
| Styling | Tailwind CSS 3 | Utility-first, zero runtime CSS, consistent with Zulia design language |
| Database | PostgreSQL 15 | JSON field support for flexible section data; ACID transactions for scoring; widely hosted (Supabase, Neon, Railway) |
| ORM | Prisma 5 | Type-safe queries; schema-first migrations; built-in seed support |
| Auth | NextAuth v4 (Auth.js) | Credentials + future OAuth; Prisma adapter for session/token persistence |
| PDF Export | @react-pdf/renderer | Server-side PDF generation via API route; no headless browser required |
| Forms | React Hook Form + Zod | Client-side validation with schema sharing between client and server |

---

## Folder Structure

```
mica-assessment/
├── prisma/
│   ├── schema.prisma          # Database models
│   └── seed.ts                # Initial users + demo assessment
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (fonts, providers)
│   │   ├── page.tsx           # Redirect → /dashboard
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # Sidebar + Navbar shell
│   │   │   ├── dashboard/page.tsx   # Assessment list
│   │   │   └── assessments/
│   │   │       ├── new/page.tsx     # Create assessment (step 0)
│   │   │       └── [id]/
│   │   │           ├── page.tsx     # Wizard (edit all sections)
│   │   │           ├── edit/page.tsx  # Alias for in-progress wizard
│   │   │           └── report/page.tsx  # Read-only report view
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       └── assessments/
│   │           ├── route.ts            # GET list, POST create
│   │           └── [id]/
│   │               ├── route.ts        # GET, PATCH, DELETE
│   │               ├── sections/route.ts  # POST upsert section data
│   │               ├── submit/route.ts    # POST → status=SUBMITTED
│   │               ├── review/route.ts    # POST → status=APPROVED|REJECTED
│   │               └── export/route.ts   # GET → PDF stream
│   ├── components/
│   │   ├── ui/               # Primitive components (Button, Input, Select …)
│   │   ├── layout/           # Navbar, Sidebar
│   │   ├── assessment/       # WizardLayout, SectionNav, ScoreDisplay
│   │   ├── forms/            # One component per assessment section
│   │   │   └── shared/       # YesNoField, YesNoNAField
│   │   ├── dashboard/        # AssessmentTable, StatusBadge
│   │   └── pdf/              # ReportTemplate (react-pdf)
│   ├── lib/
│   │   ├── auth.ts           # NextAuth config + role helpers
│   │   ├── prisma.ts         # Singleton Prisma client
│   │   ├── scoring.ts        # Section and overall score calculation
│   │   ├── pdf.ts            # PDF generation helper
│   │   └── utils.ts          # cn(), formatDate(), etc.
│   └── types/
│       ├── index.ts          # Re-exports
│       └── assessment.ts     # Domain types + Zod schemas
```

---

## Database Design

### Models (Prisma)

```
User
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  password    String   (bcrypt hash)
  role        Role     (ANALYST | REVIEWER | ADMIN)
  createdAt   DateTime

Assessment
  id            String   @id @default(cuid())
  tokenName     String
  ticker        String?
  status        Status   (DRAFT | SUBMITTED | APPROVED | REJECTED)
  overallScore  Float?
  flag          Flag?    (PASS | REVIEW | FAIL)
  createdById   String → User
  reviewedById  String? → User
  createdAt     DateTime
  updatedAt     DateTime

AssessmentSection
  id          String   @id @default(cuid())
  assessment  → Assessment
  sectionKey  String   (s01_general_info … s10_mica_compliance)
  sectionName String
  sectionScore Float?
  data        Json     (all field values for this section)
  completedAt DateTime?

AssessmentField  (denormalised for audit / scoring queries)
  id          String
  section     → AssessmentSection
  fieldKey    String
  fieldValue  String
  score       Float?   (0 | 1 | null for N/A)
  notes       String?

AuditLog
  id           String
  assessment   → Assessment
  user         → User
  action       String   (CREATED | SECTION_SAVED | SUBMITTED | APPROVED | REJECTED | EXPORTED)
  metadata     Json?
  timestamp    DateTime
```

### Status Flow

```
[DRAFT] ──analyst saves sections──► [DRAFT]
[DRAFT] ──analyst submits──────────► [SUBMITTED]
[SUBMITTED] ──reviewer approves────► [APPROVED]
[SUBMITTED] ──reviewer rejects─────► [REJECTED]
[REJECTED] ──analyst revises──────► [DRAFT]
```

---

## Scoring Engine (`src/lib/scoring.ts`)

### Per-field scoring

| Answer | Points | Denominator |
|---|---|---|
| Yes | 1 | +1 |
| No | 0 | +1 |
| N/A | – | excluded |

Some fields are **inverted** (No = compliant = 1 point): `inbuiltAnonymisation`, `securityIncidents`, `illicitActivities`, `passiveRevenueRights`.

### Section score

```
sectionScore = (sumPoints / eligibleFields) * 100
```

### Overall score

Weighted average over the 7 scored sections only:

| Section | Weight |
|---|---|
| S10 MiCA Compliance | 25% |
| S08 AML / Financial Crime | 20% |
| S06 Whitepaper | 15% |
| S02 Issuer & Legal | 15% |
| S04 Tokenomics | 10% |
| S09 Technical | 10% |
| S05 Team & Advisors | 5% |

Sections S01, S03, S07 are completeness-tracked but not part of the weighted overall score.

### Flag thresholds

| Score | Flag |
|---|---|
| > 75% | PASS |
| 50–75% | REVIEW |
| < 50% | FAIL |

---

## Authentication & Authorisation

- **NextAuth v4** with `CredentialsProvider` (email + bcrypt password)
- **Prisma adapter** persists sessions to PostgreSQL
- **Role middleware** (`src/middleware.ts`) protects routes:
  - `/dashboard`, `/assessments/*` → any authenticated user
  - `review` actions → REVIEWER or ADMIN only
  - User management → ADMIN only
- Session includes `user.role` for client-side UI gating

---

## PDF Export

- `GET /api/assessments/[id]/export` reads full assessment + sections from DB
- Passes data to `src/lib/pdf.ts` which calls `@react-pdf/renderer`'s `renderToBuffer()`
- Response: `Content-Type: application/pdf`, streamed as binary

The `ReportTemplate` component (`src/components/pdf/ReportTemplate.tsx`) renders:
1. Cover page (token name, score, flag, date)
2. Executive summary (score table by section)
3. One page per section with all field values and notes
4. Signature / reviewer block

---

## Key Design Decisions

1. **Section data stored as JSON** — each `AssessmentSection.data` holds the full form payload as JSON. This avoids a 200-column table while still allowing `AssessmentField` rows to be written for scoring queries and audit.

2. **Client-side wizard, server-side save** — the multi-step wizard runs entirely in the browser; each step auto-saves via `PATCH /api/assessments/[id]/sections`. No page navigation loss.

3. **Scoring on save** — section scores are recomputed every time a section is saved; overall score is recomputed on submit. This keeps the dashboard score current without a background job.

4. **No external scoring service** — all scoring logic is pure TypeScript in `src/lib/scoring.ts`, making it auditable and testable without network calls.

5. **Role separation** — analysts own creation and drafting; reviewers cannot edit content, only approve/reject; admins manage users and can force-approve.
