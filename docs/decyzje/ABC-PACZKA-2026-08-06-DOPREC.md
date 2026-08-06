# ABC-PACZKA-2026-08-06-DOPREC — doprecyzowanie przed Autobotami

**Status:** 🟡 **OTWARTE** — czeka na odpowiedzi `ID=A|B|C`  
**Data:** 2026-08-06  
**Powód:** ECHO 6× zamknięte; przed `działaj` Agent potrzebuje rozstrzygnięć operacyjnych / UX, żeby Autoboty nie zgadywały.  
**Reguła:** [`R-ABC-PELNA-LISTA.md`](R-ABC-PELNA-LISTA.md)

---

## [LISTA ABC — 6 pytań]

| # | ID | Temat |
|---|-----|--------|
| 1 | **R-DZIALAJ-SCOPE-Q1** | Zakres hasła `działaj` — wszystkie 6 vs po jednym |
| 2 | **R-DEPLOY-AUTOBOT-Q1** | Deploy ROBOCZA — po każdym temacie vs zbiorczo |
| 3 | **MAP-UX-MARKER-Q1** | Marker stolicy: korona / obwódka / oba |
| 4 | **R-KAMIEN-FUTURE-Q1** | Jak chronić „przyszłe kopalnie” w kodzie |
| 5 | **R-WIARYGODNOSC-S9-LICZBY-Q1** | Strojenie §9 — liczby od razu vs paczka liczb do akceptacji |
| 6 | **R-DESIGN-V2-KANAL-Q1** | Jak dostarczyć pilne zlecenie Design v2 |

**Odpowiedź:** litery w kolejności albo `ID=litera`.

---

## [1/6] R-DZIALAJ-SCOPE-Q1 — zakres `działaj`

**[TEMAT: Operacje — kolejka Autobotów]**

### Sytuacja

ECHO zamknęło 6 tematów (STEP6, KAMIEN, MAP-UX, S9, DESIGN v2, OBRONA). Następny agent czeka na hasło. Bez doprecyzowania nie wie, czy od razu odpalać 6 Autobotów, czy tylko pierwszy.

### Cel pytania

Ustalić, ile tematów wchodzi w jedno `działaj`.

### Dlaczego teraz

Limit sesji się skończył — nowy agent startuje od zera; jedna litera oszczędza kolejkę.

### A — Wszystkie 6 Autobotów naraz (po kolei Op→Eval), jeden cykl

**Za:** 1. Domknięcie całej paczki ECHO w jednej sesji. 2. Mniej przełączania kontekstu u Ciebie.

**Przeciw:** 1. Długa sesja / większe ryzyko kolizji plików. 2. Trudniej przerwać w połowie.

### B — Tylko kolejny jeden temat na `działaj` (start: STEP6)

**Za:** 1. Zgodnie z „jedna dźwignia / jeden temat”. 2. Łatwy review i stop.

**Przeciw:** 1. Musisz pisać `działaj` wielokrotnie. 2. Wolniejsze domknięcie paczki.

### C — Pierwsze 3 (STEP6 + KAMIEN + MAP-UX), reszta po osobnym haśle

**Za:** 1. Szybkie UX/AI/render bez ciężkiego S9. 2. S9 i Design osobno gdy masz czas.

**Przeciw:** 1. Sztuczny podział paczki. 2. OBRONA (preBattle) też UX — może chcieć iść z MAP-UX.

### Rekomendacja

**C** — najpierw lekkie 3; S9/DESIGN/OBRONA w drugiej turze.

---

## [2/6] R-DEPLOY-AUTOBOT-Q1 — kiedy publish ROBOCZA

**[TEMAT: Operacje — deploy]**

### Sytuacja

Po CLEAN tipach Grok może deployować. Przy 6 tematach pytanie: jedna FALA na temat czy zbiorczy deploy.

### Cel pytania

Ustalić rytm ROBOCZA vs koszt czasu i czytelność playtestu.

### Dlaczego teraz

Bez reguły agent albo spamuje falami, albo trzyma wszystko do końca bez widocznej gry.

### A — Deploy po każdym CLEAN temacie (osobna FALA)

**Za:** 1. Możesz od razu sprawdzić STEP6 w grze. 2. Łatwy rollback jednej fali.

