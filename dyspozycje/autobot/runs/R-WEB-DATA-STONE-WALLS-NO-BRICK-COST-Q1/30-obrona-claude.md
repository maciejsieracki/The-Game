# R-WEB-DATA-STONE-WALLS-NO-BRICK-COST-Q1 — obrona Operatora (runda 2)

STATUS: PASS-WITH-NOTES (kod i testy zielone; Chromium NIE ZMIERZONO — patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-DATA-STONE-WALLS-NO-BRICK-COST-Q1
GOAL: Mury kamienne (`mury_kamienne`) bez cegły w `koszt_surowce`; Mury ceglane (`mury`) zachowują cegłę. Bez innych zmian balansu.
BAZA: kandydat 9419e7ded (Operator r1), poprawki r2 na nim.
KOD ODPOWIEDZI: f4f9d697d (poprawki r2: uwagi, doc 45, test, wikiBundle). Raport: ten plik, osobny commit.

## ZMIANY / COMMIT

Commit f4f9d697d (allowlista zachowana, `git add` po ścieżkach):
- `gra/data/buildings.json` — tylko `uwagi` bloku `mury_kamienne` (koszt_surowce bez zmian względem 9419e7ded).
- `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` — akapit Murów (l. 198).
- `gra/tools/stone-walls-no-brick-cost-test.cjs` — usunięta asercja M1.
- `gra/src/data/wikiBundle.json` — regeneracja `node gra/tools/bundle-wiki-for-game.cjs` (diff 2 linie).

`git diff --check` (staged i worktree): czysto. `git diff --stat` względem 9419e7ded: 4 pliki, 6 insertions, 7 deletions.

## TESTY (surowe wyniki, zmierzone w tej rundzie)

- `tsc --noEmit -p gra`: exit 0.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0 / TOTAL 33.
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21).
- combat-test: COMBAT TEST 6/6 pass.
- stone-walls-no-brick-cost-test (kandydat + poprawki): 11 PASS, 0 FAIL.
- stone-walls-no-brick-cost-test na danych bazowych (`git show 1b8ce0d39:gra/data/buildings.json` podmienione w worktree, potem przywrócone, `cmp` identyczny): 6 PASS, 5 FAIL — FAIL: D1, K1, G1, G3, P1. Test jest czerwony na bazie.
- fortifications-stack-repro-test: WYNIK 49 OK, 0 FAIL.
- koszty-surowcowe-test: 161 pass, 0 fail.
- upgrade-budynki-test: 60 pass, 1 fail — TEN SAM wynik na danych bazowych (1b8ce0d39) → dług bazowy, nie regresja.
- building-upkeep-resources-test: 47 passed, 1 failed (D10 „karta używa polskich etykiet”) — TEN SAM wynik na danych bazowych → dług bazowy.
- building-queue-refund-test: 5 passed, 0 failed.
- Chromium: NIE ZMIERZONO (patrz BLOKADY).

## ODPOWIEDZI NA ZARZUTY EVALUATORA (b81a5914b)

1. **Brak Chromium — PRZYJMUJĘ, nie wykonano.** Binarka `/usr/bin/chromium` istnieje, ale zrzut karty i budowy przy 0 cegły wymaga przejścia realnej sesji gry (build vite do katalogu własnego, start nowej gry, wejście do miasta, panel budowy). Nie zrobiono w tej rundzie. NIE ZMIERZONO. Dowód zastępczy: logika `buildingStockCost` / `canAffordBuildingStock` / `missingStockFor` / `deductBuildingStockCost` (G1–G4, P1) w teście. Ten punkt jest blokadą dla READY_FOR_DEPLOY wg kryterium 6 dispatchu.

2. **Doc 45 l. 198 — PRZYJMUJĘ, poprawione** w f4f9d697d. Zmierzone przed zmianą: `grep -n cegł docs/PORADNIK-GRACZA/45-katalog-budynkow.md` → l. 198 „Oba warianty … 80 kamienia i 80 cegły”. Po zmianie: Mury kamienne 35 pracy + 80 drewna i 80 kamienia (bez cegły); Mury ceglane z cegłą. Zarzut „raport twierdzi, że plik nie podaje kosztu” — przyjmuję jako błąd mojego raportu r1 (NIE ZMIERZONO w r1 w tym pliku).

3. **Skutek uboczny w utrzymaniu surowcowym — PRZYJMUJĘ jako fakt, NIE zmieniam mechanizmu.** `gra/src/game/economy-upkeep.ts:672–712` (komentarz „Mury (utrzymanie 2) => 2 drewna + 2 kamienia + 2 cegły na turę”): utrzymanie surowcowe jest liczone dla każdego typu z `koszt_surowce`. Efekt: Mury kamienne zużywają na turę 2 drewna + 2 kamienia (dawniej też 2 cegły). Pieniężne utrzymanie 2 ¤/t bez zmian. Dispatch zakazuje zmian balansu utrzymania, więc nie cofam tego w kodzie. **Do decyzji orkiestratora/właściciela:** czy zostawić (spójne z intencją: budynek bez cegły nie zużywa cegły) — rekomendacja Operatora: zostawić i potwierdzić. Pokrycie testowe: `upkeep-test` i `building-upkeep-ceramics` nie dotyczą Murów kamiennych; nie dodano nowego testu upkeepu, bo zmiana nie jest celem tematu i wymagałaby nowego zapisu balansu. `uwagi` poprawione (patrz ZMIANY).

