# 02a-obrona — R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2 (Operator, obrona po Evaluatorze r1)

Baza obrony: commit operatora `f6de2e87e` (rozpoznanie, read-only). Pin: `07d2fbd72` (`gra/src/main.ts`, odczyt przez `git show`).

## Odpowiedzi na zarzuty

1. **Pozycja 4 (podwójne wywołanie dla trybutu): PRZYJMUJĘ.** Dowód w pinie: pętla `tributeBreaks` (`main.ts:24278-24286`) stosuje tylko `trybut_odmowa` i komunikat; `deactivateZlozeGrantsForDeal` jest raz, w pętli `for (const id of broken)` (`main.ts:24292-24294`), i dotyczy WSZYSTKICH id z `broken`, także bez pary w `tributeBreaks`. Poprawka: sekcja „Uwaga do pozycji 4” w raporcie przepisana. Zakres rodzajów płatności w `broken` (`activeDealsToPaymentDeals`) oznaczony NIE_ZMIERZONO. T1 wskazuje deaktywację dla każdego `res.broken`.

2. **Sekcja 2b niekompletna: PRZYJMUJĘ.** Potwierdzone `git grep`-em w pinie: `syncRelationFromDeals` poza 24319 wywołane w 14652, 21264, 23017, 23447, 23677, 23862, 24563, 41584, 41609, 47264 (10 miejsc). Dopisano 41609 i 47264 do tabeli §2b, zaktualizowano liczbę w `01-operator-r1.md` (BLOKADY) i zakres T3.

3. **Odesłanie „W-2” w pozycji 2 tabeli: PRZYJMUJĘ.** Poprawiono na „patrz §3, pozycje W-3 i W-4” (W-2 to danina, W-3 to brak `break_*`, W-4 to brak wołającego `suspend_zloze_grants_for_war`).

4. **Brak SHA w `01-operator-r1.md`: PRZYJMUJĘ.** SHA commitu operatora rundy 1 wpisany: `f6de2e87e`. Tekst „patrz git log” usunięty.

5. **`sync_relation_status_from_deals` jako „duplikat”: PRZYJMUJĘ (korekta wniosku).** Rust: `diplomacy.rs:4276` to funkcja czysta zwracająca `Option<RelationStatus>`; `turn_war_dipl_steps.rs:275` to funkcja mutująca `DiplomacyState`. Różnice w sprawdzaniu, widoczne w kodzie: sojusz przez `deal_involves_owners` vs `d.parties == pair` (`turn_war_dipl_steps.rs:283-285`); NAP przez `has_nap_between` vs `state.has_deal(a, b, Some(Nap))`. Równoważność semantyczna: NIE_ZMIERZONO. Słowo „duplikat” zastąpione w raporcie („nie duplikat, równoważność NIE_ZMIERZONO”). T3 ma najpierw to ustalić, potem wybrać jedną sygnaturę. Zauważono też, że test `p6_r7k7b_zloze_sync.rs:90` sprawdza wektory pinu tylko dla wersji czystej.

6. **Weryfikacja commita (2 pliki w allowliście, bez `rust-port/**`, `gra/**`, testów, bez nazwy modelu): POTWIERDZAM, bez zmiany.** Brak cargo zgodny z read-only.

## Commit obrony

- Zmienione pliki: `dyspozycje/rust-port/p6/R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2/01-operator-r1.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2/02a-obrona.md` (nowy).
- SHA commitu obrony: podany w odpowiedzi orkiestratorowi (commit lokalny, bez push).

## Werdykt obrony

Zarzuty 1, 2, 3, 4, 5 przyjęte z poprawką. Zarzut 6 potwierdzony. Ustalenia read-only nie zmieniają się poza wymienionymi korektami. Nic nie wypchnięto; `parity-v2`, `gra/**`, `rust-port/**` nietknięte.
