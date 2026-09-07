# DECISION_REQUIRED — R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1, runda 1

Dwa niezależne punkty wymagające decyzji właściciela. Operator STOP — nie proponuje
rozwiązania, wyłącznie opisuje konflikt, zgodnie z procedurą (autobots/civ-autobot §Konflikt
kontraktu).

## Punkt A — magnitude finalnej redukcji (przewidziany w GOAL, "nie zgaduj")

Zmierzone (`gra/tools/szczescie-audyt-c-prawo-osiedla-test.cjs`, siatka pełna: trudność x
epoka x pop 1-14 x administracja(4 warianty)/trybunał/sąd/garnizon-jednostki(3)/
garnizon-budynek/wojna):

- PRZED (baseline `[32,24,16,10]`/`[28,20,14,8]`/`[22,16,10,6]`): najgorszy spadek PorPct na
  +1 mieszkańca = **27,1 p.p.** (easy/era1/pop4→5, 95,4%→68,3%). Rząd wielkości zgodny z
  reconem dispatchu (27,8 p.p., inna kombinacja wariantów w tym samym paśmie).
- PO (`[10,7,5,3]`/`[8,6,4,2]`/`[7,5,3,1]`, przeliczone proporcjonalnie — factor ~0,3 do
  oryginalnej tablicy): najgorszy spadek = **19,3 p.p.** (ten sam punkt: easy/era1/pop4→5,
  100,2%→80,9%). Redukcja **7,8 p.p. (28,8%)**.
- Sprawdzone: floor przy CAŁKOWITYM wyzerowaniu `prawo_bonus_osiedle_pop` (factor 0,0) to
  **15,8 p.p.** — a więc nawet usunięcie mechanizmu Prawa w całości nie schodzi poniżej tego
  poziomu. Rozbicie punktu najgorszego (pop4→5, easy/era1, Dom Starszyzny): SzPct samo
  spada o **23,9 p.p. surowo** (Sz ma WŁASNE, nietknięte w tym temacie urwisko przy tym
  samym mechanizmie `pickOsiedlePopBonus` — `szczescie_bonus_osiedle_pop` poza allowlistą).
  Ta połowa podłogi (SzPct) jest strukturalnie niedostępna do naprawy w tym temacie.

**Wynik po naprawie (19,3 p.p.) jest ~3,2× większy niż precedens 6 p.p. zaakceptowany przez
właściciela po stronie Szczęścia (G10).** To NADAL rząd wielkości większy niż precedens —
zgodnie z jawną instrukcją dispatchu ("nie zgaduj czy to akceptowalne"), Operator NIE uznaje
tematu za zamknięty i zgłasza dokładną liczbę zamiast decydować samodzielnie.

Do rozstrzygnięcia przez właściciela: czy 19,3 p.p. (mimo ~29% mierzonej redukcji) jest
akceptowalne jako "wystarczające zmniejszenie urwiska", biorąc pod uwagę że ok. 15,8 p.p.
podłogi pochodzi z NIETKNIĘTEGO tu urwiska Szczęścia (osobny temat, poza tym allowlistą).

## Punkt B — konflikt kontraktu: GOAL vs ALLOWLISTA (bramki spoza tematu czerwienieją)

Zmiana danych `prawo_bonus_osiedle_pop` (jedyny klucz w allowliście) powoduje, że DWIE
istniejące bramki spoza allowlisty tego tematu — hardkodujące dokładną, starą wartość tego
klucza jako oczekiwaną liczbę — czerwienieją:

- `gra/tools/szczescie-skala-normalizacja-test.cjs` — 4 FAIL (linie 225/229/512/515),
  asercje `netto Prawo = 20`/`PrawPct = 50%` dla scenariusza pop2/epoka1 zakładają STARĄ
  wartość `prawo_bonus_osiedle_pop.normal[1]` (było 20, teraz 6). Sam komentarz w bramce
  (linia 512-515) mówi wprost: "netto Prawa (20) nie zmieniło się (bonus Osiedla, **poza
  allowlistą**)" — czyli ryzyko było znane WCZEŚNIEJSZEMU tematowi, ale nie temu.
- `gra/tools/society-breakdown-test.cjs` — 6 FAIL, docelowe pasma startowe PorPct
  (`easy ~107,1% ±4`, `normal ~80,4% ±4`, `hard ~61,9% ±4`) i etykiety pasma ("Ład"/
  "Spokój"/"Napięcie") dla scenariusza startowego zakładają STARE, wyższe Prawo z bonusu
  Osiedla przy niskim pop.

