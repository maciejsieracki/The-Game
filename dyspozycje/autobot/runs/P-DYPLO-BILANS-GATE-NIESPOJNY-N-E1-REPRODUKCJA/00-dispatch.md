TEMAT: P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/ui/diplomacyAcceptanceBalance.ts (glowny, formula/etykiety panelu bilansu),
gra/src/ui/diplomacyTradeBasket.ts (wywolania renderPnBalancePanelFromBasket, ~1054,~1860,
i ewentualny brak odswiezenia po edycji koszyka)
MODEL+EFFORT: claude-sonnet-5, effort high (niejednoznaczny bug diagnostyczny, dwie konkurencyjne
hipotezy do rozstrzygniecia reconem, nie zgadywaniem)

WYZWALACZ (dosłownie od właściciela, z `dyspozycje/PYTANIA-OTWARTE.md` sekcja
"P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA")
Zrzut 1 (pakiet Rzymianie, zablokowany): panel "PUNKTY WYMIANY PW" pokazuje BILANS (ONI) +141
(Nadwyzka 141 PW, zielone pole), a mimo to blokada "Nie spelnia warunkow: Brakuje 9 PW do
uczciwej oferty traktatu handlowego @ Relacji... oferta nieuczciwa dla partnera", przycisk
"Przyjmij" wyszarzony. Cytat Macieja: "Pomylke tego, ze bilans jest na plus, to jestes na
plusie, to nadal nie moge przyjac oferty." Zrzut 2 (ta sama para, po usunieciu i ponownym
dodaniu MNIEJSZEJ oferty): BILANS (NETTO) +13, Relacja skoczyla z 44,9 na 88,9, "Przyjmij"
aktywny.

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji + zapisane w
PYTANIA-OTWARTE.md)
- Dwie KONKURENCYJNE, nie wykluczajace sie hipotezy do rozstrzygniecia reconem (NIE zgadywac,
  ktora jest prawdziwa):
  1. **N-E1 potwierdzone ponownie** — formula bilansu w "PUNKTY WYMIANY PW"/"Wymiana" nadal
     niespojna z bramka akceptacji dla pakietow wielo-umowowych (Traktat handlowy + Umowa
     wymiany surowcow razem). Etykieta w zrzucie 1 to "BILANS (ONI)", w zrzucie 2 "BILANS
     (NETTO)" — rozna etykieta w tym samym miejscu UI, do ustalenia czy to dwie rozne wersje
     panelu czy odswiezona etykieta po edycji.
  2. **NOWY watek — panel bilansu nie odswieza sie (staleness) po edycji pozycji w koszyku.**
     Usuniecie i ponowne dodanie oferty (nawet MNIEJSZEJ) odblokowalo akceptacje. Relacja
     skoczyla z 44,9 do 88,9 miedzy zrzutami — jesli ta zmiana Relacji byla juz FAKTYCZNA w
     chwili zrzutu 1, ale panel pokazywal stara wartosc z poprzedniej iteracji edycji koszyka —
     to jest realny bug odswiezania stanu, ODREBNY od N-E1.
- `renderPnBalancePanelFromBasket` zdefiniowana w `gra/src/ui/diplomacyAcceptanceBalance.ts:598`,
  wolana z `gra/src/ui/diplomacyTradeBasket.ts` w dwoch miejscach (~1054, ~1860) — sprawdz w
  locie, czy oba call site'y sa wywolywane PRZY KAZDEJ edycji koszyka (dodanie/usuniecie/zmiana
  ilosci pozycji), czy tylko przy otwarciu panelu/dodaniu NOWEJ pozycji.

GOAL
1. Ustal reconem (nie zgadywaniem), ktora z dwoch hipotez (formula czy staleness) jest realna
   przyczyna — MOZLIWE ze OBIE, mozliwe ze zadna (np. Relacja faktycznie sie zmienila miedzy
   zrzutami z jakiegos innego, legalnego powodu i to nie jest bug). Zywy test w headless
   Chromium odtwarzajacy dokladnie sekwencje z opisu: dodaj oferte multi-umowowa (Traktat
   handlowy + Umowa wymiany surowcow) → sprawdz wartosc bilansu w panelu I wynik bramki
   akceptacji → edytuj oferte W MIEJSCU (bez usuwania) → sprawdz czy panel przelicza sie NA
   ZYWO, czy pokazuje stara wartosc.
2. Jesli potwierdzony bug staleness (panel nie odswieza sie po edycji koszyka bez
   usuniecia/ponownego dodania) — napraw wywolanie odswiezenia panelu przy KAZDEJ edycji
   koszyka, nie tylko przy dodaniu nowej pozycji.
