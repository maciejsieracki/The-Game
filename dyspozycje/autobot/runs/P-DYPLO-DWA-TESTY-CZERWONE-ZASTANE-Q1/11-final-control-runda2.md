# P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1 — Final Control, runda 2/5

MODEL+EFFORT: Opus 5, effort high · 2026-09-06 · worktree `/home/user/wt-dyplo-testy`.
Guard §2b: HEAD `c2fea510` zgodny z oczekiwanym, drzewo czyste przed pracą.

STATUS: PASS-WITH-NOTES (dwa własne NAPRAW wykonane i zweryfikowane w tej rundzie)
DOMAIN: INFRA
TEMAT: P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1
GOAL: obie bramki zielone i mierzące zachowanie, nie zapis.

## Weryfikacja niezależna — nie przyjąłem ani jednej liczby z raportu

Wszystkie mutacje aplikowane skryptem na `gra/src/main.ts`, cofane KOPIĄ pliku
(`/tmp/.../main.ts.ORIG`), `git diff` po każdej. Baza przed moimi poprawkami: **46/0**
(runda 1: 45 asercji → brak spadku).

| # | mutacja | oczekiwane | wynik |
|---|---|---|---|
| M1 | F4: nowa funkcja, `closeAudienceNow: () => hideDiplomacyAudience(),` bez średnika, z dala od 7 kotwic | RED | **44/2** — `[A4]` got 4, `[A4f]` 3 z 4 |
| M2 | F2: czysto kosmetyczne rozbicie `closeAudience` na 5 linii | GREEN | **46/0** |
| M3 | realna: `closeAudience: (): void => {},` | RED | **44/2** — `[A4]` got 2, `[A4c]` got 0 |
| M4 | własna: wywołanie w interpolacji `${...}` szablonu | RED | **44/2** |
| M5 | własna: wzmianka w komentarzu **i w napisie/szablonie** | GREEN | **45/1 — FAŁSZYWY ALARM** |
| M6 | własna: rename klucza `closeAudience` → `closeAudienceHook` | RED | **44/2** |
| M7 | własna: kosmetyczne złamanie linii **sąsiedniego** haka `__rebelNotifyTestDebug` | GREEN | **44/2 — FAŁSZYWY ALARM** |
| M8 | własna: F3, gołe wywołanie bez średnika przed wrapperem | RED | **43/3**, w tym `[A2]` |
| M9 | własna: dedentacja całego wrappera | GREEN | 46/0 |
| M10 | własna: rozbicie `requestAnimationFrame(` na dwie linie | GREEN | 46/0 |

U1 i U2 z ratyfikacji **potwierdzone jako naprawione** (M1, M2, M3, M4, M8).

## NAPRAW — dwa defekty tej samej klasy co U2, znalezione przeze mnie

**D1 (M7), `gra/tools/diplomacy-audience-close-flush-test.cjs:270`.** Zakres haka kończył
się literałem `'\n    (window as any).__rebelNotifyTestDebug'` — czyli **wierszem SĄSIADA**.
U2 przesunęło kruchość o jeden poziom na zewnątrz: przeformatowanie albo usunięcie
*niezwiązanego* haka dawało `region === null` → `[A4c]` „got 0" + `[A4f]`, 44/2 bez zmiany
semantyki. Naprawa: `debugHookRegion()` — regex tolerujący białe znaki + **parowanie klamer
na masce kodu**, koniec regionu wyznacza własna klamra haka. Dołożona asercja, że region
się w ogóle domknął.

**D2 (M5), `[A4d]`.** Ukryte wystąpienie było akceptowane tylko, gdy **wygląd linii**
zaczynał się od `//`, `*`, `/*`. Legalny `const s = 'hideDiplomacyAudience() ...'` czerwienił
bramkę (45/1). Napis nie jest kodem — zamaskowanie go jest poprawne. Naprawa: `maskNonCode()`
raportuje teraz `maskSpans` z rodzajem (`comment`/`string`/`tpl`); `[A4d]` pyta maskę wprost,
nie o wcięcie.

**Kontrola przeciw tautologii.** Samo `[A4d]` po naprawie pytałoby maskę o jej własny werdykt,
więc maska maskująca WSZYSTKO (klasyczny cichy zaniżacz `[A4]`) przeszłaby. Dołożone `[A4d2]`
— self-test maski na próbce o znanej odpowiedzi. Dowód, że nie jest pusty: sabotaż
`maskNonCode` („maskuj wszystko") → **36 pass, 15 fail**, w tym dwa `[A4d2]`. Sabotaż cofnięty
kopią pliku.

## TESTY po moich naprawach

- `diplomacy-audience-close-flush-test.cjs` — **51 pass, 0 fail** (46 → 51, zero spadku).
- Cała tabela mutacji powtórzona na naprawionej bramce: M2/M5/M7/M9/M10 → **51/0**;
  M1/M3/M4/M6 → **49/2**; M8 → **48/3**. Każda cofnięta kopią, `main.ts` bajt w bajt = ORIG.
- `dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs` — **23 PASS, 0 FAIL**, zero `PRZERWANE`.
- `tsc --noEmit` — exit 0.
- Referencyjne: logic **213/213**, tech-tree **19/19**, research **33/33**,
  unit-replace **13/13**, combat **6/6**.

## ZAKRES

`git status`: zmodyfikowany **wyłącznie** `gra/tools/diplomacy-audience-close-flush-test.cjs`
+ ten raport. `gra/src/main.ts` NIETKNIĘTY (`git diff --stat` puste, `diff` z kopią czysty).
`dyplo-przemarsz-...-test.cjs` NIETKNIĘTY.

## WERDYKT

**PASS-WITH-NOTES.** Kryteria końca rundy 2 spełnione i zweryfikowane samodzielnie; dwa
znalezione fałszywe alarmy naprawione w pliku z allowlisty i pokryte mutacyjnie.

BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora → `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO
