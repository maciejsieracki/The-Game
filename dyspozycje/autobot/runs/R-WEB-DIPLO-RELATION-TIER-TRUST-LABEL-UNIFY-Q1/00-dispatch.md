# R-WEB-DIPLO-RELATION-TIER-TRUST-LABEL-UNIFY-Q1 — dispatch (2026-11-13)

GOAL: druga etykieta „Relacja: …” (5-stopniowa skala relationTier: Wojna/Wrogi/Neutralny/Przyjazny/Sojusz) zgadza się z nową zasadą wrogości (Wrogi tylko przy zaufaniu poniżej 10), tak by „Relacja: Wrogi” nie rozjeżdżała się z „Nastawieniem” (zaufanie <10 Wrogi, 10–29 Nieufny, od 30 wg relacji). Szczegóły: DODATEK.

BAZA: kandydat 801888c60 (FC PASS W51, potomek origin/main 52fc1d5cf; origin/main jest dalej: ed95085a2 po FALI 681 — merge czysty oczekiwany). Operator: HAIKU. Evaluator/FC: SONNET.
ALLOWLISTA: gra/src/game/diplomacy.ts (WYŁĄCZNIE funkcja relationTier i jej komentarz, relationTierDisplay jeśli konieczne, oraz nieaktualne komentarze ok. l.871 „(one-shot -2)” i l.892 „szablon §1.5: −15 Relacja” — tylko komentarze), gra/src/ui/diplomacyPanel.ts i gra/src/ui/diploListHud.ts (tylko jeśli etykieta tieru wymaga zmiany), gra/src/game/diplomacy-display.ts (tylko spójność z nastawienieLabelFromScore), istniejące testy w gra/tools/*.cjs tylko w asercjach o progu 30 tieru Wrogi, NOWY gra/tools/diplo-relation-tier-trust-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-RELATION-TIER-TRUST-LABEL-UNIFY-Q1/**.
ZAKAZ: ai.ts, main.ts, progi umów (30/110/130/90/70), nastawienieLabelFromScore (już zmienione), WERSJE.md, gra-robocza/, rust-port/, npm run build/dev, git add -A.
