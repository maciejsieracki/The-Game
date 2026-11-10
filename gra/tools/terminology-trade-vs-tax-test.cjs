'use strict';
/**
 * terminology-trade-vs-tax-test.cjs — test STRAŻNIK tematu R-WEB-TERMINOLOGY-TRADE-VS-TAX-Q1.
 *
 * Zasada właściciela (2026-11-09): na polach/HEX-ach nie produkuje się handlu. Produkcja pola to
 * Praca, Żywność i PODATEK. HANDEL = wyłącznie wymiana (trasy handlowe, umowy, kosze, cła, bonusy
 * portów/szlaków). Test pilnuje, że:
 *   [A] wzorce klasy A (produkcja pola/budynku/ulepszenia/technologii nazwana „handlem”) nie wracają
 *       w tekstach kart odkryć, kart budynków, ulepszeń terenu, cudów, CIVPEDII (wikiBundle) i
 *       w etykietach adapterów kart;
 *   [B] klasa B (trasy handlowe, Wymiana, Targowisko/Port/Emporion jako trasy, chip HUD „Handel”,
 *       „Handel ze szlaków”, ceny/umowy w dyplomacji) POZOSTAJE nietknięta;
 *   [J] poprawki językowe (Dodatek 1/3): „Warunek Wymiany — klucz …”, „… warunków Wymiany, bez których …”;
 *   [G] generatory kart (--check) zgodne z plikami danych;
 *   [P] tezy pozytywne: konkretne karty (Farma, Trzoda, Owce, Irygacja, Droga, Kopalnia miedzi/złota,
 *       Łodzie rybackie, Obóz łowiecki, Droga brukowana, Mennica) mówią „podatku/podatek”.
 *
 * Uruchomienie (z gra/): node tools/terminology-trade-vs-tax-test.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { FORBIDDEN_A, FORBIDDEN_LANG } = require('./terminology-trade-vs-tax.cjs');

const GRA = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(GRA, p), 'utf8');
const json = (p) => JSON.parse(read(p));

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; return; }
  fail++;
  console.error('FAIL: ' + name + (detail !== undefined ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 400) : ''));
}

/** Zbiera (ścieżka, tekst) wszystkich stringów z obiektu JSON. */
function strings(obj, p = '', out = []) {
  if (typeof obj === 'string') out.push([p, obj]);
  else if (Array.isArray(obj)) obj.forEach((v, i) => strings(v, `${p}[${i}]`, out));
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) strings(v, p ? `${p}.${k}` : k, out);
  return out;
}

const techCards = json('data/tech-cards-top5.json');
const bldCards = json('data/building-cards-top5.json');
const improvements = json('data/terrain-improvements.json');
const wonders = json('data/wonders.json');
const wiki = json('src/data/wikiBundle.json');

const techStrings = strings(techCards).filter(([p]) => !p.startsWith('_meta') && !/\.dowod$/.test(p));
const bldStrings = strings(bldCards).filter(([p]) => !p.startsWith('_meta') && !/\.dowod$/.test(p));

// ---------------------------------------------------------------- [A] wzorce A nie wracają
for (const rule of FORBIDDEN_A) {
  for (const [label, list] of [['karty odkryć', techStrings], ['karty budynków', bldStrings]]) {
    const hit = list.find(([, t]) => rule.re.test(t));
    check(`[A] ${label}: brak wzorca „${rule.nazwa}”`, !hit, hit);
  }
}

// Ulepszenia terenu: pola widoczne dla gracza na karcie (warunek) — bez „Handel (plon heksa)”.
for (const [key, row] of Object.entries(improvements)) {
  if (key.startsWith('_') || !row || typeof row !== 'object') continue;
  for (const f of ['warunek', 'teren']) {
    const t = String(row[f] ?? '');
    for (const rule of FORBIDDEN_A) check(`[A] terrain-improvements.${key}.${f}: brak „${rule.nazwa}”`, !rule.re.test(t), t);
  }
}
check('[A] Droga: warunek mówi „Podatek (plon heksa) +2/turę”', /Podatek \(plon heksa\) \+2\/turę/.test(improvements.droga.warunek), improvements.droga.warunek);
check('[A] Droga brukowana: warunek mówi „Podatek (plon heksa) +3/turę”', /Podatek \(plon heksa\) \+3\/turę/.test(improvements.droga_brukowana.warunek), improvements.droga_brukowana.warunek);

