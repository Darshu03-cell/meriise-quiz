/* ============================================================
   ME-RIISE QUIZ — Google Apps Script result exporter
   ------------------------------------------------------------
   Deploy:
     1) Create a new Google Sheet. Extensions → Apps Script.
     2) Paste this file. Save.
     3) Deploy → New deployment → type "Web app".
          Execute as: Me
          Who has access: Anyone
     4) Copy the /exec Web App URL and paste it into
        js/firebase-config.js  →  MR.SHEETS_WEBHOOK = "…".
   The app POSTs { rows: [ {Name, College, ...}, ... ] }.
   Each row is appended to the "Results" sheet.
   ============================================================ */

var SHEET_NAME = 'Results';
var HEADERS = ['Name', 'College', 'Department', 'Year', 'Event', 'Quiz',
  'Score', 'Accuracy', 'Rank', 'Achievement', 'Certificate ID', 'Timestamp', 'Logged At'];

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var rows = payload.rows || [];
    var sheet = getSheet_();
    var now = new Date();
    rows.forEach(function (r) {
      sheet.appendRow([
        r['Name'] || '', r['College'] || '', r['Department'] || '', r['Year'] || '',
        r['Event'] || '', r['Quiz'] || '', r['Score'] || 0, r['Accuracy'] || '',
        r['Rank'] || '', r['Achievement'] || '', r['Certificate ID'] || '',
        r['Timestamp'] || '', now
      ]);
    });
    return json_({ ok: true, added: rows.length });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'ME-RIISE QUIZ export', headers: HEADERS });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#0f1730').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
