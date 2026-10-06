'use strict';
// One-time, guarded preparation. Never touches tracking, collectors, data or other pages.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const root = path.resolve(process.argv[2] || '.');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(root, p), s);
const blobHash = b => crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const expected = {
  'raiox01/index.html': 'abaace1b9ed5f7ff9c60ed0421872618ed7a983f',
  'raiox01/raiox01.js': 'c48515ee5f5e5b7d2b6133147b906d747e744edd',
  'raiox01/raiox01.css': '1d9e65241ab3171e308ed594b97ff2a537fe2595',
  'raiox01/base.css': '49a36cac04acddb87db0271f03ad2daa2e6609c4',
  'raiox01/rx-tracking.js': 'ff94797849041f973758f1e8754b8f056528f7c8',
  'raiox01/raio-x-hero-wide.webp': 'd88de2083818c2998c031a1cc4647dccee67aa61'
};
function replaceOnce(text, from, to) {
  assert.equal(text.split(from).length - 1, 1, 'Unexpected source marker: ' + from.slice(0, 100));
  return text.replace(from, to);
}
(async () => {
  for (const [p, h] of Object.entries(expected)) assert.equal(blobHash(fs.readFileSync(path.join(root, p))), h, 'Baseline changed: ' + p);
  let html = read('raiox01/index.html');
  let js = read('raiox01/raiox01.js');
  const originalJs = js;
  const start = js.indexOf('function renderOpening() {');
  const end = js.indexOf('\nfunction renderStep()', start);
  assert.ok(start > 0 && end > start);
  const originalOpening = js.slice(start, end);
  const match = originalOpening.match(/root\.innerHTML = panel\(`([\s\S]*?)`\);/);
  assert.ok(match && !match[1].includes('${'), 'Opening must be a static, reviewed template');
  const srcset = './raio-x-hero-640.webp 640w, ./raio-x-hero-960.webp 960w, ./raio-x-hero-1200.webp 1200w, ./raio-x-hero-wide.webp?v=2 1586w';
  const sizes = '(max-width: 520px) calc(100vw - 66px), 440px';
  const imageFrom = 'src="./raio-x-hero-wide.webp?v=2"';
  const imageTo = `src="./raio-x-hero-960.webp" srcset="${srcset}" sizes="${sizes}" fetchpriority="high" loading="eager" decoding="async"`;
  const openingMarkup = replaceOnce(match[1], imageFrom, imageTo);
  let opening = replaceOnce(originalOpening, match[0], `if (root.dataset.rxPrerendered !== "opening-v1" || !root.querySelector("#start-button")) {\n    root.innerHTML = panel(\`${openingMarkup}\`);\n  }\n  delete root.dataset.rxPrerendered;\n  document.querySelector("#start-button").dataset.rxReady = "1";\n  document.querySelector("#start-button").removeAttribute("aria-busy");`);
  const bindingEnd = '    render();\n  });\n}';
  opening = replaceOnce(opening, bindingEnd, '    render();\n  });\n  // A click during the non-blocking download is replayed exactly once.\n  if (window.__RX01_START_PENDING) {\n    window.__RX01_START_PENDING = false;\n    document.querySelector("#start-button").click();\n  }\n}');
  js = replaceOnce(js, originalOpening, opening);
  const videoHints = [...html.matchAll(/  <link rel="preload" href="(https:\/\/(?:scripts|cdn)\.converteai\.net\/[^"\n]+)" as="(script|fetch)">\n/g)];
  assert.equal(videoHints.length, 3);
  for (const hint of videoHints) html = replaceOnce(html, hint[0], '');
  const hints = videoHints.map(h => ({ href: h[1], as: h[2] }));
  const prepare = `let resultResourcesPrepared = false;\nfunction prepareResultResources() {\n  if (resultResourcesPrepared) return;\n  resultResourcesPrepared = true;\n  // Download only; the original renderResult still binds and starts the player.\n  const hints = ${JSON.stringify(hints)};\n  for (const hint of hints) {\n    if ([...document.querySelectorAll('link[rel="preload"]')].some(link => link.href === hint.href)) continue;\n    const link = document.createElement("link");\n    link.rel = "preload"; link.href = hint.href; link.as = hint.as;\n    link.dataset.rxResultPreload = "1";\n    document.head.appendChild(link);\n  }\n}\n\n`;
  js = replaceOnce(js, 'function render() {', prepare + 'function render() {');
  js = replaceOnce(js, '  if(state.leadSaved)RX.saveCheckpoint(state);', '  if(state.leadSaved)RX.saveCheckpoint(state);\n  if (state.screen === "step" && state.stepIndex >= 5) prepareResultResources();');
  html = replaceOnce(html, '    <section id="quiz-root" class="quiz-root" aria-live="polite"></section>', `    <section id="quiz-root" class="quiz-root" aria-live="polite" data-rx-prerendered="opening-v1"><section class="screen panel"><div class="panel-inner">${openingMarkup}</div></section></section>\n    <script>\n    // Buffer an early start click; no tracking, storage or navigation happens here.\n    (function(){var b=document.getElementById('start-button');b.addEventListener('click',function(){if(b.dataset.rxReady!=='1'){window.__RX01_START_PENDING=true;b.setAttribute('aria-busy','true');}});})();\n    </script>`);
  html = replaceOnce(html, '  <link rel="preload" href="./raio-x-hero-wide.webp?v=2" as="image" fetchpriority="high">', `  <link rel="preload" href="./raio-x-hero-960.webp" imagesrcset="${srcset}" imagesizes="${sizes}" as="image" fetchpriority="high">`);
  const configTag = '  <script src="./rx-config.js?v=20260930-BS06OUT2026"></script>\n';
  const flag = '  <script>window.__RX26_SITE=true;</script>\n';
  const trackingTag = '  <script src="./rx-tracking.js?v=20260930-BS06OUT2026"></script>\n';
  const gtm = html.match(/  <script>(\(function\(w,d,s,l,i\)[\s\S]*?'GTM-MZBZ9HCS'\);)<\/script>\n/);
  assert.ok(gtm, 'Expected GTM bootstrap');
  html = replaceOnce(html, configTag, '');
  html = replaceOnce(html, trackingTag, '');
  html = replaceOnce(html, gtm[0], '');
  write('raiox01/gtm-bootstrap.js', '// Same GTM bootstrap, kept after RX initialization by ordered defer.\n' + gtm[1] + '\n');
  html = replaceOnce(html, '</head>', '  <meta name="rx-page-build" content="raiox01-first-paint-20261006-1">\n  <!-- Preserve execution order: configuration, tracking, GTM, quiz, quality observer. -->\n  <script defer src="./rx-config.js?v=20260930-BS06OUT2026"></script>\n  <script defer src="./rx-tracking.js?v=20260930-BS06OUT2026"></script>\n  <script defer src="./gtm-bootstrap.js?v=20261006-1"></script>\n</head>');
  assert.ok(html.includes(flag));
  const css = read('raiox01/base.css') + '\n' + replaceOnce(read('raiox01/raiox01.css'), '@import url("./base.css?v=4");', '') + '\n' + read('raiox01/rx-privacy.css');
  assert.ok(!css.includes('@import'));
  write('raiox01/raiox01.bundle.css', '/* Same rules and cascade: base, page, privacy. */\n' + css);
  html = replaceOnce(html, '  <link rel="stylesheet" href="./raiox01.css?v=20260929-cta-pulse">', '  <link rel="stylesheet" href="./raiox01.bundle.css?v=20261006-1">');
  html = replaceOnce(html, '  <link rel="stylesheet" href="./rx-privacy.css?v=20260929-privacy-footer">\n', '');
  html = replaceOnce(html, '<script src="./raiox01.js?v=20261002-hubla"></script>', '<script defer src="./raiox01.js?v=20261006-first-paint-1"></script>');
  const source = path.join(root, 'raiox01/raio-x-hero-wide.webp');
  const images = [];
  for (const width of [640, 960, 1200]) {
    const name = `raiox01/raio-x-hero-${width}.webp`;
    const info = await sharp(source).resize({width,withoutEnlargement:true}).webp({quality:90,effort:6}).toFile(path.join(root,name));
    images.push({file:name,width:info.width,height:info.height,bytes:info.size});
  }
  write('raiox01/index.html', html);
  write('raiox01/raiox01.js', js);
  // Operational flow and result/checkout must remain byte-identical.
  for (const [a,b] of [['async function handleLeadSubmit','function validateLead'],['async function answerStep','let completionInFlight'],['async function renderLoading','function renderResult'],['function renderResult','function getVslProfile'],['function buildCheckoutUrl','function escapeHtml']]) {
    const span = s => s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
    assert.equal(span(js),span(originalJs),'Operational function modified: '+a);
  }
  const result = {build:'raiox01-first-paint-20261006-1',baseline:expected,original_image_bytes:fs.statSync(source).size,images,tracking_unchanged:blobHash(fs.readFileSync(path.join(root,'raiox01/rx-tracking.js')))===expected['raiox01/rx-tracking.js'],deferred_video_preloads:hints.length};
  console.log(JSON.stringify(result));
})().catch(error=>{console.error(error);process.exitCode=1;});
