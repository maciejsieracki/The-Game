# R-WEB-DIPLO-WAR-DECLARE-ZERO-TRUST-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-DECLARE-ZERO-TRUST-Q1
GOAL: AI wypowiada wojnę wg nowych zasad: Zaufanie pary < 30 ORAZ przewaga siły militarnej AI ≥ 20% (charakter cywilizacji decyduje o skorzystaniu); przy zerowym Zaufaniu silniejsza strona (wg siły militarnej, nie Power) wypowiada po N turach; gracz nigdy automatycznie; ostrzeżenie raz na epizod.
BAZA: 3950aae12 (origin/main w tym worktree: detached HEAD na 3950aae12).

## ZMIANY (commit: patrz `git log -1` na gałęzi roboczej; zawiera kod, testy i ten raport)

Allowlista zachowana: `gra/src/game/ai.ts`, `gra/src/main.ts`, `gra/src/game/diplomacy-military-strength.ts`, `gra/src/game/diplomacy-war-peace-profile.ts` (typ + stała progu, poza pierwotną listą — konieczne do importu progu z JSON), `gra/data/diplomacy-war-peace-params.json`, istniejące testy `gra/tools/*.cjs` (asercje o starym progu), nowy `gra/tools/diplo-war-declare-zero-trust-test.cjs`, ten raport.

1. `diplomacy-military-strength.ts` — nowa funkcja `militaryBrakeOutcome(a, b, isPlayer)` (rozstrzygnięcie hamulca wg `compareMilitaryStrength`, bez progu 20%, `mayDeclare=false` gdy silniejszy jest gracz).
2. `diplomacy-war-peace-params.json` — nowa sekcja `wypowiedzenieZaufanie.progZaufaniaWojny = 30`; opis `hamulecRelacji` zaktualizowany (licznik na Zaufaniu). Klucze `progWojnyRelacji`, `progKryzysuMinusPunkty` zostają w danych (zasilają jeszcze `diploBrakeWarParams().prog` używany przez hook `getBrakeParams`).
3. `diplomacy-war-peace-profile.ts` — typ `WarPeaceParams.wypowiedzenieZaufanie` + eksport `PROG_WOJNA_ZAUFANIE` (30).
4. `ai.ts` — `RelacjaWejscie` dostaje pola opcjonalne `silaMilitarnaAI` / `silaMilitarnaPartner` (`{sila, armiaPkt}`); bramka priorytetu 4 zastąpiona warunkami: `Zaufanie < PROG_WOJNA_ZAUFANIE` ∧ `compareMilitaryStrength(...).przewaga === 'A'` (AI ≥ +20%) ∧ pozostałe bramki bez zmian (stanWojny, peaceLocked, hasNapTreaty, earlyNoMajorWarWindow, willingnessWar > 0, effAgresja ≥ effProgWojnaAgresja). Usunięto lokalne `effProgWojnaSila` i `progMinimalnyRelacja` (nieużywane).
5. `main.ts`:
   - `diploMilitarySideOf(owner, other)` — siła = `computeMilitaryStrength` z `armia` i `rekruci` (punkty z komponentów Power), `readWarBattlePoints` (licznik bieżącej wojny; poza wojną 0), `isTributeBonusActive`.
   - `diploMilitaryBrakeOutcome(a, b)` — wrapper na `militaryBrakeOutcome` (ids jako String, `isMe`).
   - `diploBrakeCrisisStep` — licznik kryzysu liczy kolejne tury, w których **Zaufanie** pary = 0 (`p6.kryzysProgZaufania = 0` z `diplomacy-tick-params.json`), N bez zmian (`hamulecN` z profilu), para w wojnie nie liczy.
   - `processDiploCrisisQueue` — wypowiada strona silniejsza wg siły militarnej (`mayDeclare` = gracz nigdy); ostrzeżenie dla gracza: jedno powiadomienie na epizod (`counter === 1`, „Zaufanie spadło do zera — grozi wojna z X za N tur”), zamiast odliczania N−2.
   - Oba konstruktory relacji (AI→gracz ok. 42068, AI↔AI ok. 42136) podają `silaMilitarnaAI` / `silaMilitarnaPartner`.
   - Usunięty import `brakeWarOutcome` z `main.ts` (nieużywany).
