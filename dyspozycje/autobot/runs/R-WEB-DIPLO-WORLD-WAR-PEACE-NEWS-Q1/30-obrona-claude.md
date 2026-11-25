STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WORLD-WAR-PEACE-NEWS-Q1
GOAL: Gracz widzi w dzienniku Wydarzeń wojnę / pokój między dwiema odkrytymi cywilizacjami AI; brak wpisu przy nieodkrytej; brak duplikatów dla par z graczem.
ZMIANY/COMMIT: baza c192c430dc21c2039fcc0570724639bd3499c6e4 (rewizja obrony zapisana w SHA poniżej). Pliki: gra/src/game/diplo-world-news.ts (dodana worldDiploNewsEntry — pełna decyzja i budowa wpisu, czysta funkcja), gra/src/main.ts (recordAiAiWarPeaceNews woła worldDiploNewsEntry; bramki isMe/isBarbarian/getDiplomaticContacts przekazywane jako skip/discovered; zero zmian logiki wojny/pokoju), gra/tools/diplo-world-news-test.cjs (część A wykonuje worldDiploNewsEntry na danych), ten raport.

ODPOWIEDZI NA ZARZUTY EVALUATORA (689fbf7d):
1. PRZYJMUJĘ. Część A testu nie czyta już źródła: wykonuje worldDiploNewsEntry (ta sama funkcja, którą woła main.ts) i sprawdza id, tytuł, ikonę, kind, turnCreated, brak wpisu przy jednej nieodkrytej stronie, brak wpisu przy skip (para z graczem/barbarzyńca), dedup po turze i parze. Część B (źródłowa) zostaje tylko dla bramek w main.ts (isMe/isBarbarian, getDiplomaticContacts, dedup po id, unshift). Wynik: 39/0.
2. ODRZUCAM z DOWODEM: tekst tylko PO polsku. Dowód: main.ts ok. l.27064–27070 (logPeaceVazne: title 'Pokój…'/subtitle po polsku) oraz warEventLog.unshift w recordWarDeclarationEvent — wszystkie wpisy warEventLog w main.ts są literałami PL (brak t()/i18n dla tego dziennika). Dispatch pkt 5 odsyła do „konwencji i18n projektu”; konwencja dziennika to PL, więc EN dodano by odrębny mechanizm poza zakresem tematu.
3. ODRZUCAM z DOWODEM: powód (pokój wymuszony / wojna epoki) nie jest dostępny. Dowód: main.ts:12245 `function setDiploRelation(a: number, b: number, rel: Relation): void` — brak parametru powodu; dodanie wymagałoby zmiany 63 wywołań setDiploRelation. Pole w dispatchu opcjonalne („jeśli łatwo dostępny”).
4. ODRZUCAM z DOWODEM (etykieta, nie zakres): rozejm wpisuje się (każda zmiana wojna→pokoj tworzy wpis), ale tytuł to „Pokój”. Dowód: diplomacy.ts, komentarz toRelation: „StanWojny.Rozejm | Pokoj -> 'pokoj'” — typ Relation nie ma statusu rozejmu, więc setDiploRelation nie może rozróżnić. Zmiana wymagałaby czytania stanWojny z RelacjaDyplomatyczna poza setDiploRelation (poza zakresem „tylko dopisanie wpisów”).
5. PRZYJMUJĘ jako udokumentowane (bez zmiany kodu): mechanizm to dziennik Wydarzeń (warEventLog), wpis żyje jedną turę (expireInformationalEventsBeforeTurn) i dziennik jest przycinany do 8 (trimWarEventLog). Wybór dziennika i interpretacja „obie odkryte” — DO POTWIERDZENIA przez właściciela. Nie zmieniam mechanizmu bez decyzji.
6. ODRZUCAM z DOWODEM: bunt/zdobycie nie wymaga osobnego rodzaju. Dowód: wszystkie 63 wywołania setDiploRelation (grep main.ts) przechodzą przez jedno miejsce; bunt/zdobycie zmieniający status pary daje wpis wojna/pokój przez ten sam hook; bez zmiany statusu wpisu nie ma (dispatch nie wymaga osobnego rodzaju). Uwaga do orkiestratora: ścieżki l.30305–30622 (`setDiploRelation(attackerId, oid, {...status:'neutralni'})` przy wojnie) też wywołują wpis „Pokój” — to zgodne z definicją zmiany statusu, ale może zgłaszać zakończenie wojny tam, gdzie gra traktuje to jako eliminację/przejęcie; NIE ZMIERZONO w grze.
7. ODRZUCAM z DOWODEM (nieszkodliwe, pozostaje): wpis „Sojusz po wojnie” pokryty testem (worldDiploNewsKind('wojna','sojusz') === 'sojusz', część A testu: 39/0). Usunięcie zmieniłoby wpis przy zakończeniu wojny przez sojusz na zwykły „Pokój”, co byłoby mylące.

BRAMKI (surowe wyniki z tej rundy):
- node tools/diplo-world-news-test.cjs: WYNIK PASS 39/0 (exit 0)
- npx tsc --noEmit: brak wyjścia, exit 0 (wynik czysty)
- tools/*peace*test.cjs i *truce*test.cjs (nie-live): exit 0 dla wszystkich poza: diplo-forced-peace-pending-test (exit 1, znany fail r2-3 także na bazie e2b06492 wg Evaluatora — NIE z tego tematu), diplo-forced-peace-d2-live-test, diplo-forced-peace-pending-live-paths-test (exit 1, testy live), diplo-war-peace-live-test (timeout 200 s, live). Testy live wymagają Chromium — NIE ZMIERZONO w tej rundzie.
- Mutacje z rundy Evaluatora (M1–M3) dotyczyły poprzedniej postaci hooka; po refaktorze NIE PONOWIONO. Test część B wymusza obecność wywołania recordAiAiWarPeaceNews w setDiploRelation oraz bramek skip/discovered w recordAiAiWarPeaceNews.
- Pozostałe bramki dispatchu (logic, tech-tree, research, ai-test, hotseat, hud-me-literal-zero, bramki-tmpdir): NIE URUCHOMIONE w tej rundzie — zmiana dotyka wyłącznie dopisania wpisu dziennika w jednej funkcji i nowego modułu czystego; Evaluator raportował je zielone na c192c430.

BLOKADY: brak. Testy live NIE ZMIERZONO.
RUNDY: obrona 1/5 (runda obrony zarzutów Evaluatora)
NASTĘPNY KROK: Evaluator (ponowna ocena rewizji) — po PASS Final Control; pytania do właściciela bez zmian (interpretacja „obie odkryte”, wybór dziennika Wydarzeń jako miejsca wpisu, czy „wojna” epoki/rozejm ma mieć osobną etykietę).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- gra/node_modules utworzony w worktree do uruchomienia testów (npm ci); do usunięcia po bramkach zgodnie z dispatchem.
- Pytanie do właściciela (język gry): czy wiadomość o cudzej wojnie/pokoju ma żyć jedną turę w panelu Wydarzeń, czy w trwałej liście w oknie dyplomacji.
