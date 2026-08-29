# FINAL CONTROL — R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1 (runda 1)

TEMAT: R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1
DOMAIN: GAME
ROLA: Final Control, runda 1
DATA: 2026-08-27
WORKTREE: `/home/user/wt-fc-zelazo-wojna` (detached HEAD na
`origin/autobot/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1`)

---

## 1. Kontrola proceduralna (obowiązkowa)

`git fetch origin autobot/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1` — wykonany.

| Co | Wynik |
|---|---|
| `origin/autobot/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1` | `0a39c7a335f385821b237bf46ebf3bd0ca7b0e14` |
| Commit Operatora | `5532f3f160123e0e7a44952b59aabac7416563bc` — „wymuszona wojna epoki Zelaza (wzor Brazu 1:1)" |
| Commit Evaluatora | `0a39c7a3` — „raport Evaluatora (runda 1) — PASS-WITH-NOTES" |
| Baza gałęzi (merge-base z `main`) | `9015380baeab2f950f83faee8749848624d0118a` |
| `git status --porcelain` w worktree FC | **PUSTO** |

**ZMIANY SĄ W COMMITACH.** Praca niezacommitowana: BRAK. Nie ma blokera proceduralnego.

Uwaga porządkowa (nie bloker): lokalna gałąź `autobot/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1`
w repo głównym stoi jeszcze na `5532f3f1` (jest zajęta przez worktree Operatora
`/home/user/wt-op-zelazo-wojna`), więc pracowałem na detached HEAD z `origin/…`. Prawdą
jest `origin` — i to `origin` ma komplet dwóch commitów.

---

## 2. Granice §9 — sprawdzone niezależnie od obu poprzednich raportów

Zakres liczony od bazy: `git diff 9015380b 0a39c7a3`.

**Filtr odwrotny allowlisty — PUSTY.** Komenda i wynik:

```
git diff --name-only 9015380b 0a39c7a3 | grep -v -E '^(gra/src/game/forced-war-iron\.ts|
  gra/src/game/forced-war-common\.ts|gra/src/game/ai\.ts|gra/src/main\.ts|gra/tools/|
  dyspozycje/autobot/runs/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1/)'
→ (zero linii)
```

| Granica | Wynik |
|---|---|
| 32 pliki, wszystkie w allowliście | OK |
| Usunięcia w całym diffie | **0** (`--numstat`: każda linia ma `0` w kolumnie deletions) |
| `dyspozycje/WERSJE.md` | NIETKNIĘTY |
| `gra/src/game/forced-war-common.ts` | NIETKNIĘTY (jedyny zmieniony `forced-war-*` to nowy `forced-war-iron.ts`) |
| `gra/src/game/forced-war-stone.ts` / `forced-war-bronze.ts` | NIETKNIĘTE |
| `git diff --check` | czysto |
| Kod gry poza `ai.ts` + `main.ts` + nowy moduł | brak |
| Warunek wojny ogólnej wobec gracza (`ai.ts:4377-4384`, §14) | nietknięty — nowy blok wstawiony przed `const p:` (linie 4189-4212), poniżej Kamienia, nie dotyka reguł ogólnych |
| Narzędzia pomiarowe piszą do `gra/src` | NIE — `writeFileSync` wyłącznie do katalogów dowodów; żadne `tools/*zelazo*` nie jest importowane z `src/` |

`gra/src/main.ts` +244/-0, `gra/src/game/ai.ts` +38/-0 — zmiana jest addytywna, punktowa
i nie modyfikuje ani jednej istniejącej linii, co było wymogiem dispatchu przy trzech
równoległych tematach na `main.ts`.

---

## 3. Bramki — uruchomione własnoręcznie w `/home/user/wt-fc-zelazo-wojna/gra`

| Bramka | Wynik |
|---|---|
| `tools/logic-test.cjs` | **LOGIC OK (213/213)** |
| `tools/tech-tree-test.cjs` | **19 pass, 0 fail** |
| `tools/research-test.cjs` | **33/33, ALL GREEN** |
| `tools/unit-replace-test.cjs` | **13/13** |
| `tools/combat-test.cjs` | **6/6** |
| `tsc --noEmit` | **0 błędów** (exit 0) |
| `vite build --outDir /tmp/civ-dist-zelazo-wojna-fc --emptyOutDir` | **OK, 849 modułów, 19.62s** |
| `tools/forced-war-stone-test.cjs` | 32/32 (bez pogorszenia) |
| `tools/forced-war-stone-main-guard-test.cjs` | 18 PASS / 0 FAIL (bez pogorszenia) |
| `tools/forced-war-bronze-test.cjs` | 44/44 (bez pogorszenia) |
| `tools/forced-war-bronze-main-guard-test.cjs` | 25 PASS / 0 FAIL (bez pogorszenia) |
| `tools/forced-war-iron-test.cjs` | **46/46** |
| `tools/forced-war-iron-main-guard-test.cjs` | **29 PASS / 0 FAIL** |
| `tools/forced-war-iron-mutant-probe.cjs` | **pokrycie 46/46 i 29/29, exit 0, źródła przywrócone bajt w bajt** (`git status` po sondzie: pusto) |

Liczby zgadzają się co do sztuki z raportem Evaluatora. Kryterium 6 (dowód
nie-tautologiczny) reprodukuje się u mnie niezależnie.

---

## 4. Weryfikacja integrowalności z AKTUALNYM `origin/main`

Baza gałęzi to `9015380b`, ale `origin/main` przesunął się w trakcie pracy do
`127db163` (zintegrowano `R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1` i
`R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1`). To oczekiwane przy trzech równoległych
tematach — sprawdziłem, czy integracja jest wykonalna, zamiast zostawiać to orkiestratorowi
w ciemno.

- Jedyny plik wspólny obu zakresów: `gra/src/main.ts`.
- `git merge-tree --write-tree origin/main 0a39c7a3` → **exit 0, ZERO konfliktów**,
  drzewo `5275b8cd7459a5e857f46feb7b4b64c38c46e2cd`.
- Zmaterializowałem to drzewo w jednorazowym worktree probnym i przepuściłem przez bramki:
  `tsc --noEmit` **0 błędów**, `logic` **213/213**, `forced-war-iron` **46/46**,
  `forced-war-iron-main-guard` **29/0**, `forced-war-stone-main-guard` **18/0**,
  `forced-war-bronze-main-guard` **25/0**, a także bramki świeżo zintegrowanych tematów:
  `farma-lesie-usun-istniejace` **143/0**, `farma-nie-w-lesie` **136/0**,
  `hodowla-las` **100/0**, `map-improvement-qualify` **126/0**.
- Worktree probny usunięty; commit probny `a585de79` **nigdzie nie wypchnięty** i nie jest
  częścią gałęzi tematu.

**Wniosek: scalenie na dziś jest bezkonfliktowe i zielone po obu stronach.**

---

## 5. Kontrola merytoryczna wiązania (czytanie kodu, nie tylko bramek)

Sprawdziłem blok Żelaza linia po linii przeciw blokowi Brązu (`main.ts:28193-28251`
vs `main.ts:28330-28402`). Jest wierną kopią wzorca z własnymi nazwami: ten sam zestaw
filtrów napastnika (`ownerId > 0`, `!typCityCopyOwners`, `!isBarbarian`,
`!eliminatedOwners`, `!isOwnerClusterCityState`), ta sama konstrukcja puli kandydatów
z `aiOwnerList`, ten sam `refCity`, ten sam zestaw predykatów blokujących
(NAP / `isPeaceLockedBetween` / `allianceFormalKindBetween`), ten sam wzorzec
`wasPending` → `pending` konsumowany dopiero przy sukcesie (B4). Wczesny `return`
w `ai.ts` ma identyczny czteroskładnikowy guard co Brąz i Kamień
(`!stanWojny && !peaceLocked && !hasNapTreaty && !hasAllianceTreaty`) i stoi PRZED
regułami ogólnymi (`const p:` na 4214) — zgodnie z ECHO właściciela. Haki przejęcia
miasta wpięte w OBA lejki zmiany `city.ownerId` (`applyCityCaptureToMap`
i `resolveSiegeSurrender`), cleanup pokoju w `finalizePeaceTreatyBetween`, save/load
w komplecie 4 pól, czyszczenie przy eliminacji i przy nowej grze — wszystko obecne.

**Werdykt w sprawie wyzwalacza `isIronEraEntry(prev < 3 && next >= 3)`: podtrzymuję
akceptację Evaluatora.** Warunek jest ścisłym nadzbiorem `2→3`, epoka nigdy nie maleje,
więc fałszywie odpalić nie może, a `computeMainCivEraFromResearch` awansuje pętlą `while`,
co czyni sztywną równość realnie zawodną. Mutacja M05 sondy pilnuje tej różnicy.

---

## 6. ZNALEZISKO FINAL CONTROL — spoza obu poprzednich raportów

### F1 (NOWE, nie ma go ani u Operatora, ani u Evaluatora) — bramka „już w wojnie" liczy wojnę z barbarzyńcami, gdy tylko barbarzyńcy posiądą jakiekolwiek miasto

