STATUS: PASS-WITH-NOTES (obrona rundy 1: oba zarzuty Evaluatora rozstrzygnięte; zarzut 1 PRZYJĘTY z poprawką i rozszerzeniem allowlisty, zarzut 2 PRZYJĘTY z dowodem z żywej gry)
DOMAIN: GAME (tylko UI; bez logiki gry)
TEMAT: R-WEB-UI-RESOURCE-CARD-NUMBERS-ONLY-DETAILS-COLLAPSED-Q1
GOAL: Karta surowca i nagłówek Surowce pokazują same liczby brutto/netto; „Zobacz szczegóły zużycia” i „Skąd zapasy” zawsze zwinięte. Obrona: test części B live (hud-topbar) zgodny z nowym nagłówkiem; zrzut z ŻYWEJ gry (vite build poza repo).
BAZA: 7ac79dafb (origin/main); kandydat Operatora 802d08b6b (kod c094e0db2). Ancestry: `git merge-base --is-ancestor 7ac79dafb 802d08b6b` = OK.

ZARZUTY EVALUATORA (ddb54492e, 20-evaluator-claude.md):

1. (ISTOTNY) gra/tools/hud-topbar-grid-gross-net-test.cjs, część B (--dist): regex `/Brutto…→netto…/` dla zakładki Surowce.
   DECYZJA: PRZYJMUJĘ. Dowód: w kodzie `grossNetNumbersSub` (empireDetailPanel.ts l.1695-1702) nie emituje słów; live test na kandydacie (`--dist`) przed poprawką: linia `civ-emp-grossnet` dla Surowce brak słowa „Brutto”.
   POPRAWKA (commit obrony): asercja panelu dla klucza `Surowce` używa `/([+\-]?[\d,.kM]+)→([+\-]?[\d,.kM]+)/` (same liczby), pozostałe zakładki (Spichlerz/Handel/Nauka) zostają przy regexie z „Brutto … → netto …”. Asercja porównania z HUD (brutto==HUD, netto==HUD) bez zmian.
   ROZSZERZENIE ALLOWLISTY: plik gra/tools/hud-topbar-grid-gross-net-test.cjs NIE był na allowliście dispatchu. Zmiana to wyłącznie asercja tekstu (5 linii), zgodnie z opcją „dopisać plik do allowlisty (tylko asercje tekstu)” z zarzutu. ORKIESTRATOR/FC: zatwierdzić rozszerzenie allowlisty albo odrzucić zmianę pliku i zgłosić jako dług.
   DOWÓD LIVE (--dist, vite zbudowane POZA repo; kandydat c094e0db2 oraz baza 7ac79dafb):
     - kandydat (po poprawce, oba przebiegi): `info panel Surowce: panel brutto +52 netto -34 | HUD brutto +52 netto −34` -> asercje „linia obecna” i „brutto/netto == HUD” OK.
     - baza 7ac79dafb (stary regex z wyrazami, oba przebiegi nie były potrzebne): `info panel Surowce: panel brutto +52 netto -34 | HUD brutto +52 netto −34` — te same liczby.
   Testy endTurn (część B, niezależne od tematu): patrz TESTY.

2. (ISTOTNY dla kryterium d) brak zrzutu żywej gry z kartami i liczbami.
   DECYZJA: PRZYJMUJĘ. Wykonano zrzut z ŻYWEJ gry: build kandydata c094e0db2 poza repo (`npx vite build --outDir <scratchpad>/dist`), tryb `?playtest=mapa&civTest=1`, klik w chip „Surowce”, skrypt Playwright w scratchpad (poza repo), 0 pageerror.
   Zrzut: dowody/surowce-zywa-gra-1600x1000.png (OBEJRZANY narzędziem Read).
   Co widać na zrzucie (liczby z DOM, nie z pamięci):
     - nagłówek Surowce: „+52 → −13” (bez słów; opis w title: „Brutto = produkcja surowców przed zużyciem (suma po surowcach), na turę. Netto = po zużyciu obywateli, budynków i wojska, na turę.”)
     - karty: „Drewno … +5 · +2”, „Kamień … +2 · 0”, „Glina … +45 · +45”, „Żelazo … 0 · −60”; bez słów „Brutto/netto/turę”.
     - wszystkie 3 widoczne `<details>` „Zobacz szczegóły zużycia” zamknięte (open=false).
   ZMIANA WZGLĘDEM DISPATCHU: wartości z żywej gry NIE są +313 · +233 (Drewno/Kamień/Glina w tej sesji testowej mają inne stany magazynu; zapasy 0). Kryterium „karty Drewno/Kamień/Glina z +313 · +233” nie jest dosłownie spełnione, bo liczby zależą od stanu gry; spełnione jest kryterium formy (`+X · +Y`, zero słów, zwinięte szczegóły).
   NIE ZMIERZONO: „Skąd zapasy (ostatnie 10 tur)” na ŻYWEJ grze — w tym stanie zapasy wynoszą 0 i blok `Skąd zapasy` się nie renderuje (DOM: 3 `details`, wszystkie „Zobacz szczegóły zużycia”). Zwijanie „Skąd zapasy” po przerysowaniu (capture/restore usunięte) sprawdza test D6 `resource-ledger-skad-dom-test.cjs` (13/0) i asercja nieobecności w `resource-card-numbers-only-test.cjs`; na żywej grze wymaga stanu z zapasem > 0 (NIE ZMIERZONO).

