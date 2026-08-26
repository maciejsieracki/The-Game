# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: INFORMATIONAL
TEMAT: `R-ZELAZO-ZRZUTY-25-JEDNOSTEK-Q1`
GOAL: Wyprodukować **zrzuty wszystkich 25 jednostek epoki Żelaza od przodu**, każdy
**podpisany nazwą jednostki**, żeby właściciel mógł zobaczyć, jak wyglądają po dwóch
seriach audytu. Zero zmian w kodzie gry.

## Wyzwalacz — ECHO właściciela

> „Jak skończysz, zrób deploy do roboczej, git push i potem screenshoty wszystkich nowych
> jednostek od przodu, żebym widział, jak wyglądają. Użyj nazwy jednostki, żebym wiedział,
> która jest która."

Deploy (FALA 323, md5 `04a7adcb`) i push są wykonane. To jest ostatnia, niezrealizowana
część tamtego zlecenia.

## Lista — dokładnie 25 jednostek (obie serie)

**`R-ZELAZO-MODELE-BRAKUJACE-Q1` (6):** Konnica lancowa asyryjska · Konnica łucznicza
asyryjska · Soldurii · Gaesatae · Falanga · Jeździec z oszczepami

**`R-ZELAZO-AUDYT-POZOSTALE-Q1` (19):** Garnizon Harappy · Gwardia hetycka ·
Mur tarcz (Sargonid) · Piechota neobabilońska · Gwardia Tyreńska · Tyrski miecznik ·
Wojownik z żelaznym khopesh · Thorakites · Evocati · Triari · Hieros Lochos · Hastati ·
Berserker germański · Wojownik germański · Miecznik galijski · Rydwan celtycki ·
Drużynnik · iButho z iklwa · Katapulta

Operator MA potwierdzić tę listę wobec `units.json` i dispatchów obu serii **przed**
renderowaniem — jeśli któraś nazwa nie trafia w dispatch po nazwie (jak w `buildNamedUnit`),
zgłosić to jawnie zamiast renderować cichy fallback na generyku. Renderowanie generyka pod
nazwą audytowanej jednostki byłoby najgorszym możliwym wynikiem tego tematu: właściciel
zobaczyłby „poprawiony" model, który nie jest tym modelem.

## Wymagania produktu

1. **Widok od przodu** — to jest dosłowne życzenie właściciela. Kamera gry ma stały azymut 0
   i elewację 52°, więc widok frontalny to NIE jest to, co gracz widzi w rozgrywce. Dlatego:
   kadr główny = **przód**, a jako drugi kadr na tym samym obrazku dołożyć **widok z kamery
   gry** — w tej serii wielokrotnie okazywało się, że element poprawny geometrycznie jest
   z kamery gry niewidoczny (miecz wzdłuż osi patrzenia, krzywizna khopesza, tarcza krawędzią).
   Właściciel ma zobaczyć jedno i drugie.
2. **Podpis nazwą** wypalony na obrazku (nie tylko w nazwie pliku) — właściciel ma wiedzieć,
   która jest która, patrząc na obrazek.
3. **Spójne kadrowanie i skala** między jednostkami, żeby dało się je porównywać. Jednostki
   różnią się wysokością (`maxY` od ~0,55 do ~0,82 × HEX_R) i promieniem — kadr ma to
   uwzględniać, nie przycinać.
4. **Jeden plik per jednostka** + dodatkowo **arkusz zbiorczy** (kontaktówka 5×5) do szybkiego
   przeglądu.
5. Tło i oświetlenie takie, żeby model był czytelny — nie czarna sylwetka na czarnym tle.
   Kolor gracza: użyć domyślnego niebieskiego, spójnie dla wszystkich.

## Izolacja

Gałąź `autobot/R-ZELAZO-ZRZUTY-25-JEDNOSTEK-Q1` od `origin/main`, osobny worktree per rola.

## Allowlista

- `gra/tools/*` — nowy harness renderujący (esbuild + Playwright/Chromium, wzorem istniejących
  `zelazo-*-real-render-test.cjs`, które już umieją zbudować model i ustawić kamerę).

**NIE ruszać `gra/src/**` ani `gra/data/**`.** Ten temat niczego w grze nie zmienia. Jeśli
render ujawni defekt modelu — ZGŁOSIĆ do rejestru jako osobny temat, NIE naprawiać tutaj.

Obrazki: do katalogu roboczego poza repo (scratchpad). **NIE commitować 25 plików PNG do
repo** — to artefakt do wysłania właścicielowi, nie zawartość projektu. Do repo idzie sam
harness i raporty.

## Kryteria sukcesu

1. 25 obrazków, każdy z widoczną nazwą jednostki, przód + kamera gry.
2. Każdy render potwierdzony jako **model dedykowany**, nie generyczny fallback — dowód:
   liczba mesh / obecność `userData.anchors` / prefiks nazw mesh zgodny z tym, co dodały
   serie audytu. Ten punkt jest ważniejszy niż estetyka.
3. Arkusz zbiorczy 5×5.
4. Zero błędów konsoli w renderze; zero zmian w `gra/src` i `gra/data` (`git status` dowodem).
5. `tsc --noEmit` czysty (harness nie może psuć typów), 5 bramek referencyjnych zielonych.

## HIGIENA URUCHOMIEŃ (obowiązkowa — po awariach z 2026-08-25/26)

Każde wywołanie w `timeout`. NIE uruchamiać `map-gen-regression-test`. Renderowanie 25 modeli
potrafi trwać — commituj cząstkowe postępy na gałąź W TRAKCIE pracy, żeby awaria nie skasowała
wszystkiego. Jeśli coś nie wraca w rozsądnym czasie: przerwij, zawęź, zgłoś jako niedomierzone.
Brak dowodu zgłaszaj jako brak dowodu (§13a), nigdy jako zielone.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora. Limit 5 rund.
Model/effort: **Opus 5 High dla Operatora i Evaluatora** (temat czysto wizualny, §5a),
Final Control Sonnet 5 High. `opts.model` jawnie na KAŻDYM wywołaniu `agent()` (C-062).

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–5 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
