# live-region-announcements Specification

## Purpose

透過 `aria-live` 區域在關鍵里程碑事件發生時播報簡短訊息，使螢幕報讀器使用者掌握進度，且不對每秒更新逐一播報。

## Requirements

### Requirement: 里程碑事件語音播報

系統 SHALL 透過 `aria-live` 區域在關鍵里程碑事件發生時播報簡短訊息，使螢幕報讀器使用者能掌握進度，且不對每秒更新的數值逐一播報。

#### Scenario: 達成目標播報
- **WHEN** 模擬完成（達標）
- **THEN** aria-live 區域播報一則完成訊息（含完成片數與模擬時間）

#### Scenario: 新瓶頸播報且去重
- **WHEN** 出現先前未播報過的瓶頸站
- **THEN** 播報該瓶頸；同一瓶頸站不重複每幀播報

#### Scenario: 不洗版
- **WHEN** 時鐘與進度每秒更新
- **THEN** 不因每次更新而播報，僅事件性里程碑才播
