# DISPATCH R-RUSTPORT-P6-DOC-323-RZEKA-KRAWEDZIE (runda 1) — poprawka dokumentu P4-1G-ADAPTER-ROZPOZNANIE: rzeka_krawedzie (#323)

DOMENA: PROCESS / dokumentacja (docs-only). BEZ `cargo`, BEZ zmian kodu. MODEL: HAIKU (Operator), SONNET (Evaluator, FC), HAIKU (Obrona) — zgodnie ze skryptem w6s.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `625624d97`. Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/battle/battleScene.ts`.

## PROBLEM (z tasku #323)
Dokument `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` zakłada, że pin czyta `rzeka_krawedzie` w renderze. Według tasku pin NIE czyta `rzeka_krawedzie` w renderze — `scene.ts:1263-1264` mówi to wprost. Dokument ma to błędnie opisane w:
- §3 wiersz 61 (tabela §3 — sprawdź numer wiersza w pliku; wiersz 60 dotyczy `hexes[].rzeka_krawedzie`, wiersz 61 dotyczy `rivers[]`/`RiverPathDto`; zweryfikuj, którego wiersza dotyczy błąd),
- §4 wiersz R3 (linia ~172: `| R3 | wstęgi rzek na mapie (scene.ts:800, :1263-1318, :2860+) | river_render_paths, rzeka_krawedzie |`).

## ZAKRES
1. Dla każdego z dwóch miejsc: odczytaj `git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '790,810p;1255,1325p;2855,2880p'` i ustal FAKTYCZNIE, czy i gdzie pin czyta `rzeka_krawedzie` / `hex.rzeka.krawedzie` w renderze. Nie zgaduj — podaj linie.
2. Popraw TYLKO te wiersze w `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md`, tak aby status i odwołania zgadzały się z pinem (np. „pin nie czyta rzeka_krawedzie w renderze: scene.ts:1263-1264” zamiast błędnego wpisu). Nie przepisuj reszty dokumentu.
3. W raporcie wpisz: dokładny cytat starego i nowego wiersza, numer wiersza tabeli, linie pinu z dowodem (wynik `sed`).

## ALLOWLISTA
- `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` (TYLKO te wiersze)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-DOC-323-RZEKA-KRAWEDZIE/**`

## NIE ROBIĆ
- Nie zmieniaj niczego w `rust-port/**`, `gra/**`, innych plikach `dyspozycje/rust-port/p4/`.
- Nie uruchamiaj `cargo`, `npm`.
- Nie pushuj.

## KRYTERIA KOŃCA
1. Dwa wiersze poprawione zgodnie z pinem, z dowodem linii w raporcie `01-operator-r1.md` w run dir.
2. `git diff --stat` pokazuje tylko plik z allowlisty; `git diff --check` EXIT 0.
3. Commit jawnym `git add` (nigdy `-A`), BEZ nazwy modelu w treści i trailerach. Bez push.
4. Jeśli okaże się, że dokument jest poprawny (pin jednak czyta `rzeka_krawedzie` w renderze) — NIE zmieniaj go; w raporcie podaj dowód linii i status „NIE ZMIENIONO — zarzut nieuzasadniony”.
