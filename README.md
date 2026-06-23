# 個人每日記帳與外幣即時匯率換算器

這是一個可部署於 Google Apps Script 的前端網頁，提供：

- 記帳金額輸入
- 消費類別下拉選單
- Chart.js 圓餅圖顯示本月消費比例
- 外幣即時匯率換算（使用 `https://api.exchangerate.host`）
- 點擊「儲存記帳」後透過 GAS 將資料寫入 Google 試算表

## 專案檔案

- `index.html`：前端頁面與 GAS include 模板
- `style.html`：CSS 樣式片段
- `script.html`：前端 JavaScript 行為
- `Code.gs`：GAS 後端，負責儲存與讀取試算表資料
- `appsscript.json`：GAS 專案設定

## 使用方式

1. 建立 Google 試算表，並記下試算表 ID。
2. 在 Google Apps Script 編輯器中建立專案。
3. 將 `Code.gs`、`appsscript.json`、`index.html`、`style.html`、`script.html` 上傳或貼上到專案中。
4. 在 `Code.gs` 中將 `SHEET_ID` 改成你的試算表 ID。
5. 部署為 Web 應用程式：
   - 選擇「部署」→「新建部署」→「網路應用程式」
   - 執行應用程式的身分選「我自己」
   - 可存取對象選「任何人」或「任何人，包括匿名使用者」
   - 取得部署後的網址
6. 初次執行時授權 GAS 存取試算表。

## 功能說明

- 當使用者選擇 `USD`、`EUR`、`JPY` 並輸入金額時，網頁會自動呼叫匯率 API，填入最新台幣匯率與換算後台幣金額。
- 點選「儲存記帳」會呼叫 `google.script.run.saveRecord(record)`，將資料寫入試算表。
- 頁面載入時會呼叫 `google.script.run.loadRecords()`，顯示最近儲存的記帳紀錄並更新 Chart.js 圖表。

## 注意事項

- 匯率 API 使用 `https://api.exchangerate.host/latest`，免費且無需 API key。
- 若要更換為其他免費匯率 API，可在 `script.html` 的 `updateExchange()` 中調整 API 呼叫。
- `Code.gs` 會自動建立 `記帳紀錄` 工作表與標頭欄位。
