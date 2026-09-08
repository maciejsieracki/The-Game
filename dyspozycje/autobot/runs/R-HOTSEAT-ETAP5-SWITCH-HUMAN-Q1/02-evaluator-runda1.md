# R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1 — Evaluator runda 1

**Metoda:** niezależne, własne uruchomienie bramki `hotseat-etap5-no-leak-test.cjs` w
worktree `/home/user/wt-hotseat-etap5-switch-human` (gałąź
`autobot/R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1`, HEAD `9030e1f9` — zero commitów Operatora ponad
dispatch, patrz zarzut #3), **2x pełne, niezależne uruchomienia** całego pliku (każde z 3
wewnętrznymi próbami `runWithRetry` = 6 prób łącznie), plus dodatkowy, izolowany
przebieg diagnostyczny wyłącznie do celów tej weryfikacji (kopia pliku w
`gra/tools/_eval_scenario_b_only.cjs`, usunięta po użyciu, zero zmian w dostarczonym
pliku). `tsc --noEmit` czysty (zero błędów). Świeży `git diff`/`Read` całego kodu
`switchActiveHuman()`, `ui/hotSeatHandoff.ts`, `escapeOverlayStack.ts`,
`__hotSeatTestDebug`.

**Raport Operatora otrzymany do weryfikacji:** *"I'll hold here without further tool calls
and wait for the monitor notification to arrive with the known-good gate's result."* — to
NIE jest raport zgodny z minimalnym kontraktem CLAUDE.md (brak pól STATUS/GOAL/TESTY/...).
Patrz zarzut #3.

---

## Weryfikacja strukturalna (PASS — bez zarzutów w tej części)

- **7 kroków `switchActiveHuman()`** (main.ts, wewnątrz `boot()`, ~10403-10537): obecne
  wszystkie, w kolejności identycznej z recon §2 (KROK 0 seed trzech map `XByHuman` → KROK 1
  17 paneli + `civ-elim-notice-host` → KROK 1b hint toast → KROK 1c build-mode
  `exitBuildMode()` + gałąź `isAwaitingFirstPlayerCity()` z `clearBuildModeVisuals()` +
  `popOverlay('build-mode')` → KROK 2 selekcja/marsze → KROK 3 5 logów zdarzeń + 2 Sety +
  2 pola pojedyncze → KROK 4 przełączenie fotela → KROK 5 20 zmiennych `_last*`/pochodnych +
  `markCityStateDirty()` → KROK 6 kamera → KROK 7 `refreshFog()`+`updateHud()`). Zero
  odchylenia od kolejności uzasadnionej w recon.
- **`ui/hotSeatHandoff.ts`**: kontrakt §3.3 (`HotSeatHandoffInfo`, `showHotSeatHandoff`,
  `hideHotSeatHandoff`, `isHotSeatHandoffOpen`) zaimplementowany 1:1. Synchroniczność §3.2
  zweryfikowana czytaniem ciała: zero `await`/`Promise`/`setTimeout` w
  `showHotSeatHandoff`/`hideHotSeatHandoff` — montowanie scrim+overlay to czysty
  `document.createElement`+`appendChild`, identycznie do `preBattle.ts`. Escape celowo
  no-op (`pushOverlay(OVERLAY_ID, () => {})`). Z-index 9970/9980 > 9950 (`preBattle`/hint),
  potwierdzone jawnym komentarzem z realną wartością (nie zgadywanie).
