STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-COSTS-ERA-RESOURCES-IMPL-Q1
GOAL: Spójna zmiana kosztów budowy budynków wg decyzji właściciela z 2026-11-09 (Garncarstwo na poziom 1; Kamień: drewno = kamień dla tech poz. 2-3; Brąz: drewno = kamień = cegła; Żelazo: cegła = kamień = drewno) + diagnoza utrzymania surowcowego.
ZMIANY/COMMIT: patrz sekcja „SHA” na końcu (commit w gałęzi worktree, BAZA = origin/main 8718bbd26, brak push)

## 1. Zmiany (allowlista)
- `gra/data/tech.json` — Garncarstwo: `Poziom` 2 → 1 (jedyna zmiana; prereq „—”, brak cyklu).
- `gra/data/buildings.json` — `koszt_surowce` 32 budynków zmienione wg tabeli (lista w sekcji 3); Kuźnia brązu, Koszary, Pałac II i Cegielnia bez zmian wartości (zgodnie z ZAŁOŻENIEM: drewno = kamień, bez cegły).
- `dyspozycje/SPEC-KOSZTY-SUROWCOWE-BUDYNKOW.md` — ANEKS 2026-11-09.
- Testy: `gra/tools/koszty-surowcowe-test.cjs` (sekcje A–C przepisane; Baszta), `gra/tools/building-cost-resource-availability-test.cjs` (NOWY — bramka „surowiec nie wcześniej niż dostępny”), oraz dostosowanie asercji przypiętych do starych kosztów: `emporion-building-test`, `emporion-build-list-real-render-test` (zapas cegły w scenariuszu), `granary2-tech-data-guard-test`, `budynki-koszt-pracy-50-test` (fingerprint sha256 koszt_surowce), `unit-epoch-cost-test`, `ekonomia-5x-inwariant-test` (wielka_odlewnia.drewno 60 → 70).
- NIE zmieniono żadnego pliku w `gra/src/**`. Nie dotknięto WERSJE.md, gra-robocza/, nie robiono build/dev, push ani deploy.

## 2. ZAŁOŻENIA (do potwierdzenia przez właściciela)
1. Budynki Brązu, które mogą stanąć przed Cegielnią (Kuźnia brązu, Odlewnia brązu, Port handlowy, Koszary, Pałac II) i sama Cegielnia: drewno = kamień (= dzisiejszy kamień), bez cegły.
2. Emporion (Brąz, Handel) nie było w tabeli projektu, a jest „10. budynkiem po Cegielni”: potraktowany regułą Brązu → 60/60/60 (było drewno 80 / kamień 60). Drewno SPADA 80 → 60.
3. Żelazo: Baszta, Cytadela (fort), Port wielki, Warsztat oblężniczy — cegła = dzisiejszy kamień (100/100/100, 100/100/100, 50/50/50, 50/50/50).
4. Reguła „drewno = kamień = dzisiejszy kamień” OBNIŻA drewno tam, gdzie kamienia było mniej: Port handlowy 60 → 30, Magazyn 50 → 30, Emporion 80 → 60, Port wielki 60 → 50. Zgodne z tabelą projektu, ale warto potwierdzić, że obniżka drewna jest zamierzona.

