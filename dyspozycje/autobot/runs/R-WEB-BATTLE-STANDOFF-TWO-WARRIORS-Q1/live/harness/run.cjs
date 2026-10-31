// Realny przebieg: ?playtest=walka -> klik unit -> klik foe -> preBattle -> BITWA/deploy -> START WALKI -> tryb.
// argv: file out opts(JSON): {post:'none'|'R'|'railbtn'|'space', secs:60, preAct:'deploy'|'auto', label}
const {hexToPixel,wait,launch,path,fs}=require('./lib.cjs');
const file=process.argv[2], out=process.argv[3], opts=JSON.parse(process.argv[4]||'{}');
const post=opts.post||'none', secs=opts.secs||60, preAct=opts.preAct||'deploy';
const dump=()=>{
  const s=window.__bs; if(!s) return {noScene:true};
  const un=u=>{let gm=null;try{gm=s._ensureGroupMeta(u.groupId)}catch(e){}
    return {id:u.bu&&u.bu.id,name:u.bu&&u.bu.nazwa,side:u.side,q:u.q,r:u.r,hp:u.bu&&u.bu.hp,dead:!!u.dead,routed:!!u.routed,acted:!!u.acted,ml:u.moveLeft,order:u.playerOrder&&u.playerOrder.type,grp:u.groupId,doc:gm&&gm.doctrine,auto:gm&&gm.autoPlay,ranged:!!u.ranged,range:u.range,morale:u.morale}};
  return {t:Date.now(),manual:s._manualMode,awaiting:s._battleAwaitingOrders,started:s.started,fin:s.finished,round:s.roundNo,active:s.activeSide,busy:s.busy,susp:s._autoBattleSuspended,deploy:s.deployPhase,gate:s._manualCommanderGate,
    queued:Array.from(s._queuedOrderUnitIds||[]),atk:s.atk.map(un),def:s.def.map(un)};
};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const b=await launch(); const page=await b.newPage({viewport:{width:1440,height:900}});
 const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
 await page.goto('file://'+path.resolve(file)+'?playtest=walka',{waitUntil:'load',timeout:180000});
 await page.waitForFunction(()=>!!window.__cityStateStartUnitsTestDebug&&!!window.__sidePanelLinkTestDebug,undefined,{timeout:180000});
 await page.waitForFunction(()=>{try{const s=window.__cityStateStartUnitsTestDebug.dumpState();return s.units.some(u=>u.ownerId===0)&&s.units.some(u=>u.ownerId===1)}catch{return false}},undefined,{timeout:180000});
 await wait(2500);
 const st=await page.evaluate(()=>({units:window.__cityStateStartUnitsTestDebug.dumpState().units,cam:window.__sidePanelLinkTestDebug.cameraTarget(),W:innerWidth,H:innerHeight}));
 const atk=st.units.find(u=>u.ownerId===0), foe=st.units.find(u=>u.ownerId===1);
 const pA=hexToPixel(atk.q,atk.r,st.cam,st.W,st.H), pD=hexToPixel(foe.q,foe.r,st.cam,st.W,st.H);
 await page.mouse.click(Math.round(pA.x),Math.round(pA.y)-45); await wait(1500);
 await page.mouse.click(Math.round(pD.x),Math.round(pD.y)-20); await wait(2200);
 const hasPre=await page.evaluate(()=>Array.from(document.querySelectorAll('[data-act]')).map(e=>e.getAttribute('data-act')));
 console.log('preBattle data-act:',JSON.stringify(hasPre));
 await page.screenshot({path:path.join(out,'01-pre.png')});
 await page.click('[data-act="'+preAct+'"]'); await wait(4000);
 await page.screenshot({path:path.join(out,'02-after-pre.png')});
 const started=await page.evaluate(()=>{const b=Array.from(document.querySelectorAll('button,div,span')).filter(e=>e.offsetParent!==null&&/^start walki$/i.test((e.textContent||'').trim()));const t=b[b.length-1];if(t){t.click();return true}return false});
 console.log('START WALKI clicked:',started); await wait(2500);
 await page.screenshot({path:path.join(out,'03-started.png')});
 const log=[]; const snap=async(tag)=>{const d=await page.evaluate(dump); d.tag=tag; log.push(d); return d};
 const d0=await snap('start'); console.log('START',JSON.stringify({manual:d0.manual,awaiting:d0.awaiting,gate:d0.gate,round:d0.round,active:d0.active,atk:d0.atk,def:d0.def}));
 if(post==='R'){ await page.keyboard.press('r'); console.log('pressed R'); }
 else if(post==='railbtn'){ const ok=await page.evaluate(()=>{const e=Array.from(document.querySelectorAll('[title]')).find(x=>/AUTO-rozegranie/.test(x.getAttribute('title')));if(e){e.click();return e.getAttribute('title')}return null}); console.log('rail AUTO btn',ok); }
 else if(post==='space'){ await page.keyboard.press('Space'); console.log('pressed Space'); }
 await wait(800);
 const t0=Date.now(); let i=0;
 while(Date.now()-t0<secs*1000){ const d=await snap('t'+(i++)); await wait(opts.step||1500); if(d.fin) break; }
 await page.screenshot({path:path.join(out,'04-end.png')});
 fs.writeFileSync(path.join(out,'log.json'),JSON.stringify(log));
 // summary
 const first=log[1]||log[0], last=log[log.length-1];
 const hpOf=d=>[...d.atk,...d.def].map(u=>u.id+':'+u.hp+(u.dead?'x':'')+'@'+u.q+','+u.r+'/'+u.order+'/'+u.doc).join(' | ');
 console.log('FIRST',hpOf(first)); console.log('LAST ',hpOf(last));
 console.log('flags last',JSON.stringify({manual:last.manual,awaiting:last.awaiting,fin:last.fin,round:last.round,active:last.active,busy:last.busy,susp:last.susp,queued:last.queued}));
 console.log('CALLS',JSON.stringify(await page.evaluate(()=>window.__calls||null)));
 console.log('samples',log.length,'errs',errs.slice(0,3));
 await b.close();
})().catch(e=>{console.error('ERR',e);process.exit(1)});
