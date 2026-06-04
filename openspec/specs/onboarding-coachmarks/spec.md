# onboarding-coachmarks Specification

## Purpose

首次進入模擬畫面時顯示指向既有隱藏互動的簡短引導，可一鍵關閉並記住，並提供常駐「?」入口隨時重看。

## Requirements

### Requirement: 首次使用引導

系統 SHALL 在使用者首次進入模擬畫面時，顯示指向既有隱藏互動的簡短引導（點站別看 UPH、滾輪縮放、拖曳平移），且引導可一鍵關閉、不阻擋操作，並記住已看過不再自動出現。

#### Scenario: 首次顯示引導
- **WHEN** 使用者第一次進入模擬畫面（無已看過旗標）
- **THEN** 顯示三則指向式提示

#### Scenario: 關閉後不再自動出現
- **WHEN** 使用者關閉引導
- **THEN** 寫入 localStorage 旗標，之後進入不再自動顯示

#### Scenario: 引導不阻擋操作
- **WHEN** 引導顯示中，使用者想直接操作介面
- **THEN** 可直接點擊介面，引導不攔截必要操作

### Requirement: 常駐說明入口

系統 SHALL 提供常駐的「?」說明入口，使用者可隨時重新叫出操作提示。

#### Scenario: 隨時重看提示
- **WHEN** 使用者點擊「?」說明入口
- **THEN** 重新顯示操作提示
