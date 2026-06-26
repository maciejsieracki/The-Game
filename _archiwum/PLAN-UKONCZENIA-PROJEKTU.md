# PLAN UKOŃCZENIA PROJEKTU — „The Game" (4X / Civ-like)
> Wygenerowano: 2026-06-21. Jedyne źródło prawdy o lukach i kolejności prac.
> Podstawa: PROJEKT-GRY-master.md, Schemat-dzialania-miasta.md, Spec-generator-mapy.md, Dyplomacja-szablon.md, PLAN-PRODUKCJI.md, Macierz-walki-analiza.md + 7 plików Excel + 5 makiet front-end.

---

## SPIS TREŚCI

- [I. STAN OBECNY — co już mamy](#i-stan-obecny--co-już-mamy)
- [II. ARCHITEKTURA I DECYZJE TECHNICZNE](#ii-architektura-i-decyzje-techniczne)
- [III. FRONTEND — czego brakuje](#iii-frontend--czego-brakuje)
- [IV. BACKEND / SILNIK — czego brakuje](#iv-backend--silnik--czego-brakuje)
- [V. INTEGRACJA — jak połączyć w całość](#v-integracja--jak-połączyć-w-całość)
- [VI. LUKI PROJEKTOWE DO DOMKNIĘCIA](#vi-luki-projektowe-do-domknięcia)
- [VII. KAMIENIE MILOWE](#vii-kamienie-milowe)

---

## I. STAN OBECNY — co już mamy

### I.1 Dokumenty projektowe (design docs)

| Plik | Zawartość | Status |
|------|-----------|--------|
| `PROJEKT-GRY-master.md` | Jedyne źródło prawdy: ekonomia (Praca→×10→×100→×1000), ludność, zdrowie, walka §5e–§5l (kanon TW), budynki, jednostki, cywilizacje, magazyny, 10 epok, plan v0.1–v0.2 | ✓ gotowe, żywy dokument |
| `Schemat-dzialania-miasta.md` | Pełna specyfikacja ekranu miasta: 9 sekcji (układ, ekonomia, budowa, ludność, zdrowie, kultura/religia, magazyny, jednostki, diagram zależności) | ✓ gotowe, do akceptacji |
| `Spec-generator-mapy.md` | Specyfikacja generatora mapy: 50 cyw., 5 typów głównych (→aktualizacja do 7 typoów w toku), Voronoi, klastry, mgła, pseudokod, parametry konfigurowalne | ✓ gotowe (wymaga drobnej korekty: 5→7 typów głównych) |
| `Dyplomacja-szablon.md` | 12 akcji dyplomatycznych, tabela dostępności (główni vs poboczni), parametry Zaufanie/Respekt, modyfikatory, charakterystyki 5 typów, logika AI pobocznych | ✓ gotowe (wersja robocza) |
| `PLAN-PRODUKCJI.md` | Lista luk i kamieni milowych (stan 2026-06-20, częściowo nieaktualny względem najnowszego mastera) | ✓ gotowe (ten dokument go zastępuje) |
| `Macierz-walki-analiza.md` | Analiza balansu 0–100, macierz 1v1 (11×11), rankingi, flagi OP/SŁABE, propozycje korekt | ✓ gotowe |
| `ZASADY-WSPOLPRACY.md` | Zasady współpracy z Claude | ✓ gotowe |

### I.2 Dane Excel

| Plik | Zawartość | Status |
|------|-----------|--------|
| `Jednostki.xlsx` | Staty jednostek (Atak, Obrona, Uderzenie, Health, Morale, Ruch, Ilość pocisków, Zasięg, Pancerz, Przebicie), epoki Kamień+Brąz, arkusz Countery, zamienniki cywilizacyjne | ✓ gotowe (epoki Żelazo+ brakuje) |
| `Budynki.xlsx` | Katalog budynków z Zużyciem/turę i Produkcją/turę, koszty materiałowe per epoka (Kamień+Brąz), kolumna odblokowania tech | ✓ gotowe (epoki Żelazo+ brakuje) |
| `Surowce.xlsx` | Katalog surowców surowych i przetworzonych, łańcuchy produkcji (drewno→deski, ruda+paliwo→brąz), surowce hodowlane (bydło, owce, lama) | ✓ gotowe |
| `Technologie-drzewko.xlsx` | Drzewko tech Kamień+Brąz: prereqs, koszty Nauki, wymagane budynki, epoki | ✓ gotowe (epoki Żelazo+ brakuje) |
| `Cywilizacje.xlsx` | Definicje cywilizacji (w toku), arkusz „Start gry" (50 cyw. na mapie) | ⬜ częściowo — Egipt i Sumerowie nieukończone; 5 głównych cyw. wstępnie zdefiniowane |
| `Dyplomacja.xlsx` | Dane dyplomacji (parametry, modyfikatory relacji) | ⬜ zawartość nieznana — wymaga weryfikacji kompletności względem Dyplomacja-szablon.md |
| `Macierz-walki.xlsx` | Macierz walki, arkusz Countery | ✓ gotowe (dane z Macierz-walki-analiza.md) |
| `Plony-terenow.xlsx` | Plony wszystkich typów terenu (Żywność, Praca, Handel, Drewno, Kamień), nakładki (las, rzeka) | ✓ gotowe |

### I.3 Makiety front-end

| Plik | Co zawiera | Status |
|------|-----------|--------|
| `Scena-mapy-lowpoly.html` | Bundled page: renderer mapy 3D low-poly w Three.js — siatka heksów, oświetlenie, textury terenu | ✓ gotowe jako wizualna makieta (brak integracji z silnikiem) |
| `Katalog-assetow-lowpoly.html` | Bundled page: katalog assetów 3D low-poly (modele heksów terenów, drzew, gór, budynków) do użycia w Three.js | ✓ gotowe jako katalog wizualny (brak integracji) |
| `Widok-miasta.html` | Pełny ekran miasta: nagłówek (nawigacja, epoka, nastrój, kultura), lewa (mieszkańcy, specjaliści, zdrowie, budynki), środek (bilans plonów, suwak handlu, magazyn żywności, produkcja+kolejka), prawa (garnizon, magazyny surowców, kultura/religia), footer (nawigacja globalna), sekcja Okolica (siatka hex 10×10) | ✓ gotowe jako makieta HTML (brak logiki) |
| `Ekran-bitwy.html` | Taktyczna bitwa heksagonalna: plansza ~250 heksów, do 20 jednostek na stronę, HUD (panele dowódców, roster, Health/Morale, zasięg ruchu/ataku), przycisk ⚡ Auto-rozegraj (popup z wynikiem), log rund | ✓ gotowe jako makieta HTML (brak logiki walki) |
| `Podglad-armii.html` | Podgląd armii (Rzym): roster jednostek w armii, staty zbiorcze, HP/Morale per jednostka, komendy (Połącz, Obóz, Wyślij) | ✓ gotowe jako makieta HTML (brak logiki) |

### I.4 Modele i mechaniki (design + dane potwierdzone)

| Element | Status |
|---------|--------|
| **Ekonomia:** Praca→Pieniądz (×10 po Walucie)→Pieniądz fiducjarny (×100)→Energia (×1000) | ✓ zaprojektowane |
| **Ekonomia per turę:** Praca (lokalna) / Handel (suwak Nauka/Pieniądz/Luksus) / Pieniądz (centralny skarbiec w stolicy) | ✓ zaprojektowane |
| **Magazyny:** Spichlerz (żywność, ×5 pojemności) / Magazyn (surowce, ×5), nadwyżka przepada, podbój = przejęcie | ✓ zaprojektowane |
| **Ludność:** 1 lud. = 1 jedzenie/t; jednostka = −1 lud.; wzrost = baza + f(żywność, zdrowie) | ✓ zaprojektowane |
| **Zdrowie miasta:** czynniki + (akwedukt, rzeka, ceramika) i − (zagęszczenie, zanieczyszczenie) | ✓ zaprojektowane |
| **Walka — KANON §5l:** trafienie% = clamp(50+(Atak−Obrona)×5, 10, 90); obrażenia = max(1, Atak−Pancerz+Przebicie)+Uderzenie(R1); fazy: dystansowa→szarża→zwarcie | ✓ potwierdzony wzór |
| **Countery:** włócznia > konnica > dystans > włócznia; maczuga/topór +50% vs opancerzeni | ✓ potwierdzone |
| **Morale / dezercja:** próg = 25% × Health_startowe (edytowalny); elity niższy próg; Niezłomny walczy do śmierci | ✓ zaprojektowane |
| **Auto-rozgrywanie bitwy (§5h-auto):** AI prowadzi obie strony tym samym wzorem; podgląd log rund; popup z wynikiem | ✓ zaprojektowane |
| **Armie:** Połącz/merge (1 żeton na heks na nację), obóz=1 tura→pełne HP, amunicja zerowana po bitwie i auto-uzupełniana w kolejnej turze | ✓ zaprojektowane |
| **Model mapy:** dwuwarstwowy (teren bazowy + nakładki: las, złoża, rzeka) | ✓ zaprojektowany |
| **Generator mapy:** Voronoi, klastry (1 gracz + ~10 rywali tego samego typu), 50 cyw., mgła, Perlin noise, Poisson-disk | ✓ spec gotowa |
| **Dyplomacja:** 12 akcji, Zaufanie/Respekt, modyfikatory, 7 typów głównych pełna / ~43 poboczne uproszczone | ✓ zaprojektowane |
| **Cywilizacje (7 typów głównych):** Grecy, Rzym, Chiny, Inkowie, Zulusi, Egipt, Sumerowie; zamienniki jednostek, super-jednostka per cyw. | ✓ zaprojektowane (Egipt i Sumerowie niekompletne) |
| **Teren → walka:** wzgórza +Obrona, las +Obrona/−Ruch, rzeka −Ruch/−Atak, wysokość +Atak dystansowy | ✓ zaprojektowane |
| **Prototyp v0.1** (`civ-gra-v0.1.html`): Canvas heksy, tereny, osadnik, ekonomia v0.1 (model dostępu), podstawowy wzrost, prosta walka (1 rzut) | ✓ gotowy i przetestowany |

---

## II. ARCHITEKTURA I DECYZJE TECHNICZNE

### II.1 Podjęte decyzje (obowiązujące)

| Decyzja | Szczegół |
|---------|---------|
| **Stack technologiczny** | JavaScript / TypeScript; Three.js dla mapy 3D low-poly; HTML + CSS dla UI (panele, HUD, ekrany) |
| **Platforma** | Przeglądarka — single-player klient-only JAKO PRIORYTET; architektura gotowa pod późniejszy backend |
| **Tryb gry** | Single-player najpierw; multiplayer = osobny, późniejszy wątek |
| **Wzorzec architektury** | Deterministyczny **RDZEŃ SILNIKA** (game state + reguły, zero DOM) oddzielony od warstwy **RENDERU/UI** (Three.js + HTML/CSS) |
| **Deterministyczność** | To samo seed → identyczna mapa i przebieg; losowość tylko przez kontrolowany PRNG |
| **Model walki** | Heksowa turowa JAKO DOMYŚLNA + opcja Auto-rozegrania; RTS = odległy opcjonalny wariant |

### II.2 Wzorzec komunikacji silnik ↔ render

```
INPUT (klik, klawisz)
  → komenda do SILNIKA (np. moveUnit, buildBuilding, endTurn)
  → silnik aktualizuje STATE (deterministycznie)
  → silnik emituje zdarzenia (stateChanged, combatResult, techDiscovered…)
  → RENDER subskrybuje zdarzenia → odświeża Three.js i HTML/CSS
```

Silnik NIE wie o DOM, Three.js ani pikselach. Render NIE zawiera logiki gry.

### II.3 Decyzje do podjęcia (blokujące start implementacji)

| # | Decyzja | Opcje |
|---|---------|-------|
| D1 | **TypeScript vs. plain JS** — czy piszemy od zera w TS, czy kontynuujemy w JS i dodajemy typy stopniowo? | A) TS od zera (bezpieczniej); B) JS + JSDoc (szybciej) |
| D2 | **Moduły** — ES modules (import/export) vs. bundle (Vite/esbuild/webpack)? | A) Vite (dev server + HMR); B) esbuild; C) plain modules w przeglądarce |
| D3 | **Struktura plików silnika** — jeden plik engine.js vs. podział na moduły (map, economy, combat, diplomacy, ai, turn)? | Zalecane: osobne moduły |
| D4 | **Format zapisu stanu** — localStorage (JSON) vs. plik do pobrania? | A) localStorage (prosto); B) plik JSON do pobrania |
| D5 | **Warunki zwycięstwa** — które zaimplementować w v1.0? | A) Dominacja (podbij wszystkich tego samego typu); B) +Naukowe; C) Oba |

