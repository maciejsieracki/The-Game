# R-WEB-DATA-STONE-WALLS-NO-BRICK-COST-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane + testy + Civpedia; bez zmian w logice gry)
TEMAT: R-WEB-DATA-STONE-WALLS-NO-BRICK-COST-Q1
GOAL: „Mury kamienne” (`mury_kamienne`) NIE wymagają cegły. `koszt_surowce` bez klucza `cegla`, `drewno` i `kamien` w dotychczasowych ilościach (80/80; na karcie 160/160 po skali). „Mury ceglane” (`mury`) zachowują cegłę (80; na karcie 320/320/320 po skali epoki ×2 i FALA2). Bez innych zmian balansu.
ZMIANY-COMMIT: patrz sekcja „Zmiany” poniżej; SHA commita w polu `sha` odpowiedzi orkiestratora.
TESTY: patrz sekcja „Testy”.
BLOKADY: brak blokad technicznych. NIE ZMIERZONO: lista „5 bramek referencyjnych” z R-PROC-AUTOBOT §Bramki nie została odczytana w tej rundzie (uruchomiono tsc i testy związane z murami/kosztami, patrz niżej).
RUNDY: 1/5 (werdykt ostatniego etapu: brak; to pierwsza runda Operatora).
NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja diffu, decyzja właściciela w sprawie audytu cegły (sekcja 3), następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Potwierdzenie przyczyny (plik:linia, baza 1b8ce0d39)

- `gra/data/buildings.json` — blok `mury_kamienne` (id linia ~1012): `koszt_surowce` = `{drewno:80, kamien:80, cegla:80}` (linia ~1058–1062). Pozostałe pola kosztowe identyczne z `mury` (kosztBudowy 35, przyrostKosztu 12, utrzymanie 2, przyrostUtrzymania 1). Uwagi `mury_kamienne` (linia ~1032) mówiły „zgodne z istniejącym szablonem Murów” — to źródło defektu (skopiowany szablon ceglany).
- `mury` („Mury ceglane”, linia ~1064–1112): `koszt_surowce` = `{drewno:80, kamien:80, cegla:80}` — poprawny, cegła zostaje.
- Druga kopia kosztu: NIE ZNALEZIONO. `grep mury_kamienne` w `gra/src/**` nie zawiera żadnego kosztu (tylko id w warunkach: building-resource-gate, city-defense, ai, production). `building-cards-top5.json` (blok `mury_kamienne`) nie zawiera kosztu. `miasto-params.json` nie zawiera kosztu. Koszt idzie wyłącznie z `buildings.json` przez `buildingStockCost` (`gra/src/game/building-stock-cost.ts`) — karta, bramka (`canAffordBuildingStock`), pobór (`deductBuildingStockCost*`), zwrot i AI czytają ten sam wpis.
- Civpedia: `docs/encyklopedia/budynki/mury-kamienne.md` (linie 18 i 32) podawały „80× cegła” — zsynchronizowane. `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` nie podaje ilości kosztu (bez zmian).

## Zmiany

1. `gra/data/buildings.json`:
   - `mury_kamienne.koszt_surowce` → `{ "drewno": 80, "kamien": 80 }` (usunięto `cegla`).
   - `mury_kamienne.uwagi`: zdanie „Koszty i utrzymanie zgodne z istniejącym szablonem Murów.” zastąpiono: „Koszt surowcowy: drewno i kamień, bez cegły (cegła należy wyłącznie do Murów ceglanych). Utrzymanie zgodne z istniejącym szablonem Murów.”
   - Walidacja JSON: OK (`JSON.parse`).
2. `docs/encyklopedia/budynki/mury-kamienne.md`: dwa miejsca z „80× cegła” usunięte; dopisane „(bez cegły; na karcie po skali epoki 160 + 160)”.
3. `gra/src/data/wikiBundle.json`: regenerowany WYŁĄCZNIE `node gra/tools/bundle-wiki-for-game.cjs` (22 rozdz. + 181 haseł).
4. Nowy test `gra/tools/stone-walls-no-brick-cost-test.cjs` (12 asercji): dane (D1–D3), realny koszt po skali epoki (K1–K2), bramka budowy przy 0 cegły (G1–G4), pobór (P1), mutacja (M1).
5. Zaktualizowane testy zakładające cegłę / stary koszt Murów kamiennych:
   - `gra/tools/fortifications-stack-repro-test.cjs`: F2 — awans palisada→kamienne oczekiwał `cegla === 160`; teraz `cegla === 0` (koszt 160/160). F4 — magazyn cegły po 3 etapach oczekiwał `2000-480`; teraz `2000-320` (cegła płacona tylko przez Mury ceglane). Powód: nowe dane.
   - `gra/tools/koszty-surowcowe-test.cjs`: mapa `DREWNO_KAMIEN` dostała wpis `mury_kamienne: 80` (sprawdzenie: 2 surowce, drewno = kamień = 80). Powód: test wymagał „wyłącznie drewno” dla epoki Kamienia, a zatwierdzony koszt Murów kamiennych to drewno + kamień (już przed zmianą test był czerwony: błąd cegły).

