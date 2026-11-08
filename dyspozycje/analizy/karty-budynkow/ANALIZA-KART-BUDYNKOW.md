# Analiza kart budynków — TOP 5 korzyści i „Co możesz teraz zrobić”

TEMAT: R-WEB-BUILDING-CARDS-TOP5-ANALYSIS-Q1 · Rola: Operator · Runda 1/5 · Baza: `origin/main` 397f84f29 · Data: 2026-11-08
Etap 2/5 planu kart (etap 1 — odkrycia: `dyspozycje/analizy/karty-odkryc/`, FC 58339997b). Zakres: 43/43 budynki z `gra/data/buildings.json`. Bez zmian w kodzie i danych gry — dokument + tabela do akceptacji właściciela.

Pliki wynikowe:

- ten dokument — metodologia, pomiar dzisiejszej karty, problemy, reguły, wyniki, porównanie ze starym `top3`, martwe efekty, pytania ABC, plan etapów 3–5;
- `budynki-top5.csv` (UTF-8 z BOM, końce linii LF, separator `;`) — 43 wiersze, kolumny wg dispatchu;
- `turnieje/<id>.md` (43 pliki) + `turnieje/README.md` — kandydaci z oceną 0–5, efekty martwe, pojedynki każdy z każdym, ranking, TOP 5, porównanie ze starym `top3`, propozycja „Co możesz teraz zrobić”;
- `narzedzia/bldata.py` (kandydaci, oceny, dowody, efekty martwe) + `narzedzia/gen.py` (turniej, CSV, pliki turniejów, tabele). Odtworzenie: `python3 -I dyspozycje/analizy/karty-budynkow/narzedzia/gen.py <repo>`; obok skryptu powstają `tables.md` i `stats.json` (tabele §5–§8 tego dokumentu pochodzą z `tables.md`).

Decyzje właściciela z etapu 1 stosowane wprost (dispatch, pkt 1–6): format „tytuł z liczbą + jedno zdanie”; tylko realne pozycje (bez dopełniania do 5); efekty martwe poza TOP 5, na osobnej liście „ukryć do czasu naprawy”; Top1 = realna korzyść od ręki; TOP 5 zaraz po Rysie historycznym; „Co możesz teraz zrobić” jako CZYNNOŚĆ → w celu KORZYŚCI.

---

## 1. Metodologia

### 1.1 Źródła i pewność

Kolejność zaufania jak w etapie 1 (`ANALIZA-KART-ODKRYC.md` §1.1): (1) kod, który zużywa wartość (`gra/src/game/*.ts`, `gra/src/main.ts`), (2) dane czytane przez ten kod (`gra/data/*.json`), (3) pola opisowe (`uwagi`, `opis`, dzisiejsze `top3`) tylko jako wskazówka. Liczby dla trudności **normal**; easy/hard w zdaniu, gdy dane je różnicują. Każdy `plik:linia` generator sprawdza (`check_ev`: linia istnieje). Pewność: WYSOKA = wartość i konsument potwierdzone; NIE_USTALONO = budynek niedostępny.

Weryfikacja bazy: między bazą etapu 1 (57b916eb7) a 397f84f29 zmieniły się wyłącznie `diplomacy-proposals.ts`, `diplomacy-rejection-cooldown.ts` i `main.ts` (`git diff --stat`), więc dowody z etapu 1 dla `gra/data` i `gra/src/game` są aktualne; odwołania do `main.ts` sprawdzone na nowo (`main.ts:4212-4216`, `:25940-25945`). Final Control r1: integracja na `origin/main` d36f8b3b0 (FALA 558 dodała 18 linii w `main.ts` przed l. 2460, `git diff -U0 397f84f29 d36f8b3b0 -- gra/src/main.ts`), więc WSZYSTKIE odwołania `main.ts` w analizie, CSV i turniejach przesunięto o +18 i sprawdzono treścią; `gra/data` i `gra/src/game` bez zmian między tymi bazami poza `war-rules-multiwar.ts` (niecytowany).

### 1.2 Kryteria i wagi (bez zmian względem etapu 1, §1.2)

SKALA 3 · NOWA MECHANIKA 3 · BRAK ZASTĘPNIKA 2 · ZASIĘG 2 · ODCZUWALNOŚĆ 2 · CZYTELNOŚĆ 1 (maks. 65). Skale 0–5 jak w etapie 1. Kalibracja specyficzna dla budynków: efekt „w całym państwie” (Mennica, Stolarnia, Magazyn, Spichlerz-pojemność) Z = 5; „w mieście” Z = 2; ścieżki jednostek (trwały bonus dla jednostek z miasta) Z = 3; asymilacja kultury (działa tylko w mieście z obcą kulturą, zwykle podbitym) Z = 1.

### 1.3 Zasady turnieju

- **Kandydaci:** wszystkie realne efekty z dowodem — plony (`baza`; przy `maksPoziom` > 1 z przyrostem na epokę, `production.ts:252-271`), premie procentowe (`econ-params.json`), limity (ludność, magazyn, Prawo), mechaniki (rekrutacja, tryb oblężenia, milicja, zamiana Pracy na podatek), ścieżki jednostek (`unit-building-bonuses.ts`), korupcja (`economy.ts:1225-1250`), zdrowie i Szczęście (`turn-economy.ts:476-498`, `economy.ts:509-535`), oraz warunki dalszych obiektów (`CITY_BUILDING_PREREQ`, `building-resource-gate.ts:110-121`; „wymagany budynek” badań, `tech.json` + `research.ts:154-180`; rozbudowy `upgradeFrom`).
- **Pojedynki każdy z każdym**, rozstrzygnięcia remisów jak w etapie 1 (SKALA → ZASIĘG → NOWA MECHANIKA → kolejność). 127 kandydatów, 174 pojedynki (po Obronie r1; Operator r1: 121 / 149).
- **R-B1 (odpowiednik R-K1):** kandydat „next” — budynek jako warunek innego budynku/badania albo rozbudowa — sam nic nie daje; korzyść ocenia karta obiektu docelowego → NOWA MECHANIKA = 0, ODCZUWALNOŚĆ ≤ 1. Może zająć Top2–Top5, jeśli jest realny (decyzja pkt 2), nigdy Top1.
- **E1-B (decyzja pkt 4):** Top1 = najwyżej w rankingu efekt własny budynku, działający od ukończenia budowy (nie warunek, nie rozbudowa, nie efekt martwy). W r1 ani jeden budynek nie wymagał przesunięcia (Top1 turnieju zawsze był efektem własnym).
- **E1-B2 (Obrona r1, zarzut Evaluatora 3):** efekt własny, którego wartość jest 0 bez stanu gry, jakiego budynek sam nie zapewnia (aktywna trasa handlowa; nadwyżka Pracy i decyzja gracza), nie jest korzyścią „od ręki” — Top1 tylko wtedy, gdy budynek nie ma innego efektu własnego. Flaga `war=True` w `bldata.py`; dotyczy Targowiska (trasy +50%, slot trasy, zamiana Pracy na podatek), Portu (slot trasy, premia morska) i Emporionu (slot trasy). Skutek: Top1 Targowiska = +5 pieniądza, Portu = +5 pieniądza, Emporionu = +8 pieniądza; efekty tras zostają w Top2–Top4.
- **Ziarnistość = efekt** (etap 1, §4 pkt 9): płaskie plony jednego budynku łączone w jedną pozycję („+5 Kultury, +2 pieniądza i +3 Szczęścia”); różne mechaniki — osobno.
- **Cena korzyści** (koszt budowy, utrzymanie, zużycie surowca — np. Mennica 1 Złota/turę, Spichlerz 25 Ceramiki/turę) nie jest kandydatem do TOP 5; stoi w Uwagach CSV i na górze pliku turnieju.
- **Efekty martwe** (budynek z epoki 4, `suppressed`, pole bez konsumenta, opis niezgodny z kodem) nie wchodzą do turnieju; lista w §8.

