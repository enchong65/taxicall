// 從 PropertiesService 獲取 CHANNEL_ACCESS_TOKEN
var CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');

// 表單配置
var formConfigs = {
  "instant": {
    spreadSheetId: "1miP-y7WK9pqCJvNmmpoOAyWzasiciTrNKPS2u2eeU2Q",
    sheetName: "表單回應 1",
    columns: ["時間戳記", "日期", "時間", "地點", "人數", "電話", "備註", "UserID"]
  },
  "booking": {
    spreadSheetId: "1dJORkfs4cWQIKb9XrKyB1ikfR8iC7BYZpeNwv-ZsbZk",
    sheetName: "表單回應 1",
    columns: ["時間戳記", "日期", "時間", "地點", "人數", "電話", "備註", "UserID"]
  }
};

// 處理 POST 請求
function doPost(e) {
  try {
    Logger.log("doPost - 完整參數: " + JSON.stringify(e.parameter));

    var formType = e.parameter.formType?.toLowerCase();
    var userId = e.parameter.userId;
    var date = e.parameter.date;
    var time = e.parameter.time;
    var location = e.parameter.location;
    var numberOfPeople = e.parameter.numberOfPeople;
    var phone = e.parameter.phone;
    var notes = e.parameter.notes;

    Logger.log("doPost - formType: " + formType + ", userId: " + userId);

    // 驗證輸入
    if (!formConfigs[formType]) {
      Logger.log("無效的表單類型: " + formType);
      return ContentService.createTextOutput("無效的表單類型");
    }
    if (!userId) {
      Logger.log("無效的 UserID: userId 為空");
      return ContentService.createTextOutput("無效的 UserID：請確保 LIFF 正確初始化");
    }

    // 寫入試算表
    var config = formConfigs[formType];
    var sheet = SpreadsheetApp.openById(config.spreadSheetId).getSheetByName(config.sheetName);
    sheet.appendRow([new Date(), date, time, location, numberOfPeople, phone, notes, userId]);

    // 生成訂單摘要
    var replyMessage = finishTheQuestionnaire(formType, userId, { date, time, location, numberOfPeople, phone, notes });

    // 推送 LINE 訊息
    sendLineMessage(userId, replyMessage);

    return ContentService.createTextOutput("提交成功，請返回 LINE 查看訂單摘要");
  } catch (error) {
    Logger.log("處理表單提交失敗: " + error);
    return ContentService.createTextOutput("提交失敗: " + error.message);
  }
}

// 生成訂單摘要訊息
function finishTheQuestionnaire(formType, clientID, responses) {
  var replyMessage = [];
  var now = new Date();
  var orderNumber = now.getFullYear() + append1Zero(now.getMonth() + 1) + append1Zero(now.getDate()) +
                   append1Zero(now.getHours()) + append1Zero(now.getMinutes()) + append1Zero(now.getSeconds()) +
                   append2Zero(now.getMilliseconds()) + "-" + clientID.slice(-4);

  var textMessage = "訂單摘要\n";
  textMessage += "訂單編號: " + orderNumber + "\n";
  textMessage += "類型: " + (formType === 'instant' ? '即時叫車' : '預約叫車') + "\n";
  textMessage += "-----------------------------\n";
  textMessage += "日期: " + (responses.date || "未填寫") + "\n";
  textMessage += "時間: " + (responses.time || "未填寫") + "\n";
  textMessage += "地點: " + (responses.location || "未填寫") + "\n";
  textMessage += "人數: " + (responses.numberOfPeople || "未填寫") + "\n";
  textMessage += "電話: " + (responses.phone ? "0" + responses.phone : "未填寫") + "\n";
  textMessage += "備註: " + (responses.notes || "未填寫") + "\n";

  replyMessage.push({
    "type": "text",
    "text": textMessage
  });
  return replyMessage;
}

// 推送 LINE 訊息
function sendLineMessage(userId, messages) {
  var url = "https://api.line.me/v2/bot/message/push";
  try {
    var response = UrlFetchApp.fetch(url, {
      "headers": {
        "Content-Type": "application/json; charset=UTF-8",
        "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
      },
      "method": "post",
      "payload": JSON.stringify({
        "to": userId,
        "messages": messages
      })
    });
    var responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      throw new Error("LINE API 回應錯誤: " + response.getContentText());
    }
  } catch (error) {
    Logger.log("推送 LINE 訊息失敗: " + error);
    throw error;
  }
}

// 輔助函式：補零
function append1Zero(obj) {
  return obj < 10 ? "0" + obj : obj.toString();
}

function append2Zero(obj) {
  if (obj < 10) return "00" + obj;
  if (obj < 100) return "0" + obj;
  return obj.toString();
}