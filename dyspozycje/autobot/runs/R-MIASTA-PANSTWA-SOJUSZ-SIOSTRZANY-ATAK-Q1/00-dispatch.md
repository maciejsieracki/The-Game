TEMAT: R-MIASTA-PANSTWA-SOJUSZ-SIOSTRZANY-ATAK-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/game/ai-cs-absorption.ts, gra/src/main.ts, gra/src/game/ai.ts (WYŁĄCZNIE
fragmenty wskazane w GOAL)
MODEL+EFFORT: claude-sonnet-5, effort high

WYZWALACZ (zgłoszenie właściciela, 2026-09-03, po doprecyzowaniu ABC dwukrotnie)
"Wydaje mi się, że te sojusze błędnie określają się, że mechanizm włącza się, gdy jednostki
wrogie pojawiają się obok. To powinno włączać się, gdy sojusz pomiędzy miastami-państwami
zostanie zaatakowany, na przykład przez gracza lub AI. Wtedy powinny od razu wchodzić w sojusz
i wspólnie bronić oraz atakować." Po doprecyzowaniu ABC (2 pytania):
1. Potwierdzone wszystkie trzy zmiany: (a) wyzwalacz = faktyczny atak/wojna, nie bliskość,
   (b) działa też dla AI (nie tylko gracz, odwrócenie wcześniejszej decyzji Q1=A),
   (c) po zawarciu sojuszu siostry wspólnie ATAKUJĄ napastnika, nie tylko bronią.
2. Doprecyzowanie zakresu (b): sojusz siostrzany MA reagować na gracza i na AI INNEGO typu
   cywilizacji niż klaster (prawdziwi najeźdźcy) — MA NIE reagować na atak AI TEGO SAMEGO typu
   cywilizacji co klaster, bo dla tej relacji istnieje osobny, zamierzony mechanizm integracji
   (trybut→wasal→wchłonięcie, `docs/decyzje/R-AI-MP-WASAL-WCHLONIECIE.md`, Q1=A, 2026-08-03) —
   sojusz siostrzany NIE MA blokować tego wchłonięcia.

RECON (wykonane przez orkiestratora — nie powtarzaj, zweryfikuj i buduj na tym)
- Wyzwalacz dziś: `unitTriggersSisterAllianceThreat` (`ai-cs-absorption.ts:167-178`) —
  bliskość dowolnej jednostki gracza (`isSisterAllianceThreatOwner`: `ownerId===0`) w promieniu
  `threatRadius` (main.ts:16964-16972, wołane z `formSisterAlliancesIfThreatened`,
  main.ts:16952-17004).
- Status wojny per para jest JEDYNYM miejscem mutacji w silniku: `getDiploRelation(a,b).status
  === 'wojna'` (`main.ts:7677-7699`), `setDiploRelation` (`main.ts:8402-8426`) — używane już
  jako bramka bojowa AI (`aiCanEngageOwner`, `ai.ts:481-483`). Każda ścieżka ataku (gracz przez
  `withPlayerWarConsent`→`playerDeclareWarOnOwner`, main.ts:9366-9481; AI przez
  `ownerDeclareWarOn`/`wypowiedz_wojne`, main.ts:9409-9441, 29974-30007) ZAWSZE najpierw ustawia
  `status:'wojna'` PRZED jakąkolwiek walką — sprawdzanie statusu wojny per turę jest więc w pełni
  wystarczające jako wyzwalacz, NIE trzeba dodawać nowego hooka bojowego
  (`applyPostBattleMap`/`finishSiegeStormBattle` to hooki rozstrzygnięcia BITWY, nie punktu
  wejścia do wojny).
- `applyAllianceObligationsOnWar(attackerId, victimId)` (main.ts:17601+) — mechanizm
  "sojusznik ofiary wchodzi do wojny w jej obronie" JUŻ ISTNIEJE, generycznie (ownerId-agnostic),
  wołany z KAŻDEJ ścieżki deklaracji wojny. Sojusz `sojusz_pelny` między siostrami
  (`formSisterAlliancesIfThreatened`, main.ts:17002-17008) już dziś kwalifikuje się do tego
  mechanizmu — jeśli siostry mają już aktywny sojusz, obowiązek wypowiedzenia wojny napastnikowi
  zadziała AUTOMATYCZNIE przez ten wspólny kod, bez nowej logiki obowiązku. To pokrywa część
  GOAL 3 (wspólna wojna) — TYLKO jeśli sojusz już istniał PRZED atakiem. Reaktywne ZAWIĄZANIE
  sojuszu w reakcji na atak (rola dzisiejszej `formSisterAlliancesIfThreatened`) trzeba
  zachować jako osobny krok "na starcie/w trakcie ataku" (patrz GOAL 1).