### 1.4 „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Zdanie 1: czynność budowy tego budynku + najwyżej oceniony efekt własny z polem „aby…”. Zdania 2–3: czynności następcze z kandydatów „next” (rozbudowa, budynek obok), w kolejności turnieju. Warunki (stolica, Targowisko, epoka) w nawiasie przy czynności, nigdy jako cel. Maks. 3 zdania — karta budynku jest węższa tematycznie niż karta odkrycia.

---

## 2. Pomiar dzisiejszej karty budynku (plik:linia)

### 2.1 Skąd treść i kolejność sekcji

- Adapter: `gra/src/ui/entityCards/buildingAdapter.ts:178-336`; host karty w panelu miasta: `gra/src/ui/cityPanel.ts:7646-7672` (`buildBuildingDetailCardViaEntityCard` dokleja po rendererze sekcję „Technologie” i „Uwagi”).
- Tablica `sections` (`buildingAdapter.ts:232-314`): **0 Wymagania → 1 Opis → [Rys historyczny wstawiany przez renderer na indeksie 2, `renderer.ts:461,486`] → Top 3 → Charakterystyka → Plony i efekty → Koszt budowy → Koszt utrzymania → Poziomy**.
- **Wniosek dla decyzji pkt 5:** blok TOP stoi już zaraz po Rysie historycznym. Wdrożenie TOP 5 to zmiana treści pola `top3` (lub nowe pole `top5`) i tytułu sekcji „Top 3” → „Top 5” (`buildingAdapter.ts:236`); renderer numeruje dowolną liczbę pozycji (`renderer.ts:229-251`), więc 1–5 pozycji nie wymaga zmian w rendererze.
- `top3Of` (`buildingAdapter.ts:111-121`) czyta `top3: [{tytul, tekst}]` — format „tytuł + zdanie” zgodny z decyzją pkt 1.
- Komentarz „dziś: 0/42” (`buildingAdapter.ts:234`) jest nieaktualny: `top3` ma **43/43** budynki, 129 pozycji.
- **„Co możesz teraz zrobić” — karta budynku tej sekcji nie ma** (grep `Co możesz` w `gra/src`: tylko `technologyAdapter.ts` i `techDiscoveryNotice.ts`). Kolumna `Co_mozesz_zrobic_OBECNIE` = „brak sekcji”; propozycja w §6 i pytanie Q1.
- Sekcja „Plony i efekty” (`buildingAdapter.ts:247-272`) pokazuje tylko 7 plonów płaskich, mnożnik ścieżek jednostek i Obronę strukturalną. **Nie pokazuje żadnej premii procentowej ani limitu**: ×1,5 Mennicy, +30% Biblioteki, +20% Akademii, +50% tras Targowiska, +25% Pracy Cegielni, +10% drewna/kamienia, +20% Magazynu, limit ludności 8/12/20, Prawa, −30% korupcji, Milicji, zdrowia. Te informacje gracz może dziś dostać tylko z `top3` — dlatego treść TOP 5 jest kluczowa.

### 2.2 Dzisiejsze `top3` — liczby

| Miara | Wynik | Źródło |
|---|---|---|
| Budynki z `top3` | 43/43 | `buildings.json` (pole `top3`) |
| Pozycji razem | 129 | jw. |
| „Masło maślane” wg regexu etapu 1 (`^(Otwiera\|Wymaga\|Brama\|Krok\|Rozbudowa\|Pierwszy\|Niski koszt\|Dostępn\|Powstaje\|Upgrade)`) | 47/129 (36%) | `stats.json` — potwierdza pomiar wstępny z dispatchu |
| Klasyfikacja Operatora: pozycja opisuje realny efekt, który zostaje w nowym TOP 5 | 71/129 | pole `old` w `bldata.py` |
| Klasyfikacja Operatora: warunek / wymaganie / ogólnik (do usunięcia) | 46/129 | jw. |
| Klasyfikacja Operatora: efekt martwy albo nieprawdziwy (do usunięcia) | 12/129 | jw. (Wielka odlewnia ×3, Wielka Kuźnia ×3, Teatr ×3, Odlewnia żelaza „Krok ku Wielkiej odlewni”, Warsztat oblężniczy „Odblokowuje Katapultę”, Trybunał „Ogranicza korupcję”) |
| Budynki, w których Top1 nowego TOP 5 NIE jest pozycją 1 starego `top3` | 31/40 | `stats.json` |

---

## 3. Problemy znalezione (najważniejsze, z dowodem)

1. **Mennica** — realny współczynnik **×1,50 (normal) / ×1,62 (easy) / ×1,38 (hard)**: `econ-params.json:585-591` (`mennica_mnoznik_po_walucie`), liczony w `economy.ts:952-955` na podatku miasta przed podziałem suwakami (`economy.ts:962-967`), w każdym mieście państwa, gdy Mennica stoi w stolicy (`economy.ts:644-653`). Warunki: Waluta, stolica, Targowisko w stolicy (`building-resource-gate.ts:119`), dostęp do Złota; zużywa 1 Złota/turę (`zloto-access.ts:31`, `turn-economy.ts:1879-1894`). Dzisiejszy `top3` (`buildings.json:937`) mówi tylko „Dodaje 3 punkty pieniądza…”, a karta efektów — „Pieniądz +3”. Parametry `budynek_mennica_mnoznik` i `waluta_mnoznik` są legacy (`econ-params.json:313-340`).
2. **Koszary** są bramką rekrutacji **całego** wojska epoki Brązu i Żelaza (`production.ts:1068-1076`) — `top3` (`buildings.json:1083`) o tym milczy.
3. **Akwedukt** — limit ludności 20 (`econ-params.json:45-51`, `economy.ts:1053`) nie występuje w `top3` (`buildings.json:889`); jest „+2 zadowolenia”, „Wymaga Studni”, „Otwiera Budownictwo”.
4. **Warsztat oblężniczy** — Top1 dzisiejszego `top3` („Odblokowuje Katapultę”, `buildings.json:1638`) jest nieprawdziwy: flaga `maWarsztatOblezniczy` to REZERWA (`cities.ts:843-850`), `production.ts` jej nie sprawdza.
5. **Trybunał** — „Ogranicza korupcję” (`buildings.json:1979`) nieprawda: listę redukcji tworzą tylko Sąd, Pretorium i Pałac (`economy.ts:1226`). Realnie: +17 pkt Prawa (`society-params.json:802`, `society-breakdown.ts:850-853`).
6. **Pałac II / III tracą −30% korupcji** Pałacu I: redukcja liczy wyłącznie id `palac` (`economy.ts:1226`), a rozbudowa usuwa `palac` z listy budynków (`production.ts:820-838`). Prawdopodobny błąd — do osobnego tematu (Q4).
7. **Garnizon** — `top3` (`buildings.json:2027`) pomija Milicję: przy ataku na miasto z Garnizonem staje 1 milicjant na mieszkańca (`combat-params.json:51-58`, `siegeDefenders.ts:84-90`).
8. **Targowisko** — główne efekty (+50% dochodu z tras `econ-params.json:278`, `main.ts:4212-4216`; +1 trasa `trade-routes.ts:908-945`; zamiana Pracy na podatek `work-tax.ts:14-22`) nie występują w `top3`; są „Niski koszt wejścia” i „Otwiera Wymianę”.
9. **Premie procentowe pominięte w `top3`**: Biblioteka +30% Nauki (`econ-params.json:320`), Cegielnia +25% Pracy z terenu (`:271`), Stolarnia/Warsztat kamieniarski +10% drewna/kamienia w państwie (`:285`, `:292`), Magazyn +20% pojemności państwa (`:613`), Garncarnia +10% żywności (`:299`).
10. **Budynki niedostępne mają pełne `top3`**: Wielka odlewnia i Wielka Kuźnia (`epokaWejscia` = 4, `production.ts:966`), Teatr (`suppressed`, `buildings.json:1735`). Biblioteka obiecuje Obserwatorium na poziomie 6 przy `maksPoziom` = 2 (`buildings.json:750,797`). Kuźnie obiecują „do +45%” — realny sufit +30%.
11. **Pola martwe w danych** (nie pokazywać): `przyrost` przy `maksPoziom` = 1 (uwagi wielu budynków), `baza.mnoznik` Akademii (brak w ścieżkach `unit-building-bonuses.ts:9-33`), `spichlerz_pojemnosc_zapasow_panstwa` (`econ-params.json:171`, brak konsumenta), flagi `maFort`/`maBaszta` (`cities.ts:828-842`, nieczytane).

