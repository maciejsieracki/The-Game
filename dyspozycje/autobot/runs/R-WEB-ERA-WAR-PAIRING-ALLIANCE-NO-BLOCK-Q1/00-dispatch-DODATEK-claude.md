# R-WEB-ERA-WAR-PAIRING-ALLIANCE-NO-BLOCK-Q1 — parowanie wojen epoki: sojusz NIE blokuje wojny; parować do skutku; fallback wojny po trzech (decyzja właściciela 2026-11-22, zgoda na start 2026-11-25)

DOMAIN: GAME | Operator HAIKU 5.5 | runda 1/5 | BAZA KODU = origin/main aa96cfc618de124e48b74408870115854293e6c5 (FALA 890). Deploy na ROBOCZĄ jako kolejna FALA po Final Control.

## Kontekst
Wymuszone wojny epok (progi 40 tur; ERAWARDEFER FALA 881, ERAWARPLAYER; kod: gra/src/game/ pliki *era-war*/*war-rules*/diplomacy — znajdź grep 'era' + 'forced' + 'war'). Pomiar (Brąz seed 4242) pokazał, że wojna epoki „pending” stała 68 tur, bo sojusz blokował dobranie pary.

## Decyzja właściciela (wiążąca)
1. Sojusz NIE blokuje wojny epoki.
2. Parowanie ma dobierać INNYCH graczy AI do skutku, aż wszystkie możliwe pary będą dobrane (nie każdy ma sojusz ze wszystkimi — preferuj pary, w których żadna ze stron nie jest sojusznikiem drugiej, ale gdy nie ma innych par, sojusznicy też mogą zostać sparowani; wypowiedzenie wojny sojusznikowi zrywa sojusz zgodnie z istniejącymi regułami dyplomacji — sprawdź i opisz w raporcie).
3. Gdy par brak (nieparzysta liczba / wszystkie pary wyczerpane) — wojny po trzech (reguła ustalona wcześniej; znajdź istniejącą implementację fallbacku i użyj jej, nie wymyślaj nowej).
Gracz-człowiek jako cel wojen epoki: bez zmian względem obecnej reguły (ERAWARPLAYER).

## Zadanie
1. Znajdź miejsce, w którym sojusz (lub relacja sojuszu) wyklucza parę z wojny epoki, i usuń tę blokadę wg decyzji; zachowaj determinizm (kolejność par deterministyczna po seedzie).
2. Testy: nowy test gra/tools/era-war-pairing-alliance-test.cjs: (a) stan z sojuszami między wszystkimi parami dostępnymi → wojna epoki się zawiązuje (dawniej pending); (b) preferencja par bez sojuszu, gdy istnieją; (c) fallback po trzech przy braku par; (d) mutacja (przywrócenie blokady) → czerwony — pokaż. Istniejące testy era-war zielone lub re-pin z uzasadnieniem.
3. Pomiar kierunkowy: jeśli runner dyplomacji (gra/tools/diplomacy-measure-run.cjs lub podobny; analizy w dyspozycje/analizy) działa — seed 4242, ≥ 90 tur, PRZED/PO: czy wojna epoki Brąz zawiązuje się w oknie (nie stoi 68 tur). Gdy Chromium pada (SIGSEGV) — NIE ZMIERZONO, napisz uczciwie.

## Allowlista
pliki logiki wojen epoki i parowania (znajdź; tylko to, co niezbędne), nowy test gra/tools/era-war-pairing-alliance-test.cjs, testy era-war wymagające re-pinu (uzasadnij), dyspozycje/analizy/ERAWAR-PAROWANIE-2026-11-25.md (wynik pomiaru/opis), dyspozycje/autobot/runs/R-WEB-ERA-WAR-PAIRING-ALLIANCE-NO-BLOCK-Q1/**.

## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (tylko vite build --outDir poza repo), zmiana progów (40 tur) i innych parametrów, rm/rmdir/unlink, git add -A, push, NOWE SESJE/ZADANIA/HARMONOGRAMY (spawn_task, create_session, create_trigger, send_later — NIGDY), run_in_background. Operator nie integruje i nie deployuje. Dysk ≥ 4 GB; npm ci w gra/ w swoim worktree.

## Bramki
tsc --noEmit exit 0; logic-test 213, tech-tree-test 20, research-test 33, unit-replace-test 21, combat-test 6; testy era-war/war-rules/multiwar (surowe liczby); nowy test zielony z mutacją czerwoną. ZACOMMITOWAĆ i zwrócić SHA.

## Binarne kryterium
PRAWDA: sojusz nie blokuje wojny epoki; parowanie do skutku; fallback po trzech; testy i bramki zielone.

## DODATEK orkiestratora (runda 1)
Środowisko: worktree izolowany od kandydata (git checkout --detach <cand>); w gra/ uruchom `npm ci` (brak wspólnego node_modules). Zgoda właściciela na start: „realizuj po kolei” (2026-11-25). Raport: dyspozycje/autobot/runs/R-WEB-ERA-WAR-PAIRING-ALLIANCE-NO-BLOCK-Q1/10-operator-claude.md. Uwagi spoza zakresu wpisz do UWAGI-DLA-ORKIESTRATORA. Model: Operator HAIKU 5.5.
