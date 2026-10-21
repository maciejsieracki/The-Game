STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MEMORY-LEAKS-FIX-Q1
GOAL: zweryfikować adwersaryjnie raport Operatora (commit `50f95eca`, baza `edb8fb56`): M1/M2/M3/M6 sprawdzone na kodzie, bezpieczeństwo każdego `dispose()`, kolejność M1, 5 miejsc `new BattleScene(`, diagnostyka `?memdebug=1`, allowlista, bramki, instrukcja dla właściciela.
ZMIANY/COMMIT: tylko ten dokument i dwa pliki z surowymi wyjściami bramek (`02-evaluator-bramki-baseline.txt`, `02-evaluator-bramki-po.txt`); zero zmian w `gra/**`.
TESTY: bramki powtórzone w worktree Evaluatora po `npm ci` (EXIT=0) na `edb8fb56` (baseline) i `50f95eca` (po); wyniki identyczne (patrz §2).
BLOKADY: brak blokujących; zarzuty niekrytyczne w §3.
RUNDY: 1/5
NASTĘPNY KROK: Final Control (Opus 5.5 medium).
DEPLOY/PUSH: NIE WYKONANO

## 1. Weryfikacja na kodzie (linie na `50f95eca`)

- **Allowlista:** `git diff --stat edb8fb56 50f95eca` → tylko `gra/src/battle/battleScene.ts` (+16), `gra/src/main.ts` (+15), `gra/src/render/cities.ts` (+74/-4), `gra/src/render/memDebug.ts` (nowy, 59), plus 3 pliki w `dyspozycje/autobot/runs/R-WEB-MEMORY-LEAKS-FIX-Q1/`. `git diff --check` czysty. W `main.ts` tylko import i blok w `finally` końca tury (punkt cyklu życia).
- **M1 — potwierdzone, bezpieczne.** `miasto-braz.ts:103-140` i `miasto-kamien.ts:93-130` (`mat`, `B`, `CYL`, `CONE`), `makeMatsG/R` (`:212`, `:514`) i `makeMats` (`:176`) tworzą nowe geometrie i materiały przy każdym wywołaniu. Grep nie znajduje żadnych `Texture`/`Sprite` ani modułowych cache'y. `registerOwnedMeshResources` (`cities.ts:264-279`) zbiera zasoby, zanim zostaną doczepione sprite'y (plakietka, 🔥). Plakietka jest doczepiana później w `_syncStatChip`, `cities.ts:571`. `buildSettlementModelForStyle` nie jest eksportowana, więc te zasoby nie trafiają nigdzie poza ten model. Kolejność: najpierw `scene.add(group)` (`:567`), potem `dispose` starych zasobów (`:568-569`), czyli zgodnie z wymogiem (d). Ścieżka usuwania miasta (`:587`) i `CityRenderer.dispose()` (`:752`) zwalniają teraz także te zasoby, a są one własnością modelu, więc to poprawne.
- **M2 — potwierdzone, bezpieczne.** `makeCityMapBadgeSprite` zapisuje teksturę pod `cityMapBadgeKey(input)` (`cityMapStatChip.ts:1070-1079`). `_syncStatChip` zapisuje w `statSpriteKeys` dokładnie ten sam klucz (`cities.ts:930-942`). Dlatego `pruneUnusedStatChipTextures` (`:608-619`) zwalnia tylko tekstury, których nie używa żaden żywy sprite. `statTexCache` nie ma innych użytkowników (grep). Wygląd się nie zmienia: obrazki wracają synchronicznie z kolejki (`cityMapStatChip.ts:265-268`).
- **M3 — potwierdzone, kompletne.** Wszystkie nasłuchiwacze `document`/`window` w `battleScene.ts` (`:3220`, `:3390-3420`, `:11945`, `:13279`, `:13540`, `:18123`) są teraz zdejmowane w `dispose()` (`:3608-3629`, `:3707-3718`). Miejsca `:13274`, `:13529` i `:18118` mają strażnik `if (!pole)`, a `:11932` zdejmuje poprzedni nasłuchiwacz. Podwójne `dispose()` jest bezpieczne, bo pola są zerowane. `dispose()` jest wołane we wszystkich 5 miejscach tworzenia:
  - `main.ts:27515`→`:27563`
  - `:28161`→`:28212`
  - `:29885`→`mapFieldBattle.ts:512`→`:557`
  - `:30251`→`:30300`
  - `:30385`→`:30391`

  Wycofanie lub anulowanie bitwy woła `this.dispose()` w scenie (`battleScene.ts:3250`, `:3959`, `:9848`).
