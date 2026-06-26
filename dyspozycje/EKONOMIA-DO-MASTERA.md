# EKONOMIA -> MASTER : pytania i raporty
ZASADA: kazde pytanie/raport pisz DWA razy -- (1) tu na DOLE (krotko, z godzina) ORAZ (2) to samo w CZACIE do uzytkownika.
Odpowiedzi czytaj w dyspozycje/EKONOMIA.md.

---

## 2026-06-22 ~22:10 -- RAPORT: pkt 1 (przeglad modelu ekonomii) ZROBIONY + 1 decyzja blokujaca

ZROBIONE (pkt 1 z planu): przejrzalem economy.ts + turn-economy.ts vs PROJEKT-GRY-master
sec.2/2a/8e i Spec-ekonomia.md. Znalazlem i naprawilem 3 rozbieznosci kod<->spec:
  1. Strumien LUKSUS z suwaka Handlu byl gubiony (spec ss.2.1) -> dodany do wyniku
     (CityYieldResult.luksus + agregat EconomyTickResult.totalLuksus). Karmi Zadowolenie
     (konsumuje lane spoleczenstwa/order).
  2. BIBLIOTEKA -> +Nauka% (master 2a + jest param w econ-params.json) nie byla uwzgledniana
     -> dodane (ctx.maBiblioteka opcjonalne + params.budynekBibliotekaBonusNauki).
  3. loadEconParams byl ZEPSUTY (czytal klucz ASCII zamiast 'prog' z diakrytykiem, nie znal
     metadanych) -> przepisany na poprawny, odporny parser realnego econ-params.json.
  + modyfikator zdrowia 0.05 [PT] wyniesiony z hardkodu do parametru (panel).

PLIKI (moj lane): src/game/economy.ts, src/game/turn-economy.ts. main.ts NIE ruszany.

WERYFIKACJA: logika 12/12 PASS w niezaleznym checku vs przyklady ze spec (ss.2.1: 5/2/0;
ss.4.4: 0.9/0.75/0). ALE pelny tsc/vite/logic-test ZABLOKOWANE -> DEHYDRATACJA OneDrive:
mount bash widzi economy.ts/turn-economy.ts (i wiele cudzych: battleScene, diplomacy,
mappreview) jako UCIETE -> falszywe bledy tsc ('*/' expected na 590/278). Read pokazuje
pliki w CALOSCI i poprawnie -> to NIE bledy kodu. PROSBA: Maciej ustaw caly folder Civ na
"Always keep on this device" (lek z USTALENIA SILNIK pkt 1) -> odblokuje build/test wszystkim.

HEADS-UP cross-lane (UI): cityPanel.ts (lane UI) konstruuje CityYieldContext. Zrobilem
maBiblioteka POLEM OPCJONALNYM, wiec cityPanel.ts NIE wymaga zmian (wstecznie kompatybilne).
UI moze pozniej wpiac Biblioteke przez istniejacy hook getCityBuildingFlags.

DLA SILNIKA: po hydratacji -> rebuild kanonu + `node tools/logic-test.cjs` (Test 8 economy).
Zmiany sa additive/backward-compat; nie wymagaja zmian w main.ts.

PYTANIA/DECYZJE (czekam, zanim ruszę dalej):
  Q1 [BLOKUJE pkt 2/A3]: nowy game/upkeep.ts CZY rozbudowa istniejacego player-economy.ts?
     (brief kazal rozstrzygnac z Toba. player-economy.ts to obecnie orphan-dubel.)
  Q2: regula awansu budynkow -- buildingValue jest LINIOWY (baza+(poziom-1)*przyrost).
     Notatka projektu mowi o "+10% skladany (baza*1,10^(poziom-1))". Ktory kanon? (dotyka
     produkcji/MIASTO -- nie zmieniam sam.)

NASTEPNY KROK po Twojej decyzji Q1: upkeep.ts (magazyny+utrzymanie) + panel Ekonomia-parametry.xlsx
/ Surowce.xlsx -> targeted JSON.

---

## 2026-06-22 ~22:15 -- SELF-CHECK zalozony + wykryta nowa dyspozycja START

- Zalozylem scheduled task **civ-ekonomia-self-check** (co 10 min, cron */10) -> auto-monitoring
  dyspozycje/EKONOMIA.md; przy nowej dyspozycji wdraza ja od razu i raportuje (plik + czat).
