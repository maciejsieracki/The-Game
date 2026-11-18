STATUS: DECISION_REQUIRED
DOMAIN: GAME (audyt, bez zmian logiki)
TEMAT: R-WEB-DIPLO-ERA-WAR-VS-NATURAL-WAR-CONCURRENCY-AUDIT-Q1
GOAL: Czy wojna naturalna AI wobec cywilizacji w wojnie epoki jest zgodna z ustaleniem „jedna wojna epoki i naturalna”?
ZMIANY/COMMIT: raport + odczytowy probe `gra/tools/era-war-vs-natural-war-concurrency-measure.cjs`. Brak zmian w `gra/src`.
TESTY (probe bramek, surowe wyniki):
- Cel AI z 1 wojną, napastnik 0: Kamień t60 `stone_limit_target_r2`; Brąz t60 `ok`; Żelazo t60 `ok`; t39 `delay_r1`.
- Napastnik AI z 1 wojną: Kamień `stone_limit_attacker_r2`; Brąz `ok`; Żelazo `ok`.
- Licznik epoki (cel w wojnie epoki Kamienia): `civ-cap-target`.
- Symulacja 3 ziarna x 150 tur: NIE ZMIERZONO (brak harnessu headless w tej rundzie). Epoka i typ wojny w zgłoszeniu: NIE ZMIERZONO.

USTALENIA:
1. `dyspozycje/autobot/runs/R-WEB-WAR-RULES-MULTIWAR-Q1/00-dispatch.md` linia 6 (R2): „w epoce kamienia KAŻDA cywilizacja może prowadzić NAJWYŻEJ JEDNĄ wojnę naraz… od epoki brązu limitu NIE MA”.
2. Ta sama linia (R3): „w KAŻDEJ epoce… NAJWYŻEJ JEDNA wojna epoki” w skali świata. Zastąpione w kodzie licznikiem per cywilizacja i epoka (`gra/data/war-rules-params.json`: `maxEraForcedWarsPerEra: null`, `maxEraForcedWarsPerCivPerEra: 1`). Brak wpisu w rejestrze dla tej zmiany (grep `COUNTER-Q1`, `PerCivPerEra` w REJESTR i PYTANIA: 0 trafień).
3. Brak ustalenia „jedna wojna epoki + jedna naturalna” od Brązu. Frazy `jedn[aey] wojn`, `naraz`, `naturaln`, `wojn[aey] naturaln` w REJESTR i PYTANIA-OTWARTE: trafienia tylko dla Kamienia lub gracza (np. REJESTR linia 4430, R-WOJNA-WYMUSZONA-REGULY-Q1: „jeden przeciwnik naraz” dla wojen wymuszonych).

KOD:
- `gra/src/game/war-rules-multiwar.ts:121-127` `concurrentWarLimitForEra`: Kamień = 1, od Brązu = null.
- `war-rules-multiwar.ts:152-165` `evaluateInterCivWarGate`: R1 (tura < 40, z wyjątkiem Brązu/Żelaza), limit napastnika i celu AI; gracz jako cel bez limitu.
- `gra/src/main.ts:46023-46035`: bramka dla każdego `wypowiedz_wojne` (zwykłego i epokowego).
- `gra/src/main.ts:12469` i `:25487`: ta sama bramka dla wojen z progu i klastra.
- `gra/src/game/ai.ts:7483-7486` (Priorytet 4): warunek tylko `!rel.stanWojny` (para). Limit liczby wojen istnieje wyłącznie w `main.ts`.
- Gracz jako napastnik nie ma limitu (`war-rules-multiwar.ts` komentarz do `targetIsPlayer`).

WERDYKT:
- Scenariusz zgłoszenia (Chińczycy w wojnie epoki z graczem, Rzymianie wypowiadają naturalną wojnę) jest DOPUSZCZONY przez kod od Brązu i zgodny z zapisanym R2. W Kamieniu jest blokowany.
- Połączony limit „jedna wojna epoki i naturalna” od Brązu NIE istnieje w rejestrze ani w kodzie. Zapisane są: limit 1 wojny w Kamieniu oraz limit 1 wojny epoki na cywilizację (zmiana R3 bez wpisu w rejestrze).
- Błąd kodu względem ustaleń: NIE stwierdzono. Brak ustalenia: TAK (połączony limit od Brązu).

PYTANIE ABC (do właściciela):
A) Zostaje jak jest: od Brązu AI może mieć wiele wojen, w tym wojnę epoki i naturalną (zgodne z R2). Rekomendacja. Plus: zero zmian. Minus: scenariusz zgłoszenia jest możliwy.
B) Od Brązu AI z wojną epoki nie wypowiada naturalnej wojny ani nie jest jej celem. Plus: spójne z „jedna wojna naraz”. Minus: nowa logika w `main.ts:46023-46035`, wymaga tematu i pomiaru 3x150 tur.
C) Przywrócić globalny R3 (jedna wojna epoki na epokę w świecie). Minus: cofa R-WEB-ERA-WAR-COUNTER-Q1.

NASTĘPNY KROK: decyzja właściciela. Bez decyzji nie zmieniać kodu.
UWAGI-DLA-ORKIESTRATORA: zmiana R3 na licznik per cywilizacja nie ma wpisu w REJESTR; warto dopisać.
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 1/5
