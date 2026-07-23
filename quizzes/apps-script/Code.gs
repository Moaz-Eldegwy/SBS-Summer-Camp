/* ═══════════════════════════════════════════════════════════════════════
   SBS Summer Camp — quiz gradebook backend (Google Apps Script)

   SETUP (once):
     1. Create a Google Sheet. Copy its ID from the URL:
          docs.google.com/spreadsheets/d/<THIS_PART>/edit
     2. Extensions → Apps Script. Delete everything, paste this file, Save.
     3. Fill in SHEET_ID below. Change SHARED_TOKEN if you like.
     4. Import roster.csv into a tab named exactly  Roster
        (File → Import → Upload → Insert new sheet, then rename it Roster).
        Or: run  setupSheets()  once, then paste the roster in manually.
     5. Run  setupSheets()  from the editor (grant permissions when asked).
     6. Deploy → New deployment → Web app
          Execute as:      Me
          Who has access:  Anyone            ← must be "Anyone", not "Anyone with Google account"
        Copy the /exec URL into quizzes/quiz-config.js.

   AFTER EDITING A QUIZ — all four steps, in order:
     1. Update ANSWER_KEYS below to match the new questions.
     2. Bump KEY_VERSION.
     3. Re-deploy (see below). Editing the script is NOT enough — the live
        web app keeps serving the last deployed version, so a stale key will
        quietly mis-grade every submission.
     4. Run  regradeAll()  to repair rows written before the re-deploy.

   RE-DEPLOYING after a code change: Deploy → Manage deployments →
   pencil icon → Version: New version → Deploy. The URL stays the same.
   Then open the /exec URL: the keyVersion it reports must match this file.
   ═══════════════════════════════════════════════════════════════════════ */

var SHEET_ID     = 'PASTE_YOUR_SPREADSHEET_ID_HERE';
var SHARED_TOKEN = 'sbs-2026-summer-camp';   // must match TOKEN in quiz-config.js

var ROSTER_SHEET  = 'Roster';
var SUMMARY_SHEET = 'Summary';
var QUIZZES       = ['Quiz 1', 'Quiz 2', 'Quiz 3', 'Quiz 4'];

/* Bump this whenever ANSWER_KEYS changes, then re-deploy. Open the /exec URL
   in a browser: if the keyVersion it reports is behind this file, the live
   deployment is stale and is grading against the old key. */
var KEY_VERSION = 3;

/* Correct answers, 0-based, in question order — mirror of `correct` in each
   quizN.html. Leave an array empty until that quiz has questions; the script
   then falls back to the score the browser reported. */
var ANSWER_KEYS = {
  'Quiz 1': [2, 1, 1, 2, 0, 2, 2, 2, 1, 0],
  'Quiz 2': [1, 1, 2, 1, 0, 1, 1, 2, 2, 1],
  'Quiz 3': [],
  'Quiz 4': []
};

var ROSTER_HEADERS = ['Name', 'Student ID', 'Email'];
var QUIZ_HEADERS   = ['Student ID', 'Name', 'Email', 'Score', 'Total', 'Percent',
                      'Attempts', 'First Submitted', 'Last Submitted', 'Last Answers'];

/* ─────────────────────────── web endpoints ─────────────────────────── */

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);
    if (req.token !== SHARED_TOKEN) return json({ ok: false, error: 'bad token' });

    if (req.action === 'verify') return json(handleVerify(req));
    if (req.action === 'submit') return json(handleSubmit(req));
    return json({ ok: false, error: 'unknown action' });

  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

// Open the /exec URL in a browser to confirm the deployment is live.
function doGet() {
  var keySizes = {};
  QUIZZES.forEach(function (q) { keySizes[q] = (ANSWER_KEYS[q] || []).length; });
  return json({
    ok: true, service: 'SBS quiz gradebook', quizzes: QUIZZES,
    keyVersion: KEY_VERSION, keySizes: keySizes
  });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ─────────────────────────── verify ─────────────────────────── */

function handleVerify(req) {
  var row = findStudent(req.login);
  if (!row) return { ok: false, error: 'not found' };
  return { ok: true, id: row.id, name: row.name, email: row.email };
}

/* "Shalllaby@Gmail.com" → "shalllaby". Same rule as the browser. */
function normalizeLogin(v) {
  return String(v == null ? '' : v).trim().toLowerCase().split('@')[0].trim();
}

function findStudent(login) {
  var key = normalizeLogin(login);
  if (!key) return null;

  var index = getRosterIndex();
  return index.byEmail[key] || index.byId[key.toUpperCase()] || null;
}

/* Roster is cached for 6 hours; call clearRosterCache() after editing it. */
function getRosterIndex() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('roster');
  if (hit) return JSON.parse(hit);

  var sheet = ss().getSheetByName(ROSTER_SHEET);
  if (!sheet) throw new Error('Missing "' + ROSTER_SHEET + '" sheet — run setupSheets() first.');

  var values = sheet.getDataRange().getValues();
  var index  = { byEmail: {}, byId: {} };

  for (var i = 1; i < values.length; i++) {
    var name  = String(values[i][0] || '').trim();
    var id    = String(values[i][1] || '').trim();
    var email = String(values[i][2] || '').trim();
    if (!id) continue;

    var rec = { id: id, name: name, email: email };
    index.byId[id.toUpperCase()] = rec;
    var local = normalizeLogin(email);
    if (local) index.byEmail[local] = rec;
  }

  cache.put('roster', JSON.stringify(index), 21600);
  return index;
}

