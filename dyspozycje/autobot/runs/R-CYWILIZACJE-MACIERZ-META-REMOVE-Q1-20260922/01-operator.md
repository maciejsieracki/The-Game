# 01-operator — usunięcie 4 parametrów meta (kamień/brąz/żelazo/tier_roster)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922
GOAL: Właściciel uchylił Wariant C (reference-only) i polecił całkowite usunięcie
4 parametrów meta z macierzy: meta_epoka_kamien, meta_epoka_braz, meta_epoka_zelazo,
meta_tier_roster.
HEAD: b00cfaefe69c1ff2eaed96056c5ae98a73aba19b
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922
WORKTREE: /home/ubuntu/projects/The-Game-civ-matrix-meta-remove-20260922
BASE: origin/main=0caa4dfa31d37337cd74fdbab95ee77da4806d98

## Wykonano

1. `gra/data/civ-matrix.json`
   - Usunięto 4 wpisy z `paramDefs` (113 → 109, policzone programowo).
   - Usunięto te same 4 klucze z `defaults` (113 → 109) — pole nie było
     wymienione wprost w SCOPE, ale acceptance wymaga 0 wystąpień usuniętych
     ID w całym pliku, a `defaults` je zawierał; usunięcie jest wymagane przez
     kryterium końca, nie jest wyjściem poza intencję dyspozycji.
   - Usunięto te same 4 klucze z `params` każdego z 15 wierszy `cywilizacje[]`
     (60 komórek łącznie, policzone programowo — 0 wierszy z brakującym
     kluczem po usunięciu, 0 wierszy z osieroconym kluczem).
   - Zaktualizowano `_meta.kolumny` z 113 na 109 (zweryfikowane programowo
     względem faktycznej liczby kluczy w `paramDefs`).
   - Diff zweryfikowany linia po linii: jedyna zmodyfikowana (nie usunięta)
     linia w całym pliku to `"kolumny": 113` → `"kolumny": 109`; każda inna
     linia diffu to czyste usunięcie. Żaden inny klucz (w tym
     `meta_mnoznik_waluta`) nie został ruszony.

2. `gra/src/game/civ-matrix-semantic.ts`
   - Usunięto Set `REFERENCE_ONLY` i jego 4 identyfikatory.
   - Usunięto gałąź `REFERENCE_ONLY` z `civMatrixConsumerStatus`.
   - Usunięto gałęzie `case 'REFERENCE_ONLY'` z `statusLabel` i `statusReason`.
   - Usunięto gałąź `REFERENCE_ONLY` z `difficultyBehavior`.
   - Usunięto wartość `'REFERENCE_ONLY'` z typu `CivMatrixConsumerStatus` —
     zweryfikowano grepem przed usunięciem, że po usunięciu Setu żaden inny
     parametr/gałąź jej nie używa (jedyne pozostałe wystąpienie stringa
     „REFERENCE_ONLY” w pliku to historyczna proza w komentarzu wyjaśniającym
     supersedowanie, nie identyfikator typu).
   - Zastąpiono komentarz nad dawnym Setem notą odsyłającą do tej decyzji jako
     supersedującej Wariant C, bez kasowania historii bez śladu; nie
     wymieniono w nim wprost 4 usuniętych ID (żeby spełnić kryterium 0
     wystąpień usuniętych ID w pliku), a pełne uzasadnienie odsyła do
     `OWNER-DECISION-20260922.md`.
   - `tsc --noEmit`: PASS, 0 błędów.

