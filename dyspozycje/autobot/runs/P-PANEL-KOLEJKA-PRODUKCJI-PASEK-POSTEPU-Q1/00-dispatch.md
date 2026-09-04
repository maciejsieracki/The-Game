# P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1 — dispatch

TEMAT: `P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1`
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — **Opus 5**, effort high; Evaluator — **Opus 5**, effort high
(temat wizualny, `R-PROC-AUTOBOT.md` §9 poz. 6b); Final Control — Sonnet 5, effort high.

## WYZWALACZ (dosłownie, właściciel, z dwoma zrzutami)

> „Przydałyby się oprócz procentów jakieś paski postępu w tym miejscu, czyli dąb starszy
> byłby w takim podłużnym batonie, na przykład dąb starszyzny, i wskazywałby procent
> zajętości lub realizacji – taki pasek postępu."
>
> „Coś takiego jak tutaj."

Zrzut 1 — sekcja **KOLEJKA PRODUKCJI** (miejsce do poprawy): tabela MIASTO / BUDUJE TERAZ
/ W KOLEJCE, np. „Sparta · Dom Starszyzny (63%) · 0". Sam procent w nawiasie, bez paska.
Zrzut 2 — sekcja **PRODUKCJA NAUKI** (wzorzec wskazany przez właściciela): nazwa miasta,
poziomy pasek wypełniony gradientem, wartość po prawej („+13 PN").

*(„dąb starszy" / „dąb starszyzny" w wyzwalaczu to przejęzyczenie dyktowania — chodzi
o budynek **Dom Starszyzny**, widoczny na zrzucie.)*

## RECON (zweryfikowany odczytem kodu; POTWIERDŹ własnym odczytem)

**A. Obie sekcje są w JEDNYM pliku — `gra/src/ui/empireDetailPanel.ts`.** To upraszcza
temat: nie ma tu integracji między modułami, jest ujednolicenie dwóch sąsiadujących
fragmentów tego samego widoku.

**B. Wzorzec paska JUŻ ISTNIEJE i jest gotowy do naśladowania** — sekcja „Produkcja nauki",
`empireDetailPanel.ts:1964-1984`. Kształt: wiersz `display:flex; align-items:center; gap:8px`,
w środku `<span style="flex:1">nazwa</span>`, następnie tor
`<span style="flex:2;height:8px;border-radius:999px;background:#1f2733;overflow:hidden">`
z wypełnieniem `<span style="display:block;height:100%;width:${pct}%;
background:linear-gradient(90deg,#2c4a6b,#8ec5ff)">`, na końcu wartość w stałej szerokości
`62px`, wyrównana do prawej.

**C. Procent JEST JUŻ POLICZONY — nie liczysz go od nowa.**
`empireDetailPanel.ts` ~2062-2065, sekcja „Kolejka produkcji":
`const pct = front.postep != null ? clamp(round(front.postep / max(1, front.koszt) * 100), 0, 100) : null`.
Zwróć uwagę na `null` — **pozycja bez `postep` nie ma procentu i dziś nie pokazuje nawiasu**.
Ten przypadek musi zostać obsłużony (patrz GOAL 3).

**D. RÓŻNICA ZNACZENIA — to jest najważniejszy punkt tego tematu.**
Oba paski będą wyglądać identycznie, ale **znaczą co innego**:
- pasek nauki jest **względny** — `pct = n / maxN`, czyli udział miasta wobec
  NAJSILNIEJSZEGO miasta w zakresie (stopka mówi to wprost:
  „Pasek = udział miasta względem najsilniejszego w zakresie", `:1982-1983`);
- pasek produkcji ma być **bezwzględny** — `postep / koszt`, czyli ukończenie 0-100%.

Gracz, widząc dwa identyczne paski jeden pod drugim, odczyta drugi przez analogię do
pierwszego. **Stopka sekcji kolejki musi to rozróżniać jawnie** — inaczej ten temat
pogorszy czytelność zamiast poprawić.

**E. Obecna stopka sekcji kolejki jest długa i niesie ważne zastrzeżenie**
(`empireDetailPanel.ts` ~2073-2080): procent dotyczy WYŁĄCZNIE pozycji na froncie kolejki,
a pozycje za frontem mogą mieć zbankowany postęp, którego ten widok nie pokazuje.
Powstała jako naprawa N5 po `FAIL` Evaluatora (komentarz w kodzie wprost o tym mówi).
**Nie usuwaj tego zastrzeżenia** — dopisz do niego wyjaśnienie paska, nie zastępuj go nim.

**F. Struktura wiersza jest inna niż w nauce.** Kolejka używa `miniHeader`/`miniRow`
z siatką `'1fr 1.3fr 0.7fr'` (trzy kolumny), a nauka — swobodnego flexa. To jest realna
przeszkoda konstrukcyjna: pasek musi zmieścić się w kolumnie „BUDUJE TERAZ" obok nazwy
budynku, albo siatka musi się zmienić. **Wybór należy do Operatora**, ale ma być
uzasadniony w raporcie i pokazany na zrzucie, bo od niego zależy, czy tabela pozostanie
czytelna przy 12+ miastach (tyle widać na zrzucie właściciela).

## GOAL

### GOAL 1 — pasek postępu w sekcji „Kolejka produkcji"

Wiersz miasta pokazuje poziomy pasek wypełnienia odpowiadający procentowi ukończenia
pozycji na froncie kolejki, wizualnie spójny z paskiem z sekcji „Produkcja nauki"
(ten sam tor, ten sam promień, ta sama wysokość, ten sam język gradientu). Procent
liczbowy **zostaje** — właściciel prosił o pasek „oprócz procentów", nie zamiast nich.

### GOAL 2 — jawne rozróżnienie znaczenia obu pasków (recon D)

Stopka sekcji „Kolejka produkcji" mówi wprost, że pasek pokazuje **ukończenie pozycji**
(0-100%), a nie udział względem innych miast. Istniejące zastrzeżenie o froncie kolejki
i zbankowanym postępie (recon E) **zostaje nienaruszone**.

### GOAL 3 — przypadki brzegowe, które dziś istnieją w danych

Obsłuż jawnie i pokaż na zrzutach:
1. **kolejka pusta** — dziś „pusta" na szaro; pasek nie powinien się pojawiać (nie ma
   czego pokazywać), a nie rysować się jako 0%;
2. **`front.postep == null`** — brak danych o postępie (recon C); pasek NIE może udawać 0%,
   bo to różne stany: „nie zaczęto" vs „nie wiadomo";
3. **0%** — realne zero (na zrzucie właściciela są dwa takie miasta: Yan, Zhao); pasek ma
   być widoczny jako pusty tor, nie zniknąć;
4. **100%** — pełne wypełnienie bez przelewania się poza tor;
5. **kolejka wstrzymana** (`econ.queueWstrzymana`, dziś dopisek „· wstrzymana") — pasek
   nie może sugerować trwającego postępu; rozstrzygnij jak (np. wygaszenie) i uzasadnij.

### GOAL 4 — bramka testowa

Nowa `gra/tools/panel-kolejka-pasek-postepu-test.cjs` (żywy Chromium, wzorem istniejących
bramek real-render w `gra/tools/`), minimum:
1. wiersz miasta z pozycją na froncie zawiera element paska o szerokości wypełnienia
   odpowiadającej procentowi (tolerancja ≤1 punkt procentowy, mierzone
   `getBoundingClientRect`, nie odczytem atrybutu `style`);
2. procent liczbowy nadal jest obecny (asercja przeciw zamianie zamiast dodania);
3. 0% → tor widoczny, wypełnienie o szerokości 0;
4. 100% → wypełnienie nie przekracza toru;
5. `postep == null` → brak paska, brak procentu;
6. kolejka pusta → brak paska;
7. stopka zawiera wyjaśnienie znaczenia paska ORAZ nadal zawiera zastrzeżenie o froncie
   kolejki (asercja przeciw zjedzeniu recon E);
8. wysokość/promień toru zgadza się z paskiem sekcji „Produkcja nauki" — asercja
   `getComputedStyle` na obu, nie ogląd.

## KRYTERIA KOŃCA (binarne)

- [ ] `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
- [ ] `node tools/panel-kolejka-pasek-postepu-test.cjs` — 100% pass, minimum 8 asercji.
- [ ] Zrzuty żywego Chromium: panel z 12 miastami (jak na zrzucie właściciela), oraz
      przypadki brzegowe z GOAL 3 — **obejrzane i opisane**, w `dowody/`.
- [ ] Pięć bramek referencyjnych bez regresu: logic 213/213, tech-tree 19/19,
      research 33/33, unit-replace 13/13, combat 6/6.
- [ ] Bez regresu na bramkach panelu imperium — **znajdź je sam**
      (`ls gra/tools/ | grep -Ei "empire|imperium|panel"`), uruchom WSZYSTKIE, podaj
      wyniki; czerwona → sprawdź parytet na czystej bazie PRZED zgłoszeniem jako regres.

## REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

**Tryb pierwszy, specyficzny dla tego tematu: skopiowanie WYGLĄDU paska razem z jego
ZNACZENIEM.** Pasek nauki jest względny, produkcyjny ma być bezwzględny (recon D).
Jeśli skopiujesz też `pct = wartość / max(wartości)`, temat będzie wyglądał na zrobiony
i będzie błędny. W raporcie **podaj wprost formułę, której użyłeś**, i pokaż, że to
`postep / koszt`, a nie udział względem innych miast.

**Tryb drugi: uznanie tematu wizualnego za zamknięty bez obejrzanego zrzutu.** Wymagany
zrzut z żywego Chromium przy realnej liczbie miast (12+), obejrzany i opisany. Tabela,
która wygląda dobrze przy trzech miastach, potrafi się rozjechać przy dwunastu — a zrzut
właściciela pokazuje dwanaście.

**Tryb trzeci: pomiar szerokości paska z atrybutu `style` zamiast z realnego układu.**
`width:63%` w `style` nie dowodzi, że pasek ma 63% szerokości toru — dowodzi tego dopiero
`getBoundingClientRect` obu elementów. To jest ta sama klasa błędu, którą wykryto kiedyś
w tym projekcie przy pigułkach kart encji (pomalowane pudełko ≠ obszar klikalny).

**Tryb czwarty: test tautologiczny.** Pokaż, że bramka czerwienieje po mutacji — zmień
formułę na `pct = 100` dla wszystkich, uruchom, wklej liczbę faili, cofnij.

## ALLOWLISTA

- `gra/src/ui/empireDetailPanel.ts`
- `gra/tools/panel-kolejka-pasek-postepu-test.cjs` (nowy)
- `dyspozycje/autobot/runs/P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.
**`gra/src/main.ts`, `gra/src/ui/entityCards/**`, `gra/src/ui/techDiscoveryNotice.ts`,
`gra/src/game/society-breakdown.ts`, `gra/src/game/order.ts`, `gra/data/society-params.json`,
`gra/src/ui/sidePanelHud.ts`** — świadomie poza allowlistą, zajęte przez równolegle
biegnące tematy (`R-PROC-AUTOBOT.md` §2b). Jeśli zmiana ich wymaga — `DECISION_REQUIRED`.
Zakaz `git add -A` i `git add .`.

**Uwaga na zakres:** nie zmieniasz `empireDetailTypes.ts` ani źródła danych
(`econ.queue`, `front.postep`, `front.koszt`) — dane są już dostępne w widoku (recon C).
Jeśli okaże się, że nie są — to jest `DECISION_REQUIRED`, bo oznacza zmianę kontraktu
danych, a nie warstwy wizualnej.

## IZOLACJA

Worktree `/home/user/wt-panel-kolejka-pasek`, gałąź
`autobot/P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1`, baza jawnie `origin/main` —
potwierdź `git log -1` PRZED pracą.

C-001, brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje
JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist
--emptyOutDir". Jedyna dozwolona kompilacja: `node ./node_modules/typescript/bin/tsc
--noEmit`; bramki `node tools/*-test.cjs` nie są zakazem objęte. `--outDir` poza drzewem
repo (np. `/tmp/civ-dist-pasek`).

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Nie usuwasz procentu liczbowego — właściciel prosił o pasek „oprócz procentów".
- Nie usuwasz zastrzeżenia o froncie kolejki i zbankowanym postępie (recon E) — powstało
  jako naprawa po `FAIL`, jego usunięcie jest cofnięciem cudzej pracy.
- Nie zmieniasz sekcji „Produkcja nauki" — jest wzorcem, nie celem. Wyjątek: gdyby
  ujednolicenie wymagało wspólnego helpera, wolno go wprowadzić i użyć w obu miejscach,
  ale **bez zmiany wyglądu ani znaczenia paska nauki** (dowód: zrzut przed i po).
- Nie zmieniasz logiki produkcji ani kolejki — to temat wyłącznie o warstwie widoku.
- Nie integrujesz, nie deployujesz, nie pushujesz.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec
skryptu. Final Control osobno, integracja allowlist-only ręką orkiestratora.
