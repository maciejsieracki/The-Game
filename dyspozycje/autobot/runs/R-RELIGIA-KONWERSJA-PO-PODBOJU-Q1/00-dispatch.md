# R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1

STATUS: DYSPOZYCJA
DOMAIN: GAME
TEMAT: R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a, temat balansowy/mechaniczny,
nie wizualny).

## GENEZA

Zgłoszenie: po podboju obca religia nigdy nie jest dominująca w zdobytym mieście — maszyneria
konwersji (`convertViaTemple`) istnieje, ale nigdy się nie odpala, bo warunek wejściowy
(`foreignReligionDominant`) po podboju nigdy nie jest prawdziwy.

**ECHO właściciela: „Pełna symetria z kulturą"** — trzy punkty naraz:
1. Odwrócenie udziału własnej religii przy podboju (odpowiednik istniejącego mechanizmu
   kultury), analogicznie do dziś istniejącego TYLKO dla kultury.
2. Narastanie co turę z sufitem (konwersja przez świątynię) — `convertViaTemple` ma zacząć
   się faktycznie odpalać po podboju.
3. Zniesienie binarności kary religii.

## STAN DZISIEJSZY (zweryfikowany bezpośrednim czytaniem kodu na aktualnym `main`,
zweryfikuj grepem PRZED edycją — linie w `main.ts` mogły się przesunąć)

**Punkt 3 JUŻ SPEŁNIONY, nie dotykaj.** `gra/src/game/culture-religion.ts` ok. linii 821-828,
`religionHappiness()`: `return 2 * religionOwnShare(state, ownReligion) - 1;` — proporcjonalny
wskaźnik [-1,+1], zero binarnego skoku. To jest efekt uboczny G4 z `R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1`
(decyzja właściciela 2026-09-05, już zintegrowane). **Operator: zweryfikuj to grepem/testem
i ODNOTUJ w raporcie jako spełnione — NIE buduj od zera, NIE zmieniaj tej funkcji.**

**Punkt 1 — realny stan, dwie ASYMETRYCZNE ścieżki, punkt do naprawy:**
- **Kultura** (wzorzec, już poprawny): `gra/src/game/conquest-stability.ts` ok. linii 40-56,
  funkcja `onCityCapturedCulture(city, newOwnerId, previousOwnerId, opts)`: SAME okrąg
  kulturowy (`sameCultureCircle`, `opts.civKeyForOwner`) → `clearCityCultureMix(city)`
  (pełna zgodność, 100%, **to jest ZAMIERZONE, nie bug**). RÓŻNY okrąg → odwrócenie:
  `city.ownCultureShare = 1 - prev` (inwersja presji sprzed podboju). Wołana z
  `gra/src/game/post-battle-map.ts` ok. linii 494, TUŻ PO `city.ownerId = atkOwner`.
