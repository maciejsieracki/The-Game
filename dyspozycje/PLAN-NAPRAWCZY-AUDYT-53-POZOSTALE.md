# PLAN NAPRAWCZY — audyt: 53 POZOSTAŁE znaleziska (do akceptacji Macieja)

> **Data:** 2026-07-22 · **Źródło:** `AUDYT-KODU-2026-07-21.md` (wszystko POZA statusem POTWIERDZONE — tamte 20 już naprawione, patrz `AUDYT-NAPRAWY-LOG.md`, commit `6adfb79`)
> **Zakres:** #1–#2 (krytyczne), #10–#33, #40–#58, #66–#73 wg numeracji raportu.
> **Wykonawca po akceptacji:** subagenci per paczka (dowolna sesja); przy `main.ts` sekwencyjnie — paczki F0/F2/F3/F5/F6/F7 dzielą ten plik, NIE zlecać ich równolegle.

---

## Jak zaakceptować

Napisz w czacie: **`OK plan audyt 53`** albo z wyjątkami, np. **`OK plan audyt 53 z wyjątkami: A2=B, F6 pomiń`**.
Można też akceptować paczkami: **`OK audyt F0`** (same krytyczne) itd.

---

## ⚠️ ZASADA NADRZĘDNA — weryfikuj, potem naprawiaj