## 3. Zmienione koszty (JSON, przed efektywnym ×2 × mnożnik epoki; d=drewno, k=kamień, c=cegła)
| Budynek | Epoka | Tech | Było | Jest | Nowy typ surowca |
|---|---|---|---|---|---|
| Warsztat kamieniarski | 1 | Murarstwo | d30 | d30/k30 | kamień |
| Stela / Pomnik | 1 | Murarstwo | k30 | d30/k30 | drewno |
| Kamienne kręgi | 1 | Mistycyzm | k40 | d40/k40 | drewno |
| Targowisko | 1 | Wymiana | d30 | d30/k30 | kamień |
| Studnia | 1 | Gospodarka wodna | d25 | d25/k25 | kamień |
| Biblioteka | 2 | Pismo | d30/k30 | d30/k30/c30 | cegła |
| Spichlerz Królewski | 2 | Pismo | d40/k50 | d50/k50/c50 | cegła |
| Świątynia | 2 | Religia | d30/k40 | d40/k40/c40 | cegła |
| Magazyn | 2 | Handel | d50/k30 | d30/k30/c30 | cegła |
| Emporion | 2 | Handel | d80/k60 | d60/k60/c60 | cegła |
| Dwór Zarządcy | 2 | Kodeks | d30/k30 | d30/k30/c30 | cegła |
| Trybunał | 2 | Kodeks | d30/k40 | d40/k40/c40 | cegła |
| Mury | 2 | Budownictwo | d40/k80 | d80/k80/c80 | cegła |
| Akwedukt | 2 | Budownictwo | d30/k60 | d60/k60/c60 | cegła |
| Mennica | 2 | Waluta | d30/k40 | d40/k40/c40 | cegła |
| Odlewnia brązu | 2 | Brązownictwo | d30/k40 | d40/k40 | — |
| Port handlowy | 2 | Żegluga | d60/k30 | d30/k30 | — |
| Akademia | 3 | Filozofia | d40/c70 | d70/k70/c70 | kamień |
| Akademia wojskowa | 3 | Sztuka wojenna | d50/c70 | d70/k70/c70 | kamień |
| Baszta | 3 | Inżynieria | d50/k100 | d100/k100/c100 | cegła |
| Cytadela (fort) | 3 | Inżynieria | d50/k100 | d100/k100/c100 | cegła |
| Kuźnia żelaza | 3 | Hutnictwo żelaza | d40/c50 | d50/k50/c50 | kamień |
| Odlewnia żelaza | 3 | Hutnictwo żelaza | d40/c50 | d50/k50/c50 | kamień |
| Pałac III | 3 | — | d50/c70 | d70/k70/c70 | kamień |
| Port wielki | 3 | Inżynieria | d60/k50 | d50/k50/c50 | cegła |
| Pretorium | 3 | Prawo | d40/c50 | d50/k50/c50 | kamień |
| Sąd | 3 | Prawo | d30/c50 | d50/k50/c50 | kamień |
| Teatr | 3 | Filozofia | d40/c50 | d50/k50/c50 | kamień |
| Warsztat oblężniczy | 3 | Oblężnictwo | d50/k50 | d50/k50/c50 | cegła |
| Łaźnia publiczna | 3 | Medycyna | d40/c60 | d60/k60/c60 | kamień |
| Wielka Kuźnia | 4 | Obróbka żelaza | d60/c80 | d80/k80/c80 | kamień |
| Wielka odlewnia | 4 | Obróbka żelaza | d60/c70 | d70/k70/c70 | kamień |

Bez zmian wartości (zgodnie z ZAŁOŻENIEM): Kuźnia brązu 30/30, Koszary 40/40, Pałac II 50/50, Cegielnia 30/30. Pozostałe budynki Kamienia (Stolarnia, Palisada, Spichlerz, Garncarnia, Dom starszyzny, Garnizon) — samo drewno; Pałac — bez kosztu surowcowego.

## 4. Tier-gating Garncarstwa
`epochTierGateMet` (research.ts) działa na danych: po zmianie poziom 1 Kamienia = Obróbka drewna, Rolnictwo, Łowiectwo, Oswojenie zwierząt, Garncarstwo; poziom 2 = Murarstwo, Mistycyzm, Wymiana, Gospodarka wodna. Brak zmian w kodzie research.ts. Nowy test sprawdza: Poziom=1, brak prereq, brak cyklu w całym drzewku, żaden tech Kamienia nie wymaga techa wyższego poziomu. Istniejące: research-test 33/33, tech-tree-test 19/19, tech-tempo, tech-unlock-units, handel-wymiana-tech-gate, eko-tech-paczka1 — zielone.

## 5. Bramka „surowiec nie wcześniej niż dostępny” (nowy test, 56 asercji)
- Cegielnia nie kosztuje cegły; Garncarstwo bez cyklu.
- Każdy budynek Brązu z cegłą ma w łańcuchu prereq swojej technologii techa wymagającego Cegielni (Pismo/Religia mają `wymagany budynek` = Cegielnia) — nie da się go postawić wcześniej niż Cegielnia.
- Budynki Żelaza z cegłą są z epoki późniejszej niż Cegielnia.
- Budynki przed Cegielnią (kuźnia, odlewnia brązu, port, koszary, pałac II) bez cegły.
- Kamień w koszcie budynku Kamienia tylko dla techów poziomu 2+.

