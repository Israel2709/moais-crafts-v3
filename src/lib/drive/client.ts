import { google } from "googleapis";
import { promises as fs } from "fs";
import path from "path";
import type { DriveItem } from "@/lib/types/design";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const TOKEN_FILE = path.join(process.cwd(), ".data", "drive-token.json");

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI are required");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getDriveAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.readonly"],
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  if (tokens.refresh_token) {
    await saveRefreshToken(tokens.refresh_token);
  }
  return tokens;
}

async function saveRefreshToken(refreshToken: string) {
  await fs.mkdir(path.dirname(TOKEN_FILE), { recursive: true });
  await fs.writeFile(
    TOKEN_FILE,
    JSON.stringify({ refresh_token: refreshToken }, null, 2),
    "utf8",
  );
}

async function loadRefreshToken(): Promise<string | null> {
  if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
    return process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  }
  try {
    const raw = await fs.readFile(TOKEN_FILE, "utf8");
    const parsed = JSON.parse(raw) as { refresh_token?: string };
    return parsed.refresh_token ?? null;
  } catch {
    return null;
  }
}

export async function getAuthenticatedDrive() {
  const refreshToken = await loadRefreshToken();
  if (!refreshToken) {
    throw new Error(
      "Drive not connected. Visit /api/drive/auth after setting Google OAuth env vars.",
    );
  }

  const client = getOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth: client });
}

function mapFile(file: {
  id?: string | null;
  name?: string | null;
  mimeType?: string | null;
  modifiedTime?: string | null;
  size?: string | null;
  thumbnailLink?: string | null;
  iconLink?: string | null;
  webViewLink?: string | null;
  parents?: string[] | null;
}): DriveItem {
  return {
    id: file.id ?? "",
    name: file.name ?? "Untitled",
    mimeType: file.mimeType ?? "application/octet-stream",
    modifiedTime: file.modifiedTime ?? null,
    size: file.size ?? null,
    thumbnailLink: file.thumbnailLink ?? null,
    iconLink: file.iconLink ?? null,
    webViewLink: file.webViewLink ?? null,
    isFolder: file.mimeType === FOLDER_MIME,
    parents: file.parents ?? [],
  };
}

export async function listDriveChildren(folderId: string): Promise<DriveItem[]> {
  const drive = await getAuthenticatedDrive();
  const parent = folderId || "root";
  const res = await drive.files.list({
    q: `'${parent}' in parents and trashed = false`,
    pageSize: 100,
    fields:
      "files(id,name,mimeType,modifiedTime,size,thumbnailLink,iconLink,webViewLink,parents)",
    orderBy: "folder,name_natural",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return (res.data.files ?? []).map(mapFile);
}

export async function searchDriveFiles(query: string): Promise<DriveItem[]> {
  const drive = await getAuthenticatedDrive();
  const safe = query.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `name contains '${safe}' and trashed = false`,
    pageSize: 50,
    fields:
      "files(id,name,mimeType,modifiedTime,size,thumbnailLink,iconLink,webViewLink,parents)",
    orderBy: "modifiedTime desc",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return (res.data.files ?? []).map(mapFile);
}

export async function getDriveFileMeta(fileId: string) {
  const drive = await getAuthenticatedDrive();
  const res = await drive.files.get({
    fileId,
    fields:
      "id,name,mimeType,modifiedTime,size,thumbnailLink,iconLink,webViewLink,parents",
    supportsAllDrives: true,
  });
  return mapFile(res.data);
}

export async function downloadDriveFile(fileId: string): Promise<{
  buffer: Buffer;
  mimeType: string;
  name: string;
}> {
  const drive = await getAuthenticatedDrive();
  const meta = await drive.files.get({
    fileId,
    fields: "id,name,mimeType",
    supportsAllDrives: true,
  });

  const mimeType = meta.data.mimeType ?? "application/octet-stream";
  const name = meta.data.name ?? fileId;

  if (mimeType.startsWith("application/vnd.google-apps.")) {
    const exportMime =
      mimeType === "application/vnd.google-apps.document"
        ? "application/pdf"
        : "application/zip";
    const exported = await drive.files.export(
      { fileId, mimeType: exportMime },
      { responseType: "arraybuffer" },
    );
    return {
      buffer: Buffer.from(exported.data as ArrayBuffer),
      mimeType: exportMime,
      name,
    };
  }

  const downloaded = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" },
  );

  return {
    buffer: Buffer.from(downloaded.data as ArrayBuffer),
    mimeType,
    name,
  };
}
