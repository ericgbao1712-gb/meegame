// Địa chỉ máy chủ MeeGame (Vercel Serverless Function hoặc VPS).
// Tự động nhận diện domain hiện tại (meegame.io.vn hoặc vercel.app).
window.MEEGAME_API = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http'))
  ? window.location.origin
  : '';
