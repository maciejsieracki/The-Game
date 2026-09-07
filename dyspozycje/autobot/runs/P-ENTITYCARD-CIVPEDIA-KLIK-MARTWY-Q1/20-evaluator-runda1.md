# P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1 — Evaluator, runda 1

STATUS: PASS-WITH-NOTES (werdykt wydaje Final Control)
DOMAIN: GAME
TEMAT: `P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1`
GOAL: Klik w „Więcej informacji (Civpedia)" otwiera właściwe hasło dla wszystkich rodzajów
kart; brak hasła daje czytelny komunikat, nie ciszę.
RUNDA: 1/5

## Guard izolacji

HEAD `3c2b3c38`, gałąź `autobot/P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1`, drzewo czyste.
Zgodne z oczekiwaniem — praca podjęta.

## Weryfikacja niezależna, kryterium po kryterium

**1 — PASS.** Otworzyłem wszystkie pięć zrzutów `*-po-po-kliku.png`, nie poprzestałem na
istnieniu plików. Realnie widać: panel CIVPEDIA otwarty po lewej z pełną treścią hasła —
„Biblioteka" (Co robi / Koszty / Strategia gracza / Rys historyczny), „Włócznik" (Rola /
Rekrutacja / Countery), „Brązownictwo" (Wymagania / Co odblokowuje), „Farma". Nagłówek hasła
w panelu zgadza się z tytułem karty w każdym przypadku. Kontrola `02-…-po-przed-klikiem.png`:
panelu nie ma w ogóle, przycisk jest — czyli zrzut „po kliku" nie jest tą samą sceną.
Dowód liczbowy obok zrzutu (`_pomiar-po.json`): `wikiOpen:true` + `wikiTitle` równy tytułowi
dla 01–04. **Dowód md5:** pary `-przed-` (stan sprzed naprawy) mają IDENTYCZNY md5 przed i po
kliku — klik dosłownie nic nie zmieniał; wszystkie pary `-po-` mają md5 różne.
Harness `zrzuty-zywy-chromium.cjs` sprawdzony: realny esbuild-bundle `renderer.ts` +
`wikiHubHud.ts`, `chromium.launch` (playwright), `page.mouse.click`, plus dwa guardy
przerywające przebieg przy kliku poza viewportem i przy `elementFromPoint` nietrafiającym
w przycisk.

**2 — PASS.** `05-budynek-brak-hasla-po-po-kliku.png`: przycisk „Więcej informacji (Civpedia)"
**nadal jest** (zakaz ukrywania dochowany), pod nim żółty komunikat „Civpedia nie ma jeszcze
hasła „Akwedukt". Ten wpis czeka na napisanie." Zgodne z `_pomiar-po.json` (`wikiOpen:false`,
`note` niepuste).

**3 — PASS.** `gra/tools/entitycard-civpedia-klik-test.cjs` uruchomiony u mnie: **71 PASS /
0 FAIL, exit 0**. Bramka nie czyta atrybutów — buduje kartę na bundlu realnych modułów,
wykonuje `click()` i mierzy PARĘ: szpieg delegujący (`folder`/`slug`, dokładnie 1 wywołanie)
plus skutek w prawdziwym hubie (`.wh-dtitle`). Cztery rodzaje osobno + cud jako piąty.