---

## 4. Reguły redakcyjne TOP 5 (dla budynków)

1. Pozycja = tytuł z liczbą (≤ ~55 znaków) + jedno zdanie wyjaśnienia (decyzja pkt 1).
2. Zasięg w tytule albo zdaniu: „w mieście”, „w stolicy”, „w całym państwie”, „jednostek (na stałe)”.
3. Gdy wartość rośnie z epoką (`maksPoziom` > 1), tytuł podaje wartość z epoki wejścia i kolejne („+5 Pracy (8 w Brązie, 11 w Żelazie)”).
4. Zakaz pozycji typu „Wymaga…”, „Otwiera [technologię]…”, „Niski koszt…”, „Koniec łańcucha…”. Warunek innego obiektu wolno pokazać tylko jako realną korzyść dalszą (R-B1), z liczbą celu („Warunek Akweduktu (limit 20)”).
5. Szczęście = ryczałt +1 + `zadowolenie` tylko dla budynków `dajeSzczescie: true` (`economy.ts:509-535`) — tak liczone w tytułach (np. Spichlerz +5).
6. Nazwy dokładnie z `buildings.json` w poprawnej odmianie.

---

## 5. Wyniki — TOP 5 (43/43: 40 z TOP, 3 × NIE_USTALONO — budynek niedostępny)

Pełne drabinki: `turnieje/<id>.md`; zdania i dowody `plik:linia` per pozycja: `budynki-top5.csv` (kolumny `Top1_GLOWNA`…`Top5`, `Dowod_plik_linia`). Status: **FINALNE (Final Control r1, baza d36f8b3b0)** — patrz §13. Pozycji razem 123 (r1: 120); 6 budynków ma pełne 5 pozycji, reszta mniej (tylko realne efekty).

<!-- TABELA_TOP -->

| Budynek | Top1 — GŁÓWNA KORZYŚĆ | Top2 | Top3 | Top4 | Top5 |
|---|---|---|---|---|---|
| Stolarnia | +10% drewna w całym państwie | +5 Pracy w mieście (8 w Brązie, 11 w Żelazie) | — | — | — |
| Warsztat kamieniarski | +10% kamienia w całym państwie | +4 Pracy w mieście (6 w Brązie, 8 w Żelazie) | — | — | — |
| Kuźnia brązu | +15% Pancerza jednostek (na stałe) | Rozbudowa do Kuźni żelaza: Pancerz do +30% | +6 Pracy i +1 pieniądza w mieście | — | — |
| Odlewnia brązu | Wytapia brąz: do 50 sztuk na turę | Warunek badania Hutnictwa żelaza | Rozbudowa do Odlewni żelaza: żelazo i +12 Pracy | +5 Pracy w mieście | — |
| Odlewnia żelaza | Wytapia żelazo: do 50 sztuk na turę (i nadal brąz) | +12 Pracy i +1 pieniądza w mieście | — | — | — |
| Wielka odlewnia | NIE_USTALONO — niedostępny | — | — | — | — |
| Targowisko (Rynek) | +5 pieniądza w mieście (8 w Brązie, 11 w Żelazie) | +50% dochodu z tras handlowych miasta | Zamiana Pracy na podatek 1:1 w całym państwie | +1 trasa handlowa i premia 5% trasy | Warunek Mennicy (stolica) i Emporionu |
| Port handlowy | +5 pieniądza i +1 Pracy w mieście | +1 trasa handlowa i premia 5% trasy | +1 pieniądza za każdą trasę morską ponad pierwszą | Rozbudowa do Portu wielkiego: +10 pieniądza | +1 Szczęścia w mieście |
| Port wielki | +10 pieniądza i +2 Pracy w mieście (Port: +5) | Zachowuje trasę handlową i premię morską Portu | +1 Szczęścia w mieście | — | — |
| Spichlerz | Limit ludności miasta 5 → 8 | +1000 pojemności spichlerza państwa | −25% kosztu racji żywnościowej w mieście | +2 żywności i +5 Szczęścia w mieście | Rozbudowa do Spichlerza Królewskiego: limit 12 |
| Spichlerz Królewski | Limit ludności miasta 8 → 12 | −50% kosztu racji żywnościowej (Spichlerz: −25%) | +1500 pojemności spichlerza państwa (zamiast 1000) | +3 żywności i +5 Szczęścia w mieście | +10 zdrowia w mieście (Spichlerz: +5) |
| Garncarnia | Wytwarza ceramikę: do 50 sztuk na turę | Otwiera Spichlerz w każdym mieście (limit 5 → 8) | +10% żywności w mieście | +3 Pracy w mieście (5 w Brązie, 7 w Żelazie) | — |
| Cegielnia | Wytwarza cegłę: 50 cykli × 2 cegły na turę | +25% Pracy z terenu miasta | Warunek badania Pisma i Religii | +4 Pracy w mieście (6 w Żelazie) | — |
| Kamienne kręgi | Religia +2% na turę w mieście | +1 Kultury i +2 Szczęścia (rośnie z epoką) | Warunek Świątyni (+4% religii na turę) | — | — |
| Świątynia | Religia +4% na turę w mieście | Religia sięga 2 sąsiednich miast na turę (zamiast 1) | +2 Kultury i +3 Szczęścia (rośnie z epoką) | — | — |
| Biblioteka | +30% Nauki miasta | +3 Nauki i +2 Kultury (5 i 3 w Żelazie) | Asymilacja kultury +2% na turę | Warunek Akademii i badania Filozofii | +1 Szczęścia w mieście |
| Studnia | +2 zdrowia i koniec kary −2 za brak wody | Warunek Akweduktu (limit 20) i Łaźni | Warunek badania Medycyny | +2 Szczęścia w mieście (rośnie z epoką) | — |
| Akwedukt | Limit ludności miasta do 20 | +4 zdrowia w mieście | +3 Szczęścia w mieście (rośnie z epoką) | — | — |
| Mennica | ×1,5 podatku w każdym mieście państwa | +3 pieniądza w stolicy (5 w Żelazie) | — | — | — |
| Palisada drewniana | +100% Obrony obrońców miasta | Miasto trzeba oblegać — wróg nie wejdzie z marszu | — | — | — |
| Mury | +200% Obrony obrońców miasta | Miasto trzeba oblegać — wróg nie wejdzie z marszu | Warunek Cytadeli i Baszty (razem +400%) | — | — |
| Koszary | Rekrutacja wojska epoki Brązu i Żelaza | +20% parametrów bojowych jednostek (na stałe) | Warunek Warsztatu, Akademii wojskowej i 2 badań | +2 Pracy w mieście (3 w Żelazie) | — |
| Emporion | +8 pieniądza w mieście | +1 trasa handlowa i premia 5% trasy | — | — | — |
| Magazyn | +20% pojemności magazynu państwa | +1 Pracy i +1 pieniądza (po 2 w Żelazie) | — | — | — |
| Stela / Pomnik | +1 Kultury i +1 Szczęścia, bez utrzymania | Asymilacja kultury +0,5% na turę | — | — | — |
| Pałac | +35 pkt Prawa w stolicy | −30% korupcji w stolicy | Asymilacja kultury +2% na turę | +5 Kultury i +3 Szczęścia w stolicy | Rozbudowa do Pałacu II: Prawo 45, Kultura 8 |
| Pałac II | Prawo stolicy 35 → 45 pkt | +8 Kultury i +4 Szczęścia w stolicy | Asymilacja kultury +2% na turę (zachowana) | Rozbudowa do Pałacu III: Prawo 55, Kultura 11 | — |
| Pałac III | Prawo stolicy 45 → 55 pkt | +11 Kultury i +6 Szczęścia w stolicy | Asymilacja kultury +2% na turę (zachowana) | — | — |
| Kuźnia żelaza | Pancerz jednostek do +30% (brąz + żelazo) | Warunek badania Obróbki żelaza | +8 Pracy i +2 pieniądza w mieście | — | — |
| Wielka Kuźnia | NIE_USTALONO — niedostępny | — | — | — | — |
| Cytadela | +100% Obrony ponad Mury (razem +300%) | — | — | — | — |
| Baszta | +100% Obrony (z Murami i Cytadelą razem +400%) | — | — | — | — |
| Warsztat oblężniczy | +10% parametrów jednostek (z Koszarami +30%) | +4 Pracy i +2 pieniądza w mieście | — | — | — |
| Akademia | +20% Nauki miasta (z Biblioteką razem +50%) | +6 Nauki, +5 Kultury i +4 Szczęścia | Asymilacja kultury +1% na turę | — | — |
| Teatr | NIE_USTALONO — niedostępny | — | — | — | — |
| Sąd | −30% korupcji w mieście | +19 pkt Prawa w mieście | Asymilacja kultury +2% na turę | +5 Kultury, +2 pieniądza i +3 Szczęścia | — |
| Dom Starszyzny | +28 pkt Prawa w mieście regionalnym | Rozbudowa do Dworu Zarządcy: 33 pkt Prawa | +1 Pracy, +1 pieniądza i +2 Kultury | — | — |
| Dwór Zarządcy | Prawo miasta regionalnego 28 → 33 pkt | Rozbudowa do Pretorium: −30% korupcji i 38 Prawa | +2 pieniądza, +3 Kultury i +1 Pracy | — | — |
| Pretorium | −30% korupcji w mieście regionalnym | Prawo miasta 33 → 38 pkt | +3 pieniądza, +5 Kultury i +2 Pracy | — | — |
| Trybunał | +17 pkt Prawa w mieście | +1 pieniądza i +2 Szczęścia (rośnie z epoką) | — | — | — |
| Garnizon | Milicja: 1 obrońca na mieszkańca przy ataku | +25 pkt Prawa (35 w Brązie, 47 w Żelazie) | — | — | — |
| Łaźnia publiczna | +5 zdrowia w mieście | +3 Kultury, +4 Szczęścia i +1 żywności | Asymilacja kultury +1% na turę | — | — |
| Akademia wojskowa | +20% parametrów jednostek (z Koszarami +40%) | +3 Pracy i +2 pieniądza w mieście | — | — | — |

