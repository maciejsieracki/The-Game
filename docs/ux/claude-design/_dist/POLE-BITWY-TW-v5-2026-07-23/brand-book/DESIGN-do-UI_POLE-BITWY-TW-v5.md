# DESIGN → UI · POLE BITWY — TW v5 (2026-07-23)

**Makieta (kanon):** `brand-book/KANON/mockupy/The Game - C06 Pole bitwy odswiezenie (1E).dc.html` — 6 klatek (canvas, od góry):
1. **Bitwa ręczna** · 2. **AUTO** · 3. **Rozstawianie** · 4. **C-23 Szczegóły bitwy** · 5. **C-12 Koniec bitwy (Zwycięstwo/Porażka)** · 6. **C-09 v5 stany kart + tooltip**

Zastępuje wizualnie: `C06 Deployment v4` · `C07 Pole HUD bitwy v2` · `C23 v1` · `C12 v3`. Pole 3D = placeholder — projektujemy HUD NAD renderem silnika.
Kod docelowy: `gra/src/battle/battleHudTheme.ts` (tokeny/style), `manualBattle.ts` (layout), `battleMinimap.ts`.

---

## 1. Zasady globalne
- **Roster zawsze LEWY pionowy panel** (setki jednostek) — bez dolnego docka TW.
- **Panele ~70%**: tło `linear-gradient(180deg, rgba(20,26,38,.72), rgba(8,10,16,.75))` + `backdrop-filter: blur(6–9px)` (roster .8/.86 + blur 9 dla czytelności). Teren ma być widoczny pod HUD-em.
- **Ikony zamiast etykiet** w toolbarach; podpis TYLKO na hover — tooltip 1E: pigułka `rgba(8,10,16,.96)`, border `rgba(232,216,138,.45)`, tekst `#e8d88a`, 9px uppercase, ~40 px nad/pod ikoną.
- Zero emoji · inline SVG stroke (złoto) · Georgia nagłówki / Segoe UI treść · liczby `tabular-nums`.

