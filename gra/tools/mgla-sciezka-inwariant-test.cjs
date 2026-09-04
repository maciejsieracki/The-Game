'use strict';
/**
 * mgla-sciezka-inwariant-test.cjs — P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1, GOAL 3.
 *
 * PO CO TA BRAMKA ISTNIEJE
 * Ten sam blad zglaszany byl CZTERY razy: jednostka przechodzi kilka heksow w jednej
 * turze, a mgla odkrywa sie TYLKO na heksie koncowym. Trzy poprzednie tematy naprawily
 * po JEDNYM miejscu wywolania i kazdy z nich zostal ogloszony jako „ostatnie miejsce
 * wzorca" — nieprawdziwie, trzy razy z rzedu, bo zadna z tych napraw nie niosla METODY,
 * ktora by to gwarantowala. Ta bramka jest ta metoda.
 *
 * INWARIANT (wariant (a)+(b) z dispatchu, blok [1] + blok [5]):
 *   KAZDY zapis pozycji jednostki w `gra/src` (`.q =` / `.r =`) musi byc albo na jawnej,
 *   UZASADNIONEJ liscie ponizej, albo — gdy jest to przemieszczenie wieloheksowe w
 *   `main.ts` — miec w swoim sasiedztwie wywolanie odkrycia wzdluz sciezki.
 *   PIATE miejsce nie da sie dodac po cichu: nowy, niesklasyfikowany zapis pozycji
 *   czerwieni blok [1], a usuniecie odkrycia przy ktoregokolwiek ze znanych miejsc
 *   wieloheksowych czerwieni blok [2].
 *
 * DLACZEGO NIE SAM WSPOLNY HELPER (GOAL 2, „preferowane rozwiazanie")
 *   Wspolny helper nie jest zabezpieczeniem: nie zmusza autora piatego miejsca, zeby go
 *   zawolal. Helper `revealAlongPathForStack` ISTNIEJE (main.ts, przy `refreshFog`) i jest
 *   uzyty w czwartym miejscu, ale strukturalna gwarancje daje dopiero ta bramka.
 *   Trzy istniejace wywolania inline NIE zostaly przez helper zastapione — ich doslowny
 *   tekst jest zakontraktowany przez `mgla-odkrycie-wzdluz-sciezki-test.cjs` (SEKCJA D),
 *   plik lezacy POZA allowlista tematu. Blok [4] pilnuje, ze helper nie zostal wydrazony.
 *
 * KOMENDA WYSZUKIWANIA (mechaniczna, powtarzalna — to jest inwentaryzacja GOAL 1):
 *   grep -rnE '\.(q|r)[[:space:]]*=[^=>]' gra/src --include=*.ts
 *   Skaner ponizej implementuje DOKLADNIE ten wzorzec (`/\.(q|r)\s*=(?!=)/`), z
 *   pominieciem calych linii komentarza. Kazdy jego wynik musi trafic do `KLASYFIKACJA`.
 *
 * DLACZEGO SAM `.q =` NIE WYSTARCZA (blok [1c])
 *   Notacja kropkowa jest konwencja DZISIEJSZEGO kodu, nie gwarancja na przyszlosc.
 *   Te same dwa pola da sie zapisac co najmniej trzema innymi sposobami, ktorych wzorzec
 *   `\.(q|r)\s*=` NIE widzi: `u['q'] = ...` (notacja nawiasowa), `Object.assign(u, { q, r })`
 *   oraz `u.q += dq` / `u.q++` (przypisanie zlozone). Piate miejsce napisane tak powstaloby
 *   rownie niezauwazenie jak czwarte. Blok [1c] domyka wszystkie trzy licznikiem zerowym
 *   z jawna, uzasadniona whitelista — inwentaryzacja wykonana RECZNIE i RAZ na bazie nie
 *   chroni przyszlosci, chroni ja dopiero asercja uruchamiana za kazdym razem.
 *
 * BLOKI:
 *   [1]  skan negatywny calego `gra/src`: ZERO niesklasyfikowanych zapisow pozycji.
 *   [1b] straznik pokrycia (anty-slepota): skan przeczytal realne drzewo zrodel.
 *   [1c] wzorce POSREDNIE: notacja nawiasowa `['q'] =`, `Object.assign` i przypisanie
 *        zlozone `+=`/`++` — licznik zerowy poza jawna, uzasadniona whitelista.
 *   [2]  okno odkrycia: kazdy zapis klasy WIELOHEKS-ODKRYWA w main.ts ma w poblizu
 *        wywolanie odkrycia wzdluz sciezki. <- DETEKTOR MUTACJI (Tryb trzeci dispatchu)
 *   [3]  czwarte miejsce: hak `onAfterStep` przy `runScoutsAutoExplore(` odkrywa.
 *   [4]  integralnosc helpera `revealAlongPathForStack`.
 *   [5]  nietautologicznosc na zrodle SYNTETYCZNYM: ten sam skaner na spreparowanym
 *        pliku z nowym, nieuzasadnionym zapisem pozycji MUSI zglosic trafienie.
 *
 * Usage (z gra/): node tools/mgla-sciezka-inwariant-test.cjs
 */

const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(GRA_ROOT, 'src');
const MAIN_TS = 'src/main.ts';

let pass = 0;
let fail = 0;
function assert(cond, msg, detail) {
  if (cond) {
    pass++;
    console.log('  OK:', msg);
  } else {
    fail++;
    console.error('  FAIL:', msg, detail !== undefined ? '-- ' + JSON.stringify(detail) : '');
  }
}

// ---------------------------------------------------------------------------
// SKANER — jedna implementacja, uzywana i na prawdziwym drzewie [1], i na
// zrodle syntetycznym [5]. Bez tej wspolnoty test [5] nie dowodzilby niczego
// o tescie [1] (C-046: test ma importowac ta sama jednostke co produkcja).
// ---------------------------------------------------------------------------

/**
 * Klucz trafienia: `plik + tekst + nr`, serializowany jednoznacznie. Separator musi byc
 * niemozliwy do podrobienia przez tresc pola (inaczej dwa rozne trafienia moglyby dac ten
 * sam klucz i jedno z nich zniknelo by z pokrycia) — a jednoczesnie DRUKOWALNY, zeby plik
 * pozostal tekstowy dla `git diff` i `grep`.
 */
