STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-GRACE15-EFFECTS-Q1 (GRACE15FX), runda 2/5, Operator HAIKU 5.5
GOAL: zmierzyc na maksimum (Trudny, barbarzyncy Trudny, kultura trudna, dyplomacja trudna, Wysoki x4) skutki okna lask 15 tur: AI t30/t60 (2 ziarna), przezycie aktywnego gracza t1-30 (min. 2 ziarna Z DREWNEM, z bramka tury), readback poziomu barbarzyncow, teksty; zero zmian gra/src.
BAZA: f8a1396680ed300e0dc344d31af5765d0deb5964 (origin/main, detach w worktree). Zmian w gra/src i gra/data nie ma.

ZMIANY/COMMIT: nowe narzedzie gra/tools/grace15fx-active2-live.cjs (kopia grace15fx-active-live.cjs: bez haka setTaxSplit, proba dzwigni UI suwaka Wyzywienia, zapis turns.jsonl na biezaco). Dane: dyspozycje/autobot/runs/R-WEB-GRACE15-EFFECTS-Q1/dane/aktywny-r2/ (turns-s11.jsonl, econ-s11.jsonl, econ-p2-s11-r1.txt, readback-s11.txt, s7-z-hakiem-podatku/). Dokument: dyspozycje/analizy/OKNO-LASKI-15-TUR-SKUTKI-2026-11-27.md (sekcja STAN WIAZACY na gorze). Commit: patrz sekcja DEPLOY/PUSH.

TESTY (surowe wyniki, po npm ci --ignore-scripts w gra/):
- npx tsc --noEmit: exit 0
- node tools/logic-test.cjs: LOGIC OK (213/213)
- node tools/ai-test.cjs: ai-test: 297 passed, 0 failed
- node tools/early-grace-15-test.cjs: early-grace-15-test: 33 passed, 0 failed

WYNIKI MIERZONE W TEJ RUNDZIE:
1. AKTYWNY GRACZ (klik zakupu obroncy w panelu miasta; podatek na domyslnym podziale gry):
   - seed 11 (Drewno jest), bieg 2, 15 tur zakonczonych, zatrzymanie w t16:
     t1-6 skarbiec 0,2,4,6,8,10 (+2/tura); t7 zakup obroncy klikiem UI, skarbiec 12 -> 2 po zakupie; t8-14 +2/tura; t15 skarbiec 16 (prognoza +3), Spichlerz 0 (prognoza +1); t16 skarbiec 19 (prognoza po turze -10, czyli -29), Spichlerz 1 (prognoza -30, czyli -31); blokada „Zakoncz ture” z powodu Spichlerza (zywnosc), gate-komunikat: obnizka racji +12, rozwiazanie jednostek (zloto) +32, rozwiazanie jednostek (zywnosc) +32.
     Jednostki wojskowe gracza: 1 (Wojownik) do t7, 2 od t8. Barbarzyncy w poblizu (foreignNear) w t1-16: brak.
   - seed 7, bieg z PIERWSZEGO wywolania tej rundy (narzedzie grace15fx-active-live, PRZED usunieciem haka): zakup t5; t16 skarbiec 68, prognoza skarbu 46 (nie blokuje), Spichlerz 2, prognoza -16 -> blokada zywnosciowa („po zakonczeniu tury zabraknie 16”). TEN BIEG USTAWIL PODATEK HAKIEM setTaxSplit(100,0,0) w t1. To jest odstepstwo od zasad (hak zmieniajacy stan); dane oznaczone folderem s7-z-hakiem-podatku i NIE sluza do wnioskow o zwyklym graczu.
   - Ustalenie: na obu ziarnach pierwsza blokada wypada w t16 i jest zywnosciowa. Na seed 11 skarbiec po turze tez wychodzi ujemny (-10). Wzrost kosztow w t16 (skarb -29, zywnosc -31 po turze) to powrot utrzymania jednostek po oknie 15 tur. Wartosci +32 z komunikatu bramki sugeruja ok. 32 zlota i 32 zywnosci na jednostke (WNIOSEK Z KOMUNIKATU, NIE ZMIERZONO w grze). Przy dwoch jednostkach rozwiazanie jednej dawaloby dodatni bilans obu zasobow (WNIOSEK ARYTMETYCZNY, NIE ZMIERZONO).
   - Dzwignia „obnizka racji” (suwak Wyzywienia): PROBA NIEUDANA. Otwarty przez openCityPanelForTest panel (klasy civ-v-*) nie zawiera zadnego input[type=range] (dump: rangeDump=[]). Suwak istnieje w widoku .civ-cs .wyzwienie-w4-sliders, ktorego harness nie otwiera. NIE ZMIERZONO: t16-30 aktywnego gracza.
   - Dzwignia „rozwiazanie jednostek”: NIE ZAIMPLEMENTOWANA (brak id jednostek w odczycie UI; przycisk rozwiazania to data-act="disband" w pasku akcji jednostki). NIE ZMIERZONO.
   - Tabela t17-t30 aktywnego gracza: NIE ZMIERZONO (bramka t16 nie zostala przejsc w harnessie).

