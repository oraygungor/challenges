/**
 * Our 10 Challenges — Google Sheets backend.
 *
 * Install as a BOUND Apps Script project:
 * Google Sheet > Extensions > Apps Script.
 *
 * Script Properties (Project Settings) required:
 *   ORAY_PIN  = your private 6–12 digit PIN
 *   GAMZE_PIN = Gamze's private 6–12 digit PIN
 * Do not publish PINs or put them into GitHub files.
 */

const CHALLENGE_SHEET = 'Challenges';
const PARTICIPANTS = ['Oray', 'Gamze'];
const SESSION_TTL_SECONDS = 21600; // up to 6 hours; cache entries may expire earlier
const MAX_CHALLENGES = 10;
const HEADERS = ['Id', 'Challenge', 'AddedBy', 'CreatedAt', 'OrayDoneAt', 'GamzeDoneAt'];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Our 10 Challenges | Oray & Gamze')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Run ONCE in the Apps Script editor after copying both files. */
function setup() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error('This script must be created from Google Sheets > Extensions > Apps Script.');

  let sheet = book.getSheetByName(CHALLENGE_SHEET);
  if (!sheet) sheet = book.insertSheet(CHALLENGE_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold').setBackground('#ece7fa');
    sheet.setColumnWidth(1, 50);
    sheet.setColumnWidth(2, 420);
    sheet.setColumnWidth(3, 100);
    sheet.setColumnWidth(4, 170);
    sheet.setColumnWidth(5, 170);
    sheet.setColumnWidth(6, 170);
    sheet.getRange('D:F').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  } else {
    const actual = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    if (actual.join('|') !== HEADERS.join('|')) {
      throw new Error('The Challenges sheet already has different headers. Do not overwrite existing data.');
    }
  }
  return 'Ready: Google Sheet has been configured.';
}

function login(name, pin) {
  const user = requireUser_(name);
  const savedPin = PropertiesService.getScriptProperties().getProperty(user.toUpperCase() + '_PIN');
  if (!savedPin || !/^\d{6,12}$/.test(savedPin)) {
    throw new Error('The owner must set ORAY_PIN and GAMZE_PIN (6–12 digits) in Script Properties.');
  }
  const cache = CacheService.getScriptCache();
  const lockKey = 'failed_login_' + user;
  const failed = Number(cache.get(lockKey) || '0');
  if (failed >= 8) throw new Error('Too many attempts. Try again in about 10 minutes.');
  if (String(pin) !== savedPin) {
    cache.put(lockKey, String(failed + 1), 600);
    throw new Error('Incorrect PIN.');
  }
  cache.remove(lockKey);
  const token = Utilities.getUuid() + '-' + Utilities.getUuid();
  cache.put('session_' + token, user, SESSION_TTL_SECONDS);
  return { token: token, user: user, state: readState_() };
}

function getState(token) {
  const user = requireSession_(token);
  return { user: user, state: readState_() };
}

function addChallenge(token, text) {
  const user = requireSession_(token);
  const title = String(text || '').trim().replace(/\s+/g, ' ');
  if (title.length < 3 || title.length > 180) {
    throw new Error('A challenge must be between 3 and 180 characters.');
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet_();
    const existing = readRows_(sheet);
    if (existing.length >= MAX_CHALLENGES) throw new Error('All 10 challenges are already set.');
    const expected = PARTICIPANTS[existing.length % 2];
    if (user !== expected) throw new Error('It is ' + expected + "'s turn to add a challenge.");
    if (existing.some(function(row) { return String(row[1]).toLowerCase() === title.toLowerCase(); })) {
      throw new Error('That challenge is already on the list.');
    }
    sheet.appendRow([existing.length + 1, title, user, new Date(), '', '']);
    SpreadsheetApp.flush();
    return readState_();
  } finally {
    lock.releaseLock();
  }
}

function setCompleted(token, challengeId, completed) {
  const user = requireSession_(token);
  const id = Number(challengeId);
  if (!Number.isInteger(id) || id < 1 || id > MAX_CHALLENGES || typeof completed !== 'boolean') {
    throw new Error('Invalid completion request.');
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet_();
    const rows = readRows_(sheet);
    if (rows.length !== MAX_CHALLENGES) throw new Error('Finish the 10 challenges before checking them off.');
    const index = rows.findIndex(function(r) { return Number(r[0]) === id; });
    if (index < 0) throw new Error('Challenge not found.');
    const column = user === 'Oray' ? 5 : 6;
    const cell = sheet.getRange(index + 2, column);
    const previous = cell.getValue();
    if (completed && !previous) cell.setValue(new Date());
    if (!completed && previous) cell.clearContent();
    SpreadsheetApp.flush();
    return readState_();
  } finally {
    lock.releaseLock();
  }
}

function logout(token) {
  if (typeof token === 'string' && token.length > 20) {
    CacheService.getScriptCache().remove('session_' + token);
  }
  return true;
}

// Helpers are private to the server: the trailing underscore prevents client calls.
function requireUser_(name) {
  if (typeof name !== 'string' || PARTICIPANTS.indexOf(name) < 0) {
    throw new Error('Choose Oray or Gamze.');
  }
  return name;
}

function requireSession_(token) {
  if (typeof token !== 'string' || token.length < 20) throw new Error('SESSION_EXPIRED');
  const user = CacheService.getScriptCache().get('session_' + token);
  if (!user || PARTICIPANTS.indexOf(user) < 0) throw new Error('SESSION_EXPIRED');
  return user;
}

function getSheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book && book.getSheetByName(CHALLENGE_SHEET);
  if (!sheet) throw new Error('Run setup() once in the Apps Script editor first.');
  return sheet;
}

function readRows_(sheet) {
  const count = sheet.getLastRow();
  if (count < 2) return [];
  return sheet.getRange(2, 1, count - 1, HEADERS.length)
    .getValues().filter(function(row) { return row[0] !== ''; });
}

function toIso_(value) {
  if (!(value instanceof Date) || isNaN(value.getTime())) return null;
  return value.toISOString();
}

function readState_() {
  const rows = readRows_(getSheet_());
  const challenges = rows.map(function(row) {
    return {
      id: Number(row[0]),
      title: String(row[1]),
      addedBy: String(row[2]),
      createdAt: toIso_(row[3]),
      orayDoneAt: toIso_(row[4]),
      gamzeDoneAt: toIso_(row[5])
    };
  });
  return {
    phase: challenges.length >= MAX_CHALLENGES ? 'active' : 'creating',
    nextUser: PARTICIPANTS[challenges.length % 2],
    challenges: challenges
  };
}