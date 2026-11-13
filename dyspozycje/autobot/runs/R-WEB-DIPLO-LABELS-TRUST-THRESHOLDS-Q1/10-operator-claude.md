# R-WEB-DIPLO-LABELS-TRUST-THRESHOLDS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-LABELS-TRUST-THRESHOLDS-Q1
GOAL: etykiety nastawienia w dyplomacji zależą od Zaufania przy niskich wartościach: Zaufanie < 10 = „Wrogi”, 10–29 = „Nieufny”, od Zaufania 30 etykieta wg sumy Zaufanie+Respekt (< 45 Nieufny, < 60 Neutralny, < 120 Życzliwy, ≥ 120 Przyjazny). Progi paktu/sojuszu (30/110/130/90/70) bez zmian.
BAZA: 84032f962 (detached), worktree wf_e5ff29bd-025-1.
ZMIANY-COMMIT: patrz sekcja „Commit” na końcu raportu (SHA podany w polu sha odpowiedzi).

## Zmiany

1. `gra/src/game/diplomacy-display.ts`
   - nowe eksporty `NASTAWIENIE_PROG_WROGI_ZAUFANIE = 10` i `NASTAWIENIE_PROG_NIEUFNY_ZAUFANIE = 30` (osobne stałe, nie współdzielą progu 30 z paktem/sojuszem);
   - `nastawienieLabelFromScore`: w wojnie „Wrogi” (bez zmian); Zaufanie < 10 → „Wrogi”; Zaufanie < 30 → „Nieufny”; dalej suma Zaufanie+Respekt (clamp 0–200) z progami 45 / 60 / 120 bez zmian.
2. `gra/src/ui/diplomacyAudience.ts` — BEZ ZMIAN. Sygnatura wywołań nie zmieniona. Dopisek wojenny („w wojnie zaufanie spada do zera… etykieta ograniczona do „Wrogi””) i `nastawienieHintPl` pozostają prawdziwe: w wojnie etykieta nadal „Wrogi”, a limit 29 nie pojawia się w tekście UI (sprawdzone w `warCapNoteHtml`).
3. Testy (tylko asercje progów/etykiet):
   - `gra/tools/diplomacy-display-test.cjs` — asercje `nastawienieLabelFromScore(10,10)` i `(25,25)` zastąpione: (9,100) → Wrogi, (10,10) → Nieufny, (30,20) → Neutralny;
   - `gra/tools/diplo-civpedia-values-test.cjs` — klucz `etykieta-wrogi` wskazuje teraz stałą `NASTAWIENIE_PROG_WROGI_ZAUFANIE` (10), dodany klucz `etykieta-nieufny-zaufanie` (30); sekcja 3 sprawdza 10/30/45/60/120.
   - NOWY `gra/tools/diplo-labels-trust-thresholds-test.cjs` — 21 asercji: Zaufanie 0/9 (także przy Respekcie 100) → Wrogi; 10/25/29 → Nieufny niezależnie od Respektu; Zaufanie 30 z sumami 30/44/45/59/60/119/120/130; wojna → Wrogi (74/54, 100/100, 0/0). Samo-kontrola: mutacja progu 10 → 30 w bundlu (esbuild `plugins` w `build` asynchronicznym, bez zapisu w repo) daje 5 z 21 czerwonych asercji; test kończy exit 1, gdyby mutant nie był wykryty.
4. Dokumentacja (tylko miejsca opisujące etykiety):
   - `docs/encyklopedia/pojecia/relacja.md` — tabela etykiet przepisana na warunki (wojna / Zaufanie <10 / 10–29 / od 30 wg Relacji); blok „Zasady zatwierdzone, jeszcze niewdrożone” usunięty z tego hasła (etykiety wdrożone); w Parametrach wiersz 10 (`etykieta-wrogi`) i 30 (`etykieta-nieufny-zaufanie`), 45/60/120 bez zmian;
   - `docs/encyklopedia/pojecia/wypowiedzenie-wojny.md` — linia o etykietach przeniesiona z bloku „jeszcze niewdrożone” do nowej sekcji „Etykiety nastawienia przy wypowiadaniu wojny”; pozostałe punkty bloku bez zmian (nie są w zakresie tego tematu);
   - `docs/encyklopedia/pojecia/zaufanie.md` — przykład „Zaufanie 20, Relacja 50” miał etykietę „Neutralny”; po zmianie to „Nieufny” (zaktualizowane zdanie).
   - `docs/PORADNIK-GRACZA/12-dyplomacja.md` — brak opisu progów etykiet, bez zmian.
   - `gra/src/data/wikiBundle.json` — regenerowany wyłącznie `node gra/tools/bundle-wiki-for-game.cjs` (diff 1 linia JSON).

