# GOAL 3 — dowód nietautologiczności bramek (surowe dane, §11)

Temat: `P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1` · runda 1/5 · Operator (Opus 5, effort high)

Mutacja = usunięcie jednej linii ze źródła, uruchomienie bramki, **przywrócenie źródła**.
Po każdej serii `git status --porcelain` potwierdza brak resztek.

## A. Bramka statyczna `mgla-sciezka-inwariant-test.cjs`

Stan czysty po obronie: **42 pass / 0 fail** (przed obroną: 24/0 — blok [1c] dołożył 18 asercji).

### A1. Mutacje pojedyncze (przebieg Operatora, stan bramki 24 asercje)

| Mutacja | Usunięta linia | Wynik |
|---|---|---|
| M1/3 `applyMarchSegmentInstant` | `:22545` `…computeVisibleAlongPath(result.movePath…)` | 22 pass / 2 fail |
| M2/3 koniec tury w animacji | `:27720` `…computeVisibleAlongPath(anim.pathHexes…)` | 22 pass / 2 fail |
| M3/3 koniec animacji (renderLoop) | `:32480` `…computeVisibleAlongPath(pathHexes…)` | 22 pass / 2 fail |
| M4 czwarte miejsce (zwiadowca) | `:27773` `revealAlongPathForStack([u], …)` | 22 pass / 2 fail |
| M5 wydrążenie helpera | `:9733` korpus helpera | 22 pass / 2 fail |

Wstrzyknięte hipotetyczne PIĄTE miejsce (`u.q = dest.q; u.r = dest.r; refreshFog();`)
→ **23 pass / 1 fail**, blok [1] wskazał obie linie. Przywrócono.

### A2. Powtórzenie po refaktorze skanera (obrona, stan bramki 42 asercje)

Blok [1c] wymagał uogólnienia `skanujZrodlo` → `skanujWzorcem`. Kontrola, że refaktor nie
osłabił detekcji:

| Mutacja | Wynik |
|---|---|
| miejsce 1/3 (`applyMarchSegmentInstant`) | **40 pass / 2 fail** |
| miejsce 2/3 (koniec tury w animacji) | **40 pass / 2 fail** |
| czwarte miejsce (hak `onAfterStep`) | **40 pass / 2 fail** |
| po przywróceniu | **42 pass / 0 fail** |

Miejsca 3/3 nie mutowano w tej serii, bo jego wzorzec tekstowy
(`computeVisibleAlongPath(pathHexes, …)`) występuje w `main.ts` dwukrotnie (korpus helpera
+ renderLoop) i podmiana tekstowa trafiłaby w pierwsze wystąpienie. Pokrywa je asercja
zliczająca w bloku [4] (`=== 2`) oraz mutacja M3/3 z serii A1.

### A3. Domknięcie wzorców pośrednich (zarzut 1 Evaluatora)

Odtworzony eksperyment Evaluatora: nowy plik `gra/src/game/nowy-ruch.ts` z przeskokiem
wieloheksowym bez odkrycia ścieżki, w dwóch konwencjach niewidocznych dla wzorca `.q =`.

| Wariant piątego miejsca | Przed obroną | Po obronie |
|---|---|---|
| `u['q'] = last.q; u['r'] = last.r;` | 24 pass / **0 fail** (nie złapane) | **36 pass / 2 fail** |
| `Object.assign(u, { q: last.q, r: last.r });` | 24 pass / **0 fail** (nie złapane) | **37 pass / 1 fail** |
| po usunięciu pliku | — | **42 pass / 0 fail** |

## B. Bramka behawioralna `mgla-sciezka-rzeka-test.cjs`

14/14. Usunięcie haka z `main.ts` → **13 pass / 1 fail** (weryfikacja Evaluatora).

## C. Bramka z żywej przeglądarki `mgla-sciezka-live-test.cjs`

Realny `vite build` (`--outDir` poza repo, C-001) → headless Chromium → `?playtest=mapa` →
realny klik w `button[data-act="scout-explore"]` → realny koniec tury.

| Przebieg | Dystans przejścia | Nowe heksy w `explored` | Widoczne z pozycji końcowej | **Odkryte TYLKO po drodze** | Wynik |
|---|---|---|---|---|---|
| normalny | 3 heksy | 5 | 91 | **2** | **11 pass / 0 fail** |
| `--mutacja` (odkrycie per-krok → no-op) | 3 heksy | 3 | 91 | **0** | 10 pass / **1 fail** [C3] |

Przebieg mutacyjny odtwarza **dokładnie zgłoszenie właściciela**: jednostka przechodzi kilka
heksów, a jedyne, co się odkrywa, jest widoczne z heksu końcowego — „nie odkrywa nic po
drodze". Skrypt przywraca `main.ts` po przebiegu (`git diff --stat` potwierdzone).

Zrzuty: `live-01-przed-tura.png`, `live-02-po-turze.png`,
`live-02-po-turze-MUTACJA.png` (stan sprzed naprawy).
