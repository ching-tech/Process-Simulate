## 1. 偵測條件（只算出滿框）

- [x] 1.1 `stPiled()` 只在出滿框/緩衝滿載時為真；transfer 移除 `in_ret`、changer 改 false（v0.3.7 `a891edf`）
- [x] 1.2 驗證：退空框、換框機不再列入瓶頸（WebView2 CDP 實測通過）

## 2. 堆積時間統計

- [x] 2.1 堆積偵測迴圈累計 `pilePeak` / `pileTotal` / `pileCount`
- [x] 2.2 即時瓶頸面板顯示峰值/累計/次數
- [x] 2.3 成績單「🔴 瓶頸明細」、PNG、CSV 呈現並依累計排序

## 3. AGV 稼動成因診斷

- [x] 3.1 `servingGroupForPile(i)`：堆積站 → 服務它的 AGV 群組
- [x] 3.2 `groupUtil(grp)` 與 `diagnoseBottleneck(i)`：缺車(≥UTIL_HIGH→+AGV) vs 站別節拍(→+機台)
- [x] 3.3 `renderAdvice` 改用診斷結果給對應建議與「套用 +1 並重跑」（key 可為 AGV 或機台）
- [x] 3.4 `gatherResults` 依顯示名聚合同名機台（峰值最大、累計/次數加總）
- [x] 3.5 驗證：缺車型/站別節拍型成因判斷正確、無自我循環文案（WebView2 CDP 實測通過）

## 4. 先出先拿派工

- [x] 4.1 AGV idle 任務排序加入「滿框依來源 `pileT` 由久至近」（優先度之後、距離之前）
- [x] 4.2 驗證：達標與產能正常、瓶頸峰值有界、無回歸（WebView2 CDP 實測通過）

## 5. 規格同步

- [x] 5.1 修訂 `bottleneck-advisor` spec（本 change，歸檔時套用）
