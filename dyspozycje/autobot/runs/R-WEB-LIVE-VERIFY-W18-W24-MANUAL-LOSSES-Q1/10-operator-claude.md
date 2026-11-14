STATUS: PASS-WITH-NOTES (runda 3: punkt 1 / W18 zmierzony w zywej grze = PASS; punkty 2 i 3 bez zmian wzgledem r1/r2)
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1
GOAL: dowod w zywej grze: (1) W18 machiny oblezenicze przed/po techu, (2) W24 lewy baner (zamkniete r1/r2), (3) straty zwyciezcy w bitwie (zamkniete r2/r3 obrony).
BAZA: 2fffcab26 (origin/main), worktree wf_435ffc79-d22-1, runda 3/5, Operator SONNET (uzasadnienie w dodatku: dwie nieudane rundy Haiku).

ZMIANY/COMMIT:
- gra/src/main.ts: MINIMALNY hak pomiarowy w istniejacym obiekcie `window.__siegeBadgeTestDebug` (instalowany WYLACZNIE przy ?civTest=1): `startPlayerSiege(cityId)`, `setResearchedTechs(names)`, `siegeOptions(cityId)`, `fundPlayer(gold)`. Zero logiki gry w hakach — deleguja do REALNYCH `classifyCityAttack` + `startMapSiege` (ta sama sciezka co przycisk "Oblegaj"), `ownerResearchedTechs(0)`, `siegeEngineOptions` + `visibleSiegeEngineOptions`, `setOwnerTreasury`.
- gra/tools/live-verify-w18-w24-manual-losses-w18r3.cjs (nowy skrypt pomiarowy).
- evidence/w18-r3-oblezenie-przed-po.json (surowy JSON, DOM i bramka OSOBNO) + 5 zrzutow evidence/w18-r3-F*.png.
- ten plik. Bez zmian w gra/data, WERSJE.md, gra-robocza/, rust-port/.

DLACZEGO HAK BYL NIEZBEDNY (konkretny powod techniczny, nie "brak haka"):
1. Panel budowy machin (siegeMapPanel.ts, blok `[data-siege-engine-build]`) jest zasilany przez `getSiegeEngineOptions` (main.ts ~18590), ktore zwraca opcje WYLACZNIE gdy besieger `isMe` (ownerId gracza). Oblezenie gracza startuje tylko z gestu: klik miasta -> `showCityAttackChoice` -> `startMapSiege` (domkniecie main.ts, brak eksportu).
2. Sciezka bez gestu, wskazana w dodatku, NIE obsluguje tego przypadku: `?playtest=oblezenie-duze` (main.ts ~46774) wywoluje `launchBigPresetBattle` i konczy — to arena taktyczna, nie oblezenie na mapie; `detectAutoSiegeOnCity` w presecie (~46996) dotyczy tylko miasta GRACZA, ktore oblega AI (besieger = AI, `isMe` = false => panel gracza nie ma listy machin); skan AI po turze (`scanAutoSiegesAfterAiTurn`, ~18667) oblega miasta, a `autoSiegeCandidateForScan` zwraca null dla besiegera-czlowieka. Zatem zadna sciezka bez gestu nie otwiera panelu machin DLA GRACZA jako oblegajacego.
3. `__siegeBadgeTestDebug.setSiege` ustawia tylko `city.oblegane`, bez `oblegajacyOwnerId`, wiec `getSiegeEngineOptions` zwraca [] — niewystarczajace.
4. `unlockAllTech` nie izoluje technologii; potrzebny hak ustawiajacy kontrolowany zestaw.

SCENARIUSZ (W18): `?playtest=oblez&civTest=1`, Chromium (vite build z tego kandydata, poza repo, /tmp/claude-0/w18r3/dist, serwer HTTP na losowym porcie). Wrogie, obwarowane miasto Ateny (id city0, AI 1, maMur, wojna ustawiona przez preset) + jednostka gracza (Hastati) przy murze (q16,r8); dodano 10 jednostek gracza na tym heksie (Armia bez machin: 11, pula 1 machiny/ture). Dla kazdej fazy: `setResearchedTechs(zestaw)` -> `startPlayerSiege('city0')` (panel oblezenia otwiera sie realnym `showSiegeMapPanel`) -> odczyt DOM panelu + odczyt bramki -> zrzut -> "Odwrot" (realny przycisk). Panele dyplomacji: zamkniecie nakladek przed zrzutem (brak otwartych; na zrzutach widac tylko ikone dyplomacji z licznikiem, panel zamkniety) — zrzuty OBEJRZANE (F0, F1), bez nakladek.

