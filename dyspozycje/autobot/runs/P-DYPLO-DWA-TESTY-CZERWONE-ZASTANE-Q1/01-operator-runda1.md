# P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1 — Operator, runda 1

MODEL+EFFORT: Opus 5, effort high · DATA: 2026-09-05 · ŚCIEŻKA: A (Workflow)
GUARD IZOLACJI (§2b): `ee1f6756` + czyste drzewo — zgodne, praca wyłącznie w `/home/user/wt-dyplo-testy`.

## Bramka 1 — wybór drogi (b), dowód z kodu

Trzecie gołe wywołanie to `gra/src/main.ts:21571`, wewnątrz `(window as any).__audienceRelTestDebug`:
`closeAudience: (): void => { if (isDiplomacyAudienceOpen()) hideDiplomacyAudience(); }`.

- **Kto je dołożył:** `git log -L` → commit `af542199` (`R-DYPLO-RELACJE-AI-AI-AUDIENCJA-Q1`, Obrona rundy 1).
- **Czy zbędne (droga a)? NIE.** Wołają je dwie żywe bramki: `tools/dyplo-mapa-odkrycie-live-test.cjs:115`
  i `tools/diplomacy-relacje-ai-ai-audiencja-live-test.cjs:162`. Usunięcie linii psuje obie.
- **Czy to ścieżka gameplayowa? NIE.** `grep` po `gra/src/**` → zero wywołań; hak jest osiągalny
  wyłącznie przez `page.evaluate` z Playwrighta. Ryzyko, przed którym broni [A4] (odroczona
  bitwa uwięziona, bo ścieżka zamknięcia pominęła flush), tam nie występuje. Wrapper dołożyłby
  RAF-flush mogący wystrzelić `preBattle` w środku asercji tych dwóch bramek.

Dlatego próg 2 → 3, ale **nie sam licznik** (to byłoby „podniesienie progu bez zrozumienia”).
[A4] liczy, a [A4a]–[A4f] **klasyfikują imiennie** każde wywołanie (wrapper / `onBack` / hak)
i dowodzą osiągalności każdego z trzech. `main.ts` NIETKNIĘTY.

## Bramka 2 — naprawa kotwiczenia

Przyczyna `PRZERWANE`: mutacja kotwiczyła na dosłownym, wielolinijkowym bloku `body` case'a '4'.
`R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1` dołożył tam `+ barbDurationSection` i skrócił etykietę
(„…barbarzyńcami (3 tury)" → „…barbarzyńcami") → `mutation.html === 0`. Self-check ZOSTAJE i jest
mocniejszy (nowy licznik `mutation.click`). Kotwice: id `cdb-treaty-mil`/`cdb-treaty-barb`, nazwy
`state.borderMilitary`/`state.barbarianCooperation`, selektor listenera; etykieta przechwytywana ze
źródła; koniec bloku listenera przez dopasowanie nawiasów, nie wcięcie/numer linii.

## ZMIANY/COMMIT

- `gra/tools/diplomacy-audience-close-flush-test.cjs`
- `gra/tools/dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs`
- `dyspozycje/autobot/runs/P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1/01-operator-runda1.md`

Poza allowlistą: nic. `main.ts`, `diplomacyAudience.ts` — 0 zmian.

## TESTY

| Kryterium | Wynik |
|---|---|
| 1. `diplomacy-audience-close-flush-test` | **45/0** (było 36/1 = 37 asercji; nie spadło) |
| 2. `dyplo-przemarsz-checkbox-przycisk-real-render-test` | **23/0**, zero `PRZERWANE` (było 22 przy zieleni) |
| 3. Dowód, że self-check żyje | patrz niżej |
| 4. `tsc --noEmit` (5.9.3) | 0 błędów |
| 5. Referencyjne | logic 213/213 · tech-tree 19/19 · research 33/33 · unit-replace 13/13 · combat 6/6 |
| 6. Rodzina dyplomacji (72 pliki `*.cjs`, grep `diplo`/`dyplo`) | 69 zielonych, 3 czerwone → BLOKADA |

**Kryterium 3 — trzy mutacje, wszystkie CZERWIENIĄ, żadna nie PRZERYWA:**

1. `diplomacyTradeBasket.ts`: `classList.toggle('selected')` → `add('selected')` →
   bramka 2 **22 PASS / 1 FAIL** na `(PO-8)`; self-check `(0)/(0b)/(0c)` nadal PASS.
2. `main.ts`: czwarte gołe wywołanie w `toggleWikiFromToolbar` → bramka 1 **42/3**
   (`[A2]`, `[A4]`, `[A4f]`).
3. `main.ts`: hak przez wrapper **+** gołe wywołanie w `toggleWikiFromToolbar` — licznik NADAL 3,
   sam próg byłby zielony → bramka 1 **42/3** (`[A4c]`, `[A4f]`). To dowód, że klasyfikacja jest
   mocniejsza od licznika.

Mutacje cofnięte KOPIĄ pliku (nigdy `git checkout`), po każdej `git diff --quiet` czyste.
Bramki `*-real-render-*` nadpisują zrzuty w cudzych katalogach `runs/*/dowody/` — przywrócone
kopią z `HEAD`; drzewo zawiera wyłącznie allowlistę.

## BLOKADY

Trzy bramki rodziny dyplomacji czerwone **ZASTANE**, niezależne od tego diffu (dotknięto wyłącznie
dwóch plików testowych; te trzy czytają tylko `gra/src/**` w stanie `ee1f6756`, który jest przodkiem
`origin/main`) — do zgłoszenia jako osobne tematy, nie przypis:

1. `diplomacy-negotiation-table-test.cjs` — 57/58, `runda 1: AI składa kontrofertę (słodzik)`.
2. `dyplo-mapa-odkrycie-live-test.cjs` — 9/1, `(5) Umowa szlaków` (`Przyjmij` wyłączony, `clicked:false`).
3. `dyplo-warunek-niespelniony-czerwony-tooltip-test.cjs` — 22/26, silnik przyjmuje NAP przy
   Relacji 112 mimo progu 130 (reason bez „Relacja zbyt niska na pakt").

Pozycja 3 to bramka tematu, którego Final Control wykrył obie naprawiane tu regresje.

STATUS: PASS
DOMAIN: INFRA
TEMAT: P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1
GOAL: Obie bramki dyplomacji zielone i mierzące to, co miały mierzyć — nie zielone przez rozluźnienie.
ZMIANY/COMMIT: 2 pliki `gra/tools/` + ten raport; SHA w commicie tej rundy
TESTY: 45/0 · 23/0 · tsc 0 · 213/213 · 19/19 · 33/33 · 13/13 · 6/6 · rodzina 69/72
BLOKADY: 3 zastane czerwone bramki rodziny dyplomacji (lista wyżej)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5, effort high)
DEPLOY/PUSH: NIE WYKONANO
