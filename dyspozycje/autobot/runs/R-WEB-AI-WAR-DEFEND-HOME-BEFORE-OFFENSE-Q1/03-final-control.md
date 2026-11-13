STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-WAR-DEFEND-HOME-BEFORE-OFFENSE-Q1
GOAL: AI w wojnie najpierw odbija własne utracone miasta (P1) i zwalcza wrogie wojsko na własnym terenie (P2), dopiero potem zdobywa cudze (P3).
ZMIANY/COMMIT: oceniony SHA do integracji `c2799546d` (kod i testy w `344e5b3fd`), baza = origin/main `98ef746c2` (origin/main nie ruszył się od bazy; cherry-pick/merge czysty). Ten raport: commit na gałęzi `fc-defend-home-q1-r1` (tylko 03-final-control.md; SHA do integracji kodu pozostaje `c2799546d`, ewentualnie dziecko z raportem).
Diff do allowlisty: ai.ts, NOWY ai-war-home-defense.ts, gra/tools/ai-war-defend-home-{test,sim,measure}.cjs, war-allin-capital-test.cjs, runs/<ID>/**. Zero zmian: gra-robocza, WERSJE.md, rust-port, src-tauri, main.ts, balans. git status czysty.
TESTY (odtworzone samodzielnie, tsc po npm ci --ignore-scripts; node_modules usunięte):
- tsc --noEmit EXIT=0
- ai-war-defend-home-test 30/0 (w tym 4 mutacje, determinizm)
- ai-war-gate 24/0; ai-war-nearest-city-peace-2t mutacje 16/16 zabite, PASS; army-concentration 56/0; ai-general-war-campaign 51/0
- ai-home-defense-vs-barbarians 35/3 (T2, T4, T5) — IDENTYCZNIE na bazie (ai.ts z 98ef746c2): czerwone przed zmianą, nie regresja. Klasyfikacja operatora A (przestarzałe) zaakceptowana.
- war-allin-capital-test: zmiana asercji 1k (ruch lub atak) uzasadniona i nieosłabiająca sedna (P2 zamienia marsz w atak).
Metryki operatora (gate-measure.txt): jednostko-tury wroga na terenie AI 1225 -> 189, najdłuższy epizod 33 -> 5 tur, czas tury 154,6 -> 155,9 ms.
WERDYKT ZARZUTÓW: lista zarzutów Evaluatora pusta. Uwagi 1-5 rozpatrzone:
1. Spadek zdobyczy 33 -> 4 (P3 zduszone?): ODDAL. To zamierzony skutek decyzji 2A w scenariuszu symetrycznym; test na przebiegu asymetrycznym zapisany jako NIE_ZMIERZONO, kandydat do obserwacji po wdrożeniu.
2. Wymiana par A<->B = 0 przed i po w pełnych przebiegach: ODDAL. Objaw odtworzony w T1 (RED przed / GREEN po), w przebiegach metryka zastępcza; jawnie opisane.
3. Mgła nie filtruje defStrength/wyboru celu P1: ODDAL (zgodne z precedensem enemyAllUnitsRegardlessOfVisibility; NIE_ZMIERZONO, drobne).
4. Silnik zastępczy, brak Chromium/main.ts: ODDAL (dozwolone; NIE_ZMIERZONO). Zalecany smoke w przeglądarce przy deployu.
5. Kasowanie ruchów jednostek przypisanych do P1/P2 może kolidować z obroną przed barbarzyńcami: ODDAL. P2 liczy tylko cywilizacje (barbarzyńcy poza enemyUnits); P1 jest wprost wymaganym priorytetem; war-allin już dziś nadpisuje obronę domu przed barbarzyńcami (osobny temat-kandydat, nie pogorszenie). NIE_ZMIERZONO.
Wynik: zero NAPRAW, zero DO DECYZJI CZŁOWIEKA -> PASS-WITH-NOTES.
BLOKADY: brak
RUNDY: Final Control 1/5
NASTĘPNY KROK: integracja orkiestratora. Kolejność względem origin/rust-port/parity-v2: gałąź webowa niezależna (merge-base z parity-v2 = f4c89d008, zmiany tylko w gra/ i dyspozycje/); najpierw wdrożyć/zintegrować do main (c2799546d na origin/main 98ef746c2), potem REPIN Rust (AI wojna) na parity-v2 — Rust nie blokuje web. Opcjonalnie nowy temat: war-allin vs obrona przed barbarzyńcami; obserwacja P3 na przebiegu asymetrycznym.
DEPLOY/PUSH: NIE WYKONANO