Sprawdzone: OBA FAIL nie występują na `git stash` (baseline PRZED zmianą klucza) —
potwierdzona przyczyna: zmiana `prawo_bonus_osiedle_pop`, nie inny defekt.

**ALLOWLISTA tego tematu WYŁĄCZA edycję tych dwóch plików** ("gra/data/society-params.json
WYŁĄCZNIE klucz prawo_bonus_osiedle_pop... bramka: rozszerzenie istniejącej LUB nowa
`szczescie-audyt-c-prawo-osiedla-test.cjs`" — nie wymienia `szczescie-skala-normalizacja-
test.cjs` ani `society-breakdown-test.cjs`). GOAL/binarne kryterium sukcesu wymaga jednak
"dodatkowo zielone... cała rodzina bramek Prawo/Porządek/Szczęście" (grep
`tools/*prawo*`/`*szczescie*`/`*porzadek*`/`*order*`/`*society*`).

**Konflikt czysto inżynierski (aktualizacja frozen-value assercji do świadomie zmienionych
danych), bez nowego wpływu na gameplay/balans/UX ponad to, co już rozstrzyga Punkt A** —
kwalifikuje się do lekkiej ścieżki (jedna propozycja, nie pełen turniej C-018), ALE
Operator i tak nie rozszerza sobie allowlisty samodzielnie (dispatch: "jeśli okaże się że
kod TEŻ wymaga zmiany, zatrzymaj się i zgłoś DECISION_REQUIRED zamiast rozszerzać allowlistę
samodzielnie" — ta sama zasada stosuje się analogicznie do innych plików bramek spoza
allowlisty).

Do rozstrzygnięcia: czy rozszerzyć allowlistę o te dwie bramki (przeliczenie ich asercji na
NOWE, zmierzone wartości — analogicznie jak własna bramka tego tematu), czy zostawić je
czerwone do osobnego, następnego tematu porządkującego (ryzyko: czerwone bramki w rodzinie
Prawo/Szczęście do czasu tamtego tematu).

---

## RATYFIKACJA ORKIESTRATORA (decyzja właściciela, 2026-09-07)

**Punkt A — magnitude:** „Przyjmij częściową poprawę teraz" (rekomendacja). Temat zamyka się
na zmierzonym wyniku **20,0 p.p.** (liczba Evaluatora/Obrony po naprawie zarzutu 1, szersza
i dokładniejsza siatka niż pierwotne 19,3 p.p. Operatora) — realna redukcja z 28,0 p.p.
Podłoga **16,5 p.p.** (połowa pochodząca z nietkniętego tu urwiska `szczescie_bonus_osiedle_pop`)
zostaje **jawnie zarejestrowana jako znane ograniczenie architektoniczne** w rejestrze
zamknięcia tego tematu — kandydat do osobnego, większego tematu w przyszłości (wymagałby
albo ponownego dotknięcia już zintegrowanych liczb Szczęścia G10, albo zmiany samego
mechanizmu `pickOsiedlePopBonus` w kodzie na łagodne wygaszanie zamiast twardego progu —
obie opcje ODRZUCONE dla TEGO tematu, nie są w jego zakresie).

**Punkt B — allowlista bramek:** „Rozszerz allowlistę o te dwie bramki" (rekomendacja).
Allowlista tego tematu zostaje NINIEJSZYM rozszerzona o:
- `gra/tools/szczescie-skala-normalizacja-test.cjs`
- `gra/tools/society-breakdown-test.cjs`

Obie bramki mają zostać przepisane na sprawdzanie WŁAŚCIWOŚCI (odczyt z
`society-params.json`/obliczenie oczekiwanej wartości z danych), nie literału starej liczby —
dokładnie ten sam wzorzec co przy `eliminacja-lup-kwoty-test.cjs` w temacie Prawa tej samej
sesji. **Zakaz osłabienia:** liczba realnych asercji w obu plikach nie może spaść, każda
zastąpiona asercja musi mieć udokumentowane mapowanie stara→nowa w raporcie (co sprawdzała
przed, przez co jest sprawdzana po).

**Kolejny krok:** Operator, RUNDA 2 na tej samej gałęzi — wykonaj oba punkty ratyfikacji
(potwierdź finalne liczby 20,0/16,5 p.p. w raporcie, przepisz obie bramki), następnie
Evaluator → (Obrona jeśli zarzuty) → koniec skryptu → Final Control osobno.
