TEMAT: R-MIASTA-PANSTWA-PASYWNOSC-ROZSZERZENIE-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/main.ts, gra/src/game/ai.ts
MODEL+EFFORT: claude-sonnet-5, effort high

WYZWALACZ (zgłoszenie właściciela, 2026-09-03)
"Sprawdź, jakie dodatkowe elementy są w trudności państw-miast, bo tam były jeszcze parametry
wspólnej walki, sojuszu, czy mają być obronne, czy atakujące, oraz punktów zbiorczych. Sprawdź,
co jest i czy czasem nie zostało to w kodzie wyłączone, bo ostatnio te państwa-miasta funkcjonują
zbyt pasywnie." — po recon orkiestratora (potwierdzającym że NIC nie zostało wyłączone przez 3
ostatnio zintegrowane tematy miast-państw, pasywność jest strukturalnym zakresem istniejącego
mechanizmu) właściciel wybrał ECHO: "Postawa ofensywna też na normal/easy" +
"Punkty zbiorcze (army-concentration) też dla miast-państw". Trzecia opcja ("postawa ofensywna
dla wszystkich typów cywilizacji, nie tylko typu gracza") NIE została wybrana — POZA ZAKRESEM
tej rundy.

RECON (wykonane przez orkiestratora — nie powtarzaj, zweryfikuj i buduj na tym)
- Flaga `cityStateOffensiveSupport` (`gra/src/game/ai.ts`, typ w `AITurnOpts`) jest ustawiana w
  `gra/src/main.ts:29096-29100`:
  ```
  cityStateOffensiveSupport: typCityCopyOwners.has(ownerId)
      && isOwnerPlayerSameCivType(ownerId)
      && _menuCityStateDifficultyVsPlayer === 'hard',
  ```
  Konsumowana w wielu miejscach `ai.ts` (produkcja militarna ~linia 1425, próg fali ataku
  `ai.ts:3294-3308`, marsz ofensywny `ai.ts:3373-3398`) — JEDEN punkt ustawienia flagi steruje
  wszystkimi tymi zachowaniami. Komentarz źródłowy `main.ts:29096`: "Trudny MP: aktywne wsparcie
  ofensywne (Normal/Easy = legacy defend-only)".
- Mechanizm punktów zbiorczych: `planArmyConcentration`/`planArmyFrontMerge`
  (`gra/src/game/army-concentration.ts`), wołane w `ai.ts:2662-2666` i `ai.ts:2696-2726`, oba
  gated `isMajorAiOwner(opts)` (`ai.ts:1153-1155`, `= !opts.defensiveCopy`) — miasta-państwa
  (które mają `opts.defensiveCopy=true`) NIGDY nie wchodzą w te dwie gałęzie, od wprowadzenia
  modułu (komentarz `ai.ts:2658-2661`: "this call only gates the main-civilization path").
  Namiastka dla PM to wyłącznie prosty licznik-w-promieniu (`countFriendlyMilitaryInRadius`,
  `CS_WAVE_ATTACK_RADIUS=3`, `ai.ts:3007-3017`), używany pod `offensiveSupport` w bramce fali
  ataku (`ai.ts:3267-3306`) — NIE organizuje faktycznego marszu do wspólnego punktu.
- `warAllyOwnerIds` (realne sojusze bojowe między PM a innym ownerem, `main.ts:29101-29109`) i
  `isOwnerPlayerSameCivType` (`main.ts:7742-7747`) — NIE dotykane w tej rundzie (poza zakresem,
  właściciel nie wybrał tej opcji).
- Posiłki obronne między "siostrzanymi" miastami-państwami (`ai.ts:3330-3369`,
  `opts.sisterCityStates`) i auto-formowanie sojuszu sióstr przy zagrożeniu
  (`formSisterAlliancesIfThreatened`, `main.ts:16936-16999`) — działają już dziś bez ograniczenia
  trudności/typu cywilizacji. Zero zmian w tej rundzie.

GOAL
1. Usunąć warunek `_menuCityStateDifficultyVsPlayer === 'hard'` z wyrażenia ustawiającego
   `cityStateOffensiveSupport` (`main.ts:29096-29100`) — flaga ma być `true` dla miast-państw
   typu gracza NIEZALEŻNIE od poziomu trudności MP-vs-gracz (normal/easy/hard jednakowo). Zero
   zmian w `isOwnerPlayerSameCivType(ownerId)` — ten warunek zostaje. Zero zmian w miejscach
   KONSUMUJĄCYCH flagę (produkcja/próg fali/marsz) — sama zmiana punktu ustawienia wystarcza,
   bo cała reszta już poprawnie reaguje na wartość flagi.
2. Rozszerzyć dostępność `planArmyConcentration`/`planArmyFrontMerge` (`ai.ts:2662-2726`) na
   miasta-państwa z aktywnym `opts.cityStateOffensiveSupport` — czyli warunek bramkujący te dwa
   wywołania ma stać się `isMajorAiOwner(opts) || opts.cityStateOffensiveSupport` (albo
   równoważna, jaśniejsza forma — Operator decyduje o dokładnym kształcie, np. nowa funkcja
   pomocnicza `canConcentrateArmy(opts)`, uzasadnia wybór w raporcie). Miasta-państwa BEZ
   aktywnego wsparcia ofensywnego (defend-only) NADAL nie korzystają z tego mechanizmu — to
   celowe, żeby nie ciągnąć jednostek obronnych z murów do rajdu. Sprawdź czy
   `excludedUnitIds: new Set(homeDefenderAssignments.keys())` (już istniejący mechanizm ochrony
   obrońców domu) poprawnie działa też dla miast-państw — jeśli `homeDefenderAssignments` jest
   pusty/inny dla PM, zbadaj i udokumentuj w raporcie (nie zgaduj).

KRYTERIA KOŃCA (binarne)
1. Test jednostkowy: dla `_menuCityStateDifficultyVsPlayer` = 'normal' i 'easy' (oddzielne
   przypadki), miasto-państwo typu gracza dostaje `cityStateOffensiveSupport: true` (dziś:
   `false`) — bezpośrednie wywołanie funkcji budującej opts lub odpowiedniej jej części, żywy
   dowód zmiany zachowania przed/po.
2. Miasto-państwo INNEGO typu cywilizacji niż gracz nadal dostaje `cityStateOffensiveSupport:
   false` niezależnie od trudności (regresja zerowa dla `isOwnerPlayerSameCivType`).
3. `planArmyConcentration`/`planArmyFrontMerge` są wołane dla miasta-państwa gdy
   `opts.cityStateOffensiveSupport === true` (dziś: nigdy wołane dla PM) — bezpośredni test
   funkcji decyzyjnej (nie tylko odczyt kodu) pokazujący że dla takiego ownera funkcja generuje
   polecenia ruchu ku punktowi zbiorczemu, których wcześniej (na kodzie sprzed zmiany) nie było.
4. Miasto-państwo BEZ `cityStateOffensiveSupport` (defend-only) NADAL nie wchodzi w te dwie
   gałęzie — zero regresji istniejącego zachowania defensywnego.
5. Pełnoprawne cywilizacje AI (`isMajorAiOwner(opts)===true`) zachowują dokładnie dotychczasowe
   zachowanie punktów zbiorczych — zero regresji.
6. Żywy test Chromium (Playwright, wzorem istniejących testów forced-war/city-state w
   `gra/tools/`) potwierdzający że miasto-państwo z aktywnym wsparciem ofensywnym na trudności
   "normal" faktycznie prowadzi ofensywne działania (atak/marsz ku wspólnemu punktowi), których
   nie prowadziło przed zmianą — nie tylko test jednostkowy na wyizolowanych funkcjach.
7. `tsc --noEmit` czysty, wszystkie istniejące testy dotyczące miast-państw i AI (grep
   `gra/tools/*city-state*-test.cjs`, `gra/tools/*cs-*-test.cjs`, testy koncentracji armii)
   nadal zielone, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/main.ts (WYŁĄCZNIE wyrażenie ustawiające `cityStateOffensiveSupport`,
  `main.ts:29096-29100` — żadnych innych zmian w tym pliku).
- gra/src/game/ai.ts (WYŁĄCZNIE warunek bramkujący `planArmyConcentration`/`planArmyFrontMerge`,
  `ai.ts:2662-2726`, ewentualna nowa funkcja pomocnicza analogiczna do `isMajorAiOwner`).
- Nowe/rozszerzone testy w gra/tools/*-test.cjs (jednostkowe + żywy Playwright).
Zakazane bezwzględnie: gra/src/game/army-concentration.ts (sama logika planowania — jeśli
Operator uzna zmianę tam za konieczną, DECISION_REQUIRED zamiast modyfikacji), zmiana
`warAllyOwnerIds`/`isOwnerPlayerSameCivType` (poza zakresem tej rundy), zmiana logiki posiłków
sióstr (`sisterCityStates`, `formSisterAlliancesIfThreatened`), zmiana capów produkcji militarnej
z `R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1` (osobny, już zamknięty temat), dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json.

IZOLACJA
worktree /home/user/wt-miasta-panstwa-pasywnosc, gałąź
autobot/R-MIASTA-PANSTWA-PASYWNOSC-ROZSZERZENIE-Q1, baza jawnie: origin/main (najnowszy commit
na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona kompilacja to
node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 6 (żywy test Chromium) za spełnione bez faktycznego zrzutu/logu z
uruchomionej gry pokazującego zmianę zachowania AI miasta-państwa (np. log ruchu/ataku) — sam
fakt że `planArmyConcentration` ZOSTAŁO WYWOŁANE (widoczne w kodzie) nie jest dowodem że
faktycznie zmienia to obserwowalne zachowanie w rozgrywce. Zakaz zakładania że rozszerzenie
punktów zbiorczych na miasta-państwa jest bezpieczne wydajnościowo bez sprawdzenia — jeśli test
z wieloma miastami-państwami na mapie (np. "duża"/"ogromna") pokazuje zauważalny spadek
wydajności tury, zgłoś to jako BLOKADY zamiast przemilczeć.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora.
