const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const tick = () => new Promise(setImmediate);

function browser(page, {session = new Map(), local = new Map(), pending = false} = {}) {
  const sent = [], handlers = {};
  class Element {
    dataset = {}; href = 'https://pay.hub.la/XhmUngrBMRpSh984fDuG'; textContent = 'Reservar'; id = '';
    classList = {contains: () => false};
    getBoundingClientRect() {return {width: 100, height: 40};}
    getAttribute() {return null;}
    closest(selector) {return selector === 'a[href]' ? this : null;}
  }
  const links = [new Element(), new Element()];
  if (page === 'vsl01v1') links[0].dataset.vsl01v1FixedCta = '1';
  const add = (name, fn) => (handlers[name] ??= []).push(fn);
  const storage = map => ({getItem: k => map.get(k) || null, setItem: (k,v) => map.set(k,v)});
  const search = '?utm_source=meta&utm_campaign=keep_original&utm_content=creative&sck=ad123';
  const context = {document: {visibilityState:'visible',referrer:'',querySelectorAll: s => s === 'a[href]' ? links : [],addEventListener:add},
    location:{pathname:`/${page}/`,search,href:`https://quiz.brunosimplicio.com.br/${page}/${search}`},
    navigator:{webdriver:true,userActivation:{hasBeenActive:false}}, performance:{now:()=>1000},
    crypto, URL, URLSearchParams, AbortController, Element, HTMLElement:Element, console,
    sessionStorage:storage(session),localStorage:storage(local),getComputedStyle:()=>({display:'block',visibility:'visible'}),
    setTimeout:()=>1,clearTimeout(){},addEventListener:add,
    fetch:async(url,options)=>{const p=JSON.parse(options.body);sent.push(p);
      if(pending && ['cta_click','checkout_click'].includes(p.event_name)) return new Promise(()=>{});
      return {ok:true,status:200,json:async()=>({ok:true,stored:true,event_id:p.event_id,page_id:p.page_id})};}};
  context.window=context;
  const file=/pagina0[2-4]/.test(page)?'scripts/sales-page-tracking.js':`${page}/tracking.js`;
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context);
  return {context,sent,session,local,links,click:async(i=0)=>{for(const fn of handlers.click||[])fn({target:links[i],isTrusted:false});await tick();}};
}

for (const page of ['pagina01','pagina02','pagina03','pagina04','vsl01v1']) {
  test(`${page}: repeated clicks emit one checkout and one click per logical CTA, including after reload`,async()=>{
    const b=browser(page);await tick();const original=b.sent[0].session_id;
    await b.click();await b.click();await b.click(1);await b.click(1);
    assert.equal(b.sent.filter(x=>x.event_name==='checkout_click').length,1);
    assert.equal(b.sent.filter(x=>x.event_name==='cta_click').length,2);
    assert.equal(b.context.dataLayer.filter(x=>x.rx?.name==='rx_checkout_click').length,1);
    assert.equal(b.context.dataLayer.filter(x=>x.rx?.name==='rx_sales_page_cta_click').length,2);
    assert(b.sent.every(x=>x.lancamento==='BS13OUT2026'));
    assert(b.sent.every(x=>x.attribution.utm_campaign==='keep_original'));
    const url=new URL(b.links[0].href);assert.equal(url.searchParams.get('utm_content'),'creative~pg_'+page);
    assert.equal(url.searchParams.get('sck'),'ad123~'+page+'_'+original.replaceAll('-',''));
    const reloaded=browser(page,b);await tick();await reloaded.click();
    assert.equal(reloaded.sent[0].session_id,original);
    assert.equal(reloaded.sent.filter(x=>x.event_name==='checkout_click'||x.event_name==='cta_click').length,0);
  });
  test(`${page}: navigation during an unconfirmed send keeps delivery retry without re-emitting marketing`,async()=>{
    const b=browser(page,{pending:true});await tick();await b.click();await b.click();
    const queued=JSON.parse(b.local.get(page+'_delivery_queue_v1'));
    assert.deepEqual(queued.map(x=>x.payload.event_name).sort(),['checkout_click','cta_click']);
    const expected=b.sent.find(x=>x.event_name==='checkout_click').event_id;
    const reloaded=browser(page,{session:b.session,local:b.local});await tick();await reloaded.click();
    const retried=reloaded.sent.filter(x=>x.event_name==='checkout_click');
    assert.equal(retried.length,1);assert.equal(retried[0].event_id,expected);
    assert.equal(reloaded.context.dataLayer.filter(x=>x.rx?.name==='rx_checkout_click').length,0);
    assert.deepEqual(JSON.parse(reloaded.local.get(page+'_delivery_queue_v1')),[]);
  });
  test(`${page}: legacy session keeps IDs and accepts one new logical send`,async()=>{
    const session=new Map(), id='12345678-1234-4234-8123-123456789012',checkout='12345678-1234-4234-8123-123456789013';
    session.set(page+'_tracking_v1',JSON.stringify({session_id:id,page_view_event_id:id,checkout_event_id:checkout,saved_at:Date.now()}));
    const b=browser(page,{session});await tick();await b.click();await b.click();
    assert(b.sent.every(x=>x.session_id===id));
    assert.equal(b.sent.filter(x=>x.event_name==='checkout_click').length,1);
    assert.equal(b.sent.find(x=>x.event_name==='checkout_click').event_id,checkout);
  });
}
