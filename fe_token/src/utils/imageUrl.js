
// src/utils/imageUrl.js
const BASE = process.env.REACT_APP_API_BASE_URL?.replace('/api', '')
             || 'http://localhost:9012';
// const BASE = process.env.REACT_APP_API_BASE_URL?.replace('/api', '')
//              || 'https://telugusambandham.com';

export const imageUrl = (path) => {
  if (!path) return null;

  // ✅ Already a full URL — return as-is
  if (path.startsWith('http')) return path;

  // ✅ Base64 — return as-is
  if (path.startsWith('data:')) return path;

  // ✅ Local webpack asset (starts with /static/ or is a blob)
  // These come from import statements like: import notfound from '...'
  // Webpack gives them paths like /static/media/notfound.abc123.png
  if (path.startsWith('/static/') || path.startsWith('blob:')) return path;

  // ✅ Relative backend path — prepend backend base URL
  // e.g. /uploads/gallery/user_7_timestamp_original.jpg
  return `${BASE}${path}`;
};
