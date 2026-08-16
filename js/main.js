/* Homebody Pet Sitting — mockup interactions (lightweight, no libraries) */
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

  // --- booking form (mock: no backend, friendly confirmation) ---
  var form = document.getElementById('enquiryForm');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = document.getElementById('formOk');
      var name = (form.querySelector('[name="name"]') || {}).value || 'there';
      if (ok) {
        ok.textContent = 'Thanks ' + name.split(' ')[0] + '! Your enquiry is on its way — Nicole will be in touch shortly. 🐾';
        ok.classList.add('show');
        ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
      /* LAUNCH: wire this form to email/Formspree/Netlify Forms so enquiries
         actually send. Currently a front-end mock only. */
    });
  }
})();
