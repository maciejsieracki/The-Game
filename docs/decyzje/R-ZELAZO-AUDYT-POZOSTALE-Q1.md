# R-ZELAZO-AUDYT-POZOSTALE-Q1 — audyt jakości pozostałych 19 modeli 3D epoki Żelazo

**Status:** W TRAKCIE (2026-08-25)

## Sytuacja

Kontynuacja `R-ZELAZO-MODELE-BRAKUJACE-Q1` (zamknięty — 6 jednostek Żelaza bez
dedykowanego modelu/ze zdublowanym modelem naprawionych i zdeployowanych, FALA 321).

Właściciel trafnie skorygował zakres: „mieć dedykowany model" ≠ „przeszedł proces
Opus 5". Pozostałe **19 jednostek** epoki Żelaza mają WPRAWDZIE dedykowany dispatch
po nazwie (nie generyczny fallback), ale żyją w starszych plikach generacji
(`jednostki-z1-mezopotamia.ts`, `jednostki-z2-srodziemne.ts`, `jednostki-z3-plemiona.ts`,
`jednostki-p6-super.ts`) — NIE w konwencji `<epoka>-<jednostka>-opus5.ts` używanej
w tej i poprzedniej serii (`R-BRAZ-SUPER-DISPATCH-Q1`, T1-T4 tej serii). Żadna z nich
nigdy nie przeszła rygorystycznego audytu: zmierzonej geometrii (nie tylko odczytu
kodu), sekcji historycznej ze źródłami, real-render dowodu. Ten sam wzorzec błędu
znaleziony wielokrotnie w T1-T4 (broń przebijająca ciało, tarcza niewidoczna dla
kamery gry, ramię bez zgięcia łokcia) mógł powstać w KTÓREJKOLWIEK z tych 19 jednostek
i nigdy nie zostać wykryty, bo nikt tego nie zmierzył.

## ECHO właściciela (2026-08-25, główny czat orkiestratora)

Właściciel: „to trzeba zrobić nowe modele opus 5 na wszystkich 25 pozostałych" —
doprecyzowane pytaniem ABC: **wyłącznie pozostałe ~19 jednostek nigdy niezweryfikowanych
pod tym kątem** (nie ponowna praca nad 6 już ukończonymi w `R-ZELAZO-MODELE-BRAKUJACE-Q1`).

## Lista 19 jednostek do audytu

| Jednostka | Kultura | Dzisiejszy plik |
|---|---|---|
| Garnizon Harappy | Harappa | `jednostki-z1-mezopotamia.ts` |
| Gwardia hetycka | Hetyci | `jednostki-z1-mezopotamia.ts` |
| Mur tarcz (Sargonid) | Sumerowie | `jednostki-z1-mezopotamia.ts` |
| Piechota neobabilońska | Babilonia | `jednostki-z1-mezopotamia.ts` |
| Gwardia Tyreńska | Fenicjanie | `jednostki-z2-srodziemne.ts` |
| Tyrski miecznik | Fenicjanie | `jednostki-z2-srodziemne.ts` |
| Wojownik z żelaznym khopesh | Egipt | `jednostki-z2-srodziemne.ts` |
| Thorakites | Grecja | `jednostki-z2-srodziemne.ts` |
| Evocati (super) | Rzym | `jednostki-p6-super.ts` (przez `buildSuperUnit`) |
| Triari (super) | Rzym | `jednostki-z2-srodziemne.ts` (przez `buildSuperUnit`) |
| Hieros Lochos (super) | Grecja | `jednostki-p6-super.ts` (przez `buildSuperUnit`) |
| Hastati | Rzym | `hastati-opus5.ts` — JUŻ konwencja Opus 5, lekka weryfikacja zamiast pełnej przebudowy |
| Berserker germański | Germanie | `jednostki-z3-plemiona.ts` |
| Wojownik germański (super) | Germanie | `jednostki-z3-plemiona.ts` (przez `buildSuperUnit`) |
| Miecznik galijski | Celtowie | `jednostki-z3-plemiona.ts` |
| Rydwan celtycki | Celtowie | `units.ts` (`case 'rydwan'` + `decorateChariot` — CZĘŚCIOWO generyczna bryła) |
| Drużynnik | Słowianie | `jednostki-z3-plemiona.ts` |
| iButho z iklwa | Zulusi | `jednostki-z3-plemiona.ts` |
| Katapulta | (brak kultury) | `units.ts` (lokalna funkcja) |

