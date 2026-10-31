STATUS: DECISION_REQUIRED
DOMAIN: GAME (WEB, `gra/`, pomiar na zywej grze; zero zmian kodu gry)
TEMAT: R-WEB-LIVE-MEASURE-CLEARING-DEFICIT-Q1
GOAL: zmierzyc na ZYWEJ grze (Chromium, realny endTurn) (A) tick wycinki gracza i kolejnosc etapow farma->trzoda->irygacja, (B) czestosc niedoboru surowca `resourceDeficitKeysForOwner(0)`; naprawiac tylko zmierzony blad wycinki
RUNDA: 1/5 (Operator, baza `d8b2766b4` = origin/main po deployu ROBOCZA bdd45872)

ZMIANY/COMMIT
- Baza: d8b2766b4. Commit tej rundy: patrz linia SHA na dole (dopisana po commicie).
- Nowe pliki (allowlista `gra/tools/*-measure*.cjs`): `clearing-deficit-live-measure.cjs` (sterownik + hak odczytu), `clearing-deficit-summarize-measure.cjs`, `clearing-deficit-summarize-a-measure.cjs`, `clearing-deficit-table-measure.cjs`.
- Hak `window.__measDebug` wstawiany WYLACZNIE do KOPII `main.ts` w scratch (poza repo; vite build do scratch, `npm run build/dev` nieuzywane). `gra/src/main.ts` i reszta repo BEZ zmian. Fixture'y stanu (tylko w kopii): techy (`player.zbadane.add`), polityka imperium (`ulepszeniaEmpireByOwner.get(0)`), populacja 9, okolica reczna (`okolicaReczne` = akcja gracza "obywatel na heksie"), wstawienie Las na heks, pula Pracy; wszystko inne to realna gra (`doStartGame`, `tryFoundPlayerCityAt`, `advanceSeat` = endTurn, `buildSaveGameSnapshot`/`restoreGameFromSave`).
- Sprzatanie wykonane: `gra/node_modules` i scratch (bundle) usuniete.
- Dowody: `evidence/` (JSON z kazdej tury, zrzuty PNG, logi A i bramek z `EXIT=` (logi B bez `EXIT=`, patrz KOREKTA R1 nizej), summary-*.json, gate-*.txt).

