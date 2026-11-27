STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PLAYER-LASTCITY-REVOLT-Q1 (tag PLRREVOLT)
GOAL: pomiar, czy gracz może stracić OSTATNIE miasto przez bunt i jak często; mechanizm zmiany właściciela miasta gracza w t29 (V4 normal/normal, seed 4242); skutek w UI. Zero zmian gra/src, zero zmiany balansu.
BAZA: origin/main 2e50241cd; kandydat obrony 858b4c981 (git merge-base potwierdzony przy checkout --detach 858b4c981). Kod gry bez zmian: `git diff --stat -- gra/src gra/data` = 0 wierszy.

ZMIANY/COMMIT: w tej rundzie obrony dodano (tylko ścieżki allowlisty):
- dyspozycje/analizy/GRACZ-BUNT-OSTATNIE-MIASTO-2026-11-27.md (nowy; brakował w 858b4c981, zarzut 6)
- gra/tools/plrrevolt-table.cjs (nowy; tabela 10 biegów z zapisów jsonl.gz, tylko odczyt, zarzuty 1, 3, 9)
- dyspozycje/autobot/runs/R-WEB-PLAYER-LASTCITY-REVOLT-Q1/analiza-zapisow-aibal2.txt (przywrócony z cd587eb82, dane zewnętrzne AIBAL2, zarzut 3)
- dyspozycje/autobot/runs/R-WEB-PLAYER-LASTCITY-REVOLT-Q1/30-obrona-claude.md (ten raport)
Commit tylko tych ścieżek (git add <ścieżka>, bez -A). SHA: pole sha w odpowiedzi.

