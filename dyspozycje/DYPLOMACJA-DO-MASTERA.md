# DYPLOMACJA -> MASTER : pytania i raporty
ZASADA: kazde pytanie/raport pisz DWA razy -- (1) tu na DOLE (krotko, z godzina) ORAZ (2) to samo w CZACIE do uzytkownika.
Odpowiedzi czytaj w dyspozycje/DYPLOMACJA.md.

---
[2026-06-22 20:57] GOTOWY, czekam na "start". Porzadki/orientacja zrobione:
- Przeczytane: DYSPOZYCJE-SESJI.md, DYPLOMACJA.md, ten kanal.
- Moj lane sprawdzony: src/game/diplomacy.ts (612 lin., pelny model Relacja=Zaufanie+Respekt,
  applyDiplomaticEvent, aiDiplomacyStance, initialRelation, toRelation). Kompiluje sie wzgledem
  src/types/diplomacy.ts + src/types/player.ts (oba istnieja). NIEWPIETY (brak importow poza modulem
  -- wpiecie nalezy do SILNIK, zgodnie z brief).
- Pliki danych/panel: data/diplomacy.json (21,9 KB), Dyplomacja.xlsx, Dyplomacja-szablon.md -- obecne.
- NIE rusza: nic poza lane. Nie buduje. Nie publikuje kanonu.
PYTANIE: po "start" -- robie pkt 1 (utrzymanie/dopracowanie modelu) czy najpierw pkt 3
  (spisanie spojnych zasad dyplomacji vs PROJEKT-GRY-master)? Czekam.

---
[2026-06-22 22:18] RAPORT pkt 1 (model dyplomacji) -- ZROBIONE.
CO ZMIENIONE:
- src/game/diplomacy.ts: +6 zdarzen spec-wiernych z Dyplomacja-szablon.md sekcja 1 (additive, nic
  nie psuje): wojna_casus_belli (-10 Z), ultimatum_spelnione (-5 Z), ultimatum_bezpodstawne
  (-10 Z, -10 R), trybut_odmowa (-10 Z), trybut_oferta_przyjeta (+5 Z), wymiana_tech_gratis (+5 Z).
  Wartosci = literaly inline z odnosnikiem do paragrafu; DIPLOMACY_PARAMS NIETKNIETY (pozostaje
  lustrem diplomacy.json).
- NOWY test tools/diplomacy-test.cjs (wzor barbarians-test.cjs; esbuild bundle + asercje).
WYNIKI:
- test: 78 asercji, 78 pass / 0 fail (relationScore, kazde zdarzenie + znak + clamp + immutability,
  override params, initialRelation, aiDiplomacyStance sciezka drobnych i glownych + progi
  wojna/pokoj/handel/sojusz, toRelation wszystkie galezie).
- tsc: 0 bledow (izolowany, strict wg tsconfig: strict + noUncheckedIndexedAccess +
  verbatimModuleSyntax). esbuild: OK. NO DOM / NO THREE -- modul czysty i NIEWPIETY.
WERDYKT SPOJNOSCI ts<->json<->szablon: zgodne na progach C (60/70/70/90/30/120), mnoznikach E,
  deltach co-ture D, jednorazowych 3.3 i wartosciach startowych (Z20/R30).
DO DECYZJI MASTERA (2 rozjazdy w DANYCH/SPECU -- NIE w kodzie):
  (a) diplomacy.json parametry_relacji: "Relacja ogolna start = 60", ale model wylicza
      Zaufanie(20)+Respekt(30)=50 (per-para: ten sam typ 30, rozny glowny 45, vs drobna 50).
      Propozycja: poprawic wyswietlana wartosc w Dyplomacja.xlsx/diplomacy.json na 50 (pkt 2).
  (b) Spec wewnetrznie sprzeczny: 3.1 mowi Relacja 0..200 (clamp >=0), ale 5.2 uzywa progow
      UJEMNYCH (Relacja < -40 / < -60) dla wojny/pokoju drobnych. Przy clampie 0..200 galaz
      "drobni -> wojna gdy score < -40" jest nieosiagalna. Kod zostawilem wierny 3.1; decyzja:
      albo osobny clamp ujemny dla drobnych, albo wojne drobnych pchac z silnika. Czekam.