- Przy re-readzie EKONOMIA.md wykrylem NOWA sekcje **START** (l.27): zielone na **upkeep.ts** +
  przeglad Ekonomia-parametry.xlsx/Surowce.xlsx; **economy.ts/turn-economy.ts NA RAZIE tylko
  czytac** (SILNIK wlasnie wpina ekonomie) -> zmiany w nich uzgadniac przez _handoff/.

WATEK (transparentnosc, wg RAPORTOWANIE WATKU):
  (1) Pytanie: Q1 -- nowy upkeep.ts czy rozbudowa player-economy.ts?
  (2) Master (sekcja START): "zacznij od upkeep.ts (NOWY plik, zero kolizji)" -> traktuje jako
      wybor NOWEGO game/upkeep.ts. Q1 rozstrzygniete.
  (3) Decyzja: pivot na upkeep.ts (Task 2) + przeglad parametrow. Moje edycje economy.ts/
      turn-economy.ts z pkt 1 (zrobione ZANIM pojawil sie START "tylko czytac") NIE cofam --
      sa additive/backward-compat (logika 12/12) -- oddaje je SILNIKowi do integracji/walidacji
      przez handoff: dyspozycje/_handoff/EKONOMIA-do-SILNIK-economy-edits.md.
  (4) Zajmuje sie: pisaniem game/upkeep.ts (magazyny zywnosci/surowcow + utrzymanie per budynek/
      jednostka + test) oraz przegladem Ekonomia-parametry.xlsx / Surowce.xlsx.

OSTATNIO PRZETWORZONE (22:15): EKONOMIA.md -> sekcja START "zacznij od upkeep.ts" (l.27) + nowy naglowek regul; 2026-06-22 ~22:15.

---

## 2026-06-23 ~01:22 -- RAPORT: upkeep.ts NAPISANY (Plan task 2) + przeglad parametrow (task 3)

KONTEKST: self-check wykryl, ze wpis 22:15 ZADEKLAROWAL pisanie game/upkeep.ts, ale PLIK NIGDY
NIE POWSTAL (brak src/game/upkeep.ts). Brak NOWEJ dyspozycji mastera, ale lancuch (AUTONOMIA /
"stop dopiero gdy plan wyczerpany") NIE byl wyczerpany -> dokonczylem zielona dyspozycje START.

ZROBIONE:
1. src/game/upkeep.ts (NOWY, czysty modul; import tylko typu BuildingRecord z economy.ts):
   - MAGAZYNY (Spec s.7): pojemnosc zywnosci (Spichlerz x5) + surowcow per typ (Magazyn x5),
     przycinanie nadwyzki (przepada), pojemnosc globalna panstwa, zdarzenia podboj/utrata.
   - UTRZYMANIE (Spec s.6): koszt budynkow/jednostek, zywnosc wojska (1 marsz / 0.5 oboz),
     bilans skarbca + flaga deficytu (s.6.4).
2. Przeglad parametrow (task 3): KOMPLET juz w econ-params.json (globalne.magazyn_baza_*,
   magazyn_mnoznik_spichlerz, utrzymanie_jednostka_standard; budynki.utrzymanie_budynek;
   ekonomia_miasta.zywnosc_jednostka_ruch/oboz). Excele panelu NIE wymagaja zmian.

WERYFIKACJA: 33/33 PASS na REALNYM transpilowanym module + `tsc --strict` czyste (vs stub
BuildingRecord). Pelny vite build NADAL blokuje DEHYDRACJA OneDrive (economy.ts itd. uciete dla
bash -> falszywe TS1010 na economy.ts:590; Read widzi pliki w calosci). Prosba: folder Civ ->
"Always keep on this device".

LANE/HANDOFF: main.ts / render / battle / cudze pliki NIE ruszane. player-economy.ts (orphan)
dubluje per-encje utrzymania -> upkeep.ts jest teraz kanoniczny; rekomendacja konsolidacji.
player-economy.ts NIE edytowany (nie moj lane). Paczka dla SILNIK:
dyspozycje/_handoff/EKONOMIA-do-SILNIK-upkeep.md (kontrakt wpiec: pulap magazynu zywnosci,
zywnosc wojska, upkeepBalance; bez nowych kluczy param).

PYTANIE DO MASTERA: brak (bylo dosc danych). Otwarte Q2 (awans budynkow: liniowy vs +10%
skladany) NIE blokuje upkeep.ts -- dotyczy produkcji/MIASTO; czeka jak wczesniej.

OSTATNIO PRZETWORZONE (01:22): dokonczona dyspozycja START -> napisany src/game/upkeep.ts (magazyny s.7
+ utrzymanie s.6), 33/33 PASS + tsc strict, handoff do SILNIK; 2026-06-23 ~01:22.

