STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-POLISH-LANGUAGE-AUDIT-Q1 (runda 2, obrona Operatora)
GOAL: poprawna polszczyzna w literalach gra/src/ui/** i main.ts bez zmian mechaniki, kluczy, ID, liczb
ZMIANY/COMMIT: baza 406bfab565cee17bea04da6f894ed2f61be20b3a (potwierdzone: istnieje, ma za przodka 4ee2aba61). Pliki tej rundy:
  gra/src/ui/formatPl.ts, gra/src/ui/hud.ts, gra/tools/polish-language-audit-q1-guard-test.cjs, ten raport. SHA końcowy w polu `sha` wyniku.

## Odpowiedzi na zarzuty

1. Zakres (manpower.ts) — ODRZUCAM cofnięcie, wniosek do orkiestratora.
   Dowód: `git diff -U0 4ee2aba61 406bfab -- gra/src/game/manpower.ts` = +3 linie w czystym formatterze
   `formatObywateleLabel` (bez stanu, bez liczb gry). Na bazie dawał „3 obywateli” dla 2–4; ma 3 istniejące miejsca użycia w UI
   (cityPanel.ts:11439, empireDetailPanel.ts:2628 i :4012), więc cofnięcie przywraca błąd w panelu miasta i imperium.
   Zakres DODATKU 2 (ui/** i main.ts) formalnie przekroczony. Decyzja do ABC: zostawić (rekomendacja) albo cofnąć
   manpower.ts + hud.ts (hud.ts użyje wtedy lokalnej odmiany w formatPl.ts).

2. Cudzysłów w komentarzu CSS hud.ts:652 — PRZYJMUJĘ. Przywrócono oryginał `„+brutto / +netto"`.
   Dowód: `git diff -U0` na hud.ts po poprawce: hunk -652/+652 tylko ten komentarz względem kandydata; względem bazy
   4ee2aba61 hunk komentarza znika.

3. Niepełny dowód mutacyjny — PRZYJMUJĘ. Dopisano do UI_BAD 5 regexów: `na/przez/za N tur` (biernik), `max HP u N jednostek`,
   `${totalBuildings} budynków`, plus asercje helperów formatMiastaCount/formatKolejkiCount.
   Dowód mutacyjny na PRAWDZIWYM kodzie bazowym (main.ts i empireDetailPanel.ts z 4ee2aba61, skrypt /tmp/claude-0/mutcheck.cjs):
   wszystkie 5 nowych regexów daje „LAPIE baze (zrodla sprzed poprawek)". Na kodzie kandydata+poprawki strażnik: 5064 ok / 0 fail
   (było 4477). Uwaga uczciwa: regexy łapią cofnięcie w tych konkretnych miejscach; nie dowodzą, że każde miejsce użycia
   helpera jest pokryte (strażnik jest wzorcowy, nie semantyczny).

4. formatMiastaCount: „22 miast” — PRZYJMUJĘ. Błąd był w kodzie istniejącym przed rundą (formatPl.ts, też formatKolejkiCount: „23 kolejek”),
   ale operator podpiął helper pod nieograniczone liczniki. Poprawka: oba helpery przez pluralPl.
   Dowód: dopisane asercje formatMiastaCount 22→„22 miasta”, 12→„12 miast”, 3, 1, 25; formatKolejkiCount 23→„23 kolejki”, 11→„11 kolejek” — zielone.
   side-list-hud-panel-coverage-test (używa cityListHud): 74/74.

5. Duplikacja turnsPl / pluralPl / formatJednostkiCount — ODRZUCAM jako blokadę, nota. Zarzut sam mówi „nie błąd funkcjonalny”.
   Ujednolicenie to refaktor poza zakresem „tylko literały”. Do osobnego tematu (kandydat: turnsPl -> pluralPl w eliminationSpectacle.ts:380).

6. „od 1 do ${maxTurns} tur” — ODRZUCAM. Dowód: diplomacyTradeBasket.ts:1355 i :1383 `const maxTurns = hasResourceAccess ? 20 : 30;`.
   Wartości to wyłącznie 20 albo 30, więc „od 1 do 20/30 tur” jest poprawne (dopełniacz mnogi po „do”). Błędna forma „do 1/2/3 tur” nieosiągalna.

7. „Odfortyfikuj wszystkie (N jednostek)” — nota przyjęta, bez zmiany; stylistyka, trafia do ABC wraz z pkt 4 listy operatora.

8. terminology-trade-vs-tax 799/0 nieosiągalne — PRZYJMUJĘ jako uwagę procesową. Ten sam wynik 798/1 ([P] Mennica) uzyskałem na kandydacie
   po poprawkach; błąd bazowy, niezwiązany z tą pracą. Kryterium do korekty po stronie orkiestratora.

## TESTY (surowe wyniki, uruchomione w tym worktree po poprawkach)
- npx tsc --noEmit: exit 0, 0 błędów
- polish-language-audit-q1-guard-test: 5064 ok, 0 fail
- ids-leak-audit-test: 1648 ok, 0 FAIL
- wonder-text-no-raw-ids-test: 132 ok, 0 FAIL
- city-administrator-test: 117 passed, 0 failed
- terminology-trade-vs-tax-test: 798 pass, 1 fail ([P] Mennica) — dług bazowy
- logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6
- side-list-hud-panel-coverage-test 74/74
- git diff --check: czysto

## NIE_ZMIERZONO
- wikiBundle: nie ruszany w tej rundzie (brak zmian danych), regeneracji nie powtarzałem.
- Testy wymagające buildu/Chromium (real-render) nie uruchamiane; zakaz npm run build.
- Nowszy origin/main c90eb3e18 nie integrowany (poza zakresem obrony).

BLOKADY: brak (poza decyzją ABC w pkt 1)
RUNDY: obrona rundy 2
NASTĘPNY KROK: Evaluator/Final Control; decyzja orkiestratora w pkt 1 (zakres manpower.ts)
DEPLOY/PUSH: NIE WYKONANO
