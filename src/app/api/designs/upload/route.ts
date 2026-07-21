import { NextRequest } from "next/server";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";
import {
  normalizeTags,
  parseOptionalPrice,
} from "@/lib/designs/form";
import { createDesignFromUpload } from "@/lib/designs/service";

async function fileFromForm(
  file: File,
): Promise<{ buffer: Buffer; mimeType: string; name: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    buffer,
    mimeType: file.type || "application/octet-stream",
    name: file.name || "file",
  };
}

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const form = await request.formData();

    const title = String(form.get("title") ?? "").trim();
    if (!title) {
      return Response.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    const category = String(form.get("category") ?? "").trim() || "otros";
    const season = String(form.get("season") ?? "").trim() || "todo-el-ano";
    const fabricationTime = String(form.get("fabricationTime") ?? "").trim();
    const driveLocation = String(form.get("driveLocation") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim();

    let tags: string[] = [];
    const tagsRaw = form.get("tags");
    if (typeof tagsRaw === "string" && tagsRaw.trim()) {
      try {
        const parsed = JSON.parse(tagsRaw) as unknown;
        if (Array.isArray(parsed)) {
          tags = normalizeTags(parsed.map(String));
        }
      } catch {
        tags = normalizeTags(tagsRaw.split(","));
      }
    }

    let factoryPrice: number | null = null;
    let suggestedPrice: number | null = null;
    try {
      factoryPrice = parseOptionalPrice(String(form.get("factoryPrice") ?? ""));
      suggestedPrice = parseOptionalPrice(
        String(form.get("suggestedPrice") ?? ""),
      );
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "Precio inválido" },
        { status: 400 },
      );
    }

    const previewFiles: { buffer: Buffer; mimeType: string; name: string }[] =
      [];
    for (const entry of form.getAll("previews")) {
      if (entry instanceof File && entry.size > 0) {
        previewFiles.push(await fileFromForm(entry));
      }
    }

    const designFiles: { buffer: Buffer; mimeType: string; name: string }[] =
      [];
    for (const entry of form.getAll("files")) {
      if (entry instanceof File && entry.size > 0) {
        designFiles.push(await fileFromForm(entry));
      }
    }

    const design = await createDesignFromUpload({
      title,
      category,
      season,
      tags,
      factoryPrice,
      suggestedPrice,
      fabricationTime,
      driveLocation,
      notes,
      previewFiles,
      designFiles,
    });

    return Response.json({ design }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}
