# R-WEB-DIPLO-RELATION-TIER-TRUST-LABEL-UNIFY-Q1 — DODATEK orkiestratora (runda 1)

## Stan (zweryfikuj w kodzie)
- gra/src/game/diplomacy.ts: relationTier (ok. l.1552): wojna → 0; sojusz → 4; score = zaufanie+respekt: <30 → 1 „Wrogi”; <60 → 2 „Neutralny”; <130 → 3 „Przyjazny”; inaczej 4. TIER_NAMES = ['Wojna','Wrogi','Neutralny','Przyjazny','Sojusz'] (l.1537). UI: diplomacyPanel.ts (tierLabel), diploListHud.ts ok. l.353 i 533 („Relacja: …”).
- Nowa zasada (decyzja właściciela, wdrożona w nastawienieLabelFromScore): Wrogi tylko przy zaufaniu < 10, Nieufny 10–29.

## Wymagane
1. relationTier: tier 1 „Wrogi” tylko gdy zaufanie < próg wrogości (ta sama stała co NASTAWIENIE_PROG_WROGI_ZAUFANIE z diplomacy-display.ts, bez duplikowania liczby; jeśli import cykliczny, przenieś stałą do wspólnego miejsca bez zmiany wartości). Dla zaufania 10–29 i score < 60: tier 2 „Neutralny” (brak osobnego tieru „Nieufny” — ZAŁOŻENIE operatora do zapisania w raporcie; nie dodawaj nowego tieru, nie zmieniaj TIER_NAMES ani liczby tierów, bo Rust i testy zależą od 5 stopni).
2. Pozostałe progi tieru (60, progSojuszRelacja 130) i pierwszeństwo statusu (wojna → 0, sojusz → 4) bez zmian.
3. Komentarz funkcji i nagłówek (ok. l.1100–1108 i 1531–1545) zaktualizuj do stanu faktycznego (bez „limitu wojennego 29”); popraw komentarze ok. l.871 i 892 (tylko komentarze).
4. Zbadaj wszystkie miejsca używające tieru (diplomacy.ts, diplomacyPanel.ts, diploListHud.ts, diplomacy-display.ts, ai/main jeśli czytają relationTier) — wylistuj plik:linia i potwierdź, że nic poza etykietą nie zależy od progu 30 tieru (np. logika AI); jeśli coś zależy, NIE zmieniaj, tylko opisz (BLOCK/ostrzeżenie do orkiestratora).

## Kryteria końca (binarne)
- tsc --noEmit exit 0; logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6; diplomacy-test 148/0; diplomacy-display-test, diplo-labels-trust-thresholds-test, diplo-civpedia-values-test, diplo-json-descriptions-sync-test (jeśli obecny po scaleniu) zielone; testy tieru zaktualizowane tylko w asercjach progu.
- Nowy test gra/tools/diplo-relation-tier-trust-test.cjs: zaufanie 9 + respekt 100 → tier 1; zaufanie 10 + respekt 0 → tier 2; zaufanie 25 + respekt 100 → tier 2/3 wg score (<60 → 2, ≥60 → 3); wojna → 0 niezależnie; sojusz → 4; mutacja progu 10 → 30 czerwieni test.
- Dokumentacja: jeśli hasła encyklopedii (relacja.md) opisują „Relacja: Wrogi” przy score <30, popraw i zregeneruj wikiBundle.json skryptem node gra/tools/bundle-wiki-for-game.cjs; diplo-civpedia-values-test zielony.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno. Dysk bywa < 8 GB: sprzątaj po sobie. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A.
