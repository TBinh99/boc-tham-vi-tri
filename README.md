# Bốc Thăm Vị Trí

Trang web nhỏ cho đội bóng: mỗi trận random lại vị trí để ai cũng được đá vị trí mới. Anh em mở link, chọn tên mình là biết trận nào, ngày giờ nào, đá vị trí gì.

- Sơ đồ chiến thuật sân 5, sân 7, sân 11 (nhìn 3D hoặc 2D), mỗi vị trí một áo. Vị trí có 2 người vẫn một áo, tên ghi `Nam / Khoa`, ai đến sân trước đá trước.
- Đổi sơ đồ trong cùng loại sân (ví dụ 2-3-1 sang 3-2-1) thì giữ nguyên người, chỉ dời sang vị trí gần nhất. Chạm tên người này rồi chạm tên người khác để đổi chỗ, đưa người lên hoặc xuống tuyến.
- Random tránh nhóm vị trí mỗi người đã đá ở trận gần nhất. Người vừa đá chung được ưu tiên có vị trí riêng ở trận sau.
- Vai trò từng người: **Thủ môn chuyên** (có mặt là bắt gôn, không bị random), **Không bắt gôn**, hoặc **Xoay vòng**.
- Ngày giờ và sân của trận, giờ random, **hẹn giờ bốc thăm** (tới giờ trang tự random, ai mở cũng thấy cùng một kết quả).
- Chốt đội hình để lưu vào lịch sử, xem bảng "Ai đá vị trí gì", copy đội hình gửi nhóm chat.

Không có server. Dữ liệu cả đội nằm trong [`data/team.json`](data/team.json). Anh em chỉ đọc file này. Đội trưởng bấm Lưu thì trang ghi thẳng vào repo qua GitHub API bằng token của đội trưởng.

## Đưa lên GitHub Pages

1. Tạo repo mới trên GitHub, ví dụ `boc-tham-vi-tri`. Tài khoản miễn phí thì repo phải **public** mới bật được Pages. Nghĩa là ai có link repo cũng đọc được `data/team.json` (tên và số áo anh em).
2. Đẩy code lên:
   ```bash
   git remote add origin https://github.com/<tai-khoan>/boc-tham-vi-tri.git
   git push -u origin main
   ```
3. Trên GitHub: **Settings → Pages → Build and deployment**. Source chọn **Deploy from a branch**, Branch chọn **main** và thư mục **/ (root)**, rồi bấm Save.
4. Khoảng 1 phút sau trang chạy ở `https://<tai-khoan>.github.io/boc-tham-vi-tri/`. Gửi link này cho anh em.

## Đội trưởng: bật chế độ sửa

1. Tạo token tại <https://github.com/settings/personal-access-tokens/new> (fine-grained token):
   - **Repository access**: Only select repositories, chọn đúng repo này.
   - **Permissions → Repository permissions → Contents**: Read and write.
   - Đặt hạn dùng (ví dụ 1 năm).
2. Mở trang bằng link riêng của đội trưởng, tức là link thường thêm `#doi-truong` ở cuối (ví dụ `https://<tai-khoan>.github.io/boc-tham-vi-tri/#doi-truong`). Bảng **Chế độ đội trưởng** tự mở ra. Dán token rồi bấm **Kết nối GitHub**. Tên tài khoản và tên repo được tự điền từ địa chỉ trang.
3. Từ giờ trên máy đó bạn random, chốt, hẹn giờ… Mỗi lần lưu là một commit sửa `data/team.json`. Pages cập nhật sau khoảng 1 phút. Trang của anh em tự kiểm tra bản mới mỗi 1,5 phút.

Link thường luôn chỉ xem, kể cả trên máy đội trưởng: không có nút Random, Chốt, không sửa danh sách. Muốn sửa thì mở link `#doi-truong` trên máy đã kết nối token. Anh em không thấy nút Đội trưởng, và không có token thì không lưu được gì vào repo.

Sửa mà chưa bấm Lưu thì trang giữ lại trên máy (tải lại trang không mất). Muốn bỏ thì bấm **Bỏ thay đổi** ở thanh dưới cùng, trang quay về bản đang lưu trên GitHub. Kết quả bốc thăm hẹn giờ thì máy nào cũng tự ra giống nhau, bấm **Chốt đội hình** để lưu vào lịch sử, hoặc **Random** để thay bằng kết quả khác.

Token chỉ lưu trong trình duyệt của đội trưởng và chỉ gửi tới `api.github.com`. Mọi trang GitHub Pages của cùng một tài khoản dùng chung địa chỉ gốc `<tai-khoan>.github.io`, nên hãy dùng token **chỉ cấp cho repo này** và có hạn dùng. Bấm **Thoát chế độ đội trưởng** để xoá token khỏi máy.

Không muốn dùng token? Chọn **Chỉ sửa trên máy này**. Sửa xong bấm **Tải file team.json**, rồi tự thay file `data/team.json` trong repo và commit.

## Chạy trên máy

Cần Node.js (không có thư viện ngoài).

```bash
npm start
```

Mở <http://localhost:8765>. Mở thẳng `index.html` bằng trình duyệt sẽ không đọc được `data/team.json`.

```bash
npm test
```

Test kiểm tra thuật toán: mọi người có đúng một vị trí, 12 trận liên tiếp không ai lặp nhóm vị trí trận trước, việc đá chung được xoay vòng, thủ môn chuyên luôn ở gôn, "không bắt gôn" không bị xếp vào gôn, cùng seed thì ra cùng đội hình (để bốc thăm hẹn giờ ở máy nào cũng giống nhau). GitHub Actions chạy test này mỗi lần đẩy code (bỏ qua các commit chỉ sửa `data/`).

## Các file

| File | Nội dung |
| --- | --- |
| `index.html` | Khung trang |
| `app.js` | Giao diện, sơ đồ sân, lưu lên GitHub |
| `app.css` | Giao diện sáng/tối |
| `lineup-core.js` | Thuật toán xếp vị trí (Hungarian + trọng số lịch sử), dùng chung cho trang và test |
| `data/team.json` | Dữ liệu đội: danh sách, đội hình hiện tại, lịch sử các trận |
| `tests/lineup.test.js` | Test thuật toán |
| `scripts/serve.js` | Máy chủ tĩnh để chạy trên máy |

`data/team.json` lúc đầu là **danh sách mẫu** (Hùng, Nam, Tú…). Vào tab Cầu thủ để sửa, hoặc bấm "Xoá danh sách mẫu".
