# R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 — Operator (runda 4/5, Sonnet)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; hooki wyłącznie za ?civTest=1; zero zmian reguł handlu/balansu)
TEMAT: R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1
GOAL: zmierzyć częstość ofert handlowych AI→gracz w pełnej grze: ≥3 ziarna × ≥150 tur × ≥3 poziomy relacji; oferty/100 tur, aktywne „Przyjmij”, pary surowców. Wniosek bez progu (liczby do decyzji właściciela).
BAZA: 3f729c9c4d861ab1bb65b8e68d06fbaf4a0aba99 (detached). Model: Operator SONNET (uzasadnienie w DODATKU r3/r4: dwie porażki Haiku).

## ZMIANY/COMMIT (allowlista: main.ts, civ-test-hooks.ts, tools/measure-*, dyspozycje/.../**)
- gra/src/game/civ-test-hooks.ts: `civTestRuntime` rozszerzony o `relPin` i `relAtDecision` (domyślnie null; ustawiane wyłącznie z haka).
- gra/src/main.ts: (a) hak `setRelationPin(ai,total|null)` w `__aiTradeWiringTestDebug` (tylko ?civTest=1, blok `if (/[?&]civTest=1/...)`), (b) w pętli dyplomacji po `tickDiplomacy` i PRZED `relacjeDip`/`pickAiPlayerCyclicBarter`: gdy `relPin` ustawiony dla tego AI, relacja zastępowana przypiętą (`zaufanie=floor(t/2)`, `respekt=t-zaufanie`) i zapisywana do `relAtDecision`; (c) `state()` zwraca `relAtDecision`. Bez haka `relPin===null` -> ścieżka gry bez zmian (jedno sprawdzenie null).
- gra/tools/measure-ai-trade-offer-frequency.cjs: pin przez `setRelationPin` ustawiany ZAWSZE (także po wznowieniu — stan strony ginie), `perTurn.relAtDecision`, pola `relAtDecisionAllPinned`, `relAtDecisionDistinct`.
- evidence: `evidence/r4-matrix-prepared/` (9 komórek + summary.md/json), `evidence/r4-z1/` (smoke Z1, fast/normal, diagnostyka ramienia naturalnego).

## WERDYKT PER ZARZUT FC r3
### Z1 — pin relacji nadpisany tickiem — NAPRAWIONE, dowód w danych
- Smoke (prepared, ziarno 1111, 6 tur; `evidence/r4-z1/smoke-prepared-1111-rel20.json`, `...rel140.json`): `relTotalAi/relAtDecision` per tura: pin 20 -> `20/20 x6`, pin 140 -> `140/140 x6`; `relAtDecisionDistinct` [20] vs [140]. Przed poprawką (r3): pin80 i pin140 -> 29.
- Cała macierz 9 komórek (także komórki wznowione): `relAtDecisionAllPinned=true`, `relAtDecisionDistinct` = [20] / [80] / [140] odpowiednio. Trzy poziomy relacji są teraz ROZDZIELONE w chwili decyzji AI.
### Z2 — ramię naturalne — UDOKUMENTOWANE jako NIE_ZMIERZONO (bez zmian reguł)
- Mechanizm utraty miasta (ziarno 2222, 110 tur, log w `evidence/r4-z1/natural-diag2-s2222-t110.json`): jedyne miasto gracza `Testpolis` jest w `tier=unrest` (porPct 28,6) od ok. t90, AI1 jest z graczem w WOJNIE od początku (`tury wojny=89` w t90; AI1 co turę `zaproponuj_pokoj`), AI buduje `warsztat_oblezniczy` (t90) i miasto przepada w t102 (cities 1 -> 0). Ziarno 5555: analogicznie (miasto zniknęło t100, `unrest` + AI w wojnie). Oba ziarna ponowione w tej rundzie (`natural-diag-s2222/5555-t110.json`): `gracz bez miast` 101/99.
- Wniosek: ramię naturalne = pasywny gracz w wojnie od t1; oferty handlowe są wykluczone (relStatus=wojna, brak kontaktu/technologii) i 3 z 6 ziaren kończy się < 150 tur. Wyniki natural dla ziaren 2222/3333/5555 po utracie miasta: NIE_ZMIERZONO. Ramię naturalne NIE jest podstawą wniosku o częstości (nie zmieniano reguł, nie ustawiano ramienia pomiarowego pod utrzymanie miasta).
### Z3 — ramię prepared ≥3 ziarna × 150 tur — SPEŁNIONE
- Macierz 3 ziarna (1111, 2222, 3333) × 3 relacje (20, 80, 140) × 150 tur, wszystkie 9 komórek `koniec przebiegu`, zero `NIEDOKONCZONE` (`evidence/r4-matrix-prepared/summary.md`). Wznowienia (limit 590 s) użyte w 6 komórkach (1111 i 3333), spójność wznowienia: pin relacji nadal rozdzielony (`relAtDecisionAllPinned=true`).
### Z6 — liczniki bitew po wznowieniu / fast vs normal — CZĘŚCIOWO, ograniczenia jawne
- Liczniki bitew (`autoBattles`, `battleActs`) po wznowieniu mogą być zawyżone względem przebiegu nieprzerwanego (r3: 16 vs 10; przyczyna: punkt kontrolny jest zapisywany przed ostatnim rozstrzygnięciem bitew w tej turze). NIE naprawiono; zapisane jako OGRANICZENIE: liczniki bitew z komórek wznowionych (1111: 4/2/4) nie są źródłem wniosku; wniosek opiera się na `offerLog`/`perTurn`, które po wznowieniu są zgodne.
- Fast vs normal na przebiegu Z OFERTĄ (prepared, 2222, rel 20, 30 tur, oferta w t25-26): `evidence/r4-z1/normal-prepared-2222-rel20-30t.json` vs `fast-prepared-2222-rel20-30t.json` — `perTurn` identyczne (brak rozbieżności), `offerLog` identyczny (t25 sol->glina, Przyjmij aktywne).
- WAŻNE ODKRYCIE (NIE naprawiane — poza allowlistą, pre-existing): ten sam scenariusz (to samo ziarno, ta sama relacja, ten sam kod) uruchomiony ponownie daje INNY przebieg od tury ok. 24: trzy kolejne przebiegi (`fast-noprofile-B`, `fast-freshprofile`, `fast-freshprofile-B`) -> oferta w t26 (sol->glina albo drewno->glina) zamiast t25 sol->glina; rozbieżność w `perTurn` od indeksu 23. Zgodne były tylko dwa pierwsze przebiegi (normal i fast). Wniosek: gra przy tym samym ziarnie NIE jest w pełni deterministyczna między przebiegami (źródło nieustalone: NIE_ZMIERZONO), więc kryterium „to samo ziarno = ten sam wynik” NIE jest spełnione w sensie ścisłym i nie wynika z trybu przyspieszonego (fast-vs-fast też się rozjeżdża). Dla wniosku o częstości to nie przeszkadza: oferty 1–2 na komórkę niezależnie od przebiegu, ale to jest zgłoszenie do osobnego tematu (źródło niedeterminizmu).
### Z4, Z5 — bez zmian (oddane przez Evaluatora z notą).

