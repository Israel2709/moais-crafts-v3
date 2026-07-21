import { existsSync, readFileSync } from "fs";
import path from "path";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
}

function parseServiceAccountJson(raw: string): ServiceAccount {
  let text = raw.trim();
  // Vercel UI sometimes wraps the value in extra quotes.
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Double-encoded JSON string
    try {
      parsed = JSON.parse(JSON.parse(text) as string);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
    }
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not a JSON object");
  }

  const data = parsed as Record<string, unknown>;
  const projectId = data.project_id;
  const clientEmail = data.client_email;
  const privateKey = data.private_key;

  if (
    typeof projectId !== "string" ||
    typeof clientEmail !== "string" ||
    typeof privateKey !== "string"
  ) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON missing project_id, client_email or private_key",
    );
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: normalizePrivateKey(privateKey),
  };
}

function loadServiceAccount(): ServiceAccount | null {
  // Prefer env JSON on Vercel — the .data/ file is not deployed.
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson?.trim()) {
    return parseServiceAccountJson(rawJson);
  }

  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.join(process.cwd(), ".data", "firebase-service-account.json");

  if (existsSync(filePath)) {
    const raw = readFileSync(filePath, "utf8");
    return parseServiceAccountJson(raw);
  }

  return null;
}

let adminApp: App | undefined;

export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return adminApp;
  }

  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    throw new Error(
      "Firebase Admin credentials missing. Set FIREBASE_SERVICE_ACCOUNT_JSON on Vercel (or FIREBASE_SERVICE_ACCOUNT_PATH locally).",
    );
  }

  adminApp = initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  return adminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}