**4 — PASS, obie mutacje odtworzone przeze mnie samodzielnie (kopią pliku, nie `git checkout`).**
- Mutacja A (wyłączona rejestracja `addEventListener` na przycisku CivPedii, `renderer.ts:407`):
  **38 PASS / 9 FAIL, exit 1** — liczba identyczna z deklaracją Operatora. Czerwienią się
  asercje zachowania („KLIK FAKTYCZNIE WOŁA HANDLER" ×5) i ścieżka „brak hasła".
- Mutacja B (slug → `id + '_nieistniejacy_mutB'` w źródle normalizacji): **zero wyjątków** —
  wszystkie asercje „klik nie rzuca wyjątku" PASS, handler zwraca `no-entry` dla wszystkich
  pięciu rodzajów, komunikat widoczny i czytelny. Zadziałała ścieżka z kryterium 2, zgodnie
  z wymaganiem.
- Po każdej mutacji `git diff --quiet` zielony, `git status --short` pusty.

**5 — PASS.** `node ./node_modules/typescript/bin/tsc --noEmit` — exit 0, zero wyjścia.

**6 — PASS, wszystkie pięć uruchomione u mnie.** logic **213/213**, tech-tree **19/19**,
research **33/33**, unit-replace **13/13**, combat **6/6**.

**7 — PASS co do substancji, z uchybieniem formy (zarzut 1).** Uruchomiłem wszystkie **26**
bramek z grepu — wyniki co do sztuki zgodne z raportem: 22 zielone (w tym
`entity-card-contract-test` **75/0**, `civpedia-budynki-historia-test` **136/0**),
4 czerwone: 51/1, 30/1, 16/8, 37/2.
**Zastanie czerwieni zweryfikowałem sam, nie przyjąłem na słowo:** podstawiłem KOPIAMI wersje
bazowe sześciu zmienionych plików źródłowych z `f4cc06cd^` (i usunąłem `civpediaOpenGate.ts`),
uruchomiłem te cztery bramki ponownie — **51/1, 30/1, 16/8, 37/2, identycznie**. Czerwień jest
sprzed tematu. Drzewo przywrócone, `git diff --quiet` zielony.
Potwierdzam też ostrzeżenie eksploatacyjne: przebieg rodziny brudzi pliki spoza allowlisty
(`gra/src/data/wikiBundle.json` + 12 zrzutów w `runs/R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1/dowody/`).
Przywróciłem je jawnymi ścieżkami.

## Kontrola przeciw „naprawie jednej ścieżki" (Tryb drugi)

Sprawdziłem, czy istnieje żywa ścieżka renderu OMIJAJĄCA normalizację slug w
`buildEntityCardData`. **Istnieje:** `unitInfoCard.ts:72,91` i `cityPanel.ts:7381-7382,7697-7708`
wołają adapter BEZPOŚREDNIO i podają wynik do `renderEntityCard`. Sprawdziłem konsekwencje:
`buildingAdapter` ma `id: building.id` i `slug: building.id`, `unitAdapter` ma
`id: unitToSlug(...)` i `slug: unitToSlug(...)` — slug równy id, więc zachowanie na tych
ścieżkach jest równoważne i **defektu nie ma**. Adaptery z placeholderowym slugiem
(`improvement`, `wonder`) nie są wołane bezpośrednio. Uwaga o kruchości — zarzut 4.

## Zarzuty

Wszystkie dotyczą DOKUMENTACJI i śladu procesowego. **Nie znalazłem defektu funkcjonalnego.**

1. Kryterium 7 żąda dosłownie „wypisz listę i wynik każdej". Raport podaje agregat (26 / 22
   zielone / 4 czerwone) i wymienia 4 czerwone oraz 2 wskazane zielone — brak listy 26 pozycji
   z wynikiem każdej. Substancja zweryfikowana przeze mnie i zgodna; brakuje wymaganej formy.
2. G1 dispatchu („obowiązkowy") żąda: „Wypisz w raporcie, który wzorzec wybrałeś i który
   istniejący kod jest dla niego precedensem". W katalogu runu są tylko `00-dispatch.md`
   i raport dokończenia; **raportu Operatora dla commitu produkcyjnego `f4cc06cd` NIE MA**
   (sprawdzone `git ls-tree` na tym commicie). Wybór szwu `civpediaOpenGate.ts` i precedens
   `unitCtxDockDiploGate.ts` żyją wyłącznie w komentarzu kodu i w treści commitu.
3. Druga część defektu z G1 („czy folder/slug odpowiadają argumentom `openEncyEntry`")
   została ZNALEZIONA i NAPRAWIONA (tolerancyjne dopasowanie; jednostki 13/75 → 49/75 wg
   bramki), ale w żadnym raporcie nie jest opisana. Tak samo nieujawnione w raporcie:
   dla 3 z 4 rodzajów kart przycisk przed naprawą **w ogóle nie powstawał**
   (`civpediaLink: null` w adapterach; `_pomiar-przed.json` `hasButton:false` dla 02/03/04) —
   defekt głębszy niż RECON dispatchu. Allowlista żąda też „wypisz je jawnie w raporcie"
   dla dodatkowych plików `entityCards/` — 4 adaptery i nowy `civpediaOpenGate.ts` nie są
   wyliczone w żadnym raporcie (`ZMIANY/COMMIT` wymienia tylko bramkę i katalog runu).
4. Komentarze w kodzie produkcyjnym (`civpediaOpenGate.ts`, `renderer.ts`, `wikiHubHud.ts`)
   powołują się na „raport tematu, sekcja POMIARY", który nie istnieje, i podają „16 z 41
   budynków" bez hasła, podczas gdy dispatch mówi „25 z 42". Dodatkowo komentarz w
   `renderer.ts` uzasadnia bezpieczeństwo placeholderowego sluga zdaniem, że
   `buildEntityCardData` go nadpisze — co NIE zachodzi na ścieżkach wołających adapter
   bezpośrednio (sekcja wyżej). Dziś nieszkodliwe, ale uzasadnienie jest nieścisłe.

ZMIANY/COMMIT: `dyspozycje/autobot/runs/P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1/20-evaluator-runda1.md`
(ten raport). Zero zmian w kodzie i w dowodach Operatora.
TESTY: bramka tematu 71/0; mutacja A 38/9 exit 1; mutacja B zero wyjątków, `no-entry` ×5;
tsc 0 błędów; referencyjne 213/19/33/13/6; rodzina 26 bramek — 22 zielone, 4 czerwone
potwierdzone jako zastane na `f4cc06cd^`.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO.
