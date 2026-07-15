# Thư gửi Trinh — cinematic scrollytelling

Một trải nghiệm frontend thuần client-side cho bức thư, dùng Vite + GSAP ScrollTrigger + Lenis + SplitType + Three.js + Lucide.

## Chạy local

```bash
npm install
npm run dev
```

Sau đó mở URL mà Vite in ra trong terminal.

## Build production

```bash
npm run build
npm run preview
```

## Cấu trúc chính

- `index.html`: shell, loading screen, phong thư và layout trang.
- `src/data/letter.js`: nội dung thư được chia thành 10 hồi.
- `src/main.js`: render scene, GSAP/ScrollTrigger, Lenis, particles Three.js, audio ambience và interactions.
- `src/styles.css`: visual system trắng / pastel / rose-red, envelope, wax seal, visual motif và responsive.

Không cần ảnh ngoài: nền hạt, cánh hoa, visual các hồi, wax seal và SVG story spine đều được dựng bằng CSS/SVG/WebGL để dễ deploy static.

## Thêm nhạc nền

Chép file nhạc vào `public/audio/letter.mp3`. File sẽ tự phát khi người đọc chạm vào sáp niêm phong và có thể bật/tắt lại bằng nút loa ở góc trên. Nếu dùng tên file khác, sửa `data-src="./audio/letter.mp3"` trong `index.html`.
