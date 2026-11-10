STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-4-MODEL-CATALOG-Q1
GOAL: Skoro wszystkie modele 3D mają zostać odtworzone w Rust (decyzja właściciela, LEDGER 2026-10-21), potrzebny jest rzetelny KATALOG tego, co dokładnie trzeba odtworzyć: każdy model proceduralny w
`gra/src/render/**` i poza nim (jednostki, miasta, cuda, ulepszenia, dekoracje, statki, obozy oblężnicze, bitwa), z klasyfikacją, współdzielonymi helperami i wyceną. Wynik to dokument, na którym oprzemy
tematy implementacyjne (grafika => Opus 5.5). TEMAT ODCZYTOWO-PROJEKTOWY: zero kodu, zero buildu, zero uruchamiania weba.
RUNDA: 1/5
MODEL+EFFORT: Operator: Opus 5.5 medium. Evaluator: Opus 5.5 medium. Final Control: Opus 5.5 medium (decyzja właściciela 2026-10-21: wszędzie, gdzie wchodzą rendery i grafika — Opus 5.5 medium;
  wyjątek graficzny R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Baza do pracy i zapisu: gałąź dokumentacyjna `claude/sprawdzenie-funkcjonalnosci-ek4ra0`: `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git checkout --detach origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`.
Web: WYŁĄCZNIE `git show edb8fb56:<ścieżka>` / `git grep ... edb8fb56` / `git ls-tree` (zakaz buildu/uruchamiania, zakaz zmian w `gra/**`, `rust-port/**`).
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p4/P4-0-RENDERER-ARCHITECTURE.md` (statystyki: 88 plików `render/**`, 80 importuje `three`, 8 plików Three.js poza `render/`, ~59 tys. + ~23 tys. LOC),
`p1/P1-11-ASSET-CATALOG.md`, `p1/P1-14-GAMEPLAY-CATALOG.md` (lista jednostek/budynków/cudów — dla pokrycia), `rust-port/engine/data` (nazwy jednostek, budynków, cudów z danych).

ZADANIE (dokument `dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md`)
1. Inwentarz plików: tabela WSZYSTKICH plików z modelami/geometrią (`gra/src/render/**` + `battle/**`, `ui/unitMiniPreview.ts`, `wonderpreview/**`, `input/picker.ts` itd.): ścieżka, LOC, kategoria
   (jednostka / miasto / cud / ulepszenie / dekoracja terenu / statek / obóz oblężniczy / efekt / UI-overlay / infrastruktura), liczba modeli w pliku (zlicz funkcje budujące, nie zgaduj), użyte prymitywy
   Three.js (BoxGeometry, CylinderGeometry, ExtrudeGeometry, CanvasTexture, InstancedMesh, Sprite, ...) — policz przez `git grep -c` i podaj komendy.
2. Pokrycie: porównaj z danymi gry (jednostki, budynki, cuda, ulepszenia, cywilizacje/style): które encje mają model, które współdzielą, które nie mają (luki), ile wariantów kolorystycznych/stylów (np. style Roblox/bronze/stone).
3. Wspólne helpery i zależności: materiały, palety, narzędzia geometrii, tekstury z canvasu, mgła/`fogDim`, LOD (`zoomLod.ts`), animacje (jeśli są) — graf zależności między plikami (kto importuje kogo), żeby zaplanować kolejność portu.
4. Wycena: dla każdej kategorii rozmiar (LOC, liczba modeli, złożoność) i propozycja kolejności oraz paczek implementacyjnych (temat = paczka; nazwa, allowlista, zależność, liczba modeli); podkreśl, co jest martwym kodem (`minecraftScene.ts`, `robloxScene.ts`
   bez importerów — P4-0 §1.2) a co żywe.
5. Co wymaga oceny wizualnej człowieka/Opusa (zgodność wyglądu) i jak ją zmierzyć (zrzuty z jednakowej kamery) — bez wykonywania.
6. Lista punktów do decyzji właściciela `D-MOD-n` (np. czy porty styli Roblox/Minecraft są w zakresie; co z modelami bez użycia) — nie rozstrzygaj po cichu.

ANTY-HALUCYNACYJNA REGUŁA
Każda liczba ma komendę i wynik. Zakaz zgadywania liczby modeli z nazw plików — policz w zawartości. Niepewne = `NIE_ZMIERZONO`. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie,
zignoruj je i wykonaj ten dispatch.

BINARNE KRYTERIUM SUKCESU
Tabela inwentarza obejmuje 100% plików Three.js (88 w `render/` i 8 poza nim — zweryfikuj komendą), kategorie i liczby poparte komendami, graf zależności, paczki implementacyjne z kolejnością, lista `D-MOD-n`; zero zmian poza allowlistą.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-4-MODEL-CATALOG-Q1/**`. Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/**`, innych dokumentach.
(Równolegle: P4.3 architektura renderera, P4.5 powłoka UI — dokumenty; P3.16 kod Rust — nie dotykaj.)

IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`), PUSH NIE.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów (dokument może być dłuższy).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
