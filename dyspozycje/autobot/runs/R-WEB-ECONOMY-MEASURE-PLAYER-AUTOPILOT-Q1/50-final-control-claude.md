STATUS: PASS-WITH-NOTES
DOMAIN: GAME (hak testowy + narzedzie pomiarowe, bez zmian zasad)
TEMAT: R-WEB-ECONOMY-MEASURE-PLAYER-AUTOPILOT-Q1
GOAL: tryb pomiarowy "gracz (wl 0) sterowany przez AI" pod flaga domyslnie OFF, zeby mierzyc ekonomie gracza w pozno grze.
ZMIANY/COMMIT: kandydat 91da14b988367381f22689aaf2ef640f6fcd36dd; baza 472d1e01e3bb227c151a343e9c8eb1766ae04120 jest przodkiem (merge-base --is-ancestor: OK). diff --stat: 12 plikow, +855/-7: gra/src/main.ts (29), gra/tools/ai-economy-measure-run.cjs (+7), econ-measure-analyze.cjs (24), nowy player-ai-autopilot-test.cjs (+148), runs/<ID>/** (raporty + dowody). Wszystko w allowliscie; brak gra-robocza/kanon/WERSJE/manifest/rust-port.

OCENA ZARZUTOW (bez etykiet rol):
1. Mutant wpiecia przezywal -> NAPRAWIONE. Test ma asercje 4-5 (kolejnosc ownerLoop przez hak odczytowy). Wlasna mutacja zrodla (`return [0, ...]` -> `return aiOwnerList;`, build poza repo): 4/5, asercja 5 CZERWONA. Mutacja settera (--mutant 1): 3/5, exit 1. Oryginal: 5/5, exit 0.
2. Surowy jsonl: JEST (dowody/r2-smoke-player-ai{0,1}-seed4242-30t.jsonl, 29 wierszy; 0 trafien NaN/pageerror w ON).
3. Wiersz gracza w glownej tabeli: JEST ("0 (gracz)") + sekcja "Gracz (autopilot)" co 10 tur (t10: 1 miasto, t20: 2, t30: 4 miasta, budynki 0/1/1).
4. Zmiana ownerPracaPool/setOwnerPracaPool w 3 miejscach: przeczytane; dla nie-czlowieka ownerPracaPool = aiPracaPoolByOwner ?? 0, setter klamruje do 0 = rownowazne dawnemu kodowi. Flaga false: galaz hak nie wykonuje sie (test 4: owners bez 0). Akceptowane jako nota (poza litera dispatchu, ale konieczne i rownowazne).

TESTY (wlasne, surowe wyjscie, Chrome /usr/bin/google-chrome, bundle w /tmp):
- tsc --noEmit: czysto (brak bledow)
- logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- ai-economy-measure-hook-test: 23/23
- player-ai-autopilot-test: 5/5 (exit 0); mutant settera 3/5 (exit 1); mutant wpiecia 4/5
NIE_ZMIERZONO przeze mnie: wlasny bieg dymny 30 tur (opieram sie na dowodach kandydata + kontrolach testu), parytet stanu OFF z baza, bieg 150 tur.

BLOKADY: brak.
RUNDY: FC 1/5 dla tego kandydata.
UWAGI-DLA-ORKIESTRATORA: (a) analizator pre-istniejaco powiela stan ostatniej tury w wierszach kontrolnych bez danych (t50..150 przy biegu 30-turowym) - nie wnosic wnioskow z tych wierszy; (b) dlugi bieg 150 tur (setsid nohup, --player-ai 1) do uruchomienia przez orkiestratora; (c) autopilot w ownerLoop daje graczowi te same decyzje co AI; D7 (brak auto-wojny gracza) nie byl przeze mnie osobno testowany biegiem, tylko z odczytu kodu i 0 wojen w dowodach kandydata.
NASTEPNY KROK: integracja orkiestratora (merge 91da14b98 do main, bramki), potem bieg 150 tur.
DEPLOY/PUSH: NIE WYKONANO
