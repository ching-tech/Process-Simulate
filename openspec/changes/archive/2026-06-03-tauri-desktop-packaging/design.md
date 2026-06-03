## Context

模擬器為單一 `index.html`（純 HTML/CSS/vanilla JS，無建置流程），唯一外部資源是 Chart.js（CDN）。狀態存記憶體 + localStorage，無後端、無網路呼叫。目標：以 Tauri v2 包成可離線執行、可安裝的桌面 app（Level A 純包裝）。Tauri 使用系統 WebView（Windows=WebView2），前端可直接沿用。

掃描現況關鍵點：CDN Chart.js（`index.html:7`）、inline `<script>/<style>/onclick`、`prompt`（另存情境）、`confirm`/`alert`（刪線/匯入）、`<a download>` 匯出、`<input type=file>` 匯入、localStorage 4 處。

## Goals / Non-Goals

**Goals (Level A)：**
- 既有前端在 Tauri 視窗中**離線**運作（含圖表）。
- 產出 Windows 可安裝檔（`.exe`/`.msi`）。
- 最小前端改動（理想僅 Chart.js 來源那一行）。
- 維持「直接用瀏覽器開」仍可用（前端碼共用）。

**Non-Goals（留待 Level B）：**
- 以頁面內彈窗取代 `prompt/confirm/alert`。
- 改用 Tauri dialog+fs 做原生存檔/開檔。
- 自動更新、程式碼簽章、跨平台（mac/linux）打磨。
- 撰寫實質 Rust 業務邏輯（殼為主）。

## Decisions

### D1 專案佈局：前端集中於 `ui/`
新增 `ui/`（放 `index.html` 與 `vendor/`），`src-tauri/` 為 Rust 殼，`tauri.conf.json` 的 `build.frontendDist` 指向 `../ui`，無 `beforeDevCommand`（靜態前端）。
- 為何不留在 repo 根目錄：`frontendDist` 會整包複製，根目錄含 `openspec/`、`.git` 等不該進 app bundle。
- 取捨：瀏覽器/GitHub 的開啟路徑由 `index.html` → `ui/index.html`（README 註明）；亦可保留根目錄一份精簡導引。
- 替代方案（如使用者偏好不搬動）：根目錄保留 `index.html`，另以複製步驟產生乾淨 dist。預設採 `ui/`。

### D2 Chart.js 本地化（唯一必要前端改動）
下載 `chart.umd.min.js` 放 `ui/vendor/`，`index.html` 的 `<script src>` 由 CDN 改為相對路徑 `vendor/chart.umd.min.js`。
- 為何：桌面需離線；且 Tauri CSP 會擋遠端 script。
- 影響：純前端版同樣改為本地引用（離線亦可開）。

### D3 CSP 設定 —— 最終為 `null`（停用）
原訂放行 inline 的 CSP 字串，但**實測 Tauri v2 在提供 CSP 時會為其注入樣式加 nonce/hash，依 CSP 規範使 `style-src 'unsafe-inline'` 失效，導致 HTML 的 inline `style=""` 屬性全被擋**（選單 `position:fixed`、`<input type=file style="display:none">` 等失效，畫面破版）。本 app 大量使用 inline 樣式屬性。
- 結論：`app.security.csp` 設為 `null`（停用 CSP）。本地離線、只載本地資源，無遠端內容，停用 CSP 風險可忽略，行為與瀏覽器一致。
- 替代（未來）：將 inline `style=""` 全面改為 class，再恢復嚴格 CSP（工程量大，非必要）。

### D4 視窗與打包
`tauri.conf.json` 設標題、預設尺寸（如 1280×800）、最小尺寸；提供 app 圖示（`src-tauri/icons/`，以 `tauri icon` 由單張 PNG 產生）。建置：`cargo tauri dev`（開發）、`cargo tauri build`（產 `.exe`/`.msi`）。

### D5 沿用瀏覽器式對話框/檔案 IO（Level A）
`prompt/confirm/alert`、`<a download>`、`<input file>` 維持不變，先驗證能否在 WebView2 運作。
- 已知風險：WebView 的 `window.prompt` 可能回 null（影響「另存情境」）。Level A 先接受並於文件標注；若實測不可用，提前納入 Level B 的彈窗替換。

## Risks / Trade-offs

- [CSP 擋 inline → 畫面/事件全失效] → D3 明確放行；dev 階段可先 `csp: null` 驗證再收斂。
- [`prompt` 回 null → 無法另存情境] → Level A 接受；Level B 換自製彈窗（風險已知、影響單一功能）。
- [`<a download>`/`<input file>` 在 WebView 支援不一] → 先實測；不穩則提前用 Tauri dialog+fs。
- [WebView2 runtime 缺失（少數舊機）] → 安裝程式可選帶 bootstrapper。
- [搬動 `index.html` 影響既有路徑] → README 更新；保留純前端可用性。
- [本機缺 Rust/Tauri CLI/MSVC] → 屬建置前置；本變更可先備妥所有設定檔，build 由具環境者執行。

## Migration Plan

1. 建 `ui/`（移入 `index.html`）、`ui/vendor/`（放 Chart.js）、改 `index.html` script 來源。
2. 建 `src-tauri/`（`tauri.conf.json`/`Cargo.toml`/`src/main.rs`/icons/capabilities），`frontendDist=../ui`、設 CSP/視窗。
3. `cargo tauri dev` 驗證離線運作（圖表、面板、模擬、縮放、看板、精靈）。
4. `cargo tauri build` 產安裝檔；於乾淨機驗證離線啟動。
回退：刪除 `src-tauri/`、還原 `index.html` 至根目錄與 CDN 引用即可，純前端不受影響。

## Open Questions

- 安裝程式是否需內含 WebView2 bootstrapper（針對可能缺 runtime 的現場機）？
- 是否保留根目錄一份 `index.html` 導引（指向 `ui/`）以相容舊連結？