---

## III. FRONTEND — czego brakuje

### III.1 Renderer mapy 3D w Three.js

| Element | Status |
|---------|--------|
| Siatka heksów (offset / axial coords) renderowana w Three.js | ⬜ brakuje implementacji (makieta Scena-mapy-lowpoly.html istnieje jako preview) |
| Warstwy renderowania: (1) teren bazowy, (2) nakładka las/złoże, (3) ulepszenia terenu, (4) żeton armii/jednostki, (5) granice, (6) mgła wojny | ⬜ brakuje |
| Kamera (izometryczna / orbitalna), pan i zoom (scroll+drag) | ⬜ brakuje |
| Wybór heksa (raycast klik → highlight) | ⬜ brakuje |
| Podświetlanie zasięgu ruchu (highlight dostępnych heksów) | ⬜ brakuje |
| Podświetlanie zasięgu ataku (osobny kolor niż ruch) | ⬜ brakuje |
| Mgła wojny: 3 stany heksa — nieodkryty (czarny) / odkryty-niewidoczny (ciemny) / widoczny | ⬜ brakuje |
| Granice terytorium cywilizacji (linia lub kolorowy overlay) | ⬜ brakuje |
| Minimapa (overlay w rogu ekranu) | ⬜ brakuje |
| Warstwa rzek (osobna geometria na krawędziach heksów) | ⬜ brakuje |
| Animacje: ruch jednostki po mapie (płynne przesunięcie wzdłuż ścieżki) | ⬜ brakuje |

