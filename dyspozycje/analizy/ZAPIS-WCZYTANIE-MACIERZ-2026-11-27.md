# ZAPIS-WCZYTANIE-MACIERZ — macierz zapis/wczytanie na MAKSIMUM (R-WEB-SAVE-LOAD-MATRIX-Q1, runda 2, Operator HAIKU)

## 0. STAN WIĄŻĄCY (runda 2, 2026-11-28)

**Baza kodu:** origin/main `ca61257d4` (FALA 932–935, merge do gałęzi tematu `dd5bd3cb5`); kod gry w tej rundzie NIE zmieniony (`gra/src` bez zmian). Build: `vite build` do katalogu w scratchpadzie, `npx tsc --noEmit` exit 0.
**Ustawienia maksymalne (wg kreatora):** barbarzyńcy Trudny, poziom Trudny, Wysoki ×4, kultura trudny (gracz i AI), dyplomacja trudna. Rywale (`rivals`/miasta-państwa) MAKSIMUM = 9 (`MAX_MIAST_PANSTWA`). `civTypesCount` MAKSIMUM dla epoki startu Brąz = **14** (nie 15: 15 dotyczy dopiero Żelaza; `civs.json` ma 14 cywilizacji z wejściem ≤ Brąz, `newGameFlow.ts:2236` clampuje do `epochCivMax`).
**Stan wiążący (poprawka obrony r3):** w r2 komórki macierzy zmierzono z `rivals=2` i `civTypesCount=15` — NIE na maksimum. Na maksimum (rivals=9, civTypesCount=14, barbarzyńcy Trudny) zmierzone są TYLKO 4 komórki: max/4242/t3, max/4242/t10, max/7/t3, max/7/t10 — każda B==A 6/6, pageErrors 0 (`dane/r3-*.json`, `dane/r3-READBACK-rivals9.txt`). Pozostałe komórki (bunt, aionly) NIE ZMIERZONO na maksimum. Klik UI na maksimum, A==A', render po wczytaniu: NIE ZMIERZONO. Stare wyniki r2 (`dane/r2-*`) NIE liczą się jako maksimum. Komórka bunt/4242/t10 i bunt/7/t10 (B≠A, pole `cities.podzialPracy`) nierozstrzygnięta — diagnoza nie potwierdzona.

### 0.1 Tabela komórek (rivals=2, barbarzyńcy Trudny; pliki `dane/r2-*`)

| Konfiguracja | Ziarno | Zapis po | cfgUsed (rivals) | B==A tury po wczytaniu | Wynik | Pola różnic |
|---|---|---|---|---|---|---|
| max | 4242 | t3 | 2 | 6/6 | PASS | — |
| max | 4242 | t10 | 2 | 6/6 | PASS | — |
| max | 7 | t3 | 2 | 6/6 | PASS | — |
| max | 7 | t10 | 2 | 6/6 | PASS | — |
| max + bunt stolicy AI | 4242 | t3 | 2 | 6/6 | PASS | — |
| max + bunt stolicy AI | 4242 | t10 | 2 | **0/6** | **FAIL (rozjazd)** | `cities[city3].podzialPracy` |
| max + bunt stolicy AI | 7 | t3 | 2 | 6/6 | PASS | — |
| max + bunt stolicy AI | 7 | t10 | 2 | **0/6** | **FAIL (rozjazd)** | `cities[city3].podzialPracy` |
| aionly | 4242 | t3 | 2 | 6/6 | PASS | — |
| aionly | 4242 | t10 | 2 | 6/6 | PASS | — |
| aionly | 7 | t3 | 2 | 6/6 | PASS | — |
| aionly | 7 | t10 | 2 | 6/6 | PASS | — |
| max (kontrola) | 4242 | t3 | **9** | 6/6 | PASS | — |

Wynik: 10 z 12 komórek macierzy PASS, 2 FAIL (bunt, t10). Komórki r1 (`max/4242/t10`, `aionly/7/t3`, `max/7/t3` z r1 pochodzące z barbarzyńców „normalny”) zostały przemierzone w r2 na tym samym kodzie (rivals=2); poprzednie wyniki z barbarzyńcami „normalny” NIE liczą się jako maksimum.

