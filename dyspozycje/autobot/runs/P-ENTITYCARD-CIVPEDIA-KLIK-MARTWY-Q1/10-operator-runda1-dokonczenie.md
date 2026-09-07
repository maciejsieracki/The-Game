# P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1 — Operator, runda 1 (dokończenie)

STATUS: PASS
DOMAIN: GAME
TEMAT: `P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1`
GOAL: Klik w „Więcej informacji (Civpedia)" otwiera właściwe hasło dla wszystkich rodzajów
kart; brak hasła daje czytelny komunikat, nie ciszę.
RUNDA: 1/5 (dokończenie przebiegu przerwanego limitem sesji — nie nowa runda)

## Zakres tego przebiegu

Kod produkcyjny był już zacommitowany w `f4cc06cd` i nie był zmieniany. Ten przebieg
domyka dowody: zrzuty PO NAPRAWIE (kryterium 1–2), mutacje (4), rodzinę bramek (7).

## Kryterium 1 i 2 — żywy Chromium

Harness: `dowody/zrzuty-zywy-chromium.cjs` (esbuild + playwright, realny `renderer.ts`
i realny `wikiHubHud.ts`, realny klik myszy). Dziesięć nowych zrzutów
`<nazwa>-po-przed-klikiem.png` / `<nazwa>-po-po-kliku.png`. Każda para ma różne md5.
Pomiar w `dowody/_pomiar-po.json`:

| scenariusz | hasButton | wikiOpen | wikiTitle | komunikat |
|---|---|---|---|---|
| 01 budynek (Biblioteka) | true | **true** | Biblioteka | — |
| 02 jednostka (Włócznik) | true | **true** | Włócznik | — |
| 03 technologia (Brązownictwo) | true | **true** | Brązownictwo | — |
| 04 ulepszenie (Farma) | true | **true** | Farma | — |
| 05 budynek bez hasła (Akwedukt) | true | false | — | „Civpedia nie ma jeszcze hasła „Akwedukt". Ten wpis czeka na napisanie." |

Zrzuty obejrzane, nie tylko zmierzone: na `02-jednostka-po-po-kliku.png` widać otwarty
panel CivPedii z pełną treścią hasła „Włócznik" (Rola, Rekrutacja, Rys historyczny) obok
karty; na `04-…` analogicznie „Farma"; na `05-…` przycisk **nadal jest** (zakaz ukrywania)
i pod nim żółty komunikat. Zrzuty `-przed-klikiem` nie mają panelu w ogóle.

**Artefakt pomiaru, wart zapisania.** Pierwszy przebieg dał `wikiOpen:false` dla jednostki,
technologii i akweduktu — i wyglądało to jak defekt produktu. Nie było nim: karty nie mają
`max-height` ani własnego scrolla, przycisk siedzi w stopce na wysokości 672 px (Farma) do
1119 px (Włócznik), więc w oknie 900 px klik w trzy wyższe karty trafiał **poza viewport**.
Okno podniesione do 1240 px; dodane dwa twarde guardy (przycisk poza viewportem oraz
`elementFromPoint` nietrafiający w przycisk **przerywają** przebieg wyjątkiem), żeby ten sam
fałszywy negatyw nie mógł już przejść po cichu w drugą stronę.

## Kryterium 3 — bramka

`gra/tools/entitycard-civpedia-klik-test.cjs` (NOWY): **71 PASS / 0 FAIL**. Buduje kartę,
uruchamia ją w jsdom na bundlu realnych modułów, wykonuje realny `click()` i mierzy parę:
szpieg **delegujący** (nagrywa `folder`/`slug`, przepuszcza do prawdziwego huba) plus
skutek w hubie (`.wh-dtitle`). Cztery rodzaje kart osobno + cud jako piąty.

## Kryterium 4 — mutacje (obie cofnięte KOPIĄ pliku, `git diff --quiet` zielony po każdej)

- **Mutacja A** — wyłączona rejestracja `addEventListener` na przycisku CivPedii
  (`renderer.ts:407`): bramka **czerwona, 38 PASS / 9 FAIL, exit 1**. Czerwienią się
  dokładnie asercje zachowania — „KLIK FAKTYCZNIE WOŁA HANDLER" dla wszystkich pięciu
  rodzajów oraz cztery asercje ścieżki „brak hasła". `tsc` zostaje zielony, co potwierdza,
  że tego defektu nie łapie kompilator, tylko ta bramka.
- **Mutacja B** — `slug` podmieniony na nieistniejący (`id + '_nieistniejacy_mutB'`):
  **zero wyjątków**, wszystkie pięć asercji „klik nie rzuca wyjątku" PASS, handler zwraca
  `no-entry`, a żywy Chromium pokazuje komunikat dla **wszystkich pięciu** scenariuszy
  (`_pomiar-mutB.json`, zero błędów strony). Ścieżka z kryterium 2 zadziałała zgodnie
  z oczekiwaniem.

## Kryterium 5 i 6

`tsc --noEmit`: **0 błędów**. Pięć bramek referencyjnych: logic **213/213**, tech-tree
**19/19**, research **33/33**, unit-replace **13/13**, combat **6/6**.

## Kryterium 7 — rodzina kart encji

Grep `gra/tools/` po `entity-card|entitycard|civpedia|karty` → **26 bramek**, wszystkie
uruchomione. **22 zielone**, w tym wskazane w dyspozycji `entity-card-contract-test.cjs`
**75/0** i `civpedia-budynki-historia-test.cjs` **136/0**.

Cztery czerwone: `building-detail-card-entitycard-migration` (51/1),
`entity-card-action-buttons-real-render` (30/1), `entity-card-cross-links-nested-overlay`
(16/8), `unit-detail-card-entitycard-migration` (37/2).

**Zmierzone, nie założone:** te same cztery uruchomiono na stanie sprzed naprawy
(`f4cc06cd^`, źródła podstawione i cofnięte KOPIĄ) — wyniki **identyczne co do liczby**:
51/1, 30/1, 16/8, 37/2. Czerwień jest **zastana**, niezwiązana z tym tematem; leżą poza
allowlistą i nie były dotykane (C-025).

**Uwaga eksploatacyjna (C-001, potwierdzona w praktyce):** przebieg rodziny nadpisał dwa
zestawy plików spoza allowlisty — śledzony `gra/src/data/wikiBundle.json`
(`civpedia-gra-id-mostek-test.cjs`, dokładnie jak ostrzega dyspozycja) oraz 12 zrzutów
w `runs/R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1/dowody/` (`entity-card-diorama-real-render-test.cjs`
pisze do cudzego katalogu dowodów). Oba przywrócone; drzewo śledzone czyste.

ZMIANY/COMMIT: `gra/tools/entitycard-civpedia-klik-test.cjs` (nowy),
`dyspozycje/autobot/runs/P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1/` (raport, harness, 10 zrzutów,
`_pomiar-po.json`, `_pomiar-mutB.json`). Kod produkcyjny bez zmian względem `f4cc06cd`.
TESTY: nowa bramka 71/0; tsc 0 błędów; referencyjne 213/19/33/13/6; rodzina 22/26 zielone,
4 czerwone zastane (potwierdzone na bazie).
BLOKADY: brak.
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO.
