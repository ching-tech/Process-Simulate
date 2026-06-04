## Why

`ux-a11y-polish-pass` 補齊了無障礙**基線**（焦點環、aria-label、鍵盤捷徑、對比、減少動態）。本提案處理基線之後的**深度與上手**五件事：(1) **色盲缺口**——站別框已用形狀冗餘（`● ◌ ○ ▶`），但 AGV 載貨狀態純靠顏色（載滿框=綠、載空框=橘，`agvBody` `:1952-1953`），紅綠色盲分不出「實載 vs 空跑」，對搬運稼動分析是語意損失；(2) **彈窗未鎖焦點**——已加 `role="dialog"`，但 Tab 仍會跑到背景；(3) **動態數值對報讀器靜默**——時鐘/UPH 一直變但螢幕報讀器收不到里程碑；(4) **功能藏著沒人知道**——站別 hover UPH、滾輪縮放、拖曳平移、即時變更註記都無指引；(5) **參數以秒為單位**，現場以分鐘思考，缺換算提示。

全部以純前端、加成式、不改模擬引擎與既有外觀的方式實現。

## What Changes

- **色盲 AGV 編碼**：AGV 載貨狀態在顏色之外加形狀冗餘（載滿框 / 載空框 / 空手 用可辨識的符號或實心對外框區分），顏色維持不變。
- **彈窗焦點管理**：開啟彈窗時把焦點移入、關閉時還原到觸發元素、Tab/Shift+Tab 在彈窗內循環（focus trap）。
- **里程碑語音播報**：以 `aria-live` 在達標、出現新瓶頸、套用參數等**里程碑**播報一句（非每秒），讓報讀器使用者跟得上。
- **上手引導**：首次進入模擬顯示三則低調 coachmark（點站別看 UPH／滾輪縮放／拖曳平移），並常駐一個「?」說明可隨時再叫出；以 localStorage 記住已看過。
- **輸入單位提示**：對以秒為單位的參數欄位顯示分鐘換算提示（如 `360 秒 ≈ 6 分`）。

## Capabilities

### New Capabilities
- `colorblind-agv-encoding`: AGV 載貨狀態的形狀冗餘編碼。
- `modal-focus-management`: 彈窗 focus trap 與焦點移入/還原。
- `live-region-announcements`: 里程碑事件的 aria-live 播報。
- `onboarding-coachmarks`: 首次使用引導與常駐說明。
- `input-unit-hints`: 秒↔分單位換算提示。

### Modified Capabilities
<!-- 無：皆為新增；既有 a11y 基線、流程圖、參數面板行為不變。 -->

## Impact

- 單一檔案 `ui/index.html`：
  - **colorblind-agv-encoding**：`agvBody()`（`:1949`）與貨物點 `cd`（`acd-${a.id}`）加符號/形狀；更新圖例（`abf-hdr2` `:247`）。
  - **modal-focus-management**：`toggleAgvBoard`/`openWizard`/`closeWizard` 與完成 overlay、confirm 彈窗加焦點移入/還原與 trap；與既有 `Esc` 關閉整合。
  - **live-region-announcements**：新增 `#sr-live`（`aria-live=polite`）與 `announce()`；於達標、瓶頸新增、`applyP()` 呼叫。
  - **onboarding-coachmarks**：新增 coachmark overlay 與 `?` 鈕；localStorage 記 `sim-onboarded`。
  - **input-unit-hints**：`fieldHTML()`（參數面板）對秒類欄位加換算提示。
- 無新增外部相依；不改模擬引擎、不改既有外觀與互動行為。
