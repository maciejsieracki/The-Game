# Grupa E — paczka pytań ABC (blokery)

> **Format:** odpowiedź `1=A 2=B 3=A …` (jedna litera na pytanie)  
> **Reguła:** decyzje gameplay **tylko ABC** · max sensownie 4–5 pytań na wiadomość (możesz odpowiadać partiami)  
> **Status:** ✅ **PACZKA 1–12 ZAMKNIĘTA** (2026-06-27) · Maciej

Mapowanie starych ID: Q9=1, Q10=2, Q11=3, Q12=4, Q6=5, Q7=6, Q8=7, E3a=8, E3b=9, E2a=10, E2b=11, mockup=12

---

## Pytanie 1 — Reset gracza przy „Nowa gra"

**[EKRAN: Menu]**

Po starcie nowej gry — co robimy ze skarbcem, nauką i zbadanymi technologiami?

| | |
|---|---|
| **A** | **Pełny reset** — skarbiec 0, nauka 0, pusta lista tech *(kod dziś)* |
| **B** | **Bez resetu** — zostaje stan z poprzedniej sesji w tej samej przeglądarce |
| **C** | **Częściowy** — zeruj skarbiec i naukę, **zostaw** już zbadane tech |

**Blokuje:** batch korekty SILNIK `doStartGame` · kanon bez interpretacji agenta

### ✅ Decyzja Macieja (2026-06-27): **A**

**Uzasadnienie:** „Nowa gra" = **pełny reset** (PN reset). Kontynuacja poprzedniej sesji wyłącznie przez **Kontynuuj** lub **Wczytaj** w menu — to logiczny podział ścieżek.

**Kod:** zgodny z A (`doStartGame` zeruje skarbiec, naukę, tech) — **bez zmiany** po tej decyzji.

---

## Pytanie 2 — Start w epoce Brąz

**[EKRAN: Menu]**

Gracz wybiera **Epoka Brąz** w kreatorze — co dostaje na starcie?

| | |
|---|---|
| **A** | Tylko **Epoka 2** na HUD — **bez** odblokowanych tech i budynków *(kod dziś)* |
| **B** | Epoka 2 + **automatycznie wszystkie tech epoki Kamień** (jakby zbadane) |
| **C** | Epoka 2 + **krótki preset** (np. Podstawowe narzędzia + Osadnictwo — lista doprecyzowana po C) |

**Blokuje:** `player.era` + `player.zbadane` przy starcie Brąz

### ✅ Decyzja Macieja (2026-06-27): **B*** (reguła kaskadowa — rozszerzenie B)

**Reguła ogólna:** gracz startuje **w wybranej epoce od początku** (bada tech **tej** epoki od zera), ale **wszystkie technologie epok wcześniejszych** są już zbadane.

| Start w kreatorze | Co jest od razu w `player.zbadane` |
|-------------------|-------------------------------------|
| **Kamień** | nic (pusta lista — badasz Kamień od zera) |
| **Brąz** | **cały Kamień** |
| **Żelazo** *(gdy odblokowane w menu)* | **cały Kamień + cały Brąz** |

**Jednostki i budynki:** gracz **nie dostaje** starter-packa jednostek/budynków — odblokowują się **przez gotowe tech** poprzednich epok (produkcja wg istniejących reguł `production.ts`).

