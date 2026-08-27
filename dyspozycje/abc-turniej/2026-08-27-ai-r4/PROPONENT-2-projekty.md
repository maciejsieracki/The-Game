# Proponent 2 — projekty ABC, runda 4 tematu R-AI-WYRAB-PRZY-RZECE-FARMY-Q1

**Autor:** Proponent 2 (turniej C-018), model Sonnet 5, praca niezależna — bez podglądu
projektu Proponenta 1. Podstawa: surowe fakty z dyspozycji + weryfikacja własną ręką w
raportach rundy 3 (`01-operator-runda3.md`, `03-final-control-runda3.md`,
`02-evaluator-runda3.md` w `dyspozycje/autobot/runs/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1/` na
gałęzi tematu) i w kodzie (`gra/src/main.ts:27192` `skipWyrab: true`,
`gra/src/game/ai.ts:1999` `skipWyrab: false`). Liczby w obu projektach zgadzają się z
trzema niezależnymi pomiarami (Operator/Evaluator/Final Control).

Obie decyzje z poprzednich rund tego tematu traktuję jako wiążące i NIE podważam ich w
treści pytań: (1) wycinać las pod farmę przy rzece mimo negatywnego bilansu pozostałych
zasobów — decyzja Q1 rundy 1; (2) domykać heks tylko tym, co daje plon, z posterunkiem i
fortem poza tą sekwencją — wariant W-B rundy 2. Oba pytania niżej dotyczą tego, co zostało
świadomie zostawione otwarte przy tych decyzjach.

---

## PYTANIE 1 — `R-AI-WYRAB-PRZY-RZECE-FARMY-R4-Q1`

### Sytuacja

Zgodziłeś się już wcześniej, żeby komputerowe cywilizacje wycinały las pod farmy przy
rzece, mimo że to kosztuje inne zasoby — i żeby przy tym budowały gospodarkę
**równomiernie**, a nie tylko pod jedzenie. Po wdrożeniu obu tych decyzji okazuje się, że
jedzenie odzyskane dzięki wycince pokrywa dziś **mniej niż połowę** tego, co gospodarka
straciła w poprzednim kroku — trzy niezależne pomiary dają wynik między 42% a 46%
(w jednym dokładniejszym modelu terenu nawet mniej: 32%). Powód nie jest błędem: duża
część rozkazów budowy nadal idzie w rzeczy, które podnoszą inne wskaźniki gospodarki
(handel, infrastrukturę), ale nie dają ani grama jedzenia — to jest właśnie ten wymóg
„buduj równomiernie", który sam ustaliłeś w poprzedniej rundzie.

**Ważne:** mechanizm, który o tym decyduje, jest **wspólny** dla komputerowych
cywilizacji (przeciwników) i dla opcjonalnego automatu, który może budować w miastach
samego gracza — każda zmiana w tym pytaniu obejmie **obie strony naraz**, nie da się
przyciąć wyłącznie przeciwnikom.

### Cel pytania

Zdecydować, czy warto zawęzić wymóg „buduj równomiernie" (i o ile), żeby odzyskane
jedzenie z decyzji o wycince przekroczyło połowę, czy zostawić wymóg w pełnej mocy i
zaakceptować obecny, niższy odzysk na stałe.

### Dlaczego teraz

Temat stoi w miejscu — czwarta z pięciu dozwolonych rund nie może ruszyć bez tej
decyzji, bo dalsze dostrajanie liczb bez wiedzy, czy w ogóle wolno ruszać ten wymóg,
byłoby zgadywaniem.

### Warianty

**Wariant A — nic nie przycinaj.** Wymóg „buduj równomiernie" zostaje w pełnej mocy,
tak jak ustaliłeś w poprzedniej rundzie, dla obu ścieżek AI. Odzysk jedzenia z decyzji o
wycince zostaje na stałe poniżej połowy — to jest cena utrzymania równomiernej
gospodarki.

- Za (1): W pełni honoruje Twoją własną, świeżo podjętą decyzję o równomiernej
  rozbudowie — nic się nie cofa.
- Za (2): Gospodarka obu ścieżek AI zostaje zróżnicowana; zero ryzyka powrotu do
  jednostronnego, zdegenerowanego wzorca budowy, który już raz odrzuciłeś.
- Przeciw (1): Decyzja o wycince lasu przy rzece przynosi mniej niż połowę obiecanego
  zwrotu w jedzeniu — na trzech niezależnych pomiarach, nie na jednym.
- Przeciw (2): Koszt wycięcia lasu (drewno spadło wyraźnie) okazuje się kupować bardzo
  niewiele jedzenia netto — słaby bilans dla decyzji, która miała dawać więcej jedzenia.

