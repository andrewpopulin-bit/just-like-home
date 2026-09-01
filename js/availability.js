/* ===========================================================================
   Just Like Home - availability
   Powers the availability calendar and the live "are these dates free?" note
   under the date fields on the enquiry form.

   The dates themselves live in  data/availability.json  and Nicole edits
   those through the Manage Availability page (manage.html). Nothing in this
   file needs changing.
   =========================================================================== */
(function () {
  'use strict';

  var FALLBACK = { maxSpaces: 3, monthsToShow: 3, bookings: [] };

  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  function parse(s) {
    var p = String(s || '').split('-');
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }
  function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function key(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function build(cfg) {
    var maxSpaces = cfg.maxSpaces || 3;
    var booked = {};
    (cfg.bookings || []).forEach(function (b) {
      var start = parse(b.from);
      if (!start) return;
      var end = parse(b.to) || start;
      if (end < start) end = start;
      var spaces = (typeof b.spaces === 'number') ? b.spaces : 0;
      for (var d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        var k = key(d);
        booked[k] = (k in booked) ? Math.min(booked[k], spaces) : spaces;
      }
    });
    return { maxSpaces: maxSpaces, monthsToShow: cfg.monthsToShow || 3, booked: booked };
  }

  // exposed so the manage page can reuse the exact same rendering
  window.JLH = window.JLH || {};
  window.JLH.renderCalendar = function (rootEl, cfg, offset) {
    var m = build(cfg);
    var today = midnight(new Date());
    function spacesOn(d) { var k = key(d); return (k in m.booked) ? m.booked[k] : m.maxSpaces; }
    function stateFor(d) {
      if (d < today) return { cls: 'is-past', label: '' };
      var left = spacesOn(d);
      if (left <= 0) return { cls: 'is-full', label: 'Fully booked' };
      if (left < m.maxSpaces) return { cls: 'is-limited', label: left + (left === 1 ? ' space left' : ' spaces left') };
      return { cls: 'is-free', label: 'Available' };
    }
    function renderMonth(year, month) {
      var first = new Date(year, month, 1);
      var startCol = (first.getDay() + 6) % 7;
      var daysInMonth = new Date(year, month + 1, 0).getDate();
      var html = '<div class="avc__month"><div class="avc__mname">' + MONTHS[month] + ' ' + year + '</div><div class="avc__grid">';
      DAYS.forEach(function (d) { html += '<span class="avc__dow">' + d + '</span>'; });
      for (var i = 0; i < startCol; i++) html += '<span class="avc__pad"></span>';
      for (var day = 1; day <= daysInMonth; day++) {
        var d = new Date(year, month, day);
        var st = stateFor(d);
        var title = st.label ? MONTHS[month] + ' ' + day + ', ' + st.label : '';
        html += '<span class="avc__day ' + st.cls + '"' + (title ? ' title="' + title + '" aria-label="' + title + '"' : '') + '>' + day + '</span>';
      }
      return html + '</div></div>';
    }
    var base = new Date(today.getFullYear(), today.getMonth() + (offset || 0), 1);
    var out = '';
    for (var i = 0; i < m.monthsToShow; i++) {
      var mo = new Date(base.getFullYear(), base.getMonth() + i, 1);
      out += renderMonth(mo.getFullYear(), mo.getMonth());
    }
    rootEl.innerHTML = out;
    return m;
  };

  function start(cfg) {
    var m = build(cfg);
    var today = midnight(new Date());
    function spacesOn(d) { var k = key(d); return (k in m.booked) ? m.booked[k] : m.maxSpaces; }

    // ---- calendar ----
    var root = document.getElementById('availabilityCal');
    if (root) {
      var offset = 0;
      function draw() {
        window.JLH.renderCalendar(root, cfg, offset);
        var p = document.getElementById('avcPrev');
        if (p) p.disabled = (offset === 0);
      }
      var prevBtn = document.getElementById('avcPrev');
      var nextBtn = document.getElementById('avcNext');
      if (prevBtn) prevBtn.addEventListener('click', function () { if (offset > 0) { offset--; draw(); } });
      if (nextBtn) nextBtn.addEventListener('click', function () { offset++; draw(); });
      draw();
    }

    // ---- live check on the enquiry form (never blocks the enquiry) ----
    var fromEl = document.getElementById('from');
    var toEl = document.getElementById('to');
    var noteEl = document.getElementById('dateStatus');
    if (fromEl && toEl && noteEl) {
      var check = function () {
        var s = parse(fromEl.value);
        if (!s) { noteEl.className = 'datestatus'; noteEl.textContent = ''; return; }
        var e = parse(toEl.value) || s;
        if (e < s) e = s;
        var worst = m.maxSpaces, anyPast = false;
        for (var d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          if (d < today) anyPast = true;
          worst = Math.min(worst, spacesOn(d));
        }
        if (anyPast) {
          noteEl.className = 'datestatus is-note';
          noteEl.textContent = 'Those dates are in the past, double check them for me.';
        } else if (worst <= 0) {
          noteEl.className = 'datestatus is-full';
          noteEl.textContent = 'Those dates look fully booked. Send your enquiry anyway, I can often still help or point you to someone who can.';
        } else if (worst < m.maxSpaces) {
          noteEl.className = 'datestatus is-limited';
          noteEl.textContent = 'Limited spaces on those dates, ' + worst + ' left. Worth getting in quick.';
        } else {
          noteEl.className = 'datestatus is-free';
          noteEl.textContent = 'Those dates look free. Send your details through and I will confirm.';
        }
      };
      ['change', 'input'].forEach(function (ev) {
        fromEl.addEventListener(ev, check);
        toEl.addEventListener(ev, check);
      });
    }
  }

  // load the dates, then start. Cache-busted so edits show up straight away.
  if (document.getElementById('availabilityCal') || document.getElementById('dateStatus')) {
    fetch('data/availability.json?t=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : FALLBACK; })
      .catch(function () { return FALLBACK; })
      .then(start);
  }
})();
