import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const origin = 'https://quiz.brunosimplicio.com.br';
const pages = ['pagina01', 'pagina02', 'pagina03', 'pagina04', 'paginabio', 'raiox01', 'raiox02', 'raiox03', 'vsl01v1', 'raioxvsl1'];
const config = JSON.parse(readFileSync(new URL('vercel.json', root), 'utf8'));
const redirect = config.redirects.find(r => r.source.startsWith('/:page('));
const matches = new RegExp('^/(' + redirect.source.slice('/:page('.length, -1) + ')$');

for (const page of pages) {
  test(`${page}: bare entry redirects once and local scripts resolve under canonical URL`, () => {
    const incoming = new URL(`${origin}/${page}?utm_source=facebook&fbclid=test-only&rx_test=1`);
    const match = incoming.pathname.match(matches);
    assert.ok(match, 'bare campaign URL must be covered');
    assert.equal(redirect.permanent, true);
    const canonical = new URL(redirect.destination.replace(':page', match[1]), origin);
    canonical.search = incoming.search;
    assert.equal(canonical.pathname, `/${page}/`);
    assert.equal(canonical.search, incoming.search);
    assert.equal(matches.test(canonical.pathname), false, 'must not redirect the canonical path again');
    const html = readFileSync(new URL(`${page}/index.html`, root), 'utf8');
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)/g)].map(m => new URL(m[1], canonical)).filter(u => u.origin === origin);
    assert.ok(scripts.length > 0);
    for (const script of scripts) assert.ok(existsSync(new URL(script.pathname.slice(1), root)), `missing ${script.pathname}`);
  });
}

for (const page of ['vsl01v1', 'raioxvsl1']) {
  test(`${page}: tracker also resolves correctly if HTML is served without redirect`, () => {
    const html = readFileSync(new URL(`${page}/index.html`, root), 'utf8');
    const src = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)/g)].map(m => m[1]).find(s => s.includes('tracking.js'));
    for (const suffix of ['', '/', '/index.html']) assert.equal(new URL(src, `${origin}/${page}${suffix}`).pathname, `/${page}/tracking.js`);
  });
}
