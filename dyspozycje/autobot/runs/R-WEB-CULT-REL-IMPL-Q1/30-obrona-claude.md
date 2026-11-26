# R-WEB-CULT-REL-IMPL-Q1 — obrona Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CULT-REL-IMPL-Q1 (CULTIMPL, #173 + #174)
GOAL: kultura i religia liczą się do Szczęścia i Prawa miasta (łatwy −10/+10, normalny −15/+5, trudny −20/0 na linię, skala epok ×1,0/×1,6/×2,3); ustawienie „Kultura i religia” w nowej grze (domyślnie Mały wpływ/łatwy); zapisy bez pola = tryb zgodności (bit-w-bit jak dziś).
ZMIANY-COMMIT: baza 1f46f5bbe (kandydat), zmiany obrony w commitach a67e4571c (silnik, testy, docs) i potem commit hooka civTest (gra/src/main.ts, patrz niżej); SHA czubka: patrz pole `sha` w wyniku.
  - gra/src/game/society-breakdown.ts: `LawBreakdownInput.haRel` (nowe pole); udział religii dla Prawa = `ownReligionShare` → `ownShareFromSignal(haRel)` (brak = 0,5). Jedno źródło prawdy z Szczęściem (zarzut 9). `evaluateOrderFromBreakdown` przekazuje `haRel` zamiast liczyć fallback sam.
  - gra/tools/culture-religion-level-test.cjs: sekcja 6 przepisana (tautologiczne „mutacje” z innymi argumentami usunięte, zarzut 4); dodane asercje: Prawo epoka 2 = −32 i epoka 3 = −46 (zarzut 5), źródło udziału religii z haRel −1 = −20 w Prawie i w Szczęściu (zarzut 6), poziom łatwy: Prawo kultura 100% = +10, religia 100% = +10 (zarzut 7), normalny: Szczęście kultura 0% = −15, epoka 2 100% = +8 w Szczęściu i Prawie. Wynik: 59 pass / 0 fail (było 50/0).
  - docs/obieg/KULTURA-RELIGIA-ZASADY.md (NOWY): jedna sekcja opisu zasad (zarzut 3).
  - gra/src/main.ts (tylko hak civTest `__nnsMeasureDebug.startGame`): opcjonalne pole `kulturaReligiaLevel` przekazywane do `advanced`; brak pola = `undefined` = zgodność (domyślne zachowanie innych runnerów bez zmian).
  - dyspozycje/autobot/runs/R-WEB-CULT-REL-IMPL-Q1/30-obrona-claude.md (ten raport).
