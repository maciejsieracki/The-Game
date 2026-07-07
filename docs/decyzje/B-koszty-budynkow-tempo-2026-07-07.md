# Koszty budynków — mnożnik Pracy (2026-07-07)

**Decyzja Macieja:** opcja w kreatorze nowej gry (zaawansowane opcje), analogicznie do tempa badań.

Bazowe wartości `kosztBudowy` w `buildings.json` zostają bez zmian — to **Niski (×1)**. Ustawienie w kreatorze mnoży wymaganą Pracę przy budowie:

| Ustawienie kreatora | Klucz `buildingCostPace` | Mnożnik kosztu |
|---|---|---|
| Niski | `niski` | ×1 |
| Normalny | `normalny` | ×2 |
| Wysoki | `wysoki` | ×4 |

## Gdzie w UI

Krok 4 kreatora → przycisk **Zaawansowane opcje** → wiersz **Koszty budynków** (Niski / Normalny / Wysoki). Podsumowanie kroku 5 pokazuje wybrany poziom.

## Implementacja

- `applyBuildingCostPace()` w `gra/src/game/building-cost-tempo.ts`
- `buildingWorkCost()` w `gra/src/game/production.ts` — po `itemCost()` i ulgach cywilizacji (`buildingCostAfterCivDiscount`)
- Stan: `player.buildingCostPace` w `playerState.ts`
- Zapis: `gracz.buildingCostPace` w sejwie (`main.ts`)

## Zakres

- **Dotyczy:** budynki w kolejce produkcji miasta, katalog budynków w panelu miasta, zakup za złoto (koszt 1:1 z Pracą).
- **Nie dotyczy:** rekrutacja jednostek (`itemCost('jednostka', …)`), cudy świata (osobny system w `main.ts`), ulepszenia terenu.

## Przykład

**Świątynia** (bazowy `kosztBudowy` = 25 Pracy):

| Ustawienie | Koszt w grze |
|---|---|
| Niski | 25 Pracy |
| Normalny | 50 Pracy |
| Wysoki | 100 Pracy |