## 6. DIAGNOZA utrzymania surowcowego (pkt 5 dispatchu) — PRZESŁANKA DISPATCHU BYŁA NIEPRAWDZIWA
Dispatch zakładał: „dziś utrzymanie budynku to wyłącznie Pieniądz; brak utrzymania surowcowego dla budynków”. Faktycznie mechanizm ISTNIEJE:
- `gra/src/game/economy-upkeep.ts` `buildingResourceUpkeep()` / `BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE = 5` (R-EKONOMIA-SUROWCE-SKALA-5X-Q1): 5 szt./turę za KAŻDY typ surowca obecny w `koszt_surowce`, niezależnie od ilości kosztu. Podpięte w `turn-economy.ts` (`totalBuildingResourceUpkeep`, `resourceUpkeepBuildingsByOwner`), UI (`cityPanel.ts`, `buildingAdapter.ts`, `empireDetailPanel.ts`), `resource-usage-breakdown.ts`.
- Konsekwencja: każdy surowiec dodany do kosztu budowy AUTOMATYCZNIE dokłada utrzymanie 5/turę tego surowca — tyle samo, ile płacą dotychczasowe typy budynku (czyli „ta sama ilość co wymagana wcześniej dla innego surowca”). Reguła właściciela jest więc spełniona bez zmiany kodu; osobny etap implementacyjny (BUILDING-UPKEEP-RESOURCES-IMPL) w obecnej formie nie ma czego dodawać — wymaga najpierw decyzji, czy właściciel chce coś ponad automatykę.
- Skala: 30 nowych typów surowców w 32 budynkach (Kamień 5, Brąz 10, Żelazo 15) = maks. +150 szt./turę, jeśli wszystkie stoją naraz (np. Brąz: +5 cegły/turę na każdy z 10 budynków po Cegielni; Kamień: Targowisko, Studnia, Warsztat kamieniarski zaczynają zużywać 5 kamienia/turę, Stela i Kręgi 5 drewna/turę).
- DECISION_REQUIRED (niewiążące, do orkiestratora): czy zostawić stałą 5/typ (rekomendacja: TAK, bez zmian — wprost spełnia regułę; a) A: bez zmian; b) B: utrzymanie proporcjonalne do ilości kosztu — znacznie droższe, zmienia cały balans surowców, wymaga progów od właściciela; c) C: wyłączyć utrzymanie dla nowo dodanych typów — łamie regułę właściciela).

## 7. AI i konwertery (zgłoszenie)
- `ai-resource-needs.ts` jest generyczne po kluczach surowców — działa z 3 surowcami bez zmian.
- `ai.ts` (~2245-2290): reguła „konwerter przed konsumentem” ma wpis ['cegla','cegielnia'] — AI zawsze dołoży Cegielnię przed budynkami Brązu z cegłą; budżet (`canAfford`) filtruje niedostępne, brak twardego deadlocku (brak kandydatów stać → AI czeka).
- RYZYKO (nie rozwiązywane, poza zakresem danych): cywilizacja bez gliny (Cegielnia ma bramkę Glina w magazynie) albo bez kamieniołomu (Cegielnia i większość Brązu wymaga Kamienia) nie postawi żadnego budynku z cegłą — wcześniej Biblioteka/Mury/Mennica itd. wymagały tylko drewna+kamienia. Bez handlu tacy gracze/AI utkną na Brązie. Dodatkowo kamień w Kamieniu: Targowisko i Studnia (tech Wymiana / Gospodarka wodna nie wymagają Murarstwa) bywają niedostępne do czasu zbadania Murarstwa + Kamieniołomu. Nie ma ścieżki konwersji kamienia (tylko Kamieniołom). Do osobnej decyzji/pomiaru (AI-live).
- Sam Spichlerz II ma dodatkowo bramkę Ceramika + Sól (R-WEB-GRANARY2-TECH-DATA-FIX-Q1) — teraz także cegła.

## 8. REPIN Rust (dług do zlecenia)
- `rust-port/engine/src/domain/building_costs.rs` jest agnostyczny co do danych (klucze stringowe) — kod bez zmian; testy Rust trzymają własne stałe, nie czytają buildings.json.
- Do REPIN: dane `koszt_surowce` 32 budynków (sekcja 3) oraz `Poziom` Garncarstwa 2 → 1 w tabeli technologii portu, oraz tier-gating (poziom 2 Kamienia bez Garncarstwa). Brak osobnego pliku LEDGER w tym drzewie — wpis zostaje w tym raporcie i w aneksie SPEC.

