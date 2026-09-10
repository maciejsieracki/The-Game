TEMAT:  R-KARTY-OPIS-TOP3-B1-Q1
RUNDA:  1/5
DATA:   2026-09-10
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Część 1 z wielu (fala treści, wzorem `R-KARTY-HISTORIA-Q1`) projektu uzupełnienia treści
kart encji o pola „Opis" i „Top 3", odłożone jako „przyszła fala" przez
`P-KARTA-PRZEBUDOWA-UKLAD-Q1` (infrastruktura już gotowa i zintegrowana — sekcje „Opis"/
„Top 3" renderują się automatycznie, gdy pole źródłowe jest niepuste; dziś puste dla
KAŻDEGO budynku/jednostki w grze). Właściciel potwierdził start tej fali NA ŻYWO
2026-09-10, równolegle z innymi tematami w toku (Etap 8 hot-seat, wojny AI, karty
technologii/ulepszenia).

## GOAL

Dopisz DWA pola do KAŻDEGO z poniższych 14 budynków w `gra/data/buildings.json`:
- `opis` (dokładnie ta nazwa, MAŁE litery — konwencja `buildings.json`, zgodna z
  `historia`/`uwagi`/`wymagania`): string, 1-2 zdania.
- `top3` (małe litery): tablica DOKŁADNIE 3 obiektów `{ "tytul": "...", "tekst": "..." }`
  — `tytul` = krótka nazwa efektu/odblokowania (2-4 słowa), `tekst` = jedno zdanie
  wyjaśniające.

1. stolarnia
2. kamieniarski
3. kuznia
4. odlewnia_brazu
5. odlewnia_zelaza
6. wielka_odlewnia
7. targowisko
8. port
9. port_wielki
10. spichlerz
11. spichlerz_ii
12. garncarnia
13. cegielnia
14. kamienne_kregi

(Ta sama lista 14 budynków co `R-KARTY-HISTORIA-B1-Q1` — celowa spójność wsadu, ułatwia
przyszłą weryfikację jednej karty pokazującej już WSZYSTKIE nowe sekcje razem: Rys
historyczny + Opis + Top 3.)

## WYTYCZNE PISANIA

**`opis` (1-2 zdania):** krótkie, growe podsumowanie ROLI budynku w rozgrywce — NIE
historia (to osobne pole `historia`, już wypełnione dla tych 14 pozycji), NIE powtórz
liczb z innych sekcji karty (koszt/wymagania — to już jest gdzie indziej). Styl:
przystępny, jak krótki podpis w Civilopedii. Przykład (kalibracja tonu, NIE kopiuj
treści): „Stolarnia przetwarza drewno w gotowe elementy budowlane, przyspieszając
rozwój miasta i odblokowując bardziej zaawansowane konstrukcje."

**`top3` (3 pozycje):** najważniejsze, KONKRETNE efekty/odblokowania TEGO budynku
— przeczytaj jego realne dane (`baza`/`przyrost`/`odblokowuje`/`techUnlock` w
`buildings.json`) i opisz 3 NAJISTOTNIEJSZE z nich własnymi słowami, NIE fikcyjne/
wymyślone efekty. Jeśli budynek ma mniej niż 3 wyraźnie odrębne efekty — dozwolone
jest, żeby trzecia pozycja opisywała efekt pośredni/synergiczny (np. "przyspiesza
rozwój sąsiednich budynków X"), ale MUSI być prawdziwa względem danych, nie zmyślona.

**ZAKAZANE (oba pola):** identyfikatory tematów/decyzji/ID z tego repozytorium, tekst
deweloperski, odniesienia do „gracza"/UI w trzeciej osobie technicznej (np. "gracz
odblokowuje"), duplikacja zdań z pola `historia` tych samych budynków.

Format JSON: zwykłe stringi UTF-8 z polskimi znakami wprost (nie `\uXXXX`), `top3` jako
tablica obiektów jak wyżej. Zwaliduj `jq . gra/data/buildings.json` przed zakończeniem.
NIE zmieniaj żadnego INNEGO pola żadnego budynku (w tym pola `historia` — zostaje
nietknięte) i żadnego budynku SPOZA tej listy 14.

## DOWÓD WIZUALNY (obowiązkowy, nowy wymóg właściciela 2026-09-10)

Po wdrożeniu treści zrób ŻYWY zrzut ekranu (Playwright/Chromium, ten sam build co reszta
weryfikacji) karty JEDNEGO z tych 14 budynków (np. Stolarnia) pokazujący WSZYSTKIE trzy
nowe/uzupełnione elementy naraz: sekcję „Opis" z treścią, sekcję „Rys historyczny" z
treścią (już istniała), sekcję „Top 3" z 3 wypełnionymi pozycjami — w poprawnej kolejności
(Wymagania→Opis→Rys historyczny→Top 3→...). Zapisz PNG w worktree pod ścieżką
`dowody/opis-top3-stolarnia.png` (utwórz katalog `dowody/` jeśli nie istnieje) i podaj
DOKŁADNĄ ścieżkę pliku w polu ZMIANY raportu — orkiestrator odbierze plik i pokaże go
właścicielowi. Brak zrzutu = temat NIE jest kompletny, niezależnie od zielonych testów.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. `jq . gra/data/buildings.json` nie zwraca błędu składni.
2. Wszystkich 14 budynków ma niepuste `opis` (1-2 zdania) i `top3` (dokładnie 3 pozycje,
   każda z niepustym `tytul` i `tekst`).
3. `git diff` pokazuje WYŁĄCZNIE dodane pola `opis`/`top3` w tych 14 wpisach — zero innych
   zmian (w tym zero zmian pola `historia`).
4. Zrzut ekranu (patrz wyżej) istnieje, pokazuje wszystkie 3 sekcje z treścią, w
   poprawnej kolejności.
5. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych bez regresu + istniejące testy
   entity-cards/CivPedia (w tym `entity-card-historia-section-test.cjs` i odpowiedniki dla
   budynku) bez regresu.

## Allowlista

- `gra/data/buildings.json` (WYŁĄCZNIE pola `opis`/`top3` tych 14 wpisów)
- `dowody/opis-top3-stolarnia.png` (nowy plik, dowód)

Zakazane: wszystko inne, w tym `gra/src/ui/entityCards/*` (infrastruktura już gotowa,
zero zmian kodu w tym temacie), `gra/data/units.json` (osobna, przyszła fala — inna
konwencja pól, `Opis`/`Top3` wielką literą), pliki z sekretami, `docs/decyzje/*.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-karty-opis-top3-b1`, gałąź `autobot/R-KARTY-OPIS-TOP3-B1-Q1`,
baza `origin/main`. C-001: zakaz `npm run build`/`dev` w `gra/`; dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir`
oraz `node ./node_modules/typescript/bin/tsc --noEmit`. Testy Chromium sekwencyjnie —
sandbox dzieli 4 rdzenie z kilkoma innymi równolegle działającymi tematami tej sesji.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi. Po 5
rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 500 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`. Nie
integrujesz, nie deployujesz, nie pushujesz, nie commitujesz.
