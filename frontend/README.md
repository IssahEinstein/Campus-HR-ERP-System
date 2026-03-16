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
