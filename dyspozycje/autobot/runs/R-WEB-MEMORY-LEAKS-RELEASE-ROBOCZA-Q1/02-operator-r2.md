STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MEMORY-LEAKS-RELEASE-ROBOCZA-Q1
GOAL: Kandydat ROBOCZEJ = origin/main cfc26c17 + 4 pliki produktowe z 5f5eea8f; bundle 0c7f13d9 (bez zmiany bundla w r2).
RUNDY: 2/5

## Odpowiedzi na zarzuty Evaluatora
1. PRZYJMUJE. Przyczyna: `.gitignore:20` = `*.log` — logi runu 1 istnialy na dysku, ale git je ignorowal. Poprawka: logi r1 skopiowane jako `evidence/r1-*.log.txt` (z `EXIT=`), plus swieze pelne logi r2 `evidence/r2-*.log.txt` (npm-ci, tsc, vite-build, verify, 5 testow + nowy test), kazdy z `EXIT=`.
2. PRZYJMUJE. `smoke-chromium.out` (r1) zostaje jako historia; nowy `evidence/r2-smoke-chromium.log.txt` (bez ANSI, konczy sie `EXIT=0`) z pelnymi liniami memdebug dla kazdej tury.
3. PRZYJMUJE, DOWOD. Smoke r2 (`smoke-chromium-r2.cjs`, czeka na zmiane numeru tury i na linie memdebug, dismiss modali, diagnostyka stall): 8 koncow tur, TURA 1->9, zero stall. Trend (tura: geometries/textures/programs/cityModels/cityBadgeTextures/jsHeapMB): 2: 274/18/18/49/5/305.3; 3: 274/18/18/49/5/309.6; 4: 274/18/18/49/5/293.0; 5: 274/18/18/49/5/314.2; 6: 274/18/18/49/5/308.9; 7: 274/21/18/49/5/322.0; 8: 274/22/18/49/5/301.0; 9: 274/22/18/49/5/333.2. geometries/programs/cityModels/cityBadgeTextures stale; jsHeap bez trendu monotonicznego (293-333, GC). textures 18->22 od tury 7 (+4) — NIE jest to cache plakietek (stale 5); zrodlo NIE_ZMIERZONO (8 tur za malo, by odroznic wzrost od skokowego doladowania zasobow). Poprzednie zawieszenie po 1. turze: nie powtorzone (przyczyna r1 = skrypt, nie gra; NIE_ZMIERZONO co dokladnie).
4. PRZYJMUJE, DOWOD. Skrypt loguje URL: `BAD_RESPONSES []`, jedyny blad konsoli = 404 `http://127.0.0.1:<port>/favicon.ico` (lokalny serwer smoke, bundle nie ma favicon; serwer loguje `SERVER 404 for /favicon.ico`). Zero pageerror. Nie jest to zasob gry.
5. PRZYJMUJE. Nowy `gra/tools/web-memory-leaks-test.cjs` (30 pass / 0 fail, `r2-test-web-memory-leaks.log.txt`): isMemDebugEnabled (off/on/`=0`), format linii logRendererMemoryAtTurnEnd i no-op, pruneUnusedStatChipTextures (sierota zwolniona, zywe nietkniete, idempotentne, 33 zmiany populacji = cache staly), getMemDebugCounts, M1 (26 geometrii + 18 materialow starego modelu dispose po przebudowie, nowy model nietkniety). Kontrola negatywna: po zneutralizowaniu `registerOwnedMeshResources` test M1 daje 4 FAIL (26/4), kod przywrocony (diff src = pusty). M3: tylko straznica statyczna regexem (3 asercje) — NIE dowod runtime; BattleScene nie uruchomiony w przegladarce (NIE_ZMIERZONO). Plik poza pierwotna allowlista (test do zmiany) — orkiestrator moze go zostawic lub wyciac osobnym commitem (osobny commit).
6. ODRZUCAM jako defekt, PRZYJMUJE dokumentacje. `GAME_MAP_RENDER_STYLE` = `export const ... = 'roblox'` (gra/src/render/mapRenderStyle.ts:40), jedyne uzycie w cities.ts to warunek w `buildSettlementModelForStyle`; galaz `buildSettlementModel` (cities.ts, po bloku roblox) jest nieosiagalna w runtime tej wersji. Test [3] potwierdza ze dla galezi roblox rejestr zasobow dziala.
7. PRZYJMUJE. Manifest: pelna poprzednia tresc (cfc26c17) przywrocona pod kluczem `previousReleaseManifest` (202 linie); gorne pola nowe. Powod redukcji w r1 = brak (nie uzasadniony) — naprawione. `limits` poprawione. verify: VERIFY OK, EXIT=0 (`r2-verify.log.txt`).
8. PRZYJMUJE, PRZYCZYNA USTALONA. Stamp WARN NIE jest specyficzny dla Linuksa: `inject-build-stamp.ps1:56-67` i port Node mierza md5 pliku, wpisuja go do pliku (zmieniajac md5) i petla 4 iteracji nie zbiega (self-referencja). Dowod: poprzedni bundle z b4d37d9f (budowany ps1) ma md5 pliku 3b6610b7..., a stamp `title="md5=f306cdf4..."`. Wiazace jest `bundleMd5` w manifescie. Port Node (`evidence/stamp-bundle.cjs`) ma identyczna petle jak ps1.
9. PRZYJMUJE. `smoke-chromium-r2.cjs` bierze sciezki z ENV (`SMOKE_BUNDLE_DIR`, `SMOKE_PLAYWRIGHT_FROM`, `SMOKE_CHROME`, `SMOKE_TURNS`) i katalog wyjsciowy z argv. Stary `smoke-chromium.cjs` zostaje jako historia r1.
10. Rust fmt/clippy/cargo test N/A: `git diff --stat cfc26c17 -- rust-port src-tauri dyspozycje/WERSJE.md` = pusty (EXIT=0); `git diff --check cfc26c17` czysty (EXIT=0).

## Bundle (bez zmian, z pliku)
md5 0c7f13d9dbb869ea648bd65dfd3bea1c; sha256 0ab5f654d19f1be30c8139ca3de77781b75e327d5d4c0e8e262bbcd3be839a22; 69945591 B. Swiezy build r2 (dist-r2) ma ten sam rozmiar 69,850.81 kB przed stemplem; roznica vs commitowany bundle tylko blok CIV-BUILD-STAMP (potwierdzone tez przez Evaluatora).

## Noty
- Brak porownania przed/po (bundle bazowy nie mierzony): NIE_ZMIERZONO. textures +4 od tury 7 niewyjasnione.
- Smoke = swiftshader, jedna gra seed 7, 8 tur; nie jest pelna akceptacja rozgrywki.

NASTEPNY KROK: Evaluator r2, potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
