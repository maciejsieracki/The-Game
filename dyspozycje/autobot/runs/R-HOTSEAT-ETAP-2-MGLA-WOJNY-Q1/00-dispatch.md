# R-HOTSEAT-ETAP-2-MGLA-WOJNY-Q1 — dispatch

TEMAT: `R-HOTSEAT-ETAP-2-MGLA-WOJNY-Q1`
RUNDA: 1/5
DOMAIN: INFRA (refaktor stanu mgły wojny na per-człowiek, behawioralny no-op przy
jednym fotelu człowieka — Etap 2 planu `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`,
**NAJWYŻSZE RYZYKO tej fazy planu, patrz GENEZA**)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Etapy 0 i 1 (zintegrowane, commity `94c475ec`/`87b33da3`) dostarczyły fundament
(`gra/src/game/human-owners.ts`) i pierwszy konsument (`isAiOwner` w pętli tur AI).
Ten temat to **Etap 2** z §C planu — plan sam oznacza tę kategorię jako
**„wysokie [ryzyko]"** (jedyna, obok Etapu 4/5, w tej klasie w całym planie 0-6) i
opisuje wprost skutek braku naprawy: „gracz 2 od pierwszej tury widzi wszystko, co
odkrył gracz 1 — gra bez mgły de facto" (plan §A1).

**Stan zweryfikowany bezpośrednio w kodzie (2026-09-07, main.ts obecny, linie
przybliżone — PRZED pracą potwierdź własnym grepem, main.ts zmienia się codziennie):**
- `const explored = new Set<string>();` (~main.ts:9511) — **jeden globalny Set na całą
  grę**, dokładnie jak opisuje plan §A1.
- `ownPlayerVisibleHexes()` (~9643) hardkoduje `u.ownerId === 0`/`c.ownerId === 0`.
- `currentVisible()` (~9678) woła `ownPlayerVisibleHexes()` jako bazę.
- `currentVisibleForOwner(ownerId)` (~9708) **JEST JUŻ sparametryzowana ownerem** —
  gotowy do użycia budulec, nie trzeba go pisać od nowa.
- `refreshFog()` (~10066) woła `currentVisible()` i dopisuje wynik do globalnego
  `explored` (`addExplored(explored, vis)`).
- Moduły `game/visibility.ts`, `map/minimap.ts`, `render/cities.ts` mają już
  parametr `playerOwnerId`/podobny w swoich funkcjach (plan §A1) — `main.ts` przekazuje
  im dziś literał `0`.

## GOAL

**Zakres tej rundy (round 1) — jeśli podczas pracy okaże się za duży na jedną rundę,
podziel na rundę 1 (scaffold) + rundę 2 (migracja) NA TYM SAMYM TEMACIE, nie proś o nowy
dispatch — to jest przewidziane, patrz PROCEDURA NAPRAWCZA:**

1. **Świeży audyt** (nie ufaj liczbie „33"/„35" z planu — nieaktualne): znajdź WSZYSTKIE
   miejsca w `gra/src/**` czytające/piszące globalny `explored` Set oraz wszystkie
   miejsca przekazujące literał `0` tam, gdzie funkcja już przyjmuje `ownerId`/
   `playerOwnerId` jako parametr (`currentVisibleForOwner`, `unitsVisibleOnMap`,
   `applyFogVisibility`, funkcje w `map/minimap.ts`).
2. Dodaj nową, żywą strukturę `exploredByHuman: Map<number, Set<string>>` w `main.ts`
   obok istniejącego `humanSeats` (z Etapu 1) — jeden wpis per fotel człowieka.
   **Nie usuwaj jeszcze `explored`** dopóki migracja wszystkich konsumentów nie jest
   pewna — jeśli w trakcie pracy okaże się bezpieczne zastąpić `explored` w 100% przez
   `exploredByHuman.get(ME())`, zrób to; jeśli nie — zostaw `explored` jako alias/cache
   dla `exploredByHuman.get(HUMAN_OWNER_PRIMARY)` w tej rundzie i eskaluj pełne usunięcie
   do rundy 2.
3. Dodaj lokalny alias `ME(): number` (dziś zawsze zwraca `HUMAN_OWNER_PRIMARY` —
   `humanSeats.activeHumanOwnerId`, no-op behawioralny bo `humanSeats` ma dziś jeden
   fotel).
4. Podmień literały `0` na `ME()` w wywołaniach funkcji RENDERU/wykrywania widoczności,
   które już przyjmują parametr `ownerId`/`playerOwnerId` (nie zmieniaj sygnatur, tylko
   argument wywołania) — `currentVisibleForOwner(0)`→`currentVisibleForOwner(ME())` itd.
