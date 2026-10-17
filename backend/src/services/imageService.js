// services/imageService.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles image resizing into 3 sizes using Sharp
// original → as uploaded (after initial compress)
// medium   → 600×800px  (profile details, messages)
// thumb    → 150×150px  (sidebar, listing cards, header, dashboard)
// ─────────────────────────────────────────────────────────────────────────────

const sharp  = require('sharp');
const path   = require('path');
const fs     = require('fs');

// ── Output directory — adjust if your uploads folder is different ─────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'gallery');

// ── Size configs ──────────────────────────────────────────────────────────────
const SIZES = {
  original: { width: null,  height: null  }, // kept as-is
  medium:   { width: 600,   height: 800   }, // profile details / messages
  thumb:    { width: 150,   height: 150   }, // sidebar / listing / header
};

// ── Ensure upload directory exists ────────────────────────────────────────────
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// ── Convert base64 to Buffer ──────────────────────────────────────────────────
const base64ToBuffer = (base64String) => {
  // Remove data:image/xxx;base64, prefix
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
};

// ── Get file extension from base64 ───────────────────────────────────────────
const getExtension = (base64String) => {
  const match = base64String.match(/^data:image\/(\w+);base64,/);
  return match ? match[1].replace('jpeg', 'jpg') : 'jpg';
};

// ── Main function: process one image into 3 sizes ─────────────────────────────
// Returns { original, medium, thumb } — all relative paths for DB storage
const processImage = async (base64Image, userId) => {
  ensureDir(UPLOAD_DIR);

  const buffer    = base64ToBuffer(base64Image);
  const ext       = getExtension(base64Image);
  const timestamp = Date.now();
  const baseName  = `user_${userId}_${timestamp}`;

  const paths = {
    original: null,
    medium:   null,
    thumb:    null
  };

  // ── Save original ────────────────────────────────────────────────────────
  const originalFilename = `${baseName}_original.${ext}`;
  const originalPath     = path.join(UPLOAD_DIR, originalFilename);

  await sharp(buffer)
    .toFile(originalPath);

  paths.original = `/uploads/gallery/${originalFilename}`;

  // ── Save medium (600×800, fit inside, no crop) ───────────────────────────
  const mediumFilename = `${baseName}_medium.${ext}`;
  const mediumPath     = path.join(UPLOAD_DIR, mediumFilename);

  await sharp(buffer)
    .resize(SIZES.medium.width, SIZES.medium.height, {
      fit:        'inside',      // maintain aspect ratio, no crop
      withoutEnlargement: true   // don't upscale small images
    })
    .jpeg({ quality: 80 })       // convert to jpg for consistency
    .toFile(mediumPath);

  paths.medium = `/uploads/gallery/${mediumFilename}`;

  // ── Save thumb (150×150, cover crop — square) ────────────────────────────
  const thumbFilename = `${baseName}_thumb.${ext}`;
  const thumbPath     = path.join(UPLOAD_DIR, thumbFilename);

  await sharp(buffer)
    .resize(SIZES.thumb.width, SIZES.thumb.height, {
      fit:      'cover',   // crop to fill square
      position: 'top'      // crop from top (face usually at top)
    })
    .jpeg({ quality: 70 })
    .toFile(thumbPath);

  paths.thumb = `/uploads/gallery/${thumbFilename}`;

  return paths;
};

// ── Delete all 3 sizes for a gallery record ───────────────────────────────────
const deleteImageFiles = (imagepath, imagepath_medium, imagepath_thumb) => {
  [imagepath, imagepath_medium, imagepath_thumb].forEach(relPath => {
    if (!relPath) return;
    try {
      const fullPath = path.join(__dirname, '..', 'public', relPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      console.error(`Failed to delete file ${relPath}:`, err.message);
    }
  });
};

module.exports = { processImage, deleteImageFiles };