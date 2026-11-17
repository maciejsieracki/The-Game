STATUS: BLOCK
DOMAIN: INFRA
TEMAT: R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING (T4e-0, r2, Evaluator)
GOAL: Adwersarialna weryfikacja wpiecia ProdBody (MoveTerrain, terrain, occ_by_key, move_step).
BAZA/COMMIT: a60791ba2 (rodzic 760be5187). Operator zmienil tylko raport + wip-r2-nieskompilowane.patch.
TESTY: NIE_ZMIERZONO. df -h / = 6.5G wolne (prog dispatchu 8 GB). Bramki fmt/clippy/test/--all-targets nie uruchomione (BLOCK INFRA wg dispatchu).

ZARZUTY:
1. KRYTYCZNY: brak kodu w drzewie. Commit zawiera wylacznie patch "nieskompilowany"; kryterium konca 1 (wektory zielone, mutacje FAIL, test end-to-end) niespelnione. Kod nie byl skompilowany ani razu.
2. INFRA: dysk 6.5G < 8 GB, Evaluator nie moze odtworzyc bramek (zrodlo: /tmp/claude-0 ok. 3.9G poza tematem). Wymaga sprzatania przez orkiestratora.
3. Mutacje a/b/c niewykonane; brak dowodu, ze testy je lapia.
4. Poza allowlista: edycja siege_tactics_move_effects.rs (trait MoveTerrain). Wprost z D1, ale dispatch zakazuje zmian tego pliku poza publicznym API; wymaga jawnej akceptacji orkiestratora.
5. Wektory wpisane recznie w test (8 #[test] w patchu), bez generatora p6_k5doc_t4e_gen.mjs i bez p6_k5doc_t4e_vectors/ - wymagane testy na wektorach pinu, nie reczne. Wartosci (10-2, clamp Infinity->99, brod /0.5) niezweryfikowane z pinem battleScene.ts _doMove (ok. 8685-8776).
6. update_facing w adapterze to no-op (#107): test kolejnosci occ/facing (mutacja c) opiera sie na rejestrze wywolan, nie na realnym facing; mutacja (c) moze byc nieskuteczna. Do sprawdzenia po kompilacji.
7. Brak wiringu AdvanceDecision::Move -> move_step: cel "tura pieszej jednostki wykonuje ruch" nieosiagniety; brak testu end-to-end sekwencji tury (D4 zaweza do T4e-0, ale kryterium 1 wymaga testu wiringu).
8. Koszt per jednostka (mounted): w patchu tylko cavalry_mult w trait, brak testu mounted vs foot.
9. W patchu brak #[ignore] (grep: 0). Oslabionych asercji nie oceniono (kod nieuruchomiony).

NASTEPNY KROK: orkiestrator zwalnia dysk do >= 8 GB; runda r3 tego samego ID: git apply patcha na 760be5187, bramki + mutacje, generator wektorow z pinu, test end-to-end.
DEPLOY/PUSH: NIE WYKONANO.
