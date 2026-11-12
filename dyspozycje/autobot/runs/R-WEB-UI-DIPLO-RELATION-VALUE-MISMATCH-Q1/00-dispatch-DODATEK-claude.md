# R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1 — DODATEK (orkiestrator, 2026-11-12, runda 1/5)
BAZA: origin/main (44af89169, po FALI 662). MODEL: Operator HAIKU, Obrona HAIKU, Evaluator/FC SONNET. Dispatch: 00-dispatch.md (gałąź claude/sprawdzenie-funkcjonalnosci-ek4ra0).
ALLOWLISTA: gra/src/ui/diplomacyAcceptanceBalance.ts, okno dyplomacji (tylko wyświetlanie), gra/tools/*-test.cjs, dyspozycje/autobot/runs/R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1/**. Zakaz: gra/src/game/** (reguły handlu), JSON balansu, WERSJE.md, rust-port.
ŚRODOWISKO: worktree; w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; Chromium przez Vite HTTP (build poza repo). Nie integrujesz, nie pushujesz.

## DODATEK (runda 2/5, 2026-11-12) — FC FAIL r1 → NAPRAW (4 zarzuty), zero decyzji produktowych w tej rundzie
BAZA: kandydat 2632a616ed6809f82ff4e2f128d9964484d68f63 (web-wip/R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1) + merge origin/main (44af89169). MODEL: Operator HAIKU, Obrona HAIKU.
NAPRAW 1: test Chromium na realnym oknie dyplomacji pokazujący OBIE wartości („Relacja 11,6” i „Relacja 90 / 200”) dla tej samej pary/oferty (wzorzec: gra/tools/diplomacy-relation-deal-text-consistent-live-test.cjs i ai-trade-wiring-e2e-live-test.cjs); zapisz surowe wartości i zrzut (obejrzany).
NAPRAW 2: tabela UI → źródło wartości kompletna: które okno pokazuje „11,6” (okno propozycji PW, main.ts ~21213/21277) a które „90/200” (koszyk/audiencja, main.ts ~25762/25639).
NAPRAW 3: opisz TRZY wielkości (zapisana, nominalna power-based dla bramek handlu, efektywna power-based wyświetlana jako 90/200); popraw błędne przypisanie 90/200 do getNegotiationContext.
NAPRAW 4: ustal status wojny pary i czy clampRelationForWar (diplomacy-proposals.ts:712-715, diplomacy.ts:1105,1121-1133) przycina 11,6; podaj liczby.
ALLOWLISTA (rozstrzygnięcie orkiestratora): gra/src/ui/diplomacyAcceptanceBalance.ts, gra/src/ui/diplomacyAudience.ts (TYLKO wyświetlanie/etykiety), gra/tools/*-test.cjs, dyspozycje/autobot/runs/R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1/**. ZAKAZ zmian reguł i progów (wariant A „ujednolicić” jest decyzją właściciela po pomiarze). Zmiany kodu: wyłącznie etykiety/opisy wariantu B, jeśli pomiar wykaże dwie różne wielkości — inaczej brak zmian kodu i raport z liczbami.
KRYTERIA: surowe wyniki pomiaru w evidence/, tsc + 5 bramek, mutacja jeśli jest zmiana kodu; raport z SHA.
