STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-17B-UI-CLASSIFICATION-Q1
GOAL: Ustalić etykiety REUSE/ADAPT/REPLACE/UNKNOWN dla 117 plików `.ts` w `gra/src/ui` względem frontu Tauri, z dowodem per plik.
ZMIANY/COMMIT: Zmieniono wyłącznie `dyspozycje/rust-port/p1/P1-17B-UI-CLASSIFICATION.md` (allowlista) i zapisano ten plik w `dyspozycje/autobot/runs/R-RUSTPORT-P1-17B-UI-CLASSIFICATION-Q1/`. Brak commita. Odczyt wyłącznie przez `git show` / `git ls-tree`.
ZARZUTY:
  1. Liczba `id` w index.html: PRZYJĘTE. 33 atrybuty w 32 liniach (linia 239 ma dwa). Poprawiono §1 i §6.
  2. Szablonowe uzasadnienie UNKNOWN: PRZYJĘTE. Każdy wiersz ma rolę z nagłówka pliku, kategorię i wskazanie brakującego elementu Tauri. Odrzucono ADAPT dla contextPanelHud.ts (najbliższe `#runtime-note` to tekst stanu, nie panel treści) i unitCardStatus.ts (brak wiersza statusów w `#unit-card`). Obie zostają UNKNOWN.
  3. brandTokenVars.ts REPLACE na podstawie komentarza web: PRZYJĘTE. Podstawą jest teraz porównanie wartości i nazw tokenów `:root` Tauri z kanonem `gra/src/ui/icons/brand/tokens.css` (§6a) oraz deklaracja w index.html l.38 („compact web-parity equivalent”). Etykieta REPLACE zostaje.
  4. cityPanel.ts ADAPT, pokrycie: PRZYJĘTE. Dopisano, że pokrycie to karta stolicy, ułamek 11986 linii.
TESTY:
  - Lista 117 `.ts`: `git ls-tree -r edb8fb56 -- gra/src/ui` filtrowane do `.ts` = lista w P1-1-FILE-CATALOG.md (diff pusty).
  - Podsumowanie: REUSE 0, ADAPT 6, REPLACE 4, UNKNOWN 107, suma 117.
  - Tabela: 117 wierszy z numerami (`grep -c '^| [0-9]'` = 117).
  - `git diff --check -- dyspozycje/rust-port/p1/P1-17B-UI-CLASSIFICATION.md`: bez błędów.
  - `src-tauri/` identyczne na `78d494c7` i `a317fb7a` (`git diff --quiet`).
BLOKADY:
  - UNKNOWN to brak elementu tej roli w zbiorze z §6 plus kategoria z nazwy i nagłówka, a nie przegląd każdej linii 810-liniowego main.js.
  - Etykiety nie są oparte na uruchomieniu Tauri ani na screenshotach.
  - Nieśledzony plik `dyspozycje/rust-port/p1/P1-1B-REMAINING-DIRS.md` nie jest mój i go nie ruszałem.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator weryfikuje poprawioną allowlistę i dowody (§6a, §7). Final Control sprawdza bramkę przed P5.
DEPLOY/PUSH: NIE WYKONANO
