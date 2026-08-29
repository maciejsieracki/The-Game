# DO WKLEJENIA — Design, pigułka miasta na mapie v2 (polish wizualny)

**Zgłoszenie:** `R-DESIGN-PANEL-MIASTA-V2-Q1` (`docs/decyzje/R-DESIGN-PANEL-MIASTA-V2-Q1.md`) = **C**, 2026-08-06.
**Decyzja nadrzędna:** `docs/decyzje/R-DESIGN-PANEL-MIASTA-V2-Q1.md` = C — **polish wizualny pigułki miasta na mapie, PO Q4=B** (hover już wdrożony). To **NIE** jest projektowanie od zera — element już działa w grze, ma realne dane, ma dokładnie 3 warstwy stanu. Zadanie Design: dopracować **wygląd** (proporcje, kolory, ikonografia, hierarchia) tego, co już renderuje silnik — nie wymyślać nowego zakresu danych.
**Ten dokument jest samowystarczalny** — nie musisz czytać innych plików repo, żeby zacząć. Wszystkie liczby niżej są przepisane wprost z kodu gry na `main` (`gra/src/render/cityMapStatChip.ts`, `gra/src/render/cities.ts`, `gra/src/render/cityMapOutline.ts`, `gra/src/render/camera.ts`, `gra/data/miasto-params.json`), sprawdzone osobiście 2026-08-06.

---

## 0. Co to jest — dokładnie