---

## 2026-06-23 ~01:25 (sesja interaktywna) -- dorzucony test upkeep + porzadki

Wpis 01:22 (bieg self-check) juz domknal Task 2 (upkeep.ts) + Task 3 (parametry) + handoff. Z sesji
interaktywnej DOKLADAM, bez duplikowania:
- gra/tools/upkeep-test.cjs (standalone, 51 asercji) -> **51/51 PASS** na realnym upkeep.ts -- drugie,
  niezalezne pokrycie ponad 33/33 z 01:22 (s.6 utrzymanie + s.7 magazyny, incl. podboj/utrata miasta).
- economy.ts/turn-economy.ts (pkt 1, edytowane w tej sesji) -> handoff do SILNIK:
  _handoff/EKONOMIA-do-SILNIK-economy-edits.md (Luksus, Biblioteka->Nauka, fix loadEconParams, health param).
- TASKI: 1,2,3,4 = DONE. Otwarte tylko Q2 (awans budynkow: liniowy vs +10% skladany) -- niblokujace,
  czeka na mastera. Plan EKONOMIA wyczerpany -> czekam na "start"/nowa dyspozycje (self-check pilnuje).

OSTATNIO PRZETWORZONE (01:25): jak 01:22 + dodany tools/upkeep-test.cjs (51/51) i handoff economy do SILNIK; 2026-06-23 ~01:25.

---

## 2026-06-23 ~01:35 -- AUTONOMIA: konwertery surowcow + zalozenia dla otwartych tematow

Maciej: "przyjmij najlogiczniejsze zalozenia i dzialaj sam". Zrobione + spisane:

ZROBIONE (moj lane, nowy plik, zero kolizji):
- src/game/converters.ts + tools/converters-test.cjs -> **30/30 PASS**. Przetworstwo surowcow
  Spec s.1.5 (Tartak/Mielerz/Cegielnia/Huta/Garncarnia, 1:1 do przepustowosci, pauza brak-wejscia/
  pelny-magazyn, lancuch z kolejnoscia paliwo->reszta). Przepustowosc z econ-params (budynki.*).

PRZYJETE ZALOZENIA (pelny opis: _handoff/EKONOMIA-zalozenia-i-wiazania.md):
- Q2 awans budynkow: +10% SKLADANY (baza*1.10^(poziom-1)) zamiast liniowego -> czeka na AKCEPTACJE
  mastera (balans, dotyka MIASTO); nie zmieniam economy sam.
- Sufit magazynu zywnosci: nalozyc upkeep.foodStorageCapacity na magazynZywnosci (s.7.1) -- kontrakt
  do turn-economy (read-only -> patch w handoffie).
- Utrzymanie+zywnosc wojska w turze: wpiac upkeep.ts (militaryFoodConsumption->ctx; upkeepBalance->skarbiec).
- Mennica/Waluta: przed Waluta mnoznik=1, po Walucie+Mennicy = param (gating z playerState) -- SILNIK.
- Podatki [PT]: model minimalny floor(populacja*stawka), DOMYSLNIE 0 (neutralny) -> czeka na DECYZJE
  mastera o formule; potem dodam param+funkcje.
- Luksus->Zadowolenie [PT 5=+1]: lane SPOLECZENSTWO/ORDER (economy juz zwraca luksus) -- flaga zaleznosci.
- player-economy.ts (orphan): rekomendacja konsolidacji do upkeep.ts (decyzja SILNIK/master).

CZEKA NA CIEBIE (master): (1) Q2 +10% skladany OK? (2) podatki -- formula/zakres? (3) wciaz: folder
Civ -> "Always keep on this device" (odblokuje build/test).

OSTATNIO PRZETWORZONE (01:35): konwertery (30/30) + handoff zalozen EKONOMIA-zalozenia-i-wiazania.md; 2026-06-23 ~01:35.

---

## 2026-06-23 ~02:00 -- DOKUMENTACJA DEWELOPERSKA + panel parametrow Excel

Na zlecenie Maciej (architekt). Dwa deliverables w folderze Civ:
- **EKONOMIA-DOKUMENTACJA-DEWELOPERSKA.md** -- pelna dok.: zakres, pipeline tury, modul po module
  (economy/turn-economy/upkeep/converters), reguly Spec s.1-8 -> mapowanie na kod, parametry,
  zalozenia, stan integracji + kontrakty wpiec, INTERAKCJE z 9 dzialami + Master, testy, ryzyka, TODO.
