STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar/analiza)
TEMAT: R-WEB-UPKEEPMULT-FOOD-AUDIT-Q1
GOAL: Ustalić, czy zużycie żywności przez jednostki zgadza się z decyzjami właściciela (FALA 883 żywność x4/epokę, FALA 887 Koszty jednostek), i odpowiedzieć, czy bufor 999 w teście rozejmu t5 jest niewystarczający zgodnie ze wzorem. Ta runda: odpowiedź na 7 zarzutów Evaluatora (cb0da9483).
ZMIANY/COMMIT: kod gry bez zmian (zero zmian w gra/src, gra/data). Zmienione ścieżki: `gra/tools/upkeep-food-audit.cjs` (korekta nagłówka i komentarza), `dyspozycje/analizy/AUDYT-ZYWNOSC-JEDNOSTEK-2026-11-25.md` (przepisane §2b, §3, §4, §5), `dyspozycje/autobot/runs/R-WEB-UPKEEPMULT-FOOD-AUDIT-Q1/dane/upkeep-food-audit.jsonl.gz.sha256` (nowy), ten raport. Dane `.jsonl.gz` bez zmian. SHA: patrz pole sha w odpowiedzi.

ODPOWIEDZI NA ZARZUTY (1 zarzut = 1 wpis):
1. PRZYJMUJĘ. Dokument §2b podawał army-base 194–197 i "+2…+5"; to było złe. Z jsonl: army-niski −185, base-niski 0; jedyna para z tą samą stolicą (17,13) daje −185 wobec wzoru −192 (−7, −3,6%). Zgodnie z dowodem Evaluatora (army-wysoki −774 minus base −6 = −768 = 4·192). Liczba 196 (nachylenie) usunięta jako nieczysta (zob. 2).
2. PRZYJMUJĘ. Dowód: myCity w jsonl = 17,13 / 15,12 / 17,15 / 17,13 / 18,14 / 9,21, mimo seeda 4242. Szum bazy był założony, nie zmierzony: usunięty z doc. Przyczyny zmiany stolicy nie badano (NIE ZMIERZONO). Dokument §2b ma teraz tabelę ze stolicami i oznacza, które pary są czyste.
3. PRZYJMUJĘ. Nie ma tabeli zużycia na jednostkę per epoka i ustawienie: dane zawierają tylko agregat 9 jednostek (mieszanka) i 2 pary w tej samej stolicy wyłącznie dla Niskiego. Doc §4 deklaruje to jako NIE ZMIERZONO. Nie uzupełniono nowym pomiarem w tej rundzie (wymagałoby powtórnego biegu na żywo z przypięciem stolicy; poza zakresem obrony) — to kandydat na osobny temat, zob. UWAGI.
4. PRZYJMUJĘ. Zdanie o potwierdzeniu z silnika („+196 żywności/turę”) usunięte z dokumentu. Brak dowodu w repo: w jsonl ani w commicie tego komunikatu nie ma. W §4 dopisano: komunikat nie jest cytowany jako potwierdzenie.
5. PRZYJMUJĘ. Zdanie „blokada w t5 jest zgodna z tym rachunkiem” usunięte. §3 dokumentu: pytanie 3 = NIE ZMIERZONO; STARY-PIN i BŁĄD-GRY oba otwarte. Arytmetyka z wzoru (armia 9 przy Normalnym ≈ 384/turę, bufor 999 ≈ 2–3 tury) opisana jako rachunek, nie werdykt.
6. PRZYJMUJĘ. Dodano `dane/upkeep-food-audit.jsonl.gz.sha256` (sha256sum wykonany w tej rundzie: 6e914b670b554bffad7c3b384b4e61fe36c688759f6bbe26c068e1ac3f09f548 — zgodne z dokumentem i z zarzutem).
7. PRZYJMUJĘ. Nagłówek narzędzia: setPlayerGranary(500) → (950 = GRANARY_START, zgodnie z kodem). Komentarz o U1 przepisany tak, by opisywał to, co kod robi (nachylenie per warunek; army−base tylko przy tym samym tempie; wynik jest czysty tylko tam, gdzie stolice są równe). `node --check gra/tools/upkeep-food-audit.cjs`: OK.

