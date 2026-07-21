import { NextRequest } from "next/server";
import { z } from "zod";
import {
  getIndexStatus,
  rebuildDriveIndex,
} from "@/lib/drive/index-service";
import { DESIGN_KINDS } from "@/lib/drive/kind-labels";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";
import type { DesignSearchStreamEvent } from "@/lib/types/design";

const kindSchema = z.enum(DESIGN_KINDS);

function ndjsonStream(
  run: (send: (event: DesignSearchStreamEvent) => void) => Promise<void>,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: DesignSearchStreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        await run(send);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error";
        send({ type: "error", error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const kind = kindSchema.parse(request.nextUrl.searchParams.get("kind"));
    const meta = await getIndexStatus(kind);
    return Response.json({ meta });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Query kind=laser|3d|amigurumis is required" },
        { status: 400 },
      );
    }
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const kind = kindSchema.parse(request.nextUrl.searchParams.get("kind"));

    return ndjsonStream(async (send) => {
      const { meta, packages } = await rebuildDriveIndex(kind, {
        onProgress: (progress) => {
          send({ type: "progress", progress });
        },
        onPackage: (item) => {
          send({ type: "hit", item });
        },
      });
      send({
        type: "message",
        message: `Índice actualizado: ${meta.packageCount} diseños · ${meta.scannedFolders} carpetas revisadas`,
      });
      send({ type: "done", items: packages });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Query kind=laser|3d|amigurumis is required" },
        { status: 400 },
      );
    }
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}