## Testy (wyniki z surowego wyjścia)

Uwaga o środowisku: worktree nie miał `gra/node_modules`; użyto symlinka do `node_modules` z innego worktree (tylko odczyt, symlink usunięty po testach). `tsc` z global `/opt/node22/bin/tsc` odrzuca `baseUrl` (TS 6), więc typecheck uruchomiono lokalnym `node_modules/typescript`.

- `node gra/node_modules/typescript/bin/tsc --noEmit -p gra` → exit 0 (ZMIERZONO).
- `git diff --check` → exit 0, czysto (ZMIERZONO).
- `node tools/stone-walls-no-brick-cost-test.cjs` na zmianach → `12 PASS, 0 FAIL`, exit 0.
- Ten sam test na danych bazowych (`git show 1b8ce0d39:gra/data/buildings.json`) → `7 PASS, 5 FAIL`, exit 1 (D1, K1, G1, G3, P1 czerwone). Test jest czerwony na bazie (ZMIERZONO).
- Testy powiązane, zmiany → wynik:
  - building-stock-visibility-test: 7 passed, 0 failed.
  - fortifications-queue-cleanup-test: 10 OK, 0 FAIL.
  - fortifications-stack-repro-test: baza 49 OK / 0 FAIL → po poprawce testu 49 OK / 0 FAIL (przed poprawką F2, F4 FAIL).
  - fortifications-upgrade-chain-ai-test: 13 OK, 0 FAIL.
  - fortifications-upgrade-chain-ui-test: PASS (U1–U14).
  - palisade-battle-wall-rules-test: 55 OK, 0 FAIL.
  - prereq-budynkow-test: 62 pass, 0 fail.
  - koszty-surowcowe-test: baza FAIL (cegla w mury_kamienne) → zmiany przed poprawką testu FAIL (kamien), po poprawce rc=0.
  - grupy-budynkow-test: rc=0.
  - building-queue-refund-test: 5 passed, 0 failed.
  - building-epoch-cost-implementation-test: 20 passed, 0 failed.
  - upkeep-test: 91 passed, 0 failed. building-upkeep-ceramics-test: 649 passed, 0 failed. building-cards-top5-test, entity-cards-resource-icons-test, wall-defenders-bonus-range-test: rc=0.
  - building-cost-resource-availability-test: rc=0.
- Testy CZERWONE ALE PRZED ZMIANĄ (identyczny wynik na bazie 1b8ce0d39 — pre-existing, nie naprawiane w tym temacie):
  - upgrade-budynki-test: 1 FAIL „stale palisade completion preserves only stronger wall tier and Citadel” (baza i zmiana identycznie).
  - building-upkeep-resources-test: 1 FAIL D10 „karta uzywa polskich etykiet i odmian” (baza i zmiana).
  - stone-research-costs-test: FAIL „complete technology dataset unchanged…” (baza i zmiana).
  - card-resource-purpose-test: 2 FAIL (B: utrzymanie w Pieniądzu; W: etykieta „Podatek”) (baza i zmiana).
  - szczescie-przebudowa-skali-test: 3 FAIL (katalog 44 vs 41, 12 vs 11, 24 vs 23) (baza i zmiana).
  - unit-stock-cost-test: 2 FAIL (Bronze Konnica ×2) (baza i zmiana).
- Chromium (Playwright, realny `renderBuildList` z `cityPanel.ts`, dane z `buildings.json`; skrypt roboczy usunięty po pomiarze):
  - Stan: brak cegły w magazynie (`cegla: 0`), miasto epoki Żelaza, brak budynków lancucha → wiersze „Buduj”: `Palisada drewniana: Kup|Buduj`, `Mury kamienne: Kup|Buduj` (przyciski aktywne), `Mury ceglane: Kup(off)|Buduj(off)` (zablokowane). ZMIERZONO.
  - Stan „mury kamienne stoją”: „Ulepsz → Mury ceglane” obecne; karta awansu pokazuje koszt jako liczbę (U8 = 160). ZMIERZONO.
  - Zrzuty ekranu z przebiegu: `gra/tools/_stone-check-shots/04-od-zera-buduj.png` — NIE ZACHOWANO w commicie (katalog tymczasowy, usunięty). Dowód liczbowy powyżej z surowego wyjścia Chromium.
  - NIE ZMIERZONO: zrzut samej karty „Mury kamienne” (wiersz kosztu bez cegły) i karty „Mury ceglane” jako osobnych plików. Dane kosztu w karcie zweryfikowano DOM-em (U8: 160), ale nie wykonano osobnego zrzutu karty szczegółów.
  - NIE ZMIERZONO: budowa Murów kamiennych w prawdziwej grze (kolejka + pobór) — pokryte testem `building-queue-refund-test` i `fortifications-stack-repro-test` (pobór 160/160 bez cegły), ale bez realnej rozgrywki w przeglądarce.

