# Academic Similarity Checking System - Full Documentation

## 1. Overview

This platform is a university-level assignment similarity system that:

- Accepts PDF and DOCX uploads
- Supports bulk upload for large lecturer marking batches
- Extracts and cleans text
- Runs internal similarity analysis against stored submissions
- Adds free external-source enrichment using open scholarly APIs
- Returns score, color indicator, risk level, and match details
- Supports lecturer marking workflow (`status + comments + mark out of 10`)

This implementation is fully free/open in runtime dependencies for external checks (no paid plagiarism provider API).

## 2. Tech Stack

## Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- Axios + React Router

## Backend
- Node.js + Express + TypeScript
- Prisma + PostgreSQL
- JWT auth
- multer for uploads
- pdf-parse + mammoth for text extraction

## Free external-source pipeline
- OpenAlex API
- Crossref REST API
- Semantic Scholar Graph API

## 3. High-Level Flow

1. Lecturer uploads assignment (`/api/submissions/upload`)
2. Backend extracts/cleans text
3. Internal similarity score is computed and stored immediately
4. If `ENABLE_EXTERNAL_SCAN=true`, backend asynchronously queries free scholarly APIs
5. Candidate sources are locally scored (token-overlap/Jaccard style)
6. External source matches are saved
7. Final result score becomes the max of internal score and external score
8. Frontend Result page shows:
   - final score + color + risk
   - review/marking fields out of 10
   - internal matched passages
   - external scan status + source matches

## 4. Score Mapping

- `0-9` -> grey -> Minimal Similarity
- `10-24` -> green -> Low Similarity
- `25-39` -> yellow -> Moderate Similarity
- `40-59` -> orange -> High Similarity
- `60-100` -> red -> Critical Similarity

## 5. Project Structure

## Root
- `frontend/`
- `backend/`
- `docs/`

## Frontend (`frontend/src`)
- `components/`
- `pages/`
- `services/`
- `hooks/`
- `types/`
- `utils/`
- `routes/`

## Backend (`backend/src`)
- `config/`
- `controllers/`
- `routes/`
- `middleware/`
- `services/`
- `utils/`
- `types/`

## 6. Data Model (Prisma)

Key entities:

- `User`
- `Submission`
- `Result`
- `ExternalScan`
- `ExternalSourceMatch`

Relationships:

- `Submission` -> one `Result`
- `Submission` -> optional one `ExternalScan`
- `ExternalScan` -> many `ExternalSourceMatch`

## 7. Environment Variables

## Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

## Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/academic_similarity?schema=public
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
DEFAULT_ADMIN_EMAIL=admin@university.edu
DEFAULT_ADMIN_PASSWORD=ChangeMe123!

# Free external-source scan settings
ENABLE_EXTERNAL_SCAN=false
ENABLE_INTERNAL_SIMILARITY=false
OPENALEX_API_KEY=
SEMANTIC_SCHOLAR_API_KEY=
EXTERNAL_SCAN_TIMEOUT_MS=12000
```

Notes:
- `OPENALEX_API_KEY` is optional but recommended for stable higher-limit usage.
- `SEMANTIC_SCHOLAR_API_KEY` is optional; API may work with stricter limits without it.

## 8. Local Setup

## 8.1 PostgreSQL

1. Ensure PostgreSQL is running on `localhost:5432`
2. Create DB:

```sql
CREATE DATABASE academic_similarity;
```

## 8.2 Backend

```bash
cd backend
cp .env.example .env
npm install --include=dev
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## 8.3 Frontend

```bash
cd frontend
cp .env.example .env
npm install --include=dev
npm run dev
```

URLs:
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`

## 9. API Endpoints

## Auth
- `POST /api/auth/login`
- `GET /api/auth/me`

## Submissions
- `POST /api/submissions/upload`
- `POST /api/submissions/upload/bulk`
- `GET /api/submissions/stats`
- `GET /api/submissions`
- `GET /api/submissions/:id`

## Results
- `GET /api/results/:submissionId`
- `PATCH /api/results/:submissionId/mark`
- `POST /api/results/:submissionId/rescan`

Result payload can include:
- internal similarity output
- matched internal passages
- external scan status
- external source match records

## 10. External Free-Source Scan Logic

When enabled:

1. Extract top weighted query terms from submission cleaned text
2. Query OpenAlex/Crossref/Semantic Scholar
3. Build candidate text (`title + abstract`)
4. Compute local overlap-based similarity against submission text
5. Persist top ranked candidates as `ExternalSourceMatch`
6. Update effective score/risk in `Result`

Important:
- This is a fully free self-hosted strategy.
- Coverage and precision are lower than proprietary web-scale plagiarism indexes.

## 11. Frontend Behavior

## Dashboard
- Submission totals, pending reviews, marked count, average mark `/10`

## Upload Page
- Single and bulk upload handling

## Result Page
- score + color + risk
- marking controls (`mark /10`, status, comments)
- internal matched snippets with highlighted terms
- external scan status
- external source matches (title/url/similarity/snippet)

## History Page
- list of submissions + risk + review status + marks

## 12. Security and Compliance Notes

- JWT auth on protected APIs
- Lecturer/admin access filtering
- Upload type and size validation
- Environment-based secrets

For production hardening:

1. Add request rate limiting
2. Add audit logs for access and actions
3. Encrypt sensitive at-rest data
4. Implement document retention policies
5. Add institution-specific compliance controls (FERPA/GDPR policy alignment)

## 13. Operations and Troubleshooting

## Build checks

```bash
cd backend && npm run build
cd frontend && npm run build
```

## Missing dev tools (`tsc`, `tsx`, `postcss`)

```bash
npm install --include=dev
```

## Port already in use

```powershell
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

## Database unreachable

- Verify PostgreSQL service is running
- Verify `DATABASE_URL`

## External scan not running

- Confirm `ENABLE_EXTERNAL_SCAN=true`
- Verify outbound internet connectivity from backend
- Verify API keys (if set) are valid

## 14. Current Scope and Next Upgrades

Implemented now:

- internal similarity + risk mapping
- internal passage highlights
- free external scholarly-source enrichment
- merged final scoring
- source match UI rendering
- lecturer marking workflow (out of 10)
- bulk upload + marking stats endpoint

Recommended next:

1. Add local vector index (FAISS/OpenSearch) for faster candidate retrieval
2. Add asynchronous queue worker (BullMQ/Redis)
3. Add stronger semantic re-ranking (sentence-transformers model service)
4. Add report export (PDF/CSV)
5. Add institutional analytics dashboard

## 15. Default Seed Account

- Email: `admin@university.edu`
- Password: `ChangeMe123!`

Change credentials immediately outside local development.
