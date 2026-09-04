# P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1 — raport Operatora, runda 1/5

STATUS: PASS
DOMAIN: GAME
TEMAT: `P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1`
MODEL+EFFORT: Opus 5, effort high (Operator)
GOAL: ustanowić INWARIANT, po którym kolejnego miejsca odkrywania mgły wzdłuż ścieżki nie da
się dodać niezauważenie; naprawić miejsca znalezione inwentaryzacją.

> Destylat (§11). Surowe dane: `dowody/GOAL1-inwentaryzacja.md` (tabela GOAL 1),
> `dowody/GOAL3-nietautologicznosc.md` (mutacje, liczby), `dowody/live-*.png` (zrzuty).
> Obrona wobec zarzutów Evaluatora: `02-obrona-runda1.md` — ta sama runda, nie nowa.

## ZMIANY/COMMIT

Baza `20f9993d` potwierdzona `git log -1` przed pracą; gałąź
`autobot/P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1`. Allowlist-only, `git add` po nazwach,
drzewo główne nietknięte (C-019).

| Ścieżka | Co |
|---|---|
| `gra/src/main.ts` | helper `revealAlongPathForStack`; odkrycie per-krok w haku `onAfterStep` przy `runScoutsAutoExplore` (CZWARTE miejsce); hak testowy `__mglaSciezkaTestDebug` (wyłącznie wejścia scenariusza + odczyt) |
| `gra/tools/mgla-sciezka-inwariant-test.cjs` | NOWA — GOAL 3, inwariant (a)+(b) |
| `gra/tools/mgla-sciezka-rzeka-test.cjs` | NOWA — GOAL 4, scenariusz rzeczny |
| `gra/tools/mgla-sciezka-live-test.cjs` | NOWA — dowód z żywej przeglądarki (§9 pkt 6a) |

`visibility.ts` i `mgla-teleport-koniec-tury-test.cjs` — BEZ ZMIAN.

## GOAL 1-2 — inwentaryzacja i naprawa

47 trafień na poziomie kodu / 21 miejsc logicznych; pełna tabela w `dowody/`.

**CZWARTE miejsce: `scout-auto-explore.ts:234-235`** (`advanceScoutAutoExplore`, pętla
`while (unit.ruchLeft > 0)`) — zwiadowca przechodzi kilkanaście heksów w jednej turze, a
jedynym odkryciem był `refreshFog()` PO pętli, czyli z pozycji końcowej. Własne
`workingExplored` modułu to `new Set(explored)`: kopia lokalna, porzucana, służy tylko
wyborowi celu — dlatego kod wyglądał poprawnie i trzy poprzednie audyty go przeoczyły.
Naprawa w `main.ts` (moduł poza allowlistą), hakiem wołanym po KAŻDYM kroku.

**Wspólny helper wprowadzony, ale NIE zastąpił trzech istniejących wywołań.**
`mgla-odkrycie-wzdluz-sciezki-test.cjs` (poza allowlistą) kontraktuje ich dosłowny tekst —
zamiana zczerwieniłaby bramkę, której nie wolno mi dotknąć. Niezależnie od tego helper nie
jest zabezpieczeniem: nie zmusza autora piątego miejsca, żeby go zawołał. Strukturalną
gwarancję daje wyłącznie bramka.

## GOAL 3-4 — bramki

- `mgla-sciezka-inwariant` — skan negatywny całego `gra/src`: każde trafienie musi mieć wpis
  w `KLASYFIKACJA`. [1] skan + zakaz martwych wpisów, [1b] strażnik pokrycia,
  **[1c] wzorce pośrednie** (`['q'] =`, `Object.assign`, `+=`/`++`), [2] okno odkrycia
  (detektor mutacji), [3] czwarte miejsce, [4] integralność helpera, [5] nietautologiczność.
- `mgla-sciezka-rzeka` — behawioralna, na bundlowanym prawdziwym kodzie (C-046).
- `mgla-sciezka-live` — realny Chromium, realny klik „Zwiedzaj", realny koniec tury.

## TESTY

tsc 5.9.3 (exit 0) · inwariant **42/42** · rzeka 14/14 · **live 11/11** · mgla-teleport 16/16 ·
logic 213/213 · tech-tree 19/19 · research 33/33 · unit-replace 13/13 · combat 6/6 ·
scout-auto-explore 25/25.

Nietautologiczność (liczby i tabele — `dowody/GOAL3-nietautologicznosc.md`): każde z trzech
historycznych miejsc, czwarte miejsce i wydrążenie helpera czerwienią bramkę osobno;
hipotetyczne piąte miejsce wykryte; w żywej przeglądarce przebieg mutacyjny daje heksów
odkrytych po drodze **2 → 0**, czyli dokładnie objaw zgłoszony przez właściciela.

## HIPOTEZA RZECZNA — OBALONA jako osobna ścieżka kodu

`units/setup.ts:627-659`: rzeka to płaska wartość `RIVER_HEX_MOVE_COST = 1` wewnątrz
`terrainMoveCost` — brak osobnej funkcji ruchu, pathfindingu i zapisu pozycji. Ruch rzeczny
przechodzi przez te same miejsca; rzeka jest mnożnikiem długości ścieżki (Wzgórza+Las: 3 MP
bez rzeki, 1 MP z rzeką ⇒ przy 12 MP 4 vs 12 heksów na turę), więc uwydatnia ten sam defekt.
Obserwacja właściciela trafna co do objawu, myląca co do przyczyny; test zostaje jako regresja.

## BLOKADY

Brak blokujących. Trzy noty:

1. **C-058, pre-existing poza allowlistą:** `mgla-odkrycie-wzdluz-sciezki-test.cjs` ma 1 fail
   już na bazie `20f9993d` (asercja `static: currentVisible()…`, regex rozjechany po
   wcześniejszych integracjach). Nie dotykam — kandydat na osobny temat.
2. **Ryzyko rezydualne GOAL 3 („automatycznie"):** bramki nie są nigdzie zarejestrowane —
   brak wpisu w `R-PROC-AUTOBOT.md §6`, brak CI, brak hooka. Plik rejestru poza allowlistą;
   wniosek o osobny temat `PROCESS` w `02-obrona-runda1.md`, zarzut 3.
3. **Ryzyko rezydualne inwentaryzacji:** wzorce „spread" i „podmiana elementu tablicy" są
   zmierzone raz (0 i 0), nie zakodowane w bramce — uzasadnienie w `dowody/GOAL1-inwentaryzacja.md`.

RUNDY: 1/5 (runda Obrony jest częścią tej samej rundy, §3a)
NASTĘPNY KROK: Final Control (Sonnet 5, effort high) — werdykt per zarzut.
DEPLOY/PUSH: NIE WYKONANO
