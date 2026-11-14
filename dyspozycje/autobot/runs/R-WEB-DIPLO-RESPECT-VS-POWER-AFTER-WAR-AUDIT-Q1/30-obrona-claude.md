# R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1 — obrona Operatora (Haiku 5.5) na zarzuty Evaluatora r3

STATUS: PASS-WITH-NOTES (zarzuty 1-4 odpowiedziane; zarzut 2 zamknięty tylko w części; nowe ustalenia F-1 i F-2 do decyzji)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1
GOAL: odpowiedzieć na zarzuty 1-4 Evaluatora (20-evaluator-claude.md, kandydat a0e93631b, raport 57f406f81) poprawką raportu i pomiarem, bez zmian w gra/src.
ZMIANY/COMMIT: tylko dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1/ (30-obrona-claude.md, evidence/sim-respekt-wojna-r4.cjs, evidence/wynik-pomiaru-r4.txt). Zero zmian w gra/src, gra/data, gra/tools, WERSJE.md. SHA: patrz pole sha w odpowiedzi (commit na gałęzi roboczej worktree, bez push).
BAZA: 57f406f81 (detached, bazowy kod = dcf743709 w gra/).
TESTY: gra/ nie zmieniano w tej rundzie, więc bramek nie uruchamiałem ponownie. Wyniki bramek z r3 (cytat z Evaluatora, nie mój pomiar): tsc 0 błędów; logic-test 213/213; tech-tree-test 20/20; research-test 33/33; unit-replace-test 21/21; combat-test 6/6. Mój pomiar r4: `node .../evidence/sim-respekt-wojna-r4.cjs` exit 0 (wynik w evidence/wynik-pomiaru-r4.txt). Środowisko: `npm ci --ignore-scripts` w gra/ (71 pakietów) tylko po to, by esbuild działał.

---

## Odpowiedzi na zarzuty

### Zarzut 1 (Z2: źródło paska 29 i „Respekt czyta zapisany rel.respekt”) — PRZYJMUJĘ

Poprawka do raportu r1/r2. Na main (HEAD 57f406f81, kod jak w dcf743709):
- main.ts:25397 `respekt: rel.respekt ?? 0` to kontekst bramkowania akcji (`buildDiplomacyLockContextBase`), NIE pasek na audiencji. Mój poprzedni wniosek był błędny.
- Pasek „Respekt” na audiencji dostaje `respekt: respektNorm` (main.ts:25646), gdzie `respektNorm = powerLine.respekt` (main.ts:25605), a `powerLine = formatPowerRelationLine(playerPower, otherPower)` z mocy EFEKTYWNYCH (main.ts:25602-25604). Wartość = `computeRespekt(ME_eff, other_eff)` (diplomacy-display.ts formatPowerRelationLine).
- Relacja: `relacjaTotal: audienceRelTotalEffective(ownerId, rel)` (main.ts:25650) = `Zaufanie + objectiveRespektPctTowardEffective(ownerId)` (main.ts:25365 / 2922-2927) = ten sam `computeRespekt(ME_eff, other_eff)`. Pasek Respekt i Relacja na main używają więc tej samej wartości; rozjazd „29 + 67” NIE występuje na obecnym main.
- Źródło 29: pre-fix (ffefa9df7, 2026-11-09 23:20, R-WEB-DIPLO-RESPECT-DISPLAY-TRUE-VALUE-Q1) `effectiveNastawienieScores(zaufanie, respekt, atWar)` zwracało `clampRelationForWar(...)`. Przy Z=0 clamp (WAR_RELATION_SCORE_CAP = progMinimalnyRelacja−1 = 29, diplomacy.ts:1105, clampRelationForWar diplomacy.ts:1121) ścinał R_live do 29 na PASKU. Relacja w tamtej wersji liczona z niescinanej wartości = 0 + 67 = 67. To jedyne wyjaśnienie pary „Respekt 29 / Relacja 67 przy Zaufaniu 0”, zgodne z kodem sprzed ffefa9df7 (diff: usunięty blok `if (!atWar) return …; clampRelationForWar(...)`).
- Wniosek poprawiony: rozjazd 29/67 był skutkiem CLAMPA NA PASKU pre-fix (rozdział źródeł paska i Relacji), a nie reguły silnika. Po ffefa9df7 pasek pokazuje prawdziwą wartość i dopisek „limit wojenny 29” (diplomacy-display.ts:349-353 `warRelationCapApplies`, diplomacyAudience.ts:1275 dopisek).
- NIE_ZMIERZONO: data i wersja zrzutów właściciela nie są znane; nie sprawdziłem, czy zrzuty pochodzą sprzed ffefa9df7. Stwierdzam to tylko z kodu i diffu.

### Zarzut 2 (Z2: 67 vs computeRespekt(14682,1854)=89) — CZĘŚCIOWO PRZYJMUJĘ, luka otwarta jako NIE_ZMIERZONO

