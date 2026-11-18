STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-LEGACY-FIELDS-REMOVE-Q1
GOAL: usunąć martwe pola zegara zmęczenia wojną (zmeczenie.maksUdzial/bazaTur/wagaAgresja/maksTur/bazaTurBrakDanych, profil zmeczenieT, warWearinessShare/Fraction, WAR_WEARINESS_MAX_SHARE) bez zmiany zachowania gry.
ZMIANY-COMMIT: commit operatora na gałęzi detach od a72c6b968 (SHA w polu sha odpowiedzi). Pliki: gra/data/diplomacy-war-peace-params.json, gra/src/game/diplomacy-war-peace-profile.ts, gra/src/game/diplomacy-peace-lock.ts (komentarz), gra/src/game/diplomacy.ts (komentarz), gra/tools/diplo-truce-impl-test.cjs, gra/tools/diplo-war-peace-profile-unit-test.cjs, gra/tools/diplo-war-peace-sim-test.cjs (eksport), ten raport.

DOWOD MARTWOSCI (git grep w gra/src, gra/data, gra/tools):
- zmeczenie.maksUdzial -> tylko WAR_WEARINESS_MAX_SHARE -> warWearinessShare (tylko testy). USUNIETE.
- zmeczenie.bazaTur, maksTur, wagaAgresja, bazaTurBrakDanych -> tylko zmeczenieT (pole profilu, czytane wylacznie przez testy). USUNIETE.
- zmeczenieT, warWearinessFraction/Share: brak wywolan w src poza modulem profilu. USUNIETE.
- zmeczenie.progSygnaluPokoju: ZOSTAJE (czytane przez aiPeaceSignals, profile.ts ok. l.311).
- Pozostale wagaAgresja (progPokojSlabosc, progKrytyczny, cenaPokoju) ZOSTAJA - zywe.
- war-weariness.ts: brak martwych odwolan, nie zmieniany.

ZMIANY W TESTACH (asercje martwych pol):
| test | asercje | powod |
| diplo-truce-impl-test | 3 (blok E, warWearinessFraction) + eksport | wartosc martwej funkcji; 94 -> 91 PASS |
| diplo-war-peace-profile-unit-test | 74 (zmeczenieT per cywilizacja i brak danych; blok R4/D4 warWearinessShare/Fraction) | martwe pola; 198 -> 124 PASS |
| diplo-war-peace-sim-test | eksport warWearinessFraction/Share | martwe nazwy |
Asercje absencji (main-guard, weariness-20-turns) zostawione bez zmian - nadal zielone.

TESTY (po zmianie; przed = po, chyba ze podano):
- tsc --noEmit: 0 (przed 0)
- logic-test 213/213 (przed 213/213); tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6
- diplo-war-peace-sim-test 25/0 (bez zmian, ten sam wynik)
- diplo-weariness-20-turns 31/0; main-guard 35/0
- diplo-forced-peace-pending-test 40/0; window-declutter 16/0; peace-tail-integration 42/0; peace-tail-proposal 9/0; weariness-forced-peace 14/0; weariness-forced-peace-wiring 13/0; treaties-ai-parity 80/0; treaties-power-parity 50/0 - bez zmian
- git diff --check: czysto
- JSON params parsuje sie poprawnie; jedyny czytelnik zmeczenie.progSygnaluPokoju zachowany
- Baza przed zmiana: diplo-forced-peace-pending-live-paths-test 2 FAIL (SETUP ERR_FILE_NOT_FOUND - brak zbudowanego fixture przegladarkowego). Niezwiazane, identyczne przed i po; nie zmieniane.
- NIE ZMIERZONO: mutacja kontrolna (przywrocenie usunietego pola) - nie wykonana.
- NIE ZMIERZONO: build vite i przegladarka (zmiana bez wplywu na UI).

BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet) - weryfikacja martwosci i asercji wg allowlisty.
UWAGI-DLA-ORKIESTRATORA: npm ci --ignore-scripts wykonane w gra/ worktree (node_modules gitignorowane). Dysk po instalacji ok. 8,9 GB wolne. Sciezka kopii: /home/user/The-Game/.claude/worktrees/wf_3c431a4a-db8-1.
DEPLOY/PUSH: NIE WYKONANO