**Przeciw:** 1. Wiele pulli / Ctrl+F5. 2. WERSJE i kanał się rozrastają.

### B — Jeden zbiorczy deploy po całej paczce Autobotów z tego `działaj`

**Za:** 1. Jedna ROBOCZA do ogrania. 2. Mniej overheadu publish.

**Przeciw:** 1. Nie zobaczysz STEP6 osobno przed MAP-UX. 2. Regresja w temacie 4 psuje całą falę.

### C — Deploy po „kamieniach milowych”: po 3 lekkich, potem po reszcie

**Za:** 1. Kompromis z Q1=C. 2. Dwa punkty playtestu zamiast sześciu.

**Przeciw:** 1. Wymaga trzymania się podziału C. 2. Nadal dwa rytuały pull.

### Rekomendacja

**A** jeśli Q1=B; **B** jeśli Q1=A; przy Q1=C → **C**. Samodzielnie: **B** przy pełnej paczce, **A** przy jednym temacie.

---

## [3/6] MAP-UX-MARKER-Q1 — kształt markera stolicy

**[EKRAN: Mapa świata — pigułka miasta]**

### Sytuacja

ECHO **MAP-UX-CLUSTER-LABEL-Q1=B+C**: stolica = nazwa cywilizacji **oraz** marker. Opcja C mówiła „korona / grubsza obwódka” — nie wybrano kształtu.

### Cel pytania

Wybrać konkretny marker, żeby Operator nie zgadywał wizualnie.

### Dlaczego teraz

Bez tego Autobot MAP-UX zablokuje się albo zrobi „cheap” koronę bez Twojej zgody.

### A — Tylko grubsza / złota obwódka chipu stolicy (bez ikony korony)

**Za:** 1. Mniej clutter przy 4 chipach obok siebie. 2. Szybsze do wdrożenia bez assetu.

**Przeciw:** 1. Słabszy sygnał „to stolica” niż ikona. 2. Obwódka może zlewać się z obroną/hover.

### B — Mała ikona korony (lub diadem) przy nazwie stolicy

**Za:** 1. Natychmiast czytelne. 2. Pasuje do „stolica państwa”.

**Przeciw:** 1. Więcej pracy grafiki / ryzyko taniego glifu. 2. Przy małych chipach może nachodzić na tekst.

### C — Oba: obwódka + mała korona

**Za:** 1. Maksymalna czytelność B+C. 2. Zgodne z dosłownym „korona / obwódka”.

**Przeciw:** 1. Największy clutter. 2. Dwukrotna praca wizualna.

### Rekomendacja

**A** — obwódka najpierw; koronę można dodać po Design v2 jeśli zabraknie sygnału.

---

## [4/6] R-KAMIEN-FUTURE-Q1 — „wszystkie przyszłe kopalnie”

**[EKRAN: Mapa — relief przy ulepszeniu]**

### Sytuacja

ECHO: legacy `kopalnia` + reguła **wszystkie kopalnie teraz i przyszłe** zachowują relief. Dziś jest Set kluczy (`PRESERVES_HILL_RELIEF_KEYS`). Trzeba wybrać mechanizm „przyszłe”.

### Cel pytania

Żeby nowa `kopalnia_xyz` nie wymagała osobnego ABC za każdym razem.

### Dlaczego teraz

Jedna linia vs reguła prefix — różnica w ryzyku false-positive (klucz nie-kopalnia zaczynający się od „kopalnia”).

### A — Prefix: każdy klucz `kopalnia` / `kopalnia_*` automatycznie na whiteliście (+ kamieniołom osobno)

**Za:** 1. Przyszłe kopalnie „za darmo”. 2. Zgodne z Twoją regułą produktową.

**Przeciw:** 1. Gdyby powstał klucz nie-kopalnia z tym prefixem — też zachowa relief. 2. Trzeba czytelnego komentarza w kodzie.

### B — Jawna lista dziś (legacy + miedź/żelazo/złoto) + komentarz „dokładaj nowe ręcznie”

**Za:** 1. Zero niespodzianek. 2. Minimalny diff.

**Przeciw:** 1. Łamie ducha „przyszłe automatycznie”. 2. Łatwo zapomnieć przy nowym typie.

### C — Prefix + test regresji: asercja „każdy improvement z kopalnia* jest na whiteliście / passuje helper”

