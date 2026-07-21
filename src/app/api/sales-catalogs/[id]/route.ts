import { NextRequest } from "next/server";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
  readAdminSession,
} from "@/lib/auth/session";
import {
  deleteSalesCatalog,
  getDesignsForSalesCatalog,
  getSalesCatalogById,
  getSalesCatalogBySlug,
  updateSalesCatalog,
} from "@/lib/sales-catalogs/service";
import type { SalesCatalogStatus } from "@/lib/types/sales-catalog";

type Params = { params: Promise<{ id: string }> };

async function resolveCatalog(idOrSlug: string) {
  return (
    (await getSalesCatalogById(idOrSlug)) ??
    (await getSalesCatalogBySlug(idOrSlug))
  );
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const catalog = await resolveCatalog(id);
    if (!catalog) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const session = await readAdminSession();
    if (!session && catalog.status !== "published") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const includeDesigns =
      request.nextUrl.searchParams.get("include") === "designs";
    if (!includeDesigns) {
      return Response.json({ catalog });
    }

    const designs = await getDesignsForSalesCatalog(catalog);
    return Response.json({ catalog, designs });
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
    const existing = await resolveCatalog(id);
    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      status?: SalesCatalogStatus;
      designIds?: string[];
      slug?: string;
    };

    const catalog = await updateSalesCatalog(existing.id, body);
    return Response.json({ catalog });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await assertAdminRequest(request);
    const { id } = await params;
    const existing = await resolveCatalog(id);
    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    await deleteSalesCatalog(existing.id);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}
