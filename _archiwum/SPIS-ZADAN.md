# „The Game" — SPIS ZADAŃ (zrobione + do zrobienia)

> 2026-06-21. Źródło prawdy = ten folder (`…\_NOWA_STRUKTURA\…\Civ`). Spis pełny, pogrupowany 1 → A/B/C, do przydziału między sesje.
> Dokumenty bazowe: `PLAN-UKONCZENIA-PROJEKTU.md`, `ARCHITEKTURA-PLIKI.md`, `PROJEKT-GRY-master.md`.
> Legenda: ✅ zrobione · 🟡 częściowo · ⬜ do zrobienia. Odnoś się do zadań po kodzie (np. „weź 8F").
>
> **Najważniejszy wniosek:** silnik (combat/economy/ai/diplomacy) jest w większości **napisany jako moduły**, ale **pętla tury w `main.ts` go nie wywołuje** — patrz grupa 13 (Integracja). To jest główne wąskie gardło.

---

## 1. Fundament, architektura, pipeline danych
- **1A** ✅ Stack: TypeScript + Vite + Three.js; rdzeń (logika) oddzielony od renderu — zdecydowane i działa.
- **1B** ✅ Pipeline danych Excel→JSON (`tools/export-data.py`); silnik czyta JSON (`loader.ts`), nie xlsx.
- **1C** ✅ Build single-file `Gra-podglad.html`; smoke test (`tools/smoke.cjs`) przechodzi.
- **1D** ✅ Deterministyczny PRNG (mulberry32, seed) — ta sama mapa z tego samego seeda.
- **1E** ✅ D1 rozstrzygnięte: folder Civ = źródło prawdy (nie konsolidujemy do v0.1).
- **1F** 🟡 Schemat GameState — częściowy (mapa/jednostki/miasta minimalne); brak pełnego (gracze, nauka, dyplomacja, magazyny w runtime).
- **1G** ⬜ Save/load: serializacja GameState → JSON, localStorage, autozapis co N tur.
- **1H** ⬜ Domknąć decyzje: format zapisu, lista warunków zwycięstwa.

## 2. Mapa, teren, generator
- **2A** ✅ Generator hex (axial) + value-noise fBm (kontynenty), klasyfikacja terenu, rzeki deterministyczne.
- **2B** ✅ Dane terenu: plony (`terrain-yields`), koszty ruchu (`terrain-movement`), modyfikatory walki (`terrain-combat`).
- **2C** ⬜ Rozmiary mapy konfigurowalne (Mała/Średnia/Duża/Ogromna).
- **2D** ⬜ Voronoi → 7 regionów typów głównych (+ podregiony pobocznych).
- **2E** ⬜ Klastry startowe (1 gracz + ~10 rywali tego typu, Poisson-disk, min. dystans 5) + wioski startowe.
- **2F** ⬜ Złoża per teren (ruda→wzgórza/góry, glina→łąka/rzeka, konie→równiny, węgiel→góry).
- **2G** ⬜ Balans startowy (porównywalny dostęp do żywności/surowców) + korekta spec 5→7 typów.

## 3. Render 3D, kamera, mgła wojny
- **3A** ✅ Scena Three.js, siatka heksów, oświetlenie, render terenu.
- **3B** ✅ Kamera (pan/zoom), raycast wyboru heksa, podświetlanie zasięgu ruchu + podgląd ścieżki.
- **3C** ✅ Mgła wojny (3 stany) wpięta (klawisz F), zasięg widzenia (domyślnie 3).
- **3D** ✅ Render jednostek: proceduralne figurki 3D (hełmy, bronie, konie…), kolory graczy, paski HP.
- **3E** ✅ Animacja ruchu jednostki po ścieżce (Dijkstra, koszt terenu).
- **3F** ⬜ Modele low-poly terenu/budynków z katalogu assetów (zamiast proceduralnych) — opcja.
- **3G** ⬜ Granice terytorium cywilizacji (overlay) + minimapa funkcjonalna + warstwa rzek (wizual).

## 4. Jednostki (dane + render)
- **4A** ✅ 38 jednostek (`Jednostki.xlsx`/`units.json`): Atak/Uderzenie/Obrona/Pancerz/Przebicie/Health/Morale/Ruch/zasięg/pociski/kary flanki/rola.
- **4B** ✅ Epoki Kamień+Brąz; zamienniki cywilizacyjne (7 cyw.) + 7 super-jednostek (koszt 0, max 1, respawn w stolicy).
- **4C** ✅ Render proceduralny per typ (`src/render/units.ts`) + 12 renderów PNG (galeria, klawisz G).
- **4D** ⬜ Jednostki epok Żelazo+ (brak w danych).
- **4E** ⬜ Uzupełnić super-jednostki 6/7 cyw. („do zaproponowania") + Egipt/Sumerowie.
- **4F** ⬜ Korekty balansu (Legionista/Falanga OP — wg `Macierz-walki-analiza.md`).
- **4G** ⬜ Robotnik: ulepszenia terenu (dziś bez funkcji).

## 5. Ekonomia i surowce
- **5A** ✅ Moduł `economy.ts` KOMPLETNY: plony pól, mnożniki budynków, korupcja, suwak Handel→Nauka/Pieniądz/Luksus, wzrost ludności, produkcja, magazyny.
- **5B** ✅ Parametry `econ-params.json` (progi wzrostu, pojemności ×5, korupcja, utrzymanie, mnożniki) — 3 poziomy trudności.
- **5C** ✅ 14 surowców (`resources.json`) + łańcuchy (drewno→deski/paliwo, ruda+paliwo→brąz), hodowla.
- **5D** ⬜ **WPIĘCIE `economy.ts` w pętlę tury** (dziś nie wywoływane co turę) ← kluczowe.
- **5E** ⬜ Magazyny ilościowe w runtime + przepełnienie + transfer między miastami.
- **5F** ⬜ Utrzymanie jednostek/budynków pobierane co turę; skarbiec centralny w stolicy (utrata = 0).
- **5G** ⬜ Mnożniki waluty ×100 (Bankowość) i ×1000 (Energia) + inflacja.
- **5H** ⬜ (v0.2+) Popyt/podaż — dynamiczne ceny (tylko zaprojektowane).

## 6. Miasta, ludność, społeczeństwo
- **6A** ✅ Zakładanie miasta (`cities.ts`, klawisz B, min dystans 5), nazwa, populacja.
- **6B** ✅ Modele zdrowia/szczęścia/kultury/religii sparametryzowane (`society-params.json`) + logika plonów/wzrostu w `economy.ts`.
- **6C** 🟡 Ekran miasta — makieta `Widok-miasta.html` gotowa, bez logiki.
- **6D** ⬜ Wpięcie wzrostu/produkcji/zdrowia/szczęścia w pętlę tury.
- **6E** ⬜ Kolejka produkcji w grze (dodaj/przesuń/usuń/wykup).
- **6F** ⬜ Kultura → granice miasta (progi 100/250/500) + religia (dominacja, rozprzestrzenianie).
- **6G** ⬜ Specjaliści (Uczony/Poborca/Artysta).
- **6H** ⬜ Nazewnictwo: Zadowolenie→Porządek, Porządek→Prawo (propagacja).

## 7. Technologie i epoki
- **7A** ✅ Drzewko Kamień+Brąz: 21 techów (`tech.json`) z prereq/kosztami/odblokowaniami; Brązownictwo kończy ep.1, Waluta→Pieniądz kończy ep.2.
- **7B** ⬜ Research w grze (punkty/turę → ukończenie → odblokowanie) — dane są, brak przepływu w pętli.
- **7C** ⬜ UI drzewka technologii (makieta `Makieta-drzewko-technologii.html` jest, bez logiki).
- **7D** ⬜ Epoki 3–10 (Żelazo→Roboty): drzewko, budynki, jednostki, surowce w Excelu.
- **7E** ⬜ Uogólniona mechanika przejść epok + przejścia walutowe (×100/×1000).

## 8. Walka (silnik + bitwa taktyczna)
- **8A** ✅ `combat.ts` KANON §5l: trafienie=clamp(50+(Atak−Obrona)×5,10,90); obrażenia=max(1,Atak−Pancerz+Przebicie)+Uderzenie(R1).
- **8B** ✅ Fazy: dystansowa (amunicja) → szarża R1 (negowana przez ustawioną włócznię/falangę) → zwarcie R2+.
- **8C** ✅ Kontry +50% (włócznia>konnica>dystans>włócznia; maczuga/topór vs opancerzeni), flanka (−Obrona per typ), modyfikatory terenu, morale/rout, jednostki niezłomne.
- **8D** ✅ Bitwa 3D auto (`battleScene.ts`) + bitwa ręczna taktyczna (`manualBattle.ts`) + ekran przed-bitwą (`preBattle.ts`) — odpalane testowo klawiszem T.
- **8E** ✅ Testy walki (`combat-test.cjs`) 6/6.
- **8F** ⬜ Walka z poziomu MAPY (atak jednostka→jednostka/miasto uruchamia bitwę) — dziś tylko test T.
- **8G** ⬜ Walka oblężnicza (bonus Murów dla garnizonu) + walka morska (Galera).
- **8H** ⬜ Korekta rozbieżności wzoru (§5e/§5g/Macierz `35+(A−O)` vs §5l `50+(A−O)×5`) + re-balans.
- **8I** ⬜ Ruch/atak barbarzyńców (dziś statyczni).

## 9. AI przeciwnika
- **9A** ✅ `ai.ts` KOMPLETNE: `decideAITurn` (ruch/zakładanie miast/atak/budowa/koniec tury), priorytety wg archetypu, heurystyka osadnika, Dijkstra.
- **9B** ✅ Parametry `ai-params.json`: 3 poziomy trudności, 7 archetypów, progi ekspansji/dyplomacji.
- **9C** ⬜ **WPIĘCIE `ai.ts` w pętlę tury** (AI nie wykonuje tur w grze).
- **9D** ⬜ Poziomy trudności wystawione w UI.
- **9E** ⬜ AI cywilizacji pobocznych (uproszczone, §5.2).

## 10. Dyplomacja
- **10A** ✅ `diplomacy.ts` KOMPLETNE: Zaufanie+Respekt (0–200), 16 zdarzeń, postawy AI per archetyp, relacja startowa.
- **10B** ✅ `Dyplomacja-szablon.md` (12 akcji, parametry, charakterystyki typów) + `Dyplomacja.xlsx`/`diplomacy.json`.
- **10C** ⬜ **WPIĘCIE w pętlę tury** (modyfikatory co turę, stan paktów/wojen).
- **10D** ⬜ 12 akcji dyplomatycznych — logika dostępności/efektów/kosztów w grze.
- **10E** ⬜ Panel dyplomacji (UI) — brak makiety. Kary za złamanie paktu, presja kulturowa.

## 11. Cywilizacje
- **11A** ✅ 5 typów głównych w `civs.json` (Grecy, Rzym, Chiny, Inkowie, Zulusi) + start 50 cyw. na mapie.
- **11B** 🟡 7 typów w danych jednostek/AI/społeczeństwa; Egipt + Sumerowie niekompletni.
- **11C** ⬜ Bonusy/zamienniki/super-jednostka wpięte w grę + ekran wyboru cywilizacji.
- **11D** ⬜ Cywilizacje poboczne (~43) uproszczone.
- **11E** ⬜ (później) Hetyci, Galowie/Germanie, Scytowie (nomadzi).

## 12. UI/HUD i ekrany
- **12A** 🟡 Makiety gotowe (bez logiki): Widok-miasta, Ekran-bitwy, Podgląd-armii, HUD-mapa-świata, drzewko-technologii, flow-nowa-gra, pasek-armii, przed-bitwą, katalog assetów, galeria/porównanie jednostek.
- **12B** ✅ W grze działa: wybór/ruch jednostki, galeria (G), mgła (F), zakładanie miasta (B), test bitwy (T), koniec tury (N).
- **12C** ⬜ Trwały HUD (zasoby, tura, badana tech, skarbiec) + reaktywność (system zdarzeń silnik→render).
- **12D** ⬜ Logika ekranów: miasto, bitwa, podgląd armii.
- **12E** ⬜ Panel Bilans/turę + powiadomienia turowe.
- **12F** ⬜ Menu główne, Nowa gra (cyw./rozmiar/seed/trudność), ekran zwycięstwa/przegranej.

## 13. Integracja pętli tury ← NAJWAŻNIEJSZA LUKA
- **13A** 🟡 Dziś `endTurn` = tylko reset ruchu + tura++.
- **13B** ⬜ Wepnij ekonomię (plony→wzrost→produkcja→nauka→kultura) — moduł gotowy (5A).
- **13C** ⬜ Wepnij fazę AI (ruch+atak+budowa+badania) — moduł gotowy (9A).
- **13D** ⬜ Wepnij dyplomację pasywną (modyfikatory co turę) — moduł gotowy (10A).
- **13E** ⬜ Wepnij walkę z mapy (8F) + sprawdzanie warunków zwycięstwa.
- **13F** ⬜ Diff/powiadomienia po turze do renderu.

## 14. Zapis/wczytanie + warunki zwycięstwa
- **14A** ⬜ Serializacja GameState→JSON (localStorage + plik) + wczytywanie + autozapis.
- **14B** ⬜ Warunki zwycięstwa (dominacja własnego typu / naukowe / oba) + sprawdzanie co turę.
- **14C** ⬜ Ekran zwycięstwa/przegranej z podsumowaniem.

## 15. Balans, testy, narzędzia
- **15A** ✅ Testy: `logic-test.cjs` (przechodzi), `combat-test.cjs` 6/6, `smoke.cjs` (przechodzi).
- **15B** ✅ Analiza balansu walki (`Macierz-walki-analiza.md`, macierz 11×11, flagi OP).
- **15C** ⬜ Korekty balansu: Legionista/Falanga OP, Włócznik +bonus, skrócić Falanga vs Włócznik, rola łucznika (faza dystansowa), losowość ±15%.
- **15D** ⬜ Symulacje balansu ekonomii (100+ tur) po wpięciu pętli.
- **15E** ⬜ Korupcja/marnotrawstwo — ustalić współczynniki.

## 16. Grafika, assety, dźwięk (niższy priorytet)
- **16A** ✅ Render proceduralny jednostek + 12 PNG; katalog assetów low-poly (makieta).
- **16B** ⬜ Integracja modeli low-poly terenu/budynków do sceny.
- **16C** ⬜ Animacje bitwy/przejść; dźwięk i muzyka (na koniec).

## 17. Etap późniejszy (po grywalnym v1.0)
- **17A** ⬜ Epoki Żelazo→Roboty (8 epok) + przejścia ×100/×1000.
- **17B** ⬜ Ustroje/rządy, Cuda świata.
- **17C** ⬜ Wariant RTS bitwy (opcjonalny).
- **17D** ⬜ Backend: konta, zapisy w chmurze, multiplayer, sync tur.

---

## Priorytet (rekomendacja kolejności)
1. **13B/5D** — wepnij ekonomię w turę (plony, wzrost, produkcja). Moduł gotowy.
2. **7B** — research w grze. 3. **6E** — kolejka produkcji + logika ekranu miasta (6C/12D).
4. **8F** — walka z mapy (silnik 8A–8E gotowy). 5. **9C/13C** — AI w turze.
6. **14B** — warunki zwycięstwa. 7. **14A** — save/load. 8. **10C** — dyplomacja w turze.

## Skrót podziału prac równoległych (pełne reguły: `ARCHITEKTURA-PLIKI.md`)
Każdy element = osobny task/sesja, własne pliki — bez konfliktów:
Jednostki (`Jednostki.xlsx`→`units.json`+`render/units.ts`) · Budynki (`Budynki.xlsx`→`buildings.json`+`economy.ts`) · Technologie (`Technologie-drzewko.xlsx`→`tech.json`) · Ekonomia (`Ekonomia-parametry.xlsx`→`econ-params.json`+`game/economy.ts`) · Społeczeństwo (`Spoleczenstwo-parametry.xlsx`→`society-params.json`) · Walka (`game/combat.ts`) · AI (`AI-parametry.xlsx`→`ai-params.json`+`game/ai.ts`) · Dyplomacja (`Dyplomacja.xlsx`→`diplomacy.json`+`game/diplomacy.ts`) · Mapa (`Plony-terenow.xlsx`→`terrain-*.json`+`map/generator.ts`) · Cywilizacje (`Cywilizacje.xlsx`→`civs.json`) · Makiety (każda `Makieta-*.html` osobno).
**Pliki współdzielone (jedna sesja naraz):** `src/main.ts`, `src/render/scene.ts`, `src/render/units.ts`, `src/data/loader.ts`, `src/types/*`, `tools/export-data.py`, `PROJEKT-GRY-master.md`, `ZASADY-WSPOLPRACY.md`. Po zmianie silnika → build + `tools/smoke.cjs`.
