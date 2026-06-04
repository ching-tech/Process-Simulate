## Why

模擬器目前能「跑出」數據，卻不太能幫人「用」數據——這是它最大的價值缺口。三個具體斷點：(1) **結果無法帶走**：`exportParams`/`exportBlueprint` 匯出的都是**輸入**，跑完的 UPH、ETA、瓶頸、AGV 稼動、各站 UPH 等**輸出**只能截圖或手抄；(2) **比較只能一對一且短暫**：`cmpState` 只存單一 before 快照，但 what-if 分析的本質是**多方案並排**；(3) **瓶頸警示只報症狀不開藥方**：`isBottleneck` 能精準指出 PORT 堆積，卻沒利用既有資料反推「該加哪一站幾台」。

本提案把工具從「模擬器」往「決策台」推進，全部以**純前端、不改模擬引擎**的方式實現。

## What Changes

- **結果匯出**：新增「🖼 匯出結果」——主要為**一鍵 PNG 圖片報告**（以原生 Canvas 自繪：標題、摘要指標、最重瓶頸、AGV 稼動概要、內嵌 UPH 趨勢圖、頁尾），可直接貼進報告或訊息；另保留輕量 **CSV** 作為資料再分析的次要選項。
- **方案比較表**：新增可累積的多方案比較面板——把目前模擬的結果「釘選」為一欄，並排多個方案（UPH/ETA/瓶頸/AGV 稼動），標示最佳值；取代目前一次性的單對比較卡（比較卡保留為即時前後差）。
- **瓶頸建議**：在既有瓶頸偵測上，對最嚴重瓶頸站給出可執行建議（如「壓機稼動 98% → 試算 +1 台」），並提供「套用此建議的設備數並重跑」捷徑。

## Capabilities

### New Capabilities
- `result-export`: 將模擬輸出一鍵匯出為 PNG 圖片報告（次要：CSV 資料）。
- `scenario-comparison-table`: 可累積、可並排的多方案結果比較。
- `bottleneck-advisor`: 由瓶頸偵測反推設備建議與一鍵試算。

### Modified Capabilities
<!-- 無：皆為新增能力；既有 bottleneck-alert 偵測、parameter-panel、playback 行為不變。 -->

## Impact

- 單一檔案 `ui/index.html`：
  - 資料來源沿用既有：`snapshotStats()`（`:2277`，回傳 `{uph,eta,done,simT}`）、站別 `prodHist`、AGV `tMove/tHandle/tIdle/tStag`（`renderAgvBoard` `:1751` 已彙整）。
  - **result-export**：新增 `exportResultPNG()`（離屏 Canvas 自繪 + `toBlob`，內嵌 `#uc` 趨勢圖）與次要 `exportResultCSV()`；於完成 overlay（`showFastResult` `:1115`）與 header/看板加入口。
  - **scenario-comparison-table**：新增 `pinScenario()` 與比較表 overlay；重用 `snapshotStats()` 與情境名稱（`scnStore`）。
  - **bottleneck-advisor**：讀既有瓶頸統計（`isBottleneck` `:933` 區域累計），對應到設備數參數（`abfPressN` 等），產生建議與「套用＋重跑」。
- 無新增外部相依；不改模擬引擎、不改既有匯出/比較卡/瓶頸偵測行為。
