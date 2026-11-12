STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I-Q1 (K5i, runda 1/5, Evaluator)
GOAL: port _singleBlow (rdzen trafienia/obrazen/rozstrzygniecia) z wstrzyknietym RollSource i wektorami z wykonania pinu 07d2fbd72.
ZMIANY/COMMIT: oceniono e1e1b83de (kod 195e5ba79). Allowlista OK: diff 46c42deab..e1e1b83de dotyka tylko siege_tactics_blow.rs, mod.rs (+1 linia), tests/p6_siege_tactics_blow{.rs,_gen.mjs,_vectors/}, 01-operator-r1.md. Brak gra/, Cargo.toml, WERSJE.md. Brak #[ignore]/should_panic w nowym ttescie; istniejace testy nietkniete.
TESTY (odtworzone przeze mnie, CARGO_TARGET_DIR poza repo):
  cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --lib 49/49 EXIT 0;
  cargo test --test end/endcheck/breach/walk/blow: end 8, endcheck 9, breach 15, walk 7, blow 3 - EXIT 0 (jedno wczesniejsze uruchomienie zwrocilo 101 bez zapisanego logu; powtorzone 2x = EXIT 0; przyczyny NIE_ZMIERZONO, brak powtorzenia).
  Regeneracja wektorow (node 22.23.4): 626 przypadkow, plik vectors.json bez zmian wzgledem commita (git status czysty) - SHA-256 straznik 39bee8db... przechodzi.
  Porownanie z tekstem pinu (battleScene.ts 8885-9069, combat.ts 440-517): isCharge, chargeHitBonus, hitPct, rzut*100, pudlo (roll>=hit), ranged/melee raw, dmg=max(1,round(raw*kontra)), HP, extraMorale (flank 8/tyl 15/szarza 15), _resolveBlowOutcome (rout-przed-smiercia, zabicie, morale) zgodne 1:1. Pin nie ma galezi krytyku - zgodne z notatka Operatora.
  Mutacje: hit_bonus*0.5 oraz hit_max+0.5 wykryte (testy padaja) - wektory realnie wiaza hit_pct.
  Brak wlasnego RNG, brak wolajacych w Rust do W8 (modul zalezy tylko od data::units_combat).
ZARZUTY:
 1. (nota, nieblokujaca) Kryterium 1 "_singleBlow Ported" spelnione tylko CZESCIOWO: nie ma toCombatUnit i mnoznikow wejsc (pin 8809-8957), rangedDamageMultFor, ciala efektow sceny. Dispatch dopuszcza wejscia jawne, ale status w rejestrze ma byc "czesciowo" (rdzen ciosu), nie "Ported 1:1".
 2. (nota) Test nie porownuje z pinem pol hit_pct, roll, extra_morale ani outcome - generator ich nie zapisuje (tylko missed/isCharge/returned/defHpAfter/events). hit_pct i extra_morale sa weryfikowane posrednio (flip trafienia, ApplyMoraleDamage.extra). Zalecenie: dopisac hitPct (z log/zwrotu) do wektora w nastepnej rundzie.
 3. (nota) Efekt uboczny pinu `this.engaged.add(key)` (tylko wrecz) nie jest zwracany jako jawne wyjscie; wywolujacy musi sam go odtworzyc. Do uzupelnienia w klocku skladajacym cialo _singleBlow.
 4. (drobne) js_round = floor(x+0.5) rozni sie od Math.round dla x=0.49999999999999994 i |x|>2^52 (JS daje wynik dokladny). Wektory tego nie pokrywaja; praktycznie nieosiagalne przy obrazeniach gry.
 5. (drobne) Generator wykrywa pudlo po tekscie logu ('chybia') - kruche, ale deterministyczne na pinie; straznik SHA chroni przed dryfem.
BLOKADY: brak
RUNDY: 1/5 (werdykt Evaluatora: PASS-WITH-NOTES)
NASTEPNY KROK: Final Control na e1e1b83de; zarzuty 2-3 do klocka skladajacego cialo _singleBlow.
DEPLOY/PUSH: NIE WYKONANO
