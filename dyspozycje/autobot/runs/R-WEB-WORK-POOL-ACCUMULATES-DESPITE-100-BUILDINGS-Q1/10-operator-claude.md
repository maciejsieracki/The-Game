STATUS: PASS-WITH-NOTES (DECISION_REQUIRED dla wariantu produktowego, patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-WORK-POOL-ACCUMULATES-DESPITE-100-BUILDINGS-Q1
GOAL: przy podziale 100% na budynki panel/baner nie twierdzi "0 do puli", gdy pula rośnie; jedno źródło prawdy; zero kopii i zero utraty Pracy.

## Diagnoza (zmierzona, Chromium, realny endTurn, 1 miasto Rzymian, civTest=1)

Błąd jest REALNY, ale to NIE jest podwójne księgowanie stanu. Przyczyna: jawny wyjątek silnika
`pracaImperialPoolGain` (gra/src/game/production.ts): gdy kolejka budowy miasta jest PUSTA (i niewstrzymana),
CAŁA Praca miasta (doBudynkow + doPuli) trafia do puli imperium (nie ma czego finansować w mieście).
Stan gry jest spójny (Praca raz: albo kolejka, albo pula — zero kopii, zero utraty). Natomiast WYŚWIETLANIE
(tabela miast i nagłówek „X do budynków · Y do puli” w panelu imperium, baner Pracy i chipy w panelu miasta)
pokazywało surowy podział suwaka (np. 8 do budynków / 0 do puli), podczas gdy kafelek „PULA IMPERIUM” słusznie
rósł o +8. To dokładnie zrzut właściciela (Ateny: „6 do budynków · 0 do puli”, a „PULA IMPERIUM 6 +6”) —
Ateny miały pustą kolejkę. Przy NIEPUSTEJ kolejce pula przy 100% nie rośnie (pomiar niżej) — silnik poprawny.

Rozstrzygnięcie (a) vs (b) z DODATKU 2: pula FAKTYCZNIE rośnie (stan, nie tylko UI) — ale wyłącznie przy pustej
kolejce, i to zgodnie z udokumentowanym wyjątkiem (cityPanel.ts:5194 „Kolejka pusta: cała Praca miasta idzie do
puli imperium”; NAPRAWA HUD-PRACA-OVERFLOW, Maciej 2026-08-02). Poznane po tabeli tura→pula poniżej.

## Surowy pomiar (przed poprawką; `node tools/praca-pula-100-budynki-live-test.cjs --measure`)
```
PUSTA    100 | t2 q0->0 | split doBud/doPuli=8/0 | pula 0->8   (delta 8)  hudRate=8
PUSTA    100 | t3 q0->0 | 8/0 | pula 8->16  (delta 8)
PUSTA    100 | t4 q0->0 | 8/0 | pula 16->24 (delta 8)
PUSTA    100 | t5 q0->0 | 8/0 | pula 24->32 (delta 8)
PUSTA     90 | t6..t9   | 7/1 | delta 8 co turę
PUSTA     50 | t10..t13 | 4/4 (t13: 5/5) | delta 8 (t13: 10)
KOLEJKA  100 | t14 q40->40 | 9/0  | pula 98->98 (delta 0)  hudRate=0   postep=9
KOLEJKA  100 | t15 q40->40 | 9/0  | delta 0  postep=18
KOLEJKA  100 | t16 q40->39 | 9/0  | delta 0  (budynek ukończony)
KOLEJKA  100 | t17 q39->38 | 16/0 | delta 0
KOLEJKA   90 | t18..t21    | 19/2, 22/2, 22/2, 22/2 | delta 2 co turę (= doPuli)
KOLEJKA   50 | t22..t25    | 12/12 | delta 12 co turę (= doPuli)
```
(Kolejka 40 pozycji ustawiona hakiem testowym; liczby Pracy różnią się między przebiegami, bo rośnie populacja.)
Wniosek: pula ≠ „doPuli” wyłącznie gdy kolejka pusta; wtedy rośnie o całą Pracę, a tabela pokazywała 0 do puli.

## Poprawka (tylko wyświetlanie, silnik/bilans NIETKNIĘTE)
- `gra/src/game/production.ts`: nowa czysta `effectivePracaRouting(split, queueEmpty, paused)` — jedno źródło prawdy z
  `pracaImperialPoolGain` (pusta niewstrzymana kolejka → doBudynkow=0, doPuli=cała Praca; inaczej split suwaka).
- `gra/src/main.ts`: wiersze panelu imperium (`cityEcon.pracaPula/pracaBudynki`) liczone przez tę funkcję
  (tabela miast, nagłówek „do budynków · do puli”, SUMA). Dodany hak testowy `__workPoolTestDebug` (tylko `?civTest=1`).
- `gra/src/ui/cityPanel.ts`: `cityPracaSplit` używa tej samej funkcji (baner Pracy u góry panelu miasta, chipy
  Budynki/Pula, kolumny suwaka).
- Test: `gra/tools/praca-pula-100-budynki-live-test.cjs` (Chromium, vite build do /tmp, realny endTurn).

## Po poprawce (78 asercji OK, 0 FAIL)
Dla wszystkich 24 wierszy (pusta/kolejka × 100/90/50 × 4 tury): panel „do puli” == realny przyrost puli;
panel budynki+pula == cała Praca (zero kopii/utraty); pusta kolejka → panel pokazuje 0 do budynkow, a cała Praca do puli;
niepusta kolejka → panel == split suwaka, przy 100% pula nie rośnie (delta 0). Np. `PUSTA 100 t2: panel bud/pula=0/7, pula +7`.
Mutacja (`fallback = false && ...` w effectivePracaRouting): test CZERWIENIEJE (np. `pusta 100% t2: panel "do puli" == realny przyrost puli (0 vs delta 8)`), po cofnięciu zielony.

## TESTY
- `npx tsc --noEmit`: 0 błędów.
- 5 bramek: logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
- praca-pula-rate-parity 20/0; praca-podzial-staly-50-50 6/0; ulepszenia-praca-percent 28/0; praca-limit-50 34/0;
  praca-auto-ulepszenia-koszt-split 20/0; empire-praca-panel-coverage 15/15; praca-jeden-podzial-real-render 37/0 (Chromium).
- Znane czerwone, NIE z tej zmiany (na bazie origin/main identyczne, zmierzone przez stash): praca-jeden-podzial-kontrakt-test 635 OK / 2 FAIL
  (kontrola negatywna got 1460/1520 want 0); praca-split-ui-test 24 pass / 1 FAIL (MIN/MAX przez ten sam handler).
- praca-panel-budowy-warstwa-real-render-test 26 pass / 2 FAIL (mutacje F/M3, F/M4 — kotwice źródła); NIE_ZMIERZONO na bazie, kod buildBuildHud nietknięty.
- Zrzut baneru: nie wykonano (zmiana dotyczy wartości liczbowych w istniejących elementach; weryfikacja przez odczyt realnego snapa panelu imperium w Chromium).

## BLOKADY / DECYZJA WŁAŚCICIELA (DECYZJA_PRODUKTOWA, nie wybieram sam)
Skargę „praca odkłada się na ulepszenia mimo 100% na budynki” da się wyeliminować dwojako; zrobiłem tylko spójność
wyświetlania (bez zmiany bilansu), bo wariant 2 zmienia ekonomię:
 1. (zrobione) Pusta kolejka → cała Praca do puli (jak dotąd), ale UI mówi to prawdę.
 2. (ABC) Pusta kolejka → Praca NIE trafia do puli (przepada / lub gromadzi się jako rezerwa budowy miasta) — wymaga decyzji
    (rekomendacja: zostawić 1, bo inaczej Praca przepada). Miasto z pustą kolejką przy 100% budynków nadal „pompuje” pulę —
    gracz może wyłączyć to tylko kolejkując budowę. Do rozważenia osobno: podpowiedź w panelu „Kolejka pusta — Praca idzie do puli”.
Nie sprawdzono: wczytany zapis właściciela (brak), z administratorem/trybem auto ulepszeń (auto-ulepszenia i administrator
nie zmieniają routingu doBudynkow/doPuli — tylko wydatki z puli; pomiar hudAuto/hudCuda/upkeep = 0 w scenariuszu), kolejka wstrzymana
(poza zakresem; `paused` → bez zmiany względem wcześniej, brak Pracy ani do budynków, ani do puli w ticku).

## RUNDY: 1/5
## NASTĘPNY KROK: Evaluator (przejrzeć effectivePracaRouting + użycia w main.ts/cityPanel.ts; ewentualnie zażądać zrzutu baneru Chromium); ABC dla wariantu 2.
## DEPLOY/PUSH: NIE WYKONANO
