# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-ZELAZO-MODELE-BRAKUJACE-Q1-T1`
GOAL: Zbudować dwa nowe, dedykowane modele 3D — **Konnica lancowa asyryjska** i
**Konnica łucznicza asyryjska** (epoka Żelazo, kultura Asyria) — zamiast dzisiejszego
generycznego modelu kategorii `konnica` (ten sam co dla wszystkich niekulturowych
jeźdźców), historycznie uzasadnione, spójne wizualnie z już istniejącym w repo
kanonem wizualnym Asyrii.

## Wyzwalacz

Właściciel poprosił o listę jednostek Żelaza nieobjętych procesem naprawy modeli
„Opus 5" (precedens `R-BRAZ-SUPER-DISPATCH-Q1`, zamknięty dla epoki Brąz). Audyt
(subagent Explore) znalazł je jako dwie z sześciu jednostek Żelaza bez dedykowanego
modelu. ECHO właściciela w głównym czacie orkiestratora (2026-08-24):

> „tak ponieważ dla epoki żelaza tej jednostki nie były poprawiane więc wszystkie
> trzeba zrobić porządnie za pomocą opus 5 od nowa tak żeby zachowywały jak najlepiej
> odzwierciedlały kwestie historyczne"

Pełny kontekst i podział na 4 sekwencyjne tematy: `docs/decyzje/R-ZELAZO-MODELE-BRAKUJACE-Q1.md`.
Właściciel dał jawną zgodę na pracę w pełni autonomiczną (workflow, pętla, deploy+push
bez check-inów) — „ja będę teraz niedostępny".

## Izolacja

Nowa gałąź `autobot/ZELAZO-T1-Q1`, odgałęziona od `origin/main`, osobny worktree
per rola.

## Allowlista

- `gra/src/render/units.ts` — WYŁĄCZNIE: (a) dwa nowe importy nowych builderów,
  (b) dwie nowe gałęzie rozpoznania po nazwie w `buildNamedUnit()` (obok istniejącego
  `if (n.includes('lucznik asyryjski') ...)` na linii ok. 1353 — ten sam wzorzec).
  Nic innego w tym pliku nie wchodzi w zakres — bez zmian w generycznym
  `case 'konnica'` (ok. linii 3202), który nadal obsługuje resztę jeźdźców.
- Nowy plik/pliki w `gra/src/render/` dla nowych builderów, konwencja nazewnictwa
  rodziny Opus 5: np. `zelazo-konnica-lancowa-asyryjska-opus5.ts` +
  `zelazo-konnica-lucznicza-asyryjska-opus5.ts` (albo jeden plik z dwiema
  eksportowanymi funkcjami, jeśli dzielą realnie dużo geometrii — decyzja Operatora,
  udokumentowana).
- `gra/tools/*` — nowy lub rozszerzony test regresji renderowania (real render
  Playwright/Chromium, patrz Kryteria sukcesu pkt 5).

Poza zakresem: wszystko poza tymi dwiema jednostkami. `Łucznik asyryjski` (Brąz,
już ma dedykowany `buildAssyrianArcher()`) — WOLNO CZYTAĆ jako referencję stylu,
NIE WOLNO zmieniać. Pozostałe 4 jednostki tematu (Falanga, Jeździec z oszczepami,
Soldurii, Gaesatae) — osobne dispatche T2-T4, nie w tym zakresie.

## Kontekst techniczny (z reconu orkiestratora, do potwierdzenia przez Operatora)

**Istniejący kanon wizualny Asyrii w repo** (`jednostki-p3-dystans.ts`, nagłówek pliku,
zasady dla `buildAssyrianArcher()`, epoka Brąz, ta sama kultura) — TRZYMAĆ SIĘ TEGO
SAMEGO JĘZYKA WIZUALNEGO dla spójności międzyepokowej tej samej cywilizacji:
- Nakrycie głowy: wysoki stożkowy hełm z grzebieniem łuskowym.
- Pancerz: zbroja łuskowa (rzędy lamelek), `PD_SCALE = 0x9a8a5a` (brązowo-płowa).
- Wysokie buty, długa broda — charakterystyczne dla ikonografii asyryjskiej.
- Sloty koloru gracza (wzorem archera): rękawy tuniki pod łuską + szarfa pasa
  (+ lotki strzał u łucznika).
- `buildAssyrianArcher` dispatch: `units.ts:1353`, `import buildAssyrianArcher` z
  `units.ts:122` (plik `jednostki-p3-dystans.ts`) — czytaj jako wzór stylu, nie
  kopiuj 1:1 (to piechota, nowe jednostki to konnica).

