# P1.1B — Katalog plików pozostałych podkatalogów `gra/src` (pin web `main` = `edb8fb56`)

**Temat:** `R-RUSTPORT-P1-1B-REMAINING-DIRS-Q1` · **Runda:** 1/5 · **Rola:** Operator (Haiku 5.5 medium)
**Źródło:** `git ls-tree -r edb8fb56 -- gra/src` oraz `git show edb8fb56:<ścieżka>` (odczyt z obiektów Git, bez zmian w `gra/**`).
**Zakres:** 9 podkatalogów bezpośrednio w `gra/src/` nieobjętych P1.1 (`util, types, input, perf, oblezenie, wonderpreview, data, audio, assets`). Z listy 15 podkatalogów `gra/src/*` odjęto 6 z P1.1 (`game, ui, map, units, battle, render`). Pliki leżące bezpośrednio w `gra/src/` (`main.ts`, `buildInfo.ts`, `vite-env.d.ts`) nie są podkatalogiem; figurują w sumie globalnej i są opisane w P1.1 (sekcja „Entry pointy”).
**Metoda liczb:** w tej rundzie: liczba plików = wiersze `git ls-tree -r --name-only edb8fb56 -- gra/src/<katalog>`; linie = liczba znaków nowej linii w `git show edb8fb56:<ścieżka>` (odpowiednik `wc -l`, ta sama metoda co P1.1). Kontrola krzyżowa: 6 katalogów P1.1 przeliczone ponownie w tej rundzie dają 751 plików i 255 694 linii, zgodnie z P1.1.
**Opis przeznaczenia:** pierwsza sensowna linia nagłówka pliku lub skrót jego komentarza nagłówkowego. Trzy pliki nie mają komentarza nagłówkowego (brak go w składni formatu): `gra/src/data/wikiBundle.json` (JSON, opis z pola `title`/nazwy poradnika), `gra/src/oblezenie/index.html` (tytuł strony „Pole Bitwy — The Game”) i `gra/src/wonderpreview/index.html` (tytuł strony „Cuda świata — podgląd 3D (Roblox)”); ich opis pochodzi z tych pól i nazwy pliku, bez oznaczenia w tabeli. Pliki binarne (`.mp3`, `.jpg`) mają opis z nazwy i folderu, bez czytania zawartości.

**Zastrzeżenie dla binariów:** kolumna „Linie” dla `.mp3` i `.jpg` to liczba bajtów o wartości `\n` i nie ma znaczenia tekstowego; rozmiar w bajtach jest miarodajny (`audio` ≈ 44 733 796 B, `assets` ≈ 445 951 B). `data/wikiBundle.json` ma 1 207 504 B i 0 znaków nowej linii.

## Podsumowanie liczbowe — 9 pozostałych katalogów

| Katalog | Pliki (wszystkie) | Pliki `.ts` | Linie (newline count) | Uwagi |
|---|---:|---:|---:|---|
| `gra/src/util` | 1 | 1 | 10 | 1 plik |
| `gra/src/types` | 12 | 12 | 1119 | typy domeny (stan gry, mapa, miasto, jednostka…) |
| `gra/src/input` | 1 | 1 | 278 | picking heksów |
| `gra/src/perf` | 1 | 1 | 497 | detekcja sprzętu |
| `gra/src/oblezenie` | 2 | 1 | 81 | bundle POLE-BITWY (`oblezenie/`) + HTML |
| `gra/src/wonderpreview` | 2 | 1 | 400 | galeria cudów + HTML |
| `gra/src/data` | 4 | 3 | 876 | loadery JSON + `wikiBundle.json` |
| `gra/src/audio` | 70 | 5 | 217091 | kod audio (5 `.ts`) + 62 `.mp3` + 3 `.md` |
| `gra/src/assets` | 45 | 0 | 1924 | 45 portretów `.jpg` (binarne), brak kodu |
| **Razem 9 katalogów** | **138** | **25** | **222276** | |

