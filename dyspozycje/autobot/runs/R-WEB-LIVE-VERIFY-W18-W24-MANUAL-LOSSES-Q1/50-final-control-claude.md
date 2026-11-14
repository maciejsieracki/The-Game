STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1
GOAL: potwierdzenie na żywo W18 (machiny oblężnicze widoczne tylko po odkryciu techu) w Chromium; r4 domyka zarzuty Evaluatora.
ZMIANY/COMMIT: oceniany kandydat 8c90c99b4 (potomek bazy 2fffcab26: git merge-base --is-ancestor = tak). Diff vs baza: gra/src/main.ts (+41, hak pod ?civTest=1), gra/tools/live-verify-w18-w24-manual-losses-w18r3.cjs, dokumentacja i evidence w runs/<ID>/. Brak zmian w gra/data, WERSJE.md, gra-robocza/, rust-port/. git diff --check 2fffcab26..8c90c99b4: czysty. merge-tree 8c90c99b4 z aktualnym origin/main: bez konfliktów (drzewo 8301913ea). integration_sha = 8c90c99b4.

ZARZUTY (werdykt FC):
1. Izolacja techu hakiem, odświeżanie otwartego panelu NIE_ZMIERZONO: ODDAL (dispatch dopuszcza hak; ograniczenie jawne w raporcie).
2. F0 sztuczny: ODDAL. Faza F-start-naturalny-preset bez setResearchedTechs: researched=[], 0 machin widocznych; potwierdzone moim przebiegiem.
3. Brak dowodu budowy (insufficient_resources): ODDAL. Kryterium W18 to widoczność; zdolność budowy NIE_ZMIERZONO, nie jest twierdzona.
4. Brak mutacji: ODDAL (już wykonana). Powtórzyłem niezależnie.
Żaden NAPRAW.

TESTY (surowe wyjście, własny build poza repo, npm ci w worktree):
- tsc --noEmit: exit 0.
- vite build (outDir w scratchpad): exit 0, index.html 14 677 820 B.
- live-verify-w18 (Chromium, HTTP): VERDICT PASS, tabela 24/24 ok, errors=[]. Widoczne: start naturalny [] ; F0 [] ; F1 (Obróbka drewna) [Taran]; F2 (Brązownictwo) [Taran okuty, Wieża oblężnicza]; F3 [Taran, Taran okuty, Wieża]; F4 (+Sztuka wojenna) [+Katapulta]. Brak „dostępna przed techem” ani „niedostępna po”.
- Mutacja siege-engine-build.ts:110 (filter => true || ...): VERDICT FAIL; po przywróceniu (git checkout) PASS; drzewo robocze czyste.
- Zrzut F1 obejrzany: panel oblężenia bez nakładki Dyplomacji, blok „Zbuduj machinę w oblężeniu” z samym Taranem. Panel przycięty u dołu przy 800 px (znane, osobny temat).
- logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33 ALL GREEN; unit-replace-test 21/21; combat-test 6/6 (wszystkie exit 0).

BLOKADY: brak.
NIE_ZMIERZONO: odświeżanie otwartego panelu po odkryciu techu w trakcie oblężenia; zdolność budowy z surowcami; pełna gra po wielu turach (ABC #261 na tym presecie nie odtwarza się).
UWAGI-DLA-ORKIESTRATORA: (a) hak ~41 linii w main.ts pod ?civTest=1 (startPlayerSiege, setResearchedTechs, researchedTechs, siegeOptions, fundPlayer) — decyzja o ewentualnym wycofaniu po Twojej stronie; (b) przycięcie panelu oblężenia przy 800 px jako osobny temat; (c) main poszedł naprzód (f08827ba2), merge-tree czysty.
RUNDY: 4/5
NASTĘPNY KROK: integracja 8c90c99b4 przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
