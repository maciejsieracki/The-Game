# R-BUDYNEK-GARNIZON-NOWY-Q1 — Evaluator, runda 3/5

STATUS: PASS
DOMAIN: GAME
TEMAT: R-BUDYNEK-GARNIZON-NOWY-Q1
GOAL: Nowy budynek Garnizon — kompletny, na równi z każdym innym budynkiem w grze (bez wpinania do Prawa i bez obrony cywilnej).
MODEL+EFFORT: Opus 5, effort high.
ZMIANY-COMMIT: zero zmian w `gra/` i `docs/` — Evaluator orzeka, nie modyfikuje. Oceniony zakres `ff81dce5..e96b6772` = 4 pliki, wszystkie w allowliście rundy 3. Artefakt: ten raport.
TESTY: wyłącznie własne uruchomienia. `civpedia-budynki-historia-test` **141/0** (wersja z `ff81dce5`, uruchomiona przeze mnie z kopii `.tmp-`: **138/3** — łącznie 141 asercji po obu stronach, żadna nie ubyła) · `budynek-garnizon-test` **83/0** · `grupy-budynkow-test` **84/0** · `tsc --noEmit` exit 0 · pięć referencyjnych: logic 213/213, tech-tree 19/0, research 33/0, unit-replace 13/0, combat 6/6 · trzy własne mutacje E1–E3, każda cofnięta KOPIĄ pliku, `git diff --quiet` czysto po każdej, md5 `wikiBundle.json` == `HEAD`.
BLOKADY: przenoszę obie otwarte blokady rundy 1 — (a) twarda zależność kolejności deployu wobec `R-PRAWO-PRZEBUDOWA-SKALI-Q1` (Garnizon wydany wcześniej to dla gracza czysty koszt), (b) kolizja nazewnicza `prawo_garnizon*` / `society-breakdown.ts:638-647`. Trzecia, procesowa: worktree dzielony przez role (§2b), nierozstrzygnięta.
RUNDY: 3/5
NASTĘPNY KROK: Obrona rundy 3 (R3-E, §16b pkt 3 — lista zarzutów pusta, więc Obrona odpowiada notą „brak zarzutów"), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## ZARZUTY

**brak** — po realnym sprawdzeniu wszystkich pięciu punktów kontroli.

## Punkty kontroli — dowód z własnego uruchomienia

**KP1 — regres CivPedii zdjęty, asercje nie ubyły.** Policzyłem obie strony diffu.
Wersja sprzed rundy 3 (`git show ff81dce5:` → kopia `gra/tools/.tmp-*`, plik gitignorowany,
skasowany po pomiarze): **138 pass / 3 fail**, trzy faile to dokładnie trzy zaszyte `25`.
Wersja bieżąca: **141 pass / 0 fail**. Suma asercji identyczna (141), liczba zielonych
138 → 141. Warunek „nie mniej niż 138" spełniony z zapasem; żadna asercja nie została usunięta —
diff pokazuje wyłącznie przeformułowanie trzech `check(...)` i **żadnego** `-  check(`.

**KP2 — etykieta `[AI3]` mówi prawdę.** Odczytałem `ai.ts` sam. `if (opts.defensiveCopy) {`
stoi w linii **1455**; `const infraOrder = [` w **1476**, wewnątrz tej gałęzi — a więc etykieta
„lista budowy PAŃSTW-MIAST … asercja NIE mówi nic o cywilizacjach AI" jest zgodna z kodem.
Zweryfikowałem też drugie zdanie komentarza, którego nikt nie sprawdzał: `main.ts:30032` i `:30150`
ustawiają `defensiveCopy: typCityCopyOwners.has(ownerId)` — jedyne dwa przypisania w `gra/src`,
oba dla państw-miast. Dawna nieprawda („bez tego AI nigdy go nie zbuduje") wycięta.

**KP3 — `gra/data/buildings.json` NIETKNIĘTY.** `git diff dc355979..HEAD -- gra/data/buildings.json`
oraz `git diff ff81dce5..HEAD -- gra/data/buildings.json` — **oba puste**. Liczby właściciela
30/6/2/1/drewno 30 zamrożone i nieruszone. Zarzut najwyższej wagi nie występuje.

**KP4 — zakres nie wyciekł.** `git diff --stat ff81dce5..HEAD` = **4 pliki**: dwie bramki
z allowlisty, `decision-abc.md`, raport. `renderer.ts` — pusty diff w całym temacie
(`merge-base origin/main d2bbd548..HEAD`). `ai.ts` w całym temacie: **1 wstawienie / 0 usunięć**,
jeden hunk `@@ -1476,6 +1476,7 @@`, runda 3 nie dotknęła go wcale.

**KP5 — trzy własne mutacje, inne niż M1/M2 Operatora i niż FC1–FC7.**

| # | Mutacja | Bramka | Wynik |
|---|---|---|---|
| E1 | dołożony `docs/encyklopedia/budynki/evaltmp-*.md` (docs 27 vs bundle 26) | civpedia-historia | 141/0 → **141/4**, w tym nowa asercja `bundle === docs` |
| E2 | `historia` wpisu `budynki/akademia` w `wikiBundle.json` wyzerowana | civpedia-historia | → **139/2** (`WSZYSTKIE wpisy … historia`) |
| E3 | `wikiM` hasła `budynki/garnizon` → „TODO do uzupełnienia" | budynek-garnizon | 83/0 → **79/4** (`[R3-E3]`, `[W5]`, `[CP6a]`, `[CP6b]` — w tym żywy DOM) |

E1 i E2 obalają jedyne realne ryzyko poprawki R3-A: że liczniki „policzone z danych" są
tautologiczne. Nie są — E1 czerwieni porównanie dwóch RÓŻNYCH artefaktów, E2 czerwieni predykat
treściowy mimo porównania do własnej liczności. E3 pokazuje, że nowe `[R3-E*]` łapią wypełniacz,
a nie tylko obecność klucza, i że mutacja przechodzi aż do żywego DOM.

## Pozostałe pozycje ratyfikacji

R3-B: pole BLOKADY raportu Operatora niesie **obie** blokady rundy 1 dosłownie (kolejność deployu,
kolizja `prawo_garnizon*`) — sprawdziłem po treści, nie po nagłówku. R3-C: `decision-abc.md`
istnieje, ma trzy pytania rundy 1 (bramka grup, liczby balansu, `ai.ts` + CivPedia jako 3a/3b)
z odpowiedziami właściciela i jawną notą C-058 o retroaktywności. R3-E: obieg rundy 3 idzie dalej —
Obrona po tym raporcie.

## Obserwacje

- `files.length === 25` zamieniono na `>= BATCH_MIN`. To jest świadome poluzowanie zamówione
  ratyfikacją; skasowanie hasła przy jednoczesnej regeneracji bundla przeszłoby tu na zielono,
  ale łapie je `[R3-E1]` w bramce tematu (potwierdzone mutacją M2 Operatora). Bez zarzutu, do wiedzy.
- Klasa długu „zaszyty licznik rodziny" jest szersza niż te dwie bramki — zgadzam się z Operatorem,
  że to kandydat na osobny temat audytowy.
- `civpedia-gra-id-mostek-test.cjs` **nie uruchamiany** (brudzi śledzony `wikiBundle.json`).
  Drzewo przed pracą i po niej: `git status --short` puste.
- Trzy niespójności R2-E nadal otwarte i nietknięte.

**Nota §11:** ~430 słów przy limicie ~400. Przekroczenie minimalne: prompt zamawia pięć punktów
kontroli z dowodem i tabelę własnych mutacji.