<!-- /TABELA_TOP -->

## 6. „Co możesz teraz zrobić” — propozycja (dziś sekcji brak na karcie budynku)

<!-- TABELA_CMZ -->

| Budynek | „Co możesz teraz zrobić” — PROPOZYCJA |
|---|---|
| Stolarnia | Zbuduj Stolarnię, aby zwiększyć wydobycie drewna całego państwa o 10%. |
| Warsztat kamieniarski | Zbuduj Warsztat kamieniarski, aby zwiększyć wydobycie kamienia całego państwa o 10%. |
| Kuźnia brązu | Zbuduj Kuźnię brązu, aby dać jednostkom trwale +15% Pancerza.<br>Rozbuduj ją do Kuźni żelaza (Hutnictwo żelaza), aby podnieść Pancerz jednostek do +30%. |
| Odlewnia brązu | Zbuduj Odlewnię brązu, aby wytwarzać brąz potrzebny do wojska epoki Brązu.<br>Rozbuduj ją do Odlewni żelaza (Hutnictwo żelaza), aby wytwarzać także żelazo. |
| Odlewnia żelaza | Rozbuduj Odlewnię brązu do Odlewni żelaza, aby wytwarzać żelazo dla wojska epoki Żelaza. |
| Wielka odlewnia | NIE_USTALONO — budynek dziś niedostępny; sekcji nie pokazywać (karta do ukrycia). |
| Targowisko (Rynek) | Zbuduj Targowisko, aby dać miastu 5 pieniądza.<br>Zbuduj w stolicy Mennicę (Waluta), aby pomnożyć podatek wszystkich miast ×1,5. |
| Port handlowy | Zbuduj Port handlowy w mieście nad wodą, aby dać miastu 5 pieniądza.<br>Rozbuduj go do Portu wielkiego (Inżynieria), aby podwoić dochód portu (+10 pieniądza). |
| Port wielki | Rozbuduj Port handlowy do Portu wielkiego, aby podwoić dochód portu (+10 pieniądza). |
| Spichlerz | Zbuduj Spichlerz, aby podnieść limit ludności miasta z 5 do 8.<br>Rozbuduj go do Spichlerza Królewskiego (Pismo, sól), aby podnieść limit ludności miasta z 8 do 12. |
| Spichlerz Królewski | Rozbuduj Spichlerz do Spichlerza Królewskiego, aby podnieść limit ludności miasta z 8 do 12. |
| Garncarnia | Zbuduj Garncarnię, aby wytwarzać ceramikę dla Spichlerzy.<br>Zbuduj w miastach Spichlerze, aby podnieść limit ludności miast z 5 do 8. |
| Cegielnia | Zbuduj Cegielnię, aby wytwarzać cegłę na budynki epoki Żelaza. |
| Kamienne kręgi | Zbuduj Kamienne kręgi, aby szerzyć swoją religię o 2% na turę.<br>Zbuduj obok Świątynię (Religia), aby szerzyć religię o kolejne 4% na turę. |
| Świątynia | Zbuduj Świątynię, aby szerzyć swoją religię o 4% na turę. |
| Biblioteka | Zbuduj Bibliotekę, aby zwiększyć Naukę miasta o 30%.<br>Zbuduj obok Akademię (Filozofia), aby zwiększyć Naukę miasta o kolejne 20%. |
| Studnia | Zbuduj Studnię, aby dać miastu czystą wodę (+2 zdrowia, bez kary −2).<br>Zbuduj obok Akwedukt (Budownictwo), aby podnieść limit ludności miasta do 20. |
| Akwedukt | Zbuduj Akwedukt, aby podnieść limit ludności miasta do 20. |
| Mennica | Zbuduj Mennicę w stolicy, aby pomnożyć podatek wszystkich miast ×1,5. |
| Palisada drewniana | Zbuduj Palisadę drewnianą, aby podwoić obronę miasta (+100% Obrony). |
| Mury | Zbuduj Mury, aby potroić obronę miasta (+200% Obrony).<br>Zbuduj Cytadelę i Basztę (Inżynieria), aby podnieść obronę miasta do +400%. |
| Koszary | Zbuduj Koszary, aby rekrutować wojsko epoki Brązu i Żelaza.<br>Zbuduj obok Akademię wojskową (Sztuka wojenna), aby wzmocnić jednostki o kolejne +20%. |
| Emporion | Zbuduj Emporion, aby dać miastu 8 pieniądza. |
| Magazyn | Zbuduj Magazyn, aby zwiększyć pojemność magazynu państwa o 20%. |
| Stela / Pomnik | Postaw Stelę, aby zyskać Kulturę bez kosztów utrzymania. |
| Pałac | Zbuduj Pałac w stolicy, aby zapewnić stolicy 35 pkt Prawa.<br>Rozbuduj go do Pałacu II (epoka Brązu), aby podnieść Prawo stolicy do 45 i Kulturę do 8. |
| Pałac II | Rozbuduj Pałac do Pałacu II, aby podnieść Prawo stolicy do 45 pkt.<br>Rozbuduj go do Pałacu III (epoka Żelaza), aby podnieść Prawo stolicy do 55 i Kulturę do 11. |
| Pałac III | Rozbuduj Pałac II do Pałacu III, aby podnieść Prawo stolicy do 55 pkt. |
| Kuźnia żelaza | Rozbuduj Kuźnię brązu do Kuźni żelaza, aby podnieść Pancerz jednostek do +30%. |
| Wielka Kuźnia | NIE_USTALONO — budynek dziś niedostępny; sekcji nie pokazywać (karta do ukrycia). |
| Cytadela | Zbuduj Cytadelę, aby podnieść obronę miasta do +300%. |
| Baszta | Zbuduj Basztę, aby podnieść obronę miasta do +400%. |
| Warsztat oblężniczy | Zbuduj Warsztat oblężniczy, aby wzmocnić jednostki o kolejne +10%. |
| Akademia | Zbuduj Akademię, aby zwiększyć Naukę miasta o kolejne 20%. |
| Teatr | NIE_USTALONO — budynek dziś niedostępny; sekcji nie pokazywać (karta do ukrycia). |
| Sąd | Zbuduj Sąd, aby obniżyć korupcję w mieście o 30%. |
| Dom Starszyzny | Zbuduj Dom Starszyzny w mieście regionalnym, aby zapewnić miastu 28 pkt Prawa.<br>Rozbuduj go do Dworu Zarządcy (Kodeks), aby podnieść Prawo miasta do 33 pkt. |
| Dwór Zarządcy | Rozbuduj Dom Starszyzny do Dworu Zarządcy, aby podnieść Prawo miasta do 33 pkt.<br>Rozbuduj go do Pretorium (Prawo), aby obniżyć korupcję miasta o 30%. |
| Pretorium | Rozbuduj Dwór Zarządcy do Pretorium, aby obniżyć korupcję miasta o 30%. |
| Trybunał | Zbuduj Trybunał, aby dodać miastu 17 pkt Prawa. |
| Garnizon | Zbuduj Garnizon w mieście regionalnym, aby bronić miasta milicją (1 obrońca na mieszkańca). |
| Łaźnia publiczna | Zbuduj Łaźnię publiczną, aby podnieść zdrowie miasta o 5. |
| Akademia wojskowa | Zbuduj Akademię wojskową, aby wzmocnić jednostki o kolejne +20%. |

