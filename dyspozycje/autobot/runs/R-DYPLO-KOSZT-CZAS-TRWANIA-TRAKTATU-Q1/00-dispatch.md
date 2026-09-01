TEMAT:  R-DYPLO-KOSZT-CZAS-TRWANIA-TRAKTATU-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Właściciel: „Przy dyplomacji, im dłuższy okres trwania danej umowy, tym
wyższy powinien być koszt w PW. W przypadku wymiany surowców przez wiele tur
obliczana jest łączna ilość surowców wymienianych [już działa poprawnie], ale
przy zwykłej umowie, na przykład pakt nieagresji, piętnastoturowy okres
powinien być dwa razy droższy od dziesięciotorowego, dwudziestoturowy dwa
razy droższy od piętnastoturowego, a bezterminowy dwa razy droższy od
dwudziestoturowego." Zrzut ekranu: panel „Pakt o nieagresji" (Inkowie),
przyciski czasu trwania 10/15/20/Bezterminowy + pole ręczne, „MY ODDAJEMY 190
PW (baza 200, Relacja -5%)" — baza 200 PW jest DZIŚ identyczna niezależnie od
wybranego czasu trwania.

## RECON (wykonany, nie powtarzać)
Koszt bazowy traktatów o stałej bazie PW (bez koszyka surowców) pochodzi z
`gra/data/diplomacy-acceptance-points.json` (sekcja `traktaty`, pole
`punkty` — np. `nap`=200). Czytają go DWA RÓWNOLEGŁE miejsca (duplikacja
źródła prawdy, klasa błędu już raz naprawiana — „P-DYPLO-BILANS-GATE-
NIESPOJNY"):
- `treatyBasePnFromConfig(actionId)` — `gra/src/game/diplomacy-proposals.ts:509-512`
  (silnik akceptacji: `treatyPnGate` ~548-615, `treatyBaseFairnessGap` ~680-691,
  `evaluateProposal`).
- `treatyBaseAcceptancePn(actionId)`/`loadTreatyAcceptanceDef` —
  `gra/src/game/diplomacy-acceptance-points.ts:66-73` (UI: `computePlayerAcceptanceSides`
  ~347-364 — to właśnie zasila panel z zrzutu ekranu).
Obie funkcje dostają cały `payload` (zawiera `payload.turns`), ale DZIŚ go
ignorują przy liczeniu bazy. Czas trwania jest liczony OSOBNO, wyłącznie dla
daty wygaśnięcia: `resolveNapDealExpiry(turn, payload)` —
`diplomacy-proposals.ts:392-403` (raw<=0 → bezterminowy, inaczej clamp(raw,
10, 20)). AI generuje NAP przez `zaproponuj_pakt` (`game/ai.ts:4446-4451`,
`turns: napIndefinite ? 0 : 15`) — przechodzi przez TEN SAM `evaluateProposal`/
`treatyPnGate`, więc poprawka w jednym miejscu automatycznie obejmie też
oferty AI, bez osobnej zmiany w `ai.ts`.
Istniejący wzorzec mnożenia przez czas (handel surowcami cykliczny,
`diplomacy-value-catalog.ts::diplomacySumPn` ~471+, `turnsMultiplier`
~443-446) jest LINIOWY (ilość × liczba tur) — INNY kształt niż wymagany tu
mnożnik geometryczny, nie kopiować 1:1, tylko jako punkt odniesienia „gdzie
wpiąć mnożnik czasu w istniejący flow".
Testy bezpośrednio pokrywające: `diplomacy-acceptance-points-test.cjs`,
`diplomacy-proposal-test.cjs`. Pośrednio: `diplomacy-bilans-unifikacja-test.cjs`,
`diplomacy-fairness-gate-package-q2-test.cjs`, `diplomacy-border-march-test.cjs`.
POZA zakresem: `pokoj` (traktat pokojowy) — brak wyboru czasu trwania w UI,
mnożnik się nie stosuje.

## GOAL
Wprowadź WSPÓLNY helper (jedna funkcja, np. `treatyDurationPnMultiplier(actionId, payload)`
w miejscu współdzielonym przez oba istniejące choke-pointy — Operator decyduje
gdzie, byle NIE duplikować logiki mnożnika w dwóch plikach) zwracający mnożnik
geometryczny wg wzoru:
```
turns = payload.turns (albo pole analogiczne, sprawdź nazwę per typ traktatu)
if turns <= 0 (bezterminowy): mnożnik = 8
else: mnożnik = 2 ^ ((clamp(turns, 10, 20) - 10) / 5)
```
Ten wzór spełnia DOKŁADNIE trzy podane przez właściciela punkty odniesienia:
10 tur → ×1, 15 tur → ×2, 20 tur → ×4, bezterminowy → ×8 — i daje spójną,
deterministyczną interpolację dla wartości ręcznych pomiędzy (np. 12, 17 tur)
bez zgadywania nowej skali.

Zastosuj mnożnik w OBU choke-pointach (`treatyBasePnFromConfig` i
`treatyBaseAcceptancePn`/`loadTreatyAcceptanceDef`) dla WSZYSTKICH typów
traktatów o stałej bazie PW, które w UI faktycznie oferują wybór czasu
trwania (zweryfikuj grepem które — na pewno `nap`; sprawdź czy `sojusz_pelny`,
`sojusz_defensywny`, `granice` (przemarsz), `wasal` też mają w UI selektor
czasu — jeśli TAK, obejmij je tym samym mechanizmem; jeśli NIE mają
selektora w ogóle, zostają nietknięte, bez zmiany zachowania). WYŁĄCZ z tego
`pokoj` (brak selektora czasu, poza zakresem). Zastosuj też do
`treatyBaseFairnessGap` (diplomacy-proposals.ts ~680) i ew.
`computePeaceAcceptanceSides` TYLKO jeśli dotyczy traktatów objętych zmianą
(nie `pokoj`).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Nowy wspólny helper istnieje, używany przez OBA choke-pointy (dowód:
   cytat z obu miejsc wołających tę samą funkcję, nie dwie kopie wzoru).
2. Dla Paktu o nieagresji: baza 200 PW → 10 tur=200, 15 tur=400, 20 tur=800,
   bezterminowy=1600 — realny test (jednostkowy, prawdziwa egzekucja kodu)
   potwierdzający dokładnie te 4 wartości, plus jedną wartość pośrednią (np.
   12 tur → 200×2^(2/5)≈263,9, zaokrąglenie wg istniejącej konwencji
   zaokrągleń PW w tym pliku).
3. UI (panel „PUNKTY WYMIANY PW") i silnik akceptacji (`evaluateProposal`)
   zwracają TĘ SAMĄ bazę dla tego samego `payload.turns` — realny dowód że
   oba choke-pointy się zgadzają (to jest dokładnie klasa błędu, którą ten
   temat ma zapobiec powtórnie).
4. Oferta AI z NAP (turns=15 albo 0) automatycznie dostaje przemnożoną bazę
   BEZ zmiany w `game/ai.ts` — dowód że `ai.ts` nie był edytowany, a mimo to
   `evaluateProposal` dla oferty AI zwraca przemnożoną wartość.
5. `pokoj` (traktat pokojowy) NIEZMIENIONY — dowód że jego koszt bazowy jest
   identyczny przed/po (nie ma selektora czasu, mnożnik się nie stosuje albo
   traktowany jako stały punkt odniesienia bez zmiany).
6. Wszystkie testy dyplomacji (min. `diplomacy-acceptance-points-test.cjs`,
   `diplomacy-proposal-test.cjs`, `diplomacy-bilans-unifikacja-test.cjs`,
   `diplomacy-fairness-gate-package-q2-test.cjs`, `diplomacy-border-march-test.cjs`)
   zaktualizowane z ręcznie przeliczoną arytmetyką i zielone, 5 bramek
   referencyjnych + `tsc --noEmit` 0 błędów.

## ALLOWLISTA — nic poza tym
`gra/src/game/diplomacy-proposals.ts`, `gra/src/game/diplomacy-acceptance-points.ts`,
ewentualnie nowy mały plik helpera we wspólnym miejscu (np.
`gra/src/game/diplomacy-treaty-duration.ts`) jeśli Operator uzna to za
czytelniejsze niż eksport z jednego z powyższych, pliki testowe wymienione w
kryterium 6. Zakazane bezwzględnie: `gra/src/game/ai.ts` (żadnej zmiany —
kryterium 4 wymaga automatycznego efektu bez dotykania tego pliku),
`gra/src/game/diplomacy-value-catalog.ts`/`diplomacy-pn-engine.ts` (mechanizm
handlu surowcami cyklicznego pozostaje NIETKNIĘTY, ma inny, poprawny
mechanizm), `gra/data/**` (liczby `punkty` w JSON NIE zmieniają się — to
nadal wartości dla 10 tur/bazowe, mnożnik jest w kodzie), `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-DYPLO-KOSZT-CZAS-TRWANIA-TRAKTATU-Q1`, baza
JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz zaimplementowania mnożnika w JEDNYM z dwóch choke-pointów i uznania
tematu za zamknięty — to dokładnie odtworzyłoby znany bug rozjazdu UI/silnik.
Kryterium 3 wymaga wprost dowodu że OBIE ścieżki dają tę samą liczbę dla tego
samego wejścia. Zakaz zgadywania własnej skali mnożnika dla wartości
pośrednich (12, 13, 17...) — wzór podany w GOAL jest wiążący, nie wolno go
zastąpić np. prostym „zaokrąglij do najbliższego progu".

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
