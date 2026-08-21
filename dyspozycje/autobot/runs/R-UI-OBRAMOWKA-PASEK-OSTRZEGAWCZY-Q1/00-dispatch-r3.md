# 00-dispatch-r3 — R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1 (RUNDA 3)

TEMAT: R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1
GOAL: wdrożyć 5 podmian CSS przysłanych przez Designera (`podmien.zip`, 2026-08-21,
zastępuje stan z 2026-08-19), zastępując w całości rundę 2 (blok chip-warning).

## Kontekst rund poprzednich

- Runda 1: usunięto `.sp-blk-stripe` (diagonalny pasek) całkowicie, bez zamiennika —
  BŁĘDNE względem ówczesnego ECHO ("nie usuwać całkowicie").
- Runda 2 (READY_FOR_DEPLOY, zintegrowana w FALA 303): zastąpiono pasek blokiem
  `.sp-blk-alert`/`.sp-blk-alert-ic`/`.sp-blk-alert-txt` z ikoną `chip-warning` i paletą
  `.civ-emp-alert` (border `#4a2a2a`, tło `rgba(224,122,122,.07)`, tekst `#e6c4c4`).
- Designer przysłał świeżą makietę (`podmien.zip`) SPRZECZNĄ z rundą 2: chce z powrotem
  samą obramówkę `3px solid #e8d88a`, bez żadnego bloku ostrzegawczego.

## ECHO (Maciej, 2026-08-21)

Zapytany ponownie (pierwsze pytanie zostało przypadkowo odrzucone kliknięciem — właściciel
sam to sprostował): **świeża makieta Designera wygrywa w całości** nad rundą 2 (usunąć blok
chip-warning, wrócić do samej obramówki). **Wszystkie 5 punktów w jednym dispatchu.**

## Pięć podmian (źródło: `podmien-designer-2026-08-21/PODMIEN-TO.md` w tym katalogu)

1. **Pasek skośny — usunąć całkowicie** (i blok chip-warcia z rundy 2 razem z nim).
   Usuń element/regułę z `gra/src/ui/sidePanelHud.ts`:
   `height:5px;background:repeating-linear-gradient(135deg,#e8d88a 0 10px,#a08030 10px 20px)`
   — a także cały blok `.sp-blk-alert`/`.sp-blk-alert-ic`/`.sp-blk-alert-txt` dodany w
   rundzie 2 (markup + CSS). Karta blokująca zostaje z SAMĄ obramówką
   `3px solid #e8d88a` — bez paska, bez bloku ostrzegawczego. Występuje w 3 wariantach:
   karta blokująca pojedyncza, karta blokująca w kolejce, wariant wąski 330px.

2. **„Zakończ turę", stan aktywny** (`gra/src/ui/bottomBarHud.ts`): usuń
   `border-top-color:#f8eea8`, zostaw `border:1px solid #6a5212`. Zamień cień:
   ```
   /* było */
   box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 6px 18px rgba(232,216,138,.22);
   /* ma być */
   box-shadow: inset 0 1.5px 0 rgba(255,255,255,.55),
               inset 0 -1.5px 0 rgba(70,52,8,.5),
               0 6px 18px rgba(232,216,138,.22);
   ```

3. **„Zakończ turę", stan `.is-disabled`**: zostaje `opacity:.38` i `filter:grayscale(.5)`.
   Usuń `border-top-color:#f8eea8`. Zamień cień:
   ```
   /* było */  box-shadow: none;
   /* ma być */ box-shadow: inset 0 1.5px 0 rgba(255,255,255,.25);
   ```

4. **„Zakończ turę", wariant zablokowany z poświatą** (hover z tooltipem):
   ```
   /* było */
   border: 1px solid #f8eea8;
   box-shadow: 0 0 14px rgba(232,216,138,.3);
   /* ma być */
   border: 1px solid #6a5212;
   box-shadow: inset 0 1.5px 0 rgba(255,255,255,.35),
               0 0 14px rgba(232,216,138,.3);
   ```

5. **Focus-visible — bez `outline`**. Nigdzie nie używać `outline` z `outline-offset`.
   Przycisk akcji (EventCardAction):
   ```
   border-color: #fff2c8;
   box-shadow: inset 0 1.5px 0 rgba(255,255,255,.6),
               inset 0 -1.5px 0 rgba(70,52,8,.35),
               0 0 16px rgba(232,216,138,.5);
   ```
   Karta informacyjna (EventCardInfo):
   ```
   border-color: #e8d88a;
   box-shadow: inset 0 0 0 1px rgba(232,216,138,.35),
               0 0 16px rgba(232,216,138,.45);
   ```

## Zasada designera (do zachowania w innych elementach, nie zmieniać nic poza wskazanym)

Wypukłość = insety wewnątrz jednolitej obramówki, nigdy rozjaśniony `border-top`.
Zaznaczenie = obramówka elementu + poświata na zewnątrz, nigdy drugi kontur obok.

## Czego NIE zmieniać

Rozmiary, odstępy, typografia, kolory tekstu, układ, treść — poza trzema paskami/blokiem,
czterema deklaracjami cienia i dwoma stanami zaznaczenia wymienionymi wyżej.

## Zakres plików

`gra/src/ui/sidePanelHud.ts` (punkt 1), `gra/src/ui/bottomBarHud.ts` (punkty 2–5).

## Branch

`autobot/R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1-r3` (utworzony z `main`/FALA 303, `acd40380`).
