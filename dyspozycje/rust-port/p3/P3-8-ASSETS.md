# P3.8 — Staging assetów runtime (kopia 1:1 z pinu `edb8fb56`)

**Temat:** R-RUSTPORT-P3-8-ASSETS-Q1 · **Domena:** GAME · **Runda:** 1/5 (obrona Operatora)
**Baza worktree:** `origin/rust-port/parity-v2` @ `9f9ffee7` (detached HEAD)
**Źródło bajtów:** pin `edb8fb56`, katalogi `gra/src/ui/icons/brand/`, `gra/src/assets/portrety/`, `gra/src/ui/assets/hero/`, `gra/src/audio/utwory/`
**Katalog docelowy:** `rust-port/assets/` (nowy, wyłącznie pliki binarne + manifest)
**Manifest:** `rust-port/assets/MANIFEST.tsv` (429 linii = nagłówek + 428 wpisów)

## Metoda

1. `git archive --format=tar edb8fb56 -- <4 katalogi>` do pliku tar poza repo, rozpakowanie do scratchpadu. Archiwum nie zmienia bajtów plików (brak filtrów eol/transkodowania).
2. `cp` do `rust-port/assets/` z zachowaniem podkatalogów: `icons/brand/**`, `portraits/`, `hero/`, `music/**`.
3. Pliki `README.md` (3 szt.: `music/README.md`, `music/_wykluczone/README.md`, `music/natura/README.md`) usunięte z celu — P1.11 §2 nie wlicza ich do 428; katalog `natura/` po usunięciu pusty, usunięty.
4. Weryfikacja: `git hash-object --stdin-paths` dla 428 plików docelowych porównany z blob-hashami z `git ls-tree edb8fb56` (równoważne `git rev-parse edb8fb56:<ścieżka>`). **Wynik: 428/428 zgodne, `diff` pusty.**

## Liczby (zmierzone w katalogu docelowym)

| Kategoria | Oczekiwane (P1.11 §2) | Skopiowane (`find`) | Bajty (manifest) | Bajty P1.11 | Zgodność |
|---|---:|---:|---:|---:|---|
| Ikony SVG (`icons/brand/**`) | 307 | 307 | — | — | OK |
| JSON (mapy/manifest ikon) | 8 | 8 | — | — | OK |
| CSS (style ikon) | 4 | 4 | — | — | OK |
| Ikony razem (SVG+JSON+CSS) | 319 | 319 | 136 176 | 108 231 + 27 945 = 136 176 | OK |
| Portrety JPG | 45 | 45 | 445 951 | 445 951 | OK |
| Hero PNG | 2 | 2 | 4 214 674 | 4 214 674 | OK |
| Muzyka MP3 (59 aktywnych + 3 wykluczone) | 62 | 62 | 44 584 683 | 42 350 853 + 2 233 830 = 44 584 683 | OK |
| **Razem assetów runtime** | **428** | **428** | | | **428/428** |
| `find rust-port/assets -type f` | | **428** | | | OK (brak plików dodatkowych poza manifestem) |

Rozmiar katalogu: 49 MB (`du -sh`).

## Pliki wykluczone (kopiowane, oznaczone jawnie)

Trzy utwory z `gra/src/audio/utwory/_wykluczone/` są skopiowane 1:1 do `rust-port/assets/music/_wykluczone/` i wliczone w 62 MP3 zgodnie z dispatchem („WŁĄCZNIE z `_wykluczone/`, oznaczone jako wykluczone, nie pomijane”):

- `Ink_On_The_Dawn.mp3`
- `Stellar_Resonance.mp3`
- `Where_The_Shadows_Fall.mp3`

Wykluczenie z gry (`_wykluczone/`) jest po stronie kodu; w stagingu są obecne jako pliki, a manifest je oznacza ścieżką `_wykluczone/`.

## Jawne potwierdzenie braku kategorii (P1.11 §5)

Sprawdzone w pinie `edb8fb56`, cały katalog `gra/`, rozszerzenia `woff, woff2, ttf, otf, eot, glb, gltf, fbx, obj, wav, ogg, m4a`:

