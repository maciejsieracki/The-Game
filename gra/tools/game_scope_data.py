"""
Kanoniczna lista CAŁEGO zakresu gry — arkusz Status wg grup + POSTEP-% + Civ-*.

Źródło prawdy dla Mastera (odświeżane przez sync-status-tracker-xlsx.py).
Data bazowa: 2026-06-27 (ROBOCZA d813159b, bramka PASS, playtest Macieja).
"""

SCOPE_HEADERS = (
    "Grupa",
    "Element / funkcja",
    "Status",
    "Co JUZ jest zrobione",
    "Co zostalo",
    "Task (Civ-)",
    "Milestone (poch.)",
    "Prio",
)

# Status: Zrobione | Niezrobione | Czesciowo | Gotowe, niewpiete
STATUS_WG_GRUP: list[tuple] = [
    # --- A. Jednostki i walka ---
    ("A. Jednostki i walka", "Modele jednostek (Roblox) + galeria", "Zrobione", "36 typow, galeria 4 widoki", "-", "Grupa C / Civ-UNITS", "M1", "-"),
    ("A. Jednostki i walka", "Kolory per kultura + super-jedn. + helmy + galea", "Zrobione", "wizual gotowy w units.ts", "playtest finalny", "Grupa C", "Render", "Wysoki"),
    ("A. Jednostki i walka", "Roznicowanie jednostek na MAPIE (typeId)", "Niezrobione", "-", "UnitRenderer.sync per typeId", "Grupa C", "Render", "Sredni"),
    ("A. Jednostki i walka", "Balans jednostek + kanon walki par.5l", "Zrobione", "macierz/countery/flanka-tyl/super", "playtest finalny", "Grupa C", "M0", "Sredni"),
    ("A. Jednostki i walka", "Resolver walki par.5l (combat.ts)", "Zrobione", "wpiety w gre", "-", "Grupa C", "M3", "-"),
    ("A. Jednostki i walka", "Bitwa taktyczna 3D + tura-po-turze", "Zrobione", "1 akcja/jedn., cios-za-cios", "UX TW finalizacja", "Grupa C", "M3", "Wysoki"),
    ("A. Jednostki i walka", "Facing front/flanka/tyl (B7 kwadraty)", "Zrobione", "B7 + obrot do celu", "-", "Grupa C", "M3", "-"),
    ("A. Jednostki i walka", "Pole bitwy kwadratowe (B7)", "Zrobione", "battleScene kwadraty", "ocena + polish", "Grupa C", "M3", "Wysoki"),
    ("A. Jednostki i walka", "Amunicja (2 pila->miecz) + pilum (B6)", "Zrobione", "w kanonie", "-", "Grupa C", "M3", "-"),
    ("A. Jednostki i walka", "Dopieszczenie bitwy wizualnie", "Czesciowo", "B7 + pilum", "dalsze poprawki", "Grupa C", "Render", "Niski"),
    ("A. Jednostki i walka", "Reczne sterowanie bitwa (manualBattle.ts)", "Czesciowo", "modul + F-C2 czesc", "pelny UX TW w grze", "Grupa F", "M3", "Sredni"),
    ("A. Jednostki i walka", "Walka z mapy (atak->przedbitwa->wynik)", "Zrobione", "preBattle F-C1 w main.ts", "playtest + polish", "Grupa F", "M3", "Wysoki"),
    ("A. Jednostki i walka", "Oblezenie miast (siege.ts)", "Czesciowo", "modul + testy", "C3 ABC + wpięcie pelne", "Grupa C", "M3", "Wysoki"),
    ("A. Jednostki i walka", "Multi-unit / posilki 1-heks", "Niezrobione", "kontrakt UNITS", "wpięcie silnik", "Grupa C", "M4", "Sredni"),
    # --- B. Mapa i teren ---
    ("B. Mapa i teren", "Generator mapy heks + render 3D + kamera", "Zrobione", "gen-helpers + generujSwiat F-A2", "-", "Grupa A", "M1", "-"),
    ("B. Mapa i teren", "Ruch + zasieg + trasa + koszty terenu", "Zrobione", "BFS/Dijkstra, koszty, rzeka", "-", "Grupa A", "M1", "-"),
    ("B. Mapa i teren", "Mgla wojny (F)", "Zrobione", "visibility + setFog", "minimap sync (A-START-04)", "Grupa A", "M1", "P0"),
    ("B. Mapa i teren", "Mapa ku Civ VI (rzeki/biomy/ramka F1)", "Zrobione", "F1 w kodzie + scene.ts", "rzeki+fog bug A-START-03", "Grupa A", "Render", "P0"),
    ("B. Mapa i teren", "Start mapy po New Game (playtest Maciej)", "Niezrobione", "ROBOCZA grywalna", "A-START-01..05 (5 fixow)", "Grupa A", "Playtest", "P0"),
    ("B. Mapa i teren", "Ulepszenia terenu + posterunki (render)", "Czesciowo", "render gotowy", "akceptacja listy Maciej", "Grupa A", "M2", "P1"),
    ("B. Mapa i teren", "Typ mapy z menu (Ziemia/kontynent)", "Czesciowo", "generator ma typy", "E1-Q11 ABC + menu", "Grupa E", "M4", "P1"),
    ("B. Mapa i teren", "Spawn klastrow (N typow x10 miast)", "Niezrobione", "-", "generator klastrow", "Grupa A", "M1", "Sredni"),
    # --- C. Miasta, ekonomia, produkcja ---
    ("C. Miasta, ekonomia, produkcja", "Zakladanie miast (B) + panel podstawowy", "Zrobione", "cities + render + panel", "Załóż miasto HUD A-START-05", "Grupa A", "M1", "P0"),
    ("C. Miasta, ekonomia, produkcja", "Ekonomia miasta (plony/wzrost/zywnosc)", "Zrobione", "turn-economy w turze", "-", "Grupa B", "M2", "-"),
    ("C. Miasta, ekonomia, produkcja", "Skarbiec + nauka + auto-badania + epoka", "Zrobione", "playerState + sciencePicker", "-", "Grupa B", "M2", "-"),
    ("C. Miasta, ekonomia, produkcja", "Kolejka produkcji (production.ts)", "Zrobione", "logika + testy + wpięcie tury", "spawn jednostek F-PROD", "Grupa B", "M2", "Wysoki"),
    ("C. Miasta, ekonomia, produkcja", "Budowa/ulepszanie budynkow", "Czesciowo", "production ukonczenie", "panel + A4 ulepszenia mapy", "Grupa B/A", "M2", "Wysoki"),
    ("C. Miasta, ekonomia, produkcja", "Magazyny + utrzymanie (upkeep.ts)", "Zrobione", "upkeep 51/51 testow", "wealth W1-W6 ABC", "Grupa B", "M2", "Sredni"),
    ("C. Miasta, ekonomia, produkcja", "Panel miasta: plony + kolejka + budynki", "Czesciowo", "cityPanel podstawowy", "B2 sekcje + produkcja UI", "Grupa B/E", "M2", "Wysoki"),
    ("C. Miasta, ekonomia, produkcja", "Spoleczenstwo B2 (mieszkancy/porzadek/bunt)", "Czesciowo", "F-B2+F-B2-porzadek w kodzie", "B2-Q7-9 ABC + panel", "Grupa B", "M5", "P1"),
    ("C. Miasta, ekonomia, produkcja", "Licznik bilansu zasobow co ture", "Niezrobione", "-", "panel Bilans HUD", "Grupa E", "M2", "Niski"),
    ("C. Miasta, ekonomia, produkcja", "Wealth (W1-W6)", "Niezrobione", "-", "decyzje Maciej ABC", "Grupa B", "M2", "P0"),
    # --- D. AI, przeciwnicy, rozgrywka ---
    ("D. AI, przeciwnicy, rozgrywka", "AI decyzje (ai.ts)", "Zrobione", "decideAITurn w turze", "strojenie + harness", "Grupa D", "M4", "Sredni"),
    ("D. AI, przeciwnicy, rozgrywka", "Warunki zwyciestwa (victory.ts)", "Zrobione", "tick + overlay konca gry", "-", "Grupa D", "M4", "-"),
    ("D. AI, przeciwnicy, rozgrywka", "Barbarzyncy (barbarians.ts)", "Zrobione", "53 testow + wpięcie", "-", "Grupa D", "M4", "-"),
    ("D. AI, przeciwnicy, rozgrywka", "Dyplomacja tick + panel", "Zrobione", "diplomacy.ts + panel UI", "efekty relacji v1.1", "Grupa D", "M5", "Sredni"),
    ("D. AI, przeciwnicy, rozgrywka", "Bonusy cywilizacji w runtime", "Czesciowo", "civBonusy czesc", "4 FAIL test + UI D", "Grupa D", "M5", "P1"),
    ("D. AI, przeciwnicy, rozgrywka", "Archetypy AI 9 nacji + agresja", "Zrobione", "ARCHETYPE_AGGRESSION", "heurystyka fight/flee", "Grupa D", "M4", "P1"),
    # --- E. Cywilizacje, dyplomacja, spoleczenstwo ---
    ("E. Cywilizacje, dyplomacja, spoleczenstwo", "Roster 9 cywilizacji + religie + bonusy[]", "Zrobione", "civs.json 27 efektow", "mechanizacja w systemach", "Grupa D", "M5", "-"),
    ("E. Cywilizacje, dyplomacja, spoleczenstwo", "Kultura/religia w turze", "Zrobione", "culture-religion wpięte", "spread religii etap2", "Grupa B", "M5", "Sredni"),
    ("E. Cywilizacje, dyplomacja, spoleczenstwo", "Porzadek = Szczescie + Prawo (order.ts)", "Zrobione", "T1/T2 + revolt w kodzie", "B2-Q7-9 ABC", "Grupa B", "M5", "P1"),
    ("E. Cywilizacje, dyplomacja, spoleczenstwo", "Zadowolenie/bunt w panelu miasta", "Czesciowo", "chip+hex buntu lane", "pelny panel B2", "Grupa B", "M5", "Sredni"),
    # --- F. Interfejs (UI/HUD/menu) ---
    ("F. Interfejs (UI/HUD/menu)", "HUD podstawowy (tura/jednostka)", "Zrobione", "hud.ts czesc", "-", "Grupa E", "M1", "-"),
    ("F. Interfejs (UI/HUD/menu)", "HUD D1B (zasoby/WYKONAJ/panel H)", "Czesciowo", "F-HUD + F-HUD-2 w kodzie", "playtest + polish", "Grupa E/F", "M6", "P0"),
    ("F. Interfejs (UI/HUD/menu)", "Menu glowne + kreator nowej gry", "Zrobione", "mainMenu + newGameFlow F-A2", "E1-UX-01 nawigacja", "Grupa E", "M6", "P1"),
    ("F. Interfejs (UI/HUD/menu)", "Minimapa + panele boczne pelne", "Czesciowo", "minimapHud istnieje", "fog sync A-START-04", "Grupa A/E", "M6", "P0"),
    ("F. Interfejs (UI/HUD/menu)", "Panel armii + dyplomacji", "Czesciowo", "diplomacyPanel", "A3-Q1 panel armii", "Grupa A", "M6", "P2"),
    # --- G. Zapis, meta, nowa gra ---
    ("G. Zapis, meta, nowa gra", "Save/Load (save.ts)", "Zrobione", "Ctrl+S/L + sloty", "persist B2 w save", "Grupa F", "M6", "Sredni"),
    ("G. Zapis, meta, nowa gra", "Nowa gra (start -> generacja -> gra)", "Zrobione", "generujSwiat + doStartGame", "E1-Q9..Q12 ABC", "Grupa E/F", "M4", "P1"),
    ("G. Zapis, meta, nowa gra", "Kanon finalna Gra-podglad.html", "Czesciowo", "ROBOCZA d813159b", "Opus APPROVE + promocja", "Grupa F/Master", "M6", "P0"),
    # --- H. Infrastruktura ---
    ("H. Infrastruktura i koordynacja", "Pipeline Excel->JSON (loader)", "Zrobione", "13 JSON + targeted export", "-", "Grupa D", "M0", "Niski"),
    ("H. Infrastruktura i koordynacja", "Schemat stanu gry (GameState/TS)", "Zrobione", "typy w src/types", "-", "Grupa F", "M0", "-"),
    ("H. Infrastruktura i koordynacja", "Build single-file + bramka testow", "Zrobione", "762+ testy, ROBOCZA", "4 fail civ-bonusy P2", "Grupa F", "M1", "-"),
    ("H. Infrastruktura i koordynacja", "Workflow Cursor (grupy A-F + Master)", "Zrobione", "dyspozycje + OD/DO-MASTERA", "Excel tracker sync", "Master", "Infra", "-"),
    ("H. Infrastruktura i koordynacja", "Archiwizacja czatow auto", "Zrobione", "sync-chat-export + hook", "-", "Master", "Infra", "-"),
    ("H. Infrastruktura i koordynacja", "Balans rozgrywki (playtest v1.0)", "Czesciowo", "playtest Maciej w toku", "kolejne uwagi w czacie Master", "Master", "M6", "P0"),
    # --- I. Przyszlosc ---
    ("I. Przyszlosc (M7)", "Epoki 3-10, waluty, ustroje, cuda, RTS, backend", "Niezrobione", "-", "po v1.0", "-", "M7", "Niski"),
]