LANE/ZASADY: nie ruszalem main.ts, nie publikowalem kanonu, nie ruszalem cudzych plikow. Wpiecie
  diplomacy.ts do petli tury + panel = SILNIK (jego pkt 5) + UI.
UWAGA SANDBOX (potwierdza "TRWALY CURE" z DYSPOZYCJE): edycja plikow w folderze Civ dehydratuje je
  w piaskownicy (Read=calosc, bash=uciety plik; rm tez "not permitted"). Build/tsc zrobilem na
  swiezej kopii; pliki na dysku POPRAWNE. Warto raz ustawic folder Civ na "Always keep on this device".
PLIKI TYMCZASOWE (mozna skasowac): tools/.dip-run.cjs, .dip-entry.ts, .dip-bundle.cjs
  (regenerowane przy kazdym uruchomieniu testu, jak .barb-*).
ZOSTAJE: pkt 2 (Dyplomacja.xlsx -> targeted export diplomacy.json; w tym fix startu 50) + pkt 3
  (jeden spojny dokument zasad dyplomacji). Czekam na "dalej" + werdykt (a)/(b).

---
[2026-06-23 06:18] AUTONOMICZNIE (polecenie Maciej: "przyjmij zalozenia i dzialaj sam") -- ZROBIONE (a),(b),pkt3,czesc pkt2.
PRZYJETE ZALOZENIA:
- (a) Start Relacji = 50 (=Zaufanie 20 + Respekt 30), nie 60. Poprawione w diplomacy.json
  (parametry_relacji + nowy blok params) ORAZ Dyplomacja.xlsx (Parametry relacji!C3=50). Progi "Zaufanie>=60" nietkniete.
- (b) §3.1 (Relacja 0..200) ma pierwszenstwo nad §5.2 (progi ujemne). progPoboczneWojna -40 -> 15
  (remap na skale 0..200; martwa galaz naprawiona). Trigger "gracz atakuje" zostaje po stronie silnika.
ZMIANY:
- diplomacy.ts: progPoboczneWojna=15; nowy typ DiplomacyParams; nowa czysta loadDiplomacyParams(json)
  (czyta json.params -> Partial override = most panel->model); applyDiplomaticEvent bierze Partial<DiplomacyParams>.
- diplomacy.json: dodany plaski blok "params" (klucze = parametry modelu; kontrakt dla kodu) + start 50.
- Dyplomacja.xlsx: C3 60->50 (brak wykresow/obrazow -> zapis openpyxl bezpieczny; reszta panelu nietknieta).
- tools/diplomacy-test.cjs: +testy loadera +osiagalna galaz wojny drobnych.
- NOWY Dyplomacja-zasady.md (pkt 3): jedno miejsce prawdy (model, parametry, zdarzenia, AI, dostepnosc
  akcji, zalozenia (a)(b), kontrakt wpiecia dla SILNIK/UI).
WYNIKI: test 90/90 pass; tsc=0 (izolowany strict); esbuild OK. Modul czysty (no DOM/THREE), NIEWPIETY.
ZOSTAJE: pelny eksport xlsx->json (blok params na teraz uzupelniony recznie, zgodny z modelem);
  wpiecie do petli tury (SILNIK) + panel dyplomacji (UI).
SMIECI DO RECZNEGO SKASOWANIA (bash na mougncie Civ NIE kasuje -- "Operation not permitted"):
  gra/tools/.dip-run.cjs, .dip-run2.cjs, .dip-entry.ts, .dip-entry2.ts, .dip-bundle.cjs, .dip-bundle2.cjs
  oraz Civ/.____wprobe (pusty, z proby zapisu). Sa to artefakty pomocnicze, nie wplywaja na gre.
DECYZJA DLA MASTERA: zaakceptowac (a) i (b)? Jesli nie -- latwy revert (wartosci w params/diplomacy.ts).

