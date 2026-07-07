# REJESTR BŁĘDÓW — playtest Macieja, bundle d744cd7956fb (2026-07-06)

TRYB: tylko rejestracja (limit na wyczerpaniu). NIE pracujemy nad żadnym wpisem
do odnowienia limitu (powrót: czwartek 2026-07-09). W czwartek MASTER robi z tego
triage → zadania do kanału z routingiem [SONNET]/[OPUS].

Format wpisu: `## B<nr> [HH:MM] — temat` + opis Macieja (wiernie) + ew. 1 linijka
interpretacji MASTERA.

ZDJĘCIA: każdy screenshot Macieja jest KOPIOWANY na dysk do
`rejestr-bugow-2026-07-06-img\B<nr>-<k>.png` i linkowany we wpisie — czat może
zniknąć (kompaktowanie), plik zostaje. Wpis bez skopiowanego zdjęcia = niekompletny.

---

## B1 [—] — Panel miasta: duplikat „Surowce w zasięgu" + zakryte suwaki podziału handlu

STATUS: CZĘŚCIOWO WDROŻONE (B1-Q1 + B2-Q1=B, 2026-07-07)

- Objaw 1: blok „SUROWCE W ZASIĘGU / POTENCJAŁ (ZŁOŻE)" renderuje się DWA razy (górna karta + osobny dolny blok).
- Objaw 2: zniknęły suwaki podziału przychodu z handlu (Skarb/Nauka/Zamożność). Hipoteza Macieja (mocna): dolny blok surowców ZAKRYWA ramkę z suwakami.
- Ustalono (INTEGRATOR+Opus): blok renderuje tylko `renderSurowce` (tytuł `cityPanel.ts:~1984`), 1 żywe wywołanie w kodzie (`#cs-surowce-foot` @~6658), mount panelu w kodzie pojedynczy (main.ts `showCityPanel`@~1699; `showCityUxFrame` dedupuje) → drugi render powstaje w RUNTIME. Root-cause prawdopodobny: dwa współistniejące systemy panelu — stary „szkielet" designera (`skeleton`@~5701/`renderEkonomiaStrip`@~2645, suwaki inline) + nowa ramka zakładkowa (`paintCityPanelSections`/`cityUxFrame`).
- Próba fixu INTEGRATORA (usunięcie wywołania `appendW4TabFooter`@~6489) — trafiła w martwy render, NIE pomogła (potwierdzone playtestem po twardym refreshu).
- U kogo: KURSOR (wymaga inspekcji DOM/DevTools). Pakiet: `dyspozycje/DO-KURSORA-panel-miasta-i-zapis.md`.

**AKTUALIZACJA 2026-07-06 [20:56] (build 6e3027fe):** duplikat NADAL występuje. Dodatkowo w panelu PRODUKCJA blok „Surowce w zasięgu" pojawia się PO RAZ TRZECI — czyli trzecie, kolejne wystąpienie tego samego bloku, tym razem na dole panelu produkcji/lewego. Blok renderuje się wielokrotnie w różnych panelach, nie tylko w panelu miasta. Status nadal OTWARTY. U kogo: KURSOR/UX (inspekcja DOM).

**AKTUALIZACJA 2026-07-07:** B1-Q1 wdrożone (jeden blok surowców w stopce). B2-Q1=**B** — zakładka handlu ze scrollem i hintem; suwaki na zakładce „Podział handlu i zamożność". Decyzja: `docs/decyzje/B2-Q1-panel-handlu-zakladki.md`. Do weryfikacji wizualnej po buildzie roboczym.

## B2 [—] — Kanon i finalna gra nadpisane wersją roboczą (brak punktu przywrócenia)

STATUS: OTWARTY (model handlu — zamknięty decyzją B2-Q1=B)

