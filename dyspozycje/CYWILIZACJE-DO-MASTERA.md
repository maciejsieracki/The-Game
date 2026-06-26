# CYWILIZACJE -> MASTER : pytania i raporty
ZASADA: pisz w czacie + tu (append-only).

---

## [2026-06-24 21:57] HANDOFF od zamykanej sesji DANE → dla CYWILIZACJE (przejmującej)

### ✅ ZROBIONE (część DANE — gotowe, nie ruszać)
- **Roster 9 typów** w `civs.json`: Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi, Egipt, Sumerowie, Celtowie, Germanie — każdy z: styl, jednostka specjalna, bonus/minus (konkretne), **religia**, **`Typ główny`=true**. `loader.ts` tsc=0; zmieniany TYLKO `civs.json`.
- **Religie 9** w `Spoleczenstwo-parametry.xlsx` → „Religie cywilizacji" (źródło). ⚠ `society-params.json` wciąż ma **7** → re-eksport = master/silnik.
- **Jednostki (kierunek)** dla Units/Battle: `Civ-DANE/PACZKA-DLA-UNITS-od-DANE.md` + `Civ-DANE/Jednostki-specjalne-przeglad.xlsx` (Kamień/Brąz/Żelazo; Żelazo: 1 wyjątkowa/cyw. + 2. dla Chiny/Egipt/Sumer; Inkowie=elita brąz/miedź).
- **Dokumentacja dev:** `Civ-DANE/DOKUMENTACJA-DANE-cywilizacje.md` + `Civ-DANE/INDEX.md`.
- **Porządek:** katalog `Civ-DANE/` (dokumenty/analizy). Źródła (`Cywilizacje.xlsx`), plik gry (`gra/data/civs.json`) i kanał zostają na miejscu (powody w INDEX).

### ⏳ DO WYKONANIA (przejmuje CYWILIZACJE)
1. **Wypełnić 3 arkusze** w `Cywilizacje.xlsx` (szkielety gotowe, niebieskie komórki = wartości od Naster):
   `AI-zachowanie` (11×9), `Parametry-cyw` (11×6), `Dyplomacja` (11×7). Profil AI/charakter per cyw: militarność, ekspansja, sojusze/lojalność, nauka-kultura-ekonomia, ryzyko, zapał religijny.
2. **Re-eksport CELOWANY** (NIGDY export-data.py/npm build): `civ-ai.json` (BRAK), `civ-params.json` (BRAK), `diplomacy.json` (jest STARY — regen z nowego arkusza). `civs.json` aktualny.
3. **Kod AI (przejęte z działu AI; ISTNIEJĄ, NIEwpięte do main.ts):**
   - `gra/src/game/ai.ts` (610) — `decideAITurn(...)→AICommand[]`. Czyta `data.aiParams` + mapuje typ cyw→archetyp. **DO: podłączyć pod nowe arkusze AI-zachowanie + Parametry-cyw** (zamiast/oprócz sztywnych wartości).
   - `gra/src/game/victory.ts` (223) — `checkVictory(input)`: dominacja typu + statek + eliminacja.
   - `gra/src/game/barbarians.ts` (561) — `spawnCamps/tickCamps/decideBarbarianMoves/loadBarbParams/barbariansActive`. Czyta `ai-params.json` (ma FALLBACK).
   - Testy: `gra/tools/barbarians-test.cjs`, `combat-test.cjs`, `logic-test.cjs` (sprawdzić ai/victory harness).
4. **Handoff do mastera** (po podłączeniu/testach): „ai/victory/barbarians gotowe do wpięcia" + instrukcja (handler „N": `decideAITurn`→wykonać `AICommand[]`; `checkVictory` co turę; tick barbarzyńców) + DoD → `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_ai-wpiecie.md` + meldunek tutaj.
5. **Dyplomacja:** re-analiza założeń (a)/(b) turniejem (z dyspozycji DYPLOMACJA) — nadal aktualna.
6. ⚠ **PILNE — self-check:** scheduled task **`civ-dane-self-check` czyta jeszcze martwy `DANE.md`** (baseline w `DANE-DO-MASTERA.md` = KOREKTA Q3; w DANE.md są NOWSZE wpisy 2026-06-24 → mógłby je przetwarzać w martwym kanale). **Repoint na `CYWILIZACJE.md` albo wyłączyć.** Nie zdążyłem przepiąć.

