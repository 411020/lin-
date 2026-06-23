# 旅遊行程與打包建議

這個專案提供一個簡單的 Web 應用，使用者只要輸入目的地城市與預計出發日期，系統會自動呼叫氣象 API 取得該城市的天氣、建議行李清單，並支援將行程與打包清單存入 Google Sheets。

## 功能

- 輸入目的地城市與出發日期
- 自動呼叫 OpenWeatherMap 查詢城市當前氣溫與天氣型態
- 根據天氣自動產生行李建議
  - 下雨／陰雨時自動建議：雨具
  - 氣溫低於 15°C 時自動建議：發熱衣、厚外套
  - 晴天時建議：太陽眼鏡
  - 高溫時建議：防曬乳、遮陽帽
- 一鍵將旅遊行程與打包清單存入 Google Sheets

## 快速上手

1. 安裝套件

```bash
npm install
```

2. 建立 `.env` 檔案

```env
OPENWEATHER_API_KEY=你的_openweathermap_api_key
GOOGLE_SHEET_ID=你的_google_sheet_id
GOOGLE_SERVICE_ACCOUNT_KEY={...}
```

3. 取得 Google Sheets API 憑證

- 在 Google Cloud Console 建立 Service Account
- 啟用 Google Sheets API
- 產生 JSON 金鑰
- 將 JSON 內容貼到 `GOOGLE_SERVICE_ACCOUNT_KEY`，或使用 `GOOGLE_APPLICATION_CREDENTIALS` 指向 JSON 檔案路徑
- 在 Google Sheets 中建立工作表，並將該 Service Account 的電子郵件加入共用權限

4. 啟動應用

```bash
npm start
```

5. 開啟瀏覽器

```text
http://localhost:3000
```

## 注意

- 這個範例使用 OpenWeatherMap 的即時天氣資料來判斷當季氣溫與天氣型態。
- 若要分析更精準的出發日當季平均氣溫，可升級為使用歷史氣象資料或專門的氣候資料 API。
