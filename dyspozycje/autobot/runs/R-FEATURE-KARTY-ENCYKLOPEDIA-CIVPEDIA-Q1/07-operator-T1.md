# 07-operator-T1 — R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, T1 KONTRAKT-KARTA-ENCJI

```text
STATUS: BLOCK
TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 / T1 KONTRAKT-KARTA-ENCJI
GOAL: Zbudować fundament wspólnego kontraktu karty encji (types.ts, slug.ts,
      registry.ts, renderer.ts, adaptery-szkielety) jako wyłącznie nowe pliki
      w gra/src/ui/entityCards/**, zero edycji istniejących kart, plus test
      fixture renderera dla 4 kinds w trybie dialog.
ZMIANY/COMMIT: BRAK ZMIAN W KODZIE. Zgodnie z dyspozycją T1 i planem architektury
      §2 ("jeśli się różnią na którymkolwiek realnym wpisie, zatrzymaj się i
      zgłoś to jako BLOKADĘ zamiast cicho wybierać jedną wersję"), zatrzymałem
      pracę PRZED napisaniem gra/src/ui/entityCards/slug.ts — a więc też przed
      registry.ts (resolver dla `unit` ma być budowany na skonsolidowanym
      slugify()) — bo weryfikacja na prawdziwych danych gry wykazała realny,
      nietrywialny dryf między dwiema istniejącymi implementacjami. Żaden plik
      w gra/src/ nie został utworzony ani zmieniony; worktree jest czysty
      (`git status` = nothing to commit, working tree clean, commit bazowy
      f97875bd niezmieniony).
TESTY: Nie uruchamiałem `tsc --noEmit` ani build weryfikacyjny — nie ma jeszcze
      nowego kodu do skompilowania (BLOCK poprzedza implementację). Weryfikacja
      dryfu slugów wykonana ad-hoc w Node (poza drzewem gry, tylko odczyt
      istniejących gra/data/*.json), wynik niżej.

## Dowód dryfu (dokładnie ta weryfikacja, o którą prosi dispatch)

Dwie istniejące implementacje:
- `slugify()` prywatne w `gra/src/ui/sciencePicker.ts:99` — NFD-normalize +
  strip combining marks (`̀-ͯ`) + `[^a-z0-9]+` → `_`.
- `slugifyImprovementLabel()` w `gra/src/game/research.ts:199` — jawna tabela
  `PL_DIACRITICS` (ą→a, ć→c, ę→e, ł→l, ń→n, ó→o, ś→s, ź→z, ż→z) + ten sam
  `[^a-z0-9]+` → `_`.

Przyczyna źródłowa dryfu: polskie „ł" (U+0142, LATIN SMALL LETTER L WITH
STROKE) NIE jest kompozycją bazowej litery + znak diakrytyczny w sensie
Unicode — to samodzielny punkt kodowy, którego Unicode NFD nie rozkłada na
`l` + combining mark. NFD-strip w `sciencePicker.ts` więc go NIE usuwa; trafia
w regex `[^a-z0-9]+` i zamienia się w podkreślenie zamiast w `l`, jak robi
jawna tabela w `research.ts`.

Uruchomiłem obie funkcje (skopiowane 1:1 z kodu źródłowego) na WSZYSTKICH
realnych polskich nazwach z `gra/data/tech.json` (pole `Technologia`),
`gra/data/units.json` (pole `Jednostka`) i kluczach obiektu
`gra/data/terrain-improvements.json` — 131 nazw łącznie, 14 rozbieżnych
(wszystkie zawierające „ł"):

| kind | nazwa źródłowa | slugify() z sciencePicker.ts | slugifyImprovementLabel() z research.ts |
|---|---|---|---|
| tech | `Łowiectwo` | `owiectwo` | `lowiectwo` |
| tech | `Łucznictwo` | `ucznictwo` | `lucznictwo` |
| tech | `Koło` | `ko_o` | `kolo` |
| unit | `Łucznik` | `ucznik` | `lucznik` |
| unit | `Włócznik` | `w_ocznik` | `wlocznik` |
| unit | `Rydwan (woły)` | `rydwan_wo_y` | `rydwan_woly` |
| unit | `uThulwana (Białe Tarcze)` | `uthulwana_bia_e_tarcze` | `uthulwana_biale_tarcze` |
| unit | `Łucznik egipski` | `ucznik_egipski` | `lucznik_egipski` |
| unit | `Łucznik nubijski` | `ucznik_nubijski` | `lucznik_nubijski` |
| unit | `Łucznik sumeryjski` | `ucznik_sumeryjski` | `lucznik_sumeryjski` |
| unit | `Włócznik sumeryjski` | `w_ocznik_sumeryjski` | `wlocznik_sumeryjski` |
| unit | `Łucznik akadyjski` | `ucznik_akadyjski` | `lucznik_akadyjski` |
| unit | `Konnica łucznicza asyryjska` | `konnica_ucznicza_asyryjska` | `konnica_lucznicza_asyryjska` |
| unit | `Łucznik asyryjski` | `ucznik_asyryjski` | `lucznik_asyryjski` |

`terrain-improvements.json`: 0 rozbieżnych kluczy w próbce (żaden klucz obiektu
nie zawiera „ł" — te klucze są już dziś zapisane po-angielsku/slug-like w
samym JSON-ie, np. `kopalnia_miedzi`), ale `research.ts:228`
(`improvementGateMet`) woła `slugifyImprovementLabel()` właśnie na POLSKIEJ
ETYKIECIE technologii (`tech['wymagane ulepszenie']`), nie na kluczu JSON-a —
więc gdyby taka etykieta kiedyś zawierała „ł" (dziś sprawdzone: żadna z
obecnych etykiet „wymagane ulepszenie" w tech.json go nie zawiera, ale to
przypadek danych dzisiaj, nie gwarancja kontraktu), różnica ujawniłaby się
też tam.

To nie jest kosmetyczna różnica w formatowaniu — to utrata litery w 8 z 14
przypadków (np. `Łucznik` → `ucznik`, nie `lucznik`) w wersji
`sciencePicker.ts`. Konsolidacja do jednego `slugify()` w
`entityCards/slug.ts` wymaga decyzji, KTÓRA wersja staje się kanoniczna:

1. Jeśli wybiorę wariant `research.ts` (jawna tabela) jako kanoniczny — dziś
   działający `TECH_MAP`/`techToSlug`/`techNameFromSlug` w `sciencePicker.ts`
   (a więc CAŁE dzisiejsze drzewko technologii, m.in. `prereqIds` resolving
   liniami 174–188 tego samego pliku) używa WŁASNEGO, wewnętrznego
   `slugify()`, NIE nowego skonsolidowanego — więc same drzewko się nie
   zepsuje (recon T1 miał je reużyć, nie zastępować), ale nowy `slug.ts`
   dawałby DLA TYCH SAMYCH NAZW inny slug niż `TECH_MAP` klucze. Adapter
   `technologyAdapter.ts` musi wtedy identyfikować encję przez
   `techToSlug()`/`TECH_MAP` (czyli wariant A), a NIE przez nowy skonsolidowany
   `slug.ts` (wariant B) — inaczej `id` z kontraktu nie trafi w klucz `TECH_MAP`
   dla nazw z „ł" (8 z ok. 45 technologii = ~18%, w tym baza „Łowiectwo").
2. Jeśli wybiorę wariant `sciencePicker.ts` (NFD-strip) jako kanoniczny —
   `research.ts:220-230` (`improvementGateMet`, realny gating budowy ulepszeń
   opisany w dispatchu) polega dziś na wariancie z tabelą; podmiana groziłaby
   cichym zerwaniem gatingu dla dowolnej przyszłej etykiety z „ł", nawet jeśli
   dziś żadna taka nie istnieje.
3. Trzecia opcja (i moja rekomendacja) — NOWY `slug.ts` w `entityCards/`
   implementuje WŁASNY, POPRAWNY algorytm (tabela `PL_DIACRITICS` pełna, po
   wzorze `research.ts`, bo daje kompletną transliterację bez utraty liter) i
   NIE jest używany do zastąpienia żadnej z dwóch istniejących funkcji w tym
   kroku (T1 i tak tego nie robi — dispatch już zastrzega "REUŻYWAJ TECH_MAP,
   nie duplikuj"). To usuwa ryzyko regresji w T1, ale zostawia PYTANIE
   WŁAŚCICIELA na kolejne tematy (T4+ dla jednostek, gdzie `unitToSlug` jest
   całkiem nowe i nie ma dziś żadnego prawdziwego poprzednika do zachowania
   kompatybilności): czy `entityCards/slug.ts` ma docelowo ZASTĄPIĆ oba stare
   warianty (wymaga świadomej decyzji + planu migracji `research.ts` gatingu,
   bo dziś na nim polega prawdziwa rozgrywka), czy współistnieć obok nich na
   zawsze jako TRZECI, tylko dla nowych `entityCards/**`.

## Rekomendacja / pytanie do ABC (nie decyduję sam, zgodnie z dyspozycją)

Potrzebna jest jawna decyzja właściciela/ABC, którą z 3 opcji przyjąć, ZANIM
napiszę `slug.ts` i zależny od niego `registry.ts` (unit-resolver). Proponuję
zarejestrować to jako pytanie w `dyspozycje/PYTANIA-OTWARTE.md` z treścią
powyższej tabeli i 3 opcji, i wstrzymać T1 na tym pytaniu — reszta fundamentu
(`types.ts`, `renderer.ts`, adaptery-szkielety poza unit-resolverem, test
fixture) NIE zależy od tej decyzji i mogłaby zostać zbudowana równolegle w
kolejnym przebiegu, ale w TYM przebiegu operatorskim zatrzymuję się w całości,
bo dyspozycja T1 explicite każe "ZATRZYMAĆ SIĘ" (nie "kontynuować częściowo")
w momencie wykrycia dryfu, a `registry.ts` jest w tej samej liście plików do
utworzenia co `slug.ts` — nie chcę tworzyć połowicznego fundamentu, który
Evaluator musiałby oceniać wiedząc, że jeden plik i tak pójdzie do przeróbki
po decyzji ABC.
BLOKADY:
  - Realny dryf slugify() (sciencePicker.ts) vs slugifyImprovementLabel()
    (research.ts) na 14/131 prawdziwych polskich nazwach z danych gry
    (wszystkie zawierające literę „ł" — patrz tabela wyżej). Wymagana decyzja
    właściciela/ABC która wersja (lub żadna z dwóch, patrz opcja 3) staje się
    kanonicznym `entityCards/slug.ts`, zanim T1 może kontynuować budowę
    `slug.ts` i `registry.ts` (unit-resolver zależny od slugify).
NASTĘPNY KROK: ABC/właściciel odpowiada na pytanie wyżej (3 opcje) →
  Operator wznawia T1 z jawną decyzją zapisaną w raporcie/rejestrze → dokańcza
  slug.ts + registry.ts + resztę fundamentu (types.ts, renderer.ts, adaptery-
  szkielety, test fixture) w jednym kolejnym przebiegu.
DEPLOY/PUSH: NIE WYKONANO
```