- **Religia** (do naprawy): `gra/src/main.ts` ok. linii 26938-26952 (blok komentowany
  „P-BARB-CAPTURE-GUARD RUNDA 2"): `if (!isBarbarian(atkOwner) && sameCultureCircle(...))
  { cityRelig.set(city.id, defaultCityReligionState(city.population,
  ownerReligionForOwnerId(atkOwner))); }`. SAME okrąg → 100% nowego właściciela (to jest
  SYMETRYCZNE z kulturą, zostaw bez zmian — konsystentne z `onCityCapturedCulture`). **RÓŻNY
  okrąg → NIC się nie dzieje** (`cityRelig` w ogóle nietknięty — miasto zachowuje w 100%
  religię POPRZEDNIEGO właściciela, zdobywca dostaje ZERO obecności). To jest DOKŁADNA
  asymetria z kulturą i źródło zgłoszonego problemu: bez żadnej obecności zdobywcy w
  `ReligionState.counts`, `foreignReligionDominant` (main.ts ok. linii 29432/29452,
  `isForeignReligionDominant(curRel, ownRel, rp)`) faktycznie może wyjść prawdziwe (bo stara
  religia dominuje) — ale nawet gdy wyjdzie, nie ma to znaczenia bo NIC nie inicjuje
  stopniowej zmiany w stronę zdobywcy w tym konkretnym mieście (constatncja stanu, nie
  ruch) — patrz punkt 2 niżej.

**Punkt 2 — dlaczego `convertViaTemple` nie pomaga:** funkcja istnieje i działa poprawnie
(`gra/src/game/culture-religion.ts` ok. linii 1021+), ale to punkt 1 (brak żadnej realnej,
zmiennej w czasie „presji" po podboju w różnym okręgu) sprawia że stan miasta jest STATYCZNY
— nie ma nic do skonwertowania w stronę zdobywcy, bo zdobywca ma 0% w `counts`. **Naprawa
punktu 1 jest warunkiem koniecznym punktu 2** — po dodaniu realnej obecności zdobywcy w
`counts` (nawet niewielkiej, analogicznej do inwersji kultury), `convertViaTemple` powinien
zacząć działać BEZ dodatkowych zmian w jego własnej logice. Operator: NIE modyfikuj
`convertViaTemple` samego w sobie, chyba że dowód pokaże że coś tam też jest zepsute.

## GOAL

1. Dodaj w `gra/src/game/culture-religion.ts` nową, czystą funkcję (nazwij analogicznie,
   np. `onCityCapturedReligion`), strukturalnie WIERNY ODPOWIEDNIK `onCityCapturedCulture`
   z `conquest-stability.ts`, przyjmującą `ReligionState` (nie `city` ze skalarnym polem —
   religia to `counts: Record<string, number>`, inna struktura danych niż kultura):
   - SAME okrąg kulturowy → zachowaj dzisiejsze zachowanie (100% nowego właściciela,
     `defaultCityReligionState`) — to już jest symetryczne z kulturą, NIE zmieniaj.
   - RÓŻNY okrąg → przełóż DOKŁADNIE tę samą inwersję co kultura (`1 - prevShare`) na model
     `counts`: udział NOWEGO właściciela w populacji miasta = `1 - udzial_poprzedniego_wlasciciela`
     (gdzie `udzial_poprzedniego_wlasciciela` = `religionOwnShare(state, oldOwnerReligion)`),
     reszta populacji zostaje rozdzielona proporcjonalnie do dotychczasowego składu `counts`
     (bez oldOwnerReligion, przeskalowanego). To jest BEZPOŚREDNIE tłumaczenie istniejącego
     wzoru skalarnego na strukturę `counts`, NIE nowa liczba balansu — jeśli w trakcie
     implementacji pojawi się rozbieżna, niejednoznaczna interpretacja (np. miasto miało
     3+ religie przed podbojem), opisz wybór w raporcie z uzasadnieniem, nie proś o
     DECISION_REQUIRED dla samego kształtu wzoru (jest dany przez analogię), tylko dla
     PRAWDZIWIE nowych liczb (nie ma tu żadnych — to czysta transkrypcja istniejącej reguły).
2. Podmień blok w `gra/src/main.ts` (ok. linii 26938-26952) tak, żeby wołał nową funkcję
   BEZWARUNKOWO (usuń warunek blokujący religię dla różnego okręgu), zachowując identyczną
   ochronę przed fałszywym dopasowaniem barbarzyńców (ten sam wzorzec `civKeyForOwner`/opts
   co `onCityCapturedCulture`, NIE osobny `isBarbarian` check pisany od nowa — użyj tego
   samego mechanizmu co kultura, żeby nie duplikować dwóch różnych zabezpieczeń przed tym
   samym znanym bugiem P-BARB-CAPTURE-GUARD).
3. Zweryfikuj (test, nie tylko lektura) że po naprawie punktu 1: (a) `foreignReligionDominant`
   może wyjść `true` po podboju w różnym okręgu kulturowym w realnym scenariuszu, (b)
   `convertViaTemple`, wywoływany w kolejnych turach, FAKTYCZNIE przesuwa skład religijny
   miasta w stronę zdobywcy (nie jest to zaślepiony/martwy kod), z zachowanym istniejącym
   sufitem/tempem konwersji (nie zmieniaj parametrów `convertViaTemple`).
4. Potwierdź punkt 3 ECHO (binarność) już spełniony — grep + odczyt `religionHappiness`,
   jedno zdanie w raporcie, zero zmian kodu.

## BINARNE KRYTERIUM SUKCESU

- Nowa/rozszerzona bramka: symulacja podboju miasta W RÓŻNYM okręgu kulturowym pokazuje że
  `cityRelig` po podboju ma NIEZEROWĄ obecność zdobywcy (nie 100% starego właściciela jak
  dziś), zgodną z formułą `1 - prevShare` przełożoną na `counts`.
- Ta sama symulacja, kontynuowana o kilka tur z `convertViaTemple` (jeśli miasto ma
  Świątynię) pokazuje REALNY wzrost udziału zdobywcy w kolejnych turach (nie stagnację).
- SAME okrąg kulturowy: zero zmiany zachowania względem dzisiejszego (100% nowego
  właściciela, jak dziś) — dowód regresji NIE, to jest already-correct.
- Dodatkowo zielone: `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test,
  research-test, unit-replace-test, combat-test), `gra/tools/culture-religion-test.cjs`,
  `gra/tools/conquest-stability-test.cjs`, oraz CAŁA rodzina bramek dotykających religii/
  kultury/podboju (wypisz reprodukowalny grep + wynik każdej w raporcie: szukaj
  `find gra/tools -iname "*relig*" -o -iname "*kultur*" -o -iname "*capture*" -o -iname "*podboj*" -o -iname "*conquest*"`).

