# PLAN: ujednolicenie zwierząt — hodowla = TYLKO ulepszenie (bez złóż na mapie)

Decyzja Macieja 2026-07-09. Niekonsekwencja: Trzoda/Owce/Lama były JEDNOCZEŚNIE złożem (surowiec
na mapie) I ulepszeniem (budowanym) — „to samo dwa razy". Naprawa: hodowla to CZYSTE ULEPSZENIA
(jak farma), bez złóż. Koń ZOSTAJE surowcem (stadnina na złożu konia — koni się szuka).

## USUWAMY jako złoża (Nakladka)
- `ZlozeBydla` (Trzoda), `ZlozeOwiec` (Owce), `ZlozeLamy` (Lama).
## ZOSTAJĄ złoża
- `ZlozeKonia` (Koń→Stadnina), `ZlozeRudy`+metale (miedź/żelazo/węgiel→Kopalnia), `ZlozeGliny`
  (→Glinianka), sól hex.zloze (→Warzelnia), `Las` (→wyrąb/tartak/obóz).
## Ulepszenia zwierzęce = budowane na terenie (jak farma), BEZ złoża
- Pastwisko (`bydlo`, Łąka/Równina), Owczarnia (`owce`, Wzgórza), Zagroda lam (`lama`, Wzgórza/Góry).
- Produkują surowce (Trzoda/Owce/Lama jako SurowiecId ZOSTAJĄ — jak farma daje żywność).

## ZMIANY (pliki)
1. **Generator** `map/gen-helpers.ts` DEPOSIT_RULES (~5585-5618): usunąć reguły **bydło (~5603)** i
   **owce (~5597)** (lama nie ma reguły gen — była tylko posiew). **ZMIENIA HASH mapy** — zamierzone;
   regresja-test sprawdza DETERMINIZM (A==B), więc dalej PASS, tylko wartość hasha inna (nowy baseline).
2. **Posiew lamy** `game/inca-llama-seed.ts` + wpięcie `main.ts` (applyClusterStartPlan): **USUNĄĆ**
   (nie ma ZlozeLamy). Inkowie dostają dostęp do Zagrody lam po TYPIE cywilizacji (isIncaCiv), nie złożu.
3. **Reguły budowy** `map/improvement-build.ts` + `game/livestock-unlock.ts`:
   - bydlo/owce/lama buildowalne BEZ złoża (jak farma) — bramka: teren (TERRAIN_ALLOW zostaje) + tech + cyw.
   - `isLivestockUnlockedForPlacement`: dla bydlo/owce/lama → `return true` (bez wymogu złoża). Koń bez zmian.
   - `depositAllowsPlayerImprovement` bydlo/owce/lama → usunąć (nieistotne).
   - `hasBlockingDepositForFarm`: usunąć wyjątki ZlozeBydla/ZlozeOwiec (nie istnieją; ZlozeKonia zostaje).
   - Nowy Świat: owce/bydło od epoki 3 (bez zmian); lama tylko Inca (isIncaCiv) — przez regułę cyw.
   - `qualifies()` case bydlo/owce/lama: zdjąć wymóg `isLivestockUnlockedForPlacement`/złoża (zostaje teren+cyw+tech).
4. **Render** `render/styleResources.ts`: usunąć case `ZlozeBydla`/`ZlozeOwiec`/`ZlozeLamy` (nie generowane).
   Ulepszenia (Pastwisko=buildTrzoda, Owczarnia, Zagroda lam) renderują się dalej normalnie.
5. **Etykiety** `game/resource-access.ts` NAKLADKA_LABEL: ZlozeBydla/Owiec/Lamy → można zostawić (nie będą
   generowane) lub usunąć. Surowce SUROWIEC_KEY_LABEL Trzoda/Owce/Lama ZOSTAJĄ (produkowane przez ulepszenia).
   Rydwan: dostęp do trzody z Pastwiska (bez złoża) — units.json Surowiec `bydlo` bez zmian.
6. **Macierz B miasta** `game/city-hex-clear.ts` `isKeptDeposit`: usunąć ZlozeBydla/Owiec/Lamy (nie istnieją).
   CITY_KEEP_IMPROVEMENT_KEYS (bydlo/owce/lama) ZOSTAJE (ulepszenia przeżywają miasto).
7. **Cofa część z 2026-07-09:** E2 posiew lamy → usunąć; E1 koń → zostaje; E3 macierz B → złoża zwierzęce znikają.

## Bramki
tsc=0 · smoke OK · hash mapy ZMIENIONY (zamierzone, determinizm A==B dalej PASS) · playtest Macieja:
(a) Pastwisko/Owczarnia/Zagroda lam budowalne bez złoża na właściwym terenie; (b) brak złóż zwierzęcych
na mapie; (c) koń dalej jako złoże + Stadnina; (d) Inka buduje Zagrodę lam (bez złoża); (e) rydwan po Pastwisku.