- **EKONOMIA-panel-parametrow.xlsx** -- 46 parametrow (4 grupy JSON) + 3 proponowane; kolumny:
  grupa/klucz/easy/normal/hard/jednostka/konwencja/opis/uzywane-przez + SNIPPET gotowy do econ-params.json.
  Arkusze: Parametry, Proponowane, Surowce-konwertery, Jak-uzywac. Niebieskie = inputy do edycji.

INTERAKCJE (po zdjeciu od Maciej z lista sesji) zmapowane 1:1 na dzialy: Master, Silnik, MIASTO, UI,
Dyplomacja (handel miedzycyw.: kupno Pracy/surowcow, trybut), Dane Cywilizacji (cechy ekon. cyw.),
Units/Battle (utrzymanie+zywnosc), MAPA (teren), AI (rywale czytaja wyniki+upkeepBalance do decyzji).

Bez zmian w kodzie. Otwarte decyzje bez zmian (Q2, podatki, lek OneDrive).

OSTATNIO PRZETWORZONE (02:00): dokumentacja deweloperska + EKONOMIA-panel-parametrow.xlsx; interakcje z 9 dzialami; 2026-06-23 ~02:00.

---

## 2026-06-24 -- KONSOLIDACJA plikow EKONOMIA do katalogu + przeglad historyczny

Na zlecenie Maciej zebralem nie-growe pliki ekonomii. UTWORZYLEM folder **Civ/EKONOMIA/** z indeksem
`_INDEKS.md` (jeden punkt wejscia do WSZYSTKICH zasobow lane'u).

PRZENIESIONE do EKONOMIA/ (czysto moje, zero referencji):
- EKONOMIA-DOKUMENTACJA-DEWELOPERSKA.md
- EKONOMIA-panel-parametrow.xlsx

NIE PRZENIOSLEM (swiadomie -- przeniesienie ZEPSULOBY referencje; wymaga Twojej zgody + aktualizacji):
- **Spec-ekonomia.md** -- czyta SILNIK (DYSPOZYCJE-SESJI) + katalog ARCHITEKTURA-PLIKI.md.
- **Ekonomia-parametry.xlsx** -- WSPOLDZIELONY: ma zakladki SPOLECZENSTWA (Zdrowie/Szczescie/Kultura/
  Religia/Religie cyw.) + eksport export-data.py -> econ-params.json.
- **Surowce.xlsx** -- twardo w export-data.py -> resources.json; ref w SILNIK.md, PROJEKT-GRY-master.md.
  (Pelna lista referencji i co trzeba zaktualizowac -> EKONOMIA/_INDEKS.md sekcja "ZOSTAJA W MIEJSCU".)

HISTORYCZNE/ARCHIWUM: przejrzalem caly Civ (archiwum/, _archiwum/, _backup/). BRAK osieroconych
nie-growych plikow ekonomii do archiwizacji. Kopie _backup/gra_*/economy.ts (6 szt.) = snapshoty
buildow (nie moje). player-economy.ts = orphan KODU (decyzja SILNIK, nie archiwizuje z mojego lane).

PYTANIE: czy mam skoordynowac pelne przeniesienie Spec-ekonomia.md / paneli do EKONOMIA/ wraz z
aktualizacja sciezek (export-data.py BASE_DIR + odniesienia w plikach mastera)? Domyslnie zostawiam
je w miejscu (bezpiecznie).

OSTATNIO PRZETWORZONE (konsolidacja): Civ/EKONOMIA/ (+_INDEKS.md); przeniesione 2 pliki, 3 zostawione (referencje), brak plikow do archiwum; 2026-06-24.

---

## 2026-06-24 -- OTWARTE PYTANIA (format 1-ABC; rekomendacja = A)

1) Pelna konsolidacja 3 plikow referencjonowanych (Spec-ekonomia.md, Ekonomia-parametry.xlsx, Surowce.xlsx) do EKONOMIA/?
   A) [REKOMEND.] Zostaw w miejscu (bezpiecznie, zlinkowane w _INDEKS.md)
   B) Przenies wszystkie 3 + skoordynuj aktualizacje sciezek (export-data.py BASE_DIR + pliki mastera)
   C) Przenies tylko Spec-ekonomia.md; panele zostaja (eksport + zakladki spoleczne)

2) Q2 -- wzor awansu budynkow (buildingValue)?
   A) [REKOMEND.] +10% skladany: floor(baza*1,10^(poziom-1))
   B) Zostaw liniowy: baza+(poziom-1)*przyrost
   C) Inny mnoznik skladany -- podaj %

