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

## Chạy local
```bash
npm install
npm run dev
```

## Chạy bằng Docker
```bash
docker build -t hrm-web .
docker run -p 8080:80 hrm-web
```