Uwaga: `gra/src/audio` ma 70 plików, ale 62 z nich to mp3 — liczba linii (217 091) jest sumą bajtów binarnych i nie odzwierciedla kodu; kod `audio` to 5 plików `.ts` o łącznie 3 273 liniach (63+671+56+2426+57).

## Tabele plików

### `gra/src/util` — 1 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/util/norm-pl-label.ts` | 10 | ts | Normalizacja etykiet PL z kreatora (Mały, Duży, Ogromny…) do ASCII slug. |

### `gra/src/types` — 12 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/types/army.ts` | 54 | ts | Armia — stos jednostek połączonych komendą „Połącz”; max 1 żeton armii danej nacji na polu. |
| `gra/src/types/city.ts` | 201 | ts | Miasto gracza — ośrodek produkcji, ludności i kultury; model zgodny z par. 8a i data/buildings.json. |
| `gra/src/types/diplomacy.ts` | 155 | ts | Stan dyplomacji między parami graczy; model oparty na data/diplomacy.json. |
| `gra/src/types/game-state.ts` | 108 | ts | Korzeń stanu gry — jeden obiekt z całym stanem rozgrywki, serializowalny do JSON (save/load). |
| `gra/src/types/hex.ts` | 140 | ts | Typy pojedynczego heksa mapy: teren bazowy + nakładka (las / złoże / rzeka). |
| `gra/src/types/index.ts` | 30 | ts | Barrel — re-eksport wszystkich typów z katalogu src/types/. |
| `gra/src/types/map.ts` | 50 | ts | Struktura całej mapy świata: wymiary, siatka heksów, seed generatora. |
| `gra/src/types/player.ts` | 105 | ts | Gracz (człowiek lub AI) — tożsamość, zasoby globalne, stan wiedzy. |
| `gra/src/types/resources.ts` | 69 | ts | Stan zasobów (surowców) globalnie i per miasto; lista z data/resources.json. |
| `gra/src/types/tech.ts` | 62 | ts | Stan drzewka technologicznego gracza; lista technologii z data/tech.json. |
| `gra/src/types/turn.ts` | 46 | ts | Informacja o bieżącej turze — numer, rok historyczny, faza. |
| `gra/src/types/unit.ts` | 99 | ts | Jednostka wojskowa lub cywilna na mapie; staty bazowe w data/units.json, tu stan instancji. |

### `gra/src/input` — 1 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/input/picker.ts` | 278 | ts | Czyste konwersje współrzędnych i picking dla siatki heksów (POINTY-TOP, promień zewnętrzny R). |

### `gra/src/perf` — 1 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/perf/hardwareProfile.ts` | 497 | ts | Pojedyncze źródło prawdy o sprzęcie/przeglądarce gracza: detekcja CPU/RAM/GPU/WebGL/WebGPU, rekomendowany limit workerów. |

### `gra/src/oblezenie` — 2 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/oblezenie/index.html` | 15 | html | Strona HTML standalone bundla POLE-BITWY (tytuł „Pole Bitwy — The Game”, wejście Vite). |
| `gra/src/oblezenie/main.ts` | 66 | ts | Standalone bundle POLE-BITWY (presety testBattle + BattleScene); build przez vite.oblezenie-bitwa.config.ts. |

### `gra/src/wonderpreview` — 2 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/wonderpreview/index.html` | 111 | html | Strona HTML galerii 19 cudów Antyku (skrypt bootowy z obsługą błędów). |
| `gra/src/wonderpreview/main.ts` | 289 | ts | Galeria 19 cudów Antyku na heksie (3D); inicjalizacja po DOMContentLoaded. |

### `gra/src/data` — 4 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/data/e-start-params-loader.ts` | 170 | ts | Odczyt Panel-E (data/e-start-params.json): kreator nowej gry + meta zwycięstwa. |
| `gra/src/data/loader.ts` | 460 | ts | Wczytuje dane gry z JSON wygenerowanych przez tools/export-data.py; zwraca typowany GameData. |
| `gra/src/data/map-gen-params-loader.ts` | 246 | ts | Odczyt Panel-A (data/map-gen-params.json); fallback = stałe w kodzie. |
| `gra/src/data/wikiBundle.json` | 0 | json | Zbundlowany poradnik Civpedia (wersja rev-civpedia-2026-08-05) w JSON; plik jednowierszowy (0 znaków nowej linii). |