3) Podatki (s.2a)?
   A) [REKOMEND.] Minimalny floor(populacja*stawka), domyslnie wylaczony (0)
   B) Inny model -- % od Handlu / globalny suwak podatkowy
   C) Pomin w v0.1

4) Lek na dehydratacje OneDrive (folder Civ -> "Always keep on this device")?
   A) [REKOMEND.] Zrobisz teraz -- odblokuje build/test wszystkim sesjom
   B) Pozniej -- na razie obejscie (kopia w outputs)
   C) Pokaz mi jak to ustawic

---

## 2026-06-24 -- SYSTEM WEALTH: projekt zalozen + pytania (od Maciej, czat)

ROZSTRZYGNIETE przez Maciej: podatki = ISTNIEJACY suwak (Nauka/Skarbiec/Spoleczenstwo), zostaje bez
zmian (to zamyka pytanie 3 wyzej -- bez osobnego modulu podatkow). NOWOSC = system WEALTH.

Spisalem pelny projekt: **EKONOMIA/EKONOMIA-wealth-projekt.md** (idea, poziomy/cap per epoka =
epoka x10, akumulacja jak spichlerz, prog rosnacy, mnoznik=poziom x pieniadze, decay/spadek przy
podwyzce podatkow, parametry, styk z dzialami, plan: nowy game/wealth.ts po decyzji).

PYTANIA (pelne opcje 1-ABC w dokumencie projektowym; rekomendacja = A) -- prosze o odpowiedz TU:
  W1) Wealth per miasto czy narodowy?  (rek. A: per miasto)
  W2) Mnoznik mnozy co? (rek. A: cala "ilosc zebranych pieniedzy" miasta przed podzialem)
  W3) Mnoznik przy Wealth 0/1? (rek. A: xmax(1,poziom))
  W4) Pula po awansie? (rek. A: zostaje ~50% jak Spichlerz)
  W5) Spadek poziomu kiedy? (rek. A: pula=0 mimo utrzymania -> -1)
  W6) Relacja do rdzenia x10/x100/x1000? (rek. A: odrebny mnoznik miejski)

STATUS: bez kodu -- czekam na decyzje (W1-W6), potem buduje game/wealth.ts + test + param do panelu.

OSTATNIO PRZETWORZONE (projekt): WEALTH (EKONOMIA/EKONOMIA-wealth-projekt.md) + 6 pytan W1-W6; 2026-06-24.

---

## 2026-06-24 -- WEALTH: ZBUDOWANY + HANDOFF do wpiecia (status integracji)

Maciej zatwierdzil model i kazal zbudowac + zglosic do wpiecia. ZROBIONE (przez Sonnet-subagenta, wg trybu):
- gra/src/game/wealth.ts (czysty modul) + gra/tools/wealth-test.cjs -> **25/25 PASS**.
- gra/data/econ-params.json: nowa grupa `wealth` (8 kluczy easy/normal/hard); poprawny JSON; backup .bak-EKONOMIA.
- EKONOMIA/EKONOMIA-wealth-projekt.md (ZATWIERDZONY) + panel arkusz "Wealth".

Decyzje Maciej (zamykaja W1-W6 wyzej, ze zmianami): per MIASTO; mnoznik TYLKO na podatek/skarbiec
(=1+(W-1)*0.15, max x1); start W=1; S(=luksus) znika do puli; spadek bufor->poziom; pula po awansie 50%;
zadowolenie z poziomu Wealth (W0 kara, co +10 -> +1) ZASTEPUJE luksus->happiness.

>> HANDOFF do wpiecia w silnik: **dyspozycje/_handoff/EKONOMIA-do-MASTER_wealth.md** (kontrakt tury,
   punkt aplikacji mnoznika na podatek, cross-lane do MIASTO: Wealth->zadowolenie, DoD).
   Master: wpina w petle tury (plaster EKONOMIA) + rozdziela zadowolenie do MIASTO.

OSTATNIO PRZETWORZONE: WEALTH zbudowany (test 25/25) + handoff EKONOMIA-do-MASTER_wealth.md; 2026-06-24.


---

## 2026-06-25 — MODEL DOSTĘPU v0.1 spisany + handoff

