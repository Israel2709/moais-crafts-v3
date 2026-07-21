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
import {
  createDesignFromDrive,
  createDesignFromDriveFolder,
} from "@/lib/designs/service";

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const body = (await request.json()) as {
      driveFileId?: string;
      driveFolderId?: string;
      drivePath?: string;
      title?: string;
      category?: string;
      season?: string;
      franchise?: string;
      tags?: string[];
      factoryPrice?: string | number | null;
      suggestedPrice?: string | number | null;
      fabricationTime?: string;
      driveLocation?: string;
      description?: string;
      notes?: string;
    };

    const title = body.title?.trim() ?? "";
    if (!title) {
      return Response.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    const description = body.description?.trim() ?? "";
    if (!description) {
      return Response.json(
        { error: "La descripción es requerida" },
        { status: 400 },
      );
    }

    const category = body.category?.trim() || "otros";
    const season = body.season?.trim() || "todo-el-ano";
    const franchise = body.franchise ?? "sin-franquicia";
    const tags = normalizeTags(body.tags ?? []);
    const fabricationTime = body.fabricationTime?.trim() ?? "";
    const driveLocation = body.driveLocation?.trim() || body.drivePath?.trim() || "";
    const notes = body.notes;

    let factoryPrice: number | null = null;
    let suggestedPrice: number | null = null;
    try {
      factoryPrice =
        typeof body.factoryPrice === "number"
          ? body.factoryPrice
          : parseOptionalPrice(String(body.factoryPrice ?? ""));
      suggestedPrice =
        typeof body.suggestedPrice === "number"
          ? body.suggestedPrice
          : parseOptionalPrice(String(body.suggestedPrice ?? ""));
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "Precio inválido" },
        { status: 400 },
      );
    }

    const commerce = {
      title,
      category,
      season,
      franchise,
      tags,
      factoryPrice,
      suggestedPrice,
      fabricationTime,
      driveLocation,
      description,
      notes,
    };

    if (body.driveFolderId) {
      const design = await createDesignFromDriveFolder({
        driveFolderId: body.driveFolderId,
        drivePath: body.drivePath,
        ...commerce,
      });
      return Response.json({ design }, { status: 201 });
    }

    if (!body.driveFileId) {
      return Response.json(
        { error: "driveFileId or driveFolderId is required" },
        { status: 400 },
      );
    }

    const design = await createDesignFromDrive({
      driveFileId: body.driveFileId,
      ...commerce,
    });

    return Response.json({ design }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}
