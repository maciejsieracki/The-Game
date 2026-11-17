STATUS: PASS-WITH-NOTES
DOMAIN: GAME (Zastąp, AI-awans, testy gra/tools)
TEMAT: R-WEB-UNIT-REPLACE-INCA-AND-NATIONAL-ARCHERS-TO-SLINGER-Q1
GOAL: Procarz jako cel Zastąp dla łuczników Inków i narodowych łuczników, gracz i AI, pełny koszt; wariant Żelaza do decyzji właściciela.
ZMIANY-COMMIT: kandydat 68a9e2cd215145bea104c1a8302a42a0e242b2d3 jest potomkiem bazy 4183b8617af59a09751a63a403777e660e7d7919 (git merge-base --is-ancestor = tak). Diff vs baza: units.json (4 wpisy "Zastąp specjalnie": Oszczepnik (Estólica) -> Procarz/Procarz (Huaracoc); nubijski, akadyjski, asyryjski -> Procarz), ai-era-unit-promotion.ts (wąski wyjątek same-epoch), unit-replace-archer-slinger-test.cjs, unit-replace-promotion-table-test.cjs, raporty 10/30. Brak wikiBundle (wiki nie opisuje tabeli zamian - grep). integration_sha = 68a9e2cd215145bea104c1a8302a42a0e242b2d3 (kod); raport FC osobnym commitem.

WERDYKTY PER ZARZUT:
1. AI nie awansuje nubijskiego/akadyjskiego/asyryjskiego: NAPRAWIONE już w kandydacie (r2 obrona); zweryfikowane mutacją mojej ręki (cofnięcie wyjątku -> archer-slinger 40 OK / 3 FAIL, przywrócono). ODDAL (zamknięte). Plik ai-era-unit-promotion.ts jest wymieniony w dispatchu w "Pliki do zbadania", zakres dopuszczalny (ZAŁOŻENIE).
2. Brak jednostki Żelaza: DO DECYZJI CZŁOWIEKA (realna decyzja produktowa). Dane: w units.json brak dystansowej/procarz-podobnej jednostki Żelaza (jedyne dystansowe Żelazo: nubijski/akadyjski/asyryjski, które są źródłami, nie celami). Dispatch zabrania dodawania celu bez jednoznacznych danych. Opcje: A zostawić Procarz także w Żelazie (stan obecny, rekomendacja); B wskazać/dodać cel Żelaza; C ograniczyć Procarz do Brązu.
3. Chromium okno "Zastąp": NIE ZMIERZONO (hak __civTest.addUnit jeszcze niewdrożony; pełne sterowanie UI nie wykonane). Ścieżka danych pokryta testami availableReplacementsFor; nieblokujące, ODDAL do LIVE-VERIFY.
4. Oszczepnik generyczny i Zulu: ODDAL jako poza zakresem (to nie łucznicy ani Inkowie; Estólica jest dystansową jednostką Inków, jawnie w zakresie DODATKU). Pozycja D do właściciela (nieblokująca).
5. Cienkie pokrycie akadyjski/asyryjski: ODDAL (ryzyko niskie; EXPECTED_TABLE w promotion-table-test łapie mutację danych).
6. Bramki referencyjne: ODDAL (wykonane przeze mnie, zielone).

TESTY (surowe wyjścia, kandydat 68a9e2cd2):
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: 21/21
- combat-test: 6/6
- unit-replace-archer-slinger-test: 43 OK, 0 FAIL
- unit-replace-promotion-table-test: PASS 30 wpisów, 62 krawędzi
- ai-era-unit-promotion-test: 17 passed, 0 failed
- ai-unit-replace-same-rules-test: 45 passed, 0 failed
- unit-replace-full-cost-test: 39 passed, 1 failed (dług bazowy "performUnitReplace (gracz): pobiera PELNY Pieniadz...", niezmieniony, zgłoszony przez Operatora identycznie na bazie)
- tsc --noEmit (typescript z scratchpad, bez @types/three): 177 błędów wyłącznie środowiskowych (brak typów three, import.meta/glob w filePlayer); 0 błędów w ai-era-unit-promotion.ts. Czysty tsc 0 NIE ZMIERZONO w pełnym środowisku.
- Chromium: NIE ZMIERZONO.
BLOKADY: brak blokad kodu. Otwarte: A/B/C Żelazo, D (Oszczepnik poza Inkami), LIVE-VERIFY okna Zastąp, dług Rust REPIN tabeli zamian, dług bazowy full-cost 39/1.
UWAGI-DLA-ORKIESTRATORA: AI w Brązie będzie degradować narodowych łuczników (Specjalna) do Procarza (Standardowa) za pełny koszt (limit 10% armii/turę z ai-params) - zgodne z decyzją właściciela 2026-11-17, warto obserwować siłę AI. Brak zarzutu NAPRAW, więc nie FAIL.
RUNDY: 3 (FC)/5
NASTĘPNY KROK: integracja 68a9e2cd2, bramki po merge, deploy po osobnej autoryzacji; decyzja właściciela A/B/C.
DEPLOY/PUSH: NIE WYKONANO
