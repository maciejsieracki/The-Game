# R-WEB-DIPLO-CIVPEDIA-Q1 — DODATEK orkiestratora (runda 1)

## Zasada nadrzędna
Każda liczba w dokumentacji MUSI być zweryfikowana w kodzie lub JSON (plik:linia w raporcie). Liczby z tego dodatku są punktem startu z wcześniejszej analizy — jeśli kod mówi inaczej, kod wygrywa, a rozbieżność trafia do raportu. Pisz po polsku, językiem zrozumiałym dla gracza (bez nazw funkcji i plików w treści haseł). Format haseł: docs/encyklopedia/_SZABLON-HASLO.md (Metadane, Wiki-S, Wiki-M, Poradnik-L, Historia).

## Hasła do napisania lub zaktualizowania (nazwy plików do ustalenia zgodnie z konwencją pojecia/)
1. Zaufanie — start 20; zmiany na turę i jednorazowe; w wojnie spada do zera (krok 1 wdrożony); wpływ na umowy.
2. Respekt — start 30; skąd rośnie (pełne Power obu stron, trybut, wspólny wróg, wygrana bitwa); nie jest obcinany przez wojnę.
3. Relacja — = zaufanie + respekt (0–200); etykiety nastawienia i ich progi (obecnie: <30 Wrogi, <45 Nieufny, <60 Neutralny, <120 Życzliwy, ≥120 Przyjazny; w wojnie zawsze Wrogi); progi umów (pakt o nieagresji: relacja ≥110 i zaufanie ≥30; sojusz: relacja ≥130 i zaufanie ≥90; wymiana technologii: zaufanie ≥70; handel: relacja ≥0; wasalizacja: respekt ≥70; wchłonięcie: respekt ≥90).
4. Wiarygodność (aktualizacja istniejącego hasła) — skala −100…+100, start +40/+20/0 (łatwy/normalny/trudny); kary i nagrody (wypowiedzenie bez ostrzeżenia −10, złamanie NAP −18, złamanie sojuszu −25, atak w oknie karencji −12, odmowa obowiązku sojuszu −15, zerwanie umowy czasowej −6, handlu czasowego −4, niedotrzymanie handlu cyklicznego −2, nieautoryzowany przemarsz −2; dotrwanie sojuszu +10, NAP +5, handlu +5, spłata handlu +1, 30 tur bez wojny +3, pomoc sojusznikowi +20; ciągłe: sojusz +1, NAP +0,5, handel +0,9, przemarsz +0,6 na turę); wygasanie (80 tur, podłoga trwała 10%); wpływ na zaufanie: dryf wiarygodność×0,03 na turę (±3), mnożniki tempa (wzrost ×(1+W/200), spadek ×(1−W/200)), dryf wyłączony w wojnie. WYJAŚNIENIE różnicy: wiarygodność = reputacja dotrzymywania słowa, przyspiesza budowanie zaufania; zaufanie = bieżące nastawienie pary.
5. Zmiany zaufania na turę (tabela): handel +1, pakt +2, sojusz +3 (nie sumują się), wspólny wróg +1, dobra wola +1 przez 5 tur, wspólna religia +0,5 / odmienna −0,5 (OBECNIE; religia zostanie usunięta — patrz sekcja niewdrożona), kara za sąsiedztwo −2 Kamień / −3 Brąz / −4 Żelazo (warunki: >2 miasta obu stron i wspólna granica lądowa), uraz historyczny −2. Jednorazowe: umowa handlowa +2, dar +6, pomoc sojusznikowi +10, wspólny wróg +5, złamany pakt −40 (gracz) / −20 (AI), zdrada −50, szpieg −15. Respekt: trybut +10, wspólny wróg zaakceptowany +10, wygrana bitwa +5.
6. Power i jego podział — składniki i punkty: armia 2,5; wygrane bitwy (model przed bitwą); obywatele 5; rekruci 10; miasta 50; terytorium 1; budynki 5; technologie 80; ulepszenia 5; kultura 0,5; jedność religii 25; zdobycze ×2. Podział: wojskowy (armia + rekruci) i gospodarczy (reszta); przełącznik widoku w rankingu: całkowita / gospodarcza / militarna. Nazwa w HUD: „Moc”.
7. Wypowiadanie wojny — OBECNE zasady: przesłanki AI (siła względna ≥ próg 0,6, agresja ≥ 0,5, relacja poniżej minimum 30, brak pokoju/paktu/okna wczesnej fazy), wojna epoki, hamulec relacji (licznik tur kryzysu), bramki R1 (tura ≥ 40) i R2 (Kamień: 1 wojna), gracz nigdy nie jest wciągany automatycznie.
8. Rozejm i pokój — OBECNE zasady: rozejm 5/10/15 tur; AI proponuje rozejm gdy wojna < 20 tur, potem pokój; bramki pokoju (minimalny czas wojny 1–8 tur, przewaga > 20%, „czuje się silniejsze”, mnożnik ceny od siły, po 20 turach bramki zdjęte); karencja po pokoju.
9. Zmęczenie wojną — poziom = tury/200 + 0,03 × utracone miasta + stagnacja (od 30 tur, do 0,3); próg chęci pokoju 0,5; obniża cenę pokoju do 60%, zdejmuje blokadę silniejszej; przegrywający (udział ≤ 45%) oferuje coraz więcej (złoto, surowce, do 2 miast); ochrona przegrywającego; pokój wzajemny przy zmęczeniu ≥ 0,8; karencja 40 tur (100 dla chronionego).

