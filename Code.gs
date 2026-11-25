/**
 * ALISHER XUSUSIY KORXONA — Yoqilg‘i hisob-kitoblari API
 * ------------------------------------------------------
 * Google Sheets'dagi barcha oylik varaqlarni (январ, февраль, ... ) o‘qiydi
 * va JSON ko‘rinishida qaytaradi. Jadvalga HECH NARSA YOZMAYDI.
 *
 * Ustunlar qat'iy harflar bo‘yicha emas, 1–2-qatordagi sarlavhalar bo‘yicha
 * aniqlanadi. Shuning uchun yangi oy varag‘i (noyabr, dekabr, ...) xuddi shu
 * shablonda qo‘shilsa, kodni o‘zgartirish shart emas.
 *
 * Sozlash: Project Settings → Script properties → API_TOKEN = <uzun maxfiy satr>
 */

var SPREADSHEET_ID = '1UZbK4ZClFbc9NDjZYeYvNMmQZE1X4mHBxFZks-O7OSY';

var MONTH_NAMES = {
  'январ': 1, 'январь': 1, 'yanvar': 1,
  'феврал': 2, 'февраль': 2, 'fevral': 2,
  'март': 3, 'mart': 3,
  'апрел': 4, 'апрель': 4, 'aprel': 4,
  'май': 5, 'may': 5,
  'июн': 6, 'июнь': 6, 'iyun': 6,
  'июл': 7, 'июль': 7, 'iyul': 7,
  'август': 8, 'avgust': 8,
  'сентябр': 9, 'сентябрь': 9, 'sentabr': 9, 'sentyabr': 9,
  'октябр': 10, 'октябрь': 10, 'oktabr': 10, 'oktyabr': 10,
  'ноябр': 11, 'ноябрь': 11, 'noyabr': 11,
  'декабр': 12, 'декабрь': 12, 'dekabr': 12
};

