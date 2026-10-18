// services/imageService.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles image resizing into 3 sizes using Sharp
// original → as uploaded (after initial compress)
// medium   → 600×800px  (profile details, messages)
// thumb    → 300×300px  (sidebar, listing cards, header, dashboard)
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
  thumb:    { width: 300,   height: 300   }, // sidebar / listing / header (bumped from 150 for sharper display)
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

// ── Max dimension for the "original" — keeps full-quality look while avoiding
//    storing enormous multi-MB phone photos that are only used in the lightbox.
//    (#1 storage: cap + compress the original instead of saving it untouched.)
const ORIGINAL_MAX_DIM = 2000;

// ── Main function: process one image into 3 sizes ─────────────────────────────
// Returns { original, medium, thumb } — all relative paths for DB storage.
//
// Optimizations (no functional change — still produces the same 3 files/paths):
//   #1  the original is dimension-capped + compressed + EXIF-stripped instead of
//       being written untouched (big storage win; visually equivalent).
//   #3  the three sizes are produced in parallel (Promise.all) instead of
//       sequentially — faster uploads, same output.
//   #5  .rotate() applies EXIF orientation so phone photos aren't sideways, and
//       on any partial failure the files written so far are cleaned up so no
//       orphan files are left on disk.
const processImage = async (base64Image, userId) => {
  ensureDir(UPLOAD_DIR);

  const buffer    = base64ToBuffer(base64Image);
  const timestamp = Date.now();
  const baseName  = `user_${userId}_${timestamp}`;

  // All processed outputs are JPEG — write them with a .jpg extension so the
  // filename matches the actual bytes (previously medium/thumb kept the source
  // extension, e.g. a *_medium.png that actually held JPEG data).
  const originalFilename = `${baseName}_original.jpg`;
  const mediumFilename   = `${baseName}_medium.jpg`;
  const thumbFilename    = `${baseName}_thumb.jpg`;

  const originalPath = path.join(UPLOAD_DIR, originalFilename);
  const mediumPath   = path.join(UPLOAD_DIR, mediumFilename);
  const thumbPath    = path.join(UPLOAD_DIR, thumbFilename);

  const paths = {
    original: `/uploads/gallery/${originalFilename}`,
    medium:   `/uploads/gallery/${mediumFilename}`,
    thumb:    `/uploads/gallery/${thumbFilename}`,
  };

  try {
    // Generate all three sizes concurrently. Each sharp(buffer) pipeline decodes
    // independently, but running them in parallel uses available cores and keeps
    // total upload time close to the slowest single op rather than their sum.
    await Promise.all([
      // ── Original: capped to ORIGINAL_MAX_DIM, high-quality JPEG, EXIF stripped ──
      sharp(buffer)
        .rotate()                                  // apply EXIF orientation
        .resize(ORIGINAL_MAX_DIM, ORIGINAL_MAX_DIM, {
          fit: 'inside',
          withoutEnlargement: true                 // never upscale smaller images
        })
        .jpeg({ quality: 85 })                     // near-lossless at normal viewing
        .toFile(originalPath),

      // ── Medium (600×800, fit inside, no crop) ──────────────────────────────
      sharp(buffer)
        .rotate()
        .resize(SIZES.medium.width, SIZES.medium.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toFile(mediumPath),

      // ── Thumb (300×300, cover crop — square) ───────────────────────────────
      sharp(buffer)
        .rotate()
        .resize(SIZES.thumb.width, SIZES.thumb.height, {
          fit:      'cover',
          position: 'top'
        })
        .jpeg({ quality: 70 })
        .toFile(thumbPath),
    ]);
  } catch (err) {
    // Partial-failure cleanup: remove whatever was written so we don't leave
    // orphaned files on disk when one of the three outputs fails.
    [originalPath, mediumPath, thumbPath].forEach((p) => {
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (_) { /* best effort */ }
    });
    throw err;
  }

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