function clearRosterCache() {
  CacheService.getScriptCache().remove('roster');
  SpreadsheetApp.getActive().toast('Roster cache cleared.');
}

/* ─────────────────────────── submit ─────────────────────────── */

function handleSubmit(req) {
  var student = findStudent(req.id);
  if (!student) return { ok: false, error: 'not found' };

  var quiz = String(req.quiz || '').trim();
  if (QUIZZES.indexOf(quiz) === -1) return { ok: false, error: 'unknown quiz' };

  var answers = Array.isArray(req.answers) ? req.answers : [];
  var total   = Number(req.total) || answers.length;
  var score   = gradeAnswers(quiz, answers, total, req.clientScore);

  // Serialize concurrent submissions so two students never clobber one row.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return writeResult(quiz, student, score, total, answers);
  } finally {
    lock.releaseLock();
  }
}

/* Grades against ANSWER_KEYS so a tampered POST cannot inflate a score.
   Falls back to the browser's number when no key is configured, or when the
   key length does not match the quiz — a shorter key silently marks every
   unkeyed question wrong, which is how a real 3/10 once landed as 1/10. */
function gradeAnswers(quiz, answers, total, clientScore) {
  var key = ANSWER_KEYS[quiz] || [];
  if (!key.length) return Math.max(0, Number(clientScore) || 0);

  if (key.length !== total) {
    console.warn(quiz + ': answer key has ' + key.length + ' entries but the page ' +
                 'sent ' + total + ' questions. This deployment is out of date — ' +
                 're-deploy the script. Using the browser score for now.');
    return Math.max(0, Number(clientScore) || 0);
  }

  var score = 0;
  for (var i = 0; i < key.length; i++) {
    if (Number(answers[i]) === key[i]) score++;
  }
  return score;
}

function writeResult(quiz, student, score, total, answers) {
  var sheet = ensureQuizSheet(quiz);
  var now   = new Date();
  var text  = answersToLetters(answers);

  var ids  = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
  var rowN = 0;
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim().toUpperCase() === student.id.toUpperCase()) {
      rowN = i + 2;
      break;
    }
  }

  var attempts, best, first;

  if (rowN) {
    var prev = sheet.getRange(rowN, 1, 1, QUIZ_HEADERS.length).getValues()[0];
    attempts = (Number(prev[6]) || 1) + 1;
    best     = Math.max(Number(prev[3]) || 0, score);   // keep the best attempt
    first    = prev[7] || now;
  } else {
    rowN     = sheet.getLastRow() + 1;
    attempts = 1;
    best     = score;
    first    = now;
  }

  sheet.getRange(rowN, 1, 1, QUIZ_HEADERS.length).setValues([[
    student.id, student.name, student.email,
    best, total, total ? Math.round(best / total * 100) / 100 : 0,
    attempts, first, now, text
  ]]);

  return { ok: true, score: best, total: total, attempts: attempts, latest: score };
}

function answersToLetters(answers) {
  var L = 'ABCDEFGH';
  return answers.map(function (a) {
    var n = Number(a);
    return (n >= 0 && n < L.length) ? L.charAt(n) : '–';
  }).join(',');
}

/* ─────────────────────────── sheet setup ─────────────────────────── */

function ss() {
  if (!SHEET_ID || SHEET_ID.indexOf('PASTE') === 0) {
    throw new Error('Set SHEET_ID at the top of the script.');
  }
  return SpreadsheetApp.openById(SHEET_ID);
}

/* Run this once from the editor. Safe to re-run — it never deletes data. */
function setupSheets() {
  var book = ss();

  ensureSheet(book, ROSTER_SHEET, ROSTER_HEADERS);
  QUIZZES.forEach(function (q) { ensureQuizSheet(q); });
  ensureSheet(book, SUMMARY_SHEET, ['Student ID', 'Name', 'Email']);

  book.toast('Sheets ready. Now paste the roster into "' + ROSTER_SHEET + '".');
}

function ensureQuizSheet(name) {
  return ensureSheet(ss(), name, QUIZ_HEADERS);
}