========================== ZADANIE A — wycinka gracza (zywy tick) ==========================
Srodowisko: nowa gra (Rzymianie, Normalny, Maly, Kontynenty), stolica gracza, tryb ulepszen `auto`, 100% budzetu, "wolno wycinac las" ON, "tylko z obywatelami" ON, heks lakowy Z RZEKA (`rzeka.obecna`) dist 1 od stolicy z Las (wstawiony fixture'em) i obywatelem (okolica reczna), techy Rolnictwo/Oswojenie zwierzat/Irygacja/Obrobka drewna/Lowiectwo. Seedy 778899 i 2024.
Plik: `evidence/A-zywnosc-seed778899.json`, `A-save-zywnosc-praca90-seed2024.json` itd.; podglad: `node tools/clearing-deficit-summarize-a-measure.cjs <plik>`.

A1 (profil „Zywnosc", seed 778899, heks 47,23) — przebieg tura po turze:
- EOT 4->5: pick `wyrab` (typ `wycinka`): `hexClearingStates` SET {turnsLeft:1, pracaPerTurn:50}; Praca pobrana 2.5 RAZ (autoKoszt=2.5); Las nadal jest.
- EOT 5->6: tick -> DEL stanu, `nakladka` las -> brak, magazyn Drewno 0 -> 44 (50 z wycinki minus ok. 6 zuzycia/ture; obserwacja netto), w TEJ SAMEJ EOT postawiona farma (tick wycinki jest przed pickerem: main.ts ~34654 vs ~35960).
- EOT 6->7: trzoda (`bydlo`); EOT 7->8: irygacja. Po wycince kazda tura = 1 etap; kolejne etapy startuja PO zniknieciu lasu.
- Powtorka seed 2024 (heks 14,12): identyczna sekwencja (SET t5 -> DEL+farma t6 -> bydlo t7 -> irygacja t10 z oczekiwaniem na pule Pracy).
Odpowiedzi na pytania dispatchu:
 1. Czy wycinka sie konczy: TAK (4/4 przebiegi A: Zywnosc 778899, Zywnosc 2024 (praca90), save/load 778899, zrownowazone+fill 778899).
 2. Ile tur: 1 tura (jeden tick EOT). `gra/data/terrain-improvements.json` `wyrab.wycinka.tury: 1`, `praca_per_tura: 50`, `koszt_praca: 2.5`. Slowo „wieloturowa” z dispatchu jest nieprecyzyjne: dzis to JEDEN tick (stan zyje 1 pelna ture).
 3. Czy startuje podwojnie: NIE — dokladnie 1 zdarzenie SET na heks (log `ev` w kazdym wierszu; picker dostaje `clearingHexKeys`, main.ts ~36047; strazniki `hexClearingStates.has` ~36072).
 4. Czy Praca pobierana raz: TAK — 2.5 w turze startu; w turze ticku `autoKoszt` = koszt NASTEPNEGO etapu (farma 20), wycinka nie pobiera nic drugi raz.
 5. Czy etapy startuja PO zniknieciu lasu: TAK (farma w tej samej EOT co DEL; wczesniej brak warstw na heksie).
 6. Zapis/odczyt w trakcie wycinki (`A-save-*-praca90-*`, reload = snapshot->restore->reapply w turze z `turnsLeft:1`): stan `hexClearingStates` identyczny przed i po ({turnsLeft:1,pracaPerTurn:50,ownerId:0}), po nastepnej EOT las znika, Drewno +44, farma/trzoda/irygacja idą dalej — BEZPIECZNE (seed 778899 i 2024, bledy pageerror/console.error: 0).
 BLEDU WYCINKI NIE ZMIERZONO => zero zmian w `main.ts`, brak testu czerwony->zielony i mutacji (nie dotyczy).

A2 (profil „zrownowazone", ten sam heks, bez zmian w magazynie, `A-zrownowazone-seed778899.json`) — ZMIERZONY EFEKT NIEDOBORU NA WYCINCE:
- W EOT 4->5 picker K2 (niedobor Drewna/kamienia/itd. stale aktywny, patrz B) postawil na lesnym heksie TARTAK i OBOZ LOWIECKI (zamiast wycinki), potem droga i posterunek; przez 40 zmierzonych tur NIE bylo wycinki (0 zdarzen `clr-set`), heks zostal lasem, farma/trzoda/irygacja NIE powstaly.
- Ten sam scenariusz z magazynem uzupelnianym fixture'em (200 szt. kazdego z 15 surowcow co ture => brak niedoboru, `A-zrownowazone-fill-seed778899.json`): wycinka startuje w EOT 4->5 i przebieg jest identyczny jak A1 (farma, bydlo, irygacja).
- Wniosek (pomiar, nie opinia): przy stalym niedoborze (B) profil „zrownowazone” NIE dochodzi do wycinki lasu pod rzeke/farme — etap niedoboru (tartak/oboz) ubiega etapy zywnosciowe. To nie jest regresja kodu wycinki, tylko konsekwencja stalego niedoboru i starych regul K2 (pytania ABC-A/B/F z R2). Nie zmieniam.

Obserwacja dodatkowa (poza wycinka, NIE naprawiane): przy wczytaniu zapisu pula Pracy jest zerowana, gdy `playerPracaPool > max(50, miasta*100)` (main.ts 42491-42497, komentarz „stary bug map-total”). Zmierzone: pula 405 przed zapisem -> 0 po odczycie (`A-save-zywnosc-seed778899.json`, wiersz t5->6 „praca 0->7”; kontrola `-praca90-` bez utraty). Pula >100 przy jednym miescie powstaje naturalnie, gdy automat nie ma co budowac (A1: 398 w turze 17). Do osobnego tematu/ABC wlasciciela, jesli taka utrata jest niechciana.

========================== ZADANIE B — czestosc niedoboru (zywy pomiar) ==========================
Definicja: `resourceDeficitKeysForOwner(0)` (main.ts 20800-20819) = `detectOwnerResourceNeeds` (ai-resource-needs.ts 93-): (1) zapas < pakiet = 10 szt. z 15 wycenionych surowcow, (2) surowce wymagane przez kolejke budowy/rekrutacji, (3) flaga „zywnosc” gdy rezerwa < 8. Mierzone co ture 1..61 (nowa gra, Normalny, domyslne opcje, miasta 1->3 w 5 z 6 przebiegow: 2. miasto ok. tury 12-30 przez realne `tryFoundPlayerCityAt`; KOREKTA R1: w `pangea, pasywny` miasto nie powstalo (1 miasto przez 61 tur, `foundAt` same `false`), 2+ miast w tym przebiegu NIE_ZMIERZONO).
Warianty: PASYWNY = gracz nie buduje (budowa reczna, ulepszenia reczne); AKTYWNY = ulepszenia auto (zrownowazone, 100%) + auto-budowa + wczesne techy (Rolnictwo, Garncarstwo, Murarstwo, Obrobka drewna, Brazownictwo, Lowiectwo, Oswojenie zwierzat). 3 swiaty: kontynenty (seed 778899), pangea (778899), wyspy (2024). 6 przebiegow x 61 tur = 366 pomiarow. Surowe dane: `evidence/B-*.json`, agregaty `summary-B-*.json`, tabela `node tools/clearing-deficit-table-measure.cjs evidence`.

| Przebieg | tury z niedoborem (>=1 klucz) | magazyn <10 (>=1 klucz) | flaga zywnosc | tury bez niedoboru | stale (>=95% tur) | zapas >=10 (tur z 61) | srednio kluczy w niedoborze | tury z niepusta kolejka |
|---|---|---|---|---|---|---|---|---|
| kontynenty, pasywny | 61/61 = 100% | 61/61 | 31/61 | 0 | 14/15 surowcow | glina 60 | 14.5 | 0/61 |
| pangea, pasywny (1 miasto, 2+ miast NIE_ZMIERZONO) | 61/61 = 100% | 61/61 | 61/61 | 0 | 14 surowcow z 15 + flaga zywnosc | glina 56 | 15.1 | 0/61 |
| wyspy, pasywny | 61/61 = 100% | 61/61 | 23/61 | 0 | 13/15 surowcow | glina 60, drewno 43, kamien 1 | 13.7 | 0/61 |
| kontynenty, aktywny | 61/61 = 100% | 61/61 | 17/61 | 0 | 9/15 surowcow | glina 60, sol 45, ruda 33, ruda_cyny 33, kamien 27, drewno 8 | 11.9 | 13/61 |
| pangea, aktywny | 61/61 = 100% | 61/61 | 20/61 | 0 | 11/15 surowcow | glina 56, sol 47, ruda 19, drewno 12 | 13.1 | 21/61 |
| wyspy, aktywny | 61/61 = 100% | 61/61 | 20/61 | 0 | 9/15 surowcow | glina 60, ruda 48, ceramika 43, sol 41, ruda_cyny 36, drewno 10 | 11.4 | 11/61 |

Wnioski liczbowe:
- Odsetek tur z niedoborem: 100% we WSZYSTKICH 6 przebiegach (366/366 tur); tur „bez niedoboru”: 0. Zgodne z pomiarem R3 (50/50, 40/40). Hipoteza „niedobor nie wystepuje zawsze, czesto nadpodaz” NIE potwierdzona na definicji „kazdy z 15 < 10 szt.”.
- Nadpodaz istnieje PER SUROWIEC, nie na poziomie „>=1 klucz”: glina (>=56/61 tur zapasu >=10; w pasywnym zapas 1592 w t61 — gra przypisuje glinie stale zloze w poblizu stolicy), w aktywnym tez sol/ruda/ceramika/drewno czesciowo. Ale 9-14 z 15 wycenionych SUROWCOW (magazyn <10; flaga `zywnosc` liczona osobno, stala >=95% tylko w `pangea, pasywny`) jest w niedoborze >=95% tur, w tym surowce, ktorych gracz nie wytwarza ani nie potrzebuje w tym okresie (ruda zelaza, stal, braz, zloto, wegiel, kon, cegla — dane `kluczeStale95`).
- Podzial wg liczby miast (z `summary-*`): 1 miasto 14.0-15.2 kluczy w niedoborze srednio; 2 miasta 11.5-15; 3 miasta 9.9-14.1 (spadek tylko w aktywnym). W zadnej kombinacji liczba tur z niedoborem nie spadla ponizej 100%.
- Niedobor „z kolejki poza magazynowym” (KOREKTA R1; poprzednia wersja twierdzila 0/61 i byla BLEDNA): pasywny 0/61 (kolejka pusta); aktywny kontynenty 3/61 (klucz kamien), pangea 2/61 (drewno), wyspy 1/61 (drewno). Kolejka dokłada wiec ponad prog <10 tylko 1-3 tury na 61 i tylko kamien/drewno. Dane: `summary-B-*-aktywny.json` pola `niedobor_z_kolejki_poza_magazynowym`, `kolejkaPozaMagazynem_kluczeLiczbaTur`.
- Wariant „potrzebne kolejce budowy/rekrutacji” (propozycja B z FC): dolna/gorna granica z pomiaru: pasywny 0/61 tur z niepusta kolejka => 0% tur z niedoborem; aktywny 11/61, 13/61, 21/61 tur z niepusta kolejka => co najwyzej 18%, 21%, 34% tur z niedoborem (GORNA granica; dokladna liczba kluczy brakujacych dla kolejki: NIE_ZMIERZONO, bo hak nie liczyl `resourceKeysNeededForBuildingQueue`).
- Czas pomiarow: ~8 min / przebieg 61 tur (generowanie swiata ~50 s).
- Artefakt progowy: TAK, silny. Prog `<10` dziala jak „brak zapasu” dla surowca, ktorego gracz nie ma zlozem/techem; skutek zmierzony w A2 (stale „niedobor” drewna => tartak+oboz zamiast wycinki). Zgodnie z dispatchem NIE zmieniam progu — pytanie ABC ponizej.

PYTANIE ABC DLA WLASCICIELA (kontekst K2/K3: gracz „Zrownowazone” i AI; zadaje orkiestrator)
Pytanie: skoro niedobor „<10 szt. dowolnego z 15 surowcow” jest aktywny w 100% tur (366/366), co ma uruchamiac etap niedoboru w „Zrownowazonym” (gracz K2 i AI K3)?
- A) Zostawic prog `<10` (stan dzis). Konsekwencja zmierzona: K2/K3 stale w trybie niedoboru; na lesnym heksie z rzeka tartak/oboz ubiega wycinke i farme (A2, 0 wycinek w 40 turach).
- B) Niedobor = tylko to, czego potrzebuje kolejka budowy/rekrutacji (kluczowe dla tartaku: brak drewna dla zaplanowanego budynku). Zmierzone: 0% tur (pasywny), <=18-34% tur (aktywny, gorna granica). Wymaga doprecyzowania: czy samo „pusta kolejka = brak niedoboru” wystarcza (gracz bez kolejki nie dostaje tartaku).
- C) Zostawic `<10`, ale liczyc tylko surowce „osiagalne” dla wlasciciela (zloze w terytorium albo odblokowany tech wytworzenia; ruda zelaza/stal/zloto bez dostepu nie liczone) lub obnizyc prog do 1-2 pakietow dla surowcow bez produkcji. Zmierzone: tylko 4-6 z 15 surowcow (plus osobno flaga zywnosc) faktycznie waha sie miedzy niedoborem a nadpodaza w aktywnym; reszta stale < 10. Dokladna liczba po filtrze „osiagalne”: NIE_ZMIERZONO.
Rekomendacja Operatora: B (zgodne z propozycja FC i z hipoteza wlasciciela), z C jako uzupelnieniem dla AI. Decyzje do podjecia przez wlasciciela; nic nie zmieniam.