### III.2 Integracja assetów low-poly

| Element | Status |
|---------|--------|
| Załadowanie modeli 3D z `Katalog-assetow-lowpoly.html` do sceny Three.js | ⬜ brakuje |
| Podmiana placeholder kolorów w v0.1 na modele low-poly per typ terenu | ⬜ brakuje |
| Modele budynków/ulepszeń terenu (farma, kopalnia, pastwisko, mury…) na heksach | ⬜ brakuje |
| Żetony armii (ikona + liczba jednostek) na heksach | ⬜ brakuje |

### III.3 Ekrany z makiet → komponenty interaktywne

| Ekran | Makieta | Status |
|-------|---------|--------|
| **Mapa + HUD** (persistent pasek zasobów, numer tury, aktualnie badana tech, skarbiec) | brak makiety | ⬜ brakuje |
| **Widok Miasta** — pełny ekran wg `Widok-miasta.html` | ✓ makieta | ⬜ brakuje logiki |
| **Ekran Bitwy** — heksowa turowa wg `Ekran-bitwy.html` (250 heksów, 20 jed./strona, HUD bitwy, log rund) | ✓ makieta | ⬜ brakuje logiki walki |
| **Podgląd Armii** — roster, staty zbiorcze, komendy wg `Podglad-armii.html` | ✓ makieta | ⬜ brakuje logiki |
| **Dyplomacja** — okno relacji, 12 akcji, parametry Zaufanie/Respekt | brak makiety | ⬜ brakuje |
| **Nauka / Drzewko technologii** — graficzne drzewo, klik wyboru, postęp, opis bonusów | brak makiety | ⬜ brakuje |
| **Raporty** — dochód/wydatki per zasób, per miasto i globalnie (Bilans/turę) | brak makiety | ⬜ brakuje |
| **Nowa gra** — wybór cywilizacji (karty), rozmiar mapy, poziom trudności, seed | brak makiety | ⬜ brakuje |
| **Menu główne** — Nowa gra / Wczytaj / Ustawienia / Wyjdź | brak makiety | ⬜ brakuje |
| **Ekran zwycięstwa / przegranej** — podsumowanie statystyk | brak makiety | ⬜ brakuje |
| **Ekran wyboru cywilizacji** — karty z opisami, bonusami, jednostką specjalną | brak makiety | ⬜ brakuje |

### III.4 Interakcje gracza (logika UI)

| Interakcja | Status |
|------------|--------|
| Ruch jednostki: klik jednostka → highlight heksów → klik cel → komenda moveUnit do silnika | ⬜ brakuje |
| Kolejka produkcji: + Dodaj → lista → Przesuń / Usuń → Wstrzymaj / Wykup | ⬜ brakuje |
| Suwak Handel→Nauka/Pieniądz/Luksus (drag) → natychmiastowe przeliczenie bilansu | ⬜ brakuje |
| Merge armii: zaznacz kilka jednostek → Połącz → 1 żeton na heksie | ⬜ brakuje |
| Obóz / odpoczynek armii: komenda → stan obozowania 1 tura | ⬜ brakuje |
| Rekrutacja jednostki w mieście (Koszary / bez Koszar) | ⬜ brakuje |
| Przekształcenie wioski w miasto (popup przy kliku na wioskę w sekcji Okolica) | ⬜ brakuje |
| Wysłanie osadnika poza zasięg → zakładanie miasta | ⬜ brakuje |
| Dyplomacja: otwarcie okna → wybór akcji → negocjacja / akceptacja / odrzucenie | ⬜ brakuje |
| Wybór technologii do badania (klik w drzewku) | ⬜ brakuje |
| Budowa ulepszenia terenu przez Robotnika (klik hex → wybór ulepszenia) | ⬜ brakuje |
| Przypisanie specjalisty (Uczony / Poborca / Artysta) w mieście | ⬜ brakuje |
| Powiadomienia turowe (popup/ticker: wzrost miasta, odkrycie tech, koniec paktu…) | ⬜ brakuje |

### III.5 Wiązanie stan-gry ↔ UI (reaktywność)

| Element | Status |
|---------|--------|
| Reaktywna aktualizacja HUD po każdej turze (zasoby, nauka, tura) | ⬜ brakuje |
| Reaktywna aktualizacja paneli miasta po zmianie stanu | ⬜ brakuje |
| Reaktywna aktualizacja mapy po ruchu / budowie / walce | ⬜ brakuje |
| System zdarzeń (EventEmitter lub podobny) silnik → render | ⬜ brakuje |

