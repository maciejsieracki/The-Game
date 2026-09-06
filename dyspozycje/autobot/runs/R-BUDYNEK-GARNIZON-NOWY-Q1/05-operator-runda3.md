# R-BUDYNEK-GARNIZON-NOWY-Q1 — Operator, runda 3/5

STATUS: PASS
DOMAIN: GAME
TEMAT: R-BUDYNEK-GARNIZON-NOWY-Q1
GOAL: Nowy budynek Garnizon — kompletny, na równi z każdym innym budynkiem w grze (bez wpinania do Prawa i bez obrony cywilnej).
MODEL+EFFORT: Opus 5, effort high.
ZMIANY/COMMIT: `gra/tools/civpedia-budynki-historia-test.cjs` (+51/−14), `gra/tools/budynek-garnizon-test.cjs` (+48/−5), nowy `runs/R-BUDYNEK-GARNIZON-NOWY-Q1/decision-abc.md`, ten raport. Wszystko w allowliście rundy 3. **Zero zmian w `gra/data/buildings.json`** — `git diff dc355979 -- gra/data/buildings.json` pusty (kryterium 8). Zero `git add -A`. Wszystko w jednym commicie **`d8ad4cef`** na gałęzi `autobot/R-BUDYNEK-GARNIZON-NOWY-Q1` (baza `ff81dce5` potwierdzona `git merge-base --is-ancestor` przed pracą); to zdanie z numerem SHA dopisane commitem następującym, bo commit nie może zawierać własnego skrótu.
TESTY: `civpedia-budynki-historia-test` **138/3 → 141/0** · `budynek-garnizon-test` **80/0 → 83/0** · `grupy-budynkow-test` **84/0** · `tsc --noEmit` exit 0 · pięć referencyjnych: logic 213/213, tech-tree 19/0, research 33/0, unit-replace 13/0, combat 6/6. Trzy przebiegi mutacyjne, każdy cofnięty KOPIĄ pliku, `git diff --quiet` czysto po każdym.
BLOKADY: dwie otwarte blokady rundy 1 (odtworzone niżej — R3-B) + jedna nowa procesowa. Żadna nie blokuje pracy tej rundy.
RUNDY: 3/5
NASTĘPNY KROK: Evaluator rundy 3, potem Obrona (R3-E procesowe, §16b pkt 3).
DEPLOY/PUSH: NIE WYKONANO

## Pozycje ratyfikacji

**R3-A — regres zdjęty liczeniem z danych, nie bumpem.** Trzy zaszyte `25` (`:75`, `:123`, `:126`) usunięte. `:123` liczy się z **drugiego artefaktu** (`budynkiEntries.length === files.length`), `:126` z liczności własnego zbioru przy predykacie treściowym. **Dlaczego tu się da, a w `grupy-budynkow-test` nie:** ta bramka pracuje na trzech niezależnych artefaktach — `docs/encyklopedia/budynki/*.md`, `buildings.json` i **wygenerowanym, zacommitowanym** `wikiBundle.json`; porównanie liczności dwóch różnych artefaktów łapie realny błąd (hasło dopisane, bundle niezregenerowany). W `grupy-budynkow-test` `buildings.length` porównywałoby `buildings.json` sam ze sobą — `X === X`, zawsze zielone, więc tam liczba musi zostać zaszyta i wymaga bumpu. Jedyna liczba na sztywno to **dolna granica 25** (rozmiar batcha `R-CIVPEDIA-BUDYNKI-Q1`): nie licznik, nie wymaga bumpu przy nowym haśle, czerwieni się tylko przy kasowaniu haseł. Komentarz w pliku zapisuje oba fakty i zakazuje powrotu do `===`.

**R3-D — etykieta `[AI3]` przepisana na prawdę.** Asercja **zostaje**; wycięte zdanie „bez tego AI nigdy go nie zbuduje". Nowa etykieta mówi, że `garnizon` jest na liście budowy **państw-miast** (`infraOrder` w gałęzi `if (opts.defensiveCopy)`, `ai.ts:1455`), i wprost zastrzega, że nie mówi nic o cywilizacjach AI. Komentarz nad `partAI()` wskazuje `R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1` jako właściciela naprawy. `ai.ts` nietknięty.

