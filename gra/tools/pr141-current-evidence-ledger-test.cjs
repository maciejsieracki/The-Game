'use strict';
const fs=require('fs');const path=require('path');const crypto=require('crypto');
const G=require('./pr141-current-evidence-ledger-generate.cjs');
const ROOT=path.resolve(__dirname,'..','..');
const RUN=path.join(ROOT,'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018');
const receipt=JSON.parse(fs.readFileSync(path.join(ROOT,'dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOURCE-APPROVAL-20261018/source-approval-receipt.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(RUN,'evidence/source-manifest.json'),'utf8'));
const ledger=JSON.parse(fs.readFileSync(path.join(RUN,'evidence/matrix-93x15-current-evidence-ledger-v2.json'),'utf8'));
function assert(ok,msg){if(!ok)throw Error(msg);}
function validate(x){
 assert(x.schema_version===2,'wrong schema');
 const keys=new Set(x.cells.map(c=>`${c.parameter_id}/${c.civilization_id}`));
 assert(keys.size===x.cells.length,'duplicate cell');
 assert(x.cells.length===x.counts.parameter_ids*x.counts.civilizations,'cell count mismatch');
 const currentMatrix=JSON.parse(fs.readFileSync(path.join(ROOT,'gra/data/civ-matrix.json'),'utf8'));
 const expected=new Set(Object.keys(currentMatrix.paramDefs).flatMap(id=>currentMatrix.cywilizacje.map(c=>`${id}/${c.ikonaId}`)));
 assert(keys.size===expected.size&&[...expected].every(k=>keys.has(k)),'matrix inventory mismatch');
 const byCell=new Map(x.cells.map(c=>[`${c.parameter_id}/${c.civilization_id}`,c]));
 for(const row of currentMatrix.cywilizacje) for(const id of Object.keys(currentMatrix.paramDefs)) {
  const c=byCell.get(`${id}/${row.ikonaId}`);
  assert(c.raw_value===row.params[id],`raw value differs from matrix ${id}/${row.ikonaId}`);
 }
 const computed={};for(const c of x.cells)computed[c.consumer.current_status]=(computed[c.consumer.current_status]||0)+1;
 assert(JSON.stringify(computed)===JSON.stringify(x.counts.current_consumer_classifications),'consumer status counts mismatch');
 assert(x.counts.parameter_ids===Object.keys(currentMatrix.paramDefs).length&&x.counts.civilizations===currentMatrix.cywilizacje.length,'declared matrix dimensions mismatch');
 const approval=new Map(receipt.cells.map(c=>[`${c.parameter_id}/${c.civilization_key}`,c]));
 const approved=x.cells.filter(c=>c.effective_raw_approval?.status==='APPROVED_MATCH');
 assert(approved.length===360,'approved cell count is not exact 360');
 for(const c of x.cells){
  const pair=`${c.parameter_id}/${c.civilization_id}`, r=approval.get(pair);
  if(r){assert(c.effective_raw_approval?.status==='APPROVED_MATCH','receipt cell missing approval');assert(c.effective_raw_approval.approved_value===r.approved_source_raw_value&&c.raw_value===r.current_raw_value,'approval/value mismatch');assert(c.effective_raw_approval.owner_approval_ref===r.owner_approval_ref,'owner reference mismatch');assert(c.effective_raw_approval.source_sha256===receipt.source.sha256,'source identity mismatch');}
  else assert(c.effective_raw_approval===null,'approval outside exact receipt scope');
  assert(c.semantic.status===c.consumer.current_status,'semantic/consumer mismatch');
  assert(c.consumer.runtime_acceptance==='NOT_VERIFIED','unsupported runtime promotion');
  assert(c.behavior_receipt.status==='NO_CELL_LEVEL_BEHAVIOR_RECEIPT_RECORDED','cell behavior claims must remain non-PASS');
  assert(c.save_load.status==='NOT_VERIFIED'&&c.browser.status==='NOT_VERIFIED'&&/NOT_VERIFIED/.test(c.difficulty.status)&&/NOT_VERIFIED/.test(c.owner_ai.status),'unsupported acceptance dimension');
 }
 const old=JSON.parse(fs.readFileSync(path.join(ROOT,'dyspozycje/autobot/runs/R-PR141-CODEX-EVIDENCE-LEDGER-20261017/evidence/matrix-93x15-evidence-ledger.json'),'utf8'));
 const oldReal=new Set(old.cells.filter(c=>c.consumer.current_status==='REAL_GAMEPLAY').map(c=>c.parameter_id));
 const newReal=new Set(x.cells.filter(c=>c.consumer.current_status==='REAL_GAMEPLAY').map(c=>c.parameter_id));
 for(const id of oldReal)assert(newReal.has(id),`baseline removed ${id}`);
 for(const c of x.cells) if(!G.ACCEPTED[c.parameter_id]) {
  const prior=old.cells.find(o=>o.parameter_id===c.parameter_id&&o.civilization_id===c.civilization_id);
  assert(JSON.stringify(c.raw_provenance)===JSON.stringify(prior.raw_approval),`raw provenance changed for ${c.parameter_id}/${c.civilization_id}`);
  assert(JSON.stringify(c.consumer.current_reference_files)===JSON.stringify(prior.consumer.current_reference_files),`baseline consumer provenance changed for ${c.parameter_id}/${c.civilization_id}`);
 }
 for(const id of Object.keys(G.ACCEPTED))assert(newReal.has(id),`candidate missing ${id}`);
 assert(newReal.size===oldReal.size+Object.keys(G.ACCEPTED).filter(id=>!oldReal.has(id)).length,'unexpected promoted ID/count');
 for(const id of ['prod_szybkosc_jednostki_proc','prod_rush_koszt_proc']){
  assert(!newReal.has(id),'unwired production ID promoted');
  assert(x.cells.filter(c=>c.parameter_id===id).every(c=>c.consumer.current_status==='UNWIRED'&&c.effective_raw_approval?.status==='APPROVED_MATCH'),'raw-approved but consumer-unwired distinction lost');
 }
 const receipts=x.bounded_behavior_receipts;
 assert(receipts.length===Object.keys(G.ACCEPTED).length,'bounded receipt ID count mismatch');
 const receiptIds=new Set(receipts.map(r=>r.parameter_id));assert(receiptIds.size===receipts.length,'duplicate bounded receipt');
 for(const r of receipts){
  const group=G.ACCEPTED[r.parameter_id],expectedRefs=G.INTEGRATIONS[group];
  assert(group&&r.integration&&r.final_control&&r.focused_test,'missing receipt references');
  assert(r.integration.endsWith(expectedRefs[0])&&r.final_control.endsWith(expectedRefs[1])&&r.focused_test===expectedRefs[2],`wrong integration/FC/test reference for ${r.parameter_id}`);
  assert(fs.existsSync(path.join(ROOT,r.integration))&&fs.existsSync(path.join(ROOT,r.final_control))&&fs.existsSync(path.join(ROOT,r.focused_test)),`missing evidence source for ${r.parameter_id}`);
  assert(r.runtime==='NOT_VERIFIED'&&r.browser==='NOT_VERIFIED'&&r.save_load==='NOT_VERIFIED'&&r.difficulty==='NOT_VERIFIED','unsupported acceptance claim');
  assert(!/15.*PASS|PASS.*15/i.test(JSON.stringify(r)),'cell-level behavioral PASS replicated');
  assert(x.cells.filter(c=>c.parameter_id===r.parameter_id).every(c=>c.semantic.status==='REAL_GAMEPLAY'&&c.consumer.bounded_behavior_receipt_id===r.parameter_id),'candidate cell missing active classification/reference');
 }
 assert(x.counts.baseline_real_gameplay_ids===oldReal.size,'baseline count mismatch');
 assert(x.counts.accepted_new_consumer_ids===Object.keys(G.ACCEPTED).length,'candidate count mismatch');
 assert(x.counts.resulting_real_gameplay_ids===newReal.size,'resulting count mismatch');
 assert(x.counts.effective_raw_approval_cells===360,'approval count field mismatch');
 assert(x.acceptance_ceiling.product_93x15==='NOT_VERIFIED','unsupported product-wide claim');
 return true;
}
function expectReject(mutator,label){const clone=structuredClone(ledger);mutator(clone);let rejected=false;try{validate(clone)}catch{rejected=true}assert(rejected,`negative control accepted: ${label}`);}
validate(ledger);
const fileManifest=manifest.files;assert(fileManifest&&Object.keys(fileManifest).length===G.SOURCE_PATHS.length,'manifest source count mismatch');
G.verifyManifest(manifest);
function expectManifestReject(mutator,overrides,label){const clone=structuredClone(manifest);mutator(clone);let rejected=false;try{G.verifyManifest(clone,overrides)}catch{rejected=true}assert(rejected,`manifest negative control accepted: ${label}`);}
expectManifestReject(x=>{delete x.files['gra/src/game/production.ts'];},undefined,'missing accepted consumer source');
expectManifestReject(()=>{}, {'gra/src/main.ts':Buffer.from(fs.readFileSync(path.join(ROOT,'gra/src/main.ts'),'utf8')+'\n// in-memory mutation control')},'changed consumer source hash');
expectReject(x=>x.cells[0].effective_raw_approval={status:'APPROVED_MATCH',approved_value:99},'fabricated approval');
expectReject(x=>x.cells.pop(),'missing matrix cell');
expectReject(x=>x.cells.push(structuredClone(x.cells[0])),'duplicate matrix cell');
expectReject(x=>x.cells.find(c=>c.parameter_id==='eko_handel_brutto_proc').effective_raw_approval.owner_approval_ref='fabricated','altered owner ref');
expectReject(x=>x.cells.find(c=>c.parameter_id==='eko_handel_brutto_proc').effective_raw_approval.source_sha256='fabricated','altered source identity');
expectReject(x=>x.bounded_behavior_receipts.pop(),'missing candidate evidence');
expectReject(x=>x.bounded_behavior_receipts.push(structuredClone(x.bounded_behavior_receipts[0])),'duplicate candidate evidence');
expectReject(x=>x.bounded_behavior_receipts[0].parameter_id='out_of_scope','out-of-scope candidate');
expectReject(x=>x.cells.find(c=>c.parameter_id==='prod_szybkosc_jednostki_proc').semantic.status='REAL_GAMEPLAY','unwired production promotion');
expectReject(x=>x.acceptance_ceiling.product_93x15='PASS','unsupported full-product promotion');
expectReject(x=>x.counts.resulting_real_gameplay_ids++,'incorrect resulting status count');
expectReject(x=>x.cells.find(c=>c.parameter_id==='wealth_cap_proc').raw_value++,'altered raw value');
expectReject(x=>x.cells.find(c=>c.parameter_id==='lud_wzrost_proc').consumer.current_status='UNWIRED','removed baseline gameplay ID');
expectReject(x=>x.bounded_behavior_receipts[0].integration='fabricated-integration.md','wrong integration reference');
expectReject(x=>x.bounded_behavior_receipts[0].behavioral_owner_ai='15 civilization PASS','unproven behavior receipt');
expectReject(x=>x.cells[0].effective_raw_approval={status:'APPROVED_MATCH',approved_value:x.cells[0].raw_value},'out-of-scope approval');
expectReject(x=>x.cells.find(c=>c.parameter_id==='eko_handel_brutto_proc').civilization_id='wrong-civ','wrong-civ cell identity');
console.log(`PASS current evidence ledger: ${ledger.counts.raw_cells} cells; ${ledger.counts.effective_raw_approval_cells} exact approvals; ${ledger.bounded_behavior_receipts.length} bounded ID receipts; 17 ledger and 2 manifest negative controls rejected.`);