- Źródło 67 ustalone: 67 to niescinana wartość R_live pary (patrz zarzut 1). computeRespekt(2,1) = round(100·2/3) = 67, więc 67 oznacza stosunek mocy efektywnej gracz:Grecy ≈ 2,03:1 po stronie efektywnej.
- Ranking nominalny (dispatch): 14682 vs 1854 → computeRespekt(14682,1854) = round(100·14682/16536) = 89. Potwierdzone rachunkiem.
- Różnica 67 vs 89 NIE jest wyjaśniona: wartości efektywne (buildObjectivePowerForOwnerEffective, main.ts:2822-2861, mnożniki wodza/fortyfikacji/trudności) różnią się od nominalnych (buildObjectivePowerForOwner, main.ts:2767; `objectivePowerForOwner` main.ts:2901). Bez stanu gry (zapisu) nie mogę policzyć obu stron na jednym stanie. NIE_ZMIERZONO.
- Dla pewności podaję też: 14682:1854 to moc nominalna z rankingu; ten sam wynik 89 jest tym, co silnik zapisuje dla pary, gdy liczy moc NOMINALNIE (main.ts:41900, patrz F-2 niżej). Panel używa efektywnej, więc 67 vs 89 to dwie różne metryki, a nie błąd raportu użytkownika — ale to hipoteza, nie pomiar.

### Zarzut 3 (skład −1,5/turę dla Grecy–Chińczycy nieosiągalny; wiarygodnoscSkala) — PRZYJMUJĘ

- `sameCultureCircle` (diplomacy-display.ts:216-221) porównuje `typCywilizacji`: Grecy = `grecy`, Chińczycy = `chinczycy` (gra/data/civs.json, pole typCywilizacji; ZMIERZONO). Różne → `wspolnaReligia` = false (main.ts:23115 `sameCulture && …`).
- Religie różne (civs.json „Religia”: Grecy „Politeizm olimpijski”, Chińczycy „Konfucjanizm / Taoizm”; ZMIERZONO w danych) → `odmiennaReligia` = true (main.ts:23116) → −0,5. Uwaga: to dane w civs.json; stan religii w grze (`ownerReligionForOwnerId`) nie był sprawdzony na żywo (NIE_ZMIERZONO).
- Jedyny skład realny dający −1,5: granica −2 (sharedBorderPenaltyForEpochs(0..1) = −2, diplomacy.ts:598-607) + wspólny wróg +1 (flaga `diploBrakeBonusFlags`, NIE_ZMIERZONO) − odmienna religia 0,5. Obliczone w sim r4, sekcja A: ΔZ = −1.5 dla tego składu; bez wspólnego wroga −2.5.
- Skale: `wiarygodnoscSkalaMin` −100 / `wiarygodnoscSkalaMax` +100 (gra/data/diplomacy.json:93-94; ZMIERZONO); `wiarygodnoscTempoAmplituda` 0,5 (diplomacy.json:136). W wojnie wiarygodność nie wchodzi do ΔZ (`wiarygodnoscSelf` = undefined dla pary z graczem, main.ts:23123, diplomacy-credibility.ts:621-625) — zgodnie z r3.
- Tabela r3 „granica −2 + wspólna religia +0,5” jest oznaczona w sim r4 jako NIEOSIĄGALNA dla tej pary; zostaje tylko jako wiersz porównawczy.

### Zarzut 4 (symulacja nie odtwarza „10× silniejszy, wygrane bitwy”) — PRZYJMUJĘ; sekcja B r3 była artefaktem

- Potwierdzam: r3 sekcja B nie miała wejścia mocy. Ale przy okazji znalazłem, że to nie tylko brak wejścia: silnik nadpisuje Respekt co turę. main.ts:41900-41901 (`respektAI = computeRespekt(potAI, potPlr)`; `relWithRespekt = {...rel, respekt: respektAI}`) przed `tickDiplomacy` w main.ts:41934. Sekcja B r3 (R stały = 29) NIE odzwierciedla silnika.
- r4 dodaje sekcję C (`evidence/sim-respekt-wojna-r4.cjs`): dokładnie ten przepływ, potAI=10, potPlr=100 (10×), skład realny, start Z=40, 30 tur. Wynik (wynik-pomiaru-r4.txt, sekcja C; ZMIERZONO w symulacji, nie w grze):
  - zapisany R = 9 (AI-share) przez cały czas;
  - Z: 40 → 20 (t1) → 18,5 (t2) → 6,5 (t10) → 0 (od t15);
  - Z+R zapisany: 29 → 27,5 → … → 9 (od t15).
  - Udział GRACZA (to, co pokazuje panel) = computeRespekt(100,10) = 91 przez cały czas.
- Zdarzenia militarne: sekcja D r4 potwierdza wynik r3 (wygrana_bitwa +5 i przewaga_militarna +15 nie zmieniają R w wojnie, po ticku R=29, Z=0). Z4c (brak wywołań militarnych w call-site) zostaje potwierdzone przez Evaluatora; nie powtarzam.
- Ograniczenia (wprost): moc ustawiona stałą (100:10), nie z przebiegu bitew; rankingi nominalne, nie efektywne; brak live save.

---

## Nowe ustalenia (nie były w zarzutach; nie naprawiane w tej rundzie — read-only)

