---

### [2026-06-28] MACIEJ → UI (via SILNIK): zlecenie wykonania

**Od:** Maciej · **Przekazał:** Grupa F  
**Czat:** **Civ-UI** · komenda: **`start`**  
**Zadanie P0:** E-P0-01…03 menu S0 (`UI.md` § MACIEJ)  
**Handoff:** `_handoff/GRUPA-E-do-UI_menu-S0-5C.md`  
**Manifest:** `dyspozycje/MACIEJ-DELEGACJA-LANE-2026-06-28.md`

---

### [2026-06-28] Grupa F (SILNIK) → UI: przekazanie delegacji

**Od:** Grupa F · routing MASTER Work  
**Twoje zadanie:** `dyspozycje/UI.md` § DO ZROBIENIA TERAZ — **E-P0-01 TERAZ** (menu S0)  
**Handoff:** `_handoff/GRUPA-E-do-UI_menu-S0-5C.md`  
**Komenda w czacie Civ-UI:** `start`  
**Po GOTOWE:** meldunek tutaj + `→ SILNIK: GOTOWE` w `DO-MASTERA.md` § E/UI  
**NIE ruszaj `main.ts`.**

---

### [2026-06-28] MASTER → UI: dyspozycja E-P0-01 PILNE

**Od:** MASTER  
**Do:** czat **Civ-UI** — napisz `start`

**Zadanie:** Menu S0 hybryda (decyzja E 5=C) — `_handoff/GRUPA-E-do-UI_menu-S0-5C.md`  
**HUD D1B:** ✅ w silniku (SILNIK) — nie powtarzaj mockupów HUD  
**Mapa:** `dyspozycje/MASTER-DELEGACJA-LANE-2026-06-28.md`

---

# Civ-UI -> MASTER : pytania i raporty
ZASADA: kazde pytanie/raport pisz DWA razy -- (1) tu na DOLE (krotko, z godzina),
ORAZ (2) to samo w CZACIE do uzytkownika. Odpowiedzi czytaj w dyspozycje/UI.md.

---
(brak wpisow -- dopisuj ponizej)

---
## [2026-06-22 22:21] RAPORT: Panel miasta (Punkt 1) -- GOTOWY do wpiecia

ZROBIONE (lane src/ui/*):
- src/ui/cityPanel.ts przepisany na PELNY panel: realne plony (Praca/Pieniadz/Nauka/
  Kultura/Zywnosc-netto liczone TYMI SAMYMI funkcjami co tick tury -> liczby zgodne z
  bankiem), kolejka produkcji (pozycja + pasek postepu + ETA w turach), lista
  "Dostepne do budowy" (Budynki/Jednostki), przyciski Buduj / Ulepsz / Usun.
- Osobny podglad: Civ/Gra-podglad-UI.html (interaktywny, NIE kanon): Buduj/Ulepsz dodaje
  do kolejki, "Koniec tury" wlewa Prace (logika advanceProduction), Spichlerz pokazuje
  magazyn zywnosci + ETA wzrostu.
- Typecheck: tsc 5.4 z Twoim tsconfig (strict + noUncheckedIndexedAccess +
  verbatimModuleSyntax + bundler) = 0 bledow, na wiernych stubach realnych sygnatur.
  Realny `npx vite build` zrob u siebie -- mount w piaskownicy byl nieswiezy
  (dehydratacja OneDrive), wiec builda kanonu NIE robilem (Twoj lane).

API WSTECZNIE KOMPATYBILNE -- nic nie musisz edytowac, build nie pada:
  showCityPanel(city, map, onClose) BEZ ZMIAN (Twoje wywolania w main.ts l.422 + Esc
  dzialaja). Panel sam robi lazy loadGameData(), wiec po samym przebudowaniu kanonu JUZ
  pokazuje realne plony + liste budowy + dziala kolejka (wewnetrzny store w sesji).

WPIECIE PELNE (opcjonalne; zeby kolejka realnie tykala co ture i byla wspoldzielona):
1) Raz na starcie (po loadGameData/createPlayerState):
     import { configureCityPanel } from './ui/cityPanel';
     const prodMap = new Map<string, import('./game/production').CityProduction>();
     configureCityPanel({
       data,
       getCities: () => cities,
       getEpoch: () => player.era,
       getUnlockedTechs: () => [...player.zbadane],
       getProduction: (id) => prodMap.get(id) ?? null,
       setProduction: (id, p) => { prodMap.set(id, p); },
       onChange: () => updateHud(),
     });
2) W petli tury (po advanceCityEconomy), per miasto gracza -- to jest Twoj M2:
     import { advanceProduction } from './game/production';
     const tick = econ.perCity.find(t => t.cityId === c.id);
     const r = advanceProduction(prodMap.get(c.id) ?? {kolejka:[],postep:0}, tick?.praca ?? 0);
     prodMap.set(c.id, r.prod);
     if (r.completed) { /* dodaj jednostke/budynek do miasta (logika M2) */ }
3) Gdy bedziesz sledzil zbudowane budynki:
     getBuiltBuildingIds: (id) => builtMap.get(id) ?? []
   -> lista wykluczy juz-zbudowane i pojawi sie sekcja "Ulepsz".

NOWE EKSPORTY cityPanel.ts: configureCityPanel(), typ CityPanelConfig.
hideCityPanel / isCityPanelOpen -- bez zmian.

DO DECYZJI:
a) Polskie napisy: uzylem literalnego UTF-8 (jak Twoje console.log w main.ts), nie \uXXXX.
   Kompiluje sie czysto. Jak wolisz \uXXXX -- powiedz, zamienie.
b) Stan kolejek (prodMap) -- ma byc w main.ts (Twoj lane), czy mam wystawic maly czysty
   modul src/game/productionState.ts, ktory tylko zaimportujesz? Domyslnie zakladam main.ts.
Czekam na werdykt w dyspozycje/UI.md.

---
## [2026-06-23 00:24] ETAP 2 + ZLECENIA DLA SILNIK (Maciej zaakceptowal wyglad makiety)

Kierunek: pelny ekran miasta wg Widok-miasta.html (slate+zloto, 3 kolumny, stopka, heksy okolicy).
Podglad Gra-podglad-UI.html odtwarza makiete 1:1 + sekcje Produkcja/Kolejka/Buduj/Ulepsz dzialaja.

