# accessibility-baseline Specification

## Purpose

建立介面的無障礙基線，確保鍵盤可操作、互動元素具語意標籤、流程圖與彈窗具適當角色、文字對比達 WCAG AA，並尊重使用者的減少動態偏好。

## Requirements

### Requirement: 可見的鍵盤焦點

系統 SHALL 為所有可聚焦的互動元素（按鈕、輸入、選單、切換鈕）在鍵盤聚焦時顯示清楚可見的焦點指示，且不影響滑鼠 hover 既有行為。

#### Scenario: 以 Tab 巡覽顯示焦點環
- **WHEN** 使用者以鍵盤 Tab 在 header 控制列各按鈕間移動
- **THEN** 目前聚焦的按鈕顯示明顯的焦點外框（`:focus-visible`）

#### Scenario: 滑鼠點擊不顯示焦點環
- **WHEN** 使用者以滑鼠點擊按鈕
- **THEN** 不顯示鍵盤焦點外框，hover 樣式維持原狀

### Requirement: Icon 按鈕的語意標籤

系統 SHALL 為僅以 emoji/符號表示的按鈕提供文字 `aria-label`，使螢幕報讀器可正確朗讀其功能。

#### Scenario: 報讀看板按鈕
- **WHEN** 螢幕報讀器聚焦到「📊 看板」按鈕
- **THEN** 朗讀為可理解的功能名稱（如「AGV 稼動看板」）而非 emoji 名稱

#### Scenario: 涵蓋所有 icon 控制
- **WHEN** 檢視 header 與彈窗中的 icon 按鈕（播放、速度、重置、切換線、視圖、看板、視角、參數、關閉 ✕ 等）
- **THEN** 每一顆皆具備描述性 `aria-label`

### Requirement: 流程圖與彈窗的語意角色

系統 SHALL 為 SVG 流程圖與各 overlay 彈窗提供適當的 `role` 與 `aria-label`，使輔助科技能辨識其用途。

#### Scenario: SVG 具替代說明
- **WHEN** 螢幕報讀器抵達流程圖 SVG
- **THEN** 取得描述其為製程線視覺化的 `aria-label`

#### Scenario: 彈窗標示為對話框
- **WHEN** 開啟 AGV 看板或製程線精靈
- **THEN** 該容器標示為 `role="dialog"` 並具標題關聯

### Requirement: 文字對比達 WCAG AA

系統 SHALL 確保資訊性文字（含次要說明、單位、圖例、標籤）在其背景上達到 WCAG AA 對比（一般文字 4.5:1）。

#### Scenario: 次要文字對比達標
- **WHEN** 量測 `--dim` 次要文字於 `--bg` 背景的對比
- **THEN** 對比比值 ≥ 4.5:1

#### Scenario: 不更動品牌主色辨識
- **WHEN** 進行對比調整
- **THEN** ABF/SMK 品牌色與主強調色維持可辨識，不被重新指定

### Requirement: 尊重減少動態偏好

系統 SHALL 在使用者系統設定為 `prefers-reduced-motion: reduce` 時，降低或停用非必要動畫（卡片滑入、脈動、加工閃爍），且不移除其傳達的狀態語意。

#### Scenario: 減少動態時關閉裝飾動畫
- **WHEN** 使用者系統偏好為減少動態
- **THEN** 比較卡滑入、瓶頸脈動等動畫被縮短或關閉，狀態仍可由顏色/文字判讀
