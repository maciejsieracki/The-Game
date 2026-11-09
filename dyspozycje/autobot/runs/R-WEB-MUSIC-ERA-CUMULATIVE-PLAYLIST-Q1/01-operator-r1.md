STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-MUSIC-ERA-CUMULATIVE-PLAYLIST-Q1
GOAL: Muzyka tła kumulatywna po epokach: Kamień = kamień; Brąz = kamień + brąz; Żelazo = kamień + brąz + żelazo (katalog `utwory/zelazo/` opcjonalny, dołącza się sam). Awans epoki nie przerywa grającego utworu. Zmiana tylko w kodzie.
ZMIANY/COMMIT: patrz SHA w stopce (commit operatora, gałąź worktree-wf_ba170596-619-1, baza 60a18c60d).
- gra/src/audio/filePlayer.ts: `FilePlaylist.setTracks()/getTracks()` (podmiana puli na żywo: reszta tury przemapowana po URL, nowe utwory wstawiane w losowe miejsca reszty tury = shuffle zachowany, grający utwór dogrywa się nawet jeśli wypadł z puli); glob `utwory/zelazo/*.mp3`; `eraTierUrls(tier)` (dedupe), `eraMusicPlaylist` (jedna playlista, 3x pod rząd, crossfade 1,5 s — parametry BEZ zmian), `setEraMusicTier(tier)`. Usunięte eksporty `kamienPlaylist`/`brazPlaylist` (jedyny konsument: muzyka-antyczna.ts).
- gra/src/audio/muzyka-antyczna.ts: `tierNow` (1..3) obok `eraNow` (era syntezy 1|2); `activeFilePlaylist` zwraca `eraMusicPlaylist`; `setEra()` -> tier 1/2/3, zawsze synchronizuje pulę, plik->plik = brak stop/start; synteza tylko gdy cała pula pusta (przejścia plik<->synteza jak dotąd; respawn syntezy tylko gdy zmienia się era syntezy); `getMusicTier()`; `setMusicVolume` celuje w `eraMusicPlaylist`.
- Testy: zaktualizowany gra/tools/muzyka-braz-era-playlist-test.cjs (42 asercje, nie osłabione — oczekiwania "brąz zamiast kamienia" zamienione na "pula rośnie, zero stop/start"), gra/tools/muzyka-era-live-e2e-test.cjs (asercje ZERO pause()/ZERO nowych <audio> po setEra; mutacja = restart playlisty w gałęzi plik->plik), nowy gra/tools/muzyka-era-cumulative-test.cjs (realny kod filePlayer.ts po transpilacji, atrapy Audio/window/glob; pokrywa (a)-(e) z dispatchu + (f) nowe utwory w bieżącej turze + (g) zmiana tieru przed startem).
- Nie ruszono: mp3 w utwory/**, civ-music.json, audio-pack, WERSJE.md, gra-robocza/.
TESTY:
- tsc --noEmit: 0 błędów.
- logic-test: LOGIC OK 213/213.
- menu-game-music-transition-test: 7 passed, 0 failed; menu-music-delay-test: 9 passed, 0 failed; civ-music-test: 100 OK, 0 FAIL.
- audio-sidecar-test --dist (build vite do /tmp, poza repo): PASS.
- muzyka-braz-era-playlist-test: 42 pass, 0 fail. muzyka-era-cumulative-test: 23 pass, 0 fail.
- muzyka-era-live-e2e-test (realny Chromium, build do gra/dist-muzyka-era-live-e2e-test, sam sprzątany): 13 pass, 0 fail. Tryb mutacyjny (MUZYKA_ERA_MUTATE=1) NIE uruchomiony w tej rundzie: NIE_ZMIERZONO.
- Odsłuch/subiektywna ocena brzmienia: NIE_ZMIERZONO.
ZAŁOŻENIA: (1) nowe utwory trafiają w losowe miejsca NIEZAGRANEJ reszty bieżącej tury, więc usłyszane będą jeszcze w tej turze; (2) obniżenie epoki (wczytanie zapisu) zawęża pulę bez przerywania grającego utworu; (3) `getEra()` zwraca nadal 1|2 (era syntezy) — kontrakt dla main.ts bez zmian, epoka muzyki 1..3 w `getMusicTier()`; (4) parametry powtórzeń/crossfade bez zmian.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO

SHA commitu operatora (kod + testy + dispatch + ten raport): c9f728ded0bb686269cfe4b7c8493ddcd1e66ecc (gałąź worktree-wf_ba170596-619-1)