## Nie zmieniano (zgodnie z ZAKAZAMI)

`diplomacy.ts`, `ai.ts`, `main.ts`, JSON balansu, progi umów, `WERSJE.md`, `gra-robocza/`, `rust-port/`. Brak `npm run build/dev`. Nie użyto `git add -A`.

Uwaga do follow-upu (poza allowlistą, NIE ruszane): komentarz w `gra/src/game/diplomacy.ts` ok. linii 1106 nadal mówi „relationTier / nastawienieLabelFromScore: score < progMinimalnyRelacja = 30” — po tej zmianie to nieprawda dla etykiet (etykieta idzie po Zaufaniu). Także `WAR_RELATION_SCORE_CAP` (komentarz 1108) nadal opisuje limit 29 wojenny — obecnie `clampRelationForWar` zeruje tylko Zaufanie. Do poprawy w osobnym temacie (diplomacy.ts poza allowlistą).

## TESTY (liczby z surowego wyjścia)

- `npx tsc --noEmit` (w `gra/`): exit 0, brak wyjścia.
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0.
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`, exit 0.
- `node tools/diplomacy-test.cjs`: `148 passed, 0 failed (total 148)`, exit 0.
- `node tools/diplo-civpedia-values-test.cjs`: `PASS: 129 sprawdzeń, wierszy parametrów w haśle: 151`, exit 0.
- `node tools/admin-panstwo-panel-names-test.cjs`: `26 pass, 0 fail`, exit 0.
- `node tools/diplomacy-display-test.cjs`: `45 OK, 0 FAIL`, exit 0.
- `node tools/diplo-labels-trust-thresholds-test.cjs` (NOWY): realny moduł `checks 21, fail: 0`; mutant (próg 10→30) `fail 5 z 21` → `MUTANT WYKRYTY`, `OK`, exit 0.
- `node tools/diplomacy-respect-true-value-real-render-test.cjs` (Chromium dostępny w sandboxie): `18 OK, 0 FAIL`, exit 0. Uwaga: test nadpisał dwa zrzuty w `dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-DISPLAY-TRUE-VALUE-Q1/dowody/`; przywrócone `git checkout` przed commitem (zrzuty nie są częścią tematu).

Zrzut z Chromium dla tego tematu nie był wymagany (zmiana tekstowo-logiczna); render-test z poprzedniego tematu potwierdza zachowanie etykiety „Wrogi” w wojnie i brak „Wrogi” w pokoju przy 74/54.

## BLOKADY

Brak. (Luka rozstrzygnięta założeniem: w dispatchu „progi 10 i 30 ze stałych” — przyjęto eksportowane stałe w `diplomacy-display.ts`, zgodnie z istniejącą praktyką pliku, czyli `TRAKTAT_HANDLOWY_LABEL` i pokrewne stałe eksportowane z tego pliku.)

## RUNDY

1/5 (Operator, Haiku). Wynik: PASS-WITH-NOTES (uwagi o komentarzach w diplomacy.ts poza allowlistą).

## NASTĘPNY KROK

Evaluator: weryfikacja diffu (`git diff 84032f962..<SHA>`), mutanta i bramek z tabeli TESTY. Opcjonalnie: osobny temat na komentarze w `diplomacy.ts` (WAR_RELATION_SCORE_CAP / „nastawienieLabelFromScore = 30”).

## Commit

Commit zawiera zmiany kodu, dokumentacji, testów i ten raport (ścieżki dodane jawnie, bez `git add -A`). Autor: Haiku Operator, trailery wg reguł sesji.

DEPLOY/PUSH: NIE WYKONANO
