# Academic Similarity Checking System

Production-minded full-stack assignment similarity checking platform for lecturers/admins.

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env
npm install --include=dev
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install --include=dev
npm run dev
```

## What It Does

- Lecturer-only assignment review workflow (no student-facing marking portal)
- Single and bulk upload processing for PDF/DOCX assignments
- Similarity scoring with risk mapping
- Marking workflow with status + lecturer comments + mark out of 10
- Optional free external source enrichment using OpenAlex + Crossref + Semantic Scholar APIs
- Dashboard, history, and result review UI optimized for lecturer throughput

## Full Documentation

See complete technical and operational documentation in:

- [Full Project Documentation](docs/FULL_DOCUMENTATION.md)