function klucz(plik, tekst, nr) {
  return JSON.stringify([plik, tekst, nr]);
}

/** Wzorzec zapisu pozycji jednostki — odpowiednik komendy grep z naglowka. */
const RE_ZAPIS_POZYCJI = /\.(q|r)\s*=(?!=)/;

/**
 * Wzorzec POSREDNI 1: notacja nawiasowa `u['q'] = ...` / `u["r"] = ...`.
 * Zapisuje DOKLADNIE to samo pole co `u.q =`, ale wzorzec kropkowy jej nie widzi.
 */
const RE_ZAPIS_NAWIASOWY = /\[\s*['"](q|r)['"]\s*\]\s*=(?!=)/;

/**
 * Wzorzec POSREDNI 3: przypisanie ZLOZONE (`u.q += dq`) i inkrementacja (`u.q++`, `--u.r`).
 * `u.q += 5` przesuwa jednostke o piec heksow rownie skutecznie jak `u.q = q0 + 5`, a wzorzec
 * `\.(q|r)\s*=` tego nie widzi. Alternatywy sa wypisane jawnie, zeby zaden operator
 * POROWNANIA (`>=`, `<=`, `!==`, `===`) nie wpadl tu jako falszywy alarm.
 */
const RE_ZAPIS_ZLOZONY = new RegExp(
  '\\.(q|r)\\s*(?:\\*\\*|<<|>>>|>>|&&|\\|\\||\\?\\?|[-+*/%&|^])=(?!=)'
  + '|(?:\\+\\+|--)\\s*[A-Za-z_$][\\w$]*\\.(?:q|r)\\b'
  + '|[A-Za-z_$][\\w$]*\\.(?:q|r)\\s*(?:\\+\\+|--)',
);

/** Cale linie komentarza i komentarze blokowe -> spacje (offsety i numery linii zachowane). */
function wygasKomentarze(tresc) {
  const bezBlokowych = tresc.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  return bezBlokowych
    .split('\n')
    .map((l) => {
      const t = l.trim();
      return t.startsWith('//') || t.startsWith('*') ? l.replace(/[^\n]/g, ' ') : l;
    })
    .join('\n');
}

/**
 * Zwraca liste trafien wzorca `re` w JEDNYM pliku. Klucz trafienia to `plik + tekst + nr`
 * (nr = ktore z rzedu wystapienie tego samego tekstu w tym pliku) — celowo BEZ
 * numeru linii, zeby whitelist nie rozjezdzala sie przy kazdej edycji main.ts.
 * Cale linie komentarza (`//`, `*`) i komentarze blokowe sa pomijane — zachowawczo,
 * nigdy ogon linii z kodem (`//` w literalu stringowym nie moze oslepic skanu).
 */
function skanujWzorcem(rel, tresc, re) {
  const licznik = new Map();
  const out = [];
  wygasKomentarze(tresc).split('\n').forEach((linia, i) => {
    if (!linia.trim()) return;
    if (!re.test(linia)) return;
    const k = linia.trim();
    const nr = (licznik.get(k) || 0) + 1;
    licznik.set(k, nr);
    out.push({ plik: rel, linia: i + 1, tekst: k, nr });
  });
  return out;
}

function skanujZrodlo(rel, tresc) {
  return skanujWzorcem(rel, tresc, RE_ZAPIS_POZYCJI);
}

function skanujNawiasowe(rel, tresc) {
  return skanujWzorcem(rel, tresc, RE_ZAPIS_NAWIASOWY);
}

function skanujZlozone(rel, tresc) {
  return skanujWzorcem(rel, tresc, RE_ZAPIS_ZLOZONY);
}

/**
 * Wzorzec POSREDNI 2: `Object.assign(cel, { q, r })`. Zwraca PIERWSZY argument kazdego
 * wywolania, wycinany z uwzglednieniem zagniezdzen (przecinek wewnatrz `{}`/`()`/`[]`
 * nie konczy argumentu) — inaczej `Object.assign({}, a, b)` bylby czytany jako `{`.
 */
function skanujObjectAssign(rel, tresc) {
  const czysty = wygasKomentarze(tresc);
  const re = /Object\.assign\s*\(/g;
  const out = [];
  let m;
  while ((m = re.exec(czysty)) !== null) {
    let depth = 0;
    let arg = '';
    for (let i = m.index + m[0].length; i < czysty.length; i++) {
      const c = czysty[i];
      if (c === '(' || c === '[' || c === '{') depth++;
      else if (c === ')' || c === ']' || c === '}') {
        if (depth === 0) break;
        depth--;
      } else if (c === ',' && depth === 0) break;
      arg += c;
    }
    out.push({
      plik: rel,
      linia: czysty.slice(0, m.index).split('\n').length,
      arg: arg.trim().replace(/\s+/g, ' '),
    });
  }
  return out;
}

/**
 * Jedyne dozwolone uzycie `Object.assign` w tym repo: ustawianie stylu CSS elementu DOM
 * (`Object.assign(el.style, { ... })`). Pierwszy argument konczacy sie `.style` NIE jest
 * jednostka — nie ma pol `q`/`r` mapy swiata.
 */
const RE_OBJECT_ASSIGN_STYL = /\.style$/;

function zbierzTs(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) zbierzTs(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------------------
// KLASYFIKACJA — tabela GOAL 1 zapisana jako WYKONYWALNY kontrakt.
//
// NIE DOPISUJ TU WPISOW „ZEBY PRZESZLO". Nowy zapis pozycji jednostki znaczy, ze
// powstalo nowe miejsce przemieszczenia — trzeba je sklasyfikowac jawnie ALBO
// domknac odkryciem wzdluz sciezki. To jest caly sens tej bramki.
//
// Klasy:
//   POZA-MAPA-SWIATA   — `RuntimeBattleUnit` na siatce bitwy taktycznej (col/row),
//                        inna przestrzen wspolrzednych niz mapa swiata; mgla swiata
//                        nie zalezy od tych pol.
//   NIE-JEDNOSTKA      — zapis dotyczy `City`, nie jednostki.
//   BEZ-MGLY-GRACZA    — wlascicielem jest AI / barbarzynca; `explored` gracza liczy
//                        sie WYLACZNIE z jednostek `ownerId === 0` (currentVisible).
//   DEBUG-TEST-HOOK    — hak `__*TestDebug` / konsola deweloperska, nie sciezka rozgrywki.
//   KROK-1-HEX         — przemieszczenie o co najwyzej jeden heks (sasiad) albo na heks
//                        juz widoczny; sciezka i pozycja koncowa daja ten sam wynik.
//   POWROT-NA-ODWIEDZONY — skok na heks, na ktorym ta sama jednostka juz stala w tej
//                        turze; nic nowego nie moze byc nieodkryte.
//   TELEPORT-BEZ-SCIEZKI — przeniesienie natychmiastowe, jednostka NIE przechodzi przez
//                        heksy posrednie; „odkrycie wzdluz sciezki" jest tu niezdefiniowane,
//                        poprawna semantyka to odkrycie z pozycji docelowej (refreshFog).
//   WIELOHEKS-ODKRYWA  — realny marsz przez wiele heksow; MUSI miec odkrycie wzdluz
//                        sciezki w sasiedztwie (blok [2]).
//   WIELOHEKS-HAK-ZEWNETRZNY — realny marsz przez wiele heksow, ale zapis pozycji lezy w
//                        module bez dostepu do `explored`; odkrycie jest w haku po stronie
//                        wolajacego (blok [3]).
// ---------------------------------------------------------------------------
const KLASYFIKACJA = [
  // --- siatka bitwy taktycznej: RuntimeBattleUnit, nie RuntimeUnit mapy swiata ---
  { plik: 'src/battle/battleScene.ts', tekst: 'ru.q = wallCol;', nr: 1, klasa: 'POZA-MAPA-SWIATA', uzasadnienie: 'deployment na murze, siatka bitwy (col/row)' },
  { plik: 'src/battle/battleScene.ts', tekst: 'ru.r = wallRow;', nr: 1, klasa: 'POZA-MAPA-SWIATA', uzasadnienie: 'j.w.' },
  { plik: 'src/battle/battleScene.ts', tekst: 'u.q = retreatCol;', nr: 1, klasa: 'POZA-MAPA-SWIATA', uzasadnienie: 'odwrot na siatce bitwy' },
  { plik: 'src/battle/battleScene.ts', tekst: 'u.r = wallRow;', nr: 1, klasa: 'POZA-MAPA-SWIATA', uzasadnienie: 'j.w.' },
  { plik: 'src/battle/battleScene.ts', tekst: 'u.q = cc; u.r = rc;', nr: 1, klasa: 'POZA-MAPA-SWIATA', uzasadnienie: 'przesuniecie na wolna komorke siatki bitwy' },
  { plik: 'src/battle/battleScene.ts', tekst: 'ru.q = col; ru.r = row;', nr: 1, klasa: 'POZA-MAPA-SWIATA', uzasadnienie: 'ustawienie startowe na siatce bitwy' },
  { plik: 'src/battle/battleScene.ts', tekst: 'ru.q = newCol;', nr: 1, klasa: 'POZA-MAPA-SWIATA', uzasadnienie: '_moveDeployUnit — siatka bitwy' },
  { plik: 'src/battle/battleScene.ts', tekst: 'ru.r = newRow;', nr: 1, klasa: 'POZA-MAPA-SWIATA', uzasadnienie: 'j.w.' },
  { plik: 'src/battle/manualBattle.ts', tekst: 'ru.q = q; ru.r = r;', nr: 1, klasa: 'POZA-MAPA-SWIATA', uzasadnienie: 'ruch w bitwie recznej, siatka bitwy' },

  // --- AI: mgla gracza nie zalezy od pozycji jednostek AI ---
  { plik: 'src/game/ai-city-capture-executor.ts', tekst: 'unit.q = last.q;', nr: 1, klasa: 'BEZ-MGLY-GRACZA', uzasadnienie: 'executeAiCityMove — jednostka AI (main.ts: petla komend AI); wieloheksowa, ale explored gracza liczy sie z ownerId===0' },
  { plik: 'src/game/ai-city-capture-executor.ts', tekst: 'unit.r = last.r;', nr: 1, klasa: 'BEZ-MGLY-GRACZA', uzasadnienie: 'j.w.' },

  // --- powrot po bitwie: przesuniecia lokalne wokol heksu bitwy ---
  { plik: 'src/game/post-battle-map.ts', tekst: 'u.q = tq;', nr: 1, klasa: 'KROK-1-HEX', uzasadnienie: 'rout fan-out: u.q + dq*step, step<=3, kierunek od heksu bitwy — caly wachlarz w zasiegu wzroku heksu bitwy, ktory jest juz odkryty' },
  { plik: 'src/game/post-battle-map.ts', tekst: 'u.r = tr;', nr: 1, klasa: 'KROK-1-HEX', uzasadnienie: 'j.w.' },
  { plik: 'src/game/post-battle-map.ts', tekst: 'u.q = input.battleQ;', nr: 1, klasa: 'KROK-1-HEX', uzasadnienie: 'wejscie zwyciezcy na heks bitwy — heks sasiedni, juz widoczny (bitwa sie na nim odbyla)' },
  { plik: 'src/game/post-battle-map.ts', tekst: 'u.r = input.battleR;', nr: 1, klasa: 'KROK-1-HEX', uzasadnienie: 'j.w.' },
  { plik: 'src/game/post-battle-map.ts', tekst: 'u.q = start.q;', nr: 1, klasa: 'POWROT-NA-ODWIEDZONY', uzasadnienie: 'retreatAtkRosterToStart — powrot na atkStart, heks opuszczony w tej samej turze' },
  { plik: 'src/game/post-battle-map.ts', tekst: 'u.r = start.r;', nr: 1, klasa: 'POWROT-NA-ODWIEDZONY', uzasadnienie: 'j.w.' },
  { plik: 'src/game/post-battle-map.ts', tekst: 'live.q = city.q;', nr: 1, klasa: 'KROK-1-HEX', uzasadnienie: 'wejscie do zdobytego miasta — heks sasiedni i widoczny (oblezenie/atak z sasiedztwa)' },
  { plik: 'src/game/post-battle-map.ts', tekst: 'live.r = city.r;', nr: 1, klasa: 'KROK-1-HEX', uzasadnienie: 'j.w.' },

  // --- CZWARTE MIEJSCE WZORCA (naprawione w tej rundzie) ---
  { plik: 'src/game/scout-auto-explore.ts', tekst: 'unit.q = step.q;', nr: 1, klasa: 'WIELOHEKS-HAK-ZEWNETRZNY', uzasadnienie: 'advanceScoutAutoExplore: petla `while (unit.ruchLeft > 0)`, kilkanascie heksow w jednej turze. Modul nie ma dostepu do `explored` gry (dostaje ReadonlySet + wlasna kopie robocza). Odkrycie jest w haku `onAfterStep` po stronie main.ts — sprawdza blok [3].' },
  { plik: 'src/game/scout-auto-explore.ts', tekst: 'unit.r = step.r;', nr: 1, klasa: 'WIELOHEKS-HAK-ZEWNETRZNY', uzasadnienie: 'j.w.' },

  // --- main.ts ---
  { plik: MAIN_TS, tekst: 'u.q = dest.q;', nr: 1, klasa: 'KROK-1-HEX', uzasadnienie: 'evictForeignUnitsFromCityHexes — findAdjacentEmptyHexes, heks SASIEDNI' },
  { plik: MAIN_TS, tekst: 'u.r = dest.r;', nr: 1, klasa: 'KROK-1-HEX', uzasadnienie: 'j.w.' },
  { plik: MAIN_TS, tekst: 'mu.q = dest.q;', nr: 1, klasa: 'POWROT-NA-ODWIEDZONY', uzasadnienie: 'BB2 „zostaw osobno": resolveSeparateReturnHex wokol fromQ/fromR — origin marszu, heks juz odwiedzony w tej turze; ruch jest w pelni refundowany (jakby marszu nie bylo)' },
  { plik: MAIN_TS, tekst: 'mu.r = dest.r;', nr: 1, klasa: 'POWROT-NA-ODWIEDZONY', uzasadnienie: 'j.w.' },
  { plik: MAIN_TS, tekst: 'u.q = destQ;', nr: 1, klasa: 'KROK-1-HEX', uzasadnienie: 'rozdzielenie armii (split): findSplitDestHexes daje heksy SASIEDNIE, koszt ruchu 1' },
  { plik: MAIN_TS, tekst: 'u.r = destR;', nr: 1, klasa: 'KROK-1-HEX', uzasadnienie: 'j.w.' },
  { plik: MAIN_TS, tekst: 'mu.q = destQ;', nr: 1, klasa: 'KROK-1-HEX', uzasadnienie: 'scalenie armii: adjacentVisibleArmyHexes — cel SASIEDNI i JUZ WIDOCZNY, moveCost = 1' },
  { plik: MAIN_TS, tekst: 'mu.r = destR;', nr: 1, klasa: 'KROK-1-HEX', uzasadnienie: 'j.w.' },
  { plik: MAIN_TS, tekst: 'u.q = dest.q;', nr: 2, klasa: 'TELEPORT-BEZ-SCIEZKI', uzasadnienie: 'ewakuacja z przejmowanego fortu przy zalozeniu miasta: findEvacuationHexOutsideCity szuka pierscieniami OD 1 i zwraca PIERWSZY wolny — jednostka nie przechodzi przez heksy posrednie, brak sciezki do odkrycia' },
  { plik: MAIN_TS, tekst: 'u.r = dest.r;', nr: 2, klasa: 'TELEPORT-BEZ-SCIEZKI', uzasadnienie: 'j.w.' },
  { plik: MAIN_TS, tekst: 'if (playerCity) { playerCity.q = attacker.q; playerCity.r = attacker.r; }', nr: 1, klasa: 'NIE-JEDNOSTKA', uzasadnienie: 'hak testowy wojny o Braz — przestawia MIASTO gracza, nie jednostke' },
  { plik: MAIN_TS, tekst: 'if (playerCity) { playerCity.q = attacker.q; playerCity.r = attacker.r; }', nr: 2, klasa: 'NIE-JEDNOSTKA', uzasadnienie: 'lustro dla Zelaza — j.w.' },
  { plik: MAIN_TS, tekst: 'u.q = home.q;', nr: 1, klasa: 'DEBUG-TEST-HOOK', uzasadnienie: '`pullPlayerUnitsHome` — hak bramki testowej buntu, nie sciezka rozgrywki' },
  { plik: MAIN_TS, tekst: 'u.r = home.r;', nr: 1, klasa: 'DEBUG-TEST-HOOK', uzasadnienie: 'j.w.' },
  { plik: MAIN_TS, tekst: 'su.q = last.q;', nr: 1, klasa: 'WIELOHEKS-ODKRYWA', uzasadnienie: 'applyMarchSegmentInstant — ruch natychmiastowy stosu (result.movePath); MIEJSCE 1 z 3 naprawionych wczesniej' },
  { plik: MAIN_TS, tekst: 'su.r = last.r;', nr: 1, klasa: 'WIELOHEKS-ODKRYWA', uzasadnienie: 'j.w.' },
  { plik: MAIN_TS, tekst: 'u.q = best.q;', nr: 1, klasa: 'DEBUG-TEST-HOOK', uzasadnienie: 'konsola deweloperska „zaokretuj" — teleport na najblizsza wode, nie sciezka rozgrywki' },
  { plik: MAIN_TS, tekst: 'u.r = best.r;', nr: 1, klasa: 'DEBUG-TEST-HOOK', uzasadnienie: 'j.w.' },
  { plik: MAIN_TS, tekst: 'su.q = anim.destQ;', nr: 1, klasa: 'WIELOHEKS-ODKRYWA', uzasadnienie: 'koniec tury podczas animacji marszu (anim.pathHexes); MIEJSCE 2 z 3' },
  { plik: MAIN_TS, tekst: 'su.r = anim.destR;', nr: 1, klasa: 'WIELOHEKS-ODKRYWA', uzasadnienie: 'j.w.' },
  { plik: MAIN_TS, tekst: 'bu.q = bcmd.toQ;', nr: 1, klasa: 'BEZ-MGLY-GRACZA', uzasadnienie: 'komenda `move` barbarzyncy' },
  { plik: MAIN_TS, tekst: 'bu.r = bcmd.toR;', nr: 1, klasa: 'BEZ-MGLY-GRACZA', uzasadnienie: 'j.w.' },
  { plik: MAIN_TS, tekst: 'bu.q = bcmd.toQ;', nr: 2, klasa: 'BEZ-MGLY-GRACZA', uzasadnienie: 'komenda `raid` barbarzyncy' },
  { plik: MAIN_TS, tekst: 'bu.r = bcmd.toR;', nr: 2, klasa: 'BEZ-MGLY-GRACZA', uzasadnienie: 'j.w.' },
  { plik: MAIN_TS, tekst: 'su.q = destQ;', nr: 1, klasa: 'WIELOHEKS-ODKRYWA', uzasadnienie: 'koniec animacji marszu w renderLoop (pathHexes); MIEJSCE 3 z 3' },
  { plik: MAIN_TS, tekst: 'su.r = destR;', nr: 1, klasa: 'WIELOHEKS-ODKRYWA', uzasadnienie: 'j.w.' },
];

const indeksKlasyfikacji = new Map();
for (const w of KLASYFIKACJA) indeksKlasyfikacji.set(klucz(w.plik, w.tekst, w.nr), w);

// ---------------------------------------------------------------------------
// WZORZEC POSREDNI 1 — notacja nawiasowa `['q'] =` / `['r'] =`.
// Ta sama dyscyplina co w KLASYFIKACJA: kazdy wpis z uzasadnieniem, zero wpisow
// „zeby przeszlo". Dzis w `gra/src` istnieje wylacznie jedno uzasadnione zastosowanie:
// `userData` obiektu Three.js (mesh/grupa renderu), gdzie `q`/`r` sa znacznikiem heksu
// odczytywanym przy raycascie. Obiekt sceny nie jest jednostka — jego przestawienie
// nikogo nie przemieszcza po mapie, wiec nie ma tam sciezki do odkrycia.
// ---------------------------------------------------------------------------
const DOZWOLONE_NAWIASOWE = [
  { plik: 'src/render/cities.ts', tekst: "grp.userData['q'] = q;", nr: 1, uzasadnienie: 'Three.js userData grupy renderu miasta — znacznik heksu do raycastu, nie jednostka' },
  { plik: 'src/render/cities.ts', tekst: "grp.userData['r'] = r;", nr: 1, uzasadnienie: 'j.w.' },
  { plik: 'src/render/cities.ts', tekst: "group.userData['q'] = q;", nr: 1, uzasadnienie: 'j.w. — druga grupa renderu miasta' },
  { plik: 'src/render/cities.ts', tekst: "group.userData['r'] = r;", nr: 1, uzasadnienie: 'j.w.' },
  { plik: 'src/battle/manualBattle.ts', tekst: "mesh.userData['q'] = q;", nr: 1, uzasadnienie: 'Three.js userData kafla siatki bitwy — inna przestrzen wspolrzednych niz mapa swiata' },
  { plik: 'src/battle/manualBattle.ts', tekst: "mesh.userData['r'] = r;", nr: 1, uzasadnienie: 'j.w.' },
];
const indeksNawiasowych = new Map();
for (const w of DOZWOLONE_NAWIASOWE) indeksNawiasowych.set(klucz(w.plik, w.tekst, w.nr), w);

// ---------------------------------------------------------------------------
// WZORZEC POSREDNI 2 — `Object.assign(cel, ...)` z celem innym niz `*.style`.
// Lista jest PUSTA i to jest wynik pomiaru, nie zaniechania: wszystkie 244 wywolania
// `Object.assign` w `gra/src` (stan bazy 20f9993d) maja pierwszy argument konczacy sie
// `.style`, czyli ustawiaja styl CSS elementu DOM. Cel spoza tego wzorca wymaga wpisu
// z uzasadnieniem — albo jest jednostka i wtedy potrzebuje odkrycia wzdluz sciezki,
// albo nia nie jest i trzeba to napisac wprost.
// ---------------------------------------------------------------------------
const DOZWOLONE_OBJECT_ASSIGN = [];
const indeksObjectAssign = new Map();
for (const w of DOZWOLONE_OBJECT_ASSIGN) indeksObjectAssign.set(klucz(w.plik, w.arg, 1), w);

console.log('========================================================================');
console.log('P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1 -- INWARIANT odkrywania wzdluz sciezki');
console.log("KOMENDA: grep -rnE '\\.(q|r)[[:space:]]*=[^=>]' gra/src --include=*.ts");
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// [1] SKAN NEGATYWNY calego gra/src
// ---------------------------------------------------------------------------
console.log('[1] SKAN NEGATYWNY gra/src -- ZERO niesklasyfikowanych zapisow pozycji jednostki');

const plikiSrc = zbierzTs(SRC_DIR, []).sort();
let znakowSrc = 0;
const wszystkieTrafienia = [];
for (const abs of plikiSrc) {
  const rel = 'src/' + path.relative(SRC_DIR, abs).split(path.sep).join('/');
  const tresc = fs.readFileSync(abs, 'utf8');
  znakowSrc += tresc.length;
  for (const t of skanujZrodlo(rel, tresc)) wszystkieTrafienia.push(t);
}

const niesklasyfikowane = wszystkieTrafienia.filter(
  (t) => !indeksKlasyfikacji.has(klucz(t.plik, t.tekst, t.nr)),
);
assert(niesklasyfikowane.length === 0,
  '[1] kazdy zapis pozycji jednostki w gra/src jest jawnie sklasyfikowany w KLASYFIKACJA'
  + ' (nowe trafienie = nowe miejsce przemieszczenia -> sklasyfikuj albo domknij odkryciem)',
  niesklasyfikowane.map((t) => t.plik + ':' + t.linia + ' ' + t.tekst));

const uzyteKlucze = new Set(wszystkieTrafienia.map((t) => klucz(t.plik, t.tekst, t.nr)));
const martwe = KLASYFIKACJA.filter((w) => !uzyteKlucze.has(klucz(w.plik, w.tekst, w.nr)));
assert(martwe.length === 0,
  '[1] whitelist nie zawiera MARTWYCH wpisow (kod zniknal, uzasadnienie zostalo) -- inaczej'
  + ' bramka po cichu traci pokrycie',
  martwe.map((w) => w.plik + ' ' + w.tekst + ' #' + w.nr));

assert(KLASYFIKACJA.every((w) => typeof w.uzasadnienie === 'string' && w.uzasadnienie.length >= 4),
  '[1] kazdy wpis whitelisty ma niepuste uzasadnienie (zakaz wpisow „zeby przeszlo")');

// ---------------------------------------------------------------------------
// [1b] STRAZNIK POKRYCIA -- sam skan negatywny nie wykryje wlasnej slepoty:
//      zly glob, zla sciezka albo zbyt agresywne wycinanie komentarzy daje
//      ZERO trafien, czyli falszywy PASS.
// ---------------------------------------------------------------------------
console.log('\n[1b] STRAZNIK POKRYCIA -- skan przeczytal realne drzewo zrodel');

assert(plikiSrc.length >= 300, '[1b] skan objal >= 300 plikow .ts/.tsx', plikiSrc.length);
assert(znakowSrc > 1000000, '[1b] skan objal > 1 000 000 znakow zrodla', znakowSrc);
assert(wszystkieTrafienia.length >= 40,
  '[1b] skan znalazl realna liczbe zapisow pozycji (>= 40) -- nie oslepl na wzorcu',
  wszystkieTrafienia.length);

const OBOWIAZKOWE = [
  MAIN_TS,
  'src/game/scout-auto-explore.ts',
  'src/game/post-battle-map.ts',
  'src/game/ai-city-capture-executor.ts',
];
const zTrafieniami = new Set(wszystkieTrafienia.map((t) => t.plik));
assert(OBOWIAZKOWE.every((p) => zTrafieniami.has(p)),
  '[1b] skan objal wszystkie pliki niosace znane miejsca przemieszczenia',
  OBOWIAZKOWE.filter((p) => !zTrafieniami.has(p)));

// ---------------------------------------------------------------------------
// [1c] WZORCE POSREDNIE -- domkniecie luki wzorca kropkowego.
//
//      Blok [1] widzi WYLACZNIE `.q =` / `.r =`. To jest konwencja dzisiejszego kodu,
//      nie prawo natury: `u['q'] = last.q` oraz `Object.assign(u, { q, r })` zapisuja
//      DOKLADNIE to samo pole i sa dla wzorca kropkowego niewidzialne. Bez tego bloku
//      piate miejsce napisane w jednej z tych dwoch konwencji powstaloby rownie
//      niezauwazenie jak czwarte -- czyli inwariant chronilby dzien dzisiejszy zamiast
//      przyszlosci, ktora jest jego jedynym powodem istnienia.
// ---------------------------------------------------------------------------
console.log('\n[1c] WZORCE POSREDNIE -- notacja nawiasowa i Object.assign');

const trafieniaNawiasowe = [];
const trafieniaObjectAssign = [];
const trafieniaZlozone = [];
for (const abs of plikiSrc) {
  const rel = 'src/' + path.relative(SRC_DIR, abs).split(path.sep).join('/');
  const tresc = fs.readFileSync(abs, 'utf8');
  for (const t of skanujNawiasowe(rel, tresc)) trafieniaNawiasowe.push(t);
  for (const t of skanujObjectAssign(rel, tresc)) trafieniaObjectAssign.push(t);
  for (const t of skanujZlozone(rel, tresc)) trafieniaZlozone.push(t);
}

const nawiasoweNieznane = trafieniaNawiasowe.filter(
  (t) => !indeksNawiasowych.has(klucz(t.plik, t.tekst, t.nr)),
);
assert(nawiasoweNieznane.length === 0,
  "[1c] ZERO nieuzasadnionych zapisow notacja nawiasowa (`['q'] =` / `['r'] =`) w gra/src"
  + ' -- nowy zapis tej postaci to nowe miejsce przemieszczenia, sklasyfikuj albo domknij odkryciem',
  nawiasoweNieznane.map((t) => t.plik + ':' + t.linia + ' ' + t.tekst));

const nawiasoweUzyte = new Set(trafieniaNawiasowe.map((t) => klucz(t.plik, t.tekst, t.nr)));
const nawiasoweMartwe = DOZWOLONE_NAWIASOWE.filter(
  (w) => !nawiasoweUzyte.has(klucz(w.plik, w.tekst, w.nr)),
);
assert(nawiasoweMartwe.length === 0,
  '[1c] whitelist notacji nawiasowej nie zawiera MARTWYCH wpisow',
  nawiasoweMartwe.map((w) => w.plik + ' ' + w.tekst));

assert(DOZWOLONE_NAWIASOWE.every((w) => typeof w.uzasadnienie === 'string' && w.uzasadnienie.length >= 4),
  '[1c] kazdy wpis whitelisty nawiasowej ma niepuste uzasadnienie');

assert(trafieniaNawiasowe.length >= DOZWOLONE_NAWIASOWE.length,
  '[1c] sanity: skaner nawiasowy widzi co najmniej tyle trafien, ile ma whitelist'
  + ' (dzis 6: 4x render/cities.ts + 2x manualBattle.ts) -- asercja wyzej nie jest pusta ani slepa',
  trafieniaNawiasowe.length);

const objectAssignPodejrzane = trafieniaObjectAssign.filter(
  (t) => !RE_OBJECT_ASSIGN_STYL.test(t.arg) && !indeksObjectAssign.has(klucz(t.plik, t.arg, 1)),
);
assert(objectAssignPodejrzane.length === 0,
  '[1c] ZERO wywolan `Object.assign(cel, ...)` z celem innym niz `*.style` w gra/src'
  + ' -- `Object.assign(u, { q, r })` zapisuje pozycje jednostki niewidocznie dla wzorca `.q =`',
  objectAssignPodejrzane.map((t) => t.plik + ':' + t.linia + ' Object.assign(' + t.arg + ', ...'));

assert(trafieniaZlozone.length === 0,
  '[1c] ZERO przypisan ZLOZONYCH i inkrementacji na pozycji jednostki (`u.q += dq`, `u.q++`)'
  + ' w gra/src -- `u.q += 5` przesuwa o piec heksow tak samo jak `u.q = q0 + 5`',
  trafieniaZlozone.map((t) => t.plik + ':' + t.linia + ' ' + t.tekst));

assert(trafieniaObjectAssign.length >= 200,
  '[1c] sanity: skaner Object.assign widzi realna liczbe wywolan (>= 200; na bazie 20f9993d: 244)'
  + ' -- asercja wyzej nie jest pusta ani slepa',
  trafieniaObjectAssign.length);

// ---------------------------------------------------------------------------
// [2] OKNO ODKRYCIA -- detektor mutacji (Tryb trzeci dispatchu).
//     Kazdy zapis klasy WIELOHEKS-ODKRYWA w main.ts musi miec w sasiedztwie
//     wywolanie odkrycia wzdluz sciezki. Usuniecie odkrycia przy KTORYMKOLWIEK
//     z trzech miejsc czerwieni ten blok.
// ---------------------------------------------------------------------------
console.log('\n[2] OKNO ODKRYCIA -- kazde miejsce WIELOHEKS-ODKRYWA w main.ts domkniete odkryciem');

const OKNO_PRZED = 5;
const OKNO_PO = 45;
const RE_ODKRYCIE = /computeVisibleAlongPath\(|revealAlongPathForStack\(/;

const mainAbs = path.join(GRA_ROOT, MAIN_TS);
const mainLinie = fs.readFileSync(mainAbs, 'utf8').split('\n');

const wieloheks = wszystkieTrafienia.filter((t) => {
  const w = indeksKlasyfikacji.get(klucz(t.plik, t.tekst, t.nr));
  return t.plik === MAIN_TS && w && w.klasa === 'WIELOHEKS-ODKRYWA';
});

assert(wieloheks.length === 6,
  '[2] sanity: dokladnie 6 zapisow (3 miejsca x .q + .r) klasy WIELOHEKS-ODKRYWA w main.ts'
  + ' -- asercja nizej nie jest pusta ani slepa',
  wieloheks.length);

const bezOdkrycia = [];
for (const t of wieloheks) {
  const od = Math.max(0, t.linia - 1 - OKNO_PRZED);
  const doL = Math.min(mainLinie.length, t.linia - 1 + OKNO_PO);
  const okno = mainLinie.slice(od, doL).join('\n');
  if (!RE_ODKRYCIE.test(okno)) bezOdkrycia.push(t.plik + ':' + t.linia + ' ' + t.tekst);
}
assert(bezOdkrycia.length === 0,
  '[2] kazdy zapis WIELOHEKS-ODKRYWA ma wywolanie odkrycia wzdluz sciezki w oknie -'
  + OKNO_PRZED + '/+' + OKNO_PO + ' linii',
  bezOdkrycia);

const mainSrc = mainLinie.join('\n');
assert(/import\s*\{[^}]*\bcomputeVisibleAlongPath\b[^}]*\}\s*from\s*'\.\/game\/visibility'/.test(mainSrc),
  '[2] `computeVisibleAlongPath` zaimportowane z ./game/visibility w main.ts');

// ---------------------------------------------------------------------------
// [3] CZWARTE MIEJSCE -- hak `onAfterStep` przy runScoutsAutoExplore odkrywa.
// ---------------------------------------------------------------------------
console.log('\n[3] CZWARTE MIEJSCE -- auto-eksploracja zwiadowcy odkrywa po KAZDYM kroku');

const wywolanieScout = mainSrc.match(/runScoutsAutoExplore\(([\s\S]*?)\n\s{10}\);/);
assert(wywolanieScout !== null,
  '[3] wywolanie `runScoutsAutoExplore(` znalezione w main.ts');
if (wywolanieScout) {
  assert(RE_ODKRYCIE.test(wywolanieScout[1]),
    '[3] hak `onAfterStep` przekazany do runScoutsAutoExplore odkrywa mgle (revealAlongPathForStack'
    + '/computeVisibleAlongPath) -- bez tego `refreshFog()` po petli odkrywa TYLKO pozycje koncowa',
    { arg: wywolanieScout[1].slice(0, 400) });
}

// Sama obecnosc `refreshFog()` po petli NIE wystarcza -- to wlasnie byl bug.
assert(/revealAlongPathForStack\(\[u\], \[\{ q: u\.q, r: u\.r \}\]\)/.test(mainSrc),
  '[3] odkrycie per-krok zwiadowcy woła helper dla BIEZACEGO heksu kroku');

// ---------------------------------------------------------------------------
// [4] INTEGRALNOSC HELPERA -- helper nie moze zostac wydrazony (pusty korpus
//     przeszedlby bloki [2]/[3] po samej nazwie).
// ---------------------------------------------------------------------------
console.log('\n[4] INTEGRALNOSC helpera revealAlongPathForStack');

const helper = mainSrc.match(/function revealAlongPathForStack\([\s\S]*?\n {4}\}/);
assert(helper !== null, '[4] definicja `revealAlongPathForStack` znaleziona w main.ts');
if (helper) {
  assert(/addExplored\(explored, computeVisibleAlongPath\(pathHexes, map, unitSight\(su\)\)\)/.test(helper[0]),
    '[4] korpus helpera faktycznie dopisuje do `explored` unie widocznosci z CALEJ sciezki',
    { korpus: helper[0] });
  assert(/for \(const su of stack\)/.test(helper[0]),
    '[4] helper liczy widocznosc PER JEDNOSTKA stosu (rozny unitSight)');
}

// Trzy istniejace wywolania inline pozostaja NIETKNIETE (kontrakt bramek
// mgla-odkrycie-wzdluz-sciezki-test.cjs i mgla-teleport-koniec-tury-test.cjs).
assert(/addExplored\(explored, computeVisibleAlongPath\(result\.movePath, map, unitSight\(su\)\)\)/.test(mainSrc),
  '[4] miejsce 1/3 (applyMarchSegmentInstant) nietkniete');
assert(/addExplored\(explored, computeVisibleAlongPath\(anim\.pathHexes, map, unitSight\(su\)\)\)/.test(mainSrc),
  '[4] miejsce 2/3 (koniec tury w animacji) nietkniete');
// Uwaga: `computeVisibleAlongPath(pathHexes, ...)` wystepuje DWA razy — w korpusie
// helpera i w miejscu 3/3 (renderLoop). Liczymy wystapienia, inaczej usuniecie
// jednego z nich bylo by maskowane przez drugie.
const wystapienPathHexes = (mainSrc.match(
  /addExplored\(explored, computeVisibleAlongPath\(pathHexes, map, unitSight\(su\)\)\)/g,
) || []).length;
assert(wystapienPathHexes === 2,
  '[4] miejsce 3/3 (koniec animacji, renderLoop) ORAZ korpus helpera — oba obecne'
  + ' (2 wystapienia wzorca `computeVisibleAlongPath(pathHexes, ...)`)',
  wystapienPathHexes);

// ---------------------------------------------------------------------------
// [5] NIETAUTOLOGICZNOSC -- ten sam skaner na zrodle SYNTETYCZNYM.
//     Gdyby `skanujZrodlo` bylo slepe, blok [1] przechodzilby zawsze.
// ---------------------------------------------------------------------------
console.log('\n[5] NIETAUTOLOGICZNOSC skanera na zrodle syntetycznym');

const SYNTET_NOWE_MIEJSCE = [
  'function jakisNowyRuch(u, path) {',
  '  const last = path[path.length - 1];',
  '  u.q = last.q;',
  '  u.r = last.r;',
  '  refreshFog();',
  '}',
].join('\n');
const trafSyntet = skanujZrodlo('src/syntetyczny.ts', SYNTET_NOWE_MIEJSCE);
assert(trafSyntet.length === 2,
  '[5] skaner wykrywa NOWE, nieuzasadnione miejsce przemieszczenia (u.q/u.r) w zrodle syntetycznym',
  trafSyntet);
assert(trafSyntet.every((t) => !indeksKlasyfikacji.has(klucz(t.plik, t.tekst, t.nr))),
  '[5] takie trafienie NIE jest na whiteliscie -> blok [1] bylby czerwony (piate miejsce wykryte)');

const SYNTET_KOMENTARZ = [
  '// u.q = last.q;   <- to jest komentarz, nie kod',
  ' * u.r = last.r;',
  '/* u.q = 1; */',
].join('\n');
assert(skanujZrodlo('src/syntetyczny2.ts', SYNTET_KOMENTARZ).length === 0,
  '[5] skaner NIE zglasza zapisow pozycji z calych linii komentarza (brak falszywych alarmow)');

const SYNTET_POROWNANIE = 'if (u.q == last.q && u.r === last.r) return;';
assert(skanujZrodlo('src/syntetyczny3.ts', SYNTET_POROWNANIE).length === 0,
  '[5] skaner NIE myli porownania (`==`, `===`) z przypisaniem');

const SYNTET_DWA_W_LINII = 'ru.q = col; ru.r = row;';
assert(skanujZrodlo('src/syntetyczny4.ts', SYNTET_DWA_W_LINII).length === 1,
  '[5] dwa przypisania w jednej linii to JEDNO trafienie (klucz = tekst linii) -- zgodne z whitelista');

// --- [5c] nietautologicznosc SKANEROW POSREDNICH (blok [1c]) ---
// Dokladnie te dwa ksztalty piatego miejsca, ktore przechodzily przez sam wzorzec kropkowy.

const SYNTET_NAWIASOWE = [
  'function jakisNowyRuch2(u, path) {',
  '  const last = path[path.length - 1];',
  "  u['q'] = last.q;",
  '  u["r"] = last.r;',
  '  refreshFog();',
  '}',
].join('\n');
const trafNawiasSyntet = skanujNawiasowe('src/syntetyczny5.ts', SYNTET_NAWIASOWE);
assert(trafNawiasSyntet.length === 2,
  "[5] skaner nawiasowy wykrywa NOWE miejsce zapisane jako u['q'] / u[\"r\"] (oba cudzyslowy)",
  trafNawiasSyntet);
assert(trafNawiasSyntet.every((t) => !indeksNawiasowych.has(klucz(t.plik, t.tekst, t.nr))),
  '[5] takie trafienie NIE jest na whiteliscie nawiasowej -> blok [1c] bylby czerwony');

assert(skanujNawiasowe('src/syntetyczny6.ts', "if (u['q'] === last.q) return;").length === 0,
  '[5] skaner nawiasowy NIE myli porownania z przypisaniem');
assert(skanujNawiasowe('src/syntetyczny7.ts', "const v = u['queue'] = 1;").length === 0,
  "[5] skaner nawiasowy NIE lapie innych pol o nazwie zaczynajacej sie na q/r (`['queue']`)");

const SYNTET_OBJECT_ASSIGN = 'Object.assign(u, { q: last.q, r: last.r });';
const trafOaSyntet = skanujObjectAssign('src/syntetyczny8.ts', SYNTET_OBJECT_ASSIGN);
assert(trafOaSyntet.length === 1 && trafOaSyntet[0].arg === 'u',
  '[5] skaner Object.assign wyciaga pierwszy argument (`u`) z `Object.assign(u, { q, r })`',
  trafOaSyntet);
assert(!RE_OBJECT_ASSIGN_STYL.test(trafOaSyntet[0] ? trafOaSyntet[0].arg : ''),
  '[5] taki cel NIE jest `*.style` -> blok [1c] bylby czerwony (piate miejsce przez Object.assign)');

const trafOaStyl = skanujObjectAssign('src/syntetyczny9.ts', "Object.assign(el.style, { top: '0' });");
assert(trafOaStyl.length === 1 && RE_OBJECT_ASSIGN_STYL.test(trafOaStyl[0].arg),
  '[5] `Object.assign(el.style, ...)` jest rozpoznane jako dozwolone (brak falszywych alarmow)');

assert(skanujZlozone('src/syntetyczny11.ts', '  u.q += dq; u.r -= dr;').length === 1,
  '[5] skaner zlozony wykrywa przypisanie zlozone (`u.q += dq`)');
assert(skanujZlozone('src/syntetyczny12.ts', '  u.q++; --u.r;').length === 1,
  '[5] skaner zlozony wykrywa inkrementacje/dekrementacje (`u.q++`, `--u.r`)');
assert(skanujZlozone('src/syntetyczny13.ts', 'if (u.q >= a && u.r <= b && u.q !== c) return;').length === 0,
  '[5] skaner zlozony NIE myli operatorow POROWNANIA (`>=`, `<=`, `!==`) z przypisaniem');

const trafOaZagniezdz = skanujObjectAssign('src/syntetyczny10.ts', 'Object.assign({ a: 1, b: 2 }, src);');
assert(trafOaZagniezdz.length === 1 && trafOaZagniezdz[0].arg === '{ a: 1, b: 2 }',
  '[5] przecinek WEWNATRZ pierwszego argumentu go nie ucina (wycinanie z uwzglednieniem zagniezdzen)',
  trafOaZagniezdz);

console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
