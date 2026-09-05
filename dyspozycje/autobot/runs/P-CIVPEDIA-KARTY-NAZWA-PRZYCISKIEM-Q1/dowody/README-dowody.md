# Dowody — P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1

Wszystkie zrzuty z **żywego Chromium** (Playwright, 1280×900), obejrzane i opisane.
Zrzut, którego nikt nie obejrzał, nie jest dowodem — poniżej jest, co na każdym widać.

## Korekta po zarzutach 1 i 2 (runda 1, OBRONA)

Pierwsza wersja tego katalogu miała wadę, którą Evaluator wykrył `md5sum`, i zarzut był
trafny: pliki `goal3-01/02` były **bajtowymi kopiami** `karta-1-technologia-gora/dol`,
czyli stanu **PO** zmianie, opisanymi w tabeli jako stan **PRZED** zmianą; podobnie
`karta-4-ulepszenie-linki` i `karta-2-budynek-linki` były kopiami plików bez sufiksu.
Przyczyna: jeden przebieg harnessu na jednym stanie kodu, a te same klatki zapisane pod
dwiema nazwami — dowód nierozróżnialny od kopii nie jest osobnym dowodem.

Naprawa: zrzuty „PRZED" powstały z **faktycznego stanu bazy `c8483a64`** (tymczasowy
`git checkout c8483a64 -- <4 pliki źródłowe>`, przebieg, natychmiastowy powrót do `HEAD`,
drzewo zweryfikowane jako czyste), a zrzuty „PO" z `HEAD`. Wszystkie **10 plików ma dziś
różne md5** — zero par bajtowo identycznych.

## GOAL 3 — rozstrzygnięcie H1/H2, stan PRZED zmianą (kod bazy `c8483a64`)

| Plik | Co widać (obejrzane) |
|---|---|
| `goal3-01-przed-scrollem.png` | Karta „Obróbka drewna" tuż po rozwinięciu sekcji „Ulepszenia terenu", bez przewijania. `Stolarnia`, `Palisada drewniana`, `Taran` to **zwykły tekst po lewej + osobny przycisk „Szczegóły →" po prawej** — dokładnie objaw ze zgłoszenia właściciela. Nagłówek „Ulepszenia terenu" stoi **przy samej dolnej krawędzi** karty, jego wiersze są już poniżej cięcia — wizualne potwierdzenie pomiaru (wiersz `top` 813,6 wobec dolnej krawędzi 811,0). |
| `goal3-02-po-scrollu.png` | Ta sama karta po przewinięciu **kółkiem myszy** (`scrollTop` 194). Widać komplet: `Tartak`, `Posterunek (Strażnica)`, `Brązownictwo` — każdy nadal z osobnym „Szczegóły →". Niżej pigułka `Żegluga` — wzorzec wskazany przez właściciela jako **jedyny zrobiony dobrze**: sama nazwa w ramce. |
| `goal3-03-po-kliku.png` | Ten sam przebieg, po realnym kliknięciu w wiersz `Tartak`: otwiera się zagnieżdżona karta ulepszenia **`Tartak`**. To jest dowód rozstrzygający: na kodzie SPRZED zmiany gracz dosięga wiersza i klik działa. |

**Werdykt: H2 (przestarzały test), nie H1 (defekt produktu).** Pomiar na bazie `c8483a64`:
karta `scrollHeight` 914 vs `clientHeight` 720 (realnie przewijalna); przed przewinięciem
kotwica wiersza `top` 813,6 przy dolnej krawędzi karty 811,0 — **2,6 px poniżej przyciętego
boxa**, więc `elementFromPoint` zwraca `DIV.tdn-back`. Po przewinięciu kółkiem: `scrollTop`
194, kotwica `top` 619,6, `elementFromPoint` = `SPAN.entity-card-row-key`, a realny klik
otwiera `improvement/tartak`. Brakowało tego kroku **TESTOWI, nie graczowi**.

Ten sam pomiar powtórzony na `HEAD` (po GOAL 1) daje identyczne liczby — zmienia się tylko
element trafiony po przewinięciu: `BUTTON.entity-card-row-key` zamiast `SPAN`. Werdykt bez
zmian. Klatki „po zmianie" dla tego scenariusza to `karta-1-technologia-gora/dol.png`
niżej (ten sam kadr, ten sam `scrollTop` 194) — **świadomie nie zapisujemy ich drugi raz
pod nazwą `goal3-*`**, bo byłyby bajtową kopią, czyli dokładnie wadą z zarzutu 2.

## GOAL 1 i 2 — cztery typy kart, stan PO zmianie (`HEAD`)

