STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITY-MILITIA-REGEN-COOLDOWN-Q1
GOAL: Po calkowitym zniszczeniu Milicji miasto przez 5 tur jej nie wystawia, potem odnowa w pelnym skladzie (takze Pomin/Auto).
ZMIANY/COMMIT: Final Control: tylko ten raport. Kod: 4c8f4a2e7 (Operator) + 787b96595 (Obrona R2). Diff do origin/main db9433d62 = 10 plikow, wszystkie w allowliscie (brak gra-robocza, WERSJE.md, rust-port).
WERDYKT ZARZUTOW:
1. Krytyczny (auto: dystans nigdy nie ginie) - ODDAL (naprawione w 787b96595): militiaIdsDestroyedForCooldown (siegeDefenders.ts), wywolane w main.ts ~31497-31510; auto + wygrana atakujacego = cala Milicja zniszczona. Remis/wygrana obrony/reczna bitwa bez zmian.
2. Brak testu auto - ODDAL: test ma 53 asercje na prawdziwych collectCityDefRoster/applyLossPctToRoster/fallenMilitiaIds dla strat 0,7/0,97/1,0 + mutacja. Wywolanie calego applyMapBattleOutcome tylko regexem na zrodle (main.ts nie do zaladowania) - akceptowalne, nota.
3. Brak pomiaru - ODDAL (pomiar w tescie).
4. Odmiana tur/tury - ODDAL (naprawione). export-c.py OBL_MAP poza allowlista - NIE_ZMIERZONO, nota dla orkiestratora (dopisac klucz militia_regen_turns przy regeneracji combat-params.json). UI w Chromium NIE_ZMIERZONO.
TESTY (wlasny przebieg na 787b96595): city-militia-regen-cooldown 53 PASS/0 FAIL; tsc --noEmit 0 bledow; city-militia-no-defenders 113 OK; militia-garrison-contract 17 ok; militia-garrison-router-siege 8 ok; map-siege 6 ok; oblezenie 27; oblezenie-remis-endsiege 271; oblezenie-siege-lifted-po-bitwie 16; siege-ai 17; siege-defenders 12; garnizon-exit 26; hotseat-etap7-saveload 59; pre-battle-defender-retreat OK; retreat-garnizon-fortyfikacja 27 - wszystkie 0 fail. Nie powtorzono: 3 testy padajace identycznie na bazie (budynek-garnizon, pre-battle-save, wall-defenders-bonus-range) wg Operatora; Chromium/live; npm build/dev.
BLOKADY: brak. gra/node_modules usuniete.
RUNDY: 3/5 (Operator R1, Obrona R2, Final Control R3)
NASTEPNY KROK: integracja orkiestratora - cherry-pick/merge 4c8f4a2e7, 787b96595 i commita z tym raportem. Zmiany tylko w gra/ (web), brak kolizji z origin/rust-port/parity-v2; kolejnosc dowolna, niezalezna.
DEPLOY/PUSH: NIE WYKONANO
