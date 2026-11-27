# ZAPIS-DIGEST-ROZNICA — skąd bierze się różnica digestu po wczytaniu zapisu

Tag: R-WEB-SAVE-DIGEST-DIFF-Q1 (SAVEDIGEST). Baza: `origin/main` 5ea1cc362 (CAPREBEL2 r1).
Zero zmian w `gra/src` i `gra/data`. Dane surowe: `dyspozycje/autobot/runs/R-WEB-SAVE-DIGEST-DIFF-Q1/dane/`.

## Pytanie

Po `__detHarness.snapshotJson` → `restoreJson` digest stanu (`__detHarness.digest()`) nie jest tożsamy
z digestem przed zapisem (CAPREBEL2: 31837 vs 38767 znaków). Ustalić, co się różni, i czy to błąd integralności.

## Metoda

- Build live: `npx vite build --outDir <scratchpad>/savedigest/dist` z kopii worktree (bez `npm run build`), bundle poza repo.
- Runner: `gra/tools/savedigest-run.cjs` (nowy). Start: `__settingsLive.startNewGame` z parametrami wg konfiguracji,
  seed 4242, `foundFirstCity`, `disableVictoryCheckForTest`. Tryby:
  - `rt` — w jednej sesji: N tur → snapshot → `restoreJson` in place → digest i zrzut `full()` przed/po.
  - `A` — N tur → zapis → K tur z digestem (referencja ciągła).
  - `B` — świeża sesja, ten sam start, `restoreJson` ze snapshotu z A → K tur z digestem.
- Diff strukturalny: `gra/tools/savedigest-diff.cjs` (nowy): dopasowanie jednostek i miast po `id`, klasy ścieżek.
  Uwaga: rozmiar w kolumnie „znaki” liczy wartość bez nazwy klucza, więc dla dodanych kluczy zaniża wynik o ~6 znaków na klucz.
- Konfiguracje: `max` = maksimum nowej gry z CAPREBEL2 (Trudny, dyplomacja trudna, Wysoki ×4, kultura trudny, kultura AI trudny,
  wzrost surowców ON, flagi ON); `default` = bez pól kultury; `aionly` = jak default, ale kultura AI trudny (tylko poziom AI różny).
  Maksimum przyjęte wg CAPREBEL2 (`MAX_PARAMS`); nie ma innego poziomu wyższego dla tych pól.
- Zrzut `full()` obejmuje tylko `units` i `cities` (to one składają się na digest).

## Wyniki

| Konfiguracja | Test | Digest surowy po restore | Po odfiltrowaniu 3 pól domyślnych | B == A po 1 turze (t4) | Uwagi |
|---|---|---|---|---|---|
| max | rt (tura 3) | różny: len 41659 → 44389 (+2730) | **identyczny** (41594 = 41594) | — | |
| max | A/B, K=3 | (B startuje od restore) | — | **NIE** (t4, t5, t6) | rozbieżność już w pierwszej turze po wczytaniu |
| default | A/B, K=3 | — | restore vs snap: identyczny (41720 = 41720) | **NIE** (t4, t5, t6) | rozbieżność nie zależy od ustawień |
| aionly | rt (tura 3) | różny: len 41785 → 44515 (+2730) | **identyczny** (41720 = 41720) | NIE ZMIERZONO | |
| max + bunt stolicy AI | — | — | — | NIE ZMIERZONO | brak w tej rundzie (CAPREBEL2 ma dane zapisu; nie odtwarzano) |

### Klasyfikacja różnicy 1: surowy digest po restore (wyjaśnione)

Różnica 2730 znaków = 42 miasta × 65 znaków. Po wczytaniu każde miasto dostaje trzy pola, których przed zapisem nie miało:

| Pole | Przed zapisem | Po wczytaniu | Skąd |
|---|---|---|---|
| `budowaLista` | brak (undefined) | `[]` | `ensureCitySaveDefaults` (`gra/src/game/cities.ts` ~807), wołane w `restoreGameFromSave` (`gra/src/main.ts` ~52439) |
| `magazynZywnosci` | brak (undefined) | `0` | `readCityFoodBuffer` / `cities.ts` ~833 |
| `postepBudynkowUsuniete` | brak (undefined) | `{}` | `production.ts` ~1648 (leniwa inicjalizacja) |

