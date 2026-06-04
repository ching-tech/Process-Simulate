## 1. 色盲 AGV 編碼（colorblind-agv-encoding）

- [x] 1.1 在 `agvBody()`（`:1949`）或貨物點 `cd`（`acd-${a.id}`）依 `cargo` 疊加形狀：載滿框=實心 `■`、載空框=空心 `□`、空手=無
- [x] 1.2 確認快轉與即時兩條更新路徑（`updateABFAgvPos` `:1959` 與 `:1257` 區）都套用形狀
- [x] 1.3 更新圖例 `abf-hdr2`（`:247`）與 SMK 對應圖例，補形狀說明
- [x] 1.4 驗證：縮小/放大下形狀仍可辨；以灰階模擬確認去色後可分辨載滿/載空

## 2. 彈窗焦點管理（modal-focus-management）

- [x] 2.1 新增 `trapFocus(container)` / `releaseFocus()`：記住觸發者、移焦入內、Tab/Shift+Tab 循環、還原
- [x] 2.2 套用至 AGV 看板（`toggleAgvBoard` `:1751` 區）、精靈（`openWizard`/`closeWizard`）、完成 overlay、confirm-ov
- [x] 2.3 與既有全域 `Esc` 關閉整合（關閉走同一路徑並還原焦點）
- [x] 2.4 動態內容（精靈新增站別列）後，Tab 循環即時涵蓋新元素（即時查詢可聚焦集合）
- [x] 2.5 驗證：開啟各彈窗後 Tab 不跑到背景；關閉後焦點回到觸發鈕

## 3. 里程碑語音播報（live-region-announcements）

- [x] 3.1 新增視覺隱藏的 `#sr-live`（`aria-live="polite"` `aria-atomic="true"`）與 `announce(msg)`
- [x] 3.2 達標時播報（`showFastResult` / 完成路徑）
- [x] 3.3 出現「新」瓶頸時播報；以已播報集合去重，不每幀念
- [x] 3.4 `applyP()` 套用參數重跑、`toggleTheme()` 切換時各播報一句
- [x] 3.5 確認未綁定每秒時鐘/進度更新，避免洗版
- [x] 3.6 驗證：以報讀器確認里程碑有播、平時安靜

## 4. 上手引導（onboarding-coachmarks）

- [x] 4.1 新增 coachmark 疊層 DOM 與樣式（不阻擋點擊、可一鍵關閉）
- [x] 4.2 三則提示：點站別看 UPH、滾輪縮放、拖曳平移
- [x] 4.3 首次進入模擬（localStorage 無 `sim-onboarded`）自動顯示；關閉後寫旗標
- [x] 4.4 header 新增常駐「?」鈕（含 `aria-label`）可隨時重看
- [x] 4.5 驗證：首次顯示、關閉後重整不再自動出現、? 可再叫出、不擋操作

## 5. 單位換算提示（input-unit-hints）

- [x] 5.1 `fieldHTML()` 對秒類欄位於標籤旁加灰字 `≈ N 分`（依預設值）
- [x] 5.2 綁定 input 事件即時更新換算（沿用既有欄位 input 監聽）
- [x] 5.3 確認 mm:ss 欄位不受影響、底層仍以秒計算
- [x] 5.4 驗證：修改秒數提示即時更新；模擬結果與變更前一致

## 6. 迴歸驗證

- [x] 6.1 確認模擬引擎/結果未受影響（皆為顯示與互動加成）
- [x] 6.2 確認既有 a11y 基線（焦點環/aria/鍵盤/對比/深色）行為不變
- [x] 6.3 桌面瀏覽器 + Tauri 各跑一次，無 console 錯誤
