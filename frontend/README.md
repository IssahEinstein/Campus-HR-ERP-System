# Campus Job ERP — Frontend

This folder contains the Vite React frontend for the Campus Job ERP prototype.

Quick start (local):

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173/
```

Build for production:

```bash
npm run build
# Preview the production build:
npm run preview
```

Notes:
- Uses Tailwind CSS via PostCSS. `postcss.config.cjs` and `tailwind.config.cjs` are present in this folder.
- Dev dependencies include `tailwindcss` and `autoprefixer` to allow standalone installs for reviewers.

## Deploy To Vercel

This frontend is ready to deploy on Vercel.

### 1) Import project

1. Push your repo to GitHub.
2. In Vercel, click "Add New Project" and import the repo.
3. Set the Root Directory to `frontend`.

### 2) Build settings

The project includes `vercel.json` with:

- Build command: `npm run build`
- Output directory: `dist`
- SPA rewrite: all routes -> `index.html`

This rewrite is required because the app uses React Router with browser history.

### 3) Environment variables

In Vercel Project Settings -> Environment Variables, add:

- `VITE_API_URL` = your backend origin (example: `https://api.your-domain.com`)

The frontend API client calls `${VITE_API_URL}/api/...`.

### 4) Backend requirements

Make sure your backend allows requests from your Vercel domain and is configured for cross-origin auth/cookies if you rely on refresh-token cookies.

### 5) Deploy

Trigger deployment from Vercel. After it completes:

1. Open the deployment URL.
2. Test direct navigation to routes like `/login`, `/worker/dashboard`, `/supervisor/dashboard`.