### REGUŁY (zachować)
Backup przed zmianą (`cp plik plik.bak-CYWILIZACJE`). Edytujesz tylko swoje pliki; wpięcie do main.ts/kanonu = master (handoff). Eksport CELOWANY per JSON. Pytania tekstem w czacie + append tu. Tryb event-driven.

### GDZIE CO LEŻY
Źródło: `Cywilizacje.xlsx` (5 arkuszy). Religie: `Spoleczenstwo-parametry.xlsx`→„Religie cywilizacji". Moje docs/analizy: `Civ-DANE/`. Gra: `gra/data/*.json`; kod AI: `gra/src/game/{ai,victory,barbarians}.ts`. Kanał: `CYWILIZACJE.md` (wsad) + ten plik (raporty).

### OTWARTE DECYZJE (Naster)
- Wartości do 3 arkuszy (AI/Dyplomacja/Parametry) — Naster podaje lub akceptuje propozycję.
- Jednostki Żelaza (propozycja w `Civ-DANE/`) — czy zaakceptowane do przekazania Units/Battle.

---
[2026-06-24 20:00] CYWILIZACJE: orientacja + PRZEGLAD modulow AI (read-only, brak zmian w kodzie).
Potwierdzam przejecie zakresu z handoffu DANE (powyzej). Reguly PLAYBOOK przyjete (handoff/backup/limity/sedzia/event-driven).
PRZEGLAD 3 modulow (wszystkie czyste, no DOM/THREE):
- victory.ts — KOMPLETNY i poprawny dla v0.1 (dominacja/przegrana/nauka); potrzebuje TYLKO wpiecia.
- barbarians.ts — logika OK, test 53/0 (zielony); klucze 'barbarzyncy_*' brak w panelu -> dziala na FALLBACK.
- ai.ts — logika v0.1 OK (produkcja wg zagrozenia/fazy, marsz na miasto wroga = dominacja, osadnicy, ranged hold-back).
  LUKI: (1) czyta STARY ai-params.json, NIE civ-ai.json / civ-params.json; (2) agresja/ekspansja/ryzyko NIE uzyte
  w decyzjach (AI zawsze maszeruje na najblizsze miasto wroga); (3) brak wyboru trudnosci 1/2/3; (4) czyta tylko
  entry.wartosc (z diakrytykiem) — ujednolicic z tolerancyjnym wartosc/wartość jak w barbarians.
PROPOZYCJA ARCHITEKTURY: per-nacja (agresja/ekspansja/priorytety/ryzyko/preferowane budynki+jednostki) ->
  civ-ai.json + civ-params.json (czyta ai.ts); globalne (trudnosc 1/2/3, 'barbarzyncy_*', heurystyki ekspansji)
  -> ai-params.json. ai.ts laczy: per-nacja + globalne + trudnosc.
DZIALANIE (pkt 6 PILNE z handoffu): scheduled task 'civ-dane-self-check' czytajacy martwy DANE.md ->
  WYLACZYLEM (enabled=false), by nie dzialal w martwym kanale ani nie kolidowal z ta sesja. Jesli ma byc
  self-check dla CYWILIZACJE — zalozyc swiadomie (godzinny wg PLAYBOOK), nie 10-min.
PYTANIA DO NASTER (blokada na "uzupelnienie arkuszy"):
  Q1: 3 arkusze (AI-zachowanie 11x9, Parametry-cyw 11x6, Dyplomacja 11x7) — mam zaprojektowac kolumny + wpisac
      wartosci STARTOWE per nacja (Ty potem korygujesz), czy czekam az podasz wartosci?
  Q2: priorytet nastepnego kroku — turniej (a)/(b) [autoryzowany] czy najpierw podlaczenie ai.ts pod arkusze?