Klasa: **(b) reprezentacja** — wartości domyślne uzupełniane przy wczytaniu. Po usunięciu tych 3 kluczy z obu stron
zrzuty są identyczne bajt w bajt (w `rt` dla max, default i aionly). Sprawdzone odczyty w kodzie (`budowaLista ?? []`,
`magazynZywnosci ?? 0`, `readCityFoodBuffer(undefined) = 0`, `if (!city.postepBudynkowUsuniete)`) są równoważne
dla undefined i dla wartości domyślnej. Ta część NIE jest błędem integralności. Ten sam mechanizm tłumaczy wynik `fnvNoPP`
w `determinism-save-load-resume-live.cjs`, który nie usuwa tych kluczy, dlatego digest tam też wygląda na różny.

### Klasyfikacja różnicy 2: B ≠ A po pierwszej turze po wczytaniu (NIE wyjaśnione)

Po wczytaniu i jednym zakończeniu tury stan różni się w małym zbiorze miast i jednostek (dane: `dane/*-diff.txt`):

- miasta **city16** i **city25** (stolice AI w tym biegu): `wealthState.pula` (skarbiec), `surowce.drewno`;
- **city17** i **city26**: `manpower`;
- jednostki rekrutowane w tych miastach (`rec_5_city25_*`, `rec_6_city16_*`): `typeId`, `category`, `q`, `r`, `hpMax`,
  `isGeneral`, `stackGroupId`, `stockPaid` — różne identyfikatory lub różny zestaw, czyli różny przebieg rekrutacji;
- `cities[city25].wzrostUlamkowy` (w t6).

Rozbieżność jest taka sama w `default` i `max`, więc nie zależy od kultury ani od poziomu trudności. Wygląda na
błąd przebiegu, nie na reprezentację. Klasa: **(a) stan gry, który po wczytaniu daje inny przebieg** — zgodnie z definicją
z dispatchu, bo różnica przechodzi do skarbca, produkcji i rekrutacji.

Co zostało wykluczone:

- `detIdSeq` i liczniki `_autoBattleSeq`/`_dipUnitSeq` są identyczne przed zapisem i po wczytaniu (42, -1, 0, 0 w rekordach `rt`).
  Sam licznik ID nie jest przyczyną.
- Jednostki i miasta zachowują liczność i kolejność (42 jednostki, 43 miasta, `orderDiff = 0`).
- `combat.ts` i `siege.ts` mają `Math.random` jako domyślny rng, ale wywołania bitew w tej ścieżce przekazują seedowany
  rng (`combatRng` w `battleScene.ts`, `this.combatRng` w `manualBattle.ts`); `resolveSiegeAttack` nie ma wywołań.
  W modułach tury (`turn-economy.ts`, `diplomacy-economy.ts`, `ai.ts`, `villageRewards.ts`, `auto-improvements.ts`)
  nie ma niekomentowanego `Math.random`. Nieseedowane losowanie nie tłumaczy więc rozbieżności.
- Pola miast zapisywane przez `buildSaveGameSnapshot` (`capitalCityIdByOwner`, `detIdSeq`, `seed`) są przywracane.
  Nie zidentyfikowano jeszcze pola, które nie trafia do zapisu i wpływa na tę turę.

Hipotezy do sprawdzenia w następnej rundzie (nieprzetestowane): (1) pole miasta lub skarbca AI, które nie trafia do zapisu
albo jest wyliczane z kolejności iteracji Map/Set zmienionej po `restoreGameFromSave`; (2) stan ekonomii AI na stolicy
(skarbiec i zapas drewna), który w ciągłym biegu jest aktualizowany w tej samej turze, a po wczytaniu w innej kolejności.

## Wniosek

- **Różnica digestu po samym `restoreJson` jest artefaktem reprezentacji** (3 domyślne pola na miasto). Nie jest błędem.
- **Różnica przebiegu po wczytaniu jest realnym błędem integralności zapisu** (reprodukowane w `default` i `max`, seed 4242,
  zapis w turze 3, rozbieżność w turze 4). Przyczyny nie wskazano. To kandydat na BŁĄD-GRY z minimalnym odtworzeniem:
  seed 4242, `startNewGame` z ustawieniami domyślnymi, zapis po turze 3, wczytanie, tura 4 → stolice AI (city16, city25) różne.
- Zmiana gry nie była wykonywana (zgodnie z dispatchem: tylko diagnoza i odtworzenie).
- Decyzja o grze: brak. Naprawa jest techniczna, nie wymaga odpowiedzi właściciela.

## Ograniczenia

- Test B==A wykonany dla 3 tur (t4–t6), jedno ziarno (4242), jedno wczytanie. Brak drugiego ziarna i bunt stolicy nie odtworzone.
- Konfiguracja `aionly` tylko w trybie `rt`. Konfiguracja `max + bunt` NIE ZMIERZONO.
- Rozmiary w `savedigest-diff.cjs` liczą wartość bez nazwy klucza (dla dodanych kluczy zaniżenie).
