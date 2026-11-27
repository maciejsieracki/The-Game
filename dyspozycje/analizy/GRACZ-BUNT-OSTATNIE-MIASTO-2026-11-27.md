# Gracz: bunt a ostatnie miasto (R-WEB-PLAYER-LASTCITY-REVOLT-Q1, obrona Operatora r2)

STATUS: POMIAR CZĘŚCIOWY. Wiążący stan na dzień: 9 żywych biegów do t60 wykonano (plus 1 replika V4), dane w
`dyspozycje/autobot/runs/R-WEB-PLAYER-LASTCITY-REVOLT-Q1/dane/`. Porządek gracza, mechanizm zmiany właściciela
w t29 oraz skutek w UI po utracie ostatniego miasta NIE ZMIERZONO (opis w §4).
Baza: origin/main 2e50241cd; kod gry bez zmian (`git diff -- gra/src gra/data` = 0). Kandydat r2: 858b4c981.

## 1. Wniosek w skrócie

- W 10 biegach (9 + replika V4) gracz NIE zgłosił ani jednego wpisu buntu `[Rebelia]` dla swojego miasta i żadne
  miasto gracza nie przeszło do owner −99 (rebelianci). Częstość buntu gracza w tych biegach: 0 z 10 (zob. §3,
  zastrzeżenie: nie mierzono Porządku, więc nie wiadomo, jak blisko progu były miasta gracza).
- Utrata OSTATNIEGO miasta gracza wystąpiła w 3 z 10 biegów: V4 normalny/normalny s4242 (t29), latwy-s7 (t59),
  normalny-s7 (t58). Przyczyna NIE ROZSTRZYGNIĘTA (§2). Żadna z nich nie była buntem (brak −99 i brak wpisu
  `[Rebelia]` dla miasta gracza w zdarzeniach konsoli).
- Kod NIE chroni ostatniego miasta gracza przed buntem: ochrona `aiKeepsLastCity` dotyczy wyłącznie AI
  (`gra/src/game/society-breakdown.ts:530-532`). Możliwość utraty ostatniego miasta przez bunt istnieje w mechanice
  i nie została w tych biegach zaobserwowana.

## 2. Utrata miasta gracza w danych (tabela z zapisów)

Źródło: `dane/*.jsonl.gz` (zapisy tury), narzędzie `gra/tools/plrrevolt-table.cjs` (tylko odczyt; wynik poniżej
surowo, bez korekt). Liczby owner 1 i citiesAll to LICZNIKI z zapisu tury, nie identyfikacja miasta.

| bieg | ostatnia tura | tura utraty miast gracza | licznik owner 1 w tej turze | citiesAll w tej turze | pierwsza tura owner −99 | jednostki wojskowe gracza min..max |
|---|---|---|---|---|---|---|
| V4-normalny-normalny-s4242 | t35 | t29 | 5→6 | 86→91 | brak | 0..0 |
| latwy-s4242 | t60 | brak | brak | brak | brak | 0..0 |
| latwy-s7 | t60 | t59 | 15→16 | 170→171 | brak | 0..0 |
| latwy-s778899 | t60 | brak | brak | brak | brak | 0..0 |
| normalny-s4242 | t60 | brak | brak | brak | brak | 0..0 |
| normalny-s7 | t60 | t58 | 15→16 | 169→169 | brak | 0..0 |
| normalny-s778899 | t60 | brak | brak | brak | brak | 0..0 |
| trudny-s4242 | t60 | brak | brak | brak | brak | 0..0 |
| trudny-s7 | t60 | brak | brak | brak | brak | 0..0 |
| trudny-s778899 | t60 | brak | brak | brak | brak | 0..0 |

Uwagi do tabeli (zastrzeżenia do poprzedniej wersji dokumentu, przyjęte w obronie):
- Wcześniejsze zdanie „podbój przez AI owner 1” NIE jest udowodnione. Zapis tury zawiera liczniki miast per właściciel,
  a właściciel −1 (barbarzyńcy) NIE jest w liście `owners`, więc zmiana 0→−1 nie jest widoczna w liczniku owner 1.
  Przy `normalny-s7` (t58) licznik owner 1 rośnie o 1, a `citiesAll` nie zmienia się (169→169), co jest zgodne
  zarówno z przejęciem przez AI 1, jak i z przejściem do −1 przy innym źródle wzrostu licznika owner 1. Przy
  `latwy-s7` (t59) `citiesAll` rośnie o 1 (nowe miasto w świecie). Rozstrzygnięcie wymaga śladu per miasto (nie
  istnieje w zapisie; patrz §4).
- W `normalny-s7` licznik owner 1 spada z 16 do 15 w t59 (owner 7 zyskuje +1 w tej samej turze). Miasto mogło więc
  zmienić właściciela dwa razy; nie ustalono tego.
- W V4 licznik owner 1 rośnie 5→6 w t29, gdy miasto gracza znika; to jest zgodne z przejęciem przez AI 1, ale też z
  przejęciem przez barbarzyńców, bo −1 nie jest liczone.
- Linia konsoli `[Barbarzyncy] Miasto city0: spawn Wojownik Sherden @ (80,54)` z biegu `normalny-s7` nie ma numeru tury
  i identyfikator `city0` może oznaczać różne miasta w różnych cywilizacjach. Nie jest dowodem przejęcia przez
  barbarzyńców.

