TEMAT: R-MIASTA-ELIMINACJA-LUP-KWOTY-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME (UI/tekst)
ŚCIEŻKA: gra/src/main.ts (WYŁĄCZNIE treść komunikatu `eliminatedDetails`)
MODEL+EFFORT: claude-sonnet-5, effort high

WYZWALACZ (zgłoszenie właściciela, 2026-09-03)
"Gdy zdobędzie się stolicę jakiejś cywilizacji lub państwa, czyli ostatnie miasto danej
cywilizacji, powinien pojawić się komunikat o tym, ile udało się nam zdobyć w tym przejęciu.
Najlepiej, aby było to widoczne na planszy wyświetlanej po zdobyciu miasta."

RECON (wykonane przez orkiestratora — nie powtarzaj, zweryfikuj i buduj na tym)
Mechanizm WYŚWIETLANIA już istnieje i już jest "widoczny na planszy po zdobyciu miasta":
`gra/src/ui/cityCaptureNotice.ts` (linie 21-30) ma pola `eliminatedCivLabel?`/
`eliminatedDetails?` — gdy ustawione, panel pokazuje nagłówek "ELIMINACJA!" zamiast "Miasto
zdobyte" plus sub-linię z `eliminatedCivLabel` i treścią `eliminatedDetails`. To NIE wymaga
nowego UI — problem jest wyłącznie w TREŚCI tekstu.

Źródło: `runCapitalCapturePlunder()` (`main.ts:25239-25353`), konkretnie linie 25324-25327:
```
const eliminatedCivLabel = civLabelForOwner(oldOwner);
const eliminatedDetails = barbCaptor
  ? 'Skarbiec i nauka przepadły (barbarzyńcy nie dziedziczą łupu).'
  : `Skarbiec, nauka i ${outcome.techSkopiowane.length} tech(y) przejęte. Zdobycze Power: +${lostPower}.`;
```
`outcome` (typ `CapitalCaptureOutcome`, `gra/src/game/capital-capture.ts:144-163`) MA już
policzone i DOSTĘPNE w tym miejscu (ten sam `outcome` obiekt) dokładne kwoty:
- `outcome.skarbiecPrzejety: number` — realna kwota złota przejęta do skarbca zwycięzcy
  (`capital-capture.ts:190-194`, zawsze liczone, w OBU zdarzeniach: przejęcie stolicy I
  eliminacja).
- `outcome.naukaPrzejeta: number` — realna kwota puli nauki przejęta (`capital-capture.ts:
  199-208`, liczone WYŁĄCZNIE przy eliminacji, `0` przy zwykłym przejęciu stolicy z sukcesją).
Obie liczby są DZIŚ CICHO POMIJANE w `eliminatedDetails` — tekst mówi ogólnikowo "Skarbiec,
nauka i N tech(y) przejęte" bez ŻADNEJ konkretnej kwoty złota/nauki, mimo że `+${lostPower}`
(Power) TUŻ OBOK w tym samym zdaniu POKAZUJE konkretną liczbę. To jest dokładnie luka, o
którą pyta właściciel: "ile udało się nam zdobyć" nie ma dziś odpowiedzi liczbowej dla
złota/nauki, tylko dla Power.
Uwaga: zwrot `runCapitalCapturePlunder` na końcu funkcji (linia 25352) —
`{ eliminatedCivLabel, eliminatedDetails }` — jest zwracany WYŁĄCZNIE gdy `newOwner === 0`
(zdobywcą jest gracz) i `!isTriumph` — to jest ZAMIERZONE (modal "widoczny na planszy" ma
sens tylko dla akcji gracza), NIE zmieniaj tego warunku. Dla zdobyć AI (newOwner!==0, linia
25342-25349) treść trafia do `showHintMessage` (toast) — ten sam string `eliminatedDetails`
jest reużywany, więc poprawka automatycznie naprawia OBA kanały (modal gracza + toast AI) bez
dodatkowych zmian.

