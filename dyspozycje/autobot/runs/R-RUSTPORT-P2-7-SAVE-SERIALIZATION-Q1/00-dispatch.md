STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-7-SAVE-SERIALIZATION-Q1
GOAL: Skatalogować kształt zapisu stanu gry (save) po stronie web na pinie edb8fb56 i porównać ze
stanem serializacji w `rust-port/engine` (`rust-port/parity-v2`, HEAD 9e33fc77) — w tym już
zidentyfikowany w audycie archiwum gap `meta.forcedWarWavesByPairKey`. To jest katalog faktów, NIE
decyzja projektowa o formacie docelowym.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Czwarty temat fazy P2, równoległy do `R-RUSTPORT-P2-9-ASSET-DATA-MAPPING-Q1` (inny plik, bez
kolizji). Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-1-DOMAIN-MODULES.md` (katalog modułów
— sekcja persystencja/save, M15 lub pokrewna), `dyspozycje/rust-port/AUDYT-ARCHIWUM-OPENCLAW-20261020.md`
(gdzie wcześniej zidentyfikowano gap `meta.forcedWarWavesByPairKey` — znajdź dokładny opis tego
zapisu).

ZADANIE
1. Zidentyfikuj DOKŁADNĄ strukturę zapisu stanu gry po stronie web — plik/moduł odpowiedzialny za
   serializację (szukaj `JSON.stringify`/`localStorage`/eksport zapisu w `gra/src/game/*.ts`), pełną
   listę top-level kluczy stanu (łącznie z `meta.*`).
2. Sprawdź `rust-port/engine` na `parity-v2`: czy istnieje struktura/moduł odpowiedzialny za
   serializację stanu gry (serde `Serialize`/`Deserialize`), i jeśli tak — jakie pola obejmuje vs
   jakich brakuje względem (1).
3. Potwierdź wprost (nie z pamięci audytu) status gapu `meta.forcedWarWavesByPairKey`: czy web go ma,
   czy Rust go ma, jaki jest dokładny kształt tego pola.
4. Wypisz PEŁNĄ listę pól obecnych w web, których BRAK w strukturze Rust (jeśli struktura w ogóle
   istnieje) — to jest najważniejszy wynik tego tematu dla P2.7/P2.11 (kompatybilność save/load).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zakładania, że brak pliku `save.rs`/podobnego oznacza brak serializacji w ogóle — sprawdź
`#[derive(Serialize)]` na strukturach domeny, mogą być rozproszone.

BINARNE KRYTERIUM SUKCESU
Pełna lista top-level kluczy stanu web z dowodem (plik:linia), status istnienia odpowiednika w Rust
per klucz, w nowym pliku `dyspozycje/rust-port/p2/P2-7-SAVE-SERIALIZATION.md`.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-7-SAVE-SERIALIZATION.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P2-7-SAVE-SERIALIZATION-Q1/**`. Odczyt: `dyspozycje/**`
read-only, `gra/**` read-only na pinie edb8fb56, `rust-port/engine`/`parity-v2` read-only. Zero
zmian w `gra/**`, zero nowego kodu Rust.

IZOLACJA
Czysta praca odczytowa + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach P2. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
