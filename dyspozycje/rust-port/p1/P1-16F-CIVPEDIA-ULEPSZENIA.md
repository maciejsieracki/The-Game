# P1.16F — CivPedia „Ulepszenia terenu": wiki vs `terrain-improvements.json` (pin `edb8fb56`)

**Temat:** R-RUSTPORT-P1-16F-CIVPEDIA-ULEPSZENIA-Q1 · **Runda:** 1/5 · **Rola:** Operator (Haiku 5.5 medium)
**Pin:** `edb8fb56` (`main`). Odczyt wyłącznie przez `git show edb8fb56:<ścieżka>`; `gra/**` nietknięte; brak `npm`/`cargo`/testów.
**Źródło wiki:** `gra/src/data/wikiBundle.json` na pinie, kategoria `Ulepszenia terenu` (17 wpisów; dwa — `tartak`, `kamieniolom` — pominięte jako zamknięte w P1.16D-EKONOMIA5X).
**Źródło danych:** `gra/data/terrain-improvements.json` na pinie.
**Kod (dodatkowo):** `gra/src/game/improvement-tech.ts:46-47` na pinie — `IMPROVEMENT_MULTI_TECH_REQ`: `posterunek: ['Obróbka drewna', 'Murarstwo']`.

**Metoda:** parsowanie JSON przez `python3 -I` z kopii w scratchpadzie; porównanie: koszt pracy (wiki „koszt N pracy” vs `koszt_praca`), epoka (wiki „(Kamień/Brąz/Żelazo)” vs `epoka` 1/2/3), technologia (wiki „Tech:” vs `tech`), bonusy na heksie (wiki „Po ukończeniu” i „Przykład liczbowy” vs `bonus` i pola specjalne). Wiki nie podaje wartości `surowiec_ilosc_tura` dla żadnego ulepszenia — te pola oznaczono NIEROZSTRZYGNIĘTE.

**Legenda:** ZGODNE / NIEZGODNE (rozjazd potwierdzony na pinie) / NIEROZSTRZYGNIĘTE (brak liczby w wiki lub brak hasła).

---

## 1. Status per hasło (wiki-hasło → klucze danych)

