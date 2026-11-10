STATUS: PASS-WITH-NOTES (obrona Operatora, runda 1/5, czeka na Evaluatora)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16E-OPISY-UI-PANELE-Q1
GOAL: Status z dowodem (plik:linia, pin edb8fb56) dla 10 paneli P1-16D §3. Wynik bez zmian: FAIL 3 (#6, #7, #8), PASS 1 (#11), PASS-WITH-NOTES 6 (#5, #9, #12, #15, #16, #17). Brak NIEROZSTRZYGNIĘTYCH.

OBRONA:
- 1 -> PRZYJMUJE (częściowo). Zawężono status #16 do dwóch zweryfikowanych wierszy ścieżki live w `unitAdapter.ts` (wspólnym dla `buildUnitDetailCardViaEntityCard`, `cityPanel.ts:7863`): „Próg dezercji" (`:191`, `:201`: `round(n×100)% HP`) i „Utrzymanie Pieniądza/turę" (`:242`). Reszta treści adaptera oznaczona jako nieprzeliczona. Zgodność tych pól z `units.json` nie była sprawdzona w tej rundzie.
- 2 -> PRZYJMUJE. Zawężono #12 do zweryfikowanej etykiety „Łańcuch: …" (`building-upgrades.ts:77–86`) i liczb z `buildingEffectAtLevel`. Zdanie „Bonusy w silniku = suma poprzednich poziomów (zapisane w JSON)" (`building-upgrades.ts:86`) oznaczone jako nieprzeliczone.
- 3 -> PRZYJMUJE. Nazwa symbolu `pieniadzNetto` usunięta jako podstawa; to kwestia notacji. Podstawą FAIL #7 jest pominięty mnożnik Wealth: `turn-economy.ts:2110` (`pieniadzPoWealth = floor(yld.pieniadz × wt.mnoznik)`), komentarz `:1101` („po mnozniku Wealth"). Brak lokalizacji odliczenia utrzymania oznaczony jako nieistotny dla werdyktu.
- 4 -> PRZYJMUJE. Dodano dowód łańcucha: `economy.ts:1061` (`pctNauka = procentNauka/100`), `:1065` (`naukaZHandlu = floor(handelNetto×pctNauka)`), `:1078` (`naukaLokalnaRaw`), `:1114` (`nauka: naukaLokalna`). FAIL #8 opiera się na pominięciu `naukaMult` (`turn-economy.ts:182`) i `civNaukaMult` (`:2036`, `:2648`).
- 5 -> PRZYJMUJE. Zarzut trafny: limit egzekwuje literał `1` w jedynym wywołaniu `advanceRecruitmentGated(prodFinal, city, epoka, 1, true)` (`main.ts:32730–32731`). `RECRUIT_UNITS_PER_TURN` (`production.ts:164`) to tylko domyślna wartość parametru `maxPerTurn` (`production.ts:1898`). Grep po `gra/src` potwierdza jedno wywołanie poza definicją. Status PASS #11 bez zmian.

ZMIANY-COMMIT: Zmieniono wyłącznie wiersze §3 (#5–#17) w `/home/user/The-Game/dyspozycje/rust-port/p1/P1-16D-OPISY-CIVPEDIA-UI.md` (`git diff --numstat`: 10 insertions, 10 deletions; `git diff --check` czysty). Nie zmieniano §1, §2, §4, §5, `P1-16D-OPISY-PORADNIK-A.md`, `01-operator.md` ani `gra/` (`git status gra` puste). Commit: brak (Operator nie commituje). Podsumowanie w linii ~230 §3 poza allowlistą, nietknięte.

TESTY: Brak testów kodu (temat odczytowy). Weryfikacja przez `git show edb8fb56:<plik>`, `git grep` na pinie. Nie uruchamiano `npm` ani `cargo`.

BLOKADY:
- Rozbieżności #6, #7, #8 dotyczą treści tooltipów w `cityPanel.ts`. Poprawka leży poza tym tematem, bo `gra/**` jest read-only.
- Odliczenie utrzymania gracza w skarbcu (#7) nadal nie zlokalizowane jednoznacznie.
- Pełna treść `unitAdapter` (#16) i proza (#12, #15, #17) nieprzeliczone wiersz po wierszu.
- Poza zakresem: klucz `'Prog dezercji (% health)'` w `army-starvation.ts:37` nie zgadza się z zapisem „Próg dezercji" w `unitAdapter.ts:191`. Do osobnego zgłoszenia.

RUNDY: 1/5 (obrona w tej samej rundzie)
NASTEPNY KROK: Evaluator (Haiku 5.5 medium) — ponowna adwersarialna kontrola 10 wierszy, z naciskiem na zawężone #12 i #16 oraz na łańcuch `procentNauka` → `yld.nauka` w #8.
DEPLOY/PUSH: NIE WYKONANO