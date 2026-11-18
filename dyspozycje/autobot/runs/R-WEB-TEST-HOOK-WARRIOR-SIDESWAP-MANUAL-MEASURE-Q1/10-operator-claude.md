# R-WEB-TEST-HOOK-WARRIOR-SIDESWAP-MANUAL-MEASURE-Q1 — Operator (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko hak testowy civTest + narzędzie pomiarowe; zasady walki bez zmian)
TEMAT: R-WEB-TEST-HOOK-WARRIOR-SIDESWAP-MANUAL-MEASURE-Q1
GOAL: hak zamiany stron i hak trybu ręcznego pod ?civTest=1, pomiar Wojownik 10v10 w obu rolach i obu trybach trafień.
BAZA/KANDYDAT: baza 862eaae4aa46f9a9649ea521e02043be4ec66d7e (origin/main, ancestor OK); kod operatora = czubek commita tego tematu (pole sha).

## ZMIANY / COMMIT
- gra/src/game/civ-test-hooks.ts: `setGeneral(owner,q,r)` i `setSwapSides(v)` (tylko deps/API civTest, +9 linii).
- gra/src/main.ts: flaga `_civTestSwapSides` + `civTestSwapSidesFlag()` (działa tylko z ?civTest=1); konstruktor BattleScene (bloki przy wejściu na pole): role busów, deploy/manualControlAllowed, lidery właścicieli dla bonusów cywilizacji, głodu, złota i trudności — zamieniane tylko przy fladze (poza blokiem civTest; bez flagi wartości identyczne). Diff: 44 linie w main.ts, 9 w civ-test-hooks.ts.
- gra/tools/live-verify-wojownik-sideswap-manual-q1.cjs: nowy sterownik (rola `swap`, tryb `manual` z pętlą rozkazów). Oryginał live-verify-wojownik-map-q1.cjs bez zmian.
- Raport, tabela 160 pomiarów (60-pomiar-tabela.md), evidence/ (surowe JSON, sumy Wilson, wyniki bramek, mutacja).

## HAKI — CO DZIAŁA
- Zamiana stron: wykonana jako zamiana ról sceny (gracz = obrońca, barbarzyńca = atakujący). ŚCIEŻKA MAPOWA AI→GRACZ (AI atakuje stos gracza na mapie): NIE ZMIERZONO — eksperyment z barbarzyńcą jako właścicielem 1 i wywołaniem tury też nie dał okna przed bitwą.
- Tryb ręczny: `setGeneral` ustawia generała na stosie gracza; scena wchodzi w tryb ręczny (manualCommanderGate=true, playerHasCommander=true). Sterownik wydaje rozkaz „attack” najbliższemu wrogowi i kickoff (Spacja). Obciążenie: na stosie gracza pojawia się Wódz (9 Wojownik + 1 Wódz), więc wynik manualny NIE jest czystym 10v10.
- Tryb AUTO bez zmian: wynik ziarna 1 (losowe, atk) identyczny z bazą (zwycięzca atakujący, 26 rund, 4/3 pozostało).

## TESTY
- tsc --noEmit: exit 0.
- logic-test 213/213; tech-tree-test 20 pass / 0 fail; research-test ALL GREEN; unit-replace-test 21/21; combat-test exit 0 („All sanity checks passed”).
- Mutacja: bundle bez haków (dist z bazy) + sterownik rola swap → `window.__civTest.setSwapSides is not a function` (czerwony); bundle z hakami → zielony.
- Build: vite build 15–17 s, poza repo (scratchpad).

## POMIAR (20 ziaren × 2 role × 2 tryby trafień × tryb auto/ręczny = 160 przebiegów, 0 błędów)
Wilson 95%, „atakujący sceny” = strona atakująca w scenie (w `atk` = gracz, w `swap` = barbarzyńca):
- losowe, AUTO: atak 10/20 (gracz-atak) i 8/20 (gracz-obrona) → łącznie 18/40 = 45%, [31; 60]. Brak dowodu przewagi obrońcy.
- pewne, AUTO: atak 6/20 i 6/20 → łącznie 12/40 = 30%, [18; 45] → obrońca 70%, [55; 81]: poza 50%, ALE tylko 8–9 unikalnych wyników na 20 ziaren (tryb deterministyczny) — nie 20 niezależnych prób.
- Ręczny (obciążony Wódzem gracza): losowe 17/40 atak; pewne 15/40 atak. Nieporównywalne z AUTO.
- Sterowanie nie zostało rozdzielone od roli osobnym przebiegiem (w AUTO sterowanie nie wpływa na walkę).

## WNIOSEK (ograniczony)
Asymetria w AUTO zależy od ROLI (kto jest atakującym w scenie), nie od tego, czy gracz/AI — w AUTO sterowanie nie wpływa na walkę. Jedyny kandydat do przewagi obrońcy: tryb „pewne” (70%, mała liczba unikalnych wyników). Reguły do izolowania (nie zmieniane): battleScene.ts ~5767–5772 (kolejność inicjatywy: atakujący przed obrońcą przy każdym indeksie), ~9540–9546 (pewne: hitPct 100, roll 0), ~3667–3670 (bramka trybu ręcznego). Przyczyna NIE ZMIERZONA (brak pomiaru izolującego).

## DECYZJA WŁAŚCICIELA (opcjonalnie)
Przewaga obrońcy w „pewne” wykracza poza 50%, ale oparta na 8–9 unikalnych wynikach. Opcje: A) uznać za wynik i zlecić izolację reguły (kolejność inicjatywy vs premie obrony) — rekomendacja; B) powtórzyć na większej liczbie ziaren z innym profilem (zmiana rozstawienia) przed decyzją; C) zamknąć jako szum deterministyczny.

## BLOKADY
- Ścieżka mapowa AI→gracz (prawdziwy atak AI na stos gracza): NIE ZMIERZONO.
- Tryb ręczny bez generała: niemożliwy bez zmiany zasad; wynik ręczny = stos z generałem i proste rozkazy „atak najbliższym” (nie czysty 10v10).

## RUNDY
1/5 (jeden Operator, bez obrony).

## NASTĘPNY KROK
Evaluator/Final Control: weryfikacja diffu (tylko bloki civTest + konstruktor flagowany), powtórzenie bramek, decyzja właściciela wg sekcji DECYZJA.

DEPLOY/PUSH: NIE WYKONANO
