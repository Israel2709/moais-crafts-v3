import { google } from "googleapis";
import { promises as fs } from "fs";
import path from "path";
import type { DesignFolderHit, DesignSearchProgress, DriveItem } from "@/lib/types/design";
import {
  isDesignDriveFile,
  isDesignPackageFolder,
  isImageDriveFile,
  nameMatchesQuery,
} from "@/lib/drive/design-files";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const TOKEN_FILE = path.join(process.cwd(), ".data", "drive-token.json");

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI are required");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getDriveAuthUrl(returnPath = "/laser"): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.readonly"],
    state: returnPath.startsWith("/") ? returnPath : "/laser",
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client();
  try {
    const { tokens } = await client.getToken(code);
    if (tokens.refresh_token) {
      await saveRefreshToken(tokens.refresh_token);
    } else {
      throw new Error(
        "Google no devolvió refresh_token. Revoca el acceso de la app en tu cuenta Google y vuelve a conectar.",
      );
    }
    return tokens;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("invalid_client")) {
      throw new Error(
        "invalid_client: revisa GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET (deben ser del mismo cliente OAuth) y reinicia el server.",
      );
    }
    throw error;
  }
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
      "Drive no conectado. Haz clic en «Conectar Google Drive» y autoriza con tu cuenta de Google.",
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
  const items: DriveItem[] = [];
  let pageToken: string | undefined;

  // Do not use orderBy here: with includeItemsFromAllDrives it often fails or
  // returns empty on Shared Drives (e.g. large 3D vaults). Sort client-side.
  do {
    const res = await drive.files.list({
      q: `'${parent}' in parents and trashed = false`,
      pageSize: 1000,
      pageToken,
      fields:
        "nextPageToken,files(id,name,mimeType,modifiedTime,size,thumbnailLink,iconLink,webViewLink,parents)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    for (const file of res.data.files ?? []) {
      items.push(mapFile(file));
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return items.sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });
}

export async function crawlDesignPackageFolders(
  roots: { folderId: string; name: string }[],
  options?: {
    onProgress?: (progress: DesignSearchProgress) => void | Promise<void>;
    onPackage?: (hit: DesignFolderHit) => void | Promise<void>;
  },
): Promise<{ packages: DesignFolderHit[]; scannedFolders: number }> {
  if (roots.length === 0) {
    return { packages: [], scannedFolders: 0 };
  }

  const packages: DesignFolderHit[] = [];
  const queue: { folderId: string; pathParts: string[] }[] = roots.map(
    (root) => ({
      folderId: root.folderId,
      pathParts: [root.name],
    }),
  );
  const visited = new Set<string>();
  let scanned = 0;

  async function emitProgress(currentPath: string, done = false) {
    const queueLeft = queue.length;
    const total = scanned + queueLeft;
    const percent = done
      ? 100
      : total === 0
        ? 0
        : Math.min(99, Math.round((scanned / total) * 100));
    await options?.onProgress?.({
      scanned,
      queueLeft,
      hits: packages.length,
      percent,
      currentPath,
    });
  }

  await emitProgress(roots.map((r) => r.name).join(", "));

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.folderId)) continue;
    visited.add(current.folderId);

    const currentPath = current.pathParts.join(" / ");
    const children = await listDriveChildren(current.folderId);
    scanned += 1;

    const folders = children.filter((item) => item.isFolder);
    const files = children.filter((item) => !item.isFolder);
    const images = files.filter(isImageDriveFile);
    const designs = files.filter(isDesignDriveFile);

    const depth = current.pathParts.length;
    const folderName = current.pathParts[current.pathParts.length - 1] ?? "";
    if (depth > 1 && isDesignPackageFolder(images, designs)) {
      const hit: DesignFolderHit = {
        id: current.folderId,
        name: folderName,
        path: currentPath,
        webViewLink: `https://drive.google.com/drive/folders/${current.folderId}`,
        previewFileIds: images.map((img) => img.id),
        designFiles: designs.map((file) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
        })),
      };
      packages.push(hit);
      await options?.onPackage?.(hit);
    }

    for (const folder of folders) {
      queue.push({
        folderId: folder.id,
        pathParts: [...current.pathParts, folder.name],
      });
    }

    await emitProgress(currentPath);
  }

  await Promise.all(
    packages.map(async (hit) => {
      try {
        const meta = await getDriveFileMeta(hit.id);
        hit.webViewLink =
          meta.webViewLink ??
          `https://drive.google.com/drive/folders/${hit.id}`;
      } catch {
        // keep fallback folder URL
      }
    }),
  );

  const sorted = packages.sort((a, b) => a.path.localeCompare(b.path, "es"));
  await emitProgress(
    sorted[sorted.length - 1]?.path ?? roots[0]?.name ?? "",
    true,
  );
  return { packages: sorted, scannedFolders: scanned };
}

export async function searchDesignFolders(
  query: string,
  roots: { folderId: string; name: string }[],
  options?: {
    onProgress?: (progress: DesignSearchProgress) => void | Promise<void>;
    onHit?: (hit: DesignFolderHit) => void | Promise<void>;
  },
): Promise<DesignFolderHit[]> {
  if (!query.trim() || roots.length === 0) {
    return [];
  }

  const { packages } = await crawlDesignPackageFolders(roots, {
    onProgress: options?.onProgress,
    onPackage: async (hit) => {
      if (nameMatchesQuery(hit.name, query)) {
        await options?.onHit?.(hit);
      }
    },
  });

  return packages.filter((hit) => nameMatchesQuery(hit.name, query));
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