GOAL
1. Rozszerz `eliminatedDetails` (main.ts ok. 25325-25327) o KONKRETNE kwoty: kwotę złota
   (`outcome.skarbiecPrzejety`, sformatowaną spójnie z resztą UI gry — sprawdź istniejący
   formatter liczb/waluty używany gdzie indziej w main.ts, np. przy komunikatach
   skarbca/handlu, i użyj DOKŁADNIE tego samego wzorca zamiast wymyślać nowy) oraz — gdy
   `outcome.naukaPrzejeta > 0` — kwotę przejętej nauki. Gdy `skarbiecPrzejety === 0` (pusty
   skarbiec ofiary), sformułuj to jawnie (np. "Skarbiec był pusty") zamiast pomijać zdanie
   milcząco — gracz ma wiedzieć że sprawdzono, nie że komunikat "zgubił" informację.
2. Gałąź barbarzyńska (`barbCaptor`) ZOSTAJE bez zmian liczbowych (barbarzyńcy nie dziedziczą
   łupu — `barbarianCaptorResourceAccess` no-opuje zapis do newOwner, więc kwoty i tak są dla
   nich nieistotne/zerowe z perspektywy zwycięzcy) — tylko upewnij się że tekst nadal ma sens
   po zmianie sąsiedniej gałęzi (nie musi się zmieniać, jeśli już jest poprawny).
3. Zero zmian w SAMEJ logice liczenia/transferu łupu (`capital-capture.ts`,
   `applyBarbarianAwareCapitalCapturePlunder`) — to działa poprawnie i przekazuje właściwe
   kwoty już dziś, problem jest wyłącznie w TEKŚCIE komunikatu w main.ts.
4. Zero zmian w mechanizmie wyświetlania (`cityCaptureNotice.ts`) — pola `eliminatedCivLabel`/
   `eliminatedDetails` już działają, przyjmują dowolny string, nic tam nie trzeba zmieniać.

KRYTERIA KOŃCA (binarne)
1. Test jednostkowy/integracyjny: symulacja eliminacji cywilizacji ze SKARBCEM > 0 →
   `eliminatedDetails` zawiera dokładną, sprawdzalną liczbę zgodną z `outcome.skarbiecPrzejety`
   (nie tylko słowo "Skarbiec").
2. Test: eliminacja ze SKARBCEM = 0 → `eliminatedDetails` jawnie komunikuje pusty skarbiec
   (nie milczy o tym wymiarze).
3. Test: eliminacja z `naukaPrzejeta > 0` → `eliminatedDetails` zawiera dokładną liczbę
   przejętej nauki.
4. Zero regresji: Power (`+${lostPower}`) i liczba techów nadal obecne w tekście dokładnie
   jak dziś.
5. Żywy dowód (jeśli praktyczny w rozsądnym czasie, wzorem istniejących testów eliminacji w
   `gra/tools/*capture*-test.cjs`/`*capital*-test.cjs`) — realna eliminacja w symulacji
   silnika pokazująca faktyczny tekst komunikatu, nie tylko wywołanie funkcji w izolacji.
6. `tsc --noEmit` czysty, istniejące testy przejęcia stolicy/eliminacji nadal zielone (grep
   `gra/tools/*capital*-test.cjs`, `gra/tools/*capture*-test.cjs`, `gra/tools/*eliminac*-test.cjs`),
   5 bramek referencyjnych zielone.

ALLOWLISTA (nic poza tym)
- gra/src/main.ts (WYŁĄCZNIE treść `eliminatedDetails`, linie ok. 25324-25327 — nie ruszaj
  reszty `runCapitalCapturePlunder`).
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: gra/src/game/capital-capture.ts (logika liczenia/transferu łupu —
ZERO zmian, dane są już poprawne), gra/src/ui/cityCaptureNotice.ts (mechanizm wyświetlania —
ZERO zmian), zmiana warunku `newOwner===0 && !isTriumph` decydującego kto dostaje modal vs
toast, dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json.

IZOLACJA
worktree /home/user/wt-miasta-eliminacja-lup-kwoty, gałąź
autobot/R-MIASTA-ELIMINACJA-LUP-KWOTY-Q1, baza jawnie: origin/main (najnowszy commit na
moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona kompilacja to
node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1 za spełnione bez pokazania w raporcie DOKŁADNEGO tekstu
wygenerowanego komunikatu z konkretną, sprawdzalną liczbą (nie samego kodu formatującego bez
uruchomienia). Zakaz założenia że istnieje gotowy formatter waluty bez faktycznego grepa i
pokazania cytatu z main.ts gdzie jest używany gdzie indziej.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora.
