# PROBLEMY I ROZWIĄZANIA — 2026-07-25

Rejestr błędów napotkanych w sesji budynkowej/ekonomicznej 2026-07-25 i sposobu ich naprawy, w formacie
**objaw → przyczyna → rozwiązanie → czego to uczy** — żeby te same wzorce błędów nie powtórzyły się w przyszłych
sesjach. Powiązane decyzje produktowe (co budynek MA robić) są w
[`DECYZJE-BUDYNKI-2026-07-25.md`](DECYZJE-BUDYNKI-2026-07-25.md); ten plik dotyczy tego, co było ROZJECHANE
między danymi/UI a silnikiem.

---

## 1. Plony budynków nie docierały do silnika

**Objaw.** W pełni zabudowane miasto epoki Żelaza traciło ok. **86 pkt Pracy/turę**, **78 pkt Kultury/turę**,
**50 pkt Pieniądza/turę**, **14 pkt Nauki/turę** i **9 pkt Żywności/turę** — mimo że wszystkie budynki w danych
deklarowały te bonusy.

**Przyczyna.** `cityYieldPerTurn()` poprawnie sumuje Pracę, Pieniądz, Żywność, Naukę i Kulturę ze wszystkich
budynków miasta — ale **wszystkie trzy miejsca, które ją wywołują, przekazywały pustą tablicę budynków**:
`noBuildings` w `gra/src/game/turn-economy.ts:1079` i `:1269`, oraz literalne `[]` w `gra/src/ui/cityPanel.ts:797`.
Stan trwał od **2026-07-09**.

**Rozwiązanie.** W toku (nie domknięte w tej sesji dokumentacyjnej — do wykonania w kolejnej sesji kodowej):
podpiąć realną listę budynków miasta we wszystkich trzech miejscach wywołania.

**Czego to uczy.** Parametr może być „żywy" w definicji funkcji i **martwy w praktyce**, jeśli wywołujący podaje
pustą listę. **Audyt musi iść od miejsca wywołania, nie od definicji funkcji** — czytanie samej `cityYieldPerTurn()`
nigdy by tego nie wykryło, bo funkcja jest poprawna.

---

## 2. Pałac nigdy nie pojawiał się na liście produkcji

**Objaw.** Budynek startowy (Pałac) nie dało się w ogóle zbudować/wybrać z listy produkcji miasta.

**Przyczyna.** Budynki z pustym wymaganiem technologicznym (`techUnlock: '-'`) nie miały obsługi znacznika
pustego w filtrze dostępności produkcji — jednostki miały tę obsługę, budynki nie.

**Rozwiązanie.** Naprawione przy okazji podziału budynków na stolicę i regiony (§3 w pliku decyzji).

**Czego to uczy.** Asymetria obsługi między dwiema rodzinami danych (jednostki vs budynki), które z pozoru
współdzielą ten sam mechanizm (wymóg technologii), potrafi ukryć błąd na lata — trzeba sprawdzać OBA tory,
nie zakładać, że skoro działa dla jednostek, działa też dla budynków.

---

## 3. Mnożnik budynków był martwy albo działał nie tam, gdzie obiecywał

**Objaw.** Pięć budynków wojskowych miało w UI chip „×N mnożnik" bez żadnego realnego efektu. Akademia,
Pretorium i Karawanseraj doliczały deklarowany procent do **Pracy**, mimo że ich opisy obiecywały bonus do
nauki, podatków i handlu odpowiednio.

**Przyczyna.** Pole `mnoznik` w danych budynków nigdy nie miało spójnej definicji tego, co ma mnożyć — część
budynków w ogóle go nie czytała (martwe), część czytała go, ale zawsze kierowała efekt do jednego, uniwersalnego
strumienia (Pracy), niezależnie od deklarowanej roli budynku.

**Rozwiązanie.** Mnożnik usunięty z Pracy. Zastąpiony **dwiema ścieżkami ulepszeń jednostek** (Pancerz i
Parametry miękkie — patrz `DECYZJE-BUDYNKI-2026-07-25.md` §6), które mają jasno zdefiniowany cel i nie
udają uniwersalnego bonusu do Pracy.

**Czego to uczy.** Jedno generyczne pole (`mnoznik`) użyte do kilku różnych, niepowiązanych mechanik (nauka,
podatki, handel, siła jednostek) bez typowania „mnożnik CZEGO" nieuchronnie rozjeżdża się z opisem w danych —
stąd też nowa zasada procesu: **każda liczba musi mieć nazwany parametr** (patrz `PAMIEC-ROBOCZA-CIV.md` §1a).

---

## 4. Obrona miasta liczyła się podwójnie

**Objaw.** Mury i Cytadela dawały obronę miasta liczoną dwa (a nawet trzy) razy.

