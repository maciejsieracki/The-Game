# R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1 — Final Control r4 (runda FC 4/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1
GOAL: „Skąd zapasy” część B — zrzuty z prawdziwej gry (sól, ceramika), dokumentacja + wikiBundle, pomiar wydajności ON/OFF, diagnoza endTurn t57, stan `<details>`.

KANDYDAT / INTEGRACJA: `579d363556ac8e84d10d811f96692b1fd0c2a2d7` (integration_sha).

## Przodkowie i zakres diffu
- `git merge-base --is-ancestor 9cbadc54a 579d36355` = tak. `9cbadc54a` to faktyczny `origin/main` (potwierdzone `git ls-remote origin main`).
- UWAGA do BAZY z dispatchu: podane `bd239cf4f` NIE jest przodkiem kandydata, bo to czubek gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (rejestr/dyspozycje, inna linia historii), a nie `main`. Kod `gra/` kandydata opiera się na `main` (9cbadc54a). Orkiestrator integruje do `main`.
- Diff 9cbadc54a..579d36355: 75 plików, w tym `gra/` — wyłącznie `src/main.ts` (+6, hak `openEmpirePanel` w istniejącym bloku `?civTest=1` `__ledgerTestDebug`), `src/ui/empireDetailPanel.ts`, `src/ui/resourceSourceLedgerHtml.ts` (stan `<details>`), `src/data/wikiBundle.json`, 6 narzędzi `gra/tools/*`; docs (encyklopedia, poradnik); `runs/<ID>/**`. Wszystko w allowliście (rozszerzonej DODATKIEM 3). Brak WERSJE.md, manifestu, rust-port.
- `git diff --check 9cbadc54a 579d36355`: puste (rc 0).

## Bramki (zmierzone w tym worktree po `npm ci`, surowe wyjście)
| Bramka | Wynik |
|---|---|
| `npx tsc --noEmit` | 0 błędów (puste wyjście) |
| logic-test | LOGIC OK (213/213) |
| tech-tree-test | 20 pass, 0 fail |
| research-test | 33/33, ALL GREEN |
| unit-replace-test | 21/21 |
| combat-test | 6/6 |
| resource-ledger-test | 1030 passed, 0 failed |
| resource-ledger-skad-ui-test | 18 passed, 0 failed |
| resource-ledger-skad-dom-test | 13 passed, 0 failed (D6/D7) |
| resource-ledger-hook-gate-test | 6 passed, 0 failed |
| wikiBundle: regeneracja `bundle-wiki-for-game.cjs` | `cmp` identyczny z zacommitowanym (22 rozdz., 184 hasła) |

Baza vs kandydat dla czerwonych: brak czerwonych bramek, porównanie niepotrzebne.