**Kluczowa różnica funkcjonalna między dwiema nowymi jednostkami — MUSI być widoczna
w modelu:**
- Konnica lancowa asyryjska: `Atak dystansowy=0`, broń = lanca/włócznia kawaleryjska
  (jak istniejący generyczny model `case 'konnica'`, ok. `units.ts:3202-3299`,
  „couched cavalry lance" — MOŻNA reużyć technikę trzymania broni, jeśli pasuje).
- Konnica łucznicza asyryjska: `Atak dystansowy=6` w `units.json` (jednostka
  DYSTANSOWA) — **MUSI dzierżyć łuk, nie broń drzewcową**. Dziś (przed tym dispatchem)
  obie jednostki dostają identyczny model z kopią — to jest realny błąd wizualny do
  naprawienia, nie tylko brak unikalności.
- Obie NIE MOGĄ być wizualnie identyczne z generycznym `Konnica` (Brąz,
  `braz-konnica-opus5.ts`) — ten plik ma wprost w komentarzu (K4) zastrzeżenie:
  „w grze istnieje osobna «Konnica łucznicza asyryjska», której nie wolno dublować".
  Epoka Żelaza jest PÓŹNIEJSZA niż Brąz — końska uprząż/broń może pokazywać
  postęp technologiczny (np. żelazne groty zamiast brązowych — sprawdź
  `Surowiec`/`Tech` pola tych jednostek w `units.json` dla potwierdzenia).

## Kryteria sukcesu

1. Dwa nowe, dedykowane modele — jawne rozpoznanie po nazwie w `buildNamedUnit()`,
   nie generyczny fallback.
2. Konnica łucznicza asyryjska dzierży ŁUK (nie kopię/lancę) — widoczne w real
   render, zgodne z `Atak dystansowy=6`/`Zasięg ataku` z `units.json`.
3. Konnica lancowa asyryjska zachowuje broń drzewcową (`Atak dystansowy=0`).
4. Obie jednostki wizualnie ODRÓŻNIALNE od siebie NAWZAJEM oraz od generycznego
   `Konnica` (Brąz) i generycznego `case 'konnica'` fallbacku.
5. Sekcja „ZGODNOŚĆ HISTORYCZNA" w komentarzu na górze nowego pliku/plików, styl
   `braz-konnica-opus5.ts` (numerowane punkty, rama czasowa — Neo-Asyryjskie
   Imperium ok. 900–600 p.n.e., profesjonalna kawaleria, żelazne uzbrojenie,
   uprząż/siodło stanu wiedzy tej epoki — BEZ strzemion, o ile historycznie
   nieudokumentowane dla tego okresu/regionu — Operator MA zweryfikować i
   udokumentować, nie zgadywać). Spójność z istniejącym kanonem Asyrii wyżej.
6. Zero regresji dla innych jednostek/kultur (w tym generycznego `case 'konnica'`
   dla reszty jeźdźców, i dla `Łucznik asyryjski` Brąz).
7. Real render Playwright/Chromium (bezwarunkowy wymóg, `R-PROC-AUTOBOT.md` §9
   poz. 6a) — zmierzone proporcje względem `HEX_R` (wzorem serii Opus 5: wysokość,
   promień poziomy, `minY≈0`), zrzuty PRZED/PO dla obu jednostek, dowód że łucznik
   faktycznie dzierży łuk (nie tylko że kod się kompiluje).
8. `tsc --noEmit` i `vite build` (C-001, katalog poza drzewem repo) czyste; testy
   tematu + 5 bramek referencyjnych (`logic-test`, `tech-tree-test`, `research-test`,
   `unit-replace-test`, `combat-test`) zielone.
9. Jeśli dokładny szczegół historyczny budzi niedającą się rozstrzygnąć wątpliwość
   (np. sprzeczne źródła co do konkretnego elementu uprzęży) — Operator dokumentuje
   wybór i uzasadnienie w komentarzu (jak K1-K7 w `braz-konnica-opus5.ts`), nie
   pyta właściciela — to jest decyzja implementacyjna/historyczno-badawcza, nie
   produktowa (`R-PROC-AUTOBOT.md` §10).

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna
gałąź. Limit 5 rund. Model/effort: **Opus 5 High dla Operatora i Evaluatora**
(temat czysto wizualny, `R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High.

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–9 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