Uzbrojenie mechanizmu przechodzi przez
`const alreadyAtWarAnyRole = countActiveWarsForOwner(ownerId) > 0` (`main.ts:28350`).
A `countActiveWarsForOwner` (`main.ts:17021-17028`) iteruje po `allPowerOwnerIds()`,
które buduje listę właścicieli **z listy miast** (`main.ts:13608-13613`):

```ts
function allPowerOwnerIds(): number[] {
  const ids = new Set<number>([0]);
  for (const c of cities) ids.add(c.ownerId);
  for (const a of aiStartHexes) ids.add(a.ownerId);
  return Array.from(ids);
}
```

Barbarzyńca (`BARBARIAN_OWNER_ID = -1`) **może posiadać miasta** — kod jawnie z tym
pracuje (`main.ts:29427`: `cities.filter(c => isBarbarian(c.ownerId))`). Od pierwszej tury,
w której barbarzyńcy trzymają choćby jedno miasto, `-1` wchodzi do `allPowerOwnerIds()`,
a wtedy `countActiveWarsForOwner` doliczy stałą wojnę każdej cywilizacji z barbarzyńcami.

**Dowód, że ta wojna faktycznie stoi otwarta u wszystkich** — z artefaktu WŁASNEGO
Evaluatora `dowody-ev/EV-PO-UNBLOCK-seed-4001.json`, `finalAudit` na turze 12:
**43 pary `<owner>x-1` mają status `wojna`** (w tym wszystkie sześć głównych AI:
`1x-1, 8x-1, 15x-1, 22x-1, 29x-1, 36x-1`). Ten sam obraz w `EV-STOCK-seed-4001.json`.

**Dlaczego pomiar mimo to wyszedł zielony:** w tym samym `finalAudit` owner `-1` ma
`cityCount: 0`. Barbarzyńcy w oknie 11-12 tur nie zdążyli zdobyć miasta, więc `-1` nie
trafiło do `allPowerOwnerIds()` i bramka była na te 43 wojny **ślepa**. Pomiar
PO/PRZED/STOCK Operatora i Evaluatora jest więc poprawny, ale jego zieloność zależy
od warunku, którego nikt nie kontrolował ani nie zadeklarował.

**Konsekwencja dla rozgrywki:** w chwili, w której barbarzyńcy zdobędą pierwsze miasto,
`alreadyAtWarAnyRole` staje się `true` **jednocześnie dla wszystkich głównych cywilizacji**
i wymuszona wojna Żelaza przestaje się uzbrajać na cały czas życia tego miasta. Ponieważ
`pending` nie jest kasowany przy nieudanej próbie (B4), wpis przeżyje — i wystrzeli
w dowolnej późniejszej turze, gdy barbarzyńcy stracą ostatnie miasto, czyli **oderwany
od awansu do Żelaza, który dispatch nazywa wyzwalaczem**.

**Kwalifikacja: NIE JEST TO REGRESJA TEGO TEMATU i NIE BLOKUJE INTEGRACJI.** Kamień
i Brąz używają **dokładnie tego samego wywołania** `countActiveWarsForOwner(ownerId) > 0`
(`main.ts:28205` dla Brązu), więc wada jest odziedziczona po wzorcu, który dispatch kazał
naśladować 1:1 — a naśladowanie 1:1 było wymogiem, nie wyborem Operatora. Poprawianie jej
tutaj byłoby poszerzeniem zakresu (§14) i dotknięciem mechanizmów Kamienia/Brązu, czego
dispatch zabrania wprost.

**Wniosek dla właściciela:** to jest trzecia — obok Z1 i Z5 z noty (c) Evaluatora —
niezależna przyczyna, dla której w normalnej grze wojny między cywilizacjami mogą się nie
pojawiać. Warta osobnego zgłoszenia obejmującego wszystkie trzy epoki naraz (np.
`countActiveWarsForOwner` z opcją pominięcia barbarzyńców przy bramce wojny wymuszonej).

### F2 (doostrzenie noty O2 Evaluatora, z domkniętym śladem skutku)

