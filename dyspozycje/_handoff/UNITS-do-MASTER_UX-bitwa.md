# HANDOFF: UNITS → MASTER (do UX) — nakładka UX na BITWĘ

Data: 2026-06-24. Od: Civ-UNITS (jednostki + bitwa). Do: UX (przez Mastera).
Cel: zaprojektować spójną nakładkę UI/HUD dla taktycznej bitwy 3D. Plik referencyjny (działający): **Gra-podglad-BITWA.html** (klawisz „T" odpala testową bitwę).

## 1. CO JUŻ ISTNIEJE w bitwie (do oskinowania / uporządkowania)
- Pasek dolny przycisków: „Prędkość: Nx", „Pauza (P)", „Pomiń → wynik", „Wyjście".
- Klawisze: S (prędkość 1→512, 10 stopni), P (pauza), H (paski on/off), M (dźwięk on/off).
- Wskaźniki (lewy-górny): „Prędkość: Nx", badge „|| PAUZA", „Dźwięk: WŁ/WYŁ".
- Paski morale ARMII: lewy (czerwony=atakujący) / prawy (niebieski=obrońca), % + obwódka.
- Panel logu starć (prawy-górny): ostatnie 10 ciosów (kto kogo, −HP, padł/rout).
- Nad każdą jednostką: paski HP / MORALE / AMUNICJA (tylko strzelcy) + obwódka frakcji; pływające etykiety „−N" obrażeń (2 s realne).
- Ekran KOŃCA: zwycięzca + statystyki obu stron (zniszczone/zrootowane/ocalałe) + przyciski „Szczegóły" (rozbicie per jednostka, 2 kolumny) i „Zakończ bitwę".
- Kamera: zoom (kółko / +- ), pan (przeciąganie).
- Dźwięk: SFX (stal o stal, świst, rout, padnięcie, fanfary) + spokojny ambient.

## 2. MOJE POMYSŁY — co UX mógłby zaprojektować (spójny skin + braki)
- **Górny pasek HUD**: numer tury, prędkość, morale armii obu stron (%), licznik strat (zabici/uciekli/pozostali per strona), zegar/„pauza".
- **Dolny pasek akcji**: ikony zamiast tekstu (prędkość ±, pauza, pomiń, wyjście, dźwięk, paski) + legenda skrótów.
- **Panel jednostki**: najazd kursorem → tooltip (nazwa, typ, HP, morale, atak/obrona); klik → panel boczny ze statami + bonusami vs typ.
- **Minimapa / podgląd całego pola** (opcjonalnie) — orientacja na dużym polu (78×34).
- **Ekran PRZED bitwą**: podgląd składu obu armii (jednostki/typy/liczby) + „Start".
- **Styl wizualny**: spójny motyw (np. antyczny/pergamin lub ciemny minimalistyczny) — kolory, typografia, ramki, ikony.
- **Paski nad jednostką**: dopracowanie czytelności (kolory, grubości, billboard).
- **Ekran końca**: ładniejszy layout + ew. wykres strat w czasie.

## 3. CO MOGĘ ZAPREZENTOWAĆ UX-owi
- Działający `Gra-podglad-BITWA.html` (pełna mechanika + obecny HUD) jako punkt wyjścia.
- Listę wszystkich elementów + stanów (powyżej).
- Galerię jednostek 4-widoki (`Civ-UNITS/Galeria-jednostek-4widoki.html`).
- Panel parametrów (`Civ-UNITS/Bitwa-parametry.xlsx`).

## 4. PYTANIA (Maciej je doprecyzuje / prześle do UX)
1. Bitwa = tylko PODGLĄD (auto) czy gracz STERUJE jednostkami (wybór + rozkazy)? — to determinuje cały UX (kontrolki rozkazów vs tylko obserwacja).
2. Minimapa potrzebna?
3. Tooltip jednostki na najazd + panel po kliknięciu — tak?
4. Górny pasek: które dane (tura / prędkość / morale armii / licznik strat)?
5. Ekran PRZED bitwą (podgląd składu) — robimy?
6. Styl wizualny HUD (antyczny vs ciemny minimalizm vs inny)?
7. Sterowanie: zostają klawisze S/P/H/M + przyciski, czy UX projektuje pasek ikon (mysz-first)?

## 5. ODPOWIEDZI MACIEJA (do projektu UX) + NOWE WYMAGANIE
- **Q1 = B + AUTO**: gracz STERUJE jednostkami (zaznaczanie + rozkazy), z PRZEŁĄCZNIKIEM trybu AUTO (oddanie sterowania AI). UX projektuje: zaznaczanie jednostek/grup, wydawanie rozkazów (ruch/atak/cel), przełącznik AUTO↔ręczne.
- **NOWE: FAZA ROZSTAWIANIA przed bitwą** — przed „Start" gracz sam USTAWIA swoje jednostki na polu (np. drag&drop w strefie startowej swojej strony; siatka rozstawienia; ew. szybkie presety/„auto-ustaw"). Dopiero „Start" odpala symulację. UX: ekran/tryb deploymentu (strefa startowa, podświetlenie pól, chwyt jednostki, walidacja, przycisk Start + „Auto-ustaw" + „Reset").
- Q2–Q7 (minimapa / panel jednostki / górny pasek / ekran przed-bitwą / styl / sterowanie) — Maciej dośle.

