'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..', '..');
const RUN = path.resolve(ROOT, 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018');
const MATRIX_PATH = path.join(ROOT, 'gra/data/civ-matrix.json');
const RECEIPT_PATH = path.join(ROOT, 'dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOURCE-APPROVAL-20261018/source-approval-receipt.json');
const OLD_LEDGER_PATH = path.join(ROOT, 'dyspozycje/autobot/runs/R-PR141-CODEX-EVIDENCE-LEDGER-20261017/evidence/matrix-93x15-evidence-ledger.json');
const CONSUMER_SOURCE_PATHS = [
  'gra/src/game/civ-matrix.ts',
  'gra/src/game/civ-bonuses.ts',
  'gra/src/game/combat.ts',
  'gra/src/battle/battleScene.ts',
  'gra/src/ui/preBattle.ts',
  'gra/src/game/diplomacy-layers.ts',
  'gra/src/game/cluster-start.ts',
  'gra/src/game/civ-ai-data.ts',
  'gra/src/game/diplomacy.ts',
  'gra/src/game/ai-expansion.ts',
  'gra/src/game/ai-production-priorities.ts',
  'gra/src/game/ai.ts',
  'gra/src/game/population-growth-v85.ts',
  'gra/src/game/manpower.ts',
  'gra/src/game/economy.ts',
  'gra/src/game/turn-economy.ts',
  'gra/src/game/society-breakdown.ts',
  'gra/src/game/order.ts',
  'gra/src/game/wealth.ts',
  'gra/src/game/culture-religion.ts',
  'gra/src/game/trade-routes.ts',
  'gra/src/game/production.ts',
  'gra/src/main.ts',
  'gra/src/ui/cityPanel.ts',
  'gra/src/ui/entityCards/buildingAdapter.ts',
];
const SOURCE_PATHS = [
  'gra/data/civ-matrix.json',
  'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/00-dispatch.md',
  'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-RECON-20261018/06-classifier-ledger-sync-dispatch-r4.md',
  'gra/src/game/civ-matrix-semantic.ts',
  'gra/tools/civ-matrix-semantic-labels-test.cjs',
  'gra/tools/pr141-current-evidence-ledger-generate.cjs',
  'gra/tools/pr141-current-evidence-ledger-test.cjs',
  'dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOURCE-APPROVAL-20261018/source-approval-receipt.json',
  'dyspozycje/autobot/runs/R-PR141-CODEX-G1-ACTIVATION-20261018/11-integration.md',
  'dyspozycje/autobot/runs/R-PR141-CODEX-DIP-ACTIVATION-20261018/08-integration.md',
  'dyspozycje/autobot/runs/R-PR141-CODEX-F04-WORK-ACTIVATION-20261018/06-integration.md',
  'dyspozycje/autobot/runs/R-PR141-CODEX-F04-COST-ACTIVATION-20261018/06-integration.md',
  'dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/06-integration.md',
  'dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-REMAINING-20261018/14-integration.md',
  'dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/08-integration.md',
  'dyspozycje/autobot/runs/R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018/07-integration-building-speed.md',
  'dyspozycje/autobot/runs/R-PR141-CODEX-EVIDENCE-LEDGER-20261017/evidence/matrix-93x15-evidence-ledger.json',
  'dyspozycje/autobot/runs/R-PR141-CODEX-G1-ACTIVATION-20261018/10-final-control-runda3.md',
  'gra/tools/pr141-g1-combat-activation-test.cjs',
  'dyspozycje/autobot/runs/R-PR141-CODEX-DIP-ACTIVATION-20261018/07-final-control.md',
  'gra/tools/pr141-dip-activation-test.cjs',
  'dyspozycje/autobot/runs/R-PR141-CODEX-F04-WORK-ACTIVATION-20261018/05-final-control.md',
  'gra/tools/pr141-f04-work-activation-test.cjs',
  'dyspozycje/autobot/runs/R-PR141-CODEX-F04-COST-ACTIVATION-20261018/05-final-control.md',
  'gra/tools/pr141-f04-cost-activation-test.cjs',
  'dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/05-final-control.md',
  'gra/tools/pr141-f04-society-activation-test.cjs',
  'dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-REMAINING-20261018/13-final-control.md',
  'gra/tools/pr141-f04-society-remaining-activation-test.cjs',
  'dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/07-final-control.md',
  'gra/tools/pr141-f04-yields-activation-test.cjs',
  'dyspozycje/autobot/runs/R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018/06-final-control-building-speed.md',
  'gra/tools/pr141-f04-building-speed-activation-test.cjs',
  ...CONSUMER_SOURCE_PATHS,
];
const ACCEPTED = {
  walka_atak_piechota:'G1', walka_obrona_piechota:'G1', walka_pancerz_piechota:'G1', walka_dystans_lukownicy:'G1', walka_hp_piechota:'G1', walka_hp_rydwany:'G1',
  dip_nastawienie_bazowe:'DIP', dip_agresja_archetyp:'DIP', eko_praca_proc:'WORK', prod_koszt_budynku_proc:'COST', prod_koszt_jednostki_proc:'COST',
  wealth_cap_proc:'SOCIETY', kultura_naplyw_proc:'SOCIETY', porzadek_produkcja_proc:'SOCIETY', porzadek_nauka_proc:'SOCIETY', porzadek_kultura_proc:'SOCIETY', porzadek_wzrost_proc:'SOCIETY',
  wealth_mnoznik_proc:'SOCIETY_REMAINING', religia_spread_proc:'SOCIETY_REMAINING', porzadek_pieniadz_proc:'SOCIETY_REMAINING',
  eko_handel_brutto_proc:'YIELDS', eko_pieniadz_proc:'YIELDS', eko_pieniadz_port_proc:'YIELDS', eko_zywnosc_proc:'YIELDS', eko_nauka_proc:'YIELDS', eko_kultura_proc:'YIELDS', eko_luksus_proc:'YIELDS', eko_zadowolenie_proc:'YIELDS', eko_korupcja_proc:'YIELDS',
  prod_szybkosc_budynku_proc:'BUILDING_SPEED',
};
const INTEGRATIONS = {
 G1:['R-PR141-CODEX-G1-ACTIVATION-20261018/11-integration.md','R-PR141-CODEX-G1-ACTIVATION-20261018/10-final-control-runda3.md','gra/tools/pr141-g1-combat-activation-test.cjs'],
 DIP:['R-PR141-CODEX-DIP-ACTIVATION-20261018/08-integration.md','R-PR141-CODEX-DIP-ACTIVATION-20261018/07-final-control.md','gra/tools/pr141-dip-activation-test.cjs'],
 WORK:['R-PR141-CODEX-F04-WORK-ACTIVATION-20261018/06-integration.md','R-PR141-CODEX-F04-WORK-ACTIVATION-20261018/05-final-control.md','gra/tools/pr141-f04-work-activation-test.cjs'],
 COST:['R-PR141-CODEX-F04-COST-ACTIVATION-20261018/06-integration.md','R-PR141-CODEX-F04-COST-ACTIVATION-20261018/05-final-control.md','gra/tools/pr141-f04-cost-activation-test.cjs'],
 SOCIETY:['R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/06-integration.md','R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/05-final-control.md','gra/tools/pr141-f04-society-activation-test.cjs'],
 SOCIETY_REMAINING:['R-PR141-CODEX-F04-SOCIETY-REMAINING-20261018/14-integration.md','R-PR141-CODEX-F04-SOCIETY-REMAINING-20261018/13-final-control.md','gra/tools/pr141-f04-society-remaining-activation-test.cjs'],
 YIELDS:['R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/08-integration.md','R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/07-final-control.md','gra/tools/pr141-f04-yields-activation-test.cjs'],
 BUILDING_SPEED:['R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018/07-integration-building-speed.md','R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018/06-final-control-building-speed.md','gra/tools/pr141-f04-building-speed-activation-test.cjs'],
};
function sha(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function verifyManifest(manifest, contentOverrides={}){
 const expected=[...SOURCE_PATHS].sort();const actual=Object.keys(manifest?.files||{}).sort();
 if(JSON.stringify(expected)!==JSON.stringify(actual))throw Error('manifest path closure mismatch');
 for(const rel of SOURCE_PATHS){
  if(!fs.existsSync(path.join(ROOT,rel)))throw Error(`missing manifest source: ${rel}`);
  const bytes=Object.prototype.hasOwnProperty.call(contentOverrides,rel)?Buffer.from(contentOverrides[rel]):fs.readFileSync(path.join(ROOT,rel));
  const hash=crypto.createHash('sha256').update(bytes).digest('hex');
  if(manifest.files[rel]!==hash)throw Error(`manifest source hash mismatch: ${rel}`);
 }
 return true;
}
function semantic(){
 const entry=path.join(RUN,'semantic-entry.ts'), out=path.join(RUN,'semantic-bundle.cjs');
 fs.writeFileSync(entry,`export {buildCivMatrixSemanticSnapshot} from ${JSON.stringify(path.resolve(ROOT,'gra/src/game/civ-matrix-semantic'))};`);
 esbuild.buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',outfile:out,absWorkingDir:path.resolve(ROOT,'gra'),logLevel:'silent'});
 const x=require(out); const value=x.buildCivMatrixSemanticSnapshot(); fs.rmSync(entry,{force:true});fs.rmSync(out,{force:true});return value;
}
function validateInputs(){
 const receipt=JSON.parse(fs.readFileSync(RECEIPT_PATH,'utf8'));
 if(receipt.source.sha256!=='c285c410012d0fca67acf40200f03ace4cf98bd538fde40c3ea3799c79a62f32'||receipt.cells.length!==360) throw Error('canonical source receipt identity/count mismatch');
 for(const [id,group] of Object.entries(ACCEPTED)){
  if(!INTEGRATIONS[group]) throw Error(`no accepted integration mapping for ${id}`);
  for(const rel of INTEGRATIONS[group].slice(0,2)) if(!fs.existsSync(path.join(ROOT,'dyspozycje/autobot/runs',rel))) throw Error(`missing accepted integration/control: ${rel}`);
 }
 return receipt;
}
function build(){
 const receipt=validateInputs(), matrix=JSON.parse(fs.readFileSync(MATRIX_PATH,'utf8'));
 const old=JSON.parse(fs.readFileSync(OLD_LEDGER_PATH,'utf8'));
 const snapshot=semantic();
 const oldCells=new Map(old.cells.map(c=>[`${c.parameter_id}/${c.civilization_id}`,c]));
 const receiptCells=new Map(receipt.cells.map(c=>[`${c.parameter_id}/${c.civilization_key}`,c]));
 const f04Ids=new Set(receipt.scope.parameter_ids);
 const cells=snapshot.cells.map(sc=>{
  const key=`${sc.parameterId}/${sc.civilizationId}`, prior=oldCells.get(key);
  const cell=prior?structuredClone(prior):{parameter_id:sc.parameterId,civilization_id:sc.civilizationId,civilization_name:sc.civilizationName,raw_value:sc.rawValue,raw_source:'gra/data/civ-matrix.json',raw_approval:{status:'NOT_ASSESSED_BY_F04_SOURCE_AUDIT',ownerApprovedValue:null,ownerApprovalSource:null,evidence:'Current matrix value; no F-04 source receipt covers this parameter.'},semantic:{},consumer:{},behavior_receipt:{status:'NO_CELL_LEVEL_BEHAVIOR_RECEIPT_RECORDED',topicId:null,detail:'ID-level bounded receipts are linked separately; this cell has no cell-level behavior PASS.'},owner_ai:{status:'NOT_VERIFIED_PER_CELL_FOR_OWNER_AND_AI',evidence:'No cell-wide owner/player/AI parity claim.'},difficulty:{status:'NORMAL_SEMANTIC_SNAPSHOT_ONLY; RUNTIME_DIFFICULTY_NOT_VERIFIED',evidence:'Normal semantic snapshot only.'},save_load:{status:'NOT_VERIFIED',evidence:null},browser:{status:'NOT_VERIFIED',evidence:null}};
  cell.parameter_id=sc.parameterId;cell.civilization_id=sc.civilizationId;cell.civilization_name=sc.civilizationName;cell.raw_value=sc.rawValue;cell.raw_source=sc.source;
  cell.raw_provenance=prior?.raw_approval??null;
  cell.effective_raw_approval=null;
  if(f04Ids.has(sc.parameterId)){
   const r=receiptCells.get(key); if(!r||r.reconciliation!=='MATCH'||r.current_raw_value!==sc.rawValue||r.approved_source_raw_value!==sc.rawValue) throw Error(`receipt missing/exact-value mismatch: ${key}`);
   cell.effective_raw_approval={status:'APPROVED_MATCH',approved_value:r.approved_source_raw_value,owner_approval_ref:r.owner_approval_ref,approval_effective_date:r.approval_effective_date,source_sha256:receipt.source.sha256,source_coordinate:r.source_coordinate};
  }
  cell.semantic={label:sc.label,status:sc.consumerStatus,snapshot_difficulty:'normal',note:'Semantic label is descriptive relative to its snapshot; it is not gameplay acceptance.'};
  const group=ACCEPTED[sc.parameterId];
  cell.consumer={...(cell.consumer||{}),current_status:sc.consumerStatus,runtime_acceptance:'NOT_VERIFIED',note:'Classifier status and bounded references do not establish full runtime or product acceptance.'};
  if(group){
   const [integration,fc,test]=INTEGRATIONS[group];
   cell.consumer.current_reference_files=[`dyspozycje/autobot/runs/${integration}`,`dyspozycje/autobot/runs/${fc}`,test];
   cell.consumer.current_reference_count=cell.consumer.current_reference_files.length;
   cell.consumer.bounded_behavior_receipt_id=sc.parameterId;
  }
  cell.behavior_receipt={status:'NO_CELL_LEVEL_BEHAVIOR_RECEIPT_RECORDED',topicId:null,detail:'Bounded evidence is ID-level only; no 15-cell behavior PASS replication.'};
  return cell;
 });
 const seen=new Set(cells.map(c=>`${c.parameter_id}/${c.civilization_id}`));
 if(cells.length!==matrix.cywilizacje.length*Object.keys(matrix.paramDefs).length||seen.size!==cells.length) throw Error('matrix/semantic inventory mismatch');
 const priorReal=new Set(old.cells.filter(c=>c.consumer.current_status==='REAL_GAMEPLAY').map(c=>c.parameter_id));
 const currentReal=new Set(snapshot.cells.filter(c=>c.consumerStatus==='REAL_GAMEPLAY').map(c=>c.parameterId));
 for(const id of priorReal) if(!currentReal.has(id)) throw Error(`baseline REAL_GAMEPLAY removed: ${id}`);
 for(const id of Object.keys(ACCEPTED)) if(!currentReal.has(id)) throw Error(`candidate not classified REAL_GAMEPLAY: ${id}`);
 if(currentReal.size!==priorReal.size+Object.keys(ACCEPTED).filter(id=>!priorReal.has(id)).length) throw Error('unexpected REAL_GAMEPLAY promotion');
 const bounded=Object.entries(ACCEPTED).map(([id,group])=>{
  const [integration,fc,test]=INTEGRATIONS[group];
  const sourceOnly=['religia_spread_proc','porzadek_pieniadz_proc'].includes(id);
  const dipBounded=['dip_nastawienie_bazowe','dip_agresja_archetyp'].includes(id);
  const wealthAst=id==='wealth_mnoznik_proc';
  return {parameter_id:id,classification:'REAL_GAMEPLAY',integration:`dyspozycje/autobot/runs/${integration}`,final_control:`dyspozycje/autobot/runs/${fc}`,focused_test:test,evidence_ceiling:dipBounded?'bounded pair-initialization scope; direct generateMap boundary was skipped and no full-world runtime is claimed':wealthAst?'bounded actual Wealth caller AST statements; not full-world runtime':sourceOnly?'source-inspected main owner route plus bounded helper/component test; main-loop numeric routing not executed':'accepted bounded activation record; not full runtime/browser/product acceptance',behavioral_owner_ai:'bounded scenarios only; no per-cell or all-civ parity claim',runtime:'NOT_VERIFIED',browser:'NOT_VERIFIED',save_load:'NOT_VERIFIED',difficulty:'NOT_VERIFIED'};
 });
 const statusCounts={};for(const c of cells)statusCounts[c.consumer.current_status]=(statusCounts[c.consumer.current_status]||0)+1;
 return {schema_version:2,generated_at:new Date().toISOString(),topic_id:'R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018',round:'1/5 execution deliverable; continuation of immutable recon round 4/5',scope:'Current evidence synchronization only; no product-wide or full runtime acceptance.',counts:{parameter_ids:Object.keys(matrix.paramDefs).length,civilizations:matrix.cywilizacje.length,raw_cells:cells.length,semantic_cells:snapshot.cells.length,current_consumer_classifications:statusCounts,baseline_real_gameplay_ids:priorReal.size,accepted_new_consumer_ids:Object.keys(ACCEPTED).length,resulting_real_gameplay_ids:currentReal.size,f04_parameter_ids:receipt.scope.parameter_ids.length,f04_cells:receipt.cells.length,effective_raw_approval_cells:cells.filter(c=>c.effective_raw_approval?.status==='APPROVED_MATCH').length},source_manifest:'source-manifest.json',history:{prior_ledger:'dyspozycje/autobot/runs/R-PR141-CODEX-EVIDENCE-LEDGER-20261017/evidence/matrix-93x15-evidence-ledger.json',prior_manifest_preserved:true,prior_source_hashes_preserved:true,prior_structural_only_claim_preserved:true},bounded_behavior_receipts:bounded,acceptance_ceiling:{runtime:'NOT_VERIFIED',browser:'NOT_VERIFIED',save_load:'NOT_VERIFIED',difficulty:'NOT_VERIFIED',owner_ai:'NOT_VERIFIED_PER_CELL',product_93x15:'NOT_VERIFIED'},cells};
}
function write(){
 const manifest={schema_version:1,topic_id:'R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018',generated_after_source_freeze:true,files:Object.fromEntries(SOURCE_PATHS.map(rel=>[rel,sha(path.join(ROOT,rel))]))};
 fs.writeFileSync(path.join(RUN,'evidence/source-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const ledger=build();fs.writeFileSync(path.join(RUN,'evidence/matrix-93x15-current-evidence-ledger-v2.json'),JSON.stringify(ledger,null,2)+'\n');
 return {manifest,ledger};
}
if(require.main===module){const out=write();console.log(JSON.stringify({counts:out.ledger.counts,manifestFiles:Object.keys(out.manifest.files).length},null,2));}
module.exports={ACCEPTED,INTEGRATIONS,CONSUMER_SOURCE_PATHS,SOURCE_PATHS,validateInputs,verifyManifest,build,write};