3. Jesli potwierdzony bug formuly N-E1 (bilans wyswietlany w panelu niespojny z formula bramki
   akceptacji dla pakietow wielo-umowowych) — ujednolic ZRODLO PRAWDY: panel ma pokazywac
   DOKLADNIE ta sama liczbe/formule, ktora decyduje o odblokowaniu przycisku "Przyjmij", zero
   rozbieznosci.
4. Jesli zaden z dwoch watkow sie nie potwierdzi zywym reconem (np. Relacja faktycznie sie
   zmienila miedzy zrzutami z legalnego powodu) — zatrzymaj sie ze statusem PASS-WITH-NOTES i
   udokumentuj dokladne ustalenie (nie zamykaj tematu milczeniem, nie zgaduj dalej).
5. Etykieta "BILANS (ONI)" vs "BILANS (NETTO)" — ustal czy to dwie rozne, niespojne wersje
   tekstu w tym samym miejscu kodu (bug kosmetyczny do naprawy przy okazji), czy dwa rozne stany
   UI (np. przed/po edycji) z celowo roznymi etykietami.

KRYTERIA KOŃCA (binarne)
1. Zywy test w headless Chromium jednoznacznie ustala (z dowodem — zrzuty stanu/wartosci, nie
   deklaracja), czy bug staleness istnieje na aktualnym HEAD.
2. Zywy test jednoznacznie ustala, czy formula bilansu w panelu "Wymiana" jest dzis spojna z
   formula bramki akceptacji dla pakietow wielo-umowowych (Traktat handlowy + Umowa wymiany
   surowcow razem) na co najmniej 3 roznych kombinacjach koszyka.
3. Jesli ktorykolwiek bug potwierdzony — naprawiony, z zywym testem PRZED (czerwony) i PO
   (zielony) na dokladnie tym scenariuszu z opisu (Rzymianie, oferta ~221/80 PW).
4. Etykieta "BILANS (ONI)"/"BILANS (NETTO)" ujednolicona lub jawnie wyjasniona jako dwa
   zamierzone stany, z dowodem w kodzie.
5. Zero regresji na istniejacych testach panelu bilansu/koszyka dyplomacji (jesli istnieja —
   znajdz je reconem, np. `diplomacy-trade-basket-test.cjs` lub podobne).
6. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/ui/diplomacyAcceptanceBalance.ts — formula/etykiety panelu bilansu.
- gra/src/ui/diplomacyTradeBasket.ts — WYLACZNIE wywolania odswiezenia panelu bilansu przy
  edycji koszyka (nie inna logika koszyka).
- Nowy lub rozszerzony plik testu w gra/tools/*-test.cjs dla tego tematu.
Zakazane bezwzglednie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**, dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana samej logiki bramki akceptacji
(warunku uczciwosci oferty) — jesli recon wykaze ze TO wlasnie trzeba zmienic (nie tylko
wyswietlanie), zatrzymaj sie ze statusem DECISION_REQUIRED zamiast rozszerzac zakres
samodzielnie, bo to bylaby zmiana zasad gry, nie naprawa spojnosci UI.

IZOLACJA
worktree /home/user/wt-dyplo-bilans-gate, gałąź autobot/P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA,
baza jawnie: origin/main (commit d144c6b2 lub nowszy jesli main ruszyl w miedzyczasie).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-dyplo-bilans --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie sa nim objete.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania ktorejkolwiek hipotezy (formula/staleness) za potwierdzona lub wykluczona bez
zywego testu w headless Chromium odtwarzajacego DOKLADNIE opisana sekwencje (dodaj wielo-
umowowa oferte, sprawdz panel+bramke, edytuj W MIEJSCU, sprawdz ponownie) — czytanie samego
kodu formuly nie wystarcza, bo zgloszenie dotyczy ROZBIEZNOSCI miedzy tym co POKAZUJE UI a tym
co ROBI bramka, co moze wynikac z kolejnosci wywolan w czasie (staleness), nie tylko z bledu
matematycznego widocznego w statycznym czytaniu kodu.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawke; runda N+1 idzie na TYM SAMYM ID i TEJ SAMEJ
gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integruja, nie deployuja, nie pushuja. Final Control i integracja
(allowlist-only, per plik i per hunk) dzieja sie poza worktree Operatora, reka orkiestratora.
Przy decyzji produktowej (np. czy formula bramki akceptacji sama wymaga zmiany) zatrzymanie ze
statusem DECISION_REQUIRED zamiast zgadywania.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jesli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.
