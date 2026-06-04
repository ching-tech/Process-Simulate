## ADDED Requirements

### Requirement: 彈窗焦點移入與還原

系統 SHALL 在開啟彈窗時把鍵盤焦點移入彈窗，並在關閉時還原焦點至開啟前的觸發元素。

#### Scenario: 開啟時焦點移入
- **WHEN** 使用者開啟 AGV 看板、製程線精靈、完成 overlay 或確認彈窗
- **THEN** 鍵盤焦點移至該彈窗內的第一個可聚焦元素

#### Scenario: 關閉時焦點還原
- **WHEN** 使用者關閉該彈窗
- **THEN** 焦點回到開啟前所聚焦的觸發元素

### Requirement: 彈窗內焦點循環

系統 SHALL 在彈窗開啟期間，使 Tab / Shift+Tab 僅於彈窗內可聚焦元素之間循環，不跳到背景介面。

#### Scenario: Tab 在末元素循環回首
- **WHEN** 焦點在彈窗最後一個可聚焦元素並按 Tab
- **THEN** 焦點回到彈窗第一個可聚焦元素，而非背景

#### Scenario: 動態內容仍正確
- **WHEN** 彈窗內容變動（如精靈新增站別列）後再按 Tab
- **THEN** 循環涵蓋更新後的可聚焦元素