### 0.2 Rozjazd bunt/t10 (diagnoza częściowa, NIE naprawione)

- Odtworzone 2/2 ziarna (4242, 7) przy `cfg bunt` + zapis po t10; przy t3 i przy `max` bez buntu brak rozjazdu.
- Jedyna różnica w 6 turach: `cities[city3].podzialPracy` — przebieg ciągły (A): pole nieobecne (miasto śledzi globalny podział imperium); przebieg po wczytaniu (B): `{procentBudynki: 50}`. Pozostałe pola (miasta, jednostki, skarbiec) zgodne.
- Kandydaci przyczyny (hipotezy, nieprzetestowane minimalnie): `ensureCityPodzialDefaults` (`gra/src/game/cities.ts:754`) uzupełnia brakujące pole wartością domyślną przy wczytaniu; po zmianie właściciela pole jest kasowane (`gra/src/main.ts:6803`). Skutek w zmierzonych turach: brak różnic ekonomicznych (wybór sposobu zapisu stanu „śledzi globalny”).
- Poprawka NIE wdrożona: wymagałaby zmiany `gra/src/game/cities.ts` (poza allowlistą dispatchu), a oparta na hipotezie. Decyzja orkiestratora wymagana.

### 0.3 Ścieżka UI (klik „Zapisz grę” → „Wczytaj grę” w menu pauzy)

- Harness: `gra/tools/save-load-continuity-ui-live.cjs` (nowy). Zapis i wczytanie KLIKIEM w jednej sesji (przycisk `button.b-menu` → `[data-act=save]`/`[data-act=load]` → dialog `.civ-sl-row` → `Wczytaj`). Tura przesuwana hakiem `__eraTestDebug.endTurn` (nie wczytanie).
- `max/4242/t3`, wczytanie po 0 turach od zapisu: **PASS 6/6** (`r2-UI-max-4242-t3-dirty0.json`).
- `max/4242/t3`, wczytanie po 3 turach dalej w tej samej grze: **FAIL** — tury 4–6 zgodne, rozjazd od tury 7 (różne identyfikatory jednostek wiosek i zasoby miasta city15). Hipoteza: stan poza zapisem w tej samej grze (zgodnie z klasą SAVEFIX). NIE ZDIAGNOZOWANE do końca; `max/7/t3` ścieżką UI NIE ZMIERZONO.
- Próby: pierwsza wersja harnessu nie otworzyła menu klawiszem Escape (brak reakcji); przełączono na przycisk HUD `button.b-menu` (działa).

### 0.4 A==A' (determinizm ciągły)

- Dwa niezależne przebiegi A tego samego ziarna i ustawień (`max`, rivals=2): **identyczne bajt w bajt** zrzuty kanoniczne (`sha256` 16 znaków zgodne) dla wszystkich tur: t4–t9 i t11–t16 (12 tur) — ziarno 4242 i ziarno 7.

### 0.5 Render po wczytaniu

- NIE ZMIERZONO (hexCount, licznik błędów konsoli po wczytaniu na t10 nie wykonane). Zrzut ekranu z przebiegu UI (`r2-UI-max-4242-t3-po-wczytaniu.png`, stan po 3+6 turach w sesji z rozjazdem) istnieje, ale NIE oceniony merytorycznie.

### 0.6 Bramki

- `npx tsc --noEmit` w `gra/`: exit 0. Testy logiczne (logic 213, ai-test 297/0 itd.) nie uruchamiane: brak zmian w `gra/src`.

### 0.7 Pozostałe ustalenia procesu

- Runy A/B trwały 6–8 min na bieg; dwa razy narzędzie przeniosło bieg w tło po 590 s (automatycznie, nie przez `run_in_background`); wynik zebrany z pliku logu.
- `rivals=9` tylko dla jednej komórki; reszta macierzy wymaga ponownego biegu na 9 (≈12 komórek, ok. 1,5 h).

### 0.8 Pliki

