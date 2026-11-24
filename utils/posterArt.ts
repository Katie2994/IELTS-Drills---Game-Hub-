import { FOLDER_DATA } from '../data/folders';
import { BaseFolderInfo } from '../types';

export const POSTER_W = 567;
export const POSTER_H = 763;

interface Palette {
  bg: string;
  accent: string;
  secondary: string;
  deep: string;
  highlight: string;
}

const PALETTES: Palette[] = [
  { bg: '#FBF2DC', accent: '#FBE46D', secondary: '#4A6FA5', deep: '#3A3550', highlight: '#F7D2D1' },
  { bg: '#F9E7DB', accent: '#F28F52', secondary: '#3A3550', deep: '#2D2842', highlight: '#FCEB93' },
  { bg: '#FCEFD6', accent: '#F29C9F', secondary: '#3E629C', deep: '#3A3550', highlight: '#FBE46D' },
  { bg: '#F7F1DF', accent: '#6B9975', secondary: '#FBE46D', deep: '#3A3550', highlight: '#F4B6A7' },
  { bg: '#EEF1F6', accent: '#3F639D', secondary: '#FBE46D', deep: '#3A3550', highlight: '#F9E3DF' },
  { bg: '#E8ECF4', accent: '#D95D4B', secondary: '#F7A964', deep: '#2F2A44', highlight: '#FFF9EC' },
  { bg: '#F4F3E4', accent: '#83A76E', secondary: '#FBE46D', deep: '#3A3550', highlight: '#6D8DB5' },
  { bg: '#FAEBE8', accent: '#E8837C', secondary: '#4C6B94', deep: '#3A3550', highlight: '#FCEB93' },
  { bg: '#FBE9E5', accent: '#FFFFFF', secondary: '#D97B6C', deep: '#3A3550', highlight: '#FBE46D' },
];

const posterCanvasCache = new Map<number, HTMLCanvasElement>();
const posterUrlCache = new Map<number, string>();

function seededRand(seed: number) {
  let s = (seed + 1) * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function drawGingham(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  colorA: string,
  colorB: string,
  size = 28
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = colorA;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = colorB;
  ctx.globalAlpha = 0.35;
  for (let gx = x; gx < x + w; gx += size * 2) {
    ctx.fillRect(gx, y, size, h);
  }
  for (let gy = y; gy < y + h; gy += size * 2) {
    ctx.fillRect(x, gy, w, size);
  }
  ctx.restore();
}

function drawStripes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  gap = 22,
  thickness = 9
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = color;
  for (let sx = x; sx < x + w; sx += gap) {
    ctx.fillRect(sx, y, thickness, h);
  }
  ctx.restore();
}

function drawCitrusSlice(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rindColor: string,
  pulpColor: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = rindColor;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF9EC';
  ctx.fill();

  for (let i = 0; i < 8; i++) {
    const a0 = (i * Math.PI) / 4 + 0.08;
    const a1 = ((i + 1) * Math.PI) / 4 - 0.08;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r * 0.78, a0, a1);
    ctx.closePath();
    ctx.fillStyle = pulpColor;
    ctx.fill();
  }
  ctx.restore();
}

