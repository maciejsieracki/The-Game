STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WORLD-WAR-PEACE-NEWS-Q1
GOAL: Gracz widzi w dzienniku Wydarzeń wiadomość o wojnie lub pokoju między dwiema cywilizacjami AI, gdy ma odkryte obie.
ZMIANY/COMMIT: gra/src/game/diplo-world-news.ts (nowy, czysta decyzja rodzaju i widoczności); gra/src/main.ts (import; hook w setDiploRelation; funkcja recordAiAiWarPeaceNews przed logPeaceVazne); gra/tools/diplo-world-news-test.cjs (nowy); ten raport. SHA: czubek brancha Operatora (podany w odpowiedzi).

WYBOR MECHANIZMU (punkt 1): istniejacy dziennik „Wydarzenia” (warEventLog, side panel) — ten sam, w ktorym juz sa wpisy wojny/pokoju z udzialem gracza (recordWarDeclarationEvent, logPeaceVazne). Nie zbudowano nowego okna.

PUNKT ZMIANY (punkt 2): setDiploRelation (main.ts) — wedlug komentarza w kodzie jedyne miejsce zmiany statusu pary. Sprawdzone grepem: pozostale zapisy diplomacyRelations.set to (a) wczytanie zapisu (celowo bez wpisu), (b) barbarzyncy (bez zmiany wojny), (c) applyUnauthorizedBorderPenalties (zmienia wartosci, nie status — NIE ZWERYFIKOWANO w pelni, czy nigdy nie zmienia statusu), (d) tickDiploAiAiPairsWithBrake (woła setDiploRelation tylko przy zmianie statusu).
Pokryte: kazde przejscie do 'wojna' (wypowiedzenie, wojna epoki, wojna po rozejmie, wojna wymuszona), kazde wyjscie z 'wojna' do 'pokoj'/'neutralni' (pokoj staly, pokoj wymuszony, rozejm, koniec rozejmu), wyjscie do 'sojusz'.
Niepokryte / do potwierdzenia: bunt/zdobycie miasta jako osobny rodzaj wpisu (nie wydzielono); powod („pokoj wymuszony”, „wojna epoki”) NIE dolaczany — setDiploRelation nie ma parametru powodu.
Rozejm: silnik mapuje StanWojny.Rozejm na 'pokoj' (diplomacy.ts:1521), wiec rozejm i pokoj to ten sam status; wpis brzmi „Pokój”, nie „Rozejm”.

WIDOCZNOSC (punkt 3): getDiplomaticContacts() (ten sam predykat co collectTurnEvents dla par bez gracza). Wpis tylko gdy OBIE strony pary sa odkryte. Interpretacja „obie odkryte” — DO POTWIERDZENIA przez wlasciciela.

PARY Z GRACZEM (punkt 4): recordAiAiWarPeaceNews pomija pary z isMe(a)||isMe(b); istniejace wpisy bez zmian.

SZUM (punkt 5): id = ai-diplo-news-<tura>-<para>-<rodzaj>; warEventLog.some(id) przed dopisaniem; trimWarEventLog. Wpis: ikona ⚔ (wojna) / ☮ (pokoj, sojusz), kind 'diplo', tytul „Wojna: A i B” / „Pokój: A i B” / „Sojusz: A i B”.

TEKST EN (punkt 5): NIE ZROBIONO. Wszystkie teksty warEventLog w main.ts sa hardcoded po polsku (logPeaceVazne, recordWarDeclarationEvent); nie znaleziono w tej sciezce mechanizmu i18n do wpisow dziennika. Do decyzji orkiestratora: osobny temat i18n dziennika albo akceptacja PL-only.

ZAPIS/WCZYTANIE (punkt 6): warEventLog nie jest zapisywany w save (wpisy wygasaja co ture przez expireInformationalEventsBeforeTurn). Wczytanie nie woła setDiploRelation, wiec nie generuje wpisow.

TESTY (punkt 7): gra/tools/diplo-world-news-test.cjs — 25/0. Czesc A (esbuild, modul czysty): rodzaje zmian i widocznosc. Czesc B (zrodlowa): hook w setDiploRelation, bramki isMe/barbarzynca/widocznosc, id dedup. Dynamicznej mutacji (cofniecie hooka i uruchomienie) NIE WYKONANO.

TESTY — WYNIKI (surowe liczby z wyjscia):
- npx tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: ALL GREEN
- combat-test: All sanity checks passed.
- unit-replace-test / unit-replace-full-cost-test: exit 0
- ai-test: 297 passed, 0 failed
- war-rules-multiwar-main-guard-test: 21 PASS / 0 FAIL
- hud-me-literal-zero-test: 150 PASS / 0 FAIL
- bramki-tmpdir-unikalnosc-test: PASS=18 FAIL=0
- diplo-world-news-test (nowy): PASS 25/0
- Testy peace/truce (nie-live): wszystkie zielone poza diplo-forced-peace-pending-test (FAIL=1: "r2-3: okno wraca na poczatku tury po turn++"). Sprawdzone na bazie e2b06492: ten sam FAIL (regex nie pasuje takze w bazie). Blad istniejacy, nie z tego tematu.
- hotseat e-source/B/D/E: NIE URUCHOMIONO (wymagaja przegladarki/live).
- testy live: nie uruchamiano.

BLOKADY: brak (poza pozycjami „do potwierdzenia” powyzej i brakiem EN).
RUNDY: 1/5
NASTEPNY KROK: FC (Final Control) — przeglad diffu gra/src/main.ts (hook, funkcja) i pliku diplo-world-news.ts; ocena interpretacji „obie odkryte”; decyzja o EN i o rozszerzeniu na bunt/zdobycie miasta.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Pre-existing FAIL w diplo-forced-peace-pending-test (r2-3) wystepuje na bazie e2b06492 — warto osobnego tematu naprawczego.
- Trim dziennika: warEventLog trzyma 8 wpisow; wpisy AI↔AI moga wypierac wpisy gracza w gestych turach (zachowanie istniejacego trimSidePanelEventLog, nie zmieniano).
- Pytanie do wlasciciela (ABC, DO POTWIERDZENIA): czy wpis ma sie pokazywac tylko przy odkryciu OBU stron (przyjete) i czy wpis „Pokój” dla rozejmu jest akceptowalny (silnik nie rozroznia rozejmu od pokoju w statusie).