Wszystkie w `dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-MATRIX-Q1/dane/` z prefiksem `r2-`: `r2-B-*.json`, `r2-A-*.json`, `r2-A2-*.json`, `r2-UI-*.json`, `r2-READBACK-*.txt` (cfgUsed per komórka), `r2-MAX-USTAWIENIA-KREATOR.txt`, stany `r2-STATE-A-*.json.gz`, logi `r2-log*.txt`.

---

## RUNDA 1 (archiwum, 2026-11-27 — NIE na maksimum dla części komórek)

# ZAPIS-WCZYTANIE-MACIERZ — pomiar macierzy po FALI 932 (runda 1)

**Baza:** origin/main `ebaa23b03` (kod 4bd55c32, FALA 932). Żadnych zmian w kodzie w tej rundzie: B==A we wszystkich zmierzonych komórkach, więc poprawki nie wdrażano (zgodnie z pkt 5 dispatchu).
**Zakres:** WYŁĄCZNIE konfiguracje maksymalne (Trudny, dyplomacja trudna, Wysoki ×4, kultura trudny, kultura AI trudny, barbarzyńcy normalny/włączeni); `default` nie mierzony.
**Metoda:** `gra/tools/save-load-continuity-live.cjs` (tryb A = ciągła gra z zapisem w punkcie; tryb B = świeża gra tego samego ziarna + wczytanie zapisu ścieżką `loadJsonAsPauseLoad` → produkcyjne `loadGameFromSlot(slot, true)`). Porównanie per tura na znormalizowanym `__detHarness.full()`, 6 tur po wczytaniu.
**Bunt** = cfg `bunt` (max + bunt stolicy AI w 1. turze po zapisie).

## 1. Macierz (12 komórek = {max, bunt, aionly} × {4242, 7} × {t3, t10})

| Konfiguracja | Ziarno | Zapis po | B==A (tury po wczytaniu) | mapDiffers | Błędy strony | Źródło wyniku |
|---|---|---|---|---|---|---|
| max | 4242 | t3 | 6/6 (t4–t9) | true | 0 | ten przebieg: `dane/B-max-4242-t3.json` |
| max | 4242 | t10 | 6/6 (t11–t16) | true | 0 | poprzednia runda (r3/r4, ten sam kod); NIE przemierzono w tej rundzie |
| max | 7 | t3 | 6/6 (t4–t9) | true | 0 | ten przebieg: `dane/B-max-7-t3.json` |
| max | 7 | t10 | 6/6 (t11–t16) | true | 0 | ten przebieg: `dane/B-max-7-t10.json` |
| bunt | 4242 | t3 | 6/6 (t4–t9) | true | 0 | ten przebieg: `dane/B-bunt-4242-t3.json` |
| bunt | 7 | t3 | 6/6 (t4–t9) | true | 0 | ten przebieg: `dane/B-bunt-7-t3.json` (drugie podejście, patrz §4) |
| aionly | 4242 | t3 | **NIE ZMIERZONO** | — | — | — |
| aionly | 4242 | t10 | **NIE ZMIERZONO** | — | — | — |
| aionly | 7 | t3 | 6/6 (t4–t9) | true | 0 | poprzednia runda (r4, ten sam kod) |
| aionly | 7 | t10 | **NIE ZMIERZONO** | — | — | — |
| bunt | 4242 | t10 | **NIE ZMIERZONO** | — | — | — |
| bunt | 7 | t10 | **NIE ZMIERZONO** | — | — | — |

**Wynik:** 7 z 12 komórek ma B==A 6/6 (5 w tej rundzie, 2 z poprzedniej, na tym samym kodzie). Zero rozjazdów. Pozostałe 5 komórek: NIE ZMIERZONO (brak czasu w tej rundzie, patrz §5).

`mapDiffers = true` we wszystkich pięciu biegach tej rundzie: żywa mapa po zapisie różniła się od zapisu, więc decyzja `liveMapDiffersFromSave` w `loadGameFromSlot` odbudowała mapę. To jest ścieżka naprawy z FALI 932; wynik 6/6 jest więc dowodem, że poprawka działa także w cfg `bunt` i na ziarnie 7.

