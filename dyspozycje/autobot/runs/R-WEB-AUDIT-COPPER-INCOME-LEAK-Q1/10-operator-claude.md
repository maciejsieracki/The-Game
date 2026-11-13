STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1
GOAL: Ustalić źródło przecieku miedzi (ruda, ~24 000 szt. krótko po wejściu w epokę Brązu): pomiar per tura i cywilizacja + śledzenie wszystkich zapisów `ruda`. Naprawa tylko przy potwierdzonej przyczynie.
ZMIANY/COMMIT: baza d419d3eaf (origin/main). Kod gry BEZ zmian. Jedyna zmiana: ten plik raportu. gra/node_modules zainstalowane (npm ci --ignore-scripts), nie są w commicie.
TESTY:
- Pomiar headless (≥3 ziarna × ≥150 tur, wszystkie 15 cywilizacji): NIE_ZMIERZONO. Powód: narzędzia z dispatchu nie zbierają miedzi. gra/tools/measure-ai-trade-offer-frequency.cjs loguje wyłącznie oferty handlowe AI (nie stan `ruda`) i używa Playwright/Chromium (sprzeczne z dispatchem, który mówi o narzędziach bez przeglądarki). gra/tools/determinism-same-seed-test.cjs nie uruchamia tur. Odczyt `City.surowce` nie jest dostępny z zewnątrz bundla bez nowego haka w gra/src/main.ts (zakazane przez dispatch: instrumentacja tylko w narzędziu).
- Brak tabeli „tura → miedź per cywilizacja → źródło przyrostu”. Nie podaję liczb z pamięci.
- Brak wskazania tury i cywilizacji ze skokiem (nie zmierzono).
- Audyt statyczny: wykonany (poniżej). Wynik: potwierdzona kolizja klucza (błąd osobny od przecieku); NIE potwierdzone źródło 24 000 szt.
BLOKADY:
- Brak runtime'owego odczytu stanu miedzi bez zmiany kodu gry (decyzja orkiestratora: dopuszczalny read-only hook pod bramką ?civTest=1, czy node-harness uruchamiający turę na esbuild-bundlu).
- Mechanizm skoku ~24 000 nieustalony.
RUNDY: 2/5 (runda 1: FC FAIL, operator zablokował się na pomiarze; runda 2: ten raport, pomiar nieukończony).
NASTĘPNY KROK: decyzja orkiestratora o sposobie pomiaru (patrz BLOKADY), potem runda 3 z tabelą per tura/cywilizacja.
DEPLOY/PUSH: NIE WYKONANO

## 1. Potwierdzona kolizja klucza „Ruda żelaza" -> `ruda` (miedź)

Dowód statyczny (baza d419d3eaf):
- gra/src/game/diplomacy-goods.ts:56-57: `'Ruda': 'ruda'`, `'Ruda żelaza': 'ruda'`. Etykieta żelaza mapuje na klucz miedzi.
- gra/src/game/resource-access.ts:69-70: `ruda: 'Ruda'`, `ruda_zelaza: 'Ruda żelaza'` (żelazo ma osobny klucz `ruda_zelaza`).
- gra/src/game/diplomacy-goods.ts `tradableGoodsForOwner`: dla etykiety „Ruda żelaza" tworzy wpis `key: 'ruda'` z `ilosc = citySurowceSum['ruda']` (zapas MIEDZI). Dedupe po `seen` sprawia, że klucz `ruda_zelaza` nigdy nie trafia do indeksu dóbr. Efekt: żelazo nie jest oferowalne w handlu, a na jego miejsce oferowana jest miedź z ilością miedzi.
- gra/src/game/diplomacy-basket-transfer.ts `transferSurowiecIlosc(item.id, ...)` oraz main.ts ~24450 (handel cykliczny) przenoszą `City.surowce[item.id]`. Dla pozycji „Ruda żelaza" item.id = `ruda`, więc przenoszona jest MIEDŹ.
- Ceny: gra/src/game/diplomacy-value-catalog.ts:263 mapuje `ruda_zelaza: 'cena_ruda_zelaza'`, ale katalog wymiany używa klucza `ruda` (diplomacy-value-catalog.ts:310), więc wycena żelaza w handlu idzie przez klucz miedzi.

Ocena: transfer jest zachowawczy (dawca traci, biorca zyskuje; diplomacy-basket-transfer.ts:250-285). Sama kolizja NIE tworzy miedzi. Jest to błąd poprawności (zły surowiec, zła wycena, brak handlu żelazem). Wymaga osobnego tematu (poprawka: mapować 'Ruda żelaza' -> 'ruda_zelaza', 'Ruda' -> 'ruda'; test regresyjny z mutacją).

