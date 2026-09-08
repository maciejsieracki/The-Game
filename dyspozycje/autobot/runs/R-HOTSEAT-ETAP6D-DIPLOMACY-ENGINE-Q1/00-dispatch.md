STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-DIPLOMACY-ENGINE-Q1
GOAL: Implementacja OGRANICZONEGO, w pełni udokumentowanego podzbioru pod-etapu 6d
planu hot-seat ("dyplomacja") na podstawie zamkniętego recon
`dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-RECON-DIPLOMACY-Q1/01-operator-runda1.md`
(zintegrowany, commit `c6015522`). **Ten temat NIE zamyka całego pod-etapu 6d** —
recon jawnie stwierdza floor ≥136 miejsc z niekompletną inwentaryzacją poza tym
podzbiorem i wymaga decyzji właściciela co do dalszego zakresu (kontynuacja pełnej
inwentaryzacji vs. podział na pod-kategorie). **Ten temat migruje WYŁĄCZNIE 20 funkcji
z tabeli §4 recon (brace-matched, w pełni zweryfikowanych granic funkcji)** —
analogiczny, celowo zawężony wzorzec do `R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1` (część (i)
"prosta migracja" zamiast całego pod-etapu).

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-RECON-DIPLOMACY-Q1/01-operator-runda1.md`
  §2-3 (kategoryzacja aliasu) i §4 (tabela 20 funkcji z liniami hardkodu, PO 2 poprawkach
  Evaluatora — `getRelationBreakdown` ma poprawiony numer 17978, nie 17976).
- **Tabela 20 funkcji do migracji w tej rundzie** (świeże numery linii z recon — main.ts
  ZMIENIŁ SIĘ od integracji Etapów 6a/6b/6c/6f/6e-prereq, WSZYSTKIE numery MUSZĄ być
  zweryfikowane świeżym grepem/Read przed każdą podmianą, nie kopiowane wprost):
  `isActiveDiploOwner`, `buildPlayerDiploSummary`, `recordWarDeclarationEvent`,
  `setDiploRelation`, `applyDiploEventTracked`, `playerIsAtWarWith`, `ownerDeclareWarOn`,
  `collectWarsWithPlayer`, `collectKnownWarsBetweenOthers`, `establishDiplomaticContact`,
  `checkNewDiplomaticContacts`, `buildDiploTreasury`, `buildDiplomacyTickCtxForPair`,
  `getRelationBreakdown`, `joinAllyToWar`, `applyAllianceObligationsOnWar`,
  `runDiplomacyTurnTick`, `buildDiplomacyLockContextBase`, `openDiplomacyAudience`,
  `resolveForcedWarDurationLimits`.
- **Kategoryzacja aliasu z recon §2-3** (zastosuj, ale zweryfikuj logikę dla funkcji
  nienazwanych wprost w tekście recon — patrz zasada niżej):
  - **isHuman(id)** (funkcja liczy/zapisuje stan DOWOLNEJ pary ownerów, w tym AI-AI, nie
    tylko z perspektywy aktywnego fotela): `applyDiploEventTracked`,
    `buildDiplomacyTickCtxForPair`, `getRelationBreakdown`, `resolveForcedWarDurationLimits`
    (kara graniczna/wymuszona wojna AI-para — "dotyczy realnego stanu pary, nie ekranu
    aktywnego"). Dla pozostałych z tabeli NIE nazwanych wprost w tekście recon
    (`isActiveDiploOwner`, `setDiploRelation`, `establishDiplomaticContact`,
    `checkNewDiplomaticContacts`, `buildDiploTreasury`, `joinAllyToWar`,
    `applyAllianceObligationsOnWar`, `runDiplomacyTurnTick`,
    `buildDiplomacyLockContextBase`) — PRZECZYTAJ ciało funkcji i zastosuj tę samą
    zasadę: jeśli funkcja liczy/zapisuje stan dla DOWOLNEJ pary/wielu par jednocześnie
    (np. pętla po wszystkich AI) → `isHuman`; jeśli pokazuje/działa z perspektywy JEDNEGO,
    konkretnego aktywnego fotela → `isMe`/`ME()`. Uzasadnij każdą decyzję w raporcie.
  - **isMe(id)/ME()** (perspektywa AKTYWNEGO fotela — HUD, komunikat, akcja inicjowana
    przez gracza): `buildPlayerDiploSummary`, `recordWarDeclarationEvent`,
    `playerIsAtWarWith` (używana z input/combat, ustalenie z Etapu 6a),
    `ownerDeclareWarOn`, `collectWarsWithPlayer`, `collectKnownWarsBetweenOthers`,
    `openDiplomacyAudience` (panel UI — jeśli po świeżym Read okaże się że to
    generyczny panel wielo-owner, przekwalifikuj na `isHuman` z uzasadnieniem).
- **Poza zakresem tej rundy, NIE dotykaj**: `game/forced-war-bronze.ts`,
  `game/forced-war-stone.ts`, `game/diplomacy-border-march.ts` (osobne pliki, poza tą
  tabelą), dev/playtest harness (`forceBronzeForcedWarDominoOnPlayer`,
  `playtestWalkaMapy`-owe wywołania `setDiploRelation(0, ...)` — jawnie nazwane w
  recon jako wymagające ODDZIELNEJ decyzji właściciela, poza zakresem produkcyjnym).
  Zostaw jawną notatkę w raporcie że te obszary czekają na kolejny temat.
- **Uwaga o równoległych lanach**: mogą trwać równolegle `R-HOTSEAT-ETAP6E-RENDER-Q1`
  (main.ts, klastry render — inne funkcje) i `R-HOTSEAT-ETAP7-SAVELOAD-Q1` (main.ts,
  save/load — inne funkcje). Zweryfikuj świeżo (`git status`/`git diff` w
  `/home/user/wt-hotseat-etap6e-render` i `/home/user/wt-hotseat-etap7-saveload` jeśli
  istnieją) brak nakładania z Twoimi 20 funkcjami przed edycją.

ZADANIE TEJ RUNDY:
1. Zweryfikuj świeżym grepem/Read wszystkie 20 funkcji z tabeli — potwierdź że main.ts
   nadal ma dokładnie te hardkody pod wskazanymi (możliwie przesuniętymi) liniami.
2. Dla KAŻDEJ z 20 funkcji ustal poprawny alias (patrz zasada wyżej) i zmigruj WSZYSTKIE
   hardkody wewnątrz jej ciała.
3. **Dodatkowo zweryfikuj wzorzec "literał 0 jako argument do innej nazwanej funkcji"**
   (recon §4 przyznaje: sprawdzone tylko dla 2/19 pierwotnych funkcji, np.
   `getWiarygodnosc(0)`/`ownerDiploLabel(0)` wewnątrz `buildPlayerDiploSummary`) — dla
   WSZYSTKICH 20 funkcji z tabeli sprawdź czy wywołują inne z tych samych 20 (albo
   `getDiploRelation`) z literałem `0` zamiast ze zmienną pętli/parametru — to jest ta
   sama klasa przeoczenia, przed którą recon jawnie ostrzega.
4. Napisz bramkę dowodu no-op: headless Node dla większości (logika czysta, nie
   DOM-bound — potwierdź to założenie świeżo, recon §6 sugeruje headless dla silnika),
   Chromium tylko jeśli któraś z 20 funkcji faktycznie renderuje UI (np.
   `openDiplomacyAudience` — sprawdź). Scenariusz: wywołania izolowane per funkcja z
   parami `ownerId` 0/1/2, porównanie wyniku PRZED/PO przy `humanOwnerIds=[0]` (no-op) I
   z symulowanym `humanOwnerIds=[0,1]` (realna zmiana zachowania — nietautologiczne,
   wzorem Etapu 6f).

BINARNE KRYTERIUM SUKCESU: wszystkie 20 funkcji z tabeli zmigrowane z poprawnym,
uzasadnionym aliasem (grep hardkodów `0` wewnątrz ich ciał daje ZERO trafień), wzorzec
"literał jako argument" sprawdzony dla WSZYSTKICH 20 (nie tylko 2 jak w recon). Nowa
bramka PASS i nietautologiczna (dowód z `humanOwnerIds=[0,1]`). `tsc --noEmit` czysty.
5 bramek referencyjnych zielone.

ALLOWLISTA:
- `gra/src/main.ts` (WYŁĄCZNIE ciała 20 wymienionych funkcji — BEZ dotykania
  `diplomacy-border-march.ts`-powiązanych call-site'ów, dev-harness, ani funkcji spoza
  tej listy)
- `gra/tools/hotseat-etap6d-diplomacy-engine-test.cjs` (NOWY plik, bramka dowodu)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-DIPLOMACY-ENGINE-Q1/*`
Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz przyjęcia kategoryzacji aliasu z recon bez
przeczytania ciała KAŻDEJ z 9 funkcji nienazwanych wprost w tekście recon — uzasadnij
decyzję z cytatem kodu, nie domysłem z nazwy funkcji. Zakaz pominięcia wzorca "literał
jako argument" dla pozostałych 18 funkcji (recon sam przyznaje że sprawdził tylko 2/19).
Zakaz migrowania czegokolwiek poza tabelą 20 funkcji (dev-harness/border-march.ts poza
zakresem, wymagają osobnej decyzji właściciela).

IZOLACJA: worktree `/home/user/wt-hotseat-etap6d-diplomacy-engine`, gałąź
`autobot/R-HOTSEAT-ETAP6D-DIPLOMACY-ENGINE-Q1`, baza `origin/main` @ `abd10b00`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli Evaluator zwraca
NIEPUSTĄ listę zarzutów — zawsze wymagana runda Obrony przed kolejnym Evaluatorem.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow). Po PASS: integracja allowlist-only + jawna notatka w rejestrze że pod-etap 6d
NIE jest w pełni zamknięty (pozostałe ~116 miejsc + dev-harness + border-march.ts czekają
na decyzję właściciela co do dalszego zakresu).
DEPLOY/PUSH: NIE WYKONANO
