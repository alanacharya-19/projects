import { Paths, File } from "expo-file-system";

const HISTORY = new File(Paths.document, "video-history.json");
const BACKUP = new File(Paths.document, "video-history.bak.json");

let cache: Record<string, number> | null = null;

async function load(): Promise<Record<string, number>> {
  if (cache) return cache;
  try {
    for (const file of [HISTORY, BACKUP]) {
      if (file.exists) {
        const raw = await file.text();
        cache = JSON.parse(raw) as Record<string, number>;
        return cache;
      }
    }
  } catch {}
  cache = {};
  return cache;
}

function save() {
  if (!cache) return;
  try {
    const raw = JSON.stringify(cache);
    if (HISTORY.exists) {
      HISTORY.copy(BACKUP);
    }
    HISTORY.write(raw);
  } catch {}
}

export async function getPosition(uri: string): Promise<number> {
  const data = await load();
  return data[uri] ?? 0;
}

export async function setPosition(uri: string, time: number) {
  const data = await load();
  data[uri] = time;
  save();
}

export function formatResumeBadge(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
