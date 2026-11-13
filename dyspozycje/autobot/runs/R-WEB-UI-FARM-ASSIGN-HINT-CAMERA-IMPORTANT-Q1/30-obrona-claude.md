# 30 — Obrona Operatora (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-FARM-ASSIGN-HINT-CAMERA-IMPORTANT-Q1
GOAL: podpowiedź „Przydziel obywatela?” w zakładce „Ważne” z przyciskiem „Pokaż” centrującym kamerę na nowym polu; ogólna akcja `centerCamera` w SidePanelEvent.
ZMIANY-COMMIT: kod bez zmian względem kandydata 994fad7df (brak poprawki). Ten commit dodaje wyłącznie raport 30-obrona-claude.md. Kod nie był zmieniany po wykonaniu bramek poniżej.
BAZA: origin/main 546fdf6bf. Kandydat operatora: 994fad7dfe4caad48b7eac5304f2f3e1d9e32b2d.

## Odpowiedź na zarzuty Evaluatora

### Zarzut 1 (brak dowodu Chromium: zrzut zakładki Ważne z „Pokaż” i dowód centrowania) — PRZYJMUJĘ

Zarzut był zasadny: w 10-operator-claude.md Chromium było NIE_ZMIERZONO. W tej rundzie wykonałem weryfikację w żywej grze (Chromium, Playwright, `chromium-1194`, headless, `--no-sandbox`, bundle zbudowany `npx vite build --outDir <poza repo>` z kandydata 994fad7df).

Wynik surowy (skrypt scratch, poza repo):

```
"wazneCount": "1"
"cardInWazne": { "present": true, "ctaText": "Pokaż →" }
"focusBefore": { "x": 60.6217782649107, "z": 48, "dist": 22 }
"expected":    { "x": 3.4641016151377544, "z": -3 }      // axialToWorld(3,-2)
"focusAfter":  { "x": 3.4641016151377544, "z": -3, "dist": 22 }
"centered": true, "delta": { "dx": 0, "dz": 0 }
```

- Zrzut zakładki „Ważne” (licznik `Ważne 1`) z kartą „Przydziel obywatela?” i przyciskiem „Pokaż →”: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/shots/fahc-1-wazne-pokaz.png` (zrzut poza repo, nie commitowany).
- Kliknięcie `[data-sp-goto]` przesunęło fokus kamery dokładnie na współrzędne świata `axialToWorld(q,r,HEX_R)` (delta 0,0).

Uczciwe zastrzeżenia (ZAŁOŻENIA, nie BLOKADY):
1. Do kamery potrzebny był hak diagnostyczny (`__camDbg` / `__axDbg`) dodany TYMCZASOWO do `gra/src/main.ts` tylko w buildzie scratch. Po buildzie przywrócono plik (`git checkout -- gra/src/main.ts`), `git status` czysty. Hak nie jest w commicie.
2. Kartę wstrzyknięto przez istniejący hak `__sidePanelLinkTestDebug.seedEvents` o kształcie identycznym z wynikiem `buildFarmAssignHintSidePanelEvent` (`important: true`, `action: {kind:'centerCamera', q:3, r:-2, cityId}`, `kind:'city'`). Nie wymuszono prawdziwej reguły farmowej w grze (brak przydziału w scenariuszu). Wiring `main.ts` (getEventLink → onEventClick → camCtrl.focusAt) został sprawdzony na prawdziwym buildzie; sama reguła „kiedy powstaje podpowiedź” pokryta jest testami tematu (16/0) i wcześniejszymi rundami.
3. Dispatch `00-dispatch.md` nie istnieje na origin/main (zgodnie z uwagą Evaluatora); oceniano wg DODATKU orkiestratora.

### Weryfikacja dodatkowa (poza zarzutem)

Sprawdzono ponownie na czystym checkout kandydata:
- `node ./node_modules/typescript/bin/tsc --noEmit` → EXIT 0, 0 linii wyjścia.
- `node tools/farm-assign-hint-camera-important-test.cjs` → `WYNIK: 16 PASS / 0 FAIL`, EXIT 0.

## TESTY (surowe wyniki w tej rundzie)

| Bramka | Wynik |
|---|---|
| `tsc --noEmit` (gra/) | EXIT 0, brak błędów |
| `tools/farm-assign-hint-camera-important-test.cjs` | 16 PASS / 0 FAIL |
| `npx vite build --outDir <scratch> --emptyOutDir` (kandydat) | EXIT 0, „built in 17.90s" |
| Chromium: zakładka Ważne + Pokaż + centrowanie | centered=true, delta 0,0 |

Bramki referencyjne (logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6) i mutacje zostały wykonane przez Evaluatora w 20-evaluator-claude.md; nie powtarzano ich w tej rundzie (kod nie zmieniał się). Operator w tej rundzie wykonał tylko bramki wymienione wyżej.

## BLOKADY

Brak. (Zarzut 1 przyjęty i zamknięty dowodem; brak zmian kodu.)

## RUNDY

2/5 (runda obrony po FAIL/PASS-WITH-NOTES Evaluatora; werdykt 20-evaluator: PASS-WITH-NOTES, jedyny zarzut = Chromium).

## NASTĘPNY KROK

Final Control (Sonnet) na kandydacie 994fad7df + raporcie 30-obrona-claude.md; integracja orkiestratora po FC. Operator nie integruje.

## DEPLOY/PUSH: NIE WYKONANO
