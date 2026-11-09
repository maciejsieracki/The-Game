# R-WEB-TERRAIN-IMPROVE-FARM-MISSING-ON-HEX-Q1 — dispatch (2026-11-09)

GOAL (zgłoszenie właściciela + 2 zrzuty): na niektórych heksach brakuje na liście „MOŻLIWE ULEPSZENIA (TEREN)” ulepszeń, które powinny być dostępne (np. Farma) — lista pokazuje tylko Irygację (i Glinianka/Fort/Droga/Posterunek). Przykład ze zrzutu: heks Łąka (113, 34), zasoby: Glina, Trzoda (krowa/świnia), Rzeka; w „Ulepszenia postawione” są już Farma i Trzoda; „Możliwe ulepszenia”: Irygacja, Glinianka, Fort, Droga, Posterunek. Heks należy do miasta Pompeje (obywatel przypisany).
Należy ustalić: czy to BŁĄD reguł dostępności (Farma/Trzoda/inne zablokowane niesłusznie), czy poprawne zachowanie (Farma już postawiona = brak ponownej oferty), i ZGŁOSIĆ właścicielowi dokładną regułę. Właściciel twierdzi, że na tym terenie powinna być możliwość postawienia Farmy — jeśli diagnoza pokaże, że Farma jest już na heksie, a właściciel miał na myśli inne heksy, wypisz w raporcie KAŻDĄ regułę blokującą Farmę/Trzodę/Plantację (typ terenu, zasób, rzeka, las, wzgórze, istniejące ulepszenie, własność, epoka/tech, miasto-obywatel).
BAZA: main po FALA 567. Operator: SONNET 5.5 (uzasadnienie: diagnoza wielu reguł dostępności; możliwy DECISION_REQUIRED).
ZAKRES:
1. Diagnoza: znajdź funkcję listy możliwych ulepszeń terenu (szukaj „MOŻLIWE ULEPSZENIA”, availableImprovements/terrain-improvements.json, requires/typTerenu/wymaga) i odtwórz heks ze zrzutu (Łąka + rzeka + zasób Glina + Trzoda). Tabela: ulepszenie × warunek × wynik dla tego heksu; wskaż, które ulepszenia brakują i dlaczego.
2. Jeśli błąd reguł (np. wykluczenie Farmy przy zasobie lub rzece, albo przy już postawionej Trzodzie, mimo że oba ulepszenia stoją jednocześnie → ukryty konflikt): popraw tak, by Farma (i inne uprawnione) były oferowane; nie zmieniaj liczb plonów.
3. Jeśli zachowanie zamierzone — NIE zmieniaj kodu; zwróć DECISION_REQUIRED z opcjami ABC (zalety/wady, rekomendacja).
4. Zweryfikuj też panel: czy sekcja „Ulepszenia postawione” poprawnie pokazuje oba (Farma + Trzoda na jednym heksie) i czy jest to dozwolone w danych.
5. Test: `gra/tools/terrain-improve-farm-availability-test.cjs` (heks Łąka+rzeka+glina+trzoda; Łąka goła; Łąka+rzeka; wzgórze; las), plus istniejące testy ulepszeń/auto-ulepszeń.
ALLOWLISTA: gra/src/game/terrain-improvement*.ts, gra/src/ui/ (panel heksa), gra/src/main.ts (tylko jeśli konieczne), gra/data/terrain-improvements.json (tylko reguły dostępności, nie plony), nowy test, runs/<ID>/. Zakaz: WERSJE.md, gra-robocza/, build/dev, git add -A, push/deploy.

## DODATEK 1 (2026-11-09, zgłoszenie właściciela + zrzut — temat jeszcze niestartowany)
Właściciel: wybudował Farmę obok rzeki, a automatyczne przydzielanie obywateli NIE przesuwa tam obywatela, choć produkcja żywności i pozostałych plonów byłaby wyższa; „coś jest nie tak z tymi heksami, na których nie można budować farm”. Zrzut: kilka heksów trawiastych przy rzece z ikonami obywateli (fioletowa sylwetka w żółtym kółku) — obok heksów z Farmą bez przypisanego obywatela.
Dodatkowy zakres diagnozy:
(a) Dlaczego auto-przydział obywateli (citizen auto-assign / „automatyzacja”) pomija heks z Farmą nad rzeką mimo wyższych plonów: porównaj wynik oceny heksu (score) z heksem zajętym; sprawdź wykluczenia (heks sąsiedzki/„sibling exclusion”, heks poza zasięgiem, heks bez ulepszenia „postawione” vs „w budowie”, rzeka jako blokada, cache wyniku, próg poprawy).
(b) Czy ta sama przyczyna odpowiada za brak oferty Farmy na części heksów (wspólny predykat „heks nadaje się pod uprawę”?). Zgłoś wspólną przyczynę albo osobne.
(c) Test: scenariusz Łąka+rzeka+Farma wolna vs heks zajęty o niższych plonach → auto-przydział przenosi obywatela, gdy zysk (żywność/praca/podatek wg profilu) jest wyższy; brak regresji AIMPQ/auto-improve testów.
Ewentualne dodatkowe pliki allowlisty: gra/src/game/citizen-*.ts, auto-assign*, gra/tools/*citizen*-test.cjs.
