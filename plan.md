Academic Similarity Checking System — Full Development Plan
1. Project overview

The Academic Similarity Checking System is a university-focused web platform for reviewing student assignments and generating a similarity score based on document comparison. The system avoids unreliable AI-detection claims and instead focuses on a more defensible and practical academic integrity workflow.

The platform will allow lecturers or administrators to upload assignments in PDF or DOCX format, extract and clean the text, compare the text against stored submissions or configured reference sources, and return a final result with only three clear outputs:

Similarity Score

Color Indicator

Risk Level

The product should feel modern, premium, and trustworthy, with a Vercel-inspired UI built using React, TypeScript, Tailwind CSS, and Vite, and a Node.js backend hosted on DigitalOcean.

2. Main objective

The goal is to build a clean, scalable, and university-ready system that helps institutions review assignment originality through similarity scoring.

The system should:

accept assignment uploads

extract readable text from PDF and DOCX files

clean and normalize the extracted text

compare the text against stored assignments or repository content

calculate a percentage similarity score

map the score to a color and risk level

store results for future review and history tracking

This system is not meant to act as a disciplinary judge. It is a lecturer-support tool for fast, structured originality review.

3. Final result format

The result output must remain intentionally simple.

Final displayed result

Similarity Score: percentage

Color: grey, green, yellow, orange, or red

Risk Level: text label

Score mapping

0–9% → Grey → Minimal Similarity

10–24% → Green → Low Similarity

25–39% → Yellow → Moderate Similarity

40–59% → Orange → High Similarity

60–100% → Red → Critical Similarity

This mapping should be implemented in the backend and returned consistently to the frontend.

4. Full tech stack
Frontend

React

TypeScript

Tailwind CSS

Vite

React Router

Axios or Fetch API

Zustand or Context API for lightweight state

Lucide React for icons

Backend

Node.js

Express.js

TypeScript preferred for backend as well

Multer for uploads

pdf-parse for PDF extraction

mammoth for DOCX extraction

PostgreSQL for persistent data

Prisma ORM or Sequelize

JWT authentication

bcrypt for password hashing

cors, helmet, morgan, dotenv

optional: node-cron / BullMQ later for job queues

Infrastructure

Frontend deployment: Vercel

Backend deployment: DigitalOcean

Database: PostgreSQL

File storage: DigitalOcean Spaces or local storage for MVP

Reverse proxy: Nginx on backend server

SSL: Let’s Encrypt

5. Monorepo / project structure

The root folder should contain two top-level directories:

academic-similarity-system/
│
├── frontend/
├── backend/
├── .gitignore
├── README.md
└── docs/

This structure keeps both applications in one repository while still separating responsibilities clearly.

6. Frontend folder structure
frontend/
│
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── upload/
│   │   └── results/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── UploadAssignment.tsx
│   │   ├── ResultPage.tsx
│   │   ├── SubmissionHistory.tsx
│   │   └── NotFound.tsx
│   ├── routes/
│   ├── hooks/
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   └── submissionService.ts
│   ├── store/
│   ├── utils/
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── .env
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
7. Backend folder structure
backend/
│
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── db.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── submission.controller.ts
│   │   └── result.controller.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── submission.routes.ts
│   │   └── result.routes.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── upload.middleware.ts
│   ├── services/
│   │   ├── extractText.service.ts
│   │   ├── cleanText.service.ts
│   │   ├── similarity.service.ts
│   │   ├── scoreMap.service.ts
│   │   └── storage.service.ts
│   ├── utils/
│   │   ├── tokenizer.ts
│   │   ├── textHelpers.ts
│   │   └── logger.ts
│   ├── models/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── app.ts
│   └── server.ts
│
├── uploads/
├── .env
├── package.json
├── tsconfig.json
└── nodemon.json
8. How frontend and backend communicate via .env

They do not communicate through .env directly. The .env files hold configuration values that allow the frontend and backend to know where to send requests and how to connect to services.

Frontend .env
VITE_API_BASE_URL=http://localhost:5000/api

In production:

VITE_API_BASE_URL=https://api.yourdomain.com/api

The frontend uses this value when making API requests.

Example:

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
Backend .env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/similarity_db
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads

Production example:

PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/similarity_db
JWT_SECRET=strong_secret
CLIENT_URL=https://yourfrontenddomain.com
UPLOAD_DIR=uploads

So the communication flow is:

frontend reads VITE_API_BASE_URL

frontend sends requests to backend

backend reads its own .env for database, auth, CORS, and server settings

9. Core system modules
A. Authentication module

Purpose:

secure lecturer/admin access

manage login sessions

protect dashboard and submission routes

Features:

login

logout

JWT token auth

role-based access later

B. File upload module

Purpose:

accept PDF and DOCX files

validate file type and size

store uploads safely

Features:

drag-and-drop upload

file validation

upload progress state

backend file handling via Multer

C. Text extraction module

Purpose:

read text from uploaded files

Logic:

if PDF → use pdf-parse

if DOCX → use mammoth

return raw extracted text

D. Text cleaning module

Purpose:

