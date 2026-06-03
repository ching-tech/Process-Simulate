## ADDED Requirements

### Requirement: 桌面應用離線執行

系統 SHALL 能以 Tauri v2 桌面應用形式啟動，並在**無網路**環境下完整運作（含 UPH 圖表）；所有前端資源（含 Chart.js）MUST 隨應用本地提供，不得依賴 CDN 或外部網路。

#### Scenario: 離線啟動
- **WHEN** 在無網路的機器上啟動桌面應用
- **THEN** 應用正常開啟，模擬、參數面板、流程圖、UPH 圖表、AGV 看板、縮放、精靈皆可運作

#### Scenario: 圖表資源本地化
- **WHEN** 應用載入圖表
- **THEN** Chart.js 由隨附本地檔提供，無對外網路請求

### Requirement: 桌面視窗與資源安全設定

系統 SHALL 提供具標題與合理預設尺寸的應用視窗，且內容安全策略（CSP）MUST 允許現有 inline script/style 與 base64 圖片，同時不放行遠端來源。

#### Scenario: 視窗啟動
- **WHEN** 啟動應用
- **THEN** 顯示具標題、可調整大小（含最小尺寸限制）的視窗，前端完整顯示且互動正常

#### Scenario: CSP 不阻擋本地內容
- **WHEN** 應用載入含 inline script/style 與 base64 logo 的前端
- **THEN** 內容正常執行與顯示，且不載入任何遠端資源

### Requirement: 可安裝產出

系統 SHALL 能建置為 Windows 可安裝檔（`.exe`/`.msi`），於目標機器安裝後可離線啟動。

#### Scenario: 建置安裝檔
- **WHEN** 執行 Tauri 建置
- **THEN** 產生 Windows 安裝檔

#### Scenario: 安裝後啟動
- **WHEN** 於目標機器安裝並啟動該應用
- **THEN** 應用離線正常運作

### Requirement: 既有前端相容

本變更 SHALL NOT 改變模擬引擎、blueprint、參數與 UI 行為；前端碼於一般瀏覽器直接開啟 MUST 仍可運作（Chart.js 改為本地引用後亦然）。

#### Scenario: 瀏覽器直接開啟仍可用
- **WHEN** 以一般瀏覽器開啟前端 `index.html`
- **THEN** 功能與桌面版一致（圖表由本地 Chart.js 提供）
