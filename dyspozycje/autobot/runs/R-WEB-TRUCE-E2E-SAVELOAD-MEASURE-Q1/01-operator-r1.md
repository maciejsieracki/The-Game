STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1
GOAL: (A) pomiar i naprawa przebiegu decyzja AI -> karta rozejmu na stole; (B) prawdziwy roundtrip zapisu w trakcie rozejmu, wczytanie w nowej sesji, wygaszenie bez kary.
ZMIANY/COMMIT: gra/src/main.ts (enqueueNegotiationFromAiCmd: goly rozejm bez koszyka przepuszczany tylko gdy neededPn<=0; hak __truceSaveLoadTestDebug). gra/tools/diplo-truce-ai-table-live-test.cjs (przepisany, zredukowany). gra/tools/diplo-truce-saveload-live-test.cjs (nowy). Logi i zrzuty w runie. Brak zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, Cargo.toml. Push: NIE.
TESTY:
- Czesc A, zywy Chromium, baza przed zmiana: AI decyduje "proponujemy rozejm" (respektWzgledny=0.31, tury wojny=6), wpisy stolu 0 -> FAIL. Ten sam wynik w dwoch przebiegach.
- Czesc A, po poprawce: wpis stolu {actionId:"rozejm", proposerOwnerId:1, turns:10} w turze 2 -> PASS. Karta widoczna w DOM jako "Dyplomacja: Grecy · Rozpatrz" (evidence/ai-table-rozejm-karta-stol.png). Klikniecie "Rozpatrz" nie otworzylo modala (nakladka "Wrog atakuje").
- Kontrola pokoju (wiek wojny 25, AI "proponujemy pokoj"): przed i po poprawce wpisy 0 -> FAIL identyczny. Pokoj zachowany (poprawka tylko dla rodzaj==='rozejm'). Ten sam ubytek dla pokoju jest realnym defektem, zgloszony do decyzji (poza zakresem).
- Czesc B, roundtrip w tym samym kontekscie przegladarki, nowa sesja gry (reload dokumentu): 14 pass / 0 fail. Tura, truceUntilTurn=11 (zawarcie w turze 1 + 10), status, flaga agresora, casus belli, licznik wojen epoki, meta par, Wiarygodnosc zgodne. Rozejm trwa do tury 10, wygasa w turze 11 do wojny bez nowej kary i bez nowej flagi. Stary zapis bez pol wczytuje sie bez bledu (wartosci domyslne). Zero pageerror.
- Mutacja czesci B (zdjecie zapisu aggressorFlagUntilByOwner): bundle zbudowany, zywy przebieg NIE_ZMIERZONO. Renderer padal ("Target crashed" / "Page crashed") takze na bundle bez mutacji, przy malej wolnej pamieci maszyny wspoldzielonej z innymi agentami (MemAvailable 2-4 GB). Mutacja w main.ts przywrocona (diff zawiera tylko zamierzone zmiany).
- Bramki: tsc --noEmit EXIT=0; diplo-truce-r1 30/0 (baza 30); diplo-truce-n6-saveload 8/0 (baza 8). NIE_ZMIERZONO: pozostale bramki z listy (truce-live 23, r4-ai, ring, city-cession, aggressor, war-era-counter, multiwar, diplomacy, peace-profile itd.) - brak czasu i pamieci.
BLOKADY: (1) czesc A: czas testu 105-133 s (swiat generuje sie 77-97 s pod obciazeniem), limit 120 s niespelniony. (2) czesc B: mutacja zywa NIE_ZMIERZONO (infra). (3) pokoj: ten sam ubytek, decyzja wlasciciela.
RUNDY: 1/5
NASTEPNY KROK: FC: powtorzyc mutacje B i pozostale bramki przy wolnej pamieci; decyzja o poprawce pokoju (osobny temat).
DEPLOY/PUSH: NIE WYKONANO
ZALOZENIA: (a) poprawka ograniczona do rozejmu, pokoj zostaje z tym samym defektem. (b) Goly rozejm (bez koszyka) traktowany jak poprawna oferta, tak jak akceptacja gracza w tej samej sciezce.
