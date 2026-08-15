<div align="center">

# Tinkers Lab Platform

A comprehensive device and lab management system for tracking equipment, bookings, tool checkouts, and inventory in a maker space environment.

[Features](#features) • [Quick Start](#quick-start) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

## Overview

The Tinkers Lab Platform is a robust web application built to streamline operations within a maker space or fabrication lab. It manages user roles, tracks physical equipment (across bookable and checkout tiers), handles project-based consumable tracking, and provides administrative oversight for inventory and maintenance. 

## Features

- **Equipment Management** — Track machines across bookable tiers (e.g., 3D printers, laser cutters) and checkout tiers (e.g., power tools, hand tools).
- **Booking & Checkout System** — Allow users to reserve calendar slots for heavy machinery or check out hand tools for project usage.
- **Project Tracking** — Require and track user projects to associate lab usage and consumable materials with specific initiatives.
- **Inventory & Maintenance** — Provide staff with dashboards to monitor stock levels, record maintenance, and track equipment health.
- **Role-Based Access** — Secure different sections of the app for Students, Faculty, Lab Assistants, and Super Admins.

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Usage

Start the local development server:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

## Project Structure

```
tinkers-lab-platform/
├── src/
│   ├── components/      # Shared React components (UI and layout)
│   ├── contexts/        # React contexts (e.g., AuthContext)
│   ├── features/        # Feature-based domains (bookings, equipment, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and configurations
│   ├── routes/          # Application routing definitions
│   ├── services/        # External services (Firebase + backend API)
│   ├── styles/          # Global CSS and Tailwind configurations
│   └── types/           # TypeScript type definitions
├── backend/             # Express API (Vercel) with Firebase Admin SDK
├── docs/                # Project documentation and specifications
├── firebase.json        # Firebase Hosting + Firestore/Storage rules config
└── package.json         # Dependencies and scripts
```

## Architecture

The platform is split across two hosts:

- **Frontend** — React + Vite SPA, deployed to **Firebase Hosting**. It talks directly to Firebase (Auth, Firestore, Storage) via the client SDK and to the backend API for privileged operations.
- **Backend API** — Express serverless function in `backend/`, deployed to **Vercel**, using the Firebase Admin SDK. Handles server-enforced operations (feedback rate limiting, overdue-checkout sweep).

For a complete look at the system design, data model, and security model, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Deployment

### Frontend (Firebase Hosting)

```bash
# 1. Set VITE_* env vars (see .env.example) and VITE_API_URL
# 2. Build
npm run build
# 3. Deploy
firebase deploy --only hosting
```

### Backend (Vercel)

```bash
cd backend
npm install
# Set env vars (Vercel dashboard or `vercel env add`):
#   FIREBASE_SERVICE_ACCOUNT  — Firebase Admin SDK service-account JSON
#   CORS_ORIGINS              — comma-separated allowed origins (e.g. https://<project>.web.app)
vercel --prod
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

No license specified.
