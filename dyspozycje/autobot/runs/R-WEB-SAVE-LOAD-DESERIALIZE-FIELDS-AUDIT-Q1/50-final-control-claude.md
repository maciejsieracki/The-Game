STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt + narzędzie; gra/src nietknięte)
TEMAT: R-WEB-SAVE-LOAD-DESERIALIZE-FIELDS-AUDIT-Q1
GOAL: narzędzie gra/tools/save-load-deserialize-fields-audit.cjs porównujące rekurencyjnie klucze zapisu po serializeGame / deserializeGame / restore, z mutacją czułości i listą kandydatów R-WEB-*.
ZMIANY/COMMIT: integration_sha = bfca8d03b3a67e707c0e02c8e59af2e907564098 (potomek bazy 178aa1a5b — `git merge-base --is-ancestor` OK). Diff vs baza: tylko gra/tools/save-load-deserialize-fields-audit.cjs + runs/<ID>/** (10-operator, 30-obrona, evidence/). Zero zmian w gra/src, gra/data, WERSJE.md, manifest. `git diff --check` czysty. Ten raport: osobny commit tylko tego pliku.
TESTY (surowe wyjście, po npm ci w gra/):
- npx tsc --noEmit: EXIT 0
- logic-test: LOGIC OK (213/213), exit 0
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0, ALL GREEN
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: 6/6 pass
- Narzędzie --raw-a/--raw-b na evidence z przebiegu (raw-A/B 04-58-02-654Z): ZIELONY, exit 0; kluczy porównanych faza a=282, b=282; liczniki a:OK 193, a:OK_PUSTA 89, a:NIEPRZETESTOWANE_BRAK_W_PROBCE 4; b:OK 191, b:OK_PUSTA 86, b:ZMIENIONE_PO_RESTORE 4, b:EFEMERYCZNE 1.
- Mutacja resourceLedgerHistory: CZERWONY (a:GUBIONE 1, wykryte=true) — kontrola czułości działa.
- Baza vs kandydat dla czerwonych bramek: brak czerwonych, nie dotyczy (gra/src identyczne).
- NIE ZMIERZONO: nowy przebieg live (Chromium + vite) w tej rundzie — ocena opiera się na zapisanym raw-A/B z przebiegu Operatora/Obrony oraz ponownym uruchomieniu narzędzia na nich.
ZARZUTY:
1 playerEverOwnedCityByOwner (pole jest w zapisie, OK w obu fazach; Operator je pominął w raporcie): ODDAL — Obrona poprawiła opis i tabelę; przypadek 0 miast (#433) pozostaje NIE ZMIERZONO (zgłoszone niżej, to nie wada tego audytu).
2 pola z dispatchu (nnsAiOverrides nie w zapisie; order*ByCity w zapisie, OK): ODDAL — rozstrzygnięte w 30-obrona.
3 pokrycie (puste tablice, 4 pola nieobecne w próbce, cities/units/mapSnapshot jako liście): ODDAL — dodane werdykty OK_PUSTA i NIEPRZETESTOWANE_BRAK_W_PROBCE; ograniczenie jawnie zadeklarowane, wniosek zawężony do jednej próbki. To ograniczenie pomiaru, nie wada kodu gry.
4 faza (b) jako proxy; 4 pozycje ZMIENIONE_PO_RESTORE: ODDAL — sklasyfikowane (podzialPracy REGENEROWANE, domyślna wartość cities.ts:432, powiązane z #424; era-turn REGENEROWANE; diplomaticContactEstablished NIEISTOTNE). Wpływ era-turn po restore NIE ZMIERZONO (runtime ustawia mapę w main.ts:2587/2605/2647 przy wejściu w epokę); to nie GUBIONE pole, brak podstaw do FAIL. Brak GUBIONYCH pól, więc brak kandydatów R-WEB-* z plikiem/linią — zgodne z dispatchem.
5 usterki narzędzia (observable, zakres mutacji): ODDAL — naprawione w bfca8d03b; ograniczenia (meta, pola wieloliniowe -> exit 1) zadeklarowane i konserwatywne. Zweryfikowano mutację resourceLedgerHistory.
Żaden zarzut nie kwalifikuje się jako NAPRAW; żaden jako DO DECYZJI CZŁOWIEKA wymagający zatrzymania tematu.
BLOKADY: brak.
RUNDY: 1/5 (FC)
NASTĘPNY KROK: integracja orkiestratora bfca8d03b (tylko narzędzie + dowody; brak wdrożenia gry).
UWAGI-DLA-ORKIESTRATORA: (a) opcjonalny pomiar wpływu bronze/ironEraEnterTurnByOwner po restore; (b) test na żywo scenariusza 0 miast gracza (#433) z playerEverOwnedCityByOwner; (c) rozwinięcie tablic obiektów (cities, units) w narzędziu; (d) nnsAiOverrides jest lokalną Map w main.ts:7543, poza zapisem — decyzja produktowa czy ma trafić do zapisu. Zadań/sesji nie tworzono. dispatch 00-dispatch.md jest tylko w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (nie w origin/main).
DEPLOY/PUSH: NIE WYKONANO
