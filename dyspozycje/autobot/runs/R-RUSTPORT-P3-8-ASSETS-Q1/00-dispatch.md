STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-8-ASSETS-Q1
GOAL: Przenieść 1:1 (kopia bajtowa, bez transkodowania) wszystkie assety runtime gry webowej
(ikony SVG, portrety JPG, ilustracje hero PNG, muzyka MP3) z pinu `edb8fb56` do nowego katalogu
stagingowego `rust-port/assets/` w repo, z manifestem kompletności zweryfikowanym wobec
`dyspozycje/rust-port/p1/P1-11-ASSET-CATALOG.md`. To NIE jest wpięcie do UI Tauri (UI/warstwa
prezentacji jeszcze nie istnieje w tym porcie — `src-tauri/frontend/` to dziś tylko minimalny
harness testowy) — to etap STAGINGU i WERYFIKACJI KOMPLETNOŚCI, analogiczny do „propozycja teraz,
wpięcie później" z P2/P3.5.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Niezależny temat fazy P3 (zero styku plikowego z P3.4, P3.5A-E, P3.3-IMPL — wszystkie dotyczą kodu
Rust/danych JSON, ten temat to wyłącznie pliki binarne w nowym katalogu). Przeczytaj OBOWIĄZKOWO:
`dyspozycje/rust-port/p1/P1-11-ASSET-CATALOG.md` CAŁY (pełny katalog: 307 SVG ikon w
`src/ui/icons/brand/**`, 12 plików JSON/CSS towarzyszących ikonom, 45 JPG portretów w
`src/assets/portrety/`, 2 PNG hero w `src/ui/assets/hero/`, 62 MP3 w `src/audio/utwory/**` — w tym
59 aktywnych + 3 jawnie wykluczone w `_wykluczone/`; BRAK fontów, BRAK modeli 3D, BRAK plików SFX
— dźwięki SFX są syntetyzowane w kodzie, poza zakresem tego tematu). Assety czytaj z `gra/` na
pinie `edb8fb56` (`git archive edb8fb56 gra` albo `git show edb8fb56:<ścieżka>` per plik binarny —
sprawdź która metoda działa dla plików binarnych w tym środowisku).

ZADANIE
1. Skopiuj WSZYSTKIE pliki z 4 kategorii (SVG ikony + JSON/CSS towarzyszące, JPG portrety, PNG hero,
   MP3 muzyka — WŁĄCZNIE z `_wykluczone/`, oznaczone jako wykluczone, nie pomijane) z pinu `edb8fb56`
   do `rust-port/assets/` zachowując strukturę podkatalogów z P1.11 §1 (np. `rust-port/assets/icons/
   brand/...`, `rust-port/assets/portraits/`, `rust-port/assets/hero/`, `rust-port/assets/music/`).
2. Zweryfikuj KAŻDY skopiowany plik przez `git hash-object` (blob-hash) zgodny z `git rev-parse
   edb8fb56:<ścieżka>` — 1:1, bez zmiany ani bajta.
3. Napisz manifest (`rust-port/assets/MANIFEST.md` albo `.tsv`): dla każdego pliku — ścieżka
   źródłowa (web), ścieżka docelowa (rust-port/assets), rozmiar, hash. Policz sumy per kategoria i
   porównaj z liczbami z P1.11 (307 SVG, 12 JSON/CSS, 45 JPG, 2 PNG, 62 MP3 = 428 plików assetów
   runtime, BEZ liczenia plików kodu/README z sumy 441 w P1.11 — sprawdź to rozróżnienie w P1.11 §2
   i zastosuj konsekwentnie).
4. Jawnie potwierdź BRAK fontów/modeli 3D/plików SFX (zgodnie z P1.11) — nie wymyślaj czegoś czego
   nie ma.
5. NIE modyfikuj `src-tauri/tauri.conf.json`, `Cargo.toml` ani żadnego istniejącego pliku — to
   czysty staging nowych plików binarnych + manifest. Wpięcie do configu Tauri to osobny, przyszły
   temat (po wyborze warstwy UI/prezentacji).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz twierdzenia "skopiowano X plików" bez faktycznego policzenia w katalogu docelowym (`find
rust-port/assets -type f | wc -l`) i porównania z liczbą oczekiwaną z P1.11. Zakaz transkodowania/
kompresji/zmiany formatu — to ma być bajtowa kopia 1:1, zweryfikowana hashem.

BINARNE KRYTERIUM SUKCESU
428/428 plików assetów runtime skopiowanych 1:1 (hash zgodny z pinem edb8fb56) do
`rust-port/assets/`, z manifestem i jawnym potwierdzeniem BRAK fontów/modeli 3D/SFX — w nowym pliku
`dyspozycje/rust-port/p3/P3-8-ASSETS.md`.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-8-ASSETS.md` (NOWY), `dyspozycje/autobot/runs/
R-RUSTPORT-P3-8-ASSETS-Q1/**`. Worktree (`rust-port/parity-v2`): WYŁĄCZNIE nowy katalog
`rust-port/assets/**` (pliki binarne skopiowane + manifest). Zero zmian w ISTNIEJĄCYCH plikach.
Zero zmian w `gra/**`.

IZOLACJA
`isolation: worktree`. Baza: `origin/rust-port/parity-v2` (najnowszy HEAD — sprawdź `git log`,
powinien zawierać commity P3.3-IMPL i ewentualnie P3.5D). Commit w worktree dozwolony, PUSH zdalny
NIE — integracja po PASS Final Control, osobny krok orkiestratora. UWAGA: katalog `rust-port/assets/`
może być duży (~50MB, głównie MP3) — sprawdź miejsce na dysku przed kopiowaniem, zgłoś jako BLOCK
jeśli brak miejsca, nie kombinuj z kompresją żeby zmieścić.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (pełny manifest w pliku docelowym, liczy się osobno).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
