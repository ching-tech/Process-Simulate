## Why

目前模擬器在視覺與互動上已相當完整，但從專業 UX/UI 角度仍有五處落差：(1) **無障礙**——全檔零 `aria-*`、零 `:focus` 樣式，純鍵盤使用者看不到焦點、螢幕報讀器只念得出 emoji；(2) **無任何鍵盤快捷鍵**——一個一天要跑數十次的工具，連空白鍵播放/暫停都沒有；(3) 匯入/刪除/錯誤用原生 `alert()`/`confirm()`，打斷既有的精緻視覺語言並阻塞事件迴圈；(4) 缺**深色模式**——廠房牆面顯示器長時間白底刺眼，而配色已全變數化，補上幾乎免費；(5) 數字無千分位、版面寬度全寫死、`--dim` 文字對比卡在 AA 邊緣。

本提案在**完全不改變既有操作與模擬結果**的前提下，補齊上述五項。所有改動皆為加成式：預設淺色不變、預設版面不變、所有現有按鈕與流程行為不變。

## What Changes

- **無障礙基線**：新增 `:focus-visible` 焦點環；為所有 icon 按鈕補 `aria-label`；為 SVG 流程圖與彈窗補 `role`/`aria-label`；將 `--dim` 與相關文字 token 微調至通過 WCAG AA（4.5:1）；尊重 `prefers-reduced-motion`。
- **鍵盤快捷鍵**：新增全域 `keydown`——`Space` 播放/暫停、`→` 立即結果、`1/2/5` 速度、`R` 重置、`P` 開關參數面板、`Esc` 關閉任一開啟的彈窗；於輸入欄位聚焦時自動停用，避免干擾打字。
- **inline 通知**：以 app 內 toast 取代成功/錯誤 `alert()`；以 app 內確認彈窗取代刪除 `confirm()`；沿用既有彈窗視覺模式。
- **深色模式**：新增 `[data-theme=dark]` 變數區塊與 header 切換鈕，狀態存 `localStorage`；**預設維持淺色**，不影響現有外觀。
- **顯示精修**：產量等數字加千分位（`toLocaleString`）；側欄/統計/圖表面板寬度改用 `clamp()`，以現值為桌面預設中點；將「▶ 播放」調整為主要強調、「⏩ 立即結果」降為次要，修正兩顆「開始」按鈕強弱顛倒。

## Capabilities

### New Capabilities
- `accessibility-baseline`: 焦點可見性、icon 按鈕與 SVG/彈窗的語意標籤、文字對比、減少動態偏好。
- `keyboard-shortcuts`: 全域鍵盤操作對應，並於輸入聚焦時停用。
- `inline-notifications`: 取代原生 `alert`/`confirm` 的 app 內 toast 與確認彈窗。
- `dark-theme`: 可切換並記憶的深色主題（預設淺色）。
- `display-refinements`: 數字千分位、響應式面板寬度、主/次要動作按鈕強弱修正。

### Modified Capabilities
<!-- 無：本次皆為加成式呈現/互動增強，不改變既有 capability 的需求層級行為與模擬結果。 -->

## Impact

- 單一檔案 `ui/index.html`：
  - **CSS（`:8`–`:167`）**：新增 `button:focus-visible`、`[data-theme=dark]` 變數區塊、`@media (prefers-reduced-motion)`、toast/confirm 與面板 `clamp()` 樣式；`--dim` 等 token 微調。
  - **Header（`:170`–`:208`）**：icon 按鈕補 `aria-label`；新增深色切換鈕；調整 `▶ 播放` 與 `⏩ 立即結果` 的 class 強弱。
  - **JS**：新增全域 `keydown` 監聽（含輸入聚焦守門）；新增 `toast()`/`confirmDialog()`；`wzDelete`（`:2432`）、`importLineFile`（`:2438`）、`importParams` 等以新通知取代 `alert`/`confirm`；統計與進度顯示處套用 `toLocaleString`；新增 `toggleTheme()` 與啟動時讀取主題。
- 無新增外部相依套件；純前端、純記憶體狀態。**不改變模擬引擎、不改變既有參數行為、不改變預設視覺**。