Model dostępu surowców (zatwierdzony przez Maciej 2026-06-25) udokumentowany i przekazany:
- **Dokumentacja:** `EKONOMIA/EKONOMIA-analiza-surowce-budynki.md` — nowa sekcja na górze "MODEL DOSTĘPU v0.1 (ZATWIERDZONY 2026-06-25)"; stara analiza ilościowa zachowana jako "KONTEKST v0.2".
- **Handoff cross-lane:** `dyspozycje/_handoff/EKONOMIA-do-MASTER_model-dostepu-surowcow.md` — podział zadań per lane (MAPA/SILNIK, DANE, MIASTO, EKONOMIA, DYPLOMACJA) z DoD i 3 pytaniami otwartymi Q-A1/A2/A3.
- Kod nie ruszany. converters.ts / storage ilościowy = PARKOWANE (nie kasować).

---
### 2026-06-25 — handoff: tempo nauki dla CYWILIZACJE

Przygotowano referencję "tempo nauki" na żądanie lane CYWILIZACJE.
Plik: `_handoff/EKONOMIA-do-MASTER_tempo-nauki.md`

Kluczowe ustalenia:
- Wzór: `Nauka = floor((floor(Handel_netto × %Nauka) + Nauka_budynkow) × BibliotekaMnoznik)`
- Widelki wczesna gra: 1 miasto ~1–8 nauki/turę [PT], 5 miast ~5–40/turę [PT]
- Biblioteka: ×1.5 na całą naukę miasta
- Globalny mnożnik nauki: **NIE ISTNIEJE** — rekomendacja: param `nauka_tempo_mnoznik` w `econ-params.json/globalne` + hook w `advanceCityEconomy` przy agregacji `totalNauka`

---

## 2026-06-25 — SCALENIE: EKONOMIA przejmuje MIASTO

