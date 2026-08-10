// HH GOA 2026 — brand tokens & helpers

export const BRAND = {
  event: "HACKER HOUSE",
  place: "GOA",
  year: "2026",
  hashtag: "#FrameInGoa",
  // Goa sunset over the sea
  colors: {
    pink: "#FF2E7E",
    coral: "#FF6B4A",
    orange: "#FF9E2C",
    gold: "#FFD84D",
    purple: "#6C2BD9",
    indigo: "#241B4E",
    teal: "#00E5C7",
    sea: "#0FB8C9",
    cream: "#FFF7EC",
    ink: "#160E2E",
  },
} as const;

/** A selectable colourway. Everything the renderer tints comes from here. */
export interface Theme {
  id: string;
  name: string;
  /** main gradient stops (top→bottom / start→end) */
  stops: [number, string][];
  sun: string; // bright warm accent (sun disc, "GOA" word start)
  sun2: string; // secondary warm accent (rays, "2026")
  accent: string; // contrasting pop (role text, waves, palms)
  bg: string; // dark backdrop
  bgDeep: string; // deepest backdrop
}

export const THEMES: Theme[] = [
  {
    id: "sunset",
    name: "Goa Sunset",
    stops: [
      [0.0, "#FFD84D"],
      [0.28, "#FF9E2C"],
      [0.55, "#FF4E7A"],
      [0.78, "#B4308F"],
      [1.0, "#3A1E6E"],
    ],
    sun: "#FFD84D",
    sun2: "#FF9E2C",
    accent: "#00E5C7",
    bg: "#241B4E",
    bgDeep: "#160E2E",
  },
  {
    id: "neon",
    name: "Neon Punch",
    stops: [
      [0.0, "#FDE047"],
      [0.24, "#FB7233"],
      [0.5, "#F43F5E"],
      [0.74, "#D946EF"],
      [1.0, "#4C1D95"],
    ],
    sun: "#FDE047",
    sun2: "#FB7233",
    accent: "#2DD4BF",
    bg: "#2A1150",
    bgDeep: "#170A34",
  },
  {
    id: "lagoon",
    name: "Lagoon",
    stops: [
      [0.0, "#FEF08A"],
      [0.28, "#34D399"],
      [0.55, "#06B6D4"],
      [0.8, "#3B82F6"],
      [1.0, "#312E81"],
    ],
    sun: "#FEF08A",
    sun2: "#34D399",
    accent: "#FB7185",
    bg: "#172554",
    bgDeep: "#0B1437",
  },
  {
    id: "miami",
    name: "Miami",
    stops: [
      [0.0, "#67E8F9"],
      [0.3, "#22D3EE"],
      [0.55, "#818CF8"],
      [0.8, "#C026D3"],
      [1.0, "#3B0764"],
    ],
    sun: "#A7F3E0",
    sun2: "#22D3EE",
    accent: "#FDE047",
    bg: "#1E1B4B",
    bgDeep: "#130E2E",
  },
];

export const DEFAULT_THEME = THEMES[0];

export function themeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}

const TITLE_ADJ = [
  "Midnight", "Serverless", "Neon", "Sun-soaked", "Caffeinated", "Recursive",
  "Turbo", "Async", "Lo-fi", "Quantum", "Beachside", "Zero-Downtime",
  "Full-Stack", "Edge", "Bare-Metal", "Prompt-Whispering",
];

const TITLE_NOUN = [
  "Shipper", "Voyager", "Sorcerer", "Prototyper", "Architect", "Wrangler",
  "Hacker", "Alchemist", "Nomad", "Maverick", "Pilot", "Tinkerer",
  "Builder", "Renegade", "Navigator", "Dreamer",
];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic, fun "builder title" seeded by name + stack. */
export function builderTitle(name: string, stack: string): string {
  const seed = hashString(`${name.trim().toLowerCase()}|${stack.trim().toLowerCase()}` || "goa");
  const adj = TITLE_ADJ[seed % TITLE_ADJ.length];
  const noun = TITLE_NOUN[(seed >>> 8) % TITLE_NOUN.length];
  return `${adj} ${noun}`;
}

/** Stable pseudo builder-id, seeded by name. */
export function builderId(name: string): string {
  const seed = hashString(name.trim().toLowerCase() || "goa2026");
  const n = (seed % 9000) + 1000;
  return `GOA-26-${n}`;
}
