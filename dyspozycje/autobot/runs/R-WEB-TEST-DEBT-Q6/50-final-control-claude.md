# R-WEB-TEST-DEBT-Q6 — Final Control (Claude)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko testy)
TEMAT: R-WEB-TEST-DEBT-Q6
GOAL: spłata długu testowego po FALACH 840–846 bez zmian logiki, danych i asercji.
ZMIANY/COMMIT: kandydat e909dc63f; baza e29f8c8b3 jest przodkiem (merge-base --is-ancestor = tak). diff --stat: 3 pliki, +45/-3: ai-economy-measure-hook-test.cjs, card-resource-purpose-test.cjs, 10-operator-claude.md. Wszystko w allowliście; brak zmian w gra/src, danych, CSV.
TESTY (własne uruchomienie na e909dc63f, npm ci --ignore-scripts):
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20/20; research 33/33; unit-replace 21/21; combat 6/6 (exit 0)
- ai-economy-measure-hook-test bez argumentów: 23/23 zielone, exit 0 (wcześniej brak DIST)
- card-resource-purpose-test: 103 pass / 0 fail
- building-cards-top5-test: 1207 pass / 1 fail (spichlerz, dwa zdania w top5[0]) — identycznie jak przed zmianą, poza zakresem allowlisty, czeka na decyzję
- gen-building-cards-top5.cjs --check: exit 0
Zarzuty Evaluatora: brak. Obrona: brak.
OCENA: asercje nieosłabione (regexy dopasowane do realnego kodu: etykieta Podatek, chip pieniadz w utrzymaniu; treść sprawdzana ta sama). Hook-test buduje bundle poza repo tylko bez --dist.
UWAGI (ODDAL, nie FAIL):
1. Spichlerz: wymaga decyzji właściciela (A: przepisać zdanie w generatorze/korektach, rekomendowane; B: poluzować regułę). Czerwony test building-cards-top5 pozostaje.
2. CSV wiersz 13 "do 50" (Garncarnia): nieaktualne względem econ-params, ale poprawka łamie --check generatora (kotwica w card-text-corrections.cjs); osobny temat korekt generatora.
3. Hook-test: katalog tymczasowy ai-economy-dist-<pid>-<ts> w os.tmpdir() nie jest sprzątany; build ze stdio:ignore ukrywa przyczynę błędu buildu (wyjątek jednak przerywa test). Mutacyjnej czerwieni samego ensureDist nie wykazano (zmiana infrastrukturalna); mutacje card-resource-purpose podane przez Operatora (nie powtarzane przeze mnie).
BLOKADY: brak technicznych; decyzje właściciela jak wyżej.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora; ABC do właściciela w sprawie Spichlerza; osobny temat dla CSV/generatora.
DEPLOY/PUSH: NIE WYKONANO
