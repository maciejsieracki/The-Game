STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-2-GAMESTATE-CONTRACT-Q1
GOAL: Zaproponować kanoniczny kontrakt `GameState` dla Rust (pola, niezmienniki) pokrywający
WSZYSTKIE 15 modułów domeny z P2.1 i WSZYSTKIE pola zapisu web z P2.7. To jest PROPOZYCJA do dalszej
weryfikacji (P2.12), NIE ostateczna, wiążąca decyzja architektoniczna — Final Control może (i
powinien) eskalować do właściciela każdy punkt, w którym istnieje więcej niż jedno rozsądne
rozwiązanie bez jednoznacznej odpowiedzi w materiale źródłowym.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Pierwszy temat architektoniczny fazy P2 (poprzednie 5 — P2.1/4/7/8/9 — to był czysty katalog
faktów). Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-1-DOMAIN-MODULES.md` (15 modułów),
`dyspozycje/rust-port/p2/P2-7-SAVE-SERIALIZATION.md` (22 top-level klucze + 94 klucze `meta`),
`dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md` (co już istnieje w Rust — `GameStateDto`,
`PlayableState`, inne DTO — NIE projektuj od zera tam, gdzie coś już jest, oceń czy istniejące
pasuje czy wymaga zmiany), `dyspozycje/rust-port/p2/P2-8-TAURI-ADAPTER.md` (dzisiejsza granica —
żadna domena poza world/civ/city/unit/turn nie jest wpięta).

ZADANIE
1. Dla KAŻDEGO z 15 modułów domeny (P2.1): zaproponuj pole/strukturę w kanonicznym `GameState`,
   odwołując się do tego co już istnieje w Rust (jeśli istnieje) i do kształtu web (P2.7).
2. Dla pól `meta.*` z web (94 klucze, P2.7): zaproponuj klasyfikację — czy należy do `GameState`
   (stan gry), czy do warstwy UI/klienta (nie powinno być replikowane w Rust), czy do osobnej
   kategorii (np. cache/derived state, nie trzeba serializować).
3. Zaproponuj 3-5 KLUCZOWYCH niezmienników (invariants) które `GameState` musi zachować (np. „suma
   populacji miast właściciela == jego manpower pool" — jeśli taki niezmiennik faktycznie istnieje w
   web, znajdź go w kodzie, nie zgaduj).
4. Dla KAŻDEGO punktu, w którym istnieje realny wybór projektowy BEZ jednoznacznej odpowiedzi w
   materiale źródłowym (np. „czy forcedWarWavesByPairKey żyje w GameState czy w osobnej strukturze
   dyplomacji" — to może mieć więcej niż jedną rozsądną odpowiedź) — oznacz to WPROST jako punkt do
   decyzji, nie wybieraj po cichu.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz projektowania pól bez odniesienia do co najmniej jednego konkretnego źródła (P2.1/P2.7/P2.9
albo kod web/Rust). Zakaz twierdzenia o istnieniu niezmiennika bez wskazania miejsca w kodzie, które
go egzekwuje.

BINARNE KRYTERIUM SUKCESU
Propozycja obejmuje wszystkie 15 modułów i wszystkie 22 top-level klucze web (94 `meta` pogrupowane,
nie każdy osobno — to jest architektura, nie dosłowne odwzorowanie) z uzasadnieniem, plus jawna lista
punktów wymagających decyzji.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-2-GAMESTATE-CONTRACT.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P2-2-GAMESTATE-CONTRACT-Q1/**`. Odczyt: `dyspozycje/**`
read-only, `gra/**` read-only na pinie edb8fb56, `rust-port/engine`/`parity-v2` read-only. Zero
zmian w `gra/**`, zero nowego kodu Rust (to jest PROPOZYCJA w dokumencie, nie implementacja).

IZOLACJA
Czysta praca projektowa/odczytowa + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje konkretny defekt (pominięty moduł/klucz, niezmiennik bez dowodu, ukryta decyzja
podjęta bez oznaczenia), Operator poprawia. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (plik docelowy może być znacznie dłuższy — to jest dokument projektowy).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
