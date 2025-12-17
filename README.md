## 專案簡介

OpenTWDrive 是一款開源的現代化檔案上傳管理系統，支援多目的地並行上傳、即時進度追蹤、智慧檔案驗證等功能。基於 Base44 平台開發，提供企業級的穩定性與安全性。

本專案採用 **GPL v3** 開源授權，歡迎自由使用、修改與分發。

### 主要特色

- 🚀 **極速上傳**：支援多檔案並行上傳，優化效能
- 🎯 **多目的地**：同時上傳至 Base44 雲端與 IDrive e2 儲存
- 🔐 **安全防護**：檔案類型驗證、路徑遍歷防護、輸入淨化
- 📊 **即時監控**：視覺化進度追蹤與詳細上傳日誌
- 🎨 **現代化 UI**：流暢動畫、響應式設計、優雅介面
- 📦 **批次打包**：支援多檔案 ZIP 壓縮下載
- 💯 **完全開源**：GPL v3 授權，社群驅動開發

## 核心功能

### 1. 智慧檔案上傳

- 拖曳上傳或點選選擇檔案
- 支援多種檔案格式（圖片、PDF、DOC、DOCX、TXT、ZIP）
- 即時檔案類型與大小驗證
- 檔案內容魔術數字檢測

### 2. 多目的地管理

- Base44 內建雲端儲存
- 支援多個 IDrive e2 帳號
- 靈活選擇上傳目的地
- 記憶使用者偏好設定

### 3. 上傳進度追蹤

- 即時顯示上傳百分比
- 支援暫停/恢復功能
- 視覺化狀態指示器
- 詳細錯誤訊息回報

### 4. 儲存帳號管理

- 新增/編輯/刪除 IDrive e2 帳號
- 連線測試功能
- 啟用/停用帳號控制
- 安全性提醒與最佳實踐建議

### 5. 上傳日誌系統

- 完整記錄所有上傳活動
- 支援搜尋與篩選
- 統計資訊儀表板
- 匯出功能（未來計畫）

### 6. ZIP 批次下載

- 多檔案打包下載
- 壓縮率優化（DEFLATE level 9）
- 下載進度提示
- 檔案名稱自動淨化

## 技術架構

### 前端技術棧

- **框架**：React 18.2.0
- **UI 庫**：shadcn/ui + Radix UI
- **樣式**：Tailwind CSS
- **動畫**：Framer Motion
- **狀態管理**：React Query (@tanstack/react-query)
- **路由**：React Router DOM
- **表單處理**：React Hook Form
- **通知系統**：Sonner

### 後端服務

- **平台**：Base44 BaaS（Backend as a Service）
- **儲存**：
  - Base44 內建雲端儲存
  - IDrive e2 S3-compatible 儲存
- **SDK**：AWS SDK for JavaScript v3

### 核心套件