### `gra/src/audio` — 70 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/audio/ambiencePrefs.ts` | 63 | ts | Preferencje gracza dla kanału odgłosów natury (localStorage, klucz civ-ambience-prefs-v1). |
| `gra/src/audio/filePlayer.ts` | 671 | ts | Odtwarzacz plików mp3: jeden silnik createPlaylist, dwie niezależne playlisty (m.in. kamienPlaylist — muzyka epoki kamienia). |
| `gra/src/audio/musicPrefs.ts` | 56 | ts | Preferencje gracza dla muzyki proceduralnej (muzyka-antyczna.ts) w localStorage; muzyka domyślnie włączona. |
| `gra/src/audio/muzyka-antyczna.ts` | 2426 | ts | Muzyka tła gry: epoki × nastroje + intro ekranów; syntezator Web Audio bez plików (kompozytor brązu, fallback kamienia). |
| `gra/src/audio/sfxPrefs.ts` | 57 | ts | Preferencje gracza dla efektów dźwiękowych jednostek (marsz); localStorage, klucz civ-sfx-prefs-v1. |
| `gra/src/audio/utwory/README.md` | 28 | md | Opis katalogu utworów: podkatalogi kontekstowe (kamien, intro, dyplomacja, prebattle, bitwa, zwyciestwo, porazka), wkompilowywane do bundla. |
| `gra/src/audio/utwory/_wykluczone/Ink_On_The_Dawn.mp3` | 3448 | mp3 | Utwór muzyczny mp3 (plik binarny), „Ink On The Dawn”; folder `_wykluczone/`: utwór wycofany z gry; kod go nie czyta. |
| `gra/src/audio/utwory/_wykluczone/README.md` | 7 | md | Utwory wycofane z gry, zachowane; kod nie czyta katalogu, nie trafiają do bundla. |
| `gra/src/audio/utwory/_wykluczone/Stellar_Resonance.mp3` | 3629 | mp3 | Utwór muzyczny mp3 (plik binarny), „Stellar Resonance”; folder `_wykluczone/`: utwór wycofany z gry; kod go nie czyta. |
| `gra/src/audio/utwory/_wykluczone/Where_The_Shadows_Fall.mp3` | 3644 | mp3 | Utwór muzyczny mp3 (plik binarny), „Where The Shadows Fall”; folder `_wykluczone/`: utwór wycofany z gry; kod go nie czyta. |
| `gra/src/audio/utwory/bitwa/Before_the_Bronze_Gate.mp3` | 3693 | mp3 | Utwór muzyczny mp3 (plik binarny), „Before the Bronze Gate”; folder `bitwa/`: scena bitwy właściwej. |
| `gra/src/audio/utwory/braz/A_Kingdom_s_Final_Rite.mp3` | 3669 | mp3 | Utwór muzyczny mp3 (plik binarny), „A Kingdom s Final Rite”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Before_the_Bronze_Wall.mp3` | 3583 | mp3 | Utwór muzyczny mp3 (plik binarny), „Before the Bronze Wall”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Before_the_Forge.mp3` | 3499 | mp3 | Utwór muzyczny mp3 (plik binarny), „Before the Forge”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Beneath_the_Cairn.mp3` | 3534 | mp3 | Utwór muzyczny mp3 (plik binarny), „Beneath the Cairn”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Breath_of_the_Bone_Flute.mp3` | 3828 | mp3 | Utwór muzyczny mp3 (plik binarny), „Breath of the Bone Flute”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Bronze_and_Brine.mp3` | 3528 | mp3 | Utwór muzyczny mp3 (plik binarny), „Bronze and Brine”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Copper_Weight_of_Noon.mp3` | 3746 | mp3 | Utwór muzyczny mp3 (plik binarny), „Copper Weight of Noon”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Fields_of_Copper_Bells.mp3` | 3334 | mp3 | Utwór muzyczny mp3 (plik binarny), „Fields of Copper Bells”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/First_Light_on_River_Stone.mp3` | 3474 | mp3 | Utwór muzyczny mp3 (plik binarny), „First Light on River Stone”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/First_Light_on_Stone.mp3` | 3770 | mp3 | Utwór muzyczny mp3 (plik binarny), „First Light on Stone”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Forge_at_Dusk.mp3` | 2965 | mp3 | Utwór muzyczny mp3 (plik binarny), „Forge at Dusk”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Rites_of_the_Bronze_Throne.mp3` | 3379 | mp3 | Utwór muzyczny mp3 (plik binarny), „Rites of the Bronze Throne”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Spears_Against_Timber.mp3` | 3649 | mp3 | Utwór muzyczny mp3 (plik binarny), „Spears Against Timber”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Sunlight_on_Bronze.mp3` | 3660 | mp3 | Utwór muzyczny mp3 (plik binarny), „Sunlight on Bronze”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/The_Copper_Vanguard.mp3` | 3531 | mp3 | Utwór muzyczny mp3 (plik binarny), „The Copper Vanguard”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/The_Merchant_s_Quay.mp3` | 3569 | mp3 | Utwór muzyczny mp3 (plik binarny), „The Merchant s Quay”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/The_Silent_Accord.mp3` | 3447 | mp3 | Utwór muzyczny mp3 (plik binarny), „The Silent Accord”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/The_Smiths_Measure.mp3` | 3682 | mp3 | Utwór muzyczny mp3 (plik binarny), „The Smiths Measure”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Throne_of_Bronze.mp3` | 3535 | mp3 | Utwór muzyczny mp3 (plik binarny), „Throne of Bronze”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Tracking_The_Herd.mp3` | 3694 | mp3 | Utwór muzyczny mp3 (plik binarny), „Tracking The Herd”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Valley_of_First_Light.mp3` | 3749 | mp3 | Utwór muzyczny mp3 (plik binarny), „Valley of First Light”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/Watching_the_Stone_Gate.mp3` | 3519 | mp3 | Utwór muzyczny mp3 (plik binarny), „Watching the Stone Gate”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/braz/When_the_River_Took.mp3` | 3204 | mp3 | Utwór muzyczny mp3 (plik binarny), „When the River Took”; folder `braz/`: folder nieopisany w README katalogu utwory (nazwa wskazuje epokę brązu; rola w kodzie niezweryfikowana). |
| `gra/src/audio/utwory/dyplomacja/Gilded_Porticos.mp3` | 3415 | mp3 | Utwór muzyczny mp3 (plik binarny), „Gilded Porticos”; folder `dyplomacja/`: panel audiencji dyplomatycznej. |
| `gra/src/audio/utwory/dyplomacja/rzymianie/Imperial_Accord.mp3` | 3290 | mp3 | Utwór muzyczny mp3 (plik binarny), „Imperial Accord”; folder `dyplomacja/rzymianie/`: panel audiencji dyplomatycznej, playlista per-civ rzymianie. |
| `gra/src/audio/utwory/dyplomacja/rzymianie/Portico_of_the_Consul.mp3` | 3458 | mp3 | Utwór muzyczny mp3 (plik binarny), „Portico of the Consul”; folder `dyplomacja/rzymianie/`: panel audiencji dyplomatycznej, playlista per-civ rzymianie. |
| `gra/src/audio/utwory/intro/Ascent_to_Zenith.mp3` | 3361 | mp3 | Utwór muzyczny mp3 (plik binarny), „Ascent to Zenith”; folder `intro/`: ekrany przed rozgrywką (stała kolejność INTRO_KOLEJNOSC). |
| `gra/src/audio/utwory/intro/Dawn_of_the_Architect.mp3` | 3321 | mp3 | Utwór muzyczny mp3 (plik binarny), „Dawn of the Architect”; folder `intro/`: ekrany przed rozgrywką (stała kolejność INTRO_KOLEJNOSC). |
| `gra/src/audio/utwory/intro/Prayer_of_the_Sun_Stone.mp3` | 3417 | mp3 | Utwór muzyczny mp3 (plik binarny), „Prayer of the Sun Stone”; folder `intro/`: ekrany przed rozgrywką (stała kolejność INTRO_KOLEJNOSC). |
| `gra/src/audio/utwory/intro/Seven_Hills_Rising.mp3` | 3328 | mp3 | Utwór muzyczny mp3 (plik binarny), „Seven Hills Rising”; folder `intro/`: ekrany przed rozgrywką (stała kolejność INTRO_KOLEJNOSC). |
| `gra/src/audio/utwory/kamien/Bellows_and_Soil.mp3` | 2879 | mp3 | Utwór muzyczny mp3 (plik binarny), „Bellows and Soil”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Beneath_the_High_Ridge.mp3` | 3810 | mp3 | Utwór muzyczny mp3 (plik binarny), „Beneath the High Ridge”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Bone_and_Branch.mp3` | 3615 | mp3 | Utwór muzyczny mp3 (plik binarny), „Bone and Branch”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Casting_the_Blade.mp3` | 3208 | mp3 | Utwór muzyczny mp3 (plik binarny), „Casting the Blade”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Crucible_Of_The_Forge.mp3` | 3241 | mp3 | Utwór muzyczny mp3 (plik binarny), „Crucible Of The Forge”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Embers_at_Nightfall.mp3` | 3527 | mp3 | Utwór muzyczny mp3 (plik binarny), „Embers at Nightfall”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/First_Light_in_the_Basin.mp3` | 3700 | mp3 | Utwór muzyczny mp3 (plik binarny), „First Light in the Basin”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/First_Light_of_the_Valley.mp3` | 3651 | mp3 | Utwór muzyczny mp3 (plik binarny), „First Light of the Valley”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Forging_the_Canopy.mp3` | 2971 | mp3 | Utwór muzyczny mp3 (plik binarny), „Forging the Canopy”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Hammer_and_Stone.mp3` | 3131 | mp3 | Utwór muzyczny mp3 (plik binarny), „Hammer and Stone”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Harvest_at_the_Riverbank.mp3` | 3360 | mp3 | Utwór muzyczny mp3 (plik binarny), „Harvest at the Riverbank”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Hearth_and_Bone.mp3` | 3301 | mp3 | Utwór muzyczny mp3 (plik binarny), „Hearth and Bone”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Last_Campfire_Watch.mp3` | 2989 | mp3 | Utwór muzyczny mp3 (plik binarny), „Last Campfire Watch”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Midday_at_the_Forge.mp3` | 3115 | mp3 | Utwór muzyczny mp3 (plik binarny), „Midday at the Forge”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Mist_on_the_Water.mp3` | 3590 | mp3 | Utwór muzyczny mp3 (plik binarny), „Mist on the Water”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Morning_at_the_Gorge.mp3` | 3027 | mp3 | Utwór muzyczny mp3 (plik binarny), „Morning at the Gorge”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Mud_and_Bone.mp3` | 3527 | mp3 | Utwór muzyczny mp3 (plik binarny), „Mud and Bone”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Ochre_and_Ash.mp3` | 3865 | mp3 | Utwór muzyczny mp3 (plik binarny), „Ochre and Ash”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Packing_the_Earth_Floor.mp3` | 3101 | mp3 | Utwór muzyczny mp3 (plik binarny), „Packing the Earth Floor”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Stacks_of_Bronze.mp3` | 3187 | mp3 | Utwór muzyczny mp3 (plik binarny), „Stacks of Bronze”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Stone_and_Seed.mp3` | 3672 | mp3 | Utwór muzyczny mp3 (plik binarny), „Stone and Seed”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/The_Hearth_s_Morning_Work.mp3` | 3241 | mp3 | Utwór muzyczny mp3 (plik binarny), „The Hearth s Morning Work”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/The_Ninth_Hearth.mp3` | 3197 | mp3 | Utwór muzyczny mp3 (plik binarny), „The Ninth Hearth”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Valley_Awakening.mp3` | 3884 | mp3 | Utwór muzyczny mp3 (plik binarny), „Valley Awakening”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/kamien/Where_The_Tall_Grass_Bends.mp3` | 3018 | mp3 | Utwór muzyczny mp3 (plik binarny), „Where The Tall Grass Bends”; folder `kamien/`: rozgrywka, epoka kamienia (shuffle). |
| `gra/src/audio/utwory/natura/README.md` | 6 | md | Opis kanału odgłosów natury (osobna playlista, niezależna od muzyki). |
| `gra/src/audio/utwory/porazka/Sun_on_the_Copper_Ridge.mp3` | 3329 | mp3 | Utwór muzyczny mp3 (plik binarny), „Sun on the Copper Ridge”; folder `porazka/`: ekran końca przegranej bitwy. |
| `gra/src/audio/utwory/prebattle/Song_of_the_Ancient_Hearth.mp3` | 3724 | mp3 | Utwór muzyczny mp3 (plik binarny), „Song of the Ancient Hearth”; folder `prebattle/`: nakładka pre-battle. |
| `gra/src/audio/utwory/zwyciestwo/Where_the_Reed_Bends.mp3` | 3365 | mp3 | Utwór muzyczny mp3 (plik binarny), „Where the Reed Bends”; folder `zwyciestwo/`: ekran końca wygranej bitwy. |

