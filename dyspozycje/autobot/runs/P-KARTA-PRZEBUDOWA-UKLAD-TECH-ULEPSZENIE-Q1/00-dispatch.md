# Dispatch — P-KARTA-PRZEBUDOWA-UKLAD-TECH-ULEPSZENIE-Q1

## Kontekst

Kontynuacja `P-KARTA-PRZEBUDOWA-UKLAD-Q1` (budynek/jednostka, zintegrowane) na pozostałe
dwa typy kart encji: technologia (`technologyAdapter.ts`) i ulepszenie terenu
(`improvementAdapter.ts`). Właściciel rozstrzygnął 3 pytania ABC 2026-09-10 (AskUserQuestion):

- **Q1 (sekcje „co odblokowuje" technologii) = zostaw 4 osobne, tylko przenieś.** NIE scalać
  Budynków/Jednostek/Ulepszeń terenu/Kolejnych technologii w jedną sekcję — tylko zmienić ich
  pozycję w nowym układzie.
- **Q2 (sekcja „Charakterystyka") = dodać dla OBU typów** (technologia I ulepszenie terenu),
  mimo że oryginalny plan `P-KARTA-PRZEBUDOWA-UKLAD-Q1` obejmował tylko budynek/jednostkę.
- **Q3 (pozycja „Rys historyczny") = ujednolicić na pozycję 4 we WSZYSTKICH czterech typach
  kart**, zgodnie z pierwotną decyzją ABC z `P-KARTA-PRZEBUDOWA-UKLAD-Q1` (uchylenie
  `P-KARTA-OPIS-PRZED-STATYSTYKAMI-Q1`), którą dziś realizuje tylko budynek/jednostka.

## Punkt odniesienia — mechanizm renderera (przeczytaj PRZED implementacją)

`gra/src/ui/entityCards/renderer.ts` ok. linii 441-461: stała
`const HISTORIA_SECTION_INDEX = 2;` wstawia `data.historicalNote` na STAŁYM, surowym indeksie
tablicy `data.sections` — WSPÓLNA dla wszystkich 5 `kind`. Dla budynku/jednostki działa
poprawnie, bo `sections[0]` = Wymagania i `sections[1]` = Opis (zarezerwowany slot, choćby
pusty) — więc indeks 2 = „zaraz po Opisie" = pozycja 4 zaakceptowanego układu. Dla technologii
i ulepszenia dziś NIE działa spójnie, bo ich `sections[0]`/`sections[1]` to co innego
(`actionsSection`/`buildingsSection` dla technologii; `bonusSection`/`requirementsSection` dla
ulepszenia) — więc ten sam indeks 2 ląduje w innym, przypadkowym miejscu.

**NIE zmieniaj `HISTORIA_SECTION_INDEX` ani mechanizmu w `renderer.ts`.** Zamiast tego
przebuduj KOLEJNOŚĆ `sections` w obu adapterach tak, żeby `sections[0]` = Wymagania i
`sections[1]` = Charakterystyka (nowa, patrz niżej) — wtedy istniejący, niezmieniony mechanizm
wstawi historię DOKŁADNIE w tym samym strukturalnym miejscu co dla budynku/jednostki
(„zaraz po Charakterystyce", odpowiednik „zaraz po Opisie"), bez dotykania `renderer.ts`.

## GOAL

Karta technologii i karta ulepszenia terenu dostają:
1. `sections[0]` = **Wymagania** (już istnieje w obu adapterach — tylko przenieś na pozycję 0).
2. `sections[1]` = **Charakterystyka** (NOWA sekcja, patrz niżej) — kluczowe liczby danej
   encji, jedna sekcja, bez linków, styl analogiczny do `buildingAdapter.ts`/`unitAdapter.ts`
   (sprawdź te dwa pliki jako wzorzec formatowania „Charakterystyki" — POZA allowlistą tego
   tematu, tylko do odczytu jako wzorzec).
3. Reszta sekcji (Q1: 4 osobne dla technologii, niescalane) przesunięta NIŻEJ, za miejsce
   wstawienia historii — kolejność między nimi zostaje jak dziś (Budynki→Jednostki→Ulepszenia
   terenu→Kolejne technologie→Zmiany ekonomiczne dla technologii; Surowce i terytorium→
   Dodatkowe informacje dla ulepszenia).
4. `historicalNote` (już istnieje w obu adapterach — `historicalNoteOf()`/`improvement.historia`)
   zostaje BEZ ZMIAN — sam mechanizm w `renderer.ts` już go wstawi poprawnie, gdy `sections[0]/[1]`
   będą we właściwej kolejności.

### Zawartość sekcji „Charakterystyka" — technologia (`technologyAdapter.ts`)

Z `tech.json` (pola już czytane gdzie indziej w tym adapterze albo łatwo dostępne z `RawTech`):
`Koszt nauki` (jednorazowy), `Epoka`, `Poziom`, opcjonalnie `Dostęp do surowca.` jeśli niepuste
(informacyjnie, BEZ duplikowania tego co już jest w `actionsSection`/`econSection` — jeśli uznasz
że duplikuje się treściowo, zostaw tylko w jednym miejscu i uzasadnij wybór w raporcie, nie
kasuj `actionsSection` bez uzasadnienia bo to poza zakresem tego GOAL).

### Zawartość sekcji „Charakterystyka" — ulepszenie terenu (`improvementAdapter.ts`)

Kandydaci z `FullImprovementRow` (już czytane w pliku): `koszt_praca` (dziś w Wymaganiach —
ZOSTAW w Wymaganiach, nie duplikuj), `typ`, `epoka` (dziś tylko w `subtitle`, może zostać
WYŁĄCZNIE tam). Sekcja „Bonusy (obrabiane pole)" (`bonusSection`, dziś pierwsza) jest
KONCEPCYJNIE bardzo bliska „Charakterystyce" (bonus{}, bonus_obrona_proc, bonus_ruch) —
**zdecyduj: albo przemianuj/przenieś `bonusSection` samą w sobie na rolę „Charakterystyki”
(sections[1]), albo trzymaj je jako dwie osobne sekcje w tej kolejności (Charakterystyka,
potem Bonusy)** — wybierz TO, co nie duplikuje treści i nie zostawia pustej sekcji; udokumentuj
decyzję w raporcie. W obu przypadkach `sections[0]` musi być Wymaganiami (dziś `requirementsSection`,
przenieś z pozycji 1 na 0).

## Reguła przeciw samooszukiwaniu

Zakaz uznania tematu za zamknięty na podstawie samego czytania kodu — to jest temat wizualny.
Wymagany żywy zrzut Chromium (CivPedia lub karta w grze) dla OBU typów: (1) karta technologii
z wypełnioną historią pokazująca kolejność Wymagania→Charakterystyka→Rys historyczny→(4 sekcje
odblokowań w niezmienionej wzajemnej kolejności)→Zmiany ekonomiczne; (2) karta ulepszenia terenu
z wypełnioną historią pokazująca analogiczną kolejność. Dodatkowy dowód: karta BEZ wypełnionej
historii (np. encja bez `Historia`/`historia` w danych) nie renderuje pustej sekcji (zero
regresji zachowania "brak węzła gdy brak danych", already existing).

## Binarne kryterium sukcesu

Nowy test (lub rozszerzenie istniejącego testu entity-cards, sprawdź `gra/tools/*.cjs` po
nazwach zawierających „entitycard"/„civpedia"/„karta") dowodzący na żywym Chromium: (a) dla
technologii z wypełnioną historią, DOM pokazuje sekcje w kolejności Wymagania, Charakterystyka,
Rys historyczny, [4 sekcje odblokowań], Zmiany ekonomiczne; (b) dla ulepszenia z wypełnioną
historią, DOM pokazuje Wymagania, Charakterystyka (lub przemianowane Bonusy pełniące tę rolę),
Rys historyczny, Surowce i terytorium, Dodatkowe informacje; (c) `tsc --noEmit` czysty; (d) 5
bramek referencyjnych zielone; (e) zero regresji istniejących testów entity-cards/CivPedia
(przeszukaj i uruchom wszystkie pasujące, w tym testy `P-KARTA-PRZEBUDOWA-UKLAD-Q1` dla
budynku/jednostki — MUSZĄ zostać zielone, ten temat ich nie dotyka).

## Allowlista

- `gra/src/ui/entityCards/technologyAdapter.ts`
- `gra/src/ui/entityCards/improvementAdapter.ts`
- odpowiedni istniejący/nowy plik `gra/tools/*-test.cjs` dla kart encji

Zakazane: `gra/src/ui/entityCards/renderer.ts` (mechanizm `HISTORIA_SECTION_INDEX` zostaje
NIETKNIĘTY — patrz „Punkt odniesienia" wyżej), `gra/src/ui/entityCards/buildingAdapter.ts`,
`gra/src/ui/entityCards/unitAdapter.ts`, `gra/src/ui/entityCards/wonderAdapter.ts`,
`gra/src/ui/entityCards/types.ts`, `gra/src/ui/entityCards/registry.ts`, `gra/data/*.json`
(zero zmian danych — to temat układu, nie treści), pliki z sekretami, `docs/decyzje/*.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-karta-tech-ulepszenie`, gałąź
`autobot/P-KARTA-PRZEBUDOWA-UKLAD-TECH-ULEPSZENIE-Q1`, baza `origin/main`. C-001: zakaz
`npm run build`/`dev` w `gra/`; dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir` oraz
`node ./node_modules/typescript/bin/tsc --noEmit`. Testy Chromium sekwencyjnie.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi. Po 5 rundach:
LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 500 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`. Nie integrujesz,
nie deployujesz, nie pushujesz.
