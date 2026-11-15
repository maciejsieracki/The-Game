STATUS: PASS-WITH-NOTES (runda 1/5; czesc punktow GOAL zmierzona, reszta NIE_ZMIERZONO - patrz nizej)
DOMAIN: GAME (weryfikacja live; zero zmian w gra/src, gra/data, balansie)
TEMAT: R-WEB-LIVE-VERIFY-PREBATTLE-WEAKENED-WARNING-Q1
GOAL: zmierzyc w zywej grze (Chromium, realny endTurn, realny klik w heks wroga) okno przed bitwa dla kar: glod wojska, deficyt zlota, brak kary, strona barbarzyncow, wymiary 1280x800 i 1024x640, zrzuty.
BAZA: origin/main = 807ecebdd (FALA 741). Dispatch w 00-dispatch.md wskazywal fee3c17; dodatek orkiestratora (AKTUALIZACJA 2026-11-15) przesuwa baze na 807ecebdd - uzyto 807ecebdd. Worktree: detached HEAD.

ZMIANY-COMMIT:
- nowe narzedzie: gra/tools/live-verify-prebattle-weakened-q1.cjs (allowlista: live-verify-prebattle-weakened*.cjs)
- raport + dowody: dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-PREBATTLE-WEAKENED-WARNING-Q1/ (10-operator-claude.md, evidence/pb-run3.json, evidence/prebattle-weakened-warning-test.log, shots-run3/*.png)
- SHA: patrz pole sha w odpowiedzi Operatora (commit z tym raportem)
- gra/src, gra/data, wikiBundle, balans, WERSJE.md: nietkniete (git status: tylko nowe pliki allowlisty)

METODA (co zrobiono hakiem, co UI):
- build: vite --outDir <scratchpad>/dist-pb --emptyOutDir z 807ecebdd (bez npm run build, poza repo)
- start: ?playtest=mapa&civTest=1, tura 1
- HAK: __aiTradeWiringTestDebug.setSpichlerzPanstwa(0, 0|9999) - zapas zywnosci panstwa; __ledgerRealPathDebug.setTreasury(0, -200|5000) - skarbiec
- REALNA tura: __civTest.endTurn() (tiki ekonomii, flagi glodWojska / deficytZlota)
- HAK: __frozenTestDebug.spawn (1 jednostka gracza, ruchLeft 3), __civTest.addUnit(-1, ...) (wojownik barbarzyncow na sasiednim heksie)
- HAK (fallback): __frozenTestDebug.select(id) - klik w heks gracza NIE zaznaczyl jednostki (patrz NIE_ZMIERZONO)
- UI: page.mouse.click w heks wroga -> ATAK Z MAPY (openPlayerMapUnitAttack); okno przed bitwa odczytane WYLACZNIE z DOM (.pb-overlay, .pb-weak). Nie uzyto showPreBattle.
- Scenariusze: none (zdrowa baza, bez kary), hunger (spichlerz 0), gold (skarbiec -200, spichlerz zdrowy); wymiary 1280x800 i 1024x640.

WYNIKI (surowe odczyty z evidence/pb-run3.json):
| scenariusz | 1280x800 | 1024x640 | oczekiwane |
| none | okno otwarte, pb-weak: brak | okno otwarte, pb-weak: brak | brak ostrzezenia |
| hunger | "▼ Osłabieni: głód wojska −25% (poza pancerzem)" | j.w. | ostrzezenie glodu, -25% |
| gold | "▼ Osłabieni: deficyt złota −25% (poza pancerzem)" | j.w. | ostrzezenie deficytu, -25% |
- Punkt (a) glod wojska w DOM: ZMIERZONE, PASS (procent -25% zgodny z mnoznikiem 0,75 z econ-params; mapowanie % z mnoznika pokrywa test modulu).
- Punkt (b) deficyt zlota w DOM: ZMIERZONE, PASS.
- Punkt (c) bez kary brak ostrzezenia: ZMIERZONE, PASS (oba wymiary).
- Punkt (d) strona barbarzyncow bez kary bez ostrzezenia: NIE_ZMIERZONE jako osobny odczyt - w DOM jest dokladnie jeden element .pb-weak we wszystkich scenariuszach i nie sprawdzono, ktora karta (strona gracza czy barbarzyncow) go zawiera. Do zamkniecia przy FC (odczyt rodzica .pb-weak).
- Punkt (e) okno nie wychodzi poza ekran: ZMIERZONE dla malego okna - karta 482 px (1280x800) i 322 px (1024x640) miesci sie w viewport (box.top >= 0, bottom <= wysokosc). NIE_ZMIERZONO: przewijanie / max-wysokosc, bo okno ma mala liczbe jednostek i nie przekracza wysokosci; przypadek przepelnienia (wiele jednostek + ostrzezenie) nie byl testowany.
- Punkt (f) zrzuty: zapisane w shots-run3/ (6 PNG). UWAGA: zrzut hunger-1024x640 pokazuje ekran "ZWYCIĘSTWO" (koniec gry, 2 tura) nalozony na scene - zrzut nie pokazuje wiarygodnie okna przed bitwa; odczyt DOM w tym samym przebiegu pokazuje okno otwarte. Zrzuty NIE sa dowodem wizualnym okna.

TESTY:
- prebattle-weakened-warning-test.cjs (gra/tools): 22 OK, 0 FAIL (log: evidence/prebattle-weakened-warning-test.log) - test modulu + render DOM w Chromium (--dump-dom).
- live-verify-prebattle-weakened-q1.cjs: 3 scenariusze x 2 wymiary = 6 przebiegow, 0 bledow strony (pageErrors puste), wszystkie 6 otwarly okno przed bitwa po kliku w heks wroga.
- tsc --noEmit: NIE_URUCHOMIONO - runda nie dotyka gra/src (zmiana wylacznie w gra/tools).
- pozostale bramki referencyjne (4 z 5): NIE_ZMIERZONO - w tej rundzie uruchomiono tylko prebattle-weakened-warning-test. Pelny zestaw do FC.
- git diff --check: czysty (sprawdzono po zapisie raportu).

BLOKADY / OGRANICZENIA (uczciwie):
1. Klik w jednostke gracza nie zaznacza jej (selectedId=null po kliku na focus-owany heks). Zaznaczenie wykonano hakiem __frozenTestDebug.select. Sam atak jest realnym klikiem w heks wroga. Gap: zaznaczenie zwykla mysza - do ustalenia (prawdopodobnie offset sprite'a / hit-test heksu; wspolrzedne z screenOf po focus).
2. Zrodlo flagi glodu w scenariuszu gold nie jest rozdzielone: w pierwszym przebiegu (spichlerz nieustawiony, zapas 0 na starcie mapy) komunikat zawieral OBA wpisy "głód wojska −25%, deficyt złota −25%" - zgodne z testem modulu (f), ale nie wyizolowane w zywej grze.
3. W scenariuszu hunger przy 1280x800 po endTurn tura pozostala 1 (turnAfterEnd=1) - endTurn mogl byc zablokowany bramka "Zakończ turę" (#368/#384) przy zerowym zapasie; flaga glodu mogla pochodzic z ticka startowego. Nie rozstrzygniete. Do zbadania przez orkiestratora / rundę 2 (ta sama kwestia co #390 cz. B "diagnoza endTurn").
4. Brak testu wielu jednostek / przepelnienia ekranu (punkt e, czesc przewijania).
5. Brak wizualnego zrzutu okna bez nakladki zwyciestwa (punkt f).

DEFEKTY R-WEB: brak potwierdzonego defektu w zakresie zmierzonym (a, b, c). Brak zglaszania R-WEB-* w tej rundzie.

RUNDY: 1/5 (Operator HAIKU).
NASTEPNY KROK: (1) FC (Sonnet) - potwierdzic odczyt (d) przez rodzica .pb-weak i powtorzyc 1280x800 z 3+ jednostkami dla (e); (2) runda 2 Operatora: stabilny klik zaznaczenia + izolacja gold/hunger (osobny przebieg dla kazdej kary z jawnym odczytem stanu) + zrzut bez nakladki zwyciestwa (zamknac/ukryc ekran konca gry w tescie, bez zmiany gra/src).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA (poza zakresem, bez tworzenia sesji):
- Ekran "ZWYCIĘSTWO" (koniec gry) pojawia sie w playtescie mapa po kilku turach/zdarzeniach - utrudnia zrzuty; warto sprawdzic, czy warunek zwyciestwa jest oczekiwany w playtescie mapa.
- Zaznaczanie jednostki klikiem w heks: selectedId pozostaje null po kliku w focus-owany heks gracza - kandydat na osobny temat diagnostyczny (hit-test), jesli zaznaczenie mysza ma byc zakladane w testach live.