Każde hasło: sekcja „Plusy i minusy” (dla gracza i dla AI) oraz sekcja „Parametry” z tabelą wartość / skąd.

## Sekcja „Zasady zatwierdzone, jeszcze niewdrożone” (osobny blok w hasłach 1, 3, 7, 8 — wyraźnie oznaczony, żeby gracz nie pomylił z obecnym stanem)
- Siła militarna: osobna miara pary w wojnie = armia + rekruci + wygrane bitwy z bieżącej wojny + czasowy bonus trybutu (+10% na 10 tur); gospodarka nie wchodzi; używana tylko do wojny i pokoju.
- Wypowiadanie wojny: możliwe przy zaufaniu poniżej 30 (silniejsza strona może, ale nie musi — decyduje charakter cywilizacji); przy zaufaniu 0 silniejsza strona wypowiada wojnę (po kilku turach od zera, z ostrzeżeniem); cywilizacja słabsza o ponad 20% siły militarnej nigdy sama nie wypowiada (poza wojną epoki); gracz nigdy automatycznie. Etykiety nastawienia: Wrogi poniżej 10, Nieufny 10–29, od 30 relacja jak dziś.
- Rozejm i pokój: słabsza strona proponuje, silniejsza (≥ 20% przewagi) odrzuca; pokój wyrównuje wyłącznie oddanie miasta; zmęczenie wojną kończy wojny tylko miastami; zniknie „czuje się silniejsze” i mnożnik ceny od siły; zostaje minimalny czas wojny.
- Zaufanie po rozejmie wraca do 10, po pokoju do 20 (od razu); kary za sąsiedztwo rosną do −3/−4/−5 i są wstrzymane w karencji; religia przestaje wpływać na zaufanie.
Oznacz każdy punkt „DECYZJA WŁAŚCICIELA 2026-11-13, wdrożenie w toku”. Po wdrożeniu każdego kroku orkiestrator zleci aktualizację — nie dopisuj, że coś już działa.

## Kryteria końca (binarne)
- Wszystkie wymienione hasła istnieją i mają sekcje Plusy/minusy i Parametry; indeks.md zaktualizowany; poradnik 12-dyplomacja.md odsyła do haseł.
- gra/src/data/wikiBundle.json zregenerowany skryptem (nie ręcznie); diff = tylko nowe/zmienione hasła.
- Nowy test gra/tools/diplo-civpedia-values-test.cjs czyta gra/data/diplomacy.json, diplomacy-war-peace-params.json, war-weariness-params.json, power-params.json i porównuje kluczowe liczby z haseł (przynajmniej: start zaufania i respektu, kary sąsiedztwa, progi etykiet, składniki Power, parametry zmęczenia). Mutacja liczby w haśle czerwieni test.
- gra/tools/admin-panstwo-panel-names-test.cjs pozostaje zielony. tsc --noEmit exit 0. logic-test 213/213.
- Raport: tabela „liczba → plik:linia kodu/JSON” dla wszystkich parametrów w hasłach oraz lista rozbieżności względem tego dodatku.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts (potrzebne do skryptu bundlowania i testów); ZAKAZ npm run build/dev; tsc --noEmit wolno. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A.
