import { NextRequest } from "next/server";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";
import {
  createSalesCatalog,
  listSalesCatalogs,
} from "@/lib/sales-catalogs/service";
import type { SalesCatalogStatus } from "@/lib/types/sales-catalog";

export async function GET(request: NextRequest) {
  try {
    const statusParam = request.nextUrl.searchParams.get("status");
    const q = request.nextUrl.searchParams.get("q") ?? undefined;
    const publishedOnly = statusParam === "published";

    if (!publishedOnly) {
      await assertAdminRequest(request);
    }

    const catalogs = await listSalesCatalogs({
      status: publishedOnly
        ? ("published" satisfies SalesCatalogStatus)
        : statusParam === "draft"
          ? ("draft" satisfies SalesCatalogStatus)
          : undefined,
      q,
    });
    return Response.json({ catalogs });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      status?: SalesCatalogStatus;
      designIds?: string[];
    };
    if (!body.name?.trim()) {
      return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    const catalog = await createSalesCatalog({
      name: body.name,
      description: body.description,
      status: body.status,
      designIds: body.designIds,
    });
    return Response.json({ catalog }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}
