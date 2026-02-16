# Dealer Distributor Rate List - Frontend

React (Vite) portal for secure dealer document management using Google Identity Services, Google Sheets API, and Google Drive API.

## Features

- Premium Google OAuth login screen (GIS)
- Strict allowlist access control
- Extra server-side ID token verification via Apps Script
- Session stored in `sessionStorage` with expiry handling
- Dashboard with:
  - Top bar + user email + logout
  - `ADD NEW DEALER DOCS` modal
  - Full table (no pagination)
  - Search + station filter + marketing person filter + sorting
  - Animated record count
- Dealer docs modal:
  - One `Rate_Doc` button per row
  - Lists all docs with Drive open links
  - Shows `No document uploaded` when empty
- File upload modal:
  - Drag-and-drop
  - Multi-file upload (any type)
  - Remove selected files
  - Upload status/progress per file
  - Concurrency-limited Drive uploads (3 workers)
- Sheets upsert logic:
  - Match existing row by `(DealerName + Station)` case-insensitive + trimmed
  - Merge existing/new file arrays

## Environment

Copy `.env.example` to `.env` and keep values updated:

```env
VITE_GOOGLE_CLIENT_ID=360849757137-agopfs0m8rgmcj541ucpg22btep5olt3.apps.googleusercontent.com
VITE_SHEET_ID=1CQqMmenlOJN3LvWpUpITM7aO_XKqrKz3xm1qoCsJDnI
VITE_DRIVE_FOLDER_ID=1IzY6KeXHZ282QT3D36eoGllOLcd8NSpU
VITE_APPS_SCRIPT_WEBAPP_URL=<DEPLOYED_WEB_APP_URL>
```

## Google Cloud OAuth Setup

1. Open Google Cloud Console and select your project.
2. Configure OAuth consent screen:
   - App type: External (or Internal if Workspace-only)
   - Add required scopes:
     - `openid`
     - `email`
     - `profile`
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/drive.file`
3. Create OAuth Client ID (Web application).
4. Add Authorized JavaScript origins:
   - `http://localhost:5173`
   - Your production domain (for deployment)
5. Confirm client ID matches `.env`.

## Google Sheet + Drive Requirements

- Sheet ID: `1CQqMmenlOJN3LvWpUpITM7aO_XKqrKz3xm1qoCsJDnI`
- Drive Folder ID: `1IzY6KeXHZ282QT3D36eoGllOLcd8NSpU`
- Ensure authenticated users can read/write sheet and upload to folder through their Google account permissions.

## Apps Script Helper Deployment

1. Use `/apps-script` folder in this repo.
2. Create a standalone Apps Script project and copy files.
3. Deploy as Web App:
   - Execute as: Me
   - Who has access: Anyone
4. Copy deployed web app URL to `VITE_APPS_SCRIPT_WEBAPP_URL`.

## Run Locally

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Production Build

```bash
npm run build
npm run preview
```

## Deployment (GitHub Pages Friendly)

1. Build with `npm run build`.
2. Deploy `dist/` to your hosting.
3. Ensure hosting domain is added as authorized JavaScript origin in Google Cloud.
4. Set environment variables in CI/hosting platform.

## Data Model in Google Sheet

Sheet/tab: `DealerDocs`

Headers in row 1:

- `DealerName`
- `Station`
- `MarketingPerson`
- `FileIds` (JSON array string)
- `FileNames` (JSON array string)
- `UpdatedAt` (ISO timestamp)
- `UpdatedBy` (email)

Upsert matching rule is exactly:

- Compare `DealerName` and `Station` using `trim().toLowerCase()` on both incoming payload and existing rows.

If match exists:

- Parse existing `FileIds` / `FileNames`
- Merge with new uploads by `fileId`
- Update row `A:G`

If no match:

- Append a new row.


