/* Just Like Home by Nicole - site interactions (lightweight, no libraries) */
(function () {
  'use strict';

  // --- mobile nav toggle ---
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav__links a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- current year ---
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // --- reveal on scroll (event-driven, unobserve once shown) ---
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // --- FAQ accordion: keep it single-open per group (native <details>) ---
  document.querySelectorAll('.faq-wrap').forEach(function (group) {
    var items = group.querySelectorAll('details.faq');
    items.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) {
          items.forEach(function (other) { if (other !== d) other.open = false; });
        }
      });
    });
  });

  // --- booking form: opens the visitor's email pre-filled to Nicole ---
  // (Works with no backend. To switch to a hosted form later, point the
  //  <form> action at Formspree and remove this handler.)
  var form = document.getElementById('enquiryForm');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var val = function (n) {
        var el = form.querySelector('[name="' + n + '"]');
        return el ? el.value.trim() : '';
      };
      var name = val('name') || 'there';
      var body = [
        'Name: ' + val('name'),
        'Phone: ' + val('phone'),
        'Email: ' + val('email'),
        'Service: ' + val('service'),
        'Dog(s): ' + val('pet'),
        'Dates: ' + val('from') + ' to ' + val('to'),
        '',
        val('msg')
      ].join('\n');
      var mailto = 'mailto:jlh.petservice@gmail.com'
        + '?subject=' + encodeURIComponent('Booking enquiry from ' + (val('name') || 'the website'))
        + '&body=' + encodeURIComponent(body);
      var ok = document.getElementById('formOk');
      if (ok) {
        ok.textContent = 'Thanks ' + name.split(' ')[0] + '! Your email is ready to go. Just hit send in your mail app and Nicole will be in touch soon.';
        ok.classList.add('show');
        ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      window.location.href = mailto;
    });
  }
})();
