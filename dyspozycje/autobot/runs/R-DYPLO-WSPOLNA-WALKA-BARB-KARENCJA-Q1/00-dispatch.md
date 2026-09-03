TEMAT: R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/game/diplomacy-barbarian-cooperation.ts, gra/src/game/diplomacy-proposals.ts
(budowa deala 'granice'), gra/src/game/diplomacy-treaties.ts (removeTreaty/wygasanie),
gra/src/game/diplomacy-border-march.ts (applyUnauthorizedBorderPenalties/
hasAuthorizedBorderCrossing), gra/src/ui/diplomacyTradeBasket.ts (formularz, case '4')
MODEL+EFFORT: claude-sonnet-5, effort high (nowa mechanika stanu — okres karencji — nie
tylko UI; wymaga starannego recon przed implementacją)

WYZWALACZ (dosłownie od właściciela, korekta wcześniejszego zamierzenia)
"Wspólna walka z barbarzyńcami miała być oddzielną umową, którą można podpisać na 5, 10,
15 tur lub na czas nieokreślony, aż do momentu, w którym jedna ze stron ją usunie. Czas
trzech tur miał być wtedy, kiedy wygaśnie umowa wspólnej walki z barbarzyńcami; był to
czas bez kary, dający możliwość powrotu jednostkom wojskowym na własne terytorium lub
wyprowadzenia ich z terytorium innej cywilizacji, aby nie płacić kar. Więc jest tu pewne
nieporozumienie."

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji)
- Dzisiejsza implementacja: `BARBARIAN_COOPERATION_TURNS = 3`
  (`diplomacy-barbarian-cooperation.ts:11`) użyte JAKO CAŁY CZAS TRWANIA umowy —
  `wygasaTura: ctx.turn + BARBARIAN_COOPERATION_TURNS` w `buildDeal(...)` wywołaniach
  (`diplomacy-proposals.ts:1492, 1880`). Po 3 turach traktat znika CAŁKOWICIE z
  `activeDeals` (`diplomacy-treaties.ts:220`, `d.wygasaTura > turn` filtr) — traci się
  RÓWNOCZEŚNIE prawo przemarszu wojskowego I współpracę bojową. To niezgodne z
  zamierzeniem właściciela.
- `hasAuthorizedBorderCrossing` (`diplomacy-border-march.ts:109-146`) sprawdza
  `hasTreaty(...)`/`WspolnaWalkaBarbarzyncy` — TYLKO obecność traktatu w `activeDeals` w
  BIEŻĄCEJ turze. Kara nalicza się przez `applyUnauthorizedBorderPenalties`
  (linie 153-184), wołane co turę per para z jednostkami na cudzym terytorium — nie ma
  dziś ŻADNEGO pojęcia "okres karencji po wygaśnięciu/usunięciu traktatu".
- `removeTreaty(state, id)` (`diplomacy-treaties.ts:215`) — istniejąca funkcja usuwania
  traktatu PO ID; sprawdź reconem, gdzie/czy jest dziś wołana dla akcji JEDNOSTRONNEGO
  zerwania przez gracza/AI (może dziś nie istnieć UI do zerwania tego konkretnego
  traktatu — jeśli nie istnieje, jest to część GOAL tej rundy, nie osobny temat).
- `turnChips`/case '2' w `diplomacyTradeBasket.ts` (linie 615-623) to gotowy wzorzec UI
  wyboru czasu trwania (10/15/20/Bezterminowy) — do reużycia z wartościami 5/10/15/
  Bezterminowy dla tej umowy.
- Formularz case '4' (`diplomacyTradeBasket.ts:643-655`, świeżo po
  `P-DYPLO-PRZEMARSZ-CHECKBOX-PRZYCISK-Q1`, zintegrowane `78151c38`) ma dziś przycisk
  "Wspólna walka z barbarzyńcami (3 tury)" jako DRUGORZĘDNY toggle wewnątrz traktatu
  przemarszu, wymagający `borderMilitary` (wariant wojskowy). Właściciel mówi "miała być
  oddzielną umową" — SPRAWDŹ reconem w kodzie i (jeśli to możliwe bez naruszenia
  allowlisty) zapytaj się przez DECISION_REQUIRED, czy "oddzielna umowa" oznacza: (a)
  osobna akcja dyplomatyczna w ogóle (nowy `actionId`, poza formularzem case '4'), czy
  (b) nadal część formularza traktatu przemarszu, ale z WŁASNYM, niezależnym czasem
  trwania i możliwością zerwania niezależnie od reszty traktatu. Zalecenie orkiestratora
  (do potwierdzenia/skorygowania przez Operatora na podstawie faktycznego kosztu
  implementacji): wariant (b) jest dużo mniejszą zmianą architektury (nie wymaga nowego
  `actionId`, nowego wpisu w `diplomacy.json`, nowej pozycji na liście "Możliwe umowy")
  i nadal spełnia sedno żądania właściciela (regulowany czas + karencja) — jeśli recon
  Operatora nie znajdzie przeciwwskazań, idź tą drogą; jeśli napotka realny konflikt
  architektoniczny, zatrzymaj się z DECISION_REQUIRED zamiast zgadywać.

GOAL
1. Czas trwania umowy "Wspólna walka z barbarzyńcami" wybierany przez strony: 5, 10, 15
   tur lub bezterminowo (do jednostronnego usunięcia) — wzorzec UI identyczny jak
   `turnChips` case '2', inne wartości. Zastępuje dzisiejszy sztywny
   `BARBARIAN_COOPERATION_TURNS` jako czas trwania (stała zostaje, ale zmienia
   ZNACZENIE — patrz GOAL 2).