| Plik | Co widać (obejrzane) |
|---|---|
| `karta-1-technologia-gora.png` | Góra karty technologii „Obróbka drewna" — medalion, tytuł, rys historyczny, „Co możesz teraz zrobić", początek sekcji Budynki. Porównaj z `goal3-01`: te same wiersze, `Stolarnia`/`Palisada drewniana` **bez** „Szczegóły →". |
| `karta-1-technologia-dol.png` | **Kluczowy zrzut tematu**, kadr 1:1 z `goal3-02-po-scrollu.png` (ten sam `scrollTop` 194). `Stolarnia`, `Palisada drewniana`, `Taran`, `Tartak`, `Posterunek (Strażnica)`, `Brązownictwo` — każda nazwa jest **oramkowanym przyciskiem przy lewej krawędzi**, bez podkreślenia i bez „Szczegóły →". Wygląd nieodróżnialny od pigułki `Żegluga` niżej. Wiersz `Brązownictwo` zachowuje ikonę jako SIOSTRĘ przycisku (poza ramką) oraz adnotację `Wymaga też: Garncarstwo, Murarstwo` po prawej — zgodnie z granicą dispatchu. |
| `karta-2-budynek.png` | Karta budynku `Stolarnia`. **Zero wierszy z `linkTo`** — same pary pole:wartość (Kategoria, Epoka wejścia, Koszt, Poziomy…). `buildingAdapter.ts` nie ustawia `linkTo` nigdzie, więc nie ma tu czego zamieniać na przycisk. **Nie ma pliku `karta-2-budynek-linki.png`** i nie może być: na tej karcie nie istnieje ani jeden link krzyżowy do sfotografowania. Poprzednia wersja katalogu miała ten plik jako bajtową kopię — usunięty. |
| `karta-3-jednostka.png` | Cała karta jednostki `Taran`. |
| `karta-3-jednostka-linki.png` | **Zbliżenie** (inny kadr, nie kopia) na sekcję „Wymagania i kontry": etykieta `Technologia` to nazwa POLA i pozostaje wyciszonym tekstem, a `Obróbka drewna` jest **oramkowanym przyciskiem** po prawej. Przyciskiem jest nazwa encji, zgodnie z GOAL 1. |
| `karta-4-ulepszenie.png` | Cała karta ulepszenia terenu `Tartak`. |
| `karta-4-ulepszenie-linki.png` | **Zbliżenie** na sekcję „Wymagania": `Teren`, `Koszt (Praca)`, `Warunek` to zwykły tekst, a w wierszu `Technologia` nazwa `Obróbka drewna` jest w ramce (`border-width` 1px, `text-decoration-line: none`). |

## Pomiar „pudełko == obszar łapiący klik" (reguła anty-halucynacyjna, tryb pierwszy)

Dla **każdego** `button[data-entity-kind]` na czterech kartach, po przewinięciu w pole
widzenia: `border-width` 1px, `text-decoration-line: none`, `elementFromPoint` w środku
pudełka zwraca **ten sam element** (`hitIsSelf: true`), różnice prostokątów `dW = 0,00`,
`dH = 0,00` px. Zero martwej strefy — w przeciwieństwie do zmierzonych w RUNDZIE 1 OBRONY
88,1×22,2 px pudełka wobec 52,0×16,2 px klikalnego tekstu.

## Dowód nietautologiczności bramki `civpedia-karty-nazwa-przyciskiem-test.cjs`

| Mutacja źródła (`technologyAdapter.ts`, `buildingsRows`) | Wynik bramki |
|---|---|
| bez mutacji | **27 pass, 0 fail** |
| przywrócone `value: linkTo ? 'Szczegóły →' : ''` | **26 pass, 1 fail** — skan negatywny (5) |
| pełny powrót sprzed tematu (`git checkout c8483a64 -- technologyAdapter.ts`) | **24 pass, 3 fail** — (1)×2 i (5) |

## Dowód nietautologiczności asercji fallbacku w `civpedia-caly-wiersz-przyciskiem-test.cjs`

Asercje przywrócone po zarzucie 3 (klik 60 px na prawo od przycisku, w puste pole wiersza):

| Mutacja źródła (`renderer.ts`, delegowany listener wiersza) | Bramka | Asercje fallbacku |
|---|---|---|
| bez mutacji | **66/85**, 19 fail (pre-istniejące) | **22 pass, 0 fail** |
| `rowEl` na sztywno `null` (fallback całego wiersza wyłączony) | 59/85, 26 fail | **11 pass, 11 fail** |

Mutacje cofnięte (`git checkout HEAD -- <plik>`), drzewo zweryfikowane jako czyste,
bramki uruchomione ponownie na stanie końcowym.