TESTY (kod gry bez zmian; wyniki = PRZED = PO, baza d8b2766b4; logi z jedna linia EXIT= w `evidence/`)
- tsc --noEmit: EXIT=0 (`gate-tsc.txt`).
- autoimprove-stages-q1: 143/0 EXIT=0 (dispatch wymienial punkt odniesienia bez liczby; baza R3 111/0 — liczba 143 to aktualny stan bazy `d8b2766b4`).
- auto-improvements 45/0 EXIT=0; ai-improvements 53/0 EXIT=0; diplomacy 148/0 EXIT=0; war-era-counter 82/0 EXIT=0; unit-owner-emblem-ring-civ-color 15/0 EXIT=0.
- KRYTERIUM 4 (`EXIT=` w logu): SPELNIONE dla 5 logow A i 7 bramek; NIESPELNIONE dla 6 logow B (koncza sie linia `RESULT_FILE=`, brak `EXIT=`; wczesniejsze twierdzenie raportu bylo nieprawdziwe). Kompletnosc potwierdzaja `B-*.json` (61 wierszy, `errors: []`); kodu wyjscia nie odtworzono, powtorka B NIE wykonana.
- Test regresji czerwony->zielony i mutacja: NIE DOTYCZY (brak zmierzonego bledu wycinki, brak zmian w kodzie gry).
- Zywe przebiegi: A 4 przebiegi (+2 nieudane kalibracje: brak kandydata heksu, dane w historii), B 6 przebiegow; pageerror/console.error: 0 (pole `errors` w JSON).

