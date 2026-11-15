STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-RENDER-DTO-CONTRACT-Q1
GOAL: Kontrakt modelu widoku (DTO) między silnikiem Rust (`civ-engine`) a rendererem Rust (`civ-renderer`, wgpu) oraz komendy zwrotne z mapy — zakres po zmianie decyzji właściciela (renderer w Rust, `LEDGER.md:117`, `:123`; DODATEK r2 dispatchu „tylko RUST”).
ZMIANY/COMMIT: `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-RENDER-DTO-CONTRACT-Q1/01-operator.md` (NOWY). Baza `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` = `8f2f43a8`. SHA commitu: podany w odpowiedzi Operatora (commit zawiera ten plik).
TESTY: `git diff --check` czysty; allowlista — tylko 2 pliki powyżej (`git status --short`). Zero `cargo`, zero `npm`, zero buildu. Kontrola tabel Markdown: brak `|` wewnątrz kodu w wierszach tabel (skrypt `python3 -I`, wynik pusty).
BLOKADY: brak blokad pracy. Zależności merytoryczne opisane w dokumencie: model `MapHex` w silniku jest pustym szkieletem (`mapgen/types.rs:1-3`, temat M01) → D-DTO-6; brak strumienia zdarzeń bitwy w silniku → D-DTO-7; brak komend `deselect_unit`/`preview_path`/wieloheksowego `move_unit` w `bridge.rs` → D-DTO-8.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ten sam ID).
DEPLOY/PUSH: NIE WYKONANO

## Co zawiera dokument

1. §0 — uzasadnienie zmiany zakresu z „DTO dla Three.js” na „DTO dla renderera Rust” (dowody w LEDGER) i odgraniczenie od `P4-5B-MAP-UI-SEAM.md` (granica wejścia mapa↔UI nie jest dublowana).
2. §1 — stan Rust z dowodami: `bridge.rs` (1 komenda/1 event, pełny `PlayableState`), braki `PlayableState` (4 tereny, tylko `Warrior`), równoległe funkcje silnika (gwiazdki, odznaki, stosy, widoczność, etykieta miasta, front produkcji, trasy rzek, `category_of`), istniejące wejścia `civ-renderer` (id `String`, właściciel `i32/i64`, kolejność `Map`/`Set`). **Zamknięte statycznie:** `PositionDto(x,y) ≡ (q,r)` (`generator.ts:216-219` + `playable.rs:1381-1387`, `:321-326`).
3. §2 — tabela 17 plików `render/**` + 8 plików Three.js poza `render/`: symbole, linie importu i użycia, charakter (typ/stała/geometria/reguła), zastąpienie w Rust z informacją, co już jest w `civ-renderer`, a czego BRAK. Dodatkowo 13 plików importujących `types/map`/`types/hex`.
4. §3 — schemat `RenderViewDto` (camelCase, newtypy `CityId/UnitId/PlayerId` = `#[serde(transparent)] u64`, `OwnerRef` jako liczba): mapa statyczna/dynamiczna, mgła (kolumna 1 B/heks), właściciele, miasta (+ plakietka = `CityMapBadgeInput`), jednostki (+ stosy, gwiazdki, odznaki), oblężenia, cuda, terytorium, nakładki, bitwa.
5. §4 — zasady (zero reguł w rendererze, niezależność od GPU, determinizm kolejności, JSON-bezpieczeństwo ID, jeden producent pól wspólnych z UI) i opcje aktualizacji A/B/C z kosztami (szacunek arytmetyczny, pomiar NIE_ZMIERZONO).
6. §5 — mapowanie zdarzeń mapy na komendy P2-5 i stan `bridge.rs`. **Prawy klik zamknięty:** dwa słuchacze (`main.ts:26209-26221`, `:26337-26343`); poza UI (`exitBuildMode`, `hideHexContextPanel`) PPM wywołuje `dismissPlayerUnitSelectionIfAny` → `clearPlannedMarch(selectedId, false)` (`:6215-6219` → `:6167-6170` → `:25155-25173`), co **usuwa zapisywany plan marszu** jednostki (poza marszem ataku). Wniosek: potrzebna komenda `deselect_unit` z tą semantyką.
7. §6 — adapter `renderer/src/view.rs` (RR-T13): trzy postacie współrzędnych, `Display` dla id, `legacy_i64` dla właściciela, domknięcia `CityRenderOptions`.
8. §7 — `D-DTO-1..9` z opcjami, za/przeciw i rekomendacją; klasyfikacja: żaden nie jest odstępstwem od webu (CLAUDE.md zasada 9 → orkiestrator).
9. §8 — 9 tematów-kandydatów `P4-1A..P4-1I` z allowlistami i zależnościami; §9 — 8 pozycji NIE_ZMIERZONO; §10 — komendy.

## Uwagi dla Evaluatora

- Pliki webu czytane wyłącznie przez `git archive`/`git show` z `edb8fb56` (zgodnie z dispatchem). CLAUDE.md wskazuje nowszy pin gameplay `07d2fbd72`; ten dokument nie porównywał `render/**` między `edb8fb56` a `07d2fbd72` — zmiany pól czytanych przez renderer po repinie = NIE_ZMIERZONO (do sprawdzenia przy P4-1G).
- `scratchpad` po pierwszym rozpakowaniu zawierał stare pliki z innej sesji (`main.ts` 47 448 linii); katalogi usunięte i rozpakowane ponownie, `main.ts` zweryfikowany (39 350 linii = `P4-0` §1.4).