## Zarzuty Evaluatora — rozstrzygnięcie
1. **Linie +12/+30/−20 nieobecne w zrzutach — ODDAL.** Obejrzałem (Read) `panel-1920.png`, `sol-card-1280.png`, `ceramika-card-1920.png`: to realny panel imperium z gry (HUD, mapa, Rzym, Ostia), karta soli ma `+225 Warzelnia (Rzym)` i `+190 Umowa wymiany z Ostia · Rzymianie · miasto-państwo` (zielone), karta ceramiki ma dodatkowo `−30 Spichlerz (zużycie zapasów)` i `−3 Obywatele` (czerwone). Dispatch podawał te liczby jako przykłady linii; wszystkie trzy RODZAJE źródeł (budynek, umowa, obywatele) oraz kolory przyrost/ubytek są widoczne z realnego stanu księgi. Liczby zależą od scenariusza, nie są wymogiem. Nie jest to wada kandydata.
2. **Pomiar w konfiguracji `--gate-fix taxsplit` — ODDAL (uwaga).** Przeliczyłem `cmp.py` na 10 surowych jsonl (kolejność naprzemienna, sekwencyjnie, 99 wspólnych tur): Δ średniej % = +7,16 / −4,33 / −6,90 / −2,15 / +1,27 (mediana −2,15%); Δ mediany % = +32,76 / −0,33 / −1,72 / −2,48 / +12,13 (mediana −0,33%). Dodatkowo mikro-pomiar `resource-ledger-perf-micro.cjs` (≤0,01% tury wg raportu Operatora). Próg 10% nie jest przekroczony w medianie par; dużą Δ mediany par 1 i 5 przy ujemnych w pozostałych traktuję jako szum maszyny. Konfiguracja domyślna nie przechodzi tury 1 przez bramkę NNS (dług harnessu, patrz zarzut 5), więc obejście jest uzasadnione i jawnie opisane. Pochodzenie buildu `dist` poza repo: NIE_ZMIERZONE przeze mnie. Narzut rzędu kilku procent nie jest wykluczony ani potwierdzony — brak podstaw do optymalizacji `ownerResourceStockAll`.
3. **Sformułowania „księga nie jest sprawcą”/„wyścig harnessu” w 10-operator-claude.md — ODDAL (naprawione w kandydacie).** Wiersz 26 zawiera blok KOREKTA wycofujący oba sformułowania; obowiązuje wyłącznie wniosek skorygowany. Pozostałości kosmetyczne w tym samym raporcie (nie wiążące, bez wpływu na kod): UWAGI pkt 2 nadal mówi „Wyścig harnessu” jako obserwację techniczną flagi `endTurnInProgress` (nie jako przyczynę t57), a BLOKADY nadal wymienia „5 par nie wykonano” (nieaktualne, wykonano 5 par). Do wiadomości orkiestratora; dla #415/#417 obowiązuje KOREKTA.
4. **Test haka statyczny — ODDAL.** `resource-ledger-hook-gate-test.cjs` (6/0) sprawdza tekstowo, że hak siedzi w bloku z `/[?&]civTest=1/` (potwierdziłem w `main.ts` ok. l. 31481–31483). Dowód uruchomieniowy: `resource-ledger-shots-live.cjs` rzuca wyjątek, gdy `__ledgerTestDebug` istnieje bez `?civTest=1`, a `shots.json` zawiera `negativeControl: {ledgerTestDebug:'undefined', nnsMeasureDebug:'undefined'}`.
5. **Przyczyna timeoutu t57 nierozstrzygnięta — ODDAL (informacja).** Zgodnie z KOREKTĄ: bramka NNS w turze 1 przy domyślnych podatkach 30/60/10 = dług harnessu (blokuje #415/#417 niezależnie od księgi); t57 nie odtworzono w żadnej konfiguracji (ON/OFF, 2 ziarna, 99 tur bez timeoutu). Nie wolno pisać „nie księga” ani „wyścig harnessu”.

Żaden zarzut nie wymaga NAPRAW; zero decyzji produktowych (DO DECYZJI CZŁOWIEKA brak).

## Weryfikacja wizualna
Zrzuty z realnej gry (build vite + Chromium, `?civTest=1`) obejrzane narzędziem Read: układ panelu 1920 (karty dwukolumnowe, rozwinięte „Skąd zapasy” dla soli i ceramiki, kolory zielony/czerwony). Wcześniejsze ustalenie: karta ma tę samą szerokość 182 px w obu viewportach, stąd identyczne PNG samej karty (md5 sol 30e66b6e); pełne panele 1280/1920 różnią się (330 113 B vs 525 387 B) — opcja (a) DODATKU 4 spełniona. Własnego przebiegu Chromium nie powtarzałem (NIE_ZMIERZONE); opieram się na obejrzanych artefaktach i zielonych testach DOM.

## UWAGI-DLA-ORKIESTRATORA
- BAZA w dispatchu (`bd239cf4f`) to czubek gałęzi dokumentacyjnej, nie `main`; kandydat jest potomkiem prawdziwego `origin/main` 9cbadc54a.
- Osobne tematy do rozważenia (bez nowych sesji z mojej strony): zrzuty z konkretnymi liczbami z dispatchu (opcjonalnie); pomiar wydajności w konfiguracji domyślnej po naprawie harnessu (#417); naprawa bramki NNS w tury 1 w harnessie (#415/#417); kosmetyczne poprawki wspomnianych dwóch zdań w 10-operator-claude.md.
- Integracja: `integration_sha = 579d363556ac8e84d10d811f96692b1fd0c2a2d7`, wikiBundle po ewentualnym merge z nowszym main regenerować (`cd gra && node tools/bundle-wiki-for-game.cjs`).

ZMIANY/COMMIT: tylko ten plik (FC); kod kandydata bez zmian.
BLOKADY: brak
RUNDY: FC 4/5
NASTĘPNY KROK: integracja orkiestratora (merge do main, build, deploy ROBOCZA wg zasad), potem READY_FOR_DEPLOY
DEPLOY/PUSH: NIE WYKONANO
