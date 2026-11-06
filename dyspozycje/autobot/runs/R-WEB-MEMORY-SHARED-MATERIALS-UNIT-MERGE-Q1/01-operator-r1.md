STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB), pamięć renderu
TEMAT: R-WEB-MEMORY-SHARED-MATERIALS-UNIT-MERGE-Q1
GOAL: zdobyć jak najwięcej z (A) wspólnych materiałów i (B) scalania statycznych części jednostek, przy obrazie
bit w bit (priorytet), zachowanym pickingu, odznakach, mgle, przyciemnieniu, determinizmie AI i regułach gry.

ZMIANY-COMMIT:
- `5e62c5158cb477764578725fbe686bd1dbc07f14`: kod i testy.
  - `gra/src/render/materialContentPool.ts` (NOWY). Pula materiałów na renderer, licznik odwołań, `unshare`
    (kopia przy zapisie) i `pooledMaterialOpaqueSort`. Ten ostatni to kopia `painterSortStable`, ale porównuje
    id materiału sprzed puli, zapisane na meshu.
  - `units.ts`: pula w `_registerToken` i `_disposeToken`. `unshare` przed przyciemnieniem odroczenia. Pętla
    przyciemnienia idzie po unikalnych instancjach; to naprawia błąd znaleziony testem M2.
  - `cities.ts`: pula w `_registerModel`, `_disposeModel` i przy przebudowie modelu (stale).
  - `scene.ts`: `renderer.setOpaqueSort(pooledMaterialOpaqueSort)`.
  - `geometryContentPool.ts`: tylko komentarz.
  - NOWE `gra/tools/memory-static-material-pool-pixel-test.cjs` i `gra/tools/memory-static-unit-merge-prototype.cjs`.
- Raport, pomiary i bramki: commit następny (SHA w odpowiedzi Operatora). Branch `autobot/R-WEB-MEMORY-SHARED-MATERIALS-UNIT-MERGE-Q1-op-r1`,
  baza `origin/main` `ca289d8ce`.
- Bez zmian: `main.ts`, `gra/data/**`, `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**`, `battle/**`, `vite.config.ts`.

WYNIK (szczegóły: `memory-attribution.md`):
- (A) WDROŻONE, obraz bit w bit, bez tolerancji ≤100 px.
  - Przyczyna 51 px potwierdzona: sortowanie po `material.id`. Kontrola z domyślnym sortowaniem daje dokładnie
    te same 51 px, a z naszym sortowaniem 0 px.
  - Materiały: jednostki t.50 7 141 → 188, miasta 1 747 → 135.
  - MB po GC w buildzie produkcyjnym: t.1 221,2 → 212,8 (**−8,4**), t.50 308,5 → 302,6 (**−5,9**, 417 → 419 jedn.).
  - Sterta V8 przy 475 żetonach: −18,2 MB.
- (B) PROTOTYP, NIE WDROŻONE.
  - Animacji części na mapie nie ma, a picking przez `unitId` korzenia działa po scaleniu.
  - Zysk: −29,8 MB przy 475 żetonach; meshe 62,6 → 14,8 na żeton; draw calls ×4 mniej.
  - Koszt: piksele 52 / 101 / 5 (stanie/marsz/atak) z 1,6 mln, zaokrąglenie CPU kontra GPU. Do tego zmiana
    zachowania `SmallPartLod`.
  - Nie jest bit w bit, a tolerancja z decyzji dotyczy tylko (A), więc zgodnie z dispatchem nie wdrażam.

TESTY (logi `gate-*.txt`, każdy z `EXIT=`):
- `memory-static-material-pool-pixel-test`: 7/0 (M1 0 px, M2 0/0, M3 kontrola 51 px, M5 picking, M6 3 038 → 477).
- `memory-static-model-pool-pixel-test`: 6/0.
- `memory-static-geometry-pool-test`: 18/0.
- `memory-static-unit-merge-prototype`: pomiar, EXIT=0.
- `memory-static-ascii-bundle-test`: 16/2. S0 i S4 wymagają builda sprzed wtyczki ASCII, a oba buildy już ją mają,
  więc nie mają tu zastosowania (dopisek w logu). S1 OK.
- `memory-growth-visual-parity-test` (pełna klatka, prod ca289d8ce vs temat): 4/0, `any=0`.
- `memory-growth-merge-index-test`: 24/0.
- `memory-growth-improvement-cpu-release-test`: 20/0.
- `unit-renderer-overlay-sync-test`: 17/0.
- `city-badge-zoom-lod-test`: 67/0.
- `camera-zoom-block-test`: 4/0.
- `river-fog-visibility-test`: 31/0.
- `unit-deferred-reveal-dim-real-render-test`: 19/0.
- `capture-render-sync-test`: 23/0.
- `render-unit-sharpness-guard`: PASS.
- `ai-city-render-batch-test`: EXIT=1, błąd istniejący wcześniej. Test czyta tylko `main.ts`, którego temat nie
  zmienia; ten sam FAIL jest na `origin/main` (dopisek w logu).
- tsc: 0 błędów.
- logic: 213/213.
- ai-test: 274/20, bez zmian względem bazy.
- `war-allin-capital-quick`: hashe identyczne z FALA 526.
- Pozostałych `*render*` (84 narzędzia) NIE uruchomiono. Wybrano te dotyczące jednostek i miast.
- Powtarzalności pomiaru PRZED-vs-PRZED nie zmierzono (NIE_ZMIERZONO).

BLOKADY: brak dla (A). Dla (B) potrzebna decyzja właściciela: czy dopuścić ≤~100 px i zmianę LOD drobnych części
za ~30 MB i ~4× mniej draw calls. Orkiestrator może ją zadać jako ABC. Założenie przyjęte w tym raporcie: bez
decyzji (B) nie jest wdrażane.

Higiena:
- Buildy vite tylko poza repo (`/tmp/civ-mem4-*`, usunięte).
- Migawek sterty nie robiono.
- Jedna przeglądarka naraz.
- Śmieci po `render-unit-sharpness-guard` (`gra/guard-*`) usunięte.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5, medium). Do oceny: (A) do integracji; (B) prototyp i pytanie do właściciela.
DEPLOY-PUSH: NIE WYKONANO