normalize extracted text before comparison

Cleaning should include:

lowercase conversion

whitespace normalization

punctuation cleanup

duplicate spacing removal

optional exclusion of reference section

optional exclusion of quoted blocks

normalization of line breaks

E. Similarity engine

Purpose:

compare current document against existing stored texts

MVP logic can use:

n-gram matching

sentence chunk comparison

cosine-like text comparison

weighted overlap scoring

It should be accurate enough for initial deployment, while keeping room for future semantic improvements.

F. Score mapping module

Purpose:

convert numeric score into color and risk level

Example output:

{
  "similarityScore": 34,
  "color": "yellow",
  "riskLevel": "Moderate Similarity"
}
G. Submission history module

Purpose:

store uploaded assignments and result history

allow lecturers to revisit past checks

Stored data:

file name

uploader

upload date

score

color

risk level

extracted text reference

comparison result metadata

10. Database design

A simple MVP schema could include:

Users table

id

name

email

password_hash

role

created_at

updated_at

Submissions table

id

user_id

file_name

file_type

file_path

extracted_text

similarity_score

color

risk_level

created_at

ComparisonSources table

id

submission_id

matched_submission_id

matched_percentage

created_at

You can simplify further for MVP, but this gives you a clean foundation.

11. Main backend flow
Assignment checking flow

user uploads assignment from frontend

frontend sends multipart request to backend

backend validates file

backend stores uploaded file

backend extracts text

backend cleans text

backend loads previous submissions or reference texts

backend runs similarity comparison

backend calculates final score

backend maps score to color and risk level

backend stores result in database

backend returns final result JSON to frontend

12. API design
Auth routes

POST /api/auth/login

POST /api/auth/register
optional for MVP

GET /api/auth/me

Submission routes

POST /api/submissions/upload

GET /api/submissions

GET /api/submissions/:id

Result routes

GET /api/results/:submissionId

Example response:

{
  "id": "sub_001",
  "fileName": "assignment1.docx",
  "similarityScore": 34,
  "color": "yellow",
  "riskLevel": "Moderate Similarity",
  "createdAt": "2026-03-20T10:30:00Z"
}
13. UI and UX plan

The UI should follow a Vercel-inspired design language: restrained, spacious, calm, modern, precise.

Design principles

lots of whitespace

thin borders

medium corner radius

minimal shadow use

strong typographic hierarchy

blue as accent only

simple layouts with clear spacing

Color palette

#ffffff — white

#f5f7fa — soft background

#e5e7eb — borders

#6b7280 — muted text

#111827 — strong text

#2563eb — accent blue

Typography

font: Inter

headings: bold, modern, not oversized

body: clean and readable

labels: small, neutral, clear

Layout

left sidebar navigation

topbar with page title and user area

content wrapped in wide, centered container

cards for summary and results

tables for history and listing

Main pages
Dashboard

Shows:

total submissions

latest checks

recent similarity results

status overview

Upload page

Shows:

drag-and-drop upload zone

supported formats

upload action

processing state

Result page

Shows:

large similarity score

color state

risk level

submission metadata

Submission history

Shows:

table of checked files

search

filter by risk level

date sorting

14. Hero result card design

The similarity result card is the core visual component.

It should contain:

large percentage text

score color applied directly to percentage

compact status dot or badge

risk level below percentage

minimal white card with soft border

Example feel:

34%
Moderate Similarity

No clutter. No heavy charts in the hero block. Keep it immediate and confident.

15. MVP scope

The MVP should include only what is necessary to make the system usable.

MVP features

lecturer login

upload PDF/DOCX

extract text

compare against stored submissions

calculate similarity percentage

map color and risk level

save result to database

show dashboard and submission history

Not in MVP

advanced paraphrase detection

public web scanning

deep academic source indexing

institutional archive syncing

bulk uploads

analytics-heavy admin reports

16. Future enhancements

After MVP, the platform can evolve into a more advanced academic review system.

Possible future additions:

paraphrase-aware similarity detection

semantic matching

institutional repository integration

module/course grouping

assignment-level analytics

batch submission upload

plagiarism source breakdown

lecturer annotations

exportable PDF reports

17. Development phases
Phase 1 — Planning and setup

define requirements

create repository

initialize frontend and backend

set up shared naming conventions

create .env structure

set up PostgreSQL

define Prisma schema

Phase 2 — Backend core

auth setup

upload endpoints

text extraction

text cleaning

similarity engine

score mapping

database persistence

Phase 3 — Frontend core

layout

login page

dashboard

upload page

result page

history page

API integration

Phase 4 — Testing and refinement

validate file handling

test large text inputs

improve error handling

add loading states

refine UX and visual polish

Phase 5 — Deployment

deploy frontend on Vercel

deploy backend on DigitalOcean

configure domain/subdomain

set environment variables

enable SSL

test production flow

18. Project success criteria

The system is successful if it can:

accept university assignment files reliably

process them without crashing

return a clear similarity score

map that score correctly to color and risk level

store submissions and results consistently

provide a clean, trustworthy experience for lecturers