> Level A 純包裝。實作需本機具備 Rust toolchain、Tauri CLI、（Windows）MSVC build tools 與 WebView2 runtime。
> 下列「建置/執行」類工作需在具環境的機器上跑；其餘設定檔可先備妥。

## 1. 前端整理

- [x] 1.1 建立前端資料夾 `ui/`，將 `index.html` 移入（README 更新開啟路徑）
- [x] 1.2 取得 Chart.js 4.4.3 `chart.umd.min.js` 放入 `ui/vendor/`（離線必要）
- [x] 1.3 `index.html` 的圖表 `<script src>` 由 CDN 改為相對路徑 `vendor/chart.umd.min.js`
- [ ] 1.4 驗證：以瀏覽器直接開 `ui/index.html`，斷網仍能顯示圖表與完整功能

## 2. Tauri 殼建立

- [ ] 2.1 安裝前置：rustup、`cargo install tauri-cli`、（Windows）MSVC build tools；確認 WebView2 runtime
- [x] 2.2 建立 `src-tauri/`（`Cargo.toml`、`src/main.rs` 預設殼、`build.rs`、`capabilities/default.json`）
- [x] 2.3 `tauri.conf.json`：`build.frontendDist=../ui`、無 `beforeDevCommand`；`app.windows`（標題/尺寸/最小尺寸）
- [x] 2.4 `tauri.conf.json` 設 CSP：允許 `'self' 'unsafe-inline'` 與 `img-src 'self' data:`，不放行遠端
- [ ] 2.5 app 圖示：以 `tauri icon <png>` 產生 `src-tauri/icons/`

## 3. 開發與驗證

- [ ] 3.1 `cargo tauri dev` 啟動，確認前端載入、無 CSP 錯誤（DevTools console 乾淨）
- [ ] 3.2 離線功能驗證：模擬/參數面板/流程圖/UPH 圖表/AGV 看板/縮放平移/精靈
- [ ] 3.3 localStorage 持久化驗證：建情境/自訂線 → 關閉重開仍在
- [ ] 3.4 已知風險實測：`prompt`（另存情境）、`confirm`（刪線）、`alert`、`<a download>` 匯出、`<input file>` 匯入是否可用；記錄結果（不可用者列入 Level B）

## 4. 打包

- [ ] 4.1 `cargo tauri build` 產出 `.exe`/`.msi`
- [ ] 4.2 於乾淨（無 dev 環境、無網路）機器安裝並啟動驗證
- [ ] 4.3 評估是否需內含 WebView2 bootstrapper（依目標機）

## 5. 收尾

- [x] 5.1 `.gitignore` 加入 `src-tauri/target/`
- [x] 5.2 README 增「桌面版（Tauri）」章節：開發/建置指令、前置需求、安裝說明
- [ ] 5.3 將實作中浮現的決策（CSP 最終值、prompt 是否需替換）回記 design/spec