---
[2026-06-24 22:44] HANDOFF: nazwy klastrow -> civs.json. Szczegoly: _handoff/CYWILIZACJE-do-MASTER_nazwy-klastrow-pole.md
- Pole dla MAPA: cywilizacje[i].nazwyKlastra (10 stringow, [0]=stolica). 9 typow x10, JSON OK, backup civs.json.bak-CYWILIZACJE.
- RYZYKO: civs.json generuje TYLKO export-data.py (zakazany) -> edycja bezposrednia NIE w xlsx -> ponowny eksport skasuje pole.
  Rekomendacja (moj lane): kolumna w Cywilizacje.xlsx + targeted export-civs.py. Czekam na zgode Macieja (pytanie w czacie).
- Wykonane subagentem Sonnet (tryb: chude okno + delegacja).

---
[2026-06-24 22:46] PYTANIE -> MASTER (Maciej przekierowal to pytanie do mastera):
Jak trwale generowac civs.json bez utraty nazwyKlastra? Opcje A/B/C w
_handoff/CYWILIZACJE-do-MASTER_nazwy-klastrow-pole.md. Rekomendacja A (targeted export-civs.py + kolumna w Cywilizacje.xlsx).

---
[2026-06-25 06:39] HANDOFF -> MASTER (dla EKONOMIA, decyzja 2a): prosba o tempo produkcji Nauki/ture (referencja do strojenia kosztow tech).
Plik: _handoff/CYWILIZACJE-do-MASTER_nauka-tempo-od-EKONOMIA.md. Bez tego koszty tech (1a: zostaja) nie maja punktu odniesienia.
STATUS PRAC (autonomicznie, subagentami Sonnet):
- pkt1 fix wartosc<->wartość: ZIELONY (harness ai-test.cjs).
- pkt2 trudnosc: AITurnOpts.poziomTrudnosci + loadDifficultyParams (zielony).
- pkt4 archetypy 7->9: Celtowie/Germanie w ai.ts + AI-parametry.xlsx (8 kluczy, 76 total) + export-ai-params; wartosci do korekty Macieja.
- pkt6 heurystyka nauki AI: chooseAIResearch (czysta funkcja; silnik wola w kroku §9.3) — research-test 33/0.
- export-civs.py + export-tech.py: targeted eksporty gotowe (civs.json i tech.json regenerowalne z xlsx, bez export-data.py).
ZOSTAJE BLOK: pkt3 (klaster ~9: format od MAPA) i pkt5 (budzet: kontrakt od EKONOMIA) — czekaja na mastera. Wpiecie ai/victory/barbarians = na Twoja decyzje (pytanie w _handoff/AI-do-MASTER_zaleznosci.md).

---
[2026-06-25 07:00] FALA DOMKNIEC + nowe dane (autonomicznie, subagenci Sonnet):
- Panel: 36 archetypow (9 nacji x4) sterowalne w AI-parametry.xlsx (opisy per wiersz + legenda w Eksport-README); wartosci NIEZMIENIONE (1A).
- 3b fallback ruchu w ai.ts: jednostki bez celu nie stoja przy krawedzi (ku miastu/srodkowi). Harness ai-test 69/0.
- 2b turniej (a)/(b): rekomendacja ZOSTAW OBA — start 50 (12/12), clamp 0..200 (11/12). Zero zmian kodu. Handoff: _handoff/CYWILIZACJE-do-MASTER_turniej-ab.md.
- 3a HANDOFF WPIECIA: _handoff/CYWILIZACJE-do-MASTER_ai-wpiecie.md — ai.ts/victory.ts/barbarians.ts + chooseAIResearch + loadDifficultyParams GOTOWE DO WPIECIA (API + instrukcja handlera tury + DoD; testy ai 69/0, research 33/0, barb 53/0). Czeka na Twoja decyzje o integracji.
- NOWE (dyrektywa 2026-06-25): mnoznikHandelPieniadz per cyw w civs.json (baza 2; do korekty Macieja). Durable: kolumna w Cywilizacje.xlsx + export-civs.py. Pole dla EKONOMIA: _handoff/CYWILIZACJE-do-MASTER_mnoznik-handel-pole.md.