**Wariant B — przytnij kilka rodzajów budowli bez jedzenia.** Kilka konkretnych,
najliczniej budowanych rodzajów ulepszeń, które nie dają jedzenia (m.in. jeden
gospodarczy, drogi, jeden surowcowy), traci priorytet na rzecz farm i innych ulepszeń
dających jedzenie — dla obu ścieżek AI naraz. To **wprost cofa część** wymogu „buduj
równomiernie", który sam ustaliłeś w poprzedniej rundzie, żeby odzysk jedzenia
przekroczył połowę.

- Za (1): Odzysk jedzenia z decyzji o wycince przekracza połowę z zapasem — decyzja o
  wycince zaczyna się realnie opłacać.
- Za (2): Gospodarka AI wraca do priorytetu, który pierwotnie uzasadniał samą decyzję o
  wycince (więcej jedzenia), zamiast rozjeżdżać się w stronę celów pobocznych.
- Przeciw (1): To jest dosłowne cofnięcie części własnej decyzji z poprzedniej rundy —
  wracasz do mniej zróżnicowanej gospodarki, którą sam wcześniej odrzuciłeś w wersji
  skrajnej.
- Przeciw (2): Ponieważ mechanizm jest wspólny, ten sam efekt dotknie też opcjonalny
  automat budujący w miastach samego gracza — nie tylko przeciwników — zmniejszając
  różnorodność budowli również tam, gdzie gracz go włączy.

**Wariant C — przytnij tylko jeden, najliczniejszy rodzaj budowli bez jedzenia.**
Mniejsze cofnięcie wymogu równomierności niż w wariancie B: tylko jeden rodzaj ulepszeń
traci priorytet, tyle, żeby odzysk jedzenia ledwie przekroczył połowę, reszta wymogu
zostaje nietknięta.

- Za (1): Mniejsze naruszenie wymogu „buduj równomiernie" niż wariant B — większość
  zróżnicowania gospodarki zostaje.
- Za (2): Łatwiej to później cofnąć albo pogłębić, bo zmiana jest jedną, wąską decyzją,
  nie pakietem kilku naraz.
- Przeciw (1): Nadal jest to cofnięcie tego samego wymogu, tylko mniejsze — nie unika
  problemu z wariantu B, jedynie go zmniejsza.
- Przeciw (2): Zapas ponad połowę jest cienki — przy innej mapie albo innym rozstawieniu
  miast wynik może z powrotem spaść poniżej połowy, bo margines jest węższy niż w B.

### Rekomendacja

**Typowana: B — ale z NISKĄ pewnością.** Uzasadnienie: to jest dokładnie kategoria
„balans gospodarki/trudności AI", w której profil decyzyjny ma **najmniejszą moc
przewidywania** — na sześciu dotychczasowych pytaniach z tej kategorii większość
rozstrzygnięć odbiegała od rekomendacji AI, a przy balansie zwykle wracasz do własnej
oceny po zagraniu, nie do gotowej litery. Dwa słabsze sygnały idą w stronę B: nie
akceptowałeś dotąd „zostawmy tak jak jest / zmierzone i tyle" jako samodzielnego
uzasadnienia, gdy problem był już zdiagnozowany liczbami (co przemawia przeciwko
wariantowi A) — a przy wyborze między połówkowym a pełniejszym zakresem zmiany zwykle
wybierałeś zakres pełniejszy, nawet kosztem większej ingerencji (co stawia B przed C).
Ale w tej konkretnej kategorii te sygnały są słabe, nie mocne — traktuj typowanie jako
najsłabsze z całego turnieju.

<details>
<summary>Odnośnik techniczny (nie część treści pytania)</summary>

