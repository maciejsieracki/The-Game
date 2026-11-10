STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UNIT-REPLACE-PROMOTION-TABLE-INFANTRY-Q1
GOAL: Wąska tabela awansów piechoty między typami przez „Zastąp specjalnie” (units.json, tylko dane + test), zgodnie z dispatchem (ABC D3 wariant B). Awans wyłącznie do jednostki wyższej epoki lub tej samej epoki o wyższej klasie (Standardowa < Specjalna < Super), dostępnej dla nacji. Luki Zwiadowca/Galera/Procarz pozostają bez zmian.
BAZA: origin/main = 7b201afcd (po deployu ARMY-PANEL-SELECTS-GENERAL). Brak DODATKU w dispatchu.
ZMIANY/COMMIT: gra/data/units.json (21 wierszy pola „Zastąp specjalnie”; reszta pliku bez zmian), nowy gra/tools/unit-replace-promotion-table-test.cjs, dyspozycje/autobot/runs/R-WEB-UNIT-REPLACE-PROMOTION-TABLE-INFANTRY-Q1/01-operator-r1.md. Kod silnika (gra/src/game/*replace*.ts, unitReplacePicker.ts) NIE zmieniany: odczyt pola już istnieje (availableReplacementsFor, część B; main.ts upgradeAiUnitsForEra). Commit: SHA w sekcji „SHA” na końcu.
TESTY:
- node tools/unit-replace-promotion-table-test.cjs -> PASS: 23 wpisy źródłowe, 53 krawędzie, brak cykli, brak nieistniejących celów, brak różnic nacji, wszystkie cele wyższe (epoka/klasa), typy tylko piechota, Zwiadowca/Galera/Procarz bez wpisu, zachowane wpisy Wojownik mykeński->Hieros Lochos i Wojownik tyrreński->Evocati.
- node tools/unit-replace-test.cjs -> 15/15 zielone.
- node tools/unit-replace-full-cost-test.cjs -> 40 passed, 0 failed.
- node tools/unit-replace-army-multi-select-test.cjs -> 36/36 zielone (Chromium/live panel: NIE_ZMIERZONO).
- node tools/ai-era-unit-promotion-test.cjs -> 17 passed, 0 failed.
- node tools/ai-unit-replace-same-rules-test.cjs -> 41 passed, 0 failed.
- Do uruchomienia testów przez tymczasowy link gra/node_modules -> esbuild@0.28.2 (poza repo, link usunięty przed commitem). npm run build / dev NIE uruchamiane.
- git diff --check: czysto.
BLOKADY: brak blokad technicznych. Konflikt w dispatchu (patrz ZAŁOŻENIA 1) rozstrzygnięty założeniem. Dysk ~3,3 GB wolne przed startem (poniżej progu 4 GB dla web) — tematu nie rozszerzano o build.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) + Final Control; akceptacja właściciela tabeli z sekcji TABELA poniżej (przed deployem).
DEPLOY/PUSH: NIE WYKONANO

## ZAŁOŻENIA (luki rozstrzygnięte w dokumencie)
1. Konflikt rule vs przykład: dispatch podaje „Wojownik z mieczem i tarczą -> Włócznik/odpowiednik narodowy”, ale Włócznik jest Brąz/Standardowa, czyli tej samej epoki i klasy co źródło (Wojownik z mieczem i tarczą = Brąz/Standardowa) — to NIE jest awans wg reguły. Przyjęto regułę (wyższa epoka lub wyższa klasa): Wojownik z mieczem i tarczą -> wyłącznie cele Żelazo/Specjalna (narodowe) oraz Brąz/Super. Włócznik nie został dodany.
2. Generyczne źródła (bez nacji: Wojownik, Włócznik, Wojownik z mieczem i tarczą) mają listy celów z wielu nacji; gating nacji robi availableReplacementsFor (gracz widzi tylko cele swojej nacji). Dzięki temu jedna wartość pola obsługuje wszystkie 16 nacji.
3. Super-jednostki (Hieros, Evocati, Wojownik germański, Królewska Gwardia itd.) traktowane jako cele; jako źródła nie mają awansów (najwyższa klasa). Gate „Super-jednostka” (jedna żywa sztuka) działa bez zmian.
4. Wpisy istniejące (Wojownik mykeński, Wojownik tyrreński) zachowane bez zmian.
5. Wpisy wskazujące wyłącznie tę samą epokę i klasę nie zostały dodane (np. Gaesatae -> Miecznik galijski).

## TABELA „z -> na” (do akceptacji właściciela)
Generyczne:
- Wojownik (Kamień, Standardowa) -> Włócznik (Brąz, Standardowa)
- Włócznik (Brąz, Standardowa) -> Falanga (Grecja) / Triari (Rzym) / Thorakites (Grecja) / iButho z iklwa (Zulu) / Mur tarcz (Sargonid, Sumer) / Hu Ben Wei (Chiny) / uThulwana (Zulu) / Królewska Gwardia (Inkowie) / Medżaj (Egipt) / Gwardia Królewska Sumeru
- Wojownik z mieczem i tarczą (Brąz, Standardowa) -> Hastati (Rzym) / Gaesatae (Celtowie) / Soldurii (Celtowie) / Miecznik galijski (Celtowie) / Berserker germański (Germanie) / Drużynnik (Słowianie) / Garnizon Harappy (Harappa) / Gwardia hetycka (Hetyci) / Piechota neobabilońska (Babilonia) / Tyrski miecznik (Fenicjanie) / Gwardia Tyreńska (Fenicjanie) / Wojownik z żelaznym khopesh (Egipt) / Hu Ben Wei / uThulwana / Królewska Gwardia / Medżaj / Gwardia Królewska Sumeru
Narodowe:
- Wojownik mykeński (Grecja) -> Hieros Lochos (istniejący wpis, bez zmian)
- Wojownik tyrreński (Rzym, Offensive) -> Evocati (istniejący wpis, bez zmian)
- Wojownik z maczugą (Chaska) (Inkowie, Kamień) -> Wojownik z toporem / Gwardzista z champi
- Wojownik z toporem (Inkowie) -> Królewska Gwardia
- Gwardzista z champi (Inkowie) -> Królewska Gwardia
- Impi (Zulu) -> iButho z iklwa / uThulwana (Białe Tarcze)
- Wojownik z khopesh (Egipt) -> Wojownik z żelaznym khopesh / Medżaj (Gwardia Faraona)
- Włócznik sumeryjski (Sumer) -> Mur tarcz (Sargonid) / Gwardia Królewska Sumeru
- Gwardia Ishtar (Babilonia) -> Piechota neobabilońska
- Wojownik babiloński (Babilonia) -> Piechota neobabilońska
- Wojownik fenicki (Fenicjanie) -> Tyrski miecznik / Gwardia Tyreńska
- Strażnik bram Harappy (Harappa) -> Garnizon Harappy
- Piechota induska (Harappa) -> Garnizon Harappy
- Piechota hetycka (Hetyci) -> Gwardia hetycka
- Halabardnik Shang (Chiny) -> Hu Ben Wei (Gwardia Tygrysa)
- Falanga (Grecja) -> Hieros Lochos
- Thorakites (Grecja) -> Hieros Lochos
- Hastati (Rzym) -> Evocati
- Triari (Rzym) -> Evocati
- Berserker germański (Germanie) -> Wojownik germański

## LUKI (świadomie bez zamiennika, do decyzji właściciela)
- Brak celu wyższego w danej nacji (brak jednostki Żelazo/Specjalna ani Brąz/Super wyższej klasy): Wojownik Sherden (Ludy Morza), Wojownik szekelesz (Ludy Morza), Gaesatae, Soldurii, Miecznik galijski, Drużynnik (Słowianie), Garnizon Harappy, Gwardia hetycka, Piechota neobabilońska, Tyrski miecznik, Gwardia Tyreńska, Wojownik z żelaznym khopesh, Mur tarcz (Sargonid), iButho z iklwa.
- Super-jednostki (Hieros, Evocati, Wojownik germański, Królewska Gwardia, Medżaj, Gwardia Królewska Sumeru, Hu Ben Wei, uThulwana) nie mają awansów — najwyższa klasa.
- Wojownik z mieczem i tarczą -> Włócznik: odrzucone (patrz ZAŁOŻENIA 1).

## WPŁYW NA AI (ai-era-unit-promotion, upgradeAiUnitsForEra)
- AI najpierw bierze same-Typ kandydata (newestAvailableSameTypeUnit); tabela działa jako fallback tylko gdy brak same-Typ kandydata i cel ma epokę wyższą niż źródło (filtr epoka > oldEpoch w main.ts). Zmiana więc:
  - Włócznik (Brąz) bez same-Typ kandydata dla nacji dostanie awans Żelazo (Falanga/Triari/Thorakites/...), a nie Brąz Super (ten sam epoch -> odrzucony przez filtr AI).
  - Wojownik z mieczem i tarczą: fallback do Żelaza narodowego, gdy brak same-Typ kandydata.
- Rekomendacja: przy akceptacji tabeli uruchomić ręczny przegląd AI (ai-era-unit-promotion-test zielony; brak testu symulacji całej partii).

## SHA
(uzupełnione w commicie — patrz git log gałęzi tematu)
