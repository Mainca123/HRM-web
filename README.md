# HRM-web

Cổng quản trị hệ thống Nhân sự & Chấm công (HRM Admin Portal) xây dựng bằng React + Vite + TypeScript + Tailwind CSS.

## Tính năng chính
- Đăng nhập & phân quyền dành riêng cho Admin / HR.
- Dashboard tổng quan quân số, chuyên cần theo phòng ban & toàn công ty.
- Sơ đồ tổ chức & định vị vị trí nhân sự (Org Chart).
- Quản lý Nhân viên, Tài khoản & Phân quyền, Danh mục Phòng ban / Chức vụ / Ca làm việc.
- Quản lý Chấm công theo ngày kèm đối chiếu tọa độ GPS (mở Google Maps) & Tổng hợp công tháng.
- Phê duyệt tập trung Nghỉ phép, Tăng ca (OT) và Giải trình đi muộn/về sớm.
- Báo cáo tổng hợp & xuất file CSV/Excel chuẩn UTF-8.

## Cấu hình API Base URL

Ứng dụng hỗ trợ thay đổi Base URL của Backend API linh hoạt theo 3 cách (ưu tiên từ trên xuống dưới):

1. **Runtime sau khi build (không cần build lại)** — sửa file `public/config.js` (hoặc `dist/config.js` sau khi build):
   ```js
   window.__APP_CONFIG__ = {
     API_BASE_URL: 'https://your-api-domain.com',
   };
   ```
2. **Biến môi trường `.env` (khi chạy local / build)** — sao chép `.env.example` thành `.env` và sửa:
   ```env
   VITE_API_BASE_URL=https://hrm-tmyj.onrender.com
   VITE_API_PROXY_TARGET=https://hrm-tmyj.onrender.com
   ```
   *(Nếu để `VITE_API_BASE_URL` trống, ứng dụng gọi qua `/api` và đi qua proxy của Vite khi dev hoặc Nginx khi chạy Docker.)*
3. **Docker runtime** — truyền biến môi trường `API_BASE_URL` khi chạy container (không cần build lại image):
   ```bash
   docker run -p 8080:80 -e API_BASE_URL=https://your-api-domain.com hrm-web
   ```

## Chạy local
```bash
npm install
npm run dev
```

## Chạy bằng Docker
```bash
docker build -t hrm-web .
docker run -p 8080:80 -e API_BASE_URL=https://hrm-tmyj.onrender.com hrm-web
```
