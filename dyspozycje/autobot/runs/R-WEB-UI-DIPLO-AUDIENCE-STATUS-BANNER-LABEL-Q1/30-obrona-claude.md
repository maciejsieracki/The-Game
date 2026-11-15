# R-WEB-UI-DIPLO-AUDIENCE-STATUS-BANNER-LABEL-Q1 — raport Obrony (odpowiedź na zarzuty Evaluatora, runda 1/5)

STATUS: PASS-WITH-NOTES (Obrona; zarzut 1 PRZYJĘTY i domknięty dowodem, zarzut 3 i 4 ODRZUCONE z dowodem, zarzut 2 ODRZUCONY w zakresie, decyzja zostaje dla orkiestratora)
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-DIPLO-AUDIENCE-STATUS-BANNER-LABEL-Q1
GOAL: baner formalnego statusu w audiencji dyplomatycznej nie wygląda jak propozycja pokoju — prefiks „Stan: ”, tooltip „to nie jest propozycja”, tony da-tone-* i podpis (rozejm/kara) bez zmian.
BAZA: 54592c142d8d7b18842a9fe2f13310ebee52f35b (origin/main w chwili startu obrony = c9c161ec3, poza bazą; nie rebasowano)
KOD KANDYDATA: 2c07807d157f8264192e9dfbea16e142ebe54344 (bez zmian w tej rundzie — poprawka dotyczy wyłącznie dowodu w przeglądarce)

## ZMIANY-COMMIT
Commit obrony (SHA w polu `sha` zwróconym orkiestratorowi) dodaje wyłącznie:
- `gra/tools/diplomacy-audience-status-banner-real-render-test.cjs` (NOWY) — test w headless Chromium: renderuje PEŁNE okno audiencji (`showDiplomacyAudience` z prawdziwego `gra/src/ui/diplomacyAudience.ts`) dla 3 stanów pary: POKÓJ, WOJNA, ROZEJM. Stan formalny liczy `resolveFormalDiplomaticStatus` z `relationStatus = rel.status` (ta sama ścieżka co main.ts l.26213/26244). Asercje: etykieta „Stan: …”, ton `da-tone-*`, tooltip „to nie jest propozycja”, przy wojnie brak „POKÓJ” w banerze, podpis „Rozejm do tury 15”, brak błędów strony. Zrzuty zapisuje do `dowody/`.
- `dyspozycje/autobot/runs/R-WEB-UI-DIPLO-AUDIENCE-STATUS-BANNER-LABEL-Q1/dowody/audiencja-pokoj.png`, `audiencja-wojna.png`, `audiencja-rozejm.png` (NOWE) — zrzuty pełnego okna audiencji z Chromium 141 (`/usr/bin/chromium`, headless), stan z fixture (cywilizacje: Rzym vs Sumerowie).
- `dyspozycje/autobot/runs/R-WEB-UI-DIPLO-AUDIENCE-STATUS-BANNER-LABEL-Q1/30-obrona-claude.md` (ten raport).

Kod gry (`diplomacyAudience.ts`, `main.ts`, `diplomacyAcceptanceBalance.ts`) NIE zmieniony w tej rundzie. Allowlista zachowana: nazwy plików pasują do `*diplomacy-audience*` i `runs/<ID>/**`.
Dodatkowo lokalnie (nie w commicie, do sprzątania przez orkiestratora): `gra/node_modules` z `npm ci --ignore-scripts` w worktree (ignorowane przez git).

## ODPOWIEDZI NA ZARZUTY EVALUATORA