### III.6 Dźwięk i animacje (niski priorytet)

| Element | Status |
|---------|--------|
| Muzyka tła i efekty dźwiękowe | ⬜ brakuje (zostawić na koniec) |
| Animacje bitwy (ciosy, dezercja, zdobycie miasta) | ⬜ brakuje (po M3) |
| Animacja przejścia tur (fade, zegar) | ⬜ brakuje |

---

## IV. BACKEND / SILNIK — czego brakuje

### IV.1 Schemat stanu gry runtime (GameState)

Centralny obiekt stanu — brakuje implementacji. Musi zawierać:

| Składnik stanu | Status |
|----------------|--------|
| **Mapa:** siatka heksów (typ terenu, nakładka, złoże, ulepszenie, widzialność, właściciel) | ⬜ brakuje (v0.1 ma uproszczony Canvas, nie nadaje się do Three.js) |
| **Gracze:** id, typ cywilizacji, skarbiec (Pieniądz), nauka (punkty/t, badana tech), relacje dyplomacji | ⬜ brakuje |
| **Miasta:** id, właściciel, lokalizacja, ludność, zdrowie, zadowolenie, kultura, religia, magazyny, kolejka produkcji, zasięg | ⬜ brakuje |
| **Jednostki / Armie:** id, właściciel, typ, lokalizacja, Health, Morale, amunicja, stan (idzie/obozuje), przynależność do armii | ⬜ brakuje |
| **Surowce per magazyn:** ilości per surowiec, pojemność | ⬜ brakuje |
| **Nauka:** zbadane tech, aktualnie badana, postęp (punkty), dostępne do odblokowania | ⬜ brakuje |
| **Dyplomacja:** per para graczy: Zaufanie, Respekt, Relacja ogólna, aktywne umowy (pakty, sojusze, handel), stan wojenny | ⬜ brakuje |
| **Tura:** numer tury, rok (kronika), faza (ruch gracza / AI / koniec) | ⬜ brakuje |

### IV.2 Pętla tury

| Faza | Status |
|------|--------|
| **Produkcja:** surowce z pól (per miasto, per zasięg) → magazyny; przetworzone (Tartak, Huta…) | ⬜ brakuje pełna implementacja ilościowa |
| **Ekonomia:** oblicz Pracę, Handel (→ Nauka + Pieniądz + Luksus per suwak), utrzymanie jednostek/budynków | ⬜ brakuje |
| **Wzrost miast:** nadwyżka żywności → magazyn żywności (Spichlerz); próg wzrostu → +1 ludność | ⬜ brakuje pełna implementacja |
| **Nauka:** dodaj punkty → sprawdź ukończenie technologii → odblokuj budynki/jednostki | ⬜ brakuje pełna implementacja |
| **Kultura:** dodaj punkty kultury → sprawdź progi zasięgu granic | ⬜ brakuje |
| **Dyplomacja pasywna:** modyfikatory Zaufania/Respektu co turę (handel, religia, bliskość granic, pakty) | ⬜ brakuje |
| **Ruch gracza:** jednostki → komenda move → walidacja ruchu → aktualizacja pozycji | ⬜ v0.1 szkielet, brak pełnej logiki |
| **Walka:** komendy ataku → silnik walki → wynik (kanon §5l) | ⬜ v0.1 uproszczony (1 rzut), pełna implementacja brakuje |
| **Faza AI:** ruch + produkcja + badania + dyplomacja wszystkich graczy AI | ⬜ brakuje |
| **Koniec tury:** czyszczenie flag, sprawdzenie warunków zwycięstwa, przejście do następnej tury | ⬜ brakuje |

### IV.3 Reguły i formuły deterministyczne

| Reguła | Status |
|--------|--------|
| **Ekonomia/turę:** Praca lokalna (suma pól + budynki), Handel (pola + Targowisko), Pieniądz ze suwaka i podatków | ⬜ brakuje implementacja |
| **Wzrost miast:** próg wzrostu (funkcja populacji), zachowanie 50% zapasów po wzroście (Spichlerz) | ⬜ brakuje |
| **Nauka:** koszty tech z arkusza, suma nauki z miast + specjaliści, auto-odblokowanie | ⬜ v0.1 szkielet |
| **Walka kanon §5l:** `trafienie% = clamp(50+(Atak−Obrona)×5, 10, 90)`; `obrażenia = max(1, Atak−Pancerz+Przebicie)+Uderzenie(R1)` | ⬜ brakuje (v0.1 ma stary wzór) |
| **Countery:** +50% obrażeń wg trójkąta i maczuga/topór vs opancerzeni | ⬜ brakuje |
| **Morale / dezercja:** Health < próg_% × Health_startowe → rout | ⬜ brakuje |
| **Teren → walka:** tabela modyfikatorów §5j (wzgórze, las, rzeka, wysokość) | ⬜ brakuje |
| **Flanka:** atak z boku/tyłu → −50% Obrony (dla podatnych jednostek) | ⬜ brakuje |
| **Magazyny:** pojemność per budynek, przepełnienie = strata, transfer między miastami | ⬜ brakuje |
| **Utrzymanie:** jednostki −1 Pieniądz/turę, budynki −1 Pieniądz/turę; armia obozująca −0,5 żywności/t na jedn. | ⬜ brakuje |
| **Kultura → granice:** progi punktów kultury → rozszerzenie zasięgu miasta o +1 pole | ⬜ brakuje |
| **Korupcja / marnotrawstwo:** rośnie z odległością od stolicy i wielkością państwa | ⬜ brakuje (współczynniki do ustalenia) |

### IV.4 Generator mapy (implementacja spec)

