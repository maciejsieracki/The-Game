STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-AI-TREATIES-E1-EVALUATE-PURE-Q1
GOAL: czysta, niewpięta funkcja evaluateTreatyOffer (NAP 15 tur, sojusz def./pełny, przemarsz; wasal = unsupported) + testy, bez zmiany zachowania gry.
ZMIANY/COMMIT: kandydat 5eb8cfd220b993b656ff574c05afb89a36705b80 (potomek bazy a62b09b3c: potwierdzone merge-base --is-ancestor). Diff vs baza = 5 NOWYCH plików: gra/src/game/ai-ai-treaty-evaluate.ts, gra/data/ai-ai-treaty-params.json, gra/tools/ai-ai-treaty-evaluate-test.cjs, 10-operator-claude.md, 30-obrona-claude.md. Zero zmian w diplomacy.ts/ai.ts/main.ts. Allowlista zachowana. git diff --check czysty. Moduł nie importuje main/DOM; brak Math.random/Date w kodzie (grep).
TESTY (surowe wyjście, kandydat 5eb8cfd22): tsc --noEmit exit 0; ai-ai-treaty-evaluate-test 21 pass / 0 fail, mutanty niewykryte 0 (M3-M6 KILLED widoczne); logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6. Bramki zielone => porównanie baza vs kandydat zbędne. Istniejące testy diplo nie uruchamiane osobno: NIE ZMIERZONO (nie zmieniono żadnego pliku src istniejącego kodu, więc wynik nie może się zmienić).
ZARZUTY:
 1 (D bez rabatu relacji): ODDAL. effectiveTreatyPnRequired (diplomacy-pn-engine.ts:203) dotyczy tylko gracza-płatnika, partner AI zawsze na bazie; w AI↔AI obaj są AI.
 2 (PW vs PN złotem 1:1): ODDAL jako założenie zgodne z P-3 A (D płacone złotem, jak diplomacy-proposals.ts porównuje PN z D wprost). Do wpisania jako ZAŁOŻENIE w dokumentacji E2.
 3 (progi NAP 110/30 vs prog_relacja=50; gotowość 0,54 vs 0,6): DO DECYZJI/E2, nie defekt E1. Moduł czyta progNapRelacja=110 i progSojuszWillingnessMin=0,54 z diplomacy.json (spójnie ze ścieżką gracza i ai.ts). Rozjazd leży w ai.ts PROG_SOJUSZ=0,6 i martwym prog_relacja=50 dla nap.
 4 (kary przy zawarciu / SHA): ODDAL, naprawione w 083ed8b69 (breachRelationDelta/breachTrustDelta; SHA jawny w raporcie obrony).
 Żaden zarzut = NAPRAW.
BLOKADY: brak.
RUNDY: FC 1/5.
UWAGI-DLA-ORKIESTRATORA: (a) origin/main poszedł naprzód (f9106085) względem bazy a62b09b3; zmiany w main nie nakładają się na pliki kandydata (main.ts, 2 testy, WERSJE/robocza) — merge czysty, ale integrator ma sprawdzić tsc po merge. (b) Przed E2: wyrównać ai.ts PROG_SOJUSZ 0,6 do 0,54 i usunąć martwe prog_relacja=50 dla nap; E2 nie może traktować breach*Delta jako skutku zawarcia; sąsiedztwo (sharesBorder) i willingness dostarcza wołający. (c) Sprzątanie: gra/node_modules w tym worktree.
NASTĘPNY KROK: integracja orkiestratora (integration_sha = 5eb8cfd220b993b656ff574c05afb89a36705b80), potem E2.
DEPLOY/PUSH: NIE WYKONANO
