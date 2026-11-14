STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-AIAI-LABELS-CARD-Q1
GOAL: dowód na żywo (zrzut + odczyt DOM), że karta AI w wojnie AI↔AI pokazuje na liście „W stanie wojny z” OBA znaczniki (strona rozmówcy i partnera), a wojna gracz↔AI bez regresji.
ZMIANY/COMMIT: nowy gra/tools/live-verify-aiai-labels-run.cjs (kopia runnera gra/tools/live-verify-wave-689-697-b2-panel-run.cjs + odczyt `warWear` wszystkich `.da-rel-war-wear` w karcie AI: `text`, `title`, `rowText`, `warWearCount`); dowody w dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-AIAI-LABELS-CARD-Q1/evidence/ (3 JSON, 18 PNG). Zero zmian w gra/src, gra/data, WERSJE.md. Baza: origin/main 3cc49c07b (detach).
TESTY:
- Bundle: vite build poza repo (outDir w scratchpad), exit 0, 16,3 s. Wcześniej npm ci --ignore-scripts w gra/ (71 pakietów, exit 0). Brak npm run build/dev.
- AI↔AI, ziarno 271828 (SCEN=aiwar, PROBE_TURNS=5,10,16, LAST_TURN=16), exit 0, elapsedSec=260, pageErrors=[]:
  * T5: karta AI 1 (Celtowie), wiersz „Zulusi Celtowie: Desperacja 16% Zulusi: Zmęczenie wojną 20%” — PRAWDA, 2 elementy .da-rel-war-wear. Zrzut: evidence/b2-aiwar-seed271828-T5-aud1.png (obejrzany).
  * T10: „Zulusi Celtowie: Zmęczenie wojną 45% Zulusi: Zmęczenie wojną 45%” — PRAWDA, 2 znaczniki. Zrzut: evidence/b2-aiwar-seed271828-T10-aud1.png.
  * Status pary 1–4 wg rep.turns: wojna do tury 10, pokój od tury 11 (peaceUntilTurn 51). T16: 0 znaczników — oczekiwane (brak wojny), nie błąd.
- AI↔AI, ziarno 314159 (ta sama konfiguracja), exit 0, elapsedSec=194, pageErrors=[]:
  * T5: „Chińczycy: Zmęczenie wojną 20%” + „Hetyci: Zmęczenie wojną 20%” — PRAWDA, 2 znaczniki.
  * T10: „Chińczycy: Desperacja 23%” + „Hetyci: Zmęczenie wojną 45%” — PRAWDA, 2 znaczniki. Zrzut: evidence/b2-aiwar-seed314159-T10-aud1.png (obejrzany: prawa karta Chińczyków, wiersz „Hetyci” z dwoma znacznikami).
  * Pokój od tury 11 (status „pokoj”, peaceUntilTurn 51) → T16 bez znaczników — oczekiwane.
- Wojna gracz↔AI (SCEN=war, ziarno 271828, PROBE_TURNS=5,10,16, LAST_TURN=16, TAG=-player-regress), exit 0, elapsedSec=242, pageErrors=[]: sekcja „W stanie wojny z” karty AI 1 = „Ty” (jeden wiersz), warWearCount=0 w T5/T10/T16. Porównanie z bazą: dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-689-697-B2-PANEL-AIAI-CITYCHANGE-Q1/b2-war-seed271828-r3.json ma identyczny fragment „W stanie wojny z / Ty” → BEZ REGRESJI. Dispatch zakładał „dwa wiersze (Ty, nazwa AI)”; w karcie AI nie pojawia się wiersz z nazwą AI ani w bazie, ani teraz — przyjęto to jako stan bazowy, nie jako regresję.
- git diff --check: czysty. git diff --stat -- gra/src gra/data: pusty.
- Zrzuty obejrzane (Read): b2-aiwar-seed271828-T5-aud1.png i b2-aiwar-seed314159-T10-aud1.png — w obu w karcie AI widać sekcję „W stanie wojny z” z dwoma znacznikami.
- Odczyt DOM: evidence/b2-aiwar-seed271828.json, evidence/b2-aiwar-seed314159.json, evidence/b2-war-seed271828-player-regress.json (probes[].audience_<id>.warWear).
BLOKADY: brak krytycznych. Luki (NIE_ZMIERZONO): (a) runner robi zrzut całego ekranu z otwartą audiencją, nie wycinek karty; odczyt DOM jest podstawą dowodu; (b) po turze 10 wojna AI↔AI nie trwa w obu ziarnach — dowód dla tur ≥11 niedostępny; (c) T20/T22 poza zakresem tej rundy.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET) weryfikuje JSON i PNG względem liczb powyżej; potem Final Control. Integracja runnera i dowodów do main dopiero po FC PASS (orkiestrator).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- origin/main nie zawiera pliku dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-AIAI-LABELS-CARD-Q1/00-dispatch.md (git show: „does not exist”). Treść zadania odczytano z DODATKU na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (00-dispatch-DODATEK-claude.md).
- Runner z dispatchu istnieje jako gra/tools/live-verify-wave-689-697-b2-panel-run.cjs (nie „-probe”).
- node_modules w gra/ zainstalowane w worktree (gitignored) — do usunięcia przy sprzątaniu worktree. Bundle w scratchpad, poza repo.
- Commit: tylko runner i katalog runs/R-WEB-LIVE-VERIFY-AIAI-LABELS-CARD-Q1/ (git add po ścieżkach, bez -A).