- **M6 — liczby potwierdzone.** `grep ^export function dispose` w `src/render` daje 32 funkcje. 24 z nich nie mają żadnego wywołania (policzone niezależnie). Odrzucenie ich jako współdzielonych cache'y modułów jest zgodne z zasadą (a) dispatchu.
- **`?memdebug=1`:** `memDebug.ts:212-221` liczy flagę raz, a `:234` bez parametru kończy funkcję od razu (`return`). Całe wywołanie w `main.ts` jest w `try/catch`. Bez parametru nie ma żadnego wyjścia na konsolę. Przycinanie plakietek wykonuje się zawsze, ale to część poprawki M2, a nie diagnostyki.

## 2. Bramki (pełne wyjścia: `02-evaluator-bramki-*.txt`)

| Bramka | baseline `edb8fb56` | po `50f95eca` |
|---|---|---|
| `npm ci` | EXIT=0 | (ten sam lockfile) |
| `npx tsc --noEmit` | EXIT=0 | EXIT=0 |
| logic | 213/213 EXIT=0 | 213/213 EXIT=0 |
| tech-tree | 19/0 EXIT=0 | 19/0 EXIT=0 |
| research | 33/33 EXIT=0 | 33/33 EXIT=0 |
| unit-replace | 13/13 EXIT=0 | 13/13 EXIT=0 |
| combat | 6/6 EXIT=0 | 6/6 EXIT=0 |
| mgla-sciezka-inwariant | 41/1 EXIT=1 (`:7998-7999`) | 41/1 EXIT=1 (`:8009-8010`, ten sam tekst linii) |
| entity-card-contract | 75/0 EXIT=0 | 75/0 EXIT=0 |
| map-field-battle | 24/0 EXIT=0 | 24/0 EXIT=0 |

Plik `diff` baseline↔po różni się tylko nazwą tymczasowego bundla, czasami (ms) i przesunięciem numeru linii w `mgla`. Regresji nie ma. `gra/node_modules` usunięty.

## 3. Zarzuty (niekrytyczne, nie blokują)

1. Liczby referencyjne z dispatchu się nie zgadzają: `mgla` ma 41/1 zamiast 42/42, a `map-field-battle` ma 24 przypadki zamiast 22. To stan pinu, nie regresja. Do decyzji orkiestratora (osobny temat dla `battleScene.ts` `ru.q/ru.r`).
2. Krok 12 instrukcji (§7) każe szukać `BattleScene` w porównaniu snapshotów sterty. Ta nazwa klasy jest czytelna tylko w buildzie bez minifikacji (dev). Domyślny `vite build` (esbuild) przemianowuje identyfikatory. Krok 1 nie mówi, której wersji użyć, więc instrukcja powinna wskazać build dev/nieminifikowany albo opisać inny sposób rozpoznania tych obiektów.
3. W kroku 9 zdanie „na `main` liczby powinny rosnąć szybciej” to oczekiwanie, a nie pomiar. Dodatkowo `perfDebug` loguje na STARCIE tury, a `memdebug` na KOŃCU, więc porównywać należy trend, nie wartości bezwzględne. Brakuje tego zastrzeżenia.
4. M2 ma koszt: przycinanie na końcu każdego `sync()` zwalnia teksturę hover lub poprzedniego stanu. Powrót do tego stanu oznacza ponowne malowanie canvasu. Operator to ujawnił, wpływ: NIE_ZMIERZONO.
5. Pin `edb8fb56` jest 3 commity za `origin/main` (`cfc26c17`), a w tych commitach zmienił się `gra/src/main.ts`. Rebase nie był weryfikowany, więc integracja musi powtórzyć `tsc` i bramki na rzeczywistej bazie.
6. U3, czyli wczytanie lub nowa gra bez `dispose()` poprzednich rendererów (`main.ts:37049`, `:37169`, `:37514`, `:37763`, `:37987`), to punkt cyklu życia objęty allowlistą, ale świadomie odłożony. Odłożenie jest udokumentowane, więc akceptowalne. Kandydat na osobny temat.

Wpływ na wydajność i na „niegrywalność po N turach”: NIE_ZMIERZONO (brak profilera i przeglądarki).