ODPOWIEDŹ NA ZARZUTY (każdy: PRZYJMUJĘ z poprawką albo ODRZUCAM z dowodem):
1. PRZYJMUJĘ (poprawka w dokumencie §2). Dane: w normalny-s7 licznik owner 1 15→16 w t58 przy citiesAll 169→169; owner −1 nie jest w liście `owners` (liczy się tylko w diag.ownersOfCities), więc zmiana 0→−1 nie jest widoczna w liczniku. Wniosek „podbój przez AI owner 1” wycofany; przyczyna NIE ROZSTRZYGNIĘTA. Zdarzenie „Barbarzyncy … city0” nie ma numeru tury i identyfikator city0 może dotyczyć innego miasta; zapis to zaznaczony. Brak dowodu przyczyny = przyjęte.
2. PRZYJMUJĘ. Runner gra/tools/plrrevolt-run.cjs = kopia aibal2-measure-run.cjs + zapis konsoli. Brak zapisu zmian ownerId miast gracza z przyczyną, Porządku i jednostek barbarzyńców w promieniu 3. Nie dopisano w tej rundzie (wymaga zmiany gra/src, poza zakresem); wpisane jako NIE ZMIERZONO. Nowe narzędzie gra/tools/plrrevolt-table.cjs odtwarza wyłącznie to, co jest w zapisie tury (ownersOfCities, liczniki miast, jednostki gracza).
3. PRZYJMUJĘ. Porządek gracza (min/śr) w biegach PLRREVOLT: NIE ZMIERZONO (zapisy jsonl nie zawierają pól Porządku dla właściciela 0; cityOrderState w main.ts to lokalna mapa bez hooka). Zakres 26–49% z dokumentu r1 pochodzi z zapisów AIBAL2 (analiza-zapisow-aibal2.txt jest w tej ścieżce), nie z biegów PLRREVOLT, i w tej rundzie NIE został odtworzony narzędziem; w dokumencie oznaczony jako niezweryfikowany.
4. PRZYJMUJĘ. Mechanizm t29 (owner −1 dla city0 w V4/4242) NIE ZIDENTYFIKOWANO w kodzie. Potwierdzone liniami: pętla buntu (main.ts:45254 rebelByPlayer, :45289 komunikat buntu gracza) i `shouldStartCityRebellion` (society-breakdown.ts:522-533) nie prowadzą do −1; jedyne przypisanie −99 to main.ts:41836 (transfer) i :31628 (hak testowy). Etykieta „Bunt skrajny” przy −1 i flaga „osiedle” NIE WYJAŚNIONE (zapisane jako NIE WYJAŚNIONE, bez tezy). Nie wskazywałem linii przejęcia przez barbarzyńców, bo nie zweryfikowano jej w tej rundzie.
5. PRZYJMUJĘ. Skutek w UI NIE ZMIERZONO na żywo (ekran porażki: pokazEkranPorazki main.ts:39043, wywołania :39055-39061; rodzaj 'przegrana' victory.ts:217). Runner pracował z suppressVictory, więc kontynuował tury; ekranu nie odczytywałem. Próba obowiązkowa r2 NIE została wykonana w tej rundzie — to się przyznaje (dokument §4).
6. PRZYJMUJĘ. Dokument dyspozycje/analizy/GRACZ-BUNT-OSTATNIE-MIASTO-2026-11-27.md powstał w tej rundzie (wcześniej tylko w cd587eb82). Moja wcześniejsza uwaga „dispatch nie wymagał dokumentu” była BŁĘDNA: dispatch pkt 5 i DODATEK pkt 5 go wymagają.
7. PRZYJMUJĘ i WYKONANO. Bramki uruchomione w tej rundzie (node_modules zainstalowane przez `npm ci --ignore-scripts` w gra/, ~4 s z cache):
   - `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0 (34,6 s)
   - `node tools/logic-test.cjs` → „LOGIC OK (213/213)”, exit 0
   - `node tools/ai-test.cjs` → „ai-test: 297 passed, 0 failed”, exit 0
8. PRZYJMUJĘ. Surowy run.log z readbackiem ustawień nie jest w commicie i nie da się go teraz odtworzyć z artefaktów; wartości z 10-operator (kultura AI trudny, pace wysoki, difficulty hard, dyplomacja trudna) są wpisane jako NIEPOTWIERDZONE ARTEFAKTEM. Maksimum przyjęte: Trudny (najwyższy poziom trudności w menu), tempo kosztów jednostek wysoki (najwyższy), dyplomacja trudna (najwyższa), kultura AI trudny; kultura gracza łatwy/normalny/trudny jako zmienna pomiaru.
9. PRZYJMUJĘ. Wniosek „częstość buntu gracza 0/9” wycofany i zastąpiony: 0 zaobserwowanych buntów gracza w 10 biegach (zapisy i zdarzenia konsoli; tabela plrrevolt-table.cjs), przy graczu pasywnym (1 miasto, 0 jednostek wojskowych). Nie ma podstawy do oszacowania częstości buntu.

WYNIKI (liczby z surowego wyjścia gra/tools/plrrevolt-table.cjs, 10 biegów):
- utrata miast gracza: V4-normalny-normalny-s4242 t29; latwy-s7 t59; normalny-s7 t58; pozostałe 7 biegów bez utraty do t60 (ostatnia tura t60; V4 t35).
- wpisy [Rebelia] dotyczące miasta gracza: 0; miasto gracza w ownersOfCities z −99: 0 biegów.
- przyczyna utraty: NIE ROZSTRZYGNIĘTA (zob. odp. 1).

TESTY:
- tsc --noEmit: exit 0.
- logic-test: 213/213.
- ai-test: 297 passed, 0 failed.
- Live (Chromium) w tej rundzie: NIE URUCHOMIONO (nie powtarzano biegów; zarzuty 2, 3, 5, 8 przyjęte jako NIE ZMIERZONO).
- Poziom maksymalny: wg 10-operator (zob. odp. 8), nieweryfikowalne artefaktem.

BLOKADY:
(a) Porządek gracza NIE ZMIERZONO (brak hooka odczytu bez zmiany gra/src).
(b) Mechanizm owner −1 w t29 NIE ZIDENTYFIKOWANY.
(c) Skutek w UI po utracie ostatniego miasta NIE ZMIERZONO.
(d) Zapis per miasto (kto przejął miasto) niedostępny w zapisach — wymaga zmiany gra/src (hak tylko do odczytu, osobny temat z zgodą orkiestratora).
(e) Runner z przechwytywaniem zmian ownerId / Porządku NIE dopisany w tej rundzie.

RUNDY: obrona rundy 2 (wg FC zużyte 2/5; ta obrona odpowiada na zarzuty 1–9 bez nowego biegu żywego).
ZAŁOŻENIA: (1) owner −1 = barbarzyńcy wg BARBARIAN_OWNER_ID (barbarians.ts:51), bez dowodu przyczyny przejęcia; (2) liczniki owner 1 w zapisach tury nie rozstrzygają, kto przejął miasto; (3) „zapis tury” = rekord jsonl jednej tury, bez śladu per miasto.

UWAGI-DLA-ORKIESTRATORA:
1. Jeśli trzeba zamknąć mechanizm t29, Porządek gracza i UI: osobny temat ze zmianą gra/src (hak tylko do odczytu: owner-change z przyczyną, cityOrderState, stan ekranu porażki), z zgodą orkiestratora.
2. Gra/tools/plrrevolt-run.cjs i plrrevolt-summarize.cjs pochodzą z r2 i nie są wersją z dispatchu (cienka nakładka); summarize czyta nieskompresowany katalog out — do użycia trzeba rozpakować zapisy.
3. Zapisy biegów w dane/ mają Porządek tylko w formie wypisanej w AIBAL2 (analiza-zapisow-aibal2.txt, inny zestaw biegów).

NASTĘPNY KROK: orkiestrator decyduje, czy otworzyć temat z hakiem do odczytu (punkt 1 uwag); pytanie o ochronę ostatniego miasta gracza przed buntem dopiero po pomiarze (wg zasad ABC).
DEPLOY/PUSH: NIE WYKONANO
