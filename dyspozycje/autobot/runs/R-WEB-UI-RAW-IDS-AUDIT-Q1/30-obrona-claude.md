STATUS: PASS-WITH-NOTES (obrona r1 zamyka oba zarzuty; werdykt końcowy należy do Evaluatora r2)
DOMAIN: GAME
TEMAT: R-WEB-UI-RAW-IDS-AUDIT-Q1
GOAL: usunąć regresję testu (zarzut 1) i defekt widoczny dla gracza „Zloto” zamiast „Złoto” (zarzut 2) na kandydacie 97f66b5df; brak surowych id w tekstach gracza.
ZMIANY/COMMIT:
- Baza obrony: 97f66b5df03d45cbc29ad1b3587b486521751b52 (kandydat Operatora r1).
- Commit poprawki: 0dbdd2843 (2 pliki, git add ścieżkami, bez -A):
  - gra/src/game/text-names.ts (slugSurowca: ł/Ł zamieniane przed NFD).
  - gra/tools/improvement-adapter-resource-note-test.cjs (oczekiwania wiersza „Odblokowuje surowiec” = nazwa wyświetlana; +2 kontrole slugu).
- Ten raport: osobny commit (tylko ta ścieżka).
- Nie zmieniano: tech.json, wikiBundle.json, docs/, WERSJE.md, gra-robocza/, dane JSON, liczby, efekty.

ODPOWIEDZI NA ZARZUTY:
- Zarzut 1 (regresja improvement-adapter-resource-note-test, 13 FAIL): PRZYJMUJĘ.
  Przyczyna: test oczekiwał surowego id z danych (`drewno`, `kon`, `bydlo`), a Operator r1 świadomie zmienił adapter na nazwy (`nazwyZListyId`). Test nie został zaktualizowany do zmiany zamierzonej przez audyt.
  Poprawka: wartości oczekiwane wpisane ręcznie (EXPECTED_SUROWIEC_NAZWA: stadnina→Koń, glinianka→Glina, kamieniolom→Kamień, tartak→Drewno, warzelnia_soli→Sól, kopalnia_miedzi→Ruda, kopalnia_zelaza→Ruda żelaza, kopalnia_cyny→Ruda cyny, kopalnia_zlota→Złoto, bydlo→Trzoda, owce→Owce, lama→Lama); kontrola tartak zmieniona z 'drewno' na 'Drewno'. Kontrole notatki dziennika balansu i brak nawiasu pozostają bez zmian.
  Dowód: po poprawce `node tools/improvement-adapter-resource-note-test.cjs` → „77 pass, 0 fail” (kandydat 97f66b5df: „62 pass, 13 fail”, wg zarzutu Evaluatora).
- Zarzut 2 (nazwaWyswietlana('zloto') = „Zloto”): PRZYJMUJĘ, defekt potwierdzony.
  Przyczyna: NFD nie rozkłada ł (brak dekompozycji), więc „Złoto” → slug `z_oto`, a lookup `zloto` nie trafia do tabeli NAZWY_SUROWCOW i spada na humanizeId → „Zloto”.
  Zakres: w resources.json tylko dwie nazwy zawierają ł: „Złoto” i „Cegła” (pełna lista: Żywność, Drewno, Kamień, Glina, Ruda, Ruda żelaza, Ruda cyny, Koń, Sól, Złoto, Cegła, Ceramika, Brąz, Żelazo, Stal). Poprawka obejmuje obie.
  Poprawka: `s.replace(/ł/g,'l').replace(/Ł/g,'L').normalize('NFD')...` w slugSurowca.
  Dowód: test kontrolny „nazwaWyswietlana("zloto") === "Złoto"” i „nazwaWyswietlana("cegla") === "Cegła"” — obie PASS po poprawce. Wartość „Cegla” przed poprawką nie została zmierzona osobno (NIE_ZMIERZONO); mechanizm jest ten sam co dla „Złoto”.
  Strażnik ids-leak-audit nadal nie wykrywa tego defektu (1627 ok, 0 FAIL przed i po). Nie dodawałem strażnika w tej rundzie — zakres poprawki to slug i kontrola jednostkowa w teście wiersza.

UWAGA NIŻSZEJ WAGI (z raportu Evaluatora, nie zarzut): mutacja cofnięcia nazwyZListyId w techDiscoveryNotice.ts przeżywa testy. NIE_ZMIERZONO w tej rundzie — nie dodawałem testu.

TESTY (surowe wyniki z tej sesji, worktree wf_6f630bf0-eb3-3, HEAD 0dbdd2843 + ten raport):
- node ./node_modules/typescript/bin/tsc --noEmit: exit 0.
- improvement-adapter-resource-note-test.cjs: 77 pass, 0 fail.
- ids-leak-audit-test.cjs: WYNIK: 1627 ok, 0 FAIL.
- wonder-text-no-raw-ids-test.cjs: WYNIK: 132 ok, 0 FAIL.
- Bramki referencyjne: logic-test „LOGIC OK (213/213)”; tech-tree-test „20 pass, 0 fail”; research-test „ALL GREEN”; unit-replace-test exit 0 (0 linii FAIL); combat-test „All sanity checks passed.”.
- Dodatkowe testy dotknięte helperami tekstu (18 plików z nazwaWyswietlana/nazwyZListyId/improvementAdapter/surowiecOdblokowany):
  - zielone (exit 0): cyna-surowiec-test 78 pass, 0 fail (≈4 min 52 s, przekroczył 200 s w pierwszym przebiegu — to czas, nie błąd); pozostałe 12 — exit 0.
  - czerwone również NA BAZIE 6f2f1c50e i NA KANDYDACIE 97f66b5df (identyczne liczby; porównanie na wyeksportowanych drzewach git archive), więc dług sprzed tej rundy, nie regresja:
    - zloto-test: 38 pass, 7 fail (base = cand).
    - map-improvement-qualify-test: 132 pass, 1 fail (base = cand).
    - wyrab-wycinka-nazwa-live-test: 48 pass, 1 fail (base = cand; trafienie „Wyrąb” w src/game/farm-assign-hint.ts:51).
    - hodowla-las-test: 106 passed, 7 failed (base = cand).
    - card-resource-purpose-test: 99 pass, 3 fail (base = cand; [B] upkeep „utrzymanie budynku w Pieniądzu” i [G] gen-tech-cards-top5 --check, zależny od środowiska). W worktree ten sam test dawał 101 pass, 1 fail (ten sam [B]).
- Efekt uboczny testu wyrab-wycinka-nazwa-live-test: nadpisał plik dowodu dyspozycje/autobot/runs/P-ULEPSZENIA-WYRAB-WYCINKA-NAZWA-Q1/dowody/r5-karta-farma-warunek.png. Przywrócony `git checkout --` i NIE wszedł do commitów.
- Porządki: katalogi porównawcze (git archive) i ich symlinki node_modules usunięte; node_modules worktree zostaje do czasu sprzątania po integracji.

BLOKADY: brak blokad po stronie obrony. Dług sprzed tematu (wymieniony wyżej) nie jest w zakresie tego tematu.
RUNDY: 1/5 (obrona r1 po FAIL Evaluatora r1).
NASTĘPNY KROK: Evaluator r2 na commicie 0dbdd2843 (odtworzyć bramki: test wiersza 77/0, slug „Złoto”/„Cegła”, ids-leak 1627/0, wonder 132/0); następnie Final Control. Integracja, deploy i push — wyłącznie orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
