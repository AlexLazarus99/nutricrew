/** Parse #hex, rgb(), rgba() for canvas gradients. */

export type Rgb = [number, number, number];

const FALLBACK_SKY: Rgb = [135, 206, 235];

export function parseColorRgb(color: string): Rgb {
  if (!color || typeof color !== "string") return FALLBACK_SKY;

  const rgba = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgba) {
    return [
      Number(rgba[1]) || 0,
      Number(rgba[2]) || 0,
      Number(rgba[3]) || 0,
    ];
  }

  let h = color.trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) {
    h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  }
  if (h.length < 6) return FALLBACK_SKY;

  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return FALLBACK_SKY;
  }
  return [r, g, b];
}

export function rgbString(rgb: Rgb): string {
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

export function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

export function lerpColorStr(a: string, b: string, t: number): string {
  return rgbString(lerpRgb(parseColorRgb(a), parseColorRgb(b), t));
}

export function sanitizeBiomePalette(pal: {
  skyTop: string;
  skyMid: string;
  skyBot: string;
  landTop: string;
  landMid: string;
  landBot: string;
  landSoil: string;
  waterTop: string;
  waterMid: string;
  waterBot: string;
  farMountains: string;
  grass: string;
}): typeof pal {
  const fix = (c: string, fallback: string) => {
    const [r, g, b] = parseColorRgb(c);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return fallback;
    return rgbString([r, g, b]);
  };
  return {
    skyTop: fix(pal.skyTop, "#87CEEB"),
    skyMid: fix(pal.skyMid, "#B8E6FF"),
    skyBot: fix(pal.skyBot, "#9BD4F5"),
    landTop: fix(pal.landTop, "#8BC34A"),
    landMid: fix(pal.landMid, "#7CB342"),
    landBot: fix(pal.landBot, "#689F38"),
    landSoil: fix(pal.landSoil, "#6D4C41"),
    waterTop: fix(pal.waterTop, "#4FC3F7"),
    waterMid: fix(pal.waterMid, "#29B6F6"),
    waterBot: fix(pal.waterBot, "#01579B"),
    farMountains: pal.farMountains.includes("rgba") ? pal.farMountains : fix(pal.farMountains, "#64748b"),
    grass: fix(pal.grass, "#558B2F"),
  };
}
