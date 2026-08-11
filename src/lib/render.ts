// Canvas rendering for HH GOA 2026 — pure functions, no React.
import { BRAND, DEFAULT_THEME, type Theme } from "./brand";

export type Format = "pfp" | "card";

export interface PhotoTransform {
  /** pan in source-fraction units (-1..1), 0 = centered */
  offsetX: number;
  offsetY: number;
  /** 1 = cover-fit baseline; >1 zooms in */
  zoom: number;
}

export interface RenderOptions {
  format: Format;
  img: CanvasImageSource | null;
  imgW: number;
  imgH: number;
  transform: PhotoTransform;
  name: string;
  role: string;
  title: string;
  builderId: string;
  theme: Theme;
}

export const CANVAS = {
  pfp: { w: 1080, h: 1080 },
  card: { w: 1080, h: 1350 },
} as const;

/* ----------------------------- helpers ----------------------------- */

function grad(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [stop, color] of theme.stops) g.addColorStop(stop, color);
  return g;
}

/** Draw `img` covering the given rect (object-fit: cover) honoring transform. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  o: RenderOptions,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const { img, imgW, imgH, transform } = o;
  if (!img) {
    // placeholder before a photo is chosen
    ctx.fillStyle = "rgba(255,247,236,0.10)";
    ctx.fillRect(dx, dy, dw, dh);
    ctx.fillStyle = "rgba(255,247,236,0.65)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.round(dw * 0.05)}px system-ui, sans-serif`;
    ctx.fillText("your photo", dx + dw / 2, dy + dh / 2 - dw * 0.03);
    ctx.font = `600 ${Math.round(dw * 0.032)}px system-ui, sans-serif`;
    ctx.fillText("goes here", dx + dw / 2, dy + dh / 2 + dw * 0.03);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    return;
  }
  const scale = Math.max(dw / imgW, dh / imgH) * transform.zoom;
  const sw = dw / scale;
  const sh = dh / scale;
  // center + pan (clamped so we never sample outside the source)
  const maxOffX = Math.max(0, (imgW - sw) / 2);
  const maxOffY = Math.max(0, (imgH - sh) / 2);
  const sx = (imgW - sw) / 2 + clamp(transform.offsetX, -1, 1) * maxOffX;
  const sy = (imgH - sh) / 2 + clamp(transform.offsetY, -1, 1) * maxOffY;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/** #rrggbb + alpha → rgba() string */
