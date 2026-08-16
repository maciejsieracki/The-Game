# DESIGN → UI · 11 zakładek panelu imperium

**ZLECENIE-ID:** `11-ZAKLADEK-PANEL-IMPERIUM-2026-08-13`
**Data oddania:** 2026-08-13
**Makieta:** `The Game - Panel Imperium 11 zakladek v1 2026-08-13 (1E).dc.html`
(oraz `Panel Imperium 11 zakladek (standalone).html` — jeden plik, otwiera się offline)
**Zakres:** reskin 11 zakładek panelu bocznego imperium do wzorca sekcji Moc. 11 klatek, każda 404px = realna szerokość panelu.

---

## 1. Decyzja o palecie — 3b, bez odstępstw

Zgodnie z rekomendacją §3 zlecenia przyjąłem **paletę faktycznie wdrożoną w kodzie** (sekcja Moc):
`#141a24` panel · `#171e2a` karty · `#2b3543` obramowanie · `#d9a441` akcent · `#e8ebf0` tekst ·
`#7d8798` tekst wyciszony · `#78c95a` / `#e07a7a` / `#8ec5ff` semantyka · `'Segoe UI'` wyłącznie ·
róg 7–9px. **Zero Georgii, zero `#e8d88a`.**

Rozjazd `tokens.css` (3a) ↔ kod (3b) odnotowuję jako **dług systemowy do osobnej dyspozycji** —
nie proponuję zmiany kierunku w tym zleceniu. Dwie różne złote w jednym oknie panelu byłyby gorsze
niż dzisiejszy brak stylu.

---

## 2. Mapowanie klatka → kod

| # | Klatka | Sekcja / blok | Funkcja w `empireDetailPanel.ts` |
|---|---|---|---|
| 1 | Skarbiec | `econ-skarbiec` (dziś filtr w `ekonomia`) | `cityEconMiniSkarbiec()` 501–538 + `renderDefaultHandelSplitSection()` |
| 2 | Praca | `econ-praca` (dziś filtr) | `cityEconMiniPraca()` 540–550 + `renderDefaultPodzialPracySection()` |
| 3 | Nauka | `econ-nauka` (dziś filtr) | `cityEconMiniNauka()` 552–559 |
| 4 | Spichlerz | blok `spichlerz` | `renderSpichlerzCentralnySection()` 819–897 + `renderDefaultPoziomRacjiSection()` |
| 5 | Surowce | blok `surowce` | `renderSurowceSection()` 1104–1145 |
| 6 | Handel | blok `handel` | `renderHandelSection()` 1154–1229 |
| 7 | Armia | blok `armia` | inline `render()` 1451–1476 + `cityPoborMiniRekruci()` |
| 8 | Miasto | dziś `econ-miasta` (wspólne) | `cityMiastaMiniDetail()` 623–725, `empireMiastaTable.ts` |
| 9 | Obywatele | dziś `econ-miasta` (wspólne) | jak wyżej + `citizen-resource-upkeep.ts` |
| 10 | Kultura | blok `kultura` | inline `render()` 1479–1495 |
| 11 | Religia | `econ-religia` (jeden wiersz `econRows`) | brak dedykowanej funkcji |

---

## 3. Zmiany struktury (nie tylko CSS)

1. **Cztery zakładki potrzebują własnych bloków** — Skarbiec, Praca, Nauka, Religia. Każda ma hero
   inny niż reszta „ZASOBÓW IMPERIUM", więc nie da się ich utrzymać jako filtrowanych wierszy
   jednego kontenera. Potwierdzone z Lane UI jako praca dev przy wdrożeniu; projektowałem tak,
   jakby te bloki już istniały (wzorem `spichlerz`/`surowce`/`handel`/`armia`/`kultura`/`moc`).
2. **`econ-miasta` rozchodzi się na `miasto` i `obywatele`** — dwa niezależne bloki, dwa chipy HUD
   (`miasta` → `miasto`, `ludnosc` → `obywatele`).
3. **Eyebrow zamiast `.civ-emp-title`** w Handlu i Kulturze — jedna konwencja nagłówka na 11
   zakładek. Jeśli wolicie odwrotnie (`.civ-emp-title` wszędzie), zmiana dotyczy wszystkich 11 i
   proszę o sygnał.

---

## 4. Nowe / zmienione klasy CSS (prefiks zachowany)

| Klasa | Rola |
|---|---|
| `.civ-emp-hero` (+ `.pos`/`.neg`) | duża liczba na starcie sekcji — generalizacja `.civ-emp-moc-big` na wszystkie zakładki |
| `.civ-emp-hero-sub` | podpis pod hero — generalizacja `.civ-emp-moc-sub` |
| `.civ-emp-alert` | callout ostrzeżenia (deficyt skarbca, deficyt żywności, głód wojska) — jeden wygląd dla wszystkich alarmów |
| `.civ-emp-slider` (+ `.gold`/`.blue`/`.neutral`/`.green`) | tor + uchwyt suwaka w kolorze zasobu; zastępuje systemowy niebieski `input[type=range]` |
| `.civ-emp-split2` | dwukolorowy pasek podziału (Praca: budynki/pula, Religia: własna/obca) |
| `.civ-emp-tbl-sum` | wiersz sumy w tabelach — rozszerzenie `.civ-emp-mini-summary` na tabele poza „Miastami" |
| `.civ-emp-grp-row` | wiersz kategorii z checkboxem (Miasto: 8 kategorii budynków) |
| `.civ-emp-thr` (+ `.done`/`.now`/`.next`) | lista progów (Kultura) |

