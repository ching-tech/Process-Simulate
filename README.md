# 製程 AGV 模擬系統

一套**純前端**的製程 AGV（無人搬運車）動態模擬器，用來觀察 ABF 與 SMK 兩條製程線在不同參數下的產能、瓶頸與 AGV 稼動狀況。前端為 `ui/index.html`，打開瀏覽器即可執行；亦可用 Tauri 打包成桌面應用離線使用。

> 開發單位：擎添工業（Ching Tech）

---

## 快速開始（瀏覽器）

直接用瀏覽器開啟 `ui/index.html` 即可（建議 Chrome / Edge）。

```bash
# 方法一：直接雙擊 ui/index.html

# 方法二：本機起一個簡易伺服器（擇一）
python -m http.server 8000 --directory ui   # 然後開 http://localhost:8000
npx serve ui
```

啟動後先在首頁選擇要模擬的製程線（**ABF** / **SMK** / 自訂線），再按「▶ 播放」開始。

---

## 桌面版（Tauri v2）

以 [Tauri v2](https://v2.tauri.app/) 打包成 Windows 桌面應用（使用系統 WebView2，安裝檔小、可離線）。

### 下載安裝（一般使用者）

直接到 **[Releases](https://github.com/wkltueserc20/Process-Simulate/releases)** 下載最新版安裝檔：
- `ProcessAGVSim_x.x.x_x64-setup.exe`（NSIS）或 `*.msi`
- 執行安裝 → 開始選單啟動「製程 AGV 模擬系統」。每個 release 內含操作說明。

> 發版方式：推送 `v*` 標籤（如 `git tag v0.1.1 && git push origin v0.1.1`），GitHub Actions 會自動建置並發佈安裝檔。

### 自行建置（開發者）

**前置需求**：Rust（rustup）、Windows 為 MSVC build tools 與 WebView2 runtime（Win10/11 多已內建）、Tauri CLI。

```powershell
# 1) 安裝 Tauri CLI（一次）
cargo install tauri-cli --version "^2"

# 2) 準備圖示（任一方形 PNG，例如公司 logo）
cargo tauri icon path\to\logo.png

# 3) 開發模式（熱啟動視窗）
cargo tauri dev

# 4) 產生安裝檔（.exe / .msi）
cargo tauri build
```

- 前端資源在 `ui/`（含本地 `vendor/chart.umd.min.js`，離線可用）；Rust 殼在 `src-tauri/`。
- 視窗大小、標題、CSP 在 `src-tauri/tauri.conf.json`。
- 此為 Level A 純包裝：對話框與檔案匯入匯出沿用瀏覽器行為（原生整合為後續工作）。

---

## 製程線

| 製程線 | 站別流程 |
|--------|----------|
| **ABF** | CLN → Annealing → CZ → Baking → ABF壓機 → Postcure → 換框機 |
| **SMK** | CLN → CZ → 壓機 → 曝光 → 顯影 → UVQ → 換框機 |

站別類型：補料站（refill）、轉移加工站（transfer）、緩衝站（buffer）、換框機（changer）。AGV 採分組專用設計，各組負責特定區段的滿框／空框搬運與回程。

---

## 主要功能

- **工廠平面動態圖**：SVG 即時呈現各站料框狀態（滿框／空框／加工中／已預訂）、AGV 移動與載貨；支援**詳細／精簡**兩種視圖。
- **站別 UPH 統計**
  - 站名下方常駐顯示**平均 UPH（片/hr）**，方便跨站比較。
  - 滑鼠移到站上顯示**逐小時 UPH** tooltip（0~1hr、1~2hr…），當前未滿小時標註「← 現在」。
- **AGV 稼動看板**：全螢幕看板列出每台 AGV 的移動／取放／閒置時間與稼動率，含總計與平均。
- **流程圖縮放／平移**：滾輪以游標為中心縮放、拖曳平移，可一鍵重置視角。
- **設備數量可調**：直接在頁面增減各站機台數（CZ／壓機／曝光／顯影／UVQ／換框機，1–9）、緩衝站容量（≥1）與每組 AGV 數量（1–9）；套用後自動重建流程圖（機台堆疊超出畫面時 `viewBox` 自動加高），用來試算「多／少幾台設備對產能與瓶頸的影響」。
- **自訂製程線（編輯精靈）**：在選擇畫面用「＋ 新增製程線」精靈，依序定義站別（補料／加工／緩衝／換框 4 種原型）、處理時間、每組 AGV，系統自動推導搬運群組、佈局與參數，並做合法性驗證與乾跑後加入；自訂線可編輯／刪除／匯出 JSON，也可匯入他人分享的線（存於瀏覽器 localStorage）。整條線由單一 blueprint 描述，route／處理時間／參數面板／選單／圖表全部自動衍生。
- **瓶頸警示**：偵測各站出口料框堆積（PORT 堆積）並即時提示。
- **UPH 折線圖**：以 Chart.js 繪製產能隨時間變化。
- **參數面板**：可調設備數量、各站處理時間、每框片數、路段行走時間、取／放料時間、目標產量等；支援情境（scenario）儲存、匯入／匯出 JSON、即時套用與前後對比。
- **播放控制**：播放／暫停、1× / 2× / 5× / 10× 速度、⏩ 立即結果（快轉至達標）、重置、切換製程線。
- **結果匯出（PNG／CSV）**：一鍵把模擬結果輸出成 **PNG 圖片報告**（標題、摘要指標、最重瓶頸、AGV 群組稼動、內嵌 UPH 趨勢圖，依裝置像素比高解析繪製，可直接貼進報告／訊息），另提供 **CSV**（含 UTF-8 BOM，Excel 中文正常）供資料再分析。
- **方案比較表**：把多次模擬結果「📌 釘選」後並排比較（完成片數／UPH／ETA／最重瓶頸／平均 AGV 稼動），每列自動標示最佳值，輔助 A/B/C 方案決策。
- **瓶頸建議**：對堆積最嚴重的瓶頸站給出設備增量建議，可對應到設備數參數時提供「套用 +1 並重跑」捷徑，直接看調整前後差異。

### 介面與無障礙

- **深色模式**：一鍵切換並記憶（預設淺色，整站以 CSS 變數驅動，版面不變）。
- **鍵盤快捷鍵**：`Space` 播放／暫停、`→` 立即結果、`1/2/5` 速度、`R` 重置、`P` 開關參數面板、`Esc` 關閉彈窗；於輸入欄位聚焦時自動讓路。
- **無障礙（a11y）**：鍵盤焦點環、icon 按鈕與彈窗的語意標籤、彈窗 focus trap、里程碑事件 `aria-live` 播報、WCAG AA 文字對比、尊重 `prefers-reduced-motion`。
- **色盲友善**：AGV 車頂載貨標記除顏色外另加形狀（載滿框 ●／載空框 ○），去色仍可分辨。
- **上手引導**：首次進入顯示操作 coachmark（點站別看 UPH／滾輪縮放／拖曳平移），常駐「？」可隨時重看。
- **Inline 通知**：以 app 內 toast 與確認彈窗取代原生對話框；秒類參數欄位顯示分鐘換算提示（如 `360 秒 ≈ 6 分`）。

---

## 技術說明

- **HTML + CSS + 原生 JavaScript**，前端為單一 `ui/index.html`，無建置流程。
- 圖表：[Chart.js 4.4.3](https://www.chartjs.org/)（本地隨附於 `ui/vendor/`，離線可用）。
- 工廠平面與站別／AGV 皆以 **SVG** 繪製；縮放／平移透過操作 SVG `viewBox` 攝影機實作。
- 模擬引擎以固定時間步進（`dt`）推進站別機台邏輯與 AGV 任務分配，逐幀更新畫面。
- 桌面版以 **Tauri v2 + Rust** 包裝（系統 WebView2），殼在 `src-tauri/`。

---

## 專案結構

```
.
├── ui/                     # 前端（瀏覽器 / Tauri 共用）
│   ├── index.html          # 完整模擬系統
│   └── vendor/             # 本地相依（chart.umd.min.js）
├── src-tauri/              # Tauri v2 桌面殼（Rust）
│   ├── tauri.conf.json     # 視窗 / CSP / frontendDist
│   ├── Cargo.toml          # Rust 相依
│   └── src/main.rs         # 啟動殼
├── sim-params-abf.json     # ABF 線參數情境範例
├── openspec/               # 規格驅動開發（OpenSpec）的提案與規格
│   ├── specs/              # 主規格（已同步的能力規格）
│   └── changes/archive/    # 歷次變更提案存檔
└── README.md
```

本專案採 **OpenSpec** 規格驅動流程，`openspec/specs/` 記錄各能力（如站別 UPH、AGV 稼動看板、流程圖縮放）的需求與情境，`openspec/changes/archive/` 保留每次變更的提案、設計與任務。

---

## 授權

內部專案，未另行授權。© Ching Tech 擎添工業
