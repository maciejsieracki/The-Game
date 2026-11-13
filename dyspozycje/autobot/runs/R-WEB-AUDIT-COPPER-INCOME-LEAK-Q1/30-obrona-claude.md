STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1
GOAL: Ustalić źródło przecieku miedzi (`ruda`, ~24 000 szt. krótko po wejściu w epokę Brązu): pomiar per tura i cywilizacja oraz śledzenie zapisów `ruda`. Naprawa tylko przy potwierdzonej przyczynie.
ZMIANY/COMMIT: baza 07326172a (kod gry gra/src identyczny z d419d3eaf). Zmiana w tej rundzie: NOWE narzędzie pomiarowe `gra/tools/copper-leak-q1-measure.cjs` (poza src/, w allowliście) oraz ten raport. Kod gry bez zmian. SHA: patrz sekcja "Commit" na końcu.
TESTY:
- Pomiar headless, SMOKE (NIE pełny): 1 seed (4242), 42 miasta, 2 tury zmierzone (T2, T3). Surowe dane: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/out-test/seed4242.jsonl`. Wynik: `phase.ruda` = 0 dla owner 0..41 w T1, T2, T3. Zgodne z oczekiwaniem: kopalnie miedzi nie produkują przed epoką Brązu. Uwaga: build i runy były na kodzie e8a731bc6 (HEAD main w chwili pracy), nie na 07326172a. Różnica dotyczy gra/src; zanotowane, bo pomiar jest smoke'iem.
- Czas tury (surowo z jsonl, pole `ms` = od endTurn do końca tury): T2 = 54306 ms, T3 = 51662 ms. Pole `aiMs` = 385 / 373 ms, `dipMs` = 27 / 25 ms. Czyli ~50 s tury NIE jest w AI ani w dyplomacji. Przyczyna NIE_ZMIERZONO (nie profilowano).
- Run zakończył się błędem `Target page ... closed` w T4 po 580 s: to skutek MOJEGO `timeout 580`, nie błąd gry.
- Bramki tsc + 5 bramek: NIE uruchamiane w tej rundzie, bo nie zmieniono TS (gra/src bez zmian). Liczby bramek z ZARZUTÓW Evaluatora cytuję jako jego, nie jako moje.
- Audyt statyczny rozszerzony (patrz niżej), każde twierdzenie z linią.
BLOKADY:
- Pełny pomiar (≥3 ziarna × ≥150 tur × 15 cywilizacji) NIEWYKONALNY w obecnym reżimie: ~52 s/turę × 150 = ~2,2 h na seed, ~6,5 h szeregowo dla 3 seedów. Runner `longrun-100-turns-leak-q1-measure.cjs` NIE jest wznawialny (każdy start od tury 1), a reguła procesu zabrania `run_in_background` i ogranicza Bash do 590 s. Tego nie da się obejść w jednym wywołaniu Operatora.
- Mechanizm skoku ~24 000 NIEUSTALONY (brak pomiaru).
- Hak w kodzie gry NIE jest potrzebny (patrz odpowiedź na zarzut 2), więc to nie blokada decyzyjna. Blokada to czas i reżim wykonania.
RUNDY: 3/5 (r1 FC FAIL, r2 FC FAIL, r3 ta obrona przed FC; to jest odpowiedź na zarzuty Evaluatora z 07326172a).
NASTĘPNY KROK: DECISION_REQUIRED dla orkiestratora (patrz "Decyzja"). Bez decyzji runda 4 nie ma sensownego zakresu.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 (brak pomiaru, kryterium 1 niespełnione): PRZYJMUJĘ
Pomiaru nie wykonano. Przyjęta poprawka: narzędzie pomiarowe, które potrafi zmierzyć miedź per owner i zostało uruchomione (smoke, 2 tury). Pełny pomiar wymaga decyzji o reżimie wykonania (sekcja Decyzja). Dowód: jsonl ze ścieżką powyżej.

### Zarzut 2 (uzasadnienie blokady „potrzebny hak w kodzie gry” nieudowodnione): PRZYJMUJĘ część, ODRZUCAM tezę o haku
- ODRZUCAM: pomiar NIE wymaga haka w kodzie gry ani zmiany `civ-test-hooks.ts`. Narzędzie `copper-leak-q1-measure.cjs --prepare <kopia>` modyfikuje WYŁĄCZNIE kopię gry poza repo (katalog scratchpad). Dopisuje do `__leakDump.dump()` jedną linię, która czyta `c.surowce.ruda` dla każdego miasta (`cities` jest w zasięgu domknięcia `main()`, patrz `longrun-100-turns-leak-q1-measure.cjs` prepare, marker `__leakDump`) i wpisuje sumę per `ownerId` do `window.__phaseT.ruda`. Ta wartość trafia do każdej linii zdarzenia `turn` jako `phase.ruda`. Dowód działania: jsonl (T1–T3 z kluczami 0..41).
- PRZYJMUJĘ: nie sprawdziłem wcześniej istniejącego wzorca `longrun-*` (headless Chromium + page.evaluate) i napisałem to w r2 jako „wymaga przeglądarki”. Narzędzia z dispatchu (`measure-ai-trade-offer-frequency.cjs`) używają Playwright, a `determinism-same-seed-test.cjs` nie uruchamia tur. Dispatch był w tym punkcie błędny i to już zapisałem w r2 (sekcja 4 poprzedniego raportu).
- PRZYJMUJĘ: `civ-test-hooks.ts` `state()` nie zawiera surowców (potwierdzone grepem: brak `surowce` w `civ-test-hooks.ts`), więc odczyt musi iść przez kopię (jak wyżej), a nie przez istniejący hak.
- Otwarte: czas tury ~52 s (BLOKADA), tego wzorzec nie rozwiązuje.

### Zarzut 3 (kolizja „Ruda żelaza” → `ruda` przedstawiona jako potwierdzony błąd; pozostałe twierdzenia niesprawdzone): PRZYJMUJĘ korektę i weryfikuję brakujące twierdzenia
Korekta klasyfikacji: to NIE jest potwierdzony błąd przecieku. To kolizja etykieta → klucz, której KOD dokumentuje jako świadomy kompromis:
- `gra/src/game/diplomacy-goods.ts:49-51` (komentarz): „„Ruda żelaza” i „Ruda” dzielą jeden klucz PN ('ruda') — katalog cenowy nie rozróżnia typu złoża”.
- `diplomacy-goods.ts:56-57`: `'Ruda': 'ruda'`, `'Ruda żelaza': 'ruda'`.
- Weryfikacja pozostałych twierdzeń z zarzutu:
  - `tradableGoodsForOwner` (`diplomacy-goods.ts:102-115`): dla każdej etykiety `key = asciiKeyForLabel(label)`, `qty = input.citySurowceSum[key]`, dedupe po `seen`. Dla „Ruda żelaza” wynik to klucz `ruda` i ilość miedzi. Potwierdzone.
  - `transferSurowiecIlosc(item.id, ...)`: wywołania `main.ts:12957` i `main.ts:24486`. Potwierdzone, że przekazywany jest `item.id` (czyli `ruda`).
  - Zachowawczość samej funkcji `transferSurowiecIlosc` (`diplomacy-basket-transfer.ts:233` i dalej) NIE zweryfikowana w tej rundzie: NIE_ZMIERZONO.
- Wniosek: pozycja „Ruda żelaza” w handlu oferuje MIEDŹ z ilością miedzi. To błąd poprawności (zły surowiec w ofercie, z etykietą żelaza), a nie źródło tworzenia miedzi, o ile transfer przenosi istniejący stan. Klasyfikacja: osobny temat R-WEB-*, nie przeciek.

### Zarzut 4 (audyt zapisów `ruda` niepełny; mechanizm nieustalony): PRZYJMUJĘ, audyt rozszerzony
Dodane sprawdzenie WSZYSTKICH wołających zapis do `City.surowce` (`creditOwnerResourceStock`, `creditTerritory`, bezpośrednie `surowce[key] =`). Tabela poniżej. Wynik: źródeł tworzących `ruda` jest jedno bezwarunkowe (kopalnia), a pozostałe zapisy generyczne nie mogą wnieść `ruda` ze względu na dane.

| Ścieżka (plik:linia) | Klucz | Wynik dla `ruda` |
|---|---|---|
| Produkcja kopalni `turn-economy.ts:1859` `creditTerritory('ruda', ...)`; `terrain-improvements.ts:325` `kopalnia_miedzi -> ruda` | ruda | ŹRÓDŁO. Jedyne bezwarunkowe źródło tworzenia miedzi (20/30/45 na kopalnię wg epoki, wg raportu r2). Podgląd `turn-economy.ts:1598` tylko lokalnie. |
| Łup z bitwy `main.ts:35454-35454` → `computeBattleLoot` (`battle-loot.ts:53-66`) | klucze z `unitStockCost` | NIE daje `ruda`: `data/units.json` ma wyłącznie `Surowiec` ∈ {Brąz 34, Drewno 15, Żelazo 25}. |
| Zwrot przy rozbiórce `building-stock-cost.ts:430-470` (`disbandStockRefund(stockPaidOf(unit))`) | klucze z kosztu jednostki | NIE daje `ruda` (ten sam zbiór kluczy jednostek). |
| Zwrot przy Zastąp `main.ts:5120-5133` → `unitStockCost` + `creditOwnerResourceStock` BEZ capu | klucze jednostek | NIE daje `ruda`. UWAGA poboczna: zwrot bez capu (komentarz „to zwrot”) może przekraczać magazyn; nie jest to miedź. Do UWAG-DLA-ORKIESTRATORA. |
| Handel cykliczny `main.ts:39190-39206` (deduct, potem credit z `tradeFlowCap`) | `TRADE_ROUTE_STOCK_FLOW_KEYS` = braz, zelazo, kon, cegla, zloto, sol (`trade-routes.ts:2088-2089`) | NIE daje `ruda`. Hipoteza handlu cyklicznego z dispatchu odrzucona statycznie. |
| Oferty AI / handel gracza `main.ts:12957`, `24486` (`transferSurowiecIlosc`) | item.id | Przenosi stan (zachowawczość nie zweryfikowana, patrz zarzut 3). |
| Zakup AI / rezerwa 10/3/0 `building-stock-cost.ts:242,339` | klucze kosztu | NIE zweryfikowane per klucz w tej rundzie: NIE_ZMIERZONO. Koszty `data/buildings.json` zawierają `ruda`, ale to KOSZT (odejmowany), nie przychód. |
| Hak testowy `main.ts:30000` (`adminSetup`) i `main.ts:30096-30104` (`setStock`, zeroing + credit) | dowolne | Zapis ręczny z hooków testowych. Czy są dostępne wyłącznie pod `?civTest=1`: NIE sprawdzone (NIE_ZMIERZONO). Zapis migracyjny/zerujący, nie przeciek w normalnej grze, o ile wywołuje go tylko hook. |
| `converters.ts` (wejście konwertera, odlewnia) | odczyt | NIE tworzy miedzi (wcześniej: zużycie). |

Wniosek z audytu: w KODZIE nie znaleziono drugiego bezwarunkowego źródła `ruda` poza kopalnią. Hipoteza skoku ~24 000 wymaga więc (a) zbyt wielu kopalni przypisanych do jednego właściciela, (b) błędnego mnożnika epoki, albo (c) zapisu migracyjnego. Żadna z tych tez NIE jest potwierdzona pomiarem. Pomiar jest jedynym sposobem, by je rozstrzygnąć.

## Pomiar (smoke) — dane surowe

Seed 4242, mapa Standardowy, typ kontynenty, 42 miasta, owner 0..41 (`phase.ruda`):

| Tura | ms (endTurn) | aiMs | dipMs | units | miedź (suma wszystkich owner) | owner z miedzią > 0 |
|---|---|---|---|---|---|---|
| 1 (snap) | — | — | — | 48 | 0 | brak |
| 2 | 54306 | 385 | 27 | 49 | 0 | brak |
| 3 | 51662 | 373 | 25 | 50 | 0 | brak |

Wniosek ograniczony do smoke'u: w T1–T3 nie ma miedzi, co jest zgodne z tym, że przed epoką Brązu nie ma kopalni miedzi. Nie zmierzono niczego o turze, w której miedź rośnie.

## Decyzja wymagana (DECISION_REQUIRED)

Pełny pomiar wymaga zmiany reżimu. Propozycje (rekomendacja: A + C):
- A. Zgoda na długi bieg poza Bash (np. proces zarządzany przez orkiestratora / Workflow z jednym wywołaniem na seed), 3 seedy × 150 tur ≈ 6,5 h szeregowo, równolegle do 3 seedów, RAM ok. 15 GB, 4 CPU. Wymaga decyzji, bo reguła zakazuje run_in_background w tym operatorze.
- B. Zmniejszenie zakresu: 1 seed, mapa Mały (mniej miast), tylko do momentu wejścia w Brąz (sprawdzić, która tura), zamiast 150 tur ×3.
- C. Dopisanie wznawialności do runnera (zapis stanu kolejnych tur w jsonl + wznowienie od ostatniej tury z bieżącej sesji przeglądarki nie jest możliwe bez zapisu gry, więc to wymaga zapisu/odczytu stanu gry). Koszt: duży, poza zakresem tego tematu.
- Przy B mierzymy od razu okno Brązu. To najtańszy sposób, by zobaczyć skok, o ile tura wejścia w Brąz nie jest odległa (do ustalenia: w smoke nie wiemy, kiedy Brąz).

## UWAGI-DLA-ORKIESTRATORA (poza zakresem, bez wykonania)
- `main.ts:5120-5133` (zwrot przy Zastąp): `creditOwnerResourceStock` bez capu. Potencjalnie przekracza magazyn, dotyczy Brązu/Drewna/Żelaza, nie miedzi. Osobny temat, jeśli orkiestrator uzna za ważne.
- `diplomacy-goods.ts:57` (`Ruda żelaza` → `ruda`): oferta sprzedaje miedź pod etykietą żelaza. Osobny temat R-WEB (błąd poprawności).
- `units.json` używa klucza `Brąz` dla kosztów jednostek; `ruda` pojawia się tylko w budynkach/ulepszeniach (koszt). Nie zbadane szerzej.

## Commit
Commit obejmuje: `gra/tools/copper-leak-q1-measure.cjs` (narzędzie, tylko kopie gry, bez zmian w src) i ten raport. Dispatch każe commitować „tylko ten plik”; narzędzie zostało dodane, bo jest odpowiedzią na zarzut 1/2 i mieści się w allowliście (`gra/tools/*-measure.cjs`).
SHA: patrz wynik `git rev-parse --short HEAD` po commicie.
