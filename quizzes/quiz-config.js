/* ─────────────────────────────────────────────────────────────
   SBS Summer Camp — quiz backend config
   Edit these two values after you deploy the Google Apps Script.
   ───────────────────────────────────────────────────────────── */
window.SBS_QUIZ_CONFIG = {

  // Paste the Web app URL from: Apps Script → Deploy → New deployment
  // → Web app → Execute as "Me", Who has access "Anyone".
  // It looks like: https://script.google.com/macros/s/AKfycb..../exec
  API_URL: 'https://script.google.com/macros/s/AKfycbzgYLInhH2KqLXVeqlrPfEDEvNgnxV0zCbm1P363tLvX0A_UddiVPJ39M3YxPw1_pk5rQ/exec',

  // Must match SHARED_TOKEN inside the Apps Script.
  // This is visible to anyone who reads the page source — it only stops
  // casual/automated junk, it is not real security.
  TOKEN: 'sbs-2026-summer-camp'

};