### Zarzut 1 — brak zrzutów Chromium w 3 stanach — PRZYJMUJĘ (poprawka + dowód + commit)
- Poprzednio: NIE WYKONANO (założono brak przeglądarki). Sprawdzenie: `~/.cache/ms-playwright` nieobecny, ALE w systemie jest `/usr/bin/chromium` (-> `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, wersja `Chromium 141.0.7390.37`) i pakiet `playwright` w `gra/node_modules` po `npm ci --ignore-scripts`.
- Wykonano: `node tools/diplomacy-audience-status-banner-real-render-test.cjs` (z `gra/`), exit 0, wynik surowy: `=== diplomacy-audience-status-banner-real-render-test: 14 pass, 0 fail ===`.
- Zrzuty (3 stany, pełne okno audiencji): `dowody/audiencja-pokoj.png`, `dowody/audiencja-wojna.png`, `dowody/audiencja-rozejm.png`. Odczyt wizualny `audiencja-wojna.png`: baner „Stan: WOJNA” (ton czerwony), podpis „obowiązuje od 3 tur”, kolumna „Oni oferują” pusta, stół „Brak aktywnej propozycji na stole”.
- Zakres dowodu: fixture stanu (dane testowe), NIE zapis z gry właściciela. Dane Sumerów są symboliczne.

### Zarzut 2 — pkt 4 dispatchu (dopisek w dokumentacji) i poradnik — ODRZUCAM w tym temacie, decyzja dla orkiestratora
- Dispatch pkt 4 mówi: „Civpedia: jeśli istnieje hasło o audiencji/statusie — dopisz zdanie o banerze”. Przeszukanie `docs/encyklopedia/**` (grep „formalny stan”, „baner”, „audiencj”) nie daje hasła o banerze statusu. Hasła tam nie ma, więc nic do dopisania w Civpedii.
- `docs/PORADNIK-GRACZA/12-dyplomacja.md` l.110 („Poniżej baner statusu formalnego, jeśli obowiązuje traktat…”) jest poradnikiem, nie Civpedią. Plik jest POZA literalną allowlistą dispatchu. Ten sam tekst jest w `gra/src/data/wikiBundle.json`, a zmiana wymagałaby rozszerzenia allowlisty i regeneracji wikiBundle narzędziem.
- Tekst l.110 pozostaje prawdziwy po zmianie (nie opisuje propozycji), więc nie jest to błąd.
- Dowód: `git show 2c07807d1:docs/PORADNIK-GRACZA/12-dyplomacja.md` l.110 (cytat w zarzucie zgodny z treścią). Decyzja: patrz UWAGI-DLA-ORKIESTRATORA pkt 1.

### Zarzut 3 — test nie bierze formalStatus z main.ts; diagnoza błędu statusu niepotwierdzona — ODRZUCAM żądanie wpięcia, PRZYJMUJĘ notę o braku zapisu
- Ścieżka w main.ts (zmierzona, nie z pamięci): `rel = getDiploRelation(ME(), ownerId)` (l.26213) → `resolveFormalDiplomaticStatus({ relationStatus: rel.status, allianceFormalKind: allianceFormalKindBetween(...), hasNap, hasTrade, contactEstablished })` (l.26243–26249) → `formalStatus` w `DiplomacyAudienceState` (l.26262). Nie ma żadnego innego źródła etykiety „POKÓJ” dla pary w stanie wojny.
- Nowy real-render test (punkt 1 odpowiedzi) wykonuje tę samą ścieżkę: `relationStatus: rel` (wartość `'wojna'`/`'pokoj'`), funkcja `resolveFormalDiplomaticStatus` z bundla, potem prawdziwe `showDiplomacyAudience`. Pełnego `main.ts` nie uruchamiam (wymagałby całej gry i zapisu), więc wpięcie jest potwierdzone przez identyczne wejście, nie przez uruchomienie `main.ts`.
- Diagnoza „osobny błąd statusu w main.ts” pozostaje NIE POTWIERDZONA: w kodzie resolver zwraca „Wojna” przy `relationStatus==='wojna'` (kolejność w `game/diplomacy-display.ts`, jak w raporcie Operatora). NIE_ZMIERZONO na żywym zapisie Sumerów (brak zapisu).

### Zarzut 4 — etykieta dla braku kontaktu „Stan: BRAK KONTAKTU” zamiast przykładu „BRAK UMÓW” — ODRZUCAM (zgodnie z dispatchem)
- Dispatch pkt 1: „nazwy wg istniejących etykiet `formalStatus.label`”. Istniejąca etykieta dla braku kontaktu to „BRAK KONTAKTU” (`game/diplomacy-display.ts`, funkcja `resolveFormalDiplomaticStatus`). Przykład „BRAK UMÓW” w dispatchu był ilustracją, nie nakazem zmiany etykiety.
- Zmiana etykiety `formalStatus.label` to zmiana poza zakresem (dotyka danych statusu, nie banera). Zostaje jak jest. Dowód: test `diplomacy-audience-status-banner-test.cjs` asercja `Stan: BRAK KONTAKTU` — PASS.

## ZMIERZONE BRAMKI (surowe wyniki, ten commit / kod kandydata 2c07807d1)
- `node_modules/.bin/tsc --noEmit -p gra/tsconfig.json`: EXIT 0 (bez wyjścia).
- `tools/diplomacy-audience-status-banner-test.cjs`: `=== diplomacy-audience-status-banner-test: 14 pass, 0 fail ===` EXIT 0.
- `tools/diplomacy-audience-status-banner-real-render-test.cjs` (NOWY): `14 pass, 0 fail` EXIT 0 (zrzuty 3 stanów zapisane).
- Bramki referencyjne (5):
  - `tools/logic-test.cjs`: `LOGIC OK (213/213)` EXIT 0
  - `tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail` EXIT 0
  - `tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33` EXIT 0
  - `tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)` EXIT 0
  - `tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`, `All sanity checks passed.` EXIT 0
- Powiązane: `tools/diplo-truce-until-turn-test.cjs`: `WYNIK: 15 PASS / 0 FAIL` EXIT 0; `tools/diplomacy-relation-labels-test.cjs`: `23 pass / 0 fail` EXIT 0.
- CZERWONY NA BAZIE (dowód dla kryterium „test czerwony na bazie”, dotąd NIE_ZMIERZONO): w worktree podmieniono `gra/src/ui/diplomacyAudience.ts` na wersję z `54592c142` (plik przywrócony `git checkout`, `git status` czysty przed commitem). Wynik real-render testu na bazie: `=== ...: 8 pass, 6 fail ===` EXIT 1. Padające asercje: etykieta „Stan: POKÓJ”/„Stan: WOJNA”/„Stan: POKÓJ” (baza zwraca `POKÓJ`, `WOJNA`, `POKÓJ`) i tooltip (baza: „Formalny stan umów — odrębny od nastawienia (Zaufanie/Respekt)”). Test wypisuje też dowód wartości z bazy w `detail`.
- Mutacja poprzedniej rundy (Evaluator): cofnięcie prefiksu → 6 pass / 8 fail (potwierdzone przez Evaluatora, nie powtarzane).
- `git diff --check`: wykonany po `git add` nowych plików (patrz sekcja DEPLOY/PUSH, wynik surowy w commicie).

## TESTY (surowe) — podsumowanie
- Realny dowód w przeglądarce: TAK (3 stany, Chromium 141). Czerwony na bazie: TAK (6 fail).
- Operator zgłosił „NIE WYKONANO” dla Chromium; teraz WYKONANO.

## BLOKADY
- Brak zapisu gry Sumerów (potwierdzenie na żywo stanu „wojna vs POKÓJ” z ekranu właściciela) — NIE_ZMIERZONO, poza zakresem tej rundy.
- Brak banera „Propozycja AI” nad stołem — decyzja produktowa (poza zakresem, bez zmian w kodzie).

## RUNDY
Obrona: runda 1 (odpowiedź na zarzuty Evaluatora r1). Operator/Evaluator: runda 1/5.

## NASTĘPNY KROK
Evaluator (SONNET) — ponowna weryfikacja zrzutów (`dowody/*.png`) i testu real-render (14/0; baza 8/6). Potem Final Control. Decyzja orkiestratora w sprawie poradnika (UWAGI pkt 1).

## UWAGI-DLA-ORKIESTRATORA
1. Decyzja: `docs/PORADNIK-GRACZA/12-dyplomacja.md` l.110 i `gra/src/data/wikiBundle.json` — czy rozszerzyć allowlistę o poradnik i zregenerować wikiBundle (tekst nie wspomina prefiksu „Stan:”, ale nie jest błędny). Obrona NIE zmienia tego w tym temacie.
2. Baner „Propozycja AI: Pokój” nad stołem NIE istnieje (dispatch: zgłosić). Decyzja produktowa do właściciela.
3. Diagnoza „wojna vs POKÓJ jako błąd main.ts” nie potwierdzona w kodzie; ścieżka `rel.status` → resolver → banner jest poprawna. Na żywo nieprzetestowane (brak zapisu Sumerów).
4. `origin/main` = c9c161ec3 jest poza bazą kandydata (54592c142). Przy integracji sprawdzić konflikt w `diplomacyAudience.ts` i `gra/tools/`.
5. Sprzątanie: `gra/node_modules` w worktree (ignorowane przez git) — usunąć wraz z worktree po zakończeniu. Dysk przed startem: 6,9 GB wolne na `/`.
6. Przeglądarka: test używa `CHROMIUM_PATH` (domyślnie `/usr/bin/chromium`). Pakiet `playwright` to `playwright-core` bez pobierania binarek.

## DEPLOY/PUSH: NIE WYKONANO