ZNALEZISKO WŁASNE (nie było w zarzutach, ujawniam): każde 3 tury w biegu mają IDENTYCZNĄ deltę, bo zapas jest resetowany do 950 przed każdą turą. To 3 powtórzenia jednego pomiaru, nie 3 niezależne próby. Dokument §2b i §4 mówią to wprost. Wniosek: „3 tury na bieg” w poprzedniej wersji dawało fałszywe wrażenie liczebności próby.

TESTY:
- Kod gry nie zmieniony, więc bramki z kandydata 3b8504f (tsc 0; logic 213/213; ai-test 297/0) pozostają ważne; NIE PONOWIONO w tej rundzie.
- `node --check gra/tools/upkeep-food-audit.cjs`: OK (exit 0).
- `sha256sum dane/upkeep-food-audit.jsonl.gz`: 6e914b670b554bffad7c3b384b4e61fe36c688759f6bbe26c068e1ac3f09f548 (= sidecar).
- `zcat dane/upkeep-food-audit.jsonl.gz | wc -l`: 6 linii (warunki base/army × niski/normalny/wysoki).
- Dane nie zostały ponownie zmierzone (NIE PONOWIONO pomiar na żywo w tej rundzie).

BLOKADY:
- Pytanie 3 (bufor 999 w teście rozejmu t5): NIE ZMIERZONO.
- Zużycie per jednostka i per epoka (wymóg dispatchu pkt 2): NIE ZMIERZONO.
- Przyczyna zmiany stolicy mimo seeda 4242: NIE ZMIERZONO.
- Składnik obywateli/produkcji/Spichlerza, skład armii startowej, obóz/poza terytorium/Sól, AI t1–40, kurs 0,2: NIE ZMIERZONO.
- Bramka NNS w turze 1 blokuje przez złoto, nie żywność (pytanie ABC #99 — decyzja właściciela).

RUNDY: 2/5 (runda 1 Operator; runda 2 = ta obrona; zarzuty Evaluatora 1–7 obsłużone, 0 odrzuconych)

UWAGI-DLA-ORKIESTRATORA:
1. Wniosek jakościowy pozostaje: karty jednostek = wzór 100%; jedyny czysty pomiar (Niski) jest w granicach −3,6%; nie stwierdzono BŁĄD-GRY. Nie ma podstaw, by uznać bufor 999 za błędny ani za poprawny.
2. Aby domknąć pytanie 3 i tabelę per jednostka, potrzebny jest osobny temat pomiarowy: przypięcie stolicy gracza (ten sam hex dla wszystkich biegów, np. przez hak ustawienia pozycji miasta) i rozdzielenie produkcji od zużycia (pomiar składników zapasu). Proponuję jako kolejny temat R-WEB-*, nie w tej rundzie.
3. Test rozejmu (diplo-truce-live-test.cjs) dosypuje żywność po blokadzie (grantPlayerFood(300)), co maskuje konsumpcję — warto to rozstrzygnąć przed uznaniem bufora za błędny (zob. #107 w kolejce).
4. Dokument §5 ma uwagę: funkcja `analyze` liczy army−base dla wszystkich tempów, więc jej wynik dla Normalnego i Wysokiego nie jest czystym zużyciem. Nie zmieniano logiki analyze (poza komentarzem), bo zmiana wyniku wymagałaby osobnej rundy.
NASTĘPNY KROK: Evaluator (runda 2) sprawdza korektę wobec zarzutów 1–7 i stwierdza, czy klasyfikacja NIE ZMIERZONO jest kompletna; potem Final Control. Decyzja o pomiarze uzupełniającym — właściciel/orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
