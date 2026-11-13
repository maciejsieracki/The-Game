STATUS: PASS
DOMAIN: GAME (WEB) — pamięć: dane base64 (audio/obrazy) trzymane wielokrotnie
TEMAT: R-WEB-MEMORY-DATA-URI-DUPLICATES-Q1
GOAL: ≥ 40 MB mniej sterty po GC w t.1, bez zmiany brzmienia/wyglądu, nadal jeden offline `Gra-ROBOCZA.html`, bez zmian reguł/AI.

## ZMIANY-COMMIT (sprawdzone samodzielnie)

- Baza `ca289d8ce781e048188c68c5b153684582e9a3bb` = origin/main (FALA 526).
- Kod: `05ae1801e826a0e24f1c2cb53af6db2281d5487c`; raport Operatora: `ca4fc985ab37c337c9f17ffab74bd84f4e198cdd`; ten raport FC: commit na `ca4fc985a` (SHA w odpowiedzi orkiestratorowi).
- `git diff --stat ca289d8ce ca4fc985a`: 23 pliki — `gra/vite.config.ts` (+95), nowe `gra/tools/memory-datauri-{duplicates,menu-pixel}-test.cjs`, reszta w folderze runu. Zero zmian w `gra/src/**`, `gra/data/**`, `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**`, `battle/**`; zasoby źródłowe nietknięte. Allowlista dotrzymana.
- `git diff --check ca289d8ce ca4fc985a`: czysto. Wszystkie 12 `gate-*.txt` mają linię `EXIT=`. Push: brak.

## TESTY (własne, buildy poza repo w `/tmp/civ-mem3-fc-*`, usunięte po pracy)

| Bramka | Wynik |
|---|---|
| vite build old (`ca289d8ce`) / new (`05ae1801e`) | EXIT=0 / EXIT=0; HTML 70 642 686 → 70 656 215 B (+0,019%, limit +2%) |
| `memory-datauri-duplicates-test` (new) | 14/14 PASS, EXIT=0: 0 literałów data:…;base64 w JS, 106 elementów przed bundlem, SHA-256 bajtów = pliki źródłowe, 106 blob:, 59 audio (loadedmetadata + decodeAudioData, 1750 s), 47 obrazów piksel w piksel blob: == data:, 0 stringów base64 > 1 MB, konsola czysta; heap po GC w menu 26,1 MB |
| `memory-datauri-menu-pixel-test` (old vs new) | 3/3, 0 z 1 024 000 pikseli różnych, EXIT=0 |
| tsc --noEmit | EXIT=0 |
| `memory-growth-rootcause-q1-measure`, seed 4242, Standardowy/kontynenty, t.1, kolejno old→new | heap po GC **220,8 → 101,6 MB (−119,2 MB)**; jednostki/miasta 48/42 w obu |

Pierwsza próba pomiaru old zakończyła się `Target page … closed` (proces przeniesiony do tła przez limit narzędzia); powtórzona w pierwszym planie — wynik jak wyżej. Wartości bezwzględne nieco wyższe niż u Operatora/Evaluatora (obciążona maszyna, load 13–15), różnica spójna z −125/−128 MB.

Nie powtórzone przeze mnie (przyjmuję logi Operatora i Evaluatora): logic 213/213, ai-test 274/20 (md5 jak FALA 526), war-allin hashe, capture-render-sync, unit-renderer-overlay-sync, visual-parity mapy, muzyka-era-live-e2e, t.50 (−123,8 MB). Uzasadnienie: zmiana dotyczy wyłącznie konfiguracji buildu, `gra/src` ma 0 zmian. `ai-city-render-batch` EXIT=1 — ta sama asercja co FALA 526 (czyta tekst `main.ts`, nietknięty), przedistniejące.

## Przegląd kodu

Wtyczka `civ-binary-assets-out-of-js`: `apply: 'build'`, `enforce: 'pre'`, obsługuje import bez query i `?url` (inne query bez zmian). Base64 ma alfabet `[A-Za-z0-9+/=]`, więc nie może zamknąć `<script>`. Klucz = SHA-256 treści (dedup). Element usuwany po dekodowaniu, URL cache'owany — jeden Blob na zasób. Dev bez zmian.

## Orzeczenia

Evaluator: `zarzuty: []`. Notatki:
- (a) `<meta charset>` przesunięty do bajtu ~62,7 M — **ODDAL**: w starym buildzie meta już była poza oknem prescan 1024 B (bajt 1310), więc to nie nowa klasa ryzyka; Chromium (cel `Gra-ROBOCZA.html`) zweryfikowany przez Evaluatora (UTF-8, tytuł poprawny). Hardening (wstawienie po `<meta charset>`) można zgłosić osobnym tematem; poza Chromium: NIE_ZMIERZONO.
- (b) oszczędność PSS wszystkich procesów mniejsza niż oszczędność sterty (Bloby w procesie przeglądarki) — **ODDAL**: GOAL zdefiniowany na stercie po GC; suma PSS i tak spada (≈ −66…−72 MB).

Brak NAPRAW, brak DO DECYZJI CZŁOWIEKA.

## Integracja

- SHA końcowy do integracji: commit `03-final-control.md` na `ca4fc985a` (rodzic `ca4fc985a` → `05ae1801e` → `ca289d8ce` = origin/main) — fast-forward main.
- Kolejność względem `origin/rust-port/parity-v2` (`b520768b0`, merge-base z main `f4c89d008`): niezależne — parity-v2 nie zmienia `gra/vite.config.ts`, `gra/tools/memory-datauri-*` ani folderu runu. Najpierw main (ten temat), parity-v2 bez zmian; ewentualny REPIN Rust później, jak w kolejce.

BLOKADY: brak.
RUNDY: 1/5 (Final Control).
NASTĘPNY KROK: integracja orkiestratora (ff main) → READY_FOR_DEPLOY → osobna bramka deploy/push.
DEPLOY-PUSH: NIE WYKONANO
