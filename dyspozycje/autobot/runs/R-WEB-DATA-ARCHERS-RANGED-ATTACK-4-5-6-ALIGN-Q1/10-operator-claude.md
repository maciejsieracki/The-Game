STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane jednostek, balans)
TEMAT: R-WEB-DATA-ARCHERS-RANGED-ATTACK-4-5-6-ALIGN-Q1
GOAL: Ustawić atak dystansowy łuczników na 4 / 5 / 6 (Łucznik / Łucznik egipski / Łucznik nubijski) w OBU polach: karcie „Atak dystansowy” i silnikowym `missileAttack` (decyzja właściciela 2026-11-17).
BAZA: 439b1e1ae0a6dbec769495941dff30867aa8857e (origin/main; zawiera bbaa3b27c). Worktree odłączony od tego SHA (git checkout --detach).

ZMIANY/COMMIT:
- gra/data/units.json (6 linii, 3 jednostki):
  - Łucznik: Atak dystansowy 5 → 4; missileAttack 3 → 4
  - Łucznik egipski: Atak dystansowy 6 → 5; missileAttack 6 → 5
  - Łucznik nubijski: Atak dystansowy 7 → 6; missileAttack 6 → 6 (pole silnikowe bez zmiany wartości)
- gra/tools/archers-health-dist-data-test.cjs: oczekiwany dystans zaktualizowany do 4/5/6 z cytatem decyzji 2026-11-17 (nadpisuje 5/6/7 z 2026-11-16); kontrola `missileAttack` dodana TYLKO dla trzech łuczników z decyzją; mutacje kontrolne przestawione na stare wartości (egipski dystans 6, egipski missileAttack 6), żeby nadal były czerwone. Asercje dla pozostałych jednostek (sumeryjski, akadyjski, asyryjski, konnica, oszczepnik, procarz) NIE zmienione.
- Brak zmian w docs/encyklopedia, wikiBundle.json i gra/src: hasła jednostek (ucznik.md, ucznik-egipski.md, PORADNIK 57) podają zasięg i „Moc w polu”, nie wartości ataku dystansowego; wiki bundle po regeneracji (`node gra/tools/bundle-wiki-for-game.cjs`) bez diffu.
- SHA commita: patrz pole SHA w wyniku (tylko jawne ścieżki, bez -A).

TESTY (surowe wyniki, Node v22.22.0, po `npm ci` w gra/ — 71 pakietów; katalog node_modules ignorowany przez git):
- node tools/archers-health-dist-data-test.cjs → WYNIK: 10 pass, 0 fail; ALL GREEN, exit 0. Uwaga: na bazie ta sama asercja zielona dla 5/6/7; po samej zmianie danych bez aktualizacji testu byłaby czerwona (zweryfikowane: pierwszy przebieg po zmianie danych bez poprawki testu dał FAIL dla akadyjskiego/asyryjskiego missileAttack — usunięte jako błąd mojej kontroli, nie danych).
- node tools/json-descriptions-sync-test.cjs → json-descriptions-sync-test: 19 pass / 0 fail, exit 0.
- npx tsc --noEmit → exit 0, bez wyjścia.
- node tools/logic-test.cjs → exit 0 (ostatnia linia: PASS [213] cityfix: pop1 territory radius is 5 (B min start)).
- node tools/tech-tree-test.cjs → tech-tree-test: 20 pass, 0 fail, exit 0.
- node tools/research-test.cjs → PASSED: 33 / FAILED: 0 / TOTAL: 33, exit 0.
- node tools/unit-replace-test.cjs → exit 0 („cross-type melee matrix passes for all 15 civilizations; no ranged/mount/siege/civilian/naval leak”).
- node tools/combat-test.cjs → „All sanity checks passed.”, exit 0.
- node tools/bundle-wiki-for-game.cjs → wikiBundle.json: 22 rozdz. + 185 haseł; git diff bez zmian.
- git diff --check → bez błędów.
- Pomiar wpływu na balans (pojedynek 20 vs 20, Łucznik vs Wojownik): NIE ZMIERZONO. W repo nie ma harnessu walki 20 vs 20; tools/pole-bitwy-balance-check.cjs to diagnostyka formuł, nie symulacja. Nie uruchamiano Chromium.

