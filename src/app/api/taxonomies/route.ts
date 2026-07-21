import { NextRequest } from "next/server";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";
import { addTaxonomyValue, ensureTaxonomies } from "@/lib/designs/service";

export async function GET(request: NextRequest) {
  try {
    try {
      const taxonomies = await ensureTaxonomies();
      return Response.json({ taxonomies });
    } catch {
      await assertAdminRequest(request);
      const taxonomies = await ensureTaxonomies();
      return Response.json({ taxonomies });
    }
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
      field?: "categories" | "seasons" | "tags";
      value?: string;
    };

    if (
      body.field !== "categories" &&
      body.field !== "seasons" &&
      body.field !== "tags"
    ) {
      return Response.json(
        { error: "field must be categories, seasons or tags" },
        { status: 400 },
      );
    }
    if (!body.value?.trim()) {
      return Response.json({ error: "value is required" }, { status: 400 });
    }

    const result = await addTaxonomyValue(body.field, body.value);
    return Response.json(result);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}
