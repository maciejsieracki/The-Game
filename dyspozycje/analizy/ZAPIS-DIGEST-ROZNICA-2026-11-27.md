# ZAPIS-DIGEST-ROZNICA — skąd bierze się różnica digestu po wczytaniu zapisu

Tag: R-WEB-SAVE-DIGEST-DIFF-Q1 (SAVEDIGEST). Baza: `origin/main` 5ea1cc362 (CAPREBEL2 r1).
Zero zmian w `gra/src` i `gra/data`. Dane surowe: `dyspozycje/autobot/runs/R-WEB-SAVE-DIGEST-DIFF-Q1/dane/`.
Runda 2 (obrona Operatora, kandydat 5069d00f9): dopisano bunt stolicy AI (iii) i aionly A/B (iv), poprawiono
liczbę miast w wyjaśnieniu różnicy 1, doprecyzowano wniosek (rozbieżność reprodukowalna, przyczyna nieznana).

## Pytanie

Po `__detHarness.snapshotJson` → `restoreJson` digest stanu (`__detHarness.digest()`) nie jest tożsamy
z digestem przed zapisem (CAPREBEL2: 31837 vs 38767 znaków). Ustalić, co się różni, i czy przebieg po wczytaniu jest taki sam jak bez wczytania.

## Metoda

- Build live: `npx vite build --outDir <scratchpad>/savedigest/dist` z worktree (bez `npm run build`), bundle poza repo.
  Rozmiar `index.html` 15 045 104 B (zgodny z rundą 1).
- Runner: `gra/tools/savedigest-run.cjs`. Start: `__settingsLive.startNewGame` z parametrami wg konfiguracji,
  seed 4242, `foundFirstCity`, `disableVictoryCheckForTest`. Tryby:
  - `rt` — w jednej sesji: N tur → snapshot → `restoreJson` in place → digest i zrzut `full()` przed/po.
  - `A` — N tur → zapis → K tur z digestem (referencja ciągła).
  - `B` — świeża sesja, ten sam start, `restoreJson` ze snapshotu z A → K tur z digestem.
  - Opcja `--bunt 1` (runda 2): w PIERWSZEJ turze po zapisie wywoływany jest bunt pierwszej stolicy AI
    (`__rebelNotifyTestDebug.forceRevoltEligible`, jak w `caprebel2-live.cjs` tryb `sl`). Dotyczy trybów A i B.
  - Zmienna `PW_PATH` wskazuje katalog `playwright` (w tej sesji brak go w `gra/node_modules`; użyto `/opt/node-tools/node_modules/playwright`).
- Diff strukturalny: `gra/tools/savedigest-diff.cjs`: dopasowanie jednostek i miast po `id`, klasy ścieżek.
  Rozmiar wpisu dodanego lub usuniętego klucza liczy nazwę klucza i wartość (test na fixturze:
  `"postepBudynkowUsuniete":{}` = 27 znaków, `"budowaLista":[]` = 16, `"magazynZywnosci":0` = 19). Suma dla 3 pól na miasto
  wynosi 62 znaki + przecinki = 65 znaków na miasto.
- Konfiguracje: `max` = maksimum nowej gry z CAPREBEL2 (Trudny, dyplomacja trudna, Wysoki ×4, kultura trudny, kultura AI trudny,
  wzrost surowców ON, flagi ON); `default` = bez pól kultury; `aionly` = jak default, ale kultura AI trudny (tylko poziom AI różny);
  `max + bunt` = `max` z buntem stolicy AI w turze 4.
  Maksimum przyjęte wg CAPREBEL2 (`MAX_PARAMS`); nie ma innego poziomu wyższego dla tych pól.
  Przy tym maksimum trudności/kultury nie testowano innych poziomów (zgodnie z zasadą testowania na maksimum).
- Zrzut `full()` obejmuje tylko `units` i `cities` (to one składają się na digest).

## Pokrycie konfiguracji (wymagane w dispatchu: i–iv)

