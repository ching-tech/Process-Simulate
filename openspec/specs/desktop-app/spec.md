# desktop-app Specification

## Purpose

以 Tauri v2（系統 WebView2）將前端包裝為可離線執行、可安裝的 Windows 桌面應用，並維持既有前端於瀏覽器的可用性。

## Requirements

### Requirement: 桌面應用離線執行

系統 SHALL 能以 Tauri v2 桌面應用形式啟動，並在**無網路**環境下完整運作（含 UPH 圖表）；所有前端資源（含 Chart.js）MUST 隨應用本地提供，不得依賴 CDN 或外部網路。

#### Scenario: 離線啟動
- **WHEN** 在無網路的機器上啟動桌面應用
- **THEN** 應用正常開啟，模擬、參數面板、流程圖、UPH 圖表、AGV 看板、縮放、精靈皆可運作

#### Scenario: 圖表資源本地化
- **WHEN** 應用載入圖表
- **THEN** Chart.js 由隨附本地檔提供，無對外網路請求

### Requirement: 桌面視窗與內容呈現

系統 SHALL 提供具標題與合理預設尺寸（含最小尺寸）的應用視窗，且前端的 inline script/style 與 base64 圖片 MUST 正常呈現；前端 SHALL NOT 引用任何遠端資源。

> 備註：因 Tauri 提供 CSP 時會為注入樣式加 nonce 致 `style-src 'unsafe-inline'` 失效、擋掉 HTML inline `style=""`，本地離線應用採停用 CSP（`csp: null`）以確保 inline 內容正常；安全性由「不引用遠端資源」維持。

#### Scenario: 視窗啟動
- **WHEN** 啟動應用
- **THEN** 顯示具標題、可調整大小（含最小尺寸限制）的視窗，前端完整顯示且互動正常（選單全螢幕、隱藏元素正確隱藏）

#### Scenario: 不載入遠端內容
- **WHEN** 應用執行
- **THEN** 僅載入本地資源，無對外網路請求

### Requirement: 可安裝產出

系統 SHALL 能建置為 Windows 可安裝檔（`.exe`/`.msi`），於目標機器安裝後可離線啟動。

#### Scenario: 建置安裝檔
- **WHEN** 執行 Tauri 建置（或經 CI 於標籤觸發）
- **THEN** 產生 Windows 安裝檔並可發佈

#### Scenario: 安裝後啟動
- **WHEN** 於目標機器安裝並啟動該應用
- **THEN** 應用離線正常運作

### Requirement: 既有前端相容

本變更 SHALL NOT 改變模擬引擎、blueprint、參數與 UI 行為；前端碼於一般瀏覽器直接開啟 MUST 仍可運作（Chart.js 改為本地引用後亦然）。

#### Scenario: 瀏覽器直接開啟仍可用
- **WHEN** 以一般瀏覽器開啟前端 `ui/index.html`
- **THEN** 功能與桌面版一致（圖表由本地 Chart.js 提供）
