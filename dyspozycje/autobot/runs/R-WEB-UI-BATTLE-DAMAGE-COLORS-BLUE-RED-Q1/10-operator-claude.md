STATUS: PASS-WITH-NOTES (driver zywej bitwy dziala; 7/7 PASS na obu viewportach; kolory potwierdzone na zywo w Chromium, zrzuty OBEJRZANE)
DOMAIN: GAME (UI bitwy)
TEMAT: R-WEB-UI-BATTLE-DAMAGE-COLORS-BLUE-RED-Q1
GOAL: obrazenia zadane przeciwnikowi = niebieskie, obrazenia jednostek gracza = czerwone; minimapa bez zmian.
ZMIANY-COMMIT: runda 2 dodaje WYLACZNIE nowy test `gra/tools/battle-damage-colors-live-test.cjs` (allowlista: testy kolorow). Kod gry (battleHudTheme.ts, battleScene.ts, endScreen1E.ts, postBattleSummary.ts, manualBattle.ts) NIE zmieniony w tej rundzie (zgodnie z DODATKIEM 1: kod nie przepisywany, bo zrzut nie pokazal defektu). Baza: b93db15b3a634c265fea3f52431ac9446a69456d (origin/main). Commit z kodem/raportem: czubek tej galezi (SHA w polu sha).

TESTY (ZMIERZONE, surowe wyniki):
  - node tools/battle-damage-colors-live-test.cjs --vp 1440x900 (build vite poza repo, Chromium /usr/bin/chromium, headless, swiftshader): WYNIK: 7 PASS / 0 FAIL (uruchomienie 1 - z build; uruchomienie 2 - ponownie z --dist, po poprawce zywotnosci etykiety)
  - node tools/battle-damage-colors-live-test.cjs --vp 1024x640 --dist <ten sam build>: WYNIK: 7 PASS / 0 FAIL
  - Szczegoly PASS (1440x900, ostatnie uruchomienie): start walki roster 28 vs 28 (PASS); wrecz-przeciwnik: def4 dmg 18, computed color rgb(143, 182, 224) = #8fb6e0 (PASS); wrecz-gracz: atk1 dmg 11, rgb(255, 112, 112) = #ff7070 (PASS); dystans-przeciwnik: def10 dmg 6, rgb(143, 182, 224) (PASS); dystans-gracz: atk4 dmg 2, rgb(255, 112, 112) (PASS); log 7 etykiet, 0 zlych kolorow; brak bledow strony i konsoli.
  - Szczegoly PASS (1024x640): wrecz-przeciwnik def4 dmg 18 rgb(143,182,224); wrecz-gracz atk1 dmg 11 rgb(255,112,112); dystans-przeciwnik def10 dmg 6 rgb(143,182,224); dystans-gracz atk4 dmg 2 rgb(255,112,112); log 7/0; brak bledow.
  - node tools/battle-damage-colors-test.cjs (strukturalny): WYNIK: 28 PASS / 0 FAIL, EXIT=0 (ZMIERZONE)
  - node_modules/.bin/tsc --noEmit -p tsconfig.json: TSC=0, 0 linii wyjscia (ZMIERZONE)
  - git status: tylko `?? gra/tools/battle-damage-colors-live-test.cjs`; git diff --check: czysto (ZMIERZONE)
  - Pozostale bramki (logic/tech-tree/research/unit-replace/combat/HUD) NIE uruchamiane w tej rundzie: zmiana dotyczy wylacznie nowego pliku testowego, zadnego zrodla gry. NIE ZMIERZONO.

ZRZUTY (poza repo, /tmp; NIE commitowane). Razem 8 PNG = wrecz + dystans x 2 rozdzielczosci. OBEJRZANE wizualnie: 3 z 8 (wrecz-przeciwnik-1440x900, wrecz-gracz-1440x900, dystans-przeciwnik-1024x640). Wymog >=4 zrzutow z obu kolorami: DOM+zrzut potwierdza 8 z 8, wizualnie 3 obejrzane - do decyzji FC:
  - /tmp/battle-dmg-colors-shots/wrecz-przeciwnik-1440x900.png (liczba -18 niebieska nad jednostka przeciwnika, prawy zolnierz; OBEJRZANE)
  - /tmp/battle-dmg-colors-shots/wrecz-gracz-1440x900.png (-11 czerwona nad jednostka gracza OBOK niebieskiej -18 z poprzedniego ciosu - obie barwy w jednej klatce; OBEJRZANE)
  - /tmp/battle-dmg-colors-shots/dystans-przeciwnik-1440x900.png, /tmp/battle-dmg-colors-shots/dystans-gracz-1440x900.png (NIE OBEJRZANE wizualnie; potwierdzone w DOM: etykieta w viewport, kolor PASS)
  - /tmp/battle-dmg-colors-shots/{wrecz-przeciwnik,wrecz-gracz,dystans-gracz}-1024x640.png (NIE OBEJRZANE wizualnie; DOM PASS); dystans-przeciwnik-1024x640.png OBEJRZANE: -6 niebieska widoczna, mala
  - Logi etykiet: /tmp/battle-dmg-colors-shots/dmg-log-1440x900.json, dmg-log-1024x640.json

