import { NextRequest } from "next/server";
import { downloadDriveFile } from "@/lib/drive/client";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const fileId = request.nextUrl.searchParams.get("fileId")?.trim();
    if (!fileId) {
      return Response.json({ error: "fileId required" }, { status: 400 });
    }

    const file = await downloadDriveFile(fileId);
    return new Response(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.mimeType,
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
      },
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}
