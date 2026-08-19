# R-ARMIA-KONCENTRACJA-AI-BARB-Q1 — koncentracja armii sztucznej inteligencji i barbarzyńców

**Status:** CZEKA-NA-DECYZJĘ · bez zmian w kodzie
**Data:** 2026-08-19
**Grupa:** D (Cywilizacje / Dyplomacja / AI / barbarzyńcy)

## Sytuacja

Sztuczna inteligencja oraz barbarzyńcy poruszają jednostki rozproszone, ponieważ
ich planery wybierają rozkaz dla pojedynczej jednostki. `decideAITurn()` w
`gra/src/game/ai.ts` przechodzi po własnych jednostkach i dla każdej wybiera
osobno atak albo pierwszy krok marszu. `decideBarbarianMoves()` w
`gra/src/game/barbarians.ts` działa analogicznie: sprawdza pojedynczą jednostkę,
cel obok albo najbliższy cel i zwraca jej osobny rozkaz.

Istniejące `gra/src/game/armyMerge.ts` nie jest strategicznym planerem:

- `computeStackDisplay()` grupuje jednostki dopiero wtedy, gdy już mają tego
  samego właściciela i te same współrzędne heksu;
- `stackFieldPowerM()` liczy Moc rzeczywistego stosu z jednostek używanych w
  tym stosie;
- moduł nie wybiera punktu zbiórki i nie zmienia kolejności marszu AI ani
  barbarzyńców.

Obecna gotowość obozu barbarzyńskiego (`isCampRaidReady`) zwiększa zasięg
pościgu, ale nie tworzy fazy zbiórki. W głównej pętli
`gra/src/main.ts` dispatchery AI i barbarzyńców wykonują rozkazy ruchu
oddzielnie, ustawiając ruch danej jednostki po wykonaniu komendy.

Zakres wymaga rozdzielenia jednostek bojowych od cywilnych, garnizonów,
oblężenia oraz rajdów morskich. Nie wolno uznać samego badge renderu za
zwiększenie Mocy: Moc ma wzrosnąć dopiero po rzeczywistym zgrupowaniu jednostek
na jednym heksie i musi być liczona przez istniejącą ścieżkę stosu.

## Cel pytania

Ustalić, czy wprowadzić strategiczną fazę rally, w której jednostki tej samej
frakcji zbierają się w wybranym punkcie, a dopiero potem maszerują lub atakują.
Decyzja ma określić wspólny zakres dla cywilizacji AI i barbarzyńców oraz granice
łączenia, bez samodzielnego wymyślania balansu odległości, liczby tur i progów
minimalnej armii.

## Dlaczego teraz

To nie jest kosmetyka wyświetlania. Zmiana wpływa na kolejność decyzji AI,
realne składy bitew, obronę miast, zachowanie barbarzyńców i prezentowaną Moc.
Implementacja wybranej litery bez decyzji o zakresie mogłaby albo pozostawić
barbarzyńców rozproszonych, albo stworzyć nienaturalny globalny mega-stos
barbarzyński. Najpierw potrzebny jest kanon zachowania, dopiero potem kontrakt
techniczny i testy.

## Opcje

### A — Kontrolowana koncentracja obu frakcji (rekomendacja)

**Co w grze:** wprowadzić wspólny, owner-agnostyczny mechanizm rally dla
wszystkich kwalifikujących się właścicieli sterowanych przez sztuczną
inteligencję oraz dla barbarzyńców. Mechanizm:

- rozpoznaje tylko jednostki bojowe tej samej frakcji; nie scala cywilów,
  zwiadowców, garnizonów, jednostek w aktywnym oblężeniu ani jednostek
  zaokrętowanych z lądowym oddziałem;
- dla AI wybiera bezpieczny punkt zbiórki, z pierwszeństwem dla obrony
  zagrożonego własnego miasta, a poza zagrożeniem dla punktu przygotowania
  najbliższego wybranemu celowi;
- dla barbarzyńców tworzy lokalny kontyngent wokół aktywnego obozu lub celu,
  bez teleportowania jednostek i bez automatycznego łączenia wszystkich
  oddziałów z całej mapy; rajdy morskie pozostają osobną falą;
- najpierw prowadzi jednostki do punktu zbiórki zgodnie z istniejącym ruchem
  i blokadami heksów, a rozkaz marszu/ataku wydaje dopiero po faktycznym
  zgrupowaniu;
- po zgrupowaniu korzysta z rzeczywistego stosu bitewnego, więc Moc pola jest
  sumą jednostek w stosie, a nie zmianą samego badge.

**Za:**

- Rozwiązuje zgłoszony problem jednocześnie dla AI i barbarzyńców, zachowując
  wspólną regułę „najpierw zbiórka, potem starcie”.
- Zwiększenie Mocy jest realne i audytowalne: wynika z tego samego rosteru,
  który trafia do rozstrzygnięcia bitwy, a nie z warstwy renderu.
