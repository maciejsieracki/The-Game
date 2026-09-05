# R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1 — Operator, runda 1/5

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
GOAL: `Aszur` na `miasta_cywilizacji[0]` Asyrii, `Byblos` na `[0]` Fenicji (`Ninive` i `Tyr` zostają dalej na listach) + rozłączne pule `miasta_panstwa` × `miasta_cywilizacji` dla 15 cywilizacji.
MODEL+EFFORT: Opus 5, effort high (C-052) · ROLA: Operator · RUNDY: 1/5

> **KOREKTA (§13b, wprowadzona w obronie — `03-obrona.md`).** `STATUS` był
> `PASS-WITH-NOTES`, jest `DECISION_REQUIRED` (zarzut 3 — dispatch nakazuje ten status,
> gdy pojawia się potrzeba zmiany poza allowlistą/w kodzie). Tekst pierwotny, 609 słów
> wobec limitu §11: `git show 20016500:dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/01-operator.md` (zarzut 8).

## ZMIANY/COMMIT

- `gra/data/city-names-pools.json` — Asyria `[0] Ninive→Aszur`, `[1]→Ninive`, pisownia `Assur→Aszur` (konwencja pliku: `Dur-Szarrukin`, `Tuszhan`, `Aszur` w puli Sumeru); Fenicja `[0] Tyr` ↔ `[2] Byblos`. Wymienione **140** nazw `miasta_panstwa` (14 cywilizacji × 10; `chinczycy` bez zmian — wzorzec wskazany w dispatchu).
- `gra/data/civs.json` — **poza allowlistą, BLOKADA 1**: `nazwyKlastra` musi być bit w bit równe `miasta_panstwa` (`gra/src/game/civ-names.ts:167-172`), inaczej `city-names-pools-test` czerwienieje.
- `gra/tools/nazwy-miast-rozlaczne-pule-test.cjs` — NOWA bramka (K1–K5).
- `gra/tools/city-names-pool-test.cjs`, `gra/tools/civ-names-test.cjs` — wyłącznie zaszyte wartości greckie + komentarz uzasadniający (allowlista dopuszcza to jawnie).

**Skąd nazwy** (zakaz wymyślania — każda grupa ma źródło): grecy — mniejsze poleis Argolidy i Beocji oraz kolonie trackie; rzymianie — municipia i kolonie Lacjum/Etrurii/Apulii; inkowie — ośrodki Doliny Świętej i tambos administracyjne; zulusi — amakhanda i wchłonięte wodzostwa; egipt — stolice nomów i ośrodki Fajum/Środkowego Egiptu; sumer — prowincje i państwa zależne Ur III; celtowie — oppida La Tène i Celtyberia; germanie — grody pierścieniowe oraz emporia epoki żelaza; harappa — osiedla Gudźaratu/Kaczchu i Shortugai; hetyci — drugorzędne stolice, miasta kultowe i wasale; słowianie — grody Połabia i pogranicza; babilonia — chaldejskie i aramejskie państwa plemienne; asyria — stolice prowincji nowoasyryjskich; fenicjanie — punickie osady wtórne i kolonie zależne.

## TESTY

Zestaw uruchomiony ponownie po poprawkach obrony — pełne wyniki w `03-obrona.md`.
Zakaz C-001 dotrzymany: żadnego `npm run build`/`dev`; jedyna kompilacja `tsc --noEmit`.

## BLOKADY

1. **Rozszerzenie allowlisty o `gra/data/civs.json`** — do ratyfikacji właściciela; bez tego kryterium 6 jest nieosiągalne. To dane, nie kod; `gra/src/**` nietknięte.
2. **Ścieżka legacy** (`civ-names.ts:63, 96`, wywołania bez puli) czyta `nazwyKlastra[0]`, więc awaryjna stolica to nazwa państwa-miasta — dla wszystkich 15 cywilizacji, nie tylko Greków. Naprawa wymaga `gra/src/**` → osobny temat.
3. Overflow `clusterRivalFromPool` (indeks ≥ 10) zwraca `miasta_cywilizacji[0]`; `MAX_MIAST_PANSTWA = 9`, więc w grze nieosiągalny — wartość zaszyta w bramce z komentarzem.
4. Kolizji przed zmianą zmierzono **125**, nie 126 z dispatchu (`Závist` ≠ `Zavist`).
5. Żadna nowa nazwa nie trafia na `miasta_cywilizacji[0]`; budżet etykiety 305 px nietknięty.

NASTĘPNY KROK: Final Control (Sonnet 5, effort high).
DEPLOY/PUSH: NIE WYKONANO
