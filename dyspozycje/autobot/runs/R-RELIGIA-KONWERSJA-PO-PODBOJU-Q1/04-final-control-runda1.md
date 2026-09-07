# R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1 — Final Control, runda 1/5

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1
GOAL: `onCityCapturedReligion` jako wierny odpowiednik `onCityCapturedCulture` (inwersja
`1-prevShare` przełożona na `counts`), wywołanie bezwarunkowe z `main.ts`, dowód że
`convertViaTemple` faktycznie rusza po podboju.
ZMIANY-COMMIT: HEAD `55e158df` (worktree `/home/user/wt-religia`, gałąź
`autobot/R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1`), baza `ba2fde99`. `git diff ba2fde99 --stat`:
dokładnie 7 plików — 4 raporty procesu, `gra/src/game/culture-religion.ts` (+116),
`gra/src/main.ts` (+22/-3), `gra/tools/religia-konwersja-po-podboju-test.cjs` (+289, nowy).
Zero plików spoza allowlisty. `conquest-stability.ts`, `society-breakdown.ts`, `order.ts` —
NIETKNIĘTE (potwierdzone brakiem w diff --stat). `main.ts` diff ograniczony do bloku
26944-26968 (guard `isBarbarian(atkOwner)` zachowany bez zmian, wywołanie bezwarunkowe co do
`sameCultureCircle` — ten check przeniesiony do `opts.civKeyForOwner` wewnątrz nowej funkcji).
Diff rundy 2 (`1217bf16`→`7848814d`) ograniczony do bloku redystrybucji `remaining`
(linie ~803-830) — gałąź SAME-okręgu (linie 774-781, `defaultCityReligionState`) niezmieniona
między rundami.

TESTY: Uruchomione od zera, niezależnie od raportów Operatora/Obrony/Evaluatora.
1. **Fuzz formuły Hamiltona** (własny skrypt, esbuild-bundle `culture-religion.ts`,
   `onCityCapturedReligion` wywołana bezpośrednio): 3000 losowych prób, 3-8 religii w
   `counts`, losowe wagi (0-999), losowa populacja (1-5000), 10% prób z
   `previousOwnerReligion=null`, 5% prób z `counts` całkowicie pustym, różny okrąg (bez
   `opts.civKeyForOwner`) — **0 błędów**: `suma(after) === suma(before)||population` w
   każdej próbie, zero wartości ujemnych. RESULT: PASS.
2. **Fallback `previousOwnerReligion=null` z niepustym `counts`**: 7 scenariuszy ręcznych —
   `counts` pusty, `counts` = tylko religia nowego właściciela (=populacja i <populacja),
   `counts` = tylko trzecia religia, `counts` = nowy właściciel + trzecia, `counts` =
   wyłącznie trzecie religie (2), `counts` = nowy właściciel + 2 trzecie — wszystkie
   `suma(after) === suma(before)`, zero ujemnych (Evaluator badał wyłącznie `counts={}`;
   przypadek "tylko religia nowego właściciela", explicite zlecony w tej rundzie, też OK —
   `remaining` trafia do `newOwnerReligion` przez gałąź fallback, suma zachowana).
3. **SAME okrąg — regresja**: kod branch (linie 774-781) identyczny w obu rundach (diff
   rundy 2 go nie dotyka); bramka (`religia-konwersja-po-podboju-test.cjs`, przypadek SAME)
   zielona. Brak zmiany zachowania.
4. **main.ts bezwarunkowość po zmianach rundy 2**: `git diff ba2fde99 -- gra/src/main.ts`
   — wywołanie `onCityCapturedReligion(...)` w bloku `!isBarbarian(atkOwner)` nietknięte od
   rundy 1 (runda 2 dotyczyła wyłącznie `culture-religion.ts`); `isBarbarian` guard
   niezmieniony.
5. Allowlista — patrz ZMIANY-COMMIT wyżej.
6. **Od zera**: `cd gra && npx tsc --noEmit` → czysto (0 błędów). 5 bramek referencyjnych:
   `logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33, `unit-replace-test`
   13/13, `combat-test` 6/6. Rodzina religia/kultura/capture/podboj/conquest
   (`find tools -iname "*relig*" -o -iname "*kultur*" -o -iname "*capture*" -o -iname
   "*podboj*" -o -iname "*conquest*"`): `religia-konwersja-po-podboju-test` 12/12,
   `culture-religion-test` 65/0, `ai-city-capture-integration-test` 14 OK,
   `empire-religia-panel-coverage-test` 15/15, `post-capture-law-test` 25/0,
   `capital-capture-test` 86/86 — wszystkie zielone. `conquest-stability-test` 28/1 i
   `barb-city-capture-cluster-test` 92/1 FAIL — **zweryfikowane niezależnie na czystym
   `ba2fde99`** przez tymczasowy `git worktree add` (bez `git stash`, bez modyfikacji
   worktree tematu): identyczny wynik (te same 2 FAIL, te same komunikaty) na bazie sprzed
   tego tematu — potwierdzony baseline, zero związku z allowlistą.
7. **Dowód wieloturowy PO naprawie rundy 2**: (a) bramka uruchomiona na bieżącym HEAD
   (zawiera fix Hamiltona) — sekwencja udziału zdobywcy w 5 turach `convertViaTemple`
   monotoniczna i realnie rosnąca; (b) własna weryfikacja na dokładnym scenariuszu zarzutu
   Evaluatora (5 religii, `counts={keltyzm:2,a:1,b:1,c:1,d:1}`, population=6) — po podboju
   `{a:1,b:1,rzym_bogowie:4}` (suma=6), 8 kolejnych tur `convertViaTemple`: udział
   0.667→0.833→1.000 (nasycenie), suma stale =6 w każdej turze (brak dryfu), monotoniczność
   zachowana.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja przez orkiestratora (allowlist-only) po READY_FOR_DEPLOY.
DEPLOY-PUSH: NIE WYKONANO

## WERDYKT

**PASS — temat gotowy do integracji z main.** Formuła Hamiltona poprawna na 3000 losowych
prób (0 defektów); fallback `previousOwnerReligion=null` poprawny również przy niepustym
`counts` (szerszy zakres niż testował Evaluator); SAME-okrąg bez regresji; wywołanie
`main.ts` nadal bezwarunkowe i spójne z guardem barbarzyńców po zmianach rundy 2; allowlista
ściśle zachowana (`conquest-stability.ts`/`society-breakdown.ts`/`order.ts` nietknięte); cała
rodzina bramek zielona poza dwoma potwierdzonymi baseline'owymi FAIL sprzed tematu;
`convertViaTemple` udowodniony jako działający wieloturowo na kodzie PO naprawie rundy 2, nie
tylko sprzed niej. Nie znaleziono nowego defektu.

---
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Fs7eokPtaxbQL7KGTXXeWS
