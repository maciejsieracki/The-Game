#!/usr/bin/env python3
# gen-dashboard.py -- generuje JEDEN read-only HTML z podgladem wszystkich data/*.json.
# Single-file (file:// dwuklik): dane JSON sa INLINE'owane (file:// nie fetchuje lokalnych plikow).
# Edycja parametrow dzieje sie w Excelach (kazdy panel ma wlasciciela) -- to tylko podglad.
# Uruchom:  python3 gra/tools/gen-dashboard.py
import json, os, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.normpath(os.path.join(HERE, "..", "data"))
CIV_ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(CIV_ROOT, "MIASTO", "Panel-przeglad-danych.html")

# filename -> (label, owner, source xlsx, mine?)
META = {
    "buildings.json":        ("Budynki",            "Civ-MIASTO",      "Budynki.xlsx",            True),
    "society-params.json":   ("Spoleczenstwo",      "Civ-MIASTO",      "Spoleczenstwo-parametry.xlsx", True),
    "miasto-params.json":    ("Miasto-parametry",   "Civ-MIASTO",      "miasto-params.json",      True),
    "terrain-improvements.json": ("Ulepszenia-terenu","Civ-MIASTO",  "terrain-improvements.json", True),
    "econ-params.json":      ("Ekonomia",           "Civ-EKONOMIA",    "Ekonomia-parametry.xlsx", False),
    "resources.json":        ("Surowce",            "Civ-EKONOMIA",    "Surowce.xlsx",            False),
    "terrain-yields.json":   ("Teren - plony",      "Civ-EKONOMIA",    "Plony-terenow.xlsx",      False),
    "terrain-movement.json": ("Teren - ruch",       "Civ-MAPA",        "Plony-terenow.xlsx",      False),
    "terrain-combat.json":   ("Teren - walka",      "Civ-MAPA",        "Plony-terenow.xlsx",      False),
    "units.json":            ("Jednostki",          "Civ-UNITS",       "Jednostki.xlsx",          False),
    "counters.json":         ("Countery walki",     "Civ-UNITS",       "Macierz-walki.xlsx",      False),
    "diplomacy.json":        ("Dyplomacja",         "Civ-DYPLOMACJA",  "Dyplomacja.xlsx",         False),
    "ai-params.json":        ("Parametry AI",       "Civ-AI",          "AI-parametry.xlsx",       False),
    "civs.json":             ("Cywilizacje",        "Civ-DANE",        "Cywilizacje.xlsx",        False),
    "tech.json":             ("Technologie",        "Civ-DANE",        "Technologie-drzewko.xlsx",False),
}
# kolejnosc zakladek: moje najpierw, potem reszta
ORDER = ["buildings.json","society-params.json","miasto-params.json","terrain-improvements.json","econ-params.json","resources.json",
         "terrain-yields.json","terrain-movement.json","terrain-combat.json",
         "units.json","counters.json","diplomacy.json","ai-params.json","civs.json","tech.json"]

def flatten_improvements(d):
    out = {}
    for k, v in d.items():
        if k == "_meta" or not isinstance(v, dict): continue
        flat = {}
        for kk, vv in v.items():
            if kk == "bonus" and isinstance(vv, dict):
                for bk, bv in vv.items(): flat["bonus." + bk] = bv
            elif isinstance(vv, (dict, list)): flat[kk] = json.dumps(vv, ensure_ascii=False)
            else: flat[kk] = vv
        out[k] = flat
    return out

data_map, meta_map = {}, {}
for fn in ORDER:
    p = os.path.join(DATA_DIR, fn)
    if not os.path.exists(p):
        continue
    with open(p, encoding="utf-8") as f:
        data_map[fn] = json.load(f)
    label, owner, src, mine = META.get(fn, (fn, "?", "?", False))
    meta_map[fn] = {"label": label, "owner": owner, "src": src, "mine": mine}

if "terrain-improvements.json" in data_map:
    data_map["terrain-improvements.json"] = flatten_improvements(data_map["terrain-improvements.json"])

def inline(obj):
    s = json.dumps(obj, ensure_ascii=False)
    return s.replace("</", "<\\/")  # nie zlam <script>

ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

