# Operator — powtórna macierz mieszanych armii (`main` `862568e`)

**Wynik operatora: PASS-WITH-NOTES. Etap 4/11.** Przygotowano korektę fałszywie
pozytywnego kryterium harnessu i odtworzono macierz. Produkt nie wymagał poprawki na
podstawie tego testu. Brakuje jeszcze niezależnej ewaluacji, Final Control oraz
integracji/deployu/pusha.

## Diagnoza czerwonych warunków

Niepowodzenie z początkowego przebiegu nie wynikało z błędnego wyboru celu ani z
rozproszenia jednostek. Dotyczyło trzech łuczników drugiego ranku `steady`, przy dwóch
liniach dystansowych i walce już w zwarciu. Ich bezpośrednie pole do przodu było zajęte
przez łucznika pierwszego ranku tej samej grupy, który w tym samym scenariuszu oddał
strzały. Pełna macierz zatrzymywała wszystkie jednostki przeciwnika i nie stosowała
obrażeń, zatem pierwszy rank nigdy nie otwierał luki. Oczekiwanie, że każda jednostka
drugiego ranku musi obejść strzelca i poruszyć się, nie odpowiada zwartemu szykowi Ataku.
Ominięcie takiego strzelca bokiem w celu zaliczenia testu ryzykowałoby dokładnie
rozproszenie, którego gracz nie chce.

Rzeczywisty warunek produktu, który macierz potwierdza, pozostaje spełniony: strzelcy
z dostępnego ranku atakują w zasięgu, a jednostka z tyłu zachowuje pozycję, gdy bezpośredni
pas jest zajęty przez strzelca przed nią. W przypadku jednej linii taki sam brak
postępu nadal jest błędem. W obronie bez ruchu do przeciwnika jest zachowaniem wymaganym.

## Korekta harnessu i testy

Harness nie zgłasza już „idle/out of range” jako błędu, jeżeli łącznie: ustawiono więcej
niż jedną linię dystansową, bezpośrednie pole przed jednostką zajmuje niższy rank tej
samej roli w tym samym rzędzie, a przedni strzelec rzeczywiście oddał strzał. Pozostałe
warunki — minimalny udział strzelców, brak nielegalnych ataków, wymagany ruch konnicy i
rydwanów w Ataku/Szturmie oraz ruch strzelca poza zasięgiem bez zajętego frontu — pozostały
aktywne. Do śladu dodano również pozycję sąsiadów i dostępność przedniego pasa dla
trudnych jednostek.

- Pełna macierz: 36 kombinacji × 42 aktywne jednostki × 5 aktywacji; **0 czerwonych
  warunków**. Suma obejmuje trzy doktryny, ustawienia 1/2/3 linii, dwa priorytety oraz
  dwa warianty terenu.
- Izolowane ponowienie `steady`, 2 linie, teren engaged: 2 priorytety × 42 jednostki ×
  8 aktywacji; **0 czerwonych warunków**. Łucznicy wykonali 55 i 48 strzałów; wystąpiły
  także 8 i 4 ruchy łuczników, a kawaleria/rydwany wykonały ruchy i ataki.
- `npm run typecheck`: PASS.
- `battle-formation-rules-test.cjs`: PASS.
- `battle-ranged-mounted-doctrine-test.cjs`: **10/10 PASS**.
- `node --check` harnessu i `git diff --check`: PASS.

## Evidence i zakres

- Bazowa pełna macierz z trzema fałszywymi warunkami:
  `evidence/baseline-main-862568e-full-36-summary-red.json`, SHA-256
  `5e38a7299003a13ff20cb0d648dc06b9d81833b73a476a9731d0a44ff8568f91`.
- Bazowy izolowany rerun 8 aktywacji z czerwonymi warunkami:
  `evidence/baseline-main-862568e-steady-lines2-8-red.json`, SHA-256
  `8964eb9c5d695eced9f44429b502f22d92869bb3b2681b8f92aa67f6516b4673`.
- Pełna macierz PASS:
  `evidence/operator-main-862568e-full-36-summary-pass.json`, SHA-256
  `6a2cddb580cccfd85291650cfb60a0577f5e6519d46465c2ddce06f4351830c1`.
- Izolowany rerun 8 aktywacji PASS:
  `evidence/operator-main-862568e-steady-lines2-engaged-8-pass.json`, SHA-256
  `bc66c2c5ce2e3bceb36efc8c75e40d7c12622e04146af81bfd0583f02815df39`.

Nie zmieniano `gra/src`. Commit operatora zawiera jedynie precyzyjniejsze kryterium i
diagnostykę harnessu oraz ten run. Ograniczenie: to headless test produkcyjnej logiki
`BattleScene`; test nie symuluje ruchu obrońcy, obrażeń ani otwierania luk w ranku. Nie
zamienia więc pełnej, żywej bitwy BTF w przeglądarce.

Następnie niezależny Evaluator powinien zweryfikować, że warunek „rezerwa za aktywnym
strzelcem” nie ukrywa błędu w przypadku wolnego pasa, i potwierdzić, że zakres testu
pozostaje użyteczny.