Evaluator zapisał O2 jako warunkowe („gdyby dwa mechanizmy wybrały ten sam cel").
Sprawdziłem: przy jednoczesnym uzbrojeniu dwóch mechanizmów dla tego samego ownera
w tej samej turze **kolizja jest pewna, nie hipotetyczna** — oba bloki budują pulę
z tego samego `aiOwnerList` tymi samymi sześcioma filtrami, biorą ten sam
`refCity = cities.find(c => c.ownerId === ownerId)`, ten sam zestaw predykatów
blokujących i ten sam deterministyczny `pickForcedWarTargetId`, więc wybór **musi**
być identyczny. Zaksięgują się oba rejestry.

Prześledziłem skutek do końca i **jest on nieszkodliwy**: przy progu miast pierwszy
z `maybeResolve…OnCityCapture` (kolejność w `applyCityCaptureToMap`: Brąz → Kamień →
Żelazo) woła `finalizePeaceTreatyBetween`, a ta woła cleanupy **wszystkich trzech** epok,
kasując obie pary; kolejne wywołanie wychodzi na `if (!st) return`. Nie ma podwójnego
pokoju ani zgubionego odpoczynku — odpoczynek uzbraja się w obu rejestrach.
Zapisuję to, żeby kolejna runda nie otwierała O2 ponownie jako podejrzenia błędu.

### Czego NIE znalazłem

Nie znalazłem żadnej różnicy zachowania wprowadzonej do mechanizmów Kamienia lub Brązu,
żadnego pliku poza allowlistą, żadnej linii usuniętej z istniejącego kodu, żadnej
asercji tautologicznej w bramce Żelaza (sonda czerwieni 46/46 i 29/29) ani rozjazdu
między liczbami w raportach a tym, co sam zmierzyłem.

---

## 7. Noty §13a — podtrzymane

Podtrzymuję wszystkie noty Evaluatora bez zmian, w szczególności:

- **(a) BRAK DOWODU** — auto-pokój po 2 miastach, 20 tur odpoczynku i 20 tur cooldownu
  **nie zaobserwowane w rozgrywce**. Pokryte wyłącznie testem jednostkowym i bramką
  **tekstową** (`forced-war-iron-main-guard-test.cjs` czyta `main.ts` jako tekst i pinuje
  kształt wiązania regexem — plik deklaruje to uczciwie w nagłówku). Zgodnie z §13a to
  **nie jest dowód zachowania w rozgrywce**. Nota zostaje otwarta.
- **(b) BRAK DOWODU** — naturalne tempo dojścia do Żelaza nie zmierzone; obie metody
  używają akceleratora.
- **(c)** — potwierdzona podwójna blokada Z1/Z5 w niezmodyfikowanej grze; **dokładam do
  niej F1 jako trzecią, niezależną przyczynę**.
- **(e)** — luka Brązu (brak czyszczenia 4 rejestrów przy nowej grze), poza zakresem,
  do osobnego zgłoszenia.

Kryteria końca 1-8 dispatchu: **wszystkie spełnione** (4 i częściowo 5 z jawnie
zapisanymi ograniczeniami dowodowymi wyżej).

---

## 8. Kontrakt raportu

```
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1
GOAL: wymuszona wojna epoki Żelaza (3. epoka) wzorem Brązu — wyzwalacz = awans do Żelaza,
      2 miasta / 20 tur odpoczynku / 20 tur cooldownu, miasta-państwa i gracz wyłączeni
ZMIANY/COMMIT: zweryfikowane 5532f3f1 (Operator) + 0a39c7a3 (Evaluator) na
      origin/autobot/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1, baza 9015380b. 32 pliki,
      wszystkie w allowliście, filtr odwrotny PUSTY, zero usunięć, git diff --check czysto,
      WERSJE.md i forced-war-common.ts nietknięte, git status pusty (zmiany SĄ W COMMITACH).
      Własny commit FC: raport 03-final-control.md (bez zmian w gra/src).
TESTY: logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 · combat 6/6 ·
      tsc --noEmit 0 błędów · vite build --outDir /tmp/civ-dist-zelazo-wojna-fc OK ·
      stone 32/32 + stone-main-guard 18/0 · bronze 44/44 + bronze-main-guard 25/0 ·
      iron 46/46 + iron-main-guard 29/0 · sonda mutacyjna 46/46 i 29/29, exit 0,
      źródła przywrócone bajt w bajt · PRÓBNE SCALENIE z origin/main 127db163:
      merge-tree bez konfliktów + tsc 0 i wszystkie powyższe bramki zielone na scaleniu,
      łącznie z bramkami świeżo zintegrowanych tematów (143/0, 136/0, 100/0, 126/0)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge origin/main → gałąź tematu jest czysty),
      potem READY_FOR_DEPLOY. Osobno do rejestru: F1 (bramka „już w wojnie" liczy wojnę
      z barbarzyńcami posiadającymi miasto — dotyczy WSZYSTKICH TRZECH epok), nota (e)
      Evaluatora (Brąz nie czyści rejestrów przy nowej grze) oraz otwarte noty (a)/(b)/(c).
DEPLOY/PUSH: NIE WYKONANO (wypchnięta wyłącznie gałąź tematu; main nietknięty)
```

**GOTOWOSC DO INTEGRACJI: TAK**