POSTEP_ROWS: list[tuple] = [
    ("POSTEP PROJEKTU — Master Silnik (auto-sync)", None, None, None, None),
    ("Dzial / Grupa", "% zakresu", "Co zielone", "Co zostalo", "Blokery"),
    ("Grupa A (MAPA)", "74%", "generator F1, ruch, fog, minimap, budowa z mapy", "A-START playtest 5 fixow, ulepszenia, klastry", "playtest P0"),
    ("Grupa B (MIASTO/EKO)", "82%", "produkcja, porzadek, kultura, B2 paczka w kodzie", "B2-Q7-9 ABC, Wealth W1-W6, panel pelny", "ABC Maciej"),
    ("Grupa C (UNITS/BITWA)", "86%", "combat, B7, preBattle F-C1, C2 UX lane", "C3 oblezenie ABC, multi-unit", "ABC C3"),
    ("Grupa D (CYW/AI/DYPLO)", "72%", "roster, ai, victory, barbarians, diplomacy", "civ-bonusy 4 FAIL, UI bonusow", "testy + lane"),
    ("Grupa E (UI/MENU)", "80%", "menu, kreator, sciencePicker, defaults", "E1-UX-01, E1-Q9..Q12 ABC, pelny HUD", "ABC + UX"),
    ("Grupa F (SILNIK)", "85%", "8 batchow main.ts, ROBOCZA, bramka PASS", "Opus, kanon, A-START batch, spawn prod", "Opus P0"),
    ("SILNIK integracja (main.ts)", "80%", "ekonomia+AI+walka+save+menu+dyplomacja wpięte", "pelny HUD, wealth, oblezenie, bonusy", "decyzje ABC"),
    ("REALNA grywalnosc v0.1", "78%", "ROBOCZA end-to-end", "playtest fixy, kanon finalna", "Opus + A-START"),
    ("Srednia MODULOW (lane kod)", "~79%", None, None, None),
    ("Do v1.0 (szacunek)", "~55%", "v0.1 grywalna", "wealth, oblezenie, HUD pelny, polish, balans", "15+ decyzji ABC"),
]