BLOKADY: brak blokad technicznych.

OBSERWACJE (tylko raport, bez zmian danych):
- Łucznik akadyjski: karta 6 / silnik 5 (rozbieżność, poza zakresem).
- Łucznik asyryjski: karta 6 / silnik 4 (rozbieżność, poza zakresem).
- Katapulta: karta 8 / silnik 4; Hastati: karta 3 / silnik 4; Rydwan egipski: karta 8 / silnik 10; Jeździec z oszczepami: karta 4 / silnik 14 (rozbieżności, poza zakresem).
- Jednostki z kartą 0 i silnikiem >0: Drużynnik 0/7, Thorakites 0/6, Evocati 0/6, Gwardzista z champi 0/5.
- Łucznik sumeryjski 4/4 (zgodny).

TABELA JEDNOSTEK DYSTANSOWYCH (stan PO zmianie; karta | silnik | zasięg (hex) | Health / health):
| Jednostka | karta | silnik | zasięg | HP (Health / health) |
|---|---|---|---|---|
| Procarz | 4 | 4 | 4 | 20 / 16 |
| Oszczepnik | 4 | 4 | 2 | 20 / 16 |
| Łucznik | 4 | 4 | 3 | 20 / 20 |
| Łucznik egipski | 5 | 5 | 4 | 20 / 20 |
| Łucznik nubijski | 6 | 6 | 5 | 20 / 20 |
| Łucznik sumeryjski | 4 | 4 | 4 | 20 / 20 |
| Łucznik akadyjski | 6 | 5 | 4 | 20 / 20 |
| Łucznik asyryjski | 6 | 4 | 4 | 20 / 20 |
| Oszczepnik Zulu (Izijula) | 4 | 4 | 2 | 40 / 20 |
| Procarz (Huaracoc) | 4 | 4 | 5 | 20 / 16 |
| Oszczepnik (Estólica) | 4 | 4 | 2 | 20 / 16 |
| Hastati | 3 | 4 | 2 | 120 / 38 |
| Medżaj (Gwardia Faraona) | 3 | 3 | 2 | 170 / 42 |
| Wojownik germański | 4 | 4 | 2 | 120 / 30 |
| Katapulta | 8 | 4 | 6 | 1000 / 250 |
| Rydwan egipski | 8 | 10 | 3 | 360 / 112 |
| Konnica łucznicza asyryjska | 12 | 12 | 2 | 60 / 60 |
| Jeździec z oszczepami | 4 | 14 | 2 | 56 / 56 |
| Drużynnik | 0 | 7 | — | 31 / 31 |
| Thorakites | 0 | 6 | — | 42 / 42 |
| Evocati | 0 | 6 | — | 55 / 55 |
| Gwardzista z champi | 0 | 5 | — | 48 / 48 |

Uwagi do tabeli: Wojownik germański i Medżaj mają kartę dystansową >0, lecz są jednostkami wręcz (Typ Swordsman). Rydwan egipski (Typ Mount) jest rydwanem z łucznikiem; konnica łucznicza asyryjska (karta 12 / silnik 12) i pozostałe wiersze poza zmianą są nietknięte.

DŁUG RUST: REPIN units.json (łucznicy): Łucznik 4/4, egipski 5/5, nubijski 6/6. Port Rust musi odzwierciedlić te wartości. Rozbieżności akadyjski/asyryjski/katapulta/hastati/rydwan egipski/jeździec z oszczepami zostają tylko w raporcie do decyzji właściciela.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet): weryfikacja diffu (tylko gra/data/units.json i gra/tools/archers-health-dist-data-test.cjs oraz raport), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
