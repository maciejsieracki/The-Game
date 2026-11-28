STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-STARVATION-DESIGN-Q42C (tag STARVEQ42C)
GOAL: inwentarz blokady końca tury z powodu żywności, opis dzisiejszego głodu, model/pomiar dla G1–G3 (głód zamiast blokady, Q42=C), trzy kandydaty z DECISION_REQUIRED. Bez zmian kodu gry.
ZMIANY-COMMIT: dyspozycje/analizy/GLOD-ZAMIAST-BLOKADY-2026-11-28.md (nowy dokument), gra/tools/starvation-model.cjs (nowy model, tylko odczyt), dyspozycje/autobot/runs/R-WEB-STARVATION-DESIGN-Q42C/model-output.txt, dyspozycje/autobot/runs/R-WEB-STARVATION-DESIGN-Q42C/10-operator-claude.md. Zero zmian gra/src i gra/data. SHA: patrz pole sha w wyniku (czubek commita).
TESTY:
- git merge-base --is-ancestor 42992edde origin/main: OK (baza = origin/main)
- npx tsc --noEmit (gra/, po npm ci --ignore-scripts): exit 0
- endgate-lever-baseline-test: 5 passed, 0 failed
- no-negative-stocks-end-turn-gate-levers-test: 34 passed, 0 failed
- end-turn-gate-projection-only-test: 49 passed, 0 failed
- glod-wojska-karencja-test: 40 pass, 0 fail
- army-hunger-combat-test: 13 pass, 0 fail
- population-civ-matrix-wiring-test: 122 passed, 0 failed
- no-negative-stocks-endturn-test: 19 passed, 0 failed
- end-turn-block-event-test: passed=36 failed=0
- node gra/tools/starvation-model.cjs: wynik w model-output.txt
- POMIAR ŻYWY (Chromium) NIE WYKONANO w tej rundzie: NIE ZMIERZONO dla G1–G3 na żywo; model z silnika + dane GRACE15FX r3 (dwa ziarna, t16)
BLOKADY: brak. Nie uruchamiano Chromium (czas/segmentacja). Nie zmierzono populacji miasta w t16 (potrzebna do G1), wielkości kary G3 (brak wzoru).
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator: pytanie ABC do właściciela o kształt głodu (G1/G2/G3) — redakcja pytania wg zasad ABC; po wyborze turniej C-018 i pomiar na żywo (maksimum) przed implementacją.
DEPLOY/PUSH: NIE WYKONANO
