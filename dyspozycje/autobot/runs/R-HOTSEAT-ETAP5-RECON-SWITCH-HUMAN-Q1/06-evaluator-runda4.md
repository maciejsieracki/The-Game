# R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1 — Evaluator runda 4 (weryfikacja poprawki rundy 3)

**Metoda:** świeży `grep -n`/`sed -n`/`Read` w worktree `/home/user/wt-hotseat-etap5-recon`,
HEAD `f069a684` (branch `autobot/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1`), `git status
--porcelain` czysty przed startem. Zero zaufania cytatom Operatora rundy 3 — każda linia
niżej zweryfikowana od zera osobnym `grep`/`sed`/`Read` tej rundy. Zakres: WYŁĄCZNIE jedna
poprawka z `05-operator-runda3.md` (zarzut #2 NOWY z `04-evaluator-runda2.md` — KROK 1c
częściowy, pomijał `clearBuildModeVisuals()`/`popOverlay('build-mode')` w gałęzi
`isAwaitingFirstPlayerCity()===true`), zgodnie z zawężeniem "Evaluator runda 4 weryfikuje
wyłącznie tę jedną poprawkę".

## 1. Świeży grep — funkcje/zmienne referencjonowane przez poprawkę

```
grep -n "^function exitBuildMode\|^function clearBuildModeVisuals\|^function removeBuildGhosts\|^function isAwaitingFirstPlayerCity\|civ-build-ghost-chip" gra/src/main.ts
```
Wynik: `isAwaitingFirstPlayerCity` @ **9655**, `removeBuildGhosts` @ **11821**,
`clearBuildModeVisuals` @ **12350**, `civ-build-ghost-chip` (przypisanie `id`) @ **11769**.
`exitBuildMode` nie ma dopasowania do wzorca `^function` (jest zagnieżdżona, wcięta) —
zlokalizowana osobno:
```
grep -n "function exitBuildMode" gra/src/main.ts
```
→ **12456**. Ciało odczytane świeżo `sed -n '12456,12472p'`:
```ts
function exitBuildMode(): void {
  // R-PIERWSZE-MIASTO (Maciej 2026-07-24): ...
  if (isAwaitingFirstPlayerCity()) return;
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
Identyczne z cytatem Operatora rundy 3 (linia po linii, w tym numer linii guarda 12462 —
policzone: 12456+6=12462). Potwierdzone niezależnie: `return` na guardzie wykonuje się
PRZED wszystkimi 8 liniami ciała, w tym `clearBuildModeVisuals()` i `popOverlay('build-mode')`
— dokładnie luka opisana w zarzucie Evaluatora rundy 2.

Dodatkowo: `import { pushOverlay, popOverlay } from './ui/escapeOverlayStack';` potwierdzony
świeżo w main.ts (`grep -n "from './ui/escapeOverlayStack'"` → **linia 1065**) — `top` NIE
jest tam dziś importowane, zgodnie z notatką dokumentu "nowy import potrzebny w rundzie
implementacji". `export function top(): EscapeOverlayEntry | null` potwierdzony w
`gra/src/ui/escapeOverlayStack.ts:106`.

## 2. Weryfikacja poprawki KROK 1c (§2 dokumentu) — czy oba brakujące wywołania faktycznie dopisane w gałęzi guard-true

Świeży odczyt `01-operator-runda1-analiza.md` (nie z cytatu rundy 3, bezpośrednio z pliku,
`Read` linie 484-544):

```ts
if (isAwaitingFirstPlayerCity()) {
  buildModeOpen = false;
  foundCityMode = false;
  activeImprovementKey = null;
  activeWonderId = null;
  clearBuildModeVisuals(); // main.ts:12350-12354 — chowa ghostChip/ghostGroup/
  // ghostCityGroup/mineEligibleGroup; BEZ tego duszek budowy fotela A może zostać
  // widoczny fotelowi B (patrz komentarz wyżej).
  popOverlay('build-mode'); // gra/src/ui/escapeOverlayStack.ts — zdejmuje wpis fotela A
  // ze WSPÓLNEGO stosu Escape; BEZ tego pierwszy Escape fotela B trafia w martwy wpis
  // fotela A (patrz komentarz wyżej).
}
```

**Potwierdzone: TAK, oba brakujące wywołania (`clearBuildModeVisuals()`, `popOverlay('build-mode')`)
są teraz dopisane wewnątrz gałęzi `if (isAwaitingFirstPlayerCity())`** — czyli dokładnie w
gałęzi guard-true, dla której `exitBuildMode()` jest no-opem, i dokładnie tej, w której
Evaluator rundy 2 znalazł lukę. Nie jest to podzbiór jak w rundzie 2 — pokrywa teraz 6 z 8
linii ciała `exitBuildMode()` po guardzie (4 zmienne + te dwa wywołania), świadomie
pomijając tylko `refreshBuildApi()`/`refreshBuildHighlight()`/`refreshD1bHud()`, z
uzasadnieniem każdego pominięcia zweryfikowanym niżej.

**Weryfikacja logiczna wykonania (nie tylko odczyt):** w scenariuszu
`isAwaitingFirstPlayerCity()===true` (dokładnie ten, dla którego blok istnieje),
`exitBuildMode()` na linii wyżej jest no-opem (guard), więc jedyne wykonane czyszczenie w
tej gałęzi to teraz: 4 zmienne + `clearBuildModeVisuals()` + `popOverlay('build-mode')`.
To usuwa dokładnie oba wektory z zarzutu #2 rundy 2:
- `clearBuildModeVisuals()` → `removeBuildGhosts()` (main.ts:11821-11836, odczytane
  ponownie w całości ta runda) → `ghostChip.style.display='none'` (11835) + usuwa
  `ghostGroup`/`ghostCityGroup` ze `scene` + `clearMineEligibleOverlay()` — duszek budowy
  NIE zostaje już widoczny.
- `popOverlay('build-mode')` → zdejmuje wpis `{id:'build-mode', onClose:()=>exitBuildMode()}`
  ze wspólnego `escapeOverlayStack` — Escape fotela B nie trafia już w martwy wpis fotela A.

**Uzasadnienie świadomych pominięć (`refreshBuildApi`/`refreshBuildHighlight`/`refreshD1bHud`)
sprawdzone niezależnie:**
- `refreshD1bHud` — świeży grep `import.*refreshD1bHud` w main.ts →
  `import { showHud, updateHud as refreshD1bHud, hideHud, markMinimapDirty } from './ui/hud';`
  potwierdzony jako alias `updateHud`. KROK 7 dokumentu (`switchActiveHuman()`, odczytany
  §2 dalej w tym samym pliku) faktycznie woła `updateHud()` — wołanie osobne w KROK 1c
  byłoby duplikatem. Zgadza się z uzasadnieniem Operatora.
- `refreshBuildHighlight` @ **12309** (świeży grep), ciało odczytane 12309-~12330:
  faktycznie ogranicza się do `clearMineEligibleOverlay()`/`unitRenderer.clearHighlight()`
  lub `unitRenderer.setHighlight(...)` w zależności od gałęzi — w kontekście "wszystko już
  wyzerowane" (żadna z 4 zmiennych stanu budowy nie jest ustawiona) sprowadza się do tego
  samego czyszczenia, które `clearBuildModeVisuals()` już robi wprost. Uzasadnienie trzyma
  się.
- `refreshBuildApi` @ **12254** (świeży grep), ciało 12254-~12261 odczytane: zawiera
  zahardkodowane `playerOwnerId: '0'`/`playerOwnerIdNum: 0` — potwierdzone, przelicza dla
  fotela ODCHODZĄCEGO, wołane przed KROK 4 (przełączenie `activeHumanOwnerId`) w tej
  gałęzi rzeczywiście nie miałoby sensu. Uzasadnienie trzyma się; hardkod `'0'` poprawnie
  oznaczony jako osobny, nienowy dług, poza zakresem tej poprawki.

**Werdykt: poprawka KROK 1c jest teraz KOMPLETNA wobec zarzutu #2 rundy 2.** Nie znajduję
nowej luki w samym patchu kodu-w-dokumencie.

## 3. Weryfikacja §4.2 — czy `snapshotVisibleState()` i scenariusz testu są teraz kompletne

Świeży `Read` §4.2 (linie 749-887 dokumentu, bezpośrednio z pliku):

- `snapshotVisibleState()` zawiera teraz `ghostChipVisible: ghostChip.style.display !== 'none'`
  i `escapeOverlayTopId: top()?.id ?? null`, obok pól z rund 1-2
  (`buildModeOpen`/`foundCityMode`/`activeImprovementKey`/`activeWonderId`/
  `hintToastVisible`/17 paneli/fog/kamera/logi) — **potwierdzone, oba pola z zarzutu #2
  są obecne**.
- Dokument sam jawnie odróżnia SCENARIUSZ A (istniejący od rundy 2 — build-mode wchodzi
  przez gałąź `isAwaitingFirstPlayerCity()===false`, bo `startNewGame` zostawia owner 0 z
  miastem) od nowego **SCENARIUSZU B** (runda 3), który wymusza świeży bootstrap PRZED
  założeniem pierwszego miasta, jawnie asercjuje `isAwaitingFirstPlayerCity()===true`
  (krok B3, wymaga wystawienia funkcji na `__hotSeatTestDebug` — odnotowane jako TODO
  implementacji, nie ukryte), wchodzi w build-mode/found-city, ustawia `ghostChip` na
  widoczny przez hover, przełącza fotel, i asercjuje `snap.ghostChipVisible === false`
  oraz `snap.escapeOverlayTopId !== 'build-mode'` — **to jest dokładnie test, którego
  brak Evaluator rundy 2 zarzucił** ("§4.2 sprawdza WYŁĄCZNIE 4 zmienne stanu... nie
  czyta ghostChip.style.display/escapeOverlayStack").
- Dokument sam przyznaje ograniczenie Scenariusza A wprost (linia 828-834: asercje
  `ghostChipVisible`/`escapeOverlayTopId` w Scenariuszu A są "regresyjne, nie tym testem,
  który łapie zarzut Evaluatora rundy 2 — ten jest w SCENARIUSZU B") — uczciwe, nie
  ukrywa luki pod pozorem jednego uniwersalnego testu.

**Werdykt: §4.2 jest teraz kompletne wobec zarzutu #2.** Test opisany w Scenariuszu B
faktycznie ćwiczy gałąź guard-true i faktycznie asercjuje oba nowe pola. (Pozostaje to
plan testu w dokumencie recon, nie uruchomiony kod — zgodne z DOMAIN: INFORMATIONAL,
zero `gra/src` w tej rundzie.)

## 4. Sprawdzenie numerów linii i spójności wewnętrznej (nowe nieścisłości?)

- Precedens twardego resetu: świeży `grep -n "resetMapOverlayToggleDefaults();" gra/src/main.ts`
  → **34309**. `sed -n '34305,34309p'` potwierdza treść cytowaną przez Operatora rundy 3
  (`buildModeOpen = false; popOverlay('build-mode'); activeImprovementKey = null;
  resetMapOverlayToggleDefaults(); clearBuildModeVisuals();`) — korekta linii 34305-34309
  (nie 34303-34309 z rundy 2) **potwierdzona POPRAWNA**.
- Komentarz przy `exitBuildMode();` (main.ts nie dotyczy — to komentarz w dokumencie,
  linia 489 i dalej) — odczytany świeżo: teraz jawnie rozróżnia gałąź guard-false
  ("TO wywołanie faktycznie czyści wizualia + popOverlay") od guard-true ("blok if niżej
  NIE jest... dodatkowym resetem, tylko JEDYNYM miejscem, które w tej gałęzi w ogóle coś
  czyści") — sprzeczność zgłoszona w rundzie 2 ("autor zdaje się wierzyć, że
  exitBuildMode() i tak czyści wizualia nawet w gałęzi guard-true") **usunięta, komentarz
  teraz spójny z treścią kodu**.
- `§6 pkt 7` i `§7 checklist "RUNDA 3"` odczytane świeżo (linie 968-977, 1007-1012) —
  zamykają zarzut jawnie, z odniesieniem do `05-operator-runda3.md`, bez nowych
  sprzeczności wobec reszty dokumentu.
- Nie znaleziono żadnych nowych rozbieżności numerów linii między treścią dokumentu a
  świeżym stanem `main.ts`/`escapeOverlayStack.ts` tej rundy.

## 5. Zakres zmian tej rundy (poza samą poprawką) — kontrola granic

`git status --porcelain` czysty przed startem; jedyna zmiana do zacommitowania w tej
rundzie to nowy plik `06-evaluator-runda4.md`. Świeży `git diff --stat dacb8ced f069a684`
potwierdza, że commit Operatora rundy 3 zmienił wyłącznie `01-operator-runda1-analiza.md`
i dodał `05-operator-runda3.md` — zero zmian w `gra/src`/`gra/tools`, zgodnie z
DOMAIN: INFORMATIONAL.

## Wniosek

Poprawka rundy 3 w 100% adresuje jedyny otwarty zarzut Evaluatora rundy 2. KROK 1c dopisuje
oba brakujące wywołania w gałęzi guard-true, komentarz jest teraz spójny, §4.2 jest
kompletne (nowe pola + osobny Scenariusz B ćwiczący faktycznie tę gałąź). Nie znaleziono
żadnego nowego zarzutu. Dokument recon jest gotowy do zamknięcia — Final Control NIE
dispatchowany (dokument, nie kod, zgodnie z dyspozycją).

## STATUS: PASS
## DOMAIN: INFORMATIONAL
## TEMAT: R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1
## GOAL: Recon-only (zero zmian kodu) dla Etapu 5 planu hot-seat: `switchActiveHuman()` + `ui/hotSeatHandoff.ts`.
## ZMIANY-COMMIT: Nowy plik `dyspozycje/autobot/runs/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1/06-evaluator-runda4.md`, do zacommitowania w tej rundzie w worktree `/home/user/wt-hotseat-etap5-recon`, gałąź `autobot/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1`. `git status --porcelain` czysty poza tym plikiem przed startem tej rundy; zero zmian w `gra/src`/`gra/tools`.
## TESTY: Nie dotyczy (dokument, zero kodu produkcyjnego). Poprawka Operatora rundy 3 zweryfikowana niezależnie świeżym `grep`/`sed`/`Read` (main.ts, escapeOverlayStack.ts, dokument sam) tej rundy: oba brakujące wywołania (`clearBuildModeVisuals()`, `popOverlay('build-mode')`) potwierdzone jako dopisane w gałęzi `if (isAwaitingFirstPlayerCity())`; `snapshotVisibleState()` rozszerzone o `ghostChipVisible`/`escapeOverlayTopId`; SCENARIUSZ B potwierdzony jako faktycznie ćwiczący gałąź guard-true. Wszystkie cytowane linie main.ts (9655, 11769, 11821, 12254, 12309, 12350, 12456-12472, 34305-34309) i escapeOverlayStack.ts (106) zweryfikowane zgodne. `git diff --stat dacb8ced f069a684` czysty poza dwoma oczekiwanymi plikami dokumentacji.
## BLOKADY: Brak.
## RUNDY: 4/5.
## NASTĘPNY KROK: Brak dalszych rund Operator/Evaluator na tym temacie — dokument recon zamknięty z PASS. Final Control NIE dispatchowany (DOMAIN: INFORMATIONAL, dokument, nie kod — zgodnie z dyspozycją tej rundy). Kolejny krok procesu: właściciel decyduje o dispatchu implementacji `R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1` jako osobnego tematu, opartego na tym recon.
## ZARZUTY: brak.
## DEPLOY/PUSH: NIE WYKONANO