3. `gra/tools/civ-matrix-semantic-labels-test.cjs`
   - Zaktualizowano liczby: 113→109 parametrów, 1695→1635 komórek (matrix
     coverage assertions, greek profile length, unique-cell count,
     allParameterIdsPresent, coverage w generowanych artefaktach
     01-allocation.json/01-semantic-contract.json/01-operator.md).
   - Skorygowano treść komunikatu asercji UNWIRED (liczba 480 bez zmian —
     usunięte parametry nigdy nie liczyły się do UNWIRED — ale tekst mylnie
     odwoływał się do „meta REFERENCE_ONLY (4 params) reclassification”,
     której już nie ma; poprawiono na wyjaśnienie że te 4 parametry zostały
     usunięte z macierzy całkowicie, a nie przeklasyfikowane).
   - PASS 309/309 przed i po zmianie (bez regresji; kod pod testem operuje na
     żywej macierzy 109-parametrowej).

4. `gra/tools/civ-matrix-meta-roster-wiring-test.cjs`
   - Usunięto/zaktualizowano asercje odwołujące się do usuniętych 4 ID:
     fixture `ids` zawiera teraz tylko `meta_mnoznik_waluta`; usunięto blok
     asercji epoch-conflict (hetyci/babilonia/asyria vs meta_epoka_zelazo),
     blok tier-coverage (meta_tier_roster) oraz blok REFERENCE_ONLY
     classification dla 4 usuniętych ID.
   - Zachowano bez zmian wszystkie asercje dot. `meta_mnoznik_waluta`
     (matrix accessor, currency consumer Normal/Easy/Hard dla każdej z 15
     cywilizacji, oraz test realnego wyniku ekonomii miasta grecy>zulusi).
   - PASS: 83/83 przed zmianą → 63/63 po zmianie (20 mniej asercji = dokładnie
     tyle, ile dotyczyło usuniętych parametrów; brak osłabienia pozostałych
     asercji).

## Bramki

- `node --check` obu plików testowych: OK.
- `tsc --noEmit` w `gra/`: PASS, 0 błędów.
- `git diff --check`: czyste.
- Diff obejmuje wyłącznie 4 pliki z allowlisty:
  `gra/data/civ-matrix.json`, `gra/src/game/civ-matrix-semantic.ts`,
  `gra/tools/civ-matrix-semantic-labels-test.cjs`,
  `gra/tools/civ-matrix-meta-roster-wiring-test.cjs`.
  20 insertions, 150 deletions łącznie.

## Grep poza allowlistą (zgłoszenie, bez edycji)

Zgodnie ze SCOPE punkt 4, poniższe pliki wciąż zawierają odwołania do
usuniętych 4 ID, ale są poza allowlistą tej karty i nie blokują kompilacji
ani testów plików z allowlisty, więc nie zostały edytowane:

- `panele-sterowania/cyw_macierz_schema.py`
- `panele-sterowania/gen-cyw-macierz.py`
- `panele-sterowania/cyw-macierz/civ-matrix-14-audit.json`
- `panele-sterowania/cyw-macierz/civ-matrix-14-coverage.tsv`
- `gra-robocza/data — kopia/civ-matrix.json`
- `Gra-FINALNA.html`
- `dyspozycje/_handoff/KANAL-PRACA.md`
- `gra-robocza/Gra-ROBOCZA.html`
- `gra-robocza/ROBOCZA-MANIFEST.json`

Rekomendacja dla Evaluatora/Final Control: to są narzędzia panelu sterowania,
zamrożone kopie robocze/produkcyjne i dokumentacja handoff — żaden z nich nie
jest importowany przez `gra/src/**` ani `gra/tools/**`, więc nie wpływają na
runtime gry ani na bramki tego tematu. Jeśli właściciel zechce ich pełne
wyczyszczenie, wymaga to osobnej dyspozycji (inny zakres, inne repo/panel).

## Dowód

- `01-evidence.json` — dokładne liczby przed/po, diff summary, wyniki grep.
- Diff w worktree (niezacommitowany dodatkowo — branch już ma jeden commit
  dispatch `b00cfaef`, ta praca jest w working tree, nie w nowym commicie,
  zgodnie z ACCEPTANCE punkt 5: brak commit/push/merge/deploy).

DEPLOY/PUSH: NIE WYKONANO
