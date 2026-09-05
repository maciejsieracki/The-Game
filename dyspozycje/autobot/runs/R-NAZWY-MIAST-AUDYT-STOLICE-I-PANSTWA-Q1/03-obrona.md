# R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1 — Obrona Operatora, runda 1/5

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
GOAL: zgodny z `00-dispatch.md` — `Aszur`/`Byblos` na `[0]` (`Ninive`, `Tyr` dalej na listach) + rozłączne pule `miasta_panstwa` × `miasta_cywilizacji` dla 15 cywilizacji.
MODEL+EFFORT: Opus 5, effort high · ROLA: Operator (obrona, §3c pkt 2) · RUNDY: 1/5 (obrona nie zużywa rundy, §16b pkt 5)

## OBRONA

**1 → PRZYJMUJĘ.** `git diff --stat 01da66d1 HEAD` wykazuje `gra/data/civs.json`; §ALLOWLISTA go nie wymienia. Bez niego `validateCityNamesPools` (`civ-names.ts:167-172`) zwraca `nazwyKlastra ≠ miasta_panstwa` i kryterium 6 jest nieosiągalne. Kandydat do `DO DECYZJI CZŁOWIEKA` — ratyfikacja allowlisty należy do właściciela.

**2 → PRZYJMUJĘ (a) / ODRZUCAM (b).**
(a) Zasięg: raport wymieniał tylko Greków, dotyczy 14 cywilizacji. Poprawione — `01-operator.md` BLOKADA 2, status podniesiony.
(b) „Bramka błogosławi regresję" — odrzucam. `chinczycy.nazwyKlastra[0] = "Qin"` **przed i po** (`git show 01da66d1:gra/data/civs.json`); `civ-names.ts:48-52` opisuje ten sam defekt jako znany i naprawiony wyłącznie na ścieżce z pulą. Asercja produkcyjna `playerStartCityName(civs,'grecy',pools) === 'Ateny'` stoi **nietknięta i zielona** (`city-names-pool-test.cjs:56`). Zmieniona linia `civ-names-test.cjs:53` testuje wyłącznie fallback bez puli; §ALLOWLISTA dopuszcza „aktualizację zaszytych wartości, jawnie uzasadnioną".

**3 → PRZYJMUJĘ.** `01-operator.md` ma `STATUS: DECISION_REQUIRED` ze śladem korekty (§13b).

**4 → PRZYJMUJĘ.** Antinoupolis = fundacja Hadriana, 130 n.e. Podmiana: `egipt.miasta_panstwa[3] = "Hebenu"` — egipska nazwa stolicy XVI nomu Górnego Egiptu (Oryks, Kom el-Ahmar Sawaris), poświadczona od Starego Państwa grobowcami nomarchów.

**5 → PRZYJMUJĘ.** Karanis = fundacja ptolemejska III w. p.n.e. Podmiana: `[5] = "Tjebu"` — egipska nazwa stolicy X nomu Górnego Egiptu (Wadżet), u Greków Antaeopolis. Obie podmiany zbijają udział form greckich na tej liście z 6/10 do 4/10.

**6 → PRZYJMUJĘ.** Nota Operatora była błędna. `Wieligard`/`Veligrad` to rekonstrukcja z łac. `Michelenburg`, więc jej nie podstawiam. Podmiana: `slowianie.miasta_panstwa[2] = "Uznam"` — gród na wyspie Uznam (Pomorze Zachodnie), `castrum Uznam`, miejsce wiecu podczas misji Ottona z Bambergu 1128; forma słowiańska.

**7 → ODRZUCAM.** Trzy binarne kryteria wymuszają dokładnie tę zmianę: kryt. 1 żąda literalnie `miasta_cywilizacji[0] = "Aszur"`, kryt. 3 dokładnie 100 pozycji, kryt. 4 braku duplikatów. `Assur` to to samo miasto — zachowanie obu form przy 100 pozycjach wymagałoby usunięcia innej nazwy, czyli **większej** zmiany składu. `git diff 01da66d1 HEAD` pokazuje w całej setce jedną zmianę tekstu (`Assur`→`Aszur`) plus zamianę `[0]`↔`[1]`; konwencja pliku: `Dur-Szarrukin`, `Tuszhan`, `Aszur` w puli Sumeru.

**8 → PRZYJMUJĘ.** `01-operator.md` skrócony do 384 słów; oryginał 609 słów zachowany w `git show 20016500:…/01-operator.md`.

## TESTY (po poprawkach 4–6, uruchomione ponownie)

nazwy-miast-rozlaczne-pule 9/9 · city-names-pool 12/12 · city-names-pools 6/6 · civ-names 6/6 · mapa-etykieta-stolicy 47/47 · display-names 27/27 · logic 213/213 · tech-tree 19/19 · research ALL GREEN · unit-replace 13/13 · combat OK · `tsc --noEmit` exit 0 · `git diff --check` czysto.
Nietautologiczność powtórzona po podmianie: `slowianie.miasta_panstwa[2] → "Kijów"` → **7 passed, 2 failed** (K2 i K5), restore → 9/9.

## BLOKADY

Zarzut 1 i 2(a) — decyzje właściciela: allowlista o `gra/data/civs.json`, osobny temat na `gra/src/**` dla ścieżki legacy.

RUNDY: 1/5
NASTĘPNY KROK: Final Control (Sonnet 5, effort high) — werdykt per zarzut 1–8 (§3c pkt 3).
DEPLOY/PUSH: NIE WYKONANO