// Cuda: opisy efektów widoczne w karcie cudu (po absolut: +10 do podatku).
const wonderStrings = strings(wonders).filter(([p]) => /opis$|handel_turystyka$/.test(p));
for (const rule of FORBIDDEN_A) {
  const hit = wonderStrings.find(([, t]) => rule.re.test(t));
  check(`[A] wonders.json (opisy): brak wzorca „${rule.nazwa}”`, !hit, hit);
}
check('[A] wonders.json: atrakcja turystyczna = „+10 do podatku”', wonderStrings.some(([, t]) => /\+10 do podatku/.test(t)), wonderStrings.map((x) => x[1]));

// CIVPEDIA / poradnik (wikiBundle.json — wygenerowany z docs/**): brak wzorców A.
const wikiTexts = [];
for (const sec of wiki.poradnik || []) wikiTexts.push([`poradnik/${sec.id}`, sec.content || '']);
for (const e of wiki.encyklopedia || []) wikiTexts.push([`encyklopedia/${e.id || e.title}`, (e.full || e.wikiM || '')]);
check('[A] wikiBundle: niepusty (poradnik + encyklopedia)', wikiTexts.length > 100, wikiTexts.length);
for (const rule of FORBIDDEN_A) {
  const hit = wikiTexts.find(([, t]) => rule.re.test(t));
  check(`[A] wikiBundle: brak wzorca „${rule.nazwa}”`, !hit, hit && [hit[0], (hit[1].match(rule.re) || [])[0]]);
}
check('[A] wikiBundle: cuda — „Jedyny yield: +10 podatku (turystyka)”',
  wikiTexts.filter(([, t]) => /Jedyny yield: \*\*\+10 podatku\*\* \(turystyka\)/.test(t)).length >= 19,
  wikiTexts.filter(([, t]) => /Jedyny yield: \*\*\+10 podatku\*\*/.test(t)).length);

// Etykiety adapterów kart i napisy w kodzie.
const impAdapter = read('src/ui/entityCards/improvementAdapter.ts');
const wonAdapter = read('src/ui/entityCards/wonderAdapter.ts');
check('[A] improvementAdapter: etykieta pola handel (TileYield) = „Podatek”', /handel:\s*'Podatek'/.test(impAdapter) && !/handel:\s*'Handel'/.test(impAdapter));
check('[A] wonderAdapter: etykieta pola handel (TileYield) = „Podatek”', /handel:\s*'Podatek'/.test(wonAdapter) && !/handel:\s*'Handel'/.test(wonAdapter));
const mainTs = read('src/main.ts');
check('[A] main.ts: komunikat ukończenia cudu — „+10 podatku”, nie „+10 handel”', !/\+10 handel[,)]/.test(mainTs) && (mainTs.match(/\(\+10 podatku, utrzymanie ÷2\)/g) || []).length === 2);
const cityPanel = read('src/ui/cityPanel.ts');
check('[A] cityPanel: pasmo Ładu — „bonus do pracy i podatku”', /bonus do pracy i podatku/.test(cityPanel) && !/bonus do pracy i handlu/.test(cityPanel));
const hexTip = read('src/ui/hexContextTooltip.ts');
check('[A] hexContextTooltip: pole handel nazywa się „Podatek”', /key:\s*'handel',\s*label:\s*'Podatek'/.test(hexTip));