| Element | Status |
|---------|--------|
| Siatka heksagonalna (axial coords), skalowalna (Mała/Średnia/Duża/Ogromna) | ⬜ brakuje (v0.1 ma stały 16×12) |
| Perlin noise → typy terenu (teren bazowy: łąka, równina, wzgórza, góry, pustynie, wybrzeże, morze) | ⬜ brakuje |
| Generator biomów (kontynenty, oceany, wyspy, przesmyki) | ⬜ brakuje |
| Rzeki (od gór do morza, jako obiekty na krawędziach heksów) | ⬜ brakuje |
| Nakładki: las (Perlin), złoża per typ terenu (ruda→wzgórza/góry, glina→łąka/wybrzeże rzeki, konie→równiny, węgiel→góry) | ⬜ brakuje |
| Voronoi → 7 regionów typów głównych (+ podregiony dla pobocznych) | ⬜ brakuje |
| Klastry startowe: 1 gracz + ~10 rywali tego samego typu, Poisson-disk (min. dystans ≥5 hexów) | ⬜ brakuje |
| Wioski startowe (zamieszkiwalny hex → 1 wioska, 1 ludność) | ⬜ brakuje |
| Mgła wojny (trzy stany: nieodkryty / odkryty-niewidoczny / widoczny) | ⬜ brakuje |
| Balans startowy (każdy gracz startuje z porównywalnym dostępem do żywności i surowców) | ⬜ brakuje |
| Konfigurowalny seed (deterministyczność) | ⬜ brakuje (v0.1 ma mulberry32, ale ograniczony) |

### IV.5 AI przeciwnika

| Element | Status |
|---------|--------|
| **Ruch AI (prosty):** idź ku najbliższemu miastu wroga / wioskce; atakuj gdy w zasięgu | ⬜ brakuje |
| **Ekspansja AI:** zakładaj nowe miasta / przejmuj wioski w swoim regionie | ⬜ brakuje |
| **Produkcja AI:** decyduj co budować (priorytet: Spichlerz, Koszary, ekspansja) | ⬜ brakuje |
| **Nauka AI:** wybierz tech do badania (heurystyka: najpierw wymagane do ulubionej jednostki) | ⬜ brakuje |
| **Dyplomacja AI:** reaguj na propozycje gracza; inicjuj akcje wg charakterystyk archetypu (§4 dyplomacji) | ⬜ brakuje |
| **Poziomy trudności** | ⬜ brakuje |
| **AI cywilizacji pobocznych (uproszczone):** reaguj na Strach/Relację wg logiki §5.2 dyplomacji | ⬜ brakuje |

### IV.6 Silnik dyplomacji

| Element | Status |
|---------|--------|
| Parametry per para graczy: Zaufanie (0–100), Respekt/Strach (0–100), Relacja ogólna (= Z+R) | ⬜ brakuje |
| Modyfikatory co turę (religia, handel, bliskość, pakty, urazy historyczne) — tabela z Dyplomacja-szablon.md | ⬜ brakuje |
| 12 akcji dyplomatycznych — logika dostępności, efekty, koszty | ⬜ brakuje |
| Stan: aktywne pakty / sojusze / umowy handlowe / stan wojenny (per para) | ⬜ brakuje |
| Kary za złamanie paktu (globalna kara reputacyjna u wszystkich sąsiadów) | ⬜ brakuje |

### IV.7 Silnik walki heksowej (taktycznej)

| Element | Status |
|---------|--------|
| Wczytanie stanu bitwy: 2 armie → plansza ~250 heksów, do 20 jed./strona, rozmieszczenie | ⬜ brakuje |
| Kolejka inicjatywy (kto rusza pierwszy w rundzie) | ⬜ brakuje |
| Ruch jednostki na planszy bitewnej (zasięg ruchu, highlight heksów) | ⬜ brakuje |
| Atak melee (sąsiedni heks): wzór §5l (trafienie%, obrażenia, Uderzenie w R1) | ⬜ brakuje |
| Atak dystansowy (zasięg w heksach, zużycie 1 pocisku, Ilość pocisków) | ⬜ brakuje |
| Fazy bitwy: dystansowa → szarża (R1) → zwarcie (R2+) | ⬜ brakuje |
| Modyfikatory teren w bitwie (wzgórze, las, rzeka, wysokość §5j) | ⬜ brakuje |
| Countery (+50% obrażeń) i flanka (−50% Obrony) z detekcją geometryczną | ⬜ brakuje |
| Dezercja (Health < próg → rout → opuszczenie planszy) | ⬜ brakuje |
| Koniec bitwy: wyznaczenie zwycięzcy, straty, powrót ocalałych na mapę strategiczną | ⬜ brakuje |
| **Auto-rozegranie:** AI prowadzi obie strony tym samym wzorem; podgląd log rund; popup wynik | ⬜ brakuje |
| Walka oblężnicza (bonusy obrony Murów dla garnizonu; koszt czasu oblężenia) | ⬜ brakuje |
| Walka morska (Galera, osobne zasady) | ⬜ brakuje |

### IV.8 Warunki zwycięstwa

| Element | Status |
|---------|--------|
| **Dominacja własnego typu:** pokonaj wszystkich ~10 rywali tego samego typu (cel startowy) | ⬜ nie zdefiniowane liczbowo; do zdefiniowania |
| **Dominacja globalna:** podbij stolice wszystkich głównych rywali lub wyeliminuj wszystkich graczy | ⬜ nie zdefiniowane |
| **Naukowe:** osiągnij technologię X jako pierwszy (np. dobrnij do ostatniej epoki) | ⬜ nie zdefiniowane |
| **Kulturowe / Dyplomatyczne** (opcjonalne) | ⬜ nie zdefiniowane |
| Sprawdzanie warunków co turę, trigger ekranu zwycięstwa/przegranej | ⬜ brakuje |

### IV.9 Zapis / wczytanie

| Element | Status |
|---------|--------|
| Serializacja pełnego GameState do JSON | ⬜ brakuje |
| Zapis do localStorage | ⬜ brakuje |
| Wczytywanie zapisanego stanu | ⬜ brakuje |
| Autozapis co N tur (konfigurowalny) | ⬜ brakuje |
| Eksport zapisu jako plik JSON (opcjonalnie) | ⬜ brakuje |

### IV.10 Backend serwerowy (PÓŹNIEJSZY ETAP)

| Element | Status |
|---------|--------|
| Konta użytkowników, logowanie | ⬜ nie teraz |
| Zapisy w chmurze (sync między urządzeniami) | ⬜ nie teraz |
| Multiplayer: synchronizacja tur, weryfikacja ruchów po stronie serwera | ⬜ nie teraz |
| Sesje gry wieloosobowej (lobby, kolejność graczy, timeouty tur) | ⬜ nie teraz |

---

## V. INTEGRACJA — jak połączyć w całość

