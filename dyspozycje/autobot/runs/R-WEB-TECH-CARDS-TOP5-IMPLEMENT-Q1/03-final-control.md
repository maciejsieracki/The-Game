STATUS: PASS
DOMAIN: GAME (WEB) — karty odkryć (UI + dane treści)
TEMAT: R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1
GOAL: Etap 1 kart odkryć: Top 5 bezpośrednio po Rysie historycznym, „Co możesz teraz zrobić” jako CZYNNOŚĆ → KORZYŚĆ, efekty martwe ukryte (karta + ścieżka zapasowa popupu).

## ZMIANY/COMMIT

- Oceniany kod: Operator `dc4a76d34` + `ed87b5091`, Obrona `d99f91022` (baza `397f84f29`).
- Gałąź FC: `wip-fc-tech-top5` (worktree `wf_040e1699-692-4`), zbudowana na aktualnym `origin/main` `d36f8b3b0`:
  - `a3e3efeba` — merge `d99f91022` do `origin/main` (bez konfliktów; 5 commitów main od bazy nie dotyka żadnego pliku tematu: `git merge-tree` czysty);
  - commit tego raportu na wierzchu (SHA w raporcie końcowym FC).
- Diff `397f84f29..d99f91022`: 21 plików, wszystkie w allowliście dispatchu; `git diff --check` czysty.
  Nietknięte: `buildings.json`, `tech.json`, `units.json`, `terrain-improvements.json`, `src/game/**`, `WERSJE.md`.
  `renderer.ts`: wyłącznie CSS bloku `top5` (+6 linii).
- Kopia CSV w `runs/.../zrodlo/odkrycia-top5.csv` bajt w bajt = `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/analizy/karty-odkryc/odkrycia-top5.csv` (`cmp`).
- Dane: 32/32 odkryć z `tech.json` ma wpis, 0 osieroconych (poza kluczem `_meta`); 0 wystąpień „jeśli spełnisz”/„na odpowiednim złożu”/„Nie oznacza”.
  Waluta Top1 = „Mennica: ×1,50 podatku (handlu)…”; Matematyka i Obróbka żelaza Top1 = „Otwiera drogę do…” (decyzja 4).
  Jedyny wpis z 0 pozycji Top 5: Astronomia (decyzje 2+3 — jedyny efekt martwy, ukryty).

## TESTY (odtworzone samodzielnie na `a3e3efeba` = main + temat, Chromium `/opt/pw-browsers`)

Bramki:
- `tsc --noEmit`: 0
- `logic-test`: LOGIC OK 213/213
- `ai-test`: 289/0
- `tech-tree-test`: 19/0
- `research-test`: 33/33 ALL GREEN
- `entity-card-contract-test`: 75/0
- `tech-cards-top5-test`: 594/0
- `gen-tech-cards-top5 --check`: OK
- harness Z4 Obrony (`obrona-r1-z4-harness/run.cjs <gra>`): 10/0, pageerrors 0

Testy kart zielone: `karta-technologia-uklad-real-render` 11/0, `tech-discovery-card-click` 13/0,
`tech-discovery-card-real-click` 12/0, `technology-discovery-card-visual` 48/0, `tech-unlock-units` 129/0,
`entity-card-historia-section` 36/0, `entity-card-single-dialog` 25/0, `entitycard-civpedia-klik` 71/0.

Czerwone jak na bazie (zgodnie z pomiarami Evaluatora/Obrony): `tech-discovery-badge-diorama` 61/2, `entitycard-sufit-dwoch-kart` 58/9.

Niestabilne — zmierzone przeze mnie TAKŻE na bazie (pliki `technologyAdapter.ts`/`renderer.ts`/`techDiscoveryNotice.ts` przywrócone do `397f84f29`, potem przywrócone do HEAD, `git status` czysty):
- `entity-card-cross-links-nested-overlay`: temat 7/10 uruchomień zielonych (czerwone: 17/7, 23/1, 23/1);
  baza 6/8 zielonych (czerwone: 23/1, 17/7). Ten sam wzór błędów (karta jednostki Falanga, kroki [2]/[3]) — przed tematem.
