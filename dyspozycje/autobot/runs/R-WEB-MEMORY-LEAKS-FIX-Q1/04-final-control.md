STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MEMORY-LEAKS-FIX-Q1
GOAL: Final Control r1 — orzeczenie na dowodzie (kod + własne bramki) wobec zarzutów Evaluatora (`3651e388`) i Obrony (`8d5461be`) do pracy Operatora (`50f95eca`, pin `edb8fb56`).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Baza i integracja

- `origin/main` w chwili kontroli = `cfc26c17` (pin `edb8fb56` jest jego przodkiem, 3 commity wstecz).
- `git cherry-pick 50f95eca 3651e388 8d5461be` na `cfc26c17`: EXIT=0, `main.ts` auto-merge bez konfliktów.
  Wynik (detached, worktree FC): `5f5eea8f` (kod) → `5daa6450` (Evaluator) → `b3ab84f5` (Obrona) → commit tego raportu.
- `git diff --stat cfc26c17 HEAD` (przed tym raportem): wyłącznie `gra/src/battle/battleScene.ts`, `gra/src/main.ts`,
  `gra/src/render/cities.ts`, `gra/src/render/memDebug.ts` (nowy) + `dyspozycje/autobot/runs/R-WEB-MEMORY-LEAKS-FIX-Q1/**` — w allowliście.
  `git diff --check cfc26c17 HEAD`: czysto.

## Bramki (FC, własne; surowe wyjścia z `EXIT=` obok)

`npm ci` EXIT=0. Pliki: `04-final-control-bramki-cfc26c17-baseline.txt` (cfc26c17), `04-final-control-bramki-po.txt` (b3ab84f5).

| Bramka | cfc26c17 | po (b3ab84f5) |
|---|---|---|
| `npx tsc --noEmit` | EXIT=0 | EXIT=0 |
| logic | 213/213 | 213/213 |
| tech-tree | 19/0 | 19/0 |
| research | 33/33 | 33/33 |
| unit-replace | 13/13 | 13/13 |
| combat | 6/6 | 6/6 |
| mgla-sciezka-inwariant | 41/1, EXIT=1 | 41/1, EXIT=1 |
| entity-card-contract | 75/0 | 75/0 |
| map-field-battle | 24/0 | 24/0 |

`diff` wyjść: różnią się wyłącznie czasy `mapGen ms` oraz numer linii w porażce mgla (`battleScene.ts:7998-7999` → `8009-8010`,
przesunięcie o 11 linii dodanych w `dispose()`; ten sam niesklasyfikowany zapis `ru.q/ru.r` istnieje na bazie). Zero regresji.
Nie uruchamiano: build/dev, vite, real-render/Chromium, `unit-power-test`. `gra/node_modules` usunięty po pracy.
Wpływ na wydajność/pamięć: NIE_ZMIERZONO (brak profilera i przeglądarki).

## Przegląd każdej dodanej linii dispose / removeEventListener

- `cities.ts:568-569` (`staleMats/staleGeos.dispose()`): źródło list = `userData['mats'|'perCityGeos']` modelu. Dla Brąz/Kamień
  rejestruje je `registerOwnedMeshResources` (`cities.ts:266-278`) — tylko `isMesh`, przed doczepieniem sprite'ów (🔥, plakietka).
  `miasto-braz.ts`/`miasto-kamien.ts` nie mają modułowych obiektów THREE ani cache (jedyne top-level `const` to liczby/obiekty
  układu/funkcje), brak tekstur; `material.dispose()` i tak nie zwalnia `map`. Kolejność: `scene.add(nowy)` (`:567`) przed dispose starego. Bezpieczne.
- `cities.ts:614` (`tex.dispose()` w `pruneUnusedStatChipTextures`): zwalnia tylko klucze nieobecne w `statSpriteKeys`; klucz cache
  = `cityMapBadgeKey(input)` (`cityMapStatChip.ts:1071`) = klucz zapisany w `_syncStatChip` (`cities.ts:930,942`). `_removeStatChip`
  usuwa klucz razem ze sprite'em (`:825`). Późny `repaint` obrazka na zwolnionej teksturze ustawia tylko `needsUpdate` na nieużywanym obiekcie — nieszkodliwe.
- `battleScene.ts:3711-3718` + `:11932-11934`: handlery są polami instancji (`:2191`, `:13293`), dodawane wyłącznie w `:11945`, `:13279`,
  `:13540`, `:18123` tymi samymi referencjami i bez opcji capture — `removeEventListener` trafia. Po audycie wszystkie
  `document|window.addEventListener` w `battleScene.ts` mają parę w `dispose()`. `dispose()` wołane we wszystkich 5 miejscach tworzenia
  (`main.ts:27563, 28212, 30300, 30391`, `mapFieldBattle.ts:557`). Zasobów współdzielonych nie dotyka.
- `memDebug.ts:40`: bez `?memdebug=1` natychmiastowy `return`; wywołanie w `try/catch` (`main.ts`, blok końca tury).

## Orzeczenia zarzutów Evaluatora

1. Liczby referencyjne mgla 41/1, map-field-battle 24 — **ODDAL**: stan bazy, potwierdzony przez FC na `cfc26c17` bez zmian.
2. Krok 12 wymaga wersji dev — **ODDAL**: naprawione w `8d5461be` (krok 1 rozróżnia wersje, 12a dev-only, 12b działa w każdej).
3. Krok 9 = przewidywanie, różne punkty pomiaru — **ODDAL**: naprawione w `8d5461be`; porównanie wyłącznie po `[perfDebug] EOT start`,
   który loguje `geometries`/`textures` (`main.ts:36108-36112` na cfc26c17-bazie), zastrzeżenie o trendzie dopisane.
4. Koszt ponownego malowania po hoverze — **ODDAL**: `syncStatChips` nie przycina (`cities.ts:627-643`); przycinanie tylko w `sync()` (`:593`)
   i na końcu tury; wygląd bez zmian. Koszt NIE_ZMIERZONO, ujawniony.
5. Pin 3 commity za `origin/main` — **ODDAL**: FC sam wykonał cherry-pick na `cfc26c17` (czysty) i bramki (identyczne).
6. U3 (load/nowa gra bez `dispose()` rendererów) — **ODDAL** jako wadę tej pracy: poza zakresem dispatchu (M1/M2/M3/M6), jawnie udokumentowane w §5 `01-operator.md`. Kandydat na osobny temat.

Agregat: 0 × NAPRAW, 0 × DO DECYZJI CZŁOWIEKA → **PASS-WITH-NOTES**.

## Uwagi dla orkiestratora (nieblokujące)

- Czerwony `mgla-sciezka-inwariant` (41/1) jest pre-istniejący na `main` — osobny temat.
- Osobne tematy-kandydaci: U3 (dispose rendererów przy load/nowej grze), materiały sprite'ów 🔥 w `CityRenderer.dispose()`.

## NASTĘPNY KROK

Integracja orkiestratora: gałąź `fix/web-memory-leaks-Q1` od `cfc26c17`, cherry-pick w kolejności
`50f95eca` → `3651e388` → `8d5461be` → (commit tego raportu FC), powtórzyć bramki na finalnym czubku, push gałęzi
po osobnej autoryzacji. Bez merge do `main`, bez `READY_FOR_DEPLOY`, bez `WERSJE.md` (wyjątek dispatchu). Potem test właściciela wg §7 `01-operator.md`.