2. `BARBARIAN_COOPERATION_TURNS` (lub nowa, jaśniej nazwana stała) staje się długością
   OKRESU KARENCJI PO WYGAŚNIĘCIU LUB JEDNOSTRONNYM USUNIĘCIU traktatu — przez te 3 tury
   `hasAuthorizedBorderCrossing`/`applyUnauthorizedBorderPenalties` NADAL traktują parę
   jak autoryzowaną (brak kary Zaufania), dając czas na wycofanie jednostek wojskowych.
   Wymaga nowego stanu: kiedy traktat wygasł/został usunięty, per para stron, i do
   której tury trwa karencja — zaprojektuj minimalną strukturę danych (np. osobna mapa
   `barbarianCooperationGraceUntilTurn` per para, persystowana tam, gdzie dziś żyje
   `activeDeals`) — NIE musi być częścią samego `ActiveDeal`, traktat już nie istnieje w
   tym oknie.
3. Jeśli dziś NIE ISTNIEJE UI do jednostronnego zerwania tego konkretnego traktatu
   (poza wygaśnięciem czasowym) — dodaj minimalny przycisk/akcję zerwania w panelu
   "Aktywne traktaty" (`diplomacyAudience.ts`, jeśli tam żyje lista aktywnych traktatów —
   potwierdź reconem) analogicznie do istniejących wzorców zrywania innych traktatów,
   jeśli takie istnieją; jeśli nie istnieją dla ŻADNEGO traktatu, zatrzymaj się z
   DECISION_REQUIRED zamiast projektować od zera nieopisaną funkcję.
4. Zero zmian w LOGICE samej współpracy bojowej (`collectBarbarianCooperationUnits`,
   promień 2, symetria) — WYŁĄCZNIE czas trwania i okres karencji.
5. Zero zmian w wymogu `barbarianCooperation` → `borderMilitary` (Respekt≥55) — poza
   tym punktem allowlisty, chyba że recon jednoznacznie wykaże że to WYMAGA rozłączenia
   dla wariantu (a)/(b) z RECON — w takim wypadku DECISION_REQUIRED, nie samodzielna
   decyzja.

KRYTERIA KOŃCA (binarne)
1. Żywy render w Chromium: formularz pozwala wybrać czas trwania (5/10/15/Bezterminowy)
   dla "Wspólna walka z barbarzyńcami", zawarty traktat ma ten wybrany czas jako
   `wygasaTura` (lub `null` dla bezterminowego) — NIE sztywne 3 tury.
2. Test jednostkowy: para z wygasłym/usuniętym traktatem WspolnaWalkaBarbarzyncy w
   ostatnich 3 turach NIE dostaje kary Zaufania za przemarsz wojskowy (okres karencji);
   po 3 turach od wygaśnięcia/usunięcia kara wraca do naliczania normalnie.
3. Test: jednostronne usunięcie traktatu (jeśli GOAL 3 wymagał nowego UI) faktycznie
   usuwa traktat z `activeDeals` i uruchamia ten sam mechanizm karencji co naturalne
   wygaśnięcie.
4. Zero regresji na istniejących testach (`diplomacy-border-march-test.cjs`,
   `diplomacy-barbarian-cooperation-test.cjs`, `diplomacy-basket-edit-test.cjs`,
   testy formularza traktatu przemarszu z poprzednich rund tego obszaru).
5. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test,
   research-test, unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/diplomacy-barbarian-cooperation.ts
- gra/src/game/diplomacy-proposals.ts — WYŁĄCZNIE budowa deala 'granice'/`buildDeal`
  wywołania dot. WspolnaWalkaBarbarzyncy (linie ok. 1457-1506, 1867-1892) i nazwane
  stałe czasu trwania.
- gra/src/game/diplomacy-treaties.ts — WYŁĄCZNIE jeśli wymaga rozszerzenia
  `removeTreaty`/nowej struktury karencji, z jasnym uzasadnieniem w raporcie.
- gra/src/game/diplomacy-border-march.ts — WYŁĄCZNIE `hasAuthorizedBorderCrossing`/
  `applyUnauthorizedBorderPenalties` (uwzględnienie okresu karencji).
- gra/src/ui/diplomacyTradeBasket.ts — WYŁĄCZNIE case '4' (wybór czasu trwania zamiast
  prostego przycisku toggle dla tej jednej umowy).
- gra/src/ui/diplomacyAudience.ts — WYŁĄCZNIE jeśli GOAL 3 wymaga nowego przycisku
  zerwania w panelu "Aktywne traktaty", i tylko jeśli wzorzec dla innych traktatów już
  istnieje (kopiuj wzorzec, nie projektuj nowego).
- Nowe lub rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana wymogu
Respekt≥55 dla wariantu wojskowego, zmiana promienia/logiki
`collectBarbarianCooperationUnits`, zmiana innych case'ów formularza traktatu.

IZOLACJA
worktree /home/user/wt-dyplo-barb-karencja, gałąź
autobot/R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1, baza jawnie: origin/main (najnowszy
commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-dyplo-barb-karencja --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 2 (okres karencji) za spełnione bez żywego testu z jawną turą
wygaśnięcia i sprawdzeniem kary W KAŻDEJ z 3 tur karencji ORAZ w turze 4 (kara wraca) —
nie tylko sprawdzenie jednej tury losowo. Zakaz projektowania nowego UI zerwania
traktatu (GOAL 3) bez potwierdzenia recon, że wzorzec dla innych traktatów istnieje —
jeśli nie istnieje, DECISION_REQUIRED zamiast wymyślania wzorca od zera bez wskazówki
właściciela.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i
TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora,
ręką orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona,
jeśli zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora →
READY_FOR_DEPLOY.