// ---------------------------------------------------------------- [B] klasa B zostaje
const techAll = techStrings.map((x) => x[1]).join('\n');
const bldAll = bldStrings.map((x) => x[1]).join('\n');
// R-WEB-CARDS-RESOURCE-PURPOSE-Q1 (DODATEK 2): tytuł z poprzedniej rundy („bez Wymiany żadnych tras handlowych”)
// był niepolski (brak orzeczenia) — wersja właściciela: „bez Wymiany nie ma tras handlowych”.
check('[B] Wymiana: „Otwiera handel: bez Wymiany nie ma tras handlowych”', techStrings.some(([, t]) => t === 'Otwiera handel: bez Wymiany nie ma tras handlowych'));
check('[B] Wymiana: stary tytuł „żadnych tras handlowych” nie wraca', !techStrings.some(([, t]) => /bez Wymiany żadnych tras/.test(t)));
check('[B] Wymiana: „Wymiana jest warunkiem handlu — dopiero po niej wyznaczysz trasy handlowe.”', techStrings.some(([, t]) => t === 'Wymiana jest warunkiem handlu — dopiero po niej wyznaczysz trasy handlowe.'));
check('[B] Wymiana: kalka „bramką całego handlu szlakowego” nie wraca', !techStrings.some(([, t]) => /bramką całego handlu szlakowego/.test(t)));
check('[B] Wymiana: CMZ „Wyznacz trasy handlowe między miastami”', techCards['Wymiana'].cmz.some((c) => c.czynnosc === 'Wyznacz trasy handlowe między miastami'), techCards['Wymiana'].cmz);
check('[B] Wymiana: „Targowisko: +50% dochodu z tras handlowych miasta”', techStrings.some(([, t]) => t === 'Targowisko: +50% dochodu z tras handlowych miasta'));
check('[B] Wymiana: „Targowisko: +1 trasa handlowa i premia 5% trasy”', techStrings.some(([, t]) => t === 'Targowisko: +1 trasa handlowa i premia 5% trasy'));
check('[B] Żegluga: „Port: +1 trasa handlowa miasta”', techStrings.some(([, t]) => t === 'Port: +1 trasa handlowa miasta'));
check('[B] Handel: „Emporion: +1 trasa handlowa i premia 5% trasy”', techStrings.some(([, t]) => t === 'Emporion: +1 trasa handlowa i premia 5% trasy'));
check('[B] Pismo: „Otwiera Matematykę, Kodeks, Handel, Filozofię” (nazwa technologii)', techStrings.some(([, t]) => t === 'Otwiera Matematykę, Kodeks, Handel, Filozofię'));
check('[B] karty odkryć nadal mają ≥ 8 odwołań do „tras(y) handlowych”', (techAll.match(/tras[a-z]* handlow/g) || []).length >= 8, (techAll.match(/tras[a-z]* handlow/g) || []).length);
check('[B] karty budynków: Targowisko — „+50% dochodu z tras handlowych miasta”', bldStrings.some(([, t]) => t === '+50% dochodu z tras handlowych miasta'));
check('[B] karty budynków: Port/Emporion/Targowisko — „+1 trasa handlowa i premia 5% trasy”', (bldAll.match(/\+1 trasa handlowa i premia 5% trasy/g) || []).length >= 3, (bldAll.match(/\+1 trasa handlowa i premia 5% trasy/g) || []).length);
check('[B] karty budynków: Mennica nadal „nie obejmuje tras”', bldStrings.some(([, t]) => /nie obejmuje tras/.test(t)));
check('[B] wonders.json: bonus % cudów dotyczy „dochodu z tras handlowych”', wonderStrings.some(([, t]) => /dochodu z tras handlowych/.test(t)));
const hud = read('src/ui/hud.ts');
check('[B] HUD: chip „Handel” (trasy) i „Handel ze szlaków” pozostają', /label:\s*'Handel'/.test(hud) && /Handel ze szlaków/.test(hud) && /Handel — wymiana z obcymi cywilizacjami/.test(hud));
const empirePanel = read('src/ui/empireDetailPanel.ts');
check('[B] panel imperium: zakładka „HANDEL — SZLAKI HANDLOWE” i „Umowy handlowe” pozostają', /HANDEL — SZLAKI HANDLOWE/.test(empirePanel) && /Umowy handlowe/.test(empirePanel));
check('[B] main.ts: „Szlak handlowy zerwany” i „Propozycja umowy handlowej” pozostają', /Szlak handlowy zerwany/.test(mainTs) && /Propozycja umowy handlowej/.test(mainTs));
check('[B] cityPanel: „Premia za trasy handlowe” pozostaje', /Premia za trasy handlowe/.test(cityPanel));
const buildingsJson = read('data/buildings.json');
check('[B] buildings.json: „Port handlowy” i grupa „Handel i pieniądz” pozostają', /"nazwa": "Port handlowy"/.test(buildingsJson) && /"grupa": "Handel i pieniądz"/.test(buildingsJson));
check('[B] buildings.json: Emporion „+5% handlu” (premia trasy) pozostaje', /"tytul": "\+5% handlu"/.test(buildingsJson));
check('[B] tech.json: technologia „Handel” pozostaje', /"Technologia": "Handel"/.test(read('data/tech.json')));

