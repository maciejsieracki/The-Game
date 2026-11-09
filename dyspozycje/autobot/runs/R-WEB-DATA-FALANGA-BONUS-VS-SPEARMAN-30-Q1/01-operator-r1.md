STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DATA-FALANGA-BONUS-VS-SPEARMAN-30-Q1
GOAL: Falanga (Grecja, Żelazo, Typ Falangite): Bonus vs Spearman % = 30; OBRONA = 12; PRZEBICIE = 4; ATAK = 7 (DODATEK 1 + DODATEK 2 wg dispatchu; wartości ATAK=7 i OBRONA=12 zgodne z poleceniem właściciela w relayu do orkiestratora, które wygrywa z treścią dispatchu).
BAZA: origin/main 12fa64c97 (FALA 576).
ZMIANY/COMMIT: gra/data/units.json (Falanga: Atak 6→7, Obrona 10→12, Przebicie 2→4, Bonus vs Spearman % 0→30, meleeAttack 5→7, meleeDefence 10→12, piercing 2→4, fieldPower 52.5→58.5; pole Uwagi NIE zmienione). gra/data/counters.json (nowy wiersz: Typ atakujący Falangite → Cel Spearman, Bonus +30%, Rodzaj Atak, Status potwierdzone). gra/tools/falanga-bonus-vs-spearman-test.cjs (nowy test). Commit SHA: podany w wiadomości orkiestratora po commicie.
TESTY: node tools/falanga-bonus-vs-spearman-test.cjs -> 15/15 PASS (exit 0). git diff --check -> czysto. tools/bundle-wiki-for-game.cjs -> brak zmian w git status (wikiBundle bez stałych Falangi).
NIE_ZMIERZONO: pełny zestaw gra/tools (combat-test, pole-bitwy-balance-check, units-data), typecheck i build nie uruchomione (brak node_modules w worktree, brak esbuild). Ranking Moc militarna nie przeliczony.
FORMUŁA fieldPower (gra/src/game/unit-power.ts, fieldPower): attack = meleeAttack + weaponDamage + piercing + chargeBonus/2 + missileAttack/2; defense = meleeDefence + armor + health/2; total = attack + defense. Falanga po zmianie: A = 7+4+4+3.5 = 18.5; O = 12+8+20 = 40; fieldPower = 58.5. Przed zmianą: 14.5 + 38 = 52.5, zgodnie z poprzednią wartością w pliku.
WPŁYW NA RANKING: fieldPower Falangi 52.5 -> 58.5 (+6,0). Dokument gra/tools/intrinsic-unit-power-field.md (historyczny) nie zaktualizowany; do osobnego tematu.
ZAŁOŻENIA: (1) Atak=7 -> meleeAttack=7; Obrona=12 -> meleeDefence=12; Przebicie=4 -> piercing=4 (wzorzec: Thorakites ma Atak 8 = meleeAttack 8 i Obrona 10 = meleeDefence 10). (2) Silnik NIE czyta pola „Bonus vs Spearman %” z units.json: counterMultiplier (gra/src/game/combat.ts) czyta wyłącznie gra/data/counters.json, a battleScene.ts attackerBonusVsType został usunięty. Bonus 30% zrealizowany jako wiersz counters.json, bo tylko on zmienia obrażenia w walce. Pole units.json ustawione zgodnie z dispatchem (dane i karta). (3) Uwagi Falangi („ZAŁOŻENIE: zastępuje Włócznik”) pozostawione bez zmian.
BLOKADY: brak. Opis Falangi nie cytuje liczb; wikiBundle nie zawiera tych statystyk. Tabele porównawcze poza allowlistą testów i danych nie zmieniane.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet), potem Final Control (Sonnet), z tym samym ID. Dług do rejestru REPIN Rust (units.json: Falanga Atak/Obrona/Przebicie/Bonus/fieldPower) wpisuje orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
