STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-END-LIKE-CLASSIC-Q1
GOAL: wojny epoki (Kamień/Brąz/Żelazo) AI↔AI kończą się tymi samymi ścieżkami co klasyczne (P12 po 2 zdobytych miastach z warunkiem bilansu PW ≥ 0 u obu AI, P20 prośby o pokój); sprzątanie po pokoju i karencja bez zmian; para gracz↔AI bez zmian.
ZMIANY/COMMIT: kandydat e6b7ecc89 (baza 18eefa311). Obrona: czubek commita podany w polu sha odpowiedzi. Zmienione ścieżki obrony: gra/src/main.ts (komentarz nagłówkowy maybeResolveRegularWarOnCityCapture, usunięte słowo „return” z komentarza, bez zmiany logiki), gra/tools/forced-war-r9-no-auto-end-live-test.cjs (kroki 3–4 przepięte na nowe zachowanie), gra/tools/forced-war-iron-main-guard-test.cjs, forced-war-stone-main-guard-test.cjs, forced-war-bronze-main-guard-test.cjs (etykiety i komentarze R9 — same asercje bez zmian), gra/tools/era-war-end-like-classic-test.cjs (nowe asercje B4b/B4c), dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md (sekcja 7a: tabela P1–P21), ten raport.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. forced-war-r9-no-auto-end-live-test.cjs pinował stare zachowanie (krok 3: wojna trwa po 2 miastach; krok 4: endWarByPeaceForTest). Przepięto: krok 3 oczekuje pokoju po 2 miastach (wpis rejestru usunięty, relacja != 'wojna', restUntil > tura), krok 4 usunięty (pokój już zaszedł przez miasta). Krok 2 (limit czasu nie kończy wojny) bez zmian. Komentarze w forced-war-iron-main-guard-test.cjs i forced-war-stone-main-guard-test.cjs odsyłające do tego testu zaktualizowane (etykieta asercji R9 zmieniona: nie dowodzi już braku auto-pokoju po miastach). Test live NIE ZMIERZONO (brak Playwright/Chromium w tej sesji; nie uruchamiano vite build zgodnie z zakazem). Ryzyko: krok 3 zakłada bilans PW ≥ 0 u obu AI w scenariuszu startowym; jeśli bilans jest ujemny, auto-pokój zostanie zablokowany i krok 3 padnie. To jest do potwierdzenia przy pierwszym biegu live.
2. PRZYJMUJĘ CZĘŚCIOWO. Dodano asercje strukturalne w era-war-end-like-classic-test.cjs: B4b (przed sprawdzeniem relacji 'wojna' są dokładnie 2 strażniki właścicieli i zero odwołań do rejestrów/`.has(`), B4c (w całej funkcji brak ForceWarActive/Cycle/Pending). Mutacja potwierdzona: wstawienie `if (bronzeForceWarActiveByPairKey.has(pairKey)) return;` przed sprawdzeniem relacji → FAIL w B4, B4b, B4c (wynik: 3 FAIL, przywrócono plik main.ts, cmp OK). Nie dodano testu behawioralnego całego main.ts (brak możliwości bundlowania tej funkcji bez pełnego środowiska; NIE ZMIERZONO). Test AI↔AI prośby P20 zostaje na poziomie wiązania tekstowego (B8, B9) oraz zachowania isForcedPeaceEligiblePair (A1–A6).
3. PRZYJMUJĘ. Dodano sekcję 7a z tabelą P1–P21 × AI↔AI epoka PRZED/PO w dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md. Zmieniły się tylko P12 (NIE→TAK) i P20 (NIE→TAK); P10, P11, P13, P15, P16 były TAK przed i po.
4. ODRZUCAM z dowodem dla obu czerwonych testów. Zainstalowano zależności tylko do testów (npm ci --ignore-scripts, bez build) i uruchomiono na bazie 18eefa311 (src i tools przywrócone z bazy na czas testu, potem przywrócono z e6b7ecc89 — stan czysty przed commitem):
   - forced-war-iron-test.cjs: baza „PASSED: 53 / FAILED: 2 / TOTAL: 55” (FAIL: sojusz z celem nadal blokuje wojnę Żelaza; sojusz z celem blokuje DOW). Kandydat: identyczny wynik 53/2.
   - diplo-forced-peace-pending-test.cjs: baza „PASS=39 FAIL=1”. Kandydat: „PASS=39 FAIL=1”. Identyczne.
   Oba czerwone testy są więc wcześniej istniejące, nie wprowadzone przez zmianę.
