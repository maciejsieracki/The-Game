# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-DYPLO-PAKT-WETO-EKSPANSJA-Q1`
GOAL: Audyt bramki „Ekspansja przy granicy — brak zaufania do paktu": ustalić, czy twarde,
niekompensowalne weto Paktu o nieagresji jest zamierzone, czy jest defektem, i doprowadzić
do stanu, w którym gracz **wie, co ma zrobić, żeby zawrzeć umowę** — albo umowa jest
osiągalna, albo jej niedostępność jest jawnie i uczciwie zakomunikowana.

## Wyzwalacz — ECHO właściciela (2026-08-25, główny czat orkiestratora)

> „kolejny problem w dyplomacji, nie można zawrzeć deala, temat do audytu autobot"

Zrzut ze Stołu negocjacji (partner: **Harappa**, Vasu): gracz oferuje **264 PW** (baza 200,
Relacja −19% siły), oni oferują **200 PW**, **BILANS NETTO +64** na korzyść drugiej strony.
Relacja **81/200**, Zaufanie **17/100**, Respekt **64/100**, nastawienie **ŻYCZLIWY**.
Mimo to pakiet jest zablokowany komunikatem: **„Nie spełnia warunków: Ekspansja przy
granicy — brak zaufania do paktu"**. W panelu „ZA CO CIĘ NIE LUBIĄ" widnieje
„Ekspansja przy granicy **−2 / turę**".

## Punkt zaczepienia (recon orkiestratora — POTWIERDZONY ODCZYTEM, do weryfikacji pomiarem)

`gra/src/game/diplomacy-proposals.ts:878-894`, `case 'nap'`:

```ts
if ((ctx.proposerWiarygodnosc ?? 0) < p.wiarygodnoscProgNapMin) { ...próg... }
const napEase = sweetenerEasePoints(payload, pnOpts);          // słodzik OBNIŻA próg
const napThreshold = Math.max(0, p.progNapRelacja - napEase);
if (score < napThreshold) { ...próg... }
if (ctx.ekspansjaPrzyGranicy) {                                 // <-- TWARDE WETO
  return { accepted: false, reason: 'Ekspansja przy granicy — brak zaufania do paktu' };
}
```

**Sedno do rozstrzygnięcia:** dwa warunki wyżej są PROGOWE i jawnie kompensowalne słodzikiem
(`sweetenerEasePoints` — decyzja `C-DYP-STOL-Q1=B`), a ten jest **binarnym wetem** —
żadna ilość PW, żaden słodzik, żadna Relacja go nie przebije. To jest sprzeczność wewnątrz
jednej funkcji: projekt mówi „da się dopłacić", a to weto mówi „nigdy".

Powiązane miejsca: `diplomacy-factors.ts:184` (wiersz czynnika), `diplomacy.ts:157` i `:923`
(komentarz: „modelled as one-shot −2 Zaufanie" — a UI pokazuje **−2/turę**, czyli stan ciągły;
ta rozbieżność jest osobnym podejrzeniem), `ui/diplomacyAcceptanceBalance.ts:431` i `:524`
(render komunikatu).

## Kryteria sukcesu

1. **Ustalić u źródła**, czy weto jest zamierzone: przeszukać `docs/decyzje/`,
   `REJESTR-PROSB-I-ZADAN.md`, `WERSJE.md` i historię commitów tej linii. Zacytować dosłownie.
   Sprzeczne lub brak źródeł → `DECISION_REQUIRED`, nie zgadywanie.
   Kontekst: `R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1` (priorytet bramek uczciwość vs chęć
   do handlu) domykał się dopiero w **rundzie 4**, po trzech regresach — ten obszar jest
   podatny na nawroty, więc źródła czytać uważnie.
2. **Czy weto jest w ogóle wyjściowe?** Zmierzyć: co ustawia `ctx.ekspansjaPrzyGranicy`,
   jak długo trwa, czy gracz ma JAKĄKOLWIEK akcję, która je zdejmuje, i po ilu turach.
   Jeśli stan jest trwały dopóki granice sąsiadują — Pakt o nieagresji jest **strukturalnie
   nieosiągalny** z takim sąsiadem, co trzeba nazwać wprost.
3. **Rozjazd one-shot vs −2/turę** (`diplomacy.ts:923` vs UI) rozstrzygnięty pomiarem:
   czy to jednorazowa kara, czy ciągła. Jeśli kod i UI mówią co innego — to defekt.
4. **Parytet (rule_108, `R-PROC-AUTOBOT-EVAL-STRICT-PARITY`):** czy AI podlega temu samemu
   wetu, gdy to ONO proponuje pakt graczowi. Asymetria bez jawnej decyzji = FAIL.
5. **Uczciwość komunikatu:** gracz musi wiedzieć, czy warunek da się spełnić i jak.
   Dziś komunikat brzmi jak przejściowa przeszkoda, a może być ścianą nie do przejścia.
   Docelowo: albo warunek staje się kompensowalny (spójnie z `sweetenerEasePoints`), albo
   UI jawnie mówi „niedostępne dopóki X", z podaniem X.
6. Zero regresji: bramki dyplomacji (`gra/tools/*dyplo*`, `*diplomacy*`, w tym testy
   `R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1`) + 5 bramek referencyjnych zielone. Każda
   zaktualizowana asercja uzasadniona jawnie.
7. `tsc --noEmit` i `vite build` (C-001) czyste. Real render dla zmienionego UI.

## Izolacja

Gałąź `autobot/R-DYPLO-PAKT-WETO-EKSPANSJA-Q1` od `origin/main`, osobny worktree per rola.

**UWAGA — TEMATY RÓWNOLEGŁE:** biegną `R-PRACA-JEDEN-PODZIAL-Q1`,
`R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`, `P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`. Ten temat nie
dzieli z nimi plików (dyplomacja vs ekonomia/UI budowy), ale `main` może się przesunąć —
nie zakładaj, że tamte są zintegrowane.

## Allowlista

- `gra/src/game/diplomacy-proposals.ts` — WYŁĄCZNIE bramka `case 'nap'` i to, co jej dotyczy.
- `gra/src/game/diplomacy.ts` — WYŁĄCZNIE modelowanie czynnika „Ekspansja przy granicy”.
- `gra/src/game/diplomacy-factors.ts` — WYŁĄCZNIE wiersz tego czynnika.
- `gra/src/ui/diplomacyAcceptanceBalance.ts` — WYŁĄCZNIE komunikat/prezentacja tej bramki.
- `gra/tools/*` — nowy test bramki + aktualizacja istniejących.

NIE ruszać: `gra/data/**`, `dyspozycje/WERSJE.md`, pozostałych typów umów (sojusz, traktat
przemarszu, tribut) — chyba że pomiar wykaże, że mają identyczne weto; wtedy zgłosić jawnie,
nie rozszerzać zakresu w biegu.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna gałąź.
Limit 5 rund. Model/effort: Opus 5 High dla Operatora i Evaluatora, Final Control Sonnet 5 High.
`opts.model` jawnie na KAŻDYM wywołaniu `agent()` (C-062).

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–7 wyżej.
BLOKADY: brak (pkt. 1 i 2 to jawne miejsca na DECISION_REQUIRED).
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
