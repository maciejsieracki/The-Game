# R-WEB-DIPLO-WAR-CHARACTER-THRESHOLD-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-CHARACTER-THRESHOLD-Q1
GOAL: Charakter cywilizacji przesuwa próg przewagi siły militarnej potrzebny do wypowiedzenia wojny przez AI: agresywna przy mniejszej przewadze, ostrożna przy większej. Baza 20% z JSON, przesunięcie z warSilaBonus (ten sam charakter), obcięte do [10%, 35%].
BAZA: 5a50a5958 (origin/main f0853a6cc), detached HEAD w worktree.

## 1. Odczyt dawnej semantyki (krok 1 dispatchu)

- Commit 3950aae12, gra/src/game/ai.ts, ok. l.6703–6777 (`DiplomacyCivBias`) i l.6988: `warSilaBonus` był dodawany do progu rw: `effProgWojnaSila = p.progWojnaSila - podbojBoost + bias.warSilaBonus`. Próg rw bazowo 0,6 (PROG_WOJNA_SILA), skala rw (udział siły 0..1), więc bonus przesuwał próg rw, a nie przewagę w %.
- Wartości (resolveDiplomacyCivBias, ai.ts l.6736–6790, ta sama w 646d95248 i 5a50a5958):
  - pokojowa (agresywnoscRaw ≤ 3 i pod ≤ 2): warSilaBonus = +0,08
  - agresywna (agresywnoscRaw ≥ 7 lub pod ≥ 4): warSilaBonus = −(0,06 + 0,04 jeśli tolerancjaRyzyka ≥ 7)
  - neutralna: 0
- Zakres: −0,10 … +0,08 (rw). Wartości z resolveDiplomacyCivBias, nie z ai-params.json ani z profilu cywilizacji.
- Stan obecny: warSilaBonus jest liczony w resolveDiplomacyCivBias, ale NIE jest używany w żadnej bramce (usunięto w 646d95248, dziś tylko definicja). Stąd przywracany jest jako nowy mechanizm, nie jako przywrócenie kodu.
- Cecha warAgresjaBonus nadal działa (progWojnaAgresja); nie zmieniałem jej.

## 2. Zmiany (commit w sekcji ZMIANY-COMMIT)

- gra/data/diplomacy-war-peace-params.json: nowa sekcja `przesuniecieProguWojnyCharakter` { wspolczynnikPpNaJednostke: 100, min: 10, max: 35 } z opisem po polsku. Wartości do akceptacji właściciela.
- gra/src/game/diplomacy-war-peace-profile.ts: `progPrzewagiWypowiedzeniaWojnyProc(bazaProc, warSilaBonus, params)` = clamp(baza + 100 × warSilaBonus, 10, 35). NaN → baza.
- gra/src/game/ai.ts (blok priorytetu 4, wypowiedz_wojne): próg = progPrzewagiWypowiedzeniaWojnyProc(DEFAULT_MILITARY_STRENGTH_PARAMS.progPrzewagiProc, bias.warSilaBonus); compareMilitaryStrength dostaje params z nadpisanym progPrzewagiProc. Tekst powodu używa efektywnego progu. Zaufanie < 30, gotowość AI, effAgresja, karencja, pakt, pokój i okno wczesnej fazy bez zmian.
- gra/tools/diplo-war-character-threshold-test.cjs (NOWY): 22 asercje.
- gra/tools/diplo-war-declare-zero-trust-test.cjs: jedna asercja źródłowa (l.211) zaktualizowana do nowego wywołania compareMilitaryStrength z progPrzewagiProc: progPrzewagiWojnyProc. To asercja o progu wypowiedzenia wojny, więc mieści się w allowliście.
- NIE zmieniono: progPrzewagiProc w diplomacy-military-strength-params.json (dalej 20, używany przez rozejm, pokój i hamulec main.ts), blok pokoju i rozejmu w ai.ts i diplomacy-proposals.ts, main.ts, WERSJE.md, gra/, rust-port/.

## 3. Tabela: charakter → przesunięcie → efektywny próg (do zatwierdzenia przez właściciela)

Liczone z resolveDiplomacyCivBias i wzoru JSON (współczynnik 100 pp na 1,0 warSilaBonus). Tabela opisuje archetypy, nie 15 konkretnych cywilizacji z civ-ai.json (NIE_ZMIERZONO per cywilizacja: nie wyliczałem każdej, bo wartość zależy tylko od agresywnoscRaw, ai_sklonnosc_podboju i tolerancjaRyzyka).

