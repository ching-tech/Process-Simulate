# inline-notifications Specification

## Purpose

以 app 內的 toast 與確認彈窗取代原生 `alert()`／`confirm()`，提供非阻塞、可被螢幕報讀器感知的通知與確認流程。

## Requirements

### Requirement: Inline Toast 通知

系統 SHALL 以 app 內 toast 顯示成功/錯誤/提示訊息，取代原生 `alert()`，且不阻塞主執行緒。

#### Scenario: 匯入成功提示
- **WHEN** 使用者成功匯入製程線或參數
- **THEN** 顯示短暫的成功 toast，數秒後自動消失，期間 UI 可繼續操作

#### Scenario: 匯入失敗提示
- **WHEN** 匯入的 JSON 格式錯誤或驗證失敗
- **THEN** 顯示錯誤 toast 並包含原因摘要

#### Scenario: 報讀器可感知
- **WHEN** toast 出現
- **THEN** 其容器具 `role="status"` 與 `aria-live="polite"`，可被螢幕報讀器朗讀

### Requirement: Inline 確認彈窗

系統 SHALL 以 app 內確認彈窗取代原生 `confirm()`，沿用既有彈窗視覺，並提供確定/取消。

#### Scenario: 刪除自訂線需確認
- **WHEN** 使用者點擊刪除某自訂製程線
- **THEN** 顯示 app 內確認彈窗；選「確定」才刪除，選「取消」則不變更

#### Scenario: 取消不造成副作用
- **WHEN** 使用者在確認彈窗選「取消」或按 `Esc`
- **THEN** 不刪除任何資料，回到原狀態