Złota pigułka **nazwa + populacja**, unosząca się nad każdym miastem na głównej mapie świata (nie mylić z pełnym panelem miasta „Miasto W3" po kliknięciu — ten dokument dotyczy **wyłącznie** miniaturki na mapie). Renderowana jako sprite Three.js (bitmapa Canvas 2D naklejona na billboard 3D, zawsze zwrócony do kamery) — **nie** jest to element DOM/HTML.

Kod: `gra/src/render/cityMapStatChip.ts` (rysowanie na Canvas) + `gra/src/render/cities.ts` (`_buildBadgeInput`/`_syncStatChip` — dostarcza dane z silnika gry).

---

## 1. Co pigułka pokazuje DZIŚ — zweryfikowane w kodzie, z dokładnymi wymiarami

To **nie jest** projekt „od zera" — poniższe jest już w grze i działa. Design dostaje to jako punkt wyjścia do polish, nie jako listę do zbudowania.

### 1a. Zawsze widoczne (always-on)

| Element | Źródło danych | Wymiary / kolory w kodzie dziś |
|---|---|---|
| **Nazwa miasta** | `City.name` (+ `· miasto-państwo` dla klastrów-kopii, `gra/src/game/display-names.ts`, stała `CITY_STATE_SEPARATOR=' · '` + `CITY_STATE_LABEL='miasto-państwo'`) | WERSALIKI, `700 22px Georgia, "Times New Roman", serif`, kolor tekstu `#f4f0e8` |
| **Populacja** | `City.population` (min. 1) | Złote kółko Ø **30px** (`circleD`), wypełnienie `#e8d88a`, liczba `700 16px Arial` czarna (`#2a2208`), wyśrodkowana |
| **Medalion cywilizacji** — rysowany **bezwarunkowo**, część każdego stanu pigułki, łącznie z najuboższym (brak muru, brak produkcji) | `civIconId` (civs.json) + `ownerColor` | Okrąg promień `CIV_MEDALLION_R = 16px` (Ø32px), tło = kolor właściciela przyciemniony ×0,55, obwódka 2px `#e8d88a`. W środku: **portret władcy** (gracz + AI major, wg epoki) albo, dla miast-państw (`isCityState=true`), **wyłącznie sygnet kultury** (bez portretu) — fallback: romb `◆` gdy brak assetu. Slot w layoucie: `CIV_SLOT_W = 38px`. |
| **Tarcza obrony (3 stany)** | `defenseTierFromWallKind(wallKind)` z listy zbudowanych budynków (`wallKindFromBuilt`) | Rysowana **tylko gdy `defenseTier !== 0`** (tier 0 = pigułka bez tarczy, nic nie zajmuje miejsca). Rozmiar tarczy 14×16px, slot `defenseW = 22px`. Tier 1 (Palisada) = szara: fill `#9a9aa8` / obrys `#c8c8d4`. Tier 2 (Mury **lub** Cytadela — patrz uwaga w sekcji 2) = złota: fill `#e8d88a` / obrys `#fff4c8`, z dodatkową pionową kreską na środku tarczy. |
| **Glif frontu kolejki produkcji ("lite")** — tylko gdy w kolejce jest aktywna, niewstrzymana pozycja | `getProduction(cityId)` → `frontItem()` | Ikona SVG 16×16px (kanoniczna z brand assets, budynek/jednostka), slot `PROD_SLOT_W = 20px`. Brak produkcji lub kolejka wstrzymana → glif nie zajmuje miejsca. |
| **Poziom Wyżywienia** — **tylko miasta gracza** (`ownerId === playerOwnerId`, domyślnie 0) | `getCityRationLevel(city)` | Etykieta `W<poziom>` (np. `W3`), `700 13px Arial`, kolor `#d4c48a`, slot `GROWTH_SLOT_W = 30px`. Miasta AI/MP nie mają tego elementu (parytet celowo asymetryczny — poziom racji jest mechaniką tylko gracza). |

Tło pigułki: gradient grafitowy `rgba(16,22,34,0.96) → rgba(8,10,16,0.94)` (pionowy), zaokrąglony prostokąt, obwódka **2px** `rgba(232,216,138,0.72)`. Wysokość bazowa pigułki (bez hover): `baseH = max(48, circleD + 2×padY) = 48px`. Padding wewnętrzny `padX=10px`, `padY=8px`, odstęp między segmentami `gap=8px`.

**Nazwa jest obcinana** (`truncateName`, wielokropek) gdy przekracza budżet szerokości: `maxNameW = 200px − prodW − growthW` (prodW=20 jeśli aktywna produkcja, growthW=30 jeśli pokazywane Wyżywienie) — a więc realny limit waha się między 150px (miasto gracza z produkcją) a 200px (miasto AI bez żadnego dodatku), **nie** jest to stała 220px.

### 1b. Widoczne wyłącznie na hover (rozszerzony wiersz — wdrożone `R-DESIGN-PANEL-MIASTA-Q4=B`, FALA 251, `e594f018`, 2026-08-06)

Gdy kursor jest nad pigułką (`hoverStatChipCityId === city.id`), pigułka rośnie o **drugi wiersz**, oddzielony cienką linią (`rgba(232,216,138,0.28)`, 1px) tuż pod wierszem głównym. Wysokość dodatkowego wiersza: `HOVER_ROW_H = 22px` (czyli pigułka w hoverze ma `48+22=70px` wysokości zamiast 48px).

Treść drugiego wiersza (`600 11px Arial`, kolor `#c8b888`, też obcinana wielokropkiem):
- **Kategoria produkcji** („Budynek" / „Jednostka") **·** nazwa frontu kolejki — np. „Budynek · Spichlerz". Gdy kolejka wstrzymana: dopisek „· wstrzymana" (albo samo „Produkcja wstrzymana" gdy brak innej treści).
- **Ostrzeżenie surowców** — mała ikonka koła z wykrzyknikiem (promień 8px, `#8a4a10`/`#e8a040`), pojawia się gdy w magazynie państwa brakuje surowca na front kolejki (`canAffordBuildingStock`). Gdy nie ma nic innego do pokazania: tekst „Brak surowców w magazynie".

**To już jest w grze i zdeployowane do ROBOCZA** (potwierdzone `dyspozycje/WERSJE.md`, wpis FALA 251) — Design dostaje to jako referencję do polish stylu, nie jako coś do zaprojektowania.

---

## 2. Realne luki dziś — rzeczy, których pigułka NAPRAWDĘ nie pokazuje

W przeciwieństwie do wcześniejszej (błędnej) wersji tego briefu: obrona, produkcja i ostrzeżenie surowców **już są** w pigułce (sekcja 1). Realne luki są węższe niż wcześniej opisywano:

1. **Mury i Mury+Cytadela wyglądają IDENTYCZNIE** — tier obrony liczony jest wyłącznie z `wallKindFromBuilt()`, który zwraca `'stone'` zarówno dla budynku `'mury'` (+200% Obrony), jak i `'fort'`/Cytadeli (+300% Obrony łącznie). Pigułka pokazuje tę samą złotą tarczę w obu przypadkach — gracz nie odróżni miasta z samymi Murami od miasta z Cytadelą, patrząc tylko na mapę.
2. **Baszta jest całkowicie niewidoczna** — trzeci, niezależny budynek obronny (+100% Obrony, dokładany do Murów/Cytadeli) nie ma żadnej reprezentacji w `wallKindFromBuilt`/tier. Miasto z kompletem Mury+Cytadela+Baszta (realne **+400% Obrony**, maksimum w grze) pokazuje dokładnie tę samą tarczę co miasto z samymi Murami (+200%).
3. **Marker stolicy — patrz sekcja 5 osobno** (status: kod gotowy, ale jeszcze NIE scalony do `main`).
4. **Sygnał buntu miasta** (`_syncRevolt` w `cities.ts`) to osobny, niezależny sprite 🔥 nad miastem — nie jest zintegrowany wizualnie z pigułką (dwa oddzielne obiekty w scenie). Nie jest to blokujące dla tej paczki, tylko obserwacja.

---

## 3. Parametry obrony — dokładne wartości (źródło: `gra/data/miasto-params.json` + `gra/src/game/city-defense.ts`)

| Budowla | Parametr JSON | Wartość | Jednostka | Stackowanie |
|---|---|---|---|---|
| Palisada (drewniana, wczesna) | `bonus_obrona_palisada_proc` | 100 | % Obrony | Samodzielna; **zastępowana** przez Mury (nie sumuje się z nimi) |
| Mury (kamienne) | `bonus_obrona_mur_proc` | 200 | % Obrony | Baza kamienna |
| Cytadela (upgrade Murów, budynek `'fort'`) | `bonus_obrona_cytadela_proc` | 100 | % Obrony **dodatkowo do Murów** | Mury+Cytadela = 200+100 = **300%** |
| Baszta (trzeci, niezależny budynek) | `bonus_obrona_baszta_proc` | 100 | % Obrony **dodatkowo do Murów+Cytadeli** | Mury+Cytadela+Baszta = 200+100+100 = **400% (realne maksimum w grze)** |

Cytat wprost z komentarza w `gra/src/game/city-defense.ts`: *„Miasto z Murami+Cytadela+Baszta = 200+100+100 = 400%."* — to jest właściwa liczba maksymalnego bonusu Obrony z budowli miejskich (procent dodawany do bazowej Obrony jednostki broniącej, nie mnożnik ×4,0 — bonusy są addytywne w punktach procentowych, nie mnożone).

Pigułka na mapie dziś koduje to jako **3 stany tarczy** (0/1/2 — sekcja 1a), gdzie tier 2 „złota tarcza" oznacza cokolwiek z zakresu 200–400% Obrony bez rozróżnienia. To świadomy uproszczony skrót (decyzja Q1=A z FALA 223: tarcza wyłącznie z rodzaju muru, nie z realnego %) — Design projektuje polish DLA TEGO trójstanowego systemu, nie dostaje zadania jego rozbudowy do 4–5 stanów (to osobna decyzja produktowa, poza zakresem `R-DESIGN-PANEL-MIASTA-V2-Q1=C`).

---

## 4. Trzy klatki do dostarczenia (decyzja Maciej 2026-08-04, Q2=C — bez zmian względem poprzedniej wersji briefu)

1. **Baseline** — miasto bez muru, bez produkcji w kolejce. Widoczne: nazwa + populacja + medalion cywu (bezwarunkowy). Brak tarczy, brak glifu produkcji, brak Wyżywienia (jeśli to miasto AI) lub `W<n>` (jeśli miasto gracza).
2. **Pełny MUST (always-on)** — Mury+Cytadela (tarcza tier 2, złota) + medalion cywu + nazwa+populacja + glif produkcji aktywny + (dla miasta gracza) etykieta Wyżywienia.
3. **Hover rozszerzony** — jak klatka 2, plus drugi wiersz: kategoria produkcji + nazwa itemu + ostrzeżenie surowców (ikonka „!").

Styl: **1E (Painted Imperial)**, tokeny wyłącznie z `eksport/tokens.css` / `brand-book/` — złoto `#e8d88a`, tła grafitowe, Georgia na nazwach (patrz dokładne wartości w sekcji 1).

---

## 5. Marker stolicy — status realny: WDROŻONE W ROBOCZEJ (korekta 2026-08-18)

Poprzednia wersja tej instrukcji zawierała historyczny status „branch roboczy, nie main". **Aktualna weryfikacja `git log`/`git branch --contains` potwierdza, że** funkcja istnieje w pełni dopracowanym stanie (korona 17×13px, obwódka 3,5px, wykluczenie miast-państw z markera), a commit `d3470ed5` jest przodkiem aktualnego `main`. Kod został ujęty w FALI 296 i ROBOCZEJ `a37f7123` (źródło integracji `a6e2967f`).

Wcześniejszy AutoBot Operator → Evaluator miał werdykt **PASS-WITH-NOTES**; Evaluator wykrył potrzebę wyłączenia miast-państw z markera, co domknięto w `d3470ed5`. Bramki paczki: `tsc --noEmit` 0, `display-names-test` 27/27, `city-map-badge-test` 31/31, Vite 792 moduły. Wpis rejestru z 2026-08-06 pozostaje historią stanu sprzed scalenia.

**Dlatego marker stolicy NIE wchodzi do żadnej z 3 obowiązkowych klatek w sekcji 4.** Poniżej specyfikacja tego kandydata — do wglądu, żeby Design mógł ją zwalidować równolegle (nieblokująco), skoro kod jest gotowy i czeka tylko na scalenie:

| Element | Wartość |
|---|---|
| Obwódka pigułki zwykłego miasta | 2px, `rgba(232,216,138,0.72)` (bez zmian) |
| Obwódka pigułki stolicy | **3,5px** (1,75× grubsza), kolor `rgba(255,233,168,0.98)` (jaśniejsze złoto) |
| Wewnętrzny pierścień stolicy (dodatkowy) | odsunięcie 6px od krawędzi, grubość 1,2px, kolor `rgba(232,216,138,0.42)` |
| Korona | 17px szer. × 13px wys., gradient złota `#fff6d2 → #f2df9a → #d8c069`, 3 szpice + 2 wcięcia + 3 „klejnoty"-kropki, w slocie 19px między medalionem cywu a nazwą |
| Zakres (kto dostaje marker) | **Wyłącznie stolice pełnoprawnych cywilizacji** (gracz + AI major) — `capitalCityIdForOwner(ownerId) === city.id`. **Miasta-państwa (MP) są wyłączone** nawet jeśli formalnie „stolica" wskazuje na ich jedyne miasto (`options.isCityStateOwner` gatekeeper w `_isCapitalCity`) — decyzja `MAP-UX-CAPITAL-MP-SCOPE-Q1=B`, bo inaczej KAŻDE miasto-państwo (ma zawsze dokładnie jedno miasto) dostałoby koronę, co myli „stolica imperium" z technicznym faktem „jedyne miasto tego właściciela". |

Jeśli Design chce dostarczyć wariant walidujący ten marker (np. jako 4. opcjonalną klatkę), mile widziane — jest to walidacja istniejącej implementacji w ROBOCZEJ, nie zlecenie scalenia brancha. Nie traktuj tego jako część zamkniętego zakresu 3 klatek z sekcji 4.

---

## 6. Zmiany od poprzedniej wersji mockupu (2026-07-04) — dlaczego robimy polish teraz

Element **rusza się aktywnie od 2026-08-04** — 6 commitów w cztery dni roboczych dotykających `cityMapStatChip.ts`/`cities.ts` (nie „ani razu od 3 tygodni", jak błędnie twierdziła poprzednia wersja tego briefu):

| Commit | Data | Co |
|---|---|---|
| `b45113b` | 2026-08-04 | Pigułka v1 — 3 stany obrony + ikona cywu (prototyp bez Design) |
| `6f523e3` | 2026-08-04 | Tarcza palisada/mury + emblemat cywu |
| `eeeaa2b` | 2026-08-04 | Tarcza wyłącznie z `wallKind` (dopasowanie do modelu 3D miasta) |
| `bf5b4ea` | 2026-08-05 | Glif frontu kolejki + poziom Wyżywienia (miasta gracza) |
| `8588cb7` | 2026-08-05 | Medalion: portret władcy vs sygnet kultury (MP) |
| `c36bbea` | 2026-08-06 | Hover: kategoria produkcji + ostrzeżenie surowców (Q4=B) |

Mockup z 2026-07-04 (`docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/mockupy/The Game - HUD Miasto wybrane (1E).dc.html`, linie 16–18) pokazywał tylko nazwę + populację + przerywany pierścień selekcji — od tego czasu gra dołożyła realne dane (obrona, cywilizacja, produkcja, Wyżywienie, hover), a wygląd nie nadążył za treścią. **To jest właściwy powód tej paczki: dopracować styl pod bogatszą treść, nie projektować treść od nowa.**

---

## 7. Ograniczenia techniczne

- To **sprite billboard w scenie 3D** (Three.js `Sprite` z `THREE.CanvasTexture`, `worldH = 0.52` jednostki świata, pozycja `y=0.92` nad bazą modelu miasta), **nie** element DOM/HTML. Każdy nowy element wizualny musi dać się wyrenderować jako bitmapa Canvas 2D lub jako osobny sprite w tej samej pozycji.
- Kamera mapy: elewacja **52°** (`gra/src/render/camera.ts`, `THREE.MathUtils.degToRad(52)`) — projektuj z tego kąta, nie z góry.
- Cache tekstur po kluczu `cityMapBadgeKey(...)` (`cityMapStatChip.ts`) — jeśli Design doda nowy zmienny stan wizualny, integrator musi rozszerzyć klucz cache o ten wymiar (dziś klucz koduje: nazwa, populacja, tier obrony, civIconId, produkcję, Wyżywienie, ostrzeżenie surowców, hover, miasto-państwo, epokę — 10 segmentów).
- Musi zostać czytelne przy dużym zoom-out (wiele miast naraz) — już dziś sama nazwa+populacja+medalion zajmuje sporo miejsca; kolejne elementy grożą nieczytelnością bez jasnej hierarchii.
- Obwódka heksu (`gra/src/render/cityMapOutline.ts`) koduje już właściciela/wojnę osobno od pigułki — podwójny pierścień: wewnętrzny w kolorze cywilizacji (opacity 0,92, promień `HEX_R×0,98`), zewnętrzny też w kolorze cywilizacji (opacity 0,52, promień `HEX_R×1,06`) **chyba że** miasto jest w stanie wojny z graczem — wtedy zewnętrzny zmienia się na czerwony `0xff4444`, opacity 0,55. Design nie musi tego duplikować w pigułce, może się do tego odwołać jako do istniejącej warstwy.

---

## 8. Format oczekiwanej odpowiedzi

- **Deliverable:** nowa makieta `.dc.html`, np. `The Game - HUD Miasto na mapie v2 (1E).dc.html`, dokładnie **3 klatki** wg sekcji 4 (opcjonalnie 4. klatka „kandydat korona stolicy" wg sekcji 5, jasno oznaczona jako nieblokująca/nieobowiązkowa).
- **Zapis:** wg utartej struktury `docs/ux/claude-design/_dist/<NAZWA>-2026-08-06/brand-book/KANON/mockupy/` + aktualizacja `CANON.md` i huba, zgodnie z konwencją poprzednich zleceń.
- **Lista brakujących assetów** — jeśli makieta wymaga nowych ikon/SVG (np. inny styl tarczy, inny kształt medalionu), Design MUSI dołączyć jawną listę brakujących plików z proponowanymi nazwami — integrator nie zgaduje, czego brakuje.
- **Po dostarczeniu:** integrator aktualizuje `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (wiersz `R-DESIGN-PANEL-MIASTA-V2-Q1`) i wdraża w `gra/src/render/cityMapStatChip.ts` / `cities.ts`. Kod pigułki **nie jest zamrożony** w trakcie prac Design (decyzja C) — możliwe drobne poprawki layoutu przygotowawcze, bez dużego redesignu przed dostawą klatek.
