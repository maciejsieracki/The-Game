
## DODATEK 1 (runda 2 po FC FAIL r1, 2026-11-17) — BAZA = d5323fadf4612e7fb317d9e1177a9d2d9b806aa9 (kandydat r1 + zacommitowane evidence JSON i skrypty operatora)

Final Control r1: FAIL z dwóch powodów. (a) evidence/skrypty były niezacommitowane — NAPRAWIONE przez orkiestratora (w bazie: `evidence/w24-lewy-baner-w1024-900-800.json`, `evidence/w3-straty-zwyciezcy-seeds123.json`, `gra/tools/live-verify-w24-widths-1024-900-800-obs.cjs`, `gra/tools/live-verify-w3-seeds123-obs.cjs`; PNG są poza repo). (b) punkt 3 mierzono w trybie skip (Pomiń), bez pary wręcz+dystans, a ziarna 1–3 dały identyczne wyniki.

USTALONE (NIE powtarzaj): **W18** zamknięty (FALA/FC r4 PASS-WITH-NOTES, w main) — tylko jedno zdanie odsyłacza w raporcie. **W24 PASS** przy 1024/900/800 px (brak poziomego scrolla, brak wylewania) — zachowaj wynik.

WAŻNE dla punktu 3: w trybie trafień **„pewne” (domyślny nowych gier) wynik jest deterministyczny — ziarna dają identyczne wyniki; to oczekiwane, NIE defekt** (hit-mode.ts/combat.ts: pewne = 100% trafień, brak upsetu). Niezależne próbki istnieją tylko w trybie „losowe” (`window.__civSetHitMode('losowe')` przy `?civtest`, jak w `gra/tools/hit-mode-consistency-test.cjs`).

ZADANIE rundy 2 (jedno): punkt 3 z `00-dispatch.md` w pełnej formie:
- Para armii wręcz (np. Wojownik vs Wojownik) i para dystans (np. Łucznik vs Wojownik), po tyle samo jednostek (np. 10 vs 10) dla ręcznej i AUTO.
- Tryb „pewne”: 1 przebieg na parę (zaznacz determinizm); tryb „losowe”: ≥3 niezależne ziarna na parę.
- **Bitwa ręczna naprawdę ręczna** (nie Pomiń/skip): użyj działającego wzorca z harnessów, które dochodzą do bitwy i prowadzą ją ręcznie — `gra/tools/battle-manual-control-multicycle-live-test.cjs`, `battle-doctrine-live-r4-test.cjs`, `battle-manual-full-roster-pointer-live-test.cjs` — albo prosty sterownik, który klika „START WALKI” i „Następna runda/atakuj” do końca. Jeśli klik-po-klik nie da się domknąć po max 2 różnych podejściach — jawnie „NIE ZMIERZONO ręcznej” z dokładnym miejscem zatrzymania (krok, selektor, log) i podaj pomiar AUTO + skip jako najbliższy zastępnik, oznaczony jako zastępnik.
- Tabela: para | tryb trafień | ziarno | tryb bitwy (ręczna/AUTO/skip) | straty zwycięzcy | straty przegranego | rundy.
- To POMIAR do decyzji właściciela; bez oceny „błąd/OK” poza oczywistą rozbieżnością z dowodem.
Zakazy bez zmian (m.in. `rm/rmdir/unlink` w komendach, `git add -A`, bez zmian w `gra/src`/`gra/data`, PNG nie do repo — commituj tylko JSON/skrypty). Model Operatora: HAIKU (r2).
