STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-AUDYT-PARYTETU-Q1
GOAL: Obrona Operatora r1 na zarzuty Evaluatora (02-evaluator.md): każdy zarzut PRZYJĘTY (poprawka + dowód) albo ODRZUCONY (dowód).
ZMIANY/COMMIT: 38922d3ce (poprawki dokumentu dyspozycje/rust-port/AUDYT-PARYTETU-RANO.md, lokalnie, bez push). Allowlista: tylko dokument i dyspozycje/autobot/runs/R-RUSTPORT-P6-AUDYT-PARYTETU-Q1/**. Brak zmian w kodzie, gra/, origin/main, Cargo.*. Bazą pozostaje 358cb6cf6 (commity 613ab8af9 → 38922d3ce są nad 976339d9b, który jest nad bazą).
TESTY: Temat dokumentacyjny, bez cargo. `git diff --check` czysty (po zmianach). `git status` pokazuje tylko dokument. Pomiary ponowione: patrz każdy zarzut.
BLOKADY: NIE_ZMIERZONO (jawnie w dokumencie): zgodność wektorów z pinami edb8fb56/91dc998a/4bbef081/dc8a3adc z pinem 07d2fbd72; podział wektorów per moduł wg pinu; numeracja REJESTR-RUST (plik nie istnieje); rozstrzygnięcia pytań gameplay (poza repo); INTEG-B14B (nie sprawdzono tipu).
RUNDY: 1/5 (obrona r1 Operatora)
NASTĘPNY KROK: Evaluator r2 weryfikuje poprawki (ponowny odczyt dokumentu i komend z tabeli dowodów); potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 — błędne numery linii w §3 (REPIN-DRYFT 1..6f) — PRZYJĘTY
Dowód: `git show 358cb6cf6:dyspozycje/rust-port/REPIN-DRYFT-POMIAR-20261111.md | grep -n ''`: linia 22 = nagłówek tabeli, 23 = separator, wiersze 1 → 24, 2 → 25, 3a → 26, 3b → 27, 4 → 28, 5 → 29, 6a–6f → 30–35.
Poprawka: §3 podaje 24, 25, 26–27, 28, 29, 30–35.

### Zarzut 2 — 33 vs 34 moduły bez wołającego (battle_mode) — PRZYJĘTY
Dowód:
- `dowody/02-moduly-domain-wolajacy.tsv` (wariant obcinany po pierwszym `#[cfg(test)]`): 34 zera, w tym `battle_mode`. Przyczyna: `save_load.rs` ma `#[cfg(test)]` w linii 41 (`git show 358cb6cf6:rust-port/engine/src/domain/save_load.rs | grep -n cfg`), a jedyne trafienie `battle_mode` jest w linii 287 (komentarz doc `battle_mode::restored_setting_version`), więc zostaje ucięte. To była ślepota metody, nie wynik kodu.
- `dowody/02-moduly-domain-wolajacy-pelny-tekst.tsv` (pełny tekst): 33 zera; `battle_mode` ma 1 trafienie (`save_load.rs`). Lista 33 w dokumencie pochodzi z tego wariantu.
- Wg znaczenia (wołanie, nie komentarz) `battle_mode` nie ma wołającego, więc liczba bez produkcyjnego wołającego to 34.
Poprawka: §2 wyjaśnia oba warianty i podaje 34 wg znaczenia; zastrzeżenie o ślepocie metody. Uwaga: tsv obcinany ma błąd systematyczny dla każdego pliku z wczesnym `#[cfg(test)]`; ta metoda nie jest źródłem liczby 33.

### Zarzut 3 — REJESTR-RUST.md nieistniejący; #NN i statusy spoza repo — PRZYJĘTY
Dowód: `git ls-tree -r --name-only 358cb6cf6 | grep -ic REJESTR-RUST` (wynik: 0); w bazie są inne rejestry (np. `docs/obieg/REJESTR-DECYZJI.md`), żaden nie nazywa się REJESTR-RUST. Numery #96–#140 i statusy `pending` pochodzą z listy zadań sesji.
Poprawka: §0 pkt 1 i §4 jawnie oznaczają źródło jako listę zadań sesji (poza repo, bez pliku:linia), stan na chwilę pomiaru; numeracja rejestru NIE_ZMIERZONO. Pokrycie #96–#140 nie jest kwestionowane (zakres kompletny w tej liście).

### Zarzut 4 — liczba 124 *-fc nie odtwarza się jednoznacznie — PRZYJĘTY
Dowód (`dowody/05-wip-refs-origin.txt`, 318 wierszy, 312 unikalnych SHA):
- nazwa kończy się na `-fc` (`awk '$1 ~ /-fc$/'`): **124**;
- `-fc` gdziekolwiek w nazwie (`awk '$1 ~ /-fc/'`): **129** = 124 + 5 nazw `-fc-rN`.
Poprawka: §5 podaje metodę i obie liczby. Liczba 20 niescalonych i 318 refów bez zmian.

### Zarzut 5 — piny w testach: brak rozdziału wg pinu; zgodność NIE_ZMIERZONO — PRZYJĘTY CZĘŚCIOWO
Dowód (`git grep -l <hash> 613ab8af9 -- rust-port/engine/tests`, identycznie w 358cb6cf6):
- edb8fb56: 192 pliki; 07d2fbd7: 186; 91dc998a: 120; 4bbef081: 40; dc8a3adc: 18.
- Suma 556 > 460 plików `.rs`, więc część plików cytuje kilka hashy.
- Frazy `pin <hash>` w komentarzach: edb8fb56 71, 07d2fbd7 67, 91dc998a 31, 4bbef081 4, dc8a3adc 3.
- Skala różnic `gra/` między pinami (`git diff --stat 07d2fbd72 <pin> -- gra/`): edb8fb56 1085 plików, 91dc998a 933, 4bbef081 820, dc8a3adc 887.
Poprawka: wcześniejsze liczby 117/71/59/22/10 WYCOFANE (nie odtworzyły się: pomiar wykazał inne wartości). Nowe liczby w §0 pkt 2. Zgodność wektorów z pinami i mapowanie per moduł: NIE_ZMIERZONO (jawnie). Część zarzutu odrzucona nie jest — to był błąd liczb, nie brak zastrzeżenia.

### Zarzut 6 — integracja INTEG-B11..B14C: domysł, brak dowodu kodu — PRZYJĘTY (rozstrzygnięte częściowo)
Dowód (`git cherry 358cb6cf6 <tip>`, linie `+` = commity bez odpowiednika łaty w bazie):
- `22f7178ef` (INTEG-B11-fc): `+` = 22f7178eff "FC: R-RUSTPORT-P6-INTEG-B11-Q1 PASS-WITH-NOTES" (tylko dokument).
- `f94f47159` (INTEG-B12-fc): `+` = 068092b25 "obrona Operatora (02a-obrona.md)" i f94f47159 "Final Control PASS-WITH-NOTES" (tylko dokumenty).
- `ee435eebe` (INTEG-B13-fc): `+` = "INTEG-B13-Q1: 03-final-control.md" (dokument).
- `70bd9743d` (INTEG-B14A-fc): `+` = "INTEG-B14A-Q1: 03-final-control.md" (dokument).
- `6131e2dad` (INTEG-B14C-fc): `+` = "R-RUSTPORT-P6-INTEG-B14C-Q1: Final Control 03" (dokument).
Wniosek: kod tych pięciu integracji ma odpowiedniki łat w `358cb6cf6` (`-`); jedyne różnice to dokumenty FC/obrony. Dodatkowo ancestry: `eee18680c`, `9d4a2c17b`, `0fe9b3222`, `86223e037`, `fb7ac73d1`, `4b6595876`, `9164ab7d7` są przodkami `358cb6cf6`.
Poprawka: §5 przepisane: rozstrzygnięte dla pięciu tipów; B14B nie sprawdzono (NIE_ZMIERZONO).

## Pytania do orkiestratora
- Brak pytań ABC w tej obronie (wszystko tematu dokumentacyjnego, bez decyzji gameplay).