| Wymagana konfiguracja | Pokrycie | Status |
|---|---|---|
| (i) default — baseline | A/B K=3 (tury 4–6), restore vs snap (tura 3) | zmierzone |
| (ii) max bez buntu | rt (tura 3) oraz A/B K=3 (tury 4–6) | zmierzone |
| (iii) max z buntem stolicy AI | A/B K=3 (bunt w turze 4, `--bunt 1`), restore vs snap (tura 3) | zmierzone (runda 2) |
| (iv) tylko poziom AI różny (aionly) | rt (tura 3, runda 1) oraz A/B K=3 (tury 4–6, runda 2) | zmierzone |

Liczba konfiguracji z pomiarem digestu, diffem strukturalnym i klasyfikacją: **4 z 4** (i, ii, iii, iv).
Każda konfiguracja jest jedną parą (seed 4242, jeden punkt zapisu po turze 3). Brak drugiego ziarna (zob. Ograniczenia).

## Wyniki

Digest = `len` (długość JSON `units`+`cities`), `fnv` (hash), `lenNoPP` (bez `postepBudynkowUsuniete`), `nU` (liczba jednostek).

### Restore vs zapis (tura 3, bezpośrednio po wczytaniu)

| Konfiguracja | Snap przed zapisem | Po restore | Różnica surowa | Po odfiltrowaniu 3 pól domyślnych |
|---|---|---|---|---|
| max (rt, runda 1) | len 41659 | len 44389 | +2730 | **identyczny** (41594 = 41594) |
| default (A/B, runda 1) | — | — | — | **identyczny** (41720 = 41720) |
| aionly (rt, runda 1) | len 41785 | len 44515 | +2730 | **identyczny** (41720 = 41720) |
| aionly (A/B, runda 2) | len 41785 | len 44515 | +2730 | **identyczny**: 0 różnic poza 126 wpisami domyślnymi (42 miasta × 3 pola) |
| max + bunt (A/B, runda 2) | len 41659 | len 44389 | +2730 | **identyczny**: 0 różnic poza 126 wpisami domyślnymi |

Źródło: `dane/*` (pliki `*.snap.full`/`*.full` z runnera; porównanie `savedigest-diff.cjs`).

### Przebieg po wczytaniu: B vs A (ciągła referencja), K=3, tury 4–6

| Konfiguracja | t4: A / B (len) | t5: A / B | t6: A / B | nU t6 (A / B) | Zgodność |
|---|---|---|---|---|---|
| default (runda 1) | różne (t4, t5, t6) | różne | różne | — | **NIE** |
| max (runda 1) | różne | różne | różne | — | **NIE** |
| aionly (runda 2) | 43495 / 46235 | 45344 / 48154 | 46475 / 49561 | 64 / 65 | **NIE** |
| max + bunt (runda 2) | 43530 / 46300 | 45465 / 48277 | 46811 / 49913 | 65 / 66 | **NIE** |

Podział na pola (diff `t4`, poza wpisami domyślnymi): w konfiguracjach aionly i max+bunt różnice w turze 4 są te same co w default/max:
`wealthState.pula` miast city16 i city25 (stolice AI), `surowce.drewno` city16, city17, city25, `manpower` city26.
W turze 6 rozjeżdża się też skład jednostek (aionly: 64 vs 65; max+bunt: 65 vs 66 jednostek; `units[*]` dodane/usunięte,
`stackGroupId` jednostek `rec_5_city25_*`, `rec_6_city16_*`). Pliki: `dane/aionly-A-vs-B-turn4-diff.txt`, `dane/maxbunt-A-vs-B-turn4-diff.txt`,
`dane/maxbunt-A-vs-B-turn6-diff.txt`, `dane/aionly-A-vs-B-turn6-diff.txt`.

## Klasyfikacja różnic

### Różnica 1: surowy digest po restore (klasa b — reprezentacja)