| Archetyp (warunek) | warSilaBonus | Przesunięcie (pp) | Efektywny próg przewagi |
|---|---|---|---|
| Pokojowa (agresywnosc ≤ 3, pod ≤ 2) | +0,08 | +8 | **28%** |
| Neutralna | 0 | 0 | **20%** (baza) |
| Agresywna (agresywnosc ≥ 7 lub pod ≥ 4), tolerancja < 7 | −0,06 | −6 | **14%** |
| Agresywna, tolerancja ≥ 7 | −0,10 | −10 | **10%** (dolna granica klamry) |

Uwaga do wartości z dispatchu (agresywna 15%, ostrożna 30%): przy jednym współczynniku liniowym wynikającym z dawnych bonusów nie da się uzyskać dokładnie 15/20/30 (dawne bonusy są asymetryczne: −0,06 vs +0,08). Przyjąłem współczynnik 100 (1 pp na 0,01 bonusu). Dla 15/30 trzeba by dwóch współczynników lub innej skali; to decyzja właściciela.

## 4. Testy (wyniki z surowego wyjścia)

- `npx tsc --noEmit` → exit 0 (bez błędów).
- `node tools/logic-test.cjs` → LOGIC OK (213/213)
- `node tools/tech-tree-test.cjs` → tech-tree-test: 20 pass, 0 fail
- `node tools/research-test.cjs` → ALL GREEN
- `node tools/unit-replace-test.cjs` → WSZYSTKIE TESTY ZIELONE (21/21)
- `node tools/combat-test.cjs` → All sanity checks passed.
- `node tools/ai-test.cjs` → ai-test: 297 passed, 0 failed (exit 0)
- `node tools/diplo-war-declare-zero-trust-test.cjs` → 43 OK, 0 FAIL (po aktualizacji asercji źródłowej; przed nią 42 OK, 1 FAIL na tej asercji)
- `node tools/diplo-war-peace-sim-test.cjs` → FAIL 2: S4b, M_TUR (dokładnie opisane w dispatchu jako dług). S3 przeszło (w dispatchu było w długu jako 3. FAIL). Nie sprawdzałem, czy S3 przechodzi też na bazie 5a50a5958; NIE_ZMIERZONO, czy zmiana jest skutkiem tego tematu.
- `node tools/diplo-peace-weaker-seeks-city-only-test.cjs` → 32 pass / 0 fail
- `node tools/diplo-peace-stance-wiring-test.cjs` → 10 pass / 0 fail
- `node tools/diplomacy-test.cjs` → 149 passed, 0 failed
- `node tools/diplo-war-character-threshold-test.cjs` → 22 OK, 0 FAIL
- Mutacja (ignorowanie przesunięcia, współczynnik = 0, przez plugin esbuild w teście, env MUTATE_SHIFT=1) → 16 OK, 6 FAIL. Czerwone asercje: próg agresywnej 14→20, ostrożnej 28→20, klamry, scenariusz 18% i 25%. Test zachowaniowy na decideAIDiplomacy, nie tylko regex.
- Nie uruchamiałem testów wizualnych ani live (tu nie dotyczy).
- `git diff --check` → czysto.

## 5. Ryzyka i uwagi

- Próg dla agresywnej AI przy przewadze 14–19% wypowiada wojnę wcześniej. Hamulec zerowego zaufania w main.ts (militaryBrakeOutcome) nadal używa 20%, bo nie ruszałem main.ts. Zgodnie z dispatchem: wojna przy zerowym zaufaniu „o włos" działa niezależnie od przesunięcia.
- Wartości 14/20/28 i zakres [10, 35] są propozycją. Właściciel może zmienić wspolczynnikPpNaJednostke i min/max w JSON bez zmiany kodu.
- Dawny bonus był na skali rw (próg 0,6), nowy na skali przewagi w %. Przeniesienie jest założeniem: ten sam charakter, nowa miara i nowy współczynnik.

## 6. Uwagi dla orkiestratora (poza zakresem, bez wykonywania)

- Test diplo-war-peace-sim: 2 FAIL na tym kandydacie (S4b, M_TUR), w długu tematu #352.

NASTĘPNY KROK: Evaluator (SONNET) → Obrona (HAIKU) → Final Control (SONNET); właściciel zatwierdza tabelę z sekcji 3 (wartości 14/20/28 i zakres 10–35) przed READY_FOR_DEPLOY.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
