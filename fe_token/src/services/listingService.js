 
// src/services/listingService.js
import api from '../utils/api';
import axios from 'axios';

// ── Public axios instance — no Authorization header ───────────────────────────
const publicApi = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// PUBLIC — GET /api/getAllUsers (no token)
export const getAllUsers = async (page, limit, gender = null) => {
  const genderQuery = gender ? `&gender=${encodeURIComponent(gender)}` : '';
  return await publicApi.get(`/getAllUsers?page=${page}&limit=${limit}${genderQuery}`);
};

// PUBLIC — POST /api/getPublicProfile (no token)
export const getPublicProfile = async (uid) => {
  return await publicApi.post('/getPublicProfile', { uid });
};

// PROTECTED — POST /api/Fetchlistdata (token required)
export const searchUsers = async (filters, page, limit) => {
  return await api.post('/Fetchlistdata', { ...filters, page, limit });
};

// PROTECTED — POST /api/GetUserGallery (token required)
export const getUserGallery = async (uid) => {
  return await api.post('/GetUserGallery', { uid });
};

// PUBLIC — GET gallery without token for listing page profile pics
export const getPublicGallery = async (uid) => {
  return await publicApi.post('/GetUserGallery', { uid });
};