**R3-E (zakres) — trzy asercje zamiast zdjętego kryterium kliku.** `[R3-E1]` obecność hasła w `wikiBundle.json`, `[R3-E2]` niepustość po `trim()` w `title/wikiS/wikiM/historia`, `[R3-E3]` brak wypełniacza. `[R3-E1]` stoi **przed** guardem `if (!entry) return null;` — mutacja pokazała, że za guardem byłaby nieosiągalna dokładnie w przypadku, który ma łapać. Znalezisko własne, spoza ratyfikacji.

**R3-C — `decision-abc.md` utworzony** z trzema pytaniami rundy 1 i odpowiedziami właściciela (30/6/2/1/drewno 30 zatwierdzone bez zmian; lista AI „dopisać od razu"; CivPedia — allowlista rozszerzona). Nosi jawną notę C-058, że powstał retroaktywnie, i nie udaje dokumentu rundy 1. Wpis do rejestru — orkiestrator.

## Mutacje (kryterium 7)

| Mutacja | Bramka | Wynik |
|---|---|---|
| M1: licznik CivPedii `BATCH_MIN` 25 → 27 | civpedia-budynki-historia | 141/0 → **140/1** |
| M2: usunięte hasło `budynki/garnizon` z `wikiBundle.json` | budynek-garnizon (temat) | 83/0 → **71/7** (`[W4]`, `[R3-E1]`, `[CP3]–[CP6b]`) |
| M2, ta sama mutacja | civpedia-budynki-historia | 141/0 → **140/1** (`bundle 25 vs docs 26`) |

M2 przebiegła dwa razy: przed poprawką `[R3-E1]` dała 71/6, po niej 71/7. Cofanie wyłącznie kopią pliku, nigdy `git checkout`.

## BLOKADY

1. **[OTWARTA od rundy 1] Twarda zależność kolejności deployu.** Garnizon wydany przed `R-PRAWO-PRZEBUDOWA-SKALI-Q1` jest dla gracza **czystym kosztem**: 60 pkt Pracy + 60 Drewna jednorazowo, 4 Pieniądza i −5 Drewna na turę, na karcie „Efekty —". Kolejność publikacji to decyzja właściciela. Zgubiona z pola BLOKADY rundy 2, odtworzona na polecenie R3-B — **przenoś do każdego kolejnego raportu, aż zniknie**.
2. **[OTWARTA od rundy 1] Kolizja nazewnicza `garnizon`** — ostrzeżenie wejściowe dla tematu Prawa. Konwencja bloku `prawo` w `society-params.json` daje dla `id: "garnizon"` klucz `prawo_garnizon`, a stoją tam już cztery klucze o **przeciwnej** mechanice: `prawo_garnizon_per_jednostka` (:806), `prawo_garnizon_cap_jednostek` (:813), `prawo_kara_brak_garnizonu` (:876), `prawo_kara_podboj_bez_garnizonu` (:883). Kolizja jest też w kodzie: `society-breakdown.ts:638-647` wystawia linię jednostkową z `id: 'garnizon'` do tej samej tablicy `lines[]`, a `orderPanel.ts:167` tnie listę Prawa do 6 pozycji — gracz zobaczyłby **dwie pozycje „Garnizon"**. Naprawa poza allowlistą; nie wchodziłem w te pliki.
3. **[NOWA, procesowa]** Runda pracowała w worktree dzielonym z innymi rolami tematu (naruszenie §2b zgłoszone już w rundzie 2, nadal nierozstrzygnięte).

## Obserwacje

- Trzy niespójności R2-E nadal otwarte i nietknięte.
- `civpedia-gra-id-mostek-test.cjs` **nie uruchamiany** — nadpisuje śledzony `wikiBundle.json`, a runda 3 nie ma powodu go dotykać. `git status` po całej pracy: wyłącznie dwa pliki bramek z allowlisty.
- Klasa długu „zaszyty licznik rodziny" jest szersza niż te dwie bramki; tam, gdzie istnieją dwa niezależne artefakty, licznik da się **usunąć**, a nie tylko podbić. Kandydat na osobny temat audytowy.
- C-001 przestrzegane: zero `npm run build`/`dev`; jedyna kompilacja `tsc --noEmit`.

**Nota §11:** ~780 słów przy limicie ~400. Przekroczenie świadome: ratyfikacja zamawia pięć pozycji, uzasadnienie „dlaczego tu da się policzyć z danych, a tam nie", tabelę mutacji i **dosłowne odtworzenie dwóch blokad** (R3-B), którego skrócenie powtórzyłoby błąd rundy 2. Raport rundy 2 miał 2120 słów bez noty — to jest trzykrotna redukcja.