---
[2026-06-23 06:46] DOKUMENTACJA DEV + PANEL PARAMETROW (rola: architekt).
POWSTALO:
- Dyplomacja-DOKUMENTACJA-DEV.md (Civ root) -- pelna dokumentacja: mapa plikow, architektura +
  przeplyw danych (xlsx->json->loader->model), model danych, API (6 funkcji), 38 parametrow (referencja),
  reguly (zdarzenia/AI/dostepnosc akcji), zalozenia (a)(b), zaleznosci, testy, pulapki sandbox,
  INTERAKCJE z dzialami zmapowane na realne sesje (Master/EKONOMIA/Dane Cywilizacji/Units-Battle/MAPA/
  Silnik/UI/MIASTO/AI), kontrakty miedzymodulowe, TODO/handoff.
- Dyplomacja.xlsx: nowy arkusz "params" (38 parametrow; kolumna B zolta = edytowalna) = maszynowy panel.
- gra/tools/export-diplomacy.py: targeted eksport xlsx[params] -> diplomacy.json[params] (NIE rusza
  innych JSON-ow; --dry-run odczytuje 38 parametrow OK).
PRZEPLYW STROJENIA (bez kodu): edytuj Dyplomacja.xlsx[params] -> python3 tools/export-diplomacy.py
  -> json.params -> loadDiplomacyParams() -> model.
USTALENIE DLA MASTERA: Respekt to WEJSCIE do dyplomacji (liczy militaria/Power: wojsko+bitwy [Units/
  Battle], miasta [MIASTO], gospodarka [EKONOMIA], epoka). Wagi "Respekt-czynniki" dotykaja 3 dzialow
  -> uzgodnic, by nie liczyc tego samego 2x. Religia + typ z Dane Cywilizacji (civs.json). SILNIK = integrator.
SMIECI (do recznego skasowania -- bash nie kasuje na OneDrive): gra/tools/.dip-run.cjs, .dip-run2.cjs,
  .dip-entry.ts, .dip-entry2.ts, .dip-bundle.cjs, .dip-bundle2.cjs oraz Civ/.____wprobe (pusty).

---
[2026-06-24 07:56] REORGANIZACJA -- hub dzialu "Civ/Dyplomacja/".
ZROBIONE: utworzony katalog Civ/Dyplomacja/ (hub) + README.md; PRZENIESIONE (mv, daty zachowane) pliki
  NIE-gry z roota: Dyplomacja-szablon.md, Dyplomacja-zasady.md, Dyplomacja-DOKUMENTACJA-DEV.md, Dyplomacja.xlsx.
  Root Civ jest juz czysty z plikow dyplomacji (dokumentacja/panel).
ZOSTAJA (pliki GRY / kanal -- NIE przenoszone): gra/src/game/diplomacy.ts, gra/src/types/diplomacy.ts,
  gra/data/diplomacy.json, gra/tools/diplomacy-test.cjs, gra/tools/export-diplomacy.py;
  dyspozycje/DYPLOMACJA.md + DYPLOMACJA-DO-MASTERA.md (konwencja wspolna sesji).
SCIEZKI: export-diplomacy.py czyta xlsx z huba (z fallbackiem do root) -- zweryfikowane dry-run (38 param OK).
  DEV doc ma note o lokalizacji huba. Inne dokumenty (ARCHITEKTURA-PLIKI itd.) odwoluja sie po NAZWIE pliku
  (nie sciezce) -- jesli prowadzisz indeks sciezek, zaktualizuj na Civ/Dyplomacja/.
HISTORYCZNE: przejrzane cale drzewo Civ. BRAK osobnych historycznych plikow dyplomacji do archiwum.
  _backup/gra_*/.../diplomacy.ts = pelne snapshoty calego gra/ (proces backupu, nie dzial) -> nietkniete.
  archiwum/ -- bez plikow dyplomacji.
DO RECZNEGO SKASOWANIA (rm zablokowany w piaskownicy; mv/mkdir dzialaja) -- PowerShell lokalnie:
  Remove-Item -LiteralPath "...\Civ\gra\tools\.dip-run.cjs","...\.dip-run2.cjs","...\.dip-entry.ts","...\.dip-entry2.ts","...\.dip-bundle.cjs","...\.dip-bundle2.cjs" -Force
  Remove-Item -LiteralPath "...\Civ\.____dirprobe" -Recurse -Force
