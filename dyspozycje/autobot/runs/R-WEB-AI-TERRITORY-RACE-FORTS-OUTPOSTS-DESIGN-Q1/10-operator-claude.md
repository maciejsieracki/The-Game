STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza + pomiar; zmian logiki gry brak)
TEMAT: R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1
GOAL: pomiar PRZED wyscigu o teren (forty/posterunki AI) + projekt mechanizmu z wariantami i pytaniami ABC; r3 = scalenie haka/runnera z main, analizator, bieg dymny, komenda dlugiego biegu.
ZMIANY/COMMIT: baza main 53fcc1c45 + merge `...-wip/obrona` 09250b0d5 (czysty, bez konfliktow; main.ts auto-merge, zachowane zmiany FAL 846-856). Commit kodu f8658fbda: hak odczytowy (main.ts: forty, posterunki, hexyTerytorium, hexyZMiast, hexyZFortowPosterunkow, hexySporne, terytorium.{heksySporneOgolem,heksyMapy}), runner territory-race-measure-run.cjs (domyslnie --player-ai 1 --reject-offers 1), nowa opcja --reject-offers (domyslnie 0) w ai-economy-measure-run.cjs, test ksztaltu haka. Kolejny commit: analizator territory-race-measure-analyze.cjs, dowody r3-smoke-*, sekcja 6a w dyspozycje/analizy/AI-TERRITORY-RACE-DESIGN.md (pytania ABC P1-P5 bez zmian).
TESTY (surowe wyjscie): tsc --noEmit exit 0; logic-test 213/213; tech-tree 20 pass/0 fail; research 33/33; unit-replace 21/21; combat 6/6; ai-economy-measure-hook-test 23/23 zielone (w tym nowe pola i kontrola negatywna bez civTest). Bieg dymny seed 4242, 40 tur, --player-ai 1, jeden Chromium (/usr/bin/google-chrome), 105 s, exit 0, NaN: 0 (jsonl i csv). t40: 15 AI z miastem, 150 miast, 6741 heksow AI (6487 z miast, 254 z fortow/posterunkow), 5 forty + 2 posterunki, 5 AI z fortem (pierwszy t32-40). Dowody: dyspozycje/autobot/runs/R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1/dowody/r3-smoke-seed4242-*.
BLOKADY: brak dla zakresu r3. NIE ZMIERZONO: tury 50-150 i ziarna 7/1234 (zadanie orkiestratora), udzial wolnej ziemi, zajete pierwszy raz. Surowy seed4242.jsonl z biegu r3 ma 2,5 MB (> limit 1 MB), wiec w dowodach tylko wersja odchudzona (-slim.jsonl 150 KB).
RUNDY: 3/5
NASTEPNY KROK: orkiestrator uruchamia bieg dlugi, wkleja tabele do sekcji 6a, potem Evaluator/FC.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Komenda dlugiego biegu (z gra/, bundle zbudowany poza repo: node ./node_modules/vite/bin/vite.js build --outDir /tmp/terr-dist --emptyOutDir; jeden Chromium na raz, ziarna po kolei, jedno ziarno ~2 min/40 tur => ok. 8-10 min/150 tur wg skalowania, NIE ZMIERZONO):
   for S in 4242 7 1234; do CHROME_PATH=/usr/bin/google-chrome setsid nohup node tools/territory-race-measure-run.cjs --dist /tmp/terr-dist --profile /tmp/terr-prof-$S --out <abs>/dowody --seed $S --turns 150 --every 10 > /tmp/terr-$S.log 2>&1; node tools/territory-race-measure-analyze.cjs --in <abs>/dowody --seed $S --step 10 --slim <abs>/dowody/seed$S-slim.jsonl --md <abs>/dowody/seed$S-analiza.md; done
   (petla wywolana jako jeden setsid nohup sh -c '...'; poll logu <=60 s). Przy segfaulcie wznowienia ze slotu t40 (r2) dziel bieg --stop-at tylko jesli konieczne.
2. Moj probny setsid nohup & w tle zakonczyl sie bez wyniku (log pusty); to samo polecenie w pierwszym planie zadzialalo. Przyczyna NIE zbadana; sprawdz sposob odpalenia w tle.
3. W t30 liczba wlascicieli z miastem spada 41 -> 15 (w serii r2 i r3); moze zwiazane z tematem pustych miast/garnizonow lub z miastami-panstwami; NIE zbadano tutaj.
4. Bieg r3 nie jest bitowo powtarzalny wzgledem r2 (t40: 6741 vs 6814 heksow); nie mieszac serii.