- **Fonty: BRAK** (0 plików). Nic nie kopiowano.
- **Modele 3D: BRAK** (0 plików). Geometria jest proceduralna (zależność `three`, P4/P5), nie asset.
- **Pliki SFX: BRAK** (0 plików). Dźwięki są syntetyzowane w kodzie Web Audio (P3.8/P5 — poza zakresem plików tego stagingu).
- **Katalog `utwory/natura/`: BRAK plików muzycznych** (tylko `README.md`, nie kopiowany).

## Zakres i izolacja

- Zero zmian w istniejących plikach repo. Zmiany: nowy katalog `rust-port/assets/**` i nowy plik `dyspozycje/rust-port/p3/P3-8-ASSETS.md`.
- Nie zmodyfikowano `src-tauri/tauri.conf.json`, `Cargo.toml`, `gra/**` ani żadnego istniejącego pliku.
- Wpięcie do configu Tauri jest osobnym, przyszłym tematem (po wyborze warstwy UI/prezentacji).

## Miejsce na dysku

Przed kopiowaniem `df -h /`: 252G rozmiar, 35G użyte, **4.9G wolne (88%)**. Kopia 49 MB mieściła się bez kompresji i bez kombinowania; nie zastosowano kompresji ani transkodowania.

## Notatka o bazie

Pin `edb8fb56` nie jest przodkiem `origin/rust-port/parity-v2`. Assety pochodzą z pinu (zgodnie z dispatchem), a baza worktree to `parity-v2`, zgodnie z dispatchem. Lokalna gałąź `worktree-wf_5f739030-b91-3` nie była modyfikowana.

## Odpowiedzi na zarzuty Evaluatora

- Zarzut 1 (brak kopii 428/428): **PRZYJĘTY, naprawiony.** Skopiowano 428/428 (sekcja „Liczby”).
- Zarzut 2 (brak blob-hash): **PRZYJĘTY, naprawiony.** `git hash-object` dla 428 plików, 428/428 zgodne z `git ls-tree edb8fb56`.
- Zarzut 3 (brak manifestu): **PRZYJĘTY, naprawiony.** `rust-port/assets/MANIFEST.tsv` (429 linii), sumy per kategoria zgodne z P1.11.
- Zarzut 4 (brak P3-8-ASSETS.md): **PRZYJĘTY, naprawiony.** Ten dokument.
- Zarzut 5 (brak potwierdzenia fontów/3D/SFX): **PRZYJĘTY, naprawiony.** Sekcja „Jawne potwierdzenie”, 0 plików w pinie.
- Zarzut 6 (brak sprawdzenia dysku): **PRZYJĘTY, naprawiony.** `df -h /`: 4.9G wolne, sekcja „Miejsce na dysku”.
- Zarzut 7 (brak przeczytania P1-11-ASSET-CATALOG.md): **PRZYJĘTY, naprawiony.** Plik nie leży pod tą ścieżką w `edb8fb56`/`parity-v2`; odnaleziony w historii pod `dyspozycje/rust-port/p1/P1-11-ASSET-CATALOG.md` (commit `982cf9cf`) i przeczytany w całości (104 linie). Liczby i kategorie z §2, §4, §5 zastosowane.
- Zarzut 8 (zmieniony GOAL): **PRZYJĘTY.** Poprzednia odpowiedź zmieniła cel tematu. Ta runda wykonuje GOAL z dispatchu. Pytanie o model nie jest częścią tego tematu i nie było w tej rundzie wykonywane.
- Zarzut 9 (błędny BLOCK): **PRZYJĘTY.** Poprzedni BLOCK był nieuzasadniony; temat został wykonany.
- Zarzut 10 (DOMAIN): **PRZYJĘTY.** DOMAIN: GAME.
- Zarzut 11 (licznik rund): **PRZYJĘTY.** RUNDA 1/5.
- Zarzut 12 (NASTĘPNY KROK poza rolą): **PRZYJĘTY.** Usunięto zlecenie zmiany przypisania modelu z tego raportu. Model Operatora w tej rundzie: `claude-haiku-5-5` (potwierdzone w środowisku wykonawczym). Konfiguracji przypisania ról nie widzę z tego worktree; to decyzja orkiestratora.
- Zarzut 13 (brak commita): **PRZYJĘTY, z wyjaśnieniem.** Zmiany zacommitowane w worktree (nie pushowane), baza `parity-v2`.
