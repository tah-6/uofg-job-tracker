# UofG (or anyone) Job Tracker

A lightweight, mobile-friendly job application tracker with both Kanban and table views. Built to replace error-prone spreadsheets and make deadlines easy to track.

## Features

- Kanban board with drag-and-drop status updates
- Table view with search, filters, and bulk actions
- CSV/JSON import/export
- Local-first storage (no account required)
- Dark mode toggle
- PWA-ready installability

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## How It Works

- **Statuses**: Saved → Submitted → In Progress → Interview → Offer → Rejected
- **Deadlines**: Due-soon warnings are shown in the table view
- **Import**: Upload CSV/JSON to bootstrap your tracker

## CSV Import Details

CSV parsing happens in `src/utils/io.ts`. It handles quoted fields correctly (e.g., titles with commas) to avoid corrupted data.

## Deployment

This is a standard Next.js app and can be deployed to Vercel or Netlify.

```bash
npm run build
npm run start
```

## Tech Stack

Next.js, React, TypeScript, Tailwind CSS, and @dnd-kit.
