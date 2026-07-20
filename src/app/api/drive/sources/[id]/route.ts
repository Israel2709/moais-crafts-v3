import { NextRequest } from "next/server";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";
import { deleteDriveLibrarySource } from "@/lib/drive/sources";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await assertAdminRequest(request);
    const { id } = await context.params;
    await deleteDriveLibrarySource(id);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}
