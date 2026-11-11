STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PL-PLURAL-MIASTA-KOLEJKI-Q1
GOAL: formatMiastaCount i formatKolejkiCount (gra/src/ui/formatPl.ts) odmieniają wg reguł polskich (1 / 2–4 poza 12–14 / reszta), test tabelaryczny 0..130 z jawnymi przypadkami granicznymi, test czerwienieje po mutacji starej reguły.
ZMIANY/COMMIT: BAZA c36457aa5 (kandydat Operatora, baza 6ade0f0ec). Nowy commit obrony 64f91144c: gra/tools/format-pl-plural-miasta-kolejki-q1-test.cjs (+3/-1, uzupełnienie jawnych oczekiwań kolejek: 11, 14, 15, 21, 101, 102, 111). Kod gry (formatPl.ts) bez zmian: `git status` po pracy pokazuje czysto dla formatPl.ts. Raport: ten plik (commit raportu w osobnym kroku, SHA w polu sha odpowiedzi).
RUNDY: 2/5 (runda obrony; Evaluator z 1 zarzutami NOTE, bez FAIL)

## Odpowiedzi na zarzuty Evaluatora (2da3390f4, 20-evaluator-claude.md)

Zarzut 1 (NOTE: brak zmian w formatPl.ts, poprawka już na bazie): PRZYJMUJĘ jako fakt, bez zmiany kodu.
- Dowód: `git show 6ade0f0ec:gra/src/ui/formatPl.ts` — `pluralPl` (linie 16–22) ma `m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)`; `formatMiastaCount`/`formatKolejkiCount` używają `pluralPl`. Test na bazie 6ade0f0ec nie był wykonany przez Operatora przed tematem; zakres tematu to test regresyjny, nie zmiana kodu.
- Dowód mutacji (wykonany ponownie tej obrony, patrz TESTY): przywrócenie starej reguły `if (v >= 2 && v <= 4) return few;` → `Wynik: 661 pass / 157 fail`, przywrócenie → `818 pass / 0 fail`.

Zarzut 2 (NOTE: brak 00-dispatch.md w origin/main): PRZYJMUJĘ jako założenie (już opisane w 10-operator-claude.md).
- Dowód: `git show origin/main:dyspozycje/autobot/runs/R-WEB-PL-PLURAL-MIASTA-KOLEJKI-Q1/00-dispatch.md` → `fatal: path ... does not exist in 'origin/main'`. Źródłem zadania pozostaje DODATEK z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0.

Zarzut 3 (NOTE, poza allowlistą: lokalne kopie reguły bez wykluczenia 12–14, np. diplomacy-penalty-preview.ts:206): PRZYJMUJĘ jako osobny temat; NIE naprawiam tutaj (poza allowlistą). KOREKTA mojego wcześniejszego opisu:
- Operator napisał, że `diplomacy-penalty-preview.ts:206` to „realny błąd dla 12–14 tur”. To BŁĘDNE. Dowód: `turnsPl(n)` = `if (n===1) '1 tura'; if (n>=2 && n<=4) 'n tury'; else 'n tur'`. Wykonanie tej funkcji (node -e): 12→„12 tur”, 13→„13 tur”, 14→„14 tur” (POPRAWNE), ale 22→„22 tur”, 23→„23 tur”, 24→„24 tur”, 32→„32 tur”, 112→„112 tur” (BŁĘDNE: powinno być „tury”).
- Realny defekt: n%10 w {2,3,4} przy n>4 (22–24, 32–34, …, 112–114) → forma „tur” zamiast „tury”. Pozostałe lokalne kopie (wymienione w 10-operator-claude.md) wymagają osobnego przeglądu pod tym kątem (NIE_ZMIERZONO, nie sprawdzałem każdej).
- Rekomendacja: osobny temat R-WEB-PL-PLURAL-LOCAL-COPIES-Q1 (allowlista: lokalne kopie reguły → wspólny helper `pluralPl`), z testem na 0..130.

Zarzut 4 (NOTE: jawna lista granic dla kolejek krótsza niż dla miast): PRZYJMUJĘ, poprawka wykonana w 64f91144c.
- Przed poprawką sekcja [3] testu miała 11 jawnych kolejek (0,1,2,4,5,12,22,24,25,112,122); brakowało 11, 14, 15, 21, 101, 102, 111 z listy dispatchu.
- Po poprawce: EXPLICIT_K ma 18 wpisów (pełna lista dispatchu dla kolejek).

## Ustalenia (zmierzone w tej obronie)

- Worktree: wf_2b7280f1-fab-3, start c36457aa585acb9b738af03e9bc17ede5005c5fe (detached), potem commit 64f91144c.
- `gra/node_modules` zainstalowane `npm ci --ignore-scripts` (exit 0). Brak `npm run build`/`dev`.
- Dispatch: 00-dispatch.md nie istnieje w origin/main; DODATEK z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 odczytany (GOAL, KRYTERIA, ALLOWLISTA: formatPl.ts, test cjs, katalog runs).

## Testy (surowe liczby z wyjścia tej obrony)

- Nowy test PO poprawce (kandydat + uzupełnienie): `Wynik: 825 pass / 0 fail` (exit 0).
- Mutacja (sed/Edit: linia 19 formatPl.ts → `if (v >= 2 && v <= 4) return few;`): exit 1, `157` linii `FAIL`, `Wynik: 661 pass / 157 fail`. Przywrócenie linii 19 do oryginału (Edit) — weryfikacja: test ponownie `825 pass / 0 fail`.
- `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0 (brak wyjścia).
- Bramki referencyjne (uruchomione tej obrony, surowe linie):
  - format-pl-signed-minus-glif-test.cjs: `13 passed, 0 failed` (exit 0)
  - logic-test.cjs: `LOGIC OK (213/213)` (exit 0)
  - tech-tree-test.cjs: `tech-tree-test: 20 pass, 0 fail` (exit 0)
  - research-test.cjs: `PASSED: 33 / FAILED: 0 / TOTAL: 33` (exit 0)
  - unit-replace-test.cjs: `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)` (exit 0)
  - combat-test.cjs: `COMBAT TEST: 6/6 pass` (exit 0); `All sanity checks passed.`
- NIE_ZMIERZONO: przeglądarka/zrzut (temat nie jest wizualny); pełny zestaw testów poza wymienionymi.
- Git hygiene: `git diff --check` czysto przed commitem testu.

## Blokady

- Brak blokad technicznych.
- Otwarte (poza tematem, do decyzji orkiestratora): osobny temat dla lokalnych kopii reguły (zarzut 3, z korektą).

## Założenia

- Jawne przypadki dispatchu dla kolejek są rozumiane jako pełna lista graniczna z sekcji KRYTERIA (0,1,2,4,5,11,12,14,15,21,22,24,25,101,102,111,112,122).
- Commit testu (64f91144c) jest wyjątkiem od „commit tylko raportu” — konieczny, bo PRZYJĘCIE zarzutu 4 wymaga poprawki w pliku testu; oba commity przez jawną ścieżkę (bez -A).

## Następny krok

Evaluator (Sonnet) weryfikuje 64f91144c i tę obronę (ponowna mutacja opcjonalnie); potem Final Control. Orkiestrator decyduje o osobnym temacie dla lokalnych kopii reguły (zarzut 3).

DEPLOY/PUSH: NIE WYKONANO