## ALLOWLISTA

- `gra/src/game/culture-religion.ts` (nowa funkcja `onCityCapturedReligion` lub podobna)
- `gra/src/main.ts` (WYŁĄCZNIE blok ok. linii 26938-26952, zamiana warunkowego ustawienia
  `cityRelig` na bezwarunkowe wywołanie nowej funkcji — zakaz zmian gdziekolwiek indziej)
- Istniejące bramki `gra/tools/culture-religion-test.cjs`, `gra/tools/conquest-stability-test.cjs`
  (do rozszerzenia, NIE osłabiania) lub nowa bramka
  `gra/tools/religia-konwersja-po-podboju-test.cjs`
- `dyspozycje/autobot/runs/R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`, `gra/src/game/society-breakdown.ts`
(religionHappiness/G4 już poprawny — zero powodu tam wchodzić), `gra/src/game/order.ts`,
`gra/src/game/conquest-stability.ts` (poza CZYTANIEM jako wzorzec — `onCityCapturedCulture`
zostaje NIETKNIĘTA, religia dostaje WŁASNĄ, analogiczną funkcję, nie modyfikację kultury).
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-religia`, gałąź `autobot/R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1`, baza
jawnie `origin/main` (commit `ba2fde99`, PO integracji Prawa/Garnizonu/AI-produkcji/trofeów/
wycinki/wojny-domino) — potwierdź `git log -1` PRZED pracą (SS2b: jeden pisarz na worktree).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

**Kolejka `main.ts` (§2b):** ten temat jest CZWARTY w kolejce (po handel-podział, trofea,
wycince, wojnach-domino — wszystkie zintegrowane). Po tym temacie w kolejce:
`P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1` (ostatni).

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian mechaniki poza punktem 1+2 GOAL (obecność zdobywcy w `counts` + weryfikacja że
  konwersja rusza). Nie zmieniaj tempa/sufitu `convertViaTemple`, nie zmieniaj
  `religionHappiness` (już poprawne), nie zmieniaj zachowania SAME-okrąg (już poprawne).
- Jeśli miasto ma >2 religie w `counts` przed podbojem i rozdzielenie proporcjonalne budzi
  wątpliwość — opisz wybraną metodę w raporcie z uzasadnieniem (to nie jest nowa liczba
  balansu, to konsekwencja tłumaczenia istniejącego wzoru na inny kształt danych).
- Nie integrujesz, nie deployujesz, nie pushujesz.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