- Obrona zagrożonego miasta może mieć pierwszeństwo przed chaotycznym
  pościgiem, bez przyznawania AI darmowych jednostek ani dodatkowego ruchu.

**Przeciw:**

- Wymaga zmian w dwóch planerach oraz w dispatcherze głównej pętli; trzeba
  pilnować kolejności komend, kolizji heksów i wznowienia po bitwie.
- Zbyt agresywna reguła zbiórki może opóźnić reakcję na cel albo stworzyć
  zbyt silny lokalny stos barbarzyński, dlatego progi i tie-breaki muszą być
  jawne i testowalne.
- Jednostki morskie, garnizony i oblężenia potrzebują osobnych bramek, aby
  wspólny mechanizm nie zniszczył istniejących wyjątków.

### B — Koncentracja tylko cywilizacji sterowanych przez sztuczną inteligencję

**Co w grze:** dodać rally dla głównych cywilizacji AI oraz ich defensywnych
kopii, natomiast barbarzyńcy zachowują obecny model: obóz określa gotowość
rajdu, a każda jednostka osobno wybiera najbliższy cel. Rzeczywisty stos AI
powstaje dopiero po dojściu jednostek na ten sam heks.

**Za:**

- Najmniejszy zakres ryzyka dla istniejących zachowań barbarzyńców, Ludów
  Morza i logiki obozów.
- Poprawia główny problem kontrataku cywilizacji AI bez zmiany neutralnej,
  nieprzewidywalnej presji barbarzyńców.
- Łatwiej odseparować testy planera AI od testów spawnów, obozów i rajdów.

**Przeciw:**

- Nie realizuje części zgłoszenia dotyczącej rozproszenia barbarzyńców;
  barbarzyńcy nadal mogą rozchodzić się pojedynczo.
- Powstają dwa różne modele strategiczne: AI przygotowuje stos, a barbarzyńcy
  nadal ruszają per jednostka, co utrudnia późniejszy balans i dokumentację.
- Aktualna gotowość obozu nadal nie oznacza zebrania kontyngentu w jedną
  rzeczywistą armię.

### C — Bez strategicznego rally; pozostawić obecne scalanie na zajętym heksie

**Co w grze:** nie dodawać fazy koncentracji. Zachować wyłącznie obecne
scalanie prezentacyjno-operacyjne jednostek tego samego właściciela, które już
znajdują się na tym samym heksie. AI i barbarzyńcy nadal wybierają ruch oraz
atak niezależnie.

**Za:**

- Zero ryzyka zmiany kolejności tur, pathfindingu i istniejących wyjątków
  barbarzyńców.
- Najniższy koszt implementacyjny i brak nowych parametrów balansu.
- Zachowuje obecny, bardziej rozproszony i chaotyczny charakter barbarzyńców.

**Przeciw:**

- Nie usuwa potwierdzonej luki taktycznej: nie powstaje planowana większa
  armia do kontrataku ani obrony.
- Moc pozostaje większa tylko wtedy, gdy jednostki przypadkiem spotkają się na
  jednym heksie; AI nie dostaje narzędzia świadomej koncentracji.
- Zgłoszenie pozostaje nierozwiązane zarówno dla AI, jak i dla barbarzyńców.

## Rekomendacja

**A — kontrolowana koncentracja obu frakcji.** Najlepiej odpowiada pełnemu
zgłoszeniu, ale ogranicza ryzyko przez lokalne kontyngenty, rozdzielenie
jednostek lądowych i morskich oraz zakaz teleportowania. Nie ustalam przed
decyzją arbitralnych progów odległości, liczby tur ani minimalnej liczebności
armii.

## Ask

`R-ARMIA-KONCENTRACJA-AI-BARB-Q1` — wybierz:
**A — kontrolowana koncentracja AI i barbarzyńców (rekomendacja)** ·
**B — koncentracja tylko AI** ·
**C — bez strategicznego rally**

## Kontrakt po decyzji

Po odpowiedzi pełnym ID i literą trzeba dopiero ustalić w implementacji:

- dokładny zbiór kwalifikujących się jednostek oraz wyjątki dla zwiadowców,
  cywilów, garnizonów, oblężenia i jednostek zaokrętowanych;
- źródło punktu zbiórki AI i barbarzyńców oraz deterministyczne tie-breaki;
- warunek rozpoczęcia marszu/ataku po koncentracji;
- parametry odległości, maksymalnego czasu oczekiwania i minimalnej siły
  armii, jeśli decyzja produktowa będzie ich wymagała;
- sposób zachowania przy zablokowanej trasie, śmierci celu lub przerwaniu
  tury przez bitwę;
- testy: tylko ten sam owner może się połączyć, cywile i różni ownerzy nie;
  Moc zmienia się dopiero po rzeczywistym stosie; AI i barbarzyńcy nie wydają
  podwójnych rozkazów; rajdy morskie nie łączą się z lądowymi.
