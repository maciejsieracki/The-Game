TEMAT:  P-AI-PRZYCISK-BUDUJ-REGRES-OBYWATELE-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ — PILNE, GRA ZEPSUTA DLA GRACZA
Właściciel: „W tej chwili gra jest zepsuta, nie da się tego testować." Naprawa
`R-AI-PRZYCISK-BUDUJ-TYLKO-OBYWATELE-Q1` (2026-08-31, zintegrowana `main`
commit `e1e7bd6f`) błędnie zastosowała bramkę „heks musi mieć obywateli
pracujących" do **całego** ręcznego przycisku „buduj" gracza
(`applyBuildRequest`, main.ts ~11792, funkcja `isCitizenOrDepositHexForBuild`
main.ts ~11759) — łącznie z wycinką lasu i budową ulepszeń surowcowych.
Właściciel: „nie mogę wybudować na przykład tartaka, jeśli w tym miejscu nie
jest prowadzona budowa przez obywateli, co jest w ogóle bzdurne. To jest
totalny regres." + „To samo tyczy się też wyrywania drzew."

**Ustalenie właściciela (rozstrzygające, nie do interpretacji):**
„Generalnie zasada jest taka: AI kieruje się swoimi zasadami, które
narzuciliśmy. AI gracza swoimi zasadami, które ułożyliśmy, ale gracz zawsze
może wybudować wszystko wszędzie, zgodnie z regułami, nie musząc ograniczać
się do tego, że muszą tam być obywatele." + „to nie chodzi o ręczny przycisk
tylko żeby on nie ograniczał budowy — czyli jak ręcznie buduję to on się
automatycznie wyłącza, a działa tylko przy automatycznej pracy AI (gracza,
gdy steruje wycinką itd., i AI cywilizacji)."

**Czyli: bramka „tylko heksy z obywatelami" MA istnieć WYŁĄCZNIE w automacie
AI (Zasada 2, `auto-improvements.ts`/`pickAutoImprovements`) — NIGDY dla
ręcznej akcji gracza przez `applyBuildRequest`, niezależnie od typu
ulepszenia (budynek/surowiec/wycinka).**

## GOAL
Cofnij DOKŁADNIE naprawę `R-AI-PRZYCISK-BUDUJ-TYLKO-OBYWATELE-Q1` w zakresie
ręcznego przycisku, zachowując WSZYSTKO inne bez zmian:

1. Usuń wywołanie bramki w `applyBuildRequest` (main.ts ~11790-11796, blok
   `if (!isCitizenOrDepositHexForBuild(...)) { showHintMessage(...); return; }`)
   — ręczne budowanie/wycinka wraca do zachowania SPRZED tamtej naprawy: brak
   jakiegokolwiek warunku obywateli, tylko istniejące wcześniej sprawdzenia
   (`assertPlayerTerritoryForBuild` itd., NIETKNIĘTE).
2. Usuń teraz-martwą funkcję `isCitizenOrDepositHexForBuild` (main.ts ~11745-
   11770) — zweryfikuj grepem że nie ma innych wywołań w całym pliku poza tym
   jednym usuwanym.
3. Usuń hak testowy `window.__buildRequestTestDebug` (main.ts ~20178), o ile
   służył WYŁĄCZNIE testowi z punktu 4 (zweryfikuj) — jeśli jest używany
   gdzie indziej, zostaw go.
4. Przerób `gra/tools/build-request-obywatele-live-test.cjs` na test
   REGRESYJNY o ODWRÓCONYM sensie: dowodzi, że ręczne budowanie/wycinka NA
   HEKSIE BEZ OBYWATELI **działa** (nie jest odrzucane) — dla (a) budynku/
   ulepszenia surowcowego, (b) wycinki lasu — a budowanie na heksie Z
   obywatelami nadal działa (brak regresu w drugą stronę). To ma zapobiec
   powtórce tego samego błędu w przyszłości.
5. Automat AI (Zasada 1-3, `auto-improvements.ts`, `pickAutoImprovements`,
   main.ts blok automatu ~27581+) pozostaje **całkowicie nietknięty** — to
   jedyne miejsce, gdzie bramka „tylko obywatele" ma nadal obowiązywać.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `git diff` na `applyBuildRequest` pokazuje WYŁĄCZNIE usunięcie bloku
   bramki (punkt 1) — zero innych zmian w tej funkcji.
2. `isCitizenOrDepositHexForBuild` fizycznie nie istnieje w main.ts po
   naprawie (grep zero trafień) LUB jest jawnie uzasadnione dlaczego zostaje
   (np. używana gdzie indziej — mało prawdopodobne, ale sprawdź).
3. Realny test (Playwright, przebudowany z punktu 4 GOAL) dowodzi: budowa
   ulepszenia surowcowego BEZ obywateli na heksie — sukces; wycinka lasu BEZ
   obywateli na heksie — sukces; oba z obywatelami — nadal sukces (brak
   regresu). Wklejony realny wynik z tej sesji.
4. Automat AI (`ai4-popyt-obywatele-test.cjs`, `ai2-heks-po-heksie-test.cjs`)
   dalej zielony, BEZ ŻADNEJ zmiany liczby asercji vs stan przed tym
   tematem — dowód że automat AI nie został ruszony.
5. Wszystkie 5 bramek referencyjnych zielone + `tsc --noEmit` 0 błędów.
6. Zero zmian poza main.ts i przebudowanym plikiem testowym.

## ALLOWLISTA — nic poza tym
`gra/src/main.ts` (wyłącznie punkty 1-3 GOAL), `gra/tools/build-request-
obywatele-live-test.cjs` (przebudowa na test regresyjny — ta sama nazwa
pliku, chyba że Operator uzna nową nazwę za czytelniejszą, wtedy usuń stary
plik i dodaj nowy). Zakazane bezwzględnie: `gra/src/game/auto-improvements.ts`
i cały automat AI (Zasada 1-3), `gra/data/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-AI-PRZYCISK-BUDUJ-REGRES-OBYWATELE-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione bez faktycznego PONOWNEGO uruchomienia
`ai4-popyt-obywatele-test.cjs`/`ai2-heks-po-heksie-test.cjs` w tej sesji i
porównania liczby PASS z liczbą sprzed tego tematu (50/50 i 35/35 wg
poprzedniej rundy) — zero zmiany w tych liczbach jest DOWODEM że automat AI
nie ucierpiał, sama deklaracja „nie ruszałem auto-improvements.ts" nie
wystarczy. Zakaz pozostawienia martwego kodu (`isCitizenOrDepositHexForBuild`,
hak debug) „na wszelki wypadek" — to dokładnie ten rodzaj nieużywanego kodu,
który następnym razem znowu ktoś przez pomyłkę wywoła.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
dla testu Playwright). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only NATYCHMIAST po PASS (temat pilny,
blokuje grywalność) i cutuje kolejną FALĘ ROBOCZA od razu po integracji.
