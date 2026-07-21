import { NextRequest } from "next/server";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";
import { addDesignsToSalesCatalogs } from "@/lib/sales-catalogs/service";

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const body = (await request.json()) as {
      catalogIds?: string[];
      designIds?: string[];
    };
    const catalogs = await addDesignsToSalesCatalogs(
      body.catalogIds ?? [],
      body.designIds ?? [],
    );
    return Response.json({ catalogs });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}