// Notatki deweloperskie w polach danych (uwagi / Uwagi) — ten sam błąd klasy A, choć nie są
// renderowane na karcie; wiki (generate-encyklopedia.cjs: „Uwaga:”) może je wydrukować.
check('[A] buildings.json Mennica uwagi: „mnożnik podatku→pieniądz”', /mnoznik podatku→pieniądz \(economy\.ts\)/.test(buildingsJson) && !/mnoznik handlu/.test(buildingsJson));
check('[A] terrain-improvements.json: brak „Handel (plon heksa)” w uwagach', !/Handel \(plon heksa\)/.test(read('data/terrain-improvements.json')));
check('[A] terrain-yields.json Uwagi: „+podatek (+2)” w lesie', /\+podatek \(\+2\), \+praca \(\+3\)/.test(read('data/terrain-yields.json')) && !/\+handel \(\+2\)/.test(read('data/terrain-yields.json')));
check('[A] resources.json Uwagi: Mennica „mnożnik podatku”', /przy mnożniku podatku"/.test(read('data/resources.json')));

// ---------------------------------------------------------------- [J] poprawki językowe
for (const rule of FORBIDDEN_LANG) {
  const hit1 = techStrings.find(([, t]) => rule.re.test(t));
  const hit2 = bldStrings.find(([, t]) => rule.re.test(t));
  check(`[J] brak błędu „${rule.nazwa}”`, !hit1 && !hit2, hit1 || hit2);
}
const warunekTytuly = techStrings.filter(([p, t]) => /\.tytul$/.test(p) && /^Warunek Wymiany/.test(t)).map((x) => x[1]);
check('[J] „Warunek Wymiany — klucz do tras handlowych” (mianownik) w 2 kartach (Rolnictwo, Oswojenie zwierząt)',
  warunekTytuly.length === 2 && warunekTytuly.every((t) => t === 'Warunek Wymiany — klucz do tras handlowych'), warunekTytuly);
check('[J] Rolnictwo: „… jednym z trzech warunków Wymiany, bez których nie wyznaczysz …”',
  techCards['Rolnictwo'].top5.some((i) => i.zdanie === 'Rolnictwo jest jednym z trzech warunków Wymiany, bez których nie wyznaczysz żadnej trasy handlowej.'));
check('[J] Oswojenie zwierząt: „… jednym z trzech warunków Wymiany, bez których nie wyznaczysz …”',
  techCards['Oswojenie zwierząt'].top5.some((i) => i.zdanie === 'Oswojenie zwierząt jest jednym z trzech warunków Wymiany, bez których nie wyznaczysz żadnej trasy handlowej.'));
check('[J] Lama: spójna nazwa ludu — „Lama (Inkowie)” + „tylko dla Inków”',
  techCards['Oswojenie zwierząt'].top5.some((i) => /^Lama \(Inkowie\)/.test(i.tytul) && /tylko dla Inków/.test(i.zdanie)), techCards['Oswojenie zwierząt'].top5);

// ---------------------------------------------------------------- [P] tezy pozytywne
const title = (tech, re) => (techCards[tech].top5.find((i) => re.test(i.tytul)) || {}).tytul;
check('[P] Farma', title('Rolnictwo', /^Farma/) === 'Farma: +3 żywności, +3 Pracy, +3 podatku na polu', title('Rolnictwo', /^Farma/));
check('[P] Farma CMZ', techCards['Rolnictwo'].cmz.some((c) => c.korzysc === 'zyskać +3 żywności, +3 Pracy i +3 podatku z pola'), techCards['Rolnictwo'].cmz);
check('[P] Obóz łowiecki', title('Łowiectwo', /^Obóz/) === 'Obóz łowiecki: +1 żywności, +1 Pracy, +3 podatku', title('Łowiectwo', /^Obóz/));
check('[P] Trzoda', title('Oswojenie zwierząt', /^Trzoda/) === 'Trzoda: +2 żywności, +4 Pracy, +3 podatku, bez złoża', title('Oswojenie zwierząt', /^Trzoda/));
check('[P] Owce', title('Oswojenie zwierząt', /^Owce/) === 'Owce: +1 żywności, +2 Pracy, +2 podatku na wzgórzu', title('Oswojenie zwierząt', /^Owce/));
check('[P] Owce — zdanie: „żywność, Praca i podatek z pól trudnych do uprawy”', techCards['Oswojenie zwierząt'].top5.some((i) => /żywność, Praca i podatek z pól trudnych do uprawy/.test(i.zdanie)));
check('[P] Irygacja', title('Gospodarka wodna', /^Irygacja/) === 'Irygacja: +5 żywności, +2 Pracy, +2 podatku przy rzece', title('Gospodarka wodna', /^Irygacja/));
check('[P] Droga', title('Koło', /^Droga: \+/) === 'Droga: +2 podatku na polu', title('Koło', /^Droga: \+/));
check('[P] Kopalnia miedzi', title('Brązownictwo', /^Kopalnia miedzi/) === 'Kopalnia miedzi: +20 rudy na turę, +5 podatku', title('Brązownictwo', /^Kopalnia miedzi/));
check('[P] Łodzie rybackie', title('Żegluga', /^Łodzie/) === 'Łodzie rybackie: +6 żywności, +6 Pracy, +6 podatku', title('Żegluga', /^Łodzie/));
check('[P] Mennica (karta odkrycia)', title('Waluta', /^Mennica: ×/) === 'Mennica: ×1,50 podatku w każdym mieście', title('Waluta', /^Mennica: ×/));
check('[P] Kopalnia złota', title('Waluta', /^Kopalnia złota/) === 'Kopalnia złota: +10 podatku i +1 złota na turę', title('Waluta', /^Kopalnia złota/));
check('[P] Droga brukowana', title('Drogi brukowane', /^Droga brukowana: \+/) === 'Droga brukowana: +3 podatku na polu (Droga: +2)', title('Drogi brukowane', /^Droga brukowana: \+/));
check('[P] Mennica (karta budynku): „Mnoży podatek wszystkich miast …”', /^Mnoży podatek wszystkich miast przed podziałem/.test(bldCards.mennica.top5[0].zdanie), bldCards.mennica.top5[0]);
check('[P] Handel (tech): Mennica „mnoży podatek wszystkich miast”', techCards['Handel'].top5.some((i) => i.zdanie === 'Prowadzi do Mennicy, która mnoży podatek wszystkich miast.'));

// ---------------------------------------------------------------- [C] R-WEB-TERMINOLOGY-C-AND-ONESHOT-LABEL-Q1: klasa C
// Panel podziału = PODATEK (suwaki, formuły, tooltipy); identyfikatory w kodzie bez zmian.
const cityPanelC = read('src/ui/cityPanel.ts');
check('[C] cityPanel: brak „Podział Handlu”/„podziale handlu”/„suwak handlu”/„Udział handlu”', !/Podział Handlu|podziale handlu|suwak handlu|Udział handlu|% handlu netto/.test(cityPanelC));
check('[C] cityPanel: brak „z handlu (szac.)”/„skarb_z_handlu”/„nauka += … % handlu”', !/z handlu \(szac\.\)|skarb_z_handlu|% handlu\b/.test(cityPanelC));
check('[C] cityPanel: formuły wyświetlane jako „podatek brutto/netto” (brak „handelBrutto =”/„handelNetto =”)', !/handelBrutto =|handelNetto =|strataKorupcji =/.test(cityPanelC) && /podatek brutto = Σ/.test(cityPanelC) && /podatek netto = podatek brutto/.test(cityPanelC));
check('[C] cityPanel: premia tras pozostaje „Handlu” (klasa B)', /Premia za trasy handlowe/.test(cityPanelC) && /do podatku brutto \(\$\{aktywneTrasyCount\}/.test(cityPanelC));
check('[C] cityPanel: grupa „Handel i pieniądz” wyświetlana jako „Podatek i pieniądz” (klucz danych bez zmian)', /grupa === 'Handel i pieniądz' \? 'Podatek i pieniądz' : grupa/.test(cityPanelC));

// ---------------------------------------------------------------- [D] R-WEB-TERMINOLOGY-C-AND-ONESHOT-LABEL-Q1: podpis trybu wymiany surowców
const basket = read('src/ui/diplomacyTradeBasket.ts');
check('[D] koszyk: podpis „Jednorazowo — nie pojawi się w Aktywnych traktatach”', basket.includes('Jednorazowo — nie pojawi się w Aktywnych traktatach'));
check('[D] koszyk: podpis „Co turę — widoczna w Aktywnych traktatach”', basket.includes('Co turę — widoczna w Aktywnych traktatach'));

// ---------------------------------------------------------------- [P2] poradniki 45 i 07 zgodne z silnikiem (Targowisko)
const p45 = read('../docs/PORADNIK-GRACZA/45-katalog-budynkow.md');
const p07 = read('../docs/PORADNIK-GRACZA/07-miasto-budowa-rekrutacja.md');
check('[P2] poradnik 45: Targowisko = premia do dochodu z tras, nie mnoży podatku', /premia do dochodu z tras handlowych/.test(p45) && !/nie mnożnik handlu/.test(p45) && !/Bez \*\*mnożnika %\*\* handlu/.test(p45));
check('[P2] poradnik 07: Targowisko — +50% tylko do tras', /\+50%\*\* \(poziom normalny\) \*\*do dochodu z tras handlowych\*\*/.test(p07) && !/nie mnożnik handlu/.test(p07));

// ---------------------------------------------------------------- [G] generatory zgodne z danymi
for (const gen of ['gen-tech-cards-top5.cjs', 'gen-building-cards-top5.cjs']) {
  const r = spawnSync(process.execPath, [path.join(__dirname, gen), '--check'], { cwd: GRA, encoding: 'utf8' });
  check(`[G] ${gen} --check zgodny z plikiem danych`, r.status === 0, (r.stdout + r.stderr).trim().split('\n').pop());
}

console.log(`[terminology-trade-vs-tax-test] ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
