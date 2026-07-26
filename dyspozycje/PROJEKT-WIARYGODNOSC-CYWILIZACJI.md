# PROJEKT: Wiarygodność Cywilizacji

(MASTER, 2026-07-26 · zlecenie Macieja 2026-07-25 — „element wiarygodności obok Zaufania i Respektu,
mierzący jak często cywilizacja łamie zasady lub dotrzymuje słowa" · dokument projektowy, ZERO KODU ·
wykonawca wdrożenia: osobna sesja, na podstawie tego pliku, bez dopytywania)

Poprzedzone pełnym audytem istniejącego systemu dyplomacji (`gra/src/game/diplomacy*.ts` — 13 modułów,
5462 linii, `gra/src/types/diplomacy.ts`, `gra/data/diplomacy.json`, `gra/src/ui/diplomacy*.ts`,
fragmenty `main.ts` związane z dyplomacją). Wszystkie odwołania do kodu w tym dokumencie są realne —
sprawdzone przez czytanie plików, nie przez domysł.

---

## 0. Streszczenie

Dziś gra ma dwa wymiary relacji dyplomatycznej: **Zaufanie** (per para, wolnozmienne, „jak Cię lubię")
i **Respekt** (per para, ale w praktyce PRZELICZANY na żywo z relatywnej potęgi militarno-gospodarczej,
„jak bardzo się Ciebie boję/szanuję"). Żaden z nich nie odpowiada na pytanie Macieja: *czy ta
cywilizacja w ogóle DOTRZYMUJE SŁOWA*. **Wiarygodność** to nowy, trzeci wymiar — **globalny per
cywilizacja** (nie per para), wolnozmienny, **publiczny** (widoczny dla wszystkich, nie tylko strony
umowy), napędzany WYŁĄCZNIE zdarzeniami „dotrzymał/złamał", niezależny od siły militarnej czy
bieżących sympatii.

Kluczowe ustalenie z audytu: **duża część zdarzeń, których Wiarygodność miałaby dotyczyć, jest dziś
w kodzie zdefiniowana, ale NIGDY nie wywoływana** (`'zdrada'`, `'wspolny_wrog'`, `'pomoc_sojusznikowi'`,
`'wygrana_bitwa'`, `'przewaga_militarna'` — zero wywołań w `main.ts`, zweryfikowane grepem). To nie jest
problem tego projektu — to fakt, który ten projekt musi jawnie nazwać, bo część „haków" dla Wiarygodności
trzeba będzie dopiero dobudować, nie tylko podłączyć się pod istniejące.

---

## 1. Czym Wiarygodność różni się od Zaufania i Respektu

| Wymiar | Zakres | Co mierzy | Zmienność | Widoczność | Gdzie żyje dziś w kodzie |
|---|---|---|---|---|---|
| **Respekt** | per para, ale symetryczny („Ty patrzysz na mnie" + „ja patrzę na Ciebie" = 100) | Jak silny jestem WZGLĘDEM Ciebie TERAZ (moc militarna/gospodarcza/miasta/epoka) | Szybka — przelicza się **na żywo co turę** z `computePotegaNacji`, nie jest ledgerem zdarzeń | Per para (choć bazuje na obiektywnej potędze, która i tak jest publiczna) | `game/diplomacy.ts:1277` (`computePotegaNacji`), `:1320` (`computeRespekt`, wzór ratio-share: `round(100·potęga_self/(potęga_self+potęga_partner))`) |
| **Zaufanie** | per para (`RelacjaDyplomatyczna` między graczem A i B) | Jak bardzo Cię TERAZ lubię — nastawienie budowane wspólną historią z TOBĄ | Średnia — dryfuje co turę (`tickDiplomacy`) + skoki jednorazowe (`applyDiplomaticEvent`) | **Tylko strona pary** — inny gracz nie widzi Twojego Zaufania do kogoś trzeciego | `types/diplomacy.ts:59-103` (`RelacjaDyplomatyczna.zaufanie`), `game/diplomacy.ts:44-55` (`Relation`, slim), `main.ts:4116` (`diplomacyRelations: Map<string, Relation>`, klucz = para) |
| **Wiarygodność (NOWY)** | **globalny per cywilizacja** (nie para) | Twoja HISTORIA dotrzymywania słowa — fakty, nie sympatie | Wolna — tylko dyskretne zdarzenia „dotrzymał/złamał" + powolna regeneracja | **PUBLICZNA — widzi ją każda odkryta cywilizacja**, niezależnie czy miała z Tobą kiedykolwiek umowę | do zbudowania — patrz §7 |

**Kluczowa różnica w jednym zdaniu:** Respekt pyta „czy się Ciebie bać", Zaufanie pyta „czy Cię lubię
TERAZ (w tej jednej relacji)", Wiarygodność pyta „czy dotrzymujesz słowa W OGÓLE (wobec wszystkich)".
Zerwanie paktu z Grekami dziś obniża Zaufanie WYŁĄCZNIE w relacji gracz↔Grecja — Egipt, Rzym i Chiny
nic o tym „nie wiedzą" mechanicznie. Wiarygodność ma to zmienić: ten sam incydent ma osłabić Twoją
reputację u WSZYSTKICH, bo to fakt o Tobie, nie o relacji z jedną stroną.

**Uwaga porządkująca (żeby nie pomylić z istniejącym mechanizmem):** `civ-ai-data.ts` ma już statyczne
cechy archetypu per typ cywilizacji — `lojalnosc`, `pamietliwosc` (`game/civ-ai-data.ts:54-59`,
`DiplomacyPerNacjaRow`), wyświetlane jako tagi „Lojalny"/„Zdradziecki" w `diplomacy-display.ts:27-73`
(`TAG_RULES`). To są **stałe cechy charakteru per TYP cywilizacji** (np. wszyscy Zulusi mają tę samą
`lojalnosc` z Excela) — coś jak skłonność, nie historia. Wiarygodność to coś zupełnie innego: **dynamiczny
zapis FAKTYCZNYCH czynów TEJ KONKRETNEJ instancji cywilizacji w TEJ KONKRETNEJ partii**. Nie mylić i nie
zastępować jednego drugim.

---

## 2. Skala, wartość startowa, prezentacja

**Skala: 0–100** (spójna z Zaufaniem/Respektem — gracz już rozumie tę konwencję).

**Wartość startowa: 70** (nie 50) — REKOMENDACJA. Uzasadnienie: nowa cywilizacja zasługuje na domniemanie
uczciwości (jak w realnym świecie — nikt nie zaczyna jako podejrzany), a 70 daje zarówno margines do
wzrostu (do „Wzoru cnoty") jak i bufor do spadku zanim wpadnie w strefę kłopotów. Start=50 (środek skali)
byłby bardziej „neutralny", ale słabiej się gra — gracz startowałby psychologicznie w połowie strefy
„Chwiejny", co nie licuje z ideą, że trzeba ZASŁUŻYĆ na złą reputację.

**Etykiety słowne** (dokładnie te cztery, w tej kolejności — zaproponowane przez Macieja, przyjęte
wprost):

| Zakres | Etykieta | Znaczenie dla gracza |
|---|---|---|
| 0–24 | **Wiarołomny** | AI traktuje każdą propozycję z podejrzliwością; sojusze/pakty praktycznie niedostępne |
| 25–49 | **Chwiejny** | Historia ma rysy; umowy wymagają dodatkowych ustępstw (wyższe progi) |
| 50–74 | **Uczciwy** | Domyślny, „normalny" stan — start gry tu (70) |
| 75–100 | **Wzór cnoty** | Premia — łatwiej o sojusze, AI chętniej ufa nawet przy niskim bieżącym Zaufaniu |

**Prezentacja w UI** — patrz §7 (etap UI) po szczegóły plików; skrót koncepcji:
- **Globalny badge przy nazwie/tytule cywilizacji** (nie w sekcji „Relacje z Tobą", bo to nie jest
  atrybut relacji, tylko atrybut CYWILIZACJI) — w audiencji (`ui/diplomacyAudience.ts`) obok
  `da-civtitle` (linia 617 dla rozmówcy, 583 dla gracza), analogicznie do istniejącego paska Respekt
  ale WIZUALNIE odróżniony (inny kolor/ikona), żeby gracz nie pomylił „ile mnie lubi" z „czy dotrzymuje
  słowa".
- **Kolumna w rankingu Potęgi** (`ui/powerOverlayHud.ts:17-22`, `PowerRankingRow`) — bo to też jest
  globalna, porównywalna między cywilizacjami statystyka, tak jak Potęga.
- **Tooltip z liczbą zdarzeń** — analogicznie do `respektTooltipPl()` (`diplomacy-display.ts:192-194`)
  i do rejestru czynników `buildRelationBreakdown` (`game/diplomacy-factors.ts:147-188`, wzór „za co
  Cię lubią/nie lubią" — dla Wiarygodności potrzebny osobny, ale analogiczny rejestr, patrz §7).

---

## 3. Tabela zdarzeń — za co +, za co −

Wagi to **PROPOZYCJE do strojenia przez Macieja w playteście** (jak każdy parametr w `DIPLOMACY_PARAMS`).
Skala celowo MNIEJSZA niż jednorazowe delty Zaufania (które są per-para, -50..+15) — bo każde zdarzenie
Wiarygodności rezonuje jednocześnie u WSZYSTKICH odkrytych cywilizacji, więc pojedynczy incydent nie
powinien być tak drastyczny jak w relacji 1:1.

Kolumna **Status w kodzie**: ✅ ISTNIEJE = hak już działa, trzeba tylko DOPISAĆ wywołanie funkcji
Wiarygodności obok istniejącego; ❌ WYMAGA NOWEGO HAKA = zdarzenie nie jest dziś w ogóle wykrywane
przez silnik (albo typ eventu istnieje w `DiplomaticEvent`, ale nikt go nie wywołuje).

### 3.1 Negatywne (łamanie zasad)

| # | Zdarzenie | Waga (propozycja) | Status | Plik : funkcja | Uwagi |
|---|---|---|---|---|---|
| N1 | **ATAK Z ZASKOCZENIA — atak bez wypowiedzenia wojny** *(NIE „zdrada" — patrz §N1 spec)* (kontrahent zaatakowany mimo statusu ≠ 'wojna') | **−25** | ❌ WYMAGA NOWEGO HAKA | Event `'zdrada'` zdefiniowany w `game/diplomacy.ts:596-631` (typ) i `:699-703` (delta −50 Zaufania, ustawia `status='wojna'`) — **zero wywołań w `main.ts`** (potwierdzone grepem). Silnik dziś nie odróżnia „zaatakowałem bez ostrzeżenia" od zwykłego `wojna_wypowiedziana`. Trzeba znaleźć punkt inicjacji walki (combat entry point) i sprawdzić, czy dopuszcza atak na cel, z którym `getDiploRelation(a,b).status !== 'wojna'` — jeśli tak, to jest dokładnie ten hak. | Najcięższa pojedyncza kara — złamanie fundamentalnej reguły wojny |
| N2 | **Zerwanie traktatu WYMUSZONE wojną** (wypowiedzenie wojny mimo aktywnego NAP/sojuszu/otwartych granic z ofiarą) | **−18** (JEDNAKOWO dla gracza i AI — patrz §6 o parytecie) | ✅ ISTNIEJE (Zaufanie), Wiarygodność DOPISAĆ | `main.ts:8510-8521` (`breakTreatiesOnWar(a,b,breakerIsPlayer)`) → dziś aplikuje `'zlamana_obietnica'` (gracz, −40 Zaufania) / `'zlamana_obietnica_ai'` (AI, −20 Zaufania) przez `applyDiploEventTracked`. Wywoływane z: deklaracja wojny gracza (`main.ts:9031`), AI (`main.ts:14834`), kaskada obowiązków sojuszniczych (`main.ts:8550`). | To obejmuje też „atak na własnego sojusznika" (atak = wypowiedzenie wojny, `BREAK_ON_WAR` w `diplomacy-treaties.ts:239-247` zawiera oba typy sojuszu) |
| N3 | **Atak zaraz po podpisaniu pokoju** (nowa wojna z TĄ SAMĄ stroną < 10 tur od zawarcia pokoju) | dodatkowe **−12** (NA WIERZCHU kary N2/N1) | ❌ WYMAGA NOWEGO HAKA | Dziś pokój (`status='pokoj'`) nie jest `ActiveDeal` — nie ma pola `zawartaTura` jak traktaty (`diplomacy-treaties.ts:39-50`, `ActiveDeal.zawartaTura`). `'pokoj'` event aplikowany w `main.ts:7703` i `:9049`, ale bez zapisu KIEDY. Trzeba dopisać pole np. `pokojOdTury?: number` do `DiploPairMeta` (`game/diplomacy-pn-engine.ts:20-23`, dziś ma tylko `trustPnGainedThisTurn`/`dobraWolaRemainingTur`) i sprawdzać różnicę tur przy N1/N2. | Najbardziej „gracz to poczuje" zdarzenie — świeży pokój złamany w kilka tur |
| N4 | **Odmowa dołączenia do wojny sojuszniczej** (sojusznik NIE wypełnia obowiązku Sojuszu Pełnego/Defensywnego) | **−10** | ❌ WYMAGA NOWEGO HAKA (wykrycie już jest, kara nie) | `treatiesBrokenByRefusal()` (`game/diplomacy-treaties.ts:217-231`) i `applyAllianceObligationsOnWar` (`main.ts:8523-8577`) **już wykrywają** kto się nie stawił (`brokenTreatyIds`, linia 8560) i zrywają traktat — ale **nie aplikują dziś żadnej kary Zaufania/Wiarygodności** za samą odmowę, tylko usuwają sojusz. | Realna luka w istniejącym kodzie, niezależnie od tego projektu |
| N5 | **Dobrowolne zerwanie traktatu** (przycisk „Zerwij", bez wojny) | **−6** (traktat NAP/sojusz/granice/wasal) / **−4** (umowa handlowa, lżejsze) | ✅ ISTNIEJE (Zaufanie), Wiarygodność DOPISAĆ | `main.ts:8181-8205` (`breakTreatyVoluntarily(dealId)`) → `'zerwanie_traktatu'` (−15 Zaufania) lub `'zerwanie_handlu'` (−10 Zaufania) przez `applyDiploEventTracked` (linia 8193). | Świadoma decyzja BEZ przemocy — stąd lżejsza waga niż N2 |
| N6 | **Niedotrzymanie handlu cyklicznego** (brak dostawy z powodu braku zapasów, ≥3 tury z rzędu) | **−2** za próg (nie za pojedynczy pech) | ❌ WYMAGA NOWEGO HAKA | `main.ts:8595-8627` (`tickCyclicResourceTradeDeals`) — komentarz w kodzie wprost: „brak zapasów dawcy tę turę — pomijamy też zapłatę... deal NIE jest zrywany" (linia 8588-8590, 8616). **Zero kary dziś.** Trzeba dopisać licznik nieudanych dostaw per `HandelSurowiecCyklicznyItem` (rozszerzyć strukturę albo trzymać osobną mapę `dealId → nieudaneDostawyZRzedu`). | Próg 3 zapobiega karaniu za jednorazowy pech (np. wojna zjadła zapas) |
| N7 | **Nieautoryzowany przemarsz** (marsz przez cudze terytorium bez otwartych granic/prawa wojskowego) | **−2** jednorazowo przy wykryciu (NIE co turę) | ✅ ISTNIEJE (Zaufanie, per-turę) | `game/diplomacy-border-march.ts` (cała logika) + `main.ts:2605` (komunikat „Nieautoryzowany przemarsz: −X Zauf./para"). Dziś kara Zaufania nalicza się CO TURĘ obecności — Wiarygodność powinna dostać tylko JEDNORAZOWY odpis przy pierwszym wykryciu w danej „wizycie", inaczej zdominuje inne zdarzenia. | Najlżejsze przewinienie w tabeli — stąd też jedyne z zasadą „raz, nie co turę" |

### 3.2 Pozytywne (dotrzymywanie słowa)

| # | Zdarzenie | Waga (propozycja) | Status | Plik : funkcja | Uwagi |
|---|---|---|---|---|---|
| P1 | **Dotrwanie sojuszu do końca terminu** (traktat wygasł naturalnie, NIE zerwany) | **+8** | ❌ WYMAGA NOWEGO HAKA | `expireTreaties()` (`game/diplomacy-treaties.ts:155-157`) i `runDiplomacyTurnTick()` (`main.ts:8629-8637`) dziś **cicho usuwają** wygasły traktat (`activeDeals = expireTreaties(activeDeals, turn)`) — zero eventu. Wzorzec do naśladowania: main.ts już porównuje `dealsBeforeExpire` z `activeDeals` po filtrze (linia 8632-8636) żeby posprzątać `zlozeGrants` — dokładnie w tym miejscu dopisać wykrycie „ten traktat wygasł NATURALNIE" i naliczyć Wiarygodność. | Najcięższe zobowiązanie dotrzymane = największa pozytywna waga |
| P2 | **Dotrwanie NAP/umowy handlowej do końca terminu** | **+4** | ❌ WYMAGA NOWEGO HAKA (ten sam hak co P1) | jw. | Lżejsze zobowiązanie niż sojusz |
| P3 | **Spłata całego handlu cyklicznego** (≥90% zaplanowanych dostaw faktycznie zrealizowanych do wygaśnięcia) | **+5** | ❌ WYMAGA NOWEGO HAKA | Potrzebny licznik zrealizowanych dostaw (`result.moved > 0`, `main.ts:8616`) vs oczekiwanych — ten sam mechanizm co N6, ale liczony na koniec (przy wygaśnięciu deala z §P1/P2). | Nagroda symetryczna do kary N6 |
| P4 | **Wieloletni pokój** (30 kolejnych tur bez wojny z tą samą stroną, kamień milowy powtarzalny) | **+3** co 30 tur | ❌ WYMAGA NOWEGO HAKA (częściowo pokrewne istniejącemu) | `pokoj_zaufanie_perTura` (+1/turę, `game/diplomacy.ts:108`, naliczane w `tickDiplomacy` przez `resolvePokojTrustTier`, wołane z `main.ts:14731`) już nagradza Zaufanie CIĄGLE — ale nie ma jednorazowego „kamienia milowego" dla Wiarygodności. Wzorzec do naśladowania: zanik `urazyHistoryczne` co 20 tur (`turn % 20 === 0`, `game/diplomacy.ts:1425-1433`) — tu analogicznie `turn % 30 === 0` + licznik kolejnych tur pokoju per para (nowe pole w `DiploPairMeta`). | Wymaga licznika nieprzerwanych tur pokoju, nie tylko flagi |
| P5 | **Pomoc sojusznikowi w wojnie** (faktyczne dołączenie do wojny na wezwanie obowiązku sojuszniczego) | **+6** | ❌ WYMAGA NOWEGO HAKA (częściowo — wykrycie już istnieje) | Event `'pomoc_sojusznikowi'` zdefiniowany (`game/diplomacy.ts:69-70` param `pomocSojusznikowi_zaufanie=10`, `:722-725` w `applyDiplomaticEvent`) — **zero wywołań**. Miejsce wpięcia: `applyAllianceObligationsOnWar` (`main.ts:8523-8577`) już wie DOKŁADNIE kto faktycznie dołączył (`joinedWarOwnerIds.push(allyId)`, linie 8531/8556) — brakuje tylko wywołania `applyDiploEventTracked(...,'pomoc_sojusznikowi')` + odpowiednika Wiarygodności w TYM SAMYM miejscu, bo dane już tam są. | Najtańszy do wdrożenia z nowych haków pozytywnych — dane już policzone |

### 3.3 Zdarzenia świadomie POMINIĘTE w tabeli (i dlaczego)

- **Szpiegostwo wykryte** (`szpiegWykryty_zaufanie: −15` w `DIPLOMACY_PARAMS`) — w grze **nie ma dziś
  żadnego systemu szpiegostwa** (zero wzmianek o „szpieg" w `main.ts`). Event czysto aspiracyjny, poza
  zakresem tego projektu — nie dodawać haka Wiarygodności do czegoś, co nie istnieje.
- **Ultimatum spełnione/bezpodstawne** — akcja `'ultimatum'` istnieje w `evaluateProposal`
  (`game/diplomacy-proposals.ts`), ale odpowiadające jej eventy `'ultimatum_spelnione'`/
  `'ultimatum_bezpodstawne'` **nie są wywoływane w `main.ts`** (zweryfikowane grepem). Podobna sytuacja
  jak N1/P5 — do rozważenia w przyszłej fali, nie w tej (Maciej nie wymienił ultimatum jako kandydata).
- **Wojna z uzasadnieniem (`wojna_casus_belli`)** — dziś silnik ZAWSZE stosuje `'wojna_wypowiedziana'`
  (pełna kara), nigdy `'wojna_casus_belli'` (łagodniejsza wersja z uzasadnieniem). To osobny temat
  (odróżnienie wojny sprowokowanej od nieprowokowanej) — WARTO go rozważyć przy N1/N2, bo wojna w
  ODWECIE za czyjeś złamanie paktu nie powinna obciążać WŁASNEJ Wiarygodności tak samo jak wojna z
  zaskoczenia. Flagowane jako możliwe dopracowanie etapu 1 (§7), nie twardy wymóg.

---

## 4. Wpływ na Zaufanie — mechanika

Dwa niezależne mechanizmy, oba PROPOZYCJE do przetestowania (patrz też pytanie WIAR-Q3 w §8 — decyduje
czy wdrażamy oba, czy tylko pierwszy).

### 4.1 Modyfikator tempa (miękki wpływ — dotyka WSZYSTKICH par jednocześnie)

Niska Wiarygodność = trudniej budować Zaufanie i łatwiej je stracić; wysoka = odwrotnie. Dwa
mnożniki, stosowane do delt Zaufania w `tickDiplomacy` (`game/diplomacy.ts:1403`, per-turowe) oraz
`applyDiplomaticEvent` (`game/diplomacy.ts:646`, jednorazowe):

```
mnoznikWzrostu(wiarygodność) = clamp(0.5 + wiarygodność/100, 0.5, 1.5)   // stosowany do dZ > 0
mnoznikSpadku (wiarygodność) = clamp(1.5 − wiarygodność/100, 0.5, 1.5)   // stosowany do dZ < 0
```

Przykład przy starcie (wiarygodność=70): wzrost ×1.2, spadek ×0.8 — „Uczciwy" gracz buduje relacje
nieco szybciej i traci je nieco wolniej niż neutralne ×1.0. Przy wiarygodności=10 („Wiarołomny"):
wzrost ×0.6, spadek ×1.4 — każdy dobry gest buduje Zaufanie WOLNIEJ, każdy zły incydent boli MOCNIEJ.

**Zaleta tej konstrukcji:** dotyka tylko 2 funkcji rdzenia (`tickDiplomacy`, `applyDiplomaticEvent`) —
WSZYSTKIE miejsca, które już czytają wynikowe Zaufanie (`evaluateProposal`, `aiDiplomacyStance`,
`decideAIDiplomacy`, UI) dostają efekt Wiarygodności **automatycznie**, bez zmian w sobie.

### 4.2 Progi blokujące (twardy wpływ — tylko na najcięższych bramkach)

Dwie konkretne bramki, gdzie sama Wiarygodność (niezależnie od aktualnego Zaufania/Relacji) decyduje:

1. **Sojusz (Pełny/Defensywny)** — `game/diplomacy-proposals.ts:371-420` (case `'sojusz_defensywny'`/
   `'sojusz_pelny'` w `evaluateProposal`). Dopisać warunek: `if ((ctx.proposerWiarygodnosc ?? 70) < 35)
   return { accepted:false, reason:'Zbyt niska Wiarygodność na sojusz' }` — **przed** istniejącymi
   sprawdzeniami Zaufania/Relacji (linie 398-412), bo to twardsza bramka niż one.
2. **Wasalizacja/żądanie trybutu** — `game/diplomacy-proposals.ts:422-461` (case `'trybut_zadanie'`).
   Analogiczny warunek na `responderWiarygodnosc < 25` — cel nie podda się „ochronie" kogoś, kto
   regularnie łamie słowo (fabularne uzasadnienie: „nie wierzę, że dotrzymasz układu").

`ProposalEvalContext` (`game/diplomacy-proposals.ts:115-140`) dostaje dwa nowe opcjonalne pola:
`proposerWiarygodnosc?: number`, `responderWiarygodnosc?: number` — wypełniane w `main.ts`
dokładnie tam, gdzie dziś liczone jest `proposerRespekt`/`responderRespekt`
(`buildProposalEvalContext`, `main.ts:8697-8738`), tą samą funkcją, dla obu kierunków identycznie.

---

## 5. Regeneracja / zapominanie

Rekomendacja (patrz uzasadnienie w pytaniu WIAR-Q2, §8): **pasywna regeneracja do wartości bazowej
(70) z „blizną" po ciężkich zdarzeniach**.

```
KAŻDA TURA:
  jeśli licznikBlizny > 0:  licznikBlizny -= 1   // zamrożona regeneracja
  inaczej:
    jeśli wiarygodność < 70:  wiarygodność = min(70, wiarygodność + 0.1)   // dryf w górę do bazy
    jeśli wiarygodność > 70:  wiarygodność = max(70, wiarygodność − 0.1)   // dryf w dół do bazy (tak, też!)

PO ZDARZENIU N1 (zdrada) LUB N2 (zerwanie wymuszone wojną):
  licznikBlizny = max(licznikBlizny, 20)   // regeneracja zamrożona na 20 tur
```

Uzasadnienie kierunku dryfu w OBIE strony (nie tylko w górę): Wiarygodność „Wzór cnoty" zdobyta serią
dobrych czynów na początku gry nie powinna trwać WIECZNIE bez podtrzymania — jeśli cywilizacja przestaje
zawierać/dotrzymywać umów (bo np. nie ma już z kim), jej reputacja powinna powoli spłaszczać się do
neutralnego poziomu, a nie zostawać permanentnym bonusem za stare zasługi. To symetryczne z dryfem w
górę dla „Wiarołomnych" (szansa na odkupienie) — jeden wzór, dwa kierunki.

Wzorzec do naśladowania w kodzie: dokładnie ten sam styl co zanik `urazyHistoryczne` w `tickDiplomacy`
(`game/diplomacy.ts:1422-1433`, tam zanik co 20 tur o stały krok ku zero — tu zanik co turę o 0.1 ku 70).

**Tempo (0.1/turę) i próg blizny (20 tur) to PROPOZYCJE do strojenia** — przy 0.1/turę pełny powrót od
skrajności (0 lub 100) do bazy (70) zajmuje ok. 700 tur bez blizny, co jest celowo WOLNE (Wiarygodność
ma być „wolnozmienna", jak chciał Maciej) — w praktyce gracz odzyska Uczciwy status głównie przez
POZYTYWNE zdarzenia z §3.2, nie przez czekanie.

---

## 6. Parytet AI

Zasada nadrzędna projektu (CLAUDE.md Civ, zasada „JAK PRACOWAĆ Z WŁAŚCICIELEM" pkt 2 i konwencja
`AUDYT-PARYTET-AI-2026-07-24.md`): **mechanizm musi działać identycznie dla gracza (ownerId=0) i
każdego AI (ownerId≠0), kod ownerId-agnostyczny, zero gałęzi `if (ownerId===0)`.**

Jak to się przekłada na Wiarygodność konkretnie:

1. **Przechowywanie: jedna wspólna mapa, nie osobne pola gracza/AI.** Wzorzec identyczny jak
   `aiSkarbiecByOwner` (`main.ts:4140`, `Map<number, number>`) — ALE tam gracz ma OSOBNE pole
   `player.skarbiec` obok mapy AI (bo historycznie tak wyewoluowało — `main.ts:12136-12141` ma
   rozgałęzienie `ownerId === 0 ? player.skarbiec : aiSkarbiecByOwner.get(ownerId)`). **Dla
   Wiarygodności REKOMENDACJA: JEDNA mapa `wiarygodnoscByOwner: Map<number, number>` obejmująca
   TAKŻE ownerId=0**, bez osobnego pola na graczu — nie powielać tego rozgałęzienia, bo Wiarygodność
   nie ma dziś żadnego istniejącego pola na `player`, więc nie ma czego naśladować niepotrzebnie.
2. **Waga zdarzenia NIE różni się gracz/AI** — w przeciwieństwie do dzisiejszej kary Zaufania
   (`zlamanaPaktGracz_zaufanie=-40` vs `zlamanaPaktAI_zaufanie=-20`, `game/diplomacy.ts:76-78`,
   świadoma asymetria specyficzna dla per-parowego Zaufania), **Wiarygodność jako publiczna, globalna
   metryka powinna karać/nagradzać JEDNAKOWO niezależnie kto złamał słowo** — inaczej to nie jest
   „parytet", tylko kolejna ukryta preferencja. Tabela w §3 celowo ma JEDNĄ wagę per zdarzenie, bez
   kolumny gracz/AI.
3. **Wszystkie haki zdarzeń już dziś przyjmują `ownerId` jako goły parametr** — potwierdzone czytaniem
   kodu: `breakTreatiesOnWar(a: number, b: number, breakerIsPlayer: boolean)` (main.ts:8510),
   `breakTreatyVoluntarily(dealId: string)` (main.ts:8181, bierze strony z `deal.strony` — dwie liczby),
   `applyAllianceObligationsOnWar(attackerId: number, victimId: number)` (main.ts:8523),
   `tickCyclicResourceTradeDeals()` (main.ts:8595, `sellerOwnerId`/`buyerOwnerId` — dowolna kombinacja,
   komentarz w kodzie explicite: „ownerId-agnostyczne... gracz(0) LUB dowolne AI, w dowolnej
   kombinacji", `diplomacy-treaties.ts:19-23`). **Dopisanie wywołania funkcji Wiarygodności w tych
   miejscach jest z definicji ownerId-agnostyczne**, bo cała otaczająca funkcja już jest.
4. **AI musi REAGOWAĆ na Wiarygodność gracza — i na wiarygodność INNYCH AI, tą samą ścieżką.**
   `buildProposalEvalContext` (`main.ts:8697-8738`) już dziś liczy `proposerRespekt`/`responderRespekt`
   dla DOWOLNEJ pary `proposerId`/`responderId` (nie tylko gracz↔AI) — dopisanie
   `proposerWiarygodnosc: wiarygodnoscByOwner.get(proposerId) ?? 70` w TYM SAMYM miejscu automatycznie
   działa dla gracz→AI, AI→gracz I AI→AI (o ile AI↔AI w ogóle korzysta z `evaluateProposal` — dziś ma
   węższy zakres niż gracz↔AI, odnotowane jako already-known ograniczenie w
   `AUDYT-PARYTET-AI-2026-07-24.md` punkt 3, NIE do naprawy w tym projekcie).
5. **Test parytetu przy wdrożeniu (patrz §7 bramki):** ten sam event (np. N2, zerwanie wymuszone
   wojną) zaaplikowany raz z `breakerIsPlayer=true`, raz z `breakerIsPlayer=false`, musi dać
   **identyczną deltę Wiarygodności** (−18 w obu przypadkach) — mimo że dzisiejsza kara Zaufania w tym
   samym wywołaniu CELOWO się różni (−40 vs −20). To rozróżnienie (Zaufanie może być asymetryczne,
   Wiarygodność nie) jest świadome i warte jednej linii komentarza w kodzie przy wdrożeniu, żeby
   przyszły audyt parytetu nie zgłosił tego jako „luki".

---

## 7. Plan wdrożenia w krokach

### Etap 0 — RDZEŃ (dane + typy, zero UI, zero haków)

- **Nowy plik** `game/diplomacy-credibility.ts` (pure moduł, wzorowany na `game/diplomacy-factors.ts` —
  zero DOM/THREE, zero side-effects):
  - `WIARYGODNOSC_START = 70`
  - `type WiarygodnoscBand = 'wiarolomny' | 'chwiejny' | 'uczciwy' | 'wzor_cnoty'`
  - `function wiarygodnoscBand(w: number): WiarygodnoscBand` + `function wiarygodnoscLabelPl(w: number): string`
    (4 etykiety z §2)
  - `type CredibilityEvent = 'zdrada_bez_wypowiedzenia' | 'zlamanie_paktu_wojna' | 'atak_po_pokoju' |
    'odmowa_obowiazku_sojuszu' | 'zerwanie_dobrowolne_traktat' | 'zerwanie_dobrowolne_handel' |
    'niedotrzymanie_handlu_cyklicznego' | 'nieautoryzowany_przemarsz' | 'dotrwanie_sojuszu' |
    'dotrwanie_traktatu' | 'splata_handlu_cyklicznego' | 'wieloletni_pokoj' | 'pomoc_sojusznikowi_realna'`
  - `function applyCredibilityEvent(current: number, event: CredibilityEvent, params): { next: number;
    delta: number; blizna: boolean }` (czysta funkcja, klamruje [0,100], zwraca czy zdarzenie zakłada
    bliznę wg §5)
  - `function tickCredibility(current: number, licznikBlizny: number): { next: number;
    nastepnyLicznikBlizny: number }` (dryf ±0.1/turę do bazy 70, patrz §5)
  - `function tempoMnoznikZaufania(wiarygodnosc: number, kierunek: 'wzrost'|'spadek'): number` (wzory §4.1)
- **Rozszerzyć `DIPLOMACY_PARAMS`** (`game/diplomacy.ts:65-242`) o wagi z §3 jako osobne stałe (np.
  `wiarygodnoscZdrada: -25`, `wiarygodnoscZlamaniePaktu: -18`, ...) — spójnie z istniejącą konwencją
  (jedna płaska struktura, eksportowana też do `gra/data/diplomacy.json` przez Panel-D Excela — poza
  zakresem tego dokumentu, ale zaznaczyć w kodzie żeby integrator Excela wiedział o nowych kluczach).
- **`main.ts`**: `const wiarygodnoscByOwner = new Map<number, number>();` obok `aiSkarbiecByOwner`
  (`main.ts:4140`) + `const wiarygodnoscBlizna = new Map<number, number>();` (licznik tur blizny per
  ownerId) + helpery `getWiarygodnosc(ownerId)` (domyślnie `WIARYGODNOSC_START` jeśli brak wpisu, wzorem
  `defaultNeutralRelation()` przy `diplomacyRelations` — `main.ts:4167-4170`) / `setWiarygodnosc(ownerId, v)`.

### Etap 1 — HAKI ZDARZEŃ (wpinanie w istniejące i nowe miejsca z §3)

Kolejność od najtańszych (dane już policzone) do najdroższych (nowy stan do śledzenia):

1. **P5 (pomoc sojusznikowi)** — `main.ts:8523-8577` (`applyAllianceObligationsOnWar`), dopisać
   `applyDiploEventTracked(..., 'pomoc_sojusznikowi')` (Zaufanie, luka niezależna od tego projektu) ORAZ
   `bumpWiarygodnosc(allyId, 'pomoc_sojusznikowi_realna')` przy `joinedWarOwnerIds.push(allyId)`
   (linie 8531, 8556).
2. **N4 (odmowa obowiązku sojuszu)** — tamże, w bloku `treatiesBrokenByRefusal` (linie 8560-8577), dla
   każdego `allyId` z `playerRefusalAllies`/analogicznego zbioru dla AI, `bumpWiarygodnosc(allyId,
   'odmowa_obowiazku_sojuszu')`.
3. **N2 (zerwanie wymuszone wojną)** — `main.ts:8510-8521` (`breakTreatiesOnWar`), dopisać
   `bumpWiarygodnosc(breakerOwnerId, 'zlamanie_paktu_wojna')` — UWAGA: `breakTreatiesOnWar(a,b,
   breakerIsPlayer)` dziś nie ma jawnego `breakerOwnerId`, tylko flagę bool — trzeba przekazać, KTÓRY z
   `a`/`b` jest łamiącym (dziś to zawsze ten deklarujący wojnę, dostępne u wywołującego).
4. **N5 (zerwanie dobrowolne)** — `main.ts:8181-8205` (`breakTreatyVoluntarily`), analogicznie do
   istniejącego `applyDiploEventTracked`, `bumpWiarygodnosc(a, 'zerwanie_dobrowolne_traktat'|'_handel')`
   (stronę `a` jako inicjatora zerwania trzeba ustalić z UI — dziś funkcja nie rozróżnia kto kliknął
   „Zerwij", zakładając że to zawsze gracz; przy AI potrzeba odpowiednika).
5. **N7 (nieautoryzowany przemarsz)** — `game/diplomacy-border-march.ts` + `main.ts:2605`, dopisać
   flagę „już naliczono Wiarygodność dla tej wizyty" (żeby nie bić co turę), `bumpWiarygodnosc(ownerId,
   'nieautoryzowany_przemarsz')` tylko przy przejściu z 0 → >0 tur obecności.
6. **N1 (zdrada bez wypowiedzenia)** — **wymaga najpierw namierzenia** punktu inicjacji walki w
   `main.ts` (funkcja rozpoczynająca combat między dwoma `ownerId`) i sprawdzenia, czy dopuszcza atak
   przy `status !== 'wojna'`. Jeśli tak — to jest hak; jeśli engine już dziś wymusza wypowiedzenie wojny
   przed atakiem, N1 nigdy się nie zdarzy i można go pominąć w V1 (odnotować w meldunku wdrożeniowym,
   NIE zgadywać).
7. **N3 (atak po pokoju)** — wymaga nowego pola `pokojOdTury?: number` w `DiploPairMeta`
   (`game/diplomacy-pn-engine.ts:20-23`), ustawianego przy `'pokoj'` event (`main.ts:7703`, `:9049`),
   czytanego w N2/N1 przy obliczaniu dodatkowej kary.
8. **N6 + P3 (handel cykliczny — niedotrzymanie/spłata)** — `main.ts:8595-8627`
   (`tickCyclicResourceTradeDeals`), dopisać licznik `nieudaneDostawyZRzedu` per `dealId` (nowa mapa
   `Map<string, number>`) inkrementowany gdy `result.moved <= 0` (linia 8616), zerowany przy udanej
   dostawie; przy 3 z rzędu → N6; przy wygaśnięciu deala ze skutecznością ≥90% → P3 (wymaga też licznika
   `dostawyOgolem`/`dostawyUdane` per deal).
9. **P1 + P2 (dotrwanie traktatu/sojuszu)** — `main.ts:8629-8637` (`runDiplomacyTurnTick`), w miejscu
   gdzie już dziś porównywane jest `dealsBeforeExpire` z `activeDeals` po `expireTreaties` (linie
   8630-8636) — dla każdego deala co ZNIKNĄŁ przez wygaśnięcie (nie przez `removeTreatiesById` z powodu
   zerwania/wojny — te już usunięte WCZEŚNIEJ w innych funkcjach, więc nie trafią tu podwójnie),
   `bumpWiarygodnosc` obu stron wg P1 (sojusz) lub P2 (NAP/handel).
10. **P4 (wieloletni pokój)** — nowe pole `turyPokojuZRzedu?: number` w `DiploPairMeta`, inkrementowane
    co turę gdy `status==='pokoj'` bez przerwy, zerowane przy wojnie; `turn % 30 === 0` sprawdzenie
    analogiczne do zaniku `urazyHistoryczne`.

### Etap 2 — WPŁYW NA ZAUFANIE (tempo + progi, §4)

- `tickDiplomacy` (`game/diplomacy.ts:1403`) — dodać opcjonalny parametr (np. w `TickCtx` albo osobny
  argument, bo to funkcja pure bez dostępu do `wiarygodnoscByOwner`) `wiarygodnoscSelf?: number`,
  zastosować `mnoznikWzrostu`/`mnoznikSpadku` do `dZ` przed clampem.
- `applyDiplomaticEvent` (`game/diplomacy.ts:646`) — analogicznie, nowy opcjonalny parametr.
- `evaluateProposal` (`game/diplomacy-proposals.ts:332`) — rozszerzyć `ProposalEvalContext` o
  `proposerWiarygodnosc?`/`responderWiarygodnosc?`, dodać dwie twarde bramki z §4.2 (sojusz, trybut).
- `buildProposalEvalContext` (`main.ts:8697-8738`) — wypełnić nowe pola `ctx`, tą samą funkcją co
  `proposerRespekt`/`responderRespekt` już tam liczone (linie 8701-8702).
- AI-vs-gracz blok `decideAIDiplomacy` (`main.ts:14690-14850`, `DiplomacjaInputs` w `game/ai.ts:2142`) —
  opcjonalnie dopisać pole `wiarygodnoscPartnera?: number` do `RelacjaWejscie`, użyte do skalowania
  `progWojnaSila`/`progTrybut` (niska Wiarygodność partnera = AI łatwiej decyduje się na wojnę/trybut).
  To rozszerzenie NIŻSZEGO priorytetu niż `evaluateProposal` — może wejść w kolejnej fali.

### Etap 3 — SAVE/LOAD

- **Snapshot** (`main.ts:13268-13332`, blok `meta:{...}`) — dopisać
  `wiarygodnoscByOwner: Array.from(wiarygodnoscByOwner.entries())` i `wiarygodnoscBlizna:
  Array.from(wiarygodnoscBlizna.entries())`, dokładnie jak `aiSkarbiecByOwner: Array.from(...)`
  (`main.ts:13332`).
- **Restore** (`main.ts:17308-17328`) — mirror wzorca `aiSkarbiecByOwner` (linie 17311-17314):
  ```
  wiarygodnoscByOwner.clear();
  const saved = saved.meta?.wiarygodnoscByOwner as Array<[number, number]> | undefined;
  if (saved) for (const [oid, v] of saved) wiarygodnoscByOwner.set(oid, v);
  ```
  analogicznie dla `wiarygodnoscBlizna`.
- **Czyszczenie przy eliminacji cywilizacji** — `main.ts:12397-12404` już czyści `diplomacyRelations`/
  `diplomacyPairMeta`/`diplomacyFactorLog` dla wyeliminowanego `ownerId` w tym samym bloku; dopisać
  `wiarygodnoscByOwner.delete(ownerId)` i `wiarygodnoscBlizna.delete(ownerId)` tamże (cywilizacja, która
  przestała istnieć, nie ma już reputacji do śledzenia).
- **Reset nowej gry** — wszystkie miejsca gdzie dziś jest `diplomacyRelations.clear()` bez odpowiadającego
  restore (main.ts:16132, 16381, 16606, 16805 — reset przy nowej grze/menu) potrzebują też
  `wiarygodnoscByOwner.clear()` + `wiarygodnoscBlizna.clear()`.

### Etap 4 — UI

- **Audiencja** (`ui/diplomacyAudience.ts`) — nowy globalny badge przy `da-civtitle` gracza (linia 583)
  i rozmówcy (linia 617), NIE w sekcji „Relacje z Tobą" (linie 625-630, tam żyją Zaufanie/Respekt —
  per-parowe). Nowa funkcja `wiarygodnoscBadgeHtml(value: number): string`, tooltip z etykietą pasma
  (§2) + ewentualnie liczbą ostatnich zdarzeń (rejestr, patrz niżej).
- **Panel relacji** (`ui/diplomacyPanel.ts`) — `renderRow` (linie 202-229), dopisać wartość
  Wiarygodności do `cd-stats` (linia 212-214) albo osobny mały badge obok `tierBadge`.
- **Ranking Potęgi** (`ui/powerOverlayHud.ts`) — `PowerRankingRow` (linie 17-22), dodać opcjonalne pole
  `wiarygodnosc?: number`, wyświetlane jako dodatkowa kolumna w tabeli rankingu (spójne z ideą, że to
  globalna, porównywalna statystyka jak Potęga).
- **Tooltip** — nowa funkcja `wiarygodnoscTooltipPl(): string` w `diplomacy-display.ts`, analogiczna do
  `respektTooltipPl()` (linie 192-194).
- **Rejestr czynników (opcjonalnie, V2)** — analogicznie do `buildRelationBreakdown`
  (`game/diplomacy-factors.ts:147-188`, „za co Cię lubią/nie lubią") można dorobić globalny rejestr
  `Map<number, CredibilityLogEntry[]>` per cywilizacja, żeby audiencja pokazywała „za co Twoja
  Wiarygodność jest taka, jaka jest" — NIE traktować jako wymóg V1, tylko naturalne rozszerzenie gdy
  rdzeń zadziała (ten sam wzorzec co `diplomacyFactorLog`, `main.ts:4125`).

### Etap 5 — REAKCJE AI (parytet, patrz §6)

- Wpięcie `proposerWiarygodnosc`/`responderWiarygodnosc` do `buildProposalEvalContext`
  (`main.ts:8697-8738`) — jedna zmiana, działa dla wszystkich par korzystających z `evaluateProposal`.
- Test manualny parytetu (patrz bramki niżej): to samo zdarzenie z ownerId=0 (gracz) i ownerId=N (AI)
  jako sprawca musi dać identyczną deltę Wiarygodności.

### Bramki (testy do przejścia przed uznaniem etapu za gotowy)

- `npx tsc --noEmit` = 0 błędów (z katalogu `gra`).
- Nowy harness `tools/wiarygodnosc-test.cjs` (wzorem `tools/tech-tree-test.cjs`), pokrywający:
  - `applyCredibilityEvent` klamruje wynik do [0,100] dla skrajnych wartości wejściowych.
  - `tempoMnoznikZaufania` zwraca dokładnie 1.0 przy wiarygodności=50 (środek), 1.5/0.5 na krańcach —
    **UWAGA**: przy starcie=70 wzory z §4.1 dają 1.2/0.8, nie 1.0/1.0 — jeśli to niepożądane, do
    przemyślenia razem z Maciejem czy neutralny punkt wzorów powinien być 50 (środek skali) czy 70
    (wartość startowa); dokument zakłada 50 jako neutralny punkt WZORU (skala), 70 jako WARTOŚĆ
    STARTOWĄ (inny byt) — to świadomy wybór, nie błąd, ale wart jednego zdania w meldunku wdrożeniowym.
  - `wiarygodnoscLabelPl`/`wiarygodnoscBand` zwraca poprawne pasmo na granicach (24/25, 49/50, 74/75).
  - Save/load roundtrip: `Array<[number, number]>` → `Map` → z powrotem, wartości niezmienione.
  - **Test parytetu** (kluczowy, wzorem metodyki `AUDYT-PARYTET-AI-2026-07-24.md`): ten sam event
    zaaplikowany z `ownerId=0` i `ownerId=5` daje identyczną deltę Wiarygodności (funkcja czysta,
    `ownerId` nigdzie nie wchodzi do wzoru — tylko do wyboru KTÓREGO wpisu w mapie aktualizujemy).
- Test Macieja (manualny playtest, po wdrożeniu UI): (a) zerwij traktat jako gracz → Wiarygodność
  gracza spada, widoczna u WSZYSTKICH odkrytych AI w audiencji (nie tylko u partnera zerwania) —
  **to jest test odróżniający Wiarygodność od Zaufania**, kluczowy dla całego projektu; (b) AI o niskiej
  Wiarygodności ma trudniej zawrzeć sojusz z INNYM AI (parytet, jeśli AI↔AI korzysta z tej samej
  bramki); (c) dotrwanie NAP do końca bez zerwania podnosi Wiarygodność; (d) save/load zachowuje
  wartość i licznik blizny.

---

## 8. Pytania ABC do Macieja

Trzy fundamentalne rozwidlenia, które trzeba rozstrzygnąć PRZED napisaniem kodu rdzenia (Etap 0) — zmiana
odpowiedzi później oznacza przepisanie modelu danych, save/load i wszystkich haków.

### [TEMAT: Wiarygodność Cywilizacji] WIAR-Q1 — Zakres: globalna per cywilizacja czy per para?

**Sytuacja:** Dziś Zaufanie i Respekt są przechowywane PER PARA graczy — `RelacjaDyplomatyczna` między
graczem A i graczem B, w `main.ts` trzymana jako `Map<string, Relation>` kluczowana parą (np. "0_3" dla
gracza i AI o ownerId=3). Inna cywilizacja (np. AI o ownerId=5) nie ma dziś żadnego wglądu w to, jak
gracz traktuje AI o ownerId=3 — mechanicznie to dwie zupełnie osobne liczby. W briefie Maciej opisał
Wiarygodność jako coś, co „widzą wszyscy, nie tylko strona umowy" — to jest DOKŁADNIE odwrotność
dzisiejszego modelu Zaufania.

**Cel pytania:** Ustalić model przechowywania Wiarygodności — jedna liczba per cywilizacja (globalna,
widoczna dla wszystkich) czy N liczb per cywilizacja (po jednej na każdą parę, jak dziś Zaufanie) — zanim
napiszę strukturę danych rdzenia.

**Dlaczego teraz:** To fundamentalna decyzja architektoniczna. Zmiana z globalnej na per-parową (albo
odwrotnie) PO napisaniu kodu oznacza przepisanie: struktury danych w `main.ts`, formatu save/load,
wszystkich 13 haków zdarzeń z §3, i UI. Taniej zdecydować raz, na starcie.

**A. Globalna per cywilizacja** (`Map<ownerId, liczba>`, jedna wartość na cywilizację, widoczna dla
wszystkich odkrytych stron).
- Za: Dokładnie zgodne z opisem Macieja — „widzą ją wszyscy, nie tylko strona umowy" to dosłowny cytat
  z briefu.
- Za: Prostszy model — jeden hak zapisuje jedną liczbę, wszystkie strony (UI, AI innych cywilizacji)
  czytają z TEJ SAMEJ mapy; N razy mniej danych w save niż model per-parowy przy N cywilizacjach.
- Przeciw: Traci niuans — złamanie słowa wobec JEDNEJ, słabej strony obciąża reputację tak samo jak
  złamanie wobec silnego rywala; nie ma rozróżnienia „zawsze dotrzymuję słowa silnym, zdradzam tylko
  słabych".
- Przeciw: Cywilizacja, która skrzywdziła TYLKO jedną stronę (np. w uzasadnionej wojnie obronnej), jest
  ukarana w oczach WSZYSTKICH pozostałych — może być odbierane jako niesprawiedliwe przez gracza.

**B. Per para** (jak dzisiejsze Zaufanie — osobna wartość Wiarygodności dla każdej relacji).
- Za: Spójne z istniejącym wzorcem `RelacjaDyplomatyczna` — mniej nowego kodu, bo można dobudować pole
  obok `zaufanie`/`respekt` zamiast tworzyć całkiem nową strukturę danych.
- Za: Precyzyjniejsze — kara/nagroda trafia dokładnie w relację, której dotyczy, bez efektów ubocznych
  na inne strony.
- Przeciw: Wprost łamie zamysł Macieja z briefu — „publiczna, widzą wszyscy" przestaje być prawdą.
- Przeciw: N-krotnie więcej danych do przechowania i przeliczania (N-1 wartości Wiarygodności zamiast
  1 na cywilizację) bez wyraźnej korzyści gameplayowej wobec opcji A.

**C. Hybryda** (wartość globalna jako rdzeń mechaniki + lekki kontekstowy modyfikator per-para w UI,
np. etykieta „ostatnio złamał słowo wobec Ciebie" bez osobnej liczby).
- Za: Daje smaczek kontekstowy w UI („Twój rywal jest ogólnie Uczciwy, ale Tobie akurat zdradził pakt")
  bez komplikowania rdzenia — sama liczba pozostaje globalna (A), warstwa kosmetyczna jest opcjonalna.
- Za: Można dobudować w V2 bez przepisywania fundamentu, jeśli okaże się potrzebna.
- Przeciw: Dodatkowa złożoność UI na starcie bez pewności, że jest faktycznie potrzebna — ryzyko
  budowania czegoś „na wszelki wypadek".
- Przeciw: Ryzyko rozjazdu między tym co silnik LICZY (globalnie) a tym co UI POKAZUJE (kontekstowo) —
  gracz może się pogubić, dlaczego liczba się nie zgadza z opisem.

**Rekomendacja: A** — dokładnie zgodne z opisem zamysłu Macieja w briefie („widzą ją wszyscy") i
najprostsze do wdrożenia; zasada „najprostsze rozwiązanie spełniające wymaganie wygrywa" (CLAUDE.md Civ
pkt 5) wskazuje jednoznacznie na A. Cały ten dokument (§1-§7) jest napisany pod założeniem A — gdyby padło
B lub C, wymaga to przepisania §7 (plan wdrożenia).

**Formularz:**
- A — Globalna per cywilizacja (Rekomendacja)
- B — Per para (jak Zaufanie)
- C — Hybryda (globalna + kontekst UI)

---

### [TEMAT: Wiarygodność Cywilizacji] WIAR-Q2 — Czy Wiarygodność odbudowuje się z czasem?

**Sytuacja:** Zaufanie ma dziś dwa mechanizmy czasowe: stały dryf w górę co turę (`tickDiplomacy`,
+1 do +3/turę zależnie od tieru pokoju — pakt/sojusz/sam kontakt pokojowy) ORAZ osobno zanikające
`urazyHistoryczne` (−2 co 20 tur, ku zero, `game/diplomacy.ts:1422-1433`). Wiarygodność jako „historia"
nie ma dziś żadnego odpowiednika — trzeba zdecydować, czy w ogóle się regeneruje, zanim napiszę wzór do
`tickDiplomacy`-podobnej funkcji.

**Cel pytania:** Ustalić, czy Wiarygodność dryfuje z powrotem do wartości bazowej (70) z czasem
samoistnie, i czy poważne zdarzenia (zdrada, złamanie paktu przez wojnę) zostawiają tymczasową „bliznę"
spowalniającą tę regenerację.

**Dlaczego teraz:** Bezpośrednio determinuje kształt wzoru w rdzeniu (Etap 0, §7) i to, ile dodatkowego
stanu (liczników) trzeba przechowywać i zapisywać w save. Zmiana tej decyzji później = przepisanie
funkcji `tickCredibility` i formatu save.

**A. Brak regeneracji** — Wiarygodność zmienia się WYŁĄCZNIE przez zdarzenia z §3 (rośnie z dobrych
czynów, spada ze złych), zero pasywnego dryfu w żadną stronę.
- Za: Najprostsze wdrożenie — zero dodatkowego kodu w pętli tury, zero dodatkowego stanu do
  zapisywania.
- Za: Realistyczna metafora — reputacja w prawdziwym świecie nie znika sama z siebie, trzeba ją
  aktywnie odbudować czynami, nie czasem.
- Przeciw: Cywilizacja, która zawiniła RAZ, wcześnie w grze, może utknąć nisko na resztę partii, jeśli
  akurat nie ma z kim zawierać nowych umów (np. otoczona wrogami) — brak jakiejkolwiek ścieżki wyjścia.
- Przeciw: Mniej grywalne — kara za jeden błąd na starcie partii płaci się do samego końca, co może
  frustrować bardziej niż uczyć.

**B. Pasywna regeneracja do bazy** — stały dryf ±0.1/turę w stronę wartości bazowej (70), niezależnie
od zdarzeń.
- Za: Daje każdej stronie (gracz i AI) szansę na odbudowę reputacji bez konieczności podejmowania
  dodatkowych akcji — mechanika „wybacz i zapomnij" z czasem.
- Za: Matematycznie najprostszy dodatek do rdzenia — jedna linia w tick, dokładnie wzorem już
  istniejącego zaniku `urazyHistoryczne`.
- Przeciw: Przy niedostrojonym tempie ciężkie zdarzenie (np. zdrada, −25) można „przeczekać" w
  kilkanaście-kilkadziesiąt tur bez żadnej dalszej konsekwencji, co osłabia wagę samego zdarzenia w
  odczuciu gracza.
- Przeciw: Wymaga starannego strojenia tempa — za szybko i kara traci sens, za wolno i wraca problem
  z opcji A.

**C. Regeneracja z „blizną"** — jak B (dryf ±0.1/turę do bazy), ale po zdarzeniach N1/N2 (zdrada,
złamanie paktu wojną) regeneracja jest ZAMROŻONA na 20 tur, zanim wróci normalne tempo.
- Za: Najbardziej zniuansowane — świeża zdrada faktycznie boli DŁUŻEJ niż drobne uchybienie (np.
  nieautoryzowany przemarsz), co lepiej oddaje intuicję „poważne złamanie słowa pamięta się dłużej".
- Za: Chroni przed efektem „przeczekaj karę i graj dalej jakby nic się nie stało" z opcji B, bez
  całkowitej rezygnacji z szansy na odkupienie jak w opcji A.
- Przeciw: Najbardziej złożone z trzech — dodatkowy stan (licznik tur blizny per cywilizacja) do
  przechowania, zapisania w save i przywrócenia przy wczytaniu.
- Przeciw: Więcej do przetestowania i wytłumaczenia w UI — gracz może nie rozumieć, czemu pasek się nie
  rusza mimo dobrych czynów (dopóki blizna nie wygaśnie), bez czytelnego komunikatu w interfejsie.

**Rekomendacja: C** — daje grywalność (realna szansa na odkupienie, zgodnie z uwagą Macieja, że to
„ważne dla grywalności") bez trywializowania kary za naprawdę poważne zdarzenia; koszt dodatkowej
złożoności jest niewielki (jeden licznik per cywilizacja, wzorowany na istniejącym mechanizmie zaniku
urazów).

**Formularz:**
- C — Regeneracja z blizną (Rekomendacja)
- A — Brak regeneracji
- B — Pasywna regeneracja bez blizny

---

### [TEMAT: Wiarygodność Cywilizacji] WIAR-Q3 — Twarde blokady umów czy tylko modyfikator tempa Zaufania?

**Sytuacja:** Dzisiejsze bramki akcji dyplomatycznych (`evaluateProposal` w
`game/diplomacy-proposals.ts`, `aiDiplomacyStance` i `decideAIDiplomacy` w `game/diplomacy.ts`/
`game/ai.ts`) sprawdzają WYŁĄCZNIE Zaufanie, Relację ogólną i Respekt (np. „Zaufanie ≥ 91 wymagane do
Sojuszu", `progSojuszZaufanie`). Żadna z tych bramek nie ma dziś pojęcia o „historii dotrzymywania
słowa" — nawet cywilizacja, która złamała każdy pakt w grze, może zawrzeć nowy sojusz, jeśli tylko
bieżące Zaufanie/Relacja są wystarczająco wysokie (np. po serii darów).

**Cel pytania:** Zdecydować, czy niska Wiarygodność ma TWARDO blokować niektóre umowy niezależnie od
Zaufania (np. AI nigdy nie zawrze sojuszu z kimś poniżej progu Wiarygodności, choćby Zaufanie było
maksymalne), czy ma WYŁĄCZNIE spowalniać/przyspieszać naturalny wzrost Zaufania — bez żadnych twardych
blokad osobno.

**Dlaczego teraz:** Decyduje o rozmiarze zmian w Etapie 2 (§7). Sam modyfikator tempa dotyka TYLKO
dwóch funkcji rdzenia (`tickDiplomacy`, `applyDiplomaticEvent`) i propaguje się automatycznie wszędzie
indziej. Twarde progi wymagają osobnych zmian w KAŻDYM miejscu bramkującym z osobna (kilka gałęzi w
`evaluateProposal`, `aiDiplomacyStance`, `decideAIDiplomacy`) — więcej miejsc, więcej ryzyka pominięcia
jednego z nich (a to akurat byłaby realna luka w parytecie AI, gdyby np. dotknąć bramkę gracz→AI, a
zapomnieć o AI→AI).

**A. Tylko modyfikator tempa** (miękki wpływ) — Wiarygodność nigdy niczego wprost nie blokuje, tylko
zmienia szybkość budowania/tracenia Zaufania (wzory z §4.1).
- Za: Minimalna powierzchnia zmian — dwie funkcje rdzenia, cała reszta systemu (`evaluateProposal`,
  `aiDiplomacyStance`, `decideAIDiplomacy`) działa BEZ ŻADNYCH zmian, bo i tak czyta już zmodyfikowane
  Zaufanie.
- Za: Zero ryzyka, że gracz lub AI utknie CAŁKOWICIE zablokowany bez żadnej ścieżki do sojuszu/paktu —
  zawsze jest droga, tylko wolniejsza.
- Przeciw: Słabszy sygnał fabularny dla gracza — komunikat „Twoja Wiarygodność jest fatalna" nie
  przekłada się na nic namacalnego poza „trochę wolniej", co może wydawać się niespójne z ciężarem
  gatunkowym tej statystyki.
- Przeciw: Przy wystarczająco wysokim Zaufaniu z innych źródeł (np. hojne dary) można efektywnie
  „przekupić" złą reputację bez żadnej twardej konsekwencji — osłabia znaczenie Wiarygodności jako
  osobnego wymiaru.

**B. Tylko twarde progi** (bez modyfikatora tempa) — osobny warunek (np. „Wiarygodność ≥ 30") dodany do
każdej bramki traktatowej z osobna; Zaufanie liczy się dokładnie jak dziś, bez zmian.
- Za: Czytelny, jednoznaczny komunikat dla gracza — „Twoja Wiarygodność jest za niska na sojusz", brak
  niejasności dlaczego coś się nie udało.
- Za: Mocniejszy mechanicznie sygnał — Wiarygodność realnie COŚ blokuje, nie tylko spowalnia w tle.
- Przeciw: Trzeba dotknąć KAŻDĄ bramkę osobno (NAP, Sojusz Defensywny, Sojusz Pełny, żądanie trybutu w
  `evaluateProposal`, plus `aiDiplomacyStance`, plus `decideAIDiplomacy`) — więcej miejsc do zmiany,
  większe ryzyko pominięcia jednego (realna regresja parytetu AI, jeśli akurat pominięta gałąź dotyczy
  AI↔AI).
- Przeciw: Bez modyfikatora tempa Zaufanie i Wiarygodność żyją całkowicie osobno — słabszy związek
  przyczynowy między „złamałem słowo" a „trudniej mi teraz w ogóle budować jakiekolwiek relacje" (nie
  tylko te zablokowane progiem).

**C. Oba naraz** — modyfikator tempa WSZĘDZIE (jak A) + twarde progi TYLKO na 2 najcięższych bramkach
(Sojusz Pełny/Defensywny oraz żądanie Wasalizacji/Trybutu — akcje typu „zaufaj mi bezgranicznie").
- Za: Najbogatszy mechanicznie wynik — miękki wpływ wszędzie (spójność przyczynowa) + jednoznaczny
  twardy sygnał dokładnie tam, gdzie ma to największe uzasadnienie fabularne (kto zawrze sojusz albo
  odda się pod ochronę seryjnego łamacza słowa?).
- Za: Koszt wdrożenia bliższy opcji A niż pełnej opcji B — tylko 2 dodatkowe bramki do zmiany zamiast
  wszystkich, więc ryzyko pominięcia jest dużo mniejsze niż w B.
- Przeciw: Dwa mechanizmy działające jednocześnie w jednym systemie oznaczają więcej do przetestowania
  i wytłumaczenia graczowi — dwie różne przyczyny, dla których coś może się nie udać (niskie Zaufanie
  vs zbyt niska Wiarygodność).
- Przeciw: Trzeba pilnować spójności liczbowej między obydwoma mechanizmami przy wartościach granicznych
  (np. Wiarygodność tuż nad progiem 35, ale modyfikator tempa i tak drastycznie spowalnia realne
  osiągnięcie potrzebnego Zaufania) — ryzyko, że gracz techniczne „przejdzie" jeden warunek, a i tak
  utknie na drugim, bez jasnego zrozumienia dlaczego.

**Rekomendacja: C** — najlepszy stosunek efektu do kosztu wdrożenia: automatyczna propagacja
modyfikatora tempa (jak w A) zapewnia spójność przyczynową wszędzie, a jednoznaczna twarda blokada
dokładnie na dwóch najcięższych bramkach (jak wycinek z B) daje czytelny sygnał fabularny bez
konieczności przerabiania WSZYSTKICH gałęzi `evaluateProposal`/`aiDiplomacyStance`/`decideAIDiplomacy`.

**Formularz:**
- C — Oba naraz: tempo wszędzie + twarde progi na 2 bramkach (Rekomendacja)
- A — Tylko modyfikator tempa
- B — Tylko twarde progi

---

*Koniec dokumentu. Wdrożenie zaczyna się od Etapu 0 (§7) DOPIERO po odpowiedzi na WIAR-Q1 (bez niej nie
da się zaprojektować struktury danych rdzenia) — WIAR-Q2 i WIAR-Q3 wpływają na kształt Etapów 0/2, ale
brak odpowiedzi na nie można tymczasowo zastąpić rekomendacjami (C, C) oznaczonymi jako
`[ZAŁOŻENIE — do potwierdzenia]` w kodzie, żeby nie blokować startu prac nad Etapem 0-1.*

---

## ✅ DECYZJE MACIEJA (2026-07-25) — ZATWIERDZONE, realizować wg nich

| Pytanie | Decyzja | Co to znaczy dla implementacji |
|---|---|---|
| **WIAR-Q1** zasięg | **A — GLOBALNA** | Jedna wartość na cywilizację, publiczna (widzą wszyscy). NIE per para. Struktura: mapa ownerId→wartość, wzorem `aiSkarbiecByOwner`. |
| **WIAR-Q2** regeneracja | **C — DRYF + BLIZNA** | Powolny powrót do bazy z czasem, ALE ciężkie zdarzenia (zdrada sojusznika, atak mimo paktu) trwale obniżają SUFIT. Odkupienie możliwe, najgorsze czyny ważą do końca partii. |
| **WIAR-Q3** wpływ na Zaufanie | **C — TEMPO + PROGI** | Modyfikator tempa (niska wiarygodność: zaufanie rośnie wolniej, spada szybciej) ORAZ twarde progi blokujące na 2 najcięższych bramkach (sojusz, pakt o nieagresji). |

**Status:** projekt ZATWIERDZONY do implementacji. Realizacja wg planu etapowego (rdzeń → haki → wpływ na Zaufanie → save/load → UI → reakcje AI).
**Parytet AI obowiązuje** — mechanizm identyczny dla gracza i AI, kod ownerId-agnostic.
**Uwaga wykonawcza:** część haków zdarzeń NIE ISTNIEJE w kodzie (oznaczone w tabeli zdarzeń) — trzeba je zbudować, nie tylko dopiąć.

### Decyzje uzupełniające (2026-07-26, druga tura)

| Pytanie | Decyzja | Dla implementacji |
|---|---|---|
| **WIAR-Q4** widoczność | **A — JAWNA ZAWSZE** | Wiarygodność każdej cywilizacji widoczna dla gracza od początku, bez warunku kontaktu. Symetria: AI reaguje na reputację gracza, gracz widzi ich. Wchodzi do UI obok Zaufania i Respektu. |
| **WIAR-Q5** surowość | **B — UMIARKOWANIE** | Zdrada wyraźnie boli, ale reputację da się odbudować (spójne z WIAR-Q2=C: blizna zostaje, gra idzie dalej). Wagi dobrać tak, by JEDNA zdrada nie zamykała ścieżki dyplomatycznej, ale była odczuwalna przez wiele tur. Konkretne liczby = do strojenia w playteście. |
| **WIAR-Q6** start | **A — WSZYSCY 70** | Jednakowa wartość startowa dla gracza i wszystkich AI. Bez różnicowania per cywilizacja ani per trudność — różnice biorą się wyłącznie z czynów. |

**Komplet decyzji: Q1=A (globalna) · Q2=C (dryf+blizna) · Q3=C (tempo+progi) · Q4=A (jawna) · Q5=B (umiarkowanie) · Q6=A (start 70 dla wszystkich).**
Otwarte do strojenia w playteście (nie blokuje startu prac): konkretne wagi zdarzeń, tempo dryfu, wysokość progów blokujących.

---

## 🔴 ZMIANA SKALI + decyzje trzeciej tury (2026-07-26) — NADRZĘDNE wobec wcześniejszych zapisów

### SKALA: −100 … +100 (BYŁO 0–100 — nieaktualne!)
Maciej: „wiarygodność powinna mieć też ujemny wskaźnik od plus sto do minus sto".
Powód projektowy: na skali 0–100 zero znaczyłoby jednocześnie „nieznany" i „potwór". Na nowej skali:
- **+100** Wzór cnoty · **+40…+99** Uczciwy · **−39…+39** Chwiejny/nieznany · **−100…−40** Wiarołomny
- **0 = brak historii** (nic nie udowodniłeś w żadną stronę)

### WARTOŚĆ STARTOWA — zależna od POZIOMU TRUDNOŚCI (decyzja Macieja)
| Poziom | Start | Sens |
|---|---|---|
| **Łatwy** | **+40** | świat zakłada dobre intencje — sojusze dostępne od razu |
| **Normalny** | **+20** | lekki kredyt zaufania |
| **Trudny** | **0** | zero kredytu — reputację trzeba zapracować, próg sojuszu (W≥0) stoi dokładnie na starcie |
Dotyczy gracza I wszystkich AI jednakowo (parytet). Bez różnicowania per cywilizacja.

### CZTERY DŹWIGNIE WPŁYWU NA ZAUFANIE (wszystkie zatwierdzone)

**1. Mnożnik tempa** — wiarygodność nie zmienia zaufania wprost, zmienia jego dynamikę:
`wzrostMult = 1 + (W/100)×0,5` · `spadekMult = 1 − (W/100)×0,5`
- W=+100 → zaufanie rośnie ×1,5, spada ×0,5 (wybaczają Ci)
- W=0 → ×1,0 / ×1,0
- W=−100 → rośnie ×0,5, spada ×1,5 (przy pierwszej okazji)

**2. WPŁYW NA ISTNIEJĄCY SUFIT ZAUFANIA** ⚠️ **KOREKTA Macieja 2026-07-26:**
> „zaufanie ma już swój sufit i nie można go kupować w nadmiarze darami. Ale Ty nie miałeś zajmować się zaufaniem, tylko wiarygodnością. **Nie zmieniamy już tego, co jest, tylko dostosuj do wiarygodności.**"

**NIE PROJEKTUJEMY nowego sufitu ani nie ruszamy mechaniki Zaufania.** Sufit zaufania i ochrona przed kupowaniem go darami **JUŻ ISTNIEJĄ i działają** — zostają nietknięte.
Rola Wiarygodności: **wchodzi jako WEJŚCIE do istniejącego mechanizmu sufitu**, obniżając go dla cywilizacji o złej reputacji. Implementacja: znaleźć miejsce, gdzie sufit zaufania jest dziś wyliczany, i dołożyć tam człon zależny od W — bez zmiany reszty wzoru i bez dotykania pozostałych ścieżek zaufania.
⚠️ ZASADA DLA WYKONAWCY: wszystkie cztery dźwignie mają być **doczepione do istniejących mechanizmów**, nie zastępować ich. Jeśli w trakcie implementacji okaże się, że dźwignia wymaga przebudowy Zaufania — ZATRZYMAJ SIĘ i zapytaj Macieja, zamiast przebudowywać.

**3. Twarde progi** (Q3=C) — poniżej wartości AI odmawia z zasady, bez negocjacji, NIEZALEŻNIE od zaufania i Respektu:
- **Sojusz** wymaga W ≥ 0 · **Pakt o nieagresji** wymaga W ≥ −40

**4. PIERWSZY KONTAKT** (Maciej: TAK) — startowe nastawienie nowo spotkanej cywilizacji zależy od reputacji gracza. Zdrada na drugim końcu mapy = chłodne powitanie u nowego sąsiada.
⚠️ To realizuje sens decyzji „globalna" — bez tego wiarygodność byłaby drugą kopią Zaufania.

### DRYF / ZAPOMINANIE KAR — zróżnicowany trudnością (Maciej 2026-07-26)
Maciej: „musisz przyjąć jakiś współczynnik, o jaki ta wiarygodność się poprawia — kary są zapominane; trzeba to zróżnicować w zależności od poziomu trudności."

**PROPOZYCJA WYJŚCIOWA [ZAŁOŻENIE — do strojenia w playteście]:**
| Poziom | Tempo odbudowy | Odrobienie −50 → start |
|---|---|---|
| **Łatwy** | **+1,0 pkt / turę** (10 pkt / 10 tur) | ~50–90 tur |
| **Normalny** | **+0,4 pkt / turę** (10 pkt / 25 tur) | ~125–150 tur |
| **Trudny** | **+0,2 pkt / turę** (10 pkt / 50 tur) | ~250 tur (praktycznie na całą partię) |

**ZASADY DRYFU (ważne dla implementacji):**
1. **Dryf działa TYLKO W GÓRĘ, w stronę wartości startowej** — zapominane są KARY, zgodnie ze słowami Macieja. Wypracowana reputacja powyżej bazy NIE zanika (dobre czyny się nie „przedawniają").
2. Dryf zatrzymuje się na wartości startowej danego poziomu trudności (nie ciągnie w górę bez końca).
3. **BLIZNA (Q2=C) ogranicza dryf:** ciężkie zdarzenia (zdrada sojusznika, atak mimo paktu) trwale obniżają SUFIT, do którego dryf może dociągnąć. Czyli: kary się zapominają, ale najgorsze czyny zostawiają trwały ślad. Głębokość blizny też może zależeć od trudności — [do rozstrzygnięcia przy implementacji].

### KOMPLET DECYZJI (stan 2026-07-26)
Q1=A globalna · Q2=C dryf+blizna · Q3=C tempo+progi · Q4=A jawna zawsze · Q5=B umiarkowana surowość · Q6→**ZMIENIONE: start zależny od trudności (+40/+20/0)** · skala **−100…+100** · sufit zaufania TAK · pierwszy kontakt TAK · dryf zróżnicowany trudnością.

**Otwarte do strojenia w playteście:** dokładne wagi 13 zdarzeń, dokładne tempo dryfu, wysokość progów, głębokość blizny, krzywa sufitu zaufania.

---

## 🔷 N1 — PEŁNA SPECYFIKACJA MECHANIKI (Maciej 2026-07-26) — NADRZĘDNA

### Zmiana nazwy
**N1 nie nazywa się „zdrada" — nazywa się ATAK Z ZASKOCZENIA.**
Powód (Maciej): zdrada = złamanie istniejącego zobowiązania (to N2 — atak mimo paktu/sojuszu). Atak na cywilizację neutralną lub pokojową to co innego: nie łamiesz umowy, łamiesz obyczaj wojenny. Etykieta w UI, komunikatach i logu: **„Atak z zaskoczenia"**.

### Stan obecny = BUG UX (do naprawy niezależnie od Wiarygodności)
Dziś gracz może zaatakować cywilizację, z którą **nie jest w stanie wojny**, i:
- nie dostaje ŻADNEGO ostrzeżenia ani pytania,
- nie ma nawet komunikatu „czy wypowiedzieć wojnę?",
- wojna po prostu się dzieje.
Maciej: *„w tej chwili można zaatakować, nie wypowiadając wojny, i nawet nie ma komunikatu"*. To trzeba naprawić — gracz musi wiedzieć, co robi.

### Docelowa mechanika

**KROK 1 — kliknięcie ataku na cel spoza wojny** (status ≠ 'wojna': neutralny, pokój, pakt, sojusz)
→ pojawia się MODAL POTWIERDZENIA z jasnym wyborem i konsekwencją:

| Opcja | Skutek |
|---|---|
| **„Wypowiedz wojnę"** | wojna wypowiedziana, atak NIE następuje w tej turze |
| **„Atakuj bez wypowiedzenia"** | wojna deklarowana automatycznie + **atak natychmiast** + **kara N1 (−25 Wiarygodności)** |
| **„Anuluj"** | nic się nie dzieje |

⚠️ Modal MUSI jawnie pokazać koszt: *„Atak bez wypowiedzenia wojny = Atak z zaskoczenia, −25 Wiarygodności u WSZYSTKICH cywilizacji"*. Maciej: *„trzeba dać informację zwrotną graczowi, żeby wiedział, że jeżeli nie odczeka tury, to zapłaci karę"*.

**KROK 2 — reguła jednej tury karencji**
Po wypowiedzeniu wojny trzeba **odczekać JEDNĄ turę**. Atak w kolejnej turze i później = **czysty, bez kary**.
Atak w TEJ SAMEJ turze, w której wypowiedziano wojnę = **traktowany jak atak z zaskoczenia** (kara N1).
→ Wymaga zapisania numeru tury wypowiedzenia wojny per para (pole typu `wojnaOdTury` w `DiploPairMeta`) — ta sama struktura przyda się do N3 (atak zaraz po pokoju), więc zrobić raz i wspólnie.

**KROK 3 — brak obejścia**
Atak bez wypowiedzenia **i tak deklaruje wojnę z automatu** (jak dziś) — gracz nie może „atakować bez konsekwencji dyplomatycznych". Różnica polega wyłącznie na karze Wiarygodności.

### PARYTET AI (zasada nadrzędna)
Reguła obowiązuje AI **identycznie**: AI atakujące w turze wypowiedzenia wojny płaci tę samą karę. AI nie ma modala (nie klika), ale ma tę samą bramkę czasową w logice decyzji — inaczej gracz byłby karany za coś, co AI robi bezkarnie.

### Kolejność wdrożenia
1. **Modal ostrzegawczy + reguła 1 tury** — wartość sama w sobie (dziś gracz atakuje na ślepo). Może powstać PRZED Wiarygodnością; wtedy modal nie pokazuje jeszcze kary, tylko pyta o wypowiedzenie wojny.
2. **Kara N1** — dopina się do tego samego miejsca, gdy Wiarygodność wejdzie do kodu.

### Otwarte (do decyzji Macieja)
**Wojna w ODWECIE** — czy wypowiedzenie wojny w odpowiedzi na czyjeś złamanie paktu ma obciążać własną Wiarygodność? Warianty: A) nie obciąża przez N tur od cudzego przewinienia · B) obciąża o połowę · C) bez wyjątków. **Nierozstrzygnięte.**

---

## 🔷 N1 + N2 — UKŁAD OSTATECZNY (Maciej 2026-07-26, NADRZĘDNY nad wszystkim powyżej)

### Nazwa N1 (ostateczna)
**N1 = „WYPOWIEDZENIE WOJNY BEZ OSTRZEŻENIA"**
(NIE „zdrada" — zdrada to złamanie zobowiązania, czyli N2. NIE „atak z zaskoczenia" — poprzednia robocza nazwa, odrzucona.)

### Zasada porządkująca (uzasadnienie Macieja)
> „Nie może być wypowiedzenie wojny neutralnemu graczowi bardziej karane niż wypowiedzenie wojny sojusznikowi."

W poprzedniej wersji tabeli N1 (neutralny) = −25 był SUROWSZY niż N2 (sojusznik) = −18 — niespójność wykryta przez Macieja. Poprawione.

### N1 — brak ostrzeżenia: **−10** (było −25)
Kara wyłącznie za **sposób** rozpoczęcia wojny, niezależny od tego, KOGO atakujemy.
Nalicza się, gdy atak nastąpi bez wypowiedzenia wojny ALBO w tej samej turze, w której ją wypowiedziano (brak karencji 1 tury — mechanika opisana w sekcji „N1 — PEŁNA SPECYFIKACJA" wyżej: modal potwierdzenia, karencja, automatyczna deklaracja wojny, parytet AI).

### N2 — złamane zobowiązanie: ROZBITE NA DWA POZIOMY
| Zobowiązanie złamane wypowiedzeniem wojny | Waga |
|---|---|
| **Pakt o nieagresji (NAP)** | **−18** |
| **Sojusz** (pełny lub defensywny) | **−25** |

Kara za **to, komu** wypowiadamy wojnę — im większe zobowiązanie, tym większa.

### KARY SIĘ SUMUJĄ (kluczowe dla implementacji)
N1 i N2 to **dwa niezależne wymiary**: N1 = *jak* zaczynasz wojnę, N2 = *wobec kogo*. Nakładają się:

| Sytuacja | N1 | N2 | **Razem** |
|---|---|---|---|
| Neutralny — wojna wypowiedziana, odczekana tura | — | — | **0** |
| Neutralny — atak natychmiast | −10 | — | **−10** |
| NAP — wypowiedzenie poprawne (z karencją) | — | −18 | **−18** |
| NAP — atak natychmiast | −10 | −18 | **−28** |
| Sojusznik — wypowiedzenie poprawne | — | −25 | **−25** |
| **Sojusznik — atak natychmiast** | −10 | −25 | **−35** (maksimum w tabeli) |

### Zasady N1 obowiązują TAKŻE przy N2
Maciej: *„N2 się zgadza, ale przy zastosowaniu zasad N1."*
Modal potwierdzenia i karencja 1 tury dotyczą **każdego** wypowiedzenia wojny — również sojusznikowi i partnerowi NAP. Modal w takich przypadkach musi pokazać **pełny rachunek** (np. „Sojusznik + brak ostrzeżenia = −35 Wiarygodności"), żeby gracz widział prawdziwy koszt przed kliknięciem.

### Skutek dla reszty tabeli
Maksymalna pojedyncza kara to teraz **−35** (sojusznik + brak ostrzeżenia). Pozostałe wagi (N3…N7, P1…P5) BEZ ZMIAN — hierarchia zachowana, bo N4 (odmowa pomocy sojusznikowi) = −10 pozostaje poniżej złamania sojuszu wojną.

---

## 🔷 N3–N7 — ZATWIERDZONE Z DOPRECYZOWANIAMI (Maciej 2026-07-26)

### ⭐ ZASADA NADRZĘDNA: ŻADNEJ KARY BEZ UPRZEDZENIA
Wyłoniona z uwag Macieja do N1 i N7, obowiązuje **CAŁY mechanizm**:
> Gracz nie może stracić Wiarygodności za czyn, o którego konsekwencji nie został uprzedzony PRZED jego wykonaniem.

Maciej (N7): *„trzeba do gry wprowadzić ostrzeżenie, że wchodzisz na cudze terytorium — czy na pewno chcesz. Bo w tej chwili gra tego nie robi. **Gracz nie będzie wiedział, za co traci zaufanie i wiarygodność.**"*

Konsekwencja dla wykonawcy: **każde zdarzenie karzące, które gracz wywołuje świadomym kliknięciem, musi mieć modal/ostrzeżenie z jawnym kosztem.** Kary naliczane pasywnie (np. N6 — niedostarczony handel) muszą mieć czytelny komunikat w momencie naliczenia. Wdrożenie kary BEZ ostrzeżenia = niepełne wdrożenie.

### N3 — atak zaraz po pokoju: **ZATWIERDZONE bez zmian** (−12 dodatkowo, próg <10 tur)

### N4 — odmowa pomocy sojusznikowi na wezwanie: **ZATWIERDZONE** (−10)
Przypomnienie: to realna luka w istniejącym kodzie — gra dziś wykrywa, kto się nie stawił (`treatiesBrokenByRefusal`), zrywa sojusz, ale **nie nakłada żadnej kary**.

### N5 — dobrowolne zerwanie traktatu: **WARUNKOWE** ⚠️ ZMIANA
Maciej: *„przy założeniu, że to ten traktat był CZASOWY. Jeżeli był zwykłym, to nie ma żadnej kary."*

| Rodzaj traktatu | Kara przy zerwaniu |
|---|---|
| **Czasowy** (zawarty na określoną liczbę tur) | **−6** (traktat) / **−4** (umowa handlowa) |
| **Zwykły/bezterminowy** | **BRAK KARY** |

Uzasadnienie: zobowiązanie na czas określony to obietnica z terminem — zerwanie przed czasem łamie słowo. Umowa bezterminowa jest z natury wypowiadalna.
⚠️ **DO SPRAWDZENIA PRZY IMPLEMENTACJI:** czy `ActiveDeal` (`diplomacy-treaties.ts:39-50`) rozróżnia traktaty czasowe od bezterminowych. Jest tam `zawartaTura`; trzeba ustalić, czy istnieje pole z długością/terminem wygaśnięcia. Jeśli WSZYSTKIE traktaty są dziś czasowe — kara obowiązuje zawsze i warunek jest bezprzedmiotowy (odnotować). Jeśli NIE MA rozróżnienia — zgłosić Maciejowi przed wdrożeniem.

### N6 — niedotrzymanie handlu cyklicznego: **ZATWIERDZONE** (−2 po 3 turach z rzędu)
⚠️ **ALE Maciej zgłasza do weryfikacji zachowanie samej wymiany:**
> *„Zakładam, że jeżeli mamy handel cykliczny i jedna z cywilizacji nie ma surowca, to po prostu wymiana się nie dokonuje — a nie że jedni dostają, a drudzy nie dostają."*

Czyli wymiana ma być **SYMETRYCZNA**: brak surowca u jednej strony = transakcja nie dochodzi do skutku **w obie strony**. Niedopuszczalne, żeby jedna strona dostała towar/zapłatę, a druga nie.
→ Zlecona osobna weryfikacja w kodzie (`tickCyclicResourceTradeDeals`, main.ts ~8595-8627). Jeśli dziś jest asymetria — to BUG do naprawy niezależnie od Wiarygodności.

### N7 — nieautoryzowany przemarsz: **ZATWIERDZONE + WYMÓG OSTRZEŻENIA** (−2 jednorazowo)
Maciej: gra **musi ostrzec** przed wejściem na cudze terytorium.
Docelowo: przy próbie ruchu jednostki na heks obcego terytorium bez otwartych granic/prawa przemarszu → **modal potwierdzenia** z jawnym kosztem („wejście bez zgody: −Zaufanie co turę, −2 Wiarygodności").
Opcje: „Wejdź mimo to" / „Anuluj". Rozważyć opcję „nie pytaj ponownie w tej turze/wizycie", żeby nie irytować przy dłuższym marszu — ale koszt musi być pokazany przynajmniej raz.
⚠️ To ostrzeżenie ma wartość SAMO W SOBIE — dziś gracz traci zaufanie, nie wiedząc dlaczego. Może powstać przed Wiarygodnością.

### Podsumowanie statusu tabeli kar
N1 ✅ (−10, przemianowane) · N2 ✅ (rozbite: NAP −18 / sojusz −25) · N3 ✅ (−12) · N4 ✅ (−10) · N5 ✅ **warunkowo — tylko traktaty czasowe** · N6 ✅ (−2) **+ weryfikacja symetrii wymiany** · N7 ✅ (−2) **+ wymóg ostrzeżenia**
**Strona pozytywna P1–P5 — jeszcze nieprzejrzana przez Macieja.**

### N7 — uzupełnienia (Maciej 2026-07-26, druga tura)

**1. Braku zgody na przemarsz nie da się dziś naprawić w grze — trzeba to umożliwić.**
Maciej: *„gdzie brakuje jeszcze zgody na przemarsz przez cudze terytorium, powinno być to możliwe w ustawieniach"*.
Czyli: gracz, który zobaczy ostrzeżenie „wchodzisz na cudze terytorium", musi mieć **realną alternatywę** — możliwość wynegocjowania prawa przemarszu, zamiast wyłącznie wyboru „wejdź i płać" albo „zawróć".
⚠️ DO SPRAWDZENIA PRZY IMPLEMENTACJI: prawo wojskowego przemarszu **istnieje** jako typ propozycji dyplomatycznej (`diplomacy-proposals.ts`, case `'granice'`, bramka Respektu `progGraniceWojskoweRespekt` — naprawiana w audycie #46). Ustalić:
- czy gracz ma do niego **dostęp w UI** (czy da się je zaproponować z panelu dyplomacji), czy tylko AI je proponuje,
- czy w ustawieniach/kreatorze jest opcja globalna dotycząca granic,
- czego dokładnie brakuje, żeby gracz mógł o nie wystąpić.
Jeśli ścieżka istnieje — modal ostrzegawczy powinien do niej **odsyłać** („możesz poprosić o prawo przemarszu w dyplomacji"). Jeśli nie istnieje — trzeba ją dorobić, inaczej kara N7 jest nieuczciwa (karzemy za coś, czego nie da się legalnie załatwić).

**2. ZWIADOWCY WYKLUCZENI z reguły N7.**
Maciej: *„skauci powinni być wykluczeni z tej reguły"*.
Jednostki zwiadowcze (Zwiadowca i analogiczne — sprawdzić rolę/typ w `units.json`; kandydat: rola „Zwiad"/kategoria zwiadowcza) **nie naruszają terytorium**: ani nie tracą Wiarygodności (N7), ani nie wywołują modala ostrzegawczego, ani — DO POTWIERDZENIA — nie powinny naliczać istniejącej kary Zaufania za przemarsz.
Uzasadnienie projektowe: zwiad to podstawowa mechanika wczesnej gry; blokowanie go dyplomatycznie zablokowałoby eksplorację, a wysyłanie zwiadowcy nie jest aktem wrogim jak marsz armii.
⚠️ DO ROZSTRZYGNIĘCIA PRZY IMPLEMENTACJI: czy wykluczenie obejmuje TYLKO Wiarygodność (N7), czy także istniejącą karę Zaufania z `diplomacy-border-march.ts`. Rekomendacja: **oba** — inaczej gracz nadal traci Zaufanie za zwiad i zasada „bez kary za zwiad" jest połowiczna. Ale to zmiana w ISTNIEJĄCEJ mechanice Zaufania → zgodnie z korektą Macieja („nie zmieniamy tego, co jest") **zapytać przed wdrożeniem**.
**PARYTET AI:** wykluczenie dotyczy zwiadowców AI tak samo jak gracza.

### N4 — DOPRECYZOWANIE (Maciej 2026-07-26): odmowa = zerwanie + kara TYLKO dla winnego

Maciej: *„Jeżeli sojusznik odmawia czynności, do której się zobowiązał, to po prostu sojusz jest zrywany plus kara dla tego, **którego jest winą to zerwanie**. Nie po to zawiera się sojusze, żeby nie dotrzymać słowa."*

**Mechanika (dwie części, obie obowiązkowe):**
1. **Sojusz zostaje zerwany** — to już dziś działa (`treatiesBrokenByRefusal` → `brokenTreatyIds`, main.ts ~8560).
2. **Karę Wiarygodności ponosi WYŁĄCZNIE odmawiający** — dziś nie ma jej wcale (luka).

⚠️ **KRYTYCZNE DLA IMPLEMENTACJI — asymetria kary:**
Zerwanie sojuszu ma DWIE strony, ale winna jest JEDNA. **Opuszczony sojusznik NIE MOŻE dostać żadnej kary** za to, że jego sojusz przestał istnieć — on jest ofiarą, nie sprawcą.
Ryzyko: istniejący kod zrywania traktatów może aplikować zdarzenia „symetrycznie" na parę (wzorzec `applyDiploEventTracked(a,b,...)`). Przy dopinaniu Wiarygodności **trzeba jawnie sprawdzić, komu przypisywana jest wina** i naliczyć odpis tylko jemu. To samo dotyczy N2 i N5 — sprawca ≠ para.

**Waga — do potwierdzenia przez Macieja.** Obecna propozycja **−10**. Argument za podniesieniem do **−15**: odmowa pomocy unieważnia cały sens sojuszu („nie po to zawiera się sojusze"), a dziś −10 zrównuje ją z... niczym w tabeli — jest lżejsza niż dobrowolne zerwanie traktatu czasowego (−6) tylko dwukrotnie, przy nieporównywalnie większej szkodzie dla sojusznika, który liczył na pomoc w wojnie. Hierarchia przy −15: atak na sojusznika −25 > odmowa pomocy −15 > zerwanie traktatu czasowego −6. **Decyzja: Maciej.**

**PARYTET AI:** AI odmawiające pomocy płaci identycznie. Sprawdzić, czy AI w ogóle ma dziś ścieżkę odmowy (czy zawsze dołącza), bo jeśli tylko gracz może odmówić — to złamany parytet.
