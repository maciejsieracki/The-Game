# R-WEB-AUDIO-WELCOME-TO-AUDIENCE-MUSIC-OVERLAP-Q1 — Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUDIO-WELCOME-TO-AUDIENCE-MUSIC-OVERLAP-Q1
GOAL: przejscie ekran powitalny nowej cywilizacji -> audiencja daje JEDNA muzyke naraz.
ZMIANY/COMMIT: kandydat 137b3f1f77a7e6ec18c6c649e8374f5be3a2236f; `git merge-base --is-ancestor df20918b3 137b3f1f7` = tak. Diff 4 pliki (+263/-2): gra/src/audio/muzyka-antyczna.ts (startDiplomacyMusic), gra/src/ui/civWelcomeScreen.ts (close), gra/tools/audio-welcome-audience-overlap-test.cjs (nowy), 10-operator-claude.md. Wszystko w allowliscie; brak zmian w gra/data, mp3, musicPrefs, main.ts.
ZARZUTY EVALUATORA: brak | obrona: brak.
OCENA KODU: przy 'audience' przywitanie nie jest zatrzymywane; startDiplomacyMusic: ta sama playlista -> no-op; inna -> prev.stop(cb), nowa startuje w callbacku, ochrona `overlayActive !== pl`. Zamkniecie audiencji w trakcie przekazania: stopOverlay(pl) + guard w callbacku -> brak dubla. showDiplomacyAudience zawsze startuje muzyke (bez wczesnych return), wiec przywitanie nie zostaje bez wlasciciela. Muzyka wylaczona: oba starty to no-op jak dotad.
TESTY (wlasne, surowe wyjscie):
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- nowy audio-welcome-audience-overlap-test: 8 OK / 0 FAIL (Chromium)
- mutacja (zrodla przywrocone z df20918b3): 6 OK / 2 FAIL (W1b max=3, W2a max=2); potem przywrocono kandydata, git status czysty
- civ-welcome-screen 309 OK; civ-music 100/0; menu-music-delay 9/0; menu-game-music-transition 7/0; diplomacy-audience-close-flush 57/0; muzyka-era-cumulative 23/0
- NIE ZMIERZONO: civ-music-live-test, muzyka-braz-era-playlist (nie uruchomiono u mnie), pelna gra przez main.ts (harness wola moduly bezposrednio).
BLOKADY: brak
UWAGI-DLA-ORKIESTRATORA: (ODDAL) okno ~0,4 s: zamkniecie audiencji w trakcie przekazania moze krotko wznowic muzyke gry obok gasnacego utworu — kosmetyka poza zgloszeniem.
RUNDY: FC po rundzie 1/5
NASTEPNY KROK: integracja orkiestratora (allowlist-only) -> READY_FOR_DEPLOY po jego bramkach
DEPLOY/PUSH: NIE WYKONANO
