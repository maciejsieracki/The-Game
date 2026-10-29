STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q5
GOAL: MOD-14 część 5 (picking i kamera), wywołanie „pomiary” odtworzone w obronie po INFRA: mutacje, bramy 1.87.0/stable, niezależny weryfikator, §49–§50 dokumentu P4-36, commit.

ZMIANY/COMMIT: ten commit na `62efd0f6` (kod `7f68dd50`), świeży worktree `wf_c65e3ba9-998-4`, jawne `git add`. Salvage z `wf_c65e3ba9-998-2` zastosowany wg jego `APPLY.md`:
- `tests/fixtures/battle3d/{gen_picking.ts,picking.json,mutate_picking.py,README.md,MANIFEST.sha256}`, `tests/battle3d_picking.rs` (+2 testy `extra_*`);
- P4-36 §49 (pomiary z drzewa utraconego) + §50 (ponowny pomiar tego drzewa), 0 linii usuniętych;
- `dowody/`: `gates-obrona-r1.txt`, `mutate-picking-obrona-r1.txt` (pomiar TEGO drzewa), `gates-pomiary-r1.txt`, `mutate-picking-pomiary-r1.txt`, `verify-gen-pomiary-r1.txt` (surowe logi drzewa utraconego, oznaczone).
`git diff 7f68dd50 -- rust-port/renderer/src` pusty. Poza allowlistą: 0.

TESTY (na tym drzewie, `dowody/gates-obrona-r1.txt`, `mutate-picking-obrona-r1.txt`):
- fmt stable EXIT=0 (1.87.0: brak `rustfmt`, jak Q2–Q4);
- clippy `--all-targets [--features gpu] -D warnings` EXIT=0 ×4 (1.87.0, 1.97.0);
- test `--all-targets`: 431 passed, 0 failed, 55 binariów, EXIT=0 na obu; `battle3d_picking` 8 passed;
- mutacje 1.87.0, 6 partii EXIT=0: 61/61 KILLED + 1 EQUIV;
- MANIFEST 24/24; fixtury 11 980 819 B, max 7 228 812 B;
- regeneracja w nowym `mktemp -d` z `git archive edb8fb56` → `picking.json` `454daef2…`, `cmp` identyczny.

ODPOWIEDZI NA ZARZUTY:
1. Brak artefaktu: PRZYJMUJĘ. Commit odtworzony (SHA w raporcie końcowym tego wywołania).
2. Liczby niezweryfikowane: PRZYJMUJĘ. Zmierzone ponownie na zacommitowanym drzewie (wyżej). Liczby z §49 są oznaczone jako dotyczące drzewa utraconego.
3. Brak wejścia do kolejnej bramki: PRZYJMUJĘ. Salvage zastosowany, bramy powtórzone, commit jest.
4. Mutant równoważny i „view/picking bez zmian”: ODRZUCAM z dowodem.
   - Web `battleScene.ts@edb8fb56:14390`: martwy zapis. `:14409` wywołuje `_refreshDeploySelectionVisuals` (`:14967`), które na `:14978-14980` bezwarunkowo nadpisuje `_deploySelected`. Nikt go nie czyta pomiędzy.
   - Rust: `picking.rs:1072-1073`, potem `refresh_visuals`, potem `:1116`.
   - Pusty diff `src` względem `7f68dd50`, więc port 1:1 części 5 jest ten z commita impl.
5. Sprzątanie: PRZYJMUJĘ.
   - `wf_c65e3ba9-998-2-187` usunięty.
   - `-1.87.0` i `-stable` przemianowane na `wf_c65e3ba9-998-4-*` (cache zależności) i usunięte po bramach.
   - Scratch Q5 usunięty po commicie.

BLOKADY: brak. NIE_ZMIERZONO: ocena wzrokowa (§46), wpływ dryfu weba po pinie (§47), przyczyna +1 B fixtur względem drzewa utraconego.
RUNDY: 1/5 (INFRA, merytorycznie niezużyta)
NASTĘPNY KROK: Evaluator → Final Control → integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
