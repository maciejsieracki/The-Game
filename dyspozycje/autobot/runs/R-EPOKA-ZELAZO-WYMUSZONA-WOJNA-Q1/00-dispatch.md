# DISPATCH — R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1

TEMAT: R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1
DOMAIN: GAME
DATA: 2026-08-27

## ECHO WLASCICIELA

„wymuszone wojny w kazdej epoce powinny byc wylaczone calkowicie z ogolnych regul prowadzenia
wojny. Inaczej nigdy nie nastapilaby wojna pomiedzy cywilizacjami" (2026-08-27, rejestr:
`R-DYPLO-WYMUSZONA-WOJNA-POZA-OGOLNYMI-REGULAMI-Q1`).

Weryfikacja zrodlowa orkiestratora: Kamien i Braz maja juz wlasny mechanizm wojny wymuszonej,
kazdy ze wlasnym plikiem (`forced-war-stone.ts`, `forced-war-bronze.ts`). **Zelazo — trzecia
i ostatnia epoka (`KOLEJNOSC_EPOK = ['Kamien','Braz','Zelazo']`, `research.ts:323`) — nie ma
zadnego mechanizmu.** Wlasciciel powiedzial „w kazdej epoce"; dzis trzecia epoka jest pominieta.

## PARAMETR — WYBOR MECHANIZMU (uzasadnienie, nie zgadywanie)

Kamien wyzwala sie **progiem tury** (`currentTurn >= 20`). Braz wyzwala sie **awansem epoki**
(cywilizacja WCHODZI do Brazu -> natychmiast szuka celu), bez progu tury. Zelazo jest — tak jak
Braz — epoka osiagana przez AWANS, nie epoka startowa. **Mechanizm Zelaza ma wiec nasladowac
Braz (wyzwalacz = awans do epoki Zelaza), NIE Kamien (prog tury byłby bez sensu — do epoki
Zelaza cywilizacje docieraja w bardzo roznych turach, sztywny prog albo strzelalby w pusty,
albo byl absurdalnie niski dla kogos kto dopiero co wszedl)**. Pozostale trzy parametry Brazu
sa identyczne z Kamieniem (2 miasta koniec wojny, 20 tur odpoczynku, 20 tur cooldownu na tego
samego rywala) — **uzyj TYCH SAMYCH wartosci dla Zelaza**, bo nie ma dzis zadnej przeslanki
zeby epoka Zelaza miala inny rytm konfliktu niz Braz. Jesli w trakcie pracy znajdziesz powod,
zeby ktoras wartosc byla inna dla Zelaza — NIE zgaduj, zglos jako BLOCK/nota do wlasciciela
zamiast wpisywac wlasna liczbe.

## GOAL

Glowna cywilizacja AI, ktora awansuje do epoki Zelaza (i nie jest juz w zadnej wojnie), force-
wypowiada wojne jednemu sasiadowi terytorialnemu — dokladnie tym samym mechanizmem co Braz
(`forced-war-bronze.ts` jako wzor 1:1), tylko dla epoki 3 zamiast 2. Miasta-panstwa i gracz
sa z tego wyluczeni identycznie jak w Kamieniu/Brazie (ten sam `isOwnerClusterCityState`,
ten sam filtr `oid > 0`).

## KRYTERIA KONCA (wszystkie wymagane)

1. Nowy plik `gra/src/game/forced-war-iron.ts` — struktura i eksporty analogiczne do
   `forced-war-bronze.ts` (funkcje czyste, bez DOM/mutacji), z wlasnymi stalymi
   `WOJNA_ZELAZO_WYMUSZONA_*` (wartosci jak w sekcji PARAMETR wyzej).
2. Wpiecie w `main.ts` analogiczne do Brazu/Kamienia (haki: awans epoki, przejecie miasta,
   zapis/odczyt stanu) — **NIE kopiuj mechanicznie, przeczytaj najpierw jak Braz jest wpiety,
   potem zrob to samo dla Zelaza z wlasnymi nazwami zmiennych/map**.