2. AI t30/t60: NIE PONOWIONO w tej rundzie. Dane r1 zostaja (puste miasta AI: s4242 t30 48,3%, t60 78,1%; s7 43,4% / 69,4%; PRZED 67,8% / 74,5% i 50% / 82,9%). Zastrzezenie: n=2, poziom barbarzyncow dominuje (kontrola PRZED z barbarzyncami „normalny”: 17% / 31,6%).

3. READBACK POZIOMU BARBARZYNCOW: NIE ZWERYFIKOWANO. __settingsLive.getSettings() nie zwraca barbariansLevel (zwraca: diplomacyWarLevel trudna, kulturaReligiaLevel trudny, kulturaReligiaLevelAI trudny, wzrostSurowcowZEpoka false, kosztJednostekPace wysoki, difficulty hard). Wartosc przekazana do startNewGame: advanced.barbariansLevel = trudny (zob. readback-s11.txt).

4. BARBARZYNCY PO t16: NIE ZMIERZONO. Bieg seed 11 nie wszedl w faze po t16; w t1-16 foreignNear puste.

5. TEKSTY: lista rozbieznosci z r1 (wiki §90.1-90.3, poradnik 00 l.18, 03 l.155, 08 l.28) zostaje. Tooltipy utrzymania NIE PRZEGLADNIETE w tej rundzie.

BLOKADY:
- Harness nie przechodzi bramki t16 dla aktywnego gracza. Brakuje: (a) dostepu do suwaka Wyzywienia w widoku .civ-cs (ustalic, jak gracz go otwiera, bez haka stanu); (b) dzwigni rozwiazania jednostki przez UI (zaznaczenie + data-act="disband", id jednostek tylko do odczytu).
- Limit wywolania narzedzia 590 s: jeden bieg 20 tur trwa ok. 9-10 min (ustawienie swiata ok. 170 s, ok. 24 s na ture). 30 tur w jednym wywolaniu sie nie miesci. Potrzebny wznawialny zapis stanu lub bieg w krotszych segmentach (zakazane: nohup, &, run_in_background).
- Odstepstwo zglaszane jawnie: bieg seed 7 z pierwszego wywolania uzyl haka setTaxSplit (zmiana stanu). Dane oznaczone.

RUNDY: 2/5 (runda 2 Operator). FC r1 FAIL dotyczyl braku tabeli aktywnego gracza t1-30; ta runda jej nie domknela.
NASTEPNY KROK: Operator runda 3 do TEGO SAMEGO ID: (1) ustalic widok panelu miasta z suwakiem Wyzywienia bez haka stanu; (2) dodac dzwignie rozwiazania jednostki przez UI; (3) tabela t1-30 aktywnego gracza na seed 11 i 7 (Drewno), segmenty wznawiane z turns.jsonl; (4) readback barbarzyncow zostaje NIE ZWERYFIKOWANO, chyba ze pojawi sie odczyt UI.
UWAGI-DLA-ORKIESTRATORA: wynik r2 podwaza zalozenie „bramka skarbca” z dispatchu. Blokada t16 jest zywnosciowa, a przyczyna to powrot utrzymania jednostek po oknie. Pytanie ABC „co dalej po t16” zalezy od danych t17-30, ktorych jeszcze nie ma.
DEPLOY/PUSH: NIE WYKONANO
