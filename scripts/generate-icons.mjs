/**
 * Generates icon.png, adaptive-icon.png, splash.png and favicon.png
 * from an inline SVG design (location-pin style, BusinessHub Pro branding).
 *
 * Run:  node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '..', 'assets');

// ─── SVG Design ──────────────────────────────────────────────────────────────
// Location-pin icon, green + white, professional — inspired by the SafarGuide
// style the user requested. The pin contains a small storefront / building icon
// to represent "Business Hub".
// viewBox is 1024×1200 so the pin tail has room below the circle.

const iconSvg = (bg = 'white') => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1200" width="1024" height="1200">
  <!-- Background (square for icon.png; transparent adaptive uses no bg rect) -->
  ${bg !== 'transparent' ? `<rect width="1024" height="1200" fill="${bg}" rx="0"/>` : ''}

  <!-- ── Location pin shadow (subtle depth) ───────────────────────────── -->
  <ellipse cx="512" cy="1118" rx="130" ry="28" fill="rgba(0,0,0,0.18)"/>

  <!-- ── Pin outer body ────────────────────────────────────────────────── -->
  <path
    d="M512 80
       C316 80  158 238  158 434
       C158 572 228 692  320 790
       L512 1090
       L704 790
       C796 692  866 572  866 434
       C866 238  708 80   512 80 Z"
    fill="#155F33"
  />

  <!-- ── Pin main body (lighter green) ─────────────────────────────────── -->
  <path
    d="M512 105
       C330 105  183 252  183 434
       C183 564  249 678  338 774
       L512 1058
       L686 774
       C775 678  841 564  841 434
       C841 252  694 105  512 105 Z"
    fill="#1E8F4E"
  />

  <!-- ── Inner white circle ────────────────────────────────────────────── -->
  <circle cx="512" cy="420" r="240" fill="white"/>

  <!-- ── Storefront / building icon inside circle (in green) ───────────── -->
  <!-- Roof triangle -->
  <polygon points="370,360 512,268 654,360" fill="#155F33"/>
  <!-- Roof ridge cap -->
  <rect x="370" y="356" width="284" height="16" rx="4" fill="#0D4023"/>
  <!-- Building body -->
  <rect x="382" y="372" width="260" height="180" rx="6" fill="#1E8F4E"/>
  <!-- Left window -->
  <rect x="400" y="390" width="72" height="64" rx="6" fill="white" opacity="0.9"/>
  <!-- Right window -->
  <rect x="552" y="390" width="72" height="64" rx="6" fill="white" opacity="0.9"/>
  <!-- Door -->
  <rect x="464" y="434" width="84" height="118" rx="8" fill="white" opacity="0.95"/>
  <!-- Door knob -->
  <circle cx="538" cy="500" r="7" fill="#1E8F4E"/>
  <!-- Step -->
  <rect x="440" y="548" width="144" height="12" rx="4" fill="#155F33"/>

  <!-- ── Circular ring at pin tip ───────────────────────────────────────── -->
  <circle cx="512" cy="420" r="248" fill="none" stroke="#155F33" stroke-width="12" opacity="0.4"/>
</svg>
`;

// ─── Splash SVG (full-screen, icon centered on black) ────────────────────────
const splashSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1284 2778" width="1284" height="2778">
  <rect width="1284" height="2778" fill="#000000"/>

  <!-- Pin shadow -->
  <ellipse cx="642" cy="1740" rx="130" ry="28" fill="rgba(255,255,255,0.08)"/>

  <!-- Pin outer -->
  <path
    d="M642 900
       C446 900 288 1058 288 1254
       C288 1392 358 1512 450 1610
       L642 1910
       L834 1610
       C926 1512 996 1392 996 1254
       C996 1058 838 900 642 900 Z"
    fill="#155F33"
  />
  <!-- Pin body -->
  <path
    d="M642 925
       C460 925 313 1072 313 1254
       C313 1384 379 1498 468 1594
       L642 1882
       L816 1594
       C905 1498 971 1384 971 1254
       C971 1072 824 925 642 925 Z"
    fill="#1E8F4E"
  />
  <!-- White circle -->
  <circle cx="642" cy="1240" r="240" fill="white"/>
  <!-- Roof -->
  <polygon points="500,1180 642,1088 784,1180" fill="#155F33"/>
  <rect x="500" y="1176" width="284" height="16" rx="4" fill="#0D4023"/>
  <!-- Body -->
  <rect x="512" y="1192" width="260" height="180" rx="6" fill="#1E8F4E"/>
  <!-- Windows -->
  <rect x="530" y="1210" width="72" height="64" rx="6" fill="white" opacity="0.9"/>
  <rect x="682" y="1210" width="72" height="64" rx="6" fill="white" opacity="0.9"/>
  <!-- Door -->
  <rect x="594" y="1254" width="84" height="118" rx="8" fill="white" opacity="0.95"/>
  <circle cx="668" cy="1320" r="7" fill="#1E8F4E"/>
  <rect x="570" y="1368" width="144" height="12" rx="4" fill="#155F33"/>
  <!-- Ring -->
  <circle cx="642" cy="1240" r="248" fill="none" stroke="#155F33" stroke-width="12" opacity="0.4"/>

  <!-- App name -->
  <text x="642" y="2000" font-family="Arial, Helvetica, sans-serif"
        font-size="72" font-weight="900" fill="white" text-anchor="middle"
        letter-spacing="-1">BusinessHub Pro</text>
  <text x="642" y="2070" font-family="Arial, Helvetica, sans-serif"
        font-size="36" font-weight="400" fill="#666666" text-anchor="middle">Smart Queue Management</text>
</svg>
`;

// ─── Generate PNGs ────────────────────────────────────────────────────────────

async function gen(svgStr, outFile, width, height) {
  const buf = Buffer.from(svgStr.trim());
  await sharp(buf, { density: 300 })
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outFile);
  console.log(`✅  ${outFile.replace(ASSETS + path.sep, 'assets/')}`);
}

(async () => {
  try {
    // icon.png — 1024×1024, white background (iOS requires opaque icon)
    await gen(iconSvg('white'), path.join(ASSETS, 'icon.png'), 1024, 1024);

    // adaptive-icon.png — 1024×1024, transparent (Android puts its own bg)
    await gen(iconSvg('transparent'), path.join(ASSETS, 'adaptive-icon.png'), 1024, 1024);

    // favicon.png — 64×64
    await gen(iconSvg('white'), path.join(ASSETS, 'favicon.png'), 64, 64);

    // splash.png — 1284×2778 (iPhone 13 Pro Max, covers most phones)
    await gen(splashSvg, path.join(ASSETS, 'splash.png'), 1284, 2778);

    console.log('\n🎉  All assets generated in /assets');
  } catch (err) {
    console.error('❌  Generation failed:', err.message);
    process.exit(1);
  }
})();
