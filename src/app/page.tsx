"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { CANVAS, render, type Format, type PhotoTransform } from "@/lib/render";
import { loadImageFile, type LoadedImage } from "@/lib/loadImage";
import { BRAND, builderId, builderTitle, DEFAULT_THEME, THEMES, type Theme } from "@/lib/brand";

const APP_URL = "https://ghh-ten.vercel.app";
const CAPTION = `Locked in for Hacker House Goa 2026 🌴🔥 Come build with us. ${BRAND.hashtag}

Think you can make a cooler one? 😏 Frame yours 👉 ${APP_URL}`;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [format, setFormat] = useState<Format>("pfp");
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [transform, setTransform] = useState<PhotoTransform>({ offsetX: 0, offsetY: 0, zoom: 1 });
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // auto-derive builder title from name/stack unless user edited it
  useEffect(() => {
    if (!titleTouched) setTitle(builderTitle(name, role));
  }, [name, role, titleTouched]);

  // (re)render the canvas whenever anything changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dims = CANVAS[format];
    canvas.width = dims.w;
    canvas.height = dims.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    render(ctx, {
      format,
      img: image?.bitmap ?? null,
      imgW: image?.width ?? 1,
      imgH: image?.height ?? 1,
      transform,
      name,
      role,
      title: title || builderTitle(name, role),
      builderId: builderId(name),
      theme,
    });
  }, [format, image, transform, name, role, title, theme]);

  const flash = (msg: string) => toast(msg);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
      flash("Please choose an image file.");
      return;
    }
    setBusy(true);
    try {
      const loaded = await loadImageFile(file);
      setImage(loaded);
      setTransform({ offsetX: 0, offsetY: 0, zoom: 1 });
    } catch (e) {
      console.error(e);
      flash("Couldn't read that photo. Try a JPG or PNG.");
    } finally {
      setBusy(false);
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  /* ---- drag to reposition the photo ---- */
  const dragState = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (!image) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current || !image) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dx = e.clientX - dragState.current.x;
    const dy = e.clientY - dragState.current.y;
    dragState.current = { x: e.clientX, y: e.clientY };
    setTransform((t) => ({
      ...t,
      offsetX: clamp(t.offsetX - (dx / rect.width) * 2, -1, 1),
      offsetY: clamp(t.offsetY - (dy / rect.height) * 2, -1, 1),
    }));
  };
  const onPointerUp = () => {
    dragState.current = null;
  };

  /* ---- export ---- */
  const toBlob = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) return reject(new Error("no canvas"));
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
    });

  const download = async () => {
    try {
      const blob = await toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hh-goa-2026-${format}.png`;
      a.click();
      URL.revokeObjectURL(url);
      flash("Saved! 🎉");
    } catch {
      flash("Download failed.");
    }
  };

  const shareToX = async () => {
    setBusy(true);
    try {
      const blob = await toBlob();
      const file = new File([blob], `hh-goa-2026-${format}.png`, { type: "image/png" });

      // Best on mobile: native share sheet with the image attached directly.
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: CAPTION });
          flash("Shared! 🎉");
          return;
        } catch (err) {
          if ((err as Error)?.name === "AbortError") return; // user cancelled
        }
      }

      // Desktop: X's web composer can't accept a pre-attached image via URL, so
      // copy the actual PNG to the clipboard and open the composer with the
      // caption pre-filled — the user just pastes the image (⌘/Ctrl+V).
      let copied = false;
      try {
        if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          copied = true;
        }
      } catch {
        // clipboard blocked/unsupported → we fall back to a download below
      }

      const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(CAPTION)}`;

      if (copied) {
        toast.success("Poster copied to clipboard — opening X, just paste (⌘/Ctrl+V) 🌴", {
          duration: 2000,
        });
      } else {
        // guarantee the user has the file to attach manually
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hh-goa-2026-${format}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast("Poster downloaded — opening X, attach it to your tweet", { duration: 2000 });
      }

      // let the toast be seen for 2s, then head to the X composer
      window.setTimeout(() => {
        window.location.href = intent;
      }, 2000);
    } catch (e) {
      console.error(e);
      flash("Share failed — try Download instead.");
    } finally {
      setBusy(false);
    }
  };

  const canvasAspect = format === "pfp" ? "1 / 1" : "1080 / 1350";
  const gradCss = `linear-gradient(90deg, ${theme.stops.map(([, c]) => c).join(",")})`;
  const btnGrad = `linear-gradient(90deg, ${theme.sun2}, ${theme.stops[2][1]}, ${theme.stops[3][1]})`;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-10">
      {/* header */}
      <header className="text-center mb-6">
        <div
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
          style={{ background: "rgba(255,247,236,.08)", color: "rgba(255,247,236,.75)" }}
        >
          🌴 Hacker House · Goa · 2026
        </div>
        <h1
          className="mt-3 text-4xl sm:text-5xl font-black tracking-tight"
          style={{
            backgroundImage: gradCss,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Frame in Goa
        </h1>
        <p className="mt-2 text-sm sm:text-base" style={{ color: "rgba(255,247,236,.72)" }}>
          Drop a photo → get an on-brand HH Goa 2026 graphic → download or share to X.
        </p>
      </header>

      {/* format toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex p-1 rounded-full" style={{ background: "rgba(255,247,236,.08)" }}>
          {(
            [
              ["pfp", "PFP Frame"],
              ["card", "Builder ID"],
            ] as [Format, string][]
          ).map(([f, label]) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className="px-5 py-2 rounded-full text-sm font-bold transition cursor-pointer"
              style={
                format === f
                  ? { background: btnGrad, color: "#fff" }
                  : { color: "rgba(255,247,236,.7)" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* theme / gradient picker */}
      <div className="flex flex-col items-center gap-2 mb-7">
        <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,247,236,.5)" }}>
          Vibe · {theme.name}
        </span>
        <div className="flex gap-3">
          {THEMES.map((th) => {
            const active = th.id === theme.id;
            return (
              <button
                key={th.id}
                onClick={() => setTheme(th)}
                title={th.name}
                aria-label={th.name}
                className="rounded-full transition cursor-pointer"
                style={{
                  width: 40,
                  height: 40,
                  backgroundImage: `linear-gradient(135deg, ${th.stops.map(([, c]) => c).join(",")})`,
                  boxShadow: active
                    ? "0 0 0 3px #160e2e, 0 0 0 5px #fff7ec"
                    : "0 2px 8px rgba(0,0,0,.35)",
                  transform: active ? "scale(1.1)" : "scale(1)",
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] items-start">
        {/* preview */}
        <div>
          <div
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            className="relative rounded-3xl mx-auto"
            style={{
              maxWidth: format === "pfp" ? 460 : 420,
              outline: dragOver ? "3px dashed #FFD84D" : "none",
              outlineOffset: 8,
            }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="w-full h-auto rounded-3xl select-none touch-none block"
              style={{
                aspectRatio: canvasAspect,
                cursor: image ? "grab" : "pointer",
                border: "1px solid rgba(255,247,236,.14)",
                boxShadow: "0 24px 70px rgba(0,0,0,.5)",
              }}
              onClick={() => !image && fileRef.current?.click()}
            />
            {busy && (
              <div
                className="absolute inset-0 grid place-items-center rounded-3xl"
                style={{ background: "rgba(22,14,46,.55)", backdropFilter: "blur(2px)" }}
              >
                <span className="text-sm font-semibold animate-pulse">working…</span>
              </div>
            )}
          </div>

          {image && (
            <div className="mt-4 mx-auto" style={{ maxWidth: 460 }}>
              <label
                className="flex items-center gap-3 text-xs font-semibold"
                style={{ color: "rgba(255,247,236,.7)" }}
              >
                <span className="w-10">ZOOM</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={transform.zoom}
                  onChange={(e) => setTransform((t) => ({ ...t, zoom: parseFloat(e.target.value) }))}
                  className="flex-1"
                />
              </label>
              <p className="mt-2 text-center text-xs" style={{ color: "rgba(255,247,236,.5)" }}>
                Drag the photo to reposition · works with portrait, landscape, any crop
              </p>
            </div>
          )}
        </div>

        {/* controls */}
        <div className="flex flex-col gap-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.heic,.heif"
            className="hidden"
            onChange={onInputChange}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: "rgba(255,247,236,.10)", color: BRAND.colors.cream }}
          >
            {image ? <RefreshIcon /> : <UploadIcon />}
            {image ? "Change photo" : "Upload photo"}
          </button>

          {format === "card" && (
            <div
              className="flex flex-col gap-3 p-4 rounded-2xl"
              style={{ background: "rgba(255,247,236,.06)" }}
            >
              <Field label="Name" value={name} onChange={setName} placeholder="Ada Lovelace" />
              <Field
                label="Stack / role"
                value={role}
                onChange={setRole}
                placeholder="Full-stack · TypeScript"
              />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-xs font-bold tracking-wide"
                    style={{ color: "rgba(255,247,236,.6)" }}
                  >
                    BUILDER TITLE
                  </span>
                  <button
                    onClick={() => {
                      setTitleTouched(true);
                      setTitle(randomTitle());
                    }}
                    className="text-xs font-bold flex items-center gap-1 cursor-pointer"
                    style={{ color: theme.sun }}
                  >
                    <ShuffleIcon />
                    shuffle
                  </button>
                </div>
                <input
                  value={title}
                  onChange={(e) => {
                    setTitleTouched(true);
                    setTitle(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-sm font-semibold outline-none"
                  style={{ background: "rgba(0,0,0,.25)", color: BRAND.colors.cream }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={download}
              className="py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              style={{ background: "rgba(255,247,236,.12)", color: BRAND.colors.cream }}
            >
              <DownloadIcon />
              Download
            </button>
            <button
              onClick={shareToX}
              disabled={busy}
              className="py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: btnGrad, color: "#fff" }}
            >
              <XIcon />
              Share
            </button>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,247,236,.45)" }}>
            Everything renders in your browser — no upload, no login. On phones, Share attaches the
            image straight to X. On desktop, the image is copied to your clipboard and the tweet
            opens pre-filled — just paste (⌘/Ctrl+V). Caption &amp; {BRAND.hashtag} included.
          </p>
        </div>
      </div>

    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold tracking-wide" style={{ color: "rgba(255,247,236,.6)" }}>
        {label.toUpperCase()}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 rounded-xl text-sm font-semibold outline-none"
        style={{ background: "rgba(0,0,0,.25)", color: "#fff7ec" }}
      />
    </label>
  );
}

/* ------------------------------ icons ------------------------------ */
function Stroke({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

const UploadIcon = () => (
  <Stroke>
    <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    <path d="M12 15V3" />
    <path d="m7 8 5-5 5 5" />
  </Stroke>
);

const DownloadIcon = () => (
  <Stroke>
    <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
  </Stroke>
);

const RefreshIcon = () => (
  <Stroke>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v5h-5" />
  </Stroke>
);

const ShuffleIcon = () => (
  <Stroke>
    <path d="M16 3h5v5" />
    <path d="M4 20 21 3" />
    <path d="M21 16v5h-5" />
    <path d="M15 15l6 6" />
    <path d="M4 4l5 5" />
  </Stroke>
);

const XIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.9l-5.4-7.07L4.5 22H1.24l8.02-9.17L1 2h7.08l4.88 6.45L18.244 2Zm-1.2 18h1.9L7.05 4H5.02l12.02 16Z" />
  </svg>
);

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

const ADJ = ["Midnight", "Neon", "Turbo", "Sun-soaked", "Serverless", "Beachside", "Async", "Lo-fi"];
const NOUN = ["Shipper", "Voyager", "Sorcerer", "Maverick", "Nomad", "Alchemist", "Pilot", "Renegade"];
function randomTitle() {
  return `${ADJ[Math.floor(Math.random() * ADJ.length)]} ${
    NOUN[Math.floor(Math.random() * NOUN.length)]
  }`;
}