CIV_SILNIK_STEPS: list[tuple] = [
    (1, "Konsolidacja: vite build + bramka testow + ROBOCZA", "Zrobione", "2026-06-27 bramka PASS, md5 d813159b"),
    (2, "Wpiecie production.ts (kolejka) + budowa budynkow", "Zrobione", "2026-06-26 F-B2 + produkcja w turze"),
    (3, "Wpiecie ai.ts + victory.ts (+ ekran konca)", "Zrobione", "2026-06-26 batch TOP-7"),
    (4, "Walka z mapy (atak->przedbitwa->wynik) + manualBattle", "Czesciowo", "F-C1 wpięte; F-C2 UX w toku"),
    (5, "Wpiecie diplomacy.ts + culture-religion + order.ts", "Zrobione", "2026-06-26 dyplomacja tick"),
    (6, "Wpiecie save.ts (zapis/odczyt + sloty)", "Zrobione", "Ctrl+S/L w grze"),
    (7, "Nowa gra: flow startu -> generacja -> gra", "Zrobione", "F-A2 generujSwiat + newGameFlow"),
    (8, "HUD D1B (F-HUD + F-HUD-2) + spawn produkcji", "Czesciowo", "HUD cz.1-2 w kodzie; spawn TODO"),
    (9, "Oblezenie siege.ts pelne wpięcie", "Niezrobione", "C3 czeka ABC Grupa C"),
    (10, "Promocja kanonu po Opus APPROVE", "Niezrobione", "ROBOCZA czeka review Opus"),
]

CIV_MAPA_STEPS: list[tuple] = [
    (1, "F1 mapa Civ VI: rzeki + biomy + cieniowanie + ramka", "Zrobione", "22-27.06 F1 + miasta + surowce"),
    (2, "Mgla wojny + minimap", "Czesciowo", "fog 3D OK; minimap sync A-START-04"),
    (3, "Start mapy playtest (auto budowa, kamera, rzeki)", "Niezrobione", "A-START-01..05 P0"),
    (4, "Ulepszenia terenu + posterunki w grze", "Czesciowo", "render gotowy; decyzja lista"),
    (5, "Spawn klastrow N x10 miast", "Niezrobione", "przyszle"),
]

SCOPE_STATUS_COLORS = {
    "Zrobione": "C6EFCE",
    "Niezrobione": "FFC7CE",
    "Czesciowo": "FFEB9C",
    "Gotowe, niewpiete": "FFF2CC",
}
