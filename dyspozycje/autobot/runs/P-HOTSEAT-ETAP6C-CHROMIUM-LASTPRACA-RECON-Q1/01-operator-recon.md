# Recon: klaster `_lastPraca`/`_lastKultura` vs `playerPracaPool` per-fotel

TEMAT: P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-RECON-Q1 · RUNDA 1/5 · DOMAIN: GAME
Zakres: WYŁĄCZNIE recon, zero zmian `gra/src/**`/`gra/data/**`.

## 1. Inwentaryzacja klastra

Deklaracje w `gra/src/main.ts` (blok "P3a: Last-turn totals for HUD display"):

| Zmienna | Linia decl. | Odczyty/zapisy (przybliżenie, `grep -o`) |
|---|---|---|
| `playerPracaPool` | 11065 | 67 |
| `_lastPraca` | 11067 | 17 |
| `_lastPracaUpkeep` | 11072 | 9 |
| `_lastPracaAutoUlepszeniaKoszt` | 11089 | 10 |
| `_lastPracaCudaKoszt` | 11097 | 7 |
| `_lastKultura` | 11098 | 8 |
| `_lastPracaRate` | 11099 | 35 |
| `_pracaRateFreshFromEndTurn` | 11140 | 6 (guard REGRES2/REGRES3) |
| `_lastKulturaRate` | 11141 | 9 |

To jest klaster CO NAJMNIEJ 9 zmiennych (nie tylko `_lastPraca`); szerszy komentarz
przy `switchActiveHuman()` (main.ts:10901) mówi o "18 zmiennych klastra + 2 poza
nim" dla **całego** cache'u HUD (Praca+Kultura+Bogactwo+Nauka+Ludność+Wealth) —
to poza zakresem tej rundy, zakres GOAL dispatchu to podzbiór Praca/Kultura wypisany
wyżej.

Dodatkowo: `playerPracaPool` NIE jest jedyną fizyczną zmienną puli — od Etapu 3
istnieje już w pełni per-fotel para akcesorów `ownerPracaPool(ownerId)` /
`setOwnerPracaPool(ownerId, value)` (main.ts:27596-27607), wspierana Mapą
`pracaPoolByHuman: Map<number, {praca:number}>` (main.ts:10788) dla ludzi i
`aiPracaPoolByOwner` dla AI. `playerPracaPool` samo jest jednak zaaliasowane
WYŁĄCZNIE do `HUMAN_OWNER_PRIMARY` przez komórkę-alias `playerPracaCell`
(main.ts:10784-10787, komentarz linii 10762-10766 nazywa to wprost).

## 2. Kto czyta HUD

`gra/src/main.ts:18081 function buildHudState(): HudState` czyta wprost moduł-owe
`_lastPraca`/`_lastPracaRate`/`_lastPracaUpkeep`/`_lastPracaAutoUlepszeniaKoszt`/
`_lastPracaCudaKoszt`/`_lastKultura`/`_lastKulturaRate` (linie 18234-18242,
`praca: Math.round(_lastPraca)` itd.) — **bez parametru ownerId**, więc zawsze
zwraca stan singletonów niezależnie od `ME()`. Renderer chipa "Praca" to
`gra/src/ui/hud.ts:1324` (`res('🔨', String(s.praca), 'Praca', signed(s.pracaRate), true)`),
konsumujący dokładnie ten obiekt `HudState` z `buildHudState()`. `updateHud()`
(main.ts:22447) woła `buildHudState()`/renderer po każdej zmianie stanu.

## 3. Wzorzec migracji — da się zastosować bez regresu 1P?

