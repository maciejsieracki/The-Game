# Plan: Zwiadowca — przycisk auto-odkrywania mapy

**Data:** 2026-08-03  
**Branch planu:** `cursor/plan-scout-auto-explore-btn-63a1`  
**ID:** P-SCOUT-EXPLORE-Q1  
**Status:** WDROŻONE (kod) — branch `cursor/fix-scout-auto-explore-btn-63a1`

## Sytuacja (dziś w grze)

Już istnieje moduł `gra/src/game/scout-auto-explore.ts`:
- na **koniec tury** wszystkie zwiadowcy gracza z ruchem **automatycznie** idą w stronę mgły (nieodkrytych heksów),
- po wejściu na heks z chatką/skarbem (`wioska`) zbierają nagrodę (`checkVillageRewardAt`),
- **brak przycisku** — gracz nie włącza ani nie wyłącza,
- **brak priorytetu skarbów** — nie celują w widoczne chatki, tylko scorują mgłę.

## Cel Macieja (cytat)

> U zwiadowców brakuje automatycznego odkrywania mapy. Żeby nacisnąć im jeden przycisk i automatycznie odkrywają mapę. Jeżeli widzą gdzieś skarby, to idą w kierunku tych skarbów, żeby je odkryć. A potem szukają kolejnych miejsc do odkrycia.

## Propozycja wdrożenia

### 1. Przycisk na zwiadowcy
- Akcja w dolnym HUD jednostki (obok Czuwaj / Pomiń): **„Zwiedzaj”** / **„Wyłącz zwiedzanie”**.
- Tylko dla `Zwiadowca` (`category === 'zwiadowca'` lub `typeId === 'Zwiadowca'`).
- Stan na jednostce: `autoExplore?: boolean` (zapis w save jak `sentry`).

### 2. Priorytet celów (kolejność)
1. **Widoczna chatka/skarb** (`hex.wioska.istnieje`, właściciel null, heks w aktualnym widoku jednostki) → idź najkrótszą ścieżką.
2. **Brzeg mgły** — obecny scoring (`scoreHexForExplore`).
3. Brak celu → stoją (koniec ruchu / koniec mapy).

### 3. Kiedy działają
- Po włączeniu przycisku: **od razu** zużywają pozostały ruch w tej turze (animacja lub jak dziś teleport na EOT — patrz ABC).
- Na koniec każdej tury: kontynuują, dopóki `autoExplore === true`.
- Wyłączenie: przyciskiem, albo ręcznym ruchem / innym rozkazem (jak czuwaj).

### 4. Pliki
| Plik | Zmiana |
|------|--------|
| `scout-auto-explore.ts` | priorytet wioski w vision; filtr `autoExplore` |
| `main.ts` | przycisk HUD + handler + EOT tylko z flagą |
| `units/setup.ts` | pole `autoExplore?` |
| `save.ts` | serializacja |
| `unitActionBarHtml.ts` / `armyStackHud.ts` | ikona |
| `scout-auto-explore-test.cjs` | testy wioska + toggle |

### 5. Poza zakresem MVP
- Osadnicy, wojsko — nie.
- Podział mapy między kilku zwiadowców (mogą iść w tę samą stronę — OK na start).
- Osobny typ „skarb” poza chatkami (`wioska`) — w grze skarby = chatki.

## Decyzje do Macieja (ABC)

Zapisane poniżej w czacie — wdrożenie po `działaj` / odpowiedziach.
