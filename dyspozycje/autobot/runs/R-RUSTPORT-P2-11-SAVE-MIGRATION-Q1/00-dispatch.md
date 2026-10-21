STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-11-SAVE-MIGRATION-Q1
GOAL: Zaprojektować regułę kompatybilności zapisów między wersjami — konkretnie: jak Rust/Tauri
wczytuje dzisiejszy zapis web (`SAVE_VERSION` web = 3, `gra/src/game/save.ts`) 1:1, zgodnie z
decyzją właściciela z P2.2 (D7: "Rust czyta zapisy web 1:1, dla ciągłości graczy"). PROPOZYCJA, nie
ostateczna decyzja — każdy punkt bez jednoznacznej odpowiedzi w materiale źródłowym ma być oznaczony
jako wymagający decyzji.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Piąty temat architektoniczny fazy P2, niezależny od P2.6 (w toku, osobny plik, zero styku). Przeczytaj
OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-2-GAMESTATE-CONTRACT.md` CAŁY (kontrakt GameState, §8 pkt D7
— decyzja o kompatybilności 1:1), `dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md` CAŁY (schemat ID, §9 —
migracja musi mapować ID webowe stringowe na nowe ID Rust zgodnie z tym schematem), `dyspozycje/rust-port/p2/P2-7-SAVE-SERIALIZATION.md`
CAŁY (katalog 22 top-level kluczy zapisu web + 94 klucze `meta`, stan dzisiejszej serializacji Rust —
`GameStateDto` v2 vs web v3, `save_load.rs` niezadeklarowany w `lib.rs`). NIE projektuj kontraktu
GameState ani schematu ID od zera — to jest już ZROBIONE w P2.2/P2.3, Twoim zadaniem jest warstwa
TRANSFORMACJI zapisu web → `GameState` kanoniczny.

ZADANIE
1. Zaproponuj architekturę migracji: osobny moduł `save_migration` czytający surowy JSON zapisu web
   (bez założenia że to ten sam kształt co docelowy `GameStateDto`), mapujący każde pole na kanoniczny
   `GameState` z P2.2/P2.3. Określ: czy to jednorazowa konwersja przy imporcie (zapis web → zapis
   natywny Rust, potem gra działa na natywnym formacie) czy trwała dwukierunkowa kompatybilność
   (Rust zawsze potrafi zapisać z powrotem w formacie web) — to jest decyzja wymagająca wskazania
   (konsekwencje dla eksportu/współdzielenia zapisów między graczami na starej i nowej wersji).
2. Dla KAŻDEGO z 22 top-level kluczy i 94 kluczy `meta` z P2-7 (katalog web), wskaż: czy mapowanie do
   `GameState` jest jednoznaczne z kontraktu P2.2/P2.3 (TAK, z odwołaniem do konkretnego miejsca w
   kontrakcie), czy wymaga nowej decyzji nieujętej w P2.2/P2.3 (oznacz jako `D-MIG-n`).
3. ID: web generuje ID jednostek przez `Math.random()` (string), miast przez `'city'+cities.length`
   (string) — P2.3 §9 ustala docelowy schemat `u64` newtype z monotonicznym licznikiem. Zaprojektuj
   mapowanie: tabela przekładu stary-ID→nowy-ID budowana przy imporcie, zachowana przez całą sesję
   (żeby referencje wewnątrz zapisu — np. `ownerId`, `cityId` w jednostkach — pozostały spójne po
   konwersji).
4. Wskaż, co się dzieje z polami zapisu web, które NIE mają miejsca w kanonicznym `GameState` (np.
   flagi UI z P2.2 D8/pkt 10b, zidentyfikowane jako odrzucane przy imporcie) — potwierdź, że migracja
   jest zgodna z tą już podjętą decyzją, nie wymyśla nowej.
5. Zaproponuj strategię wersjonowania: jak odróżnić który `SAVE_VERSION` (web) trafia do którego
   mapowania, co się dzieje przy nieznanej/przyszłej wersji zapisu.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zakładania kształtu migracji bez sprawdzenia FAKTYCZNEGO kodu `gra/src/game/save.ts` (jak web
serializuje/wersjonuje) na pinie `edb8fb56` oraz `rust-port/engine/src/domain/save_load.rs` (co już
istnieje w Rust, `migrate_v1`) na pinie `9e33fc77`. Zakaz pomijania pól — P2-7 już skatalogował 22+94
klucze, ten temat ma zmapować KAŻDY z nich do kontraktu P2.2/P2.3, nie próbkę.

BINARNE KRYTERIUM SUKCESU
Każdy z 22+94 kluczy zapisu web (z P2-7) ma wiersz: klucz, docelowe miejsce w `GameState` (P2.2/P2.3)
lub `D-MIG-n` jeśli nieujednoznacznione, strategia ID (jeśli dotyczy) — w nowym pliku
`dyspozycje/rust-port/p2/P2-11-SAVE-MIGRATION.md`.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-11-SAVE-MIGRATION.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P2-11-SAVE-MIGRATION-Q1/**`. Odczyt: `dyspozycje/**` read-only,
`gra/**` read-only na pinie edb8fb56, `rust-port/engine`/`parity-v2` read-only. Zero zmian w
`gra/**`, zero nowego kodu Rust.

IZOLACJA
Czysta praca projektowa/odczytowa + nowy plik .md. Niezależny od P2.6 (osobny plik, zero styku).

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w P2.2/P2.3/P2.5. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (plik docelowy może być znacznie dłuższy — pełna tabela mapowania).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