function doGet(e) {
  try {
    var expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
    var given = (e && e.parameter && e.parameter.token) || '';
    if (!expected) return json_({ ok: false, error: 'API_TOKEN sozlanmagan (Script properties).' });
    if (given !== expected) return json_({ ok: false, error: 'Ruxsat yo‘q: token noto‘g‘ri.' });

    return json_(readAll_());
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

/** Apps Script muharririda qo‘lda sinash uchun: Run → testRead */
function testRead() {
  var data = readAll_();
  Logger.log('Varaqlar: ' + data.months.map(function (m) { return m.sheet + ' (' + m.rows.length + ')'; }).join(', '));
  if (data.warnings.length) Logger.log('Ogohlantirishlar: ' + data.warnings.join(' | '));
}

function readAll_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var months = [];
  var warnings = [];

  ss.getSheets().forEach(function (sh) {
    var lastRow = sh.getLastRow();
    var lastCol = sh.getLastColumn();
    if (lastRow < 3 || lastCol < 10) return;

    var values = sh.getRange(1, 1, lastRow, lastCol).getValues();
    var map = detectColumns_(values[0], values[1]);
    if (!map) return; // bu oylik hisob varag‘i emas

    var period = detectPeriod_(values[0][map.debStart], sh.getName());
    if (!period) {
      warnings.push('"' + sh.getName() + '" varag‘ining oyi aniqlanmadi');
      return;
    }

    var rows = [];
    for (var r = 2; r < values.length; r++) {
      var row = values[r];
      var name = String(row[map.name] || '').replace(/\s+/g, ' ').trim();
      if (!name) continue;
      if (/^жами$/i.test(name)) break; // jami qatoridan keyin ma'lumot yo‘q

      rows.push({
        r: r + 1,
        inn: String(row[map.inn] || '').trim(),
        name: name,
        debQ: num_(row[map.debStart]),       debS: num_(row[map.debStart + 1]),
        kreQ: num_(row[map.kredStart]),      kreS: num_(row[map.kredStart + 1]),
        kirim: map.kirimBranches.map(function (b) { return num_(row[b.col]); }),
        kirimQ: num_(row[map.kirimTotal]),   kirimS: num_(row[map.kirimTotal + 1]),
        cash: map.cash >= 0 ? num_(row[map.cash]) : 0,
        chiqim: map.chiqimBranches.map(function (b) { return num_(row[b.col]); }),
        chiqimQ: num_(row[map.chiqimTotal]), chiqimS: num_(row[map.chiqimTotal + 1]),
        servQ: num_(row[map.service]),       servS: num_(row[map.service + 1]),
        debEndQ: num_(row[map.debEnd]),      debEndS: num_(row[map.debEnd + 1]),
        kreEndQ: num_(row[map.kredEnd]),     kreEndS: num_(row[map.kredEnd + 1])
      });
    }

    months.push({
      sheet: sh.getName(),
      sheetId: sh.getSheetId(),
      year: period.year,
      month: period.month,
      kirimBranches: map.kirimBranches.map(function (b) { return b.name; }),
      chiqimBranches: map.chiqimBranches.map(function (b) { return b.name; }),
      rows: rows
    });
  });

  months.sort(function (a, b) { return (a.year * 12 + a.month) - (b.year * 12 + b.month); });

  return {
    ok: true,
    spreadsheet: ss.getName(),
    generatedAt: new Date().toISOString(),
    months: months,
    warnings: warnings
  };
}

/** 1- va 2-qator sarlavhalaridan ustun indekslarini topadi */
function detectColumns_(h1, h2) {
  var top = h1.map(norm_);
  var sub = h2.map(norm_);
  var find = function (pred, from) {
    for (var i = from || 0; i < top.length; i++) if (pred(top[i])) return i;
    return -1;
  };

  var name = find(function (t) { return t.indexOf('фермер') === 0; });
  var debStart = find(function (t) { return t.indexOf('дебитор') >= 0; });
  var kredStart = find(function (t) { return t.indexOf('кредитор') >= 0; });
  var kirim = find(function (t) { return t === 'кирим'; });
  var kirimTotal = find(function (t) { return t === 'жами'; }, kirim + 1);
  var cash = find(function (t) { return t.indexOf('накд') === 0; });
  var chiqim = find(function (t) { return t === 'чиким' || t === 'чиқим'; });
  var chiqimTotal = find(function (t) { return t.indexOf('реализация') === 0; }, chiqim + 1);
  var service = find(function (t) { return t.indexOf('саклаш') >= 0 || t.indexOf('сақлаш') >= 0; });
  var debEnd = find(function (t) { return t.indexOf('дебитор') >= 0; }, debStart + 1);
  var kredEnd = find(function (t) { return t.indexOf('кредитор') >= 0; }, kredStart + 1);

  var required = [name, debStart, kredStart, kirim, kirimTotal, chiqim, chiqimTotal, service, debEnd, kredEnd];
  if (required.some(function (i) { return i < 0; })) return null;

  var branchesBetween = function (from, to) {
    var list = [];
    for (var c = from; c < to; c++) {
      var label = String(h2[c] || '').trim();
      if (label) list.push({ col: c, name: label });
    }
    return list;
  };

  return {
    inn: 0,
    name: name,
    debStart: debStart,
    kredStart: kredStart,
    kirimBranches: branchesBetween(kirim, kirimTotal),
    kirimTotal: kirimTotal,
    cash: cash,
    chiqimBranches: branchesBetween(chiqim, chiqimTotal),
    chiqimTotal: chiqimTotal,
    service: service,
    debEnd: debEnd,
    kredEnd: kredEnd
  };
}

/** "01.10.2026 Дебитор" sarlavhasidan yil va oyni oladi; bo‘lmasa varaq nomidan */
function detectPeriod_(header, sheetName) {
  var m = String(header || '').match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return { year: +m[3], month: +m[2] };
  var key = norm_(sheetName).replace(/[^а-яёa-z]/g, '');
  var month = MONTH_NAMES[key];
  if (!month) return null;
  var y = String(sheetName).match(/(20\d{2})/);
  return { year: y ? +y[1] : new Date().getFullYear(), month: month };
}

function num_(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (v === null || v === undefined) return 0;
  var s = String(v).replace(/\s/g, '').replace(',', '.');
  if (!s || s === '-' || s.charAt(0) === '#') return 0;
  var n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

function norm_(v) {
  return String(v || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