### V.1 Most danych: Excel → JSON → silnik

Pipeline, który musi powstać jako PIERWSZA rzecz (blokuje wszystko):

```
Jednostki.xlsx  →  units.json        (staty, countery, zasięgi, typy)
Budynki.xlsx    →  buildings.json    (koszty, efekty, odblokowania)
Surowce.xlsx    →  resources.json    (łańcuchy produkcji, hodowla)
Technologie-drzewko.xlsx → tech.json (prereqs, koszty, wymagane budynki)
Cywilizacje.xlsx → civs.json        (bonusy, zamienniki, super-jednostki)
Plony-terenow.xlsx → terrain.json   (plony bazy i nakładek)
Dyplomacja.xlsx → diplomacy.json    (modyfikatory relacji, parametry startowe)
```

Silnik ładuje JSON (nie czyta XLSX bezpośrednio). Zmiana w Excelu → re-export JSON → automatycznie działa w grze.

**Narzędzie eksportu:** skrypt Python (openpyxl) lub Node.js (xlsx) generujący JSON ze wszystkich plików.

### V.2 Przepływ główny (single-player)

```
START: Nowa gra
  → generuj_mape(config) → GameState
  → RENDER inicjalizuje Three.js scenę z mapy
  → RENDER rysuje UI (HUD, persistent bar)

PĘTLA:
  FAZA GRACZA:
    INPUT (klik/klawisz) → komenda
      → SILNIK.execute(komenda) → mutacja GameState
      → SILNIK.emit(zdarzenie)
      → RENDER.on(zdarzenie) → odśwież Three.js / HTML
    Gracz klika "Zakończ turę"

  FAZA TURY (silnik):
    produkcja → wzrost → ekonomia → nauka → kultura → dyplomacja-pasywna
    → SILNIK.emit("turnProcessed", diff)
    → RENDER.odśwież()

  FAZA AI:
    dla każdego gracza AI: ruch + atak + budowa + badania + dyplomacja
    → RENDER.animujRuchAI() (opcjonalnie)

  SPRAWDŹ WARUNKI ZWYCIĘSTWA
    → jeśli spełnione: RENDER.showVictoryScreen()

  numer_tury++ → FAZA GRACZA
```

### V.3 Przepływ bitwy

```
Dwie armie na tym samym / sąsiednim heksie → trigger bitwy
SILNIK tworzy BattleState (wytnij z GameState: 2 armie + typ terenu)
RENDER otwiera Ekran-bitwy:
  Tryb ręczny (domyślny):
    Gracz wydaje rozkazy jednostkom (ruch, atak, obrona)
    → SILNIK.battle.execute(rozkaz) → BattleState
    → RENDER.odśwież planszę bitewną
    Koniec rundy → SILNIK.battle.nextRound()
    Koniec bitwy (dezercja / śmierć / ucieczka) → wynik
  Tryb auto (⚡):
    SILNIK.battle.autoResolve() → AI obie strony → log rund → wynik
    RENDER pokazuje popup (log rund, Zwycięzca, straty)
SILNIK aplikuje wynik do GameState (straty, zdobycie miasta)
RENDER zamyka ekran bitwy → powrót do mapy strategicznej
```

---

## VI. LUKI PROJEKTOWE DO DOMKNIĘCIA

### VI.1 Niezdefiniowane / wymagające decyzji projektowych

| Luka | Szczegół | Priorytet |
|------|----------|-----------|
| **Warunki zwycięstwa** (konkretne kryteria, ekran) | Np. czy „pokonanie rywali własnego typu" = likwidacja wszystkich ich miast, czy tylko stolic? Czy gra trwa dalej po tym? | Wysoki — blokuje M7 |
| **Korekty balansu z Macierz-walki-analiza.md** | Legionista zbyt OP (0 porażek); zalecane: Korekta B (Włócznik +bonus vs ciężka piechota); Falanga vs Włócznik 150+ rund (skrócić do ~80); Łucznik bez roli bez mechaniki dystansu | Wysoki — blokuje M3 |
| **Korupcja/marnotrawstwo** — konkretne współczynniki (rośnie z odległością od stolicy, z wielkością państwa) | Brak liczb — do ustalenia | Średni |
| **Ustroje / rządy** (odblokowane kulturą państwa) — brak jakiejkolwiek specyfikacji | Osobny wątek, po M5 | Niski |
| **Cuda świata** (wzmianka w §5f, brak specyfikacji) | Brak | Niski |
| **Pełne drzewko technologii epok Żelazo–Robot** — 8 kolejnych epok | Dane w Excelu tylko Kamień+Brąz | Niski (po M6) |
| **Ekonomia v0.2: popyt/podaż** (cena surowca spada przy nadprodukcji) — brak implementacji, wyłącznie wzmianka | Osobny wątek, v0.2+ | Niski |

### VI.2 Super-jednostki — problem balansowy (wniosek z analizy)

Super-jednostki (maksymalnie 1 szt., bezpłatne, odradzają się) są z założenia elitą. Macierz-walki-analiza.md pokazuje, że już Legionista i Falanga dominują 100% pozostałych jednostek epoki. Super-jednostki będą silniejsze → **walka z nimi ma sens WYŁĄCZNIE w specjalnych warunkach (kontrery, flanka, liczebna przewaga, teren), NIE w otwartej macierzy 1v1**. Wymagane działanie: super-jednostki powinny mieć jasno zdefiniowane kontrery lub ograniczenia sytuacyjne; inaczej generują 100% dominacji bez kontry.

### VI.3 Jednostki dystansowe — słabość w zwarciu

Łucznik i procarz bez mechaniki zasięgu w zwarciu są bezużyteczni (score=9). Mechanika „fazy dystansowej przed zarciem" z §5l rozwiązuje to koncepcyjnie, ale implementacja musi pilnować: dystansowi powinni zawsze mieć „eskortę" z piechoty lub unikać starcia z melee. Jeśli zostaną zaatakowani bez eskorty → giną szybko (to celowe, historycznie poprawne). Proca ma najdłuższy zasięg (4 hexy) i counter vs Włócznik → wartościowa w specyficznych ustawieniach.

### VI.4 Cywilizacje Egipt i Sumerowie (niekompletne)

