/**
 * Asset Generation Script for BusinessHub Pro
 *
 * This script generates placeholder PNG assets for the app.
 * Run with: node scripts/generate-assets.js
 *
 * Requirements: Install 'canvas' package first
 * npm install canvas
 */

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const assetsDir = path.join(__dirname, "..", "assets");

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Colors matching the app theme
const PRIMARY_COLOR = "#1A1A1A"; // Dark gray/black
const BACKGROUND_COLOR = "#FFFFFF"; // White
const TEXT_COLOR = "#FFFFFF";

function createIcon(size, filename, isAdaptive = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = isAdaptive ? "transparent" : PRIMARY_COLOR;
  if (!isAdaptive) {
    // Rounded corners for regular icon
    const radius = size * 0.2;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    // For adaptive icon, fill entire canvas
    ctx.fillStyle = PRIMARY_COLOR;
    ctx.fillRect(0, 0, size, size);
  }

  // Text "BH"
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BH", size / 2, size / 2);

  // Save
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(path.join(assetsDir, filename), buffer);
  console.log(`Created: ${filename}`);
}

function createSplash(width, height, filename) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = PRIMARY_COLOR;
  ctx.fillRect(0, 0, width, height);

  // Logo circle
  const logoSize = Math.min(width, height) * 0.2;
  const centerX = width / 2;
  const centerY = height / 2 - 50;

  // Draw rounded rectangle for logo
  const logoRadius = logoSize * 0.2;
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.beginPath();
  ctx.moveTo(centerX - logoSize / 2 + logoRadius, centerY - logoSize / 2);
  ctx.lineTo(centerX + logoSize / 2 - logoRadius, centerY - logoSize / 2);
  ctx.quadraticCurveTo(
    centerX + logoSize / 2,
    centerY - logoSize / 2,
    centerX + logoSize / 2,
    centerY - logoSize / 2 + logoRadius,
  );
  ctx.lineTo(centerX + logoSize / 2, centerY + logoSize / 2 - logoRadius);
  ctx.quadraticCurveTo(
    centerX + logoSize / 2,
    centerY + logoSize / 2,
    centerX + logoSize / 2 - logoRadius,
    centerY + logoSize / 2,
  );
  ctx.lineTo(centerX - logoSize / 2 + logoRadius, centerY + logoSize / 2);
  ctx.quadraticCurveTo(
    centerX - logoSize / 2,
    centerY + logoSize / 2,
    centerX - logoSize / 2,
    centerY + logoSize / 2 - logoRadius,
  );
  ctx.lineTo(centerX - logoSize / 2, centerY - logoSize / 2 + logoRadius);
  ctx.quadraticCurveTo(
    centerX - logoSize / 2,
    centerY - logoSize / 2,
    centerX - logoSize / 2 + logoRadius,
    centerY - logoSize / 2,
  );
  ctx.closePath();
  ctx.fill();

  // "BH" text in logo
  ctx.fillStyle = PRIMARY_COLOR;
  ctx.font = `bold ${logoSize * 0.45}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BH", centerX, centerY);

  // App name below
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.font = `bold ${logoSize * 0.3}px Arial`;
  ctx.fillText("BusinessHub Pro", centerX, centerY + logoSize / 2 + 60);

  // Save
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(path.join(assetsDir, filename), buffer);
  console.log(`Created: ${filename}`);
}

function createFavicon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = PRIMARY_COLOR;
  ctx.fillRect(0, 0, size, size);

  // Text "BH"
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BH", size / 2, size / 2);

  // Save
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(path.join(assetsDir, filename), buffer);
  console.log(`Created: ${filename}`);
}

// Generate all assets
console.log("Generating app assets...\n");

try {
  createIcon(1024, "icon.png");
  createIcon(1024, "adaptive-icon.png", true);
  createSplash(1284, 2778, "splash.png");
  createFavicon(48, "favicon.png");
  console.log("\nAll assets generated successfully!");
} catch (error) {
  console.error("Error generating assets:", error.message);
  console.log("\nAlternative: Use the online tools mentioned below.");
}
