# BRIEF DLA UX — mapa / interfejs taktycznej BITWY (Civ)

**Od:** Civ-UNITS (lane: jednostki + bitwa) · **Data:** 2026-06-25 · **Dla:** UX
**Cel:** zaprojektować spójny interfejs (HUD + tryby) dla taktycznej bitwy 3D w grze 4X w stylu Cywilizacji.
**Referencja wizualna:** **Total War: Pharaoh** (układ HUD, banery nad jednostkami, dolny pasek kart, minimapa).
**Plik do podglądu mechaniki:** `Gra-podglad-BITWA.html` (klawisz „T" odpala testową bitwę — pełna mechanika + obecny tymczasowy HUD).

---

## 1. CZYM JEST TA BITWA
Taktyczne starcie dwóch armii na polu **34 × 78 pól** (siatka kwadratowa, teren: wzgórza, rzeka, las).
Jednostki to oddziały (do ~84 na stronę), z typami: wręcz (miecznicy/włócznicy/falanga), dystansowe (łucznicy, procarze, oszczepnicy), mounted (konnica, rydwany).
Każda jednostka ma: HP, morale, atak/obrona, bonusy vs typ, amunicję (strzelcy).

**Dwa tryby gry (Q1 = B + AUTO):**
- **Sterowanie graczem** — gracz zaznacza jednostki i wydaje rozkazy.
- **Przełącznik AUTO** — oddanie sterowania AI (obecna automatyczna bitwa).

**Faza ROZSTAWIANIA przed bitwą** — przed „Start" gracz sam ustawia swoje jednostki w strefie startowej (drag&drop na siatce), z „Auto-ustaw" i „Reset". Dopiero „Start" odpala symulację. Stany aplikacji: **deployment → walka → ekran końca.**

---

## 2. ELEMENTY POTRZEBNE NA MAPIE BITWY (wytyczne)

### 2.1. Minimapa terenu (WYMAGANA)
- Mała mapa całego pola w rogu ekranu.
- Pokazuje teren + **jednostki własne (np. niebieskie) i wrogie (czerwone)** jako punkty/markery.
- Orientacja na dużym polu (78×34); ew. klik na minimapie = przesunięcie kamery.

### 2.2. Roster jednostek — dolny pasek (WYMAGANY)
- DUŻA tabela/pasek wszystkich posiadanych oddziałów wzdłuż dołu ekranu (jak karty oddziałów w Total War).
- **Podział na 3 grupy:** Frontalne (wręcz) / Dystansowe / Mounted (konnica, rydwany).
- **Jedno miejsce zarezerwowane w puli na GENERAŁA.**
- Karta pokazuje: ikonę typu, stan (HP/morale), zaznaczenie. Klik karty = zaznaczenie jednostki na polu.

### 2.3. Panel zaznaczonej jednostki (WYMAGANY)
- Po zaznaczeniu: statystyki (nazwa, typ, HP, morale, atak/obrona, bonusy vs typ, amunicja) + **przyciski rozkazów** (patrz §3).

### 2.4. Kursor kontekstowy (WYMAGANY)
- Wygląd kursora zależy od akcji, jaka wykona się po kliknięciu celu/pola:
  - jednostka strzelająca + cel w zasięgu strzału → **ikona ŁUKU** (atak dystansowy),
  - atak wręcz → **ikona MIECZA**,
  - ruch → kursor ruchu.

### 2.5. Banery nad jednostkami (jest — do oskinowania)
- Nad każdą jednostką: ikona typu + paski **HP / MORALE / AMUNICJA** (strzelcy) + obwódka frakcji (czerwona=atakujący, niebieska=obrońca). Billboard zwrócony do kamery.

### 2.6. Linie rozkazów na ziemi (do zaprojektowania)
- Żółta linia = ścieżka ruchu, czerwona = rozkaz ataku na cel (jak w Total War).

### 2.7. Górny pasek HUD (do zaprojektowania)
- Numer tury, prędkość symulacji, **morale armii obu stron (%)**, licznik strat (zabici / uciekli / pozostali per strona), stan pauzy.

### 2.8. Dolny pasek akcji / sterowanie (do oskinowania)
- Ikony zamiast tekstu: prędkość ±, pauza, pomiń→wynik, wyjście, dźwięk, paski + legenda skrótów.

### 2.9. Ekran PRZED bitwą (do zaprojektowania)
- Podgląd składu obu armii (typy/liczby) + faza rozstawiania + „Start".

### 2.10. Ekran KOŃCA (jest — do upiększenia)
- Zwycięzca + statystyki obu stron (zniszczone/zrootowane/ocalałe) + „Szczegóły" (rozbicie per jednostka) + „Zakończ bitwę". Ew. wykres strat w czasie.

### 2.11. Styl wizualny
- Spójny motyw HUD (antyczny/pergamin vs ciemny minimalistyczny — do decyzji UX): kolory, typografia, ramki, ikony.

### 2.12. Panel warstw HUD „OVERLAYS" (z analizy Total War: Pharaoh — ZALECANE)
Total War daje listę przełączników warstw widoku (zamiast jednego on/off). Warto przejąć ideę — gracz włącza/wyłącza:
banery jednostek, paski statystyk, ikony statusu, ikony jednostek, markery zaznaczenia, ścieżki ruchu, łuki ostrzału (zasięg strzału), poziom zagrożenia, portrety generałów, ukrycie roślinności, tryb kinowy.
(Nasz obecny klawisz H = uproszczona wersja tego panelu.)

---

## 2A. ANALIZA REFERENCJI — zrzut Total War: Pharaoh (mapowanie 1:1)
- **Góra-środek:** portrety obu generałów + złoty pasek równowagi/morale bitwy + liczebności armii → nasz **górny HUD** (§2.7).
- **Prawy panel „OVERLAYS":** lista przełączników warstw → nasz **panel warstw** (§2.12).
- **Banery nad oddziałami:** pionowe, kolor = frakcja (niebieski gracz / czerwony wróg / zielony inny), ikona typu + ikonki statusu → nasze **banery** (§2.5).
- **Żółte linie po ziemi:** ścieżki ruchu → nasze **linie rozkazów** (§2.6).
- **Dół-środek — klaster ikon rozkazów grupowych:** halt / formacja / guard / fire-at-will / skirmish / melee → nasze **rozkazy** (§3).
- **Dolny pasek — karty oddziałów:** liczebność, portret, ikonki statusu („Zzz"=bezczynna), podświetlenie zaznaczenia → nasz **roster** (§2.2).
- **Styl:** ciemny, półprzezroczysty HUD, złote/mosiężne akcenty, banery frakcji — kandydat na motyw (§2.11).

**Doprecyzowania z wyraźniejszego zrzutu:**
- **Zegar bitwy** (mm:ss) w pasku górnym obok portretów generałów i morale armii → dodać do §2.7.
- **Minimapa** w TW = prawy-górny róg (u nas róg do decyzji UX — wariant TW: prawy-górny).
- **Warstwy OVERLAYS** mają nie tylko on/off, ale i suwaki wartości (krycie/rozmiar elementu) — opcjonalnie.
- **Dolny klaster ikon** łączy sterowanie odtwarzaniem (pauza/prędkość) z rozkazami grupowymi.
- **Karty oddziałów (roster)** mają pod portretem ikony statusu + zdolności (np. „Zzz" = bezczynny, czerwone podświetlenie = zaznaczony/w walce, liczba na górze = liczebność).

---

## 3. ROZKAZY ZAZNACZONEJ JEDNOSTKI (logika do obudowania UI)

**Podstawowe:**
1. **Ruch** — klik na pole.
2. **Atak** — klik na cel.

**Pomocnicze:**
3. **Wycofanie / Odwrót** — wycofuje jednostkę z walki (rout); także zbiorczo „wycofaj wszystkie" gdy bitwa przegrana.
4. **Stand by / Broń pozycji** — stoi w miejscu i broni się, NIE napiera do przodu.
5. **(dystansowe) Tryb walki dystansowej ON/OFF:**
   - OFF → wyłącza ucieczkę/utrzymywanie dystansu (jednostka nie kituje),
   - ON → obecne zasady: trzyma dystans i strzela.
6. **(strzelające) Tryb strzelania ON/OFF:**
   - OFF → jednostka przechodzi w **tryb wręcz** (np. Legion: wyłącz strzelanie → od razu szarża),
   - ON → strzela.

**Przyszłość:** dodatkowe funkcje specjalne (konnica i in.) — później; na razie powyższe są kluczowe.

---

## 4. CO JUŻ DZIAŁA (punkt wyjścia dla UX)
- Pełna mechanika walki (auto), model morale (8 czynników, rout, osłona wręcz).
- Tymczasowy HUD: prędkość (klawisz S, 1→512, 10 stopni), pauza (P), paski (H), dźwięk (M); paski morale armii L/R; log 10 ostatnich starć; ekran końca + szczegóły.
- Kamera: zoom (kółko / +−), pan (przeciąganie).
- Audio: SFX (stal o stal, świst, rout, padnięcie, fanfary) + spokojny ambient.
- Rozstawienie automatyczne wg ról (linia wręcz + oszczepnicy + łucznicy + jazda na skrzydłach).

**Pliki referencyjne:** `Gra-podglad-BITWA.html` (działa, „T"=test), `Civ-UNITS/Galeria-jednostek-4widoki.html` (46 jednostek, 4 widoki), `Civ-UNITS/Bitwa-parametry.xlsx` (parametry).

---

## 5. JESZCZE NIE ISTNIEJE (do zaprojektowania przez UX, potem implementacja UNITS)
Zaznaczanie jednostek, panel jednostki, kursor kontekstowy, minimapa, roster dolny, linie rozkazów, faza rozstawiania gracza, ekran przed-bitwą, przełącznik AUTO↔ręczne, tryby ON/OFF dystans/strzelanie.

## 6. UWAGA WDROŻENIOWA
Tryb sterowania graczem + faza rozstawiania to DUŻA zmiana (input gracza, nowe stany, rozkazy). Po projekcie UX część zrobię po stronie `battleScene` (lane UNITS), reszta integracji → Master.

— Civ-UNITS
