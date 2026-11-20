STATUS: PASS-WITH-NOTES
DOMAIN: GAME (POMIAR; zmiana kodu tylko: hak pomiarowy civTest i opcja runnera)
TEMAT: R-WEB-VERIFY-LIVE-A-UNIT-COSTS-AI-MEASURE-Q1
GOAL: zmierzyć, czy „Koszty jednostek” Normalny ×2 powoduje rozpad armii AI lub trwały deficyt/głód, względem Niski ×1.
ZMIANY-COMMIT: gra/src/main.ts (hak `__aiEconomyMeasure.setUnitCostPace` / `unitCostPaceState`, pole `zywnoscArmiiTura`); gra/tools/ai-economy-measure-run.cjs (`--pace`, wpis `unitCostPace`); gra/tools/ai-economy-measure-README.md; dyspozycje/analizy/POMIAR-KOSZTY-JEDNOSTEK-AI-2026-11-20.md; dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-A-UNIT-COSTS-AI-MEASURE-Q1/ (raport, jsonl.gz x2). Commit: patrz pole sha.
TESTY: tsc --noEmit EXIT 0; logic 213/213; tech-tree 20/20; research 33/33; unit-replace 21/21; combat 6/6; ai-economy-measure-hook-test 23/23 (bundle z vite poza repo). Przebiegi: seed 4242, 90 tur, rebalans ON, pace niski i normalny: po 89 wierszy (tury 2–90), oba do t90.
BLOKADY: seed 7 NIE wykonany (czas). Liczba dezercji/rozwiązanych jednostek NIE ZMIERZONO (runner nie liczy). Mechanizm spadku NIE ZMIERZONO przyczynowo. Chromium padał przy wznowieniu (SIGSEGV); wznowienia z `MEASURE_CHROME_ARGS="--disable-gpu --mute-audio"`, bez wpływu zmierzonego. Około 25 właścicieli AI znika z wierszy w obu przebiegach (inne tury: niski t30–35, normalny t20–25), więc porównanie zbiorów jest niewspółmierne.
RUNDY: 1/5
WYNIK (t90, suma AI, seed 4242): jednostki Niski 465 (14 właścicieli), Normalny 317 (15); spadek 31,8% (36% na przetrwałego właściciela). Deficyt złota i głód AI = 0 w każdej turze i w obu tempach. Utrzymanie Pieniądz/t ~×2 (zgodne z tempem). Żelazo: Niski 303 jednostki u 7, Normalny 126 u 5 (AI rekrutuje w Żelazie). Złoto mediana t90: 3 995 vs 2 417.
WNIOSEK: próg „spadek >30%” przekroczony marginalnie na jednym ziarnie, przy różnych zbiorach właścicieli; próg „deficyt >50%” NIE. Rozpadu przez utrzymanie nie stwierdzono (brak deficytu i głodu). Sugerowana hipoteza (NIE ZMIERZONO): koszt rekrutacji ×2 (`applyUnitCostPace`, production.ts). Wartości mnożnika nie wskazuję (brak przebiegu z pośrednim tempem).
NASTĘPNY KROK: powtórzyć pomiar na seed 7 (oba tempa) i liczyć tylko właścicieli przetrwałych w obu przebiegach; dodać do runnera licznik rekrutacji i utraty jednostek.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Untracked, poza allowlistą i NIE zacommitowany: `tools/ai-economy-measure-README.md` w korzeniu worktree (omyłkowe `printf >>`, błędna ścieżka). Do usunięcia przez orkiestratora (rm zakazany w tym temacie).
- Dane surowe poza repo: scratchpad sesji `run-niski/` i `run-normalny/` (seed4242.jsonl, state.json, summary.json); analiza `analysis-pace.json`.
- Pierwszy odcinek NISKIEGO (t1–t10) bez flag Chromium; reszta z `--disable-gpu --mute-audio`.