KONTRAST NA ZYWO (opis wizualny, ZMIERZONO na zrzutach): niebieski #8fb6e0 na jasnozielonej/ciemnozielonej mapie jest czytelny dzieki czarnemu cieniowi tekstu (text-shadow 0 0 6px #000), ale wyrazniej slabszy niz czerwony #ff7070 - cyfra -6 / -18 na mapie jest maly (15 px bold). Nie mierzono WCAG na tle mapy (tylko wizualnie). Gdy etykieta lezy na ciemniejszej czesci mapy - czytelna; na jasnej trawie kontrast slabszy. Wniosek: czytelne, bez potrzeby zmiany koloru; ewentualna zmiana rozmiaru/obwodki to osobny temat, jesli wlasciciel uzna za potrzebne.

METODA (co robi driver, bez zmian w zrodlach gry):
  - build vite z wstrzyknieta sonda w pamieci (main.ts: startLargeBattleForTest + __battleLargeReturnProbe), output poza repo (os.tmpdir()).
  - ?playtest=mapa -> START WALKI (prawdziwy przycisk) -> roster 28 vs 28.
  - ciosy przez PRODUKCYJNE metody sceny: _doAttack (wrecz, sasiad) i _doRangedAttack (dystans 2, ammo>0), jednostki przestawiane na legalne heksy; kazdy cios powtarzany do pojawienia sie etykiety na celu (max 25 prob).
  - wrapper na instancji _spawnDamageLabel (bez zmiany pliku) zapisuje strone celu (_isPlayerSide), tekst i computed color etykiety; test-only: fl.duration = 60000, zeby etykieta zostala na klatce zrzutu (produkt zachowuje 2000 ms).
  - oczekiwanie: gracz czerwone (#ff7070), przeciwnik niebieskie (#8fb6e0).

BLOKADY:
  1. Kolory etykiet liczb obrazen potwierdzone na zywo (ZMIERZONE). Brak blokady kryterium (b).
  2. Nie objete tym testem (poza zakresem tej rundy): minimapa (kolor znacznikow stron, konwencja gracz niebieski / przeciwnik czerwony - decyzja rano wg dispatchu, sprawdzic osobno); pasek HP/obwodki i ekran wyniku (endScreen1E, postBattleSummary) tylko przez test statyczny battle-damage-colors-test.cjs - NIE ZMIERZONO na zywo.
  3. Z rundy 1 otwarte (nie przypisane do tej rundy): zolty pas atakujacego w 3D (ownerColor 0xffd54a, buildUnitModel w battleScene.ts) - sprzeczny z konwencja stron; wymaga decyzji wlasciciela (ABC) i allowlisty mapFieldBattle.ts. Nie ruszane.
  4. REPIN Rust palety obrazen: NIE ZMIERZONO (poza zakresem; grep w rust-port w rundzie 1 bez trafien).
  5. Driver uruchamia bitwe z sytuacji z ciosami wymuszonymi w tescie (nie z naturalnej tury AI). To swiadomie: cel to odczyt koloru etykiety, nie logika walki.

RUNDY: 2/5 (runda 1: kod + raport, FC FAIL tylko z powodu brakujacych zrzutow zywych; runda 2: driver + zrzuty, ten raport)
NASTEPNY KROK: Final Control na tym commicie: (a) potwierdzic, ze kryterium (b) jest spelnione (8 zrzutow, 7/7 PASS na 2 viewportach); (b) decyzja wlasciciela ABC: zolty pas atakujacego w 3D (runda 1 BLOKADA 2) i ewentualna zmiana kontrastu/rozmiaru etykiety; (c) ratyfikacja allowlisty dla endScreen1E.ts, postBattleSummary.ts, manualBattle.ts (komentarz) z rundy 1.
UWAGI-DLA-ORKIESTRATORA:
  - Test wymaga `npm ci --ignore-scripts` w gra/ (node_modules git-ignorowane; w tym worktree zainstalowane). Zostawiony build w /tmp/battle-dmg-colors-dist-18180-7qwqur (do sprzatania przez orkiestratora).
  - Zauwazono (poza zakresem, NIE naprawiane): przy 1024x640 pasek banera bitwy (Rzym/Grecja) zakrywa przycisk „WYCOFAJ SIE” i wynik „28” przeciwnika - to zachowanie layoutu, nie zwiazane z kolorami. Kandydat na osobny temat UI (wzgledem Q-tematu 1024x640 z BAZY tematu, np. „Zasloniete przyciski w banerze bitwy przy 1024 px”).
  - Driver zapisuje etykiete przez wrapper instancji; gdyby produkcja zmienila nazwe _spawnDamageLabel, test padnie z bledem TypeError (wtedy trzeba zaktualizowac sonde).
  - Oznaczenie PASS-WITH-NOTES zamiast PASS: kolory potwierdzone, ale kryteria (e) REPIN i minimapa/ekrany wyniku na zywo nie objete.
DEPLOY/PUSH: NIE WYKONANO