## 9. TESTY (cd gra/)
Zielone po zmianach:
- koszty-surowcowe-test: 160 pass / 0 fail (przed zmianą testu: 98 / 32 fail — stare reguły epokowe).
- building-cost-resource-availability-test (nowy): 56 / 0.
- building-epoch-cost-implementation-test 20/0; research-test 33/0; tech-tree-test 19/0; tech-cards-top5-test 594/0; building-cards-top5-test 1179/0; building-tech-gate 91/0; prereq-budynkow 60/0; deposit-building-gate 50/0; spichlerz-widocznosc 45/0; building-stock-visibility 7/0; card-resource-purpose 102/0; upkeep-test 73/0; unit-epoch-cost 57/0; unit-stock-cost 58/0; emporion-building 47/0; emporion-build-list-real-render 13/0; granary2-tech-data-guard 14/0; handel-wymiana-tech-gate 35/0; eko-tech-paczka1 13/0; podboj-kolejka-budynek-niemozliwy 79/0.
- `gen-building-cards-top5.cjs --check` OK; `gen-tech-cards-top5.cjs --check` OK. `npx tsc --noEmit` — czysto.
- Przegląd 130 testów czytających buildings.json/tech.json/koszt_surowce: 21 czerwonych PRZED poprawkami testów; po porównaniu z bazą origin/main (te same testy na starych danych): 7 regresji moich (poprawione w sekcji 1), reszta czerwona identycznie na bazie.
Czerwone IDENTYCZNIE na bazie origin/main (dług testowy niezwiązany z tematem): zloto-test 38/7 (Mennica/parytet AI), administracja-stolica-test 52/1 (Sąd w stolicy), budynek-garnizon-test (błąd budowy esbuild: duplikat eksportu `renderBuildList` w cityPanel.ts:12336), trade-ilosc-test 35/5, resource-usage-breakdown-test 98/2, fair-play-tier-grid-test, ekonomia-5x-inwariant-test 50 fail (stan bazowy 50), budynki-koszt-pracy-50-test 40 fail (itemCost poziomów; sha koszt_surowce zaktualizowany i zielony), budynek-civ-bonus-u17, hex-plony-magazyn, mennica-magazyn, surow-civ-storage, szczescie-przebudowa-skali, tech-discovery-badge-diorama, recruit-list-visibility-ui, era-change-toast-live, building-detail-card-entitycard-migration, entity-card-action-buttons-real-render.
Test niestabilny (zmienny wynik przy kolejnych uruchomieniach, 24/0 ↔ 23/1 ↔ 18/6, także na bazie nie deterministyczny z powodu przeglądarki): entity-card-cross-links-nested-overlay-test.
NIE_ZMIERZONO: balans gry na żywo (pomiar ekonomii/AI przez 100 tur po zmianie kosztów), weryfikacja w przeglądarce kart budynków z nowymi kosztami (temat danych; chipy kosztów renderują się z danych — potwierdzone w emporion-build-list-real-render 13/0).

## 10. Uwagi / dług
- Odnośniki `dowod` w `gra/data/building-cards-top5.json` i `tech-cards-top5.json` (`gra/data/buildings.json:NNN`) wskazują numery linii sprzed zmiany; po edycji kosztów linie za pierwszą zmienioną wartością przesunęły się (plik urósł o 30 linii). Karty są poprawne merytorycznie (nie cytują kosztów), testy nie weryfikują numerów linii. Przeliczenie numerów linii = osobny drobny temat.
- Niekompletne lokalnie: `PROJEKT-TABELA-KOSZTOW.md` i dispatch istnieją tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (nie na `origin/main`); katalog runu na tej gałęzi roboczej zawiera tylko ten raport.
- Wiadomość użytkownika o „ponowieniu pytania” (usunęło się podczas odpowiadania) dotyczy orkiestratora — nie wykonywałem jej; pytanie, które orkiestrator zadał, nie jest dla mnie dostępne.

BLOKADY: brak (luki rozstrzygnięte ZAŁOŻENIEM, sekcja 2). Do potwierdzenia przez właściciela: ZAŁOŻENIA 1-4 i decyzja o utrzymaniu surowcowym (sekcja 6).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (r1) — weryfikacja tabeli kosztów względem PROJEKT-TABELA-KOSZTOW.md, sprawdzenie diagnozy utrzymania (buildingResourceUpkeep), wynik testów z sekcji 9; potem Obrona i Final Control. Osobno: REPIN Rust (sekcja 8), decyzja o ryzyku braku gliny/kamieniołomu (sekcja 7).
DEPLOY/PUSH: NIE WYKONANO
