## Why

目前模擬器是單一 `index.html`，使用者需用瀏覽器開啟，且圖表依賴 CDN（Chart.js）需連網。希望打包成**桌面應用程式**，讓現場可離線、雙擊啟動、像一般軟體安裝使用。選用 **Tauri v2 + Rust**：使用系統內建 WebView（Windows 為 WebView2），安裝檔小、啟動快，前端可沿用現有 HTML。

本次範圍為 **Level A 純包裝**：以最小改動讓現有前端在 Tauri 視窗中離線運作並產出可安裝檔；原生對話框/檔案整合留待後續（Level B）。

## What Changes

- 導入 **Tauri v2** 殼：新增 `src-tauri/`（Rust 主程式、`tauri.conf.json`、icons），前端移至 `src/`，`frontendDist` 指向前端資料夾（無建置流程）。
- **Chart.js 本地化**：將 `index.html` 第 7 行的 CDN `<script>` 改為引用隨附的本地檔（`src/vendor/chart.umd.min.js`），確保離線可用且不被 CSP 擋。
- **CSP 設定**：於 `tauri.conf.json` 設定允許 inline script/style（現有 app 使用 inline `<script>`/`<style>`/`onclick`），本地離線 app 無遠端內容，風險可接受。
- **視窗設定**：標題、預設視窗大小、最小尺寸、app 圖示。
- **打包**：產出 Windows 安裝檔（`.exe`/`.msi`）；建置與開發指令（`cargo tauri dev` / `build`）。
- 保留現有瀏覽器式行為（`prompt`/`confirm`/`alert`、`<a download>` 匯出、`<input type=file>` 匯入）——能在 WebView 運作即可，原生化留待 Level B。

非本次範圍（Level B，後續）：以頁面內彈窗取代 `prompt/confirm/alert`、改用 Tauri dialog+fs 外掛做原生存檔/開檔、自動更新、簽章。

## Capabilities

### New Capabilities
- `desktop-app`: 以 Tauri v2 將前端包裝為可離線執行、可安裝的桌面應用（含 Chart.js 本地化、CSP、視窗與打包設定）。

### Modified Capabilities
<!-- 無既有 capability 的需求層級變更；模擬功能與 UI 行為不變，僅執行環境與資源載入方式改變。 -->

## Impact

- 專案結構：新增 `src-tauri/`；`index.html` 移至 `src/`（或設定 `frontendDist` 指向現位置）；新增 `src/vendor/chart.umd.min.js`。
- `index.html`：僅改 Chart.js 的 `<script src>` 由 CDN 改為本地相對路徑（1 行）。
- 不改模擬引擎、blueprint、參數、UI 邏輯；localStorage 在 WebView 自動持久化。
- 新增建置相依：Rust toolchain、Tauri CLI；Windows 需 WebView2 runtime（Win10/11 多已內建）與 MSVC build tools。
- 既有純前端用法（直接開 `index.html`）在本地化 Chart.js 後仍可運作（離線亦可）。

## 風險 / 注意

- **CSP 與 inline**：預設 Tauri CSP 會擋 inline；需明確放行，否則畫面/事件失效。
- **prompt 於 WebView**：部分 WebView 的 `window.prompt` 可能回傳 null（影響「另存情境」）；Level A 先接受，Level B 改自製彈窗。
- **檔案匯出/匯入**：WebView 對 `<a download>`/`<input file>` 支援度不一；若 Level A 不穩，提前評估改用 Tauri dialog+fs。
- **WebView2 相依**：少數舊環境需另裝 runtime；安裝程式可選擇帶 bootstrapper。
- 不影響 GitHub 上現有純前端版本（前端碼共用，僅多一層殼）。
