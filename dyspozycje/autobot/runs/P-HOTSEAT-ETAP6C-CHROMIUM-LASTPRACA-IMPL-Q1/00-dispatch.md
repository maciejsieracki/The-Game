TEMAT:  P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-IMPL-Q1
RUNDA:  1/5
DATA:   2026-09-11
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Recon `P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-RECON-Q1` zamknięty (Operator→
Evaluator PASS, zero zarzutów, commit `569d74fc`, dokument
`dyspozycje/autobot/runs/P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-RECON-Q1/
01-operator-recon.md` — PRZECZYTAJ W CAŁOŚCI PRZED PRACĄ, zawiera pełną
inwentaryzację i dokładne numery linii). ECHO właściciela 2026-09-11: wariant
(C)+(A) z §7 recon — pełna migracja klastra cache `_last*` na per-fotel,
BEZ ruszania `playerPracaPool` silnika (osobny temat
`P-HOTSEAT-PLAYERPRACAPOOL-SILNIK-PER-FOTEL-Q1`, świadomie odłożony).

## GOAL

Zmigruj CAŁY klaster 9 zmiennych cache HUD Praca/Kultura na strukturę
per-fotel (`Map<ownerId, T>`), czytaną przez `buildHudState(ownerId = ME())`,
identycznie do wzorca już użytego dla skarbca (`ownerTreasury`/
`setOwnerTreasury`) i nauki (`ownerNaukaPool`) w Etapie 6c:

1. `playerPracaPool` (main.ts:11065) — UWAGA: to jest CACHE wyświetlania w
   tym zakresie, NIE ta sama rzecz co silnik kosztów z §4 recon. Sprawdź
   dokładnie w reconie czy migracja tej zmiennej jest w zakresie cache czy
   już wchodzi w silnik — jeśli masz wątpliwość, zatrzymaj się i zgłoś
   DECISION_REQUIRED zamiast zgadywać (recon jawnie ostrzega że to rozróżnienie
   jest subtelne, §4).
2. `_lastPraca` (11067)
3. `_lastPracaUpkeep` (11072)
4. `_lastPracaAutoUlepszeniaKoszt` (11089)
5. `_lastPracaCudaKoszt` (11097)
6. `_lastKultura` (11098)
7. `_lastPracaRate` (11099)
8. `_pracaRateFreshFromEndTurn` (11140, guard REGRES2/REGRES3)
9. `_lastKulturaRate` (11141)

**Konkretny mechanizm regresji do naprawienia** (recon §5): `setOwnerPracaPool`
(main.ts:27599-27607) zawsze pisze `_lastPraca = playerPracaPool` (singleton
aliasowany do fotela 0), niezależnie od `ownerId`/`v` przekazanych do funkcji.
Po migracji: `setOwnerPracaPool(ownerId, value)` ma aktualizować WYŁĄCZNIE
komórkę cache odpowiadającą `ownerId`, nie globalny singleton.

`buildHudState()` (main.ts:18081) ma przyjąć parametr `ownerId` (domyślnie
`ME()`) i czytać z map per-fotel zamiast modułowych singletonów (linie
18234-18242).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. Wszystkie 9 zmiennych klastra zmigrowane na `Map<ownerId, T>` (albo jawnie
   uzasadnione w raporcie, dlaczego któraś zostaje wyjątkiem — z odniesieniem
   do konkretnej linii recon).
2. Tryb jednoosobowy (`humanOwnerIds.length===1`): zero zmiany zachowania —
   test regresyjny bit-a-bit identyczny z dzisiejszym stanem (recon §5 pkt 2).
3. Tryb dwuosobowy: `_lastPraca` dla fotela B (po `switchActiveHuman`/
   `buildHudState(B)`) odzwierciedla AKTUALNĄ pulę B, NIE starą wartość
   nadpisaną operacją fotela A (recon §5 pkt 1 — dokładny scenariusz testowy
   już opisany w reconie, użyj go).
4. Bramka dowodowa Chromium (recon §6): 2 fotele, jeden robi auto-ulepszenie
   kosztem Pracy (Klaster F, main.ts:31897-32061), drugi robi transakcję
   handlową Pracą, zrzut ekranu czipa „Praca" po każdym `switchActiveHuman`
   pokazujący POPRAWNĄ wartość dla aktywnego fotela. Zapisz pod
   `dowody/hotseat-lastpraca-per-fotel.png` (co najmniej 2 zrzuty — po
   każdym przełączeniu).
5. `playerPracaPool` SILNIKA (koszty założenia miasta 13013-13020, wycinki
   13195-13210, kolejka budowy 13241-13314, koniec tury/upkeep 31791-31824,
   reset gry/save-load 36040-36901/37809-37840) — NIETKNIĘTE, zero zmian.
   `git diff` na tych liniach ma być pusty.
6. `tsc --noEmit` 0 błędów.
7. 5 bramek referencyjnych + `hotseat-etap6c-economy-noop-test.cjs` (70/70,
   zero regresu) + `hotseat-drugi-fotel-tura-test.cjs` + inne bramki hot-seat
   dotykające `buildHudState`/HUD.
8. Nowa bramka Chromium (headless + żywy zrzut) pokrywająca scenariusz z
   punktu 3-4, dodana do `gra/tools/`.

## ZAKAZANE

- Migracja `playerPracaPool` SILNIKA (call-site'y z GOAL pkt 5) — to jest
  osobny temat `P-HOTSEAT-PLAYERPRACAPOOL-SILNIK-PER-FOTEL-Q1`, świadomie
  odłożony przez właściciela. Jeśli w trakcie pracy okaże się, że migracja
  cache jest NIEMOŻLIWA bez dotknięcia silnika — ZATRZYMAJ SIĘ i zgłoś
  DECISION_REQUIRED z dokładnym wyjaśnieniem dlaczego, zamiast poszerzać
  zakres samodzielnie.
- Fabrykowanie nowego zachowania UI poza tym co już istnieje (żadnych nowych
  elementów HUD, tylko poprawność WARTOŚCI istniejącego czipa).

## Allowlista

- `gra/src/main.ts` (WYŁĄCZNIE klaster 9 zmiennych + `buildHudState`/
  `setOwnerPracaPool`/powiązane call-site'y CACHE, NIE silnika)
- `gra/src/ui/hud.ts` (jeśli konieczne — przekazanie `ownerId` do renderera)
- nowa bramka `gra/tools/hotseat-etap6c-lastpraca-per-fotel-test.cjs`
- `dowody/hotseat-lastpraca-per-fotel.png` (nowe pliki, dowód)

Zakazane: `gra/data/*.json`, pliki z sekretami, `docs/decyzje/*.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## Izolacja

Worktree `/home/user/wt-hotseat-etap6c-lastpraca-impl`, gałąź
`autobot/P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-IMPL-Q1`, baza `origin/main`.
C-001: zakaz `npm run build`/`dev` w `gra/`; dozwolona wyłącznie `node
./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo>
--emptyOutDir` oraz `node ./node_modules/typescript/bin/tsc --noEmit`. Testy
Chromium sekwencyjnie.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi.
Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 500 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`.
Nie integrujesz, nie deployujesz, nie pushujesz.
