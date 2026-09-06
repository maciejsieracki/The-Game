## RAPORT FINAL CONTROL — R-PRAWO-PRZEBUDOWA-SKALI-Q1 (runda 1)

```
STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-PRAWO-PRZEBUDOWA-SKALI-Q1
GOAL: Przebudować skalę Prawa (D1-D7 właściciela) wg 00-dispatch.md — zgodny co do słowa,
sprawdzone (dispatch nietknięty od otwarcia tematu).
ZMIANY/COMMIT: weryfikacja bezpośrednio w /home/user/wt-prawo-skala, HEAD a122e967
(025d899f jest przodkiem — potwierdzone git merge-base --is-ancestor), drzewo czyste.
Żadna edycja poza allowlistą.
TESTY: uruchomione niezależnie przeze mnie, identyczne z raportami + własne mutacje (niżej).
BLOKADY: 2 pozycje DO DECYZJI CZŁOWIEKA (patrz WERDYKTY), obie już opisane w decision-abc.md.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator przedstawia właścicielowi zarzuty #1 i #2 do decyzji; reszta
tematu (kryteria 1,3,4,5,6) stoi gotowa do integracji po jego odpowiedzi.
DEPLOY/PUSH: NIE WYKONANO
```

### Tabela zarzut/obrona/werdykt

| # | Zarzut | Obrona | Werdykt |
|---|---|---|---|
| 1 | `main.ts:29179-29215` nigdy nie ustawia `hasGarnizonBudynek` — realna ścieżka silnika (rebelia/`revoltGrace`) nie dostaje bonusu budynku Garnizon 25/35/47, mimo że kalibracja 53/85/121 go zakłada. Tylko `cityPanel.ts` (podgląd) jest poprawny. | PRZYJMUJĘ, bez samopoprawki (main.ts zakazany), eskalowane DECISION_REQUIRED w decision-abc.md z dwiema rekomendacjami (mikro-patch albo rozszerzenie allowlisty). | **DO DECYZJI CZŁOWIEKA** — potwierdzone grepem: żadne wystąpienie `hasGarnizonBudynek` w `main.ts`, tylko w `cityPanel.ts:3150`. Defekt realny i poważny (kalibracja tematu nieobecna w rozgrywce), ale poprawka wymaga dotknięcia pliku bezwzględnie zakazanego tym tematem — to decyzja o zakresie/priorytecie (osobny mikro-temat vs rozszerzenie allowlisty), nie coś, co Operator może rozstrzygnąć sam. |
| 2 | Dwie usunięte kary nadal istnieją literalnie w `gra/tools/.pt-layout-bundle.cjs:6494` i `.diag-playtest-bundle.cjs:8202` — kryterium 2 nie spełnione w 100% tekstowo. | PRZYJMUJĘ fakty, ODRZUCAM że blokuje — martwe, pre-istniejące bundle (potwierdzone: commit 546f6a51, sprzed bazy tematu), nieużywane przez żaden aktywny plik/bramkę. | **DO DECYZJI CZŁOWIEKA** (drugorzędne) — potwierdzone: `546f6a51` jest przodkiem bazy `025d899f`, oba pliki poza allowlistą, zero referencji w `gra/tools/*.cjs`/`package.json`. Kryterium 2 czytane dosłownie nie jest spełnione, ale sprzątanie leży poza zakresem tego tematu — decyzja o osobnym mikro-sprzątaniu należy do orkiestratora/właściciela. |
| 3 | Test 3i sprawdzał tylko surową tablicę `lines[]` (max 5 linii), nigdy realnego cięcia `linesHtml(s.prawLines,6,pfx)` w `orderPanel.ts` — pułapka nazewnicza niezweryfikowana pod prawdziwym sufitem 6 pozycji. | PRZYJMUJĘ, POPRAWIONE — nowa sekcja 3j, scenariusz stolicy (6 linii) przez `buildOrderSectionHtml` naprawdę wywołane, obie etykiety obecne po cięciu; kontrola negatywna (7 linii → obcięcie z „…”). | **ODDAL** — zweryfikowane niezależnie: uruchomiłem bramkę (142 OK/0 FAIL), potwierdziłem `orderPanel.ts:167` woła `linesHtml(s.prawLines,6,pfx)` bez zmian w pliku (diff pusty od bazy), sekcja 3j istnieje i faktycznie ćwiczy tę ścieżkę. Własna mutacja (id `garnizon_budynek`→`garnizon`) czerwieni 23 asercje — bramka realnie wykrywa kolizję nazewniczą. |
| 4 | Kryterium 6 spełnione częściowo — 10 zależnych bramek pominięte w raporcie, w tym 2 live-render bez wyniku. | PRZYJMUJĘ, POPRAWIONE — uruchomione wszystkie 10: 8 zielonych, 2 (`rebel-city-notification-live-test`, `rebel-protection-live-test`) timeout niezależnie potwierdzony, Playwright/chromium, INFRA pre-istniejące. | **ODDAL** — niezależnie uruchomiłem 8/10 wskazanych plików: identyczne zielone liczby. Oba live-render również timeoutują u mnie (100 s); pliki niezmienione tym tematem (zero diff od bazy) — pre-istniejący problem środowiska, nie regresja tego tematu. Raportowa luka, którą zarzut wskazał, jest usunięta. |

**Agregat:** brak `NAPRAW`, dwa `DO DECYZJI CZŁOWIEKA` → **DECISION_REQUIRED**.

### Własna weryfikacja (min. 5 mutacji + parytet + kolizja nazewnicza)

1. `prawo_max_epoka.normal[1]` 65→650 → czerwieni 3a+3d (4 FAIL), przywrócone z kopii, `git diff --quiet` czyste.
2. `prawo_garnizon_budynek_epoka.normal[0]` 25→99 → czerwieni 3e+3b (3 FAIL), przywrócone.
3. Id linii budynku `garnizon_budynek`→`garnizon` (kolizja nazewnicza) → 23 FAIL (3e/3i), przywrócone.
4. `prawo_pct_cap.normal` 170→50 → czerwieni 3h (2 FAIL), przywrócone.
5. Własny, niezależny harness parytetu panel↔silnik (esbuild+jsdom, scenariusz spoza próbek Operatora: era 1, pop 9, 5 jednostek + budynek Garnizon + Dom Starszyzny) — `prawPct` panel==silnik (170==170, cap D7 poprawnie zaangażowany), linie identyczne id+kolejność, obie linie garnizonu obecne naraz.

Wszystkie mutacje przywrócone z kopii (nie `git checkout`), `git status --short` czyste na koniec.

### Rekomendacja

Kryteria 1, 3, 4, 5, 6 (poza dwoma pre-istniejącymi live-render) są spełnione i zweryfikowane
niezależnie. Temat NIE wraca do Operatora — do właściciela idą wyłącznie zarzuty #1 i #2
(main.ts/hasGarnizonBudynek jest pilniejszy: bez niego kalibracja tematu jest nieobecna
w realnej rozgrywce). Reszta gotowa do integracji po jego odpowiedzi.
