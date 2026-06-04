# result-export Specification

## Purpose

提供將模擬結果一鍵匯出為 PNG 圖片報告（原生 Canvas 自繪）並可次要匯出為 CSV 供再分析的能力。

## Requirements

### Requirement: 一鍵 PNG 圖片報告

系統 SHALL 提供將目前模擬結果一鍵匯出為 PNG 圖片報告的功能，以原生 Canvas 自繪（不依賴外部截圖函式庫），內容涵蓋標題、整體摘要、最重瓶頸、AGV 稼動概要與 UPH 趨勢圖，可直接貼進報告或訊息。

#### Scenario: 一鍵下載圖片報告
- **WHEN** 使用者於模擬完成或進行中點擊「匯出結果（PNG）」
- **THEN** 下載一張 PNG，含標題列（線別與日期時間）、摘要指標（完成/目標、平均 UPH、模擬時間、ETA）、最重瓶頸、AGV 稼動概要與內嵌的 UPH 趨勢圖

#### Scenario: 高解析不模糊
- **WHEN** 在高 DPI 顯示器上匯出
- **THEN** 報告依裝置像素比放大繪製，文字與圖線清晰不糊

#### Scenario: 圖片可正常輸出
- **WHEN** 報告內嵌 LOGO 與既有趨勢圖（同源 canvas）
- **THEN** `toBlob` 正常產生 PNG，不因 canvas 汙染而失敗

#### Scenario: 尚未模擬時的處置
- **WHEN** 尚無任何模擬資料即嘗試匯出
- **THEN** 以 toast 提示「尚無結果可匯出」，不產生空檔

### Requirement: CSV 資料匯出（次要）

系統 SHALL 另提供將模擬結果匯出為 CSV 的次要選項，供資料再分析，並可正確以 Excel 開啟中文。

#### Scenario: 匯出整體與明細
- **WHEN** 使用者選擇「匯出資料（CSV）」
- **THEN** 下載一個 CSV，含摘要區（線別、完成片數、目標、平均 UPH、模擬時間、ETA）、站別每小時 UPH 區、AGV 稼動區

#### Scenario: 中文不亂碼
- **WHEN** 以 Excel 開啟匯出的 CSV
- **THEN** 中文站名與標題正確顯示（含 UTF-8 BOM）
