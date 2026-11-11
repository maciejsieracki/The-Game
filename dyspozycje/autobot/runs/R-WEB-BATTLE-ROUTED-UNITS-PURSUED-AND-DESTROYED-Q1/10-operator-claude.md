STATUS: DECISION_REQUIRED (kod i testy gotowe; punkt (e) dispatchu: bitwa wręcz-vs-wręcz o równej prędkości nadal prawie nikogo nie zabija — wymagana decyzja ABC właściciela, patrz niżej)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-ROUTED-UNITS-PURSUED-AND-DESTROYED-Q1
GOAL: bitwa nie kończy się na załamaniu morale; uciekinierzy (routed) są pełnoprawnymi celami, giną w pościgu albo opuszczają planszę na krawędzi SWOJEJ strony; po bitwie brak routed na polu; parytet AUTO=SKIP zachowany.
ZMIANY/COMMIT: baza origin/main 1a42785d4; SHA commita w polu `sha` wyniku (czubek pracy). Pliki:
- gra/src/battle/battleScene.ts: `_enemiesOf` zawiera routed (cele), nowe `_activeEnemiesOf`/`_nearestActiveEnemy` dla ZAGROŻENIA (kitowanie/odwrót/`_nearestEnemyMelee`/`_kiteGapSatisfied`); `_startRout` nie zwalnia pola w `occByKey` (uciekinier jest żywą jednostką na planszy); `_checkEnd`: zalamanie morale armii => `_routWholeArmy` (wszyscy poza neverRout pękają i uciekają), koniec bitwy odroczony przez `_pursuitPending` dopóki przegrany ma routed na polu, a zwycięzca aktywnych ścigających (sufit `PURSUIT_MAX_ROUNDS = 30` tur od startu pościgu), potem `_resolveRemainingRouted` (deterministycznie: w zasięgu ruch+zasięg ataku aktywnego wroga => ginie, inaczej uznany za uciekłego); `_fleeHomeCol` — krawędź ucieczki = skrajna PRZECHODNIA kolumna (plansza 68 kol. ma po prawej ~10 kolumn nieprzechodniego marginesu kamery; dawniej uciekinierzy utykali na kol. 57 i znikali po 2 turach `fleeStuck`).
- gra/src/battle/autoBatchPhase.ts: routed zostaje w `live` (cel ataku) i dostaje rozstrzygnięcie ruchu ucieczki (wcześniej w AUTO/skip uciekinierzy w ogóle się nie ruszali: filtr `unit.routed` wycinał ich z rozstrzygnięć).
- NOWE: gra/tools/battle-routed-pursued-destroyed-test.cjs (test regresyjny, Chromium), gra/tools/battle-rout-pursuit-browser-entry.{ts,html}, gra/tools/battle-rout-pursuit-measure.cjs (pomiar przed/po + kolumna auto-rozstrzygnięcia).
- evidence/: before-a/b.json, after-a/b.json (surowe wyjścia pomiaru), poscig-uciekinierzy-scigani.png, okno-wyniku-po-zmianie.png.
Nie ruszano: MORALE_*, staty, JSON balansu, WERSJE.md, rust-port, _resetSiegeForReplay, ruchu linii (W16/W19), ścieżki auto-rozstrzygnięcia (computeInstantResult), mechanizmu odwrotu 2 heksy (post-battle-map).

TESTY (surowe wyjścia z tej sesji, worktree na origin/main + zmiany):
- `npx tsc --noEmit`: 0 błędów.
- 5 bramek referencyjnych: logic-test 213/213; tech-tree-test 20 pass/0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
- NOWY battle-routed-pursued-destroyed-test.cjs: 19 PASS, 0 FAIL (konnica 8 vs Wojownik 14 seed 1: def 8 zabitych/6 uciekło, 4 zabitych jako routed; Hastati 20 vs 10: 10/10 uciekło na krawędź, fledNotAtEdge=0).
- MUTACJA 1 (przywrócony filtr `!u.routed` w `_enemiesOf`): 15 PASS, 4 FAIL (ataki na routed = 0, killedWhileRouted 1<4, def zabitych 4<6) — test czerwienieje. MUTACJA 2 (koniec bitwy przy załamaniu morale, `_pursuitPending` wyłączone): 16 PASS, 3 FAIL (runda końca = runda załamania [2,2] i [8,8]) — czerwienieje. Kod przywrócony (plik z kopii), potem testy ponownie zielone.
- Istniejące: battle-skip-equals-auto-resolve-test CZESC B 38 ok/0 fail (seedy 1,2,3,7: SKIP == AUTO, tury 23/26/23/21); battle-skip-siege-parity-test 17/0; battle-defeat-survivor-retreat-browser-test BROWSER PASS (field/siege/instant/cap); battle-defeat-survivor-retreat-two-hex-test 44/0; post-battle-map-test 32/0; map-field-battle-test 24 ok/0; battle-summary-test OK; battle-dead-units-removed-test PASS; battle-formation-rules-test PASS; walka-morale-przewaga-mocy-test 123/123; siege-ai-test 17/0; siege-defenders-test 12/0; siege-last-stand-sortie-test 71 OK/0; battle-cavalry-flank-default-test PASS; battle-deploy-cavalry-flanks-test PASS; battle-standoff-two-warriors-test PASS; battle-cap-500-test PASS (59 asercji); battle-ranged-approach-regression-test w wariantach FOCUSED=1 i FOCUSED=approach exit 0 (pełny wariant przekracza limit 280 s — TIMEOUT narzędzia, nie zmierzono wyniku całości: NIE_ZMIERZONO). Skrypt ten nadpisuje pliki evidence cudzego tematu (R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1) — cofnięto `git checkout`, nie ma ich w commicie.
- Nie uruchomiono (nie dotyczą zmiany lub zbyt długie): battle-skip-siege-parity-live-test, siege-manual-battle-live, pozostałe siege-*-live; NIE_ZMIERZONO.

