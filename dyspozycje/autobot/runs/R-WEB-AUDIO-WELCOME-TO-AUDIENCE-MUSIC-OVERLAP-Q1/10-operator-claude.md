# R-WEB-AUDIO-WELCOME-TO-AUDIENCE-MUSIC-OVERLAP-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUDIO-WELCOME-TO-AUDIENCE-MUSIC-OVERLAP-Q1
GOAL: przejście ekran powitalny nowej cywilizacji -> audiencja ma dawać JEDNĄ muzykę naraz.
ZMIANY/COMMIT: baza df20918b3; zmienione: gra/src/audio/muzyka-antyczna.ts (startDiplomacyMusic), gra/src/ui/civWelcomeScreen.ts (close), nowy gra/tools/audio-welcome-audience-overlap-test.cjs, ten raport. Commit: patrz SHA w odpowiedzi.

PRZYCZYNA (zmierzona):
- civWelcomeScreen.ts close('audience') wołał stopDiplomacyMusic() PRZED onAudience. stopOverlay() wznawia muzykę gry (startMusic), a audiencja zaraz ją znowu wycisza; przywitanie cichnie 0,4 s (FilePlaylist.stop), nowa playlista startuje z fade-in 3 s obok niego.
- muzyka-antyczna.ts startDiplomacyMusic: przy aktywnej innej nakładce startOverlay tylko wyciszał ją przez stopMusic/stop bez kolejki.

POMIAR (Chromium headless, bundle Vite poza repo; liczba grających <audio>):
- PRZED: przywitanie grecy -> audiencja rzymianie: 3 grające w +0..300 ms (przywitanie + muzyka gry + nowa); ta sama cywilizacja: 2 w +0..300 ms (muzyka gry wraca obok przywitania) i przywitanie restartuje się od początku po przejściu.
- PO: max 1 w całym przejściu; po 4,5 s 1 utwór (audiencja). Ta sama cywilizacja: ta sama playlista gra dalej (t 1,4 s -> 5,9 s), bez dubla.

NAPRAWA:
- civWelcomeScreen.ts: przy 'audience' nie zatrzymujemy przywitania; audiencja przejmuje muzykę.
- startDiplomacyMusic: ta sama playlista już gra -> nic nie rób; inna nakładka -> przekazanie: poprzednia stop(), nowa startWithFadeIn dopiero w callbacku stop (bez powrotu muzyki gry). Brak zmian w musicPrefs, głośnościach, civ-music.json.

TESTY:
- nowy gra/tools/audio-welcome-audience-overlap-test.cjs (Chromium, realne moduły): 8 OK / 0 FAIL po poprawce; na kodzie sprzed poprawki: 6 OK / 2 FAIL (W1b max=3, W2a max=2). Mutacja zrobiona przez przywrócenie plików z df20918b3 i potem przywrócenie wersji poprawionej.
- tsc --noEmit: exit 0.
- logic-test 213/213; tech-tree 20/20; research 33/33; combat 6/6; unit-replace-full-cost 40/0.
- civ-welcome-screen-test 309 OK; civ-music-test 100/0; menu-music-delay 9/0; menu-game-music-transition 7/0; muzyka-braz-era-playlist 42/0; muzyka-era-cumulative 23/0; diplomacy-audience-close-flush 57/0.
- NIE ZMIERZONO: civ-music-live-test (wymaga pełnego bundle playtest, ~długi bieg); unit-replace/ai pozostałe; testy w prawdziwej grze przez ścieżkę wywołań z main.ts (harness woła moduły bezpośrednio, jak showFirstContactWelcome -> showCivWelcomeScreen; openDiplomacyAudience -> showDiplomacyAudience -> startDiplomacyMusic zastąpione przez onAudience -> startDiplomacyMusic w harnessie).

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator — ocena diffu i ponowne uruchomienie testu nowego w pełnym bundle (opcjonalnie civ-music-live-test).
UWAGI-DLA-ORKIESTRATORA: ścieżka „zamknięcie audiencji -> muzyka gry” w handoffie ma małe okno (klik zamknięcia w ciągu 0,4 s od przejścia); ponieważ stopOverlay wznawia muzykę gry od razu, teoretycznie na ułamek sekundy mogą zagrać oba. Zostawiono świadomie (kosmetyka, nie jest częścią zgłoszenia).
DEPLOY/PUSH: NIE WYKONANO
