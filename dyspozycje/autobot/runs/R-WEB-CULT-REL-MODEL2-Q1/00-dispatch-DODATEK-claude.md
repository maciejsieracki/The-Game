# DODATEK (runda 1/5, Operator HAIKU 5.5)
## Projekt właściciela (dosłownie, 2026-11-26)
„W temacie religia i kultura wprowadzamy: — dla łatwego ustawienia są te ustawienia, które są dziś, ale zmodyfikowane o −10 i +20 zarówno dla prawa, jak i dla szczęścia. — Normalnego ustawienia: −15 i +15 zarówno dla szczęścia, jak i dla prawa. — Na najwyższym poziomie trudnym, gdzie wpływ kultury będzie najwyższy, jest −20 i +10. Ta zasada obejmuje zarówno religię, jak i kulturę. Dodatkowo proporcjonalnie te stawki rosną w kolejnych epokach, gdzie rozstrzał jest jeszcze większy na minus i na plus.”
## Interpretacja orkiestratora (do użycia w modelu; w raporcie wypisz alternatywy, jeśli widzisz inne czytanie)
- Dla KAŻDEJ z dwóch linii (kultura, religia) wartość linii leży między dolną granicą (miasto w całości obce) a górną (w całości nasze), interpolowana liniowo po udziale własnej kultury/religii (jak dziś: 2·x·udział − x dla ±x; tu dolna D i górna G): poziom łatwy: D=−10, G=+20; normalny: D=−15, G=+15; trudny/duży: D=−20, G=+10 (epoka 1).
- Linie dotyczą i SZCZĘŚCIA, i PRAWA: dziś kultura i religia wpływają tylko na Szczęście (±10 w epoce 1), na Prawo wcale — nowy mechanizm: ta sama para granic dodaje/odejmuje punkty Prawa (punkty Prawa, jak garnizon 20/jednostkę), niezależnie od Szczęścia.
- Skala epok proporcjonalna do dzisiejszej skali szczescie_skala_kultura_religia (epoka 1/2/3 = 10/16/23, czyli ×1,0/×1,6/×2,3) — D i G mnożone tym współczynnikiem; sprawdź inne rozsądne czytanie i opisz.
- Jednostka garnizonu nadal 20 pkt Prawa (odp. 29), budynek Garnizon 25/35/47, Pretorium itd. bez zmian; wagi Porządku, progi pasm, bunt (próg krytyczny 12 + 3 tury łaski) bez zmian.
## Fakty
Model z poprzedniej analizy: dyspozycje/analizy/model-kultura-religia-entry.ts (esbuild bundle woła computeHappinessBreakdown, computeLawBreakdown, computePorPct, loadRevoltParams, updateRevoltGrace, tierFromPorPct, porPctBand, szMaxForCity, prawMaxForCity, loadOrderParams z gra/src/game/society-breakdown.ts i order.ts); analiza: dyspozycje/analizy/KULTURA-RELIGIA-WPLYW-2026-11-26.md (dziś: obca kultura+religia bez budynków = 2 jednostki do tieru neutralnego; Szczęście obcięte od dołu do 0% — kara się nie sumuje; Prawo nie zależy od kultury). Parametry: gra/data/society-params.json.
## Zadanie
1. Rozszerz model (kopia/nowy plik w dyspozycje/analizy/, NIE zmieniaj gra/src) o nowe linie Prawa z kultury i religii wg interpretacji powyżej, dla trzech poziomów (łatwy/normalny/trudny) × epoki 1–3. Użyj prawdziwych funkcji silnika tam, gdzie się da; nowe linie dodaj jako dodatkowe pozycje w netto Prawa/Szczęścia w modelu (nie przez zmianę kodu).
2. Tabele (pop 5, normalna trudność gry — ale WYŁĄCZNIE najwyższy dopuszczalny poziom ustawień przy liczeniu zachowania: poziom „trudny/duży” jako główny scenariusz; dla pełnej odpowiedzi właściciela podaj tabelę potrzebnych jednostek dla WSZYSTKICH TRZECH poziomów, bo to specyfikacja produktu): minimum jednostek garnizonu do tieru neutralnego (Porządek ≥30) i do wyjścia z buntu skrajnego dla scenariuszy: (a) własna kultura+własna religia, (b) obca kultura/własna religia, (c) własna kultura/obca religia, (d) obca+obca; bez budynków, z Garnizonem (budynek), ze Świątynią, z Pretorium (epoka 3). Epoki 1/2/3, pop 3/5/8.
3. Porównaj z celem właściciela (2/3/4 jednostki) i wypisz, jakie D/G dałyby dokładnie 2/3/4 jeśli projekt tego nie daje.
4. EFEKT NA CAŁĄ GRĘ: miasta własnej kultury i religii dostają teraz do +40 pkt Prawa i +40 Szczęścia (poziom łatwy) — policz Porządek takiego miasta bez garnizonu, z 1 jednostką; wpływ na bunty własnych miast, stolic i nowych osad (pop 1–2), skutek dla AI (AI trzyma garnizony wg ai-city-garrison.ts — oceń statycznie, ile jednostek AI musiałoby trzymać), epoka 2–3 (skala ×1,6/×2,3).
5. Zgłoś ryzyka i pytania do właściciela (DECISION_REQUIRED, jedno zdanie skutku per wariant): np. czy „łatwy” ma być dokładnie dzisiejszym zachowaniem (dziś ±10 tylko Szczęście) — projekt NIE jest nim; kompatybilność zapisów (zapisy bez pola); czy obcięcie Szczęścia od 0% zostaje.
6. Zapis: dyspozycje/analizy/KULTURA-RELIGIA-MODEL2-2026-11-26.md (tabele, wnioski w języku gry dla właściciela, bez żargonu w streszczeniu), model-kultura-religia-model2-entry.ts.
## Allowlista
nowe pliki w dyspozycje/analizy/ (model-kultura-religia-model2-entry.ts, KULTURA-RELIGIA-MODEL2-2026-11-26.md), dyspozycje/autobot/runs/R-WEB-CULT-REL-MODEL2-Q1/**. Zero zmian gra/src, gra/data, gra/tools.
## Zakazy
gra/src/**, gra/data/**, gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, git add -A, push, spawn_task/create_session/create_trigger/send_later (ZAKAZANE), run_in_background w Bash, --no-gpg-sign. Dysk >= 6 GB; usuń node_modules/tmp po pracy. Nie pytaj właściciela (DECISION_REQUIRED).
## Bramki
Model uruchamia się (esbuild + node), wyniki z prawdziwych funkcji silnika; tsc nie dotyczy (bez zmian src). Zacommituj i zwróć SHA.
## Binarne kryterium
Tabele potrzebnych jednostek (3 poziomy × 3 epoki × scenariusze a–d × budynki) z silnika; porównanie z 2/3/4; analiza efektu na własne miasta i AI; ryzyka/pytania; dokument zapisany.

---
# NADRZĘDNA KOREKTA WŁAŚCICIELA (po starcie pierwszego biegu; ten bieg zatrzymano i uruchomiono od nowa)
Właściciel: „To mocno by zaburzyło samą grę. Na plusach zmieniamy: na łatwym zostaje +10 dla religii i kultury maksymalnie; dla normalnego +5; dla trudnego 0, czyli żadnych plusów. Dotyczy religii i kultury. Minusy bez zmian względem mojej propozycji.”
OBOWIĄZUJĄCE GRANICE na KAŻDĄ linię (kultura, religia osobno), epoka 1; D = miasto w całości obce, G = w całości nasze:
- łatwy: D=−10, G=+10 (dla Szczęścia dokładnie dzisiejsze zachowanie ±10; NOWOŚĆ: ta sama para dla PRAWA)
- normalny: D=−15, G=+5
- trudny (najwyższy wpływ): D=−20, G=0
Wartość linii = D + (G−D)·udział_własnej (liniowo). Skala epok ×1,0/×1,6/×2,3 mnoży D i G (epoka 2: łatwy −16/+16, normalny −24/+8, trudny −32/0; epoka 3: −23/+23, −34,5/+11,5, −46/0). Linie dodają się do netto Szczęścia (z dzisiejszym obcięciem od 0%) i do netto Prawa (punkty Prawa). Jednostka 20 pkt Prawa bez zmian.
Poprzednie granice (łatwy −10/+20, normalny −15/+15, trudny −20/+10) UNIEWAŻNIONE.
## Dodatkowe pytania do modelu (z szacunku orkiestratora do zweryfikowania silnikiem)
- Szacunek (epoka 1, pop 5, obca kultura+obca religia, bez budynków): do tieru neutralnego 3 / 3 / 4 jednostek (łatwy/normalny/trudny); do wyjścia z buntu skrajnego 2 / 3 / 3. Cel właściciela 2/3/4 — zweryfikuj i wypisz, jakie D lub inny parametr dałyby dokładnie 2/3/4.
- Na poziomie trudnym G=0: własne miasto bez garnizonu ma Szczęście 0% (podatki −5,6 obcinane do 0) i Prawo 0 → Porządek 0 (bunt skrajny, rebelia po 3 turach łaski) — SPRAWDŹ silnikiem i opisz skutek dla wszystkich własnych miast (stolica, nowe osady pop 1–2, AI). To główne ryzyko projektu — jeśli potwierdzone, wpisz do DECISION_REQUIRED jednym zdaniem skutku.
- Epoka 3 na trudnym (D=−46 na linię, −92 Prawa dla obcej kultury+religii): czy jest utrzymywalna bez budynków przy limicie 5 jednostek × 20 pkt (cap) i z Garnizonem 47 / Pretorium 38.
