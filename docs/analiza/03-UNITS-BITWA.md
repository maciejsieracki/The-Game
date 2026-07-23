# 03 — Analiza: UNITS / BITWA

*Wygenerowano autonomicznie: 2026-06-26 | Źródła: UNITS-DO-MASTERA.md, DOKUMENTACJA-UNITS-BITWA.md, Macierz-walki.xlsx, DZIENNIK-MASTERA.md*

---

## 1. Zakres lane'a

**UNITS/Battle** — jednostki + bitwa taktyczna. Pliki wyłączności:
- `src/units.ts`, `src/battle/` (wewnętrzne: `battleScene.ts`, `battle-terrain.ts`, `combat.ts`)
- Dane: `units.json`/Jednostki.xlsx (47 jednostek, deduplikacja po Osadniku), `counters.json`, `Macierz-walki.xlsx`
- Makiety/galerie: `Civ-UNITS/` (Galeria-jednostek-4widoki.html, Makieta-przed-bitwa, Makieta-pasek-armii, Makieta-panel-armii.html)

## 2. Stan obecny (~68% ukończenia)

### ZROBIONE (BITWA Gra-podglad-BITWA.html, ~939 KB)
- **46 jednostek** (Osadnik usunięty decyzja 2A; Zwiadowca zostaje)
- **Modele 3D** (proceduralne w `units.ts`):
  - 12 bespoke modeli nacyjnych (Impi, Izijula, Włócznik sumeryjski, Łucznik sumeryjski, Rydwan sumeryjski, Łucznik egipski, Wojownik z khopesh, Rydwan egipski, Estólica, Huaracoc, Jeździec chiński, Kusznik [NIEAKTUALNE — jednostka Kusznik usunięta z units.json 2026-07-10, model w `src/render/units.ts` zostaje jako dead code, 2026-07-23])
  - + 11 nowych jednostek (Brąz: Wojownik mykeński, Rydwan mykeński, Wojownik Sherden, Halabardnik Shang, Rydwan Shang, Łucznik akadyjski; Żelazo: Wojownik celtycki, Gaesatae, Rydwan celtycki, Wojownik germański, Berserker germański)
  - Dispatch PO NAZWIE (buildNamedUnit, nie po epoce) — model zostaje po przeniesieniu między epokami w Excelu
- **RESTrukturyzacja modelu danych** (units.json):
  - "Nazwa EN" (kanoniczna ang., 47 zmapowanych PL→EN)
  - "Typ" (klasa bojowa): Civilian 3, Swordsman 19, Distance 10, Mount 9, Spearman 3, Offensive 2, Falangite 1
  - "Klasa": Standardowa 14, Specjalna 26, Super 7
  - "Nacja": generic 13 + 9 nacji (Grecja 4, Chiny 5, Inkowie 5, Sumer 5, Egipt 4, Zulu 3, Celtowie 3, Rzym 2, Germanie 2, Ludy Morza 1)
  - 6 kolumn "Bonus vs <Typ> %" (Spearman/Falangite +50% vs Mount; Mount +50% vs Distance, +25% vs Offensive; Offensive +25% vs Swordsman; Swordsman +15% vs Spearman)
  - Morale bazowe + Morale ucieczki (absolutny poziom, nie %)
  - "Zmiana na" (łańcuch awansu) + "Dostępna w epokach" (okno 2 epok: E + E-1; niebojowe zawsze)
- **Bitwa taktyczna** (battleScene.ts, 5644 linii):
  - Pole 34×78 (BF_ROWS +50), konnica/rydwany na skrajnych wierszach (skrzydła)
  - **Model morale**: 8 czynników (flanka/tył, szarża, zabijanie/rout, wróg pęka obok, otoczenie, teren obronny, załamanie armii, generał placeholder)
  - **Rout-before-death**: cios łamiący morale → ucieczka zamiast śmierci (hp cap=1); neverRout (berserk) nie pękają
  - **Rout = normalny ruch turowy** (1 kafel/krok przez `_doMove`, nie ciągły glide); uciekinier zablokowany → po 2 turach `_removeUnitFromScene`
  - **ARMY_MORALE_LOSS_THRESHOLD** = 20% (per-unit rout 35%)
  - **Progi ucieczki** obniżone /2 (zostają dłużej, część ginie)
  - **Watchdog anty-pat** (STALL_TURN_LIMIT=6 tur bez zmian → rozstrzyganie po morale armii)
  - **AI bitwy** (1A/2A/3A): targeting=najbliższy; wrecz=najkrótsza droga naprzód; dystansowe=strzelaj ASAP + kiting (MAX zasięg, cofaj gdy wróg ≤2); bez amunicji → cofają się za linię; Legionista 2 pila → miecz; teren minimalnie
  - **Skirmisher kite & strzał w tej samej turze** (`_bestKiteShotStep`: cofa 1 kafel zachowując cel w zasięgu, strzela)
  - **SPEED_STEPS** 1/2/4/8/16/32/64/128/256/512 (klawisz S)
  - **Pauza P** (+ przycisk + badge)
  - **Etykiety strat HP** na zegarze realnym ~2 s (nie znikają przy x64)
  - **Paski**: HP/MORALE/AMUNICJA (gora→dół); ramka na 2 dla niestrzelających; pusta amunicja = czarny prostokat
  - **Obwódka frakcji** (atak=czerwony, obrona=niebieski)
  - **Log 10 ostatnich starć** (panel prawy-góra)
  - **Ekran końca**: pauza + panel zwycięzcy + staty per strona (straty/pozostali/HP) + przycisk "Zakończ bitwę" + "Szczegóły" (Zniszczone/Zrootowane/Ocalale per nazwa)
  - **AUDIO proceduralne**: 5 SFX (stal o stal, swist strzały, etc.) + ambient (PAD SWELLES + melodia pentatonika/dorian wg terenu)