---
[2026-06-25 07:05] WATEK 2a ROZWIAZANY: EKONOMIA odpowiedziala (_handoff/EKONOMIA-do-MASTER_tempo-nauki.md).
- Tempo nauki/ture: wczesna gra ~2-15 globalnie, srednia (3-5 miast + Biblioteki) ~15-60. Brak globalnego mnoznika tempa.
- MOJA DECYZJA: koszty tech (10-50) SPOJNE z tempem (Kamien 10-14 ~2-7 tur; Braz 18-26 ~4-13 tur; Waluta 50 = bramka). ZOSTAWIAM (1a) — bez zmian.
- DO DECYZJI MACIEJA (opcja, nie robie bez zgody): globalny mnoznik tempa nauki dla trudnosci (EKONOMIA proponuje 'nauka_tempo_mnoznik' w econ-params + hook w turn-economy).

---
[2026-06-25 07:15] HANDOFF -> MASTER (rozdaj do MIASTO + EKONOMIA): model "nauka/ekonomia miasta" (suwak podzialu outputu miasta + magazyn nauki + wydawanie na tech).
Plik: _handoff/CYWILIZACJE-do-MASTER_model-nauki-dla-MIASTO.md. Granice: MIASTO=mechanika per-miasto+magazyn; EKONOMIA=agregacja globalna; JA=tylko koszty tech (tech.json) + AI-wybor (chooseAIResearch).
OPEN dla Macieja: magazyn nauki = wspolna PULA vs postep-pod-wybrana-tech (obecnie research.ts=postep). Dotyczy MIASTO + research.ts.

---
[2026-06-25 07:20] DECYZJA MACIEJA: nauka = WSPOLNA PULA (zbierasz punkty -> wydajesz na dowolna tech spelniajaca prereqi).
Zaktualizowany handoff: _handoff/CYWILIZACJE-do-MASTER_model-nauki-dla-MIASTO.md. Skutki: research.ts (postep->pula+kup), MIASTO (UI magazynu+zakup).
MOJA CZESC: chooseAIResearch KOMPATYBILNY bez zmian (zwraca cel; silnik kupuje gdy pula>=koszt); tech.json koszty bez zmian. Do rozdania przez mastera: MIASTO + wlasciciel research.ts.

---
[2026-06-25 07:30] STATUS DLA MASTERA (na prosbe Macieja). Przyjeto korekte 135-136 (nauka w MIASTO; czekam na REFERENCJE tempa; kosztow tech nie zmieniam=1a; drzewko moje).

A) ZROBIONE (moje, testy zielone, NIEwpiete):
- Dyplomacja: model 90/0, panel params + export-diplomacy.py, docs, hub; turniej (a)/(b)=ZOSTAW (start 50, clamp 0..200).
- AI: pkt1 fix wartosc (ai-test 69/0), pkt2 trudnosc (loadDifficultyParams), pkt4 archetypy 7->9 (Celtowie/Germanie), pkt6 chooseAIResearch (research-test 33/0), fallback ruchu (jednostki bez celu nie stoja).
- Dane: nazwyKlastra (civs.json), export-civs.py + export-tech.py (regenerowalne bez export-data.py), mnoznikHandelPieniadz per cyw, panel archetypow uczytelniony (sterowalny przez Macieja).
- Handoffy zlozone: _handoff/CYWILIZACJE-do-MASTER_ai-wpiecie.md, _model-nauki-dla-MIASTO.md (decyzja: PULA), _mnoznik-handel-pole.md (EKONOMIA), _turniej-ab.md.

