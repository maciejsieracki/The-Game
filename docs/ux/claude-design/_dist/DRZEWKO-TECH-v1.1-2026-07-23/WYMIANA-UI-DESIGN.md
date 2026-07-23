# DYSPOZYCJA — wymiana informacji

Plik do dwustronnej komunikacji: **Agent / Maciej ⇄ Claude (projektant UI)**.
Zasada: **append-only w sekcji „Log"** — nie nadpisujemy historii. Nowe polecenia dopisuj w „Dyspozycje przychodzące", ja odpowiadam w „Odpowiedzi / status".

- Projekt: **The Game — Design System v1 · Painted Imperial (1E)**
- Katalog roboczy: `brand-book/` (dokumenty + ekrany), `brand-book/eksport/` (tokeny, SVG, handoff)
- **KANON (UX):** zapis WYŁĄCZNIE w `brand-book/`; status w `WYMIANA-UI-DESIGN.md`; nie tworzyć innych folderów; Maciej nie przenosi plików. Repo docelowe: `docs/ux/claude-design/01-propozycje-z-design/brand-book`.
- Aktualizacja: 2026-07-01
- **Protokół**: Maciej jest pośrednikiem. Gdy UX coś dopisze — Maciej mówi Claude **START**. Gdy Claude skończy — informuje Macieja, ten daje znać UX, by odczytał.

---

## 1. Status ogólny

| Obszar | Stan |
|--------|------|
| Kierunek stylu | ✅ zatwierdzony: **1E** |
| Brand Book v1 | ✅ gotowy |
| Biblioteka ikon (Tier 1–5, 50 szt.) | ✅ gotowa |
| Ekrany (menu → koniec) | ✅ gotowe |
| Komponenty + Motion | ✅ gotowe |
| Prototyp (klikalny przepływ) | ✅ podstawowy |
| Eksport (tokeny + 14 SVG + HANDOFF) | ✅ gotowy |

Wejście do przeglądu: `brand-book/The Game — Przegląd (1E).dc.html`

## 2. Decyzje zamknięte (NIE zmieniać bez nowej dyspozycji)
`1B` ciepłe złoto · `2C` Georgia+Segoe · `3C` ikony line w medalionach · `4C` przycisk outline/bevel · `5C` panel premium · `6C` chip + etykieta PL.
Semantyka ikon: Praca=młotek · Żywność=kłos · Skarbiec=moneta · Nauka=sowa · Dyplomacja=pergamin+pióro · Porządek=waga · Zdrowie=kaduceusz · Bonus=prezent+gwiazda · Pokój=gołąb.

## 3. Do zrobienia (backlog — priorytet malejąco)
- [ ] Wariant **porażki** na ekranie końca gry
- [ ] Domknięcie hubu: kafelki dla Kreator Kroki / Walka Warianty / Motion
- [ ] Dokończenie linków prototypu (Dyplomacja→HUD, banery miast→Miasto)
- [ ] Ujednolicenie ikony dyplomacji (HUD ⇄ biblioteka)
- [ ] Eksport SVG Tier 3–5
- [ ] Brand Book → PDF
- [ ] Ekrany dodatkowe: badania (drzewko), wojsko (lista armii), handel, pauza/opcje

## 4. Pytania otwarte (czekają na decyzję)
- (brak — dopisz tutaj)

---

## 5. Dyspozycje przychodzące (od Agenta / Macieja)
> Dopisuj nowe polecenia na górze, z datą. Format: `- [DATA] treść`

- [2026-07-01] **KANON (UX):** zapis tylko w `brand-book/` (eksport `brand-book/eksport/`), status w `WYMIANA-UI-DESIGN.md`, nie tworzyć innych folderów, Maciej nie przenosi plików.

## 6. Odpowiedzi / status (od Claude)
> Odpowiadam pod każdą dyspozycją, z datą i statusem (przyjęte / w toku / zrobione).

- [2026-07-23] **Zrobione: DRZEWKO v1.1 (werdykt Macieja).** Krawędzie usunięte W CAŁOŚCI (klatki A i C — zero linii/strzałek/mostków, badge i legenda krawędzi zdjęte); zależności wyłącznie opisowo (węzeł + karta węzła); „Ścieżka do X" działa na węzłach (podświetlenie łańcucha AND, reszta wygaszona). Wariant „kotwice AND" — zaniechany zgodnie z decyzją. Paczka `_dist/DRZEWKO-TECH-v1.1-2026-07-23` zawiera też: ponownie KANON-SYNC-6 (6 plików kanonu — poprzednio nie dojechały) oraz **STANDALONE inline** drzewka (React/Babel wbudowane — działa za proxy, bez unpkg).

- [2026-07-23] **Zrobione: paczka DO-DESIGN-2026-07-23 (odpowiedź).** Zlecenie 1: PRE-BATTLE nakładka → kanon `.dc.html` (3 klatki: atak w polu / atak na miasto / obrona; twarde zasady zachowane: teren obowiązkowy, mapa czytelna — panele ~75%+blur, tylko realne akcje z preBattle.ts / cityAttackChoice.ts, obrona bez Wycofaj). Zlecenie 2: **eksport/ dosłany w paczce** (tokens.css/json · motion.css · icons/ · icon-mapy). Paczka: `_dist/PREBATTLE-TW-v1.1-2026-07-23`.

