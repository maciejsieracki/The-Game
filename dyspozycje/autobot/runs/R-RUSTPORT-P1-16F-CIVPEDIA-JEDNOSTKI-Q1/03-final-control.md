STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16F-CIVPEDIA-JEDNOSTKI-Q1
GOAL: Pełny audyt grupy CivPedii „Jednostki" (51 haseł) wobec `gra/data/units.json` na pinie
edb8fb56.

RUNDY: 1/5 (Operator → Evaluator 6 zarzutów — błędne przypisanie rozjazdu do ekonomii ×5 zamiast
rzeczywistego ×2, niesprawdzony mnożnik tempa, brak uzgodnienia z baseline starego audytu, konflikt
pól epoki zignorowany, błędne twierdzenie o ruchu Galery, niepełny zakres bonusów przeciw typom →
Obrona 5×PRZYJMUJE/1×ODRZUCAM [tempo rozstrzygnięte inaczej, z dowodem `kosztJednostekPace='niski'`]
→ Final Control 6×ODDAL, zweryfikowane niezależnie przez `git log`/`git show` na commitach
4c1126de, 161ab227, 918e5993).

ZMIANY/COMMIT: nowy plik `dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-JEDNOSTKI.md`.

WYNIK: 51/51 haseł sprawdzonych. NADAL ISTNIEJE 43 (głównie koszt wiki = 2× dane — **przyczyna
ustalona: commit `4c1126de` 2026-09-16 przepołowił koszty jednostek, wiki nie była aktualizowana od
`918e5993` 2026-09-06, więc jest starsza niż ten rebalans**, nie błąd ekonomii ×5 jak wstępnie
sądzono). NAPRAWIONY 6 (5 jednostek + Bród). NIEROZSTRZYGNIĘTY 2 (Hieros Lochos — konflikt pól
Epoka/Dostępna[0]; Manpower). Konflikt pól epoki odnotowany też dla Falangi i Wojownika germańskiego
(nie blokuje ich statusu, inne pola się zgadzają). 25/25 jawnych bonusów przeciw typom zgodne; brak
w wiki `Bonus vs Mount 50` dla 3 jednostek odnotowany.

NOTATKA DO UJEDNOLICENIA (nieblokująca): „Bród" ma tu status NAPRAWIONY, a w równoległym
`P1-16D-OPISY-CIVPEDIA-UI.md` (wiersz 10, inny temat, inny zakres — tam chodziło o kartę UI,
nie o hasło CivPedii) NIEROZSTRZYGNIĘTY — to różne artefakty o różnym zakresie weryfikacji, nie
sprzeczność w ramach tego samego tematu.

BLOKADY: brak.
NASTĘPNY KROK: integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
