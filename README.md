# Moai's Catalog v3

PWA de catálogo curado para diseños laser cut (Moai's Crafts). Explora un Google Drive compartido, guarda solo lo útil en Firebase (`raziel-app-hub`) y filtra por nombre, categoría, temporada y franquicia.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Firebase: Firestore + Storage (prefijos `moaisCatalog_*` / `moais-catalog/`)
- Google Drive API (OAuth, solo lectura)
- PWA (`@ducanh2912/next-pwa`)
- UI **distinta** en mobile (bottom tabs) vs desktop (sidebar)

## Setup rápido

1. Copia env:

```bash
cp .env.local.example .env.local
```

2. Completa `.env.local`:

- Firebase client keys del proyecto `raziel-app-hub`
- `FIREBASE_SERVICE_ACCOUNT_PATH` → `.data/firebase-service-account.json` (gitignored), o `FIREBASE_SERVICE_ACCOUNT_JSON` en una línea
- `MOAIS_SUPER_ADMIN_EMAILS` (p. ej. `israel.salinas.m@gmail.com`)
- En Firebase Console: Auth con Google y/o correo-contraseña habilitados
- Google Drive OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, redirect `http://localhost:3040/api/drive/callback`) — aparte del login
- Opcional: `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `GOOGLE_DRIVE_REFRESH_TOKEN`

3. Despliega rules (CLI Firebase):

```bash
firebase deploy --only firestore:rules,storage --project raziel-app-hub
```

(Usa los archivos en [`firebase/`](firebase/).)

4. Instala y corre:

```bash
npm install
npm run dev
```

5. Abre `http://localhost:3040`, inicia sesión con Google o correo (solo emails en `MOAIS_SUPER_ADMIN_EMAILS`), luego **Conectar Google Drive** desde Explorar (guarda refresh token en `.data/drive-token.json`).

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Home admin |
| `/laser` | Fuentes Drive + exploración de archivos laser |
| `/3d` | Fuentes Drive + exploración de archivos 3D |
| `/catalog` | Catálogo propio + filtros |
| `/catalog/[id]` | Detalle / editar / publicar |
| `/p/catalog` | Stub público (`published`) sin login |
| `/explore` | Redirige a `/laser` |

## Auth

- **Admin:** Firebase Auth (Google + correo/contraseña) + session cookie httpOnly.
- Solo emails listados en `MOAIS_SUPER_ADMIN_EMAILS` pasan el gate y las APIs admin.
- **Público:** `/p/catalog` sin autenticación.
- **Drive OAuth** es independiente del login (credenciales `GOOGLE_CLIENT_*`).
- Colección `moaisCatalog_admins` reservada para allowlist en Firestore más adelante.

## GitHub

Repo remoto previsto: `https://github.com/Israel2709/moais-catalog-v3` (privado).

En este equipo `gh` está como `IsraelSalinasMartinez` y no puede crear repos en `Israel2709`. Antes del primer push:

```bash
gh auth login
# elige la cuenta Israel2709 (israel.salinas.m@gmail.com)
gh repo create moais-catalog-v3 --private --source=. --remote=origin
git push -u origin HEAD
```

## Estructura relevante

```
src/app/(admin)/     # UI admin + AppShell dual
src/app/p/catalog/   # público
src/app/api/         # Drive + designs + admin session
src/components/layout/mobile|desktop/
src/lib/firebase/    # client + admin
src/lib/drive/       # OAuth + list/search/download
src/lib/designs/     # ingest + CRUD
```
