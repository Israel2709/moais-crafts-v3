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
- `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON del service account en una línea)
- `MOAIS_ADMIN_SECRET` (secreto temporal para admin)
- Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, redirect `http://localhost:3000/api/drive/callback`)
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

5. Abre `http://localhost:3000`, ingresa el admin secret, luego **Conectar Google Drive** desde Explorar (guarda refresh token en `.data/drive-token.json`).

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Home admin |
| `/explore` | Drive (mobile lista / desktop split) |
| `/catalog` | Catálogo propio + filtros |
| `/catalog/[id]` | Detalle / editar / publicar |
| `/p/catalog` | Stub público (`published`) sin secreto |

## Auth (v1 vs futuro)

- **v1:** sin Firebase Auth. Mutaciones y Drive protegidos con cookie `MOAIS_ADMIN_SECRET`.
- **Futuro:** Auth estilo gastly-app (cuenta GitHub `Israel2709`). Stub en [`src/lib/auth/index.ts`](src/lib/auth/index.ts). Colección `moaisCatalog_admins` reservada.

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
