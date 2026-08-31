TEMAT:  R-AI-PRZYCISK-BUDUJ-TYLKO-OBYWATELE-Q1
RUNDA:  1/5
DATA:   2026-08-31
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Final Control rundy 5 tematu `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` (2026-08-28,
Blokada 3/Pytanie 4): ręczny przycisk „buduj" gracza (`applyBuildRequest`,
`gra/src/main.ts:11650`) NIE jest zabramkowany do heksów z obywatelami —
działa wszędzie jak dziś. ECHO właściciela z tamtego tematu mówiło wprost
„Gracz musi nacisnąć przycisk «buduj» tylko w miejscach, gdzie są obywatele",
ale ani Operator, ani Evaluator tego nie wdrożyli — złapał to dopiero Final
Control, poza allowlistą tamtej rundy. Temat wyczerpał limit 5 rund, więc
naprawa idzie pod nowym ID. Właściciel 2026-08-31, po przedstawieniu pytania:
„Ogranicz do heksów z obywatelami (zgodnie z ECHO)".

## GOAL
`applyBuildRequest` (main.ts ~11650) ma odrzucać/blokować ręczne budowanie
gracza na heksie BEZ obywateli, dokładnie tą samą regułą co automat AI
(Zasada 2 z `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`) — sprawdź jak automat AI
definiuje "heks z obywatelami" i użyj TEJ SAMEJ funkcji/predykatu, nie nowej
kopii logiki. Zachowaj wyjątek złożowy (złoża mogą być budowane gdziekolwiek,
tak jak w Zasadzie 2) jeśli manualny przycisk już go respektuje albo jeśli
automat go respektuje — spójność z istniejącym mechanizmem jest wymagana.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `applyBuildRequest` używa tego samego predykatu "ma obywateli" co automat
   AI (cytat funkcji/linii z obu miejsc, dowód że to WSPÓLNY kod, nie kopia).
2. Próba budowy na heksie bez obywateli przez ręczny przycisk jest
   odrzucana/zablokowana — realny test (jednostkowy, rzeczywista egzekucja
   kodu z main.ts, nie regex) demonstrujący odrzucenie.
3. Próba budowy na heksie Z obywatelami nadal działa (brak regresu) — test
   pozytywny obok testu odrzucenia.
4. Wyjątek złożowy (jeśli istnieje w tym samym mechanizmie) zachowany —
   budowa na złożu bez obywateli nadal dozwolona, z dowodem testowym.
5. Realna weryfikacja w przeglądarce (headless Chromium): kliknięcie
   przycisku „buduj" na heksie bez obywateli w żywej grze nie skutkuje
   rozpoczęciem budowy (UI feedback albo brak efektu — Operator decyduje o
   formie komunikatu, jeśli issue nie precyzuje, i zgłasza to jako notę).
6. Wszystkie 5 bramek referencyjnych zielone + `tsc --noEmit` 0 błędów +
   istniejące testy AI-przy-rzece (ai4-popyt-obywatele-test,
   ai2-heks-po-heksie-test) bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/main.ts` (wyłącznie `applyBuildRequest` i bezpośrednio powiązany
predykat, jeśli wymaga eksportu/refaktoru minimalnego), nowy lub rozszerzony
plik testowy w `gra/tools/`. Zakazane bezwzględnie: zmiana logiki automatu AI
(Zasada 1-3) poza odczytem istniejącego predykatu, `gra/data/**`,
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-AI-PRZYCISK-BUDUJ-TYLKO-OBYWATELE-Q1`, baza
JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz twierdzenia „automat AI i przycisk gracza używają tej samej reguły" bez
wklejonego dowodu (nazwa funkcji, miejsce wywołania w OBU ścieżkach). Zakaz
uznania testu jednostkowego za wystarczający bez punktu 5 (realna
przeglądarka) — to jest dokładnie ten sam tryb luki, który już raz zamknięto
w `R-MUZYKA-ERA-LIVE-E2E-Q1` (test zielony, ale nic nie sprawdza w żywej grze).

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
jeśli wymagany dla testu w przeglądarce). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