function drawMotif(
  ctx: CanvasRenderingContext2D,
  game: BaseFolderInfo,
  index: number,
  pal: Palette
) {
  const rand = seededRand(index * 17 + 5);
  const W = POSTER_W;
  const H = POSTER_H;

  // Background paper
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);

  // Category-specific gouache tabletop / arch / cosmos backdrop
  if (game.category === 'Drills Originals') {
    // Sunny lemon tabletop & striped gingham frame
    drawGingham(ctx, 0, H * 0.62, W, H * 0.38, '#FFF9EC', pal.secondary, 26);
    ctx.fillStyle = pal.highlight;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.36, 175, 0, Math.PI * 2);
    ctx.fill();

    // Striped vessel or sun medallion
    ctx.fillStyle = pal.accent;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.42, 118, 0, Math.PI * 2);
    ctx.fill();
    drawCitrusSlice(ctx, W * 0.38, H * 0.68, 54, pal.accent, '#F4A236');
    drawCitrusSlice(ctx, W * 0.66, H * 0.72, 42, pal.secondary, pal.accent);

    // Bold gouache leaves
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.translate(W * 0.5 + (i - 2) * 38, H * 0.23 + Math.abs(i - 2) * 14);
      ctx.rotate((i - 2) * 0.35);
      ctx.fillStyle = '#5F8F6D';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (game.category === 'Phòng Thoát Hiểm') {
    // Architectural keyhole & warm arched doorway
    ctx.fillStyle = pal.secondary;
    ctx.fillRect(46, 56, W - 92, H - 140);
    ctx.fillStyle = pal.bg;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.36, 145, Math.PI, 0);
    ctx.lineTo(W * 0.5 + 145, H * 0.76);
    ctx.lineTo(W * 0.5 - 145, H * 0.76);
    ctx.closePath();
    ctx.fill();

    // Keyhole silhouette
    ctx.fillStyle = pal.deep;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.41, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(W * 0.5 - 24, H * 0.43);
    ctx.lineTo(W * 0.5 + 24, H * 0.43);
    ctx.lineTo(W * 0.5 + 42, H * 0.64);
    ctx.lineTo(W * 0.5 - 42, H * 0.64);
    ctx.closePath();
    ctx.fill();

    // Accent halo ring
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.41, 74, 0, Math.PI * 2);
    ctx.stroke();
  } else if (game.category === 'Giáo Dục') {
    // Striped tabletop & orbital / botanical geometry
    ctx.fillStyle = pal.highlight;
    ctx.fillRect(40, 44, W - 80, H * 0.55);
    drawStripes(ctx, 40, H * 0.6, W - 80, H * 0.25, pal.secondary, 26, 10);

    // Central planetary / globe rings
    ctx.strokeStyle = pal.deep;
    ctx.lineWidth = 3;
    for (let r = 64; r <= 160; r += 32) {
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.41, r, r * 0.56, -0.32 + index * 0.12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = pal.accent;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.41, 58, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting moons
    ctx.fillStyle = pal.secondary;
    ctx.beginPath();
    ctx.arc(W * 0.72, H * 0.34, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF9EC';
    ctx.beginPath();
    ctx.arc(W * 0.31, H * 0.48, 14, 0, Math.PI * 2);
    ctx.fill();
  } else if (game.category === 'Giải Đố') {
    // Tangram / checkered puzzle plate
    drawGingham(ctx, 56, 56, W - 112, H - 180, pal.bg, pal.accent, 42);
    ctx.fillStyle = pal.bg;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.44, 168, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = pal.deep;
    ctx.lineWidth = 5;
    ctx.stroke();

    // Gouache geometric tangram pieces
    ctx.fillStyle = pal.accent;
    ctx.beginPath();
    ctx.moveTo(W * 0.5 - 95, H * 0.34);
    ctx.lineTo(W * 0.5 + 85, H * 0.34);
    ctx.lineTo(W * 0.5 - 5, H * 0.49);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = pal.secondary;
    ctx.beginPath();
    ctx.moveTo(W * 0.5 + 85, H * 0.34);
    ctx.lineTo(W * 0.5 + 85, H * 0.55);
    ctx.lineTo(W * 0.5 - 15, H * 0.55);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = pal.highlight;
    ctx.beginPath();
    ctx.arc(W * 0.5 - 50, H * 0.52, 42, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Sáng Tạo & Giải Trí — playful striped pitcher & floating organic cutouts
    ctx.fillStyle = pal.highlight;
    ctx.fillRect(38, 42, W - 76, H - 150);

    // Organic curved shapes
    for (let i = 0; i < 6; i++) {
      const cx = 110 + rand() * (W - 220);
      const cy = 120 + rand() * (H - 340);
      const rad = 32 + rand() * 56;
      ctx.fillStyle = i % 2 === 0 ? pal.accent : pal.secondary;
      ctx.globalAlpha = 0.88;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Striped foreground plinth
    ctx.fillStyle = '#FFF9EC';
    ctx.fillRect(W * 0.28, H * 0.38, W * 0.44, H * 0.34);
    drawStripes(ctx, W * 0.28, H * 0.38, W * 0.44, H * 0.34, pal.deep, 30, 12);
    ctx.strokeStyle = pal.deep;
    ctx.lineWidth = 4;
    ctx.strokeRect(W * 0.28, H * 0.38, W * 0.44, H * 0.34);
  }

  // Gouache paper speckles for tactile warmth
  ctx.fillStyle = 'rgba(58, 53, 80, 0.04)';
  for (let i = 0; i < 420; i++) {
    const px = rand() * W;
    const py = rand() * H;
    ctx.fillRect(px, py, 2, 2);
  }

  // Bottom cream editorial band inside the poster
  ctx.fillStyle = '#FFF9EC';
  ctx.fillRect(0, H - 128, W, 128);
  ctx.fillStyle = 'rgba(58, 53, 80, 0.16)';
  ctx.fillRect(36, H - 128, W - 72, 1.5);

  // Poster index & title inside artwork
  ctx.fillStyle = '#3A3550';
  ctx.font = '500 18px "DM Mono", ui-monospace, monospace';
  ctx.fillText(
    `NO. ${String(index + 1).padStart(2, '0')} · ${game.category.toUpperCase()}`,
    36,
    H - 84
  );

  ctx.font = '600 42px "Oswald", "Arial Narrow", sans-serif';
  ctx.fillText(game.title.toUpperCase(), 36, H - 36, W - 72);

  // Crisp inner hairline border
  ctx.strokeStyle = 'rgba(58, 53, 80, 0.14)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, W - 36, H - 36);
}

export function clearPosterCache(): void {
  posterCanvasCache.clear();
  posterUrlCache.clear();
}

export function getPosterCanvas(index: number): HTMLCanvasElement {
  const safeIdx = ((index % FOLDER_DATA.length) + FOLDER_DATA.length) % FOLDER_DATA.length;
  const existing = posterCanvasCache.get(safeIdx);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const game = FOLDER_DATA[safeIdx];
    const pal = PALETTES[safeIdx % PALETTES.length];
    drawMotif(ctx, game, safeIdx, pal);
  }
  posterCanvasCache.set(safeIdx, canvas);
  return canvas;
}

export function getPosterDataUrl(index: number): string {
  const safeIdx = ((index % FOLDER_DATA.length) + FOLDER_DATA.length) % FOLDER_DATA.length;
  const existing = posterUrlCache.get(safeIdx);
  if (existing) return existing;
  const canvas = getPosterCanvas(safeIdx);
  const url = canvas.toDataURL('image/png');
  posterUrlCache.set(safeIdx, url);
  return url;
}

export function createLabelCanvas(game: BaseFolderInfo, index: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 260;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, 640, 260);
  ctx.fillStyle = '#3A3550';

  // Category (500 58px Newsreader at (30, 82))
  ctx.font = '500 48px "Newsreader", Georgia, serif';
  ctx.fillText(game.category, 30, 82, 580);

  // Title (italic 400 54px Newsreader at (30, 150))
  ctx.font = 'italic 400 50px "Newsreader", Georgia, serif';
  ctx.fillText(game.title, 30, 150, 580);

  // Meta ("DRILLS ORIGINAL · #01" in 400 30px DM Mono at 70% alpha at (30, 215))
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.font = '400 28px "DM Mono", ui-monospace, monospace';
  const tag = game.category === 'Drills Originals' ? 'ORIGINAL' : 'INTERACTIVE';
  ctx.fillText(`${tag} · #${String(index + 1).padStart(2, '0')}`, 30, 215, 580);
  ctx.restore();

  return canvas;
}
