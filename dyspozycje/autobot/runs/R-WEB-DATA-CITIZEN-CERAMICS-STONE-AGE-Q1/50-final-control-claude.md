# 50-final-control-claude — R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1 (Final Control, runda 2)

STATUS: FAIL
DOMAIN: GAME (dane + dokumentacja + test)
TEMAT: R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1
GOAL: Ceramika zużywana przez obywateli w Kamieniu (1/obywatela/tura; kara −2 Szczęścia / −1% Rozwoju za brak do czasu Garncarni).
ZMIANY/COMMIT: oceniony kandydat 01b4593bb9106ee23ba170fe3920fbf88a81a736 (potomek bazy d4c3c39d3 — `git merge-base --is-ancestor` = TAK). Diff vs baza: 15 plików, wszystkie w allowliście (JSON, komentarz JSDoc w .ts, docs, wikiBundle, testy/narzędzie, runs/**). Kod logiki gry bez zmian. `git diff --check` czysty. Ten raport: jedyny dodany plik.

TESTY (surowe wyniki, kandydat vs baza):
- tsc --noEmit: exit 0, 0 linii
- logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6/0
- citizen-resource-upkeep-test: kandydat 122 pass / 2 fail; baza 107 pass / 2 fail — te same 2 czerwone (kotwica `const ordPctRaw = evaluateOrderFromBreakdown(` w main.ts i F1 mutant 1) = czerwone-na-bazie
- szczescie-przebudowa-skali-test: kandydat 516 OK / 4 FAIL; baza 515 OK / 4 FAIL — te same 4 (katalog 44 vs 41, 2b epoki 1–3) = czerwone-na-bazie
- citizen-upkeep-era-mult-test 681/0; citizen-consumption-era-mult-test PASS
- Mutacja własna (a): usunięcie "ceramika" z epoki 1 w JSON ⇒ test czerwony (m.in. "Epoka 1 … want [ceramika,drewno,glina]", "deductions.ceramika = 10 … undefined", kary 3× → 2×); JSON przywrócony.
- Pozostałe bramki z §6 R-PROC-AUTOBOT poza 7 wierszami (mapy, mgła itd.): NIE_ZMIERZONO (nieobjęte zakresem danych/dokumentacji).

## Werdykt per zarzut
1. _opis JSON — ODDAL (naprawione: `_opis` zaczyna się wpisem R-WEB-DATA-CITIZEN-CERAMICS…; JSON parsuje się).
2. Civpedia/poradnik — ODDAL (brak hasła o zużyciu przez obywateli w ogóle; Operator dopisał wiersze +2/−2 w `docs/PORADNIK-GRACZA/06-miasto-spoleczenstwo.md` §35.2/§35.3 i `docs/encyklopedia/pojecia/szczescie.md`; nowe hasło poza zakresem).
3. wikiBundle — ODDAL (regenerowany narzędziem; diff w wikiBundle.json obecny).
4. JSDoc — ODDAL (lista surowców dopisana w nagłówku modułu; linie ze stawkami poprawne, bo stawki się nie zmieniły).
5. Pomiar (d) — ODDAL w części pomiaru (3 ziarna × 60 tur, evidence/sim-seed{1,2,3}-60t.json: gracz pasywny 60/60 tur bez ceramiki; AI pierwsza ceramika t.13–15, połowa AI t.23–47). Wynik wymaga decyzji produktowej → DO DECYZJI CZŁOWIEKA (DECISION_REQUIRED): kara trwa bez końca dla gracza, który nie buduje Garncarni, i do t.23–47 dla połowy AI; balansu nie zmieniano zgodnie z dispatchem.
6. Zrzut Chromium (e) — NAPRAW. Kryterium binarne (e) dispatchu "NIE pomijaj" jest niespełnione: Operator sam zapisał NIE_ZMIERZONO. Dowód pośredni z kodu jest prawdziwy co do listy (grep po `src/` nie znajduje zahardkodowanej listy [drewno, glina]; `citizenRequiredResourcesForEra` ← JSON), ale nie zastępuje wymaganego zrzutu. Wykonalne: istniejące narzędzie `gra/tools/citizen-consumption-era-live-measure.cjs` steruje headless Chromium; wystarczy po turze 1 wywołać `showEmpireDetailPanel` (gra/src/ui/empireDetailPanel.ts:4555; linia "Obywatele: …" ok. l.3407) i zrobić screenshot z wierszem ceramiki w epoce 1, zapis do runs/<ID>/evidence/.
7. Parytet AI / drenaż 20=20 — ODDAL (sekcja L testu: drenaż pop 20 = 20 dla drewna/gliny/ceramiki, kara/premia, sygnatury ownerId-agnostyczne; ścieżka AI w grze pośrednio z pomiaru (d)).

Wniosek: jeden NAPRAW (zarzut 6) ⇒ FAIL. Poza tym kandydat jest czysty: dane/testy/dokumentacja zgodne z GOAL, bramki bez regresji względem bazy.

BLOKADY: zrzut Chromium (e) brak; decyzja właściciela dot. gracza pasywnego (zarzut 5).
RUNDY: FC po rundzie 2/5; następna: runda 3 (Operator HAIKU; dopisek do 00-dispatch.md z BAZĄ 01b4593bb; tylko zrzut Chromium + evidence, bez zmian logiki).
NASTĘPNY KROK: Operator r3 — zrzut panelu surowców obywateli w epoce 1 (stan z ceramiką i z brakiem) → Evaluator → FC. Równolegle orkiestrator zadaje ABC właścicielowi (gracz pasywny: kara bez końca; opcje: bez zmian / ceramika startowa / łagodniejsza kara do Garncarni).

UWAGI-DLA-ORKIESTRATORA:
- Prośba użytkownika w workflow ("Nie można w mieście zbudować więcej niż jednej garncarni") NIE jest częścią tego dispatchu i nie została oceniona ani zaimplementowana; wymaga osobnego tematu (limit 1 Garncarni na miasto).
- Stare teksty UI w empireDetailPanel.ts (ok. l.3410–3412: "+1 Szczęście każde miasto" / "kara −1 Szczęście") rozjeżdżają się z kodem po zmianie na ±2 (R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 G8); sprawa sprzed tego tematu — osobny drobny temat tekstowy lub włączenie do r3 (allowlista: gra/src/ui/** tylko teksty).
- Dług Rust: REPIN tabeli obywateli (Kamień + ceramika).
- Dysk podczas FC: 2,7 GB wolnego; node_modules podlinkowane z innego worktree i usunięte po bramkach.

DEPLOY/PUSH: NIE WYKONANO
