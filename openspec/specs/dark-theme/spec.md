# dark-theme Specification

## Purpose

提供可切換的深色主題，透過 `data-theme` 覆寫 CSS 變數而不更動版面結構；預設維持淺色且與既有外觀一致，並記憶使用者選擇。

## Requirements

### Requirement: 可切換的深色主題

系統 SHALL 提供深色主題，使用者可由 header 切換鈕在淺色/深色間切換；切換僅透過 `data-theme` 屬性覆寫 CSS 變數，不更動版面結構。

#### Scenario: 切換到深色
- **WHEN** 使用者點擊主題切換鈕
- **THEN** 介面套用深色配色（背景、表面、卡片、文字、邊框），版面與互動位置不變

#### Scenario: 深色下內容可讀
- **WHEN** 處於深色主題
- **THEN** 流程圖站別/軌道/文字、統計、參數面板、彈窗皆維持足夠對比可讀

### Requirement: 預設淺色且不影響現有外觀

系統 SHALL 在未設定主題時預設為淺色，且淺色外觀與本變更前完全一致。

#### Scenario: 首次開啟為淺色
- **WHEN** 使用者第一次開啟（無已存主題）
- **THEN** 介面呈現原有淺色配色，無任何視覺變化

### Requirement: 記憶主題選擇

系統 SHALL 將主題選擇存於 `localStorage` 並於下次啟動時還原。

#### Scenario: 重開後維持深色
- **WHEN** 使用者選擇深色後重新開啟應用
- **THEN** 介面以深色載入