3. Wpiecie w `ai.ts` (`decideAIDiplomacy`) analogiczne do `bronzeForceWarTargetId` —
   `ironForceWarTargetId` jako kolejny wczesny `return` przed ogolnymi regulami wojny, DOKLADNIE
   jak dla Kamienia i Brazu (ECHO wlasciciela: wymuszona wojna ma byc POZA ogolnymi regulami).
4. **Pomiar PRZED i PO na >= 3 ziarnach, playtest do epoki Zelaza (>= 60-80 tur w zaleznosci
   od tempa):** PRZED — zero wypowiedzen wojny przy awansie do Zelaza (bo mechanizmu nie ma).
   PO — cywilizacje, ktore awansuja do Zelaza i nie sa w wojnie, faktycznie wypowiadaja wojne
   sasiadowi w tej samej turze awansu (albo w najblizszej mozliwej, jesli blokuje je co innego —
   opisz to jawnie).
5. Miasta-panstwa i gracz nigdy nie sa celem ani napastnikiem wojny wymuszonej Zelaza —
   dowod analogiczny do Kamienia/Brazu.
6. **Dowod nie-tautologiczny:** kazda nowa asercja czerwieni sie pod jedna celowana mutacje
   zrodla. Podaj mutacje i wynik.
7. Piec bramek referencyjnych bez pogorszenia: logic 213/213, tech-tree 19/0, research 33/33,
   unit-replace 13/13, combat 6/6. `tsc --noEmit` zero bledow.
8. Bramki `forced-war-stone` i `forced-war-bronze` bez pogorszenia (nowy mechanizm nie moze
   zepsuc istniejacych dwoch).

## ALLOWLISTA (nic poza tym)

- `gra/src/game/forced-war-iron.ts` (nowy plik)
- `gra/src/game/forced-war-common.ts` — WYLACZNIE jesli trzeba wspolnej funkcji uzytej juz
  przez Kamien/Braz (nie duplikuj, ale nie zmieniaj istniejacego zachowania dla nich)
- `gra/src/game/ai.ts`
- `gra/src/main.ts` — **UWAGA WSPOLBIEZNOSC:** rownolegle biegna inne tematy dotykajace
  `main.ts` (flaga miasta-panstwa, runda 4 AI, usuwanie farm z lasu). Pracujesz we WLASNYM
  worktree na WLASNEJ galezi. Trzymaj zmiane w `main.ts` mozliwie punktowa i wzorowana 1:1
  na strukturze istniejacej dla Brazu (latwiej zintegrowac, mniejsze ryzyko konfliktu).
  Jesli `origin/main` zmieni sie pod Toba w trakcie pracy — `git fetch` + merge/rebase,
  to oczekiwane.
- `gra/tools/**` (bramka tematu + sondy)
- `dyspozycje/autobot/runs/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1/**`

## GRANICE (naruszenie = FAIL)

- Zakaz `npm run build` / `npm run dev`; build wylacznie
  `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-zelazo-wojna-<rola> --emptyOutDir`.
- Zakaz `npx`, `git add -A`, pushu do `main`, zmian w `dyspozycje/WERSJE.md`.
- **Nie ruszaj** mechanizmu Kamienia ani Brazu poza odczytem jako wzorca — zero zmiany
  zachowania dla istniejacych dwoch epok.
- **Nie poszerzaj zakresu (§14):** nie ruszaj warunku wojny ogolnej wobec gracza
  (`ai.ts:4377-4384`) — to osobny, otwarty temat.

## OBIEG

Operator (Opus 5, effort high) -> Evaluator (Opus 5, effort high) -> Final Control (Opus 5,
effort high) -> integracja orkiestratora. Limit 5 rund.

**Final Control obowiazkowo:** `git fetch` + `git log` + SHA + potwierdzenie ze zmiany SA
W COMMITACH. Praca niezacommitowana = BLOKER.
