# R-HOTSEAT-ETAP6A-INPUT-Q1 — Operator runda 1

**Model+effort:** sonnet-5, effort medium (świeży grep/analiza) → high (harness Playwright).

## Weryfikacja świeżym grepem (main.ts przesunął się od recon: 36216→36530 linii)

Wszystkie 42 miejsca z `R-HOTSEAT-ETAP6A-RECON-INPUT-Q1/01-operator-runda1-analiza.md` §1
odnalezione świeżym `grep -n`/`sed -n` pod nowymi numerami linii (przesunięcie ok. +300-1000
linii zależnie od pozycji w pliku), z kodem identycznym co do treści z tabelami klastrów A-H
(A4 `main.ts:33587`(→33595 po dodaniu `isMe`), B1-B16 `24395-24663`, C1-C2 `23383/23401`,
D1-D3 `23591-23646`, E1 `25279`, F1-F10 `33369-33780`, G1 `24268`, H1-H5
`11343/11449/11481/21528/21538`) — pełna lista w commit diff.

## Wykonane

1. Dodano `isMe(ownerId): boolean { return ownerId === ME(); }` obok `ME()`/`isHuman()`
   (`main.ts` ok. 10386).
2. Zmigrowano wszystkie 42 miejsca: `ownerId === 0` → `isMe(ownerId)`, `ownerId !== 0` →
   `!isMe(ownerId)`, literał `0` jako argument generyczny → `ME()`.
3. Klaster D+F (13 pozycji): `executePlannedMarchesEndTurn`/`applyMarchSegmentInstant`
   dostały realny parametr `humanOwnerId: number` (zamiast literału `0`); wywołanie z
   `runPlannedMarchesAtPlayerEndTurn(humanOwnerId)`, wołane z `endActiveHumanTurn`. F1-F5
   (ciało `endActiveHumanTurn`) i F6-F10 (`runScoutsAutoExplore` callback/`renderLoop`) —
   F1-F5 i przekazanie do `runScoutsAutoExplore` używają `humanOwnerId` bezpośrednio;
   F6-F10 w `renderLoop` (funkcja NIE mająca dostępu do `humanOwnerId` z konkretnego
   wywołania end-turn, bo działa co klatkę niezależnie od cyklu tury) używają
   `isMe(u.ownerId)`/`ME()` — patrz „Decyzja rundy" niżej. Usunięto `void humanOwnerId;`.
