STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TEST-DEBT-BORDER-ERA-PENALTY-LIVE-ASSERT-Q1
GOAL: Test gra/tools/diplomacy-border-era-penalty-live-test.cjs ma mieć asercje kary granicznej zgodne z gra/data/diplomacy.json (−3/−4/−5 wg max epoki), bez osłabiania (zachowana równość ścisła), z wartościami wyprowadzanymi z JSON, a nie z twardych liczb.
ZMIANY-COMMIT: allowlista: gra/tools/diplomacy-border-era-penalty-live-test.cjs (zmiana) + runs/R-WEB-TEST-DEBT-BORDER-ERA-PENALTY-LIVE-ASSERT-Q1/10-operator-claude.md (raport). Baza: e8a731bc6 (origin/main). SHA commita: patrz pole sha w wyniku operatora.
  Zmiany w teście:
  - dodano require('../data/diplomacy.json').params oraz helper expectedBorderPenalty(maxEpoch) (progi jak diplomacy.ts sharedBorderPenaltyForEpochs: >=3 Żelazo, >=2 Brąz, inaczej Kamień);
  - l.88-89 (eras 2,3): −4 → expectedBorderPenalty(3) = −5 (rate i breakdownValue);
  - l.116-117 (po load, eras 2,3): −4 → expectedBorderPenalty(3) = −5;
  - l.126-129 (eras 2,2 oraz odwrotna kolejność): −3 → expectedBorderPenalty(2) = −4.
  Wartości z JSON (ekspansjaGranica*_zaufanie_perTura): −3 / −4 / −5. Skalowanie trudności nie dotyczy tych kluczy (scaleDiplomacyParamsForDifficulty działa tylko na progi bramek), więc wartości z JSON są właściwe także dla innych poziomów.
TESTY:
  - node --check gra/tools/diplomacy-border-era-penalty-live-test.cjs → SYNTAX_OK.
  - Wyprowadzenie z JSON (node -e): max1=-3, max2=-4, max3=-5.
  - Mutacja logiczna (node:assert/strict): assert.equal(-5, -4) rzuca błąd, czyli zmiana oczekiwanej wartości czerwieni asercję. Mutacja w żywym teście: NIE_ZMIERZONO.
  - Test live (playwright + serwer gry na 127.0.0.1:612): NIE_ZMIERZONO. Powód: brak gra/node_modules (playwright), brak działającego serwera na porcie 612; uruchomienie wymagało instalacji zależności i builda/dev serwera w gra/, a dispatch zakazuje npm run build/dev w gra/. Chromium jest dostępny (/usr/bin/chromium).
  - tsc 0 oraz 5 bramek referencyjnych: NIE_ZMIERZONO (zmieniony plik to .cjs poza tsc; bramki wymagają node_modules w gra/, których nie ma w worktree).
BLOKADY: brak uruchomienia live i bramek referencyjnych z powodu braku zależności i serwera gry w worktree (jak wyżej). Oczekiwane wartości potwierdzono względem kodu (diplomacy.ts:602-611) i JSON, nie względem pomiaru na żywo.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator: potwierdzić zgodność asercji z diplomacy.json i diplomacy.ts. Orkiestrator/FC: uruchomić test live w środowisku z node_modules i serwerem (GAME_URL, ok. 5 min) oraz wykonać mutację −5→−4 i potwierdzić czerwony wynik.
UWAGI-DLA-ORKIESTRATORA: brak. Nie zakładano żadnych sesji ani tasków.
DEPLOY/PUSH: NIE WYKONANO