function hexA(hex: string, a: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Text along a circular arc. angle in radians; centered at (cx,cy). */
function curvedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  opts: { anticlockwise?: boolean; letterSpacing?: number } = {},
) {
  const anticlockwise = opts.anticlockwise ?? false;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const dir = anticlockwise ? -1 : 1;
  // measure total angular width
  const widths = [...text].map((ch) => ctx.measureText(ch).width + (opts.letterSpacing ?? 0));
  const total = widths.reduce((a, b) => a + b, 0);
  let angle = startAngle - (dir * total) / (2 * radius);
  for (let i = 0; i < text.length; i++) {
    const w = widths[i];
    angle += (dir * (w / 2)) / radius;
    ctx.save();
    ctx.translate(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.rotate(angle + (anticlockwise ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
    angle += (dir * (w / 2)) / radius;
  }
  ctx.restore();
}

/** A simple palm-tree silhouette centered at base (x,y). */
function palm(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  // trunk
  ctx.lineWidth = s * 0.09;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-s * 0.12, -s * 0.55, -s * 0.06, -s * 0.95);
  ctx.stroke();
  // fronds
  const top = { x: -s * 0.06, y: -s * 0.95 };
  const fronds = [-2.5, -1.5, -0.5, 0.4, 1.3, 2.2];
  ctx.lineWidth = s * 0.05;
  for (const a of fronds) {
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    const ex = top.x + Math.cos(a) * s * 0.5;
    const ey = top.y - Math.abs(Math.sin(a)) * s * 0.28 - s * 0.02;
    ctx.quadraticCurveTo(top.x + Math.cos(a) * s * 0.28, top.y - s * 0.22, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(top.x, top.y, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function waves(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string, amp: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = amp * 0.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  const step = w / 5;
  for (let i = 0; i < 5; i++) {
    const sx = x + i * step;
    ctx.moveTo(sx, y);
    ctx.quadraticCurveTo(sx + step / 4, y - amp, sx + step / 2, y);
    ctx.quadraticCurveTo(sx + (3 * step) / 4, y + amp, sx + step, y);
  }
  ctx.stroke();
  ctx.restore();
}

/* ----------------------------- Format A: PFP ----------------------------- */

function renderPfp(ctx: CanvasRenderingContext2D, o: RenderOptions) {
  const { w, h } = CANVAS.pfp;
  const t = o.theme;
  const cx = w / 2;
  const cy = h / 2;
  const pad = w * 0.05; // breathing room baked inside the graphic
  const outer = w / 2 - pad; // disc no longer touches the image edges

  // backdrop behind the disc (the inner padding)
  ctx.fillStyle = t.bgDeep;
  ctx.fillRect(0, 0, w, h);
  const halo = ctx.createRadialGradient(cx, cy, outer * 0.6, cx, cy, w / 2);
  halo.addColorStop(0, hexA(t.sun2, 0.12));
  halo.addColorStop(1, hexA(t.bgDeep, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);

  // full sunset disc
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, outer, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = grad(ctx, t, 0, 0, 0, h);
  ctx.fillRect(0, 0, w, h);
  // sun glow
  const glow = ctx.createRadialGradient(cx, cy * 0.78, 10, cx, cy * 0.78, outer * 0.9);
  glow.addColorStop(0, "rgba(255,240,190,0.55)");
  glow.addColorStop(1, "rgba(255,240,190,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  // waterline + palms silhouette near the bottom of the ring band
  waves(ctx, cx - outer * 0.7, cy + outer * 0.62, outer * 1.4, "rgba(20,10,40,0.28)", 10);
  palm(ctx, cx - outer * 0.66, cy + outer * 0.66, 120, "rgba(20,10,40,0.55)");
  palm(ctx, cx + outer * 0.6, cy + outer * 0.7, 150, "rgba(20,10,40,0.55)");
  ctx.restore();

  // slight border around the disc, sitting in the inner padding
  ctx.save();
  // ctx.lineWidth = w * 0.006;
  // ctx.strokeStyle = hexA(t.sun2, 0.55);
  // ctx.beginPath();
  // ctx.arc(cx, cy, outer + ctx.lineWidth * 0.9, 0, Math.PI * 2);
  // ctx.stroke();
  ctx.restore();

  // photo circle
  const photoR = outer * 0.72;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, photoR, 0, Math.PI * 2);
  ctx.clip();
  drawCover(ctx, o, cx - photoR, cy - photoR, photoR * 2, photoR * 2);
  ctx.restore();

  // ring stroke around the photo (gradient)
  ctx.save();
  ctx.lineWidth = outer * 0.06;
  ctx.strokeStyle = grad(ctx, t, cx - photoR, cy - photoR, cx + photoR, cy + photoR);
  ctx.beginPath();
  ctx.arc(cx, cy, photoR + ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.stroke();
  // thin cream inner keyline
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,247,236,0.9)";
  ctx.beginPath();
  ctx.arc(cx, cy, photoR + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // curved wordmark on the ring band
  const bandR = (outer + photoR) / 2 + 6;
  ctx.fillStyle = BRAND.colors.cream;
  ctx.font = `800 ${outer * 0.088}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  // bottom arc reads left→right upright
  curvedText(ctx, "HACKER HOUSE · GOA 2026", cx, cy, bandR, Math.PI / 2, {
    anticlockwise: true,
    letterSpacing: 2,
  });
  ctx.fillStyle = "rgba(255,247,236,0.92)";
  ctx.font = `800 ${outer * 0.07}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  // top arc reads left→right upright, with small star separators flanking it
  curvedText(ctx, `✦  ${BRAND.hashtag.toUpperCase()}  ✦`, cx, cy, bandR - 2, -Math.PI / 2, {
    letterSpacing: 3,
  });
}

/* ----------------------------- Format B: ID card ----------------------------- */

function renderCard(ctx: CanvasRenderingContext2D, o: RenderOptions) {
  const { w, h } = CANVAS.card;
  const C = BRAND.colors;
  const t = o.theme;

  // backdrop
  ctx.fillStyle = t.bgDeep;
  ctx.fillRect(0, 0, w, h);
  const bg = ctx.createRadialGradient(w / 2, h * 0.2, 40, w / 2, h * 0.2, h);
  bg.addColorStop(0, t.bg);
  bg.addColorStop(1, t.bgDeep);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const pad = 56;
  const cardX = pad;
  const cardY = pad;
  const cardW = w - pad * 2;
  const cardH = h - pad * 2;
  const radius = 48;

  // gradient border
  roundRectPath(ctx, cardX - 8, cardY - 8, cardW + 16, cardH + 16, radius + 8);
  ctx.fillStyle = grad(ctx, t, cardX, cardY, cardX + cardW, cardY + cardH);
  ctx.fill();

  // card body
  roundRectPath(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = t.bgDeep;
  ctx.fillRect(cardX, cardY, cardW, cardH);
  // faint themed wash at top
  const wash = ctx.createLinearGradient(0, cardY, 0, cardY + cardH * 0.5);
  wash.addColorStop(0, hexA(t.sun2, 0.18));
  wash.addColorStop(1, hexA(t.bgDeep, 0));
  ctx.fillStyle = wash;
  ctx.fillRect(cardX, cardY, cardW, cardH * 0.5);
  // decorative palms + waves at the very bottom
  waves(ctx, cardX + 24, cardY + cardH - 150, cardW - 48, hexA(t.accent, 0.25), 8);
  palm(ctx, cardX + 90, cardY + cardH - 60, 120, hexA(t.accent, 0.32));
  palm(ctx, cardX + cardW - 90, cardY + cardH - 50, 150, hexA(t.sun2, 0.3));
  ctx.restore();

  const inner = cardX + 52;
  const innerW = cardW - 104;

  // header row
  let y = cardY + 92;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.cream;
  ctx.font = `900 44px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.fillText("HACKER HOUSE", inner, y);
  ctx.font = `900 44px system-ui, sans-serif`;
  const hhW = ctx.measureText("HACKER HOUSE ").width;
  // "GOA 2026" as a gradient accent
  ctx.fillStyle = grad(ctx, t, inner + hhW, y - 40, inner + hhW + 220, y);
  ctx.fillText("GOA 2026", inner + hhW, y);
  ctx.fillStyle = "rgba(255,247,236,0.55)";
  ctx.font = `700 22px system-ui, sans-serif`;
  ctx.fillText("BUILDER PASS", inner, y + 30);
  // sun mark top-right
  ctx.save();
  ctx.fillStyle = t.sun;
  ctx.beginPath();
  ctx.arc(cardX + cardW - 96, cardY + 84, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = t.sun2;
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cardX + cardW - 96 + Math.cos(a) * 32, cardY + 84 + Math.sin(a) * 32);
    ctx.lineTo(cardX + cardW - 96 + Math.cos(a) * 42, cardY + 84 + Math.sin(a) * 42);
    ctx.stroke();
  }
  ctx.restore();

  // photo block
  const photoY = cardY + 150;
  const photoH = 560;
  const photoX = inner;
  const photoW = innerW;
  ctx.save();
  roundRectPath(ctx, photoX, photoY, photoW, photoH, 32);
  ctx.clip();
  drawCover(ctx, o, photoX, photoY, photoW, photoH);
  ctx.restore();
  // photo border
  ctx.save();
  roundRectPath(ctx, photoX, photoY, photoW, photoH, 32);
  ctx.lineWidth = 6;
  ctx.strokeStyle = grad(ctx, t, photoX, photoY, photoX + photoW, photoY + photoH);
  ctx.stroke();
  ctx.restore();

  // builder title chip (overlaps photo bottom)
  const title = (o.title || "Builder").toUpperCase();
  ctx.font = `800 30px system-ui, sans-serif`;
  const tW = ctx.measureText(title).width;
  const chipW = tW + 56;
  const chipH = 60;
  const chipX = inner;
  const chipY = photoY + photoH - 30;
  roundRectPath(ctx, chipX, chipY, chipW, chipH, chipH / 2);
  ctx.fillStyle = grad(ctx, t, chipX, chipY, chipX + chipW, chipY);
  ctx.fill();
  ctx.fillStyle = t.bgDeep;
  ctx.textBaseline = "middle";
  ctx.fillText(title, chipX + 28, chipY + chipH / 2 + 1);
  ctx.textBaseline = "alphabetic";

  // name
  y = chipY + chipH + 78;
  ctx.fillStyle = C.cream;
  ctx.font = `900 64px system-ui, sans-serif`;
  const name = o.name.trim() || "Your Name";
  fitText(ctx, name, innerW, 64, 40);
  ctx.fillText(name, inner, y);

  // role / stack — painted in the theme's own colours so it always matches
  y += 52;
  ctx.font = `700 30px system-ui, sans-serif`;
  const role = o.role.trim() || "Builder · Full-stack";
  const rw = Math.max(1, ctx.measureText(role).width);
  const rg = ctx.createLinearGradient(inner, 0, inner + rw, 0);
  rg.addColorStop(0, t.sun2);
  rg.addColorStop(0.5, t.stops[2][1]);
  rg.addColorStop(1, t.stops[3][1]);
  ctx.fillStyle = rg;
  ctx.fillText(role, inner, y);

  // footer: id + hashtag
  const footY = cardY + cardH - 46;
  ctx.fillStyle = "rgba(255,247,236,0.5)";
  ctx.font = `700 24px ui-monospace, "SF Mono", Menlo, monospace`;
  ctx.fillText(o.builderId, inner, footY);
  ctx.textAlign = "right";
  ctx.fillStyle = t.sun;
  ctx.font = `800 26px system-ui, sans-serif`;
  ctx.fillText(BRAND.hashtag, cardX + cardW - 52, footY);
  ctx.textAlign = "left";
}

/** shrink font until text fits width; sets ctx.font as side effect */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  size: number,
  min: number,
) {
  let s = size;
  do {
    ctx.font = `900 ${s}px system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxW || s <= min) break;
    s -= 2;
  } while (s > min);
}

/* ----------------------------- entry ----------------------------- */

export function render(ctx: CanvasRenderingContext2D, o: RenderOptions) {
  const opts: RenderOptions = { ...o, theme: o.theme ?? DEFAULT_THEME };
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.imageSmoothingQuality = "high";
  if (opts.format === "pfp") renderPfp(ctx, opts);
  else renderCard(ctx, opts);
}
