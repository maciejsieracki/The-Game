# P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1 — Obrona Operatora, runda 1/5

MODEL+EFFORT: Opus 5, effort high (Obrona = druga faza tej samej rundy 1, §3c pkt 2).
Guard §2b: `0ed7d584`, drzewo czyste; `022b82aa` potwierdzone jako przodek HEAD.

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1
GOAL: rozkaz `move` AI major na sąsiedni, niebroniony obcy heks miasta skutkuje przejęciem; jednostka nie traci tury bez efektu.

## OBRONA — per zarzut

**1 -> PRZYJMUJĘ.** Zreprodukowane niezależnie (realny `decideAITurn` + realny `computePath`
+ `onCapture` z realnym warunkiem kotwicy `main.ts:26629`): Robotnik i Osadnik AI obok pustego
obcego miasta → `moved=true`, `7,6 -> 7,7`, `captured=false`, `ownerId` 2, `ruchLeft=0`; gracz
jest tam odrzucany bezwarunkowo (`main.ts:23195`). Zdanie K3 „wszystkie asymetrie węższe" było
fałszywe. POPRAWKA: `city-hex-movement.ts:58` `if (unitIsCivilian) return false;` (parametr
WYMAGANY — tsc egzekwuje u wywołujących), `ai-city-capture-executor.ts:49,94` przenosi flagę,
`main.ts:31535` podaje `isCivilianUnit(u)`, `ai.ts:2801` i `:2910` nie emitują już rozkazu na heks
miasta dla cywila. ŚLAD PO: Wojownik bez zmian (`ownerId 2 -> 1`, `7,6 -> 7,7`); Robotnik/Osadnik
dostają zwykły ruch `7,6 -> 6,6` — bez parkowania w cudzym mieście i bez tury straconej.

**2 -> PRZYJMUJĘ.** Dowód zarzutu wbudowany jako STAŁA asercja: `K8d` bunduje egzekutor z mutantem
`city-hex-movement.ts` bez `if (hasDefenders) return false;` i wymaga 2 czerwonych. Każdy przypadek
K4/K7 sprawdza teraz `moved === false` i niezmienioną pozycję (`assertNoEntry`, bramka:348).
Mutant E1 przechodził przy 53/53 — teraz czerwieni bramkę.

**3 -> PRZYJMUJĘ co do istoty; ODRZUCAM wymóg E2E w Chromium.** Istota trafna: harness pomijał
kotwicę i to dlatego zarzut 1 przeszedł. `onCapture` wykonuje teraz WSZYSTKIE trzy warunki
produkcyjne w tej samej kolejności (kotwica niecywilna, „miasto już moje",
`canCaptureCityWithoutBattle`), z realnych modułów, zero kopii formuł; `A6g` pilnuje, że `main.ts`
nadal ma ten warunek. Dowód odrzucenia drugiej części: weryfikacja w żywej przeglądarce jest
wymagana dla tematów **wizualnych/UX** (R-PROC-AUTOBOT §9 poz. 6a), a `00-dispatch.md` kryteria 5-9
jej nie żądają — temat jest logiczny, nietautologiczność dowiedziona mutacjami K6/K8. Podniesienie
progu dowodu dla tematów logicznych to kandydat DO DECYZJI CZŁOWIEKA; norma sama tego nie rozstrzyga.

**4 -> PRZYJMUJĘ.** `01-operator-runda1.md` ma komplet pól kontraktu (SHA `1e5a850d` wpisane wprost).
Pierwotny tekst zachowany w commicie `1e5a850d`.

**5 -> PRZYJMUJĘ.** `01-operator-runda1.md` skrócony z 695 do 388 słów.

## ZMIANY/COMMIT

Allowlista, 6 plików: `city-hex-movement.ts`, `ai-city-capture-executor.ts`, `ai.ts`,
`main.ts` (JEDEN hunk — wyłącznie wywołanie `executeAiCityMove`),
`gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs`, raporty `01`/`03`. Zero `barbarians.ts` (§2b).
SHA commita obrony (kod + bramka + raporty): **`f86559fd`**. Ten wiersz z SHA dopisany commitem następnym (SHA nie może wskazywać commita, w którym sam leży).

## TESTY (po poprawkach)

- `tsc --noEmit`: 0 błędów. Referencyjne: logic 213/213 · tech-tree 19/19 · research 33/33 ·
  unit-replace 13/13 · combat 6/6.
- Bramka tematu: **84/84**, exit 0 (było 53/53; +31 asercji: K7 cywile, K8 mutacje bramek wejścia, A6g).
- MUTACJA POPRAWKI (kryterium 6, przez KOPIĘ pliku, nie `git checkout`): `opts.unitIsCivilian` →
  `false` w egzekutorze → bramka **79/84, 5 faili**, exit 1 (K7c/d dla Robotnika i Osadnika + K8a);
  przywrócone `cp`, `git diff --quiet` zielone, bramka znów 84/84.
- Mutacje wewnątrz bramki: MUT-1/3 → 4 czerwone, MUT-2 → 2, MUT-4 → przejęcie, MUT-5 (cywil) → 2,
  MUT-6 (obrońcy) → 2, MUT-7 (`maMur`) → 4.
- Sąsiedzi zieloni: ai-city-capture-integration 14, city-hex-movement 13, siege-defenders 12/0,
  capital-capture 86/86, post-capture-law 25/0, map-attack-city 13/0, map-siege 6/0, siege-ai 17/0,
  ai-fog 8/8, barb-city-behavior 178/0, barb-city-owner-contract 3/3, barbarians 213/0,
  city-limit-conquered 15/0 oraz 27 dalszych bramek rodziny `ai-`/`city-state-`.
- Czerwone preegzystujące, liczby IDENTYCZNE z bazą (żadna nie urosła po zmianie `ai.ts`/`main.ts`):
  ai-test 287/8, ai-slider 33/5, ai-balans-step3 7/1, ai-praca-split-parity 21/1,
  city-state-offensive-normal-easy 21/6, barb-camp-destruction 82/2, barb-city-capture-cluster 92/1,
  miasta-panstwa-wylaczone 52/3, -ui-render 11/1, empire-panel-obywatele 113/2.

## BLOKADY

Brak. Nota: wpis nowej bramki do tabeli §6 (`docs/decyzje/**`, poza allowlistą) należy do integracji.

RUNDY: 1/5 (Obrona nie jest osobną rundą — §16b pkt 5)
NASTĘPNY KROK: Final Control — werdykt per zarzut (§3c pkt 3)
DEPLOY/PUSH: NIE WYKONANO
