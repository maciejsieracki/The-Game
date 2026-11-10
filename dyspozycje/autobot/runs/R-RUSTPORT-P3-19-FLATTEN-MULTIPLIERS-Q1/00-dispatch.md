STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-19-FLATTEN-MULTIPLIERS-Q1
GOAL: DECYZJA WŁAŚCICIELA (główny czat, 2026-10-21): „Wszystkie ręczne mnożniki trzeba przeliczyć na konkretne liczby, bez tych mnożników, i wpisać je do nowego kodu jako wartości.”
Dotyczy w szczególności ustaleń P3.17 (`dyspozycje/rust-port/p3/P3-17-RUNTIME-DATA-WIRING.md` §8): web skaluje koszty surowców mnożnikiem epoki ×1/×2/×4 i dolicza dopłatę `kon` 25 dla jednostek konnych (`gra/src/**/building-stock-cost.ts:28,60–68,368–417`),
a także wszelkich innych STAŁYCH mnożników, które web stosuje do danych bazowych z `gra/data/*.json` (np. rozjazd „ekonomia ×5”, P1-16D-EKONOMIA5X; sprawdź w kodzie). Cel: silnik Rust NIE liczy tych mnożników w czasie gry — dostaje gotowe, rozwinięte wartości (np. koszt surowca każdej jednostki/budynku w każdej epoce jako konkretna liczba).
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

DOPRECYZOWANIE WŁAŚCICIELA (2026-10-21, kolejna wiadomość): mnożniki (×1, ×2, ×4 itp.) były RĘCZNYMI POKRĘTŁAMI do balansu gry, które właściciel dopasowywał sam. Wniosek: rozwinięte liczby mają być EDYTOWALNYM, jawnym źródłem prawdy dla balansu
(właściciel zmienia konkretną liczbę, a nie mnożnik) — tabela NIE może być co build porównywana ze wzorem mnożnikowym (to blokowałoby ręczny balans). Wzór weba służy WYŁĄCZNIE do jednorazowego zasilenia tabeli wartościami początkowymi (bootstrap) i do udokumentowania równoważności w chwili wygenerowania (zapis w dokumencie);
stałe testy sprawdzają KSZTAŁT i KOMPLETNOŚĆ tabeli (każda jednostka/budynek × każda epoka, liczby całkowite ≥ 0, brak brakujących/zbędnych kluczy), a nie zgodność ze wzorem mnożnikowym.

