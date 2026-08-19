# R-AI-MP-REKRUTACJA-SKARBIEC-ZAMIAST-BUDOWY-Q1 — pełne ABC

**Status:** CZEKA-NA-DECYZJĘ · bez zmian w kodzie  
**Data:** 2026-08-19  
**Zakres:** polityka rekrutacji jednostek przez sztuczną inteligencję, w tym miasta-państwa sterowane przez sztuczną inteligencję

## Sytuacja

Silnik ma już wspólną ścieżkę zakupu jednostki za Pieniądz dla dowolnego właściciela
(`purchaseRecruitmentUnit` w `gra/src/main.ts`). Istnieje też czysty predykat
`shouldAIRushBuyUnit` w `gra/src/game/ai.ts`, który obecnie ogranicza zakup do sytuacji
wojny, posiadania Manpower, zachowania rezerwy Skarbca i limitu zakupów na turę.

Nie ma jednak decyzji Macieja, czy ta mechanika ma być pełnym sposobem rekrutacji
zamiast budowy, czy tylko warunkowym przyspieszeniem wojska. Nie zakładamy żadnej
z tych interpretacji przed decyzją.

## Cel pytania

Ustalić, kiedy sztuczna inteligencja może wydać Pieniądz ze Skarbca na natychmiastową
rekrutację jednostki zamiast przeznaczyć produkcję miasta na budowę. Decyzja ma
jednoznacznie określić priorytet budowy, warunki zakupu, rezerwę Skarbca i limit
zakupów na turę.

## Dlaczego teraz

Bez tej decyzji implementacja może niejawnie zmienić ekonomię sztucznej inteligencji:
pełny zakup tworzy stały odpływ Pieniądza, a warunkowy rush uruchamia go tylko w
określonych sytuacjach. Temat dotyka zarówno głównych cywilizacji sztucznej
inteligencji, jak i miast-państw, więc potrzebny jest jeden kanon przed zmianą
planera produkcji.

## Opcje

### A — Pełny zakup jednostek ze Skarbca przed budową

**Co w grze:** gdy sztuczna inteligencja ma dostępną jednostkę, Manpower, wymagany
surowiec i wystarczający Pieniądz, zakup ze Skarbca ma pierwszeństwo przed rozpoczęciem
budowy. Nie wymaga wojny ani osobnego sygnału zagrożenia; rezerwa Skarbca i limit
zakupów na turę nadal chronią gospodarkę.

**Za:**

- Wojsko sztucznej inteligencji rośnie także w czasie pokoju i nie zależy od
  jednego warunku „w stanie wojny”.
- Zasada jest prosta do audytu: dostępne środki i jednostka oznaczają zakup przed
  budową.

**Przeciw:**

- Stały priorytet wojska może wypierać budynki, ulepszenia i rozwój gospodarczy.
- Wysoki Skarbiec może powodować przewidywalny, powtarzalny odpływ Pieniądza
  nawet wtedy, gdy armia nie jest potrzebna.

### B — Warunkowy rush tylko przy wojnie lub realnym zagrożeniu

**Co w grze:** budowa pozostaje domyślnym działaniem. Zakup ze Skarbca uruchamia się
tylko przy wojnie albo potwierdzonym zagrożeniu, po sprawdzeniu Manpower, kosztu
surowcowego, rezerwy Skarbca i limitu zakupów na turę. Poza tymi warunkami sztuczna
inteligencja buduje normalnie.

**Za:**

- Chroni rozwój gospodarczy w pokoju i wydaje Pieniądz wtedy, gdy wojsko jest
  faktycznie potrzebne.
- Rozszerza istniejący, już testowalny wzorzec `shouldAIRushBuyUnit` zamiast
  zastępować nim cały planer budowy.

**Przeciw:**

- Sztuczna inteligencja może wejść w wojnę z małą armią, jeśli zagrożenie zostanie
  wykryte dopiero po rozpoczęciu konfliktu.
- Potrzebuje jednoznacznego predykatu zagrożenia oraz testów granicznych, aby nie
  kupować przy fałszywym alarmie.

### C — Hybrydowy zakup awaryjny: wojna/zagrożenie i brak sensownej budowy

**Co w grze:** budowa pozostaje pierwsza. Zakup ze Skarbca jest dozwolony tylko,
gdy występuje wojna lub realne zagrożenie **oraz** miasto nie ma kwalifikującej się
budowy do rozpoczęcia albo bieżąca kolejka budowy jest zablokowana. Gdy budynek lub
ulepszenie jest dostępne, sztuczna inteligencja zachowuje produkcję na budowę.

**Za:**

- Łączy obronę awaryjną z ochroną rozwoju: Skarbiec nie wypiera działającej,
  sensownej budowy.
- Ogranicza liczbę zakupów i łatwiej utrzymać stabilny bilans Pieniądza w czasie
  pokoju oraz wojny.

**Przeciw:**

- Jednostka może przyjść za późno, bo zakup czeka na brak budowy zamiast reagować
  od razu na sytuację militarną.
- Reguła ma więcej warunków i może różnić się od oczekiwanego priorytetu wojskowego
  w miastach-państwach.

## Rekomendacja

**B — warunkowy rush tylko przy wojnie lub realnym zagrożeniu.** Zachowuje istniejący
model rezerwy Skarbca i limitu zakupów, nie wypiera automatycznie budowy oraz nie
zakłada pełnego zakupu bez decyzji produktowej.

## Ask

`R-AI-MP-REKRUTACJA-SKARBIEC-ZAMIAST-BUDOWY-Q1` — wybierz:  
**A — pełny zakup przed budową** · **B — warunkowy rush (rekomendacja)** · **C — rush tylko przy zagrożeniu i braku budowy**

## Kontrakt po decyzji

Po odpowiedzi pełnym ID i literą należy dopiero ustalić w kodzie:

- dokładny zakres ownerów (główne cywilizacje AI oraz miasta-państwa),
- źródło sygnału wojny/zagrożenia,
- rezerwę Pieniądza i limit zakupów na turę,
- kolejność bramek Manpower, surowca, kosztu zakupu i budowy,
- testy potwierdzające, że zakup nie pobiera środków bez spełnienia warunków i nie
  usuwa istniejącego planowania budowy.