TESTY:
  - tsc --noEmit (gra/): exit 0 (po zmianie main.ts i society-breakdown.ts).
  - culture-religion-level-test.cjs: 59 pass / 0 fail.
  - PRZED/PO bit-w-bit (zarzut 8): wzorzec legacy = `git show 690947a2a:gra/src/game/society-breakdown.ts` bundlowany obok nowego modułu; poziom NIEUSTAWIONY; 64 800 przypadków (3 poziomy trudności × epoki 1–3 × udział kultury 10 wartości × udział religii 10 × haRel 6 × populacja 3 × garnizon 2; porównanie computeHappinessBreakdown, computeLawBreakdown i evaluateOrderFromBreakdown, JSON.stringify całości): ROZJAZDY 0.
  - Mutacje czerwone na źródle (zarzut 4), każda przywracana z kopii po pomiarze, tools/culture-religion-level-test.cjs:
    M1 zamiana D/G trudny (−20/0 → 0/−20): exit 1, 8 FAIL.
    M2 brak skali epok (`k = 1`): exit 1, 8 FAIL.
    M3 brak linii Prawa (`if (cLevel !== null)` → `if (false)`): exit 1, 12 FAIL.
    M4 udział religii Prawa = 0,5 zamiast haRel: exit 1, 2 FAIL.
    Po przywróceniu: 59 pass / 0 fail. Mutacja ścieżki zgodności (usunięcie `level === null ||`) nie była uruchamiana osobno (wywołuje wtedy TypeError na granicach); zgodność pokryta przez porównanie PRZED/PO powyżej.
  - happiness-breakdown-test 38/38; society-breakdown-test 56/0; law-garrison-test 3/0; prawo-siatka-v2-test 55/0; szczescie-skala-normalizacja-test 148/0 (exit 0 każdy).
  - ai-test: 297 passed, 0 failed (poziom domyślny = zgodność, wynik jak w rundzie 1).
  - POMIAR AI 60 tur seed 4242 (zarzut 1), poziom MAKSYMALNY „Kultura i religia” = trudny (Duży wpływ); gra: poziom trudności „Normalny” (jak domyślny runner; poziom trudności gry NIE był zmieniany, patrz BLOKADY). Live bundle vite (scratchpad, bez npm run build), headless Chromium, runner ai-economy-measure-run.cjs w kopii z parametrem kulturaReligiaLevel. Liczby z surowego jsonl (59 rekordów, tury 2–60, stop: null, gate bypass 3 tury):
      tura | trudny: wł. z miastami / miasta / PUSTE miasta / jednostki | zgodność (przed zmianą, ten sam bundle): wł. / miasta / PUSTE / jednostki
      t30 | 18 / 58 / 17 / 76 | 19 / 82 / 19 / 114
      t40 | 18 / 96 / 16 / 142 | 18 / 127 / 21 / 209
      t50 | 17 / 117 / 31 / 151 | 18 / 150 / 31 / 227
      t60 | 16 / 154 / 55 / 171 | 18 / 166 / 27 / 243
    Utrata: w obu przebiegach ta sama faza spadku liczby właścicieli z 41 do 18–19 w turach 20–30 (zgodność również), liczba zdarzeń utraty miasta w t2–t34: trudny 25, zgodność 23. Nie widać masowej utraty ponad poziom zgodności. Bunty nie są rejestrowane przez runner — przyczyny utraty (bunt vs wojna) NIE ZMIERZONO osobno.
    Obserwacja (nie blokuje): na trudnym AI ma o ~30% mniej jednostek w t60 (171 vs 243) i więcej pustych miast (55 vs 27, czyli 36% vs 16% miast). Garnizon AI NIE zmieniony (zgodnie z dispatchem).
  - ROUND-TRIP zapisu pola (zarzut 2): (a) zapis: w IndexedDB slot `thegame.save.<slot>` zawiera `newGameParams.advanced.kulturaReligiaLevel` (sonda: hasField true, 36 205 B); (b) wczytanie: ścieżka runnera (loadSlot → restoreGameFromSave) po wznowieniu: `getSettings().kulturaReligiaLevel = "trudny"`, playerCities = 1 (wyjście runnera `[KR-PROBE]`). Samodzielny skrypt Playwright (fresh strona + loadSlot) nie doprowadził do załadowanej gry (playerCities 0 po 300 s) — ten wynik pomijam jako nierozstrzygający i NIE rozszerzam go na dowód.
  - LIVE kreator (zarzut 2, część „kreator → trudny → odczyt rozbicia Szczęścia/Prawa”): NIE ZMIERZONO. Nie klikano kreatora; odczyt rozbicia miasta obcej kultury z zrzutu NIE wykonany (oszczędność; dispatch: „jeśli Chromium stabilny”).
BLOKADY:
  - Poziom trudności GRY (Normalny/Trudny) nie został zmieniony w pomiarze; maksimum zastosowano dla ustawienia „Kultura i religia” (zgodnie z regułą 26.11 „najwyższy poziom tam, gdzie to dotyczy”). Jeżeli właściciel miał na myśli także trudność gry, pomiar trzeba powtórzyć — NIE ZMIERZONO.
  - Kreator (klik w opcję „Kultura i religia”, podsumowanie, zrzut rozbicia) — NIE ZMIERZONO.
  - Mutacja ścieżki zgodności — NIE URUCHOMIONO osobno (patrz wyżej).
  - Bunty jako przyczyna utraty miast — NIE ZMIERZONO (brak logu buntów w runnerze).
