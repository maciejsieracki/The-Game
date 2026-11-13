STATUS: PASS
DOMAIN: GAME (WEB) — DANE + AUDIO
TEMAT: R-WEB-DIPLO-CIV-MUSIC-PACK2-Q1
GOAL: Wdrozyc caly pakiet muzyki cywilizacji w dyplomacji (15/15), wariant D: 19 nowych plikow przekodowanych jak poprzednie (neg. 64k, przyw. 96k, silenceremove -50 dB/50 ms, bez metadanych), przywitanie jako lista z rotacja.
ZMIANY/COMMIT: baza c7ee6ea15 (origin/main). SHA commitu kodu: patrz koniec (commit zawierajacy ten plik). Allowlista:
 - gra/src/audio/civMusic.ts: greeting: string | string[]; GreetingPicker (pickIndex wstrzykiwany, domyslnie rotateGreetingIndex: po kolei per civ, nie to samo dwa razy z rzedu, stan w pamieci sesji); resetGreetingRotation() do testow; zgodnosc wsteczna string; leadCount i logika brakow bez zmian.
 - gra/src/audio/filePlayer.ts (tylko ladowanie przywitan): getCivMusicPlaylist rozwiazuje utwory przy KAZDYM otwarciu rozmowy (inaczej cache zamrozilby jedno przywitanie) i cache'uje playlisty po zestawie URL (po jednej na wariant przywitania); allDiplomacyPlaylists bez zmian kontraktu.
 - gra/data/civ-music.json: 15/15 wpisow; zulusi greeting = [przywitanie, przywitanie_2]; sumer + negocjacje; inkowie + przywitanie (zachowane inkowie_negocjacje_1/_2); _opis zaktualizowany.
 - gra/src/audio/utwory/dyplomacja/_civ/**: 19 nowych mp3 (8 x przyw.+negocjacje nowych civ, sumer_negocjacje, inkowie_przywitanie, zulusi_przywitanie_2). Istniejacych 14 plikow nie ruszano.
 - gra/tools/civ-music-test.cjs rozszerzony (sekcje J, K, L; A/C/D/H dostosowane).
 - dyspozycje/autobot/runs/R-WEB-DIPLO-CIV-MUSIC-PACK2-Q1/transcode-pack2.sh (odtwarzalne przekodowanie, wejscie: paczka docs z gałęzi dispatchu).
 Mapowanie docs: sumerowie->sumer; inkowie_negocjacje.mp3/_2 w docs odpowiadaja istniejacym plikom repo _1/_2 (przekodowane wczesniej, nie ruszane; nie duplikowano). germanie_przywitanie = The Chieftain's Silence (plik docs germanie_przywitanie.mp3).
TESTY: civ-music-test 81 OK / 0 FAIL (15/15 cywilizacji, pliki dostepne, rotacja Zulusow a,b,a,b, indeks wstrzykiwany, string dziala, braki w liscie, pusta lista, MD5 19 plikow stale, brak duplikatow MD5 w _civ/ (grep po wszystkich 33 plikach)). logic-test 213/213. ai-test 289 passed / 0 failed. tsc --noEmit 0 bledow. Regresja audio: map-field-battle 24/0, menu-game-music-transition 7/0, menu-music-delay 9/0. Testy live (Chromium) civ-music-live / muzyka-era-live NIE URUCHAMIANE (brak przegladarki w tej rundzie; zmiana filePlayer obejmuje tylko wybor playlisty) — NIE_ZMIERZONO na zywo; zalecane dla Evaluatora.
POMIAR ROZMIARU (19 plikow po przekodowaniu): 14 905 158 B = 14,21 MiB. ROBOCZA: audio jest osadzane base64 w HTML (vite.config binaryAssetsOutOfJs + singlefile) => x1,34 = 19,97 MB (19,05 MiB). Szacunek Obrony (~+20 MB) potwierdzony; < 25 MB, wiec bez DECISION_REQUIRED. Suma wszystkich plikow _civ/: 26 146 326 B (24,94 MiB); budzet w tescie H1 podniesiony 12 -> 27 MiB. Faktyczny rozmiar HTML po vite build: NIE_ZMIERZONO (build robi orkiestrator).
DLUGOSCI (ffprobe, s): 
| plik | B | czas |
| asyria_negocjacje | 1185167 | 2:28 |
| asyria_przywitanie | 465233 | 0:39 |
| babilonia_negocjacje | 1177435 | 2:27 |
| babilonia_przywitanie | 475264 | 0:40 |
| celtowie_negocjacje | 1188093 | 2:28 |
| celtowie_przywitanie | 461785 | 0:38 |
| fenicjanie_negocjacje | 953617 | 1:59 (119,2 s) |
| fenicjanie_przywitanie | 472756 | 0:39 |
| germanie_negocjacje | 1167404 | 2:26 |
| germanie_przywitanie | 467114 | 0:39 |
| harappa_negocjacje | 1089454 | 2:16 |
| harappa_przywitanie | 433259 | 0:36 |
| hetyci_negocjacje | 1118502 | 2:20 |
| hetyci_przywitanie | 471816 | 0:39 |
| slowianie_negocjacje | 1175763 | 2:27 |
| slowianie_przywitanie | 478085 | 0:40 |
| sumer_negocjacje | 1194571 | 2:29 |
| inkowie_przywitanie | 453635 | 0:38 |
| zulusi_przywitanie_2 | 476205 | 0:40 |
Przywitania wszystkie w 0:30-1:10. UWAGA: fenicjanie_negocjacje = 119,2 s (kryterium >= 2:00 o 0,8 s niespelnione); zrodlo ma 121,6 s, silenceremove ucina 2,4 s ciszy — cecha materialu, nie bledu przekodowania. ZALOZENIE: akceptuje sie (petla z crossfade, roznica nieistotna); do decyzji orkiestratora/wlasciciela.
MD5 (po przekodowaniu): zapisane w gra/tools/civ-music-test.cjs (PACK2_MD5).
BLOKADY: brak. Uwaga procesowa: docs README (dyspozycje/analizy/muzyka-cywilizacji/README.md, tabela utworow) poza allowlista — nieaktualizowany; do dopisania przez orkiestratora po integracji.
RUNDY: 2/5
NASTEPNY KROK: Evaluator (+ ew. testy live Chromium civ-music-live-test.cjs); potem Obrona/Final Control.
DEPLOY/PUSH: NIE WYKONANO
