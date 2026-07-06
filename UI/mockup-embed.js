/**
 * mockup-embed.js — pasek „← Mapa” dla paneli otwieranych z silnika / mockupów.
 * Powrót: iframe → postMessage; solo → ROBOCZA lub historia.
 */
(function () {
  'use strict';
  var MAP_TARGET = '../Gra-podglad.html';
  var qs = location.search;
  var isFs = /\bembed=1\b/.test(qs) || (/\bembed=fs\b/.test(qs));
  var isDk = /\bembed=dk\b/.test(qs);
  var inFrame = window.parent !== window;
  if (!inFrame && !isFs && !isDk) return;

  var mode = isDk ? 'dk' : 'fs';
  var closeMsg = mode === 'dk' ? 'civ-close-dk' : 'civ-close-fs';

  var css =
    '#mockup-embed-bar{display:flex;align-items:center;gap:12px;padding:8px 14px;' +
    'background:rgba(4,8,20,.98);border-bottom:1px solid rgba(232,216,138,.28);' +
    'font-family:"Segoe UI",Tahoma,sans-serif;font-size:11px;position:sticky;top:0;z-index:99999}' +
    '#mockup-embed-bar button{padding:6px 14px;background:transparent;border:1px solid rgba(232,216,138,.28);' +
    'border-radius:5px;color:#e8d88a;font-weight:600;cursor:pointer;letter-spacing:.2px}' +
    '#mockup-embed-bar button:hover{border-color:#e8d88a}' +
    '#mockup-embed-bar span{color:#7a7055;text-transform:uppercase;letter-spacing:.35px}' +
    'body.embed-mockup-active .mockup-banner-hide{display:none!important}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);
  document.body.classList.add('embed-mockup-active');

  var bar = document.createElement('div');
  bar.id = 'mockup-embed-bar';
  bar.innerHTML =
    '<button type="button" id="mockup-embed-back">← Mapa</button>' +
    '<span id="mockup-embed-label">Mockup</span>';
  document.body.insertBefore(bar, document.body.firstChild);

  var lbl = document.getElementById('mockup-embed-label');
  if (lbl && document.title) lbl.textContent = document.title.replace(/^THE GAME\s*[—–-]\s*/i, '');

  document.querySelectorAll('.mockup-banner, .mockup-banner-hide, #preview-banner').forEach(function (el) {
    el.classList.add('mockup-banner-hide');
  });

  document.getElementById('mockup-embed-back').onclick = function () {
    if (inFrame) window.parent.postMessage(closeMsg, '*');
    else if (window.history.length > 1) window.history.back();
    else window.location.href = MAP_TARGET;
  };

  window.civMockupClose = function () {
    if (inFrame) window.parent.postMessage(closeMsg, '*');
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.civMockupClose();
  });
})();
