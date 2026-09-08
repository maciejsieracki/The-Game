# R-HOTSEAT-ETAP6A-INPUT-Q1 — Final Control runda 1

**Model+effort:** sonnet-5, effort high. Niezależna weryfikacja własnym uruchomieniem
(nie na podstawie raportów Operatora/Evaluatora).

## Metoda i wynik

1. **Grep klastrów A-H:** zweryfikowałem każde z 42 miejsc indywidualnie (nie zbiorczym
   grepem) przez `Read`/`grep -n` nazw funkcji (`syncPlayerUnitSelectionOnMap`,
   `selectPlayerUnit`, drugi handler `keydown`, `mouseup` 24395-24680, `planMarchTo`,
   `executePlannedMarchesEndTurn`/`applyMarchSegmentInstant`, atak E1, `endActiveHumanTurn`
   F1-F5, `renderLoop` F6-F10, `refreshHoverPathPreview` G1, `openSplitPanelForSelected`/
   `openMergePanelForSelected`/`canMerge`/`canSplit` H1-H5). Wynik: 27× `isMe(...)`, 9×
   `ME()` w tych zakresach, D1-D3/F1-F5 faktycznie używają parametru `humanOwnerId` (nie
   `ME()`) — potwierdzone `Read` ciał funkcji. Zero pominiętych miejsc.
2. **`tsc --noEmit`** (własne uruchomienie): 0 błędów.
3. **5 bramek referencyjnych** (własne uruchomienie): 213/213, 19/19, 33/33, 13/13, 6/6.
   `scout-explore-deselect-cycle-test` 34/34, `army-merge-separate-return-mainguard-test`
   73/73.
4. **`hotseat-etap6a-input-noop-test.cjs`** — własny pełny przebieg od zera (Chromium,
   3 warianty × 20 tur). Wynik: `PASS (20/20 identycznych PRZED/PO, jsExcPRZED=0,
   jsExcPO=0, nietautologiczność=OK)`. Zweryfikowałem hash-po-hash: PRZED i PO identyczne
   we wszystkich 20 turach; ZEPSUTY (`isMe()`→`false`) rozbiega się dokładnie od tury 4
   (PO tura4=`24491d4d...`, ZEPSUTY tura4=`5a5314a1...`), 3/20 identycznych łącznie —
   dowód nietautologiczności potwierdzony niezależnie, nie tylko z raportu.
5. **`git diff --stat 96e4c370 HEAD`**: dokładnie 4 pliki — `main.ts`, `army-cycle.ts`,
   nowa bramka `.cjs`, 2 raporty w `dyspozycje/`. `git diff --check`: 0 błędów. Zero
   plików spoza allowlisty, zero `git add -A`.

## Ocena blokad (własne uzasadnienie)

1. **`mgla-odkrycie-wzdluz-sciezki-test.cjs`** (12 pass, 3 fail): zweryfikowałem
   źródło testu — linie 188/202 hardkodują regex z literałem `u.ownerId === 0`
   przeciwko kodowi main.ts, który teraz brzmi `isMe(u.ownerId)`/`u.ownerId ===
   humanOwnerId`. Defekt jest w pliku testu (poza allowlistą), nie w main.ts — nie
   blokuje integracji. 3. fail (`currentVisible`) potwierdzony pre-istniejący (test
   regexu na bazowym `main.ts` z HEAD 96e4c370 też nie przechodzi tej asercji).
2. **`plannedMarchesSize=0`**: potwierdzam ocenę — D1-D3 mają `humanOwnerId` fizycznie
   w sygnaturze i ciele (odczyt kodu, nie tylko deklaracja), chronione `tsc`. Brak
   żywego dowodu marszu wieloturowego w tej bramce jest realną luką dowodową, ale nie
   defektem kodu — akceptowalne jako follow-up, nie warunek PASS.
3. **`barb-camp-destruction-test.cjs`** (2 fail): architektura testu (próg
   odległości marker→call) niezwiązana z migracją `ownerId`→`isMe`; Operator/Evaluator
   zmierzyli niezależnie identyczny wynik na HEAD i `origin/main` — wiarygodne, nie
   wymaga trzeciego powtórzenia.