B) ZOSTALO MI (w lane, ZABLOKOWANE na innych dzialach):
- pkt3 ekspansja klastrowa (~9 typu): czeka na format startowego rozmieszczenia od MAPA.
- pkt5 kontrola budzetu produkcji AI (koszt vs skarbiec): czeka na kontrakt od EKONOMIA.
- koszty tech: czekam na REFERENCJE tempa nauki (Twoja zapowiedz 135-136); do tego 1a (bez zmian).
- barbarzyncy_* w panelu (drobne/addytywne; teraz FALLBACK).

C) DECYZJE/AKCJE OD MASTERA (czekam):
1. WPIECIE modulow AI do petli tury (ai-wpiecie.md = API + handler tury + DoD gotowe) — kiedy integrujemy.
2. Rozdanie modelu nauki (PULA): MIASTO (mechanika per-miasto + magazyn) + wlasciciel research.ts (postep->pula+kup).
3. REFERENCJA tempa nauki (zapowiedziana) -> potem ew. strojenie kosztow.
4. Routing: pkt3->MAPA, pkt5->EKONOMIA; mnoznikHandelPieniadz->EKONOMIA (mechanika, gated Waluta+Mennica).

D) DECYZJE OD MACIEJA (opcjonalne/korekty, NIE blokuja):
- Korekta proponowanych liczb: mnozniki Handel->Pieniadz (1.7-2.4), bonusy trudnosci (0/0.1/0.25). Archetypy juz 1A-przyjete.
- Czy dodac globalny mnoznik tempa nauki dla trudnosci (opcja od EKONOMII).

PODSUMOWANIE: wszystko niezablokowane = zrobione i przetestowane. Glowne hamulce: (1) decyzja o wpieciu, (2) referencja tempa + kontrakty MAPA(pkt3)/EKONOMIA(pkt5).

---
[2026-06-25 07:45] ODPOWIEDZ DLA UI (Dyplomacja + civs.json) -> _handoff/CYWILIZACJE-do-MASTER_odp-UI-dyplomacja-civs.md.
- Skala 5 tierow OFICJALNA: Wojna=STAN / Wrogi<30 / Neutralny<60 (start 50) / Przyjazny<120 / Sojusz>=120 lub traktat.
- Mapuje SILNIK: dodalem kanoniczny relationTier(rel)->0..4 + TIER_NAMES w diplomacy.ts (diplomacy-test 98/0). UI dostaje GOTOWY tier z getRelations() (funkcja silnika), NIE czyta diplomacy.json dla tieru.
- Panel v0.1 = PODGLAD (akcje wojna/pakt PO wpieciu modelu). civs.json kompletne dla UI (klucze: "Cywilizacja","Styl / charakter","Jednostka specjalna","Bonus startowy" + Religia/nazwyKlastra/mnoznikHandelPieniadz).
- DO DECYZJI: (Q4) panel v0.1 podglad-only? (Q5) emblematy/ikony: dodac pole "ikonaId" w civs.json czy UI mapuje po nazwie? Assety = UI/RENDER.

---
[2026-06-25 12:04] SESJA AUTONOMICZNA (polecenie Macieja: dzialaj sam ~1-2h). ZROBIONE (subagenci Sonnet, testy zielone):
- Q5 ROZSTRZYGNIETE: ikonaId per cyw w civs.json (+ kolumna w Cywilizacje.xlsx + export-civs.py). Wartosc = lowercase nazwa (grecy, rzymianie, ...). UI mapuje ikone po ikonaId.
- ai.ts: OPCJONALNE canAfford (pkt5 budzet) + clusterCenter/clusterRadius (pkt3 klaster) — domyslnie BEZ zmian zachowania; ai-test 88/0. Gotowe do podpiecia gdy EKONOMIA/MAPA dadza dane.
- diplomacy.ts: relationTier()->0..4 + TIER_NAMES (5-tier dla UI/getRelations); diplomacy-test 98/0.
- Dokumentacja: Civ-CYWILIZACJE/DOKUMENTACJA-DEV-CYWILIZACJE.md (skonsolidowany dev doc calego lane: dane+dyplomacja+AI).
- Handoff wpięcia (ai-wpiecie.md) zaktualizowany o nowe opty (canAfford/clusterCenter).
- Odpowiedzi dla UI (5 pytan) dostarczone (odp-UI-dyplomacja-civs.md).

