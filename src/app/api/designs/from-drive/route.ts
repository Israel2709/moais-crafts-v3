import { NextRequest } from "next/server";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";
import { createDesignFromDrive } from "@/lib/designs/service";

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const body = (await request.json()) as {
      driveFileId?: string;
      title?: string;
      category?: string;
      season?: string;
      franchise?: string;
      notes?: string;
    };

    if (!body.driveFileId) {
      return Response.json({ error: "driveFileId is required" }, { status: 400 });
    }

    const design = await createDesignFromDrive({
      driveFileId: body.driveFileId,
      title: body.title ?? "",
      category: body.category ?? "otros",
      season: body.season ?? "todo-el-ano",
      franchise: body.franchise ?? "sin-franquicia",
      notes: body.notes,
    });

    return Response.json({ design }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}