<!-- /TABELA_CMZ -->

## 7. Porównanie ze starym `top3` (zachowane / usunięte / dodane)

Legenda: ZACHOWANE = ten sam efekt jest w nowym TOP 5 (z liczbą i poprawionym zdaniem); USUNIĘTE — warunek/wymaganie/ogólnik; USUNIĘTE — efekt martwy/nieprawdziwy; DODANE = nowa pozycja TOP 5 bez odpowiednika w starym `top3`.

<!-- TABELA_POROWNANIE -->

| Budynek | Dzisiejszy top3 → los pozycji | Dodane do TOP 5 |
|---|---|---|
| Stolarnia | 1. Wzrost Pracy → ZACHOWANE (w nowym TOP 5)<br>2. Wymaga zapasu drewna → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Otwiera Obróbkę drewna → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | +10% drewna w całym państwie |
| Warsztat kamieniarski | 1. Wzrost Pracy → ZACHOWANE (w nowym TOP 5)<br>2. Wymaga dostępu do kamienia → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Otwiera Murarstwo → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | +10% kamienia w całym państwie |
| Kuźnia brązu | 1. Wzrost Pracy i dochodu → ZACHOWANE (w nowym TOP 5)<br>2. Bonus do Pancerza → ZACHOWANE (w nowym TOP 5)<br>3. Wymaga rudy miedzi → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | Rozbudowa do Kuźni żelaza: Pancerz do +30% |
| Odlewnia brązu | 1. Wzrost Pracy → ZACHOWANE (w nowym TOP 5)<br>2. Wytapia brąz → ZACHOWANE (w nowym TOP 5)<br>3. Pierwszy stopień łańcucha odlewni → ZACHOWANE (w nowym TOP 5) | Warunek badania Hutnictwa żelaza |
| Odlewnia żelaza | 1. Wysoka Praca → ZACHOWANE (w nowym TOP 5)<br>2. Dwa surowce naraz → ZACHOWANE (w nowym TOP 5)<br>3. Krok ku Wielkiej odlewni → USUNIĘTE — efekt martwy/nieprawdziwy | — |
| Wielka odlewnia | 1. Bardzo wysoka Praca → USUNIĘTE — efekt martwy/nieprawdziwy<br>2. Trzy metale naraz → USUNIĘTE — efekt martwy/nieprawdziwy<br>3. Wymaga dostępu do stali → USUNIĘTE — efekt martwy/nieprawdziwy | — |
| Targowisko (Rynek) | 1. Wzrost dochodu → ZACHOWANE (w nowym TOP 5)<br>2. Niski koszt wejścia → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Otwiera Wymianę → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | +50% dochodu z tras handlowych miasta<br>Zamiana Pracy na podatek 1:1 w całym państwie<br>+1 trasa handlowa i premia 5% trasy<br>Warunek Mennicy (stolica) i Emporionu |
| Port handlowy | 1. Wzrost dochodu → ZACHOWANE (w nowym TOP 5)<br>2. Wymaga dostępu do wody → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Otwiera Żeglugę i dalszy rozwój → ZACHOWANE (w nowym TOP 5) | +1 trasa handlowa i premia 5% trasy<br>+1 pieniądza za każdą trasę morską ponad pierwszą<br>+1 Szczęścia w mieście |
| Port wielki | 1. Wysoki dochód → ZACHOWANE (w nowym TOP 5)<br>2. Rozbudowa portu handlowego → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Otwiera Inżynierię → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | Zachowuje trasę handlową i premię morską Portu<br>+1 Szczęścia w mieście |
| Spichlerz | 1. Żywność i zadowolenie → ZACHOWANE (w nowym TOP 5)<br>2. Wymaga ceramiki → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Podnosi limit populacji → ZACHOWANE (w nowym TOP 5) | +1000 pojemności spichlerza państwa<br>−25% kosztu racji żywnościowej w mieście<br>Rozbudowa do Spichlerza Królewskiego: limit 12 |
| Spichlerz Królewski | 1. Więcej żywności i zadowolenia → ZACHOWANE (w nowym TOP 5)<br>2. Wymaga ceramiki i soli → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Wyższy limit populacji i armii → ZACHOWANE (w nowym TOP 5) | −50% kosztu racji żywnościowej (Spichlerz: −25%)<br>+1500 pojemności spichlerza państwa (zamiast 1000)<br>+10 zdrowia w mieście (Spichlerz: +5) |
| Garncarnia | 1. Wzrost Pracy → ZACHOWANE (w nowym TOP 5)<br>2. Wytapia ceramikę → ZACHOWANE (w nowym TOP 5)<br>3. Wymaga gliny i otwiera Garncarstwo → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | Otwiera Spichlerz w każdym mieście (limit 5 → 8)<br>+10% żywności w mieście |
| Cegielnia | 1. Wzrost Pracy → ZACHOWANE (w nowym TOP 5)<br>2. Wytapia cegłę → ZACHOWANE (w nowym TOP 5)<br>3. Brama do Pisma → ZACHOWANE (w nowym TOP 5) | +25% Pracy z terenu miasta |
| Kamienne kręgi | 1. Kultura i zadowolenie → ZACHOWANE (w nowym TOP 5)<br>2. Przyspiesza konwersję religijną → ZACHOWANE (w nowym TOP 5)<br>3. Otwiera Mistycyzm → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | Warunek Świątyni (+4% religii na turę) |
| Świątynia | 1. Kultura i zadowolenie → ZACHOWANE (w nowym TOP 5)<br>2. Przyspiesza konwersję religijną → ZACHOWANE (w nowym TOP 5)<br>3. Wymaga Kamiennych kręgów → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | Religia sięga 2 sąsiednich miast na turę (zamiast 1) |
| Biblioteka | 1. Wzrost Nauki → ZACHOWANE (w nowym TOP 5)<br>2. Wzrost Kultury → ZACHOWANE (w nowym TOP 5)<br>3. Otwiera Pismo → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | +30% Nauki miasta<br>Asymilacja kultury +2% na turę<br>Warunek Akademii i badania Filozofii<br>+1 Szczęścia w mieście |
| Studnia | 1. Wzrost zadowolenia → ZACHOWANE (w nowym TOP 5)<br>2. Otwiera drogę do Akweduktu → ZACHOWANE (w nowym TOP 5)<br>3. Otwiera Gospodarkę wodną → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | +2 zdrowia i koniec kary −2 za brak wody<br>Warunek badania Medycyny |
| Akwedukt | 1. Wzrost zadowolenia → ZACHOWANE (w nowym TOP 5)<br>2. Wymaga Studni → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Otwiera Budownictwo → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | Limit ludności miasta do 20<br>+4 zdrowia w mieście |
| Mennica | 1. Wzrost dochodu → ZACHOWANE (w nowym TOP 5)<br>2. Wymaga złota i Targowiska → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Otwiera Walutę → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | ×1,5 podatku w każdym mieście państwa |
| Palisada drewniana | 1. Bonus obrony miasta → ZACHOWANE (w nowym TOP 5)<br>2. Zastępowana przez Mury → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Otwiera Obróbkę drewna → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | Miasto trzeba oblegać — wróg nie wejdzie z marszu |
| Mury | 1. Bonus obrony miasta → ZACHOWANE (w nowym TOP 5)<br>2. Współpracuje z Basztą → ZACHOWANE (w nowym TOP 5)<br>3. Otwiera Budownictwo → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | Miasto trzeba oblegać — wróg nie wejdzie z marszu |
| Koszary | 1. Wzrost Pracy → ZACHOWANE (w nowym TOP 5)<br>2. Wzmacnia jednostki → ZACHOWANE (w nowym TOP 5)<br>3. Otwiera Wojskowość → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | Rekrutacja wojska epoki Brązu i Żelaza<br>Warunek Warsztatu, Akademii wojskowej i 2 badań |
| Emporion | 1. Dalekosiężna wymiana → ZACHOWANE (w nowym TOP 5)<br>2. +5% handlu → ZACHOWANE (w nowym TOP 5)<br>3. Dodatkowa linia handlowa → ZACHOWANE (w nowym TOP 5) | — |
| Magazyn | 1. Wzrost Pracy i dochodu → ZACHOWANE (w nowym TOP 5)<br>2. Niski koszt utrzymania → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Otwiera Handel → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | +20% pojemności magazynu państwa |
| Stela / Pomnik | 1. Wzrost Kultury → ZACHOWANE (w nowym TOP 5)<br>2. Brak kosztów utrzymania → ZACHOWANE (w nowym TOP 5)<br>3. Otwiera Murarstwo → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | Asymilacja kultury +0,5% na turę |
| Pałac | 1. Kultura i zadowolenie → ZACHOWANE (w nowym TOP 5)<br>2. Wyłącznie w stolicy → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Otwiera rozbudowę do Pałacu II → ZACHOWANE (w nowym TOP 5) | +35 pkt Prawa w stolicy<br>−30% korupcji w stolicy<br>Asymilacja kultury +2% na turę |
| Pałac II | 1. Kultura i zadowolenie → ZACHOWANE (w nowym TOP 5)<br>2. Wymaga awansu z Pałacu I → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Otwiera rozbudowę do Pałacu III → ZACHOWANE (w nowym TOP 5) | Prawo stolicy 35 → 45 pkt<br>Asymilacja kultury +2% na turę (zachowana) |
| Pałac III | 1. Kultura i zadowolenie → ZACHOWANE (w nowym TOP 5)<br>2. Wymaga awansu z Pałacu II → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Koniec obecnego łańcucha → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | Prawo stolicy 45 → 55 pkt<br>Asymilacja kultury +2% na turę (zachowana) |
| Kuźnia żelaza | 1. Wysoka produkcja → ZACHOWANE (w nowym TOP 5)<br>2. Wzmacnia pancerz jednostek → ZACHOWANE (w nowym TOP 5)<br>3. Wymaga dostępu do żelaza → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | Warunek badania Obróbki żelaza |
| Wielka Kuźnia | 1. Stała produkcja pracy i pieniędzy → USUNIĘTE — efekt martwy/nieprawdziwy<br>2. Wzmocnienie pancerza → USUNIĘTE — efekt martwy/nieprawdziwy<br>3. Wymaga stali → USUNIĘTE — efekt martwy/nieprawdziwy | — |
| Cytadela | 1. Dodatkowa obrona miasta → ZACHOWANE (w nowym TOP 5)<br>2. Wymaga Murów → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Odblokowana przez Inżynierię → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | — |
| Baszta | 1. Dodatkowa obrona miasta → ZACHOWANE (w nowym TOP 5)<br>2. Wymaga Murów → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Niezależna budowla → ZACHOWANE (w nowym TOP 5) | — |
| Warsztat oblężniczy | 1. Odblokowuje Katapultę → USUNIĘTE — efekt martwy/nieprawdziwy<br>2. Wzmocnienie jednostek → ZACHOWANE (w nowym TOP 5)<br>3. Wymaga Koszar → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | +4 Pracy i +2 pieniądza w mieście |
| Akademia | 1. Nauka i kultura miasta → ZACHOWANE (w nowym TOP 5)<br>2. Zadowolenie mieszkańców → ZACHOWANE (w nowym TOP 5)<br>3. Wymaga Biblioteki → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | +20% Nauki miasta (z Biblioteką razem +50%)<br>Asymilacja kultury +1% na turę |
| Teatr | 1. Kultura miasta → USUNIĘTE — efekt martwy/nieprawdziwy<br>2. Zadowolenie mieszkańców → USUNIĘTE — efekt martwy/nieprawdziwy<br>3. Wliczony w Akademię → USUNIĘTE — efekt martwy/nieprawdziwy | — |
| Sąd | 1. Kultura i zadowolenie → ZACHOWANE (w nowym TOP 5)<br>2. Ograniczenie korupcji → ZACHOWANE (w nowym TOP 5)<br>3. Odblokowany przez Prawo → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | +19 pkt Prawa w mieście<br>Asymilacja kultury +2% na turę |
| Dom Starszyzny | 1. Podstawa porządku prawnego → ZACHOWANE (w nowym TOP 5)<br>2. Niewielka produkcja → ZACHOWANE (w nowym TOP 5)<br>3. Początek łańcucha administracji → ZACHOWANE (w nowym TOP 5) | — |
| Dwór Zarządcy | 1. Wyższy porządek prawny → ZACHOWANE (w nowym TOP 5)<br>2. Większa produkcja → ZACHOWANE (w nowym TOP 5)<br>3. Wymaga ulepszenia → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | Rozbudowa do Pretorium: −30% korupcji i 38 Prawa |
| Pretorium | 1. Najwyższy porządek prawny → ZACHOWANE (w nowym TOP 5)<br>2. Największa produkcja w łańcuchu → ZACHOWANE (w nowym TOP 5)<br>3. Wymaga ulepszenia → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | −30% korupcji w mieście regionalnym |
| Trybunał | 1. Dochód i zadowolenie → ZACHOWANE (w nowym TOP 5)<br>2. Wczesny porządek administracyjny → USUNIĘTE — efekt martwy/nieprawdziwy<br>3. Odblokowany przez Kodeks → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | +17 pkt Prawa w mieście |
| Garnizon | 1. Stałe źródło Prawa → ZACHOWANE (w nowym TOP 5)<br>2. Poza łańcuchem administracji → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)<br>3. Przetrwa podbój → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | Milicja: 1 obrońca na mieszkańca przy ataku |
| Łaźnia publiczna | 1. Zadowolenie i kultura → ZACHOWANE (w nowym TOP 5)<br>2. Niewielki dodatek żywności → ZACHOWANE (w nowym TOP 5)<br>3. Wymaga Studni → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | +5 zdrowia w mieście<br>Asymilacja kultury +1% na turę |
| Akademia wojskowa | 1. Wzmocnienie jednostek → ZACHOWANE (w nowym TOP 5)<br>2. Dodatkowa produkcja → ZACHOWANE (w nowym TOP 5)<br>3. Wymaga Koszar → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane) | — |

