import type {
  DesignFolderHit,
  DesignSearchProgress,
  DesignSearchStreamEvent,
} from "@/lib/types/design";

export async function consumeDesignSearchStream(
  response: Response,
  handlers: {
    onProgress?: (progress: DesignSearchProgress) => void;
    onHit?: (item: DesignFolderHit) => void;
    onMessage?: (message: string) => void;
    onDone?: (items: DesignFolderHit[]) => void;
  },
): Promise<DesignFolderHit[]> {
  if (!response.body) {
    throw new Error("La respuesta de búsqueda no incluye stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalItems: DesignFolderHit[] | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const event = JSON.parse(trimmed) as DesignSearchStreamEvent;
      if (event.type === "progress") {
        handlers.onProgress?.(event.progress);
      } else if (event.type === "hit") {
        handlers.onHit?.(event.item);
      } else if (event.type === "message") {
        handlers.onMessage?.(event.message);
      } else if (event.type === "done") {
        finalItems = event.items;
        handlers.onDone?.(event.items);
      } else if (event.type === "error") {
        throw new Error(event.error);
      }
    }
  }

  if (buffer.trim()) {
    const event = JSON.parse(buffer.trim()) as DesignSearchStreamEvent;
    if (event.type === "done") {
      finalItems = event.items;
      handlers.onDone?.(event.items);
    } else if (event.type === "error") {
      throw new Error(event.error);
    }
  }

  return finalItems ?? [];
}
