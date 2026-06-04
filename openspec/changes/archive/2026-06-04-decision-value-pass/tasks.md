## 1. 結果匯出 — PNG 圖片報告（result-export，主要）

- [x] 1.1 新增 `gatherResults()`：彙整摘要（`snapshotStats()` + 線別/目標/平均UPH/simT）、最重瓶頸、AGV 各群組稼動率為一個資料物件
- [x] 1.2 新增 `exportResultPNG()`：建離屏 canvas，`width=W*dpr; height=H*dpr; ctx.scale(dpr,dpr)`（高解析）
- [x] 1.3 繪製版面：標題列（LOGO base64 + 線別 + 日期時間）、摘要指標卡、最重瓶頸、AGV 群組稼動條
- [x] 1.4 內嵌 UPH 趨勢圖：`ctx.drawImage(document.getElementById('uc'), ...)`（同源 canvas）；頁尾「擎添工業 · 產生時間」
- [x] 1.5 `canvas.toBlob()` → 下載 `report-<線>-<YYYYMMDD-HHMMSS>.png`
- [x] 1.6 尚無資料時以 `toast('尚無結果可匯出','err')` 處置
- [x] 1.7 在完成 overlay（`showFastResult` `:1115`）與 AGV 看板加入「🖼 匯出結果（PNG）」入口
- [x] 1.8 驗證：ABF/SMK 各匯一次；高 DPI 不糊、數值與畫面一致、`toBlob` 不拋汙染錯誤

## 2. 結果匯出 — CSV 資料（result-export，次要）

- [x] 2.1 新增 `exportResultCSV()`：將 `gatherResults()` + 站別 `prodHist` + AGV `tMove/tHandle/tIdle/tStag` 組為含三分區的 CSV 字串，加 UTF-8 BOM
- [x] 2.2 blob 下載 `results-<線>-<HHMMSS>.csv`；尚無資料時同樣 toast 處置
- [x] 2.3 在匯出入口提供「匯出資料（CSV）」次要選項
- [x] 2.4 驗證：Excel 開啟中文正確、數值與畫面一致

## 3. 方案比較表（scenario-comparison-table）

- [x] 3.1 新增 `pinnedScenarios=[]` 與 `pinScenario()`：存 `{label, ...snapshotStats(), bottleneck, agvUtil, keyParams}`
- [x] 3.2 新增比較表 overlay DOM 與樣式（沿用既有彈窗視覺；含每欄移除鈕）
- [x] 3.3 新增 `renderComparisonTable()`：並排各釘選欄，逐列標示最佳值（UPH 高佳 / ETA 低佳 / 稼動以接近高且不過閒為佳）
- [x] 3.4 在 header 或看板加入「📌 釘選目前結果」與「開啟比較表」入口
- [x] 3.5 確認既有即時比較卡（`showCompareCard` `:2284`）行為不變、與比較表並存
- [x] 3.6 驗證：釘選 3 個方案、最佳值標示正確、移除欄正常

## 4. 瓶頸建議（bottleneck-advisor）

- [x] 4.1 新增 `worstBottleneck()`：由既有瓶頸滯留統計取滯留最久的站與其稼動
- [x] 4.2 新增站別→設備數參數對應（`abfPressN/abfCzN/abfChangerN/...`，自訂線由 blueprint 推導；無對應回 null）
- [x] 4.3 新增 `bottleneckAdvice()`：產生保守建議文案；於瓶頸區塊（`#bnklist` 附近）顯示
- [x] 4.4 可對應時顯示「套用 +1 並重跑」：對應參數 +1 → `applyP()` → 自動釘選前後兩欄
- [x] 4.5 無瓶頸不顯示建議；無法對應設備參數時只顯示文字、不顯示按鈕
- [x] 4.6 驗證：製造一個壓機瓶頸，確認建議出現、+1 重跑後 UPH 變化合理且前後並排

## 5. 迴歸驗證

- [x] 5.1 確認模擬引擎/結果未受影響（匯出與比較皆只讀既有狀態）
- [x] 5.2 確認既有參數匯出/藍圖匯出/即時比較卡/瓶頸偵測行為不變
- [x] 5.3 桌面瀏覽器 + Tauri 各跑一次，無 console 錯誤
