# WYTYCZNE: makiety POLA BITWY v5 — styl Total War (dla Claude Design)

**Gra:** The Game (4X, epoki Kamień→Brąz→Żelazo) · **Styl:** 1E (złoto/ciemność)
**Baza:** kanon v4.1 (C06 Deployment v4 · C09 Roster v4 · C06 Popup Strategia v4 · Popupy deploy v5)
**Cel:** unowocześnić HUD bitwy do stylu Total War: Warhammer 3 — z JEDNĄ kluczową różnicą (pkt 1).

---

## 1. ŻELAZNA ZASADA — roster po LEWEJ, nie na dole
W TW jednostek jest ~20 → mieszczą się w dolnym poziomym docku. **U nas są SETKI** — dlatego roster
jest LEWYM PIONOWYM panelem (siatka kart 6 kolumn × N rzędów ze scrollem pionowym, ~372 px szer.).
NIE projektować dolnego docku jednostek jak w TW. To już jest w kanonie C09 v4 — zostaje.

## 2. CO ZOSTAJE z kanonu v4.1 (nie zmieniać, tylko dopieścić)
- **Lewy roster:** filtry-chipy (Wszystkie/Konnica/Piechota/Dystansowe/Generał), zakładki grup
  („Grupa 1 · 6"), siatka kart (ikona typu + nazwa + pasek HP + pasek morale + badge nr grupy),
  pasek zaznaczenia na dole („Grupa 2 · 4 zazn." · Odznacz · ◆ Grupuj · Rozgrupuj).
- **Prawy rail komend** (56 px): PAUZA · PRĘDKOŚĆ · RĘCZNY · MAPA · MUZ · POMOC · WYCOFAJ (czerwony).
- **Dolny toolbar środek:** Formacja · Konnica · Linie · Taktyka · Strategia (popupy nad przyciskiem).
- **Linia podziału pola** (niebieska→złota→czerwona) i złota ramka strefy gry.
- 3 stany do pokazania: FAZA ROZSTAWIANIA · bitwa AUTO (roster schowany) · bitwa RĘCZNA (pełny roster).

## 3. NOWE elementy do dodania (adaptacja TW:WH3)
1. **Górny środek:** dwa PORTRETY DOWÓDCÓW (okrągłe medaliony, obwódka niebieska Ty / czerwona wróg,
   cienki pierścień HP pod medalionem) + nazwa cywilizacji i wodza + licznik „1 240 ludzi · 12 oddz.".
   Między nimi: **ZEGAR BITWY** (MM:SS, złoty, serif) i **PASEK PRZEWAGI** (niebieski vs czerwony,
   złoty znacznik na styku, podpis „Przewaga na polu: 62% Ty · 38% wróg").
2. **Banery nad oddziałami na polu:** chorągiewka w kolorze strony z ikoną typu jednostki
   + pod nią 2 mini-paski (HP zielony, morale bursztyn); nad oddziałem dowódcy grupy dodatkowo
   okrągły medalion. Cienki „maszt" łączy baner z jednostką.
3. **Bogaty tooltip jednostki (hover):** nagłówek = nazwa + liczebność (160/160);
   wiersze: typ („Ciężka piechota · włócznicy — falanga"), **Postawa** („Trzyma linię — broni wzgórza"),
   **Świeżość** („Wypoczęci"); na dole **legenda statów** z ikonami i wartościami:
   Zdrowie · Morale · Wigor · Amunicja · Efekty statusu (np. „Wzgórze +15% obrony").
4. **Sterowanie tempem PRZY minimapie** (prawy dół): pasek „Tempo" ⏸ ▶ ▶▶ ▶▶▶ NAD minimapą,
   w jednym panelu z nią. Minimapa: blipy jednostek (niebieskie/czerwone), złoty znacznik celu,
   prostokąt aktualnego widoku kamery.
5. **Medalion generała w NAGŁÓWKU rosteru** (nie w lewym dolnym rogu — koliduje z rosterem):
   „Armia Temistoklesa · 12 oddz. · 1 240 ludzi · 4 zaznaczone".

## 4. ZALEGŁE makiety do dostarczenia (zlecenie v5-GAP z 2026-07-05 — wciąż otwarte!)
Kod już te ekrany ma zaimplementowane „w ciemno" z opisu — brakuje ZATWIERDZONYCH makiet:
- **C-23 Szczegóły bitwy** (poprzednia wersja ODRZUCONA wizualnie) — 2 kolumny ATK/OBR,
  sekcje Zniszczone / Rozbite (rout) / Ocalałe, kolory #ff7b7b / #ffd54a / #7ad0a0.
- **C-12 Koniec bitwy v3** — 3 stany w 1 makiecie: ZWYCIĘSTWO / PORAŻKA / hint;
  CTA: „Rozegraj ponownie" · „Szczegóły bitwy" · „Powrót na mapę"
  (+ hint „Ta sama armia · pełne HP · wynik na mapę dopiero po Powrocie").
- **C-09 v5** — puste sloty siatki (obwódka przerywana, opacity ~0.4), karta MARTWA (✕, opacity 40%),
  karta ROZBITA („rout", opacity 50%).
- **Tooltip karty jednostki v1** — jak pkt 3.3 powyżej + pole „Grupa N".
- **Top-bar v5** — cluster liczb symetryczny po obu stronach VS (Ty 20·60·30·110 ⚔ 110·30·60·20 Wróg —
  NIE lustrzany); rozstrzygnąć strzałkę „↓" przy „Ty" (dodać do makiety albo usuniemy z gry).

## 5. TOKENY STYLU 1E (używać dokładnie tych)
- Złoto: #e8d88a · jasne złoto: #f4e6a8 · przygaszone: rgba(232,216,138,.30)
- Panel: linear-gradient(180deg, rgba(18,24,32,.97), rgba(8,10,16,.97)) · obwódka rgba(232,216,138,.45)
- Tekst: #e8e0c8 · wyciszony: #8a8070
- Gracz (Ty): #3a6ad0, tekst #8fb6e0 · Wróg: #c84040, tekst #e08a8a
- Semantyka: HP #4caf50 (nisko #c84040) · morale #ffd54a · wigor #5ad0c0 · amunicja #c8a878
- Typy jednostek: konnica #8fb6e0 · piechota #e8d88a · dystansowe #c8a878
- Fonty: nagłówki/etykiety Georgia (serif) · UI „Segoe UI" · liczby: tabular-nums
- Ikony: inline SVG w kolorze złotym (bez emoji)

## 6. TREŚĆ przykładowa (realna, po polsku)
Ty = Grecy (Temistokles), wróg = Rzymianie (Marek Furiusz). Jednostki: Hoplici Sparty, Falanga Teb,
Peltaści, Łucznicy Krety, Hetajrowie, Procarze… Liczności 16–160. Zegar 04:12, przewaga 62/38.
Pole 3D = placeholder (murawa + drzewa + linia podziału) — makieta projektuje HUD NAD polem.