- `civpedia-caly-wiersz-przyciskiem`: temat 2/3 zielone; baza 4/6 zielone (ten sam FAIL [6] kind=unit Falanga). Przed tematem.

Żywa gra: NIE_ZMIERZONO (dispatch zabrania `npm run build/dev`).

## ORZECZENIA

- Z1 (lista czerwonych testów niepełna) — ODDAL: Obrona uzupełniła listę (`02-operator-obrona-r1.md`), wyniki potwierdzone na bazie przez Evaluatora; mój pomiar `sufit-dwoch-kart` 58/9 identyczny.
- Z2 (niestabilność civpedia-caly-wiersz) — ODDAL: niestabilność istnieje na bazie `397f84f29` (2 FAIL na 6), ten sam krok [6]; nie regresja. Osobny temat na niestabilne testy kart (Falanga, cross-links/civpedia) — rekomendacja dla orkiestratora.
- Z3 (sprzeczność Mennicy: Top 5 vs „Zmiany ekonomiczne”) — ODDAL w tym temacie: sekcja „Zmiany ekonomiczne” poza dispatchem C, dane w `buildings.json` (zakaz). Osobny temat `R-WEB-TECH-CARDS-ECON-SECTION-BASE-Q1` (wybór baza/przyrost = treść, ewentualnie ABC przez orkiestratora).
- Z4 (martwe budynki w ścieżce zapasowej) — ODDAL (naprawione w `d99f91022`): harness wymuszający fallback 10/0, na `ed87b5091` 7/3. Zmiana mieści się w „spójności Top5/CMZ” dopuszczonej dla `techDiscoveryNotice.ts` i realizuje decyzję 3 właściciela (ukryć martwe efekty).
- Z5 (tautologiczna asercja CMZ) — ODDAL (naprawione w `d99f91022`): test sprawdza dane (`czynnosc`/`korzysc` niepuste, różne, bez spójnika) i dokładną równość renderu; 594/0.
- Z6 (testy diorama/tdn nadpisują PNG z innego runu) — ODDAL: commit tematu nie zawiera tych plików; po moich testach `git status` czysty (testów diorama nie uruchamiałem). Uwaga dla integratora pozostaje: nie dodawać `R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1/dowody/*.png`.

Brak NAPRAW → PASS.

## ZAŁOŻENIA (do potwierdzenia przez właściciela, przekazuje orkiestrator)

1–5 Operatora (usunięty „Nie oznacza”, ulepszenia z `terrain-improvements.json`, sekcja „Cuda”; zdania Top 5 redagowane przez Operatora; Astronomia 0 pozycji; Astronomia nie jako cel „otwiera drogę”; Mennica ×1,50 w CMZ) oraz Z-O1 Obrony (ukrywanie martwych efektów w ścieżce zapasowej).

## INTEGRACJA / KOLEJNOŚĆ

- SHA do integracji: HEAD gałęzi `wip-fc-tech-top5` (commit raportu FC nad `a3e3efeba`); rodzic 1 = `origin/main` `d36f8b3b0`, rodzic 2 = kod Obrony `d99f91022` (zawiera `dc4a76d34`, `ed87b5091`). Merge do `main` jako fast-forward, o ile `main` nie ruszył; inaczej merge — konfliktów z `d36f8b3b0` brak.
- Kolejność względem `origin/rust-port/parity-v2`: niezależne. Temat dotyczy wyłącznie weba (`gra/`), nie zmienia mechaniki ani danych JSON gry; integracja do `main` NIE wymaga żadnej zmiany na `parity-v2`. Ewentualne przeniesienie treści kart (`tech-cards-top5.json`) do UI Rust — osobny REPIN po wdrożeniu webowym (NIE_ZMIERZONO, czy UI Rust ma te karty).

BLOKADY: brak
RUNDY: 1/5 (Final Control po Obronie r1)
NASTĘPNY KROK: integracja orkiestratora → deploy ROBOCZA; potwierdzenie założeń przez właściciela; osobne tematy: sekcja „Zmiany ekonomiczne” (Z3), niestabilne testy kart Falanga (Z2).
DEPLOY/PUSH: NIE WYKONANO