<!-- /TABELA_POROWNANIE -->

## 8. Efekty martwe / niedostępne — „ukryć do czasu naprawy” (decyzja pkt 3)

<!-- TABELA_MARTWE -->

| Budynek | Efekt do ukrycia | Powód | Dowód |
|---|---|---|---|
| Kuźnia brązu | „maksymalnie do +45%” z Wielką Kuźnią | Wielka Kuźnia ma epokaWejscia=4 — w grze z 3 epokami niedostępna; realny sufit to +30%. | gra/data/buildings.json:1448; gra/src/game/production.ts:966 |
| Odlewnia żelaza | „Krok ku Wielkiej odlewni” | Wielka odlewnia ma epokaWejscia=4 — dziś niedostępna. | gra/data/buildings.json:253; gra/src/game/production.ts:966 |
| Wielka odlewnia | Cały budynek (stal, +18 Pracy, +3 pieniądza) | epokaWejscia=4 (PARKOWANE), production.ts:966 blokuje budynki z epoki wyższej niż epoka miasta — w grze z 3 epokami nie da się go zbudować. | gra/data/buildings.json:253; gra/src/game/production.ts:966; gra/src/game/converters.ts:100-102 |
| Spichlerz | „pojemność zapasów armii 100 na Spichlerz” | Klucz spichlerz_pojemnosc_zapasow_panstwa nie ma konsumenta w gra/src (grep) — nie pokazywać. | gra/data/econ-params.json:171-177 |
| Spichlerz | „po wzroście miasto zachowuje 50% zapasu żywności” | Obrona r1: działa tylko w populationGrowth (economy.ts:1107), które nie ma wywołania w gra/src (grep „populationGrowth(”); żywy wzrost to applyFractionalGrowthV85 — ułamek wzrostu bez bufora, nic się nie zeruje ani nie zachowuje — nie pokazywać. | gra/src/game/economy.ts:1099; gra/src/game/economy.ts:1150-1155; gra/src/game/population-growth-v85.ts:306-342 |
| Spichlerz Królewski | „po wzroście miasto zachowuje 70% zapasu żywności” | Obrona r1 (zarzut Evaluatora 1): stała 0,7 żyje tylko w populationGrowth (economy.ts:1107), które nie ma wywołania w gra/src (grep „populationGrowth(”); żywy wzrost to applyFractionalGrowthV85 bez bufora — nie pokazywać. | gra/src/game/economy.ts:1150-1155; gra/src/game/population-growth-v85.ts:306-342 |
| Biblioteka | Obserwatorium (poziom 6, wymaga Astronomii) | maksPoziom Biblioteki = 2 — poziom 6 nieosiągalny; Astronomia nic nie odblokowuje. | gra/data/buildings.json:750; gra/data/buildings.json:797; gra/src/game/production.ts:252-271 |
| Mennica | budynek_mennica_mnoznik / waluta_mnoznik (parametry legacy) | Opis w econ-params: „nieużywany przez bieżący kod” — nie pokazywać jako efektu. | gra/data/econ-params.json:313-319; gra/data/econ-params.json:334-340 |
| Pałac II | −30% korupcji Pałacu I znika po rozbudowie | KORUPCJA_REDUKCJA_BUDYNKI zawiera tylko id „palac”, a rozbudowa usuwa je z listy budynków — Pałac II/III traci redukcję korupcji (prawdopodobny błąd, osobny temat). | gra/src/game/economy.ts:1226; gra/src/game/production.ts:820-838 |
| Pałac III | −30% korupcji Pałacu I znika po rozbudowie | jak Pałac II — redukcja liczy tylko id „palac”. | gra/src/game/economy.ts:1226; gra/src/game/production.ts:820-838 |
| Kuźnia żelaza | „maksymalnie do +45%” z Wielką Kuźnią | Wielka Kuźnia ma epokaWejscia=4 — niedostępna. | gra/data/buildings.json:1448; gra/src/game/production.ts:966 |
| Wielka Kuźnia | Cały budynek (+15% Pancerza, +20 Pracy, +5 pieniądza) | epokaWejscia=4 (PARKOWANE) — w grze z 3 epokami nie do zbudowania. | gra/data/buildings.json:1448; gra/src/game/production.ts:966 |
| Warsztat oblężniczy | „Odblokowuje Katapultę w tym mieście” | Flaga maWarsztatOblezniczy to REZERWA (cities.ts:845) — production.ts jej nie sprawdza; Katapulta wymaga tylko technologii, żelaza i Koszar. | gra/data/buildings.json:1631; gra/src/game/cities.ts:843-850; gra/src/game/production.ts:1068-1076 |
| Akademia | baza.mnoznik 10 (+3 na poziom) | Akademia nie należy do żadnej ścieżki mnożnika (unit-building-bonuses.ts) ani do premii nauki (ta idzie z econ-params.json:327) — pole martwe. | gra/data/buildings.json:1645; gra/src/game/unit-building-bonuses.ts:9-33 |
| Teatr | Cały budynek (+4 Kultury, +3 zadowolenia) | suppressed=true — nie da się go zbudować; asymilację kultury „Teatru” daje dziś Akademia (conquest-stability.ts:65). | gra/data/buildings.json:1693; gra/data/buildings.json:1735 |
| Trybunał | „Ogranicza korupcję jeszcze zanim miasto zbuduje Sąd” | Trybunału nie ma w KORUPCJA_REDUKCJA_BUDYNKI (economy.ts:1226) — nie zmniejsza korupcji; realny efekt to Prawo +17. | gra/src/game/economy.ts:1225-1250 |
| Akademia wojskowa | „bramka elit UNITS” (uwagi) | production.ts nie ma bramki akademia_wojskowa dla jednostek (grep) — nie pokazywać. | gra/data/buildings.json:2082; gra/src/game/production.ts:1068-1076 |

<!-- /TABELA_MARTWE -->

Dodatkowo do osobnego tematu danych (nie na kartę): pola `przyrost` przy `maksPoziom` = 1 (Kuźnia brązu, Odlewnie, Port, Port wielki, Spichlerze, Emporion, Pałace, Kuźnia żelaza — opisane w `uwagi` jako „martwe”), flagi `maFort`/`maBaszta` (`cities.ts:828-842`).

---

## 9. Pięć najgorszych dzisiejszych kart budynków (co widzi gracz)

| # | Budynek | Dzisiejszy `top3` (cytat) | Czego brakuje / co jest nieprawdą |
|---|---|---|---|
| 1 | **Mennica** (`buildings.json:937`) | „Wzrost dochodu — Dodaje 3 punkty pieniądza, rosnące o kolejne 2 z każdym poziomem rozbudowy.” · „Wymaga złota i Targowiska — …” · „Otwiera Walutę — …” | **×1,5 podatku w każdym mieście państwa** (`econ-params.json:585-591`, `economy.ts:952-955`) — największy bonus ekonomiczny gry; 2 z 3 pozycji to warunki. |
| 2 | **Koszary** (`:1083`) | „Wzrost Pracy — Dodaje 2 punkty Pracy…” · „Wzmacnia jednostki — Daje +20%…” · „Otwiera Wojskowość — …” | Bez Koszar **brak rekrutacji wojska Brązu i Żelaza** (`production.ts:1068-1076`). Top1 to +2 Pracy. |
| 3 | **Warsztat oblężniczy** (`:1638`) | „Odblokowuje Katapultę — Umożliwia budowę Katapulty w tym mieście.” · „Wzmocnienie jednostek — …” · „Wymaga Koszar — …” | Top1 **nieprawdziwy** (flaga REZERWA, `cities.ts:845`); realnie +10% parametrów jednostek. |
| 4 | **Akwedukt** (`:889`) | „Wzrost zadowolenia — Dodaje 2 punkty zadowolenia…” · „Wymaga Studni — …” · „Otwiera Budownictwo — …” | **Limit ludności 20** (`econ-params.json:45-51`) i +4 zdrowia — oba nieobecne. |
| 5 | **Garnizon** (`:2027`) | „Stałe źródło Prawa — …” · „Poza łańcuchem administracji — …” · „Przetrwa podbój — …” | **Milicja 1 obrońca na mieszkańca** (`combat-params.json:51-58`) i liczba Prawa 25/35/47 (`society-params.json:837-843`). |

Kolejne w rankingu: Trybunał (nieprawdziwe „ogranicza korupcję”), Targowisko (brak +50% tras), Biblioteka (brak +30% Nauki), Cegielnia (brak +25% Pracy), Magazyn (brak +20% pojemności; „Niski koszt utrzymania”).

---

## 10. Pytania ABC do właściciela (wybory produktowe; rekomendacja Operatora)

- **Q1. Nowa sekcja „Co możesz teraz zrobić” na karcie budynku** (dziś brak). A) dodać zaraz po TOP 5, maks. 3 zdania CZYNNOŚĆ → KORZYŚĆ (§6) — **rekomendacja**; B) nie dodawać (TOP 5 wystarcza); C) tylko w Cywilopedii.
- **Q2. Pozycje „warunek/rozbudowa” w TOP 5** (np. Studnia: „Warunek Akweduktu (limit 20)”, Odlewnia brązu: „Warunek badania Hutnictwa żelaza”). A) dopuszczone na Top2–Top5, bo realne (reguła R-B1, nigdy Top1) — **rekomendacja**; B) przenieść do osobnej linii „Prowadzi do…”, TOP 5 tylko efekty własne.
- **Q3. Budynki niedostępne** (Wielka odlewnia, Wielka Kuźnia, Teatr). A) ukryć karty i odwołania do nich (spójne z decyzją pkt 3) — **rekomendacja**; B) pokazać z dopiskiem „epoka 4 / wyłączony”.
- **Q4. Pałac II/III tracą −30% korupcji Pałacu I** (`economy.ts:1226`). A) osobny temat naprawy (dodać `palac_ii`/`palac_iii` do listy redukcji) — **rekomendacja**; B) to zamierzone — zostawić.
- **Q5. Trybunał „ogranicza korupcję”** (opis niezgodny z kodem). A) poprawić tylko treść karty (Prawo +17) — **rekomendacja**; B) dać Trybunałowi realną redukcję korupcji (decyzja balansu — osobny temat z liczbą).
- **Q6. Asymilacja kultury** (Biblioteka, Pałac, Sąd, Łaźnia, Akademia, Stela) — działa tylko w mieście z obcą kulturą. A) zostawić w TOP z dopiskiem „podbite miasta” — **rekomendacja**; B) usunąć z TOP 5.
- **Q7. Zamiana Pracy na podatek** (Targowisko) działa tylko dla gracza (`work-tax.ts:20`). A) pokazywać na karcie (gracz jest odbiorcą karty) — **rekomendacja**; B) pominąć.