4. Klaster A3 (`game/army-cycle.ts:55`, moduł czysty): dodano wstrzykiwany parametr
   `isMe: (u) => boolean` z domyślną wartością `(u) => u.ownerId === 0` (zachowuje
   zachowanie dla callerów spoza allowlisty — patrz „Blokady"); `main.ts` woła
   `cyclablePlayerArmyLeadsBase(units, req, stackCanMove, (u) => isMe(u.ownerId))`.
5. Zaktualizowano komentarze przy D3 i F3 odwołujące się dosłownie do „gracza"/„owner 0".
6. Nowa bramka `gra/tools/hotseat-etap6a-input-noop-test.cjs`.

## Decyzja rundy: F6-F10 (`renderLoop`) → `isMe()`/`ME()`, nie `humanOwnerId`

Dispatch pkt 4 sugerował `humanOwnerId` we „WSZYSTKICH 13 pozycjach klastra D+F”.
`renderLoop()` jest globalną pętlą per-klatkę, NIE wywoływaną z wnętrza konkretnego
wywołania `endActiveHumanTurn(humanOwnerId)` — nie ma dostępu do tego parametru
strukturalnie. Recon §1 (kolumna „Podmiana” dla F6-F10) sam proponuje `isMe(u.ownerId)`,
nie parametr — zastosowano rekomendację recon. F1-F5 (fizycznie w ciele
`endActiveHumanTurn`) i D1-D3 (wołane z jej wnętrza) faktycznie używają `humanOwnerId`.

## Anty-samooszukiwanie: świeży grep PASS

`grep -c "ownerId\s*(===|!==)\s*0"` w zakresie każdego z 8 klastrów (A-H) → **0 trafień**
(sprawdzone osobno per klaster tuż przed raportem, po wszystkich edycjach). Pozostałe
~230 wystąpień w main.ts to kategorie b/c/d (tooltip, build-mode, ekonomia, dyplomacja) —
świadomie poza zakresem tego tematu (recon §2 tabela wykluczeń).

## Bramka no-op (`hotseat-etap6a-input-noop-test.cjs`)

Chromium/Playwright (nie Node headless — DOM-bound). Trzy bundle'e: PRZED (kod z HEAD
`96e4c370`, `git show HEAD:...`), PO (bieżący worktree), ZEPSUTY (PO z `isMe()` na sztywno
`false`). Ten sam seed mulberry32, realny `startNewGame`+`foundPlayerStartCity`, 3 zwiadowcy
gracza dosiane realnym hakiem `spawnPlayerScout` (patrz „Znalezisko" niżej), 20 tur — każda z
realnym klikiem selekcji/ruchu (piksel liczony 1:1 jak `r-bitwa-...-live-atak-test.cjs`),
Spacją (cykl), oportunistycznym atakiem, realnym `endTurn()` (== `advanceSeat()` ==
`endActiveHumanTurn(HUMAN_OWNER_PRIMARY)`). Hash SHA-256 per tura z `units`/`cities`/
`explored`/`selectedId`/`plannedMarchesSize`.

**Wynik: PRZED vs PO — 20/20 identycznych hashy (PASS).** Nietautologiczność: PO vs ZEPSUTY
— 3/20 identycznych, pierwsza rozbieżność tura 4 (dowód, że sekwencja kliknięć realnie
dotyka zmigrowanego kodu, nie jest ślepa). `tsc --noEmit`: 0 błędów.

**Znalezisko tej rundy:** `startNewGame`+`foundPlayerStartCity` (bootstrap 1:1 z
`hotseat-etap4/5-...-test.cjs`) NIE daje graczowi żadnej jednostki startowej — 8 widocznych
jednostek to wyłącznie „diffbonus” AI/miast-państw. Bez tego zwiadowcy gracza (dosiane
`spawnPlayerScout`, realny spawner, ten sam co dla AI) klik/zaznaczenie/ruch byłyby
strukturalnym no-opem w OBU wariantach jednocześnie (pierwsza próba bramki dała fałszywy
PASS 6/6 nawet z `isMe()≡false` — wykryte i naprawione przed ogłoszeniem PASS).

## Blokady / do follow-up (nie naprawiane w tej rundzie — poza allowlistą)

1. **`tools/mgla-odkrycie-wzdluz-sciezki-test.cjs` — 2 NOWE FAIL** (`if (u.ownerId === 0)
   hutCollected = ...` dla D3/F6, teraz `isMe(u.ownerId)`/`u.ownerId === humanOwnerId`) —
   test structuralnie hardkoduje stary literał w regexie. Zweryfikowane: 1 fail
   pre-istniejący (`currentVisible()`), +2 nowe z tej migracji. Nie w allowlist tego
   tematu — wymaga osobnej rundy/ECHO aktualizującej regex testu.
2. `plannedMarchesSize` pozostał `0` przez cały bieg bramki no-op — mapa sandboxa
   (Mały/30% lądu) nie dała pewnego, wielo-turowego, lądowego celu marszu w rozsądnym
   czasie próby (sprawdzono promienie (3,6)/(10,20)/(4,7)). Klaster D zweryfikowany
   STRUKTURALNIE (świeży grep, `tsc`, przegląd diffu — sygnatury `executePlannedMarchesEndTurn
   (humanOwnerId)`/`applyMarchSegmentInstant(unitId, humanOwnerId)` faktycznie używają
   parametru), ale NIE dowiedziony żywo przez tę bramkę. Kandydat na dowód w rundzie
   Evaluatora/Obrony, jeśli uznane za wymagane.
3. `barb-camp-destruction-test.cjs` — 2 FAIL, **pre-istniejące** (zweryfikowane `git stash` +
   powtórny bieg na bazie: identyczne 2 fail przed tą rundą).

---

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6A-INPUT-Q1
GOAL: Migracja 42 miejsc kategorii "input" main.ts z ownerId===0/!==0 na isMe/!isMe/ME(), klaster D+F na realny parametr humanOwnerId, bramka dowodu no-op.
ZMIANY/COMMIT: gra/src/main.ts (42 miejsca + alias isMe + humanOwnerId w D+F + 2 komentarze), gra/src/game/army-cycle.ts (parametr isMe z defaultem), gra/tools/hotseat-etap6a-input-noop-test.cjs (nowy). SHA: patrz commit tej rundy w `git log`.
TESTY: tsc --noEmit 0 błędów. 5 bramek referencyjnych zielone (213/213, 19/19, 33/33, 13/13, 6/6). Nowa bramka no-op: PRZED vs PO 20/20 identycznych hashy PASS, nietautologiczność potwierdzona (PO vs ZEPSUTY 3/20, rozbieżność od tury 4). Świeży grep ownerId===0/!==0 w zakresie klastrów A-H: 0 trafień (sprawdzone per klaster). scout-explore-deselect-cycle-test.cjs i army-merge-separate-return-mainguard-test.cjs (wywołują cyklowanie z 3-argumentową sygnaturą) zielone dzięki wartości domyślnej isMe w army-cycle.ts.
BLOKADY: (1) tools/mgla-odkrycie-wzdluz-sciezki-test.cjs — 2 nowe FAIL (hardkodowany stary literał w regexie testu, poza allowlistą tego tematu, wymaga osobnej aktualizacji testu). (2) plannedMarchesSize=0 w całym biegu bramki no-op — klaster D zweryfikowany strukturalnie (grep+tsc+diff), nie dowiedziony żywo w tej rundzie. (3) barb-camp-destruction-test.cjs 2 FAIL pre-istniejące, niezwiązane z tą rundą.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator — weryfikacja świeżym grepem/tsc/bramkami niezależnie od tego raportu; ocena czy blokady (1)-(2) wymagają naprawy w tej rundzie czy mogą iść do rejestru jako follow-up.
DEPLOY/PUSH: NIE WYKONANO
