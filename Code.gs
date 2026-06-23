const SHEET_PROPERTY_KEY = 'TRAVEL_PLANNER_SHEET_ID';

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('旅行行程打包小幫手');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getDestinationWeather(destinationCity, departureDate) {
  if (!destinationCity || !destinationCity.trim()) {
    throw new Error('請輸入目的地城市。');
  }

  const city = destinationCity.trim();
  const coords = fetchCityCoordinates(city);
  if (!coords) {
    throw new Error(`無法找到城市：${city}`);
  }

  const travelDate = parseDate(departureDate) || new Date();
  const month = travelDate.getMonth() + 1;
  const seasonName = getSeasonName(month);
  const climate = fetchSeasonClimate(coords.latitude, coords.longitude, month);
  const weatherType = describeWeatherType(climate);
  const packingList = buildPackingList(climate, weatherType);
  const packingItems = flattenPackingList(packingList);

  return {
    destination: coords.name,
    country: coords.country,
    normalizedCity: coords.name,
    departureDate: formatDate(travelDate),
    season: seasonName,
    averageTemperatureC: climate.averageTemperatureC,
    precipitationMm: climate.precipitationMm,
    weatherType,
    packingList,
    packingItems,
  };
}

function saveTrip(trip) {
  if (!trip || !trip.destination || !trip.departureDate) {
    throw new Error('旅遊資料不完整，無法儲存。');
  }

  const sheet = getPlannerSheet();
  sheet.appendRow([
    new Date(),
    trip.destination,
    trip.country || '',
    trip.departureDate,
    trip.season || '',
    trip.averageTemperatureC || '',
    trip.weatherType || '',
    trip.packingItems ? trip.packingItems.join('，') : '',
  ]);

  return {
    success: true,
    message: '旅遊計畫已儲存到 Google Sheets。',
    sheetUrl: getPlannerSheetUrl(),
  };
}

function fetchCityCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`;
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const payload = JSON.parse(response.getContentText());
  if (!payload || !payload.results || !payload.results.length) {
    return null;
  }
  const place = payload.results[0];
  return {
    name: place.name,
    country: place.country || '',
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

function fetchSeasonClimate(latitude, longitude, month) {
  const url = `https://api.open-meteo.com/v1/climate?latitude=${latitude}&longitude=${longitude}&start_year=2010&end_year=2023&monthly_temperature_2m_mean=true&monthly_precipitation_sum=true&timezone=Asia%2FTaipei`;
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const payload = JSON.parse(response.getContentText());

  if (!payload || !payload.monthly_temperature_2m_mean || !payload.monthly_precipitation_sum) {
    throw new Error('無法取得氣候資料，請稍後再試。');
  }

  const index = month - 1;
  return {
    averageTemperatureC: Number(payload.monthly_temperature_2m_mean[index].toFixed(1)),
    precipitationMm: Number(payload.monthly_precipitation_sum[index].toFixed(1)),
  };
}

function describeWeatherType(climate) {
  if (climate.precipitationMm >= 180) {
    return '多雨/潮濕';
  }
  if (climate.averageTemperatureC <= 0) {
    return '寒冷且可能下雪';
  }
  if (climate.averageTemperatureC < 10) {
    return '寒冷';
  }
  if (climate.averageTemperatureC < 20) {
    return '涼爽';
  }
  if (climate.averageTemperatureC < 25) {
    return '溫暖';
  }
  return '炎熱';
}

function buildPackingList(climate, weatherType) {
  const clothing = [];
  const essentials = [];
  const electronics = ['充電器', '手機'];

  if (weatherType.includes('雨') || climate.precipitationMm >= 120) {
    essentials.push('雨具', '防水包');
  }
  if (weatherType.includes('寒冷') || climate.averageTemperatureC < 15) {
    clothing.push('發熱衣', '厚外套', '圍巾');
  } else if (climate.averageTemperatureC < 20) {
    clothing.push('薄外套', '長袖衣物');
  } else if (climate.averageTemperatureC >= 25) {
    clothing.push('短袖', '防曬衣', '遮陽帽');
  }
  if (weatherType.includes('雪')) {
    clothing.push('保暖帽子', '手套');
    essentials.push('護唇膏');
  }
  if (weatherType.includes('炎熱')) {
    essentials.push('太陽眼鏡', '防曬乳');
  }
  if (!clothing.length) {
    clothing.push('基本衣物');
  }
  if (!essentials.length) {
    essentials.push('旅行文件', '零錢包');
  }

  return {
    clothing: Array.from(new Set(clothing)),
    essentials: Array.from(new Set(essentials)),
    electronics: Array.from(new Set(electronics)),
  };
}

function flattenPackingList(packingList) {
  if (!packingList) return [];
  return Object.values(packingList).reduce(function (acc, items) {
    return acc.concat(items || []);
  }, []);
}

function getSeasonName(month) {
  if ([3, 4, 5].includes(month)) return '春季';
  if ([6, 7, 8].includes(month)) return '夏季';
  if ([9, 10, 11].includes(month)) return '秋季';
  return '冬季';
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatDate(date) {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getPlannerSheet() {
  const spreadsheetId = getOrCreateSheetId();
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  let sheet = spreadsheet.getSheets()[0];
  if (!sheet) {
    sheet = spreadsheet.insertSheet('旅遊行程');
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['建立時間', '目的地', '國家', '出發日期', '季節', '平均氣溫 (°C)', '天氣型態', '建議打包清單']);
  }
  return sheet;
}

function getOrCreateSheetId() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = props.getProperty(SHEET_PROPERTY_KEY);
  if (spreadsheetId) {
    return spreadsheetId;
  }
  const spreadsheet = SpreadsheetApp.create('旅行行程與打包清單');
  spreadsheetId = spreadsheet.getId();
  props.setProperty(SHEET_PROPERTY_KEY, spreadsheetId);
  return spreadsheetId;
}

function getPlannerSheetUrl() {
  const spreadsheetId = getOrCreateSheetId();
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}