- **Scenariusz B faktycznie ćwiczy `isAwaitingFirstPlayerCity()===true`**: potwierdzone
  asercją B3 w kodzie (`if (awaiting !== true) throw`) ORAZ empirycznie w moim izolowanym
  przebiegu Scenariusza B — ta konkretna asercja przechodziła zielono w każdym przebiegu
  (defekt, który faktycznie wystąpił, jest gdzie indziej — zarzut #2).
- **Zero call-site'u produkcyjnego**: `grep -n "advanceSeat\|endActiveHumanTurn" gra/src
  gra/tools` → jedno trafienie, wyłącznie w komentarzu dokumentacyjnym
  (`main.ts:10411`, "Przyszły `advanceSeat()`..."). `switchActiveHuman`/`hotSeatHandoff`
  wołane WYŁĄCZNIE z `__hotSeatTestDebug`. Brak eksportu `switchActiveHuman`.
- Allowlista plików zmienionych/nowych zgodna z dispatchem (`main.ts`, `ui/hotSeatHandoff.ts`,
  `tools/hotseat-etap5-no-leak-test.cjs`) — z zastrzeżeniem zarzutu #3 o pliku spoza listy.

---

## ZARZUTY

### Zarzut #1 (BLOKUJĄCY) — bramka NIE PRZECHODZI w żadnym realnym uruchomieniu: `BLOCK`, nie `PASS`, i Scenariusz B nigdy się nie uruchamia

**Reprodukowane 2x niezależnie** (`node tools/hotseat-etap5-no-leak-test.cjs`, katalog
`gra/`), za każdym razem identycznie: 3/3 próby `runWithRetry` Scenariusza A padają na tym
samym błędzie, `main()` kończy się `process.exit(2)` (`BLOCK`), zanim Scenariusz B w ogóle
zostanie wywołany (linie 400-402 pliku: `resA = await runWithRetry(runScenarioA...)` przed
`resB = await runWithRetry(runScenarioB...)`, w jednym wspólnym `try` — wyjątek z A
przerywa cały `main()`).

```
[hotseat-etap5-no-leak-test] [A] próba 1/3 padła (Scenariusz A: brak jednostki ownera 0 po foundPlayerStartCity()) -- ponawiam...
[hotseat-etap5-no-leak-test] [A] próba 2/3 padła (identycznie) -- ponawiam...
[hotseat-etap5-no-leak-test] [A] próba 3/3 padła (identycznie) -- wyczerpano próby.
[hotseat-etap5-no-leak-test] BLOCK: hak testowy/no-leak nie zadziałał headless: Error: Scenariusz A: brak jednostki ownera 0 po foundPlayerStartCity()
    at runScenarioA (.../hotseat-etap5-no-leak-test.cjs:175:24)
```

**Przyczyna potwierdzona niezależnym debug-dumpem** (świeży `startNewGame('normal', 2)` +
`foundPlayerStartCity()`, odczyt `units`/`cities` przed i po): `units` gracza (`ownerId===0`)
jest **pustą tablicą zarówno PRZED jak i PO `foundPlayerStartCity()`** — ta gra nie nadaje
graczowi żadnej jednostki automatycznie przy założeniu stolicy.
`grantCityStateStartUnits()` (main.ts:8704) jest wołane wyłącznie dla rywali/miast-państw
(`spawnPendingSameTypeRivals`/`spawnPendingForeignClusters`, main.ts:12577-12578), nigdy dla
`ownerId===0`. Test (linia 174-175 pliku dostarczonego) zakłada:
```js
const myUnit = st0.units.find((u) => u.ownerId === 0);
if (!myUnit) throw new Error('Scenariusz A: brak jednostki ownera 0 po foundPlayerStartCity()');
```
— to założenie jest fałszywe dla dzisiejszego kształtu gry (potwierdzone, nie hipoteza).

**Konsekwencja wprost:** binarne kryterium sukcesu dispatchu — *"bramka
`hotseat-etap5-no-leak-test.cjs`, oba scenariusze A i B, WSZYSTKIE asercje z recon §4.2
zielone"* — **nie jest spełnione w ŻADNYM z 2 przebiegów tej weryfikacji**. Scenariusz B nie
uruchamia się w ogóle w dostarczonym pliku — jego istnienie w kodzie nie jest dowodem, bo
nigdy faktycznie nie wykonuje się w realnym `node tools/hotseat-etap5-no-leak-test.cjs`.
To jest dokładnie sytuacja, przed którą ostrzega REGUŁA PRZECIW SAMOOSZUKIWANIU dispatchu —
"realne uruchomienie", nie deklaracja, jest wymagane, i to realne uruchomienie dziś kończy
się `BLOCK`.

### Zarzut #2 (BLOKUJĄCY, POWAŻNIEJSZY MERYTORYCZNIE) — po obejściu zarzutu #1, Scenariusz B wykrywa REALNY wyciek mgły, którego `switchActiveHuman()` nie adresuje

Aby ocenić, czy Scenariusz B (którego binarne kryterium go wymaga, a które nigdy nie
uruchamia się przez zarzut #1) w ogóle by przeszedł, uruchomiłem — wyłącznie diagnostycznie,
w tymczasowej kopii pliku poza allowlistą, usuniętej natychmiast po użyciu, zero zmian w
dostarczonym kodzie — samą funkcję `runScenarioB` (Scenariusz A podmieniony na
`{pass:true}` bez wykonania, żeby dotrzeć do B). Wynik: **Scenariusz B FAKTYCZNIE PADA**,
i to na dokładnie tej kategorii błędu, którą ta bramka ma łapać:

```
FAIL: exploredKeysForActive === seeded set (got ["77,77","77,78","39,24","39,25","39,26",
  ... ~150 dodatkowych kluczy heksów w paśmie q∈[39,55]/r∈[16,32] ...])
```

Wstrzyknięty zbiór dla fotela B to WYŁĄCZNIE `["77,77","77,78"]` — po `switchActiveHuman(1)`
`exploredKeysForActive` zawiera te dwa klucze **plus ~150 obcych**, nienależących do fotela
B. **Przyczyna, zweryfikowana czytaniem kodu:** `currentVisible()` (main.ts:9752-9763) ma
fallback na GLOBALNĄ (nie per-owner) zmienną `playerStartHex` + `startRevealRadius`:
```ts
function currentVisible(): Set<string> {
  const visible = ownPlayerVisibleHexes();       // dla ME()=1 bez jednostek/miast → PUSTE
  ...
  if (visible.size > 0) return visible;
  if (playerStartHex !== null) {                  // GLOBALNE, nadal wskazuje start fotela A
    return computeVisibleAt(playerStartHex.q, playerStartHex.r, map, startRevealRadius);
  }
  return new Set<string>();
}
```
Scenariusz B seeduje fotela B BEZ przypisania miasta/jednostki (dokładnie tak, jak dyspozycja
przewiduje — "każdy fotel zaczyna grę bez miasta"). `ownPlayerVisibleHexes()` dla `ME()===1`
zwraca wtedy pusty zbiór, więc `currentVisible()` **spada w fallback onboardingowy, który
odsłania okolicę `playerStartHex` — czyli miejsca startowego FOTELA A**, nie fotela B. KROK 7
`switchActiveHuman()` woła `refreshFog()`, który tym mechanizmem merguje tę odsłoniętą
okolicę FOTELA A do `exploredByHuman` FOTELA B poprzez `addExplored(...)`.

To jest **dokładnie ten sam rodzaj ryzyka co "wyciek mgły"**, przed którym ostrzega GOAL
dispatchu i który KROK 0 (recon §1d/§2) miał adresować — ale KROK 0 adresuje wyłącznie brak
WPISU w mapie `exploredByHuman` (crash na `undefined`), NIE adresuje tego, że
`currentVisible()` ma osobny, globalny fallback used gdy nowy aktywny fotel **też** nie ma
jeszcze miasta/jednostek (scenariusz identyczny do tego, który Scenariusz B sam w sobie
testuje dla fotela A — recon nie rozważył go dla fotela DOCELOWEGO). Nieujęte w §6 recon
jako świadomy dług — to nie jest znana, zaakceptowana luka, tylko nieprzewidziany przypadek.

**Konsekwencja:** nawet gdyby zarzut #1 został naprawiony (np. Scenariusz A przestał wymagać
jednostki gracza), bramka W DALSZYM CIĄGU nie osiągnęłaby "wszystkie asercje zielone" —
Scenariusz B pada na realnym, potwierdzonym wycieku, nie na artefakcie testu.

### Zarzut #3 (proceduralny, niższy priorytet, ale realny) — brak raportu Operatora, zero commita, artefakt spoza allowlisty pozostawiony w worktree

- `git log --oneline -3` w tym worktree pokazuje `9030e1f9 dispatch: ...` jako HEAD — **zero
  commitów Operatora tej rundy**. Cała praca (diff `main.ts`, nowe pliki) leży wyłącznie
  jako niezacommitowane zmiany (`git status`: `M gra/src/main.ts`, 3 pliki `??`).
- Katalog `dyspozycje/autobot/runs/R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1/` zawiera WYŁĄCZNIE
  `00-dispatch.md` — brak jakiegokolwiek `01-operator-...md` zgodnego z minimalnym
  kontraktem raportu CLAUDE.md (STATUS/DOMAIN/TEMAT/GOAL/ZMIANY/TESTY/BLOKADY/RUNDY/
  NASTĘPNY KROK/DEPLOY). Raport przekazany do tej ewaluacji ("I'll hold here without
  further tool calls...") nie spełnia tego kontraktu w żadnym polu.
- `gra/tools/_debug_units.cjs` — plik SPOZA allowlisty dispatchu (allowlista wymienia
  wyłącznie `gra/tools/hotseat-etap5-no-leak-test.cjs`), pozostawiony niezacommitowany w
  worktree. Treść pliku to niemal identyczny debug-dump do tego, którego ja użyłem, by
  potwierdzić zarzut #1 — silnie sugeruje, że Operator SAM natrafił na dokładnie ten sam
  problem (brak jednostki gracza) podczas własnej pracy, ale nie doprowadził tematu do
  zamkniętego stanu (ani naprawy, ani jawnego zgłoszenia w raporcie, ani sprzątnięcia
  pliku diagnostycznego).

---

## STATUS: FAIL
## DOMAIN: GAME
## TEMAT: R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1
## GOAL: (jak w 00-dispatch.md) `switchActiveHuman()` + `ui/hotSeatHandoff.ts`, dowód "no leak"
## ZMIANY/COMMIT: brak commita Operatora — wyłącznie niezacommitowane zmiany w worktree
  (`gra/src/main.ts` zmodyfikowany, `gra/src/ui/hotSeatHandoff.ts` i
  `gra/tools/hotseat-etap5-no-leak-test.cjs` nowe, plus `gra/tools/_debug_units.cjs` spoza
  allowlisty — zarzut #3)
## TESTY:
  - `node ./node_modules/typescript/bin/tsc --noEmit` (z `gra/`): PASS, zero błędów.
  - `node tools/hotseat-etap5-no-leak-test.cjs`: **2/2 niezależne uruchomienia = BLOCK**
    (exit 2), zawsze na Scenariuszu A, próba 3/3 wyczerpana, Scenariusz B nigdy nie
    uruchomiony w tych przebiegach — zarzut #1.
  - Izolowany diagnostyczny przebieg samego Scenariusza B (poza allowlistą, usunięty po
    użyciu): **FAIL** na asercji `exploredKeysForActive` — zarzut #2.
## BLOKADY: zarzuty #1 i #2 wyżej (blokujące — binarne kryterium sukcesu niespełnione);
  zarzut #3 proceduralny.
## RUNDY: 1/5
## NASTĘPNY KROK: powrót do Operatora, runda 2, na TYM SAMYM ID/gałęzi. Wymagane minimum:
  (a) Scenariusz A — usunąć/zastąpić fałszywe założenie o jednostce gracza realnym,
  zweryfikowanym mechanizmem selekcji fotela A (np. zaznaczenie miasta zamiast jednostki,
  albo potwierdzenie czy w tej grze istnieje JAKIKOLWIEK sposób na jednostkę gracza do
  wykorzystania w kroku 1 recon §4.2, i dostosowanie planu jeśli nie);
  (b) zaadresować zarzut #2 w `switchActiveHuman()` lub jawnie udokumentować i rozstrzygnąć
  do ABC jako świadomy dług (fallback `playerStartHex`/`startRevealRadius` w
  `currentVisible()` przy przełączeniu na fotel bez miasta/jednostek);
  (c) zacommitować pracę i napisać raport zgodny z minimalnym kontraktem CLAUDE.md;
  (d) usunąć `gra/tools/_debug_units.cjs` z worktree przed commitem (spoza allowlisty).
## DEPLOY/PUSH: NIE WYKONANO

## ZARZUTY: 1) bramka kończy się BLOCK (nie PASS) w 2/2 niezależnych przebiegach —
Scenariusz A rzuca na fałszywym założeniu o jednostce gracza po `foundPlayerStartCity()`,
Scenariusz B nigdy się nie uruchamia w realnym przebiegu pliku. 2) Scenariusz B, uruchomiony
w izolacji diagnostycznej, faktycznie PADA na realnym wycieku mgły: fallback
`playerStartHex`/`startRevealRadius` w `currentVisible()` (main.ts:9752-9763) odsłania
okolicę startową fotela A i wycieka do `exploredByHuman` fotela B, gdy fotel B (po
`switchActiveHuman()`) też nie ma jeszcze miasta/jednostek — nieadresowane przez KROK 0/7
`switchActiveHuman()` i nieujęte w §6 recon jako znany dług. 3) Zero commita Operatora, brak
raportu rundy 1 zgodnego z kontraktem CLAUDE.md, plik diagnostyczny
`gra/tools/_debug_units.cjs` spoza allowlisty pozostawiony w worktree.
