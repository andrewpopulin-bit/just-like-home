/* ===========================================================================
   Just Like Home - services and prices

   Nicole keeps her services in the "Services" tab of the same Google Sheet
   she uses for availability. She edits the sheet, the website follows.

   Sheet columns:  Group | Service | Description | Price | Unit | Price 2 | Unit 2
   "Price 2" and "Unit 2" are optional, used where a service has two prices
   (the solo walk is a weekday and a weekend rate).

   If the sheet is unreachable the prices already written into the page are
   left exactly as they are, so the site never shows an empty services list.
   =========================================================================== */
window.JLH_SERVICES_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS1RBcI2dJbBEv4D1w8EchS429xjxqn3k1IvvRYYwcu8whuKx98zvLlUgs0ruhtpul3hVrVDXT6Mo9Q/pub?gid=961051947&single=true&output=csv";

(function () {
  'use strict';
  var host = document.getElementById('servicesMenu');
  if (!host || !window.JLH_SERVICES_CSV) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function render(rows) {
    if (!rows.length) return;                    // keep whatever is already on the page
    var html = '', group = null, n = 0;
    rows.forEach(function (r) {
      if (r.group !== group) {
        if (group !== null) html += '</div>';
        html += '<h3 class="menu-cat">' + esc(r.group) + '</h3><div class="menu">';
        group = r.group;
      }
      n++;
      var price = '<span class="menu__price' + (r.price2 ? ' menu__price--dual' : '') + '">';
      if (r.price2) {
        price += '<span>' + esc(r.price) + '<em>' + esc(r.unit) + '</em></span>' +
                 '<span>' + esc(r.price2) + '<em>' + esc(r.unit2) + '</em></span>';
      } else {
        price += esc(r.price) + '<em>' + esc(r.unit) + '</em>';
      }
      price += '</span>';

      html += '<article class="menu__row">' +
                '<span class="menu__num">' + ('0' + n).slice(-2) + '</span>' +
                '<div class="menu__main">' +
                  '<h3>' + esc(r.service) + '</h3>' +
                  '<p>' + esc(r.description) + '</p>' +
                  (r.service.toLowerCase().indexOf('my place') > -1
                    ? '<div class="solo"><b>Prefer a solo stay?</b> Solo stays may also be available depending on dates and availability. Just mention this when enquiring.</div>'
                    : '') +
                '</div>' + price +
              '</article>';
    });
    if (group !== null) html += '</div>';
    host.innerHTML = html;
  }

  function parse(text) {
    if (!window.JLH || !window.JLH.parseCSVRows) return [];
    var rows = window.JLH.parseCSVRows(text);
    if (!rows.length) return [];
    var head = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var idx = function (name) { return head.indexOf(name); };
    var iG = idx('group'), iS = idx('service'), iD = idx('description'),
        iP = idx('price'), iU = idx('unit'), iP2 = idx('price 2'), iU2 = idx('unit 2');
    if (iS === -1) return [];
    var out = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      var service = (r[iS] || '').trim();
      if (!service) continue;
      out.push({
        group: (iG > -1 ? r[iG] : '') || '',
        service: service,
        description: (iD > -1 ? r[iD] : '') || '',
        price: (iP > -1 ? r[iP] : '') || '',
        unit: (iU > -1 ? r[iU] : '') || '',
        price2: (iP2 > -1 ? r[iP2] : '') || '',
        unit2: (iU2 > -1 ? r[iU2] : '') || ''
      });
    }
    return out;
  }

  fetch(window.JLH_SERVICES_CSV + '&t=' + Date.now())
    .then(function (r) { if (!r.ok) throw 0; return r.text(); })
    .then(function (t) { render(parse(t)); })
    .catch(function () { /* leave the prices already in the page */ });
})();