Pomiar rundy 3: odzysk 42,2% (Operator, `op3-pomiar-po.txt`), 42,8% harness / 32,1%
model wierny terytorium (Evaluator), 46,0% (Final Control, `fc3-kronika-trzy-stany.cjs`).
Kandydaci do przycięcia z liczbami sztuk: `warzelnia_soli` 69–81, `droga`+
`droga_brukowana` 48–49, `glinianka` 27–29 (rozbieżność sztuk między pomiarami — różne
ziarna). Rozkład: samo W-B daje +154 (26,0%), wyrąb dokłada +96; reszta 200 z 600
rozkazów idzie w ulepszenia o zerowej/znikomej delcie żywności. Mechanizm wspólny:
`ULEPSZENIA_FOCUS_ZROWNOWAZONE` (profil „Zrównoważona" AI GRACZA) to ta sama stała co
lista priorytetów AI CYWILIZACJI — potwierdzone w raportach rundy 3, nie moje ustalenie.
Wzorce profilu: §3.3 (balans AI — najmniejsza moc predykcyjna), §3.1 (odrzuca
„poczekajmy"), §3.2 (wybiera pełny zakres nad połówkowym).

</details>

---

## PYTANIE 2 — `R-AI-WYRAB-PRZY-RZECE-FARMY-R4-Q2`

### Sytuacja

Wcześniej zgodziłeś się, żeby komputerowe cywilizacje wycinały las pod farmę przy
rzece, mimo zmierzonych strat w innych zasobach (mniej pracy, mniej handlu, wyraźnie
mniej drewna) — bo to daje więcej jedzenia. Ta decyzja została dotąd wprowadzona
**wyłącznie** dla komputerowych przeciwników. Opcjonalny automat, który może budować w
imieniu gracza w jego własnych miastach, nigdy nie wycina lasu pod farmę — nawet jeśli
gracz z tego automatu korzysta na wszystkich swoich profilach budowy. Nie zapadła
wcześniej wyraźna decyzja, czy tak miało zostać, czy to po prostu nie zostało
rozstrzygnięte przy okazji pierwszej decyzji.

### Cel pytania

Zdecydować, czy automat budujący w imieniu gracza ma też wycinać las pod farmę przy
rzece, tak jak robią to dziś komputerowi przeciwnicy, czy ma zostać przy obecnym,
ostrożniejszym zachowaniu — czy dać graczowi możliwość wyboru.

### Dlaczego teraz

Ten temat zamyka się rundą 4 lub 5. Bez tej decyzji zostaje trwała, nigdzie nie
zapisana asymetria między tym, co robią przeciwnicy, a tym, co robi automat gracza —
integracja tematu bez tej odpowiedzi zostawiłaby zachowanie gry nieustalonym w tym
punkcie na stałe.

### Warianty

**Wariant A — automat gracza też wycina.** Jeśli gracz korzysta z automatu budowy w
swoich miastach, ten automat zacznie — tak jak dziś przeciwnicy — wycinać las pod
farmę przy rzece, z tymi samymi, już zmierzonymi skutkami (więcej jedzenia, mniej
pracy/handlu/drewna).

- Za (1): Gracz korzystający z automatu nie jest w gorszej pozycji niż komputerowi
  przeciwnicy, którzy już stosują tę taktykę — równe zasady dla obu stron.
- Za (2): Konsekwentnie stosuje decyzję „wycinać mimo to", którą już raz podjąłeś,
  zamiast po cichu zwalniać z niej jedną stronę rozgrywki bez wyjaśnienia.
- Przeciw (1): Gracz korzystający z automatu zobaczy, że ten zaczyna wycinać jego własne
  lasy i budowle leśne bez pytania go wprost — może to odebrać jako utratę kontroli nad
  własną gospodarką.
- Przeciw (2): Te same negatywne skutki uboczne, które już zmierzono u przeciwników
  (mniej pracy, mniej handlu, wyraźnie mniej drewna), trafią teraz też we własne miasta
  gracza, nie tylko w jego rywali.

**Wariant B — automat gracza zostaje jak jest.** Automat gracza nadal nigdy nie wycina
lasu pod farmę; gracz może to zrobić sam, ręcznie, jeśli chce. Taktykę automatycznie
stosują wyłącznie komputerowi przeciwnicy.

- Za (1): Zachowuje pełną kontrolę gracza nad własną gospodarką — nic się nie zmienia
  bez jego wyraźnej, ręcznej decyzji.
- Za (2): Zero ryzyka niespodzianki w toczących się już rozgrywkach — zachowanie
  automatu gracza pozostaje dokładnie takie, do jakiego gracz już przywykł.
- Przeciw (1): Utrwala trwałą przewagę komputerowych przeciwników — mają dostęp do
  taktyki dającej więcej jedzenia, z której automat gracza nigdy nie skorzysta.
- Przeciw (2): Ta sama decyzja „wycinać mimo to" zostaje po cichu zastosowana tylko po
  jednej stronie rozgrywki, mimo że nigdy wprost nie powiedziano, że miała dotyczyć
  tylko przeciwników.

**Wariant C — zrób z tego wybór gracza.** Wycinanie lasu pod farmę w automacie gracza
staje się ustawieniem, które sam gracz może włączyć albo wyłączyć — widoczne i zawsze
zmienialne w jego opcjach.

- Za (1): Daje graczowi wybór zamiast narzucania z góry jednej odpowiedzi za niego —
  każdy sam ocenia, czy ten kompromis (więcej jedzenia za mniej drewna) mu odpowiada.
- Za (2): Nie zamyka tematu sztywno w żadną stronę — łatwo to później dostroić bez
  kolejnej decyzji zmieniającej domyślne zachowanie gry.
- Przeciw (1): To dodatkowa rzecz do zbudowania i wytłumaczenia graczowi, zamiast prostej
  odpowiedzi na pytanie, które już raz padło przy przeciwnikach.
- Przeciw (2): Nie rozstrzyga niczego wprost — większość graczy nie będzie wiedziała, czy
  włączyć taką opcję, dopóki ktoś nie podejmie tej samej decyzji za nich tak czy inaczej;
  problem wraca pod inną postacią, tylko przesunięty na gracza.

### Rekomendacja

**Typowana: A.** Uzasadnienie: to pytanie dotyczy spójności decyzji, którą już raz
podjąłeś („wycinać mimo to"), a nie nowego wyboru balansu od zera — więc pasują tu dwa
mocniejsze wzorce z profilu, nie ten najsłabszy (§3.3). Po pierwsze, konsekwentnie
odrzucałeś dotychczas opcje w rodzaju „poczekajmy / zostawmy per decyzję gracza" tam,
gdzie problem był już zdiagnozowany i dane już zmierzone (§3.1) — a wariant C jest
właśnie odłożeniem tej samej decyzji na gracza zamiast jej podjęcia. Po drugie, między
zakresem częściowym (zostawić wyjątek dla jednej strony) a pełnym/systematycznym
(zastosować decyzję jednolicie wszędzie, gdzie dotyczy) zwykle wybierałeś zakres pełny,
nawet kosztem większej zmiany (§3.2) — a wariant B jest właśnie nieuzasadnionym,
częściowym wyjątkiem od decyzji już podjętej. Pewność średnia: to nie jest czysta
naprawa techniczna o jednoznacznej diagnozie (§3.4, najwyższa zgodność), bo ma realny
skutek dla tego, co gracz zobaczy w swojej własnej rozgrywce — stąd nie najwyższa
możliwa pewność, ale wyraźnie wyższa niż w pytaniu 1.

<details>
<summary>Odnośnik techniczny (nie część treści pytania)</summary>

`gra/src/main.ts:27192` przekazuje `skipWyrab: true` do wspólnego mechanizmu wyboru
ulepszeń używanego przez automat gracza; `gra/src/game/ai.ts:1999` przekazuje
`skipWyrab: false` dla komputerowych cywilizacji — potwierdzone czytaniem obu plików i
asercją bramki tematu (`ai2-heks-po-heksie-test`, asercja L). Zmiana wymaga rozszerzenia
allowlisty rundy 4 o tę jedną linię w `main.ts`, plik dotąd poza zakresem tematu.
Zmierzone skutki uboczne wycinki u przeciwników (runda 3): `tartak` 69→22,
`oboz_lowiecki` 71→23, drewno terytorium 2785→2065. Wzorce profilu: §3.1 (odrzuca
„poczekajmy/zostawmy komuś innemu" przy zdiagnozowanym problemie), §3.2 (wybiera pełny,
jednolity zakres nad częściowym wyjątkiem).

</details>

---

## Samokontrola — test zrozumiałości §10a (obie pytania)

1. **Na głos, bez kontekstu:** oba pytania czyta się jako pytania o grę („czy komputer i
   automat gracza mają wycinać las pod farmę", „czy przyciąć inne budowle, żeby było
   więcej jedzenia") — sensowne dla kogoś spoza projektu.
2. **Brak nazw własnych w treści:** żadna nazwa pliku, funkcji, flagi ani numer
   paragrafu nie występuje w Sytuacji/Celu/Wariantach — wszystkie poszły do sekcji
   „Odnośnik techniczny" pod każdym pytaniem.
3. **Warianty różnią się skutkiem, nie sposobem wykonania:** Pytanie 1 — ile
   zróżnicowania gospodarki AI zostaje vs ile jedzenia wraca. Pytanie 2 — czy własne
   miasta gracza tracą las automatycznie, czy to zostaje decyzją ręczną/opcjonalną
   gracza.
   **Sprawdzian usunięcia nazw własnych:** po usunięciu wszystkich nazw z treści oba
   pytania nadal znaczą to samo — potwierdzone przy pisaniu, nie tylko deklarowane.

Żaden wariant w żadnym z dwóch pytań nie jest pozorny — A/B/C w Pytaniu 1 różnią się
stopniem cofnięcia wymogu równomierności (żaden/duży/mały) i wynikającym odzyskiem
jedzenia; A/B/C w Pytaniu 2 różnią się tym, kto i jak decyduje o wycince w miastach
gracza (automatycznie tak/automatycznie nie/decyzja gracza) — każdy z sześciu wariantów
ma realnego adresata, który mógłby go racjonalnie wybrać.