---

## 11. Plan etapów 3–5 (osobne tematy, ten sam schemat: TOP 5 po Rysie + CMZ „CZYNNOŚĆ → KORZYŚĆ” + turniej Operator / ślepy Evaluator / FC)

| Etap | Zakres (liczba pozycji w danych) | Punkt startowy | Szacunek |
|---|---|---|---|
| 3. Jednostki | 75 w `units.json` (pole `Top3` 75/75; 9 super-jednostek `Super-jednostka=TAK`) | `unitAdapter.ts` (sekcja Top 3 już jest); grupowanie po linii (`Rola (linia)`), wspólne efekty epoki (Koszary, brąz/żelazo, konie) | ~75 turniejów, ~5–7 kandydatów |
| 4. Ulepszenia terenu | 22 w `terrain-improvements.json` (24 klucze główne bez `_meta` i `_miasto_zasieg_ref`; poprawka Obrony r1) | brak pola TOP i sekcji w `improvementAdapter.ts`; źródło prawdy bramki: `terrain-improvements.json tech` | ~22 turnieje |
| 5. CIVPEDIA | aktualizacja `docs/encyklopedia/*` + bundle po akceptacji etapów 1–4 (opcjonalnie cuda: 19 w `wonders.json` `cuda` + 5 parkowanych, `wonderAdapter.ts` bez sekcji TOP) | — | 1 temat dokumentacyjny |
| W2. Wdrożenie kart budynków | nowe treści `top3`→TOP 5 w `buildings.json` (43), tytuł sekcji „Top 5”, opcjonalna sekcja CMZ (Q1), ukrycie budynków niedostępnych (Q3), aktualizacja komentarza `buildingAdapter.ts:234` | po akceptacji tej tabeli i Q1–Q7 | 1 temat GAME (web) |

