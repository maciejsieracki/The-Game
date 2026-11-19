STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza + pomiar; zmian logiki gry brak)
TEMAT: R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1
GOAL: pomiar PRZED wyścigu o teren (forty/posterunki AI) + projekt z wariantami i pytaniami ABC; r3 = scalenie haka i runnera z main, analizator, bieg dymny.
ZMIANY/COMMIT: baza main 53fcc1c45 + merge 09250b0d5 (bez konfliktów). Kod: f8658fbda (hak odczytowy `metrics()`: forty, posterunki, hexyTerytorium, hexyZMiast, hexyZFortowPosterunkow, hexySporne; runner territory-race-measure-run.cjs; opcja --reject-offers w ai-economy-measure-run.cjs, domyślnie 0; test kształtu haka). Dalej: analizator, dowody r3, sekcja 6a projektu.
TESTY: tsc 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; hook 23/23. Bieg dymny seed 4242, 40 tur, --player-ai 1, jeden Chromium, NaN: 0. W t40: 13 cywilizacji AI, 5 z fortem lub posterunkiem; 6741 heksów właścicieli ≠0 (6487 z miast, 254 z fortów/posterunków). Liczby "właściciele ≠0" obejmują też placeholdery i prawdopodobnie miasta-państwa (zarzut Evaluatora 2, przyjęty).
BLOKADY: brak dla zakresu r3. NIE ZMIERZONO: tury 50–150 i ziarna 7 oraz 1234; udział wolnej ziemi; "zajęte pierwszy raz". Surowy seed4242.jsonl z biegu r3 ma 2,5 MB (limit 1 MB), więc w dowodach jest wersja -slim.jsonl (150 KB).
RUNDY: 3/5
NASTĘPNY KROK: obrona zarzutów Evaluatora (30-obrona-claude.md), potem Final Control; bieg 3 ziaren × 150 tur wg UWAG.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Bieg długi (z gra/, bundle poza repo: node ./node_modules/vite/bin/vite.js build --outDir /tmp/terr-dist --emptyOutDir). Jeden Chromium naraz, ziarna po kolei: for S in 4242 7 1234; do CHROME_PATH=/usr/bin/google-chrome node tools/territory-race-measure-run.cjs --dist /tmp/terr-dist --profile /tmp/terr-prof-$S --out <abs>/dowody --seed $S --turns 150 --every 10; node tools/territory-race-measure-analyze.cjs --in <abs>/dowody --seed $S --step 10 --slim <abs>/dowody/seed$S-slim.jsonl --md <abs>/dowody/seed$S-analiza.md; done. Uruchomić jako jeden setsid nohup sh -c '...', odpytywać log co <=60 s. Czas: NIE ZMIERZONO (skalowanie z 40 tur ~105 s daje ok. 8–10 min na 150 tur).
2. Próbny setsid nohup & zakończył się bez wyniku w tym środowisku; przyczyna NIE zbadana.
3. Spadek liczby właścicieli ≠0 z 41 (t20) do 15 (t30) wygląda na scalenie danych (patrz sekcja 6a projektu); przyczyna w kodzie spawnu NIE zbadana.
4. Bieg r3 nie jest bitowo powtarzalny względem r2 (t40: 6741 vs 6814 heksów); nie mieszać serii.
5. Zmiana ai-economy-measure-run.cjs jest poza allowlistą DODATKU 3; wymaga zgody (potrzebna runnerowi territory-race).