- **Analiza balansu** (Macierz-walki.xlsx): Monte Carlo 44 jednostek bojowych × baseline (Wojownik z mieczem i tarczą), 300 rep/matchup; macierz typów 500 rep

### TESTY
- combat 6/6, barbarians 53/53, logic 163/163 (wg UNITS); QA verify: tsc 0 w MOICH plikach (pre-existing w converters.ts/upkeep.ts/main.ts)
- vite build 935–939 KB

## 3. Otwarte wątki / kontrakty do dostarczenia

| # | Wątek | Status | Czeka na |
|---|-------|--------|----------|
| 11 | Bitwa→kanon (10A) + UX bitwy | BLOK | Maciej: UX Q2–Q7 (Q2=A zaakceptowane: jednocelowy, klik w drzewku) |
| 12 | Nowe jednostki render + oblężenie wg epok | ROBI | Modele + epoki units.json (GOTOWE) |
| #3 | Kontrakt multi-unit + posiłki 1-heks | CZEKA | UNITS dostarcza (1v1 dziś) |
| #Start oblężenia | Start oblężenia + HP garnizonu + machiny in-siege | CZEKA | UNITS kontrakt → SILNIK dopina turę oblężenia |
| #UX bitwy | Faza deploymentu (gracz rozstawia przed Start) | BLOK | Maciej akceptacja makiety |

### Balans (do decyzji Macieja — z Macierz-walki.xlsx)
1. **Włócznik deadlock** (vs Włócznik/Falanga = remis po 50 rund) — podnieść Przebicie czy obniżyć HP?
2. **Falanga dominuje** (100% vs baseline, pobija każdy typ) — koszt odpowiedni?
3. **Super-jednostki jednorodne** (Hieros Lochos, Evocati, Hu Ben Wei, uThulwana, Królewska Gwardia, Medżaj, Gwardia Sumeru = wszystkie 100%) — czy celowo? obniżyć HP 2-3 o ~10-12%?
4. **Słabe jednostki** (Wojownik Kamień, Galera, Impi 0%, Procarz <5%) — design intent?
5. **Gaesatae/Berserker** (ATK=10, DEF=2, ARM=0) — gamblerzy, duża wariancja

## 4. Decyzje Macieja zamknięte

- **1A/2A/3A AI bitwy**: targeting=najbliższy; wrecz naprzód; dystansowe kite + strzelaj ASAP; bez amunicji wycofanie
- **Konnica/rydwany na skrzydłach**: 2+2/stronę
- **Progi ucieczki /2**: zostają dłużej na polu
- **Morale model**: bazowe + ucieczki (absolutny), 8 czynników
- **Trupy ODŁOŻONE** (brak renderu trupów)
- **Ambient PRZYWRÓCONY** (spokojny PAD + melodia, nie buczenie)
- **Q2=A drzewko** zaakceptowane pod warunkiem: uklad bez przecięć (preview Makieta-drzewko-uklad-bez-przeciec.html, N=0 przecięć)

## 5. Machiny oblężnicze (ostatecznie 2026-06-26)

| Machina | Epoka | Budowa |
|---------|-------|--------|
| Taran | Kamień | in-siege (1/turn w turze oblężenia) |
| Wieża oblężnicza | Brąz | in-siege |
| Katapulta | Średniowiecze (epoka 5) | Warsztat oblężniczy (Żelazo, epoka 3) — DOBUDOWYWANA do armii |

> Decyzja #1 (Żelazo) NIE dotyczy już machin oblężniczych — Taran/Wieża niezależne, Katapulta poza v0.1.

## 6. Właściciele

| Rola | Model |
|------|-------|
| Implementacja ( Composer ) | `composer-2.5-fast` subagent |
| UX bitwy spec ( GLM ) | `glm-5.2-max` subagent |
| Combat test 6/6 ( Opus ) | Opus 4.8 Ask/Agent |
| Decyzje UX Q2–Q7, balans | Maciej |

## 7. Quick wins / next

| # | Co | Effort |
|---|-----|--------|
| QW3 | Okno połącz-armie (UI gotowe, czeka kontrakt UNITS merge) | S |
| EP3 | Model ruchu kompletny (1C + fight/flee + stacking + posiłki) | L |
| EP4 | Oblężenie end-to-end (start → tura → szturm → przejęcie) | M |

## 8. Ryzyka

- **Edit/Write na pliku w OneDrive UCINA plik** (5068→5050) — edytować WYŁĄCZNIE kopię /tmp przez python, build w /tmp, deploy przez cp
- **Dwa pliki bitwy**: Gra-podglad.html=kanon (zostaje); Gra-podglad-BITWA.html=podglad do testów bitwy (usunąć dopiero po wpieciu bitwy w kanon — czeka na decyzję)
- **Globalna zamiana głównego klucza na angielski** NIE wykonana (celowo — "Jednostka" PL zostaje kluczem dopasowania)