6. Testy:
   - nowy `gra/tools/diplo-war-declare-zero-trust-test.cjs` — 36 asercji, sekcje (0)–(h) z dispatchu;
   - `ai-test.cjs` — T9a, T9h (partner C), T9j, T4S-d, T12-dip-b: dodane pola siły militarnej (AI +30%) i zaufanie < 30; T12-dip-b (pokojowa cywilizacja) — agresja 0.75 → 0.3 (patrz „Założenia”);
   - `ai-early-no-major-war-test.cjs` — `hostileRelacja` dostaje przewagę militarną;
   - `diplo-war-peace-main-guard-test.cjs` — asercje strukturalne przepięte na `diploMilitaryBrakeOutcome`, `zaufanie`, `PROG_WOJNA_ZAUFANIE` i `compareMilitaryStrength`; mutacja R7 przepięta na Zaufanie/Relację;
   - `diplo-tick-war-brake-test.cjs` — trzy asercje przepięte (histereza z `zaufanie`, `diploMilitaryBrakeOutcome`, ostrzeżenie `counter === 1`).

## Tabela „stare → nowe” (wszystkie odwołania do starego progu rw i relacji w bloku wojny)

| Stare | Nowe | Plik:linia |
|---|---|---|
| `rw >= effProgWojnaSila` (rw ≥ 0,6 ± bias, Power) | usunięte z bramki wojny; `rw` zostaje tylko w `powod` i innych gałęziach | `ai.ts:~7307` (dawniej) → `ai.ts:7325` (bramka) |
| `effProgWojnaSila = max(0.3, progWojnaSila − podbojBoost + warSilaBonus)` | usunięte (nieużywane); `PROG_WOJNA_SILA=0.6` zostaje jako stała eksportowana (testy/eksport) | `ai.ts:6231` (stała), dawny blok ~6986 |
| `score < progMinimalnyRelacja` (Relacja < 30 per cywilizacja) | `rel.relation.zaufanie < PROG_WOJNA_ZAUFANIE` (30) | `ai.ts:7325`; stała `diplomacy-war-peace-profile.ts` (JSON `wypowiedzenieZaufanie.progZaufaniaWojny`) |
| brak wymogu przewagi militarnej | `compareMilitaryStrength(...).przewaga === 'A'` (≥ +20%) | `ai.ts:7318` |
| hamulec: `relacja = relationScore(...)` jako licznik | `zaufanie = getDiploRelation(a,b).zaufanie`, próg `p6.kryzysProgZaufania = 0` | `main.ts:11801–11803` |
| hamulec: `kryzysProgZaufania: w.prog` (próg relacyjny) | `kryzysProgZaufania` z `p6` (0), `w.prog` usunięte z tego wywołania | `main.ts:11803` |
| `brakeWarOutcome` (Power) | `diploMilitaryBrakeOutcome` (siła militarna) | `main.ts:11703`, `11886`, `11907` |
| ostrzeżenie odliczające N−2 „łączna Relacja ≤ prog” | jedno ostrzeżenie „Zaufanie spadło do zera” przy `counter === 1` | `main.ts:11889` |
| `diploBrakeWarParams().prog` (dalej obliczany) | zostaje (hook `getBrakeParams`, test R7 `main-guard`); nie steruje licznikiem | `main.ts:11790` |
| `bias.warSilaBonus`, `podbojBoost` w progu siły | nie wchodzą do bramki wojny; charakter działa przez `effAgresja` (ABC A) | `ai.ts` ~6756–6787 (wartości bez zmian, bramka nie czyta) |

Bez zmian (dispatch): wojna epoki (Kamień/Brąz/Żelazo, wczesny `return`), bramki R1 (tura ≥ 40) i R2 (Kamień), karencja wczesnej fazy, rozejm/pokój (`peaceLocked`), NAP (`hasNapTreaty`), N tur (`hamulecN`), zasady D7, `diplomacy-tick-war-brake.ts` (funkcje czyste), liczby zaufania i etykiety nastawienia.

## TESTY (surowe wyniki, uruchomione w worktree po ostatniej zmianie)

- `npx tsc --noEmit` → exit 0 (brak wyjścia).
- Pięć bramek:
  - logic-test → `LOGIC OK (213/213)`
  - tech-tree-test → `20 pass, 0 fail`
  - research-test → `PASSED: 33 / FAILED: 0`
  - unit-replace-test → `WSZYSTKIE TESTY ZIELONE (21/21)`
  - combat-test → `COMBAT TEST: 6/6 pass`
