STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-RECRUIT-RESOURCE-STOCK-SAME-AS-PLAYER-Q1
GOAL: Audyt ścieżki zakupu jednostek AI vs gracz (zapas surowca kosztu jednostki). Naprawa tylko przy potwierdzonej luce.
ZMIANY/COMMIT: brak zmian w kodzie gry (audyt bez luki). Dodany wyłącznie raport 01-operator-r1.md. Allowlista nieruszona.
TESTY: NIE_URUCHOMIONO (brak zmian kodu; nie uruchamiano build/dev w gra/ ani symulacji). Odczyt kodu i gra/data/units.json.
BLOKADY: (1) Runtime tej roli to Haiku 5.5, a dispatch zakładał Sonnet 5.5 — wynik oparty na odczycie kodu. (2) Pomiar w symulacji (skąd AI ma Brąz ×1994) NIE_ZMIERZONO. (3) Dysk: 4.2 GB wolnego przed startem — brak builda.
RUNDY: 1/5

## Audyt (odczyt kodu)

### Ścieżka zakupu gracza i AI jest wspólna
- gra/src/main.ts `purchaseRecruitmentUnit` (ok. l. 4552–4700): jedyna ścieżka zakupu pojedynczej jednostki, używana przez gracza (onPurchaseUnit) i AI (egzekucja cmd.type==='build', ok. l. 41736–41745: purchaseRecruitmentUnit(cmd.cityId, candId, item.koszt, ownerId)).
- Bramka zapasu: unitStockCost(unitDef) × requestedQuantity porównywane z ownerResourceStockAll(cities, ownerId). Dla ilości 1 przez pickUnitRecruitHint (= canAffordUnitRecruitStock). Odmowa przed jakąkolwiek mutacją (przed Manpower i skarbcem). Brak odgałęzienia po ownerId poza parametrami ownerId-agnostycznymi.
- Pula: ownerSurowcePoolFor(ownerId) (main.ts l. 9742) = ownerResourceStockAll — identyczna dla gracza i AI.
- Wybór kandydata AI: canAfford (main.ts ok. l. 41694–41701) = canAffordUnitRecruitFull(ownerSurowcePoolFor(ownerId), unitDef); ta sama funkcja w precheck canAfford (ok. l. 40019–40036) i w cityHasAffordableUnitRecruitment dla gracza (ok. l. 18015–18030).
- Brak ścieżki „sam dostęp”: nie znaleziono odgałęzienia, które dla AI pomija sprawdzenie zapasu jednostki. Brak odgałęzienia po poziomie trudności w tych bramkach (Trudny = Łatwy/Normalny).
- Płatność: deductBuildingStockCostAcrossCities(cities, ownerId, batchStockCost) (main.ts ok. l. 4701) — po bramce; obcięcie do 0 w building-stock-cost.ts l. 137 (Math.max(0, ...)).

### Dane: gra/data/units.json (75 jednostek)
- Koszt surowcowy mają 74 jednostki: Brąz 34, Żelazo 25, Drewno 15. Ilość (Surowiec (ilość)) dodatnia dla wszystkich 74.
- Bez kosztu surowcowego: Zwiadowca (Typ Civilian).
- Brak jednostki z surowcem „Ruda cyny” / „Ruda miedzi”. Premisa dispatchu „Ruda cyny/Ruda bez ilości” nie potwierdza się w danych jednostek.
- Jednostki Typ Mount (13) dostają dodatkowo +5 Koni (unitRequiresMountHorseStock w unitStockCost) — ta sama bramka dla gracza i AI.

Tabela: jednostka × surowiec × co sprawdza AI vs gracz
| Surowiec kosztu | Liczba jednostek | AI sprawdza | Gracz sprawdza |
|---|---|---|---|
| Brąz (+Koń dla Mount) | 34 | pełną ilość w puli państwa | to samo |
| Żelazo | 25 | to samo | to samo |
| Drewno | 15 | to samo | to samo |
| brak | 1 (Zwiadowca) | nic (brak kosztu) | nic |

Wnioski:
- Ruda cyny/miedzi jest surowcem konwerterów (odlewnia brązu zużywa Rudę cyny z magazynu, converters.ts), a nie kosztem jednostek. Brąz AI powstaje z konwersji, nie z darmowego zakupu.
- Nie znaleziono luki „dostęp zamiast zapasu” ani dla AI, ani dla gracza. Zmiana kodu nie jest uzasadniona bez potwierdzonej luki (DODATEK 1).

### Zapasy AI: źródła (przegląd bez pomiaru)
- Przyrosty puli państwa: creditOwnerResourceStock w main.ts (trade flow ok. l. 37227, zbiory ok. 37668, łupy bitewne ok. 33620, ok. 41837). To przychody (produkcja/handel/łupy), wspólne dla gracza i AI — nie obejście bramki zakupu.
- Brąz AI może rosnąć przez konwertery (wymaga Rudy cyny + Rudy miedzi w magazynie). Skąd ilość 1994 — NIE_ZMIERZONO (wymaga pomiaru w symulacji).

## Rekomendacja
- Jeśli Brąz ×1994 u AI jest realnym problemem: najpierw pomiar źródeł przyrostu (handel/łupy/konwertery/zasoby startowe) w symulacji, nie zmiana bramki zakupu, która już działa identycznie dla obu stron.
- purchaseRecruitmentUnit nie pokazuje komunikatu dla AI (ownerId !== 0), więc ewentualna luka mogłaby leżeć tylko w przyrostach zasobu, nie w bramce.

NASTĘPNY KROK: orkiestrator decyduje, czy otworzyć temat pomiaru źródeł Brązu AI (symulacja) albo zadać ABC właścicielowi; ten temat bez zmian kodu może zostać zamknięty jako PASS (audyt).
DEPLOY/PUSH: NIE WYKONANO
