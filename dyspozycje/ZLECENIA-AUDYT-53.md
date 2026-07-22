# ZLECENIA WYKONAWCZE — audyt 53 (paczki F0–F7)

> **Akceptacja Macieja:** „OK cały plan 53" (2026-07-22), decyzje **A1–A5 wg rekomendacji: wszystkie = A**.
> **Źródła:** znaleziska → `AUDYT-KODU-2026-07-21.md` (numery #ID) · kierunki → `PLAN-NAPRAWCZY-AUDYT-53-POZOSTALE.md` · log wykonania → `AUDYT-NAPRAWY-LOG.md`.
> **Autor zleceń (Fable) NIE wykonuje napraw, deployów ani pushy** — każdą paczkę realizuje sesja wykonawcza (Cursor / chmura / subagent), wklejając poniższy prompt.

## ✅ AKTUALIZACJA 2026-07-22: pełna weryfikacja sceptyków ZAKOŃCZONA

Wszystkie 53 znaleziska przeszły adwersaryjną weryfikację (124 werdykty Opus, 3 soczewki na krytyczne/wysokie). Wynik: **50 POTWIERDZONE · 2 PRAWDOPODOBNE · 1 ODRZUCONE**. Skutki dla zleceń:

- **#22 (rozjazd Respektu) WYPADA z F1** — JUŻ NAPRAWIONE nocnym commitem `b1a7a61` (silnik nadpisuje respekt świeżą wartością z perspektywy proponenta, `buildProposalEvalContext`). Nie ruszać.
- **#41 (Wielka Kuźnia/Lazaret) w F4 → NAJPIERW DECYZJA** — sceptyk znalazł w `buildings.json:1283` jawny komentarz „PARKOWANIE: budynek epoki Średniowiecze... poza cap v0.1" = to może być CELOWA decyzja właściciela, sprzeczna z A4=A. Wykonawca F4 NIE zmienia epokaWejscia, dopóki Maciej nie potwierdzi (pytanie w logu + kanale).
- **#40 (ambBattleMuted) w F2 → niski priorytet** — przesłanka kodowa prawdziwa, ale sceptyk wykazał, że scenariusz jest praktycznie NIEOSIĄGALNY w realnej rozgrywce. Naprawić „przy okazji" (1 linia w openStartupMainMenu), nie jako osobne zadanie.
- **Korekty wag:** #1 krytyczna→wysoka (zostaje w F0 — nadal exploit) · #23, #25, #27, #30 wysoka→średnia.
- **⚠️ ZŁOTO DLA WYKONAWCÓW:** `AUDYT-WERYFIKACJA-53-WERDYKTY.md` zawiera werdykty z **AKTUALNYMI numerami linii i pełnymi ścieżkami wykonania** — czytaj SWÓJ fragment przed naprawą, zamiast szukać od zera. Np. #2 auto-szturm: pełny łańcuch `main.ts:10690/10557 → 10500/10512 → 9894-9896 → post-battle-map.ts:291-292 → 99-102` + gotowy trop naprawy (martwy import `survivorsLiveSet` z siegeDefenders.ts:41-44, ścieżka polowa poprawnie przekazuje `undefined` w main.ts:9671).

## Tablica stanu (wykonawca odhacza po paczce)

| Paczka | Zakres (ID) | Status | Kto | Commit |
|--------|-------------|--------|-----|--------|
| F0 | #1 #2 | ☐ | | |
| F1 | #16 #47 #45 #20 #21 #19 #46 ~~#22~~ #66 | ☐ | | |
| F4 | #10 #11 #58 #67 (#41→decyzja) #32 #33 | ☐ | | |
| F2 | #12 #13 #14 #15+#26 #40(niski) #42 #43 #44 #68 | ☐ | | |
| F3 | #23 #25 #50 #51 #52 #53 #54 #55 #72 | ☐ | | |
| F5 | #24 #31 #48 #49 #71 | ☐ | | |
| F6 | #27 #28 #29 #30 #56 #57 #73 | ☐ | | |
| F7 | #17 #18 #69 #70 | ☐ | | |

**Kolejność:** F0 → (F1 ∥ F4) → F2 → F3 → F5 → (F6 ∥ F7). **Tylko JEDNA paczka dotykająca `main.ts` naraz** (F4 wolno równolegle z F1, bo #58/#33 w F4 to drobne, rozłączne miejsca `main.ts` — jeśli wykonawcy się zderzą, F4 robi najpierw części JSON/production, a #58/#33 po F1).

---

## WSPÓLNY NAGŁÓWEK (wklej na początku KAŻDEGO zlecenia)

```
Pracujesz w repo gry Civ: C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ
Najpierw przeczytaj CLAUDE.md (zasady krytyczne) — w szczególności: NIGDY `npm run build`/`npm run dev`
(prebuild nadpisuje ręcznie edytowane JSON w gra/data!). Build wyłącznie:
node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir (z katalogu gra).

REGUŁY TEJ PACZKI:
1. NAJPIERW PRZECZYTAJ SWOJE WERDYKTY: dyspozycje/AUDYT-WERYFIKACJA-53-WERDYKTY.md — każde
   znalezisko tej paczki ma tam potwierdzenie sceptyków z AKTUALNYMI numerami linii i pełną
   ścieżką wykonania. To skraca robotę: nie szukasz od zera. Mimo to sanity-check przed edycją
   (kod mógł się zmienić po weryfikacji) — jeśli defekt zniknął, wpis „JUŻ NAPRAWIONE +
   uzasadnienie (plik:linia)" do AUDYT-NAPRAWY-LOG.md, ZERO zmian.
2. NUMERY LINII W RAPORCIE (AUDYT-KODU) SĄ NIEAKTUALNE — aktualne są te w WERDYKTACH.
3. Naprawa minimalna, w stylu otoczenia; bez sprzątania „przy okazji"; osierocone/uśpione kody
   (renderWoda, synteza kamienia, getGeoShip*) zostawić w spokoju.
4. Pełne opisy i scenariusze znalezisk: dyspozycje/AUDYT-KODU-2026-07-21.md (szukaj po „#ID." z nagłówka
   sekcji lub tytule). Kierunki napraw: dyspozycje/PLAN-NAPRAWCZY-AUDYT-53-POZOSTALE.md.
5. Po paczce BRAMKI (z katalogu gra): npx tsc --noEmit = 0 · node tools/logic-test.cjs (203/203)
   · node tools/combat-test.cjs · node tools/tech-tree-test.cjs · node tools/research-test.cjs
   · node tools/unit-replace-test.cjs · map-gen-regression-test.cjs TYLKO jeśli dotknięto gra/src/map.
6. Po bramkach: sekcja w AUDYT-NAPRAWY-LOG.md (wzór sekcji E1–E8: co naprawiono per ID, decyzje,
   pliki) + commit z prefiksem fix(audyt-53-FX): ... . DEPLOY tylko jeśli Maciej każe.
7. Odhacz swoją paczkę w dyspozycje/ZLECENIA-AUDYT-53.md (tablica stanu).
```

---

## ZLECENIE F0 — 2 KRYTYCZNE (wykonać jako pierwsze)

```
[wklej WSPÓLNY NAGŁÓWEK]

PACZKA F0 — dwa znaleziska KRYTYCZNE (raport #1 i #2):

#1 — main.ts, funkcja transferBasketItems (ok. dawnej linii 3437): pozycja koszyka „jednostka"
wywołuje spawnTransferredUnit, który TWORZY jednostkę u odbiorcy, a dawcy nie odejmuje NIC.
Decyzja Macieja A1=A: transfer ma zdejmować WSKAZANĄ jednostkę dawcy. Jeśli pełne UI wyboru
jednostki (unitOptions w getNegotiationContext) wykracza poza paczkę — dopuszczalny etap 1:
UKRYĆ pozycję „jednostka" w koszyku (i odrzucać ją defensywnie w silniku), z TODO-komentarzem
odsyłającym do A1; etap 2 (pełne unitOptions) zgłosić w logu jako osobne zadanie.

#2 — main.ts, auto-szturm (ok. dawnej linii 10188): wynik zwraca survivors: [] — po auto-szturmie
znika CAŁA armia OBU stron niezależnie od wyniku. Napraw: ocalali wyliczani z realnego wyniku
walki (proporcjonalnie do strat, spójnie z bitwą ręczną/mapFieldBattle — podejrzyj, jak tam
liczone są straty i zastosuj ten sam mechanizm). Przypadek brzegowy: zwycięzca MUSI zachować
co najmniej jednostki, które przeżyły wg proporcji; nigdy 100%/100% strat przy zwycięstwie.

Weryfikacja dodatkowa po naprawie #2: scenariusz testowy (może być node-owy harness w tools/,
wzór combat-test) — auto-szturm silniejszej armii na słabszy garnizon → zwycięzca ma >0 jednostek.
```

## ZLECENIE F1 — dyplomacja: exploity wymiany i bramki

```
[wklej WSPÓLNY NAGŁÓWEK]

PACZKA F1 (9 znalezisk): #16 #47 #45 #20 #21 #19 #46 #22 #66.
Pliki: main.ts (transferBasketItems / applyProposalOutcome / getNegotiationContext / audiencja),
diplomacy-proposals.ts, diplomacy-value-catalog.ts, ui/diplomacyTradeBasket.ts.

- #16: Zaufanie/Dobra Wola naliczane od ZADEKLAROWANEGO PN — nalicz od FAKTYCZNIE przekazanego;
  deal bez pokrycia w zasobach = nie dochodzi do skutku (komunikat), zero trustu.
- #47 (A2=A): pozycja „praca" trafia do PULI PRACY odbiorcy (AI ma aiPracaPoolByOwner), nie do
  złota; dawcy realnie ubywa (brak środków = deal odrzucony, patrz #16).
- #45: dostarczyć cityOptions w getNegotiationContext (lista miast gracza z zapasem spichlerza),
  żeby martwa pozycja „Żywność (spichlerz)" zaczęła działać — silnikowa strona transferu istnieje.
- #20: kurs Rel/100 stosowany zawsze na korzyść proponenta — ma być symetryczny względem stron.
- #21 (A5=A): żądanie trybutu z limitem kwoty zależnym od Respektu/skarbca + cooldown na parę
  państw (stała konfigurowalna, np. 5 tur); duplikat w tej samej turze odrzucany.
- #19 i #46: bramki wasalizacji i prawa przemarszu sprawdzają Respekt NIEWŁAŚCIWEJ strony —
  odwrócić na proponenta (przeczytaj sąsiednie bramki, żeby zachować konwencję).
- ~~#22~~ WYPADA — już naprawione commitem b1a7a61 (buildProposalEvalContext nadpisuje respekt
  świeżą wartością). NIE ruszać; tylko odnotuj w logu.
- #66: tech kupiony w dyplomacji dla gracza ma przejść przez TĘ SAMĄ ścieżkę awansu epoki co
  własne badanie (awansDoEpoki/era) — bez desyncu zbadane vs era.
```

## ZLECENIE F4 — dane jednostek i produkcja

```
[wklej WSPÓLNY NAGŁÓWEK]

PACZKA F4 (7 znalezisk): #10 #11 #58 #67 #41 #32 #33.
Pliki: gra/data/units.json, gra/data/buildings.json, gra/src/game/production.ts, main.ts (2 miejsca).

- #10: 25 jednostek ma tylko polskie kolumny (Pancerz/Przebicie/Uderzenie), a resolver walki czyta
  wyłącznie EN (armor/piercing/chargeBonus, fallback 0) → walczą z pancerzem 0. Napraw SKRYPTEM
  (node, jednorazowy w tools/ albo inline): dla każdej jednostki bez pól EN przepisz wartości
  z kolumn PL (mapowanie ustal po jednostkach, które mają OBA komplety — sprawdź zgodność na
  3 przykładach zanim przepiszesz wszystkie). Po zmianie: sync Panel-C (gen-panel-c.py, round-trip
  na KOPII danych — nigdy export na żywe gra/data).
- #11 (A3=A): egzekwować dane super-jednostek: limit 1 ŻYWEJ sztuki per cywilizacja (licznik po
  Super-jednostka=TAK i nacji — w availableProduction/availableReplacementsFor blokada gdy żyje),
  koszt 0 = naprawdę bezpłatna (bez fallbacku 10 Pracy dla superów). Respawn wg Uwag NIE wchodzi
  w tę paczkę — tylko limit 1 + koszt.
- #58: spawn czyta pole „Super" zamiast „Super-jednostka" — popraw nazwę pola (grep po obu).
- #67: Procarz (Huaracoc) Typ Distance→Slinger (spójność kontr z bazowym Procarzem).
- #41 — ⚠️ WSTRZYMANE DO DECYZJI MACIEJA: sceptyk znalazł w buildings.json:1283 jawny komentarz
  „PARKOWANIE ... poza cap v0.1" = możliwe celowe parkowanie sprzeczne z A4=A. NIE zmieniaj
  epokaWejscia; zadaj pytanie w AUDYT-NAPRAWY-LOG.md + KANAL-PRACA.md i idź dalej.
- #32: bramka rekrutacji Brązu szuka dosłownie `koszary` w builtIds — po upgrade Koszary→Akademia
  miasto traci rekrutację. Użyj istniejącego wzorca isBuildingSupersededByUpgrade/applyCompleted-
  BuildingIds, żeby budynek nadrzędny spełniał wymóg poprzednika.
- #33: hasBrazAccess/hasZelazoAccess liczą ulepszenia/budynki BEZ właściciela — kopalnia AI
  odblokowuje surowce gracza. Filtruj po właścicielu miasta/ulepszenia (podejrzyj, skąd idzie
  placedImprovements i czy niesie ownera; jeśli nie niesie — dołóż filtr na poziomie wywołania).
Bramki dodatkowo: koszary-gate-test, civ-* testy (są w tools/), unit-replace-test.
```

## ZLECENIE F2 — save/load i reset stanu nowej gry

```
[wklej WSPÓLNY NAGŁÓWEK]

PACZKA F2 (9 znalezisk): #12 #13 #14 #15+#26 #40 #42 #43 #44 #68. Plik: main.ts (snapshot/restore/
doStartGame/handler klawisza N/openStartupMainMenu) + ewentualnie audio (reset flagi).

Wzorzec wspólny — INWENTARYZACJA STANU: każdy byt żyjący poza snapshotem ALBO wchodzi do zapisu,
ALBO jest twardo resetowany i przy nowej grze, i przy load:
- #13 wioski: do snapshotu lista złupionych heksów (mapa i tak regeneruje się z seeda — zapis
  samych zlupionych wystarczy, przy load oznacz je istnieje=false). Uwaga na load bez rebuildu mapy.
- #14 battlePowerPtsByOwner: reset w doStartGame (jest w snapshot/load — brakuje TYLKO resetu).
- #15+#26 profile miast-państw i klastrów (typCityCopyOwners, simplifiedDiplomacyOwners,
  foreignTypeOwners, clusterPlacement, clusterCapitalOwnerIds): do snapshotu + restore; flaga
  c.startCityState już jest w zapisie — użyj jej do rekonstrukcji tam, gdzie wystarczy.
- #42 barbCamps: do snapshotu + reset przy load innej gry.
- #43 cityRelig + autoManageCities: do snapshotu + clear w doStartGame i przy load.
- #44 aiSkarbiecByOwner: do snapshotu + restore (symetrycznie do aiPracaPoolByOwner, która już jest).
- #12 klawisz N: bramka „trwa modalna bitwa/preBattle/zawieszona faza AI (aiCmdResume != null)"
  w handlerze N — dopóki wisi dialog, N nie startuje tury.
- #40 ambBattleMuted (NISKI priorytet — sceptyk: scenariusz praktycznie nieosiągalny w grze):
  zdjąć flagę w openStartupMainMenu jedną linią „przy okazji", bez osobnego testowania.
- #68 CameraController: przed utworzeniem nowego wywołać dispose() poprzedniego (5 miejsc — grep
  po `new CameraController`).
UWAGA WSTECZNA ZGODNOŚĆ: stare zapisy bez nowych pól muszą się wczytywać (pola opcjonalne,
sensowne defaulty). Dopisz do logu, które pola doszły do snapshotu.
```

## ZLECENIE F3 — walka i oblężenia

```
[wklej WSPÓLNY NAGŁÓWEK]

PACZKA F3 (9 znalezisk): #23 #25 #50 #51 #52 #53 #54 #55 #72.
Pliki: main.ts (sekcje oblężeń/auto-szturmu/atrycji), game/combat.ts, battle/mapFieldBattle.ts,
game/post-battle-map.ts.

- #50: machiny oblężnicze schodzą PRZED potwierdzeniem szturmu — konsumować dopiero po
  potwierdzonym szturmie; anulowanie preBattle = machiny wracają/nie znikają.
- #51: auto-szturm liczy machiny jako M=0 (rola Oblężnicza) — wpiąć istniejące siegePower().
- #52: AI ocenia siłę oblężenia na PEŁNYM HP (runtimeUnitToSiegeUnit ignoruje u.hp) — przekazać
  realne hp.
- #53: szanse preBattle liczone na fallbacku „wojownika" dla Milicji, a walka na realnej Milicji —
  użyć realnej definicji jednostki też w prognozie.
- #54: negacja szarży dopasowuje po SUBSTRINGU NAZWY jednostki — przełączyć na pole Typ (spójnie
  z counterMultiplier; sprawdź, że elitarni włócznicy — Triari, Mur tarcz — hamują szarżę).
- #23: atrycja garnizonu przy oblężeniu modyfikuje licznik pochodny bez realnego efektu — ma
  zdejmować faktyczne HP garnizonu (albo jeśli to celowo-kosmetyczne, ODRZUĆ z uzasadnieniem).
- #72: śmierć z głodu usuwa jednostki bez sprzątania oblężenia/garnizonu — przepuścić przez tę
  samą ścieżkę co disbandPlayerUnit (sprzątanie oblegaCityId, sync garnizonu, refreshFog).
- #55: rebelState=true zostaje po odbiciu miasta — czyścić przy zmianie właściciela na nie-rebelianta.
- #25: odbicie miasta rebeliantów liczy się jako ELIMINACJA frakcji -99 i daje Power-zdobycze za
  każdym razem — frakcję rebeliancką wykluczyć z logiki eliminacji i z Power-zdobyczy (exploit).
Bramki dodatkowo: combat-test + jeśli istnieją testy oblężeń w tools/ — uruchomić.
```

## ZLECENIE F5 — zachowanie AI

```
[wklej WSPÓLNY NAGŁÓWEK]

PACZKA F5 (5 znalezisk): #24 #31 #48 #49 #71. Pliki: game/ai.ts, main.ts, game/civ-roster.ts.

- #31 (NAJWAŻNIEJSZE): AI nigdy nie buduje budynków — komendy 'build' niosą NAZWY, wykonawca
  robi lookup po ID. Ujednolić na id (znajdź, gdzie AI generuje komendę i gdzie main.ts ją
  wykonuje; wybierz klucz, którego używa katalog budynków). Po naprawie sanity: symulacja kilku
  tur (jest wzorzec harnessów w tools/) — AI stawia pierwszy budynek.
- #24: miasto-państwo atakuje posiłki sojuszniczej siostry — filtr sojuszu zastosować też przy
  WYBORZE CELU, nie tylko w detekcji zagrożenia.
- #49: pętla porządku/szczęścia liczy miasta AI epoką i technologiami GRACZA — liczyć epoką/techami
  WŁAŚCICIELA miasta.
- #48: moc wyeliminowanej cywilizacji (jednostki-sieroty) liczona podwójnie w mianowniku warunku
  dominacji — wykluczyć wyeliminowanych/sieroty z mianownika.
- #71: assignAiCivTypes daje nadmiarowym AI identyczny typ spoza puli aktywnych — przydział
  okrężny (round-robin) z wylosowanej puli.
```

## ZLECENIE F6 — wydajność

```
[wklej WSPÓLNY NAGŁÓWEK]

PACZKA F6 (7 znalezisk): #27 #28 #29 #30 #56 #57 #73.
Pliki: main.ts, units/setup.ts, game/ai.ts, render/cities.ts.

OBOWIĄZKOWY POMIAR PRZED/PO (nie zgadywać): czas pełnej tury na dużej mapie (console.time wokół
pipeline'u końca tury) + czas syncUnitsRender. Wyniki do logu.

- #27: cityFogVisible liczy pełne currentVisible() OSOBNO dla każdego obcego miasta przy każdym
  sync — policzyć RAZ per sync i reużyć (cache per klatkę/wywołanie).
- #30: mousemove z zaznaczoną jednostką liczy pełne currentVisible() przy każdym zdarzeniu —
  cache + inwalidacja przy zmianie mgły/jednostki (throttle jeśli trzeba).
- #28: computePath bez limitu — nieosiągalny cel = flood całego kontynentu ×2 per jednostka AI.
  Dodać limit promienia/odwiedzonych węzłów (bezpieczny, np. 2× dystans do celu + stała).
- #29: findSettlerTarget robi pełny skan mapy × allCities.some(hexDistance) per osadnik — ograniczyć
  do promienia wokół miast/jednostki albo przygotować listę kandydatów raz na turę.
- #56: findNearestVillage alokuje Object.keys(320k) per jednostka — utrzymywać listę wiosek
  przyrostowo (aktualizowana przy lupieniu/spawnie), iterować po liście.
- #57: syncVillageMeshes skanuje WSZYSTKIE heksy przy każdym refreshFog — trzymać listę heksów
  z wioskami (ta sama lista co #56).
- #73: _removeStatChip dispose'uje teksturę współdzieloną ze statTexCache — nie dispose'ować
  tekstur, które są w cache (dispose tylko przy czyszczeniu cache).
UWAGA: zmiany mają być NIEWIDOCZNE funkcjonalnie — bramki pełne + krótki sanity wizualny buildem
do tmp jeśli dotknięto renderu.
```

## ZLECENIE F7 — prawda UI

```
[wklej WSPÓLNY NAGŁÓWEK]

PACZKA F7 (4 znaleziska): #17 #18 #69 #70. Pliki: ui/cityPanel.ts, main.ts, ui/gamePauseMenu.ts.

- #17: panel „Bilans plonów" liczy bez flag budynków/Waluty/bonusów cyw./Porządku, którymi żyje
  silnik (turn-economy przekazuje maMlyn/maTargowisko/maMennica/walutaOdkryta/civ*Mult/apply-
  OrderYieldMults). Docelowo JEDNO źródło prawdy: wyciągnij budowę kontekstu ekonomii do wspólnej
  funkcji używanej przez tick i panel (albo panel woła tę samą funkcję co tick). Pochodne panelu
  (żywność do wzrostu/armii, ETA) mają liczyć się od pełnych wartości.
- #18: pasek armii pokazuje hp: hpMax zamiast u.hp (karty stosu + staty nagłówka) — czytać u.hp
  z fallbackiem hpMax gdy brak.
- #69: „Wczytaj grę" w menu pauzy disabled na starych danych — odświeżyć hasSave po udanym zapisie
  (callback z openSaveGameDialog albo ponowne policzenie przy powrocie do menu).
- #70: panel pokazuje wpływ religii na szczęście bez bramki świątyni, silnik z bramką — panel ma
  używać tej samej bramki (rozjazd = to samo zjawisko co #17; jeśli wspólna funkcja z #17 to
  załatwia, tylko odnotuj).
```

---

## Po KAŻDEJ paczce (przypomnienie dla wykonawcy)
1. Bramki zielone → 2. sekcja w `AUDYT-NAPRAWY-LOG.md` (w tym ODRZUCONE z uzasadnieniem) → 3. commit `fix(audyt-53-FX): ...` → 4. odhacz tablicę stanu wyżej → 5. meldunek w `KANAL-PRACA.md`. Deploy: **tylko na wyraźne polecenie Macieja**, wg runbooka `STAN-PRACY-HANDOFF.md` §6.