### `gra/src/assets` — 45 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/assets/portrety/portrait-asyria-braz.jpg` | 32 | jpg | Portret cywilizacji asyria (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-asyria-kamien.jpg` | 24 | jpg | Portret cywilizacji asyria (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-asyria-zelazo.jpg` | 49 | jpg | Portret cywilizacji asyria (JPG, plik binarny), wariant epoki: żelazo. |
| `gra/src/assets/portrety/portrait-babilonia-braz.jpg` | 39 | jpg | Portret cywilizacji babilonia (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-babilonia-kamien.jpg` | 32 | jpg | Portret cywilizacji babilonia (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-babilonia-zelazo.jpg` | 31 | jpg | Portret cywilizacji babilonia (JPG, plik binarny), wariant epoki: żelazo. |
| `gra/src/assets/portrety/portrait-celtowie-braz.jpg` | 56 | jpg | Portret cywilizacji celtowie (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-celtowie-kamien.jpg` | 28 | jpg | Portret cywilizacji celtowie (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-celtowie-zelazo.jpg` | 44 | jpg | Portret cywilizacji celtowie (JPG, plik binarny), wariant epoki: żelazo. |
| `gra/src/assets/portrety/portrait-chinczycy-braz.jpg` | 57 | jpg | Portret cywilizacji chinczycy (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-chinczycy-kamien.jpg` | 29 | jpg | Portret cywilizacji chinczycy (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-chinczycy-zelazo.jpg` | 40 | jpg | Portret cywilizacji chinczycy (JPG, plik binarny), wariant epoki: żelazo. |
| `gra/src/assets/portrety/portrait-egipt-braz.jpg` | 42 | jpg | Portret cywilizacji egipt (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-egipt-kamien.jpg` | 32 | jpg | Portret cywilizacji egipt (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-egipt-zelazo.jpg` | 51 | jpg | Portret cywilizacji egipt (JPG, plik binarny), wariant epoki: żelazo. |
| `gra/src/assets/portrety/portrait-fenicjanie-braz.jpg` | 39 | jpg | Portret cywilizacji fenicjanie (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-fenicjanie-kamien.jpg` | 32 | jpg | Portret cywilizacji fenicjanie (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-fenicjanie-zelazo.jpg` | 43 | jpg | Portret cywilizacji fenicjanie (JPG, plik binarny), wariant epoki: żelazo. |
| `gra/src/assets/portrety/portrait-germanie-braz.jpg` | 49 | jpg | Portret cywilizacji germanie (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-germanie-kamien.jpg` | 46 | jpg | Portret cywilizacji germanie (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-germanie-zelazo.jpg` | 51 | jpg | Portret cywilizacji germanie (JPG, plik binarny), wariant epoki: żelazo. |
| `gra/src/assets/portrety/portrait-grecy-braz.jpg` | 53 | jpg | Portret cywilizacji grecy (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-grecy-kamien.jpg` | 46 | jpg | Portret cywilizacji grecy (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-grecy-zelazo.jpg` | 52 | jpg | Portret cywilizacji grecy (JPG, plik binarny), wariant epoki: żelazo. |
| `gra/src/assets/portrety/portrait-harappa-braz.jpg` | 50 | jpg | Portret cywilizacji harappa (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-harappa-kamien.jpg` | 50 | jpg | Portret cywilizacji harappa (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-harappa-zelazo.jpg` | 51 | jpg | Portret cywilizacji harappa (JPG, plik binarny), wariant epoki: żelazo. |
| `gra/src/assets/portrety/portrait-hetyci-braz.jpg` | 34 | jpg | Portret cywilizacji hetyci (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-hetyci-kamien.jpg` | 41 | jpg | Portret cywilizacji hetyci (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-hetyci-zelazo.jpg` | 34 | jpg | Portret cywilizacji hetyci (JPG, plik binarny), wariant epoki: żelazo. |
| `gra/src/assets/portrety/portrait-inkowie-braz.jpg` | 56 | jpg | Portret cywilizacji inkowie (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-inkowie-kamien.jpg` | 38 | jpg | Portret cywilizacji inkowie (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-inkowie-zelazo.jpg` | 53 | jpg | Portret cywilizacji inkowie (JPG, plik binarny), wariant epoki: żelazo. |
| `gra/src/assets/portrety/portrait-rzymianie-braz.jpg` | 37 | jpg | Portret cywilizacji rzymianie (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-rzymianie-kamien.jpg` | 53 | jpg | Portret cywilizacji rzymianie (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-rzymianie-zelazo.jpg` | 31 | jpg | Portret cywilizacji rzymianie (JPG, plik binarny), wariant epoki: żelazo. |
| `gra/src/assets/portrety/portrait-slowianie-braz.jpg` | 51 | jpg | Portret cywilizacji slowianie (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-slowianie-kamien.jpg` | 32 | jpg | Portret cywilizacji slowianie (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-slowianie-zelazo.jpg` | 38 | jpg | Portret cywilizacji slowianie (JPG, plik binarny), wariant epoki: żelazo. |
| `gra/src/assets/portrety/portrait-sumer-braz.jpg` | 50 | jpg | Portret cywilizacji sumer (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-sumer-kamien.jpg` | 41 | jpg | Portret cywilizacji sumer (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-sumer-zelazo.jpg` | 47 | jpg | Portret cywilizacji sumer (JPG, plik binarny), wariant epoki: żelazo. |
| `gra/src/assets/portrety/portrait-zulusi-braz.jpg` | 53 | jpg | Portret cywilizacji zulusi (JPG, plik binarny), wariant epoki: brąz. |
| `gra/src/assets/portrety/portrait-zulusi-kamien.jpg` | 52 | jpg | Portret cywilizacji zulusi (JPG, plik binarny), wariant epoki: kamień. |
| `gra/src/assets/portrety/portrait-zulusi-zelazo.jpg` | 35 | jpg | Portret cywilizacji zulusi (JPG, plik binarny), wariant epoki: żelazo. |

## Suma globalna `gra/src` (P1.1 + P1.1B)

| Zakres | Pliki | Linie |
|---|---:|---:|
| P1.1 — 6 katalogów (`game, ui, map, units, battle, render`) | 751 | 255694 |
| P1.1B — 9 katalogów (ten plik) | 138 | 222276 |
| Pliki bezpośrednio w `gra/src/` (`main.ts`, `buildInfo.ts`, `vite-env.d.ts`) | 3 | 39407 |
| **SUMA `gra/src` (wszystkie pliki na `edb8fb56`)** | **892** | **517377** |

Kontrola: `git ls-tree -r --name-only edb8fb56 -- gra/src` zwraca 892 plików; suma linii po wszystkich plikach = 517377. Zgodność: 892 = 892, 517377 = 517377. OK.
`.ts` globalnie: 457 (P1.1: 429 + P1.1B: 25 + 3 pliki w `gra/src/` = 457).