Każde z 42 miast AI/nieplayerskich (city1–city42) dostaje po wczytaniu trzy pola, których przed zapisem nie miało.
Miasto `city0` (Rzym, stolica gracza) już je miało przed zapisem (zweryfikowano na pełnym zrzucie `max/rt.json.pre.full`:
42 miasta bez pól, 1 miasto z polami; zrzut po wczytaniu: 43 z 43 mają pola).

| Pole | Przed zapisem | Po wczytaniu | Skąd |
|---|---|---|---|
| `budowaLista` | brak (undefined) | `[]` | `ensureCitySaveDefaults` (`gra/src/game/cities.ts` ~807), wołane w `restoreGameFromSave` (`gra/src/main.ts` ~52439) |
| `magazynZywnosci` | brak (undefined) | `0` | `readCityFoodBuffer` / `cities.ts` ~833 |
| `postepBudynkowUsuniete` | brak (undefined) | `{}` | `production.ts` ~1648 (leniwa inicjalizacja) |

Stąd 2730 = 42 × 65 znaków. Po usunięciu tych trzech kluczy z obu stron zrzuty są identyczne we wszystkich czterech
konfiguracjach (tabela „Restore vs zapis”). Odczyty w kodzie (`budowaLista ?? []`, `magazynZywnosci ?? 0`,
`readCityFoodBuffer(undefined) = 0`, `if (!city.postepBudynkowUsuniete)`) są równoważne dla undefined i wartości
domyślnej — to jest wniosek z kodu, nie z przebiegu.

### Różnica 2: przebieg po wczytaniu różni się od ciągłego (klasa a/przebieg — przyczyna NIEZNANA)

Rozbieżność B ≠ A pojawia się w turze 4 (pierwsza tura po wczytaniu) we wszystkich czterech konfiguracjach:
default, max, aionly, max+bunt. Dotyczy stolic AI (city16, city25) i miast city17/city26 (skarbiec, drewno, manpower)
oraz rekrutacji w tych miastach. Różnica przechodzi do skarbca, produkcji i rekrutacji, więc jest różnicą przebiegu,
nie tylko reprezentacji.

Co zostało wykluczone (w zakresie tego, co sprawdzono):

- `detIdSeq` i liczniki `_autoBattleSeq`/`_dipUnitSeq` są identyczne przed zapisem i po wczytaniu (runda 1: 42, -1, 0, 0).
  Uwaga: w turze 4 po wczytaniu `detIdSeq` jest identyczny (49 / 49), rozjeżdża się dopiero liczba jednostek w turze 6.
- Jednostki i miasta zachowują liczność i kolejność przy restore (42 jednostki, 43 miasta, `orderDiff = 0`).
- Nieseedowany `Math.random` w ścieżce tury: `combat.ts`/`siege.ts` mają go jako domyślny rng, ale wywołania bitew w tej ścieżce
  przekazują seedowany rng; w modułach tury (`turn-economy.ts`, `diplomacy-economy.ts`, `ai.ts`, `villageRewards.ts`, `auto-improvements.ts`)
  nie znaleziono niekomentowanego `Math.random`. Nie wykluczono całkowicie (nie przeanalizowano każdej ścieżki).
  Burn-in `Math.random` z runda 1 nie zmienił wyniku (wcześniejsza weryfikacja Evaluatora).
- Pola zapisywane przez `buildSaveGameSnapshot` (`capitalCityIdByOwner`, `detIdSeq`, `seed`) są przywracane.
  Nie zidentyfikowano pola, które nie trafia do zapisu i wpływa na turę.

Hipotezy (nieprzetestowane): (1) pole miasta lub skarbca AI, które nie trafia do zapisu albo jest wyliczane z kolejności
iteracji Map/Set zmienionej po `restoreGameFromSave`; (2) stan ekonomii AI na stolicy, aktualizowany w tej samej turze
w ciągłym biegu, a po wczytaniu w innej kolejności; (3) stan poza `units`/`cities` (np. cache planera AI), którego digest nie obejmuje.