## WYNIKI POMIARU (ramię prepared; surowe: evidence/r4-matrix-prepared/)
| ziarno | relacja | tury | oferty handlowe (wszystkie cykliczne) | /100 tur | Przyjmij aktywne | pary surowców |
|---|---|---|---|---|---|---|
| 1111 | 20 | 150 | 2 (t30, t85) | 1,33 | 2 | sol->glina, drewno->glina |
| 1111 | 80 | 150 | 1 (t46) | 0,67 | 1 | sol->glina |
| 1111 | 140 | 150 | 1 (t24) | 0,67 | 1 | sol->glina |
| 2222 | 20 | 150 | 1 (t26) | 0,67 | 1 | drewno->glina |
| 2222 | 80 | 150 | 2 (t25, t44) | 1,33 | 2 | drewno->glina, sol->glina |
| 2222 | 140 | 150 | 1 (t25) | 0,67 | 1 | drewno->glina |
| 3333 | 20 | 150 | 1 (t20) | 0,67 | 1 | sol->glina |
| 3333 | 80 | 150 | 1 (t19) | 0,67 | 1 | sol->glina |
| 3333 | 140 | 150 | 2 (t20, t90) | 1,33 | 2 | sol->glina, drewno->glina |

Zbiorczo: 12 ofert / 1350 tur = 0,89 oferty na 100 tur; relacja 20: 4/450 = 0,89; relacja 80: 4/450 = 0,89; relacja 140: 4/450 = 0,89 (brak widocznej zależności od relacji przy tej liczebności). Wszystkie 12 ofert z „Przyjmij” AKTYWNYM (12/12). Pary: sol->glina 6, drewno->glina 6. Jednorazowe oferty handlowe: 0. Oferty dyplomatyczne w prepared: 0 (wyciszone przez `prepare()`). Pierwsza oferta w każdej komórce w t19–t46, druga (4 komórki: 85, 44, 90 i 25/44 dla 2222-r80) w t44–t90. Wniosek BEZ progu: AI składa ok. 1 ofertę handlową na ~112 tur (0,9/100 tur) w warunkach przygotowanych (kontakt + technologia Wymiany, wyciszone inne klasy ofert), tylko pary z glina po stronie otrzymywanej; liczby do decyzji ABC właściciela. Ramię natural: 0 ofert handlowych w 18 komórkach r3 (wojna + brak technologii/kontaktu), nie jest miarą.

## TESTY (surowe wyjście)
- `npm ci --ignore-scripts` (gra/): OK.
- `npx tsc --noEmit` (gra/): EXIT 0 (po zmianach main.ts/civ-test-hooks.ts).
- logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/0; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6 pass 0 fail. Wszystko zielone.
- Bramka bez flagi: hak `setRelationPin` jest w tym samym bloku `if (/[?&]civTest=1/.test(location.search))` co `__aiTradeWiringTestDebug` (przed r4 potwierdzone dowodem `evidence/gate-noflag-civSeed999-r3.json`: hookPresent=false, seed 271828); w r4 NIE powtarzano przebiegu bramki (zmiana mieści się w tym samym bloku) — NIE_ZMIERZONO ponownie.
- Mutacja Z1: dowód „bez poprawki” = dane r3 (pin80/140 -> 29 po ticku); „z poprawką” = relAtDecision = pin w 9/9 komórek. Osobnego mutanta nie uruchamiano.
- Build bundle vite poza repo (`/tmp/claude-0/meas-r4/dist`), nie `npm run build`.

## BLOKADY
Brak blokad. Niedeterminizm gry między przebiegami (patrz Z6) — do osobnego tematu.

## RUNDY
4/5.

## NASTĘPNY KROK
Evaluator -> Final Control. Rekomendacja: przyjąć Z1/Z3 jako zamknięte, Z2 jako udokumentowane, Z6 jako ograniczenie; zgłosić osobny temat „niedeterminizm tej samej gry przy tym samym ziarnie”.

DEPLOY/PUSH: NIE WYKONANO