NOTATKI EVALUATORA 3-5 (nie zarzuty; odnotowane, bez zmian w kodzie tematu):
- Notatka 3 (M2 tautologiczny w resource-card-numbers-only-test): ODNOTOWANE; realną ochronę dają N6 i D1/D2/D6. Brak zmian (poza zakresem zarzutów).
- Notatka 4 (nieaktualne komentarze w gra/src/ui/resourceSourceLedgerHtml.ts l.26-28): poza allowlistą, zostawione; do osobnego sprzątnięcia (UWAGI).
- Notatka 5 (D6 symuluje przerysowanie przez innerHTML, nie render()): ODNOTOWANE; żywe przerysowanie panelu nie zostało zmierzone (NIE ZMIERZONO).

TESTY (liczby z surowego wyjścia, uruchomione w tej rundzie na 802d08b6b + poprawka):
- `node --check gra/tools/hud-topbar-grid-gross-net-test.cjs`: OK.
- `git diff --check` (po poprawce): czysto (DIFFCHECK_OK).
- hud-topbar-grid-gross-net-test.cjs `--no-mutants --dist <vite kandydata c094e0db2>`, przebieg 1: 166 ok / 3 fail; przebieg 2: 166 ok / 3 fail. Fail w obu: `live: zmierzono co najmniej 1 pelna ture netto vs endTurn` (measured 0) oraz `Spichlerz+ (proba 1)` i/lub `(proba 2)` (netto z HUD != zmiana magazynu po endTurn). Przebieg 1: proba1 netto -80 vs zmiana 0; proba2 netto -62 vs zmiana 0. Przebieg 2: proba1 netto -80 vs zmiana -62; proba2 netto -62 vs zmiana 0. Asercje panelu (Spichlerz/Surowce/Handel/Nauka: „linia obecna” i „brutto/netto == HUD”) — WSZYSTKIE OK w obu przebiegach.
- Ten sam test na BAZIE 7ac79dafb (ten sam skrypt, vite bazy poza repo): 167 ok / 2 fail (measured 0 i Spichlerz+ proba 1). Wniosek: fail endTurn to dług harnessu (tura nie domyka się w sandboxie; #414/#418; wynik zmienny między przebiegami), NIE regresja tego tematu. Asercje panelu identyczne na bazie i kandydacie.
- Pozostałe testy z raportu Operatora: bez zmian (zielone wg 10-operator-claude.md); w tej rundzie nie uruchamiane ponownie poza powyższym (kod gry się nie zmienił, zmieniono tylko asercję jednego testu live).
- tsc --noEmit: nie uruchamiano w tej rundzie (zmiana tylko w pliku .cjs poza tsc; kod gry bez zmian w tej rundzie).
- Kod gry (`gra/src`) w tej rundzie: BEZ ZMIAN względem c094e0db2.

BLOKADY: brak blokad kodu.
ROZSZERZENIE ALLOWLISTY (do decyzji FC): gra/tools/hud-topbar-grid-gross-net-test.cjs (tylko asercja tekstu części B, 5 linii).

RUNDY: Obrona Operatora r1 (odpowiedź na Evaluator r1); tura tematu 1/5.

UWAGI-DLA-ORKIESTRATORA:
- Dowód zrzutu z żywej gry: dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-CARD-NUMBERS-ONLY-DETAILS-COLLAPSED-Q1/dowody/surowce-zywa-gra-1600x1000.png (zachowany w repo; wcześniejszy dowód Sól 360px pozostaje).
- Dług harnessu, nie tego tematu: część B hud-topbar (endTurn w sandboxie `?playtest=mapa&civTest=1`) jest niestabilna — wynik różni się między przebiegami na tym samym buildzie i pada także na bazie 7ac79dafb. Powiązane z #414/#417/#418.
- Wiki (wikiBundle §53.1a) nadal opisuje stary wygląd karty — osobny temat wiki-sync (bez zmian w tym temacie).
- Kandydaci do ujednolicenia wspólnej `grossNetSub` (poza zakresem): Nauka (~l.1721), Żywność (~l.3266), Handel (~l.3801) — zostają z opisem „Brutto … → netto … / turę” zgodnie z dispatchem.
- Pliki wygenerowane lokalnie (poza commitem): `gra/node_modules` (npm ci), build w <scratchpad>/dist i <scratchpad>/dist-base — do usunięcia po pracy (sprzątanie).

DEPLOY/PUSH: NIE WYKONANO