## F6-F10 (`renderLoop`) — ocena architektoniczna własna

Zweryfikowałem: `renderLoop()` (main.ts:33651) nie przyjmuje parametrów, jest
samo-rekurencyjne przez `requestAnimationFrame(renderLoop)`, wywołane raz z
`doStartGame()`/`doLoadGame()` — strukturalnie odcięte od konkretnego wywołania
`endActiveHumanTurn(humanOwnerId)`. Przekazanie `humanOwnerId` wymagałoby przebudowy
sygnatury całej pętli renderowania, poza zakresem tego tematu. `isMe(u.ownerId)` czyta
globalny `ME()` (aktywny fotel), co jest semantycznie poprawne już dziś i gotowe pod
przyszły hot-seat. Zgodne z rekomendacją własną recon (§1, kolumna Podmiana F6-F10).

---

STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6A-INPUT-Q1
GOAL: Migracja 42 miejsc kategorii "input" main.ts z ownerId===0/!==0 na isMe(ownerId)/!isMe(ownerId)/ME(), klaster D+F na realny parametr humanOwnerId, bramka dowodu no-op.
TESTY: Własne uruchomienia: tsc --noEmit 0 błędów; 5 bramek referencyjnych 213/213, 19/19, 33/33, 13/13, 6/6; scout-explore-deselect-cycle-test 34/34, army-merge-separate-return-mainguard-test 73/73; pełny live-run hotseat-etap6a-input-noop-test.cjs (60 tur, 3 warianty, Chromium) PASS 20/20 PRZED=PO, nietautologiczność potwierdzona (PO vs ZEPSUTY 3/20, rozbieżność od tury 4, zweryfikowana hash-po-hash); git diff --stat/--check vs 96e4c370: dokładnie 4 pliki allowlisty, zero stray-edits.
BLOKADY: (1) mgla-odkrycie-wzdluz-sciezki-test.cjs 2 nowe FAIL — potwierdzone jako hardkodowany literał w regexie SAMEGO TESTU (main.ts:188/202 pliku testowego), plik poza allowlistą, nie blokuje integracji, wymaga osobnej rundy aktualizującej regex. (2) plannedMarchesSize=0 w całym biegu bramki no-op — klaster D zweryfikowany strukturalnie (Read sygnatur/ciał funkcji, tsc), nie dowiedziony żywo w tej rundzie; akceptowalne jako follow-up. (3) barb-camp-destruction-test.cjs 2 FAIL — pre-istniejące niezależnie od tego diffu (potwierdzone przez Operator+Evaluator na HEAD i origin/main).
RUNDY: 1/5
WERDYKT KOŃCOWY: PASS — gotowe do integracji. Wszystkie 42 miejsca kategorii "input" zweryfikowane indywidualnie jako zmigrowane (zero literałów ownerId===0/!==0 w zakresie klastrów A-H), alias isMe(ownerId)=ownerId===ME() poprawny, klaster D+F rzeczywiście używa parametru humanOwnerId (nie globalnego ME()) w D1-D3/F1-F5 — potwierdzone czytaniem kodu, nie deklaracją. Odstępstwo F6-F10 (isMe/ME zamiast humanOwnerId w renderLoop) jest architektonicznie uzasadnione niezależną analizą (funkcja bez dostępu strukturalnego do parametru end-turn) i zgodne z oryginalną rekomendacją recon. Wszystkie 3 odnotowane blokady zweryfikowane jako nieblokujące (2 poza allowlistą/pre-istniejące, 1 luka dowodowa bez wpływu na poprawność kodu chronionego tsc). Bramka no-op własnym pełnym przebiegiem potwierdza no-op behawioralny i nietautologiczność. Brak defektów blokujących.
NASTĘPNY KROK: integracja allowlist-only przez orkiestratora (main.ts, game/army-cycle.ts, gra/tools/hotseat-etap6a-input-noop-test.cjs, raporty runu) do main; blokady (1)-(2) do rejestru jako follow-up.
DEPLOY/PUSH: NIE WYKONANO
