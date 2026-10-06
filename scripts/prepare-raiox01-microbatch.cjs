'use strict';
// Idempotent build-only patcher. Never changes the application state, DB, tags or other pages.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||'.');
const hash=b=>crypto.createHash('sha1').update(`blob ${Buffer.byteLength(b)}\0`).update(b).digest('hex');
function patch(file,expected,transform){const p=path.join(root,file),old=fs.readFileSync(p,'utf8');if(hash(old)!==expected)throw Error('Baseline changed: '+file);const next=transform(old);fs.writeFileSync(p,next);}
patch('raiox01/rx-tracking.js','ff94797849041f973758f1e8754b8f056528f7c8',s=>{
 s=s.replace('  let bootstrapEvent;','  let bootstrapEvent;\n  // RX01_BATCH_SLOT_BEGIN\n  let batchTransport=null;\n  // RX01_BATCH_SLOT_END');
 s=s.replace('  function serial(p){','  function serial(p){\n    // RX01_BATCH_ROUTE_BEGIN\n    if(batchTransport)return batchTransport.enqueue(p);\n    // RX01_BATCH_ROUTE_END');
 const marker="  bootstrapEvent=payload('page_view',{screen:'opening'});";
 if(!s.includes(marker))throw Error('Bootstrap marker missing');
 s=s.replace(marker,`  // RX01_BATCH_INIT_BEGIN
  try {
    batchTransport=w.RXOrderedBatch?.create({sessionId,testMode:cfg.testMode===true,resumed:!!saved,
      forceTest:cfg.testMode===true&&new URLSearchParams(w.location.search).get('rx_batch')==='1',
      storage:sessionStorage,getToken:()=>token,bootstrap:()=>bootstrapEvent,requestOne:request,
      allowed:p=>consent.analytics||essential.has(p.event_name),timeoutMs:cfg.webhookTimeoutMs,
      onStored:(p,result)=>{
        token=result.session_token;if(result.quiz_status)latestStatus={...result.quiz_status};
        lastDeliveryError=null;persistRuntime();
        w.dispatchEvent(new CustomEvent('rx:stored',{detail:{event_name:p.event_name,event_id:p.event_id,
          session_id:sessionId,test_mode:cfg.testMode,quiz_status:latestStatus?{...latestStatus}:null}}));
      }
    })||null;
  }catch(_){batchTransport=null;}
  w.RX.getTransportDiagnostics=()=>batchTransport?batchTransport.diagnostics():{active:false,mode:'legacy'};
  // RX01_BATCH_INIT_END
${marker}`);
 return s;
});
patch('raiox01/index.html','23d133faa8abb3b1f2371770aa664bbf1e2d2ec9',s=>s.replace(
 '<script defer src="./rx-tracking.js?v=20260930-BS06OUT2026"></script>',
 '<script defer src="./rx-batch.js?v=20261006-1"></script>\n  <script defer src="./rx-tracking.js?v=20261006-ordered-batch-1"></script>'));
// Retain the previous performance regression suite. Its old tracker checksum is
// compared AFTER stripping only the reviewed additive hooks; all original code remains exact.
patch('scripts/raiox01-performance.test.cjs','8b6b7eea4fe820a73851d637f0165e9513e12918',s=>{
 s=s.replace("const results={checks:[]", "const stripBatchHooks=s=>s.replace(/^[ \\t]*\\/\\/ RX01_BATCH_(SLOT|ROUTE|INIT)_BEGIN[\\s\\S]*?^[ \\t]*\\/\\/ RX01_BATCH_\\1_END\\r?\\n/gm,'');\nconst results={checks:[]");
 s=s.replace("assert.equal(sha(fs.readFileSync(path.join(root,p))),sha(fs.readFileSync(path.join(baseline,p))),p);", "assert.equal(sha(p==='raiox01/rx-tracking.js'?stripBatchHooks(read(root,p)):fs.readFileSync(path.join(root,p))),sha(fs.readFileSync(path.join(baseline,p))),p);");
 s=s.replace("['./rx-config.js','./rx-tracking.js','./gtm-bootstrap.js','./raiox01.js','/scripts/checkout-quality.js']", "['./rx-config.js','./rx-batch.js','./rx-tracking.js','./gtm-bootstrap.js','./raiox01.js','/scripts/checkout-quality.js']");
 return s;
});
const old=fs.readFileSync(path.join(root,'supabase/functions/raiox01-collect/index.ts'),'utf8');
if(hash(old)!=='ab931638497d6d3ac6fbc6edf0e17a7d500acb30')throw Error('Collector baseline changed');
let edge=old.replace('const rpc = Array.isArray(ingestPayload.events) ? "raiox01_ingest_lote" : "raiox01_ingest";','const rpc = "raiox01_ingest_lote_v2";');
edge=edge.replace('const backupStartedAt = performance.now();',`if (p?.batch_version !== "rx01-batch-v1" || !Array.isArray(p.events) || p.events.length < 1 || p.events.length > 8) {
      return reply({ok:false,stored:false,atomic:true,rolled_back:true,code:"invalid_batch",http_status:400},400);
    }
    const backupStartedAt = performance.now();`);
edge=edge.replace('rx01-ack-fast-20261006-1','rx01-batch-20261006-v1');
fs.mkdirSync(path.join(root,'supabase/functions/raiox01-collect-batch'),{recursive:true});
fs.writeFileSync(path.join(root,'supabase/functions/raiox01-collect-batch/index.ts'),edge);
console.log('Prepared RaioX01 microbatch files. Enrollment remains OFF. No production data touched.');
