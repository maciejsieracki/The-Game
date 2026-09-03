TEMAT: P-DYPLO-ZELAZO-BRAK-WOJNY-WYMUSZONEJ-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/game/forced-war-iron.ts (nowy plik), gra/src/game/forced-war-common.ts (jeśli
wymaga rozszerzenia rejestru epok), main.ts (wyłącznie punkt podłączenia analogiczny do
Kamienia/Brązu)
MODEL+EFFORT: claude-sonnet-5, effort high (nowy mechanizm gry, kopiowany 1:1 z istniejącego
wzorca — ryzyko niskie, ale wymaga precyzyjnego dopasowania do jednostek/budynków epoki Żelaza)

WYZWALACZ (ECHO właściciela, 2026-09-03)
"Skopiuj parametry Brązu 1:1" — odpowiedź na pytanie: epoka Żelaza nie ma żadnego mechanizmu
wojny wymuszonej (Kamień i Brąz mają, każdy własne parametry) — jak uzupełnić?

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji)
- `gra/src/game/` zawiera wyłącznie `forced-war-stone.ts` i `forced-war-bronze.ts` (plus
  wspólny `forced-war-common.ts`) — epoka Żelaza (`KOLEJNOSC_EPOK = ['Kamien','Braz','Zelazo']`,
  `research.ts:323`) nie ma odpowiednika.
- Mechanizmy wojny wymuszonej (krąg miast-państw, Brąz, Kamień) już dziś zwracają
  `wypowiedz_wojne` wczesnym `return` w `ai.ts:4113-4173`, PRZED `loadDefaultAIDiplomacyProgs`
  i przed ogólnym warunkiem `rw >= PROG_WOJNA_SILA && score < progMinimalnyRelacja` — czyli są
  strukturalnie zwolnione z ogólnych reguł prowadzenia wojny (to jest już zamierzona, trwała
  własność wojny wymuszonej, potwierdzona wcześniejszą decyzją `R-DYPLO-WYMUSZONA-WOJNA-POZA-
  OGOLNYMI-REGULAMI-Q1`). Nowy mechanizm Żelaza MA zachować tę samą własność.
- Koordynowany wybór celu (wykluczanie kandydatów już-w-wojnie, `candidatesAlreadyAtWarIds`)
  istnieje dla Kamienia/Brązu — potwierdź reconem czy `forced-war-bronze.ts` go implementuje i
  skopiuj identycznie dla Żelaza (to jest część "parametrów Brązu 1:1").

GOAL
1. Utwórz `gra/src/game/forced-war-iron.ts` jako wierną kopię `forced-war-bronze.ts` — TE SAME
   wartości progowe (tura startu, warunek końca, okres karencji/cooldown, próg siły/relacji,
   ewentualny limit jednoczesnych wojen wymuszonych per trudność), zmienione WYŁĄCZNIE
   odniesienia specyficzne dla epoki (nazwy jednostek/budynków, jeśli logika Brązu je
   referencuje bezpośrednio — sprawdź reconem czy w ogóle to robi, może być całkowicie
   epoko-neutralna poza samym faktem "epoka=Żelazo").
2. Podłącz nowy mechanizm w main.ts analogicznie do istniejącego podłączenia Brązu — jeden,
   minimalny punkt wpięcia (znajdź go reconem, prawdopodobnie tam gdzie `forced-war-bronze.ts`
   jest dziś importowane/wołane).
3. Zero zmian w `forced-war-stone.ts`/`forced-war-bronze.ts` — kopiuj, nie refaktoryzuj
   wspólnego kodu w tej rundzie (jeśli widzisz oczywistą okazję do wspólnej abstrakcji, zgłoś ją
   w raporcie jako propozycję, nie realizuj bez osobnej zgody).
4. Nowy mechanizm MA być, tak jak Kamień/Brąz, strukturalnie zwolniony z ogólnych reguł
   (wczesny return przed ogólną ścieżką decyzyjną) i strukturalnie wykluczony z celowania w
   gracza (filtr `oid > 0`, zgodnie z istniejącą, potwierdzoną decyzją
   `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1` Q2 — wojna wymuszona celuje w najbliższego sąsiada AI,
   nigdy w gracza).

KRYTERIA KOŃCA (binarne)
1. Test: nowa gra w epoce Żelaza, symulacja odpowiedniej liczby tur (dobierz sensownie wg
   parametru "tura startu" skopiowanego z Brązu) — mechanizm wojny wymuszonej Żelaza faktycznie
   się uruchamia (żywy dowód, nie czytanie kodu).
2. Test: parametry (tura startu, warunek końca, cooldown) są BAJT-IDENTYCZNE z wartościami
   Brązu — porównanie liczbowe PRZED/PO (z `forced-war-bronze.ts` jako źródło prawdy).
3. Test: wojna wymuszona Żelaza NIGDY nie celuje w gracza (`ownerId===0`) — potwierdzone żywo,
   nie tylko czytaniem filtra.
4. Zero regresji na Kamieniu/Brązie — istniejące testy `forced-war-stone-test.cjs`/
   `forced-war-bronze-test.cjs` (lub analogiczne, znajdź reconem) bez zmian wyników.
5. Nowy test `forced-war-iron-test.cjs` (lub analogiczny wzorem istniejących) pokrywający
   analogiczny zakres co testy Kamienia/Brązu.
6. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/forced-war-iron.ts (nowy plik).
- gra/src/game/forced-war-common.ts — WYŁĄCZNIE jeśli recon wykaże że rejestr epok/wspólne typy
  wymagają rozszerzenia o Żelazo (opisz dokładnie co i dlaczego w raporcie).
- gra/src/main.ts — WYŁĄCZNIE jeden punkt podłączenia analogiczny do istniejącego dla Brązu.
- Nowy test w gra/tools/forced-war-iron-test.cjs (lub analogiczna nazwa).
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana
`forced-war-stone.ts`/`forced-war-bronze.ts`, zmiana ogólnej (niewymuszonej) ścieżki decyzyjnej
AI (`ai.ts` Priorytet 4), zmiana celowania wojny wymuszonej w gracza.

IZOLACJA
worktree /home/user/wt-zelazo-wojna-wymuszona, gałąź
autobot/P-DYPLO-ZELAZO-BRAK-WOJNY-WYMUSZONEJ-Q1, baza jawnie: origin/main (najnowszy commit na
moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-zelazo-wojna --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1 za spełnione bez żywej symulacji wielu tur pokazującej FAKTYCZNE
wywołanie mechanizmu wojny wymuszonej w epoce Żelaza — czytanie samego kodu warunku nie
wystarcza. Zakaz założenia że parametry Brązu są "oczywiste" bez ich dosłownego odczytania z
`forced-war-bronze.ts` przed skopiowaniem — jeśli plik zawiera coś specyficznego dla Brązu
(np. nazwę technologii wyzwalającej), zapytaj się jawnie w raporcie jak to przełożyć na Żelazo
zamiast zgadywać.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora, ręką
orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.
