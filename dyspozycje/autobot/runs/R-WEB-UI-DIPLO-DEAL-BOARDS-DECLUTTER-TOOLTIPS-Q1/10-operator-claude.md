# R-WEB-UI-DIPLO-DEAL-BOARDS-DECLUTTER-TOOLTIPS-Q1 — Operator, runda 2/5

STATUS: PASS-WITH-NOTES (Operator; do decyzji FC)
DOMAIN: GAME (UI dyplomacji, wyłącznie prezentacja)
TEMAT: R-WEB-UI-DIPLO-DEAL-BOARDS-DECLUTTER-TOOLTIPS-Q1
GOAL: plansze dyplomacji: tylko liczby i werdykt, wyjaśnienia w tooltipach, SZYBKA WYMIANA na górze; nic nie usunięte.
ZMIANY-COMMIT: kod z rundy 1 bez zmian (2998c9c59, src/ui/diplomacy*.ts, diplomacyTipText.ts). Runda 2 zmienia tylko testy: `gra/tools/diplomacy-acceptance-points-test.cjs` (2 asercje) i `gra/tools/diplomacy-relation-deal-text-consistent-test.cjs` (1 asercja) — sprawdzanie treści tooltipa (`title`) zamiast widocznego DOM. Dodany zrzut PRZED/PO w runs/. SHA commita rundy 2: w polu `sha` odpowiedzi.
BAZA: 98c988d7cf0ae3dfdc0bb39b6b95f9e1c658a9fc — merge-base --is-ancestor = tak.

ZARZUTY FC (r1) — wynik:
1. diplomacy-acceptance-points-test: baza 304 pass / 0 fail; kandydat r1 302/2 → kandydat r2 **304/0**. Asercje „rel-mod row” i „hint baza z czystym mod%” czytają tooltip. Uwaga: tekst tooltipa z r1 brzmi „Baza traktatu 80 PW, Relacja −10,4% siła” (wcześniej widoczny „baza 80, Relacja −10,4% siła”); asercja sprawdza obecny tekst tooltipa, nie stary napis.
2. diplomacy-relation-deal-text-consistent-test: baza 6/0; kandydat r1 5/1 → kandydat r2 **6/0** (asercja „wiersz Relacji” na tooltipie).
3. Zrzuty Chromium: wykonane częściowo (patrz niżej).

TESTY (surowe wyniki, kandydat 2998c9c59 + testy r2):
- tsc --noEmit: exit 0
- diplo-deal-boards-declutter-tooltips-test: 13 pass / 0 fail (z mutacją: wyjaśnienie wrócone na planszę → czerwień)
- diplomacy-acceptance-points-test: 304 pass / 0 fail
- diplomacy-relation-deal-text-consistent-test: 6 pass / 0 fail
- terminology-trade-vs-tax-test: 798 pass / 1 fail — [G] gen-building-cards-top5 --check (dług bazowy, jak w FC). Pliki generatora/danych nie są zmienione względem 98c988d7c (git diff --stat), więc wynik na bazie jest ten sam z konstrukcji; NIE ZMIERZONO uruchomieniem na bazie.
- logic-test: 213/213 OK (exit 0)
- tech-tree-test 20/0; research-test 33/0; combat-test 6/6; unit-power-test 6/0; unit-replace-test 21 OK / 0 FAIL
- diplo-weariness-pw-row-ui-test 15/0; diplomacy-cyclic-trade-duration-ui-test 12/12
- Batch 132 testów dyplomacji (bez *live*/*real-render*): w wyjściu brak wyników FAIL poza liniami mutantów zabitych (KILLED / MUTANT WYKRYTY). Testy live i real-render nie uruchomione w tej rundzie.
- Baza 98c988d7c nie była ponownie mierzona dla każdego testu (koszt); dla dwóch testów zarzutu FC wynik bazy przyjęty z raportu FC (304/0, 6/0).

ZRZUTY CHROMIUM (xvfb nie był potrzebny, headless `chromium --headless`):
- `zrzut-pw-pokoj-PRZED.png` (baza 98c988d7c) i `zrzut-pw-pokoj-PO.png` (kandydat): panel PW pokoju/zawieszenia (Traktat handlowy, rel 89,6). PRZED: wiersz wpływu Relacji, „(baza 80, Relacja…)”, werdykt w czerwonym pasku. PO: trzy liczby, jednolinijkowy werdykt „Brakuje 8 PW — zawrzyj osobną umowę”, reszta w tooltipie.
- Ograniczenie: strona składana z pure-renderera i CSS z gra-robocza/Gra-ROBOCZA.html, nie z pełnej gry.
- NIE ZMIERZONO: okno „Umowa wymiany surowców”, pasek akcji z „SZYBKA WYMIANA” na górze audiencji, zrzut z widocznym dymkiem (hover) — wymaga pełnej gry z aktywną audiencją; nie zbudowano sterownika w tej rundzie.

UWAGI-DLA-ORKIESTRATORA:
- `gra/node_modules` utworzony przez `npm ci` w worktree (gitignored) — do usunięcia przy sprzątaniu.
- Uruchamianie testów `diplomacy-*` zmodyfikowało śledzony plik `dyspozycje/autobot/runs/R-WEB-PEACE-CITY-CESSION-Q1/evidence/r3-modal-pokoj-miasto.png`. Przywrócone `git checkout`; nie wchodzi do commita. Warto sprawdzić, który test go nadpisuje.
- Część 2 (R-WEB-UI-DIPLO-ALL-PROPOSAL-WINDOWS-DECLUTTER-TOOLTIPS-Q2) nie ruszana.
- Zrzuty PRZED/PO są w `runs/` obok raportu; nie są dowodem gry.

BLOKADY: brak blokad infrastruktury. Brak DECISION_REQUIRED.
RUNDY: 2/5 (Haiku, licznik porażek Haiku tematu = 1; decyzja Sonnet nie wymagana).
NASTĘPNY KROK: Evaluator (to samo ID), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