WYNIK W18 (zrodlo: evidence/w18-r3-oblezenie-przed-po.json; 5 faz x 4 machiny = 20 sprawdzen, wszystkie ok=true):
| Faza (zestaw technologii gracza) | Taran (Obrobka drewna) | Taran okuty (Brazownictwo) | Wieza oblezn. (Brazownictwo) | Katapulta (Sztuka wojenna) |
|---|---|---|---|---|
| F0 brak technologii | NIEWIDOCZNY | NIEWIDOCZNY | NIEWIDOCZNY | NIEWIDOCZNA (caly blok "Zbuduj machine" usuniety z panelu) |
| F1 tylko Obrobka drewna | WIDOCZNY | niewidoczny | niewidoczna | niewidoczna |
| F2 tylko Brazownictwo | niewidoczny | WIDOCZNY | WIDOCZNA | niewidoczna |
| F3 Obrobka drewna + Brazownictwo | widoczny | widoczny | widoczna | niewidoczna |
| F4 + Sztuka wojenna | widoczny | widoczny | widoczna | WIDOCZNA |
- DOM i bramka (siegeEngineOptions/visibleSiegeEngineOptions na realnym stanie gry) zgodne w 20/20 przypadkow, zapisane osobno w JSON (`domPanel` vs `gateOptions`).
- Przyklad DOM F1: `Taran · 7 ¤ + 19 Drewno`; F4: Taran, Taran okuty, Katapulta (36 ¤ + 152 Zelazo), Wieza oblezn. Bramka dla niewidocznych: reason=technology_locked.
- WERDYKT W18: PASS (machina niedostepna przed techem, dostepna po nim; brak przypadku "dostepna przed" ani "niedostepna po").
- Ograniczenie pomiaru (jawne): `allowed=false`, reason `insufficient_resources` dla widocznych machin — preset ?playtest=oblez nie ma miasta gracza, wiec brak magazynu surowcow panstwa (stock liczony po miastach gracza); skarbiec 5000 ustawiony, ale surowca nie ma gdzie wpisac. Faktyczna BUDOWA machiny (klik przycisku) NIE zostala wykonana. Widocznosc (to jest tresc W18) zmierzona; zdolnosc zbudowania z surowcami = NIE_ZMIERZONO (powod: brak miasta gracza w presecie).
- Obserwacja wizualna (nie naprawiana, kandydat na osobny temat R-WEB-*): przy 1280x800 i widocznym bloku "Zbuduj machine w oblezeniu" panel oblezenia nie miesci sie w wysokosci okna — przyciski Oblegaj/Szturm/Odwrot sa przyciete u dolu (zrzut w18-r3-F1-...png), ponizej stopki. W F0 (bez bloku) miesci sie.
- Stare evidence r2 (w18-rekrutacja.json, panel rekrutacji) zostaje; r3 go zastepuje jako dowod W18.

PUNKT 2 (W24 lewy baner): bez zmian (r1/r2) — brak poziomego przewijania przy 1000x700, 800x600, 640x480; pionowa anomalia 800x600 (top -6 px) = osobny temat R-WEB-* (W83), nie ruszano.
PUNKT 3 (straty zwyciezcy): bez zmian w tej rundzie (dispatch r3: zakres tylko punkt 1); dane w evidence/w3-straty-zwyciezcy-r2.json i r3.json z poprzednich rund.

TESTY (liczby z surowego wyjscia):
- npm ci w gra/: 71 pakietow.
- `npx tsc --noEmit`: 0 bledow (po dodaniu hakow).
- `npx vite build --outDir /tmp/claude-0/w18r3/dist` (poza repo): EXIT 0, index.html 14 677 770 B.
- tools/live-verify-w18-w24-manual-losses-w18r3.cjs: VERDICT PASS, errors=[] (0 bledow strony), 20/20 sprawdzen ok.
- Bramki referencyjne: logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6 pass, 0 fail.
- git diff --check: sprawdzony przed commitem (wynik: czysty — patrz pole odpowiedzi).

BLOKADY: brak. Ograniczenia opisane wyzej (budowa realnej machiny nie wykonana — brak miasta gracza w presecie; panel przycina sie przy 800 px wysokosci).

RUNDY: 3/5.

NASTEPNY KROK: Evaluator -> Obrona -> Final Control. Do rozstrzygniecia przez orkiestratora: (a) czy domknac "budowe machiny" scenariuszem z miastem gracza (pelna gra + hak), (b) osobny temat R-WEB-* na przycinanie panelu oblezenia przy niskich oknach, (c) hak jest w produkcyjnym main.ts pod bramka ?civTest=1 (precedens __siegeBadgeTestDebug) — Final Control decyduje, czy go zachowac.

DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Hak dodany do istniejacego `__siegeBadgeTestDebug` (ta sama bramka `/[?&]civTest=1/`), w produkcji brak powierzchni.
- Pliki zbudowane w /tmp/claude-0/w18r3 (dist ~100 MB) — usuniete po pracy.
- Dispatch r3: sciezka "preset oblezenie-duze sam startuje oblezenie gracza" jest nieprawdziwa dla panelu machin gracza (patrz uzasadnienie wyzej) — prosze skorygowac przyszle dodatki.