TEMPLATE = r"""<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Panel przegladu danych - The Game (Civ)</title>
<style>
:root{--bg:#0a0c14;--panel:#11141f;--line:rgba(232,216,138,0.18);--gold:#e8d88a;--dim:rgba(232,216,138,0.55);--mine:#7ad1c0;--ink:#e8e8ea;}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:13px/1.45 -apple-system,Segoe UI,Roboto,sans-serif;}
header{padding:14px 20px;border-bottom:1px solid var(--line);}
header h1{margin:0 0 4px;font-size:18px;color:var(--gold);font-weight:700;letter-spacing:.3px}
header .meta{color:var(--dim);font-size:12px}
header code{color:var(--mine)}
.tabs{display:flex;flex-wrap:wrap;gap:6px;padding:12px 16px;border-bottom:1px solid var(--line);}
.tab{background:rgba(232,216,138,0.08);border:1px solid var(--line);color:var(--gold);padding:5px 11px;border-radius:6px;cursor:pointer;font-size:12px;white-space:nowrap}
.tab:hover{background:rgba(232,216,138,0.16)}
.tab.active{background:var(--gold);color:#1a1500;font-weight:700;border-color:var(--gold)}
.tab.mine{border-color:var(--mine);color:var(--mine)}
.tab.mine.active{background:var(--mine);color:#04201b}
.tab .cnt{opacity:.6;font-size:11px}
main{padding:16px 20px 60px;max-width:1600px}
.head2{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.head2 h2{margin:0;font-size:16px;color:var(--gold)}
.badge{font-size:11px;padding:2px 8px;border-radius:20px;border:1px solid var(--line);color:var(--dim)}
.badge.mine{border-color:var(--mine);color:var(--mine)}
.src{font-size:11px;color:var(--dim)}
.filter{margin-left:auto}
.filter input{background:var(--panel);border:1px solid var(--line);color:var(--ink);padding:5px 9px;border-radius:6px;font-size:12px;min-width:200px}
table.grid{border-collapse:collapse;width:100%;margin:8px 0 16px;font-size:12px}
table.grid th,table.grid td{border:1px solid var(--line);padding:5px 8px;text-align:left;vertical-align:top}
table.grid thead th{background:#161a28;color:var(--gold);font-weight:600}
table.grid tbody tr:nth-child(even){background:rgba(255,255,255,0.02)}
table.grid tbody tr:hover{background:rgba(232,216,138,0.06)}
th.rowkey{color:var(--gold);font-weight:600;white-space:nowrap;background:#121622}
.kv{font-size:11px;color:var(--dim)}
.kv .k{color:var(--gold)}
.nul{color:#555}
section.sub{margin:14px 0;border-left:2px solid var(--line);padding-left:12px}
section.sub h3{margin:0 0 6px;font-size:13px;color:var(--mine)}
.hidden{display:none}
footer{padding:14px 20px;color:var(--dim);font-size:11px;border-top:1px solid var(--line)}
</style>
</head>
<body>
<header>
  <h1>Panel przegladu danych &mdash; The Game (Civ)</h1>
  <div class="meta">Read-only snapshot wszystkich <code>data/*.json</code> &middot; wygenerowano __TS__ &middot; odswiez: <code>python3 gra/tools/gen-dashboard.py</code></div>
</header>
<div class="tabs" id="tabs"></div>
<main id="main"></main>
<footer>Snapshot &mdash; edycja parametrow dzieje sie w plikach Excel (kazdy panel ma wlasciciela). Zakladki w kolorze morskim = lane Civ-MIASTO.</footer>
<script>
const DATA = __DATA__;
const META = __META__;
const files = Object.keys(DATA);
const tabsEl = document.getElementById('tabs');
const mainEl = document.getElementById('main');
let active = files[0];

function esc(s){return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function isObj(v){return v && typeof v==='object' && !Array.isArray(v);}
function meta(f){return META[f]||{label:f,owner:'?',src:'?',mine:false};}

function cell(v){
  if(v===null||v===undefined||v==='') return '<span class="nul">&mdash;</span>';
  if(Array.isArray(v)){
    if(v.length===0) return '<span class="nul">[]</span>';
    if(v.every(x=>!isObj(x)&&!Array.isArray(x))) return esc(v.join(', '));
    return v.map(cell).join('<br>');
  }
  if(isObj(v)){
    return '<div class="kv">'+Object.entries(v).map(([k,val])=>'<span class="k">'+esc(k)+':</span> '+cell(val)).join(' &middot; ')+'</div>';
  }
  return esc(v);
}

function tableFromArray(arr){
  const cols=[],seen=new Set();
  arr.forEach(o=>{if(isObj(o))Object.keys(o).forEach(k=>{if(!seen.has(k)){seen.add(k);cols.push(k);}});});
  let h='<table class="grid"><thead><tr>'+cols.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>';
  arr.forEach(o=>{h+='<tr>'+cols.map(c=>'<td>'+cell(isObj(o)?o[c]:o)+'</td>').join('')+'</tr>';});
  return h+'</tbody></table>';
}

function isUniformMap(o){
  const vals=Object.values(o);
  if(vals.length===0) return false;
  if(!vals.every(isObj)) return false;
  return vals.every(v=>Object.values(v).every(x=>!isObj(x)&&!Array.isArray(x)));
}
function tableFromMap(o){
  const cols=[],seen=new Set();
  Object.values(o).forEach(v=>Object.keys(v).forEach(k=>{if(!seen.has(k)){seen.add(k);cols.push(k);}}));
  let h='<table class="grid"><thead><tr><th>klucz</th>'+cols.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>';
  Object.entries(o).forEach(([rk,rv])=>{h+='<tr><th class="rowkey">'+esc(rk)+'</th>'+cols.map(c=>'<td>'+cell(rv[c])+'</td>').join('')+'</tr>';});
  return h+'</tbody></table>';
}

function render(d){
  if(Array.isArray(d)){
    if(d.length&&d.every(isObj)) return tableFromArray(d);
    return '<ul>'+d.map(x=>'<li>'+cell(x)+'</li>').join('')+'</ul>';
  }
  if(isObj(d)){
    const entries=Object.entries(d);
    if(entries.every(([k,v])=>!isObj(v)&&!Array.isArray(v))){
      return '<table class="grid"><tbody>'+entries.map(([k,v])=>'<tr><th class="rowkey">'+esc(k)+'</th><td>'+cell(v)+'</td></tr>').join('')+'</tbody></table>';
    }
    if(isUniformMap(d)) return tableFromMap(d);
    return entries.map(([k,v])=>'<section class="sub"><h3>'+esc(k)+'</h3>'+render(v)+'</section>').join('');
  }
  return cell(d);
}

function buildTabs(){
  tabsEl.innerHTML='';
  files.forEach(f=>{
    const m=meta(f);
    const n=Array.isArray(DATA[f])?DATA[f].length:Object.keys(DATA[f]||{}).length;
    const b=document.createElement('button');
    b.className='tab'+(m.mine?' mine':'')+(f===active?' active':'');
    b.innerHTML=esc(m.label)+' <span class="cnt">('+n+')</span>';
    b.onclick=()=>{active=f;draw();};
    tabsEl.appendChild(b);
  });
}
function draw(){
  buildTabs();
  const m=meta(active);
  mainEl.innerHTML='<div class="head2"><h2>'+esc(m.label)+'</h2>'+
    '<span class="badge'+(m.mine?' mine':'')+'">'+esc(m.owner)+'</span>'+
    '<span class="src">zrodlo: '+esc(m.src)+' &rarr; '+esc(active)+'</span>'+
    '<span class="filter"><input type="text" id="flt" placeholder="filtruj wiersze..."></span></div>'+
    '<div id="content">'+render(DATA[active])+'</div>';
  const flt=document.getElementById('flt');
  if(flt) flt.addEventListener('input',()=>{
    const q=flt.value.toLowerCase();
    document.querySelectorAll('#content table.grid tbody tr').forEach(tr=>{
      tr.classList.toggle('hidden', q && !tr.textContent.toLowerCase().includes(q));
    });
  });
}
draw();
</script>
</body>
</html>
"""

html = (TEMPLATE
        .replace("__TS__", ts)
        .replace("__DATA__", inline(data_map))
        .replace("__META__", inline(meta_map)))

with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)
print("OK ->", OUT)
print("zakladki:", len(data_map), "| rozmiar:", round(len(html)/1024, 1), "KB")
