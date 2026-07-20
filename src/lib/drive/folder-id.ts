/** Accepts raw folder ID or a Drive folder URL. */
export function extractDriveFolderId(value: string): string {
  const trimmed = value.trim();
  const fromUrl = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (fromUrl?.[1]) {
    return fromUrl[1];
  }
  const fromOpen = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (fromOpen?.[1]) {
    return fromOpen[1];
  }
  return trimmed;
}
