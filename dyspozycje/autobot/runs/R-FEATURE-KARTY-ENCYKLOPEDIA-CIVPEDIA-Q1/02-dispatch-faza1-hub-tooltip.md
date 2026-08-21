# 02-dispatch-faza1-hub-tooltip — R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1

TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 (FAZA 1 z 6 — patrz plan w
docs/decyzje/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1.md, sekcja „Wnioski dla kolejności prac")

GOAL tej fazy: osobna, zawsze widoczna mała ikonka informacyjna „ⓘ" na węzłach/ikonach
technologii w hubie badań (`scienceHubHud.ts`, `techTreeView.ts`), niezależna od kliknięcia
całego wiersza/węzła — klik ikonki otwiera kartę podglądu technologii
(`showTechDiscoveryNotice(..., kind:'preview')`, już istnieje i działa), klik reszty wiersza
zachowuje dzisiejsze zachowanie bez zmian.

## ECHO (Pytanie 3 = B)

Właściciel prosił o to trzykrotnie w różnych wiadomościach mimo że całe-wiersz-klikalne już
technicznie otwiera kartę — silny sygnał że potrzebna jest WIDOCZNA, jawna afordancja, nie
tylko działający mechanizm.

## Zakres (z recon, `01-operator-recon.md`)

- `gra/src/ui/scienceHubHud.ts`, `buildEntryRow()` (linia ~574) — dziś cały wiersz to jedna
  strefa klikalna (funkcja `act()` linia ~624 otwiera `showTechDiscoveryNotice`). Dodać
  osobny mały element (ikonka/przycisk) WEWNĄTRZ wiersza, z własnym `stopPropagation()` na
  kliknięciu, wołający TĘ SAMĄ funkcję co dziś woła całe-wiersz-klik (żadnej duplikacji logiki
  otwierania karty — tylko nowy punkt wejścia).
- `gra/src/ui/techTreeView.ts`, węzły `.civ-ttv-tn` (klik na linii ~929) — analogicznie, dodać
  osobną małą ikonkę wewnątrz węzła.
- `gra/src/ui/cityPanel.ts`, `techIconHintSpan()` (linia ~6792) — dziś martwa dekoracja (ikona
  bez `onClick`). Zamienić na klikalny link do `showTechDiscoveryNotice(..., kind:'preview')`
  — to jest DOKŁADNIE ten sam wzorzec co wyżej, trzecie miejsce gdzie ikona technologii się
  pojawia.

## Ograniczenia

- NIE zmieniać zachowania kliknięcia całego wiersza/węzła (musi zostać identyczne jak dziś —
  to nadal otwiera kartę, tak jak teraz).
- NIE dotykać samej karty podglądu (`showTechDiscoveryNotice`/`techDiscoveryNotice.ts`) — ta
  funkcjonalność już istnieje i działa, ten temat tylko dodaje nowe punkty wejścia do niej.
- Ikonka musi być widoczna, ale nie może zasłaniać/kolidować z istniejącym layoutem wiersza —
  sprawdzić wizualnie (build + zrzut ekranu jeśli możliwe) przed zgłoszeniem PASS.
- To jest NIEZALEŻNE od dużego refaktoru (Pytanie 1 = B, wspólny kontrakt karty encji) —
  NIE czekać na niego, NIE próbować go zaczynać w tym dispatchu. To jest czysto UI/click-zone
  zmiana na już istniejącym mechanizmie.

## Branch

`autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1` (z `main`, `acd40380`... aktualny tip po
rejestracji i ECHO, patrz `git log`).
