# UNITS → MASTER: Wejście do miasta vs garnizon

**Status:** ZATWIERDZONE Maciej 2026-06-26  
**Lane:** UNITS + UI (kursory) + SILNIK (main.ts)  
**Powiązane:** Q-ARMIA-1 A, kursor domku (`mapUnitCursor.ts`)

---

## Reguła produktowa (kanon v1.0)

### 1. Ruch jednostki na własne miasto (kursor **domek**)

| Aspekt | Zachowanie |
|--------|------------|
| Warunek | Jednostka zaznaczona, heks miasta w zasięgu ruchu, `ownerId` gracza |
| Kursor | Złoty domek (`CURSOR_MAP_ENTER_CITY`) |
| Klik | Jednostka **idzie animacją** na heks miasta |
| Widoczność | **Zostaje na mapie** (token na heksie miasta obok modelu miasta) |
| Garnizon | **NIE** — licznik garnizonu się nie zwiększa |
| Panel miasta | **NIE** otwiera się (to nie klik „zarządzaj miastem”) |
| Po ruchu | Podpowiedź: „Ufort., aby weszła do garnizonu” |

### 2. Ufortyfikowanie w mieście (przycisk **Ufort.**)

| Aspekt | Zachowanie |
|--------|------------|
| Warunek | Jednostka stoi na heksie **własnego** miasta, ma ruch |
| Akcja | `Ufort.` w dolnym pasku armii |
| Efekt | `inGarnizon = true`, ruch = 0 |
| Widoczność | **Znika z mapy świata** |
| Garnizon | Licznik + lista w panelu miasta (`getUnitsAt`) |
| Komunikat | „{typ} w garnizonie — {nazwa miasta}” |

### 3. Ufortyfikowanie poza miastem

- Jak dotąd: zużywa ruch, jednostka **zostaje widoczna** na mapie (obóz polowy — bez `inGarnizon`).

### 4. Klik w miasto **bez** zaznaczonej jednostki

- Otwiera **panel miasta** (produkcja, budynki, okolica).

### 4b. Klik w **własne** miasto **z wojskiem** na heksie (A2-Q5, 2026-07-01)

- Picker **Miasto | Jednostka** — gracz wybiera intencję.
- Wojsko w garnizonie → tylko panel miasta (niewidoczne na mapie).

### 5. Inne kursory (przypomnienie)

| Cel | Kursor |
|-----|--------|
| Własna jednostka (merge) | Spinacz |
| Wróg / wrogie miasto (obok) | Miecz |
| Pusty heks ruchu | **Żołnierz** (złoty + zielona strzałka) |

---

## Implementacja (stan kodu)

| Pole / API | Plik |
|------------|------|
| `RuntimeUnit.inGarnizon?: boolean` | `gra/src/units/setup.ts` |
| `isUnitInGarnizon`, `cityAtUnit`, `finishUnitEnterCityHex` | `gra/src/main.ts` |
| `visibleUnitsList` — ukrywa tylko `inGarnizon` | `gra/src/main.ts` |
| `garnizonCountForCity` — tylko `inGarnizon === true` | `gra/src/main.ts` |
| `getUnitsAt` w panelu miasta — tylko garnizon | `gra/src/main.ts` |
| Kursory | `gra/src/ui/mapUnitCursor.ts` |

---

## DoD (playtest)

1. PLAYTEST-MAPA: Hastati → domek na Testpolis → jednostka **widoczna** na mieście.
2. Ufort. → jednostka **znika**, garnizon w panelu miasta = 1.
3. Klik Testpolis bez jednostki → panel miasta (nie ruch).
4. Ufort. na polu → widoczna, brak garnizonu.

---

## Otwarte (po v1.0)

- Wyprowadzenie jednostki z garnizonu (klik miasta / lista garnizonu).
- Merge dwóch stosów na heksie miasta.
- AI: ta sama reguła wejścia / ufortyfikowania.