**Przyczyna.** Mury i Cytadela miały **płaski bonus `obrona`** w danych budynków **ORAZ** osobny procent
w `miasto-params.json`. Do tego w `gra/src/battle/battleScene.ts` siedział **trzeci, zaszyty na stałe mnożnik
3.0**, niezależny od obu powyższych.

**Rozwiązanie.** Obrona miasta ustandaryzowana jako **wyłącznie procentowa** (Mury +200%, Cytadela +100%, nowa
Baszta +100% = suma +400% — patrz `DECYZJE-BUDYNKI-2026-07-25.md` §5). Płaskie pola `obrona` wyzerowane,
zaszyta stała 3.0 w `battleScene.ts` usunięta.

**Czego to uczy.** Ten sam efekt gameplayowy (obrona miasta) miał **trzy niezależne źródła prawdy** w trzech
różnych plikach — żadne z nich nie wiedziało o pozostałych. Przy wprowadzaniu nowego mnożnika/bonusu trzeba
sprawdzić WSZYSTKIE miejsca, które już liczą ten sam efekt, nie tylko dane budynku.

---

## 5. Cegła blokowała pół gry

**Objaw.** Miasto bez rzeki (czyli bez dostępu do gliny) nie mogło **nigdy** zbudować sześciu budynków epoki
Brązu ani żadnego budynku epoki Żelaza.

**Przyczyna.** Cegła powstaje wyłącznie w Cegielni z gliny, a glina występuje tylko na lądzie z rzeką — i
**nie przechodziła przez szlaki handlowe** (lista `TRADE_ROUTE_RESOURCE_KEYS` jej nie obejmowała). Sześć
budynków Brązu i wszystkie budynki Żelaza kosztowały cegłę, więc miasto bez rzeki było odcięte od nich na zawsze,
niezależnie od dyplomacji czy handlu.

**Rozwiązanie.** Cegła znika z kosztów epoki Brązu (zastąpiona drewnem+kamieniem, patrz
`SPEC-KOSZTY-SUROWCOWE-BUDYNKOW.md`) i wchodzi do wymiany na szlakach handlowych (Pytanie 40 = B).

**Czego to uczy.** Zasób, który jest (a) wymagany przez wiele budynków ORAZ (b) niedostępny przez handel,
tworzy twardą, niemożliwą do obejścia blokadę dla części map — trzeba sprawdzać dostępność zasobu przez
WSZYSTKIE kanały (teren, handel, konwersja), zanim uczyni się go kosztem obowiązkowym.

---

## 6. Generator map łamał własną regułę

**Objaw.** Reguła „glina tylko na lądzie z rzeką" bywała złamana przez sam generator mapy.

**Przyczyna.** Ścieżka „fair play" dokładająca złoża (konsolidacyjna ścieżka `ensureDepositGridCoverage` →
`forceDepositInCell` → `pickDepositBootstrapHex`) wymuszała glinę na heksie **bez rzeki**, żeby zapewnić pokrycie
złóż. W kodzie nazwano to „akceptowalnym wyjątkiem" — **bez żadnej decyzji właściciela** stojącej za tym zapisem.

**Rozwiązanie.** Naprawiony **generator**, nie test — bootstrap teraz zwraca `null`, gdy w danej komórce mapy
nie ma heksu zgodnego z regułą (dopuszczalne, bo fair-play wymaga pokrycia ≥85%, nie 100%). Asercja testu
**nie została rozluźniona**. `logic-test.cjs` wrócił do **208/208** (naprawa `R-MAPGEN-GLINA`, 2026-07-25).

**Czego to uczy.** Komentarz w kodzie nazywający coś „akceptowalnym wyjątkiem" bez odniesienia do konkretnej
decyzji właściciela jest **podejrzany z definicji** — to sygnał, że ktoś złamał regułę, żeby przepchnąć inny cel
(tu: pokrycie złóż), i usprawiedliwił to po fakcie. Reguła (nie test) ma być źródłem prawdy.

---

## 7. Jednostka unikalna nie pojawiała się w produkcji mimo poprawnego wpisu

**Objaw.** Nowa jednostka unikalna cywilizacji (np. Łucznik nubijski dla Egiptu) miała poprawny wpis
„W zamian za" w `units.json`, ale **nie pojawiała się w liście produkcji miasta**.

**Przyczyna.** Pole „W zamian za" w `units.json` to tylko **połowa** mechanizmu — produkcja filtruje dodatkowo
przez listę `bonusy[].typ = "jednostka_specjalna"` w `civs.json`. Bez wpisu w OBU plikach jednostka jest
niewidoczna, mimo że dane wyglądają na kompletne.

