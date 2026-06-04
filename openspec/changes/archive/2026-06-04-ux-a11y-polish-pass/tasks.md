## 1. 無障礙基線（accessibility-baseline）

- [x] 1.1 CSS 新增 `button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}`，並為 `input/select:focus-visible` 補一致焦點樣式
- [x] 1.2 為 header 所有 icon 按鈕補 `aria-label`（播放、1×/2×/5×/10×、立即結果、重置、切換線、精簡/詳細、看板、視角、參數）
- [x] 1.3 為彈窗關閉 ✕（看板、精靈）、line-card 工具鈕（✎⬇🗑）、stepper（−／＋）補 `aria-label`
- [x] 1.4 `#fsvg` 補 `role="img"` 與 `aria-label="製程線流程圖"`；`#agv-board .abx`、`#line-wizard .wz`、`#ov` 補 `role="dialog"` 與 `aria-labelledby`
- [x] 1.5 將 `--dim`（與其他低於 AA 的文字 token）加深至於 `--bg` 上達 ≥4.5:1，主色與品牌色不動
- [x] 1.6 新增 `@media (prefers-reduced-motion: reduce)`：縮短/關閉 `pls`、`mproc`、`#cmp-card`、各 `transition`
- [x] 1.7 驗證：Tab 巡覽可見焦點；滑鼠點擊不顯示焦點環；報讀器朗讀按鈕功能名

## 2. 鍵盤快捷鍵（keyboard-shortcuts）

- [x] 2.1 新增 `document` 全域 `keydown` 監聽
- [x] 2.2 守門：若 `activeElement` 為 input/select/textarea 或 contenteditable，僅放行 `Esc`，其餘 return
- [x] 2.3 綁定：`Space`→`togglePlay()`（`preventDefault` 防捲動）、`→`→`fastForward()`、`1/2/5`→`setSpeed()`、`R`→`resetSim()`、`P`→`toggleSB()`
- [x] 2.4 `Esc`：依序關閉 line-wizard / agv-board / 完成 overlay（任一開啟者）；皆未開啟則收合參數面板（若開）
- [x] 2.5 驗證：在參數欄位輸入 1/2/5/R 不觸發捷徑；欄位中按 Esc 可關彈窗

## 3. Inline 通知（inline-notifications）

- [x] 3.1 新增 `#toast-host` 容器（右下、`role="status"` `aria-live="polite"`）與 CSS（滑入、自動淡出）
- [x] 3.2 實作 `toast(msg, type='info')`：type ∈ info/ok/err，數秒後自動移除
- [x] 3.3 實作 `confirmDialog(msg)` 回傳 Promise<boolean>，沿用 `.wz`/overlay 視覺，含「確定／取消」與 Esc=取消
- [x] 3.4 將 `importLineFile`（`:2438`）成功/失敗 `alert` 改為 `toast`
- [x] 3.5 將 `importParams` 與其他 `alert` 呼叫點改為 `toast`
- [x] 3.6 將 `wzDelete`（`:2432`）的 `confirm` 改為 `await confirmDialog(...)`（函式改 async）
- [x] 3.7 全檔搜尋確認已無殘留 `alert(`／`confirm(`（保留必要者則註明）
- [x] 3.8 驗證：匯入成功/失敗、刪除確定/取消 行為與訊息與原本一致

## 4. 深色模式（dark-theme）

- [x] 4.1 CSS 新增 `[data-theme=dark]` 變數區塊（覆寫 `--bg/--surface/--card/--border/--text/--dim` 等）
- [x] 4.2 檢查 SVG 內寫死色（`.track`/`.track-ret`/`.slb`/`.llb`/`.llb2`/`#route-map`）於深色下對比，必要處改用變數或加深色對應
- [x] 4.3 header 視圖群組新增主題切換鈕（☀/🌙，含 `aria-label`）
- [x] 4.4 實作 `toggleTheme()`：切 `document.documentElement.dataset.theme`，存 `localStorage('sim-theme')`
- [x] 4.5 啟動時讀取 `sim-theme`（無則 light）並套用；切換鈕狀態同步
- [x] 4.6 驗證：預設淺色與變更前一致；深色各畫面（流程圖/統計/參數/看板/精靈/比較卡）可讀；重開記憶

## 5. 顯示精修（display-refinements）

- [x] 5.1 進度標籤 `#pbl`、統計（完成/目標/UPH/ETA）數字套 `toLocaleString`（保留單位與 tabular-nums）
- [x] 5.2 側欄 `#sb.open`(300)、`#sp`(255)、`#bot`(155) 等固定寬高改 `clamp(下限, 現值, 上限)`，現值為中點
- [x] 5.3 `▶ 播放` 加主要強調樣式；`⏩ 立即結果` 由 `.pri` 降為次要（僅樣式，不動 onclick）
- [x] 5.4 驗證：預設桌面尺寸渲染與變更前一致；小視窗面板縮至下限不溢出；播放/立即結果行為不變

## 6. 整體迴歸驗證

- [x] 6.1 跑一輪 ABF 與 SMK 模擬，確認模擬結果、UPH、瓶頸、看板數值與變更前一致
- [x] 6.2 確認既有滑鼠操作（站別 tooltip、縮放平移、accordion、情境存取、匯入匯出）皆不受影響
- [x] 6.3 桌面瀏覽器 + Tauri 桌面版各開一次，確認無 console 錯誤
