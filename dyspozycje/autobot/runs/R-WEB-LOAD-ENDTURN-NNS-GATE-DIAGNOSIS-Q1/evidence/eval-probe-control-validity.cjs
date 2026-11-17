const GRA='/home/user/The-Game/.claude/worktrees/wf_4b0e8871-fcc-2/gra';
const {chromium}=require(GRA+'/node_modules/playwright');
const S=process.argv[2];
const URL='file://'+S+'/build2/index.html?playtest=mapa&civTest=1';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function go(page){
  await page.goto(URL,{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>!!window.__aiTradeWiringTestDebug&&!!window.__defeatTestDebug&&!!window.__truceSaveLoadTestDebug&&window.__eraTestDebug.getWorldState().citiesLen>0&&window.__eraTestDebug.getWorldState().turn===1,undefined,{timeout:600000});
  await page.evaluate(()=>window.__defeatTestDebug.setPlayerEraForTest(1)); await wait(300);
}
const snap=p=>p.evaluate(()=>{const i=window.__aiTradeWiringTestDebug.info();window.__aiTradeWiringTestDebug.nnsDiag();const d=window.__aiTradeWiringTestDebug.nnsDiag();return {turn:i.turn,myCities:i.myCities,gate:d.gate,forecast:d.forecast,sp:d.spichlerz,treasury:d.treasury}});
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const out={};
 const ctx=await b.newContext({viewport:{width:1400,height:900}});const p=await ctx.newPage();
 await go(p); out.fresh=await snap(p);
 out.save=await p.evaluate(()=>window.__truceSaveLoadTestDebug.quickSave('probeslot'));
 out.afterSaveSnap=await snap(p);
 const p2=await ctx.newPage(); await go(p2);
 out.p2fresh=await snap(p2);
 await p2.evaluate(()=>window.__truceSaveLoadTestDebug.loadSlot('probeslot')); await wait(4000);
 out.p2afterLoad=await snap(p2);
 const ctx3=await b.newContext({viewport:{width:1400,height:900}});const p3=await ctx3.newPage(); await go(p3);
 const r=await p3.evaluate(async()=>{try{await window.__truceSaveLoadTestDebug.loadSlot('probeslot');return 'resolved'}catch(e){return 'throw '+e.message}});
 await wait(3000); out.p3ctrlLoad=r; out.p3after=await snap(p3);
 console.log(JSON.stringify(out,null,1)); await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
