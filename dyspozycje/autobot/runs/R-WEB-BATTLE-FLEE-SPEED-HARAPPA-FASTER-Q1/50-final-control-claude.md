STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FLEE-SPEED-HARAPPA-FASTER-Q1
GOAL: Niezalezny werdykt dla kandydata 8b98d101a (baza 04722f538): czy ucieczka z pola bitwy ma spojnie 50% ruchu (gracz/AI, Harappa) i czy zarzuty Evaluatora zostaly rozstrzygniete.
ZMIANY/COMMIT: kandydat 8b98d101ae62b1c7bcee4ec6d3fba8de1a294233; merge-base --is-ancestor 04722f538 -> TAK. git diff --stat: 4 pliki, +131/-2: 2x raport (10-operator, 30-obrona), gra/tools/battle-flee-move-half-browser-entry.ts, gra/tools/battle-flee-speed-parity-test.cjs. Kod gry (gra/src, gra/data) BEZ ZMIAN. Allowlista: entry .ts jest plikiem testowym *flee* poza literalna lista (.cjs); odchylenie jawnie zgloszone przez Obrone i uzasadnione (hook przed zamrozona fala) -- akceptuje.
TESTY (surowe wyjscie, wlasne uruchomienie; npm ci --ignore-scripts; Chromium /usr/bin/google-chrome):
- tsc --noEmit: exit 0
- logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- battle-flee-speed-parity-test.cjs: 54 PASS, 0 FAIL
- mutacja: w galezi normalPlan (battleScene.ts ~6235) usuniecie capa (ru.moveLeft = ru.moveLeft): 52 PASS, 1 FAIL (przypadek midwave). Plik przywrocony (git checkout, status czysty).
- istniejacy battle-flee-move-half-test.cjs: 31 PASS, 0 FAIL (~68 s; Obrona nie mogla go ukonczyc, tu ukonczyl sie). Liczba asercji zmienna miedzy przebiegami (31 vs 34 u Operatora; 52/53/54 w ttescie parytetu), zalezna od liczby uciekinierow; 0 FAIL w kazdym. Przyczyny zmiennosci nie badano.
OCENA ZARZUTOW:
1. Luka capa normalPlan: ODDANE, zamkniete. Nowy przypadek inject=midwave czerwony na mutacji (dowod wyzej).
2. Brak mnoznikow/rozroznienia wlasciciela: odrzucenie Obrony przyjmuje w czesci. Limit liczony z jednostki (_fleeMovePointsFor), a civ-matrix Harappy ma walka_ruch_bitwa_proc=0 (wg Obrony, l.1609; nie weryfikowalem linii ponownie -- NIE ZMIERZONO osobno). To dowod z danych, nie pomiar w biegu z cywilizacja gracza (harness cywilizacje: []).
3. Tryb reczny i odwrot po bitwie (post-battle-map tryTwoHexRetreat): NIE ZMIERZONO. Zarzut slusznie uznany za ograniczenie; wniosek "brak regresu" dotyczy WYLACZNIE autobitwy/skip w scenie 3D.
WNIOSEK: Regula 50% (floor, min 1) dla ucieczki w autobitwie jest spojna dla gracza-like i AI, takze Straznik bram Harappy (baza 3 -> limit 1/tura, zmierzone max 1). Zgloszenie wlasciciela (tempo rydwanu, ~5-6 heksow) NIE zostalo odtworzone ani obalone w trybie recznym, na mapie po bitwie ani w tempie wizualnym (tween). To brak dowodu regresu w zmierzonej sciezce, nie dowod, ze problemu u wlasciciela nie ma.
BLOKADY: brak blokad kodu. Do domkniecia tematu potrzebne: zapis/scenariusz z obserwacja wlasciciela albo osobny temat pomiaru trybu recznego + odwrotu po bitwie + czasu wizualnego (poza zakresem).
UWAGI-DLA-ORKIESTRATORA: (a) nie oznaczac tematu jako "naprawiono" -- brak zmiany gry; dostarczono test parytetu i raport. (b) rozwazyc osobny temat R-WEB-* na tryb reczny / post-battle-map / tween. (c) zmiennosc liczby asercji -- niska waga. (d) nazewnictwo: units.json "Garnizon Harappy" vs civs.json "Strażnik bram Harappy"; testy uzywaja drugiego.
RUNDY: 2/5 (FC po rundzie 2)
NASTEPNY KROK: integracja testu (kandydat 8b98d101a) do main przez orkiestratora; decyzja o dalszym pomiarze.
DEPLOY/PUSH: NIE WYKONANO
