## ADDED Requirements

### Requirement: 全域操作快捷鍵

系統 SHALL 提供常用模擬操作的鍵盤快捷鍵：`Space` 播放/暫停、`→` 立即結果、`1`/`2`/`5` 切換速度、`R` 重置、`P` 開關參數面板、`Esc` 關閉開啟中的彈窗。

#### Scenario: 空白鍵播放與暫停
- **WHEN** 焦點不在輸入欄位且使用者按下 `Space`
- **THEN** 切換播放/暫停，與點擊「▶ 播放／⏸ 暫停」一致，且頁面不因空白鍵而捲動

#### Scenario: 數字鍵切換速度
- **WHEN** 焦點不在輸入欄位且使用者按下 `1`/`2`/`5`
- **THEN** 模擬速度切換為 1×/2×/5×，對應 seg 按鈕呈現 active

#### Scenario: Esc 關閉彈窗
- **WHEN** AGV 看板、製程線精靈或完成 overlay 開啟中且使用者按下 `Esc`
- **THEN** 關閉該彈窗（與點擊 ✕ 或背景一致）

### Requirement: 輸入聚焦時停用快捷鍵

系統 SHALL 在使用者正於輸入欄位（`input`/`select`/`textarea`/contenteditable）打字時，不觸發字元類快捷鍵，以免干擾數值輸入。

#### Scenario: 在參數欄位輸入數字
- **WHEN** 使用者聚焦於參數輸入框並輸入「1」「2」「5」等字元
- **THEN** 字元正常輸入到欄位，速度不被切換、播放不被觸發

#### Scenario: 欄位中仍可用 Esc
- **WHEN** 使用者聚焦於輸入欄位並按下 `Esc`
- **THEN** 允許關閉開啟中的彈窗或收合面板（Esc 為例外）