### Dane z CAPREBEL2 dla konfiguracji (iii) — cytowane z poprzedniego biegu, różnica zmierzona także w tej rundzie

Źródło: `dyspozycje/autobot/runs/R-WEB-AI-CAPITAL-REBEL-SAVE-Q2/dane/caprebel2-sl-s4242.txt` (seed 4242, maksimum, bunt stolicy AI).
Odczyt z pliku: `pre` len 31837 (lenNoPP 30246); `restoredA` len 38767 (lenNoPP 37176). Flagi: `digestRestoreA_eq_pre: false`.
Ten bieg CAPREBEL2 różnił się od biegu runda 2 (inny zapis: przed buntem w tej samej turze, inny harness). W biegu runda 2
(`max + bunt`, restore w turze 3) różnica surowa wynosi także +2730 i po odfiltrowaniu 3 pól digest jest identyczny.
Wyjaśnienie różnicy 6930 z CAPREBEL2 (ponad 2730) nie zostało więc potwierdzone w tym runnerze: rozbieżność z CAPREBEL2
mogła pochodzić z innego punktu zapisu lub z buntu wykonanego przed zapisem. NIE WYJAŚNIONO.

## Wniosek

- **Różnica surowego digestu po wczytaniu jest w każdej z czterech konfiguracji wyjaśniona przez 3 pola domyślne na miasto
  (2730 = 42 × 65 znaków) i po ich usunięciu digest zrzutu jest identyczny** (4/4 konfiguracje, seed 4242, zapis w turze 3).
  Klasa: reprezentacja, nie błąd. Wniosek dotyczy tylko restore w miejscu zapisu; nie dotyczy przebiegu.
- **Przebieg po wczytaniu różni się od przebiegu ciągłego (B ≠ A) w 4/4 konfiguracjach** (seed 4242, zapis po turze 3, rozbieżność
  od tury 4, stolice AI city16/city25). To jest REPRODUKOWALNA ROZBIEŻNOŚĆ PRZEBIEGU. Przyczyna NIEZNANA; nie ustalono, czy to błąd integralności
  zapisu, czy zachowanie wynikające z innego stanu niż objęty digestem. Nie nazywamy tego błędem integralności ani jego braku,
  dopóki nie wskazano mechanizmu i nie powtórzono na drugim ziarnie i w innym punkcie zapisu.
- Zmiana gry nie była wykonywana (zgodnie z dispatchem). Decyzja o grze: brak. Naprawa ewentualna dopiero po wskazaniu
  przyczyny; nie wymaga odpowiedzi właściciela.

## Ograniczenia

- Test B==A wykonany dla 3 tur (t4–t6), jedno ziarno (4242), jedno wczytanie (tura 3 lub 4 w biegu z buntem). Brak drugiego ziarna i drugiego punktu zapisu.
- Bieg (iii) wykonano z buntem w turze 4 (po zapisie w turze 3), a nie w turze 1 jak w CAPREBEL2; wniosek dla (iii) dotyczy tej konkretnej procedury.
- Diff top-N: pliki `*-turn4-diff.txt` dla aionly i max+bunt zapisane z `--top 40`; pełna lista niedomyślnych różnic
  zweryfikowana w konsoli (`--top 2000`): w turze 4 dla obu konfiguracji 6 wpisów niedomyślnych (city16/25/17/26), reszta to wpisy domyślne.
- Maksimum przyjęte wg CAPREBEL2; nie badano innych poziomów (zgodnie z zasadą testowania na maksimum nie są wymagane).
- Lista miast: 42 miasta bez pól domyślnych + city0 (Rzym) z polami przed zapisem — zweryfikowane na pełnym zrzucie.
- Bramki logic 213 i ai-test 297/0: NIE ZMIERZONO w tej rundzie (brak zmian w `gra/src`, nie uruchamiano).
