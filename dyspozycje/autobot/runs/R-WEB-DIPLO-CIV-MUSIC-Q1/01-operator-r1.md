STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-CIV-MUSIC-Q1
GOAL: W dyplomacji gra muzyka cywilizacji rozmowcy: przywitanie (raz) -> negocjacje (petla); po zamknieciu wraca muzyka gry; manifest danych; bez regresji dla pozostalych cywilizacji.
ZMIANY/COMMIT: 4fd81612e (kod + audio + testy + README; baza origin/main fcaa10300, dispatch podawal 709082475 — uzyto aktualnego origin/main). SHA raportu = commit nastepny po 4fd81612e.
  - gra/data/civ-music.json (manifest; civId = ikonaId z civs.json; Sumerowie = `sumer`)
  - gra/src/audio/civMusic.ts (czysta logika wyboru), filePlayer.ts (createPlaylist: leadCount = utwory grane raz; rewind(); glob `dyplomacja/_civ/*/*.mp3` poza istniejacym globem per-civ; diplomacyPlaylistForCiv/allDiplomacyPlaylists)
  - gra/src/audio/utwory/dyplomacja/_civ/<civId>/*.mp3 (13 plikow przekodowanych)
  - gra/src/main.ts: +4 linie w istniejacym haku `__musicEraTestDebug` (stopMusic, civKeyOfOwner, setOwnerCivForTest) — tylko test live; zero zmian w logice gry.
  - Testy: gra/tools/civ-music-test.cjs, gra/tools/civ-music-live-test.cjs; README: dyspozycje/analizy/muzyka-cywilizacji/README.md (tabela + jak dodac cywilizacje).
  - muzyka-antyczna.ts / diplomacyAudience.ts BEZ zmian (juz wolaly startDiplomacyMusic(otherCivId)/stopDiplomacyMusic).
TESTY:
  - tsc --noEmit: czysto. logic-test: 213/213. menu-game-music-transition 7/7, menu-music-delay 9/9, muzyka-braz-era-playlist 32/32.
  - civ-music-test.cjs (jednostkowy, esbuild na realnym TS + realny manifest/dysk): 27 OK / 0 FAIL (manifest<->dysk, Grecy/Rzym/Chin/Zulusi/Egipt, Inkowie 2 utwory bez przywitania, Sumer tylko przywitanie + fallback, brak wpisu/prototyp => null, brakujace pliki, rozmiar <= 12 MiB, mutacja).
  - civ-music-live-test.cjs (Chromium, realny bundle ?playtest=mapa, instrumentacja <audio>): 20 OK / 0 FAIL: Grecy przywitanie -> negocjacje -> petla (restart, bez przywitania, bez nakladania); zamkniecie => brak dzwieku cywilizacji, wraca tlo; ponowne otwarcie od przywitania; Inkowie 2 utwory na zmiane; Sumer przywitanie -> dotychczasowy utwor; celtowie (bez utworow) tylko dotychczasowy utwor; stopMusic => dyplomacja milczy; glosnosc > 0; zero pageerror/console.error; autoplay "wymaga gestu" (play() odrzucone) => zero bledow.
  - TEST PADA NA BAZIE: bundle ze zmutowanym manifestem `{}` => 12 OK / 7 FAIL (L1b,c,d,e, L3a, L4b, L5a).
  - Uwaga stabilnosci: pierwsze przebiegi live mialy 2 flaki (nowy element <audio> chwilowo stoi na t=0 po crossfade pod obciazeniem swiftshader); test zmieniony na oczekiwanie z limitem 14-20 s zamiast stalych sleepow; 3 kolejne pelne przebiegi zielone.
ROZMIAR (vite build poza repo, index.html): PRZED 70 674 005 B (67,40 MiB) -> PO 86 012 440 B (82,03 MiB); przyrost +15 338 435 B (+14,63 MiB, +21,7%; base64 +33% od 11,50 MB mp3). Pliki mp3 lacznie 11 501 658 B (10,97 MiB) <= 12 MiB. Zrodla: 30 MB -> 11,5 MB.
  Kodowanie: negocjacje 64 kbps, przywitania 96 kbps (joint stereo, libmp3lame). ZALOZENIE (konflikt dispatchu): 96-112 kbps dla wszystkich dalo by ~15,6-18 MB > cel <= 12 MB; wybrano cel rozmiaru. Jesli wlasciciel woli jakosc: 96 kbps negocjacji => ~15 MB mp3 (~20 MB bundla).
SZEW PETLI: pomiar (ffmpeg volumedetect, 1,5 s): ogony negocjacji wyciszaja sie do -50..-91 dB, glowy -11..-90 dB; petla korzysta z istniejacego crossfade equal-power 1,5 s (to samo co powtorzenia utworow kamienia), wejscie nowego przebiegu startuje od 0. Brak odsluchu przez czlowieka: NIE_ZMIERZONO subiektywnie.
ZALOZENIA: (1) Inkowie: rozmowa od razu od negocjacji (brak przywitania, bez zmiany dzwieku), kolejnosc losowa bez powtorzenia z rzedu. (2) Sumer po przywitaniu: dotychczasowy utwor dyplomacji w petli. (3) Rzymianie: nowe utwory maja pierwszenstwo; stare `dyplomacja/rzymianie/*` zostaja jako zapas (~1,4 MB, mozna usunac osobnym tematem). (4) Nazwy plikow Inkow zmienione na inkowie_negocjacje_1/2 (rola ustalona). (5) Surowych mp3 z dispatchu nie commitowano (tylko README).
BLOKADY: brak. Nie uruchamiano npm run build/dev; uzyto `vite build --outDir` poza repo (usuniete); node_modules usuniete.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (R1): przeglad diffu filePlayer.ts (queue/leadCount, regresja kamien/braz/intro: lead=0 daje stare zachowanie), uruchomienie civ-music-test.cjs + live na swiezym bundle; ewentualny odsluch petli.
DEPLOY/PUSH: NIE WYKONANO
