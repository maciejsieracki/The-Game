STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1
GOAL: ustalić, co oznaczają obie liczby „Relacja 11,6” (okno dyplomacji, wiersz „Wpływ Relacji na deal”) i „Relacja 90 / 200” (prawy panel audiencji) dla tej samej pary; czy to błąd wyświetlania.
BAZA: origin/main = 44af89169 (FALA 662). Zmiany kodu: BRAK.

## Wniosek

To NIE jest czysty błąd wyświetlania. Obie liczby są poprawnie policzone z DWÓCH RÓŻNYCH źródeł, a obie są podpisane słowem „Relacja”:

1. „11,6” = Zaufanie + Respekt ze ZAPISANEGO stanu silnika (`rel.zaufanie + rel.respekt`, bez zaokrąglenia). Ta wartość steruje modyfikatorem PW i bramką `responderPreview` (pwBalance / accepted) w panelu Punkty wymiany.
2. „90 / 200” = Zaufanie + Respekt LIVE z mocy (`Math.round(zaufanie + respekt % z computeRespekt(objectivePower))`). Ta wartość steruje tekstem audiencji i progiem handlu (getNegotiationContext.relacjaTotal).

Decyzja, którą Relacja jest „prawdziwa” i czy progi handlu mają używać tej samej co PW, jest decyzją produktową/silnikową (poza allowlistą tego tematu) — stąd DECISION_REQUIRED. Nie zmieniałem kodu.

## Tabela: miejsce w UI → źródło → znaczenie

| Miejsce w UI | Źródło wartości (kod) | Znaczenie |
|---|---|---|
| Okno dyplomacji, wiersz „Wpływ Relacji na deal” („Relacja 11,6”) | `gra/src/main.ts` ~21164/21213 → `treatyEvalRelationTotal(rel)` (`gra/src/game/diplomacy-proposals.ts:712`) = `relationTotal(rel)` = `clamp(zaufanie + respekt, 0, 200)` (`diplomacy-pn-engine.ts:147`); przekazane do `computePlayerAcceptanceSides` → `acceptanceTheir.relCurrent` → `renderRelationDealModRowHtml` (`diplomacyAcceptanceBalance.ts` ~linie 100–140) | Zapisana relacja silnika; źródło modyfikatora PW (`relationPnModPct`, ±90%) i bramki pwBalance. Nieokrąglona (wartości mogą być ułamkowe, bo `dZ/dR` z mnożnikami tempa — `diplomacy.ts` ~1087–1092). |
| Okno dyplomacji, nagłówek bilansu „Bilans (netto)” / hint PW | to samo co wiersz wyżej (`their.relCurrent` w `renderPnBalancePanelHtml`, `diplomacyAcceptanceBalance.ts` ~638) | j.w. |
| Prawy panel audiencji, „Relacja 90 / 200” | `diplomacyAudience.ts:1535` `relTotal = st.relacjaTotal`; wartość z `main.ts:25639` = `audienceRelTotalEffective` = `Math.round(zaufanie + objectiveRespektPctTowardEffective)` (`main.ts` ~25354) | Zaufanie + Respekt w % MOCY (live, zaokrąglone do całości), wersja efektywna z bonusami weterana/fortyfikacji/trudności. Tekst: „Relacja = Zaufanie + Respekt (0–200)”. |
| Audiencja, linia „Stan bieżący: Relacja X / 200” | `diplomacyAudience.ts` ~2236–2237 (`st.relacjaTotal`) | j.w. |
| Koszyk / negocjacje: próg handlu, daru, `diplomacyFairGivePn` | `main.ts:25762` `relacjaTotal: audienceRelTotal` (nominalna, power-based, zaokrąglona) → `ctx.relacjaTotal` w `diplomacyTradeBasket.ts` (~1129, 1556, 2310, 2982) | Próg/bramka handlu liczona na NOMINALNEJ wersji power-based, NIE na zapisanej relacji z panelu PW. |

## Dlaczego to jest rozjazd semantyczny (nie tylko kosmetyka)

- `audienceRelTotal` / `objectiveRespektPctToward` (`main.ts` ~2902, `computeRespekt` w `diplomacy.ts:1681`) = udział mocy w %, przeliczany z aktualnej potęgi obu stron. To NIE jest ta sama wielkość co `rel.respekt` pisany inkrementalnie przez silnik (`diplomacy.ts` ~1092, `newR = clamp(rel.respekt + dR, 0, 100)`).
- Ta sama etykieta „Relacja” oznacza więc dwie różne liczby, a dwa ekrany pokazują różne wartości dla tej samej pary (11,6 vs 90). Panel PW i bramka pwBalance używają zapisanej; handel i tekst audiencji używają power-based.
- Konsekwencja gry: gracz widzi „90/200” na audiencji, a w panelu PW ten sam deal jest liczony z „11,6” (modyfikator −% i „Brakuje X PW”). To niespójność decyzyjna (dwa progi dla jednej relacji), nie tylko tekstowa — nie wolno jej „ujednolicić” samym wyświetleniem w tym temacie (dispatch: bez zmian reguł handlu/bramek).

## Opcje dla właściciela (ABC)

A. Ujednolicić: wszystkie miejsca czytają jedną relację. Wymaga zmiany `main.ts` (audiencja / getNegotiationContext) = poza allowlistą tematu, zmiana progów handlu i wyglądu audiencji. Najbardziej spójne z mechaniką PW.
B. Zostawić liczby, ale ROZDZIELIĆ ETYKIETY (tylko wyświetlanie, allowlista OK): np. w panelu PW „Relacja pamięciowa 11,6 (zaufanie + respekt z historii)” oraz na audiencji „Relacja wizualna 90/200 (respekt = udział mocy)”, plus opis w tooltipie. Usuwa mylącą etykietę, ale NIE usuwa dwóch progów dla jednej relacji. Wymaga akceptacji nazw.
C. Zostawić jak jest i udokumentować w wiki/tooltipie oba znaczenia. Najmniejsza zmiana.

Rekomendacja Operatora: B jako szybka poprawka tekstowa (po akceptacji nazw) oraz osobny temat decyzji A dla rozjazdu progów handlu (logika akceptacji vs audiencja).

## Testy / bramki

- Test Chromium na realnym oknie dyplomacji (wzorzec ai-trade-wiring-e2e-live-test.cjs): NIE_ZMIERZONO (brak zmiany kodu; pomiar z docelowymi etykietami wymaga decyzji o nazwach).
- tsc + 5 bramek: NIE_ZMIERZONO (brak zmian w `gra/`; nie uruchamiano).
- Odczyt źródeł: wykonany na origin/main 44af89169 (grep + odczyt plików wymienionych w tabeli).

## Zmiany / commit

- Zmiany kodu: brak (`gra/` nietknięte).
- Raport: `dyspozycje/autobot/runs/R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1/10-operator-claude.md` (jedyny zacommitowany plik).

BLOKADY: brak techniczna; blokada decyzyjna — wybór wariantu A/B/C oraz nazw etykiet (ABC właściciela).
RUNDY: 1/5
NASTĘPNY KROK: ABC do właściciela: wariant A/B/C. Po wyborze — Operator R2 (B: tylko etykiety w diplomacyAcceptanceBalance.ts + diplomacyAudience.ts, test Chromium, mutacja, tsc, 5 bramek) albo osobny temat dla A.
DEPLOY/PUSH: NIE WYKONANO
