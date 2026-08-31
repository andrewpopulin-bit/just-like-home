/* ===========================================================================
   Just Like Home - availability calendar
   Hotel style: each date shows Available / Limited / Fully booked.

   >>> NICOLE / ANDREW: THIS IS THE ONLY BIT YOU EDIT <<<
   Add a line to "bookings" for any dates that are booked.
     from / to : the dates, written YYYY-MM-DD (to is included)
     spaces    : how many dog spaces are STILL FREE on those dates
                 0 = fully booked, 1 or 2 = limited, leave out = free
   Delete a line once the booking is over.
   =========================================================================== */
window.JLH_AVAILABILITY = {
  maxSpaces: 3,          // how many dogs Nicole takes at once
  monthsToShow: 3,       // how far ahead visitors can look
  bookings: [
    { from: "2026-09-01", to: "2026-09-26", spaces: 0 },
    { from: "2026-10-10", to: "2026-10-13", spaces: 1 }
  ]
};

/* ---------- everything below here is the engine, no need to touch ---------- */
(function () {
  'use strict';
  var cfg = window.JLH_AVAILABILITY;
  var root = document.getElementById('availabilityCal');
  if (!root || !cfg) return;

  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  // parse YYYY-MM-DD as a local date (avoids timezone shifting the day)
  function parse(s) {
    var p = String(s).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function key(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  // build a lookup of date -> spaces left
  var booked = {};
  (cfg.bookings || []).forEach(function (b) {
    var start = parse(b.from);
    var end = b.to ? parse(b.to) : start;
    var spaces = (typeof b.spaces === 'number') ? b.spaces : 0;
    for (var d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      var k = key(d);
      // if two bookings overlap, keep the tighter one
      booked[k] = (k in booked) ? Math.min(booked[k], spaces) : spaces;
    }
  });

  var today = midnight(new Date());
  var offset = 0; // how many months we've paged forward

  function stateFor(d) {
    if (d < today) return { cls: 'is-past', label: '' };
    var k = key(d);
    var left = (k in booked) ? booked[k] : cfg.maxSpaces;
    if (left <= 0) return { cls: 'is-full', label: 'Fully booked' };
    if (left < cfg.maxSpaces) return { cls: 'is-limited', label: left + (left === 1 ? ' space left' : ' spaces left') };
    return { cls: 'is-free', label: 'Available' };
  }

  function renderMonth(year, month) {
    var first = new Date(year, month, 1);
    var startCol = (first.getDay() + 6) % 7;           // Monday-first
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var html = '<div class="avc__month"><div class="avc__mname">' + MONTHS[month] + ' ' + year + '</div><div class="avc__grid">';
    DAYS.forEach(function (d) { html += '<span class="avc__dow">' + d + '</span>'; });
    for (var i = 0; i < startCol; i++) html += '<span class="avc__pad"></span>';
    for (var day = 1; day <= daysInMonth; day++) {
      var d = new Date(year, month, day);
      var st = stateFor(d);
      var title = st.label ? MONTHS[month] + ' ' + day + ', ' + st.label : '';
      html += '<span class="avc__day ' + st.cls + '"' + (title ? ' title="' + title + '"' : '') +
              (st.label ? ' aria-label="' + title + '"' : '') + '>' + day + '</span>';
    }
    return html + '</div></div>';
  }

  function render() {
    var base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    var out = '';
    for (var i = 0; i < (cfg.monthsToShow || 3); i++) {
      var m = new Date(base.getFullYear(), base.getMonth() + i, 1);
      out += renderMonth(m.getFullYear(), m.getMonth());
    }
    root.innerHTML = out;
    var prev = document.getElementById('avcPrev');
    if (prev) prev.disabled = (offset === 0);
  }

  var prevBtn = document.getElementById('avcPrev');
  var nextBtn = document.getElementById('avcNext');
  if (prevBtn) prevBtn.addEventListener('click', function () { if (offset > 0) { offset--; render(); } });
  if (nextBtn) nextBtn.addEventListener('click', function () { offset++; render(); });

  render();
})();
