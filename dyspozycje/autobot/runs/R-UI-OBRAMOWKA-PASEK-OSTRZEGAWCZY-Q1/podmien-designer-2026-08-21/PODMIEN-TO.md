# Poprawki przycisków i obramówek — Karty wydarzeń

Dotyczy: makieta „The Game — Karty wydarzeń v1" (1E).
Data: 2026-08-21. Zastępuje stan z 2026-08-19.

## Co było nie tak

1. Skośny pasek u góry kart blokujących czytał się jak pas ostrzegawczy na drodze, nie jak
   obramówka karty.
2. Wypukłość przycisku „Zakończ turę" była robiona rozjaśnioną górną krawędzią
   (`border-top-color`). Na narożnikach taka krawędź łamie się w skos i wygląda jak drugi
   przycisk podłożony pod pierwszy.
3. Zaznaczenie (focus-visible) było odsuniętym prostokątnym konturem (`outline` +
   `outline-offset`). Nie trzymał promienia elementu, więc przy narożnikach zostawiał
   złoty ślad z boku.

## Pięć podmian — wartości dosłowne

### 1. Pasek skośny — usunąć

Usuń element:

```
height:5px;background:repeating-linear-gradient(135deg,#e8d88a 0 10px,#a08030 10px 20px)
```

Występuje trzy razy: karta blokująca pojedyncza, karta blokująca w kolejce, wariant wąski
330px. Karta zostaje z samą obramówką `3px solid #e8d88a` — ona i tak niosła cały sygnał.

### 2. „Zakończ turę", stan aktywny

Usuń `border-top-color:#f8eea8`. Zostaw `border:1px solid #6a5212`.

Cień:

```
/* było */
box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 6px 18px rgba(232,216,138,.22);

/* ma być */
box-shadow: inset 0 1.5px 0 rgba(255,255,255,.55),
            inset 0 -1.5px 0 rgba(70,52,8,.5),
            0 6px 18px rgba(232,216,138,.22);
```

### 3. „Zakończ turę", stan `.is-disabled`

Zostaje `opacity:.38` i `filter:grayscale(.5)`. Usuń `border-top-color:#f8eea8`.

```
/* było */
box-shadow: none;

/* ma być */
box-shadow: inset 0 1.5px 0 rgba(255,255,255,.25);
```

### 4. „Zakończ turę", wariant zablokowany z poświatą (hover z tooltipem)

```
/* było */
border: 1px solid #f8eea8;
box-shadow: 0 0 14px rgba(232,216,138,.3);

/* ma być */
border: 1px solid #6a5212;
box-shadow: inset 0 1.5px 0 rgba(255,255,255,.35),
            0 0 14px rgba(232,216,138,.3);
```

### 5. Focus-visible — bez `outline`

Nigdzie nie używaj `outline` z `outline-offset`.

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

## Zasada na inne elementy

Wypukłość robimy insetami wewnątrz jednolitej obramówki, nigdy rozjaśnionym `border-top`.

Zaznaczenie robimy na obramówce samego elementu plus poświata na zewnątrz, nigdy drugim
konturem obok. Dwa promienie leżące blisko siebie zawsze się rozjadą — im większy offset,
tym gorzej.

## Czego nie zmieniono

Rozmiary, odstępy, typografia, kolory tekstu, układ klatek, treść. Zmiany dotyczą wyłącznie
trzech pasków, czterech deklaracji cienia i dwóch stanów zaznaczenia.