- [2026-07-23] **Zrobione: DYPLOMACJA panel negocjacji v1.1 → KANON** (zatwierdzenie Macieja). Szczegóły w logu; paczka: `_dist/DYPLOMACJA-v1.1-2026-07-23`.
- [2026-07-23] **Zrobione: POLE BITWY — TW v5.** 6 klatek w `brand-book/KANON/mockupy/The Game - C06 Pole bitwy odswiezenie (1E).dc.html`; kanon zaktualizowany (CANON.md); nota dla integratora: `brand-book/DESIGN-do-UI_POLE-BITWY-TW-v5.md`.
- [2026-07-01] Utworzono ten plik dyspozycji. Czekam na polecenia.
- [2026-07-01] **Do Agenta UX:** Cześć. Design System **1E (Painted Imperial)** jest gotowy — Brand Book, 50 ikon (Tier 1–5), komplet ekranów (menu→koniec), komponenty, motion, eksport (tokeny + 14 SVG + HANDOFF). Wszystko w `brand-book-1E/`, wejście: `The Game — Przegląd (1E).dc.html`. Backlog w sekcji 3. Pisz dyspozycje w sekcji 5 — odpowiadam tutaj.
- [2026-07-01] **Przyjęte: KANON.** Ścieżki w projekcie zaktualizowane do `brand-book/`. Uwaga techniczna: nie mogę zapisywać wprost na dysk `C:\` — zapisuję w projekcie. Żeby pliki lądowały w kanonie bez ręcznego przenoszenia potrzebny **GitHub** (commit → `git pull`). Do decyzji Macieja/UX.

---

## 7. Log zmian (append-only)
- 2026-07-23 · **DRZEWKO TECHNOLOGII — SIATKA v1.1** ✅ KANON — werdykt Macieja: krawędzie NIECZYTELNE → usunięte wszystkie linie/strzałki/mostki + badge przecięć + legenda krawędzi; drzewko = siatka węzłów w pasmach epok, zależności OPISOWO (powody blokad na węzłach, AND ✓/✗ na karcie węzła); ścieżka do X = podświetlenie węzłów. Karty węzłów BEZ ikon epok — tylko nazwa odkrycia (uwaga Macieja; docelowo, osobnym zleceniem: ikona per technologia). Plik: `KANON/mockupy/The Game - Drzewko technologii siatka v1.1 (1E).dc.html`; graf v1 = stare. + STANDALONE inline (vendored runtime w jednym pliku) na problem proxy/unpkg.
- 2026-07-23 · **DRZEWKO TECHNOLOGII — GRAF v1** (Zlecenie 3, TURA 2) — nowy ekran grafu całego drzewa: 32 technologie 1:1 z `gra/data/tech.json` (oś liniowa Poziom 1–9, pasma Kamień|Brąz|Żelazo), 4 stany węzłów (odkryta/dostępna/w trakcie z pierścieniem %/zablokowana z powodem), krawędzie magistralowe per-źródło + korytarz międzyepokowy, minimalizacja przecięć (permutacje per gutter) + MOSTKI na rezydualnych przecięciach (jednoznaczność 100%, badge z licznikiem), klatka B: karta węzła ×3 stany, klatka C: zoom/pan + pasek epok + minimapa + ścieżka do „Sztuka wojenna". Plik: `KANON/mockupy/The Game - Drzewko technologii graf v1 (1E).dc.html`. „Ekran Badania" zostaje jako panel wyboru badań.
- 2026-07-23 · **PORTRETY WŁADCÓW — Kamień + Brąz** ✅ — 30 portretów (15 cywilizacji × 2 epoki, MJ wg SPEC-PORTRETY-WLADCOW-MJ.md) pokrojone z arkuszy, kwadraty pod medalion (kadr 5% od góry komurki) + wersje pełne w `eksport/portraits/full/`. Nowe: `eksport/portraits/` · `eksport/portrait-map.json` (civ × epoka → plik; żelazo TODO; fallback = ikona cywilizacji) · `eksport/portraits-preview.html` (medaliony 1E, warianty obłódek Ty/wróg). Paczka: `_dist/PORTRETY-WLADCOW-2026-07-23`.
- 2026-07-23 · **PRE-BATTLE — nakładka na mapie v1.1** ✅ KANON — dopracowanie makiety v1 Macieja/integratora (DO-DESIGN-2026-07-23): panele ~75% + backdrop-blur (mapa świata czytelna), kanoniczne CTA (złoty primary #f0dc88→#b99a28, czerwony Wycofaj, hover-glow), pasek szans jak w TW-v5 (gradient + złoty marker), znacznik hexa miasta w klatce B, pulsowanie znaczników, kbd-chipy skrótów + badge 1/2 na kartach Oblegaj/Szturm. 3 klatki w 1 pliku: `KANON/mockupy/The Game - PreBattle nakladka v1.1 (1E).dc.html`. Stary pełnoekranowy C-01 Pre-bitwa v3 = zastąpiony. Zlecenie 2 (eksport/) dosłane w paczce.
- 2026-07-23 · **DYPLOMACJA — panel negocjacji v1.1** ✅ ZATWIERDZONA DO KANONU — makieta Macieja (TW:WH3-adapt) + poprawki logiczne/stylistyczne: spójne blokady „wymaga X (masz Y)" (Sojusz obronny i Żądanie trybutu zablokowane zgodnie z wartościami), Umowa handlowa oznaczona „już zawarta", relacje renderowane raz (karta rozmówcy „Relacje z Tobą"), u gracza Skarbiec, bilans oferty Zyskujesz/Oddajesz + „zwrot po 5 turach", tło granat 1E, złoty primary #f0dc88→#b99a28, hovery. Plik kanonu: `KANON/mockupy/The Game - Dyplomacja panel negocjacji v1.1 -1E-.dc.html` (stara „Ekran Dyplomacja" zostaje jako lista frakcji).
- 2026-07-23 · **POLE BITWY — TW v5** ✅ — nowy kanon pola bitwy wg WYTYCZNE v5 (styl TW:WH3, roster w LEWYM pionowym panelu — żelazna zasada). Jeden plik, 6 klatek: bitwa ręczna / AUTO (roster ukryty) / rozstawianie + C-23 Szczegóły bitwy v2 (2 kolumny, Zniszczone #ff7b7b / Rozbite #ffd54a / Ocalałe #7ad0a0) + C-12 Koniec bitwy (Zwycięstwo/Porażka + hint „ta sama armia · pełne HP") + C-09 v5 stany kart (pusty slot / rout 50% / martwa 40%) z tooltipem. Nowe elementy TW: portrety dowódców z pierścieniem HP, zegar bitwy (Georgia), pasek przewagi ze złotym znacznikiem, banery nad oddziałami (chorągiewka + HP/morale + maszt, medalion dowódcy grupy), bogaty tooltip (Postawa/Świeżość/Grupa + Zdrowie/Morale/Wigor/Amunicja + efekty terenu), tempo+pauza+AUTO przy minimapie, ustawienia (muzyka/dźwięk/pomoc) pod kołem zębatym obok „Wycofaj się". Oprawa: panele ~70% + blur, toolbar ikonowy wyśrodkowany, wszystkie ikony z podpisem na hover. DECYZJE Macieja: strzałka „↓" przy „Ty" USUNIĘTA; cluster liczb NIE lustrzany. Zastępuje wizualnie: C06 v4 / C07 v2 / C23 v1 / C12 v3.
- 2026-07-05 · **POLE-BITWY v5 GAP** ✅ — GAP-01 C-23 Szczegóły bitwy (pełnoekranowy, 2 kolumny, Zniszczone/Zrootowane/Ocalałe), GAP-02 C-12 Koniec bitwy v3 (Zwycięstwo/Porażka/podpowiedź + 3 przyciski), GAP-03..06 popupy deploy (Formacja/Konnica/Linie/Taktyka v2 Obrona-Atak-Szturm-Ostrzał). Paczka `POLE-BITWY-v5-gap-2026-07-05.zip`. P2/P3 (GAP-07..10) — kolejny START.
- 2026-07-04 · **POLE-BITWY poprawki v4.1** ✅ — popup Strategia w 1E (nowy `C06 Popup Strategia v4`): dropdowny w złotej szacie (koniec z granatowym stylem przeglądarki), mini-medaliony typów, scroll 1E, sticky „Skopiuj z priorytetów armii". Notatki dla lane: top-bar cluster gap, nagłówki grup „Grupa N · liczba", puste sloty. ZIP: POLE-BITWY-poprawki-v4.1-2026-07-04.
- 2026-07-04 · **C01-v3-sync-kanon — SIGN-OFF** ✅ — sync mockupu C-01 Pre-bitwa v3 z kanonem preBattle.ts. Wszystkie elementy zgodne (medaliony #3a6ad0/#c84040, roster SVG, szansa % + pasek + modyfikatory ▲/▼, VS, 3 przyciski). Zero luk, zero emoji. Meldunek `DESIGN-do-UI_C01-v3-sync.md`. Mockup = zamrożona referencja, lane nie portuje.
- 2026-07-04 · **POLE-BITWY-HUD-v4** ✅ — wg spec MASTER (GitHub). C06 v4 (3 klatki: Deploy/AUTO/R+roster, rail 56px ×3, pasek mocy poziomy, minimapa, dolny toolbar, popup Taktyka, Start walki czerwony CTA), C09 v4 (lewy roster 368px w kontekście mapy + mini-klatka scroll >30 kart). Karta: SVG+HP+morale+badge+obwódka niebieska+martwy/routed. Zero emoji. Handoff + MANIFEST. ZIP: POLE-BITWY-HUD-v4-2026-07-04.
- 2026-07-04 · **C04-C05-A19 oblężenie mapa świata** ✅ — 3 modale: C-04 Atak na miasto (Oblężaj/Szturm, karty + skróty), C-05 Panel oblężenia (mapa w tle + panel prawy + machiny), A-19 Miasto zdobyte (pusty garnizon, SVG zamiast 🏛). Zero emoji, kolory akcji wg briefu (Oblężaj #c87840 / Szturm #3a6ad0). Handoff `DESIGN-do-UI_C04-C05-A19-v2.md`.
- 2026-07-04 · **C04-C05 mapa-v2** ✅ — potwierdzone jako HUD-only wokół placeholdera pola 3D (bez malowanych murów/pola, spójne z C-06 v4/C-07). C-04 Oblężenie: górny pasek, integralność murów (L), siły oblężnicze (P), akcje Ostrzał/Czekaj/Szturm. C-05 Szturm muru: punkty szturmu (L), obrona muru (P), akcje Drabiny/Wieża/Szturm przez wyłom.
- 2026-07-04 · **W3 v3.1b — sign-off** ✅ — (A) Surowce = stopka kolumny (ikona+nazwa only, wspólna pod każdą zakładką), Spichlerz bez surowców w środku karty. (B) Menu gry (☰): Wróć do gry/Zapisz/Wczytaj/Nowa gra/Menu główne; Esc→mapa świata (nie modal Pauza); Wiki = osobny przycisk toolbar. Handoff `DESIGN-do-UI_miasto-w3-v3.md` sekcja v3.1b.
- 2026-07-03 · **W3-miasto v3** ✅ — nowy `Ekran Miasto W3 v3 (1E)`, 4 klatki (Spichlerz/Wzrost, Budowa, chrome mapy 3D, Esc) odwzorowane 1:1 z playtestu (screeny baseline w repo). Uwaga: baseline gry UŻYWA „/t" — v3 trzyma „/t" (rewert wcześniejszego usunięcia). Rail 7 medalionów, „i SZCZEGÓŁY", slider Wzrost↔Armia, stopka „Surowce w zasięgu".
- 2026-07-03 · **Miasto Zakładki W3 v2 — przebudowa 1:1 ze screenshotami** ✅ — po imporcie 8 screenów z repo (GitHub): rail 7 medalionów, każda klatka z tytułem + „i szczegóły", pigułkami, suwakami i stopką „Surowce w zasięgu" (Bydło/Glina/Koń/Sól). Zawartość zgodna z grą: Wzrost ludności (Netto/Bufor, suwak Wzrost↔Armia), Podział handlu (Skarb/Nauka/Zamożność/Korupcja + 3 suwaki + Zamożność), Podział pracy (suwak 70/30 Miasto↔Pula), Porządek (Szczęście/Prawo/Łącznie 58% + baner Napięcie), Zdrowie (Plusy/Minusy), Kultura (0/100, granice), Religia (kult 100%). Zero emoji. Plik `Miasto Zakładki W3 v2 (1E)`.
- 2026-07-03 · **Miasto Zakładki W3 v2** ✅ — 7 klatek prawego panelu w stylu 1E (SVG, suwak podziału handlu, kropki przydziału pracy, typografia), wspólna stopka „Surowce w zasięgu" na każdej klatce. Zastępuje cz1/cz2 (przestarzałe). Semantyka do potwierdzenia ze screenshotami baseline. Plik `Miasto Zakładki W3 v2 (1E)`.
- 2026-07-03 · **C-01 Pre-bitwa v3 — ZATWIERDZONA** jako kanoniczny pre-battle (zastępuje v2). Powód (Maciej): kolumny rosteru skalują się przy większych/różnorodnych armiach; medaliony dowódców gotowe pod system generałów (nazwiska liderów wojsk). Plik `The Game - C01 Pre-bitwa v3 (1E).dc.html`. v2 pozostaje jako archiwum.
- 2026-07-03 · **C-05 Szturm muru v2** ✅ — HUD szturmu wokół pola 3D: górny pasek (Szturmujący niebieski VS Obrońcy muru czerwony + paski), lewy panel punkty szturmu (wyłom bramy aktywny, drabiny, wieża oblężnicza), prawy panel obrona muru (obrońcy/olej/łucznicy), dolny pasek akcji (Drabiny / Wieża / Szturm przez wyłom). Domyka Grupę C (walka). Plik `C05 Szturm muru v2 (1E)`.
- 2026-07-03 · **C-04 Oblężenie v2** ✅ — HUD oblężenia wokół pola 3D: górny pasek (Oblężenie Kapui, Oblegający niebieski VS Garnizon czerwony), lewy panel integralność murów (42%, wyłom, −8%/turę), prawy panel siły oblężnicze (katapulty/tarany/piechota + garnizon), dolny pasek akcji (Ostrzał / Czekaj / Szturm). Plik `C04 Oblezenie v2 (1E)`.
- 2026-07-03 · **C-12 Koniec bitwy v2** ✅ — ekran zwycięstwa: emblemat wieńca, „ZWYCIĘSTWO" (Georgia), 3 karty statystyk (straty własne niebieskie / straty wroga czerwone / łupy złote), pas „Bohater bitwy" z awansem, akcje Szczegóły / Powrót do mapy. Styl 1E. Plik `C12 Koniec bitwy v2 (1E)`.
- 2026-07-03 · **C-09 Karty jednostek v2** ✅ — układ w stylu Total War: roster 3 rzędy, kolejność konnica (niebieski) → piechota (złoty) → łucznicy (bursztyn), mini-karty z ikoną/HP/paskiem; po lewej karta wybranej jednostki ze statystykami (atak zwarcie, bonus szarży, obrona, pancerz, morale, prędkość). Plik `C09 Karty jednostek v2 (1E)`.
- 2026-07-03 · C-07 poprawki: minimapa/tooltip odsunięte od pasków morale; usunięty duplikat prędkości (panel C-10) — zostaje tylko badge ×4 w górnym pasku, nie zasłania etykiety ATK.
- 2026-07-03 · **C-07 Pole HUD bitwy v2** ✅ — HUD fazy walki wokół pola 3D: C-08 góra (Tura ×4, morale ATK niebieski VS OBR czerwony, straty, Pomiń/Wyjście), C-10 prędkość, C-11 log Ostatnie starcia (3 wpisy), C-12 pionowe paski morale boki, C-17 minimapa, C-18 tooltip jednostki, C-09 dolny pasek komend zaokrąglony (P/S/R/STOP/W/H/M/POMIŃ/ESC, SVG bez emoji). Plik `C07 Pole HUD bitwy v2 (1E)`.
- 2026-07-03 · **C-06 Deployment v2 (rev)** ✅ — poprawka wg uwagi: pole = render 3D (placeholder, bez zmian), zaprojektowana tylko OPRAWA HUD 1E: górny pasek (Przygotowanie ×32, ATK vs OBR, Pomiń/Wyjście), lewy panel prędkość/wiek + pasek HP, Ostatnie starcia, minimapa, panel zaznaczonych (40, HP/atak/obrona, Stój/Wyc/Grupuj/F1-3), centralny panel Faza rozstawiania (F1/F2/F3 + Reset/Grupuj/Start walki), dolny pasek sterowania (P/R/Stop/H/M/Pomiń/ESC). Plik `C06 Deployment v2 (1E)`.
- 2026-07-03 · **C-06 Deployment v2** ✅ — pole z góry (lewa strefa ATK jaśniejsza + siatka heksów, prawa mgła wojny, złota linia środkowa), etykiety Twoja/Wroga strefa, rozstawione żetony + puste sloty; dolny panel 1E: Faza rozstawiania + hint, formacje F1 Dystans / F2 Melee / F3 Oblężenie (SVG), akcje Reset / Grupuj / Start walki (primary). Plik `C06 Deployment v2 (1E)`.
- 2026-07-03 · **C-02 Rozstawienie v2** ✅ — plansza rozstawienia: strefy (obrońca góra / gracz dół), żetony wroga, podświetlone sloty gracza, lewy panel jednostek do rozstawienia (drag), prawy panel taktyki/terenu, akcje Wstecz / Losowo / Rozpocznij bitwę. Plik `C02 Rozstawienie v2 (1E)`.
- 2026-07-03 · **C-01 Pre-bitwa v2** ✅ — redesign UI walki (Grupa C, ekran 1): dwie strony (Rzym atakujący / Kapua obrońca) z listą jednostek, środkowa prognoza (68% szansy), modyfikatory (przewaga/mury/wyżyna), akcje Wycofaj / Rozegraj ręcznie / Atakuj-auto. Styl 1E, bez emoji. Plik `C01 Pre-bitwa v2 (1E)`.
- 2026-07-03 · **W3-miasto zawartość cz.2** ✅ — `Miasto Zakładki W3 cz2 (1E)`: Spichlerz (magazyn+bilans żywności), Praca (przydział obywateli), Kultura (granice+źródła), Religia (kult+wiara). Komplet 9/9 zakładek railu.
- 2026-07-03 · **W3-miasto zawartość** ✅ — `Miasto Zakładki W3 (1E)`: treść zakładek railu — Rekrutacja (jednostki+staty), Handel (dochód+szlaki), Porządek (zadowolenie+czynniki), Zdrowie (zdrowotność+wzrost).
- 2026-07-03 · **W3-miasto** ✅ — nowy `Ekran Miasto W3 (1E)`: 9-medalionowy rail (budowa, rekrutacja, spichlerz, handel, praca, porządek, zdrowie, kultura, religia), dim opaque, górny pasek zasobów + zielony Wiki + X. Centrum: produkcja + budowle; prawy panel szczegółów.
- 2026-07-03 · **szata-sync Ekran Miasto** ✅ — dim opaque (mapa + dolny chrome ukryte), górny pasek + zielony przycisk Wiki widoczne. Domyka szata-sync 2026-07-03.
- 2026-07-03 · **szata-sync cd.** ✅ — nowy plik `HUD Panele stany (1E)`: klatki C0 (pusty/ukryty), C1 (heks — zasoby pola, ulepszenia), C2 (jednostka — HP/ruch/staty) + panel **Wiki 340px** (zielony #a8c878, szukaj + kategorie: budynki/jednostki/technologie/tereny).
- 2026-07-03 · **szata-sync** ✅ — HUD Mapy layout zaktualizowany do stanu gry: usunięto banery liderów (D16=A) i stały placeholder kontekstowy (D17=A), dodano przycisk Wiki (#a8c878) + `ui-wiki.svg`, Wydarzenia przesunięte nad stos tury (bottom:172px), toolbar 5 medalionów. HANDOFF: sekcja „Szata sync 2026-07-03".
- 2026-07-03 · **HUD Mapy — layout (1E)** ✅ zatwierdzony. Pełny ekran gry 1920×1080: strefy stałe (A pasek zasobów, A2 MOC centralnie, A3 epoka/menu, B toolbar, D banery liderów, E minimapa, G Wykonaj/Zakończ turę), kontekstowe (C panel wyboru, F akcje jednostki), tymczasowe (H Wydarzenia). Plik `The Game — HUD Mapy layout (1E).dc.html`. Dla Cursora: to docelowy rozkład HUD mapy — zastępuje luźny HUD Kit.
- 2026-07-02 · **EKRANY HERO — dyspozycja dla Cursora.** Menu Hero + Intro Hero (bez opisu) + `assets/hero-menu.png`, `assets/hero-intro.png`. Zastępują dotychczasowe menu i intro. Kroki kreatora 2–5 bez zmian.
- 2026-07-02 · **Ekran Menu Hero** — nowy wariant menu: kolumna menu po lewej (ciemne tło), grafika hero (`assets/hero-menu.png`) po prawej z gradientem-przejściem w czerń. Plik `The Game — Ekran Menu Hero (1E).dc.html`. Wymaga `brand-book/assets/hero-menu.png`.
- 2026-07-02 · **PODMIANY DO WDROŻENIA (dla Cursora)** — najnowsze wersje w `brand-book/eksport/`:
  | Element w grze | Podmień na plik |
  |---|---|
  | Emblemat kółka na ekranie „NOWA GRA"/kreator (intro) | `eksport/icons/menu-emblem.svg` (gwiazda) — podmienić TYLKO wewnętrzny SVG, ramka/glow bez zmian |
  | Epoka Kamienia (krok 2) — kłos/litera | `eksport/icons/epochs/epoch-kamien.svg` (młot bojowy, bez ziemi) |
  | Epoka Brązu | `eksport/icons/epochs/epoch-braz.svg` (miecz liściasty) |
  | Epoka Żelaza | `eksport/icons/epochs/epoch-zelazo.svg` (skrzyżowane miecze) |
  | Cywilizacja Rzymianie | `eksport/icons/civilizations/civ-rzymianie.svg` (tarcza scutum) |
  | Cywilizacja Chińczycy | `eksport/icons/civilizations/civ-chinczycy.svg` (mianguan) |
  | Cywilizacja Sumerowie | `eksport/icons/civilizations/civ-sumer.svg` (ziggurat) |
  | Ustawienia krok 4 (litery Tr/Mx/Sw/Tp/MP/Cy) | `eksport/icons/settings/sett-*.svg` wg `setting-icon-map.json` |
  | Miasta-państwa (ustawienia) | `eksport/icons/settings/sett-city-states.svg` (plan miasta z góry) |
  Zasada: podmiana samego SVG w istniejących medalionach; nie ruszać map JSON poza wymienionymi.
- 2026-07-02 · **W1f** ✅ — 6 ikon ustawień kreatora (krok 4): `eksport/icons/settings/` sett-difficulty (waga), sett-map-size (heksy+zoom), sett-world-type (glob), sett-game-speed (klepsydra), sett-city-states (kolumna+proporzec), sett-civ-types (3 kółka) + `setting-icon-map.json`. Epoki/cyw/mapy nietknięte.
- 2026-07-02 · **W1e-rev3** ✅ — epoch-kamien = kłos pszenicy (rewolucja agrarna), epoch-braz = miecz liściasty, epoch-zelazo bez zmian; civ-rzymianie = tarcza scutum (umbo + grzbiet), civ-chinczycy = mianguan (cienka długa deska, frędzle przód/tył równe). Mapy JSON nietknięte.
- 2026-07-02 · **W1e-rev** ✅ — epoch-kamien = młot kamienny (nie namiot), epoch-braz = jeden miecz liściasty (nie ingot), epoch-zelazo bez zmian. Mapa i pozostałe pliki nietknięte.
- 2026-07-02 · **W1b-rev2** ✅ — civ-sumer przerysowany: schodkowy ziggurat (3 tarasy + centralne escalinatas ze stopniami + kapliczka na szczycie). Tylko ten 1 plik; reszta ikon i mapy nietknięte.
- 2026-07-02 · **W1b-rev + W1e** ✅ — civ-sumer poprawiony na ziggurat (nie piramida). Nowe ikony epok: `eksport/icons/epochs/` (epoch-kamien=osada, epoch-braz=ingot+trzon, epoch-zelazo=miecze) + `epoch-icon-map.json` (klucze kamien/braz/zelazo, osobny rejestr). HANDOFF: sekcja Epoki. civ-icon-map + icons-manifest nietknięte.
- 2026-07-02 · **W1b** ✅ — medaliony cywilizacji (3C line, jak kreator, NIE monogramy): `eksport/icons/civilizations/` 15 + `civ-default` (@24) + `civ-icon-map.json`. Preview `civ-icons-preview.html`. HANDOFF zaktualizowany. Wizualna weryfikacja OK (grecy=świątynia, rzymianie=wieniec, chinczycy=pagoda, inkowie=słońce, zulusi=tarcza, egipt=piramida, sumer=zikkurat, celtowie=triskelion, germanie=topór, harappa=byk, hetyci=dwugłowy orzeł, słowianie=kołowrót, babilonia=brama, asyria=lamassu, fenicjanie=okręt).
- 2026-07-02 · **Dyspozycja 15 SVG menu** ✅ — `eksport/icons/menu/` 15 id × (24+40) = 30 plików: 7 z mockupu (play, campaign, multiplayer, settings, more, exit, emblem-mini) + 8 nowych (load, save, credits, language, audio, controls, achievements, info). Dopisane do `icons-manifest.json` (tier menu) + `menu-icons-preview.html`. Weryfikacja wizualna OK.
- 2026-07-01 · **PACZKA FINAL** ✅ — eksport Tier 3–7 (24/40), buildings(13)/units(12)/improvements(10)/resources-map(6) @24, menu-emblem, 3 manifesty (icons-manifest, building-icon-map, unit-icon-map), 4 CSS (tokens+menu-background+motion+menu-components), HANDOFF ekran→plik camelCase. ~160 SVG. DESIGN ZAMKNIĘTY.
- 2026-07-01 · Poprawka handoff: mapa ekran→plik na `gra/src/ui/*.ts` (nie `.tsx`). DYSPOZYCJA = DONE + „Design zamknięty" potwierdzone. Paczka finalna do integracji.
- 2026-07-01 · **DESIGN ZAMKNIĘTY.** Nawigacja domknięta: „← HUD" (Miasto, Walka), „← Przegląd" (Menu, Koniec Gry), HUD menu→Przegląd. HANDOFF.md v2 + changelog. DYSPOZYCJA = all DONE. Dostawa: folder `brand-book/` w korzeniu zip.
- 2026-07-01 · `eksport/HANDOFF.md` → **v2**: mapa ekran→plik TS, semantyka bez pergaminu (Dyplomacja=uścisk dłoni), tokeny FROZEN, warianty ikon tier1/tier2 24/40. 2C + D1-2 + D1-5 potwierdzone w plikach.
- 2026-07-01 · 2C dokończone: „← Przegląd" na Kreator Kroki + Walka Warianty (pozostałe ekrany flow mają już nav / „← HUD").
- 2026-07-01 · MUST domknięty: D1‑2 (linki prototypu — done), D1‑5 (Badania wg tech.json + Wojsko — done), **D1‑6 HANDOFF v2** (mapa ekran→komponent TS + zasady integracji), **D1‑7 freeze tokens** (tokens.css/json oznaczone FROZEN v1.0). Paczka gotowa do integracji.
- 2026-07-01 · Tura 2C ✅ back-linki „← Przegląd" na ekranach‑dokumentach z kafelków: Design System v1, Ikony (biblioteka), Komponenty (Motion + Koniec Porażka miały już wcześniej; ekrany flow mają własną nawigację + „← HUD").
- 2026-07-01 · START D1‑4 ✅ Tier 2 SVG 5×2 → `eksport/icons/tier2/`: tb-cities, tb-science (=res-science), tb-diplomacy (uścisk dłoni), tb-army, tb-build (=res-work). 40px sw2 + 24px sw1.5.
- 2026-07-01 · [Design] Tura 2 A/B/C = DONE (w paczce). START D1‑3 ✅ Tier 1 SVG 9×2 → `eksport/icons/tier1/` (40px sw2 + 24px sw1.5): food, work, treasury, science, culture, religion, population, influence, settlements.
- 2026-07-01 · **[Design] → [Cursor]: odpowiedź ws. paczki.** W projekcie folder `brand-book/` jest KOMPLETNY: 20× `.dc.html` (hub Przegląd + wszystkie ekrany E + Badania + Wojsko), `support.js`, `DYSPOZYCJA.md`, `HANDOFF-CLAUDE-CODE.md`, `eksport/` (`tokens.css`, `tokens.json`, `HANDOFF.md`, `icons/` = 34 SVG w tym `tb-diplomacy.svg`).
  - **Diagnoza:** pobrany „Ulepszenie infografik.zip" = nazwa PROJEKTU → poprzednia karta pakowała cały projekt, nie sam folder. Teraz wygenerowana paczka pakuje **tylko `brand-book/`**.
  - **Do zrobienia po Waszej stronie:** pobrany plik zapisać jako `docs/ux/claude-design/_staging/inbox/brand-book.zip` (jeśli pobierze się pod nazwą projektu — zmień nazwę na `brand-book.zip`). W środku ma być bezpośrednio zawartość folderu `brand-book/` (nie zagnieżdżony projekt).
  - Uwaga: zapis do repo/dysku jest po Waszej stronie — to środowisko ma GitHub tylko do odczytu.
- 2026-07-01 · Hub domknięty o kafelki: Badania · drzewko, Wojsko · armie.
- 2026-07-01 · D1‑5 ✅ ekran Badania (drzewko wg tech.json z repo: Kamień K0–K1 + Brąz B0–B3, koszty/prereqi) + ekran Wojsko (lista armii I Legion / II Kawaleria + panel jednostki). Nowe: `The Game — Ekran Badania (1E).dc.html`, `The Game — Ekran Wojsko (1E).dc.html`.
- 2026-07-01 · [Design] Tura 2 A/B/C potwierdzone jako GOTOWE (A uścisk dłoni HUD=SVG, B porażka #c84040 + link huba, C back-linki ← Przegląd/HUD). Wygenerowano `brand-book.zip` do pobrania. GitHub tu jest read-only — commit/push po stronie Cursora.
- 2026-07-01 · D1‑4 ✅ eksport SVG domknięty: +7 (chip-crate, chip-map, chip-trend-up, chip-death, chip-garrison, chip-manpower, dip-peace). Razem 34 ikony w `eksport/icons/`.
- 2026-07-01 · D1‑4 (część 2): +6 ikon SVG (ui-denied, ui-accepted, dip-war, chip-warning, chip-heart, chip-star). Łącznie w `eksport/icons/`: core Tier 1–2 + waga/kaduceusz + 13 UI/chip/dip.
- 2026-07-01 · D1‑4 (część): eksport 7 ikon UI/meta do `eksport/icons/` (ui-menu, close, play, pause, check, lock, end-turn). Reszta Tier 3–5 do dokończenia.
- 2026-07-01 · D1‑2 ✅ domknięte: HUD toolbar Dyplomacja → ekran Dyplomacji; baner miasta → Panel miasta; Dyplomacja → back‑link HUD.
- 2026-07-01 · D1‑2: HUD baner miasta → link do Panelu miasta.
- 2026-07-01 · D1‑2 (część): Dyplomacja → back‑link „← HUD". CZĘŚĆ E: tura 2 A→C zamknięta.
- 2026-07-01 · Sync: BEZ GitHub — Maciej po turze pobiera `brand-book/` do OneDrive. Moja rola = zapis w projekcie + log.
- 2026-07-01 · TURA 2 A→C GOTOWE: A uścisk dłoni (HUD=SVG), B E‑15b `#c84040` + link huba, C back‑linki „← Przegląd" (Koniec Porażka, Motion). Ekrany z własną nawigacją (Menu/Kreator/HUD/Miasto/Dyplomacja/Walka) mają przepływ krok‑po‑kroku.
- 2026-07-01 · TURA 2: A ✅ HUD toolbar dyplomacja = identyczna geometria co `eksport/icons/tb-diplomacy.svg` (uścisk dłoni). B ✅ E‑15b akcent `#c84040` + link z huba. C ✅ Koniec Porażka: back‑link „← Przegląd". C ⏳ back‑linki dla Motion / Kreator Kroki / Walka Warianty — następna tura.
- 2026-07-01 · SESJA AUTONOMICZNA — decyzje UX: **Dyplomacja = uścisk dłoni** (revert z pergaminu), E‑15b = `#c84040`, zero emoji.
- 2026-07-01 · D1‑1 ✅ hub domknięty (kafelki: Kreator Kroki, Walka Warianty, Motion, Koniec Porażka).
- 2026-07-01 · D1‑3 ✅ dyplomacja→uścisk dłoni w bibliotece + Brand Book + `eksport/icons/tb-diplomacy.svg`. ⚠ HUD toolbar (inny wariant) — do dokończenia.
- 2026-07-01 · ⚠ D1‑7 (commit do kanonu na dysku) wymaga podłączenia GitHub — niewykonalne z mojej strony bez autoryzacji.
- 2026-07-01 · START: dodano wariant **porażki** końca gry — `brand-book/The Game — Koniec Porażka (1E).dc.html`.
- 2026-07-01 · Na prośbę UX: folder `brand-book-1E/` → `brand-book/` (jeden folder). Wejście: `brand-book/The Game — Przegląd (1E).dc.html`.
- 2026-07-01 · Utworzono `brand-book-1E/` i przeniesiono wszystkie pliki 1E + eksport.
- 2026-07-01 · Zbudowano A–E: prototyp, kroki kreatora, warianty walki, eksport, motion.
- 2026-07-01 · Komplet ekranów + Brand Book + biblioteka 50 ikon (1E).
