const form = document.getElementById('trip-form');
const resultBox = document.getElementById('result');
const messageBox = document.getElementById('message');
let currentTrip = null;

function showMessage(text, isError = false) {
  messageBox.style.display = 'block';
  messageBox.style.background = isError ? '#fee2e2' : '#dcfce7';
  messageBox.style.color = isError ? '#991b1b' : '#166534';
  messageBox.textContent = text;
}

function renderTrip(trip) {
  resultBox.style.display = 'block';
  resultBox.innerHTML = `
    <p><strong>目的地：</strong>${trip.destination}</p>
    <p><strong>出發日期：</strong>${trip.departureDate}</p>
    <p><strong>季節：</strong>${trip.season}</p>
    <p><strong>平均氣溫：</strong>${trip.averageTemp} °C</p>
    <p><strong>天氣型態：</strong>${trip.weatherType} ${trip.weatherDesc}</p>
    <div class="packing-list">
      <strong>建議攜帶行李：</strong>
      <p>${trip.packingList.join('、')}</p>
    </div>
    <button id="save-button">存入 Google Sheets</button>
  `;

  document.getElementById('save-button').addEventListener('click', async () => {
    try {
      const button = document.getElementById('save-button');
      button.disabled = true;
      button.textContent = '儲存中...';
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trip)
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || '儲存失敗');
      }

      showMessage('已成功將旅遊行程與打包清單存入 Google Sheets。');
      button.textContent = '已儲存';
    } catch (error) {
      showMessage(error.message, true);
    }
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  resultBox.style.display = 'none';
  messageBox.style.display = 'none';
  currentTrip = null;

  const destination = document.getElementById('destination').value.trim();
  const departureDate = document.getElementById('departureDate').value;

  try {
    const response = await fetch('/api/trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, departureDate })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || '無法取得旅遊建議');
    }

    currentTrip = payload;
    renderTrip(payload);
  } catch (error) {
    showMessage(error.message, true);
  }
});