**Zakres v1.0:** tylko epoki dostępne w kreatorze (dziś Kamień + Brąz; Żelazo „wkrótce"). **Bez** startu od dowolnych późniejszych etapów — gracz ma przejść ścieżkę epok w grze.

**Kod dziś:** **NIE zgodny** — tylko `player.era`, pusta lista tech. **SILNIK:** batch po ABC 2–4 → `grantTechEpokWczesniejszych(epochId)` w `doStartGame`.

---

## Pytanie 3 — Kształt mapy „Ziemia"

**[EKRAN: Menu]**

Typ świata **Ziemia** — układ lądów na mapie:

| | |
|---|---|
| **A** | **Stały preset** — Ameryki / Eurazja-Afryka / Australia (`ZIEMIA_LAND_CENTERS`, kod dziś) |
| **B** | **Miękki preset** — ten sam układ + więcej losowego szumu brzegów (naturalniejsze wybrzeża) |
| **C** | **Jak Kontynenty** — etykieta „Ziemia", ale generacja proceduralna jak „Kontynenty" |

**Blokuje:** lane MAPA — finalizacja `landMaskZiemia`

### ✅ Decyzja Macieja (2026-06-27): **A**

Stały preset `ZIEMIA_LAND_CENTERS` — **bez zmiany** w MAPA.

---

## Pytanie 4 — Liczba rywali w kreatorze

**[EKRAN: Menu]**

Przy zmianie rozmiaru mapy — jak pokazujemy liczbę rywali?

| | |
|---|---|
| **A** | **Wąski wybór** — około zalecanej ±1 *(kod dziś, Standard → 5–7)* |
| **B** | **Szeroki** — od 1 do max dla tej mapy (typy aktywne − 1) |
| **C** | **Bez wyboru** — tylko jedna zalecana liczba, bez przełączania strzałkami |

**Blokuje:** `newGameMapDefaults.ts` + `ui-params.json` opis rywali

### ✅ Decyzja Macieja (2026-06-27): **A**

Wąski wybór ±1 od zalecanej (`rywaleMenuForMapLabel`) — **UI jak dziś**.

**Uwaga Macieja (cross-lane):** pełny model **9 typów cywilizacji** z rosteru (`civs.json`) musi **skalować się do mapy** (mała mapa ≠ 9 nacji). Heurystyka w `newGameMapDefaults.ts` (`aktywneTypy` 3/5/7/9) — **weryfikacja i domknięcie w Grupie D** → `handoff/E1-do-GRUPA-D_cywilizacje-startowe.md`.

| Rozmiar mapy | Aktywne typy (kod dziś) | Domyślni rywale AI |
|--------------|-------------------------|---------------------|
| Mała | 3 (gracz + 2 AI) | 2 |
| Średnia | 5 | 4 |
| Duża / Standard | 7 | 6 |
| Ogromna | 9 (gracz + max 8 AI z rosteru) | 8 |

**SILNIK:** batch E1 1–4 — bez zmiany logiki ±1; **CZEKA Grupa D** na przypisanie typów AI i spójność z klastrami MAPA.

---

## Pytanie 5 — Przyciski menu głównego (S0)

**[EKRAN: Menu]**

Ekran startowy przed kreatorem — jakie przyciski na v1.0?

| | |
|---|---|
| **A** | **Wizja E1:** Rozpocznij grę · Kampania · Multiplayer · Ustawienia (+ hero wideo/obraz) |
| **B** | **Klasyczne Civ:** Nowa Gra · Kontynuuj · Wczytaj · Ustawienia · O grze · Wyjdź *(kod dziś)* |
| **C** | **Hybryda:** Rozpocznij grę (= Nowa gra) · Kampania · Ustawienia · reszta w podmenu „Więcej" |

**Blokuje:** `mainMenu.ts` + mockup `Gra-podglad-MENU.html`

### ✅ Decyzja Macieja (2026-06-27): **C** (hybryda pełna — E1 + elementy B)

**Uzasadnienie:** połączyć wizję E1 z klasycznymi ścieżkami Civ (Kontynuuj/Wczytaj itd.) — **wszystkie** elementy z A i B, układ hybrydowy C.

#### Ekran główny (hero + przyciski pierwszoplanowe)

| Przycisk | Źródło | Akcja |
|----------|--------|-------|
| **Rozpocznij grę** (primary) | E1 (= B „Nowa Gra") | → kreator nowej gry |
| **Kampania** | E1 | v1.0: **6=A** — widoczna, szara, „Wkrótce" |
| **Multiplayer** | E1 | v1.0: **6=A** — widoczny, szary, „Wkrótce" |
| **Ustawienia** | E1 + B | → ekran ustawień (jak dziś) |
| Tło **hero** | E1 | **7=A** — wideo w pętli (wyciszone) |

#### Podmenu **„Więcej"** (elementy z B — nie na głównym ekranie)

| Przycisk | Akcja |
|----------|-------|
| **Kontynuuj** | wczytaj ostatni autosave (aktywne gdy jest zapis) |
| **Wczytaj grę** | wybór slotu zapisu |
| **O grze** | info / autorzy |
| **Wyjdź** | zamknięcie okna / wyjście |

**Kod dziś:** układ **B** (wszystko płasko) — **TODO** lane UI: refaktor `mainMenu.ts` + sync `UI/Gra-podglad-MENU.html`.

---

## Pytanie 6 — Kampania i Multiplayer na v1.0

**[EKRAN: Menu]**

Przyciski Kampania / Multiplayer — zachowanie gdy jeszcze nie zaimplementowane:

| | |
|---|---|
| **A** | **Widoczne, szare** + napis „Wkrótce" po kliknięciu nic nie startuje |
| **B** | **Ukryte** całkowicie do v1.1 |
| **C** | Kampania **szara** (Wkrótce); Multiplayer **ukryty** |

**Blokuje:** implementacja menu S0 (po pytaniu 5)

### ✅ Decyzja Macieja (2026-06-27): **A**

**Kampania** i **Multiplayer** na głównym ekranie (5=C): **widoczne, wyszarzone**; klik → komunikat **„Wkrótce"**, nic nie startuje.

---

## Pytanie 7 — Tło menu głównego

**[EKRAN: Menu]**

Tło ekranu startowego (pod przyciskami):

| | |
|---|---|
| **A** | **Wideo** w tle (pętla, wyciszane; „Cywilizacja · The Game") |
| **B** | **Statyczny obraz** + animowany emblemat *(jak dziś SVG w kodzie)* |
| **C** | **Minimal** — gradient/ciemne tło, bez wideo i bez dużego obrazu |

**Blokuje:** assets + `mainMenu.ts` styl

### ✅ Decyzja Macieja (2026-06-27): **A**

**Wideo** w tle menu (pętla, wyciszone); tytuł / branding „Cywilizacja · The Game" (lub równoważny). Wymaga pliku assetu wideo + fallback przy braku pliku (Master/UI ustali technicznie).

---

## Pytanie 8 — Złoża żelaza na mapie (D14)

**[EKRAN: Mapa świata]**

Decyzja **D14=A** — dane `resources.json` OK, ale generator **nie kładzie złoża `zelazo`**. Kiedy żelazo pojawia się na mapie?

| | |
|---|---|
| **A** | Od **epoki Brąz** — złoża widoczne na mapie, wydobycie wg reguł epoki |
| **B** | Od **epoki Żelazo** — dopiero wtedy spawn złoża |
| **C** | **v1.0 bez złoża żelaza** na mapie — tylko łańcuch w danych na później |

**Blokuje:** lane MAPA `DEPOSIT_RULES` + EKONOMIA epoka + E3

### ✅ Decyzja Macieja (2026-06-27): **B*** (reguła rozszerzona — nie sama litera B)

Maciej doprecyzował **miedź + żelazo + teren**. Oryginalne pyt. 8 dotyczyło żelaza; odpowiedź obejmuje **oba** metale.

#### Kiedy złoża **pojawiają się** na mapie (granica epok)

| Złoże | Pojawia się gdy… | Na mapie w Kamieniu / wcześniej |
|-------|------------------|----------------------------------|
| **Ruda miedzi** (brąz) | **Kończy się epoka Kamienia** → start **Brązu** | **NIE** |
| **Ruda żelaza** | **Kończy się epoka Brązu** → start **Żelaza** | **NIE** (nie w Brązie) |

*Implementacja:* reveal/spawn przy **awansie epoki**. **Pyt. 9=B** — przed epoką złoża **niewidoczne** (spójne z 8).

#### Gdzie na mapie (teren)

| Reguła | Wartość |
|--------|---------|
| Rudy (miedź, żelazo) | **Tylko `Góry`** (`TerenBazowy.Gory`) |
| **Nie** na wzgórzach | `Wzgorza` — **wykluczone** |
| Inne tereny | **wykluczone** |

**Kod dziś:** `id: 'ruda'` na **Wzgorza + Góry** od startu mapy — **NIE zgodny**. Brak osobnych `miedz` / `zelazo` w `DEPOSIT_RULES`.

**Handoff:** `dyspozycje/_handoff/GRUPA-E-do-MAPA_zloza-epoki-8B-star.md` · EKONOMIA: dostęp do wydobycia per epoka.

---

## Pytanie 9 — Surowce niedostępne w danej epoce

**[EKRAN: Logika]**

Gracz w Kamieniu widzi na mapie złoże, którego **nie może jeszcze wydobywać**:

| | |
|---|---|
| **A** | **Widzi** złoże + ikona/komunikat „wymaga epoki X" |
| **B** | **Nie widzi** — złoża ukryte do odblokowania epoki |
| **C** | **Widzi**, ale **bez wydobycia** — szary heks, bez komunikatu (minimal) |

**Blokuje:** E3 reguły + fog/overlay MAPA

### ✅ Decyzja Macieja (2026-06-27): **B**

Złoża niedostępne w danej epoce **nie widać** na mapie — pojawiają się dopiero w swojej epoce (spójne z **8=B***: miedź/żelazo przy granicy epok). **Bez** szarego heksu i bez komunikatu przed czasem.

---

## Pytanie 10 — Warunki zwycięstwa v1.0 (E2)

**[EKRAN: Logika]**

Które cele końca gry są **aktywne** w pierwszej grywalnej wersji?

| | |
|---|---|
| **A** | **Dominacja + nauka** *(kod dziś w `victory.ts`)* |
| **B** | **Tylko dominacja** (zdobycie X% mapy / stolic) |
| **C** | **Tylko nauka** (ostatnia tech w drzewie) |

**Blokuje:** E2 produkt + ekran końca gry + `victory.ts`

### ✅ Decyzja Macieja (2026-06-27): **A*** (oba cele aktywne — z doprecyzowaniem produktowym)

**W v1.0 aktywne są oba cele** (dominacja **oraz** nauka). Poniżej **kanon Macieja** — **nie** to samo co kod dziś.

#### Co oznaczało **„dominacja"** w pytaniu ABC?

W paczce litera **A** = „dominacja + nauka jak w kodzie". **Kod dziś** (`victory.ts`): eliminacja **wszystkich rywali tego samego typu cywilizacji** co gracz (zero miast u rywali tego typu) — **to NIE jest** decyzja Macieja.

#### Dominacja — **kanon Macieja (10=A*)**

| Element | Reguła |
|---------|--------|
| Warunek | **Power gracza > 50%** łącznego Power w grze |
| Kiedy | Tylko w **ostatniej epoce** (finalnej) |
| Podbój | **Nie trzeba** zdobywać / eliminować wszystkich cywilizacji |

#### Nauka — **kanon Macieja (10=A*)**

| Element | Reguła |
|---------|--------|
| Warunek | **Wszystkie badania** odkryte **oraz** wystrzelenie **rakiety z robotami** na **najbliższą planetę** |
| Epoka | Ostatnia / kosmiczna (jak w GDD par. 8d.2 — do doprecyzowania tech/build) |

**Kod dziś:** dominacja = eliminacja typu; nauka = flagi `epokaKoncowa` + `naukaUkonczona` (często **niepodpięte** w silniku) — **TODO** CYWILIZACJE + SILNIK.

#### Dodatek Macieja (poza ABC 10 — backlog E2+)

**Rankingi cywilizacji** (Power, nauka, inne metryki): pokazują Twój stan; **nieodkryte** nacje **liczą się** w rankingu, ale **bez ujawnienia tożsamości** (widać miejsca/sloty, nie „kto jest 1."). Handoff: `docs/grupa-e/handoff/E2-rankingi-cywilizacji.md`.

---

## Pytanie 11 — Barbarzyńcy na starcie (E2)

**[EKRAN: Logika]**

Barbarzyńcy / neutralne frakcje na początku gry:

| | |
|---|---|
| **A** | **Są** — obozy na mapie od tury 1 (jak dziś w silniku) |
| **B** | **Nie ma** barbarzyńców na v1.0 — tylko cywilizacje z kreatora |
| **C** | **Opcjonalnie w menu** — gracz włącza/wyłącza przed startem |

**Blokuje:** spawn neutralny + przejście epok + `barbarians.ts` / buntownicy

### ✅ Decyzja Macieja (2026-06-27): **C*** (litera C w wiadomości; **kanon ≠ checkbox menu**)

Maciej opisał **regułę epok**, nie opcję „włącz/wyłącz w kreatorze". Kanon:

| Faza gry | Co na mapie |
|----------|-------------|
| **Od startu do końca epoki przed Średniowieczem** | **Barbarzyńcy** — obozy/jednostki (jak dziś `barbarians.ts`) |
| **Od epoki Średniowiecze** | **Koniec barbarzyńców** → zamiast nich **buntownicy** — mogą **pojawiać się** na mapie (spawn z mechaniki niezadowolenia/buntu — powiązanie `society-breakdown.ts` / `order.ts`) |

**v1.0 w kreatorze:** epoki Kamień–Żelazo — barbarzyńcy **aktywni** (do wdrożenia Średniowiecza w drzewku epok).  
**Kod dziś:** barbarzyńcy od tury 1 bez cutoff epoki; buntownicy mapowi częściowo w `cities.ts` — **TODO** CYWILIZACJE + SILNIK.

Handoff: `dyspozycje/_handoff/GRUPA-E-do-CYWILIZACJE_barbarzyncy-buntownicy-11C-star.md`

---

## Pytanie 12 — Mockup kreatora vs gra (spójność)

**[EKRAN: Menu]**

Plik `UI/Makieta-flow-nowa-gra.html` jest **nieaktualny** (brak Ziemia, stara mapa, 7 cyw). Co robimy?

| | |
|---|---|
| **A** | **Sync mockupu** do E1 (priorytet przed kolejnymi zmianami kodu) |
| **B** | **Odstaw mockup** — source of truth = gra + `docs/grupa-e/` |
| **C** | **Sync później** — najpierw ABC 1–4 i SILNIK, mockup na końcu |

**Blokuje:** Twoja wizualna akceptacja kreatora przed kanonem

### ✅ Decyzja Macieja (2026-06-27): **A**

**Sync mockupów teraz** do stanu E1 + decyzji **5=C**, **6=A**, **7=A**:
- `UI/Makieta-flow-nowa-gra.html` — Ziemia, 9 cyw, Standardowy, skala rywali, epoki…
- `UI/Gra-podglad-MENU.html` — hybryda menu, Kampania/Multi „Wkrótce", placeholder wideo

Handoff UI: `dyspozycje/_handoff/GRUPA-E-do-UI_sync-mockupy-12A.md`

---

## Kolejność odpowiadania (rekomendacja)

| Partia | Pytania | Dlaczego |
|--------|---------|----------|
| Teraz | **1–4** | ✅ **ZAMKNIĘTE** — batch SILNIK + audyt Grupa D (cyw startowe) |
| **Potem** | **5–10** | ✅ **ZAMKNIĘTE** |
| **Teraz** | **11–12** | ✅ **ZAMKNIĘTE** |

**→ Następny krok Master:** implementacja handoffów (SILNIK batch E1, UI menu/mockup, MAPA złoża, CYW zwycięstwo/barbarzyńcy, Grupa D cyw startowe).

---

## → Po odpowiedzi

1. Zapis w `E1-nowa-gra.md` / E2 / E3  
2. Master → batch F (SILNIK)  
3. Aktualizacja `Status-projektu-The-Game.xlsx` arkusz `Grupa-E`

**Nie wymaga ABC (Master robi sam):** bramka TEST, Opus, archiwum plików D13 — patrz `USUNAC-KANDYDACI.md`
