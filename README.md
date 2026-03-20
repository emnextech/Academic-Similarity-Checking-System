# Academic Similarity Checking System

Full-stack assignment similarity checking platform for lecturers and admins.

## Stack

- Frontend: React, TypeScript, Tailwind CSS, Vite
- Backend: Node.js, Express, TypeScript, Prisma
- Database: PostgreSQL
- Auth: JWT
- File/Text processing: multer, pdf-parse, mammoth

## API Endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/submissions/upload`
- `GET /api/submissions`
- `GET /api/submissions/:id`
- `GET /api/results/:submissionId`

## Similarity Mapping

- `0-9` = `grey` = `Minimal Similarity`
- `10-24` = `green` = `Low Similarity`
- `25-39` = `yellow` = `Moderate Similarity`
- `40-59` = `orange` = `High Similarity`
- `60-100` = `red` = `Critical Similarity`

## Setup

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/academic_similarity?schema=public
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
DEFAULT_ADMIN_EMAIL=admin@university.edu
DEFAULT_ADMIN_PASSWORD=ChangeMe123!
```