RUNDY: 2/5 (Operator, Haiku 5.5). Runda 1: 10-operator-claude.md.
ODPOWIEDZI NA ZARZUTY (Evaluator, cf00c47a391453e324ba25834a1354ca9c928eab):
  1. PRZYJĘTE — pomiar AI 60 tur seed 4242 na trudnym wykonany (tabela wyżej). Kryterium: brak masowej utraty miast ponad zgodność; obserwacja garnizonów zapisana jako uwaga.
  2. PRZYJĘTE — round-trip zmierzony (ścieżka runnera, pole w slocie potwierdzone). Live kreator NIE ZMIERZONO (zobacz BLOKADY).
  3. PRZYJĘTE — wykonane: docs/obieg/KULTURA-RELIGIA-ZASADY.md.
  4. PRZYJĘTE — sekcja 6 przepisana, mutacje na źródle uruchomione (M1–M4 czerwone, wyniki wyżej).
  5. PRZYJĘTE — asercje Prawa epoka 2/3 dodane; M2 wykrywa.
  6. PRZYJĘTE — asercje haRel/ownReligionShare w Prawie dodane; M4 wykrywa.
  7. PRZYJĘTE — testy łatwy i normalny dla Prawa i Szczęścia dodane.
  8. PRZYJĘTE — porównanie PRZED/PO bit-w-bit wykonane na 64 800 przypadkach (0 rozjazdów), obejmuje Prawo i evaluateOrderFromBreakdown.
  9. PRZYJĘTE — usunięty drugi źródło prawdy: Prawo używa haRel (ownShareFromSignal), jak Szczęście. Fallback 0,5 zostaje tylko w samym ownShareFromSignal (brak haRel = 0,5), tym samym dla obu linii.
  10. ODRZUCAM z dowodem: plik istnieje w worktree: dyspozycje/analizy/KULTURA-RELIGIA-WPLYW-2026-11-26.md (nagłówek: baza origin/main 8c45256803986c78572861ffc1319f21fed56d8e, tag CULTRELANALYSIS). Brak w tej rundzie NIE jest zarzutem wobec kodu: cel garnizonu 2/3/4 nie jest w zakresie dispatchu (dispatch wymaga jednostki 20 pkt bez zmian); odnotowany w docs/obieg jako poza zakresem.
NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja rundy 2 (commit SHA w polu sha wyniku), w tym decyzja, czy pomiar na trudnym z utratą miast i pustymi garnizonami wymaga DECISION_REQUIRED (orkiestrator).
UWAGI-DLA-ORKIESTRATORA:
  - Różnica garnizonów AI na trudnym (pusta 55 vs 27 miast w t60, jednostki −30%) to obserwacja balansu; wg dispatchu nie zmieniam ai-city-garrison.ts. Jeśli właściciel ma o tym zdecydować, to jest pytanie ABC o grę (zakres: garnizony AI przy Duży wpływ).
  - Runner ai-economy-measure-run.cjs nie przyjmuje poziomu kultury; w repo nie zmieniano jego pliku. Do przyszłych pomiarów potrzebny parametr (propozycja: --kulturaReligiaLevel), zrobione tylko w kopii scratch.
  - Hak __nnsMeasureDebug.startGame (main.ts) dostał opcjonalne pole `kulturaReligiaLevel` — jest w allowliście jako hak civTest; zmiana minimalna.
  - Punkt 10 zarzutów (analiza) — plik istnieje; w rundzie 1 Operator go nie widział, bo jego worktree nie zawierał katalogu dyspozycje/analizy (ustalenie techniczne, nie błąd kodu).
DEPLOY/PUSH: NIE WYKONANO
