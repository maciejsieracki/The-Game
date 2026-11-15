# R-WEB-UI-DIPLO-AUDIENCE-STATUS-BANNER-LABEL-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (Operator; wymaga Evaluatora/FC; brak zrzutów Chromium)
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-DIPLO-AUDIENCE-STATUS-BANNER-LABEL-Q1
GOAL: baner formalnego statusu w audiencji dyplomatycznej nie wygląda jak propozycja pokoju — prefiks „Stan: ”, tooltip „to nie jest propozycja”, tony da-tone-* i podpis (rozejm/kara) bez zmian.
BAZA: 54592c142d8d7b18842a9fe2f13310ebee52f35b (origin/main = c9c161ec3, branch claude/sprawdzenie-funkcjonalnosci-ek4ra0 w tym SHA)

## ZMIANY-COMMIT
- `gra/src/ui/diplomacyAudience.ts`: `formalBannerHtml` wyeksportowany (było prywatne, na potrzeby testu); etykieta `esc('Stan: ' + label.toUpperCase())`; `title` = „Aktualny formalny stan umów między wami. To nie jest propozycja.”. Tony `da-tone-${kind}` i podpis (`truceLabel`, „obowiązuje od”, „zerwanie”) bez zmian.
- `gra/tools/diplomacy-audience-status-banner-test.cjs` (NOWY): 14 asercji — wojna → „Stan: WOJNA”, ton wojna, brak „POKÓJ”; pokój → „Stan: POKÓJ”; rozejm → „Rozejm do tury 15” obok prefiksu; sojusz/pakt/handel/brak; każdy baner z prefiksem; brak formalStatus → pusty string. Stan pary liczony przez `resolveFormalDiplomaticStatus` (ta sama funkcja co main.ts ~l.26243).
- Commit: SHA w polu sha zwróconym orkiestratorowi (commit kodu + ten raport).

## DIAGNOZA (zmierzona w kodzie, nie w grze)
- `formalBannerHtml` pokazuje wyłącznie `formalStatus.label` z `resolveFormalDiplomaticStatus` (`game/diplomacy-display.ts:293`). Kolejność: `relationStatus==='wojna'` → „Wojna” (zawsze najpierw), potem sojusz, pakt, handel, kontakt → „Pokój”, inaczej „Brak kontaktu”.
- Czyli baner „POKÓJ” pojawia się tylko, gdy `rel.status !== 'wojna'` i para ma kontakt bez sojuszu/paktu/handlu. Kod NIE pokazuje „POKÓJ” przy `rel.status==='wojna'` — nie znaleziono błędu statusu w main.ts (~l.26243-26263). Diagnoza orkiestratora o osobnym błędzie statusu NIE potwierdzona w kodzie.
- Rozjazd z zrzutu właściciela („wojna” vs „POKÓJ”) wynika więc z tego, że para była w stanie pokoju (rel.status ≠ wojna) — zgodnie z innymi sygnałami z diagnozy (brak aktywnej propozycji, Zaufanie 26). Nie zweryfikowano na zapisie gry: NIE_ZMIERZONO (brak zapisu Sumerów).
- Problem UI był rzeczywisty: etykieta bez słowa „Stan” wyglądała jak nagłówek propozycji. Naprawione prefiksem i tooltipem.

## PUNKTY ZAKRESU
1. Prefiks „Stan: ” + tooltip — ZMIERZONO (kod + test).
2. Odrębność banera propozycji („Propozycja AI: …”) — sprawdzono: w `diplomacyAudience.ts` istnieje kolumna „Oni oferują” (l.2228, l.2303) i stół PW w `diplomacyAcceptanceBalance.ts` (l.546, l.585 „Brak aktywnej propozycji na stole”). Osobny baner propozycji nad stołem NIE istnieje. Zgodnie z dispatchem NIE dodano go (zgłoszone poniżej jako decyzja).
3. Test spójności 3 stanów — ZMIERZONO testem źródłowo-logicznym (wojna/pokój/rozejm + sojusz/pakt/handel/brak). Test „na bazie czerwony dla prefiksu” — NIE_ZMIERZONO na bazie (baza nie eksportuje `formalBannerHtml`, więc test padłby na imporcie; uznane z góry).
4. Civpedia — NIE_ZMIERZONO/NIE WYKONANO: w `docs/encyklopedia/**` nie ma hasła o banerze statusu audiencji (grep „formalny stan”/„baner” bez trafień; wzmianki o audiencji w `pojecia/handel-surowcami-dyplomacja.md` i `pojecia/wladcy.md` dotyczą handlu/portretu, nie banera). Nie dopisywano, więc `wikiBundle.json` NIE regenerowano.

## TESTY (surowe wyniki z tego przebiegu)
- `npx tsc --noEmit` (gra/): EXIT=0 (bez błędów).
- `node tools/diplomacy-audience-status-banner-test.cjs`: `=== diplomacy-audience-status-banner-test: 14 pass, 0 fail ===` EXIT=0.
- Bramki referencyjne (gra/tools):
  - `logic-test.cjs`: `LOGIC OK (213/213)` EXIT=0
  - `tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail` EXIT=0
  - `research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33` EXIT=0
  - `unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)` EXIT=0
  - `combat-test.cjs`: `COMBAT TEST: 6/6 pass` EXIT=0
- Powiązane testy dyplomacji (zmienione miejsce wiringu): `diplo-truce-until-turn-test.cjs`: `WYNIK: 15 PASS / 0 FAIL` EXIT=0; `diplomacy-relation-labels-test.cjs`: `23 pass / 0 fail` EXIT=0.
- `git diff --check`: czysty (brak wyjścia, brak błędów).
- Czerwone-na-bazie: NIE_ZMIERZONO osobno (patrz pkt 3).

## ZRZUTY CHROMIUM (3 stany: pokój / wojna / rozejm)
NIE WYKONANO. W sandboxie nie ma zainstalowanych przeglądarek Playwright (`~/.cache/ms-playwright` nieobecny), a `npm ci --ignore-scripts` nie pobiera Chromium. Brak zrzutów = punkt niezamknięty; wymaga osobnego przebiegu z `npx playwright install chromium` i grą z zapisem (pokój/wojna/rozejm).

## BLOKADY
- Brak zrzutów Chromium w 3 stanach (jw.).
- Brak zapisu Sumerów do odtworzenia stanu z ekranu właściciela.

## ZGŁOSZENIA DLA ORKIESTRATORA (UWAGI-DLA-ORKIESTRATORA)
- Osobny baner propozycji AI („Propozycja AI: Pokój”) nad stołem NIE istnieje. Dispatch: „jeśli nie ma — NIE dodawaj (zgłoś)”. Decyzja produktowa do właściciela, czy dodać.
- Diagnoza z dispatchu o „wojna vs POKÓJ” jako błąd statusu w main.ts NIE potwierdzona w kodzie (resolver zawsze zwraca „Wojna” dla rel.status==='wojna'). Jeśli właściciel ma w wojnie baner „POKÓJ”, potrzebny zapis gry i pomiar `rel.status` dla pary.
- Przy wdrożeniu: `formalBannerHtml` jest teraz eksportowany (zmiana API modułu, bez wpływu na zachowanie).

## RUNDY
1/5 (Operator, HAIKU 5.5)

## NASTĘPNY KROK
Evaluator (SONNET): przegląd diffu (`git diff 54592c142..HEAD`), potwierdzenie testu 14/0, zrzuty Chromium w 3 stanach (wymagane przed FC), decyzja o banerze propozycji.

## DEPLOY/PUSH: NIE WYKONANO