- `planCityStateOffensiveMove` (`ai.ts:3036-3122`, wołane z `decideDefensiveCopyTurn`,
  ai.ts:3373-3398) już dziś: filtruje cele przez status wojny (nie tylko gracza), i stackuje się
  z `friendlyArmyOwnerIds = sisterOwnerIds ∪ warAllyOwnerIds` (ai.ts:3273-3276) — czyli "wspólny
  atak sojuszniczek" JUŻ ISTNIEJE i już liczy siostry. Jedynym blokerem jest brama
  `offensiveSupport = opts.cityStateOffensiveSupport === true` (ai.ts:1425, 3267).
- **WAŻNE — kolizja z RÓWNOLEGLE dziś działającym tematem
  `R-MIASTA-PANSTWA-PASYWNOSC-ROZSZERZENIE-Q1`** (dispatchowany wcześniej tego samego dnia,
  worktree `/home/user/wt-miasta-panstwa-pasywnosc`, może być już zintegrowany do `main` w
  chwili startu tej rundy — SPRAWDŹ `git log` na `origin/main` PRZED rozpoczęciem pracy): ten
  temat modyfikuje DOKŁADNIE `cityStateOffensiveSupport`/`warAllyOwnerIds`
  (`main.ts:29122-29133` na moment pisania tego dispatchu — usuwa warunek `hard`, zostawia
  `isOwnerPlayerSameCivType`). **NIE edytuj tych samych linii w tej rundzie** — jeśli GOAL 3
  wymaga zmiany dokładnie w tym miejscu, ZATRZYMAJ SIĘ z `DECISION_REQUIRED` zamiast ryzykować
  sprzeczną logikę; orkiestrator scali oba tematy ręcznie przy integracji. Zamiast tego
  preferuj DODANIE nowego, niezależnego warunku (patrz GOAL 3 niżej).
- Powód historycznego ograniczenia do gracza (Q1=A): udokumentowany, NIE techniczny —
  `docs/decyzje/R-AI-MP-WASAL-WCHLONIECIE.md` (fala 220, `b47a2e8`, 2026-08-03) — dla relacji
  AI-major↔miasto-państwo TEGO SAMEGO typu istnieje osobny, zamierzony tor integracji
  (trybut→wasal→wchłonięcie na Trudnym od tury 10). Sojusz sióstr był świadomie wyłączony vs
  AI jako ELEMENT tego trybu, nie efekt uboczny.

GOAL
1. **Zmiana wyzwalacza formowania sojuszu.** W `formSisterAlliancesIfThreatened()`
   (main.ts:16952-17004) zastąpić `unitTriggersSisterAllianceThreat`
   (promień+bliskość jednostki) sprawdzeniem FAKTYCZNEGO stanu wojny: dla każdej siostry w
   klastrze, sprawdź czy jest w stanie wojny (`getDiploRelation(sisterOwnerId,
   aggressorOwnerId).status === 'wojna'`) z KAŻDYM innym ownerem na mapie, gdzie ten owner
   kwalifikuje się jako "prawdziwy najeźdźca" wg GOAL 2. Zastąp funkcję `threatenedOwners`
   (main.ts:16963-16972) logiką opartą o wojnę zamiast o promień/`hexDistance`. Usuń lub
   przebuduj `unitTriggersSisterAllianceThreat`/`isSisterAllianceThreatOwner`
   (`ai-cs-absorption.ts:167-178`) zgodnie z nową semantyką (Operator decyduje: zachować funkcje
   z nową sygnaturą, czy zastąpić nowymi — udokumentować wybór).
2. **Kwalifikacja napastnika.** "Prawdziwy najeźdźca" = gracz (`ownerId===0`) LUB AI, którego
   `aiOwnerCivMap.get(aggressorId) !== tc.typ` (typ cywilizacji INNY niż typ klastra sióstr).
   AI TEGO SAMEGO typu cywilizacji co klaster (`aiOwnerCivMap.get(aggressorId) === tc.typ`) —
   celowo WYKLUCZONE z wyzwalacza, żeby nie kolidować z `R-AI-MP-WASAL-WCHLONIECIE.md`
   (trybut→wasal→wchłonięcie). Napisz test jednostkowy dowodzący że atak AI tego samego typu
   NIE wyzwala sojuszu sióstr, a atak AI innego typu / gracza — wyzwala.