Maciej: EKONOMIA wchłania MIASTO. Przejąłem pliki MIASTA (kod: `cities.ts`, `production.ts`,
`order.ts`, `culture-religion.ts`, `okolica.ts`, `auto-manage.ts`; dane: `buildings.json`/Budynki.xlsx,
`society-params.json`/Społeczeństwo-parametry.xlsx, `terrain-improvements.json`).
Pełny raport + plan + granica (co NIE moje: `playerState`/pula nauki, `main.ts`, render/battle, civs/tech/ai):
**`_handoff/EKONOMIA-do-MASTER_przejecie-miasta.md`**.
**AKTUALIZACJA 2026-06-25 (decyzja Maciela):** skarbiec + pula nauki + wszystkie akumulacje civ-level + produkcja miejska = EKONOMIA.
`playerState.ts` przejęty; magazyn nauki ROZSTRZYGNIĘTY (pula moja, `research.ts` orphan kasujemy). Granica „`playerState`=Twój" z tego wpisu = NIEAKTUALNA.
Drzewko: koszty `tech.json` + wybór AI (`chooseAIResearch`) zostają CYWILIZACJE; ja owner puli + mechaniki wydania (`researchStep`).
Zostają **2 decyzje** Maciela (zdrowie / „rozwój") do wspólnego dokumentu modelu. Master: proszę o dalszą integrację moich modułów (`main.ts` woła, ja owner modułu).

---

## 2026-06-25 — DECYZJE Maciela + dokument modelu scalonego

Maciej rozstrzygnął: **1A** zdrowie = WIRE (podłączyć) · **2A** „rozwój" = Luksus→Wealth · **3A** nastroje = netto+tier (`getOrderState`, bez rozkładu).
Founding-dokument: **`Civ/EKONOMIA/EKONOMIA-model-scalony.md`** (2 suwaki / 4 kubełki, przepływy strumieni, pula nauki = moja, zdrowie WIRE, lista wpięć).
Realizacja przez Sonnet-subagenty: etap 1 = wpięcie zdrowie + `splitPraca` + Luksus→Wealth w `turn-economy`/`economy` (backup + testy, bez kanonu). Po zielonych testach handoff do Ciebie na wpięcie w `main.ts`.
Kontrakt dla UI (okolica + nastroje): `_handoff/EKONOMIA-do-UI_okolica-nastroje.md` (3A potwierdzone).

---

## 2026-06-25 — SESJA AUTONOMICZNA: wpięcia rdzenia + etap 2 + dane (WSZYSTKO ZIELONE)

Maciej dał 1–2h autonomii. Zrobione przez Sonnet-subagentów (backup + testy, bez kanonu):
- **RDZEŃ TURY** (`turn-economy`/`economy`/`economy-upkeep`): zdrowie WIRE · `splitPraca` · Luksus→Wealth (+mnożnik na podatek) · growthMult (przed `populationGrowth`) · compound +10% (`buildingValue` + `buildingUpkeep`). Testy: wire-ekonomia 23/23, wealth 25/25, upkeep 53/53, growthmult-compound 20/20, **logic-test 163/163, vite build OK (980 kB)**.
- **ETAP 2 RELIGII** (`culture-religion`): `spreadReligion` (był) + nowy `cityTradeMultiplier`; test 43/43.
- **DANE**: `terrain-improvements.json` v0.1 (15 ulepszeń + `surowiecOdblokowany` + zasięgi posterunek/fort).

Handoffy do Ciebie: `_wpiecie-scalonej-tury.md`, `_growthmult-compound.md`, `_religia-etap2.md`, `_mapa-terytorium-wioski.md`.

**MASTER (main.ts + cross-lane) — do wpięcia:**
1. `advanceCityEconomy`: dodaj argumenty `cityBuilt` (lista budynków per miasto) + `player.era`.
2. `growthMultByCity` z `evaluateOrder` → przekaż do tury.
3. `wealthZadowolenie` → wlicz do `szczescie` per miasto (ZASTĘPUJE luksus→happiness).
4. **USUŃ `research.ts`** (orphan, brak importerów; bash/OneDrive nie dał rady — ręcznie na Windows).
5. Compound do migracji w `siege.ts`, `player-economy.ts` (inne lane).

**BLOKER ŚRODOWISKO:** dehydratacja OneDrive utrudnia build w sandboxie (subagenty obeszły workflow build-from-outputs; ostatecznie logic-test 163/163 + build zielone). Trwały lek: folder Civ → „Always keep on this device".

---

## 2026-06-25 — AUDYT przed usunięciem sesji MIASTO: CZYSTO

Maciej usuwa sesję MIASTO. Audyt (subagent, read-only): **BRAK clobberu** — MIASTO edytowało pierwsze (`production.ts`/`cities.ts`/`order.ts`), EKONOMIA budowało na tym (`cities.ts.bak-EKONOMIA` ma już `foundCityFromVillage`+`maMur`); aktualne pliki mają OBA wkłady, kompletne. Testy: **logic-test 163/163** + 15 modułowych zielonych (split 46, happiness 38, village 24, wire-ekonomia 23, wealth 25, upkeep 53, culture-religion 43, ai 88, diplomacy 98 …). Pliki/handoffy/docs/MIASTO-katalog zostają na dysku → **bezpiecznie usunąć sesję**.
Pozycja do pogodzenia (moja, nie blokuje): `splitOutput` (MIASTO, niewpięty) vs kanon 2-suwakowy — `EKONOMIA-model-scalony.md` sekcja 9.

---

## 2026-06-25 — odpowiedź na PILNE (koszty/subagenci) + przyjęcie nowych dyspozycji

**TAK — subagenci na Sonnecie.** Cała ciężka robota (kod/build/testy) idzie przez Agent `model:sonnet`; główne okno = tylko brief + odbiór + handoff. Tak działam od scalenia (wpięcie tury, religia, terrain, audyt MIASTA — wszystko subagentami).
Przyjmuję świeże dyspozycje: zdrowie (pełny model — moje WIRE ma bonusy+minusy, dostroję), podział Handel→Skarbiec/Wealth/Badania (= mój podziałHandlu, naming ujednolicę), podatek 10% default, mnożnik 1.7–2.4 (gotowy `cityTradeMultiplier`), nauka sterowana graczem (korekta 1a), terrain→Excel, oblężenie (UNITS).
**ROZJAZD do Macieja (ABC, nie zgaduję):** default „70% skarbiec / 20% badania / 10% podatek" nie spina się z kubełkiem (skarbiec/wealth/badania) — brak `wealth`, jest `podatek`. Pytam Macieja, opis niżej w czacie.

---

## 2026-06-25 (wieczór) — status + odpowiedź na dyspozycję zasięgu

ROZSTRZYGNIĘTE/DOWIEZIONE dziś (wszystko subagentami Sonnet, testy zielone, handoffy w _handoff/):
- Default podziału Handlu = **70 Skarbiec / 20 Badania / 10 Wealth** (econ-params; „10% podatek" było pomyłką = Wealth).
- **Okolica/plony:** `cityRangeForPopulation = min(pop, zasieg_okolicy_max=15)` (radius=pop) + plony TYLKO z pól z przypisanym obywatelem (N=pop, `assignWorkedTiles`), centrum bazowo. (okolica 16/16)
- **Oblężenie** (turn-economy: flaga `oblegane`, getCityFood) — kontrakt do UNITS.
- **Drzewko Żelaza** (tech.json +9 techów) + **11 budynków Żelaza** (buildings.json) + Excele do strojenia.
- **Nauka sterowana graczem** w DRZEWKU (wytyczne do UI) — nie osobny panel.
- **Koszt jednostek = zawsze skarbiec** (anulowany wyjątek Kamień=Praca). logic-test **180/180**.

ODPOWIEDŹ na Twoją dyspozycję [l.229-230]: **radius=pop potwierdzone** (`min(pop,15)`), cap 15 OK, MAPA `territory.ts` ma używać `cityRangeForPopulation`. JEDEN niuans → Maciej: Twoje „okolica=terytorium" + cap 15 koliduje z wcześniejszym modelem terytorium = okolica + pierścienie kultury (+0..3, do r18). Pytam Macieja (ABC w czacie), czy kultura nadal rozszerza terytorium, czy v0.1 = terytorium = radius=pop. Do decyzji NIE ruszam MAPA-handoffa.

**→ Maciej wybrał 1B (2026-06-25):** terytorium = bazowy zasięg (`min(pop,15)`) + zasięg kulturowy (`cityBorderRadius` +0..3), addytywnie (max 18). Pola obrabiane = bazowy zasięg sam. MAPA-handoff (`_mapa-terytorium-wioski.md`) ZAKTUALIZOWANY na tę formułę. Master: rozdaj MAPIE.

---

## 2026-06-26 — odpowiedź na Twój batch (fix blokera + potwierdzenia)

- **Lazaret / `koszary-gate-test` (BLOKER rebuildu) — NAPRAWIONE.** `buildings.json` lazaret `epokaWejscia=5` (Średniowiecze, kanon); test zsynchronizowany (asercje 4→5, dostępność epoch 4→5). Test powinien przejść → **możesz rebuildować kanon.**
- **Warsztat oblężniczy → Średniowiecze (5)** — przeniesiony z Żelaza (epoka 3→5) wg Twojej dyspozycji [EKONOMIA.md l.244-245]. Zestaw Żelaza = teraz **8 budynków** (Kuźnia żelaza, Fort, Akademia, Teatr, Sąd, Pretorium, Łaźnia publiczna, Akademia wojskowa). Uwaga: `techUnlock` Warsztatu = „Oblężnictwo" (Żelazo) — niespójność epoka-budynek↔tech (parked, nieblokujące; do uzgodnienia gdy Katapulta=Średniowiecze, z UNITS/drzewkiem).
- **Waluta ×2 = CAŁA pula Handlu — POTWIERDZAM** [l.258]. `economy.ts` mnoży `handelNetto` PRZED podziałem (`walutaMnoznik` na całość), więc Skarbiec + Badania + Wealth dostają ×2. Zero zmian w kodzie — już tak działa.
- **Praca→Pieniądz z `doPuli` (nadwyżka) — POTWIERDZAM** [l.260]. Kod: `pieniadzZPracy = floor(doPuli × 2)` gdy Targowisko+Waluta.
- **Dziękuję za wpięcie** `walutaOdkryta` + flag budynków z `builtIds` + `playerZbadane` w sygnaturze. Mój kod używa opcjonalnych pól ctx — kompatybilny.
- **OTWARTE (nie u mnie pilne):** (a) surowce **żelazo/stal** do `resources.json` = DANE/MAPA (mój tech-handoff to flagował); (b) `mnoznikHandelPieniadz` per-cyw (1.7–2.4) — w nowym modelu Waluta=×2 jest głównym mnożnikiem, per-nacja = opcjonalna wariacja, niski priorytet — czekam na priorytet od Maciela.

### KOREKTA (Maciej, 2026-06-26): Warsztat oblężniczy = ŻELAZO (3), nie Średniowiecze
Cofam poprzedni ruch. **Warsztat oblężniczy → epoka 3 (Żelazo)**, z resztą budynków Iron. Powód: v0.1 = 3 epoki (Kamień/Brąz/Żelazo) i Żelazo wchodzi do v0.1 → Żelazo MUSI być epoką 3. Klasyczna(4) i Średniowiecze(5) są PO Żelazie. Zestaw Żelaza = **9 budynków** (z Warsztatem). Lazaret = 5 (Średniowiecze), Wielka Kuźnia = 4 (Klasyczna) — bez zmian. Testy: koszary-gate 18/18, **logic-test 191/191**. Kanon gotowy do rebuildu.