- Maciej nadpisał zarówno kanon, jak i finalną grę ostatnią (roboczą) wersją (dawno nie były update'owane) → NIE MA skąd przywrócić panelu sprzed zmian UX.
- Propozycja Macieja: przywrócić/odtworzyć TYLKO model „podział handlu i zamożność" sprzed zmian UX (nie cały panel).
- **2026-07-07 B2-Q1=B:** Maciej wybrał układ zakładek (bez powrotu do szkieletu designera). Szczegóły: `docs/decyzje/B2-Q1-panel-handlu-zakladki.md`.
- U kogo: do decyzji (Kursor przy naprawie panelu B1, bo ten sam obszar).

---

## B3 [21:22] — Stare menu pauzy (emoji; nowy reskin SVG niewdrożony)

STATUS: OTWARTY

**Obszar:** UI / menu pauzy (`gamePauseMenu.ts`)
**Opis Macieja:** „Stare menu gry. Prawdopodobnie nie wgrane nowe."
**Szczegóły:** Modal „Menu gry" (pauza) na mapie. Pozycje: „Wróć do gry" (podświetlona), „💾 Zapisz grę", „📂 Wczytaj grę" (wyszarzona), „▶ Rozpocznij nową grę", „☰ Przejdź do menu głównego" — ikony to nadal EMOJI (💾📂▶☰) = stara wersja. Reskin SVG (gamePauseMenu → menu-save/menu-load/menu-play/ui-menu, zrobiony 2026-07-06 w podmianach 1-7 UX) NIE jest jeszcze wdrożony do buildu. Prawdopodobnie zniknie po najbliższym buildzie z podmianami UX — do weryfikacji po deployu.
**Screenshot:** brak pliku (inline w czacie, uploady puste) — opis powyżej jest zapisem.

## B4 [21:22] — Badania + drzewko technologii (infografiki + brak wyboru z drzewka + pozycja przycisku)

STATUS: OTWARTY

**Obszar:** UI + logika nauki (`sciencePicker.ts` / `scienceHubHud.ts` + drzewko technologii)
**Opis Macieja (wiernie):** „Musimy zaktualizować infografiki przy badaniach oraz całe drzewko, które jest przestarzałe. Kiedy chce się kliknąć wybór z drzewka, nie da się wybrać następnej technologii — trzeba to zrobić z listy. Pełne drzewko powinno być u samej góry, a nie na dole (niewidoczne, trzeba szukać). Np. wybrane Garncarstwo; klik na Obróbkę drewna w drzewku NIE wybiera jej — gra wychodzi z drzewka i zostaje Garncarstwo. Powinna być możliwość wyboru z drzewka, nie tylko z listy."

Podpunkty:
1. (GRAFIKA — designer) Infografiki przy badaniach (panel Badania) do zaktualizowania — dziś emoji; całe drzewko przestarzałe. [pokrywa się z backlogiem „wygląd wszystkich odkryć/technologii" — wymaga materiału designera]
2. (BUG/FUNKCJA) Nie da się wybrać technologii z DRZEWKA — klik węzła (np. „Obróbka drewna") NIE ustawia celu, tylko zamyka drzewko i zostaje poprzedni wybór (Garncarstwo). Wybór działa tylko z LISTY. → umożliwić wybór celu bezpośrednio z drzewka.
3. (UX) Przycisk „Pełne drzewko technologii" ma być na GÓRZE panelu Badania, nie na samym dole (dziś niewidoczny bez przewijania).

**Screenshoty (3) — brak plików (inline w czacie, uploady puste); opis:**
(a) panel Badania: aktywne „Garncarstwo" (Pula 0/10 PN, 0%, ETA <1 tury), sekcja „MOŻESZ WYBRAĆ (8)" (Garncarstwo/Łowiectwo/Łucznictwo/Mistycyzm/Murarstwo/Obróbka drewna/Oswojenie zwierząt/Rolnictwo), „WKRÓTCE (ZABLOKOWANE)" (Brązownictwo/Gospodarka wodna/Koło) — ikony emoji.
(b) dół listy: Koło/Wymiana + przycisk „📖 Pełne drzewko technologii" na samym dole; hint „Klik tech = ustaw cel. Drzewko pokazuje prereqy. Esc zamyka hub (najpierw drzewko)."
(c) pełne drzewko „EPOKA KAMIEŃ" (kolumny K0/K1), węzły jako zielone heks-karty, tooltip „Obróbka drewna" (koszt 12 PN; odblok. budynki Stolarnia/Mielerz; surowce deski/paliwo/drewno; mapa Tartak/Posterunek); część kart z adnotacją „★ B1-Q2A Maciej 2026-06-29".

---

## B5 [12:00] — Wskaźnik/feedback końca tury

STATUS: WDROŻONE (B5-A, 2026-07-07)

**Obszar:** UX/RENDER
**Priorytet:** przyszłość
**Objaw:** po kliknięciu „zakończ turę" jest TYLKO systemowe „kółeczko" (spinner przeglądarki) — nie wiadomo co się dzieje ani którzy gracze/AI teraz grają. Tak nie może wyglądać.
**Oczekiwane (propozycje Macieja):** czytelny element przejścia tury — np. pasek postępu przechodzący, informacja „teraz gra: <gracz/AI>", zmiana koloru przycisku (żółty→czerwony), delikatny mechanizm „coś się kręci" na polu/kwadracie, ewent. lekka animacja. Cel: gracz widzi, że tura się zmienia i kto wykonuje ruch.
**U kogo:** UX/RENDER.
**Data:** 2026-07-06.

## B6 [12:00] — Rozjazd wyników PAŃSTWO vs MIASTO na starcie gry

STATUS: OTWARTY

**Obszar:** EKONOMIA
**Priorytet:** wysoki
**Objaw:** przy starcie gry (jedno miasto ATENY) naliczyły się dziwne/niespójne wartości. Pasek PAŃSTWA pokazuje: Skarbiec 4 (+120), Praca 63 (+63), Nauka 1 (+23), Kultura 0 (0), Ludność 1 (0). Pasek MIASTA (ATENY, jedyne miasto) pokazuje inne: Praca +6 (+6), Skarbiec +4 (+3), Kultura 0, Religia 0, Nauka +1.
**Problem:** przy JEDNYM mieście wynik państwa powinien ≈ wynik miasta, a się rozjeżdża. Nieznane źródło liczb: skarbiec +120, praca +63, nauka +23 (miasto pokazuje odpowiednio +3, +6, +1). Skąd te wartości państwa — niewiadome.
**U kogo:** EKONOMIA (agregacja globalna vs per-miasto / splitOutput / pula).
**Data:** 2026-07-06.

---

## B7 [20:56] — Kolejka rekrutacji w złym miejscu (UI/UX)

STATUS: OTWARTY

**Obszar:** UI (panel PRODUKCJA / cityPanel)
**Objaw:** w panelu PRODUKCJA sekcja „KOLEJKA REKRUTACJI" jest na samym DOLE panelu (pod listą jednostek do rekrutacji), łatwo ją przeoczyć — Maciej myślał, że nic nie produkuje, dopóki nie zjechał na sam dół.
**Oczekiwane:** kolejka rekrutacji powinna być OBOK / przy „Kolejce budowy" (produkcji) u góry, nie na dole.
**U kogo:** UI/UX (panel produkcji, cityPanel).
**Build:** 6e3027fe (2026-07-06 20:56).

---

## B8 [21:15] — Przełącznik miasto→miasto (prev/next), brak (UI/UX, standard 4X)

STATUS: OTWARTY

**Obszar:** UI/UX (panel miasta / cityUxFrame)
**Objaw:** nie ma szybkiego przełącznika między miastami. Teraz, żeby przejść do innego miasta, trzeba wyjść na mapę i szukać kolejnego miasta ręcznie.
**Oczekiwane (standard w grach typu Cywilizacja):** strzałki/suwak „‹ poprzednie miasto / następne miasto ›" bez wychodzenia z widoku miasta — klik w lewo/prawo przeskakuje do poprzedniego/następnego miasta gracza.
**Umiejscowienie (sugestia Macieja):** dolny-lewy róg, na skraju któregoś z paneli.
**U kogo:** UI/UX (panel miasta / cityUxFrame).
**Build:** 6e3027fe (2026-07-06).

---

## B9 [14:30] — „Zebrana Praca" pokazuje ułamki / float garbage (UI + EKONOMIA)

STATUS: OTWARTY

**Obszar:** EKONOMIA/UI
**Objaw:** w panelu PRODUKCJA „Zebrana Praca" pokazuje `22.499999999999996 / 40` (błąd zmiennoprzecinkowy). Powinny być PEŁNE LICZBY bez przecinka.
**Fix:** zaokrąglać/formatować wyświetlaną (i najlepiej naliczaną) pracę do liczb całkowitych.
**U kogo:** EKONOMIA/UI.
**Data:** 2026-07-06.
**Build:** 6e3027fe.

---

## B10 [14:30] — Reguła NADPRODUKCJI pracy (mechanika do zaimplementowania, decyzja Macieja)

STATUS: OTWARTY, do zaimplementowania

**Obszar:** EKONOMIA (produkcja / pula pracy cywilizacji)
**Zasada:** nadmiar pracy ponad koszt ukończonego budynku NIE ma przepadać. Nadwyżka przechodzi na NASTĘPNY budynek w kolejce budowy.
**Jeśli kolejka pusta:** DECYZJA MACIEJA = opcja A (preferowana) — nadwyżka trafia do PULI PRACY CYWILIZACJI (praca do użycia w całej cywilizacji), a NIE jest tracona (opcja B = tracona, odrzucona).
**Implementacja:** gdy miasto nie ma wybranego budynku do produkcji (tryb „auto"/pusta kolejka), miasto przechodzi w tryb DOKŁADANIA PRACY do puli cywilizacji (globalny surowiec Praca w skarbcu).
**U kogo:** EKONOMIA (produkcja / pula pracy cywilizacji).
**Data:** 2026-07-06.
**Build:** 6e3027fe.

---

## B11 [21:XX] — Anulowanie jednostki z kolejki NIE zwraca pieniędzy (EKONOMIA / rekrutacja)

STATUS: OTWARTY

**Obszar:** EKONOMIA (kolejka rekrutacji / refund przy anulowaniu)
**Objaw:** Maciej kupił Wojownika, potem dodał Zwiadowcę do kolejki rekrutacji, następnie anulował (odhaczył) Zwiadowcę — a pieniądze PRZEPADŁY, zamiast wrócić do puli/skarbca.
**Oczekiwane:** dopóki jednostka NIE została zbudowana (jest tylko w kolejce, „Opłacone"), anulowanie/odhaczenie powinno ZWRÓCIĆ pieniądze do puli. Przy jednostkach to nie to samo co przy budynkach — koszt jednostki idzie ze skarbca (Pieniądz), więc anulowanie przed ukończeniem = refund.
**U kogo:** EKONOMIA (kolejka rekrutacji / refund przy anulowaniu).
**Data:** 2026-07-06.
**Build:** 6e3027fe.

---

## FEATURE 2026-07-07 — Klaster na krawędzi + AI faza 1 (nie bug)

Wdrożono (Maciej): jeden klaster państw per cywilizacja (~3 hex), founding na obwodzie
z +1 slotem wzrostu; stolice obcych typów (ekspansyjna AI) najpierw przejmują własne
państwa w klastrze, potem ekspandują. Szczegóły: `docs/decyzje/CLUSTER-KRAWEDZ-AI-FAZA1-2026-07-07.md`.

---

## B12 [16:30] — Państwa-miasta startowały w Brązie zamiast Kamienia

STATUS: WDROŻONE (2026-07-07)

**Obszar:** SILNIK / render miast / epoka AI
**Objaw:** przy starcie w Epokę Kamienia niektóre państwa-miasta pokazywały model/widok Brązu.
**Przyczyna:** stary render `getEra → 2` dla AI oraz liczenie epoki z etykiety `Epoka` w tech (np. Żegluga=Brąz) bez uwzględnienia epoki startowej gry.
**Fix:** `owner-epoch.ts` (`computeOwnerEraFromResearch` + tylko `isEraAdvanceTech`), `initOwnerEra`/`setupAiOwnerEpoch` per owner z `player.era`, render `_cityRenderOpts.getEra → empireEpochForOwner`. Test: `gra/tools/owner-epoch-test.cjs`.

---

## B13 [22:45] — FATAL boot: `Cannot access 'Mt' before initialization` (TDZ / circular import)

STATUS: NAPRAWIONY (2026-07-07)

**Obszar:** SILNIK / bundel Vite / nazwy miast (B-city-names-pools)
**Objaw:** `gra-robocza/Gra-ROBOCZA.html` — overlay `[TheGame] FATAL: ReferenceError: Cannot access 'Mt' before initialization` (minified `Mt` = TDZ przy ładowaniu modułu).
**Przyczyna:** cykl importów wartości `game/civ-names.ts` ↔ `game/city-names-pool.ts` — pool importował `NAZWY_KLASTRA_LEN` / `nazwaKlastraAt` z civ-names, który z kolei importował funkcje z pool przy starcie bundla.
**Fix:** przeniesiono `NAZWY_KLASTRA_LEN` + `nazwaKlastraAt` do leaf `city-names-pool.ts`; `civ-names.ts` tylko re-eksportuje. Testy: `civ-names-test.cjs` 5/5 · `city-names-pool-test.cjs` 10/10 · `smoke.cjs` OK.
**Publish robocza md5:** `8c764e4b68be3b5dbe4fe70aa731438a`

---