### F-1: `odmiennaReligia` jest na sztywno false w jednej ścieżce ticka gracz↔AI
- main.ts:41924 (`odmiennaReligia: false`) w ścieżce tury AI (main.ts:41900-41934). Druga ścieżka, `buildDiplomacyTickCtxForPair` (main.ts:23116), liczy `odmiennaReligia: !!religionA && !!religionB && religionA !== religionB`.
- Skutek: w ścieżce 41934 kara −0,5 za odmienną religię nie wchodzi do ΔZ. Która ścieżka odpowiada za panel/Relację w grze (zrzuty) — NIE_ZMIERZONO. Do sprawdzenia w następnej rundzie (ten sam nagłówek co Z3).

### F-2: rozjazd perspektywy Respektu między silnikiem a panelem (decyzja właściciela)
- Silnik zapisuje do relacji gracz↔AI: `respekt = computeRespekt(potAI, potPlr)` = UDZIAŁ MOCY AI (main.ts:41900-41901; potAI/potPlr = moc nominalna, main.ts:41856 i nizej). Przy 10× gracza zapisany Respekt = 9.
- Panel i Relacja liczą: `computeRespekt(ME_eff, other_eff)` = UDZIAŁ MOCY GRACZA (main.ts:25605, 25650; tooltip RESPEKT_TOOLTIP_PL diplomacy-display.ts:26-28: „jak duża jest wasza Moc w porównaniu z tą nacją… Wyżej = jesteś silniejszy”). Przy 10× gracza = 91.
- Ta sama nazwa „Respekt”, dwie perspektywy. Dokładnie to daje obraz z zrzutów właściciela: silny gracz ma NISKI Respekt w mechanice (silnik: Z spada do 0 w wojnie, sekcja C), a panel mówi, że jest silny. To jest odpowiedź na pytanie właściciela o kierunek, ale NIE rozstrzygam jej sam — wymaga decyzji produktowej.

Pytanie ABC do właściciela (propozycja; decyzja nie moja):
- A) Bez zmian w mechanice; panel przepisać tak, by pokazywał udział AI (Respekt AI wobec gracza) i nie mylił go z udziałem gracza. Zaleta: brak zmiany balansu. Wada: Respekt nadal spada z przewagą gracza (dokładnie pytanie właściciela).
- B) Ujednolicić silnik z panelem: Respekt = udział gracza (rośnie z przewagą i z wygranymi bitwami). Zaleta: zgodne z pytaniem właściciela i tooltipem. Wada: zmienia progi sojuszu (130/90), pokój (20%) i AI; wymaga osobnego pomiaru.
- C) Osobny składnik „Strach/Dominacja” zamiast Respektu. Zaleta: brak rozjazdu nazwy. Wada: nowy parametr i UI.
- Rekomendacja z danych: B wydaje się zgodna z tooltipem i panelem (intencja UI), ale to zmiana balansu — wybór właściciela. Przed wyborem trzeba zmierzyć wpływ na sojusze i pokój (r4 nie mierzy).

---

## Kryteria dispatchu (DODATEK r3)
- Z4a symulacja z trajektoriami: sekcja C r4 (przepływ silnika z mocą). SPEŁNIONE w ograniczeniu (moc stała, nominalna).
- Z4b składowe −1,5: SPEŁNIONE (granica −2 + wróg +1 − odmienna 0,5; skale ±100, tempo 0,5). Flagi w grze NIE_ZMIERZONO.
- Z4c dowód liniowy zdarzeń militarnych: potwierdzony przez Evaluatora (r3), bez zmian.
- Z2 źródło 67 i numery linii: ŹRÓDŁO 67 ustalone (R_live pre-fix); różnica 67 vs 89 NIE_ZMIERZONO. Numery linii poprawione (25397 = lock ctx; pasek = 25605/25646; relacja = 25650; computeTickZaufanieDelta = diplomacy.ts:1779; buildDiplomacyTickCtxForPair = main.ts:23090-23129; buildDiplomacyLockContextBase = ok. 25377).
- Zakaz zmian w gra/src, WERSJE.md, JSON balansu, push: SPEŁNIONE.

## Pliki
- /home/user/The-Game/.claude/worktrees/wf_1c490fdf-223-3/dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1/30-obrona-claude.md
- /home/user/The-Game/.claude/worktrees/wf_1c490fdf-223-3/dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1/evidence/sim-respekt-wojna-r4.cjs
- /home/user/The-Game/.claude/worktrees/wf_1c490fdf-223-3/dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1/evidence/wynik-pomiaru-r4.txt

BLOKADY: brak live save (nie da się policzyć efektywnej mocy na jednym stanie → 67 vs 89 NIE_ZMIERZONO); flagi wspolnyWrog i religia w grze NIE_ZMIERZONO; F-1 wymaga ustalenia, która ścieżka tick daje panelowy wynik.
RUNDY: 3/5 (obrona na zarzuty r3 Evaluatora).
NASTĘPNY KROK: Evaluator r4 weryfikuje odpowiedzi 1-4 i F-1/F-2; decyzja właściciela ABC dla F-2 (A/B/C); F-1 jako osobny pomiar.
DEPLOY/PUSH: NIE WYKONANO
