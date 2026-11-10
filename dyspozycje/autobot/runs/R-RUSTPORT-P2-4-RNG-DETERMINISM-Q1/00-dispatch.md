STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-4-RNG-DETERMINISM-Q1
GOAL: Zweryfikować zgodność generatora liczb losowych — web (`gra/src` na pinie edb8fb56) vs
`rust-port/engine` (`map_generator.rs` na `rust-port/parity-v2`, HEAD `9e33fc77`) — algorytm,
seedowanie, kolejność wywołań. To jest weryfikacja faktów, NIE decyzja projektowa.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Drugi temat fazy P2, równoległy do `R-RUSTPORT-P2-9-ASSET-DATA-MAPPING-Q1` (inny plik, bez kolizji).
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-1-DOMAIN-MODULES.md` (katalog modułów, PASS),
`dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md` §4 pozycja P2.4 („zgodny z Mulberry32/LCG
już używanym w `map_generator.rs` — zweryfikować zgodność z web RNG"), oraz
`dyspozycje/rust-port/p1/P1-8-WORLD-GENERATION.md` (P1.8 ustalił determinizm GENERATORA ŚWIATA po
stronie web — ten sam seed daje ten sam hash świata; to jest punkt odniesienia, nie powtarzaj tej
pracy, zweryfikuj RÓWNOLEGLE stronę Rust).

ZADANIE
1. Zidentyfikuj DOKŁADNY algorytm RNG używany przez web (`gra/src/game/*.ts` — szukaj generatora
   świata, `generujSwiatAsync` z P1.8, i wszelkich pomocniczych generatorów liczb losowych) — nazwa
   algorytmu, implementacja, źródło seeda.
2. Zidentyfikuj DOKŁADNY algorytm RNG w `map_generator.rs` na `rust-port/parity-v2` — czy to
   faktycznie Mulberry32/LCG jak sugeruje plan, czy coś innego.
3. Porównaj: czy algorytmy są matematycznie identyczne (ten sam wzór, ta sama kolejność operacji,
   ten sam rozmiar słowa)? Jeśli nie — czy dają te same sekwencje dla tego samego seeda (prosty test:
   wygeneruj pierwsze N liczb z obu implementacji dla seeda testowego i porównaj ręcznie/skryptem)?
4. Status: ZGODNE (matematycznie identyczne) / ZGODNE-EMPIRYCZNIE (różna implementacja, te same
   wyniki dla testowych seedów) / NIEZGODNE (różne sekwencje) / NIEROZSTRZYGNIĘTY (nie dało się
   jednoznacznie porównać).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zakładania zgodności z nazwy algorytmu („oba to Mulberry32" nie wystarcza) — porównaj
FAKTYCZNY kod: stałe, operacje bitowe, kolejność. Jeśli trzeba, napisz mały skrypt testowy w
scratchpadzie (Python/Node) odtwarzający oba algorytmy i porównujący wyjścia liczbowo.

BINARNE KRYTERIUM SUKCESU
Status z dowodem (cytat kodu obu stron + ewentualny wynik testu liczbowego) w nowym pliku
`dyspozycje/rust-port/p2/P2-4-RNG-DETERMINISM.md`.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-4-RNG-DETERMINISM.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P2-4-RNG-DETERMINISM-Q1/**`. Odczyt: `dyspozycje/**` read-only,
`gra/**` read-only na pinie edb8fb56, `rust-port/engine`/`parity-v2` read-only. Zero zmian w
`gra/**`, zero nowego kodu Rust w repo (skrypty testowe tylko w scratchpadzie sesji, nie w repo).

IZOLACJA
Czysta praca odczytowa + ewentualny skrypt testowy w scratchpadzie (poza repo) + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w tematach P1/P2. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
