/**
 * BusinessHub Pro — Logo / Icon Generator
 *
 * Design concept: "Queue List" mark
 *   Three rows of [ filled-circle + rounded-bar ], each row shorter than the
 *   one above — visually representing entries in a virtual queue/list.
 *   Pure white on pure black. Minimal, bold, instantly readable at any size.
 */

const { createCanvas, createImageData } = require('canvas');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');

// ── Helpers ──────────────────────────────────────────────────────────────────

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Core drawing ─────────────────────────────────────────────────────────────

/**
 * Draws the logo mark onto an existing canvas context, scaled to `size`.
 * `transparent` = skip the black background (for adaptive icon foreground).
 */
function drawLogo(ctx, size, { transparent = false, bgRadius = 0.219 } = {}) {
  const S = size; // shorthand

  // — Background —
  if (!transparent) {
    roundedRect(ctx, 0, 0, S, S, S * bgRadius);
    ctx.fillStyle = '#000000';
    ctx.fill();
  }

  // — White mark —
  ctx.fillStyle = '#FFFFFF';

  // Design constants (relative to 1024-unit grid, scaled by S/1024)
  const sc  = S / 1024;
  const DOT_R  = 54 * sc;          // circle radius (= half bar height)
  const BAR_H  = 108 * sc;         // bar height
  const CAP_R  = BAR_H / 2;        // bar end-cap radius
  const DOT_X  = 254 * sc;         // circle centre x
  const BAR_X  = 314 * sc;         // bar left edge x  (6px gap after circle)

  const ROWS = [
    { y: 280, barW: 510 },         // top row    — longest
    { y: 512, barW: 354 },         // middle row
    { y: 744, barW: 198 },         // bottom row — shortest
  ];

  for (const { y, barW } of ROWS) {
    const ry = y * sc;
    const bw = barW * sc;

    // Circle
    ctx.beginPath();
    ctx.arc(DOT_X, ry, DOT_R, 0, Math.PI * 2);
    ctx.fill();

    // Rounded bar
    roundedRect(ctx, BAR_X, ry - BAR_H / 2, bw, BAR_H, CAP_R);
    ctx.fill();
  }
}

// ── Asset generators ──────────────────────────────────────────────────────────

/** icon.png — 1024×1024, full logo with rounded-square black background */
function genIcon() {
  const canvas = createCanvas(1024, 1024);
  drawLogo(canvas.getContext('2d'), 1024);
  return canvas;
}

/**
 * adaptive-icon.png — 1024×1024
 * White mark only on transparent background.
 * Content is scaled to 72% (Android safe zone = 72 dp out of 108 dp)
 * and centred so the mark is never cropped by any adaptive-icon shape.
 */
function genAdaptiveIcon() {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');

  const safeZone = 0.72;
  const offset   = ((1 - safeZone) / 2) * 1024; // 143 px
  const draw_sz  = 1024 * safeZone;              // 737 px

  ctx.save();
  ctx.translate(offset, offset);
  drawLogo(ctx, draw_sz, { transparent: true });
  ctx.restore();

  return canvas;
}

/** favicon.png — 256×256 */
function genFavicon() {
  const canvas = createCanvas(256, 256);
  drawLogo(canvas.getContext('2d'), 256);
  return canvas;
}

/**
 * splash.png — 1242×2688 (portrait, covers iPhone Pro Max)
 * Centred logo on a solid black background.
 */
function genSplash() {
  const W = 1242, H = 2688;
  const LOGO       = 620;    // logo mark size
  const GAP        = 56;     // space between mark and wordmark
  const FONT_SIZE  = 64;     // wordmark size
  const BLOCK_H    = LOGO + GAP + FONT_SIZE; // total visual block height

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // Vertically centre the whole block (logo + wordmark) at 47% — feels natural
  const blockTop = H * 0.47 - BLOCK_H / 2;
  const lx = (W - LOGO) / 2;
  const ly = blockTop;

  // Draw logo mark (white elements, no background)
  const logoCanvas = createCanvas(LOGO, LOGO);
  drawLogo(logoCanvas.getContext('2d'), LOGO, { transparent: true });
  ctx.drawImage(logoCanvas, lx, ly);

  // Wordmark
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${FONT_SIZE}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('BUSINESSHUB PRO', W / 2, ly + LOGO + GAP + FONT_SIZE * 0.78);

  return canvas;
}

// ── Write files ───────────────────────────────────────────────────────────────

function save(canvas, filename) {
  const dest = path.join(ASSETS, filename);
  fs.writeFileSync(dest, canvas.toBuffer('image/png'));
  console.log(`  ✓  ${filename}`);
}

console.log('\nGenerating BusinessHub Pro assets…\n');
save(genIcon(),          'icon.png');
save(genAdaptiveIcon(),  'adaptive-icon.png');
save(genFavicon(),       'favicon.png');
save(genSplash(),        'splash.png');
console.log('\nDone!\n');