FLAGA SPOJNOSCI (do mastera, NIE robie sam — ripple cross-lane):
  enum TypCywilizacji (src/types/player.ts) = 7 typow + DrobnaCywilizacja -> BRAK Celtowie/Germanie, mimo ze sa w civs.json / ai-params / CIV_TO_ARCH. Tabele Record<TypCywilizacji> (m.in. diplomacy.ts ARCHETYPE_AGGRESSION/TRADE) sa pelne dla 7, ale Celtow/Germanow nie roznicuja (fallback 0.40). Dodanie do enuma = zmiana WSPOLNYCH typow -> tsc-ripple w innych modulach -> koordynacja mastera.

TESTY (ta sesja, zielone): diplomacy 98/0, ai 88/0, research 33/0, barbarians 53/0.
STAN: wszystko niezablokowane w moim lane = domkniete. Hamulce (czekaja): pkt3 (MAPA klastry), pkt5 (EKONOMIA budzet), referencja tempa nauki, wpiecie modulow (master).

---
[2026-06-25 12:20] WNIOSKI+DECYZJE (dyplomacja/AI/cyw) + START solo-buildow. Pelny dok: Civ-CYWILIZACJE/PROPOZYCJA-dyplomacja-AI-v0.1.md. Handoff: _handoff/CYWILIZACJE-do-MASTER_decyzje-dyplomacja-AI.md.
TURNIEJE/REKOMENDACJE: T1 Respekt=A (computeRespekt+silnik agreguje), T2 zakres v0.1=C (rdzen dyplomacji AI: wojna/pokoj/trybut), T3 bonusy=A (schemat strukturalny), T4 trudnosc=C (bonusy v0.1, spryt v0.2). Decyzje 1ABC..4ABC -> Maciej (sekcja 5 dok).
FLAGI: zerwanie handlu (-15 Rel szablon vs brak eventu -> dodaje zerwanie_handlu -10 Z); enum TypCywilizacji 7 vs 9 (cross-lane); Typ glowny martwy.
BUILDY START (na polecenie Macieja, wg rekomendacji; czyste/NIEwpiete): diplomacy.ts computeRespekt+tickDiplomacy+zerwanie_handlu; potem ai.ts decideAIDiplomacy+swiadomosc szans; civs.json schemat bonusow.

---
[2026-06-25 12:35] ODP na PILNE (koszty/subagenci): **TAK-subagenci-Sonnet**. Cala ciezka robota (kod/build/testy/dane) idzie przez Agent model:sonnet; glowne okno = brief+odbior+handoff (chude).

---
[2026-06-25 13:00] BUILDY DONE (solo, subagenci Sonnet, testy ZIELONE; czyste/NIEwpiete). Pelne API+wpiecie: **_handoff/CYWILIZACJE-do-MASTER_diplo-ai-api.md**.
- diplomacy.ts: computeRespekt (T1=A, domyka Respekt) + tickDiplomacy (tura dyplomacji) + event zerwanie_handlu. diplomacy-test **119/0**.
- ai.ts: decideAIReaction (fight/flee, decyzja 2) + decideAIReinforcements (posilki <=1 heks) + decideAIDiplomacy (T2=C: wojna/pokoj/trybut). ai-test **132/0**.
- civs.json: mnoznikHandelPieniadz per-cyw 1.7-2.4 + bonusy[] strukturalne (T3=A, 27 efektow z polem "realizuje" -> walka/miasto/ekonomia). export-civs.py chroni pola. JSON OK.
- tech.json: Koszt nauki dostrojony wg referencji tempa (PROPOZYCJA do akceptacji Macieja; gate Bronz=45/Waluta=100; monotonicznosc OK).
DECYZJE Macieja: T1-T4 ABC (PROPOZYCJA-dyplomacja-AI-v0.1.md §5) + 4 pytania balansu kosztow tech. Wpiecie = master (API w handoffie).