**Rozwiązanie.** Dopisanie nazwy jednostki do listy `bonusy[].typ = "jednostka_specjalna"` danej cywilizacji
w `civs.json` (precedens: Sumerowie mają tam już Łucznika sumeryjskiego i akadyjskiego).

**Czego to uczy.** **Dodając jednostkę unikalną, trzeba dopisać ją w DWÓCH plikach** (`units.json` +
`civs.json`) — sam wpis w jednym z nich wygląda kompletnie, ale silnik wymaga obu.

---

## 8. Tarcza Zulu miała złe proporcje

**Objaw.** Tarcza jednostki Zulu (Izijula) miała wysokość tułowia **2,07** zamiast normy **1,3–1,6**.

**Przyczyna.** Model budowany z osiemnastu osobno hardkodowanych offsetów geometrii — łatwo o rozjazd proporcji
przy takiej liczbie niezależnych liczb.

**Rozwiązanie.** Przeskalowanie całej podgrupy tarczy **jednym współczynnikiem** wokół punktu chwytu, zamiast
przeliczania osiemnastu hardkodowanych offsetów z osobna.

**Czego to uczy.** Model 3D złożony z wielu niezależnie hardkodowanych liczb jest kruchy przy poprawkach —
jeden zbiorczy współczynnik skalowania wokół sensownego punktu odniesienia (tu: punkt chwytu) jest odporniejszy
na przyszłe korekty niż osiemnaście osobnych wartości.

---

## 9. Anachronizmy w danych

**Objaw.** Trzy budynki stały w niewłaściwych epokach historycznych: Karawanseraj (budynek średniowieczny,
szlaki karawanowe X–XV w.) w epoce Brązu; Lazaret w epoce, której gra jeszcze nie ma; Trybunał (instytucja
rzymska) w epoce Brązu.

**Rozwiązanie.** Karawanseraj i Lazaret usunięte z gry całkowicie (Karawanseraj — decyzja z dziś, do wykonania;
Lazaret — już wykonane, commit `3228fb1`). Trybunał zostaje, ale jako budynek sądowy obok Sądu, nie jako
osobny anachronizm do maskowania.

**Czego to uczy.** Budynek/jednostka wpisana do danych bez sprawdzenia realnej epoki historycznej blokuje grę
na dwa sposoby na raz: (a) gracz widzi anachronizm, (b) budynek okazuje się niedostępny, bo epoka gry kończy
się wcześniej niż epoka, do której faktycznie należy — **zgodność historyczna to teraz warunek strategiczny**
(zasada zapisana w `KANAL-PRACA.md`, 2026-07-25), nie tylko kosmetyka.

---

## 10. Opisy w danych kłamały

**Objaw.** Pole `uwagi` Pretorium obiecywało „bonus do porządku przez garnizon" i „mnożnik % do przychodu
podatkowego" — **żadna z tych dwóch rzeczy nie istnieje w kodzie**. Sąd deklaruje „redukuje korupcję" —
korupcja w grze istnieje, ale **żaden budynek jej nie zmniejsza**.

**Przyczyna.** Pole opisowe (`uwagi`) było traktowane jako miejsce na zamierzony/aspiracyjny opis mechaniki,
nie jako odzwierciedlenie tego, co silnik faktycznie robi — i nie było procesu, który by to sprawdzał przy
zmianach silnika.

**Rozwiązanie.** Audyt martwych obietnic w danych (`dyspozycje/AUDYT-CIVPEDIA-MARTWE-OBIETNICE.md`,
`dyspozycje/AUDYT-MARTWE-PARAMETRY-BUDYNKOW.md`) + poprawka opisu Pretorium w ramach sprzątania §16/§18
(`DECYZJE-BUDYNKI-2026-07-25.md`).

**Czego to uczy.** **Opis w danych (`uwagi`) to nie dokumentacja silnika.** Traktowanie pola opisowego jako
źródła prawdy o mechanice (zamiast czytania kodu) prowadzi do mylenia gracza i przyszłych sesji — każda zmiana
mechaniki musi pociągać za sobą sprawdzenie, czy powiązany opis nadal jest prawdziwy.

---

## Wzorzec powtarzający się w problemach 1, 3, 4, 10

Cztery z dziesięciu problemów to ten sam wzorzec w różnych miejscach: **UI/dane obiecują coś, czego silnik nie
robi** (pusta lista budynków w wywołaniu; mnożnik bez zdefiniowanego celu; potrójne, niezależne liczenie obrony;
opisowe `uwagi` bez pokrycia w kodzie). Wniosek na przyszłość: przy każdym audycie ekonomii/budynków audyt musi
iść **od miejsca wywołania i od silnika w stronę danych**, nie odwrotnie — czytanie samych danych/opisów daje
fałszywe poczucie bezpieczeństwa.