## 2. Ścieżki TWORZENIA miedzi (zapisy `ruda` w kodzie gry)

- Produkcja z ulepszeń terenu (kopalnia_miedzi): terrain-improvements.ts:325 `kopalnia_miedzi -> ruda`, amount = `resourceProductionAmountForEra(...)`. JSON data/terrain-improvements.json:336 `surowiec_ilosc_tura: 20`, era 2 (Brąz). Mnożnik ery `1.5^(era-1)` (terrain-improvements.ts:289): 20 (era 1), 30 (era 2), 45 (era 3), na kopalnię, raz na heks.
- Przypisanie do miast: computeTerritoryResourceYieldByCity (turn-economy.ts:795-837) liczy każdy heks raz i przypisuje go do najbliższego miasta właściciela terytorium. Nie znaleziono podwójnego liczenia.
- Faza 1 tury (turn-economy.ts ~1820-1865): `creditTerritory('ruda', terrYield.ruda)` per miasto, przez `creditOwnerResourceStock(..., cap)`. Pętla po `cities`, jedna iteracja na miasto.
- Faza 2 (turn-economy.ts ~1868-1930): pula właściciela z `ownerResourceStockAll`, konwertery, potem `assignOwnerResourceStockFromPool` (building-stock-cost.ts:325) czyści i zapisuje sumę ponownie. Konwertery nie tworzą miedzi (odlewnia brązu ją zużywa).
- Podgląd (preview) turn-economy.ts ~1598 z lokalnym `credit`: tylko podgląd, bez zapisu do City.
- Pozostałe odczyty/zapisy `ruda`: diplomacy-goods (etykiety), cityPanel (etykiety), hexContextTooltip (tooltip), entityCards/resourceRows (aliasy nazw), economy.ts:490/890 (rudaTerenu, martwa ścieżka wg komentarza terrain-improvements.ts:186-195), converters.ts (wejście konwertera), ai.ts:2746 (potrzeby AI brązu).
- Nie znaleziono w kodzie gry osobnych zapisów `ruda` przy łupie z bitwy, refundzie Zastąp/rozbiórki, zakupie AI, cudzie ani dyplomacji poza handlem cyklicznym. LUKA: nie przeszukano każdego pliku pod kątem refund/loot oraz nie sprawdzono kosztów w data/buildings.json pod kątem klucza `ruda`; do domknięcia w rundzie 3.

Wniosek z kodu: jedyne bezwarunkowe źródło tworzenia miedzi w turze to kopalnie miedzi (20/30/45 na kopalnię wg epoki właściciela). Przy typowej liczbie miast nie daje to 24 000 szt. jednorazowo. Hipoteza do sprawdzenia w pomiarze (NIE ustalenie): skok capu per typ (cap 50 000 × mnożnik epoki, economy-upkeep.ts magazynEraMultiplier) lub migracja zapisu.

## 3. Hipotezy startowe z dispatchu (status)

- Oferty jednorazowe AI (W38, FALA 665) i handel cykliczny (FALA 621): transfer zachowawczy, nie tworzą miedzi (diplomacy-basket-transfer.ts). Statycznie: nie-źródło. Możliwy efekt przesunięcia przez kolizję z pkt 1.
- Zakup AI i rezerwa 10/3/0: NIE_ZMIERZONO.
- Refund Zastąp/rozbiórka: NIE_ZMIERZONO (luka z pkt 2).
- Łup z bitwy/oblężenia: NIE_ZMIERZONO.
- Mnożnik epoki/odlewni: mnożnik ery działa wyłącznie na produkcję kopalni (terrain-improvements.ts:282-290); odlewnia nie tworzy miedzi.
- Bonusy cywilizacji: NIE_ZMIERZONO.
- Migracje zapisów: NIE_ZMIERZONO.

## 4. Narzędzia pomiarowe (uwaga dla orkiestratora)

Dispatch twierdzi, że gra/tools/measure-ai-trade-offer-frequency.cjs i determinism-same-seed-test.cjs działają bez przeglądarki. To nieprawda: pierwszy używa Playwright i Chromium (/opt/pw-browsers/chromium-1194), drugi nie uruchamia tur. Żadne z nich nie loguje stanu `ruda`. Potrzebne jest nowe narzędzie (read-only), które odczyta `City.surowce` po każdej turze, np. node-bundle albo hak pod ?civTest=1. To wymaga decyzji orkiestratora, bo dispatch zakazuje instrumentacji kodu gry.

## 5. Sprzątanie

- gra/node_modules zainstalowane (npm ci --ignore-scripts, 71 pakietów). Do usunięcia po zakończeniu tematu.
- Dysk /: 8.2 GB wolne przed startem (df -h /).
- Worktree: detached HEAD d419d3eaf.