Tak, dokładnie ten sam wzorzec co reszta Etapu 6c: `Map<ownerId, T>` +
`for (const hOid of humanSeats.humanOwnerIds)` + `isHuman(ownerId)` — jest już
UŻYTY w tym samym pliku dla puli Pracy (`pracaPoolByHuman`, `ownerPracaPool`/
`setOwnerPracaPool`), skarbca (`ownerTreasury`/`setOwnerTreasury`, main.ts:27584-27591)
i nauki (`ownerNaukaPool`, main.ts:27617). Przy `humanOwnerIds.length===1` wzorzec
degeneruje się do jednego wpisu Mapy = identyczne zachowanie jak dziś (ten sam
argument, którym uzasadniono migrację skarbca/nauki w Etapie 6c — brak nowego
precedensu ryzyka). Migracja `_last*` cache do `Map<ownerId, T>` (odczyt przez
`buildHudState(ownerId = ME())`) jest więc mechanicznie tym samym wzorcem.

## 4. Czy `playerPracaPool` sama wymaga migracji?

**Tak — i to jest OSOBNE, większe pytanie niż cache `_last*`.** Dwa fakty:

a) `ownerPracaPool`/`setOwnerPracaPool` (per-owner, poprawne) są używane w
   nowszym kodzie: transakcje handlowe (main.ts:9743-9744, 19561-19562),
   przejęcie stolicy (4028, 4036, 4078, 14187, 14228, 28666, 28700), pętla
   auto-ulepszeń per-fotel (31897-32061).
b) Starszy, centralny kod tury GRACZA (`triggerPlayerEndTurn` i okolice) wciąż
   operuje BEZPOŚREDNIO na surowej zmiennej modułowej `playerPracaPool` z
   twardo zaszytym `HUMAN_OWNER_PRIMARY`/`ME()===0`: koszt założenia miasta
   (13013-13020), koszt wycinki (13195-13210), kolejka budowy (13241-13314),
   koniec tury/upkeep (31791-31824), reset nowej gry/save-load (36040-36901,
   37809-37840). Żadne z tych miejsc nie iteruje `humanSeats.humanOwnerIds`.

Migracja SAMEGO `_last*` cache na `Map<ownerId,...>` NIE naprawia (b) — HUD
pokazywałby wtedy poprawnie per-fotel wartość CACHE, ale sama pula
`playerPracaPool` (koszty/upkeep/end-turn) nadal liczyłaby się TYLKO dla fotela
0. To zgadza się z ostrzeżeniem dispatchu §GOAL pkt 4: to jest **osobny, dużo
większy temat** (silnik gry, nie tylko wyświetlanie) i wymaga jawnego pytania
ABC do właściciela o zakres, nie milczącego założenia w tej rundzie.

## 5. Konkretny mechanizm regresji i ryzyka

Namierzony REALNY defekt (nie hipotetyczny) w `setOwnerPracaPool`
(main.ts:27599-27607):

```
function setOwnerPracaPool(ownerId: number, value: number): void {
  const v = Math.max(0, value);
  if (isHuman(ownerId)) {
    pracaPoolByHuman.get(ownerId)!.praca = v;   // POPRAWNE: zapis do właściwej komórki ownerId
    _lastPraca = playerPracaPool;               // BŁĄD: zawsze czyta singleton (== komórka
  } else { ... }                                //   HUMAN_OWNER_PRIMARY przez alias 10785-10787),
}                                                //   NIE `v`/`ownerId`
```

To dokładnie ten sam kształt błędu co komentarz REGRES2 (main.ts:11100-11116,
17977-18065): funkcja pomocnicza "poprawnie" zapisuje jedną wartość, ale przy
okazji odświeża HUD-owy singleton z **niewłaściwego** źródła. Skutek: KAŻDE
wywołanie `setOwnerPracaPool(secondOwnerId, ...)` poza kontekstem "kończy się
tura fotela 0" (handel 9743/19561, przejęcie stolicy 14187/28666, pętla
auto-ulepszeń 32061 — ta ostatnia akurat JEST poprawnie ostrzeżona zewnętrznym
`if (hOid === humanOwnerId)` na main.ts:31982, ale sam `setOwnerPracaPool` tego
warunku NIE zna i nie wymusza) nadpisuje globalny czip "Praca" wartością fotela
0, niezależnie od tego, kogo dotyczyła operacja. Najbardziej podatne miejsca na
powtórzenie: każdy nowy call-site `setOwnerPracaPool()` dodany w przyszłości bez
świadomości tego side-effectu (dokładnie wzorzec "4 drenaże" — funkcja rośnie
cicho niewidocznymi zależnościami). Test regresyjny powinien: (1) 2 fotele,
handel Pracą między nimi w trakcie tury fotela A → asercja że `_lastPraca` dla
fotela B (po `switchActiveHuman`/`buildHudState(B)`) odzwierciedla NOWĄ pulę B,
nie starą wartość A; (2) tryb 1P — `_lastPraca` niezmieniony bit-a-bit.

