# HANDOFF UI -> MASTER: akcje naglowka miasta (9A) — wpiecie callbackow  [2026-06-25]

cityPanel.ts ma 3 przyciski naglowka + OPCJONALNE haki (configureCityPanel). Bez hakow = no-op (bezpieczne).
Aby byly funkcjonalne, silnik/dzialy musza wpiac:

- onRename(cityId, newName)      -> UI robi prompt i przekazuje nowa nazwe. SILNIK: zapis city.name w modelu
                                    miasta + odswiez HUD (+ save). [proste, UI/silnik]
- onAutoManage(cityId)           -> przelacz zarzadce automatycznego. MIASTO/SILNIK: trzyma flage + logike
                                    auto-zarzadzania miastem. (Jesli UI ma pokazywac STAN wl/wyl -> dodatkowo
                                    hak getAutoManage?(cityId)=>boolean; daj znac.)
- onArtView(cityId)              -> otworz widok artystyczny miasta. Realizacja = MAPA/UI (overlay calkowicie
                                    poza cityPanel). UI tylko sygnalizuje klikniecie.

8B: wioski uspione w v0.1 — w widoku miasta (okolica) BRAK wiosek; potwierdzone, nic do usuniecia.

Status: gotowe do wpiecia. tsc=0, backup .bak-UI.
