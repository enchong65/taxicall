const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const line = require('@line/bot-sdk');

const app = express();
app.use(bodyParser.json());

// LINE 配置
const CHANNEL_ACCESS_TOKEN = 'bJfsjiur6x4h7hRkYpKqMcdJn2biR8zDBMw4jOLtRL4LGZsiPfm8zVqgd5zwucmaZEN8YwUMshErJTfgop53WWZwDQbfzJ/e1iuOgOkOu3dMqMerxJ5hTl+o/MYE3/bTsAzCs9mJD5pD8Jpnr3DRhAdB04t89/1O/w1cDnyilFU=';
const client = new line.Client({ channelAccessToken: CHANNEL_ACCESS_TOKEN });

// Google Sheets 配置
const SHEET_ID = '1miP-y7WK9pqCJvNmmpoOAyWzasiciTrNKPS2u2eeU2Q';
const SHEET_NAME = '表單回應 1';

app.post('/submit', async (req, res) => {
  try {
    const { date, time, location, numberOfPeople, phone, notes, userId } = req.body;

    // 驗證輸入
    if (!userId) return res.status(400).json({ message: '無法獲取 UserID，請確保您已登入 LINE' });

    // 寫入 Google Sheet
    const sheets = google.sheets({ version: 'v4', auth: 'YOUR_GOOGLE_API_KEY' });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:H`,
      valueInputOption: 'RAW',
      resource: {
        values: [[new Date(), date, time, location, numberOfPeople, phone, notes, userId]],
      },
    });

    // 推送 LINE 訊息
    const message = `訂單摘要\n日期: ${date}\n時間: ${time}\n地點: ${location}`;
    await client.pushMessage(userId, { type: 'text', text: message });

    res.json({ message: '提交成功，請返回 LINE 查看訂單摘要' });
  } catch (error) {
    console.error('提交失敗:', error);
    res.status(500).json({ message: '提交失敗: ' + error.message });
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});