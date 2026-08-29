# 01 — OPERATOR (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T10`
GOAL: Audyt Drużynnika (Słowianie) i iButho z iklwa (Zulusi) w
`jednostki-z3-plemiona.ts`, zachowanie spójności kulturowej z T4 (Jeździec
z oszczepami).
MODEL/EFFORT: Opus 5 (`claude-opus-5[1m]`), zgodnie z dispatchem (§5a).
COMMIT: `a9cc6e07`, gałąź `autobot/ZELAZO-AUDYT-T10-Q1`.

## Znalezione i naprawione pomiarem

- **D1 — pas Drużynnika: 0 pikseli.** Bryła 0.190×0.034×0.112 w całości
  zamknięta w sumie zakresów kaftana i dołu rubachy. Po naprawie 280 px.
- **D2 — głowica miecza: 0 pikseli** (0.030×0.024×0.024 przy pięści
  0.046×0.046×0.048). Po naprawie 334 px.
- **D3 — iButho i Impi to była jedna figurka.** Odróżnialność 0.370 przy
  progu rodziny 0.558; iklwa była kopią 1:1 geometrii włóczni Impi. Po
  T10: 0.589.
- **D4 — nazwa EN „Druzhinnik" nie trafiała w model** (rdzeń tylko
  polski), wracała do generyka `miecznik`: 28 mesh zamiast 32.
- Dwa nieprawdziwe zdania w istniejących komentarzach poprawione: hełm
  czarnomogilski błędnie opisany jako z nosalem; kolor tarczy Zulusów
  jako wskaźnik starszeństwa pułku — było odwrócone.
- Kryterium 3 dispatchu (iklwa jako broń kłująca, nie miotana) spełnione
  mierzalnie: `missileKind: 'none'`, uchwyt bliżej pięty drzewca.

## Testy

`zelazo-slowianie-zulusi-real-render-test.cjs` — 75 pass/0 fail (13
asercji + macierz ablacyjna 13 mutacji). `tsc --noEmit` 0 błędów, `vite
build` (C-001) czysty. Zero regresji: seria T1-T9(bez T9)/T11 zielona, 5
bramek referencyjnych zielonych (unit-power 4/2 — pre-istniejący, nie
regresja).

## Zgłoszenia własne (poza allowlistą lub do rozstrzygnięcia)

1. Deski tarczy Drużynnika promieniste, nie równoległe — powtórzone też w
   pliku T4 (`zelazo-jezdziec-oszczepami-opus5.ts`), które powołuje się na
   Drużynnika jako kanon. Nie poprawione (rząd 4, niezweryfikowane w
   źródle wyższego rzędu) — zarejestrowane osobno.
2. Zmodyfikowany test T8 (`zelazo-germanie-real-render-test.cjs`) w dwóch
   miejscach dla wpisu `druz` — zgłoszone do kontroli Evaluatora (patrz
   02, F1: okazało się to błędem, poprawione przez Final Control).
3. Poprawione dwa akapity nagłówka MODUŁU (opisy Drużynnika/iButho) mimo
   literalnej allowlisty ograniczonej do funkcji — uzasadnione tym, że
   inaczej defekt zostałby przeniesiony, nie naprawiony. Zaakceptowane
   przez Evaluatora i Final Control.
4. Para Drużynnik/Miecznik galijski = 0.521, nadal poniżej progu 0.558 —
   stan zastany, zależność od T9.

RUNDY: 1/5.
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO.
