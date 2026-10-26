# 📘 Hướng Dẫn Đưa Web Lên GitHub & Bật GitHub Pages Cho Bạn Dương

Trang web học Từ vựng HSK 2 được thiết kế theo dạng **Web tĩnh (Static Web: HTML, CSS, JS)** thuần túy, hoàn toàn không cần server phức tạp. Bạn có thể đưa lên **GitHub Pages** hoàn toàn **miễn phí 100%**, có link HTTPS bảo mật để gửi cho bạn Dương học trên điện thoại, máy tính bảng hay máy tính đều cực kỳ mượt mà!

---

## 🌟 BƯỚC 1: Tạo Repository mới trên GitHub

1. Truy cập [github.com](https://github.com) và đăng nhập (hoặc đăng ký tài khoản nếu chưa có).
2. Bấm vào dấu **`+`** ở góc trên bên phải màn hình ➔ Chọn **`New repository`**.
3. Điền thông tin:
   - **Repository name**: Đặt tên bất kỳ, ví dụ: `hsk2-duong` hoặc `hsk2-master`.
   - **Public**: Chọn **Public** (để dùng được tính năng GitHub Pages miễn phí).
   - **Lưu ý**: **KHÔNG CẦN** tích chọn *"Add a README file"* (vì thư mục của bạn đã có sẵn file README).
4. Bấm nút xanh **`Create repository`**.

Sau khi tạo xong, GitHub sẽ hiển thị đường link repository của bạn, ví dụ:
`https://github.com/tai-khoan-cua-ban/hsk2-duong.git`

---

## 🚀 BƯỚC 2: Tải code lên GitHub (Chọn 1 trong 2 cách cực dễ bên dưới)

### CÁCH 1: Dùng file tự động `deploy-github.bat` (Khuyên dùng - 10 giây là xong)

1. Mở thư mục này trên máy tính của bạn: `Web cho bạn Dương`.
2. Nhấp đúp chuột vào file **`deploy-github.bat`**.
3. Một cửa sổ đen hiện ra, bạn chỉ cần **dán link repository vừa tạo ở Bước 1** vào và nhấn **Enter**.
4. File sẽ tự động nén, thêm toàn bộ mã nguồn và đẩy thẳng lên GitHub cho bạn!

---

### CÁCH 2: Kéo thả trực tiếp trên trình duyệt Web (Không cần gõ lệnh)

Nếu bạn không muốn dùng dòng lệnh:
1. Trên trang repository vừa tạo ở Bước 1, tìm dòng chữ xanh: **`uploading an existing file`** và bấm vào đó.
2. Mở thư mục `Web cho bạn Dương` trên máy tính, chọn các file sau và **kéo thả chuột** vào trình duyệt:
   - `index.html`
   - `style.css`
   - `data.js`
   - `app.js`
   - `words_hsk2.json`
   - `README.md`
3. Ở ô phía dưới, bấm nút xanh **`Commit changes`**.

---

## 🌐 BƯỚC 3: Bật GitHub Pages để lấy Link Web gửi cho Dương

Sau khi code đã lên GitHub:
1. Trong trang repository trên GitHub, bấm vào tab **`Settings`** (ở hàng menu trên cùng, cạnh Insights).
2. Ở cột menu bên trái, cuộn xuống và bấm vào mục **`Pages`**.
3. Tại phần **`Build and deployment`**:
   - Ở mục **Source**: Chọn `Deploy from a branch`.
   - Ở mục **Branch**:
     - Chọn nhánh: **`main`** (hoặc `master`).
     - Thư mục: Giữ nguyên **`/(root)`**.
   - Bấm nút **`Save`**.
4. Bạn đợi khoảng **1 - 2 phút**, sau đó tải lại trang (F5). Bạn sẽ thấy xuất hiện một thông báo màu xanh:
   > **"Your site is live at https://tai-khoan-cua-ban.github.io/hsk2-duong/"**

🎉 **Xong!** Bạn chỉ cần copy link đó và gửi ngay cho bạn Dương qua Zalo/Facebook/Telegram để bạn Dương mở trên điện thoại hay máy tính là học được ngay!

---

## ✨ Các tính năng đã tích hợp sẵn cho bạn Dương:

- **150 Từ vựng HSK 2 chuẩn**: Trích xuất trực tiếp từ Sheet 2 của file Excel, đầy đủ Chữ Hán, Phiên âm Pinyin, Nghĩa tiếng Việt và **Câu ví dụ kèm dịch nghĩa**.
- **Chuyển đổi kiểu đáp án linh hoạt**:
  - Có thể chọn đáp án hiển thị là **Tiếng Việt**, **Pinyin**, hoặc **Chữ Hán** tùy ý thích.
- **4 Chế độ luyện tập & Game**:
  1. **🎴 Flashcard**: Lật thẻ 3D, nghe giọng phát âm chuẩn, ví dụ minh họa, chế độ tự động chạy.
  2. **🎯 Trắc nghiệm ABCD**: 15 câu mỗi lượt, tính điểm combo chuỗi đúng, âm thanh vui nhộn.
  3. **🎧 Nghe đoán từ**: Phát âm tiếng Trung chuẩn bản xứ (có chế độ đọc chậm 0.7x), chọn nghĩa hoặc pinyin.
  4. **🈶 Nhìn nghĩa chọn chữ**: Rèn luyện khả năng nhận diện mặt chữ Hán nhanh.
  5. **📖 Tra cứu 150 từ**: Tìm kiếm nhanh mọi từ, lọc từ đã thuộc, từ yêu thích.
- **Ghi nhớ tiến độ tự động**: Dương học đến đâu, hệ thống tự động lưu vào trình duyệt (localStorage), không lo mất dữ liệu khi tắt web!