5. PRZYJMUJĘ. Komentarz nagłówkowy main.ts ok. linii 40884 poprawiony na „bezpiecznik dla wojen AI↔AI (zwykłych i epoki)”. Komentarz przy wczesnym wyjściu zmieniony tak, by nie zawierał słowa „return” (test B4b liczy returny).

TESTY (wyniki z surowego wyjścia, po poprawkach w tej rundzie):
- npx tsc --noEmit (gra/): exit 0
- node tools/era-war-end-like-classic-test.cjs: Razem PASS 17 / FAIL 0 (poprzednio 15/0)
- mutacja (wczesny return z ForceWarActive w maybeResolveRegularWarOnCityCapture): 3 FAIL (B4, B4b, B4c), main.ts przywrócony (cmp OK)
- node tools/ai-war-nearest-city-peace-2t-test.cjs: exit 0 (MUTACJE 15/15 zabite, WYNIK PASS)
- node tools/war-rules-multiwar-main-guard-test.cjs: 21 PASS / 0 FAIL
- forced-war-bronze-main-guard-test.cjs: 22 PASS / 0 FAIL; forced-war-stone-main-guard-test.cjs: exit 0 (15 PASS / 0 FAIL); forced-war-iron-main-guard-test.cjs: 36 PASS / 0 FAIL
- diplo-forced-peace-pending-test.cjs: PASS=39 FAIL=1 (ten sam wynik na bazie — poza tematem)
- forced-war-iron-test.cjs: PASSED 53 / FAILED 2 (ten sam wynik na bazie — poza tematem)
- ai-wojny-zwykle-cap-dwa-miasta-test.cjs: bloki bez live zielone (wcześniej 21/0, 22/0, 15/0, 36/0, 14/0 wg obrony Operatora); blok live (fast-forward endTurn) FAIL 2/4 („ffSettledFailure”, „turnNow 1”). Na bazie NIE ZWERYFIKOWANO: próba przywrócenia bazy została odrzucona przez politykę uprawnień i nie została powtórzona. Wynik na kandydacie identyczny jak w raporcie Operatora (środowiskowy, live).
- forced-war-r9-no-auto-end-live-test.cjs: NIE ZMIERZONO (brak Playwright; vite build zakazany w gra/).
- NIE ZMIERZONO w tej rundzie: ai-test 297/0, logic 213, tech-tree 20, research 33, unit-replace, combat 6, hotseat e-source 77/0, hud-me-literal-zero, bramki-tmpdir PASS=18, pozostałe testy live.

BLOKADY: test live R9 (krok 3) wymaga bilansu PW ≥ 0 w scenariuszu; pierwszy bieg live może wymagać korekty scenariusza. Nie blokuje FC, jeśli FC przyjmie NIE ZMIERZONO jako notę.
RUNDY: 2/5 (runda obrony po zarzutach Evaluatora; kandydat z rundy 1 e6b7ecc89)
NASTĘPNY KROK: Final Control na czubku tego commita; bramki live (r9-no-auto-end, ai-wojny-zwykle-cap blok live) do zmierzenia w środowisku z Chromium.
UWAGI-DLA-ORKIESTRATORA: npm ci --ignore-scripts został uruchomiony w worktree (gra/node_modules, nieśledzony); do usunięcia po bramkach. Próba checkoutu bazy do ponownej weryfikacji testu live została odrzucona przez politykę uprawnień — nie ponawiano; wynik live na bazie oznaczono jako NIE ZWERYFIKOWANO.
DEPLOY/PUSH: NIE WYKONANO