POMIAR PRZED/PO (surowe: evidence/*.json). Skrót: z=zabici, u=uciekli (opuścili planszę), r=routed zostali na polu na koniec, a=aktywni; kolumna ostatnia = auto-rozstrzygnięcie TEGO SAMEGO składu i seedu (_skipInstantFallback/computeInstantResult: z=zabici, p=przeżyli). Seedy 1,2 (Math.random deterministyczny).
PRZED (origin/main):
| scenariusz | seed | tury | taktyczna (AUTO/skip) | ataki na routed | auto-rozstrzygnięcie |
|---|---|---|---|---|---|
| wręcz 12v12 | 1 | 9 | atk 0z/0u/7r/5a ; def 0z/0u/0r/12a | 0 | atk 2z/10p ; def 12z/0p |
| wręcz 12v12 | 2 | 8 | atk 0z/0u/7r/5a ; def 0z/0u/1r/11a | 0 | atk 6z/6p ; def 12z/0p |
| strzelcy+wręcz vs wręcz | 1 | 6 | atk 2z/0u/12r/0a ; def 0z/0u/0r/12a | 0 | atk 14z/0p ; def 4z/8p |
| strzelcy+wręcz vs wręcz | 2 | 5 | atk 2z/0u/7r/5a ; def 0z/0u/0r/12a | 0 | atk 14z/0p ; def 3z/9p |
| konnica vs piechota | 1 | 2 | atk 0z/0u/0r/8a ; def 4z/0u/5r/5a | 0 | atk 0z/8p ; def 14z/0p |
| konnica vs piechota | 2 | 2 | atk 0z/0u/0r/8a ; def 4z/0u/5r/5a | 0 | atk 0z/8p ; def 14z/0p |
| przewaga 2:1 | 1 | 8 | atk 0z/0u/1r/19a ; def 0z/0u/7r/3a | 0 | atk 0z/20p ; def 10z/0p |
| przewaga 2:1 | 2 | 9 | atk 0z/0u/1r/19a ; def 0z/0u/7r/3a | 0 | atk 0z/20p ; def 10z/0p |
PO (ta zmiana):
| wręcz 12v12 | 1 | 18 | atk 0z/12u/0r/0a ; def 0z/0u/0r/12a | 1 | (bez zmian) |
| wręcz 12v12 | 2 | 18 | atk 0z/12u/0r/0a ; def 0z/0u/0r/12a | 1 | (bez zmian) |
| strzelcy+wręcz vs wręcz | 1 | 17 | atk 2z/12u/0r/0a ; def 0z/1u/0r/11a | 7 | (bez zmian) |
| strzelcy+wręcz vs wręcz | 2 | 16 | atk 2z/12u/0r/0a ; def 0z/0u/0r/12a | 7 | (bez zmian) |
| konnica vs piechota | 1 | 9 | atk 0z/0u/0r/8a ; def 8z/6u/0r/0a | 2 | (bez zmian) |
| konnica vs piechota | 2 | 9 | atk 0z/0u/0r/8a ; def 9z/5u/0r/0a | 5 | (bez zmian) |
| przewaga 2:1 | 1 | 16 | atk 0z/0u/0r/20a ; def 0z/10u/0r/0a | 22 | (bez zmian) |
| przewaga 2:1 | 2 | 17 | atk 0z/0u/0r/20a ; def 1z/9u/0r/0a | 24 | (bez zmian) |
Wnioski pomiaru: (1) routed na polu po bitwie: PRZED 5–12 na scenariusz, PO 0 we wszystkich 8 przebiegach. (2) Ataki na uciekinierów: PRZED 0, PO 1–24. (3) Zabici: konnica vs piechota 4 -> 8–9 (+100%); strzelcy bez zmian (2), wręcz-vs-wręcz 0 -> 0–1. (4) „Kotek i myszka": PRZED ocaleli przegranej strony 5–12 jednostek na bitwę (np. strzelcy: 12 routed + 0 aktywnych; konnica: 5+5), PO ocaleli to wyłącznie uciekli do krawędzi: 12 (wręcz), 11–12 (strzelcy), 5–6 (konnica), 9–10 (2:1) — nadal wracają na mapę przez istniejący odwrót 2 heksy (bez zmian, zgodnie z potwierdzeniem właściciela); liczba dogonień tej samej armii w scenariuszu wielokrotnych starć NIE ZMIERZONA (wymaga pętli świata, poza zakresem). (5) Zgodność z auto-rozstrzygnięciem: auto-rozstrzygnięcie ANIHILUJE stronę przegraną (pętla fal par `hp>0` do wyginięcia jednej ze stron, bez morale; ocalali = wyłącznie zwycięzca z resztą HP) — wzorzec właściciela; taktyczna PO jest spójna dla konnicy (przegrani: 14 zabitych w auto vs 8–9 zabitych + 5–6 uciekłych), ale NIE w granicach tolerancji dla wręcz/2:1 (auto: 10–12 zabitych, taktyczna 0–1 zabitych + 9–12 uciekłych). Tolerancji nie ustalono liczbą, bo błąd nie wynika z błędu implementacji, tylko z punktu (e) (patrz DECISION_REQUIRED). Ścieżki auto-rozstrzygnięcia NIE zmieniano.

ODPOWIEDŹ NA DODATEK 3 (i)(iv): (i) computeInstantResult (battleScene.ts ok. l.20400): fale par atak–obrona po kolei, `resolveCombat` na HP, aż jedna strona ma 0 jednostek z hp>0; przegrany znika w całości, survivors = wygrani z pozostałym HP; bez morale i bez ucieczki. Ścieżki main.ts `doMapAutoResolve`/`doAutoPowerMapBattle` nie analizowano szczegółowo (NIE_ZMIERZONO). (iv) Rozjazd dla pojedynczych jednostek z HP<max istniał (zrzut właściciela 18/22 = ocalała po poprzedniej bitwie): HP z bitwy trafia do świata (eksport `hp: Math.max(0, u.bu.hp)`), w tym module nic go nie leczy między bitwami; czy świat leczy jednostki w turach/miastach — NIE_ZMIERZONO (poza allowlistą).

BLOKADY: DECISION_REQUIRED (e) — patrz niżej. Brak innych.
Założenia (luki dispatchu): (1) zalamanie morale całej armii wymusza rout WSZYSTKICH pozostałych jednostek (poza `neverRout`) — dosłowna interpretacja „bitwa trwa do całkowitej ucieczki lub zrootowania"; bez tego niezrootowani ocalali dalej byliby „ocaleni". (2) Sufit pościgu 30 tur (dispatch (d) kazał zapisać parametr): plansza ma 68 kolumn, piechota 4 pola/turę => ~15–20 tur ucieczki z środka; 30 zostawia zapas, nie jest balansem. (3) Krawędź ucieczki = skrajna przechodnia kolumna (nie `BF_COLS-1`), bo prawe 10 kolumn to nieprzechodni margines kamery. (4) Pościg tylko w tryb AUTO/skip (ten sam tick); sterowanie ręczne gracza: gracz może wskazać routed jako cel (`_enemiesOf` je zawiera), AI-ścieżki te same. (5) Oblężenia (siegeWallCol>=0) przechodzą tę samą logikę końca; oblężenie z wyłomem nie było osobno mierzone (NIE_ZMIERZONO), test oblężeń parytet zielony.

DECISION_REQUIRED (pytanie ABC, krótko): Piechota wręcz o równej prędkości NIE dogania uciekającej piechoty, bo jednostka w aktywacji wykonuje albo ruch, albo cios (uciekinier za każdym razem odbiega o pełny ruch). Efekt: wręcz-vs-wręcz 0–1 zabitych, uciekinierzy dobiegają do krawędzi i wracają na mapę (odwrót 2 heksy); konnica i strzelcy zabijają (konnica 8–9 z 14). Bez strojenia liczb zaproponowano:
 A (rekomendacja operatora) — „pościg": jednostka może w TEJ SAMEJ aktywacji ruszyć i uderzyć zroutowanego wroga (zmiana reguły aktywacji tylko wobec routed; bez zmiany statów/morale); spodziewany efekt: znacząco więcej zabitych w wręcz i 2:1, parytet AUTO=SKIP bez zmian (ta sama pętla).
 B — premia szarży w pościgu dla konnicy/rydwanów (np. dodatkowy cios), piechota bez zmian; mniejszy efekt na wręcz-vs-wręcz.
 C — zostawić jak jest: uciekinierzy ocaleją (ale zawsze dobiegają do krawędzi i nie ma stojących routed), a auto-rozstrzygnięcie pozostaje anihilacją — rozjazd taktyczna/auto trwa.
Dodatkowo do decyzji: czy skrócić sufit pościgu (obecnie 30 tur) po wdrożeniu A.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (te same ID); równolegle ABC właściciela (A/B/C powyżej). Do integracji uwaga: kolizje W16 (_resetSiegeForReplay) i W19 (ruch linii) — moje zmiany dotykają `_checkEnd`, `_startRout`, `_fleeStep`, `_enemiesOf`, nie tych funkcji. Dług Rust (REPIN walki/rout) do wskazania: `rust-port` nie ruszany; zmieniona semantyka końca bitwy (pościg, mass-rout, krawędź ucieczki, uciekinierzy jako cele) wymaga REPIN modułu bitwy.
DEPLOY/PUSH: NIE WYKONANO