3. **Wspólny kontratak po zawarciu sojuszu.** Rozszerz warunek `offensiveSupport`
   (ai.ts:1425, 3267 — sprawdź aktualne linie, mogły się przesunąć) o DODATKOWY, NOWY warunek
   OR (nie modyfikuj main.ts:29122-29133, patrz RECON wyżej): gdy miasto-państwo ma aktywny
   sojusz `sojusz_pelny`/`sojusz_defensywny` z siostrą I jest w stanie wojny z kwalifikującym
   się napastnikiem (GOAL 2) — wtedy `offensiveSupport`-równoważne zachowanie (marsz
   ofensywny/próg fali/stackowanie z `friendlyArmyOwnerIds`) MA działać, NIEZALEŻNIE od
   dzisiejszego `cityStateOffensiveSupport` (który zostaje nietknięty, osobny wymiar sterowany
   przez równoległy temat). Zaproponuj dokładny kształt (np. nowe pole
   `sisterAllianceUnderAttack: boolean` w `AITurnOpts`, liczone w main.ts w osobnym miejscu niż
   linie 29122-29133) — jeśli okaże się to niewykonalne bez dotknięcia tamtych linii, ZATRZYMAJ
   SIĘ z `DECISION_REQUIRED`, opisz dokładnie dlaczego, orkiestrator zdecyduje o kolejności
   integracji.

KRYTERIA KOŃCA (binarne)
1. Test jednostkowy: sojusz sióstr NIE zawiązuje się gdy wroga jednostka jest blisko, ale NIE MA
   stanu wojny (dowód że stary warunek bliskości faktycznie zniknął).
2. Test jednostkowy: sojusz sióstr zawiązuje się gdy siostra jest w stanie wojny z graczem (dziś
   już działa — zero regresji) ORAZ gdy siostra jest w stanie wojny z AI INNEGO typu cywilizacji
   (dziś NIE działa — nowe zachowanie).
3. Test jednostkowy: sojusz sióstr NIE zawiązuje się gdy siostra jest w stanie wojny z AI TEGO
   SAMEGO typu cywilizacji co klaster (ochrona mechanizmu wchłonięcia).
4. Test (jednostkowy lub żywy): po zawarciu sojuszu w reakcji na realny atak, siostry
   podejmują działania ofensywne wobec napastnika (marsz/atak), nie tylko bierną obronę —
   dowód zmiany zachowania przed/po (na kodzie sprzed zmiany siostry NIE atakowały, po zmianie
   atakują, w tym samym scenariuszu wojny).
5. `tsc --noEmit` czysty, istniejące testy sojuszu sióstr (grep `gra/tools/*sister*-test.cjs`,
   `gra/tools/*cs-*-test.cjs`) nadal zielone lub świadomie zaktualizowane z uzasadnieniem, 5
   bramek referencyjnych zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/ai-cs-absorption.ts (wyzwalacz + kwalifikacja napastnika).
- gra/src/main.ts (WYŁĄCZNIE: `formSisterAlliancesIfThreatened()` main.ts:16952-17004 i
  bezpośrednio powiązana logika `threatenedOwners`; NOWE pole/zmienna dla GOAL 3, o ile
  DAJE SIĘ dodać bez dotykania main.ts:29122-29133 — jeśli nie, DECISION_REQUIRED zamiast
  edycji tamtych linii).
- gra/src/game/ai.ts (WYŁĄCZNIE rozszerzenie warunku `offensiveSupport`/analogicznej bramki o
  nowy warunek OR, bez zmiany istniejącej semantyki `cityStateOffensiveSupport`).
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: gra/src/main.ts:29122-29133 (dokładnie te linie — kolizja z równoległym
tematem, patrz RECON), gra/src/game/diplomacy-treaties.ts (`applyAllianceObligationsOnWar` —
już działa generycznie, nie wymaga zmian), zmiana mechanizmu trybut→wasal→wchłonięcie
(`R-AI-MP-WASAL-WCHLONIECIE`), dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json,
playbook.json.

IZOLACJA
worktree /home/user/wt-miasta-panstwa-sojusz-siostrzany-atak, gałąź
autobot/R-MIASTA-PANSTWA-SOJUSZ-SIOSTRZANY-ATAK-Q1, baza jawnie: origin/main (najnowszy commit
na moment dispatchu — SPRAWDŹ czy `R-MIASTA-PANSTWA-PASYWNOSC-ROZSZERZENIE-Q1` jest już
zintegrowany, jeśli tak, Twoja baza już zawiera jego zmiany, dostosuj RECON do aktualnego stanu
linii).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona kompilacja to
node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz założenia że `applyAllianceObligationsOnWar` automatycznie rozwiąże GOAL 3 bez
weryfikacji — dotyczy WYŁĄCZNIE przypadku gdy sojusz JUŻ ISTNIAŁ przed atakiem; scenariusz
"sojusz zawiązuje się W REAKCJI na pierwszy atak" (GOAL 1) wymaga własnej weryfikacji że
kontratak faktycznie następuje. Zakaz uznania kryterium 3 (ochrona wchłonięcia) za spełnione
bez testu który faktycznie próbuje wyzwolić sojusz atakiem AI tego samego typu i potwierdza że
NIE powstaje.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora (ręczne scalenie z
`R-MIASTA-PANSTWA-PASYWNOSC-ROZSZERZENIE-Q1` jeśli oba dotykają main.ts w pobliskich miejscach).
