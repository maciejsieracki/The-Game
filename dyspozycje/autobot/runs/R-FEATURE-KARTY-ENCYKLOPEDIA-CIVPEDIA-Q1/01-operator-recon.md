# 01-operator-recon — R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1

STATUS: PASS (recon-only, zero zmian kodu)
TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1
GOAL tego etapu: inwentaryzacja stanu obecnego przed implementacją; identyfikacja realnych
pytań ABC przed jakąkolwiek zmianą kodu.

# Recon: karty budynków/jednostek/ulepszeń/technologii + linkowanie + CivPedia + info-tooltip na hub badań

Tryb: wyłącznie odczyt (Grep/Read). Zero zmian w plikach.

## 1. Tabela stanu: karta / klikalność / obecność w CivPedii

| Typ obiektu | Karta istnieje? | Gdzie (plik:linia) | Klikalna skądkolwiek? | W CivPedii (wikiBundle)? |
|---|---|---|---|---|
| **Jednostka** | TAK, pełna, z 3D-podglądem | `unitInfoCard.ts` (`buildUnitInfoCard`/`showUnitInfoCardDialog`, 296 linii) | TAK — `main.ts:18799` (`showUnitInfoCardDialog(...)`, klik na jednostce na mapie) | TAK — kategoria `jednostki` (49 haseł, prozaiczny wpis wiki) |
| **Jednostka (wariant 2)** | TAK, inna implementacja | `cityPanel.ts:7225` `buildUnitDetailCard` (osobny layout, brak 3D, ale ma kontry/utrzymanie surowców) | TAK — w panelu Rekrutacji miasta (kliknięcie jednostki na liście) | j.w. — ale to **inna karta niż `unitInfoCard.ts`**, bez linku między nimi ani do CivPedii |
| **Budynek** | TAK, pełna | `cityPanel.ts:6952` `buildBuildingDetailCard` + `buildBuildingBuildTabDetailCard` (7086) | TAK — panel Budowa, kliknięcie budynku na liście / posiadane budynki (7193) | TAK — kategoria `budynki` (25 haseł) |
| **Ulepszenie terenu** | **NIE** — brak dedykowanej karty gdziekolwiek | — | Tylko wzmiankowane: nazwa+ikona w `techDiscoveryNotice.ts` (sekcja „Ulepszenia terenu", `unlockItemRow`, bez kliknięcia) | TAK — kategoria `ulepszenia` (17 haseł) — ale nic w grze nie linkuje tam |
| **Technologia** | Trzy **niezależne** re-implementacje tej samej treści, nie jedna karta | `techDiscoveryNotice.ts` (548 linii, pełna), `techTreeView.ts` `buildCardHTML` (hover-tooltip, linie 704–779), `cityPanel.ts` `appendTechDetailBlock` (6907, wbudowany blok w kartę budynku/jednostki) | TAK, ale każda ścieżka osobno: klik ikony w `scienceHubHud.ts` (linia 624 `act()`) i w `techTreeView.ts` (linia 929 `click` na `.civ-ttv-tn`) → obie otwierają `showTechDiscoveryNotice(...)`. `techIconHintSpan()` w `cityPanel.ts` (6792) to **tylko ikona+tooltip statyczny, BEZ onClick** | **NIE** — brak kategorii `technologie` w `wikiBundle.json` / `docs/encyklopedia/` (foldery: `budynki, cuda, cywilizacje, jednostki, pojecia, ulepszenia` — technologii nie ma) |

## 2. Co już jest wzajemnie powiązane (linki) — i czego brak

**Już działa:**
- `techDiscoveryNotice.ts` (karta odkrycia tech) **czyta na żywo** `buildings.json`/`units.json`/`terrain-improvements.json` i renderuje listy odblokowanych budynków/jednostek/ulepszeń z ikonami (funkcja `buildBody`, linie 338–444) — ale to tylko **wypisanie nazw**, żaden wiersz nie jest klikalny do karty budynku/jednostki.
- `scienceHubHud.ts` i `techTreeView.ts` **już mają** wzorzec „klik = otwórz kartę podglądu technologii, oddzielny przycisk = wybierz do badania" (`onStartResearch` jako osobna funkcja przekazywana do `showTechDiscoveryNotice`). To jest dokładnie mechanizm, o który prosi właściciel dla ikon w hubie badań — **już zaimplementowany dla samego rzędu/węzła**, tylko nie ma osobnego małego przycisku „info" obok ikony.
- `wikiHubHud.ts` ma wewnętrzny mechanizm linków `data-wiki-link` między hasłami encyklopedii (linia 339–350) — czyli CivPedia już umie linkować hasło→hasło.
- `cityPanel.ts` ma `techIconHintSpan()` — pokazuje ikonę technologii przy nazwie wymogu w karcie budynku/jednostki, ale to martwy wizualnie element (brak `onClick`, brak `title` poza domyślnym).

**Czego całkowicie brak:**
- Zero linku CivPedia ↔ żywe karty w grze w obie strony. Trzy niezależne systemy czytają te same pliki JSON, ale nigdy się nie odwołują do siebie.
- Brak jakiejkolwiek karty/wpisu dla **ulepszeń terenu jako klikalnego obiektu**.
- Brak kategorii/karty **technologii w CivPedii** w ogóle.
- `techIconHintSpan` (cityPanel) nie klika nigdzie — martwy potencjał do zamiany w „mini info + link".
- Brak wspólnej funkcji/typu „otwórz kartę X po ID" — każdy z trzech miejsc ma własny format danych i własny sposób budowy DOM.

## 3. Wcześniejsze audyty tego samego obszaru

Oba audyty (`AUDYT-CIVPEDIA-MARTWE-OBIETNICE.md`, `AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md`) dotyczą **poprawności treści**, nie struktury/klikalności:
- Drugi audyt katalogował 27 paneli „ściąga"/„szczegóły" w `cityPanel.ts` — częściowa mapa tego co ma być „kartą"; zawiera link-worthy duplikaty (Zamożność 2 warianty, Religia 4 punkty styku).
- Pierwszy audyt: treść budynków generowana z `docs/encyklopedia/budynki/*.md` + `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` → generator → `wikiBundle.json` — istniejąca rura generowania, do rozszerzenia o technologie.
- Oba potwierdzają rozjazdy treści merytorycznej (nieaktualne liczby, fałszywe mechaniki) — osobny problem, ale nowe karty odziedziczą te błędy.

## 4. Ocena skali pracy

To **nie jest małe domknięcie**. Praca dzieli się na 4 wyraźnie różne zadania:
1. Ulepszenia terenu — nowa karta od zera (średnie).
2. CivPedia dla technologii — nowa kategoria (średnie).
3. Wzajemne linkowanie 4×4 macierzy obiektów — duży nowy system (wymaga wspólnego kontraktu identyfikacji encji + routingu; realny refaktor, nie dopisanie `onClick`).
4. Mały przycisk info na ikonach hubu badań — małe zadanie (mechanizm już częściowo istnieje).

## 5. Pytania ABC (realne wybory projektowe)

1. **Źródło prawdy treści kart** — refaktor w jeden wspólny renderer, czy zostawić trzy niezależne implementacje i tylko dopisać linki?
2. **CivPedia jako jedyne źródło opisu, czy dwa równoległe kanały** (proza CivPedii + liczby z żywej karty)?
3. **Zakres przycisku info na hubie badań** — czy klik całego wiersza/węzła (już działa) wystarcza, czy potrzebna osobna, zawsze widoczna ikonka obok?
4. **Skąd otwierać kartę ulepszenia terenu** — tryb budowy? panel miasta? tylko CivPedia?

Pełne A/B/C dla każdego pytania: `docs/decyzje/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1.md`.

## 6. Rekomendowana kolejność prac

1. ABC 1–2 (źródło prawdy) — determinuje każdą kolejną decyzję.
2. Domknięcie hubu badań (ABC 3) — najmniejsze, niezależne, dobra pierwsza weryfikacja wzorca.
3. Karta ulepszeń terenu — czwarty brakujący typ.
4. CivPedia: kategoria technologii — rozszerzenie istniejącej rury.
5. System wzajemnego linkowania — na końcu, gdy wszystkie 4 karty + CivPedia istnieją.
6. Osobnym torem: przekazać właścicielowi oba istniejące audyty treści do decyzji o kolejności Etapu 2.

Pliki przeczytane (bez zmian): `gra/src/ui/unitInfoCard.ts`, `techDiscoveryNotice.ts`,
`cityPanel.ts` (fragmenty 6850–7320), `wikiHubHud.ts`, `gra/tools/bundle-wiki-for-game.cjs`,
`scienceHubHud.ts`, `techTreeView.ts`, `dyspozycje/AUDYT-CIVPEDIA-MARTWE-OBIETNICE.md`,
`dyspozycje/AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md`, `gra/src/data/wikiBundle.json`.

NASTĘPNY KROK: ABC do właściciela (4 pytania, pełny tekst w docs/decyzje/). Implementacja
wstrzymana do ECHO.
DEPLOY/PUSH: NIE WYKONANO.
