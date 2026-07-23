# INSTRUKCJA DLA CLAUDE DESIGN — paczka DO-DESIGN-2026-07-23

**Od:** sesja chmurowa (integrator) · **Zatwierdza:** Maciej
**Styl:** 1E (złoto #e8d88a / granat-ciemność / gracz #3a6ad0 / wróg #c84040 · Georgia + Segoe UI · tabular-nums)
**Format oddania (jak dotychczas):** ZIP ze strukturą `_dist/<NAZWA>-<data>/` + `MANIFEST.txt` + `DYSPOZYCJA-WDROZENIE.md` (kroki dla integratora) + makieta `.dc.html`.

---

## CO WKLEIĆ DO CLAUDE DESIGN (zawartość tego folderu)

| Plik | Co to jest | Po co Design to dostaje |
|---|---|---|
| `makiety/Makieta-PREBATTLE-v1-TW-nakladka.html` | **GŁÓWNE ZLECENIE** — nasza makieta v1 ekranu pre-battle (3 klatki) | do dopracowania → kanon `.dc.html` |
| `makiety/Makieta-POLE-BITWY-v5-TWWH3.html` | nasza makieta HUD pola bitwy (referencja — Design zrobił już z niej swoją TW-v5) | kontekst spójności |
| `WYTYCZNE-DESIGN-POLE-BITWY-v5.md` | wytyczne pola bitwy (tokeny, żelazna zasada lewego rosteru, zaległości v5-GAP) | obowiązujące zasady |
| `zrzuty-makiet/prebattle-mockup-shot-A/B/C.png` | podgląd 3 klatek makiety preBattle | szybki ogląd bez otwierania HTML |
| `zrzuty-stan-gry/*.png` | **AKTUALNY stan gry** (patrz niżej) | Design widzi, co już wdrożone |

### Zrzuty stanu gry (referencja implementacji — to już DZIAŁA w grze)
- `plansza-{laka,rownina,wzgorza,gory,las,pustynia,wybrzeze,rzeka}.png` — 8 plansz bitwy zależnych
  od terenu hexa świata (rzeka = ciągłe koryto S z brodami). Pole czyste, czarne tło, bez obramówek
  (decyzja Macieja 2026-07-23), złota ramka strefy gry.
- `plansza-domyslna-legacy.png` — bitwa bez presetu (stare wywołania).
- `pole-bitwy-zblizenie.png` — widok z bliska (trawa/dekor/banery nad oddziałami).
- `dyplomacja-wdrozona.png` — panel dyplomacji WDROŻONY w grze wg makiety DYPLOMACJA FINAL
  (dwustronny + stół negocjacji + blokady + ikonowy pasek). **Dyplomacja = ZAMKNIĘTA, nie ruszać.**

---

## ZLECENIE 1 (GŁÓWNE): PRE-BATTLE jako nakładka na mapie — dopracować do kanonu

**Wizja Macieja:** ekrany pre-battle mają być MAŁE — mapa świata (miejsce bitwy) widoczna w tle,
UI tylko jako kompaktowe nakładki (jak Total War: Troy/WH3). Nasza makieta v1 = punkt wyjścia.

**3 klatki do dopracowania (są w `Makieta-PREBATTLE-v1-TW-nakladka.html`):**
1. **Atak w polu** — karty dowódców w górnych rogach (medalion, cywilizacja+wódz, liczebność,
   chipy bonusów), pionowe rostery przy bocznych krawędziach (u wroga część kart „Nieznany oddział —
   wywiad: brak danych"), dół-środek kompaktowy panel: „ROZSTAWIENIE BITWY / Atakujesz: X /
   Region · **Teren** (ikona) · Tura", pasek szans (momentum 62/38 ze złotym markerem), pigułki
   modyfikatorów terenu, przyciski **WYCOFAJ** (czerwony) / **AUTO-ROZSTRZYGNIJ** / **DO ROZSTAWIENIA**
   (złoty primary), hinty klawiszy (Enter/Esc/Zapisz).
2. **Atak na miasto** — tagi (Mur miejski · Garnizon: N · Ludność N), szansa szturmu, dwie karty
   opcji **OBLEGAJ** vs **SZTURM** (opisy + klawisze 1/2) + WYCOFAJ.
3. **Obrona** — strony odwrócone, „WRÓG ATAKUJE / Broni się: X", **BEZ przycisku Wycofaj**
   (silnik: `canRetreat:false` przy obronie) — zamiast niego pasek „Wycofanie niedostępne";
   CTA: **BROŃ SIĘ — ROZSTAWIENIE** (primary) / AUTO.

**Twarde zasady:**
- Teren bitwy w panelu jest OBOWIĄZKOWY (plansza bitwy zależy od terenu — mechanika już w grze,
  patrz zrzuty plansz). Ikona terenu + nazwa.
- Mapa w tle musi pozostać CZYTELNA — nakładki nie mogą zasłaniać środka (miejsca bitwy).
- Realne akcje tylko z listy powyżej (nie wymyślać opcji typu „bitwa nocna" — nie mamy takiej mechaniki).
- Tokeny 1E jak w `WYTYCZNE-DESIGN-POLE-BITWY-v5.md` §5.

**Oddanie:** `_dist/PREBATTLE-TW-v1.x-<data>/` z makietą `.dc.html` (3 klatki w 1 pliku, jak
POLE-BITWY-TW-v5), MANIFEST, DYSPOZYCJA-WDROZENIE (kroki integratora + logika stanów).

## ZLECENIE 2 (ZALEGŁE): eksport/ — tokens + ikony
W żadnej z 3 dotychczasowych paczek (POLE-BITWY-TW-v5, DYPLOMACJA v1.1, DYPLOMACJA FINAL)
**nie dojechał folder `eksport/`**: `tokens.css` / `tokens.json` / `motion.css` / `icons/*.svg` /
`*-icon-map.json`. CANON.md go opisuje — prosimy o dosłanie w następnym ZIP.

## STATUSY (żeby Design nie robił drugi raz)
- **DYPLOMACJA** — FINAL wdrożona w grze 1:1 (3 fazy, zrzut w paczce). ZAMKNIĘTE.
- **POLE BITWY HUD TW-v5** — makieta Design (6 klatek) przyjęta do repo; wdrożenie w kodzie
  = następna paczka integratora (nie wymaga nic od Design teraz).
- **Plansze bitwy wg terenu + czyste pole na czarnym tle** — WDROŻONE (zrzuty w paczce).
- Backlog przyszłościowy (Maciej: „kiedyś"): większe plansze — czarne tło zastąpione graficznie
  ułożonym lądem, strefa walki wydzielona ramką jak obecnie.