## 5a. STEROWANIE ZAZNACZONĄ JEDNOSTKĄ + ROSTER (doprecyzowanie Maciej, 2026-06-25)
Referencja wizualna: **Total War: Pharaoh** (układ HUD — patrz niżej).

### A) Kursor kontekstowy (zmienia wygląd wg akcji/celu)
- Zaznaczona jednostka STRZELAJĄCA, gdy najazd na cel = atak dystansowy → kursor **ikona ŁUKU**.
- Atak wręcz (melee) → kursor **ikona MIECZA**.
- (Domyślnie kursor odzwierciedla akcję, jaka się wykona po kliknięciu danego celu/pola.)

### B) Rozkazy zaznaczonej jednostki
Podstawowe:
1. **Ruch** (klik na pole).
2. **Atak** (klik na cel).
Pomocnicze:
3. **Wycofanie / Odwrót** — wycofuje jednostkę z walki (rout); także zbiorczo „wycofaj wszystkie" gdy bitwa przegrana.
4. **Stand by / Broń pozycji** — jednostka stoi w miejscu i broni się, NIE napiera do przodu.
5. **(dystansowe) Tryb walki dystansowej ON/OFF**:
   - OFF → wyłącza ucieczkę/utrzymywanie dystansu (jednostka nie kituje).
   - ON → obecne zasady: trzyma dystans i strzela.
6. **(strzelające) Tryb strzelania ON/OFF**:
   - OFF → jednostka przechodzi w **tryb wręcz** (np. Legion: wyłącz strzelanie → od razu szarża do ataku).
   - ON → strzela.
- Przyszłość: dodatkowe funkcje specjalne (konnica i in.) — później, NA RAZIE powyższe są kluczowe.

### C) Dwie strony interfejsu
- **(a) Panel zaznaczonej jednostki** — statystyki + przyciski akcji (co jednostka ma robić; rozkazy z pkt B). UX projektuje layout.
- **(b) Roster na dole** — DUŻA tabela wszystkich posiadanych jednostek, **podział na 3 grupy**: Frontalne (wręcz) / Dystansowe / Mounted (konnica, rydwany). **Zarezerwować JEDNO miejsce w puli na GENERAŁA.**

### D) Z analizy Total War: Pharaoh (do skinu HUD)
- Dolny pasek = rząd kart/portretów oddziałów (= roster z pkt C-b).
- Nad jednostkami banery: ikona typu + pasek stanu (HP/morale) — billboard.
- Linie rozkazów na ziemi: żółta = ruch, czerwona = atak.
- Minimapa w dolnym rogu; HUD ciemny, półprzezroczysty, banery frakcji po bokach.

## 6. UWAGA WDROŻENIOWA (UNITS)
Tryb B (sterowanie graczem) + faza rozstawiania to DUŻA zmiana bitwy (input gracza, stany: deployment → walka; rozkazy). Po projekcie UX zrobię część po stronie battleScene (mój lane) i handoff do Mastera na scalenie. Na teraz: czekam na projekt UX + resztę odpowiedzi.

— Civ-UNITS