## 6. Plan bramki dowodowej

Klaster F (auto-ulepszenia terenu, main.ts:31897-32061) i Klaster G (write-site
cache HUD, main.ts:27599-27607 + 18081-18242) są DOKŁADNIE tymi samymi
call-site'ami, które naprawa `_lastPraca` musi dotknąć — więc naprawa DOSTARCZA
naturalnie materiał do bramki Chromium wskazanej przez Final Control (scenariusz:
2 fotele, jeden robi auto-ulepszenie kosztem Pracy, drugi robi transakcję, zrzut
ekranu czipa "Praca" po każdym `switchActiveHuman`). To NIE jest automatycznie
osobny temat — bramka i fix dzielą identyczny kod; rozdzielanie ich zwiększyłoby
liczbę rund bez zysku. Rekomendacja (do potwierdzenia w dispatchu implementacji,
nie tutaj): jedna bramka Chromium pokrywająca oba klastry w tym samym PR co fix.

## 7. Warianty implementacji

**(A) Pełna migracja klastra `_last*` na `Map<ownerId, T>` teraz** (9 zmiennych
z §1, czytane przez `buildHudState(ownerId = ME())`).
Za: usuwa CAŁĄ klasę błędu na raz; spójne z akcesorami skarbca/nauki już
istniejącymi; jeden test regresyjny pokrywa wszystko. Przeciw: 9 zmiennych ×
~17-35 call-site'ów każda = duży diff jednorazowy, wyższe ryzyko przeoczenia
jednego z nich (dokładnie ryzyko z playbooka — "4 drenaże" powstały przyrostowo,
migracja odwrotna grozi tym samym przy jednym dużym skoku).

**(B) Węższy fix — tylko `_lastPraca` (najbardziej widoczny w HUD)**, reszta
klastra (`_lastPracaRate`, `_lastPracaUpkeep`, `_lastPracaAutoUlepszeniaKoszt`,
`_lastPracaCudaKoszt`, `_lastKultura`, `_lastKulturaRate`) zostaje jako
known-issue do kolejnego tematu.
Za: mniejszy, łatwiejszy do zweryfikowania diff; adresuje dokładnie objaw
zgłoszony przez właściciela (czip "Praca"). Przeciw: zostawia niespójny
popup "PULA IMPERIUM"/tooltip (rate/upkeep/koszty nadal fotela 0) — realne
ryzyko kolejnego zgłoszenia "liczby się nie zgadzają" (dokładnie wzorzec
REGRES3, main.ts:11117-11139, gdzie połowiczna naprawa jednego pola zostawiła
sąsiednie pole z innego momentu czasu w TYM SAMYM renderze).

**(C, dodatkowy — niewymagany przez GOAL, ale wynikający z §4)** Migracja
`_last*` (A lub B) BEZ ruszania `playerPracaPool` samej w sobie — jawnie
udokumentowana jako "cache poprawny, silnik nadal 1-fotelowy" z osobnym
tematem na `playerPracaPool`. To jest REALISTYCZNY zakres tej rundy, bo pełna
migracja silnika (§4b) to inny rząd wielkości pracy niż cache HUD.

Rekomendacja recon (nie rozstrzygnięcie): (C) jako ramowanie + (A) jako
zakres cache'u w jednym dispatchu implementacyjnym, `playerPracaPool` silnika
jako osobne pytanie ABC do właściciela — zgodnie z GOAL pkt 4.