`.civ-emp-tbl` (dziś tylko w Mocy) wchodzi do Skarbca — bilans przechodzi z generycznego
`.civ-emp-mini` na tabelę z wyróżnioną kolumną wartości.

---

## 5. Zero emoji — zamienniki

| Dziś | Po zmianie | Gdzie |
|---|---|---|
| 🍞 (kilkanaście miejsc) | `res-food.svg` przez `mapResourceIconSvg()`, **jedna** ikona przy dużej liczbie magazynu | `foodSignedTxt()`, `foodSummaryRow()`, nagłówek Spichlerza, tabela miast |
| ⚠ | `chip-warning.svg` przez `brandIconSvg()` | callout deficytu żywności, znacznik przy nazwie niedokarmionego miasta |

Ikony w wierszach podsumowania i tabelach **nie** są powtarzane per wiersz — jednostka wynika z
nagłówka sekcji, a 14 chlebków w kolumnie to szum.

---

## 6. Miasto / Obywatele — zgodność z zatwierdzonymi listami

- **Miasto:** wszystkie 8 pozycji listy, w jej kolejności. Budynki pogrupowane wg
  `BUILDING_GROUP_ORDER` (Prawo i administracja → Wojsko i obrona → Handel i pieniądz → Nauka i
  kultura → Wiara → Zdrowie → Produkcja surowców → Żywność). **Bez kosztu utrzymania jednostek** —
  zgodnie z korektą właściciela. Kolumna „SUROWCE" z dzisiejszej tabeli (zapotrzebowanie budynków)
  tu nie wchodzi — to koszt, nie produkcja; zostaje w Skarbcu i Surowcach.
- **Obywatele:** wszystkie 9 pozycji, w kolejności listy. Zużycie surowców liczone od stawki
  **1,0 szt./obywatela/turę** (`CITIZEN_UPKEEP_RATE_PER_CITIZEN`, stan na 2026-08-13).
- **Mechanizm „zaznacz i zobacz sumę cywilizacyjną"** = rozszerzenie istniejącego filtra kolumn
  (`miastaHiddenCols` + `computeMiastaSummaryRow()`) na wiersze kategorii i typy surowca. Nowego
  wzorca nie wprowadzam. Odznaczone pozycje gasną (nie znikają) i wypadają z sumy; wiersz sumy
  nazywa się „CAŁA CYWILIZACJA" / „CYWILIZACJA", nie „SUMA".
- **Przełącznik zakresu** (Całe imperium / miasto) w stylu `.civ-emp-mocview-btn`.

---

## 7. Chip Religia (§8.9) — ROZSTRZYGNIĘTE 2026-08-14

**Decyzja właściciela: wariant A — chip zostaje**, Religia dostaje pełną zakładkę. Uzasadnienie:
mniejsze ryzyko strukturalne niż usuwanie chipa z górnego paska HUD. Wariant B pozostaje w makiecie
wyłącznie jako zapis rozważanej alternatywy (wyszarzony, oznaczony ODRZUCONY).

Klatka 11 pokazuje oba warianty:

- **A — chip zostaje:** Religia dostaje pełną zakładkę (karta religii, wyznawcy, pasek własna/obca,
  efekty, tabela per miasto). Treść częściowo dubluje sekcję Religia w Obywatelach — przy Kulturze
  dublowanie jest zamierzone, ale tam obie zakładki mają własne dane; tu dane są te same.
- **B — chip znika:** treść mieszka wyłącznie w Obywatelach jako sekcja ze skrótem; górny pasek
  schodzi do 10 chipów.

Oba warianty używają tej samej karty religii — decyzja nie zmienia rysunku, tylko to, czy istnieje
osobne wejście z HUD. Nie blokuje pozostałych 10 klatek.

---

## 8. Rejestr decyzji · 2026-08-14

| # | Punkt | Decyzja |
|---|---|---|
| 1 | Chip Religia | **Wariant A** — chip zostaje, pełna zakładka |
| 2 | Nagłówki Handel / Kultura | **Eyebrow** — ujednolicone z pozostałymi 9 zakładkami (`.civ-emp-title` wypada z tych dwóch sekcji) |
| 3 | Kolejność wdrożenia Miasta przy cięciu zakresu | **Przyjęta**: wpływy do skarbca → surowce → kolejka → budynki → obrona/populacja |
| 4 | Plakietki stanu w Surowcach | **Przyjęte** — kolor + słowo („PEŁNY / marnuje się", „spada"), nigdy sam kolor |
| 5 | Nauka — przycisk „Otwórz hub badań" | **Odłożone** — do potwierdzenia, czy hub ma istnieć jako cel linku. W makiecie oznaczony ramką przerywaną i podpisem; bez niego klatka zostaje bez zmian |

Punkty 2 i 4 były już zrealizowane w oddanej makiecie — decyzja je potwierdza, nic nie trzeba
przerysowywać. Punkt 1 zmienił tylko oznaczenia w klatce 11 (A zatwierdzony, B odrzucony).

---

## 9. DoD

- [x] 11 zakładek pokrytych
- [x] Paleta 3b, nie `tokens.css`
- [x] Zero emoji (🍞 i ⚠ zamienione na ikony SVG z brandu)
- [x] Miasto/Obywatele dosłownie z zatwierdzonych list, bez utrzymania jednostek w Mieście
- [x] Pytanie o chip Religia zgłoszone, nierozstrzygnięte
- [x] Mechanizm sumy cywilizacyjnej oparty na istniejącym filtrze kolumn
- [x] `DESIGN-do-UI` + `MANIFEST.txt` + ZIP
