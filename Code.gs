const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const SHEET_NAME = '記帳紀錄';

function doGet() {
  const html = HtmlService.createTemplateFromFile('index');
  return html.evaluate().setTitle('記帳與匯率換算器');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function saveRecord(record) {
  try {
    const sheet = getSheet();
    sheet.appendRow([
      record.date,
      record.item,
      record.category,
      record.currency,
      record.amount,
      record.rate,
      record.converted,
    ]);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function loadRecords() {
  try {
    const sheet = getSheet();
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      return [];
    }
    return rows.slice(1).reverse().map((row) => ({
      date: row[0],
      item: row[1],
      category: row[2],
      currency: row[3],
      amount: Number(row[4]),
      rate: Number(row[5]),
      converted: Number(row[6]),
    }));
  } catch (error) {
    return [];
  }
}

function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['日期', '品項', '分類', '外幣', '外幣金額', '匯率', '台幣金額']);
  }
  return sheet;
}