4. **Test M1 jako tautologia — PRZYJMUJĘ, asercja usunięta** (f4f9d697d). Prawdziwy dowód mutacyjny: patrz TESTY (baza 6 PASS / 5 FAIL). Pokrycie AI parity, zwrotu i kolejki budowy — PRZYJMUJĘ częściowo: nie dopisano nowych asercji w tej rundzie. Zwrot i kolejka: `building-queue-refund-test` 5/0 (zielony, powyżej). AI parity: używa tej samej funkcji `buildingStockCost` co gracz (nie sprawdzono osobnym testem). NIE ZMIERZONO osobny test AI.

5. **Audyt niepełny — PRZYJMUJĘ, uzupełniono w tej rundzie.**
   - Grep pól `uwagi` z „szablon” (`gra/data/buildings.json`): jedyny wynik to `mury_kamienne` (ten sam, już poprawiony). Brak innych.
   - Budynki z `cegla` w `koszt_surowce` (25 wpisów, id / epokaWejscia / koszt): odlewnia_zelaza 3; wielka_odlewnia 4; port_wielki 3; spichlerz_ii 2; swiatynia 2; biblioteka 2; akwedukt 2; mennica 2; mury 2 (ceglane); emporion 2; magazyn 2; palac_iii 3; kuznia_zelaza 3; wielka_kuznia 4; fort 3 (Cytadela, 100 cegły); baszta 3 (100 cegły); warsztat_oblezniczy 3; akademia 3; teatr 3; sad 3; dwor_zarzadcy 2; pretorium 3; trybunal 2; laznia_publiczna 3; akademia_wojskowa 3.
   - Grupy o IDENTYCZNYM `koszt_surowce` (po zmianie): {drewno 30, kamien 30}: kamieniarski, kuznia, port, cegielnia, stela; {drewno 40, kamien 40}: odlewnia_brazu, kamienne_kregi, koszary; {drewno 30}: targowisko, garncarnia, dom_starszyzny, garnizon; {cegla/drewno/kamien 30}: biblioteka, magazyn, dwor_zarzadcy; {40}: swiatynia, mennica, trybunal; {50}: odlewnia_zelaza, port_wielki, spichlerz_ii, kuznia_zelaza, warsztat_oblezniczy, teatr, sad, pretorium; {60}: akwedukt, emporion, laznia_publiczna; {70}: wielka_odlewnia, palac_iii, akademia, akademia_wojskowa; {80}: mury, wielka_kuznia; {100}: fort, baszta.
   - Ocena „czy logicznie wymagają cegły” — NIE ZMIERZONO punkt po punkcie; to decyzja właściciela. Zwracam uwagę na: Cytadela (`fort`) i Baszta (`baszta`) mają 100 cegły, a poradnik `docs/PORADNIK-GRACZA/07-miasto-budowa-rekrutacja.md:187` mówi „Mury / Cytadela / Baszta: drewno + kamień (bez cegły)” — to rozjazd danych z dokumentacją (patrz UWAGI).

6. **Baza 1b8ce0d39, nie bieżący origin/main — ODRZUCAM jako poprawkę w tym temacie.** Start od 9419e7ded wskazany w dispatchu. Merge z main to zadanie integracji orkiestratora (dispatch: „Nie integrujesz”). Ostrzeżenie zostaje: merge-base 9419e7ded z origin/main = edaba111f, a origin/main = 5304bbab8. Konflikt możliwy w `gra/src/data/wikiBundle.json` — regeneracja narzędziem `bundle-wiki-for-game.cjs`, nie ręcznie.

## BLOKADY

- Chromium (kryterium 6): NIE ZMIERZONO w r1 i r2. Wymaga osobnej sesji weryfikacji wizualnej. Bez tego nie wystawiać READY_FOR_DEPLOY.
- Decyzja właściciela: utrzymanie surowcowe Murów kamiennych bez cegły (pkt 3 odpowiedzi).
- Dług bazowy niezwiązany z tematem: `upgrade-budynki-test` 60/1 i `building-upkeep-resources-test` 47/1 (D10), identyczne na 1b8ce0d39.

## RUNDY

2/5 (runda obrony po zarzutach Evaluatora b81a5914b). Poprzednio: runda 1 (Operator, 9419e7ded).

## NASTĘPNY KROK

Evaluator r2 (weryfikacja poprawek f4f9d697d, w tym decyzja o uwagach i teście) → Final Control. Przed FC: Chromium (pkt BLOKADY) i decyzja właściciela co do utrzymania cegły.

## UWAGI-DLA-ORKIESTRATORA

- Pozostałe wzmianki o kosztach Murów w dokumentacji, poza allowlistą tej rundy i NIE zmienione: `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md:329` i `:382` („Mury | 15 cegły”, „Mury koszt 15 cegły”) — niezgodne z danymi (80 cegły dla Murów ceglanych, 0 dla kamiennych) także na bazie; `docs/PORADNIK-GRACZA/02-mapa-swiata.md:227` („Mury = 15 cegły”); `docs/PORADNIK-GRACZA/07-miasto-budowa-rekrutacja.md:187` („Mury / Cytadela / Baszta: drewno + kamień (bez cegły)” — błędne dla Murów ceglanych i Cytadeli/Baszty z 100 cegły). Do zdecydowania: osobny temat dokumentacyjny.
- Nie jest to bugiem tego tematu, ale dane `fort` (Cytadela) i `baszta` mają 100 cegły; pytanie ABC o to, czy są logicznie ceglane.
- Lokalnie w worktree dodano symlink `gra/node_modules` do `wf_7b73eaa4-0a5-1/gra/node_modules` (tylko do odczytu, gitignored). Usunięty przed zakończeniem.

DEPLOY/PUSH: NIE WYKONANO