## Podział na tematy AutoBot (sekwencyjne, wspólny plik `units.ts`)

| Temat | Jednostki | Uzasadnienie grupowania |
|---|---|---|
| T5 | Garnizon Harappy, Gwardia hetycka, Mur tarcz (Sargonid), Piechota neobabilońska | Mezopotamia, jeden plik |
| T6 | Gwardia Tyreńska, Tyrski miecznik, Wojownik z żelaznym khopesh, Thorakites | Fenicja/Egipt/Grecja piechota, jeden plik |
| T7 | Evocati, Triari, Hieros Lochos, Hastati | Super-jednostki Rzym/Grecja + lekka weryfikacja Hastati (już Opus 5) |
| T8 | Berserker germański, Wojownik germański | Germanie |
| T9 | Miecznik galijski, Rydwan celtycki | Celtowie pozostali |
| T10 | Drużynnik, iButho z iklwa | Słowianie + Zulusi |
| T11 | Katapulta | Samodzielna, bez kultury |

## Kryteria wspólne dla wszystkich T (obowiązują każdy dispatch)

1. **Zmierzyć, nie zaufać kodowi** — dokładnie jak w T1-T4: zbudować model w żywym
   Three.js, zmierzyć relacje geometryczne (nie tylko obecność/liczbę mesh), sprawdzić
   kolizje broni z ciałem/koniem, orientację tarcz względem kamery gry (azymut 0 —
   dokładnie błąd znaleziony w T2), proporcje względem `HEX_R`.
2. Dodać/uzupełnić sekcję „ZGODNOŚĆ HISTORYCZNA" (styl K1-Kn, realne źródła cytowane,
   nie zgadywanie) jeśli jej nie ma lub jest niepełna.
3. Naprawić każdy realny błąd znaleziony pomiarem — nie zostawiać „jak jest" tylko
   dlatego że już istniało.
4. Zero regresji dla innych jednostek/kultur — potwierdzone testem regresji + 5 bramek
   referencyjnych + testy T1-T4 (bez regresji).
5. Real render Playwright/Chromium (bezwarunkowy wymóg, `R-PROC-AUTOBOT.md` §9 poz. 6a)
   z dowodem nietautologiczności (mutacja pojedyncza per asercja, wzorem T4).
6. `tsc --noEmit` i `vite build` (C-001) czyste.
7. Model/effort: **Opus 5 High dla Operatora i Evaluatora** (temat czysto wizualny,
   `R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High. `opts.model` jawnie na
   KAŻDYM wywołaniu `agent()` (C-062 — nie tylko w `meta.phases`).

## Postęp implementacji

- **T5 — ZINTEGROWANE (2026-08-25, 1 runda).** Garnizon Harappy, Gwardia hetycka,
  Mur tarcz (Sargonid), Piechota neobabilońska. Plik nie nazywał ani jednego mesh —
  dodane nazwy/anchors umożliwiły pierwszy w historii pomiar. Znalezione i naprawione:
  włócznia Muru tarcz przechodząca przez własne ramię, przedramię przechodzące przez
  pole tarczy. Pozostałe trzy potwierdzone jako poprawne z dowodem pomiaru. Integration
  micro-fix: fałszywe zapewnienie w komentarzach dispatchu EN poprawione przed mergem
  (ryzyko dla T6). Jedno znalezisko danych (`Mur tarcz (Sargonid)` — Kultura vs nazwa)
  zarejestrowane osobno, wymaga decyzji właściciela.
- T6–T11: patrz `dyspozycje/autobot/runs/R-ZELAZO-AUDYT-POZOSTALE-Q1-T{6..11}/`.