## 3. Bunt gracza i miasta z buntem

- Zdarzenia konsoli (`dane/*.events.txt`): 0 wpisów `[Rebelia]` dotyczących miasta gracza we wszystkich 10 biegach.
  Wpisy `[Bunt] Tura N <miasto> → migracja −1 do <miasto>` (9–16 na bieg) dotyczą miast AI.
- Zapisy nie zawierają pola Porządku miast (`porPctSuma`, `krytyczne`, `ponizejProgu`) dla właściciela 0 w tych
  biegach. Minimalnego Porządku gracza NIE ZMIERZONO w tej rundzie.
- Wniosek o „częstości buntu gracza 0/9” zastąpiony: 0 zaobserwowanych buntów gracza w 10 biegach, z których gracz
  miał 1 miasto i 0 jednostek wojskowych (gracz pasywny). Taka próba NIE pozwala oszacować częstości buntu przy
  realnej grze; ten wniosek nie jest podstawą decyzji o balansie.

## 4. Czego NIE zmierzono (zamknięte uczciwie)

- Porządek gracza (min/śr po turach): NIE ZMIERZONO. Zapisy PLRREVOLT go nie zawierają; `cityOrderState` (main.ts, lokalna
  mapa) nie ma hooka odczytu bez zmiany `gra/src`, a zmiana kodu była poza zakresem tematu.
- Dokładna linia kodu, która ustawiła owner −1 dla miasta gracza w t29 (V4): NIE ZMIERZONO i NIE ZIDENTYFIKOWANO.
  Pętla buntu (`main.ts:45254-45289`) nie prowadzi do −1 (`shouldStartCityRebellion` zwraca false dla właściciela −1,
  `isAiOwner(−1)` = false, `human-owners.ts:47-52`). Źródłem może być przejęcie przez barbarzyńców (`barbarians.ts:51`),
  ale tego nie udowodniono.
- Etykieta „Bunt skrajny” przy owner −1 w t30–31 i flaga „osiedle”: NIE WYJAŚNIONE.
- Skutek w UI po utracie ostatniego miasta: NIE ZMIERZONO. Statycznie: `victory.ts:217` zwraca `rodzaj: 'przegrana'`
  dla gracza bez miast (gdy był kiedyś miastem); ekran porażki to `pokazEkranPorazki` (`main.ts:39043`, wywołania
  `main.ts:39055-39061`). Runner pracował z wyłączonym zwycięstwem (`suppressVictory`) i kontynuował tury po utracie
  miasta (ostatnia tura 60 w biegach z utratą), więc ekran NIE był odczytywany.
- Odtworzenie minimalne utraty ostatniego miasta przez bunt: NIE WYKONANO (żaden bieg nie wywołał buntu gracza).
- Warunki wyzwalające bunt miasta gracza przy niskim Porządku: NIE ZMIERZONO na żywo; kod (§5) jest jedynym źródłem.
- Porządek w danych AIBAL2 (osobne biegi, `analiza-zapisow-aibal2.txt`): wcześniejsza wersja tego dokumentu podawała
  zakres 26–49% dla gracza; ten zakres NIE został odtworzony w tej rundzie (narzędzie porządku nie było w tej gałęzi)
  i nie jest podstawą wniosków.

## 5. Kod (potwierdzone na bazie 858b4c981, numery linii z `grep -n`)

- `gra/src/game/society-breakdown.ts:218-219` — `REVOLT_CRITICAL_POR_PCT = 12`, `REVOLT_GRACE_TURNS = 3`.
- `gra/src/game/society-breakdown.ts:232` — `REBEL_FACTION_OWNER_ID = -99`.
- `gra/src/game/society-breakdown.ts:522-533` — `shouldStartCityRebellion`: `aiKeepsLastCity = ownerIsAi && ownerOtherCities < 1`
  (:530); zwrot `shouldTriggerRebellion && !hasRebelState && (ownerIsHuman || (aiCityRebellionEnabled && !aiKeepsLastCity))` (:531-532).
  Dla gracza brak warunku na liczbę miast.
- `gra/src/main.ts:41836` — `city.ownerId = REBEL_FACTION_OWNER_ID` (w `transferCityToRebelFactionWithLedger`).
- `gra/src/main.ts:31628` — `c.ownerId = REBEL_FACTION_OWNER_ID` (hak testowy `stageRebelCity`).
- `gra/src/main.ts:45254` — `rebelByPlayer = isHuman(rebelOwnerPrev)`; `:45289` — komunikat buntu gracza („Miasto nie jest już Twoje”).
- `gra/src/game/barbarians.ts:51` — `BARBARIAN_OWNER_ID = -1`.
- `gra/src/game/victory.ts:217` — `rodzaj: 'przegrana'`.

## 6. Propozycje (NIE decyzja; bez zmiany balansu)

1. Pomiar: dopisać do runnera zapis zmiany `ownerId` każdego miasta gracza z przyczyną (bunt / barbarzyńcy / podbój
   AI) i odczyt Porządku. Wymaga zmiany `gra/src` (hak tylko do odczytu) — osobny temat z zgodą orkiestratora.
2. Decyzja o ochronie ostatniego miasta gracza przed buntem: pytanie ABC do właściciela dopiero po punkcie 1.
3. Dziewięć biegów z pełnym Porządkiem i wpisami przyczyn — po punkcie 1.
