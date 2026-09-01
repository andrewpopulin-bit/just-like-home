/* Manage Availability page - lets Nicole edit her booked dates with no code. */
(function () {
  'use strict';
  var rowsEl = document.getElementById('rows');
  if (!rowsEl) return;

  var maxEl = document.getElementById('maxSpaces');
  var outEl = document.getElementById('out');
  var prevEl = document.getElementById('previewCal');
  var rows = [];

  var STATUS = [
    { v: 0, label: 'Fully booked' },
    { v: 1, label: '1 space left' },
    { v: 2, label: '2 spaces left' }
  ];

  function esc(s) { return String(s).replace(/"/g, '&quot;'); }

  function drawRows() {
    rowsEl.innerHTML = rows.map(function (r, i) {
      return '<div class="mrow">' +
        '<label>From<input type="date" data-i="' + i + '" data-k="from" value="' + esc(r.from) + '"></label>' +
        '<label>To<input type="date" data-i="' + i + '" data-k="to" value="' + esc(r.to) + '"></label>' +
        '<label>Status<select data-i="' + i + '" data-k="spaces">' +
          STATUS.map(function (s) {
            return '<option value="' + s.v + '"' + (r.spaces === s.v ? ' selected' : '') + '>' + s.label + '</option>';
          }).join('') +
        '</select></label>' +
        '<button type="button" class="mdel" data-del="' + i + '" aria-label="Remove these dates">Remove</button>' +
      '</div>';
    }).join('') || '<p style="color:var(--ink-soft)">No booked dates yet. Everything shows as available.</p>';
  }

  function config() {
    return {
      maxSpaces: Math.max(1, parseInt(maxEl.value, 10) || 3),
      monthsToShow: 3,
      bookings: rows
        .filter(function (r) { return r.from; })
        .map(function (r) { return { from: r.from, to: r.to || r.from, spaces: r.spaces }; })
    };
  }

  function refresh() {
    var cfg = config();
    outEl.textContent = JSON.stringify(cfg, null, 2);
    if (window.JLH && window.JLH.renderCalendar) window.JLH.renderCalendar(prevEl, cfg, 0);
  }

  rowsEl.addEventListener('input', function (e) {
    var t = e.target, i = t.getAttribute('data-i'), k = t.getAttribute('data-k');
    if (i === null) return;
    rows[+i][k] = (k === 'spaces') ? parseInt(t.value, 10) : t.value;
    refresh();
  });
  rowsEl.addEventListener('change', function (e) {
    if (e.target.getAttribute('data-k') === 'spaces') {
      rows[+e.target.getAttribute('data-i')].spaces = parseInt(e.target.value, 10);
      refresh();
    }
  });
  rowsEl.addEventListener('click', function (e) {
    var d = e.target.getAttribute('data-del');
    if (d === null) return;
    rows.splice(+d, 1);
    drawRows(); refresh();
  });
  maxEl.addEventListener('input', refresh);

  document.getElementById('addRow').addEventListener('click', function () {
    var today = new Date().toISOString().slice(0, 10);
    rows.push({ from: today, to: today, spaces: 0 });
    drawRows(); refresh();
  });

  document.getElementById('copyBtn').addEventListener('click', function () {
    var text = JSON.stringify(config(), null, 2);
    var done = function () {
      var m = document.getElementById('copied');
      m.style.display = 'block';
      setTimeout(function () { m.style.display = 'none'; }, 6000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
    } else { fallback(text, done); }
  });
  function fallback(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { alert('Copy failed. Open "Show me what gets copied" and copy it by hand.'); }
    document.body.removeChild(ta);
  }

  // load whatever is currently live so she edits from the real dates
  fetch('data/availability.json?t=' + Date.now())
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (cfg) {
      if (cfg) {
        maxEl.value = cfg.maxSpaces || 3;
        rows = (cfg.bookings || []).map(function (b) {
          return { from: b.from || '', to: b.to || b.from || '', spaces: (typeof b.spaces === 'number') ? b.spaces : 0 };
        });
      }
      drawRows(); refresh();
    });
})();