| # | Hasło wiki (id) | Koszt praca (wiki / dane) | Epoka / tech (wiki / dane) | Bonusy na heksie (wiki / dane) | Status |
|---|---|---|---|---|---|
| 1 | bydlo (`bydlo`) | 20 / 20 — zgodne | Kamień=1 / 1; Oswojenie zwierząt / Oswojenie zwierząt — zgodne | wiki: +2 żyw., +3 praca. dane: żyw. 2, **praca 4**, **handel 3** | **NIEZGODNE** (praca 3 vs 4; wiki pomija handel 3) |
| 2 | droga (`droga`) | 15 / 15 — zgodne | Kamień=1 / 1; Koło / Koło — zgodne | wiki: +2 handel. dane: handel 2 — zgodne | **ZGODNE** |
| 3 | farma (`farma`) | 20 / 20 — zgodne | Kamień=1 / 1; Rolnictwo / Rolnictwo — zgodne | wiki: +3 żyw. dane: żyw. 3, **praca 3**, **handel 3** | **NIEZGODNE** (wiki pomija praca +3 i handel +3) |
| 4 | fort (`fort`) | 25 / 25 — zgodne | Żelazo=3 / 3; Wojskowość / Wojskowość — zgodne | wiki „Przykład” i „Zwrot”: **+2 żyw./t**; wiki „Warunek”: +100% obrony, zasięg 10 — zgodne. dane: `bonus: {}`, zasięg 10, obrona 100 | **NIEZGODNE** (wiki liczbowo zakłada +2 żyw./t, dane nie mają żadnego bonusu heksu) |
| 5 | glinianka (`glinianka`) | 20 / 20 — zgodne | Brąz=2 / 2; Garncarstwo / Garncarstwo — zgodne | wiki: +1 praca. dane: praca 1 — zgodne; **handel 2** i **glina 10** pominięte w wiki | **NIEZGODNE** (wiki pomija handel +2 i glinę) |
| 6 | irygacja (`irygacja`) | 30 / 30 — zgodne | Brąz=2 / 2; Irygacja / Irygacja — zgodne | wiki: +5 żyw. dane: żyw. 5 — zgodne; **praca 2**, **handel 2** pominięte w wiki | **NIEZGODNE** (wiki pomija praca +2 i handel +2) |
| 7a | kopalnia → `kopalnia_miedzi` | **wiki 25 / dane 22 — NIEZGODNE** | wiki „Kamień”=1 / dane 2; wiki „Murarstwo” / dane „Brązownictwo” — **NIEZGODNE** | wiki: +2 praca. dane: praca 2 — zgodne; **handel 5** pominięte | **NIEZGODNE** |
| 7b | kopalnia → `kopalnia_zelaza` | **25 / 22 — NIEZGODNE** | wiki 1 / dane **3**; wiki „Murarstwo” / dane „Hutnictwo żelaza” — **NIEZGODNE** | praca 2 zgodne; **handel 5** pominięte | **NIEZGODNE** |
| 7c | kopalnia → `kopalnia_cyny` | **25 / 22 — NIEZGODNE** | wiki 1 / dane 2; wiki „Murarstwo” / dane „Brązownictwo” — **NIEZGODNE** | praca 2 zgodne; **handel 5** pominięte | **NIEZGODNE** |
| 7d | kopalnia → `kopalnia_zlota` | **25 / 22 — NIEZGODNE** | wiki 1 / dane 2; wiki „Murarstwo” / dane „Waluta” — **NIEZGODNE** | praca 2 zgodne; **handel 10** pominięte | **NIEZGODNE** |
| 8 | lama (`lama`) | 20 / 20 — zgodne | Kamień=1 / 1; Oswojenie zwierząt — zgodne | wiki: +1 żyw., +3 praca. dane: żyw. 1, praca 3 — zgodne; **handel 3** pominięte w wiki | **NIEZGODNE** (wiki pomija handel +3). Ograniczenie „tylko Inkowie” w danych (`cywilizacje`) — poza zakresem liczb, niesprawdzone w wiki |
| 9 | lodzie_rybackie (`lodzie_rybackie`) | 20 / 20 — zgodne | Kamień=1 / 1; Żegluga — zgodne | wiki: +2 żyw., +3 praca. dane: 2 / 3 — zgodne; **handel 3** pominięte | **NIEZGODNE** (wiki pomija handel +3) |
| 10 | oboz_lowiecki (`oboz_lowiecki`) | 18 / 18 — zgodne | Kamień=1 / 1; Łowiectwo — zgodne | wiki: +1 żyw., +1 „złoto”. dane: żyw. 1, **pieniądz** 1 (nazwa do potwierdzenia), **praca 1**, **handel 2** — wiki pomija praca i handel | **NIEZGODNE** (wiki pomija praca +1 i handel +2; „złoto” vs „pieniądz” — nazewnictwo) |
| 11 | owce (`owce`) | 20 / 20 — zgodne | Kamień=1 / 1; Oswojenie zwierząt — zgodne | wiki: +1 żyw., +2 praca. dane: 1 / 2 — zgodne; **handel 2** pominięte | **NIEZGODNE** (wiki pomija handel +2) |
| 12 | posterunek (`posterunek`) | 30 / 30 — zgodne | Brąz=2 / 2; wiki „Tech: -” / dane `tech: "-"`, ale **kod wymaga dwóch technologii** (Obróbka drewna + Murarstwo) — **NIEZGODNE** | wiki „Po ukończeniu”: „efekt specjalny”; wiki „Przykład”/„Zwrot”: **+2 żyw./t**. dane: `bonus: {}`; zasięg 5 i obrona +50% — zgodne | **NIEZGODNE** (brak wymogu 2 technologii w wiki; przykład +2 żyw./t bez podstawy w danych) |
| 13 | tarasy (`tarasy`) | 25 / 25 — zgodne | Brąz=2 / 2; wiki „Tech: -” / dane **„Rolnictwo”** — **NIEZGODNE** | wiki: +3 żyw. dane: żyw. 3 — zgodne; **praca 2**, **handel 2** pominięte | **NIEZGODNE** (tech; wiki pomija praca i handel) |
| 14 | warzelnia_soli (`warzelnia_soli`) | 20 / 20 — zgodne | Brąz=2 / 2; Garncarstwo — zgodne | wiki: +1 „złoto”, +1 żyw. dane: pieniądz 1, żyw. 1 — zgodne (nazewnictwo); **praca 1**, **handel 3** pominięte | **NIEZGODNE** (wiki pomija praca +1 i handel +3) |
| 15 | wyrab / „Wycinka” (`wyrab`) | **wiki S: „?”, wiki M: 20 / dane 2,5 — NIEZGODNE** | Kamień=1 / 1; wiki brak technologii / dane `null` — zgodne | wiki: „+20 Pracy/turę × 3 tury (=60)”, „+2 handel” w przykładzie. dane: **jednorazowo +50 Drewna** (`tury: 1`), handel 1. Wiki: praca; dane: drewno | **NIEZGODNE** (koszt 20 vs 2,5; plon 60 praca×3 tury vs 50 drewna×1; handel 2 vs 1). Wewnętrznie sprzeczne: wiki S „koszt ?” vs wiki M „20 pracy” |

