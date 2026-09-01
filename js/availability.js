/* ===========================================================================
   Just Like Home - availability

   Where the dates come from:
   Nicole keeps her booked dates in a Google Sheet. The sheet is published to
   the web as a CSV and read here. She edits the sheet, the website follows a
   few minutes later. No code, no logins beyond her own Google account.

   Sheet columns (row 1 is headers, exactly these three):
       From            To              Status
       1/09/2026       26/09/2026      Fully booked
       10/10/2026      13/10/2026      1 space left

   Status accepts: "Fully booked", "1 space left", "2 spaces left",
   or just a number for how many spaces are left.

   If the sheet is ever unreachable the site quietly falls back to
   data/availability.json so the page never breaks.
   =========================================================================== */
/* ===== THE ONLY TWO LINES THAT NEED SETTING UP =====
   JLH_SHEET_CSV  : File > Share > Publish to web > (sheet) > CSV > Publish
   JLH_SHEET_EDIT : the normal sheet link Nicole opens to edit it            */
window.JLH_SHEET_CSV  = "";
window.JLH_SHEET_EDIT = "";

(function () {
  'use strict';

  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  var MAX_DEFAULT = 3;

  /* ---------- forgiving date parsing ----------
     Handles 2026-09-01, 1/9/2026, 01/09/2026 (Australian day-first).      */
  function parseDate(s) {
    s = String(s || '').trim();
    if (!s) return null;
    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return mk(+m[1], +m[2], +m[3]);
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) {
      var y = +m[3]; if (y < 100) y += 2000;
      return mk(y, +m[2], +m[1]);   // day first
    }
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function mk(y, mo, d) {
    var dt = new Date(y, mo - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function key(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  // "Fully booked" -> 0, "1 space left" -> 1, "2" -> 2, blank -> 0
  function parseStatus(s) {
    s = String(s || '').trim().toLowerCase();
    if (!s) return 0;
    var n = s.match(/\d+/);
    if (n && !/^\d{4}-/.test(s)) return Math.max(0, parseInt(n[0], 10));
    if (s.indexOf('full') > -1 || s.indexOf('booked') > -1 || s.indexOf('away') > -1) return 0;
    return 0;
  }

  /* ---------- tiny CSV parser (handles quoted fields) ---------- */
  function parseCSV(text) {
    var rows = [], row = [], val = '', inQ = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { val += '"'; i++; } else inQ = false; }
        else val += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { row.push(val); val = ''; }
      else if (c === '\n') { row.push(val); rows.push(row); row = []; val = ''; }
      else if (c !== '\r') val += c;
    }
    if (val.length || row.length) { row.push(val); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ''; }); });
  }

  function bookingsFromCSV(text) {
    var rows = parseCSV(text);
    if (!rows.length) return [];
    var head = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var iFrom = head.indexOf('from'), iTo = head.indexOf('to'), iStatus = head.indexOf('status');
    var start = 1;
    if (iFrom === -1) { iFrom = 0; iTo = 1; iStatus = 2; start = 0; }  // no header row
    var out = [];
    for (var r = start; r < rows.length; r++) {
      var f = rows[r][iFrom];
      if (!f || !parseDate(f)) continue;
      out.push({
        from: f,
        to: (iTo > -1 ? rows[r][iTo] : '') || f,
        spaces: parseStatus(iStatus > -1 ? rows[r][iStatus] : '')
      });
    }
    return out;
  }

  /* ---------- shared model ---------- */
  function build(cfg) {
    var maxSpaces = cfg.maxSpaces || MAX_DEFAULT;
    var booked = {};
    (cfg.bookings || []).forEach(function (b) {
      var s = parseDate(b.from); if (!s) return;
      var e = parseDate(b.to) || s; if (e < s) e = s;
      var sp = (typeof b.spaces === 'number') ? b.spaces : parseStatus(b.spaces);
      for (var d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        var k = key(d);
        booked[k] = (k in booked) ? Math.min(booked[k], sp) : sp;
      }
    });
    return { maxSpaces: maxSpaces, monthsToShow: cfg.monthsToShow || 3, booked: booked };
  }

  window.JLH = window.JLH || {};
  window.JLH.parseCSVBookings = bookingsFromCSV;

  window.JLH.renderCalendar = function (rootEl, cfg, offset) {
    var m = build(cfg), today = midnight(new Date());
    function spacesOn(d) { var k = key(d); return (k in m.booked) ? m.booked[k] : m.maxSpaces; }
    function stateFor(d) {
      if (d < today) return { cls: 'is-past', label: '' };
      var left = spacesOn(d);
      if (left <= 0) return { cls: 'is-full', label: 'Fully booked' };
      if (left < m.maxSpaces) return { cls: 'is-limited', label: left + (left === 1 ? ' space left' : ' spaces left') };
      return { cls: 'is-free', label: 'Available' };
    }
    function renderMonth(y, mo) {
      var startCol = (new Date(y, mo, 1).getDay() + 6) % 7;
      var n = new Date(y, mo + 1, 0).getDate();
      var h = '<div class="avc__month"><div class="avc__mname">' + MONTHS[mo] + ' ' + y + '</div><div class="avc__grid">';
      DAYS.forEach(function (d) { h += '<span class="avc__dow">' + d + '</span>'; });
      for (var i = 0; i < startCol; i++) h += '<span class="avc__pad"></span>';
      for (var day = 1; day <= n; day++) {
        var d = new Date(y, mo, day), st = stateFor(d);
        var t = st.label ? MONTHS[mo] + ' ' + day + ', ' + st.label : '';
        h += '<span class="avc__day ' + st.cls + '"' + (t ? ' title="' + t + '" aria-label="' + t + '"' : '') + '>' + day + '</span>';
      }
      return h + '</div></div>';
    }
    var base = new Date(today.getFullYear(), today.getMonth() + (offset || 0), 1), out = '';
    for (var i = 0; i < m.monthsToShow; i++) {
      var mo = new Date(base.getFullYear(), base.getMonth() + i, 1);
      out += renderMonth(mo.getFullYear(), mo.getMonth());
    }
    rootEl.innerHTML = out;
    return m;
  };

  /* ---------- page wiring ---------- */
  function start(cfg) {
    var m = build(cfg), today = midnight(new Date());
    function spacesOn(d) { var k = key(d); return (k in m.booked) ? m.booked[k] : m.maxSpaces; }

    var root = document.getElementById('availabilityCal');
    if (root) {
      var offset = 0;
      var draw = function () {
        window.JLH.renderCalendar(root, cfg, offset);
        var p = document.getElementById('avcPrev');
        if (p) p.disabled = (offset === 0);
      };
      var pb = document.getElementById('avcPrev'), nb = document.getElementById('avcNext');
      if (pb) pb.addEventListener('click', function () { if (offset > 0) { offset--; draw(); } });
      if (nb) nb.addEventListener('click', function () { offset++; draw(); });
      draw();
    }

    var fromEl = document.getElementById('from'),
        toEl = document.getElementById('to'),
        noteEl = document.getElementById('dateStatus');
    if (fromEl && toEl && noteEl) {
      var check = function () {
        var s = parseDate(fromEl.value);
        if (!s) { noteEl.className = 'datestatus'; noteEl.textContent = ''; return; }
        var e = parseDate(toEl.value) || s; if (e < s) e = s;
        var worst = m.maxSpaces, past = false;
        for (var d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          if (d < today) past = true;
          worst = Math.min(worst, spacesOn(d));
        }
        if (past) { noteEl.className = 'datestatus is-note'; noteEl.textContent = 'Those dates are in the past, double check them for me.'; }
        else if (worst <= 0) { noteEl.className = 'datestatus is-full'; noteEl.textContent = 'Those dates look fully booked. Send your enquiry anyway, I can often still help or point you to someone who can.'; }
        else if (worst < m.maxSpaces) { noteEl.className = 'datestatus is-limited'; noteEl.textContent = 'Limited spaces on those dates, ' + worst + ' left. Worth getting in quick.'; }
        else { noteEl.className = 'datestatus is-free'; noteEl.textContent = 'Those dates look free. Send your details through and I will confirm.'; }
      };
      ['change', 'input'].forEach(function (ev) { fromEl.addEventListener(ev, check); toEl.addEventListener(ev, check); });
    }
  }

  /* ---------- load: Google Sheet first, JSON file as a safety net ---------- */
  function load() {
    var needed = document.getElementById('availabilityCal') || document.getElementById('dateStatus');
    if (!needed) return;

    var fallback = function () {
      fetch('data/availability.json?t=' + Date.now())
        .then(function (r) { return r.ok ? r.json() : { maxSpaces: MAX_DEFAULT, bookings: [] }; })
        .catch(function () { return { maxSpaces: MAX_DEFAULT, bookings: [] }; })
        .then(start);
    };

    if (window.JLH_SHEET_CSV) {
      fetch(window.JLH_SHEET_CSV + (window.JLH_SHEET_CSV.indexOf('?') > -1 ? '&' : '?') + 't=' + Date.now())
        .then(function (r) { if (!r.ok) throw 0; return r.text(); })
        .then(function (txt) {
          var bookings = bookingsFromCSV(txt);
          start({ maxSpaces: MAX_DEFAULT, monthsToShow: 3, bookings: bookings });
        })
        .catch(fallback);
    } else {
      fallback();
    }
  }
  load();
})();
