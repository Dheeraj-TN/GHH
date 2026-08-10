// Tiny server-side blob store for shared graphics.
// Persists PNGs to a data dir so an X/Twitter crawler can fetch the OG image.
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const DIR = process.env.SHARE_DIR || path.join(os.tmpdir(), "hhgoa-share");

async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true });
}

function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

export function newId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toLowerCase();
}

export async function savePng(id: string, bytes: Buffer): Promise<void> {
  await ensureDir();
  await fs.writeFile(path.join(DIR, `${safeId(id)}.png`), bytes);
}

export async function readPng(id: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(DIR, `${safeId(id)}.png`));
  } catch {
    return null;
  }
}

export async function exists(id: string): Promise<boolean> {
  try {
    await fs.access(path.join(DIR, `${safeId(id)}.png`));
    return true;
  } catch {
    return false;
  }
}
