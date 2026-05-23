PHIEN BAN GOOGLE APPS SCRIPT

Muc tieu:
- Chay nhu web app tren Google Apps Script.
- Du lieu nam trong Google Drive, file ten: personal_dictionary_data.json
- Khong import LD2/BGL tren web. LD2/BGL can import truoc bang ban local, roi dung JSON da co.
- Nguoi dung co the tim, them, sua, xoa muc tu sau khi release.

Thu muc nay gom:
- Code.gs
- Index.html
- appsscript.json
- personal_dictionary_data.json  (du lieu tu ban local hien tai, can upload len Google Drive)
- donate_qr.png  (anh QR donate, upload len Google Drive neu muon hien nut Ung ho)

Cach trien khai:
1. Vao https://script.google.com
2. Tao project moi.
3. Tao/copy 3 file:
   - Code.gs
   - Index.html
   - appsscript.json
4. Upload file personal_dictionary_data.json len Google Drive cua tai khoan trien khai.
5. Upload anh QR donate len Google Drive va dat ten dung la: donate_qr.png
6. Dam bao tren Drive chi co mot file ten personal_dictionary_data.json va mot file ten donate_qr.png.
7. Trong Apps Script, bam Deploy > New deployment > Web app.
8. Chon:
   - Execute as: Me
   - Who has access: tuy nhu cau cua ban
9. Mo web app URL.

Luu y quan trong:
- Lan dau chay, script se tim file personal_dictionary_data.json tren Drive theo ten.
- Neu khong thay, script se tu tao file rong cung ten.
- Neu khong thay donate_qr.png, nut Ung ho se tu an.
- Neu co nhieu file cung ten tren Drive, script dung file dau tien Drive tra ve. Nen chi de mot file ten nay.
- Moi lan them/sua/xoa, script ghi lai toan bo JSON vao Drive. Du lieu qua lon se cham hon ban local.
- Neu nhieu nguoi sua cung luc, script co LockService de giam xung dot, nhung khong phai database thuc thu.

Goi y su dung:
- Ban release cho nguoi dung xem/sua chung: Deploy web app voi quyen phu hop.
- Neu moi nguoi can tu dien rieng: moi nguoi nen copy rieng Apps Script + JSON vao Drive cua ho.