Te 53 znaleziska **NIE przeszły pełnej weryfikacji sceptyków** (przerwana awarią API/limitem; 56 werdyktów, które zdążyły się policzyć, wszystkie wyszły „realny", ale nie pokryły wszystkiego). Dlatego KAŻDY subagent naprawiający:

1. **Najpierw sam weryfikuje znalezisko w kodzie** (śledzi ścieżkę wykonania jak sceptyk). Jeśli defekt NIE istnieje → wpis „ODRZUCONE + uzasadnienie" do logu, **zero zmian w kodzie**.
2. **Numery linii są NIEAKTUALNE** — raport powstał przed `6adfb79` (20 napraw) i nocnymi commitami 07-22. Szukać po treści/nazwach funkcji, nie po numerze linii.
3. Naprawa minimalna, w stylu otoczenia; bez „sprzątania przy okazji".
4. Po paczce: bramki (sekcja na dole) + wpis do `AUDYT-NAPRAWY-LOG.md` + meldunek w kanale.

---

## F0 — KRYTYCZNE (naprawić przed wszystkim innym)

| ID | Waga | Plik | Skrót |
|----|------|------|-------|
| **#1** | KRYTYCZNA | `main.ts` (~3437, transferBasketItems) | Koszyk PN: oddanie „jednostka" **nic nie kosztuje dawcy** — spawnTransferredUnit tworzy jednostkę u odbiorcy, dawcy nie ubywa nic; darmowy zakup zasobów od AI |
| **#2** | KRYTYCZNA | `main.ts` (~10188, auto-szturm) | Auto-szturm zwraca `survivors: []` = **kasuje CAŁĄ armię obu stron** zamiast policzyć ocalałych |

**Kierunek:** #1 — transfer jednostki musi zdejmować jednostkę/koszt z dawcy albo pozycja „jednostka" znika z koszyka do czasu implementacji (decyzja A1 niżej). #2 — wyliczyć ocalałych z realnego wyniku walki (jak w bitwie ręcznej); dopóki nie ma poprawnego wzoru, auto-szturm ma zachowywać proporcje strat, nigdy 100%/100%.

---

## F1 — Dyplomacja: exploity wymiany i bramki (9 znalezisk)

| ID | Waga | Plik | Skrót |
|----|------|------|-------|
| #16 | WYSOKA | `main.ts` (~6667) | Zaufanie za dar/handel naliczane od ZADEKLAROWANEGO PN bez walidacji posiadania — darmowy trust co turę |
| #47 | ŚREDNIA | `main.ts` (~3377) | Koszyk „praca": gracz bez Pracy nic nie traci, AI dostaje pełną kwotę **do skarbca złota** |
| #45 | ŚREDNIA | `diplomacyTradeBasket.ts` (~176) | Pozycja „Żywność (spichlerz)" martwa — silnik nigdy nie podaje `cityOptions` |
| #20 | WYSOKA | `diplomacy-value-catalog.ts` (~301) | Kurs Rel/100 zawsze na korzyść proponenta — pompa złota przy Relacji > 100 |
| #21 | WYSOKA | `diplomacy-proposals.ts` (~287) | Żądanie trybutu: brak limitu kwoty i guardu duplikatu — trybuty stackują się co turę |
| #19 | WYSOKA | `diplomacy-proposals.ts` (~455) | Wasalizacja: bramka sprawdza Respekt **respondenta zamiast proponenta** (odwrócona) |
| #46 | ŚREDNIA | `diplomacy-proposals.ts` (~423) | Prawo przemarszu: ta sama odwrócona bramka Respektu |
| #22 | WYSOKA | `main.ts` (~11586) | Rozjazd kierunku Respektu: silnik trzyma udział AI, UI liczy udział gracza |
| #66 | NISKA | `main.ts` (~3417) | Tech kupiony w dyplomacji nie awansuje epoki gracza (desync `zbadane` vs `era`) |

**Kierunek:** transfery walidują posiadanie PRZED naliczeniem Zaufania (brak środków = deal nie dochodzi); „praca" trafia do puli pracy odbiorcy, nie do złota (albo pozycja wypada — A2); `cityOptions` dostarczone z `getNegotiationContext` (transfer żywności po stronie silnika już działa); kurs Rel/100 symetryczny; trybut z limitem i cooldownem; bramki wasalizacji/przemarszu na Respekt właściwej strony; UI Respektu czyta ten sam kierunek co silnik; tech z handlu przechodzi przez tę samą ścieżkę awansu epoki co własne badanie.

---

## F2 — Save/load i reset stanu nowej gry (9 znalezisk)

| ID | Waga | Plik | Skrót |
|----|------|------|-------|
| #13 | WYSOKA | `main.ts` (~8081) | Wioski nie w zapisie — save/load **wskrzesza złupione wioski** (nieskończone nagrody) |
| #14 | WYSOKA | `main.ts` (~12759) | `battlePowerPtsByOwner` bez resetu przy nowej grze — zombie-potęga z poprzedniej rozgrywki |
| #15+#26 | WYSOKA | `main.ts` (~13670 / ~10562) | Profile miast-państw i klastrów (`typCityCopyOwners`, `simplifiedDiplomacyOwners`, `clusterPlacement`…) ani zapisywane, ani odtwarzane — po load miasta-państwa grają jak pełne cywilizacje |
| #42 | ŚREDNIA | `main.ts` (~13576) | `barbCamps` niezapisywane i nieresetowane przy load — obozy z mapy A renderują się na mapie B |
| #43 | ŚREDNIA | `main.ts` (~1303) | `cityRelig` (+`autoManageCities`) nigdy nie czyszczone/niezapisywane — zombie przez kolizję id `cityN` |
| #44 | ŚREDNIA | `main.ts` (~13741) | `aiSkarbiecByOwner` czyszczone przy load bez odtworzenia — AI biednieje przy każdym wczytaniu |
| #12 | WYSOKA | `main.ts` (~12082) | Klawisz N działa przy zawieszonej fazie AI (modalna bitwa) — podwójna tura, korupcja stanu |
| #40 | ŚREDNIA | `main.ts` (~7069) | Wyjście do menu w trakcie bitwy nie zdejmuje `ambBattleMuted` — nowa gra z niemą naturą |
| #68 | NISKA | `main.ts` (~12699) | `CameraController` bez `dispose()` poprzedniego — akumulacja listenerów po każdej nowej grze |

**Kierunek:** jeden wspólny wzorzec — **inwentaryzacja stanu**: każda mapa/zbiór żyjący poza snapshotem albo wchodzi do zapisu (wioski jako lista złupionych heksów; profile; barbCamps; cityRelig; aiSkarbiec), albo jest twardo resetowany w `doStartGame` ORAZ przy load (battlePowerPts; ambBattleMuted; dispose kamery). Klawisz N: bramka `czy trwa modalna bitwa/preBattle` w handlerze.

---

## F3 — Walka i oblężenia (9 znalezisk)

| ID | Waga | Plik | Skrót |
|----|------|------|-------|
| #50 | ŚREDNIA | `main.ts` (~10090) | Machiny konsumowane PRZED potwierdzeniem szturmu — anulowanie preBattle je traci |
| #51 | ŚREDNIA | `main.ts` (~10041) | Machiny wnoszą ZERO do mocy auto-szturmu (rola Oblężnicza → M=0); `siegePower()` martwe |
| #52 | ŚREDNIA | `main.ts` (~5527) | AI ocenia siłę oblężenia na PEŁNYM HP — ignoruje `u.hp` |
| #53 | ŚREDNIA | `mapFieldBattle.ts` (~219) | Szanse preBattle z Milicją liczone na fallbacku „wojownika", wynik na realnej Milicji |
| #54 | ŚREDNIA | `combat.ts` (~539) | Negacja szarży po substringu NAZWY zamiast pola `Typ` — elitarni włócznicy nie hamują szarży |
| #23 | WYSOKA | `main.ts` (~11008) | Atrycja garnizonu przy oblężeniu zmienia licznik pochodny — bez realnego efektu |
| #72 | NISKA | `main.ts` (~10897) | Śmierć z głodu usuwa jednostki bez sprzątania oblężenia i sync garnizonu |
| #55 | ŚREDNIA | `post-battle-map.ts` (~341) | Odbite miasto rebeliantów na zawsze zachowuje `rebelState=true` |
| #25 | WYSOKA | `main.ts` (~9797) | Odbicie miasta rebeliantów = fałszywa ELIMINACJA frakcji −99 + **powtarzalne Power-zdobycze (exploit)** |

**Kierunek:** machiny schodzą dopiero po potwierdzonym szturmie i wliczają się do mocy wg `siegePower()`; oceny AI/preBattle na realnym HP i realnej jednostce; negacja szarży po polu `Typ` (spójnie z resztą kontr); atrycja działa na faktyczne HP garnizonu; śmierć głodowa przechodzi przez tę samą ścieżkę sprzątania co `disband`; `rebelState` czyszczony przy odbiciu; frakcja rebeliantów (−99) wyłączona z logiki eliminacji/Power-zdobyczy.

---

## F4 — Dane jednostek i produkcja (7 znalezisk)

| ID | Waga | Plik | Skrót |
|----|------|------|-------|
| #10 | WYSOKA | `units.json` (~2287) | **25 jednostek bez pól EN** `armor/piercing/chargeBonus` — walczą z pancerzem 0 (resolver czyta tylko EN) |
| #11 | WYSOKA | `units.json` (~619) | Super-jednostki (koszt 0, „max 1, bezpłatna") produkowalne masowo za fallback 10 Pracy |
| #58 | ŚREDNIA | `main.ts` (~1532) | Spawn czyta pole `Super` zamiast `Super-jednostka` |
| #67 | NISKA | `units.json` (~1179) | Procarz (Huaracoc) ma Typ=Distance, choć zastępuje Procarza o Typ=Slinger — traci kontry |
| #41 | ŚREDNIA | `buildings.json` (~933) | Wielka Kuźnia (epokaWejścia=4) i Lazaret (5) niebudowalne — epoka kończy się na 3, a techy je obiecują |
| #32 | WYSOKA | `production.ts` (~711) | Upgrade Koszary→Akademia wojskowa **odbiera miastu rekrutację jednostek Brązu** (bramka szuka `koszary` w builtIds) |
| #33 | WYSOKA | `main.ts` (~2293) | Bramki brązu/żelaza bez właściciela — kopalnia AI odblokowuje surowce gracza |

**Kierunek:** #10 — uzupełnić pola EN z kolumn PL (skrypt mapujący Pancerz→armor itd., potem sync Panel-C); #11 — patrz decyzja A3; #58 — poprawić nazwę pola; #67 — Typ→Slinger; #41 — patrz decyzja A4; #32 — bramka koszar akceptuje też budynek nadrzędny (wzorzec `isBuildingSupersededByUpgrade` już istnieje); #33 — `hasBrazAccess`/`hasZelazoAccess` filtrują ulepszenia/budynki po właścicielu.

---

## F5 — Zachowanie AI (5 znalezisk)

| ID | Waga | Plik | Skrót |
|----|------|------|-------|
| #31 | WYSOKA | `main.ts` (~11822) | **AI nigdy nie buduje budynków** — komendy `build` używają NAZW, lookup idzie po id |
| #24 | WYSOKA | `ai.ts` (~1364) | Miasto-państwo atakuje posiłki sojuszniczej siostry (filtr sojuszu tylko w detekcji zagrożenia) |
| #49 | ŚREDNIA | `main.ts` (~11178) | Pętla porządku/szczęścia liczy miasta AI epoką i technologiami GRACZA |
| #48 | ŚREDNIA | `main.ts` (~12012) | Moc wyeliminowanej cywilizacji liczona podwójnie w mianowniku dominacji (jednostki-sieroty) |
| #71 | NISKA | `civ-roster.ts` (~102) | Nadmiarowi AI dostają identyczny typ spoza wylosowanej puli aktywnych |

**Kierunek:** #31 — ujednolicić klucz (id) w komendach build AI; #24 — filtr sojuszu także w wyborze celu ataku; #49 — porządek/szczęście od epoki/techów właściciela miasta; #48 — sieroty po eliminacji wykluczone z mianownika; #71 — przydział typów okrężnie z puli aktywnych.

---

## F6 — Wydajność (7 znalezisk)

| ID | Waga | Plik | Skrót |
|----|------|------|-------|
| #27 | WYSOKA | `main.ts` (~3610) | `cityFogVisible`: pełne `currentVisible()` liczone osobno dla KAŻDEGO obcego miasta przy każdym sync |
| #30 | WYSOKA | `main.ts` (~8321) | mousemove: pełne `currentVisible()` przy każdym ruchu myszy z zaznaczoną jednostką |
| #28 | WYSOKA | `units/setup.ts` (~696) | `computePath` bez limitu promienia: nieosiągalny cel = flood całego kontynentu, ×2 per jednostka AI |
| #29 | WYSOKA | `ai.ts` (~1475) | `findSettlerTarget`: pełny skan mapy × `allCities.some(hexDistance)` per osadnik per tura |
| #56 | ŚREDNIA | `ai.ts` (~1521) | `findNearestVillage`: alokacja `Object.keys(320k)` + pełny skan mapy per jednostka wojskowa AI |
| #57 | ŚREDNIA | `main.ts` (~1227) | `syncVillageMeshes`: skan WSZYSTKICH heksów mapy przy każdym `refreshFog` |
| #73 | NISKA | `render/cities.ts` (~585) | `_removeStatChip` dispose'uje teksturę współdzieloną z `statTexCache` — cache serwuje martwe tekstury |

**Kierunek:** cache `currentVisible()` per klatkę/sync (jedno wyliczenie, wiele odczytów); `computePath` z limitem promienia/kroków; listy wiosek/miast utrzymywane przyrostowo zamiast skanów mapy; tekstury z cache nie dispose'owane przy zdjęciu chipa. **Bramka dodatkowa:** przed/po — pomiar czasu tury na dużej mapie (nie zgadywać, zmierzyć).

---

## F7 — UI: prawda ekranu (4 znaleziska)

| ID | Waga | Plik | Skrót |
|----|------|------|-------|
| #17 | WYSOKA | `cityPanel.ts` (~706) | Bilans plonów liczony bez budynków, Waluty, bonusów cyw. i Porządku — panel pokazuje inne liczby niż silnik |
| #18 | WYSOKA | `main.ts` (~6972) | Pasek armii: HP kart zawsze 100% — ranne jednostki wyglądają na zdrowe (`hp: hpMax` zamiast `u.hp`) |
| #69 | NISKA | `gamePauseMenu.ts` (~109) | „Wczytaj grę" zablokowane po pierwszym zapisie w tej sesji menu (`hasSave` liczone raz) |
| #70 | NISKA | `main.ts` (~2661) | Panel pokazuje wpływ religii na szczęście bez bramki świątyni — rozjazd z silnikiem |

**Kierunek:** panel miasta dostaje te same flagi/mnożniki co tick silnika (jedno źródło prawdy — najlepiej wspólna funkcja kontekstu); pasek HP czyta `u.hp`; `hasSave` odświeżane po zapisie; religia w panelu za tą samą bramką co w silniku.

---

## Decyzje ABC (do rozstrzygnięcia przy akceptacji — inaczej wchodzi [REKOMENDACJA])

**A1 (#1 koszyk „jednostka"):**
- **A [REKOMENDACJA]:** transfer jednostki zdejmuje WSKAZANĄ jednostkę dawcy (wymaga `unitOptions` w kontekście — trochę UI); do czasu wdrożenia pozycja ukryta.
- B: pozycja „jednostka" usunięta z koszyka na stałe (najprostsze, zubaża dyplomację).

**A2 (#47 koszyk „praca"):**
- **A [REKOMENDACJA]:** praca trafia do puli PRACY odbiorcy (AI ma pulę per właściciel) i realnie ubywa dawcy.
- B: pozycja „praca" wypada z koszyka (zostaje złoto/żywność/tech).

**A3 (#11 super-jednostki):**
- **A [REKOMENDACJA]:** egzekwować dane: limit 1 sztuki na cywilizację (licznik żywych po `Super-jednostka=TAK` per nacja), koszt 0 = naprawdę bezpłatna, respawn wg Uwag — ale TYLKO limit 1.
- B: zdjąć „max 1" z danych, nadać realny wysoki koszt (np. 2× elita) — mniej kodu, zmiana designu.

**A4 (#41 Wielka Kuźnia/Lazaret):**
- **A [REKOMENDACJA]:** obniżyć `epokaWejscia` do 3 (są bramkowane techem tier 8–9, więc i tak późne).
- B: mechanizm „parkowania" budynków epoki 4+ jak przy cudach (spójne, więcej roboty).

**A5 (#21 trybut):**
- **A [REKOMENDACJA]:** limit kwoty od Respektu/skarbca + cooldown N tur na parę państw.
- B: tylko cooldown, kwota bez limitu.

---

## Kolejność wykonania i równoległość

1. **F0** — od ręki (2 krytyczne, `main.ts`).
2. **F1 + F4** — exploity i dane (F1 dotyka `main.ts` → PO F0; F4 w większości dane/production — może iść równolegle z F1 poza #58/#33).
3. **F2, F3** — sekwencyjnie (oba głęboko w `main.ts`).
4. **F5**, potem **F6, F7**.

Reguła: **jedna paczka dotykająca `main.ts` naraz.** Po każdej paczce commit + wpis do logu; deploy zbiorczy po F0–F4 i drugi po F5–F7 (nie 8 deployów).

## Bramki (po KAŻDEJ paczce)

`npx tsc --noEmit`=0 · `logic-test` 203/203 · `combat-test` 6/6 · `tech-tree` + `research` + `unit-replace` bez regresji · `map-gen-regression` determinizm A=B (obowiązkowo przy F0? nie — przy zmianach mapy; tu tylko jeśli dotknięto `map/`) · build vite do tmp przechodzi · **NIGDY `npm run build`**. F6 dodatkowo: pomiar czasu tury przed/po.

## Log i meldunki

Każda paczka dopisuje sekcję do `AUDYT-NAPRAWY-LOG.md` (wzór: sekcje E1–E8) — w tym znaleziska ODRZUCONE po weryfikacji (z uzasadnieniem). Po deployu: `WERSJE.md` + `KANAL-PRACA.md` (zasada krytyczna #5/#6 z CLAUDE.md).