---

## 12. Ograniczenia i założenia

- ZAŁOŻENIE: karta budynku nie ma sekcji „Co możesz teraz zrobić”, więc kolumna PROPOZYCJA to projekt nowej sekcji (Q1), a nie przepisanie istniejącej.
- ZAŁOŻENIE: kandydaci „next” (warunki/rozbudowy) są realnymi korzyściami dalszymi i mogą zająć Top2–Top5 (R-B1); alternatywa w Q2.
- ROZSTRZYGNIĘTE w Obronie r1 (zastępuje założenie r1 o Spichlerzu Królewskim): „zachowanie 50% / 70% zapasu żywności po wzroście” żyje tylko w `populationGrowth` (`economy.ts:1107-1159`), które nie ma żadnego wywołania w `gra/src` (grep `populationGrowth(`; jedyne użycie to test `gra/tools/popcap-spichlerz2-akwedukt20-test.cjs` opisany jako „legacy”). Żywy wzrost to `applyFractionalGrowthV85` (`population-growth-v85.ts:306-342`, wołane z `population-growth-v85.ts:567` w `applyPostCentralPopulationGrowth`, które woła tura w `main.ts:38315`) — ułamek wzrostu bez bufora, nic się nie zeruje ani nie zachowuje. Oba efekty przeniesione do listy martwej (§8); w ich miejsce realne premie Spichlerzy z żywego kodu: koszt racji ×0,75 / ×0,5 (`building-resource-gate.ts:486-491`, `population-growth-v85.ts:206-223`), zdrowie +5 / +10 (`building-resource-gate.ts:472-477`, `turn-economy.ts:2023`), wzrost +1% / +2% (`building-resource-gate.ts:479-484`, `population-growth-v85.ts:262-277`).
- Wartości dla normal; łańcuchy kumulacji (Koszary + Akademia wojskowa + Warsztat = +50%, Kuźnie +30%) z kodu (`unit-building-bonuses.ts:9-33`), bez testu w żywej grze.
- Zgodność Operator–Evaluator: policzona przez Evaluatora r1 (127/130, Top1 37/40) i przeliczona przez Final Control po Obronie (§13).
- `.xlsx` nie powstał; CSV z BOM i `;` otwiera się w Excelu bezpośrednio.

---

## 13. Final Control r1 — rozstrzygnięcia i FINALNE TOP 5

Pełny zapis (trzeci turniej, próbka zgodnych, bramki): `dyspozycje/autobot/runs/R-WEB-BUILDING-CARDS-TOP5-ANALYSIS-Q1/03-final-control.md`. CSV `budynki-top5.csv` ma status **FINALNE** we wszystkich 40 budynkach z TOP (3 × NIE_USTALONO bez zmian).

| Zarzut Evaluatora | Werdykt FC | Dowód |
|---|---|---|
| 1. Spichlerz Królewski: brak „70% zapasu po wzroście” | ODDAL (efekt martwy; Obrona słusznie przeniosła też 50% Spichlerza I do §8) | `populationGrowth` (`economy.ts:1107`) nie ma wywołania w `gra/src`; tura liczy wzrost przez `applyFractionalGrowthV85` (`population-growth-v85.ts:306-342`, `:567`) bez magazynu żywności |
| 2. Świątynia: brak szerzenia religii | ODDAL (naprawione w Obronie) | `society-params.json:504-510`, `culture-religion.ts:1064`, `main.ts:37718-37730` |
| 3. Targowisko: Top1 warunkowy; +2 zdrowia poza TOP | ODDAL (Top1 naprawione w Obronie, reguła E1-B2 zatwierdzona); +2 zdrowia zostaje poza TOP do Q2 | `turn-economy.ts:420,485`; wpływ zdrowia na wzrost = `floor(zdrowie/10)` (`population-growth-v85.ts:268-269`) |
| 4. Plan etapu 4: 23 → 22 ulepszenia | ODDAL (naprawione w Obronie) | `json.load(terrain-improvements.json)`: 24 klucze, 2 z `_` |

Top1 rozstrzygnięte trzecim turniejem: Targowisko = +5 pieniądza, Port = +5 pieniądza i +1 Pracy, Emporion = +8 pieniądza (E1-B2: slot trasy wart 0 bez partnera), Pretorium = −30% korupcji (`economy.ts:1226-1253`, działa od zbudowania; Prawo +5 pkt słabsze).