## 2. Punkt 1 dispatchu (macierz) — stan

Zrobione: 5 komórek w tej rundzie + 2 z poprzedniej (max/4242/t10, aionly/7/t3). Nie zrobione: bunt/4242/t10, bunt/7/t10, aionly/4242/t3, aionly/4242/t10, aionly/7/t10 — każda komórka t10 wymaga ok. 16 tur gry (ok. 9–10 min na jeden bieg A, plus bieg B), a t3 ok. 9 tur. Przy limicie 590 s na wywołanie Bash każdy bieg trzeba było dzielić na osobne wywołania.

## 3. Punkt 2 (klik UI w menu pauzy) — NIE ZMIERZONO

Nie napisano jeszcze harnessu klikającego menu pauzy („Wczytaj” → wybór slotu). Obecny test używa haka `loadJsonAsPauseLoad`, który woła produkcyjne `loadGameFromSlot`, ale nie przechodzi przez UI. Pozostaje: nowy skrypt z klikaniem, osobna runda.

## 4. Incydenty (bez wpływu na wynik)

- **max/7 (bieg A z zapisami t3 i t10 w jednym przebiegu):** Chromium zamknęło stronę w turze 16 (`Target page, context or browser has been closed`), po 9 min 45 s. Dlatego t10 powtórzono w osobnym biegu A (`--saves 10`, 16 tur, 8 min 57 s, bez błędu); ten bieg daje komórkę max/7/t10. Bieg B t10 zakończony bez błędów.
- **bunt/7/t3 (bieg B):** pierwsze uruchomienie zakończyło się błędem `Target page ... has been closed` (SIGSEGV Chromium, bez segmentu wyniku). Ponowione z tym samym stanem A: PASS 6/6. Dwa podejścia do jednej komórki, wynik z drugiego.
- **max/7 stan częściowy:** `STATE-A-max-7-t3-partial-z-t10-crash.json` to stan z przerwanego biegu A (zawiera pełny punkt t3 i częściowy t10). Użyty do biegu B t3; bieg B t10 użył osobnego stanu `STATE-A-max-7-t10.json`.

## 5. Punkty 3 i 4 dispatchu — NIE ZMIERZONO

- **A==A' (determinizm ciągły, digest bajt w bajt przez ≥10 tur, max/4242 i max/7):** nie uruchomiono. Wymaga dwóch niezależnych biegów A po ≥10 turach na każdym ziarnie (ok. 2 × 9–12 min na ziarno). Nie zrobione w tej rundzie.
- **Render po wczytaniu (hexCount, brak [Error] w konsoli, liczba miast/jednostek widocznych, zrzut do dane/):** nie zmierzono. Bieg testowy działa bez renderu sceny (swiftshader, bez oceny wizualnej); zrzut ekranu nie był wykonywany.

## 6. Bramki

Brak zmian w kodzie w tej rundzie. Wykonano: `npx tsc --noEmit` w `gra/` — exit 0 (build vite do katalogu w scratchpadzie, nie w repo; `npm run build` nie uruchamiano). Pozostałe bramki (logic 213, ai-test 297/0 itd.) nie były potrzebne, bo nie zmieniano `gra/src`.

## 7. Kandydaci do decyzji orkiestratora (poza zakresem)

Brak nowych kandydatów błędu gry w tej rundzie. Obserwacja metodyczna: bieg B wymaga ok. 5–8 min i bywa przerywany przez SIGSEGV Chromium (2 przypadki w tej rundzie); bieg A t10 zbliża się do limitu wywołania narzędzia. Dla dalszych komórek warto rozważyć zapis kilku punktów w jednym biegu A (jeden przebieg zamiast dwóch) — wymaga zmiany skryptu, więc poza tą rundą.

## Dane

`dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-MATRIX-Q1/dane/` — pliki wyników `B-*.json` (5 biegów tej rundy, z polami `verdict`, `pageErrors`, `segments[].turns[]`) i stany `STATE-A-*.json` (punkty zapisu i zrzuty kanoniczne).