7 typów głównych (zaktualizowano 2026-06-21), ale Egipt i Sumerowie mają: jednostka specjalna = „do zaproponowania", opis = „do sprecyzowania". Wymagane uzupełnienie w `Cywilizacje.xlsx` i `Jednostki.xlsx` przed implementacją cywilizacji.

### VI.5 Przyszłe cywilizacje (późniejszy etap)

Hetyci (rydwany jako główna siła), Galowie / Germanie (las, rajd), Scytowie (step — bez stałych miast, nomadyczny styl gry). Te cywilizacje wymagają potencjalnie nowych mechanik (np. tryb nomadyczny), więc są oddzielnymi zadaniami projektowymi.

### VI.6 Dyplomacja — luki implementacyjne

- Super-jednostki a dyplomacja: jeśli cywilizacja traci stolicę (super-jednostka odradza się w nowej), co dzieje się z traktatami zawartymi ze stolicą?
- Granice kulturowe vs. granice dyplomatyczne: presja kulturowa na sąsiada nie ma jeszcze algorytmu (tylko opis słowny).
- AI pobocznych: logika §5.2 (prosta reguła if/else) jest zdefiniowana, ale wymaga implementacji i tuningu progów.

---

## VII. KAMIENIE MILOWE

Kolejność odzwierciedla zależności: każdy milestone jest niezależnie testowalny i dostarcza wartość grywalną.

---

### M0 — Pipeline danych + schemat stanu (cel: fundament)

**Wyjście:** skrypt eksportu Excel→JSON + pusta struktura GameState.

| Zadanie | Kto/Plik | Status |
|---------|----------|--------|
| Skrypt Python/Node.js: eksport Jednostki.xlsx → units.json | nowe | ⬜ |
| Eksport Budynki.xlsx → buildings.json | nowe | ⬜ |
| Eksport Surowce.xlsx → resources.json | nowe | ⬜ |
| Eksport Technologie-drzewko.xlsx → tech.json | nowe | ⬜ |
| Eksport Cywilizacje.xlsx → civs.json | nowe | ⬜ |
| Eksport Plony-terenow.xlsx → terrain.json | nowe | ⬜ |
| Eksport Dyplomacja.xlsx → diplomacy.json | nowe | ⬜ |
| Definicja TypeScript/JS: interfejsy GameState (Hex, Player, City, Unit, Army, Resource, Tech, DiplomacyState, Turn) | nowe | ⬜ |
| Decyzje architektoniczne D1–D5 (patrz §II.3) | projekt | ⬜ |
| Uzupełnienie Cywilizacje.xlsx: Egipt i Sumerowie | Cywilizacje.xlsx | ⬜ |
| Korekty balansu walki z Macierz-walki-analiza.md (Legionista, Falanga, Włócznik) | Jednostki.xlsx | ⬜ |

---

### M1 — Renderer mapy 3D + ruch jednostek (cel: coś widać i się rusza)

**Wyjście:** Three.js mapa z 1 cywilizacją, 1 jednostka się rusza, mgła wojny.

| Zadanie | Status |
|---------|--------|
| Three.js: siatka heksagonalna (axial coords, rozmiar konfigurowalny) | ⬜ |
| Generator mapy: Perlin noise → typy terenu, nakładki las/złoże | ⬜ |
| Załadowanie terrain.json → przypisanie modeli/kolorów z `Katalog-assetow-lowpoly.html` | ⬜ |
| Kamera izometryczna (pan + zoom) | ⬜ |
| Raycast: klik heks → zaznaczenie | ⬜ |
| Mgła wojny (3 stany heksa) | ⬜ |
| Jednostka gracza na mapie (żeton) + highlight zasięgu ruchu | ⬜ |
| Komenda moveUnit → animacja przesunięcia | ⬜ |
| HUD: pasek zasobów, numer tury, przycisk „Zakończ turę" | ⬜ |
| Persistent pasek zasobów globalnych u góry | ⬜ |

---

### M2 — Miasta: produkcja, wzrost, ekonomia (cel: core loop ekonomiczny)

**Wyjście:** 1 miasto działa kompletnie — buduje, rośnie, bilansuje zasoby.

| Zadanie | Status |
|---------|--------|
| GameState: City z magazynami, kolejką produkcji, zasięgiem (10×10 w Ep.1) | ⬜ |
| Pętla tury: produkcja z pól → magazyny (ilościowe, Spichlerz/Magazyn) | ⬜ |
| Kolejka produkcji: Praca/turę → postęp → gotowe; opcja Wykup (Pieniądz) | ⬜ |
| Wzrost ludności: magazyn żywności → próg → +1 lud.; Spichlerz zachowuje 50% | ⬜ |
| Zdrowie miasta: czynniki +/−, wpływ na wzrost | ⬜ |
| Handel: suwak Nauka/Pieniądz/Luksus; centralny skarbiec w stolicy | ⬜ |
| Utrzymanie jednostek/budynków w Pieniądzu/turę | ⬜ |
| Ekran Widok-miasta.html: pełna logika (integracja ze stanem gry) | ⬜ |
| Nauka: punkty/turę → ukończenie tech → odblokowanie budynków/jednostek | ⬜ |
| Drzewko technologii (UI) | ⬜ |
| Panel Bilans/turę (per zasób, per miasto i globalnie) | ⬜ |
| Powiadomienia turowe (wzrost miasta, odkrycie tech) | ⬜ |

---

### M3 — Walka (auto + taktyczna) (cel: bitwy działają)

**Wyjście:** pełny system walki z kanonem §5l, auto i ręczny, countery, teren.

| Zadanie | Status |
|---------|--------|
| BattleState: 2 armie na planszy ~250 heksów bitewnych | ⬜ |
| Implementacja kanonu §5l (trafienie%, obrażenia, Uderzenie R1) | ⬜ |
| Fazy bitwy: dystansowa → szarża → zwarcie (R2+) | ⬜ |
| Countery (+50% obrażeń) z units.json | ⬜ |
| Morale / dezercja (Health < próg → rout) | ⬜ |
| Modyfikatory terenu (wzgórze, las, rzeka, wysokość) | ⬜ |
| Flanka (geometria ataku z boku/tyłu → −50% Obrony per typ jednostki) | ⬜ |
| Atak dystansowy (zasięg w heksach, Ilość pocisków, faza dystansowa) | ⬜ |
| Auto-rozegranie: AI obie strony, log rund, popup wynik (⚡) | ⬜ |
| Ekran-bitwy.html: pełna logika (ruch, atak, HUD, log) | ⬜ |
| Podglad-armii.html: roster + komendy (Połącz, Obóz) | ⬜ |
| Wynik bitwy → powrót do GameState (straty, zdobycie miasta) | ⬜ |
| Walka oblężnicza (bonus Murów dla garnizonu) | ⬜ |