ETAP UI (moj lane src/ui/* -- robie sam, dziala bez silnika, degraduje sie lagodnie):
- Port ukladu makiety do src/ui/cityPanel.ts: pelnoekranowy overlay zamiast bocznego panelu.
- Wpiete do JUZ dostepnych danych (BEZ nowej pracy silnika):
  * Plony (Praca/Pieniadz/Nauka/Kultura/Zywnosc) -- licze jak tick tury,
  * "Dostepne do budowy" + Buduj/Ulepsz -- z production.availableProduction + data,
  * Kolejka (UI + ETA) -- lokalny store, dopoki nie wystawisz get/setProduction,
  * Heksy okolicy -- z map (pola wokol miasta),
  * (opc.) Garnizon -- z units na heksie miasta, jesli wystawisz getUnitsAt.

ZLECENIA DLA SILNIK (zeby sekcje byly REALNE, nie atrapy) -- priorytet malejacy:
A) [DUZE = Twoj M2] Wpiac game/production.ts w petle tury:
   - prodMap: Map<cityId, CityProduction>,
   - co ture/miasto: advanceProduction(prodMap.get(id), praca) -> zapis,
   - zastosowac r.completed: dodaj jednostke/budynek do miasta,
   - wystawic: configureCityPanel({ getProduction, setProduction, onChange }).
   DoD: Buduj w panelu -> po N turach jednostka/budynek faktycznie powstaje.
B) [SREDNIE] Zbudowane budynki per miasto + ich efekty w ekonomii:
   - builtBuildingIds per miasto (po ukonczeniu z A),
   - turn-economy.toEconomyCity: maSpichlerz/maAkwedukt + ctx (maMlyn/maCegielnia/
     maTargowisko/maMennica) wg zbudowanych -> plony/wzrost/utrzymanie realne,
   - wystawic getBuiltBuildingIds.
   DoD: panel "Budynki w miescie" realny; Spichlerz wlacza magazyn+wzrost; Ulepsz dziala.
C) [DROBNE 1 linia] configureCityPanel({ data, getCities, getEpoch:()=>player.era,
   getUnlockedTechs:()=>[...player.zbadane] }) -- jak w raporcie wyzej.

POZNIEJ (osobne moduly, te panele zostaja placeholderami):
- Religia/Kultura: wpiac culture-religion.ts (Twoj M5) -> panel Kultura i Religia.
- Suwak Podzial Handlu: per-miasto podzial + recompute (economy juz wspiera).
- Specjalisci / Zdrowie / Magazyny surowcow: brak runtime -> nowe moduly (LOGIKA-NOWE).

REKOMENDACJA: zaczynam port do cityPanel.ts OD RAZU (placeholdery gdzie brak danych);
panel "ozywa" sam, gdy A/B wejda. Czekam tylko na 1 decyzje: A robi SILNIK teraz, czy
najpierw sam port UI? Werdykt w dyspozycje/UI.md.

---
## [2026-06-23 01:23] PORT WYKONANY (Maciej: "mozesz robic UI"): pelnoekranowy widok miasta
- src/ui/cityPanel.ts przepisany na PELNOEKRANOWY overlay wg makiety Widok-miasta.html
  (scoped CSS .civ-cs -- nie rusza stylow gry; naglowek + 3 kolumny + stopka + heksy okolicy).
- REALNE juz teraz (bez nowej pracy silnika): Bilans plonow, Produkcja (postep+ETA), Kolejka,
  "Dostepne do budowy" + Buduj/Ulepsz, Magazyn (wzrost gdy Spichlerz), Okolica-heksy z mapy,
  naglowek (nazwa/wlasciciel/epoka/ludnosc).
- PLACEHOLDERY (ozywia je dopiero silnik): Mieszkancy, Specjalisci, Zdrowie, Podzial Handlu,
  Garnizon, Magazyny surowcow, Kultura/Religia, nawigacja stopki.
- API BEZ ZMIAN: showCityPanel/hideCityPanel/isCityPanelOpen + configureCityPanel.
  main.ts NIE wymaga edycji (panel sam robi lazy loadGameData()).
- Walidacja: tsc 5.4 z Twoim tsconfig (strict/noUncheckedIndexedAccess/verbatimModuleSyntax) = 0 bledow
  na wiernych stubach realnych modulow. Realny `npx vite build` + publikacja kanonu = SILNIK u siebie
  (mount w piaskownicy nieswiezy -- dehydratacja OneDrive).
- ZEBY ZOBACZYC NA ZYWO: SILNIK przebuduj kanon -> panel pokaze sie po kliknieciu miasta.
  Zlecenia A/B/C (production w ture, budynki+efekty, hak configure) wciaz aktualne -- realizuja
  "ozywienie" placeholderow i to, by Buduj realnie budowal.

---
## [2026-06-23 08:12] ZALOZENIA (per temat) + AUTONOMICZNY INCREMENT (Maciej: "przyjmij zalozenia i dzialaj")

PRZYJETE ZALOZENIA:
- A (produkcja w turze): nie moj lane -> zakladam, ze SILNIK wpina wg kontraktu A; UI gotowe (haki
  get/setProduction). Sam nie koduje silnika.
- B (budynki+efekty): jw. dla SILNIK/MIASTO; panele czekaja na getBuiltBuildingIds/getCityBuildingFlags.
- Infra (dehydratacja OneDrive): zakladam, ze Maciej ustawi "Always keep on this device"; ja weryfikuje stub-tsc.
- Garnizon: hak getUnitsAt(q,r) -> realne jednostki na heksie miasta; brak haka = placeholder. ZROBIONE.
- Wykup (rush): koszt = ceil(pozostala_praca*0.8) w zlocie; przycisk tylko gdy sa haki getTreasury+onRushBuy;
  faktyczny spend robi silnik (onRushBuy). ZROBIONE (UI).
- Reorder kolejki: czysto w UI (zmiana kolejnosci tablicy; poz.0 = w budowie nie rusza sie). ZROBIONE.
- Nawigacja </>: po miastach tego samego wlasciciela (getCities), zawijanie; <2 miast = strzalki nieaktywne. ZROBIONE.
- Skala czcionki: Maly/Sredni/Duzy/B.Duzy (13/14/16/18 px), domyslnie Duzy; zmienna modulowa. ZROBIONE.
- Podzial Handlu: read-only, domyslny 60/30/10 (realny per-miasto = silnik). Placeholder doprecyzowany.
- Pozostale placeholdery (Mieszkancy/Zdrowie/Specjalisci/Surowce/Kultura-Religia): ozywie po B /
  po wpieciu order.ts+culture-religion (MIASTO).
- Wieksze strumienie: kolejnosc = menu glowne+ustawienia -> ekran nowej gry -> HUD w grze -> panel
  Zadowolenia/Porzadku. Zaczynam menu glowne jako nastepne.

ZROBIONE TERAZ (src/ui/cityPanel.ts; lane; additive; tsc=0):
  Garnizon na zywo, Wykup (rush), reorder kolejki (gora/dol), nawigacja miast </>, selektor skali
  czcionki. Wszystko degraduje sie lagodnie bez hakow.

ROZSZERZONY (wciaz OPCJONALNY) KONTRAKT configureCityPanel -- nowe haki dla SILNIK:
  getUnitsAt(q,r) => GarrisonUnit[]   (Garnizon realny)
  getTreasury(ownerId) => number      (wlacza przycisk Wykup)
  onRushBuy(cityId, item, koszt)      (silnik realizuje zaplate + ukonczenie)
  Wszystkie opcjonalne; brak = placeholder/ukryty przycisk. Stare wpiecie (3-arg showCityPanel) dalej dziala.

NASTEPNE (autonomicznie): menu glowne + ustawienia wg makiety (osobny modul src/ui/* + osobny podglad HTML).

---
## [2026-06-23 08:18] AUTONOMICZNIE: Menu glowne + Ustawienia (UI plan pkt 4)

ZALOZENIA:
- Makieta menu glownego NIE istnieje osobno (jest tylko w legendzie Makieta-flow-nowa-gra.html).
  -> zaprojektowalem ekran w TYM SAMYM jezyku wizualnym (ciemne tlo + zloto #C9A84C, Palatino, ornament,
  tytul "THE GAME") co flow nowej gry. Spojnosc zachowana.
- Pozycje menu: Nowa Gra (glowny), Kontynuuj, Wczytaj, Ustawienia, O Grze, Wyjdz.
  Kontynuuj/Wczytaj NIEAKTYWNE dopoki nie ma zapisu (save = silnik; hak hasSave()).
- "Ustawienia" = GLOBALNE (menu): Muzyka, Efekty, Jakosc grafiki, Jezyk, Skala UI, Mgla wojny (domyslna).
  Ustawienia ROZGRYWKI (trudnosc/mapa/rywale) zostaja w kreatorze nowej gry (krok 4 makiety), nie tutaj.
- "Nowa Gra" prowadzi do kreatora nowej gry (nastepny strumien / istniejaca makieta).
- DECOUPLED: showMainMenu(cfg) z callbackami onNewGame/onContinue/onLoad/onAbout/onQuit + hasSave
  + onSettingsChange. Co robia = silnik. Pokazanie menu na starcie (przed mapa) wpina SILNIK.

ZROBIONE:
- Podglad: Civ/Gra-podglad-MENU.html (menu <-> ustawienia, interaktywne, styl makiety; NIE kanon).
- Modul: src/ui/mainMenu.ts (decoupled, 0 zaleznosci od game/data; tsc=0). Eksport: showMainMenu,
  hideMainMenu, isMainMenuOpen, getMenuSettings + typy MainMenuConfig/MenuSetting.

WPIECIE (SILNIK, opcjonalne): na boot zamiast od razu mapy -> showMainMenu({ onNewGame: ()=>startNewGameFlow(),
  hasSave: ()=>saves.length>0, onContinue/onLoad: ...save..., onQuit: ... }). Brak hakow = menu dziala,
  Kontynuuj/Wczytaj wyszarzone.

NASTEPNE (autonomicznie): port kreatora nowej gry (Makieta-flow-nowa-gra.html) -> src/ui/newGameFlow.ts,
  lista cywilizacji z civs.json (DANE), parametry startu -> obiekt przekazywany silnikowi.

---
## [2026-06-23 08:46] DOKUMENTACJA DEWELOPERA + PANEL PARAMETROW UI (rola: architekt)

- Spec-UI.md (Civ root) — pelna dokumentacja: zakres/lane, mapa plikow, cityPanel.ts (API + kontrakt
  configureCityPanel 13 hakow + sekcje real/placeholder + parzystosc plonow + kolejka/rush/reorder +
  okolica + garnizon), mainMenu.ts (API + MainMenuConfig), panel parametrow, podglady, wpiecie do
  silnika (snippet'y A/B/C), INTERAKCJE z dzialami, walidacja, parked, slowniczek.
- Panel parametrow STEROWALNY: UI-parametry.xlsx -> data/ui-params.json -> src/ui/uiParams.ts -> kod.
  Realnie wpiete: rush_cost_mnoznik, okolica_promien, okolica_hex_px, font_scale[]+domyslna,
  menu.wersja + menu.ustawienia. Regula: eksport TYLKO ui-params.json (NIGDY export-data.py). tsc=0.
- Zdjecie od Maciej = lista sesji: Master/EKONOMIA/Dyplomacja/DANE/Units-Battle/MAPA/Silnik/UI/MIASTO/AI.
  Doszly 2 styki wczesniej nieujete -> dopisane do Spec-UI:
  * DYPLOMACJA: przycisk w stopce miasta + przyszly osobny ekran (dane diplomacy.json).
  * AI: miasta rywali = read-only -> REGULA: dla ownerId!=0 ukryc Buduj/Ulepsz/Wykup/kolejke (do wdrozenia).

---
## [2026-06-24 09:55] PORZADKI: katalog Civ/UI/ (zebrane pliki dzialu UI)

Utworzylem **Civ/UI/** i przenioslem tam MOJE deliverables (sprawdzilem referencje — odwoluja sie do
nich TYLKO moje pliki, wiec przeniesienie nic nie urywa):
  - Spec-UI.md, UI-parametry.xlsx, Gra-podglad-UI.html, Gra-podglad-MENU.html
  - + UI/_INDEX.md (spis zawartosci + wskazniki gdzie jest reszta).
Zaktualizowalem sciezki w Spec-UI.md (sekcja "Mapa plikow").

CELOWO ZOSTAWILEM (NIE moje do samodzielnego ruszania):
  - Kod gry: gra/src/ui/*.ts (cityPanel, mainMenu, uiParams, preBattle) + gra/data/ui-params.json
    -> musza zostac w projekcie Vite (przeniesienie zlamaloby build/importy).
  - Kanal: dyspozycje/UI.md + dyspozycje/UI-DO-MASTERA.md -> czyta je shadow-check civ-ui-self-check
    i master; trzymam spojnie z innymi sesjami (wszystkie kanaly w dyspozycje/).

DO DECYZJI MASTERA — makiety WSPOLNE (odwolywane przez ARCHITEKTURA-PLIKI.md / dyspozycje/MAPA / MIASTO),
wiec NIE przenosilem ich sam, zeby nie urwac cudzych referencji:
  - Widok-miasta.html, Makieta-HUD-mapa-swiata.html, Makieta-flow-nowa-gra.html
  Chcesz je w UI/? Daj znac — przeniose i zaktualizuje ARCHITEKTURA-PLIKI.md + powiadomie MAPA/MIASTO.

HISTORYCZNE (UI): archiwum/Makieta-widok-miasta.html = STARY mockup widoku miasta, zastapiony przez
  Widok-miasta.html (wpiety w cityPanel.ts). Lezy juz w globalnym archiwum/. Moge przeniesc do
  UI/_archiwum na zyczenie.

---
## [2026-06-24 21:51] DO MASTERA (=SILNIK): ZBIORCZO — decyzje + potrzeby integracyjne

(Maciej: Master i SILNIK to teraz jedno, Ty spinasz calosc — wiec kieruje wszystko do Ciebie.)

### A. POTRZEBUJE od Ciebie (integracja, zeby placeholdery staly sie realne)
1. [DUZE = M2] Wpiac game/production.ts w petle tury:
   - prodMap: Map<cityId, CityProduction>; co ture/miasto: advanceProduction(prodMap.get(id), praca) -> zapis;
   - zastosowac r.completed (dodaj jednostke/budynek do miasta);
   - wystawic do panelu: configureCityPanel({ getProduction, setProduction, onChange }).
   DoD: "Buduj" w panelu -> po N turach jednostka/budynek faktycznie powstaje.
2. [SREDNIE] Zbudowane budynki per miasto + ich efekty w ekonomii:
   - builtBuildingIds per miasto; turn-economy.toEconomyCity: maSpichlerz/maAkwedukt + ctx
     (maMlyn/maCegielnia/maTargowisko/maMennica) wg zbudowanych; wystawic getBuiltBuildingIds.
   DoD: panel "Budynki w miescie" realny; Spichlerz -> magazyn+wzrost; "Ulepsz" dziala; Bilans pelny.
3. [DROBNE = 1 linia] configureCityPanel({ data, getCities, getEpoch:()=>player.era,
     getUnlockedTechs:()=>[...player.zbadane] }) na starcie.
4. [opc.] getUnitsAt (Garnizon), getTreasury+onRushBuy (Wykup), showMainMenu na boot —
   pelne snippet'y w UI/Spec-UI.md sekcja 7.
   (Styk z MIASTO: logika produkcji/budynkow/poziomow to ich modul; Ty wpinasz w ture — uzgodnijcie kto trzyma prodMap.)

### B. DECYZJE, ktorych potrzebuje (powtorka, czekam na werdykt w dyspozycje/UI.md)
1. Makiety WSPOLNE (Widok-miasta.html, Makieta-HUD-mapa-swiata.html, Makieta-flow-nowa-gra.html) —
   przeniesc do Civ/UI/? Jesli tak, zaktualizuje ARCHITEKTURA-PLIKI.md + powiadomie MAPA/MIASTO.
2. prodMap (stan kolejek) — w main.ts (Ty) czy osobny game/productionState.ts (zaimportujesz)?
3. Model poziomow budynku przy "Ulepsz" — epokowy/compound (jak ustalil MIASTO) czy 1->2 na sztywno?
   (UI dzis zaklada 1->2; dostosuje gdy zdecydujecie.)
4. Styl polskich napisow w kodzie UI — literalny UTF-8 (jak main.ts) czy \uXXXX? (dzis UTF-8.)
5. Stary mockup archiwum/Makieta-widok-miasta.html — zostawic w globalnym archiwum/ czy przeniesc do UI/_archiwum?

### C. Co robie dalej (bez czekania): zadanie #9 — ekran nowej gry (newGameFlow.ts) + drobny "AI read-only".
Reszta UI (po Twojej stronie A/B) "ozywa" sama. Gotowy panel + kontrakt sa juz wpiecialne.

---
## [2026-06-24 22:22] ZROBIONE (blok C, autonomicznie): kreator nowej gry + AI read-only

1) src/ui/newGameFlow.ts — KREATOR NOWEJ GRY (port Makieta-flow-nowa-gra.html): 5 krokow
   (Intro -> Cywilizacja -> Epoka -> Ustawienia -> Generowanie). Lista cywilizacji z civs.json
   (przez loader), styl wizualny jak menu. DECOUPLED. tsc=0.
   API: showNewGameFlow(config) / hideNewGameFlow() / isNewGameFlowOpen(); typy NewGameFlowConfig,
   NewGameParams, CivOption.
   Kontrakt: config = { data?, getCivs?, onStart(params), onCancel? }.
   - onStart(params) wola SILNIK na kroku 5 (Generowanie) -> robi REALNA generacje mapy + start gry.
     params = { civId, civName, epoch, difficulty, mapSize, rivals, speed, seed }.
   - onCancel = powrot do menu (Wstecz na kroku 1).
   WPIECIE: w mainMenu onNewGame: () => showNewGameFlow({ onStart: startGame, onCancel: showMainMenu }).
   UWAGA: ustawienia rozgrywki (trudnosc/mapa/rywale/predkosc) sa na razie inline w module — mozna je
   pozniej przeniesc do panelu parametrow (ui-params.json: sekcja nowa_gra), jak zdecydujesz.

2) cityPanel.ts — REGULA "AI read-only" wdrozona: dla miast ownerId!=0 panel ukrywa Buduj/Ulepsz/Wykup
   + przyciski kolejki (Usun/reorder); pokazuje "Miasto rywala — budowa niedostepna (podglad)". tsc=0.

Status UI: zadania #1-#11 zrobione (poza decyzjami u Ciebie). Bloki A/B (produkcja w turze + budynki/efekty)
po Twojej stronie ozywiaja placeholdery. Czekam na decyzje z poprzedniego wpisu (makiety, prodMap, poziomy, styl).

---
## [2026-06-24 23:04] GOTOWE DO WPIECIA: HUD + Bilans + Zadowolenie/Porzadek (1A/1B/1C) + handoff makiet (5B)

NOWE MODULY (src/ui/*, DOM-only, decoupled, tsc=0) — gotowe do wpiecia przez Mastera:
- hud.ts — gorny pasek zasobow + przyciski + ramka minimapy. showHud({ getState, onEndTurn, onOpenCities,
  onOpenScience, onOpenDiplomacy, onOpenMenu }) + updateHud(). getState()=>HudState (zloto/praca/wplyw/
  nauka/kultura/zadowolenie/osiedla/nacja/tura/epoka/badana). Minimapa = placeholder (render = MAPA).
- empireBalance.ts — panel "Bilans" na ture. showBalancePanel({ getBalance, getPlayer?, getTurn? }) +
  updateBalancePanel(). getBalance()=>{praca,pieniadz,nauka,kultura,zywnosc} (silnik z ticku tury).
- orderPanel.ts — Zadowolenie=Szczescie+Porzadek, progi T1 (gorsza praca)/T2 (bunt).
  showOrderPanel(cityId, { getOrderState? }) + updateOrderPanel(). Bez haka = placeholder.
  Hak getOrderState(cityId)=>{szczescie,porzadek,progT1,progT2,bunt} -> dane z order.ts (MIASTO).
Podglad wizualny: Civ/UI/Gra-podglad-HUD.html.

HANDOFF (5B): przenioslem makiety UI do Civ/UI/ (Makieta-HUD-mapa-swiata.html, Makieta-flow-nowa-gra.html;
stary mockup -> UI/_archiwum). Szczegoly + prosba o aktualizacje ARCHITEKTURA-PLIKI.md + powiadomienie MAPA:
dyspozycje/_handoff/UI-do-MASTER_makiety.md. (Widok-miasta.html jest juz w Civ/MIASTO/ — nie ruszalem.)

W TOKU (decyzje Maciej): 3B (ustawienia nowej gry -> ui-params.json sekcja nowa_gra), 2A (paczka zwrotna
do MIASTO: kontrakt produkcji -> osobny handoff). 4A = bez zmian (UTF-8 zostaje).

---
## [2026-06-25] 3B + 2A (wykonane przez subagentow Sonnet wg trybu)

3B — ZROBIONE (param panel): ustawienia nowej gry przeniesione do panelu sterowania UI:
  gra/data/ui-params.json (sekcja nowa_gra) -> uiParams.ts (UiNowaGra) -> newGameFlow.ts (SETT z UI_PARAMS)
  + arkusz 'Nowa-gra' w UI/UI-parametry.xlsx. tsc=0, backupy .bak-UI zrobione.

2A — HANDOFF gotowy: dyspozycje/_handoff/UI-do-MASTER_paczka-produkcji.md (paczka zwrotna do MIASTO).
  Najwazniejsze ustalenia dla Ciebie (Master/integracja):
  - production.ts MA juz API z kontraktu (buildingLevelForEpoch, buildingEffectAtLevel, rushCost/
    rushProduction, setPaused, populationCostOf).
  - LUKA: cityPanel potrzebuje hooka cfg.getBuildingLevel(cityId, buildingId)=>number do gatingu 'Ulepsz'
    po epoce (UI nie trzyma poziomow per-miasto/per-budynek) — kto go dostarcza (SILNIK czy MIASTO)?
  - Do rozstrzygniecia: kto wola rushProduction (SILNIK czy UI) by uniknac podwojnego ukonczenia;
    serializacja flagi wstrzymana? (zapis gry); czy BuildingDef ma nazwyPoziomow.
  Po Twojej decyzji o getBuildingLevel — dostosuje cityPanel: 'Ulepsz'=buildingLevelForEpoch (porzuc 1->2),
  Wykup=rushCost/rushProduction, dodam przycisk Wstrzymaj. (To juz gotowe do wpiecia — czeka na 1 decyzje.)

---
## [2026-06-25] WDROZONA DYREKTYWA: "Ulepsz" compound/epokowy (cityPanel.ts)

Zgodnie z UI.md (decyzja MIASTO/Master): cityPanel "Ulepsz" uzywa buildingLevelForEpoch
(poziom = epokaMiasta - epokaWejscia + 1, clamp do maksPoziom); koszt przez itemCost dla docelowego
poziomu; etykieta z nazwyPoziomow; przycisk tylko gdy poziom>1. Porzucone twarde 1->2. tsc=0, backup .bak-UI.

FLAGA DO MASTERA (1 luka, dotad sygnalizowana w paczce-produkcji):
- getBuiltBuildingIds zwraca string[] (bez poziomu) -> "Ulepsz" zaklada poziom biezacy=1.
  Jesli engine bedzie SLEDZIL poziomy budynkow per miasto -> potrzebny hak np.
  getBuiltBuildingLevels?(cityId)=>Record<string,number>; wtedy gating = targetLevel > currentLevel.
  Decyzja: czy/kto sledzi poziomy (SILNIK/MIASTO)?
- "Wykup": production.rushCost(prod) liczy w Pracy, a panel uzywa mnoznika ZLOTA (rush_cost_mnoznik) -
  inna semantyka. Zostawione bez zmian; do ujednolicenia z MIASTO/EKONOMIA jesli ma byc w zlocie.

STATUS UI: PLAN WYCZERPANY. Wszystkie 6 pkt planu (panel miasta, Bilans, HUD, menu, nowa gra, Zadowolenie/
Porzadek) ZROBIONE + udokumentowane (UI/Spec-UI.md) + odhaczone w Status-projektu (zakladka Civ-UI).
Moduly gotowe do wpiecia (kontrakty hakow w Spec-UI sek.3/4a/7). Reszta = integracja po Twojej stronie.

---
## [2026-06-25] DOMKNIECIE v0.1: Wstrzymaj (E.3) + stub Dyplomacji (pkt 4)

PKT 3 (panel produkcji) DOMKNIETY wg E.2-E.5:
- cityPanel.ts: przycisk Wstrzymaj/Wznow (import setPaused; pole CityProduction.wstrzymana?:boolean;
  badge "wstrzymana" + "Wstrzymane - brak postepu"; ETA chowane gdy wstrzymane; tylko miasta gracza).
  Silnik (advanceProduction) juz respektuje flage - UI tylko przelacza i odzwierciedla. tsc=0, backup .bak-UI.
- etaTurns lokalnie (E.2) OK; onRushBuy -> SILNIK konczy (E.4) OK (bez zmian); nazwyPoziomow: baza+nr do czasu
  danych z buildings.json (E.5) OK.

PKT 4 (stub Dyplomacji) ZROBIONY:
- NOWY modul src/ui/diplomacyPanel.ts (DOM-only, decoupled, scoped .civ-diplo). tsc=0.
  API: showDiplomacyPanel({ getRelations? }), updateDiplomacyPanel(), hideDiplomacyPanel(), isDiplomacyPanelOpen().
  Typy: DiploRelation { civ; tier:0..4; zaufanie?; respekt? }, DiplomacyPanelConfig { getRelations? }.
  5 tierow: Wojna/Wrogi/Neutralny/Przyjazny/Sojusz (progi WYWIEDZIONE z Dyplomacja-zasady: <15/<30/<60/<120/>=120).
  FLAGA do DYPLOMACJI/CYWILIZACJE: potwierdzic nazwy+progi 5 tierow; getRelations oczekuje tier policzony przez silnik
  (mapowanie relacji 0..200 -> 0..4). Brak akcji dyplomatycznych (nastepny krok po wpieciu danych z diplomacy.json).

PKT 1 (HUD) + PKT 2 (Bilans) juz zrobione wczesniej. DOMKNIECIE v0.1 UI = KOMPLET (panele 1-6 + dyplomacja-stub).
(diplomacyPanel dopisze do UI/Spec-UI.md przy nastepnym porzadkowaniu docs.)

---
## [2026-06-25] ZAPYTANIE do MIASTO (elementy widoku miasta z makiety)

Maciej przekazuje recznie. Pelna tresc: dyspozycje/_handoff/UI-do-MASTER_elementy-miasta.md.
Pytam MIASTO punktowo (1-9), ktore panele z bogatej makiety Widok-miasta sa w ich mechanizmie i jaki hak
dadza UI: Mieszkancy(nastroje), Specjalisci, Zdrowie, Podzial Handlu (suwak), Magazyny Surowcow (ilosc vs
dostep!), Kultura/Religia, Zasieg granic, Wioski, naglowek (Zarzadca/Zmien nazwe/Widok). Te "w mechanizmie"
rozbuduje w cityPanel; "nie w v0.1" zostawie jako placeholder lub usune wg ich decyzji.

---
## [2026-06-25] 9A + odpowiedz MIASTO wdrozona (Kultura/Surowce) — wszystko additive, tsc=0

9A (naglowek) ZROBIONE: 3 przyciski + haki onRename/onAutoManage/onArtView. 8B: wioski uspione - w widoku brak.
  Handoff: dyspozycje/_handoff/UI-do-MASTER_akcje-naglowka.md.

ODPOWIEDZ MIASTO (MIASTO-do-UI_widok-miasta-elementy.md) WDROZONA w cityPanel.ts:
- Kultura (pkt 6+7): panel Kultura realny przez hak getCultureState (kulturaSuma/przyrost/borderRadius/
  thresholds/zrodla); pasek do nastepnej granicy + zasieg granic kulturowych. Religia = etap 2 (placeholder).
- Surowce (pkt 5): jako DOSTEP (lista) przez getResourceAccess, NIE ilosc (zgodnie z v0.1).
- Placeholdery oznaczone: Specjalisci (poza v0.1), Zdrowie (poza v0.1), Podzial Handlu (kontrakt: EKONOMIA).

DO WPIECIA przez Master (configureCityPanel) + cross-lane: dyspozycje/_handoff/UI-do-MASTER_widok-miasta-wpiecie.md.
  Najwazniejsze: wpiac getOrderState/getCultureState/getResourceAccess/onAutoManage(=assignWorkedTiles)/onRename/onArtView.
  CROSS-LANE: PKT 4 Podzial Handlu -> ZAPYTANIE do EKONOMIA (getTradeSplit/setTradeSplit + kto przelicza plony).

Stan UI: panel miasta = realny wszedzie gdzie MIASTO ma dane; reszta jawnie oznaczona jako poza v0.1/cross-lane.

---
## [2026-06-25] PROSBA: przepnij otwarte tematy + zasada "no nowe UX bez potwierdzenia"

Zbiorczy routing wszystkich otwartych watkow UI (do przepiecia przez Ciebie do dzialow):
  dyspozycje/_handoff/UI-do-MASTER_routing-blokery.md
Grupy: A) integracja main.ts, B) decyzje (getBuiltBuildingLevels, 5 tierow Dyplomacji),
C) EKONOMIA (suwak Podzialu Handlu), D) MIASTO (wpiecie hakow danych + wioski + happinessBreakdown),
E) MAPA (minimapa, widok artystyczny, granice kulturowe, wioski), F) CYWILIZACJE/DANE (diplomacy.json, civs.json).

ZASADA (polecenie Maciej): UI NIE buduje nowych UX bez potwierdzenia z dzialu, jak ma wygladac.
Wstrzymuje wiec opcjonalne ozdoby (pierscien granicy kulturowej, pasek 3-koszykowy Mieszkancy) do potwierdzenia.
Standby do przepiecia/odpowiedzi.

---
## [2026-06-25] STATUS UI dla MASTERA (czym sie zajmuje / decyzje / co zostalo)

CZYM SIE ZAJMUJE / ZROBIONE:
- Dzial UI v0.1 = KOMPLET. Panele: cityPanel (pelnoekranowy widok miasta), empireBalance (Bilans), hud,
  mainMenu (+ustawienia), newGameFlow (kreator nowej gry), orderPanel (Zadowolenie/Porzadek), diplomacyPanel (stub).
  Panel parametrow: ui-params.json + uiParams.ts + UI-parametry.xlsx. Dokumentacja: UI/Spec-UI.md. Podglady w Civ/UI/.
  Wszystko additive, tsc=0, backupy .bak-UI. Praca przez subagentow Sonnet (sesja cienka).
- Ostatnio wdrozone: 9A (naglowek: rename/zarzadca/widok), 8B (wioski uspione = brak w widoku),
  odpowiedz MIASTO (Kultura pkt 6+7 przez getCultureState; Surowce pkt 5 = DOSTEP przez getResourceAccess).

POTRZEBUJE DECYZJI OD MACIEJ (merytoryka/UX):
1. Docelowy ZASIEG OKOLICY miasta (okolica_promien) — podaj liczbe, zmieniam jednym parametrem.
2. Czy chcesz pasek 3-koszykowy "Mieszkancy" (Zadowoleni/Kontentni/Niezadowoleni)? Jak tak -> zazadam od MIASTO helpera happinessBreakdown.
3. Czy domknac dlug DOC (Spec-UI: dopisac diplomacyPanel + nowe haki)? To dokumentacja, nie UX — zrobie na "tak".

POTRZEBUJE DECYZJI OD MASTERA:
1. getBuiltBuildingLevels(cityId) — czy/kto sledzi poziomy budynkow per miasto (dla 'Ulepsz' po epoce).
2. Potwierdzenie 5 tierow Dyplomacji (Wojna/Wrogi/Neutralny/Przyjazny/Sojusz + progi) -> przekaz CYWILIZACJE.
3. prodMap -> game/productionState.ts (juz zdecydowane przez Ciebie) — czekam na wpiecie.

CO ZOSTALO PO MOJEJ STRONIE (gdy odblokowane — wdrazam od reki przez subagenta):
- Dostosowanie cityPanel po decyzjach (Ulepsz: getBuiltBuildingLevels; Dyplomacja: realne tiery/dane).
- Podpiecie sekcji gdy dzialy dadza dane (przez istniejace haki — BEZ nowego UX, zgodnie z zasada).
- Opcjonalny dlug doc (na "tak" Maciej).
Poza tym BUDOWA UI = komplet; nic nie pali sie po mojej stronie.

WISI W INNYCH ZAKLADKACH (przepiecie: _handoff/UI-do-MASTER_routing-blokery.md):
- MASTER: integracja main.ts (wpiecie modulow + configureCityPanel + advanceProduction w turze).
- EKONOMIA: kontrakt suwaka Podzialu Handlu (getTradeSplit/setTradeSplit + kto przelicza plony).
- MIASTO: wpiecie hakow danych (getOrderState/getCultureState/getResourceAccess/onAutoManage=assignWorkedTiles);
  konwersja wioska->miasto (po "go"); opc. happinessBreakdown.
- MAPA: minimapa (HUD placeholder), widok artystyczny (onArtView), egzekucja granic kulturowych, dane wiosek.
- CYWILIZACJE/DANE: diplomacy.json (tiery relacji), pelne civs.json (kreator nowej gry).

ZASADA: UI nie buduje nowych UX bez potwierdzenia z dzialu. Standby do przepiecia/odpowiedzi.

---
## [2026-06-25] Zapytania zlozone (Maciej przekazuje recznie)
- EKONOMIA: zasieg okolicy miasta -> _handoff/UI-do-EKONOMIA_zasieg-okolicy.md
- EKONOMIA: nastroje mieszkancow (rozklad 3-koszykowy?) -> _handoff/UI-do-EKONOMIA_nastroje-mieszkancow.md
- CYWILIZACJE: dane Dyplomacji (5 tierow + getRelations) + civs.json do kreatora -> _handoff/UI-do-CYWILIZACJE_dyplomacja-i-civs.md
Po odpowiedziach wdrazam (Sonnet-subagent). Standby.

---
## [2026-06-25] AUTONOMICZNA RUNDA (Maciej: dzialaj sam ~1-2h, nie pytaj)

ZROBIONE (subagenty Sonnet, tsc=0 / node --check OK, backupy .bak-UI):
- diplomacyPanel.ts -> dostosowany do OFICJALNEJ skali CYWILIZACJE: tier 0 Wojna=STAN (status='wojna', nie score);
  mapowanie relacja->tier robi SILNIK (diplomacy.relationTier); UI bierze GOTOWY tier z getRelations(); zaufanie/respekt
  w wierszu; v0.1 = PODGLAD (bez akcji).
- Spec-UI.md -> DOMKNIETE: wszystkie moduly + pelna tabela hakow (w tym onRename/onAutoManage/onArtView/getCultureState/
  getResourceAccess), sekcje newGameFlow + diplomacyPanel, parametry nowa_gra, interakcje + potwierdzenia dzialow, data 2026-06-25.
- newGameFlow.ts -> szczegoly cyw wzbogacone o POTWIERDZONE pola: "Religia" + "Typ glowny" (klucze z civs.json).
- UI/Gra-podglad-MIASTO.html -> odswiezony do AKTUALNEGO cityPanel (9A przyciski, Wstrzymaj, Ulepsz-epokowy, Kultura,
  Surowce=dostep, AI read-only). To jest "jak wyglada teraz".

SCOPE-FLAGA (info, nie blokuje): akcje dyplomatyczne (wojna/pakt) = osobna iteracja po wpieciu applyDiplomaticEvent
  (CYWILIZACJE rekomenduje pozniej). UI gotowe na podglad.

KANDYDAT-GAP (DECYZJA MASTERA): ekran DRZEWKA TECHNOLOGII — jest makieta Makieta-drzewko-technologii.html + przycisk
  "Nauka" w HUD. Czy to ekran UI (jak menu/nowa gra)? Jesli tak: przydziel + potrzebny kontrakt danych tech od DANE/tech.
  NIE buduje bez przydzialu i potwierdzenia (zasada: zero nowych UX bez potwierdzenia).

WCIAZ BLOKADY (bez zmian po mojej stronie): EKONOMIA (zasieg okolicy, nastroje, suwak Handlu); MASTER (integracja main.ts,
getBuiltBuildingLevels, prodMap); MAPA (minimapa, widok artystyczny, granice kulturowe); CYWILIZACJE/DANE (diplomacy.json runtime).
Standby na odpowiedzi/wpiecie.

---
## [2026-06-25] MIASTO opublikowalo spec ZASIEGU okolicy (Civ/MIASTO/Zasieg-miasta-okolica.html)

Model POTWIERDZONY przez MIASTO:
- OKOLICA ROBOCZA (z populacji): pop<5 -> r5 (91 pol), pop>=5 -> r10 (331), pop>=10 -> r15 (721). Pola pracy + budowa ulepszen.
- GRANICA POLITYCZNA (z kultury): cityBorderRadius(kultura) 0..3 pierscieni, progi 100/250/500 -> r16/r17/r18.
  Kultura NIE zmienia okolicy roboczej.
- TERYTORIUM = okolica robocza (pop) + pierscienie kultury (addytywnie).

SKUTEK DLA UI: parametr okolica_promien=2 jest ZASTEPOWANY tym modelem. cityPanel "Okolica" ma rysowac realny zasieg
per miasto. Potrzebuje 1 HAKA runtime, propozycja:
  getCityRange(cityId) => { workedRadius: 5|10|15, cultureRings: 0..3 }   (lub getWorkedTiles(cityId)+borderRadius).
Po potwierdzeniu hooka/ownera wpinam od reki (mam potwierdzony design = moge budowac).

DO RECONCYLIACJI PRZEZ MASTERA (cross-lane):
- MIASTO = model zasiegu (ten plik) + okolica.cityRangeForPopulation + cityBorderRadius.
- EKONOMIA = ktore pola LICZA PLONY (dzis turn-economy.workedTilesForCity = CENTRUM+6 sasiadow = r1!) — czy plony maja
  isc z calej okolicy roboczej (r5/10/15) czy zostaja r1? (Moje wczesniejsze pytanie do EKONOMIA wciaz aktualne w tej czesci.)
- MAPA = egzekucja granicy politycznej (terytorium na mapie swiata).
UI tylko rysuje + bierze zasieg z 1 haka. Nie buduje, dopoki Master nie ustali ownera hooka (zasada: zero UX bez potwierdzenia integracji).

---
## [2026-06-25] EKONOMIA odpowiedziala: okolica (kontrakt) + nastroje (3A)

Plik: dyspozycje/_handoff/EKONOMIA-do-UI_okolica-nastroje.md. Po scaleniu okolica.ts/order.ts sa w lane EKONOMIA.
OKOLICA — kontrakt danych USTALONY (2 haki):
- getCityWorkedRange(cityId) => number  (= cityRangeForPopulation(pop): pop<5->5, >=5->10, >=10->15) — obwodka zasiegu.
- getWorkedTiles(cityId) => {q,r}[]      (= assignWorkedTiles: N najlepszych, N=populacja) — pola PODSWIETLone (obrabiane).
- Granica kulturowa = osobny overlay (getCultureState.borderRadius +0..3) — juz mam hak.
- Render: OBWODKA = zasieg roboczy; PODSWIETLENIE = worked tiles. (Plony dzis r1; EKONOMIA pogodzi w scaleniu — UI moze juz rysowac wg hakow.)
NASTROJE — 3A: zostaje getOrderState (netto szczescie + tier). happinessBreakdown/sources NIE w v0.1. Panel Mieszkancy = netto+tier.

POZOSTAJE (UX decyzja, NIE EKONOMIA): jak renderowac DUZY zasieg (r15=721 pol + kultura do r18) —
panel pelna siatka (zoom/scroll) vs MAPA SWIATA terytorium + panel kompaktowe podsumowanie. Pytam Maciej (rekom. = kompakt+mapa).
Po decyzji wpinam render okolicy (haki getCityWorkedRange/getWorkedTiles juz potwierdzone).

## [2026-06-25] OKOLICA: decyzja Macieja = WARIANT B + render ZAIMPLEMENTOWANY (panel)
- Maciej wybral B: panel miasta = KOMPAKT (zasieg roboczy r5/10/15 + pol w zasiegu + pol obrabianych N=pop + granica kultury + maly podglad pol obrabianych). Pelne terytorium = render na MAPIE swiata.
- ZROBIONE w cityPanel.ts (lane UI): nowe haki getCityWorkedRange/getWorkedTiles (addytywne), przebudowana sekcja Okolica na kompakt, walidacja skladni PASS (transpile, klamry 354/354). Bez publikacji kanonu.
- HANDOFF do MAPY (przepnij): dyspozycje/_handoff/UI-do-MASTER_okolica-render-mapa.md — overlay terytorium na mapie swiata wg tego samego kontraktu (obwodka=getCityWorkedRange, podswietlenie=getWorkedTiles, granica=getCultureState.borderRadius).

## [2026-06-25] ODP na PILNE #152 (koszty/subagenci): TAK-subagenci-Sonnet
Ciezka robote (kod/build/walidacja/mockupy) deleguje SUBAGENTOM na Sonnecie; sesja-dzial zostaje chuda (brief/odbior/handoff). Drobiazgi 1-2 linijki inline.

## [2026-06-25] PRZYJETE NOWE DYSPOZYCJE z UI.md (robie autonomicznie przez Sonnet-subagentow)
- #182 PICKER BADAN: modul sciencePicker.ts (lista dostepnych techow + pula vs koszt + setPlayerResearchTarget) + podglad Gra-podglad-NAUKA.html -> do AKCEPTACJI Macieja. Addytywne, bez kanonu.
- #167 OKNO 'polacz armie': modul armyStackPrompt.ts (modal [Polacz armie]/[Nie lacz], zwrot wyboru). Model merge = UNITS.
- #170/#178 PANEL ARMII (Total War): TYLKO MOCKUP Makieta-panel-armii.html (dwie polowy, karty jednostek, drag&drop, dolny pasek, M=scal rannych) -> do AKCEPTACJI Macieja PRZED implementacja. Logike da UNITS.
- #157 (7A HUD plaster) + #158: STANDBY do sygnalu wpiecia (bez nowego UX).
- Status Excel (zakladka Civ-UI): NIE edytuje wspoldzielonego xlsx rownolegle (ryzyko konfliktu) — raportuje tu; przepnij/odhacz po swojej stronie jesli chcesz.

## [2026-06-25] GOTOWE MODULY UI (handoffy do wpiecia) + MAKIETY do akceptacji
ZROBIONE (Sonnet-subagenci, walidacja skladni PASS, bez kanonu):
- sciencePicker.ts (#182) — picker celu badan; configureSciencePicker + showSciencePicker(ownerId?). Haki: getAvailableTechs/getCurrentTarget/getSciencePool/onSelectTarget(=setPlayerResearchTarget). HANDOFF: _handoff/UI-do-MASTER_picker-badan.md. Podglad do akceptacji: UI/Gra-podglad-NAUKA.html.
- armyStackPrompt.ts (#167) — modal [Polacz armie]/[Nie lacz]; showArmyStackPrompt({onMerge,onKeep}). HANDOFF: _handoff/UI-do-MASTER_okno-polacz-armie.md. Model merge = UNITS.
- Okolica (cityPanel) — kompakt B; podglad UI/Gra-podglad-MIASTO.html zaktualizowany.
MAKIETA do AKCEPTACJI Macieja PRZED implementacja:
- UI/Makieta-panel-armii.html (#170/#178) — Total War transfer/wymiana (dwie polowy, karty, drag&drop, dolny pasek, M=scal rannych). Po akceptacji: implementacja modulu + handoff. Logike da UNITS.
Wpiecie obu modulow (sciencePicker, armyStackPrompt) w main.ts = strona mastera; configi addytywne jak diplomacyPanel.

## [2026-06-25] KOREKTA #182: picker badan -> DRZEWKO + alokacja (decyzja Macieja)
Maciej: nauka/badania maja byc w DRZEWKU technologii z wbudowana alokacja „ile na co przeznaczac".
- sciencePicker.ts (lista, jednocelowy) = INTERIM. NIE wpinaj na stale — bedzie przebudowany na picker-drzewko.
- Model nauki + AKTUALIZACJA danych drzewka = EKONOMIA (Maciej routuje do nich). Kluczowe do ustalenia: model jednocelowy ([214]: 1 cel, pula->ukonczenie) vs ROZDZIAL puli na kilka celow (alokacja „ile na co").
- UI ma baze: Makieta-drzewko-technologii.html, gra/data/tech.json, gra/src/types/tech.ts. Po potwierdzeniu modelu EKONOMII przebuduje picker na drzewko.
- STATUS: UI STANDBY (Maciej: „poczekaj jak ono ma to poprawic, dam znac").

## [2026-06-25] ZROBIONE #182->DRZEWKO: sciencePicker przebudowany (wymaga RE-WIRE)
EKONOMIA potwierdzila model (EKONOMIA-do-UI_nauka-w-drzewku.md): jednocelowy, wybor celu KLIKIEM w drzewku, „ile na co" = wybor celu (BEZ splitu).
- sciencePicker.ts: lista -> INTERAKTYWNE DRZEWKO (kolumny epok Kamien/Braz/Zelazo, wezly+prereqi, statusy, pasek pula vs koszt + ETA). Walidacja PASS (96/96). Backup .bak-UI. Eksporty NIEzmienione (przycisk Nauka dziala).
- ⚠ RE-WIRE configa: stary (getCurrentTarget/getSciencePool/getAvailableTechs-obiekty) ZASTAPIONY. Nowy: getResearchState/getResearchedTechs/getAvailableTechs(string[])/onSelectTarget. Mapowanie na window.__civ_*: HANDOFF _handoff/UI-do-MASTER_drzewko-nauki-rewire.md. JEDNA nowa rzecz do dodania: window.__civ_getResearchedTechs()=>string[] (lub zbadane w getResearchState).
- Podglad do akceptacji Macieja: UI/Gra-podglad-NAUKA.html (drzewko).
- Drzewko czyta gra/data/tech.json; Zelazo dochodzi od EKONOMII (EKONOMIA-do-MASTER_tech-tree-zelazo.md).

## [2026-06-25] DRZEWKO: rebase na ZROBIONY uklad (Makieta-drzewko-technologii)
Maciej: drzewko ma byc oparte o zrobione drzewo (uklad strefowy z dzielnikiem/rynnami), nie proste kolumny-karty.
- sciencePicker.ts: PORT ukladu z Makieta-drzewko-technologii.html (strefy epok K0-K1/B0-B4/Z0-Z3, gruby dzielnik, ortogonalne krawedzie w rynnach, sort barycentryczny, tooltipy z odblokowaniami) + warstwa interaktywna (statusy zbadana/cel/dostepna/zablokowana, klik=cel, pasek pula vs koszt + ETA). Data-driven z tech.json. Walidacja PASS (261/261). Backup .bak-UI.
- Config/eksporty BEZ ZMIAN -> handoff RE-WIRE (UI-do-MASTER_drzewko-nauki-rewire.md) DALEJ aktualny (te same 4 haki).
- Podglad: UI/Gra-podglad-NAUKA.html (interaktywne drzewko strefowe).

## [2026-06-26] MINIMAPA HUD: przygotowana, czeka na MAPE (decyzja Macieja = C)
Maciej: minimapa we wspolpracy z MAPA, dopiero potem wpiecie pelnego HUD.
- hud.ts: haki minimapy (addytywne): onMountMinimap(el,{w,h}) [MAPA renderuje] LUB getMinimapData() [UI rysuje siatke z danych] + onMinimapClick(q,r). Obie sciezki gotowe. Walidacja PASS (73/73). Backup .bak-UI.
- Rekomendacja: wariant B (getMinimapData — UI rysuje lekka minimape z danych; render 3D MAPY za ciezki do slotu; MAPA juz zakladala ze minimape rysuje UI).
- HANDOFF do MAPY: _handoff/UI-do-MASTER_minimapa-wspolpraca-MAPA.md (ABC: wariant A vs B).
- Podglad: UI/Gra-podglad-HUD.html (dziala render z przykladowych danych).
- WPIECIE pelnego hud.ts: master DOPIERO gdy MAPA dostarczy dane/render (nie teraz).

## [2026-06-26] DRZEWKO zaakceptowane (Q2=A) z warunkiem: UKLAD BEZ PRZECIEC — preview gotowy
Maciej zaakceptowal wyglad drzewka POD warunkiem: linie prereq nie przecinaja sie miedzy roznymi techami (lub bundling w jedno zrodlo).
- Nowy uklad: warstwy (strefy epok + kolumny wg glebokosci) + sort barycenter (iteracyjny, konwergencja) + ROUTING z MAGISTRALA per-zrodlo (krawedzie z tego samego zrodla = jedna magistrala) + cross-epoka korytarzem dolnym/gornym z unikalnymi torami. Weryfikacja programowa Node: N=0 PRZECIEC (147 segmentow parami).
- Preview: UI/Makieta-drzewko-uklad-bez-przeciec.html.
- NASTEPNE: po akceptacji ukladu przez Macieja -> port algorytmu do sciencePicker.ts (zastapi obecny routing). sciencePicker.ts na razie NIETKNIETY.

---
## [2026-06-26] SPRINT 1 — HUD D1=C + UX bitwy D5=B + minimapa D15=B — GOTOWE

Decyzje Macieja: D1=C, D5=B, D15=B. Lane src/ui/* ONLY (NIE main.ts).

ZROBIONE:
- **minimapHud.ts** (NOWY) — canvas minimapa z getMinimapData(); pozycja lewy-dolny (Makieta-HUD); eksport createMinimapHud + typy MinimapData/MinimapHexData.
- **sidePanelHud.ts** (NOWY) — szkielet panelu wydarzeń (prawy panel, chipy science/culture/city/unit/enemy); placeholder gdy brak getEvents().
- **hud.ts** (ZMODYFIKOWANY) — integracja minimapHud + sidePanelHud; nowe haki HudConfig: getEvents/onEventClick/onEventDismiss; re-export SidePanelEvent. Backup .bak-UI.

HANDOFFY:
- `_handoff/UI-do-UNITS_ux-bitwy-q2-q7-totalwar.md` — domyslne odpowiedzi Q2-Q7 (Total War: Pharaoh): minimapa bitwy, tooltipy, preBattle layout, styl ciemny+zloto, sterowanie mysz+skroty.
- `_handoff/UI-do-MAPA_minimap-contract.md` — kontrakt getMinimapData() dla MAPY (D15=B).
- `_handoff/UI-do-MASTER_hud-D1C.md` — instrukcja wpiecia showHud/updateHud w main.ts + DoD.

STAN: dyspozycje/UI-STAN.md (nowy).

CZEKA:
- MASTER: wpiecie hud.ts w main.ts (handoff hud-D1C).
- MAPA: implementacja getMinimapData() + onMinimapClick->focusHex.
- UNITS: implementacja UX bitwy wg Q2-Q7 (handoff do UNITS).
- Maciej: akceptacja propozycji Q2-Q7 (D5=B — domyslne juz w handoff).

---
## [2026-06-26] D1=B — mockup HUD od zera GOTOWY · wpiecie DEFER

Decyzja Macieja: D1 zmienione C→**B** (nowy pasek od zera, pełny projekt). Wpięcie `hud.ts` w `main.ts` **ZABLOKOWANE** do akceptacji mockupu.

ZROBIONE (lane UI, NIE main.ts):
- **UI/Makieta-HUD-D1B-preview.html** — samodzielny podgląd (dwuklik): górny pasek zasobów (Złoto/Praca, Wpływ/Nauka, Kultura/Zadowolenie, Osiedla/Nacja, Wealth placeholder D3=C), epoka+tura, minimapa lewy-dolny (D15=B siatka heksów canvas), panel boczny wydarzeń prawy, dolny pasek: Koniec tury / Miasta / Nauka / Dyplomacja / Menu, tło pseudo-3D mapy + granica terytorium wizualna, styl ciemny+złoto (spójny z Makieta-HUD-mapa-swiata.html).
- **docs/MACIEJ-HUD-CHECKLIST-D1B.md** — tabela Element | W mockupie? | Uwagi dla weryfikacji Macieja vs v1.0.

STAN: dyspozycje/UI-STAN.md zaktualizowany.

CZEKA:
- **Maciej:** otwórz mockup → checklist → feedback w czacie MASTER (co dodać/zmienić).
- **MASTER:** wpiecie hud.ts DEFER do akceptacji; po OK: port D1=B do hud.ts + batch main.ts.
- **MAPA:** getMinimapData() (bez zmian kontraktu D15=B).

UWAGA: Istniejący kod lane D1=C (`hud.ts`, minimapHud, sidePanel) — baza techniczna; wygląd docelowy = mockup D1=B.

---
## [2026-06-26] D5 Q5 — preBattle layout GOTOWE

Decyzja Macieja: D5=B. Spec: `_handoff/UI-do-UNITS_ux-bitwy-q2-q7-totalwar.md` §Q5.

ZROBIONE (lane UI, NIE main.ts):
- **preBattle.ts** — layout Q5: nagłówek „Starcie" + badge terenu + pasek szanseAtkPct (%); **dwie kolumny** (atakujący lewo / obrońca prawo) z kartami jednostek (nazwa, typ, HP, ilość, atak); dół 3 przyciski **Auto-rozstrzygnij** · **Pole bitwy** · **Wycofaj się**. Usunięta środkowa kolumna (teren/szanse przeniesione do nagłówka). Styl Q6: tło `rgba(12,18,35,0.90)`, złoto `#e8d88a`/`#C9A84C`, frakcje atak `#c84040` / obrona `#4090c8`, font Segoe UI. **API bez zmian:** `PreBattleInfo`, `PreBattleCallbacks`, `showPreBattle`/`hidePreBattle`. Backup: `preBattle.ts.bak-UI`.

CZEKA:
- **MASTER:** brak wpiecia wymaganego (moduł gotowy; main.ts już importuje preBattle — weryfikacja wizualna po kanonie).
- **UNITS:** reszta Q2–Q4, Q6–Q7 w battleScene.

STAN: dyspozycje/UI-STAN.md zaktualizowany.

---
---
## [2026-06-26] SPRINT 1A/4A — suwaki Handlu + Wealth + Kup jednostkę — GOTOWE

Decyzje Macieja: 1A (podział Handlu per miasto), 4A (plaster produkcji). Lane `src/ui/*` ONLY — **NIE** `main.ts`, `hud.ts`, `minimapHud.ts`.

ZROBIONE:
- **cityPanel.ts** — żywe suwaki Podziału Handlu (Skarbiec/Nauka/Społeczeństwo), suma=100%, default wyświetlany 70/20/10; callback `onPodzialHandluChange`.
- Blok **Wealth** (W, pula, próg nast. W, mnożnik Skarbca, wpływ na szczęście) z `city.wealthState` + `loadWealthParams`.
- **buildableProduction** zamiast `availableProduction` dla budynków; sekcja **Kup jednostkę** z `purchasableUnits` + `onPurchaseUnit`.
- Opcjonalny suwak Podziału Pracy (`onPodzialPracyChange` — sekcja widoczna tylko gdy hak podany).
- Nowe eksporty typów: `PodzialHandluSplit`, `PodzialPracySplit`.
- Backup: `cityPanel.ts.bak-UI-2026-06-26`.

HANDOFF: `dyspozycje/_handoff/UI-do-MASTER_wealth-suwaki.md` — API callbacków + snippet wpiecia + pola City od EKONOMII.

WPIĘTE (MASTER 2026-06-26):
- `configureCityPanel`: `onPodzialHandluChange`, `onPodzialPracyChange`, `onPurchaseUnit`, `getPodzialHandlu/Pracy`.
- EKONOMIA: `podzialHandlu`/`podzialPracy` na `City` + `toEconomyCity` per-city — OK.

DoD UI+MASTER: **ZAMKNIĘTE** (pakiet 1A/4A/2A plaster). Kanon — po build+Opus.

---

## [2026-06-26] A1-Q5 — pasek wojen HUD + wywiad Dyplomacja

Decyzja Macieja: **A+C custom** (tylko wojna z nami na mapie; szczegóły + wojny innych w Dyplomacji).

ZROBIONE:
- `hud.ts` — `getWarsWithPlayer`, pasek `.civ-war-strip` (czerwony, ⚔ + nazwa); klik → `onOpenDiplomacy`; usunięto Zadowolenie z paska (A1-Q3).
- `diplomacyPanel.ts` — `getKnownWarsBetweenOthers`, sekcja „Wojny znane (wywiad)".

HANDOFF: `dyspozycje/_handoff/UI-do-MASTER_hud-wojna-A1Q5.md`

Testy: nie uruchomiono (sandbox).

→ SILNIK: **CZEKA** haki w `main.ts` przy wpięciu HUD D1B.

---

## [2026-06-26] E1 — kreator nowej gry (defaulty Macieja)

Od: Grupa E · Lane UI

ZROBIONE:
- `newGameFlow.ts` — default **Rzymianie** (`civId=ikonaId`), Kamień, typ świata, skala rywali
- `NewGameParams`: +`epochId`, +`worldType`, +`typSwiata`
- `ui-params.json` — `world_type` (Kontynenty/Pangea/Wyspy/Ziemia)

HANDOFF: `dyspozycje/_handoff/UI-MAPA-do-MASTER_E1-defaulty-startu.md`

→ SILNIK: **GOTOWE DO WPIĘCIA** (main.ts — seed, typSwiata, epoka)

---

## [2026-06-26] RAPORT: B2 społeczeństwo — panel miasta lewa kolumna

Od: Grupa B / UI lane · sesja autonomiczna

ZROBIONE:
- `cityPanel.ts` — Mieszkańcy (happinessBreakdown + emotikony), Porządek inline, Zdrowie (+/-); bez Specjalistów
- `orderPanel.ts` — `buildOrderSectionHtml`, `orderTierUi`
- `turn-economy.ts` — `computeCityHealthBreakdown`, `CityHealthLine`
- Nowe haki: `getOrderState`, `getCityHealth` (opcjonalne; bez nich = szacunek z badge)
- Decyzje prowizoryczne: B2-Q4=C, B2-Q5=A (do potwierdzenia Macieja)

HANDOFF:
- `dyspozycje/_handoff/UI-do-MASTER_B2-spoleczenstwo.md`
- `dyspozycje/_handoff/UI-do-GRUPA-A_B2-Q5-bunt-chip.md`

Testy: `tsc --noEmit` OK · bramka logic-test nie uruchomiona (sandbox)
NIE ruszano: `main.ts`, kanon

→ SILNIK: **CZEKA** wpięcie haków B2

---

## [2026-06-26] C1 preBattle TW — port preBattle.ts (sesja autonomiczna)

ZROBIONE:
- `gra/src/ui/preBattle.ts` — layout TW: 3 kolumny, generałowie, pionowy pasek mocy, pergamin, 4 akcje (Zapisz gdy `onSave`)
- API: `PreBattleModifier`, `PreBattleOptions`, rozszerzone `PreBattleInfo` / `PreBattleSide`
- Keyboard: Enter=Bitwa ręczna, Escape=Wycofaj (prowizoryjne C1-Q2b/A)
- Backup: `preBattle.ts.bak-UI-C1TW-20260626`
- Handoff SILNIK: `C1-do-SILNIK_preBattle-wpiecie.md`
- Decyzje prowizoryczne: `docs/decyzje/C1-DECYZJE-PROWIZORYCZNE.md`

NIE ruszano: `main.ts`, kanon

→ Master: handoff `DO-MASTERA.md` § C1 · **C1-Q2b…Q5 OTWARTE** (tylko ABC Macieja) · moduł UI gotowy

---

## [2026-06-27] MASTER → Grupa E: P0 integracja grywalna (Maciej)

**Dyspozycja:** `dyspozycje/_handoff/MASTER-do-E_integracja-grywalna.md`  
**Handoff do F (szablon):** `dyspozycje/_handoff/E-do-SILNIK_wpiecie-grywalne.md`  
**Cel:** jeden flow `Gra-podglad.html` → menu → kreator → mapa; E mapuje połączenia, F wpina `main.ts` + build kanonu.  
**Flaga po E:** `→ SILNIK: GOTOWE` w `DO-MASTERA.md` § E.

---

## [2026-06-27] HANDOFF MASTER — mockupy HUD D1B (P0+P1) · Maciej ABC1=A

**Od Macieja:** mockupy zaakceptowane (**ABC1=A**). Maciej decyduje **tylko gameplay ABC** (D1–D15) — nie wybory techniczne mockupu.

**GOTOWE do MASTER:**
- Hub: `UI/Makieta-HUD-D1B-preview.html` (+ START, mockup-embed.js)
- Handoff: `dyspozycje/_handoff/UI-do-MASTER_hud-D1B-mockupy.md`
- Przewodnik: `docs/A1-HUD-KLIKI-MOCKUP-PRZEWODNIK.md`
- Układ: `docs/decyzje/A1-revB-uklad-mockup.md` · Logika: `docs/A1-HUD-MAP-KLIKNIEC.md`
- Checklist: `docs/MACIEJ-HUD-CHECKLIST-D1B.md` (sign-off ABC1=A)

**Kolejność MASTER:** Opus review mockupów → batch `hud.ts` / routing klików (bez iframe w kanonie) → build/test → kanon.

**NIE ruszano:** `main.ts`, `Gra-podglad.html` (mockupy only).

**Flaga:** GOTOWE (mockupy) · CZEKA Opus → integracja SILNIK

---

## [2026-06-27] B2-Q5=C — alert buntu (Maciej)

**Decyzja:** B2-Q5=C — chip w panelu wydarzeń + ikona 🔥 na heksie miasta (do końca tury).

**Handoff Grupa A:** `dyspozycje/_handoff/UI-do-GRUPA-A_B2-Q5-bunt-chip.md`  
**Handoff MAPA:** `dyspozycje/_handoff/MAPA-do-SILNIK_B2-Q5-bunt-hex.md`

**Paczka B2:** zamknięta (Q1…Q6). Lane UI panelu miasta — gotowe; alert mapy — CZEKA A+MAPA+SILNIK.

---

## [2026-06-27] A1-Q11=A + A2-Q4=A — decyzje Macieja (Grupa A)

**Decyzje:**
- **A1-Q11=A** — **Kultura** na pasku [A] (poz. 7 po Ludności): wartość + +X/t, tooltip; **nie** Wpływ
- **A2-Q4=A** — pełna karta jednostki [H] na dole mapy (mockup `Makieta-panel-jednostki.html`)

**Zrobione:**
- `docs/decyzje/A1-revA-zasoby-pasek.md`, `A2-jednostka-mapa.md`, `MAPA-PYTAN-OPEN.md`, `STATUS.md`
- Mockup: wiersz Kultura w `Makieta-HUD-D1B-preview.html`
- Handoff: `dyspozycje/_handoff/UI-do-MASTER_A2-Q4-panel-jednostki.md`

**Testy:** N/A (decyzje + mockup HTML)

→ **SILNIK: GOTOWE DO WPIĘCIA** (spec F-HUD: kulturaRate + panel [H]) · **NIE** ruszano `main.ts`

---

## [2026-06-27] Grupa A — moduły D1B + A4 (lane UI)

**ZROBIONE** (bez `main.ts`):
- `buildModeHud.ts` — panel 15 ulepszeń + banner (A4-Q1=A)
- `unitPanelHud.ts` — panel [H] (A2-Q4=A)
- `bottomBarHud.ts` — WYKONAJ + Koniec tury (A1-Q9)
- `mapToolbarHud.ts` — toolbar [C] + 🔨 Budowa
- `hud.ts` — orkiestracja (haki `mapToolbar`, `buildMode`, `unitPanel`, `onExecutePending`)
- `sidePanelHud.ts` — `blocking` bez ✕

Handoff SILNIK: `_handoff/UI-MAPA-do-SILNIK_D1B-A4-batch.md`  
→ **SILNIK:** wpięcie + `updateHud()` po turze

---

## [2026-06-27] Grupa E — sync mockupów 12=A (Maciej)

**Decyzje:** ABC 12=A + prośba Macieja (Żelazo wybieralne, layout epoki, menu hybryda)

**Zrobione (mockupy HTML + kreator TS):**
- `UI/Makieta-flow-nowa-gra.html` — 9 cyw, Żelazo dostępne, tech kaskadowe, Standard/Ziemia/rywale ±1, layout bez pustej przerwy do „Dalej"
- `UI/Gra-podglad-MENU.html` — menu 5=C (Rozpocznij · Kampania · Multi · Ustawienia · Więcej), 6=A toast Wkrótce, 7=A tło wideo placeholder
- `gra/src/ui/newGameFlow.ts` — Żelazo `avail:true`, layout epoki, mniejszy intro
- `gra/data/ui-params.json` — wersja menu „Kamień, Brąz & Żelazo"

**Handoff:** `_handoff/GRUPA-E-do-UI_sync-mockupy-12A.md` → **GOTOWE (mockupy)**

**Nadal CZEKA (kod gry, nie mockup):**
- `mainMenu.ts` refactor (handoff `GRUPA-E-do-UI_menu-S0-5C.md`)
- SILNIK: `grantTechEpokWczesniejszych` przy starcie z Brązu/Żelaza

→ **MASTER:** mockupy gotowe do review Opus / playtest Macieja; implementacja menu + silnik = osobne batche

---