---
[2026-06-25 13:40] FALA A+B DONE (solo, subagenci Sonnet; testy ZIELONE: diplomacy 133/0, ai 175/0). Handoff: _handoff/CYWILIZACJE-do-MASTER_waveAB-done.md.
- A (master polecil): enum TypCywilizacji wyrownany do 9 (+Celtowie/Germanie) + ARCHETYPE_* + usuniety "Typ glowny" + AiParamDef fix (TS7053). RIPPLE UI: src/ui/newGameFlow.ts czyta typGlowny -> master niech sprzatnie (poza moim lane, UI pomija bezpiecznie).
- B (decyzje Macieja): T2=A PELNA dyplomacja AI (+sojusz +handel); T4=B spryt od trudnosci (agresjaMnoznik/dyplomacjaAktywnosc/celObranie); pkt5 budzet w chooseCityProduction (canAfford+itemCost; kontrakt EKONOMIA-do-CYWILIZACJE_budzet-AI.md, pkt5 ODBLOKOWANY).
- Respekt (decyzja 1): SPEC-Respekt.md + computePotegaNacji/computeRespekt (ratio-share, 50=parytet; slaby ulega nie atakuje) — wzor DO AKCEPTACJI Macieja (4 pkt w SPEC).

---
[2026-06-25 14:00] RESPEKT ZATWIERDZONY przez Macieja (komponenty + wagi 28/20/18/14/12/8 + formula ratio-share). Wzor ZABLOKOWANY do wpiecia; wagi sterowalne w panelu (punkt startowy). computePotegaNacji + computeRespekt gotowe w diplomacy.ts. Master: przy wpieciu silnik liczy potege per nacja (komponenty z UNITS/MIASTO/EKONOMIA) -> Relation.respekt = computeRespekt(potSelf,potPartner). Status w SPEC-Respekt.md = ZATWIERDZONE.

---
[2026-06-25 14:20] KOSZTY TECH FINALNE + TEMPO GRY (decyzje Macieja, temat zamkniety). Handoff: _handoff/CYWILIZACJE-do-MASTER_tempo-gry.md.
- 1a baza zostaje; 4b+zasada: koszty NARASTAJA progresywnie w kazdej epoce (monotonicznie), bramki na szczycie (Bronzownictwo 45/Waluta 100/Sztuka wojenna 200); Jezdziectwo(56)>Pismo/Religia (3b); Q2 zniknelo.
- NOWE tempo_gry: mnoznik kosztu badan przy starcie (szybka ×0.2 / standard ×1 / dluga ×5). Helper gra/src/game/tech-tempo.ts applyTempoKoszt (test 9/9). DLA UI (wybor na ekranie nowej gry) + SILNIK (applyTempoKoszt do kosztu tech). tech.json baza niezmieniona.

---
[2026-06-25 15:00] MACIEJ ZATWIERDZIL T1=A + T3=A. Wszystkie T1-T4 ZAMKNIETE: T1=A (Respekt ratio-share), T2=A (pelna dyplomacja AI), T3=A (bonusy strukturalne), T4=B (spryt od trudnosci). T3=A: schemat bonusy[] (dane=CYWILIZACJE) gotowy; MECHANIZACJA efektow per dzial -> handoff _handoff/CYWILIZACJE-do-MASTER_bonusy-mechanizacja.md.
ts (l.362/2610/2704: c.typCywilizacji ?? c.ikonaId) -> lane MASTER.
- pkt3 ODBLOKOWANY+ZROBIONY: ai.ts ekspansja klastrowa wg ClusterPlacement (MAPA); ai-test 188/0. Wpiecie: decideAITurn(..., {clusterCenter:tc.centrum, clusterRadius:placement.minDystans*2}).
- Zelazo w v0.1 (decyzja 1A): bez blokera, tech.json Zelazo zostaje.
