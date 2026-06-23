const path = require('path');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!OPENWEATHER_API_KEY) {
  console.warn('WARNING: OPENWEATHER_API_KEY is not set. 請在 .env 或環境變數中設定。');
}

function getSeasonLabel(dateString) {
  const month = new Date(dateString).getMonth() + 1;
  if ([12, 1, 2].includes(month)) return '冬季';
  if ([3, 4, 5].includes(month)) return '春季';
  if ([6, 7, 8].includes(month)) return '夏季';
  return '秋季';
}

function buildPackingList(temp, weatherMain, weatherDesc) {
  const items = new Set(['護照', '手機充電器', '衣物']);

  const weatherType = `${weatherMain} ${weatherDesc}`.toLowerCase();
  if (/rain|drizzle|shower|thunderstorm|storm/.test(weatherType)) {
    items.add('雨具');
  }
  if (/snow|sleet|blizzard/.test(weatherType)) {
    items.add('保暖手套');
    items.add('雨具');
  }
  if (temp < 15) {
    items.add('發熱衣');
    items.add('厚外套');
  }
  if (temp >= 25) {
    items.add('防曬乳');
    items.add('遮陽帽');
  }
  if (weatherMain.toLowerCase().includes('cloud')) {
    items.add('薄外套');
  }
  if (weatherMain.toLowerCase().includes('clear')) {
    items.add('太陽眼鏡');
  }

  return Array.from(items);
}

async function fetchWeatherForCity(city) {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OpenWeather API key 未設定。');
  }

  const url = 'https://api.openweathermap.org/data/2.5/weather';
  const response = await axios.get(url, {
    params: {
      q: city,
      appid: OPENWEATHER_API_KEY,
      units: 'metric',
      lang: 'zh_tw'
    }
  });

  const data = response.data;
  const temp = Math.round(data.main.temp);
  const weatherMain = data.weather[0]?.main || 'Unknown';
  const weatherDesc = data.weather[0]?.description || '';
  return { temp, weatherMain, weatherDesc };
}

async function createSheetClient() {
  const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
  let auth;

  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes
    });
  } else {
    auth = new google.auth.GoogleAuth({
      scopes
    });
  }

  return google.sheets({ version: 'v4', auth });
}

async function saveTripToSheet(trip) {
  if (!SHEET_ID) {
    throw new Error('GOOGLE_SHEET_ID is not set. 請在 .env 或環境變數中設定。');
  }

  const sheets = await createSheetClient();
  const values = [
    trip.destination,
    trip.departureDate,
    trip.season,
    `${trip.averageTemp} °C`,
    trip.weatherType,
    trip.weatherDesc,
    trip.packingList.join('、'),
    new Date().toLocaleString()
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A:H',
    valueInputOption: 'RAW',
    requestBody: {
      values: [values]
    }
  });
}

app.post('/api/trip', async (req, res) => {
  try {
    const { destination, departureDate } = req.body;

    if (!destination || !departureDate) {
      return res.status(400).json({ error: '請輸入目的地城市與預計出發日期。' });
    }

    const { temp, weatherMain, weatherDesc } = await fetchWeatherForCity(destination);
    const season = getSeasonLabel(departureDate);
    const packingList = buildPackingList(temp, weatherMain, weatherDesc);

    const result = {
      destination,
      departureDate,
      season,
      averageTemp: temp,
      weatherType: weatherMain,
      weatherDesc,
      packingList
    };

    res.json(result);
  } catch (error) {
    console.error(error.message || error);
    res.status(500).json({ error: error.response?.data?.message || error.message || '內部伺服器錯誤' });
  }
});

app.post('/api/save', async (req, res) => {
  try {
    const trip = req.body;
    if (!trip || !trip.destination || !trip.departureDate || !trip.packingList) {
      return res.status(400).json({ error: '請提供完整的行程資料以便存檔。' });
    }

    await saveTripToSheet(trip);
    res.json({ success: true });
  } catch (error) {
    console.error(error.message || error);
    res.status(500).json({ error: error.message || '無法將資料存入 Google Sheets' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Travel packer server is running on http://localhost:${PORT}`);
});
