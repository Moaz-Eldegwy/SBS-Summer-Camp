/* ─────────────────────────────────────────────────────────────
   SBS Summer Camp — quiz engine (shared by quiz1..quiz4)

   Each quiz page defines, before loading this file:
     window.QUIZ_ID  — the Google Sheet tab name, e.g. "Quiz 1"
     window.QUESTIONS — [{ q, a:[...], correct, why }]

   Flow: sign in (ID or email) → answer → submit → row in Google Sheet.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var CFG      = window.SBS_QUIZ_CONFIG || {};
  var QUIZ_ID  = window.QUIZ_ID || 'Quiz';
  var QS       = window.QUESTIONS || [];
  var LETTERS  = 'ABCDEFGH';
  var STORE_KEY = 'sbs.student';

  var gate   = document.getElementById('gate');
  var who    = document.getElementById('who');
  var body   = document.getElementById('quizbody');
  var host   = document.getElementById('quiz');
  var acts   = document.getElementById('actions');
  var bar    = document.querySelector('#bar span');
  var panel  = document.getElementById('score');

  var student = null;                       // { id, name, email }
  var picked  = new Array(QS.length).fill(null);
  var graded  = false;

  /* ───────── helpers ───────── */

  // "Shalllaby@Gmail.com " and " shalllaby " both become "shalllaby".
  function normalizeLogin(v) {
    return String(v == null ? '' : v).trim().toLowerCase().split('@')[0].trim();
  }

  function configured() {
    return CFG.API_URL && CFG.API_URL.indexOf('http') === 0;
  }

  // Apps Script has no OPTIONS handler, so we must send a "simple" request:
  // text/plain avoids the CORS preflight entirely.
  function callApi(payload) {
    return fetch(CFG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ token: CFG.TOKEN }, payload)),
      redirect: 'follow'
    }).then(function (r) { return r.json(); });
  }

  function loadStudent() {
    try {
      var raw = sessionStorage.getItem(STORE_KEY);
      var s = raw ? JSON.parse(raw) : null;
      return (s && s.id && s.name) ? s : null;
    } catch (e) { return null; }
  }

  function saveStudent(s) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  /* ───────── gate ───────── */

  function showGate() {
    var msg   = gate.querySelector('.msg');
    var input = gate.querySelector('input');
    var btn   = gate.querySelector('button');
    var form  = gate.querySelector('form');

    gate.classList.remove('hide');
    body.style.display = 'none';
    who.classList.remove('show');

    if (!configured()) {
      msg.className = 'msg err';
      msg.textContent = 'This quiz is not connected to the gradebook yet. Ask your instructor.';
      input.disabled = btn.disabled = true;
      return;
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var login = normalizeLogin(input.value);
      if (!login) {
        msg.className = 'msg err';
        msg.textContent = 'Type your student ID or your email first.';
        return;
      }

      input.disabled = btn.disabled = true;
      msg.className = 'msg busy';
      msg.textContent = 'Checking…';

      callApi({ action: 'verify', login: login })
        .then(function (res) {
          if (!res || !res.ok) throw new Error((res && res.error) || 'not found');
          student = { id: res.id, name: res.name, email: res.email };
          saveStudent(student);
          startQuiz();
        })
        .catch(function (err) {
          input.disabled = btn.disabled = false;
          msg.className = 'msg err';
          msg.textContent = String(err.message) === 'not found'
            ? 'We could not find that ID or email on the roster. Check the spelling, or use the other one.'
            : 'Could not reach the server. Check your connection and try again.';
          input.focus();
          input.select();
        });
    });

    input.focus();
  }

  function signOut() {
    try { sessionStorage.removeItem(STORE_KEY); } catch (e) {}
    location.reload();
  }

  /* ───────── quiz ───────── */

  function startQuiz() {
    gate.classList.add('hide');
    body.style.display = '';

    who.querySelector('.nm').textContent = student.name;
    who.querySelector('button').addEventListener('click', signOut);
    who.classList.add('show');

    if (!QS.length) {
      document.getElementById('bar').style.display = 'none';
      host.innerHTML = '<div id="empty"><b>Coming soon</b>This quiz opens after the session. ' +
                       'Check back then — the link stays the same.</div>';
      return;
    }
    render();
  }

  function render() {
    QS.forEach(function (item, qi) {
      var card = document.createElement('div');
      card.className = 'q';
      card.innerHTML = '<div class="n">QUESTION ' + (qi + 1) + ' / ' + QS.length + '</div>' +
                       '<h3></h3><div class="opts"></div><div class="why"></div>';
      card.querySelector('h3').textContent = item.q;

      var opts = card.querySelector('.opts');
      item.a.forEach(function (text, ai) {
        var b = document.createElement('button');
        b.className = 'opt';
        b.innerHTML = '<span class="k">' + LETTERS[ai] + '</span><span></span>';
        b.lastChild.textContent = text;
        b.addEventListener('click', function () {
          if (graded) return;
          picked[qi] = ai;
          opts.querySelectorAll('.opt').forEach(function (o) { o.classList.remove('picked'); });
          b.classList.add('picked');
          progress();
        });
        opts.appendChild(b);
      });
      host.appendChild(card);
    });

    var submit = document.createElement('button');
    submit.className = 'cta';
    submit.textContent = 'Submit answers';
    submit.disabled = true;

    var retry = document.createElement('button');
    retry.className = 'cta ghost';
    retry.textContent = 'Try again';
    retry.style.display = 'none';

    acts.append(submit, retry);
    retry.addEventListener('click', function () { location.reload(); });
    submit.addEventListener('click', function () { grade(submit, retry); });

    function progress() {
      var done = picked.filter(function (p) { return p !== null; }).length;
      bar.style.width = (done / QS.length * 100) + '%';
      submit.disabled = done < QS.length;
    }
  }

  function grade(submit, retry) {
    graded = true;
    submit.disabled = true;
    submit.textContent = 'Saving…';

    var score = 0;
    host.querySelectorAll('.q').forEach(function (card, qi) {
      var item = QS[qi];
      card.querySelectorAll('.opt').forEach(function (o, ai) {
        o.classList.add('locked');
        o.classList.remove('picked');
        if (ai === item.correct) o.classList.add('right');
        else if (ai === picked[qi]) o.classList.add('wrong');
      });
      if (picked[qi] === item.correct) score++;
      if (item.why) {
        var why = card.querySelector('.why');
        why.innerHTML = '<b>' + (picked[qi] === item.correct ? 'Correct — ' : 'Not quite — ') + '</b>';
        why.append(item.why);
        why.classList.add('show');
      }
    });

    var pct  = Math.round(score / QS.length * 100);
    var note = pct === 100 ? 'Perfect run. You were listening.'
             : pct >= 60   ? 'Solid. Skim the slides for the ones you missed.'
             :               'Worth a re-watch — open the session slides and try again.';

    panel.innerHTML = '<div class="big"><em>' + score + ' / ' + QS.length + '</em></div>' +
                      '<p>' + note + '</p><div class="saved busy">Saving your result…</div>';
    panel.classList.add('show');
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });

    var flag = panel.querySelector('.saved');

    callApi({
      action:      'submit',
      quiz:        QUIZ_ID,
      id:          student.id,
      answers:     picked,
      total:       QS.length,
      clientScore: score
    })
      .then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || 'save failed');
        flag.className = 'saved ok';
        flag.textContent = res.attempts > 1
          ? '✓ Recorded — attempt ' + res.attempts + '. Your best score (' +
            res.score + '/' + res.total + ') is what counts.'
          : '✓ Recorded for ' + student.name + '.';
      })
      .catch(function () {
        flag.className = 'saved warn';
        flag.textContent = '⚠ We could not save your result. Screenshot this page and send it ' +
                           'to your instructor, or reload and submit again.';
      })
      .then(function () {
        submit.style.display = 'none';
        retry.style.display = '';
      });
  }

  /* ───────── boot ───────── */

  student = loadStudent();
  if (student && configured()) startQuiz();
  else showGate();
})();