**Hasła danych bez wpisu wiki w kategorii „Ulepszenia terenu”** (nie porównane z wiki):

| Klucz danych | Dane (pin) | Status |
|---|---|---|
| `stadnina` | epoka 2, koszt 28, tech Jeździectwo, praca 2, handel 2, surowiec `kon` 25/turę | **NIEROZSTRZYGNIĘTY** — brak hasła wiki (sprawdzić, czy w innej kategorii wiki) |
| `droga_brukowana` | epoka 3, handel 3, `bonus_ruch: 2` (martwe pole wg `bonus_ruch_uwaga`), upgrade z `droga` | **NIEROZSTRZYGNIĘTY** — brak hasła wiki |

---

## 2. Wyniki zbiorcze

- Wpisy wiki z porównaniem: **15** (`kopalnia` rozbite na 4 klucze danych → 18 wierszy w tabeli §1: 1–6, 7a–7d, 8–15).
- Wpisy **ZGODNE** (cały wpis): **1** (`droga`).
- Wpisy **NIEZGODNE**: **14** (wiersze 1, 3, 4, 5, 6, 7a–7d, 8, 9, 10, 11, 12, 13, 14, 15) — z czego:
  - **koszt pracy niezgodny:** kopalnie ×4 (wiki 25 vs dane 22), wycinka (wiki 20 vs dane 2,5);
  - **epoka/technologia niezgodne:** kopalnie ×4 (wiki „Kamień”/„Murarstwo” vs dane epoki 2/3/2/2 i 4 różne technologie), posterunek (brak wymogu 2 technologii), tarasy (wiki bez technologii vs dane „Rolnictwo”);
  - **wiki pomija część bonusów danych:** farma, glinianka, irygacja, bydło (praca), lama, lodzie, oboz_lowiecki, owce, tarasy, warzelnia_soli, kopalnie (handel);
  - **wiki liczbowo podaje bonus nieobecny w danych:** fort (+2 żyw./t), posterunek (+2 żyw./t) — przykład/zwrot;
  - **wycinka:** rodzaj i wielkość plonu inne (praca 60 w 3 turach vs drewno 50 jednorazowo).
- Wiersze **NIEROZSTRZYGNIĘTE**: 2 klucze danych bez hasła wiki (`stadnina`, `droga_brukowana`); wartości `surowiec_ilosc_tura` (glinianka 50, kopalnie 20/20/20/1, stadnina 25, warzelnia_soli 50) — wiki nie podaje liczb produkcji.

**Uwaga o wyniku „Kopalnia”:** wpis wiki `ulepszenia/kopalnia` opisuje wyłącznie rudę (`Warunek: wydobycie rudy`), a obejmuje 4 klucze danych (miedź/żelazo/cyna/złoto) z różnymi epokami i technologiami — wpis jest niepełny dla 3 z 4 kluczy.

## 3. Zastrzeżenia

- Nie zmieniano `gra/**`; nie uruchamiano testów ani gry.
- Pozycje „zgodne” porównano wyłącznie dla pól, które wiki podaje liczbowo; pola bez pokrycia w wiki oznaczono jako pominięte, nie jako błędne.
- Oznaczenia „złoto” (wiki) vs „pieniądz” (dane) traktowano jako różnicę nazewnictwa do potwierdzenia przez właściciela treści.
- Ograniczenia cywilizacyjne (lama: Inkowie; tarasy: Chińczycy + Inkowie) i wymóg sąsiedztwa rzeki dla irygacji nie zostały porównane z wiki — poza zakresem liczb i nie są przedmiotem tego audytu.
- Pozostałe tematy P1.16F-* piszą do własnych plików; ten plik nie dotyka innych `P1-16*`.