```json
{
  "@aws-sdk/client-s3": "S3 客戶端",
  "@aws-sdk/lib-storage": "多段上傳支援",
  "jszip": "ZIP 檔案生成",
  "react-dropzone": "拖曳上傳功能",
  "date-fns": "日期格式化",
  "lodash": "工具函式庫"
}
快速開始
環境需求
Node.js >= 16.0.0
npm >= 8.0.0 或 yarn >= 1.22.0
Base44 帳號（註冊連結）
安裝步驟
克隆專案
git clone https://github.com/your-username/OpenTWDrive.git
cd OpenTWDrive
安裝依賴
npm install
# 或
yarn install
設定環境變數
本專案使用 Base44 平台，不需要額外的 .env 檔案。所有設定透過 Base44 平台管理。

啟動開發伺服器
npm run dev
# 或
yarn dev
開啟瀏覽器
訪問 http://localhost:5173 (Vite 預設端口)

部署指南
Base44 平台部署（推薦）
登入 Base44 平台
建立新專案或匯入現有專案
平台會自動處理建置與部署
取得專屬網域連結
其他平台部署
Vercel
npm install -g vercel
vercel --prod
Netlify
npm install -g netlify-cli
netlify deploy --prod
Docker 部署
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
構建並運行：

docker build -t opentwdrive .
docker run -p 3000:3000 opentwdrive
使用說明
檔案上傳流程
選擇目的地

勾選要上傳的儲存位置（Base44 或 IDrive e2）
可同時選擇多個目的地
上傳檔案

拖曳檔案到上傳區域
或點選區域選擇檔案
系統會自動驗證檔案
監控進度

即時查看每個目的地的上傳進度
可暫停/恢復上傳
完成後顯示成功/失敗狀態
下載打包

上傳完成後可下載 ZIP 壓縮檔
包含所有成功上傳的檔案
儲存帳號管理
新增 IDrive e2 帳號

點選「新增帳號」
輸入帳號名稱與 S3 憑證
測試連線確認設定正確
管理現有帳號

啟用/停用帳號
編輯帳號資訊
刪除不需要的帳號
查看上傳日誌
點選「查看日誌」進入日誌頁面
使用搜尋框尋找特定檔案
使用篩選器篩選狀態或目的地
點選檔案名稱可開啟檔案連結
API 文檔
實體資料結構
StorageAccount (儲存帳號)
{
  id: string;
  created_date: string;
  updated_date: string;
  created_by: string;
  name: string;                // 帳號名稱
  access_key_id: string;       // IDrive e2 Access Key
  secret_access_key: string;   // IDrive e2 Secret Key
  endpoint: string;            // IDrive e2 Endpoint URL
  bucket_name: string;         // Bucket 名稱
  is_active: boolean;          // 是否啟用
  sort_order: number;          // 排序順序
}
UploadLog (上傳日誌)
{
  id: string;
  created_date: string;
  updated_date: string;
  created_by: string;
  file_name: string;           // 檔案名稱
  file_size: number;           // 檔案大小（位元組）
  file_type: string;           // 檔案類型
  destinations: string[];      // 上傳目的地列表
  upload_results: {
    destination: string;
    status: 'success' | 'failed';
    url?: string;
    error_message?: string;
  }[];
  upload_duration_ms: number;  // 上傳耗時（毫秒）
}
Base44 SDK 使用範例
import { base44 } from '@/api/base44Client';

// 取得儲存帳號列表
const accounts = await base44.entities.StorageAccount.list('-created_date');

// 建立上傳日誌
await base44.entities.UploadLog.create({
  file_name: 'example.pdf',
  file_size: 1024000,
  file_type: 'application/pdf',
  destinations: ['base44', 'idrive-account-1'],
  upload_results: [...],
  upload_duration_ms: 5000
});

// 上傳檔案到 Base44
const { file_url } = await base44.integrations.Core.UploadFile({ file });

// 取得當前使用者
const user = await base44.auth.me();

// 更新使用者偏好設定
await base44.auth.updateMe({
  last_selected_storage_accounts: ['base44', 'account-1']
});
安全性說明
實作的安全措施
檔案驗證

檔案類型檢查（MIME type）
檔案大小限制（15 MB）
魔術數字驗證（檔案頭部檢測）
輸入淨化

檔案名稱特殊字元過濾
路徑遍歷攻擊防護（移除 ..、. 開頭）
長度限制（255 字元）
上傳安全

S3 伺服器端加密（AES256）
連線逾時設定（30 秒）
錯誤訊息脫敏（避免洩漏系統資訊）
存取控制

Base44 平台身份驗證
使用者權限管理
私有檔案支援（透過 signed URL）
安全性建議
⚠️ 重要提醒：

儲存帳號憑證以明文儲存在資料庫中
強烈建議啟用 Base44 後端功能以實作加密儲存
定期更換 IDrive e2 存取金鑰
使用強密碼並啟用 2FA（如果服務支援）
避免在公共網路上傳敏感檔案
定期審查上傳日誌
常見問題
Q1: 為什麼上傳失敗？
A: 可能原因：

檔案大小超過 15 MB 限制
檔案類型不支援
網路連線問題
IDrive e2 憑證設定錯誤
解決方案：

檢查檔案大小與類型
測試 IDrive e2 連線
查看上傳日誌取得詳細錯誤訊息
Q2: ZIP 下載沒有密碼保護？
A: 由於 JSZip 免費版不支援密碼加密，目前 ZIP 下載功能不包含密碼保護。

替代方案：

下載後使用專業壓縮軟體（7-Zip、WinRAR）重新加密
使用檔案加密工具（VeraCrypt、AES Crypt）
使用雲端服務的內建加密功能
Q3: 如何新增更多儲存服務？
A: 目前支援 Base44 雲端與 IDrive e2（S3-compatible）。

擴充步驟：

確認目標服務是否支援 S3 協議
修改 uploadToIDrive 函式以支援不同端點
更新 UI 以支援新的儲存類型
測試連線與上傳功能
Q4: 可以上傳多大的檔案？
A:

單檔上限：15 MB
每次上傳檔案數：10 個
總大小限制：150 MB（理論值）
調整限制： 修改 SmartFileDropzone 的 maxSize 和 maxFiles 參數。

Q5: 支援哪些瀏覽器？
A: 支援所有現代瀏覽器：

Chrome 90+
Firefox 88+
Safari 14+
Edge 90+
不支援 IE11 及更早版本。

開發團隊
專案維護者
開發者：OpenTWDrive Community
平台：Base44
聯絡方式：請透過 GitHub Issues 聯絡
貢獻指南
歡迎提交 Issue 或 Pull Request！

Fork 本專案
建立功能分支 (git checkout -b feature/AmazingFeature)
提交變更 (git commit -m 'Add some AmazingFeature')
推送到分支 (git push origin feature/AmazingFeature)
開啟 Pull Request
開發規範
遵循 ESLint 規則
使用 Prettier 格式化程式碼
撰寫清晰的 commit 訊息
新功能需附上測試
遵守 GPL v3 授權條款
授權條款
本專案採用 GNU General Public License v3.0 授權 - 詳見 LICENSE 檔案

GPL v3 授權摘要
✅ 可以自由使用、修改和分發本軟體
✅ 可以用於商業用途
⚠️ 修改後的版本必須也採用 GPL v3 授權
⚠️ 必須提供原始碼
⚠️ 必須保留版權聲明和授權資訊
OpenTWDrive - 開源智慧檔案上傳管理系統
Copyright (C) 2024 OpenTWDrive Community

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
完整授權條款請參閱：https://www.gnu.org/licenses/gpl-3.0.html

致謝
感謝以下開源專案：

React
Base44
shadcn/ui
Tailwind CSS
Framer Motion
AWS SDK
JSZip
版本：v2.0.0
最後更新：2025-12-17
專案狀態：✅ 穩定版本
授權：GPL v3.0

如有任何問題或建議，歡迎在 GitHub 提交 Issue 或參與討論。

