// Cấu hình runtime — có thể sửa trực tiếp trong dist/config.js sau khi build mà không cần build lại.
// Nếu để chuỗi rỗng '', ứng dụng sẽ dùng VITE_API_BASE_URL (trong file .env) hoặc gọi qua proxy /api.
window.__APP_CONFIG__ = {
  API_BASE_URL: '',
};