BLOKADY / NIE_ZMIERZONO
- Wycinka zmierzona na heksie z fixture'em Las (generator nie dawal lasu+rzeki+obywatela w zasiegu miasta startowego) i obywatelu przez okolice reczna; `onlyWorked` potwierdzone (`worked:true`). Czy w naturalnej mapie zdarza sie taki heks: nie mierzono (`nCand` 14-20 = kandydaci laka/rownina w dist<=3 w terytorium (rzeka lub nie), lesnych-z-rzeka naturalnych nie liczono).
- Liczba kluczy niedoboru wynikajacych z kolejki OGOLEM (takze gdy magazyn >=10): NIE_ZMIERZONO (hak nie liczyl `resourceKeysNeededForBuildingQueue`; gorna granica = tury z niepusta kolejka). Klucze spoza progu <10 w kolejce: zmierzone 3/61, 2/61, 1/61.
- `pangea, pasywny`: 1 miasto przez 61 tur (`foundAt` same `false`); 2+ miast w tym przebiegu NIE_ZMIERZONO. Pozostale 5 przebiegow: tury z 2+ miastami 44, 47, 20, 44, 47 z 61 (pangea aktywny: 3 miasta tylko 2 tury).
- Zachowanie wycinki gracza w trybie 2+ miast jednoczesnie, w trakcie bitwy/AI-turn: NIE_ZMIERZONO.
- Pomiary B: 3 swiaty x 2 warianty, jeden seed na swiat; wiecej ziaren NIE_ZMIERZONO (koszt ~8 min/przebieg).
- Proces: srodowisko skasowalo wczesny katalog scratch (utrata pierwszych wynikow B), pomiary B powtorzone i zapisane od razu do `evidence/` w repo.

RUNDY: 1/5 (zuzyto 1; ostatni werdykt: brak; decyzja wymagana: odpowiedz ABC wlasciciela dot. definicji niedoboru, patrz wyzej)
NASTEPNY KROK: orkiestrator zadaje pytanie ABC wlascicielowi (kontekst K2/K3) z liczbami z tego raportu; po decyzji nowy temat implementacyjny (picker/`detectOwnerResourceNeeds`); rownolegle Evaluator R1 tego raportu (weryfikacja `evidence/*.json`) i Final Control.
DEPLOY/PUSH: NIE WYKONANO
