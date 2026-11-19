STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TERRITORY-FORT-RING-IMPROVEMENTS-NOT-TRANSFERRED-Q1
GOAL: heks z ulepszeniem wlasciciela fortu w pierscieniu nie przechodzi pod nowe miasto innej cywilizacji (ABC C, 2026-11-19).
ZMIANY/COMMIT: kandydat e2e8c38aca299825da36d4aa7d21129be74b720d; `git merge-base --is-ancestor 495682128e86... e2e8c38ac` = OK. diff --stat vs baza: 9 plikow, +394/-66 (main.ts, map/territory.ts, map/improvement-build.ts, game/fort-territory.ts, 3 testy .cjs w tym nowy territory-improvement-owner-test.cjs, 2 raporty runs/). Wszystko w allowliscie dodatku (runda 2). Brak zmian poza allowlista, brak gra-robocza/WERSJE/rust-port.
TESTY (wlasne, surowe, na e2e8c38ac; node_modules przez npm ci --ignore-scripts):
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- city-founding-no-fort-takeover 54/0; fort-outpost-hard-territory 92/0; fort-strazniaca-zasieg-zakladania 82/0; ai-territory-race 29 OK/0 FAIL; territory-improvement-owner (nowy) 34/0
- Mutacja M-A (kopia produkcyjna territory.ts, fortRingShield -> `true &&`): territory-improvement-owner 33/1 (czerwony); city-founding 54/0 (zielony). Przywrocono.
- Mutacja M-B (improvement-build.ts, `if (false && hasOwnFort && ...)` w qualifies()): territory-improvement-owner 34/0, city-founding 54/0, fort-outpost 92/0 = WSZYSTKO ZIELONE. Czyli sama blokada w qualifies() (sciezka AI/autopilot) nie ma testu wykonawczego (guard OWN-7d to regex, nie wykrywa `false &&`). Przywrocono.
- ZYWY CHROMIUM (/usr/bin/google-chrome, bundle vite poza repo, ?playtest=mapa, tymczasowy hak testowy dodany do main.ts WYLACZNIE na czas pomiaru i cofniety `git checkout`; commit bez zmian w kodzie). Fort gracza (0) w (53,11), stadnina gracza w (56,11), kontrolny heks bez ulepszenia (57,11), miasto AI (1) zalozone w (60,11):
  PRZED miastem AI: fort 0, stadnina 0, kontrola 0, centrum miasta null; rejestr [["53,11",0],["56,11",0]].
  PO miescie AI: fort 0, stadnina 0 (ZOSTAJE u gracza), kontrola 1 (bez ulepszenia -> miasto AI), centrum miasta 1. Pierscien fortu (91 heks.): 76 gracz / 15 AI.
  Kontrola odwrotna: ulepszenie wlasciciela AI (stare miasto) na heksie w pierscieniu -> 1 (zostaje przy miescie).
  console/pageerror: 0. Ograniczenie: hak ustawia ulepszenie przez setPlacedLayersOwned, nie przez pelny commitBuildRequest; zaloze miasta wymuszono (canFoundAs zwrocil "poza terytorium"); zrzut nieskomitowany.
OCENA ZARZUTOW (bez etykiet rol):
1 Wydajnosc: CZESCIOWO przyjete. Predykat podpinany tylko gdy w pierscieniu stoi wlasne ulepszenie (srodek fortu pominiety, OWN-2); gra z fortem bez wlasnych ulepszen zachowuje indeks (25.9 ms). Z wlasnym ulepszeniem 126.1 ms/400k lookupow (4.9x) - DODATEK pkt 4 (<=10%) NIESPELNIONY w tym przypadku. Pomiar w realnej grze NIE ZMIERZONO. Ocena: nota, nie FAIL (wariant ograniczony do fortow z wlasnym ulepszeniem; forty AI rzadkie wg KOLEJKI; brak dowodu wplywu na czas tury).
2 Test blokady budowy: helper fortRingBuildBlockReason przetestowany (OWN-3a..f, mutacja czerwona); wpiecie w qualifies() NIE (mutacja M-B zielona). Nota.
3 Test wlasciciela ulepszenia: ODDANE/ROZSTRZYGNIETE (fortRingShield w territory.ts, testy OWN-1/5/6, mutacja M-A czerwona; zywy dowod powyzej na realnym rejestrze).
4 Zapis/wczytanie: resolveImprovementOwners testowany; round-trip prawdziwego zapisu NIE ZMIERZONO. Stary zapis = przyblizenie wg biezacego territoryOwnerAt (ograniczenie; ochrona pelna dla nowych zapisow). Nota.
5 Chromium: WYKONANE przez FC (wyzej).
6 applyBuildRequest: ODDANE - obecna wersja woła fortRingBuildBlockReason w main.ts; AI/autopilot przez qualifies() (nietestowane wykonawczo, patrz 2).
7 Pierwszy wlasciciel w rejestrze: nie poprawiany, ograniczenie opisane; po zdobyciu miasta/fortu wpis moze byc nieaktualny. Nota, nie blokuje.
8 Blokada szersza/bez powodu: ODDANE. Blokada przeliczona (pierscien WLASNEGO fortu + cudze terytorium), powod po polsku FORT_RING_BUILD_BLOCK_REASON, pokazywany przez showHintMessage w applyBuildRequest; w qualifies() zwykle odrzucenie bez komunikatu (jak inne kwalifikatory). Odchylenie od litery pkt 3 DODATKU uznane za poprawne logicznie (przeskok dotyczy tylko budujacego z wlasnym fortem).
BLOKADY: brak blokujacych. Nie zmierzono: wydajnosc w realnej grze, round-trip prawdziwego zapisu, test wykonawczy qualifies().
RUNDY: 3/5 (FC rundy 3)
NASTEPNY KROK: integracja orkiestratora (merge e2e8c38ac, bramki). Zalecane osobne male tematy: test wykonawczy qualifies() blokady budowy; pomiar wydajnosci buildAllTerritoryNodes w grze z fortem i wlasnym ulepszeniem; test round-trip zapisu rejestru.
UWAGI-DLA-ORKIESTRATORA: pliki generowane gra/tools/.territory-owner-*.{ts,cjs} sa ignorowane (git status czysty). Bundle i zrzut w /tmp/claude-0/ (poza repo).
DEPLOY/PUSH: NIE WYKONANO