function ensureSheet(book, name, headers) {
  var sheet = book.getSheetByName(name);
  if (!sheet) sheet = book.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.getRange(1, 1, 1, headers.length)
       .setFontWeight('bold')
       .setBackground('#F5F7F8');
  sheet.setFrozenRows(1);

  if (headers.indexOf('Percent') > -1) {
    sheet.getRange(2, headers.indexOf('Percent') + 1, sheet.getMaxRows() - 1, 1)
         .setNumberFormat('0%');
  }
  return sheet;
}

/* ─────────────────────────── repair ─────────────────────────── */

/* Re-scores every stored row against the current ANSWER_KEYS, using the
   "Last Answers" column. Run this once after fixing a key that graded people
   wrongly. Scores only ever go up: a stored score can be from an earlier,
   better attempt whose answers were overwritten, so we keep the higher of the
   two rather than trusting the re-score blindly. */
function regradeAll() {
  var book    = ss();
  var fixed   = [];

  QUIZZES.forEach(function (quiz) {
    var key = ANSWER_KEYS[quiz] || [];
    if (!key.length) return;

    var sheet = book.getSheetByName(quiz);
    if (!sheet || sheet.getLastRow() < 2) return;

    var range = sheet.getRange(2, 1, sheet.getLastRow() - 1, QUIZ_HEADERS.length);
    var rows  = range.getValues();

    rows.forEach(function (row) {
      var answers = lettersToAnswers(row[9]);
      if (answers.length !== key.length) return;   // not this key's shape — skip

      var total  = Number(row[4]) || key.length;
      var stored = Number(row[3]) || 0;
      var best   = Math.max(stored, gradeAnswers(quiz, answers, total, 0));
      if (best === stored) return;

      row[3] = best;
      row[5] = total ? Math.round(best / total * 100) / 100 : 0;
      fixed.push(quiz + ' ' + row[0] + ': ' + stored + ' → ' + best);
    });

    range.setValues(rows);
  });

  var msg = fixed.length ? 'Regraded ' + fixed.length + ' row(s): ' + fixed.join(', ')
                         : 'No rows needed regrading.';
  console.log(msg);
  book.toast(msg);
}

/* "B,B,A,–" → [1, 1, 0, -1]. Unanswered stays -1 so positions line up with
   the key; -1 never matches, which is what we want. */
function lettersToAnswers(text) {
  var L   = 'ABCDEFGH';
  var raw = String(text == null ? '' : text).trim();
  if (!raw) return [];
  return raw.split(',').map(function (c) { return L.indexOf(c.trim().toUpperCase()); });
}

/* ─────────────────────────── summary ─────────────────────────── */

/* Rebuilds the Summary tab: one row per student, one column per quiz.
   Run it from the editor whenever you want a fresh gradebook view. */
function rebuildSummary() {
  var book  = ss();
  var sheet = ensureSheet(book, SUMMARY_SHEET, ['Student ID', 'Name', 'Email']);
  sheet.clear();

  var index   = getRosterIndex();
  var scores  = {};
  QUIZZES.forEach(function (q) {
    scores[q] = {};
    var s = book.getSheetByName(q);
    if (!s || s.getLastRow() < 2) return;
    s.getRange(2, 1, s.getLastRow() - 1, 5).getValues().forEach(function (r) {
      var id = String(r[0]).trim().toUpperCase();
      if (id) scores[q][id] = { score: Number(r[3]) || 0, total: Number(r[4]) || 0 };
    });
  });

  var headers = ['Student ID', 'Name', 'Email']
    .concat(QUIZZES)
    .concat(['Total', 'Out of', 'Percent', 'Quizzes Taken']);

  var rows = Object.keys(index.byId).sort().map(function (key) {
    var st = index.byId[key];
    var row = [st.id, st.name, st.email];
    var got = 0, outOf = 0, taken = 0;

    QUIZZES.forEach(function (q) {
      var hit = scores[q][key];
      if (hit) {
        row.push(hit.score);
        got   += hit.score;
        outOf += hit.total;
        taken++;
      } else {
        row.push('');
      }
    });

    row.push(got, outOf, outOf ? Math.round(got / outOf * 100) / 100 : 0, taken);
    return row;
  });

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F5F7F8');
  sheet.setFrozenRows(1);
  sheet.getRange(2, headers.indexOf('Percent') + 1, Math.max(rows.length, 1), 1)
       .setNumberFormat('0%');

  book.toast('Summary rebuilt — ' + rows.length + ' students.');
}

/* Adds an "SBS Quizzes" menu to the spreadsheet for the two manual actions. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('SBS Quizzes')
    .addItem('Rebuild summary', 'rebuildSummary')
    .addItem('Regrade stored scores', 'regradeAll')
    .addItem('Reload roster cache', 'clearRosterCache')
    .addToUi();
}