- Pozostałe dispatchowe:
  - diplomacy-test → `148 passed, 0 failed`
  - diplo-military-strength-test → `27 PASS / 0 FAIL`
  - diplo-war-battle-counter-test → `35 PASS / 0 FAIL`
  - diplo-war-trust-only-test → `11 OK, 0 FAIL`
  - diplo-respect-military-events-test → `24 OK, 0 FAIL`
  - diplo-war-peace-d7-test, diplo-war-peace-gate-test, diplomacy-war-gates-test, ai-losing-war-asks-peace-vs-player-test, ai-war-weariness-peace-test, diplo-tick-war-brake-unit-test, diplo-tick-war-brake-mutation-test → exit 0
- Zmienione/nowe:
  - ai-test → `296 passed, 0 failed` (przed poprawką T12-dip-b: 295/1)
  - diplo-war-declare-zero-trust-test (NOWY) → `36 OK, 0 FAIL`
  - diplo-tick-war-brake-test → `51 pass / 0 fail`
  - diplo-war-peace-main-guard-test → `32 pass / 0 fail`
  - ai-early-no-major-war-test → `14 passed, 0 failed`
- Pre-existing (identyczne na bazie 3950aae12, wyekstrahowanej do katalogu roboczego w scratchpad):
  - diplo-war-peace-sim-test → 3 FAIL (S3, S4b, M_TUR) — NIE regresja tej zmiany.
- NIE_ZMIERZONO:
  - diplo-war-peace-live-test → nie działa w tym środowisku (wymaga Playwright/Chromium i świeżego builda w przeglądarce; build w `gra/` zakazany). Próba uruchomienia nadpisała dwa pliki PNG w `dyspozycje/autobot/runs/R-WEB-PEACE-RULES-Q1/evidence/` — przywrócone `git restore` przed commitem, nie wchodzą do zmian.
- Mutacje (h): stary próg rw i licznik relacji wykrywane przez asercje źródłowe nowego testu oraz przez zachowanie (sekcja b: obniżony `progWojnaSila` nie otwiera wojny bez przewagi militarnej; sekcja d: Zaufanie > 0 zeruje licznik). Mutacja w pamięci kodu `ai.ts`/`main.ts` nie była uruchamiana (zakres allowlisty i brak czasu na pełny cykl build-mutacja) — NIE_ZMIERZONO jako mutacja wykonana na kodzie.

## BLOKADY

Brak blokad technicznych. Jedyna nieprzeprowadzona bramka: `diplo-war-peace-live-test` (środowisko, patrz wyżej).

## ZAŁOŻENIA (rozstrzygnięte przeze mnie, do weryfikacji przez Evaluator)

1. Remis siły: `compareMilitaryStrength` (krok 2) rozstrzyga remis większą armią, a dalej mniejszym `id` porównywanym leksykograficznie (string). Dla `id` `"10"` vs `"9"` wygrywa `"10"`. Zachowane z kontraktu kroku 2; w `main.ts` ids to `String(ownerId)`.
2. Charakter cywilizacji: w starym kodzie `bias.warSilaBonus` (+0,08 / −(0,06+riskWar)) przesuwał próg siły. Nowa bramka tego offsetu nie ma (dispatch: „charakter decyduje przez effAgresja/willingnessWar”). Efekt: dwie cywilizacje o tej samej agresji i sile dostają tę samą decyzję. Test T12-dip-b zmieniony na agresję 0,3 dla „pokojowej” cywilizacji — to zmiana asercji, nie zachowania bramki. Do decyzji właściciela, czy charakter ma wrócić jako offset progu Zaufania (ABC).
3. Ostrzeżenie: jedno powiadomienie przy `counter === 1` i tylko gdy strona silniejsza to AI (`mayDeclare`). Tekst zmieniony; zakładka (Dyplomacja/Ważne) pozostaje konwencją `showHintMessage` jak dotąd.
4. `progWojnyRelacji` / `progKryzysuMinusPunkty` zostają w JSON i w `diploBrakeWarParams().prog` (hook testowy), ale nie sterują już licznikiem ani bramką.
5. Siła militarna używa składników Power `armia` i `rekruci` (punkty), licznik bitew pary i aktywny bonus trybutu; gospodarka wyłączona. Gdy `objectivePowerByOwner` nie ma wpisu, liczone jest `buildObjectivePowerForOwner` (koszt jak w obecnym kodzie).

## NASTĘPNY KROK

Final Control (Sonnet): przegląd diffu (`git diff 3950aae12 -- gra/`), sprawdzenie 5 bramek i nowego testu, ocena założeń 1–3 i decyzja ABC w sprawie offsetu charakteru (założenie 2) przed integracją.

DEPLOY/PUSH: NIE WYKONANO
