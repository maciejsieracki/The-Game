STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-7-NEW-MODELS-SPEC-Q1
GOAL: Final Control specyfikacji `dyspozycje/rust-port/p4/P4-7-NEW-MODELS-SPEC.md` po Evaluatorze r1 (FAIL, zarzuty E1–E12) i Obronie r2 (`63c40a87`) wobec binarnego kryterium dispatchu.
ROLA/MODEL: Final Control, Opus 5.5 medium (R-PROC-AUTOBOT §5a, temat graficzny).

ZMIANY/COMMIT:
- Recenzowane: `1a2e47de54e1244524deaf8804f719a3be0b616b` (Operator r1, rodzic `da03ce40`) → `63c40a8789846ff914eaea77f8700ff0b427572c` (Obrona r2, rodzic `1a2e47de`). Commit Obrony istnieje — nie odtwarzano.
- Final Control: wyłącznie ten plik (`03-final-control.md`), commit na `63c40a87`.
- Do integracji, w tej kolejności: `1a2e47de` → `63c40a87` → commit tego raportu. Cel: `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (tip `c8ccf04f`). `git diff --name-only da03ce40 c8ccf04f` na plikach tematu → pusto; `git merge-tree --write-tree c8ccf04f 63c40a87` → czysto (`669b68d1`).

TESTY (samodzielnie, Final Control):
- `run_measure.py` @ `63c40a87` → EXIT=0, `budzet_kart.py` → EXIT=0; `git status` po obu → czysto (wyniki bitowo identyczne z commitem).
- `git diff --check da03ce40 63c40a87` → czysto; `git diff --name-only` → tylko allowlista (spec + `runs/<ID>/**`).
- Zweryfikowane samodzielnie (15): `civs.json` epokaWejscia 8/6/1 i 15 `ikonaId` (→ 8+14+15 = 37 kombinacji); `tech.json` Epoka 12/12/8; `units.json` 75/75/75 unikalnych; `parkowane_epoka4plus` epokaDocelowa 4/5/6/4/**1**, `kopiec_grobowy.nazwaAlt` = Monks Mound, wszystkie `aktywne: false`; budżety ⌈187,33·1,1⌉=207, ⌈988·1,1⌉=1087, mur ⌈334·1,1⌉=368, cuda 320/25; `miasto-kamien.ts:73-74` (E12); `bronzeCity.ts:30-31,34`; `wonderModels.ts:216-230` ziggurat 4 stopnie 0,48/0,38/0,28/0,18; `mayanPyramid` 2 stopnie + świątynia; `bronzeCityRoblox.ts:407-408` hutCount/spread; `main.ts:26996,27000,27021,27154`; `testBattle.ts:358-372`; `battleScene.ts:4197,4365` (`?? bu.nazwa`); `miasto-braz.ts:866-873`; `P4-4-MODEL-CATALOG.md:570` (units.ts 4/6/7); `LEDGER.md:128` (D-MOD-1 rozstrzygnięte, D-MOD-2 otwarte); `P4-3:411` (RR-T11 przed RR-T7); `measure.txt` Kamień L10 per wierzchołek 0,420 / AABB 0,460, aschaffenburg 0,549; B-AF L1 15/194 (ręcznie: wspólne 4/50 + v1 11/144).

ORZECZENIA:
- E1 ODDAL — §1.6 + wiersz „Wzorzec w webie” w każdej karcie, pomiar ghost L1–L10, wariant B′, D-NM-16.
- E2 ODDAL — `budzet_kart.py` EXIT=0, tabela §3.5; B-AF/B-AN/Z-GR/Z-RZ poprawione.
- E3 ODDAL — reguła liczby stopni §3.0; B-ME 1 stopień, Z-ME bez zigguratu.
- E4 ODDAL — §4.1b + D-NM-17 (D-MOD-1 rozstrzygnięte wg LEDGER:128, D-MOD-2 otwarte).
- E5 ODDAL — §4.1 wraca do MOD-04 zgodnie z P4.4:570; alternatywa D-NM-18.
- E6 ODDAL — źródło `UnitTypeId` = `RuntimeUnit.typeId` (dowody zweryfikowane), pole `unit_type`, allowlista MOD-14/RR-T10, test.
- E7 ODDAL — testy w allowlistach, dispatch cudów w NM-09, nowa tabela zamiast zmiany `ikonaIdToBronzeCiv`, rejestr z zaślepkami, wycofany zapis o orkiestratorze.
- E8 ODDAL — RR-T2/RR-T11 w „Zależy od”, §5.3, R8.
- E9 ODDAL — metryki per wierzchołek zdefiniowane i zmierzone.
- E10 ODDAL — metoda oceny cudów K1/K2/K3, 12 zrzutów + 2 plansze, kto ocenia.
- E11 ODDAL — karta kurhanu, karta Z-SL, korekta D-NM-6.
- E12 ODDAL — `:73-74` zweryfikowane.
Agregat: 0 × NAPRAW, 0 × DO DECYZJI → PASS. D-NM-1..19 celowo dla właściciela, nie czynią tematu DECISION_REQUIRED.

BLOKADY: brak. Uwagi nieblokujące (do dispatchy paczek NM, bez nowej rundy):
1. §5.2 NM-00: „18 zaślepek delegujących do Grecji (stan = web)” — dla `z_rz` stan webu to Rzym Brązu, nie Grecja. Dispatch NM-00 ma wymagać zaślepki = bieżący model webu (z_rz → Rzym, reszta → Grecja).
2. §7 pkt 4 zawiera nieaktualne „przydział do MOD-06 według kultury” (sprzeczne z §4.1 = MOD-04); numeracja §7 nie po kolei (1–6, 9, 10, 7, 8).
3. Z-IN v2 (kwadratowa cytadela z 4 wieżami narożnymi) przypomina sylwetkę `dur_sharrukin` — sprawdzić na planszy K2.

RUNDY: 2/5 (Operator r1 → Evaluator FAIL → Obrona r2 → Final Control PASS)
NASTĘPNY KROK: integracja orkiestratora (`1a2e47de` → `63c40a87` → commit FC) na `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, wpis LEDGER; potem pytania D-NM-1..19 do właściciela.
DEPLOY/PUSH: NIE WYKONANO