**Za:** 1. Prefix + siatka bezpieczeństwa. 2. Evaluator STRICT lubi test.

**Przeciw:** 1. Trochę więcej pracy. 2. Test trzeba utrzymywać przy nowych typach (to zamierzone).

### Rekomendacja

**C** — prefix + test; najbliżej Twojej reguły.

---

## [5/6] R-WIARYGODNOSC-S9-LICZBY-Q1 — skąd wziąć liczby §9

**[TEMAT: Dyplomacja — Wiarygodność]**

### Sytuacja

ECHO **S9=A**: pełna paczka strojenia teraz. Nie ma jeszcze Twojego playtestu „za ostro / za łagodnie”. Agent może albo zaproponować tabelę liczb do akceptacji, albo wdrożyć rekomendowane wartości z audytu/spec.

### Cel pytania

Uniknąć wdrożenia liczb „w ciemno” albo kolejnego ABC-blokera w środku Autobota.

### Dlaczego teraz

S9 to duży Autobot — bez reguły Operator zgaduje wagi N1–N7.

### A — Operator wdraża rekomendowane liczby z spec/audytu od razu (jedna paczka JSON + testy); korekta po Twoim playteście później

**Za:** 1. Spełnia S9=A bez czekania. 2. Placeholdery znikają.

**Przeciw:** 1. Możesz dostać „złe feel” od razu. 2. Druga fala strojenia prawie pewna.

### B — Najpierw tabela liczb w czacie (pełna lista parametrów + propozycje) → Ty litery/OK → dopiero kod

**Za:** 1. Kontrola nad każdą wagą. 2. Mniej niespodzianek w grze.

**Przeciw:** 1. Dużo czytania liczb teraz. 2. Opóźnia Autobot S9.

### C — Minimalny zestaw 5–7 najbardziej widocznych parametrów w tabeli do OK; reszta z rekomendacji audytu bez pytania

**Za:** 1. Kompromis. 2. Szybciej niż B, bezpieczniej niż A.

**Przeciw:** 1. Granica „krytyczne vs reszta” subiektywna. 2. Nadal trochę ABC.

### Rekomendacja

**C** — krytyczne na stół, reszta z audytu.

---

## [6/6] R-DESIGN-V2-KANAL-Q1 — pilne zlecenie Design v2

**[TEMAT: Design — pigułka miasta]**

### Sytuacja

ECHO **R-DESIGN-PANEL-MIASTA-V2-Q1=C**: pilne zlecenie 3 klatek v2; kod nie zamrożony. Agent nie jest Designerem — może tylko zaktualizować plik zlecenia / kanał docs.

### Cel pytania

Jak „dostarczyć” pilność, żeby Design wiedział, a agent nie udawał makiet.

### Dlaczego teraz

Bez tego Autobot #6 robi pusty docs-only albo czeka w nieskończoność.

### A — Agent aktualizuje `DO-DESIGN-PANEL-MIASTA-…` + REJESTR (status PILNE) i kończy temat; Ty sam pingujesz Design poza Cursor

**Za:** 1. Realistyczne. 2. Zero fałszywych makiet.

**Przeciw:** 1. Design może nie zobaczyć bez Twojego pinga. 2. Temat „wiszący” w rejestrze.

### B — Agent przygotowuje krótkie brief (3 klatki: baseline / always-on / hover) w docs i **czeka** — bez dalszego kodu pigułki do dostawy Design

**Za:** 1. Jasny kontrakt dla Design. 2. Zgodne z „pilne zlecenie”.

**Przeciw:** 1. Lekko sprzeczne z C „kod nie zamrożony”. 2. Polish stoi.

### C — Agent może drobno dogrywać layout pigułki (spacing/czytelność) równolegle; Design dostaje brief jak w A

**Za:** 1. Dosłownie ECHO C. 2. Gra nie stoi wizualnie.

**Przeciw:** 1. Ryzyko podwójnej roboty po makiecie. 2. Scope creep bez makiety.

### Rekomendacja

**A** — brief + PILNE w rejestrze; drobny polish tylko gdy osobno powiesz.

---

## Po odpowiedzi

1. ECHO wszystkich 6.  
2. Na `działaj` — Autoboty wg Q1/Q2.  
3. Paczka → 🟢 ZAMKNIĘTA.
