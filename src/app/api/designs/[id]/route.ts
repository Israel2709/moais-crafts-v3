import { NextRequest } from "next/server";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/admin-secret";
import { getDesignById, updateDesign } from "@/lib/designs/service";
import type { DesignStatus } from "@/lib/types/design";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const design = await getDesignById(id);
    if (!design) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (design.status !== "published") {
      await assertAdminRequest(request);
    }

    return Response.json({ design });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await assertAdminRequest(request);
    const { id } = await params;
    const body = (await request.json()) as {
      title?: string;
      category?: string;
      season?: string;
      franchise?: string;
      tags?: string[];
      notes?: string;
      status?: DesignStatus;
    };

    const design = await updateDesign(id, body);
    return Response.json({ design });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}
