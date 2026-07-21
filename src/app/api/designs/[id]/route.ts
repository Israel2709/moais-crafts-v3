import { NextRequest } from "next/server";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
  readAdminSession,
} from "@/lib/auth/session";
import { getDesignById, updateDesign } from "@/lib/designs/service";
import { isDesignInPublishedCatalog } from "@/lib/sales-catalogs/service";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const design = await getDesignById(id);
    if (!design) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const session = await readAdminSession();
    if (!session) {
      const visible = await isDesignInPublishedCatalog(id);
      if (!visible) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
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
      factoryPrice?: number | null;
      suggestedPrice?: number | null;
      fabricationTime?: string;
      driveLocation?: string;
      notes?: string;
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
