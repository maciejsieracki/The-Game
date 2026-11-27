STATUS: PASS-WITH-NOTES
DOMAIN: GAME (integralność zapisu, diagnoza; zero zmian gra/src i gra/data)
TEMAT: R-WEB-SAVE-DIGEST-DIFF-Q1 (SAVEDIGEST), Final Control, runda 2
GOAL: ustalić, co różni się w digeście po wczytaniu zapisu i czy to błąd integralności.
ZMIANY/COMMIT: kandydat 5404b4d4a7b1e43a012d0783547cbf7d5265996d (baza 5ea1cc362bb20b3a017dc1c887d0d33003f677c9).
  merge-base --is-ancestor baza -> kandydat: TAK. git diff --stat: 24 plików, +1548, same nowe pliki:
  gra/tools/savedigest-run.cjs, gra/tools/savedigest-diff.cjs, dyspozycje/analizy/ZAPIS-DIGEST-ROZNICA-2026-11-27.md,
  dyspozycje/autobot/runs/R-WEB-SAVE-DIGEST-DIFF-Q1/** (10, 30, dane/ 80 KB). Allowlista zachowana;
  zmian w gra/src, gra/data: 0 (git diff --name-only | grep '^gra/(src|data)' = pusto).
TESTY (własne, na kandydacie, po npm ci --ignore-scripts w gra/):
  - npx tsc --noEmit: 0 błędów (tsc 5.9.3), exit 0
  - logic-test: 213/213; tech-tree-test: 20/0; research-test: 33/33; unit-replace-test: 21/21;
    combat-test: 6/6; unit-power-test: 6 pass, 0 fail (wszystkie exit 0)
  - node --check savedigest-run.cjs i savedigest-diff.cjs: OK
  - ai-test 297/0 i testy live (Chromium) NIE URUCHAMIANO: brak zmian w gra/src (bramki kodu gry są poza zakresem diffu).
  - Weryfikacja danych: z dane/{aionly,maxbunt}-{A,B}.json odczytano len digestów. aionly A t4/5/6 = 43495/45344/46475,
    B = 46235/48154/49561; maxbunt A = 43530/45465/46811, B = 46300/48277/49913; restore t3 = 44515 / 44389 vs snap 41785 / 41659
    (+2730 w obu). Zgodne z dokumentem. Poziom maksymalny: max z CAPREBEL2 (Trudny, kultura trudny, Wysoki x4) - zgodnie z zasadą testowania.
BLOKADY: brak blokad dla tego tematu. Przyczyna B != A nieznana (ujawniona jawnie, nie ukryta).
OCENA ZARZUTÓW EVALUATORA (bez etykiet ról):
  1. Brak konfiguracji (iii) i A/B aionly: ODDALONE jako nieaktualne - w kandydacie zmierzone (maxbunt A/B z --bunt 1, aionly A/B), 4/4. Uwaga: bunt w turze 4, nie 1 jak CAPREBEL2; opisane w Ograniczeniach.
  2. Wniosek o "realnym błędzie" pewniejszy niż dowód: PRZYJĘTE i poprawione w dokumencie ("reprodukowalna rozbieżność przebiegu, przyczyna NIEZNANA"). Sformułowanie jest uczciwe.
  3. 42 vs 43 miasta: ODDALONE (nieaktualne) - dokument wyjaśnia 42 miasta bez pól + city0 z polami = 43; zgodne z max-rt diff (count [43,43]).
  4. Rozmiar wartości bez klucza / top 10: PRZYJĘTE jako ograniczenie; runda 2 liczy już nazwę klucza, top-N opisane. Bez wpływu na wnioski.
  Żaden zarzut nie wymaga NAPRAW.
RUNDY: FC po rundzie 2/5
UWAGI-DLA-ORKIESTRATORA:
  - Dowód B != A jest mocny co do faktu (4/4 konfiguracji, jednostek 64 vs 65 w t6, zbieżnie z wartościami sprzed zapisu po odfiltrowaniu 3 pól),
    ale bez przyczyny i na jednym ziarnie/punkcie zapisu. Kandydat na osobny temat naprawczy (minimalne odtworzenie: seed 4242, zapis po t3, wczytanie, t4;
    stolice AI city16/city25, miasta city17/city26; szukać pola poza zapisem lub zależnego od kolejności). Priorytet 1 wg zasady 10 (integralność zapisu = gra).
  - Różnica surowa 2730 znaków (3 pola domyślne x 42 miasta) to wyłącznie reprezentacja; liczba 6930 z CAPREBEL2 nadal niewyjaśniona.
  - Brak decyzji o grze (DECISION_REQUIRED: nie dotyczy).
NASTĘPNY KROK: integracja orkiestratora (tools + dokumenty, bez deployu, brak zmian gra/src); osobny temat B != A.
DEPLOY/PUSH: NIE WYKONANO