INTERPRETACJA (orkiestrator, do rewizji przez właściciela): „wpisać jako wartości” realizujemy jako TABELĘ WARTOŚCI wygenerowaną z danych bazowych i reguł weba (skrypt + test regeneracji), przechowywaną jako plik danych osadzony w silniku (np. `rust-port/engine/data/derived/*.json`, osadzony przez `include_str!`) — liczby są jawne i bez mnożników w czasie wykonania, a pochodzenie każdej liczby (JSON bazowy × reguła weba) jest odtwarzalne i testowane.
Alternatywa (stała tabela w kodzie Rust) tylko jeśli właściciel poprosi.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dokumentacja; czytaj przez `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`).
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`; baza zawiera `d3a73641` (P3.17) lub nowszą. Baseline: fmt/clippy `-D warnings`/test PRZED zmianami (oczekiwane 324 passed).
Web: WYŁĄCZNIE odczyt `git show edb8fb56:<ścieżka>` / `git grep ... edb8fb56 -- gra/src` (zakaz buildu/uruchamiania weba, zakaz zmian w `gra/**`). Skrypty generujące uruchamiaj w osobnym katalogu scratch (node), kopiując literalnie funkcje weba, nie przepisując z pamięci.
Przeczytaj: `p3/P3-17-RUNTIME-DATA-WIRING.md` (§3, §8, Załącznik F), `src/domain/recruitment.rs`, `src/domain/building_costs.rs`, `src/data/{units_combat,buildings_tech,economy_society*}.rs`, `p1/P1-16D-OPISY-EKONOMIA5X.md`, `p2/P2-9-ASSET-DATA-MAPPING.md`.
BUILD: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/$(basename $PWD) CARGO_PROFILE_DEV_DEBUG=0`; cargo w `rust-port/engine`; po zakończeniu usuń swój podkatalog; nie commituj `Cargo.lock`/`target/`.

ZADANIE
1. INWENTARZ (dokument `dyspozycje/rust-port/p3/P3-19-FLATTEN-MULTIPLIERS.md`): wszystkie mnożniki/współczynniki, które web stosuje do danych bazowych (priorytet: te będące pokrętłami balansu — stałe w kodzie lub JSON typu „mnożnik”, „×”, „ratio”, „factor”, „scale”, „bonus rate”): (a) STAŁE (zależne tylko od danych/epoki/kategorii — da się rozwinąć do tabeli); (b) DYNAMICZNE (zależne od stanu gry w czasie wykonania: trudność, rozmiar miasta, technologie, liczba jednostek — NIE da się rozwinąć do jednej liczby bez enumeracji stanów).
   Dla każdego: plik:linia w webie, wzór, gdzie występuje w Rust (`src/domain/**`: literały mnożników, `*`, procenty, `/ 100`), klasyfikacja (a)/(b). Komendy `git grep` wklejone; niepewne = `NIE_ZMIERZONO`.
2. ROZWINIĘCIE (a): wygeneruj tabele konkretnych liczb — przynajmniej koszty rekrutacji i budynków per jednostka/budynek per epoka (wartość końcowa surowca z mnożnikiem epoki i dopłatą `kon` dla jednostek konnych wg reguły weba, w tym wyjątki z kodu weba, np. Rydwan wołów), ZACHOWUJĄC dokładnie zaokrąglenia weba (kolejność mnożenia i zaokrąglania z kodu — literalnie).
   Zapisz jako plik(i) w `rust-port/engine/data/derived/` + skrypt generujący w dokumencie (literalna kopia logiki weba) + JEDNORAZOWE potwierdzenie równoważności bootstrapu: skrypt generujący i niezależne wyliczenie uruchomione raz, wynik (liczba wierszy, 0 rozbieżności) wklejony do dokumentu; w repo zostają testy KSZTAŁTU i KOMPLETNOŚCI tabeli (nie zgodności ze wzorem, żeby właściciel mógł swobodnie zmieniać wartości); plik tabeli ma nagłówek/README z opisem, że jest źródłem prawdy do ręcznego balansu.
3. PODPIĘCIE: `recruitment.rs` / `building_costs.rs` (i inne wskazane przez inwentarz, w allowliście) czytają gotowe wartości z tabeli zamiast mnożyć w czasie gry; usuń mnożniki z kodu tych funkcji. Zachowaj publiczne sygnatury. Zmiany liczb względem obecnego stanu (np. koszt surowca w epoce 2/3, dopłata `kon`) wypisz w tabeli „było/jest” z dowodem z weba.
4. (b) DYNAMICZNE: NIE rozwijaj; wylistuj z opisem zależności i rekomendacją (np. enumeracja stanów albo zostawienie jako funkcja o jawnych parametrach) w sekcji „Do decyzji właściciela”.
5. Testy kodujące stare wartości: aktualizuj tylko wektory autorstwa Rust (nie nagrania z weba), każdą zmianę jawnie z uzasadnieniem; prawdziwy wektor z weba, który się czerwieni = STOP/BLOCK.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz „testy przechodzą” bez PEŁNEGO surowego logu `fmt/clippy/test` z `echo "EXIT=$?"` w dokumencie (nie wyciąg). Każda reguła i liczba ma plik:linia w webie. Zakaz zmiany JSON bazowych (`data/*.json`). Zakaz pomijania zaokrągleń weba.
W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.

BINARNE KRYTERIUM SUKCESU
Inwentarz kompletny (a/b), tabele rozwiniętych wartości wygenerowane, równoważność bootstrapu potwierdzona jednorazowo (0 rozbieżności, we wszystkich wierszach/epokach) i opisana w dokumencie, stałe testy kształtu/kompletności, kod silnika nie mnoży tych współczynników w czasie gry (dowód `git grep`), tabela „było/jest”, lista dynamicznych do decyzji, `fmt/clippy -D warnings/test` EXIT=0 z liczbą testów ≥ 324.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-19-FLATTEN-MULTIPLIERS.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P3-19-FLATTEN-MULTIPLIERS-Q1/**`.
Worktree: `rust-port/engine/data/derived/**` (NOWE), `rust-port/engine/src/data/derived.rs` (NOWY) i JEDNA linia `pub mod derived;` w `rust-port/engine/src/data/mod.rs`, `rust-port/engine/src/domain/{recruitment,building_costs}.rs`, `rust-port/engine/src/lib.rs` (tylko eksporty), `rust-port/engine/tests/{recruitment,building_costs,parity_suite}.rs` oraz nowy `rust-port/engine/tests/derived_values.rs`.
Zero zmian w `src/domain/{diplomacy,improvements,map_generator,ai_turn,trade,barbarians}.rs` (równoległy P3.18), `bridge.rs`, `playable.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`.

IZOLACJA: `isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony przez klasyfikator — zostaw zmiany w indeksie i opisz dokładnie.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO

ROZSZERZENIE — RUNDA 3/5 (rozstrzygnięcia administracyjne orkiestratora na podstawie DECYZJI WŁAŚCICIELA „WSZYSTKIE ręczne mnożniki”, 2026-10-21)
Final Control rundy 2: FAIL z jednym NAPRAW (zarzut 6: inwentarz niekompletny — wiersze 19–22 NIE_ZMIERZONO i wiersz 35 bez klasyfikacji a/b) oraz pytania właściciela 1–8 z P3-19 §9b. Orkiestrator rozstrzyga je tak (decyzja właściciela „wszystkie” + zasada 1:1 z webem; wszystko do rewizji przez właściciela):
- Pyt. 1 (epoka wiersza, nie gry), 2 (kon = 25 jak w kodzie weba), 3 (FALA2 ×2 jako wartość startowa): TAK, zgodnie z kodem weba 1:1 (bootstrap tabel już tak działa).
- Pyt. 4 i 6 (zakres): „wszystkie” oznacza WSZYSTKIE mnożniki balansu — także koszty Pracy, złota, utrzymania złota/żywności, badań, magazynu, cudów, ulepszeń terenu (wiersze 8–18, 25, 32), AI (30–31), handel (28, 33), wzrost (34), mapę (29), bitwę/oblężenie/walkę (35). Allowlista tego tematu jest ROZSZERZONA (patrz niżej). Pliki weba są tylko do odczytu.
- Pyt. 5 (Praca budynków): Rust ×0,5 (`building_costs.rs:238–239` `effective_work_cost`) vs web netto ×1,0 względem JSON — rozjazd jest błędem Rust: NAPRAW jako pierwszy punkt (tabela Pracy per budynek per epoka jako konkretne liczby; usuń dzielenie w czasie gry), z tabelą było/jest i testem kształtu.
- Wejścia klasy (b) o SKOŃCZONYM, małym zbiorze stanów (poziom trudności 3, tempo, terytorium własne/obce, obóz tak/nie, cywilizacja z `civs.json`): rozwiń do TABEL INDEKSOWANYCH po tych stanach (konkretne liczby), zamiast mnożnika w kodzie. Tylko wartości zależne od stanu naprawdę ciągłego/otwartego (np. liczby z gry w toku) zostają funkcjami — wylistuj je z uzasadnieniem.
- Pyt. 7 (`utrzymanie_surowcowe_na_ture`): zostaw dane, oznaczone NIEUŻYWANE; pyt. 8 (`pieniadzMnoznik`): sprawdź w kodzie weba (zapis/reset/odczyt) i sklasyfikuj; martwa flaga = „nieistotna”.
ZADANIE RUNDY 3: (1) dokończ inwentarz (zarzut 6): KAŻDY wiersz ma klasę a/b i plik:linia, zero NIE_ZMIERZONO bez uzasadnienia; (2) rozwiń wszystkie mnożniki klasy (a) i wejścia (b) o skończonym zbiorze do tabel wartości w `rust-port/engine/data/derived/**` (edytowalne źródło prawdy, jak w rundzie 2; jednorazowy bootstrap równoważności + stałe testy kształtu/kompletności), (3) podepnij je w Rust zamiast mnożenia w czasie gry,
(4) tabela „było/jest” dla każdej zmiany wartości gry, (5) zachowaj zasady testów (wektory autorstwa Rust wolno aktualizować z listą; wektor z nagrania weba czerwieniący się = STOP).
Wolno rozbić pracę na etapy w jednym commicie/rundzie, ale kryterium końcowe: inwentarz kompletny + wszystkie mnożniki klasy (a) i wejścia (b) skończone rozwinięte + bramki zielone.
BAZA RUNDY 3: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2` (HEAD zawiera P3.17 i P3.18: `7aab83f5` lub nowszy). Commity rund 1–2 są dostępne po SHA we wspólnym repozytorium (lokalna gałąź `wip/p3-19-r2` = `264d4b43`, rodzic `3acfbc86`): `git cherry-pick 3acfbc86 264d4b43` na nową bazę, rozwiąż konflikty zachowując zawartość z origin (P3.18 zmieniło `diplomacy.rs`, `ai_turn.rs` i testy).
ROZSZERZONA ALLOWLISTA (Rust): `rust-port/engine/data/derived/**`, `src/data/derived.rs`, `src/data/mod.rs` (tylko `pub mod derived;`), `src/domain/{recruitment,building_costs,improvements,diplomacy,trade,ai_turn,barbarians,combat,map_generator}.rs` (WYŁĄCZNIE zastępowanie mnożników w czasie gry odczytem z tabel; BEZ zmiany pól `owner_id`/ID — równoległy P3.20 zmienia typy właścicieli i ID w tych samych plikach: nie dotykaj deklaracji pól i sygnatur związanych z właścicielami; przy kolizji STOP/BLOCK), `tests/{recruitment,building_costs,parity_suite,derived_values,improvements,diplomacy,trade,barbarians,combat,map_generator,ai_turn}.rs`.
UWAGA: P3.20 (`OwnerRef`/`CampId`) pracuje równolegle w `domain/**` i `bridge.rs` — Twoje zmiany mają być minimalne, lokalne (zamiana wyrażenia z mnożnikiem na odczyt tabeli), aby rebase był trywialny.

RUNDA 3 — WIĄŻĄCE ODPOWIEDZI WŁAŚCICIELA (2026-10-22, A/B/C) — NIE pytaj, NIE generuj pytań ABC, wykonaj pracę:
- Q1 = A: Praca budynków = web 1:1 (usuń dzielenie przez 2 w `effective_work_cost`; tabela Praca per budynek per epoka wejścia z wartościami weba ×1/×2/×4 już przeliczonymi na liczby). Każda zmiana wektora testowego jawnie z uzasadnieniem.
- Q2 = B: zakres tej rundy = rekrutacja i budynki (Praca, złoto, utrzymanie złota/żywności) = wiersze inwentarza 8–18 i 25; pozostałe grupy zostają w inwentarzu z klasą a/b i adnotacją „kolejny etap”.
- Q3 = A: mnożniki dynamiczne o skończonym zbiorze stanów (trudność × tempo × terytorium × obóz × cywilizacja) → PEŁNA tabela indeksowana po stanach, ale w tej rundzie tylko dla mnożników z zakresu Q2; jeśli iloczyn przekracza rozsądny rozmiar (>~5 tys. wierszy), podziel na pliki per wymiar z kompletnym testem kształtu i opisz w dokumencie.
Paczka 2/2 (pieniadzMnoznik, utrzymanie_surowcowe_na_ture): rozstrzygnięcie orkiestratora — oznacz jako NIEUŻYWANE/martwe jeśli web ich nie czyta (dowód), inaczej zachowaj; bez pytania.