---

### M4 — AI + przeciwnicy tego samego typu (cel: pierwsza rywalizacja)

**Wyjście:** gracz gra przeciw ~10 AI tego samego typu; gra ma cel i koniec.

| Zadanie | Status |
|---------|--------|
| AI: ruch jednostek (idź do celu, atakuj przy zasięgu) | ⬜ |
| AI: ekspansja (przejmuj wioski, zakładaj miasta w regionie) | ⬜ |
| AI: produkcja (priorytety budowy wg fazy gry) | ⬜ |
| AI: nauka (wybór tech heurystyką) | ⬜ |
| Generator mapy: Voronoi + 7 typów głównych + klastry + cywilizacje poboczne | ⬜ |
| 7 cywilizacji grywalnych: bonusy, zamienniki, super-jednostki (z civs.json) | ⬜ |
| Warunki zwycięstwa zaimplementowane: dominacja własnego typu + sprawdzanie co turę | ⬜ |
| Ekran zwycięstwa / przegranej z podsumowaniem | ⬜ |
| Ekran Nowa gra: wybór cywilizacji, rozmiar mapy, seed | ⬜ |

---

### M5 — Dyplomacja uproszczona + więcej cywilizacji (cel: pełne 50 cyw.)

**Wyjście:** relacje dyplomatyczne, 7 typów głównych + ~43 poboczne, pełna mapa 50 cyw.

| Zadanie | Status |
|---------|--------|
| Silnik dyplomacji: Zaufanie/Respekt per para, modyfikatory co turę | ⬜ |
| 12 akcji dyplomatycznych (logika dostępności, efekty, koszty) | ⬜ |
| AI: dyplomacja per archetyp (charakterystyki z §4 Dyplomacja-szablon.md) | ⬜ |
| Cywilizacje poboczne: uproszczona logika (§5.2), trybut, NAP, wchłonięcie | ⬜ |
| Panel Dyplomacji (UI): lista graczy, status, 12 przycisków akcji, okno negocjacji | ⬜ |
| Kultura → granice (prógi punktów → zasięg miasta) | ⬜ |
| Religia: dominująca w mieście, rozprzestrzenianie, efekty dyplomatyczne | ⬜ |
| Korupcja / marnotrawstwo (ustalone współczynniki) | ⬜ |

---

### M6 — Zapis / wczytanie + dopieszczenie (cel: sesje gry)

**Wyjście:** gra daje się zapisać, wczytać, przejść do końca.

| Zadanie | Status |
|---------|--------|
| Serializacja GameState → JSON (localStorage + opcja pobrania pliku) | ⬜ |
| Wczytywanie zapisanego stanu | ⬜ |
| Autozapis co N tur (konfigurowalny) | ⬜ |
| Menu główne (Nowa gra / Wczytaj / Ustawienia) | ⬜ |
| Dopieszczenie UI (powiadomienia, animacje, czytelność HUD) | ⬜ |
| Balansowanie ekonomiczne (pierwsza iteracja po testach grywalnych) | ⬜ |
| Balansowanie walki (progi dezercji, koszty utrzymania, jednostki OP) | ⬜ |

---

### M7+ — Backend/multiplayer, kolejne epoki (cel: gra kompletna)

**Wyjście:** kolejne epoki (Żelazo+), przejścia walut, backend opcjonalny.

| Zadanie | Status |
|---------|--------|
| Epoki: Żelazo, Proch, Para, Prąd, Komputery, Internet, SI, Roboty — drzewko, budynki, jednostki w Excelu | ⬜ |
| Przejście walutowe: Pieniądz (×10) → Pieniądz fiducjarny (×100 po Bankowości) → Energia (×1000 po Elektryczności) | ⬜ |
| UI odzwierciedlający epokę waluty (kolor/oznaczenie) | ⬜ |
| Ustroje / rządy (odblokowane kulturą państwa) | ⬜ |
| Cuda świata (specjalne budynki, 1 na świat) | ⬜ |
| Wariant RTS bitwy (opcjonalny — Time War-style, ten sam model walki, inny tryb sterowania) | ⬜ |
| Backend serwerowy: konta, zapisy w chmurze, multiplayer, sync tur | ⬜ |
| Dźwięk i muzyka | ⬜ |
| Cywilizacje przyszłe: Hetyci, Galowie/Germanie, Scytowie (nomadyczny styl) | ⬜ |

---

## Podsumowanie: top-10 luk blokujących grywalność

1. ⬜ **Pipeline Excel→JSON** — bez niego silnik nie ma danych
2. ⬜ **Schemat GameState (runtime)** — bez niego nic się nie trzyma razem
3. ⬜ **Generator mapy (pełny)** — Voronoi, biomy, klastry, mgła, wioski
4. ⬜ **Pełny silnik walki kanon §5l** — v0.1 ma 1 rzut, brakuje Health/Morale/faz
5. ⬜ **Ekran bitwy (taktyczny + auto)** — makieta istnieje, logika zerowa
6. ⬜ **Ekonomia ilościowa** — magazyny, przepełnienie, utrzymanie, skarbiec
7. ⬜ **Pętla tury kompletna** — fazy produkcja/wzrost/AI/zwycięstwo
8. ⬜ **AI przeciwnika (minimum: ruch + atak + budowa)** — gra jest solo bez tego
9. ⬜ **Zapis / wczytanie** — każda sesja od zera
10. ⬜ **Warunki zwycięstwa** — gra nie ma końca

---

*Dokument wygenerowano na podstawie: PROJEKT-GRY-master.md (v. 2026-06-21), Schemat-dzialania-miasta.md, Spec-generator-mapy.md, Dyplomacja-szablon.md, PLAN-PRODUKCJI.md, Macierz-walki-analiza.md oraz 8 plików Excel i 5 makiet HTML.*
