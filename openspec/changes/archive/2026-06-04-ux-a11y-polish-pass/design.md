## Context

`ui/index.html` 為單檔純前端應用（2,623 行），CSS 全以 `:root` 變數驅動，淺色主題。本次優化的最高約束是使用者明確要求：**「在不影響現有的操作下，全部執行」**。因此所有設計決策都以「加成、預設行為不變、不碰模擬引擎」為前提。

## Goals / Non-Goals

**Goals**
- 補齊鍵盤無障礙（焦點可見、語意標籤、AA 對比）。
- 提供常用操作的鍵盤快捷鍵。
- 統一通知與確認的視覺語言（去除原生對話框）。
- 提供深色模式（預設關閉）。
- 修正數字可讀性、面板縮放與主/次按鈕強弱。

**Non-Goals**
- 不重構單檔架構（不拆檔、不引入框架/建置工具）。
- 不改變模擬引擎、物理計算、參數語意或預設數值。
- 不改變預設淺色外觀與預設桌面版面。
- 不做行動裝置 / 觸控優化（本工具為 Tauri 桌面與桌機瀏覽器）。

## Key Decisions

### D1. 鍵盤快捷鍵必須對輸入聚焦「讓路」
全域 `keydown` 監聽在 `document` 上，但進入處理前先判斷 `document.activeElement`：若為 `INPUT`/`SELECT`/`TEXTAREA` 或 `isContentEditable`，直接 return（`Esc` 例外——允許從欄位按 Esc 關彈窗/收面板）。如此打字輸入參數時，`1/2/5/R/P/Space` 不會被誤吃。這是「不影響現有操作」的關鍵守門。

```
keydown ──▶ 焦點在 input/select? ──是──▶ 僅處理 Esc，其餘放行
                  │否
                  ▼
        對應動作（防 default，如 Space 捲動）
```

### D2. 深色模式預設關閉、以屬性切換、可記憶
在 `<html>` 上掛 `data-theme`。未設或 `light` 時沿用現有 `:root` 變數（**現有外觀 0 變更**）；`[data-theme=dark]` 覆寫同名變數。啟動時讀 `localStorage('sim-theme')`，無值則 light。切換鈕放 header 視圖群組。因所有顏色已是變數，無需逐元素改色。

### D3. 通知層：toast 取代 alert、confirm 彈窗取代 confirm
新增極輕量 `toast(msg, type)`（右下滑入、自動消失、`role=status` `aria-live=polite`）與回傳 Promise 的 `confirmDialog(msg)`（沿用 `.wz`/overlay 視覺）。語意資訊與原本一致，只是不再阻塞與不再跳 OS 視窗。`confirm()` 為同步阻塞，改 Promise 後呼叫點需 `await`/`.then`——僅 `wzDelete` 一處，風險低。

### D4. 對比度只「微調」不「換色」
僅將 `--dim`（`#5a6a85`→約 `#4a5a78`）等少數低於 AA 的 token 加深一兩階，使其在 `--bg` 上達 4.5:1。主色 `--accent`、品牌藍橘維持不變，避免影響辨識與既有截圖一致性。深色模式另有對應 `--dim`。

### D5. 響應式用 `clamp()` 而非斷點重排
面板寬度（側欄 300 / 統計 255 / 圖表列高 155）改 `clamp(下限, 現值, 上限)`，以**現值為桌面中點**——預設桌面尺寸下渲染結果與現在一致，只在極小/極大螢幕才縮放。不改 flex 結構、不重排，降到最低風險。

### D6. 按鈕強弱：純 CSS class 對調
`▶ 播放` 加上主要強調樣式、`⏩ 立即結果` 由 `.pri` 降為次要。僅改 class/樣式，`onclick` 與行為完全不動。

### D7. 尊重 prefers-reduced-motion
新增 `@media (prefers-reduced-motion: reduce)` 將既有 `transition`/`@keyframes`（瓶頸 `pls`、加工 `mproc`、卡片滑入）降為極短或關閉，照顧前庭敏感使用者；不移除動畫本身的功能語意。

## Risks / Trade-offs

- **快捷鍵衝突**：以 D1 守門避免吃掉輸入；`Space` 需 `preventDefault` 防頁面捲動。
- **confirm 改 Promise**：唯一同步呼叫點 `wzDelete` 需改為 await，已於 tasks 標出。
- **對比 token 變動**：可能與舊截圖有極細微差異；屬可接受且為無障礙正向改善。
- **深色模式覆蓋面**：SVG 內以 `fill:#...` 寫死的少數顏色（如 `.track`、`.slb`）需確認在深色下可讀；tasks 含逐一檢查項。

## Migration / Rollout

無資料遷移。深色主題與既有 `localStorage` 鍵（`sim-scenarios`、`sim-sec-state`、`line-store`）互不干擾。所有功能可獨立關閉/移除而不影響其餘。