## 2. Górny pasek (v5)
- Lewy: emblemat + „Bitwa · Tura N" / „Faza rozstawiania" + lokacja; badge trybu (Ręczne / **AUTO ×4** złoty glow).
- **Środek — panel dowódców**: portret Ty (medalion 52 px, ring #3a6ad0) + **pierścień HP** (SVG stroke #4caf50, dashoffset = ubytek) | zegar bitwy MM:SS (Georgia 26 px, #f4e6a8, glow) + **pasek przewagi** (niebieski→czerwony, złoty znacznik 3 px na styku) + podpis „Przewaga na polu: 62% Ty · 38% wróg" | portret wroga (ring #c84040).
- Skład: ikona typu + liczba, kolejność **konnica · piechota · dystansowe · suma oddz.** po OBU stronach (**NIE lustrzana** — decyzja 2026-07-23).
- **Strzałka „↓" przy „Ty": USUNIĘTA z gry** — rolę atakujący/obrońca niesie podpis pod nazwą dowódcy.
- Prawy róg: **ikona ustawień (koło zębate)** + „Wycofaj się" (czerwony outline). Popup ustawień chowa: Muzyka (toggle), Efekty dźwiękowe (toggle), Pomoc/skróty. Prawy rail 56 px ZLIKWIDOWANY.

## 3. Tempo + minimapa (prawy dół, jeden panel)
- Rząd nad minimapą: `Tempo` ⏸ ▶ ▶▶ ▶▶▶ (aktywna prędkość: złota ramka + glow) + po prawej **AUTO-rozegranie** (w AUTO: złote wypełnienie).
- Minimapa: rama `#6a5212` + inset złoty; blipy jednostek (Ty #5a9bd4 / wróg #d36b5e, dowódca z jasną obwódką), **złoty okrąg celu**, **prostokąt kamery** (złoty 1.5 px). W deploy: strefy (niebieska/czerwona przerywana), bez tempa („Minimapa · rozstawianie").

## 4. Pole — linie i strefy
- Linia podziału: gradient **niebieski → złoty → czerwony**, pulsująca (`clashPulse` 3.4 s), glow złoty.
- Deploy: strefa gracza = przerywana ramka #3a6ad0 + tint `rgba(58,106,208,.16→.04)`; wróg lustrzanie czerwony (.08→.02); podpisy stref uppercase; podświetlony slot drop (złota przerywana ramka + glow).

## 5. Banery nad oddziałami
- Pigułka: ikona typu + nazwa (9 px bold) + 2 paski 3 px (HP #4caf50, morale #ffd54a) + **maszt** 2 px gradient do jednostki; ramka koloru strony.
- Oddział dowódcy grupy: dodatkowo okrągły medalion (ikona generała) przy banerze.

## 6. Tooltip jednostki (hover na banerze/karcie)
Nagłówek: nazwa (Georgia) + **160 / 160**; podtytuł typu. Wiersze: **Postawa** („Trzyma linię · broni wzgórza"), **Świeżość** (#7ad0a0), **Grupa** („Grupa 1 · dowódca"). Legenda statów 2×2: Zdrowie #4caf50 · Morale #ffd54a · Wigor #5ad0c0 · Amunicja #c8a878 (dystansowe; „—" dla wręcz). Stopka: efekty statusu („Wzgórze +15% obrony", #7ad0a0).

## 7. Roster (lewy panel 352 px)
- **Nagłówek = medalion generała** + „Armia Temistoklesa" + „12 oddz. · 1 240 ludzi · N zaznaczone/do rozstawienia".
- Filtry ikonowe: Wszystkie (siatka, aktywny złoty) · Konnica · Piechota · Dystansowe · Generał (gwiazda) — obwódki w kolorach klas, podpis na hover.
- Grupy: nagłówek z kolorowym słupkiem + „Grupa N · x" + chevron zwijania; siatka 6 kolumn, karta = ikona typu (medalion) + nazwa 7 px + HP + morale + badge grupy.
- Stany kart (C-09 v5): pusty slot (przerywana, „+", opacity .4) · **rout** (strzałka ucieczki, „ROUT", opacity .5) · **martwa** (✕, „Padła", opacity .4).
- Stopka: „Grupa N · x zazn." + ikony **Odznacz / Grupuj (złoty diament) / Rozgrupuj** z podpisem na hover.
- Scrollbar złoty (`applyBattleRosterScrollbar`).

## 8. Dolny toolbar (środek ekranu)
- Ikony 46 px: Formacja · Konnica · Linie · Taktyka · Strategia; aktywna = złota ramka + glow; hover = podpis-pigułka nad ikoną.
- Deploy: + separator + Reset (outline przygaszony) + **START WALKI** (czerwony gradient #d05050→#8a2424, biały tekst). W AUTO toolbar ukryty, hint-pigułka na dole.

## 9. C-23 / C-12
- **C-23**: panel centralny 1220 px; nagłówek z wynikiem; 2 kolumny ATK/OBR (nagłówki z medalionem i „1 240 → 862 ludzi"); sekcje **Zniszczone #ff7b7b / Rozbite (rout) #ffd54a / Ocalałe #7ad0a0** — wiersze: ikona typu + nazwa (+ „dowódca") + „160 → 128" (rout: „· uciekli").
- **C-12**: karta Zwycięstwo (złota, puchar) / Porażka (czerwona, złamane miecze); 3 kafle statystyk (straty Ty/wróg/łupy); CTA: **Powrót na mapę** (złoty primary) + Rozegraj ponownie + Szczegóły bitwy (outline); stopka-hint: „Rozegraj ponownie: ta sama armia · pełne HP · wynik na mapę dopiero po Powrocie".

## 10. Tokeny (bez zmian, battleHudTheme.ts)
Złoto #e8d88a / #f4e6a8 / rgba(232,216,138,.30) · panel grad + border rgba(232,216,138,.45) · tekst #e8e0c8 / muted #8a8070 · Ty #3a6ad0 (#8fb6e0) · wróg #c84040 (#e08a8a) · HP #4caf50 (nisko #c84040) · morale #ffd54a · wigor #5ad0c0 · amunicja #c8a878 · typy: konnica #8fb6e0 · piechota #e8d88a · dystansowe #c8a878.
