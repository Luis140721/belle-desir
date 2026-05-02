# Local Development

This setup lets you test locally without changing production variables in Vercel, Render, or GitHub.

## Environment files

Tracked files:

- `backend/.env.example`: documents backend variables with safe placeholder values.
- `frontend/.env.example`: documents frontend `VITE_API_URL`.
- `admin/.env.example`: documents admin `VITE_API_URL`.

Ignored local files:

- `backend/.env.local`
- `frontend/.env.local`
- `admin/.env.local`
- `backend/.env`

The backend loads local variables in this order when not in production:

1. Existing shell variables
2. `backend/.env.local`
3. `backend/.env`
4. Code defaults for safe local-only values

`dotenv` does not override shell variables, so temporary PowerShell values still win.

## Backend

```powershell
cd C:\Users\romer\OneDrive\Desktop\belle-desire\backend
npm.cmd run dev
```

The backend still requires a valid `DATABASE_URL`. Your current `backend/.env` can continue providing it as a fallback.

Local development defaults are provided for:

- `NODE_ENV=development`
- `PORT=3001`
- `FRONTEND_URL=http://localhost:5173`
- `ADMIN_URL=http://localhost:5174`
- JWT development secrets

Production still requires real JWT, Cloudinary, Bold, frontend, and admin variables from the hosting dashboard.

## Frontend

```powershell
cd C:\Users\romer\OneDrive\Desktop\belle-desire\frontend
npm.cmd run dev
```

Local URL: `http://localhost:5173`

The frontend uses `VITE_API_URL` from `frontend/.env.local`. If it is missing, it falls back to `http://localhost:3001`.

## Admin

```powershell
cd C:\Users\romer\OneDrive\Desktop\belle-desire\admin
npm.cmd run dev
```

Local URL: `http://localhost:5174`

The admin uses `VITE_API_URL` from `admin/.env.local`. If it is missing, it falls back to `http://localhost:3001`.

## Before pushing

Run these checks before pushing to GitHub/Vercel:

```powershell
git status --short
cd backend; npm.cmd run build
cd ..\frontend; npm.cmd run build
cd ..\admin; npm.cmd run build
```

Confirm that no real secret files appear in `git status`.
