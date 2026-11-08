# Integracja R3 — zwolnienie głównej armii po pięciu turach

**Etap: 9/11 — zintegrowano do `main` w ograniczonym zakresie.**

## Kontrakt i zmiana

Po pięciu pełnych turach zbiórki główna grupa z Wodzem zaczyna marsz w szóstej turze,
nawet jeśli odosobniona jednostka nadal ma rozkaz rendezvous. Ta jednostka dalej podąża
do grupy. Zwykły plan wojny all-in bez tej opcji zachowuje dotychczasowe oczekiwanie.
Zmiana jest opt-in wyłącznie w `appendAiGeneralCampaignOrders`.

## Weryfikacja na aktualnym `main`

- źródło kampanii: `ai-general-war-campaign-test.cjs` — **51/51 PASS**.
- ogólny planer all-in: **94 PASS / 4 znane baseline failures** (`1a` oraz trzy `6b`),
  identyczne przed fixem i po nim; nowe asercje R3 `8d3–8d5` są zielone.
- `npm run typecheck` — PASS.
- `git diff --check` — PASS.
- niezależny Evaluator: PASS-WITH-NOTES.
- Final Control R3: PASS-WITH-NOTES, produkcyjny Chromium **28/28**. Po pięciu EOT
  zbiórki, EOT6 wydał i wykonał ruch wszystkich czterech jednostek głównej grupy
  `(2,2) → (4,2)`, a osobny follower wykonał rendezvous `(8,6) → (6,6)`.
  `noPath=[]`, `held=[]`, page errors 0.

Surowe dowody: `04-operator-r3-20261030.md`, `50-final-control-r3-20261030.md` i
`evidence/seed-sweep-20261030/r3-post-fix-live-20261030.json`. The raw Chromium
trace remains in the operator's local workspace; the structured trace is the
checked-in reproducible evidence.

## Ograniczenia

To land-only fixture (beginWarCampaign ustawił wszystkie 3952 pola jako ląd); test nie
dowodzi trasy morskiej. Nie ma zapisu dokładnej mapy właściciela. Live gate mierzy ruch,
nie obrażenia ani zdobycie miasta. Te ograniczenia nie zmieniają wykazanego zachowania:
zebrana główna grupa przestaje bezterminowo czekać na spóźnionego followera.
