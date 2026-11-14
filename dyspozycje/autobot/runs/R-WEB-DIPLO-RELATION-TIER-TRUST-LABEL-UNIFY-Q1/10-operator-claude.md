# R-WEB-DIPLO-RELATION-TIER-TRUST-LABEL-UNIFY-Q1 — raport Operatora (runda 1/5)

STATUS: PASS (Operator; czeka na Evaluator i Final Control)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RELATION-TIER-TRUST-LABEL-UNIFY-Q1
GOAL: druga etykieta „Relacja: …" (relationTier, 5 stopni) zgadza się z regułą wrogości Nastawienia — tier 1 „Wrogi" tylko przy Zaufaniu < 10; Zaufanie 10–29 nie daje „Wrogi" w tierze UI.
BAZA: 801888c60 (origin/main jest dalej: ed95085a2; merge czysty oczekiwany — nie integrowano)

## ZMIANY / COMMIT

Allowlista (wykonana):
- `gra/src/game/diplomacy.ts` — funkcja `relationTier` (nowy warunek: `rel.zaufanie < RELATION_TIER_PROG_WROGI_ZAUFANIE` → 1; próg score 30 usunięty; progi 60 i `progSojuszRelacja` oraz pierwszeństwo wojna→0 / sojusz→4 bez zmian), nowa stała `RELATION_TIER_PROG_WROGI_ZAUFANIE = 10`, komentarz funkcji i nagłówka sekcji (stare „próg 30" usunięte), komentarze ok. l.871 („one-shot -2") i l.892 („szablon §1.5: −15 Relacja") — tylko komentarze.
- `gra/tools/diplomacy-test.cjs` — asercje progu tieru (rel(10,10) → 1 zastąpione przez rel(9,10) → 1 oraz rel(10,0) → 2; komentarz granicy 30).
- `gra/tools/diplo-alliance-gate-test.cjs` — jedna asercja „niski score → Wrogi" rozdzielona: zaufanie 9 → 1, zaufanie 10 → 2.
- NOWY `gra/tools/diplo-relation-tier-trust-test.cjs` — asercje tieru (zaufanie 9/0 → 1; 10/0 → 2; 29/0 → 2; 25/100 → 3; 25/10 → 2; granica score 60; wojna 0; sojusz 4; zgodność tier 1 ⇔ zaufanie < próg Nastawienia dla zaufania 0,5,9,10,11), test zgodności stałych oraz mutacja progu 10 → 30 (wymagana czerwień).
- NIE zmieniano: `diplomacy-display.ts` (stała Nastawienia zostaje literałem — testy civpedia i labels czytają ją regexem z tego pliku), `diplomacyPanel.ts`, `diploListHud.ts`, `ai.ts`, `main.ts`, progi umów, `WERSJE.md`, `wikiBundle.json`, `gra-robocza/`, `rust-port/`.
- Dyspozycje: `dyspozycje/autobot/runs/R-WEB-DIPLO-RELATION-TIER-TRUST-LABEL-UNIFY-Q1/` (00-dispatch.md, 00-dispatch-DODATEK-claude.md, ten raport).

Commit: podany w polu `sha` odpowiedzi StructuredOutput (commit zawiera wyłącznie powyższe pliki; add po ścieżkach, bez `-A`).

## TESTY (surowe wyjście z tej sesji)

- `npx tsc --noEmit` → exit 0
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
- `node tools/diplomacy-test.cjs` → `[diplomacy-test] 149 passed, 0 failed (total 149)` (była 148 asercji; +1 po rozbiciu asercji progu)
- `node tools/diplo-alliance-gate-test.cjs` → `19 PASS, 0 FAIL`
- `node tools/diplomacy-display-test.cjs` → `45 OK, 0 FAIL`
- `node tools/diplo-labels-trust-thresholds-test.cjs` → `OK: diplo-labels-trust-thresholds-test` (mutacja progu wykryta)
- `node tools/diplo-civpedia-values-test.cjs` → `PASS: 129 sprawdzeń, wierszy parametrów w haśle: 151`
- `node tools/diplo-json-descriptions-sync-test.cjs` → `WYNIK: 36/36 OK, FAIL: 0`
- `node tools/diplo-relation-tier-trust-test.cjs` (NOWY) → `OK — asercje relationTier … zielone na żywym kodzie.` oraz `OK — mutacja progu 10 → 30 daje czerwone asercje (7).` exit 0
- `git diff --check` → czysto

Nie uruchamiano `npm run build` ani `npm run dev` (zakaz). Nie uruchamiano testów przeglądarkowych (zmiana czysto logiczna + etykieta tekstowa; LIVE-VERIFY nie jest wymagany przez dispatch) — NIE_ZMIERZONO na żywo.

## ANALIZA ZALEŻNOŚCI (wymóg pkt 4 DODATKU)

Użycia tieru (`relationTier` / `relationTierDisplay` / `TIER_NAMES`) w `gra/src`:
- `src/game/diplomacy.ts:1552–1571` — definicja `relationTier` i `relationTierDisplay` (zmieniona).
- `src/main.ts:8380, 8469, 25775` — wyłącznie `relationTierDisplay(rel, hasAllianceDealBetween(...))` (etykiety/emblematy UI). Brak surowego `relationTier(` w main.ts (potwierdza test diplo-alliance-gate C).
- `src/ui/diploListHud.ts:533` — `relationTierLabel: tierLabel(rel.tier)`; `src/ui/diplomacyPanel.ts:45` — komentarz; tylko mapowanie etykiety, bez progu.
- `src/game/diplomacy-display.ts:723–758` — przyjmuje gotową etykietę `relationTierLabel` i składa tekst „Relacja: …"; brak progu.
- `src/game/ai.ts` — NIE używa `relationTier` ani `TIER_NAMES` (grep: brak trafień). Decyzje AI czytają surowe wartości Relacji/Zaufania, nie tier. Nic w logice AI nie zależy od progu 30 tieru → niczego nie zmieniano w AI.

## ZAŁOŻENIA (luki rozstrzygnięte w raporcie)

1. Brak nowego tieru „Nieufny" (zgodnie z DODATKIEM): Zaufanie 10–29 przy score < 60 → tier 2 „Neutralny". Oznacza to, że panel może pokazywać „Relacja: Neutralny", a Nastawienie „Nieufny" dla tej samej pary — to świadoma rozbieżność nazw, nie błąd progu. Do decyzji właściciela, czy ma to zostać.
2. Stała duplikowana zamiast importu: `diplomacy.ts` importowałby `diplomacy-display.ts`, a display już importuje `diplomacy.ts` (cykl). Literał `NASTAWIENIE_PROG_WROGI_ZAUFANIE = 10` musi pozostać w `diplomacy-display.ts` (czytają go testy civpedia i labels regexem), więc nowa stała `RELATION_TIER_PROG_WROGI_ZAUFANIE = 10` w `diplomacy.ts` jest kopią. Zgodność wymusza asercja w nowym teście (`RELATION_TIER_PROG_WROGI_ZAUFANIE === NASTAWIENIE_PROG_WROGI_ZAUFANIE`) — mutacja jednej z wartości czerwieni test.
3. Próg score 30 w tierze usunięty całkowicie (nie zastąpiony). Tier 1 wyłącznie po Zaufaniu < 10, więc Respekt nie łagodzi Wrogości (np. zaufanie 9 + respekt 100 → Wrogi, zgodnie z DODATKIEM).
4. Hasło encyklopedii `docs/encyklopedia/pojecia/relacja.md` opisuje etykietę NASTAWIENIA (już zgodną: Zaufanie < 10 Wrogi), nie etykietę tieru „Relacja: …". Nie opisuje „Relacja: Wrogi" przy score < 30, więc według kryterium DODATKU nie zmieniano dokumentacji ani `wikiBundle.json` (brak regeneracji).
5. Komentarz `tarcia_graniczne` i `zerwanie_handlu` w `DiplomaticEvent` był nieaktualny; poprawiony wg faktycznego kodu `applyDiplomaticEvent` (case `tarcia_graniczne` = zdarzenie jednorazowe + osobna ciągła kara per tura; case `zerwanie_handlu` = dZ = −10).

## BLOKADY

Brak blokad technicznych. Dispatch-plik `00-dispatch.md` istnieje na gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`, a nie na `origin/main` (co wskazywał nagłówek zadania) — użyto wersji z tej gałęzi; treść taka sama jak w zadaniu.

## UWAGI-DLA-ORKIESTRATORA

- Dispatch i dodatek nie są na `origin/main` (tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`); przy integracji warto to mieć na uwadze.
- Stała `RELATION_TIER_PROG_WROGI_ZAUFANIE` jest kopią (pkt 2 ZAŁOŻEŃ) — jeśli właściciel woli pojedyncze źródło, trzeba zmienić strukturę importów w `diplomacy-display.ts`, a to zmieni regexy testów civpedia/labels (poza allowlistą tego tematu).
- Rozbieżność nazw Relacja „Neutralny" vs Nastawienie „Nieufny" dla Zaufania 10–29 (pkt 1 ZAŁOŻEŃ) — do potwierdzenia przez właściciela; nie jest to błąd testów.

## RUNDY

1/5 (Operator, Haiku). Kolejny krok: Evaluator → Final Control.

## NASTĘPNY KROK

Evaluator: przegląd diffu (`git diff 801888c60..<SHA>`), ponowne uruchomienie 3 testów tieru/etykiet i nowego testu, decyzja w sprawie ZAŁOŻEŃ 1–2. Orkiestrator integruje po FC PASS.

## DEPLOY/PUSH: NIE WYKONANO
