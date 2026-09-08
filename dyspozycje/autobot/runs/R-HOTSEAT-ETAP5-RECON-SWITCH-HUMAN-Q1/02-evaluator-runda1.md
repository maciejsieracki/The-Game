# R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1 — Evaluator runda 1

**Metoda:** świeży `grep -n`/`Read` całego cytowanego zakresu `gra/src/main.ts` (36186
linii dziś), `gra/src/ui/sidePanelHud.ts`, `gra/src/ui/preBattle.ts`,
`gra/src/ui/escapeOverlayStack.ts`, `gra/tools/hotseat-etap4-noop-test.cjs`,
`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` (§C, §D, §A5, §A6, §A8-A10, §B2, §B3) oraz
`00-dispatch.md`, w worktree `/home/user/wt-hotseat-etap5-recon`, HEAD `3214a301`.
Zweryfikowano NIEZALEŻNIE, bez ufania cytatom Operatora, **każdy** numer linii i **każdy**
cytat kodu w `01-operator-runda1-analiza.md` (poniżej lista sprawdzonych pozycji), a
dodatkowo poszukano globalnych struktur stanu wpływających na wyciek informacji, których
dokument NIE wymienia.

## Werdykt skrócony

Dokument Operatora jest **wyjątkowo precyzyjny** — z ok. 40 zweryfikowanych osobno cytatów
kodu/numerów linii (m.in. `triggerPlayerEndTurn` @ 28643, `refreshLiveEmpireRatesUnsafe` @
17077 z literałami `0` @ 17078/17146/17149-17150, `checkVeteranEnemyFirstEncounter` @
10186 z hardkodem @ 10193, `refreshFog` @ 10134-10175, `exploredByHuman`/`playerStateByHuman`/
`pracaPoolByHuman` @ 10375/10387/10395, `SidePanelEvent` interfejs @ 31-53 w
`sidePanelHud.ts`, `showPreBattle` @ 209-258 w `preBattle.ts`, `__sidePanelLinkTestDebug`
@ 21987 z `seedEvents`@21987-21994/`openViews`@22012-22020/`closeAll`@22026-22033,
`focusCameraOnOwnerCapital` @ 26316, `markCityStateDirty` @ 2363 z dokładną treścią,
wszystkie 10 nazw log-tablic z dokładnymi liniami 8152/9561/9572/13983/13988/14013/
14020/14021/14023/14054, cytaty z planu §D/§B2/§A5 — **zero rozbieżności znalezione**.
Korekta §0 (Etap 4a NIE zintegrowany z main tego worktree) jest potwierdzona niezależnie:
`git merge-base --is-ancestor ac5c2c09 HEAD` zwraca kod wyjścia 1 (NIE), a
`grep -rn "runWorldEndTurn" gra/src` daje zero trafień.

Mimo tej precyzji, **binarne kryterium sukcesu tej rundy** ("żadnego pominiętego globalnego
cache'a wpływającego na widoczność informacji") **nie jest w pełni spełnione** — świeże
przeszukanie main.ts poza listą z planu i poza listą Operatora znalazło **dwie kolejne**
globalne struktury stanu, obie bez właściciela (owner-agnostyczne), obie zdolne przenieść
informację/akcję z fotela odchodzącego na fotel przychodzący, i **obie nieobecne w §1
(inwentaryzacja), §2 (projekt `switchActiveHuman()`) i §4 (plan testu „no leak")**.

## ZARZUTY

### Zarzut 1 — globalny toast `#civ-hint-toast` (`hintToast`/`showHintMessage`/`hintOverrideTimer`) pominięty w całości

**Świeża weryfikacja:**
```
grep -n "const hintToast = document.createElement" gra/src/main.ts → 1751 (deklaracja),
  document.documentElement.appendChild(hintToast) @ 1749? -- dokladnie: deklaracja 1751-1760,
  appendChild @ 1760(+/-1), JEDEN, globalny, module-scope DOM element.
function showHintMessage(msg, durationMs) @ 13141-13178:
  - hintToast.innerHTML = msg;              (13150)
  - hintToast.style.display = 'block';      (13151)
  - hintOverrideTimer = setTimeout(() => { hintToast.style.display = 'none'; ... }, durationMs) (13175-13177)
grep -n "showHintMessage(" gra/src/main.ts | wc -l → 279 wywołań w całym pliku.
grep -n "hintToast.style.display" gra/src/main.ts → WYŁĄCZNIE te dwie linie (13151 'block',
  13176 'none' wewnątrz timeoutu). Brak jakiejkolwiek funkcji `hideHintMessage()`/
  `clearHint()` — jedyny sposób ukrycia to upłynięcie własnego, samo-czyszczącego się timera.
```
`showHintMessage()` jest UŻYWANE w 279 miejscach jako główny kanał komunikatów gry —
błędy budowy, rekrutacji, ukończenie cudu, odkrycia, wynik walki („Ukończono: <b>${w.nazwa}</b>
@ ${q},${r}"` @ 4157, `focusCameraOnOwnerCapital` @ 26326 pokazuje `Stolica: ${city.name}`
po SKOKU KAMERY — czyli DOKŁADNIE ten sam KROK 6 projektu `switchActiveHuman()` z §2
dokumentu Operatora wywoła `showHintMessage` z treścią specyficzną dla fotela, na który się
przełącza, NADPISUJĄC ewentualny wcześniejszy, jeszcze niewygasły toast fotela odchodzącego
— ale odwrotny scenariusz jest gorszy: jeśli fotel A wywoła `showHintMessage(...)` (np. wynik
ostatniej akcji przed handoffem, `durationMs` domyślnie 3000-4500ms) i handoff nastąpi ZANIM
timer wygaśnie, `hintToast` pozostaje `display:block` z TREŚCIĄ fotela A przez cały czas
trwania `hotSeatHandoff` overlaya — **dokument nigdzie nie projektuje ukrycia/wyczyszczenia
tego elementu w `switchActiveHuman()` (§2, brak w 7 krokach) ani w inwentaryzacji (§1a-e,
1e-bis) ani w asercjach testu „no leak" (§4.2 `snapshotVisibleState()` nie czyta
`hintToast.textContent`/`style.display`)**. Jedyna ochrona, na jaką dokument mógłby się
powołać — z-index overlaya handoffu wyższy niż `hintToast` (320/600/9950 w zależności od
kontekstu, linia 13174) — jest OMÓWIONA w §3.3 wyłącznie jako wymóg wobec WŁASNEGO
overlaya handoffu, nie jako argument o `hintToast`, i nie rozwiązuje przypadku, w którym
handoff już się ZAMKNĄŁ (`hideHotSeatHandoff()`), a timer fotela A jeszcze nie wygasł —
wtedy `hintToast` staje się widoczny fotelowi B z treścią fotela A, DOKŁADNIE tej samej
natury co ryzyko z planu §D3 ("Wyciek informacji poza mgłą"), tylko przez kanał, którego
dokument nie wymienia.

**Konsekwencja:** GOAL pkt 1 ("Zainwentaryzuj WSZYSTKIE źródła stanu") i binarne kryterium
sukcesu tej rundy nie są spełnione dla tego elementu — brak wpisu w §1, brak kroku w §2,
brak asercji w §4.

### Zarzut 2 — globalny „build mode"/„found city mode" (`buildModeOpen`, `foundCityMode`, `activeImprovementKey`, `activeWonderId`, ghost chip, `exitBuildMode()`) pominięty w całości — ryzyko WYŻSZE niż info-leak (przeniesienie AKCJI, nie tylko widoku)

**Świeża weryfikacja:**
```
let foundCityMode = false;                          @ 2513
let buildModeOpen = false;                          @ 11457
let activeImprovementKey: ImprovementKey | null = null; @ 11458
let activeWonderId: string | null = null;           @ 11459
function exitBuildMode(): void { ... }               @ 12456-12469
function isAwaitingFirstPlayerCity(): boolean {
  return computeAwaitingFirstPlayerCity(playerEverOwnedCity, cities);
}                                                     @ 9655-9657
```
Wszystkie cztery zmienne to **globalne, module-scope `let`, bez klucza właściciela** —
dokładnie ta sama kategoria co `selectedId`/`plannedMarches`, którą dokument Operatora
poprawnie identyfikuje w §1c jako wymagającą zamknięcia przy handoff — ale te cztery NIE
są nigdzie wymienione, ani w §1c, ani w liście 17 funkcji `hide*` w §1c (bo
`exitBuildMode` nie pasuje do wzorca nazw `hide[A-Za-z]+`, którym Operator filtrował grepa —
**dokładnie ten sam rodzaj ślepoty na nazwę, który sam dokument krytykuje w CLAUDE.md §0c
dla `grep 'STATUS: \*\*OTWARTE'` i który sam Operator poprawnie unika przy `_last*` w §1a
przez ręczne dopisanie `_pracaRateFreshFromEndTurn`/`_liveFoodBrutto` — ale nie zastosował
tej samej ostrożności do wzorca `hide*`**), ani w 7 krokach projektu `switchActiveHuman()`
w §2, ani w asercjach testu „no leak" w §4.2.

**Treść `exitBuildMode()` (przeczytana w całości, 12456-12469):**
```ts
function exitBuildMode(): void {
  if (isAwaitingFirstPlayerCity()) return;   // 12461 — GUARD, patrz niżej
  buildModeOpen = false;
  foundCityMode = false;
  activeImprovementKey = null;
  activeWonderId = null;
  clearBuildModeVisuals();
  refreshBuildApi();
  refreshBuildHighlight();
  refreshD1bHud();
  popOverlay('build-mode');
}
```
`exitBuildMode()` jest zarejestrowana na TYM SAMYM stosie `escapeOverlayStack`
(`pushOverlay('build-mode', () => exitBuildMode())` @ 12475), który dokument Operatora w
§3.1 słusznie rekomenduje dla `hotSeatHandoff.ts` — ale `switchActiveHuman()` (§2) nigdy jej
nie woła.

**Dlaczego to jest poważniejsze niż wyciek informacji:** jeśli fotel A jest w trakcie
umieszczania ulepszenia/cudu na mapie (`buildModeOpen=true`, `activeImprovementKey`/
`activeWonderId` ustawione, ghost chip śledzi kursor) w momencie handoffu, a
`switchActiveHuman()` nie wywołuje `exitBuildMode()`, to tryb budowy **pozostaje aktywny**
po przełączeniu na fotel B — **pierwsze kliknięcie fotela B na mapie może zostać
zinterpretowane jako potwierdzenie budowy zainicjowanej przez fotela A** (nie tylko
zobaczy cudzy stan, ale MOŻE WYKONAĆ cudzą, niedokończoną akcję jako własną). To wykracza
poza kategorię „wyciek info" z ryzyka planu §D3 wprost w kategorię „przejęcie kontroli nad
niedokończonym rozkazem poprzednika" — nowy, nieopisany w planie ani w recon rodzaj ryzyka.

**Pogłębienie — guard `isAwaitingFirstPlayerCity()` czyni sprawę gorszą, nie lepszą:**
linia 12461 pokazuje, że `exitBuildMode()` jest **no-opem**, dopóki gracz nie założył
pierwszego miasta (`playerEverOwnedCity` — singleton, wymieniony przez sam plan w §A10:
*"`playerStartHex` @ 2297, `playerEverOwnedCity` @ 2305 — singletony"*, ale w kontekście
INNEGO ryzyka niż to). W realistycznym scenariuszu wczesnej gry hot-seat (oba fotele jeszcze
nie założyły miasta, tryb „załóż pierwsze miasto" jest — wg komentarza w kodzie —
„NIEWYJŚCIOWY") wywołanie `exitBuildMode()` z `switchActiveHuman()` **nawet gdyby zostało
dopisane, nie pomogłoby** w tym konkretnym oknie gry — co oznacza, że sam `switchActiveHuman()`
potrzebuje OSOBNEJ ścieżki dla „fotel A jest w trybie zakładania pierwszego miasta w
momencie handoffu", której dokument Operatora w ogóle nie rozważa (nie ma jej w §1, §2 ani
w liście długu §6).

**Konsekwencja:** GOAL pkt 1 i binarne kryterium sukcesu tej rundy nie są spełnione dla tego
elementu. To jest zarzut analogiczny wagą do najważniejszego znaleziska Operatora (§1e-bis,
trzy mapy `XByHuman` bez drugiego wpisu) — obie kategorie zmieniają charakter ryzyka Etapu 5
z czystego „wyciek info" na „wyciek info ORAZ przejęcie/crash niedokończonego stanu
poprzedniego fotela" — ale Operator, mimo że sam sformułował tę generalizację w §6 pkt 3
dla map `XByHuman`, nie zastosował jej do trybu budowy.

## Pozycje zweryfikowane niezależnie i POTWIERDZONE zgodne z dokumentem (bez zarzutu)

- §0: `grep -rn "runWorldEndTurn|switchActiveHuman|hotSeatHandoff|advanceSeat|endActiveHumanTurn" gra/src`
  → zero trafień; `git merge-base --is-ancestor ac5c2c09 HEAD` → NIE (exit 1);
  `triggerPlayerEndTurn` @ 28643. Zgodne.
- §1a: `grep -n "let _last\|const _last"` → dokładnie 20 deklaracji, klaster 10529-10625
  liczy dokładnie 18 (policzone niezależnie przez `awk`), `_pracaRateFreshFromEndTurn` @
  10602, `_liveFoodBrutto` @ 10623 — zgodne co do linii i liczb.
- §1a: `refreshLiveEmpireRatesUnsafe` @ 17077, `cities.filter(c => c.ownerId === 0)` @ 17078,
  `units.filter(u => u.ownerId === 0)` @ 17146, `previewOwnerUpkeep(0, ...)` @ 17148-17150,
  `player.era`/`player.zbadane` bezpośrednio z singletona `player` @ 10348 — zgodne co do
  linii i treści.
- §1b: 10 nazw tablic/setów log-zdarzeń ze wszystkimi liniami (8152, 9561, 9572, 13983,
  13988, 14013, 14020, 14021, 14023, 14054) — wszystkie zgodne. `SidePanelEvent` interfejs
  `sidePanelHud.ts:31-53` bez pola ownera, pole `origin?: 'other-civs'` z cytowanym
  komentarzem — zgodne dosłownie. `checkVeteranEnemyFirstEncounter` @ 10186 (deklaracja),
  hardkod `u.ownerId === 0` @ 10193, wołana z `refreshFog()` przez
  `if (!opts?.skipVeteranEducation) checkVeteranEnemyFirstEncounter(vis);` — zgodne.
  `__sidePanelLinkTestDebug.seedEvents` @ 21987-21994 z dokładną treścią — zgodne.
- §1c: `selectedId` @ 10274, `plannedMarches` @ 22856 — zgodne. 17 funkcji `hide*` — grep
  własny potwierdza dokładnie ten zestaw nazw w main.ts. `openViews` @ 22012-22020,
  `closeAll` @ 22026-22033, `hexToWorld` @ 22022 — zgodne co do linii i treści.
- §1d: `refreshFog` @ 10134-10175 z dokładną treścią (m.in. `addExplored(exploredByHuman.get(ME())!, vis)`
  @ 10142, `cityRenderer.applyFogVisibility(vis, true, ME())` @ 10159); `ownPlayerVisibleHexes`
  filtruje `u.ownerId === ME()`/`c.ownerId === ME()` (potwierdzone przez świeży odczyt,
  NIE literałem 0); `exploredByHuman` deklaracja @ 10375 z cytowanym komentarzem o jednym
  wpisie — zgodne.
- §1e: `getMinimapData` wywołanie z `playerOwnerId: ME()` @ 21458 (nie literał 0) — zgodne.
- §1e-bis: trzy mapy `exploredByHuman`@10375/`playerStateByHuman`@10387/`pracaPoolByHuman`@10395,
  wszystkie `new Map([[HUMAN_OWNER_PRIMARY, ...]])`; akcesory `ownerTreasury`/`ownerPracaPool`/
  `ownerNaukaPool`/`ownerResearchedTechs` @ 26166-26281 z dokładnym wzorcem
  `isHuman(ownerId) ? X.get(ownerId)! : aiXByOwner...` — zgodne; ryzyko crasha na
  `.get(N)!` dla nieobecnego `N` jest realne i poprawnie zidentyfikowane.
- §2: KROK 0-7 projektu `switchActiveHuman()` odwołuje się wyłącznie do zweryfikowanych
  wyżej funkcji/zmiennych (poza dwoma brakami z Zarzutów 1-2) — konkretny, nazwany,
  wykonalny, nie ogólnikowy.
- §3: `showPreBattle` @ 209-258 w `preBattle.ts` z dokładnym cytatem ciała (hidePreBattle;
  showMapScrim; buildOverlay; appendChild; pushOverlay('pre-battle', ...)) — zgodne
  dosłownie. `escapeOverlayStack.ts` istnieje, eksportuje `pushOverlay`/`popOverlay` —
  zgodne. Argument o jednowątkowości JS/malowaniu klatek jest poprawny technicznie i
  poprawnie zastosowany do warunku „montowanie przed pierwszym `await`".
- §4: cytat z `hotseat-etap4-noop-test.cjs` o `tools/logic-test.cjs`/potrzebie realnego
  Chromium zweryfikowany DOSŁOWNIE zgodny z plikiem (linia po linii). `buildBundle`,
  `launchBrowser`, `closeBrowserSafely`, `runOnceWithRetry`, `FALLBACK_CHROME` — wszystkie
  potwierdzone istniejące w pliku. Plan testu (7-8 kroków, asercje z konkretnymi polami)
  jest wykonywalny, nie hipotetyczny — opiera się na istniejących hakach
  (`__cityStateStartUnitsTestDebug.startNewGame`, `__sidePanelLinkTestDebug.hexToWorld`).
  Uwaga: `snapshotVisibleState()` w projekcie hooka (§4.2) powinna dodatkowo czytać
  `hintToast`/`buildModeOpen` po naprawie Zarzutów 1-2 w rundzie implementacji.
- §5: brak wprost `advanceSeat`/`endActiveHumanTurn`/`runWorldEndTurn` w projekcie §2/§3 —
  potwierdzone świeżym grepem (zero trafień, patrz §0 wyżej). Wniosek "brak twardej
  zależności od Etapu 4b" jest zgodny z tym, co faktycznie zaprojektowano.
- Plan `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`: cytaty z §C (wiersz Etap 5, "19 cache'y"),
  §D3 (dokładny cytat), §A5 ("Ekonomia... JUŻ per-owner" — z zastrzeżeniem, że to o
  `advanceCityEconomy`/mapach AI, NIE o `refreshLiveEmpireRatesUnsafe`, co Operator poprawnie
  odróżnia), §B2 (wiersz "Toast / hint / dziennik wydarzeń → isMe(id)" i wiersz "Akcesory
  ekonomiczne... → isHuman(id)") — wszystkie zgodne z treścią pliku.
- `git status --porcelain` w tej rundzie: czysty poza `01-operator-runda1-analiza.md` (i
  teraz tym plikiem) — zero zmian w `gra/src`/`gra/tools`, zgodnie z allowlistą.

## Ocena konkretności projektu

`switchActiveHuman()` (§2): **konkretny** — 7 nazwanych kroków, każdy z nazwą funkcji i
uzasadnieniem kolejności, poza brakiem KROKÓW dla Zarzutów 1-2 powyżej.
`ui/hotSeatHandoff.ts` (§3): **konkretny** — kontrakt interfejsu, konkretny precedens
(`preBattle.ts`), konkretny mechanizm (`escapeOverlayStack`), konkretne uzasadnienie
bezpieczeństwa synchroniczności oparte na realnym kodzie, nie na hipotezie.
Plan dowodu „no leak" (§4): **wykonalny** — konkretny plik, konkretne funkcje do
rozszerzenia, konkretne asercje z nazwanymi polami i warunkami PASS/FAIL, nie „powinno
działać" — z zastrzeżeniem, że lista asercji (§4.2 `snapshotVisibleState`) jest niepełna
dokładnie o pola z Zarzutów 1-2.

---

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1
GOAL: Recon-only (zero zmian kodu) dla Etapu 5 planu hot-seat: `switchActiveHuman()` + `ui/hotSeatHandoff.ts`.
ZMIANY/COMMIT: Nowy plik `dyspozycje/autobot/runs/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1/02-evaluator-runda1.md`, do zacommitowania w tej rundzie w worktree `/home/user/wt-hotseat-etap5-recon`, gałąź `autobot/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1`. `git status --porcelain` czysty poza tym plikiem; zero zmian w `gra/src`/`gra/tools`.
TESTY: Nie dotyczy (dokument, zero kodu). Wszystkie cytaty/numery linii dokumentu Operatora zweryfikowane niezależnie świeżym `grep`/`Read` w tej rundzie (lista w sekcji "Pozycje zweryfikowane"); dodatkowo przeszukano main.ts poza zakresem cytowanym przez plan/Operatora w poszukiwaniu pominiętych globalnych struktur stanu.
BLOKADY: Brak blokad TWARDYCH (dokument nie jest kodem, PASS-WITH-NOTES nie zatrzymuje ścieżki dokumentacyjnej) — ale 2 zarzuty wyżej MUSZĄ trafić do rundy implementacji (`R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1`) jako dodatkowe pozycje inwentaryzacji/projektu/testu, inaczej implementacja Etapu 5 powtórzy ten sam błąd co plan (pominięcie globalnego stanu bez tagu właściciela).
RUNDY: 1/5.
ZARZUTY:
1. Globalny toast `#civ-hint-toast` (`hintToast`, `showHintMessage()` @ main.ts:13141-13178,
   279 call-site'ów, `hintOverrideTimer`, deklaracja @ ~1751-1760) — pominięty w §1
   (inwentaryzacja), §2 (`switchActiveHuman()` nie ukrywa/nie czyści go), §4 (asercje
   „no leak" go nie sprawdzają). Brak funkcji `hideHintMessage()` — jedyne wygaszenie to
   własny `setTimeout`. Realne ryzyko: tekst specyficzny dla fotela odchodzącego widoczny
   fotelowi przychodzącemu po zamknięciu `hotSeatHandoff`, jeśli timer jeszcze nie wygasł.
2. Globalny „build mode"/„found city mode" (`buildModeOpen`, `foundCityMode`,
   `activeImprovementKey`, `activeWonderId` @ main.ts:2513/11457-11459, funkcja
   `exitBuildMode()` @ 12456-12469, zarejestrowana na `escapeOverlayStack`) — pominięty w
   §1c (lista 17 funkcji `hide*` go nie obejmuje, bo nazwa nie pasuje do wzorca `hide*`),
   w §2 (`switchActiveHuman()` go nie wywołuje) i w §4. Ryzyko WYŻSZE niż info-leak: brak
   wywołania `exitBuildMode()` oznacza, że fotel B może PRZEJĄĆ i wykonać niedokończoną
   akcję budowy fotela A pierwszym kliknięciem na mapie. Dodatkowo: `exitBuildMode()` jest
   no-opem, gdy `isAwaitingFirstPlayerCity()` jest prawdą (singleton `playerEverOwnedCity`,
   wymieniony w planie §A10 w INNYM kontekście) — realistyczny scenariusz wczesnej gry
   hot-seat, którego dokument w ogóle nie rozważa, nawet jako dług w §6.
NASTĘPNY KROK: Operator → runda 2 na tym samym ID: dopisać do dokumentu (a) Zarzut 1 do §1
  jako nową podsekcję + krok w §2 (np. `hintToast.style.display='none'; if (hintOverrideTimer) clearTimeout(hintOverrideTimer);`)
  + pole w §4.2 `snapshotVisibleState()`; (b) Zarzut 2 do §1c + krok w §2 (`exitBuildMode()`
  wywołane BEZWARUNKOWO, tzn. do rozstrzygnięcia: albo usunąć/obejść guard
  `isAwaitingFirstPlayerCity()` dla ścieżki handoffu, albo jawnie udokumentować scenariusz
  "oba fotele przed pierwszym miastem" jako osobny przypadek) + pole w §4.2. Po naprawie:
  Evaluator runda 2 weryfikuje wyłącznie te dwie łatki (nie całość od zera, allowlista
  procesu naprawczego).
DEPLOY/PUSH: NIE WYKONANO
