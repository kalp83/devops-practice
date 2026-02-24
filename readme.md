## DevTrack – DevOps Task & Deployment Tracker

DevTrack is a small, full‑stack project to help you practice **DevOps, backend, and frontend deployment workflows**. It provides a JWT‑secured REST API (Node.js, Express, MongoDB) and two frontends:

- A simple React/Vite client (for basic CRUD testing)
- A **Next.js + shadcn UI** Kanban dashboard with login, drag‑and‑drop columns, and task image attachments

The app models a DevOps task board with four statuses: **To Do**, **In Progress**, **In Review**, and **Done**. Each task can have priority, description, status, and an optional screenshot/diagram.

High level:

- **Backend (`backend/`)**
  - Node.js + Express + MongoDB (Mongoose)
  - JWT auth with token table (`AuthToken`) for logout / invalidation
  - Task API with image upload (Multer, served from `/uploads`)
  - Profile API with avatar upload

- **Frontend (`frontend-nextjs/`)**
  - Next.js App Router + Tailwind + shadcn UI
  - Login screen calling `/api/auth/login`
  - Kanban board consuming `/api/tasks` with drag‑and‑drop between columns
  - Task creation dialog with priority, status and image upload

This repo is intentionally small and opinionated so you can focus on **CI/CD, containerization, and AWS hosting** (e.g. ECS/EKS/EC2 + S3/CloudFront) without fighting a huge codebase.