## Audyt (tylko raport, bez zmian poza punktem 2 zadania) — do decyzji właściciela

Budynki z `cegla` w `koszt_surowce` (po zmianie; epoka wejścia; nazwa; techUnlock; fakt):

- ep 2: Świątynia (Religia), Biblioteka (Pismo), Spichlerz Królewski (`spichlerz_ii`, Pismo), Akwedukt (Budownictwo), Mennica (Waluta), Mury ceglane (`mury`, Budownictwo), Emporion (Handel), Magazyn (Handel), Dwór Zarządcy (Kodeks), Trybunał (Kodeks).
- ep 3: Odlewnia żelaza (Hutnictwo żelaza), Port wielki (Inżynieria), Kuźnia żelaza (Hutnictwo żelaza), Pałac III (bez techu w danych), Cytadela (`fort`, Inżynieria), Baszta (Inżynieria), Warsztat oblężniczy (Oblężnictwo), Akademia (Filozofia), Teatr (Filozofia), Sąd (Prawo), Pretorium (Prawo), Łaźnia publiczna (Medycyna), Akademia wojskowa (Sztuka wojenna).
- ep 4: Wielka odlewnia (Obróbka żelaza), Wielka Kuźnia (Obróbka żelaza).

Fakt logiczny: budynki z cegłą w kosztach są w większości pałacowo-administracyjne lub kulturalne (np. Teatr, Świątynia, Sąd), więc „cegła w kosztach” nie wynika z nazwy ani z techu. Ocena „czy logicznie wymagają cegły” należy do właściciela (nie zmieniano).

Pary/grupy z IDENTYCZNYM `koszt_surowce` (potencjalny „szablon” do decyzji, NIE naprawiano):
- {drewno 30, kamien 30}: Kamieniarski (ep1), Kuźnia (ep2), Port (ep2), Cegielnia (ep2), Stela (ep1).
- {40, 40}: Odlewnia brązu (ep2), Kamienne kręgi (ep1), Koszary (ep2).
- {30 ×3} (drewno, kamień, cegła): Biblioteka, Magazyn, Dwór Zarządcy (ep2).
- {40 ×3}: Świątynia, Mennica, Trybunał (ep2).
- {50 ×3}: Odlewnia żelaza, Port wielki, Spichlerz Królewski, Kuźnia żelaza, Warsztat oblężniczy, Teatr, Sąd, Pretorium (ep2–3).
- {60 ×3}: Akwedukt, Emporion, Łaźnia publiczna (ep2–3).
- {70 ×3}: Wielka odlewnia, Pałac III, Akademia, Akademia wojskowa (ep3–4).
- {80 ×3}: Mury ceglane, Wielka Kuźnia (ep2, ep4).
- {100 ×3}: Cytadela, Baszta (ep3).
- {30}: Targowisko, Garncarnia, Dom starszyzny, Garnizon (ep1).

## Zakres i granice

- Nie zmieniano: `gra/src/**` (brak zahardkodowanego kosztu do usunięcia), utrzymania, bonusu obrony, kosztu Pracy, Mury ceglane (`mury`), Palisady, `WERSJE.md`, `gra-robocza/`, `rust-port/`, `git add -A`.
- Commit obejmuje wyłącznie: `gra/data/buildings.json`, `gra/src/data/wikiBundle.json`, `docs/encyklopedia/budynki/mury-kamienne.md`, `gra/tools/fortifications-stack-repro-test.cjs`, `gra/tools/koszty-surowcowe-test.cjs`, `gra/tools/stone-walls-no-brick-cost-test.cjs`, oraz ten raport.

## Zadanie pozaprocesowe (zgłoszenie właściciela)

Wiadomość użytkownika w tej rundzie (propozycje AI w handlu: na początku mniej korzystne dla gracza, potem rosnące zmęczenie) NIE dotyczy tego tematu i nie była wykonywana w tej rundzie.

UWAGI-DLA-ORKIESTRATORA:
1. Osobny temat do rozpisania przez orkiestratora: wiadomość użytkownika o AI-propozycjach handlu (mniej korzystne oferty na starcie, zmęczenie rosnące w czasie, po stronie AI/drugiej strony). Nie jest to zakres R-WEB-DATA-STONE-WALLS-NO-BRICK-COST-Q1.
2. Pytanie do właściciela (ABC, nie rozstrzygane tutaj): czy 25 budynków z `cegla` w `koszt_surowce` ma zostać (sekcja „Audyt”), oraz czy grupy o identycznym koszcie (sekcja „Audyt”) to celowe wartości, czy kolejne skopiowane szablony.
3. Pre-existing czerwone testy (sekcja „Testy”, 6 plików) — poza tym tematem; osobne tematy testowe.
4. Brak osobnego zrzutu karty w Chromium (sekcja „Chromium”) — do uzupełnienia w Evaluatorze, jeśli wymagany.
