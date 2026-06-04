# colorblind-agv-encoding Specification

## Purpose

在顏色之外以形狀或符號區分 AGV 載貨狀態，使色覺障礙者也能判讀，同時維持既有顏色語意不變。

## Requirements

### Requirement: AGV 載貨狀態的形狀冗餘

系統 SHALL 在顏色之外，以可辨識的形狀或符號區分 AGV 的載貨狀態（載滿框 / 載空框 / 空手），使色覺障礙者也能判讀；顏色語意維持不變。

#### Scenario: 載滿與載空可由形狀分辨
- **WHEN** 一台 AGV 載滿框、另一台載空框同時在畫面上
- **THEN** 兩者除顏色不同外，另以不同形狀/符號區分，去除顏色後仍可分辨

#### Scenario: 圖例同步說明形狀
- **WHEN** 使用者檢視流程圖圖例
- **THEN** 圖例同時標示顏色與對應形狀的意義

#### Scenario: 不改變既有顏色語意
- **WHEN** 套用形狀冗餘
- **THEN** 載滿=綠、載空=橘等既有顏色維持不變