5. `ownPlayerVisibleHexes()`, `currentVisible()`, `refreshFog()` — przepisz tak, żeby
   operowały na `ME()`/`exploredByHuman.get(ME())` zamiast zaszytego `0`/`explored`
   (zgodnie z tabelą planu §B2: „explored/currentVisible()/refreshFog() → ME() do
   renderu, exploredByHuman.get(id) do zapisu").

**KRYTYCZNE — zachowanie tury AI (Etap 1) NIE jest w zakresie tego tematu.** Ten temat
dotyczy WYŁĄCZNIE warstwy widoczności/mgły, nie logiki tur. Nie dotykaj `humanSeats`/
`isAiOwner`/pętli tur AI poza samym odczytem `humanSeats`/`ME()`.

## REGULA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

Zakaz twierdzenia „ten sam zbiór odkrytych heksów" na podstawie samego przejścia
bramek pass/fail — musisz pokazać RZECZYWISTĄ TREŚĆ zbioru `explored`/
`exploredByHuman.get(0)` (np. posortowaną listę kluczy heksów, hash/rozmiar zbioru) na
co najmniej dwóch różnych, deterministycznych presetach/scenariuszach PRZED i PO zmianie
— identyczność treści, nie tylko identyczność rozmiaru. Zakaz uznania migracji za pełną
bez świeżego grepu potwierdzającego zero pozostałych zaszytych literałów `0` tam, gdzie
funkcja przyjmuje już parametr ownera.

## BINARNE KRYTERIUM SUKCESU

- `exploredByHuman`/`ME()` istnieją i są używane w miejscach opisanych w GOAL.
- Dowód identyczności TREŚCI zbioru odkrytych heksów (nie tylko rozmiaru) na ≥2
  deterministycznych scenariuszach, przed/po zmianie.
- WSZYSTKIE istniejące bramki mgły/widoczności zielone i identyczne liczbowo przed/po:
  `mgla-odkrycie-wzdluz-sciezki-test.cjs`, `mgla-odkrycie-wzdluz-sciezki-live-render-test.cjs`,
  `mgla-sciezka-inwariant-test.cjs`, `mgla-sciezka-live-test.cjs`, `mgla-sciezka-rzeka-test.cjs`,
  `mgla-teleport-koniec-tury-test.cjs`, `river-fog-visibility-test.cjs`, `ai-fog-test.cjs`.
- 5 bramek referencyjnych (logic-test, tech-tree-test, research-test, unit-replace-test,
  combat-test) zielone.
- `tsc --noEmit` czysto.
- Jeśli zakres migracji okazał się zbyt duży na jedną rundę — jasno opisz w raporcie co
  zostało zmigrowane w tej rundzie i co zostaje w rundzie 2 (na tym samym ID), zamiast
  fałszywie deklarować pełne zamknięcie.

## ALLOWLISTA

- `gra/src/main.ts`
- `gra/src/game/visibility.ts`, `gra/src/map/minimap.ts`, `gra/src/render/cities.ts`,
  `gra/src/render/wonderRenderer.ts` — wyłącznie jeśli świeży audyt potwierdzi tam realne
  zaszyte literały `0` do podmiany na parametr; NIE zmieniaj sygnatur eksportowanych
  funkcji bez DECISION_REQUIRED.
- Nowa/rozszerzona bramka (np. `gra/tools/hotseat-etap2-mgla-test.cjs`).
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP-2-MGLA-WOJNY-Q1/**`

Zakazane bezwzględnie: `gra/data/**`, pliki z sekretami, `docs/decyzje/**`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-hotseat-etap2`, gałąź `autobot/R-HOTSEAT-ETAP-2-MGLA-WOJNY-Q1`,
baza jawnie `origin/main` (commit `414996fc` w chwili założenia, może być nowszy przy
starcie pracy — potwierdź `git log -1` PRZED pracą, SS2b).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ
gałęzi. **Dozwolone też zaplanowane rozbicie na scaffold (runda 1) + migrację (runda 2)
na TYM SAMYM ID**, jeśli Operator w rundzie 1 uczciwie oceni pełny zakres jako zbyt
ryzykowny na jedno posiedzenie — to NIE jest FAIL, to świadome zarządzanie ryzykiem,
opisz jako PASS-WITH-NOTES z jasnym planem rundy 2. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian widocznego zachowania gry przy jednym fotelu człowieka (dzisiejszy stan).
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Jeśli migracja wymagałaby zmiany sygnatury eksportowanej funkcji publicznej używanej
  w wielu miejscach spoza `main.ts` (np. w `visibility.ts`) w sposób niekompatybilny
  wstecz — STOP, DECISION_REQUIRED z opisem.
- Jeśli w trakcie pracy odkryjesz, że globalny `explored` jest czytany/pisany w miejscu
  nieoczywistym (np. zapis/wczytanie gry, `game/save.ts`) — NIE dotykaj formatu zapisu w
  tej rundzie (to Etap 7 planu, osobny temat); zanotuj w raporcie, zostaw nietknięte.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec
skryptu. Final Control osobno (Workflow, Sonnet 5 effort high), integracja
allowlist-only ręką orkiestratora.
