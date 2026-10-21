# P1.16d — Opisy CivPedii (reszta) i panele „ściąga" UI — status z dowodem (runda 2/5)

**Pin webowy:** `edb8fb56` (odczyt wyłącznie przez `git show edb8fb56:...`; working tree nieużyty do oceny).
**Temat:** `R-RUSTPORT-P1-16D-OPISY-CIVPEDIA-UI-Q1`, runda 2/5, Operator (Haiku 5.5 medium).
**Źródła:** `dyspozycje/AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` §3, §5; `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` §9.3/§9.5 (zamknięte: Akademia, Targowisko, Karawanseraj, Lazaret).
**Skrypt porównawczy (odtwarzalny):** `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/check.py` (wejście: pliki z pina; wyjście: `rows.json`).

## 0. Werdykt tematu

**STATUS: FAIL — kryterium binarne NIESPEŁNIONE** (przy niespełnionym kryterium status = FAIL, nie PASS-WITH-NOTES).

- **Każde** z 169 haseł CivPedii i każdy z 17 paneli ma teraz **jawny status** (tabele §2 i §3). Przypisanie statusu nie jest tym samym co weryfikacja treści.
- **Treść (proza) żadnego hasła nie została przeliczona w całości.** Mechanicznie porównano wyłącznie pola liczbowe/nazwy (koszt, utrzymanie, poziomy, surowce, epoki, prereq, jednostka unikalna). „ZGODNE-POLA" znaczy: te pola są zgodne, reszta tekstu nieprzeliczona.
- **Nierozstrzygnięte:** 19 haseł (brak pól porównywalnych) i 9 paneli (§3). Są wymienione z nazwy poniżej — nie są oznaczone jako NAPRAWIONY.
- **Podstawa werdyktu FAIL (rozstrzygnięcie zarzutu Evaluatora nr 9):** dispatch dla paneli wymaga „status z dowodem" bez alternatywy — 9 paneli NIEROZSTRZYGNIĘTY to literalne niespełnienie kryterium. Dla CivPedii dispatch dopuszcza „lub jawnie: ile z ilu sprawdzono, z listą nieprzeliczonych" — 19 haseł NIEROZSTRZYGNIĘTY jest wymienionych z nazwy i samo w sobie NIE uzasadnia FAIL. Werdykt FAIL opiera się na paneli (§3).
- **Istotne rozbieżności danych vs wiki:** 78 haseł ROZBIEŻNE (patrz §4 Rejestr rozbieżności). Poprzednie zdanie rundy 1 „0 rozbieżności w polach podanych przez wiki" było **nieprawdziwe** — skorygowane.

## 1. Liczenie i zakres (CivPedia)

- `wikiBundle.json` (`encyklopedia`) na pinie: **169 wpisów** = 137 w 6 grupach §5 (Budynki **26**, nie 25 jak w audycie) + 32 „Technologie" (poza §5).
- Zamknięte w P1-16 i pominięte: **Akademia**, **Targowisko** (Karawanseraj i Lazaret nie występują jako wpisy `encyklopedia`).
- Otwarte: **167** = 135 (§5) + 32 (Technologie).
- Wynik mechaniczny (167 otwartych): **ZGODNE-POLA 70**, **ROZBIEŻNE 78**, **NIEROZSTRZYGNIĘTY 19**. Razem 148/167 sprawdzonych co najmniej w jednym polu; pełnej weryfikacji treści: **0/167**.

### Zestawienie per grupa (§5 audytu i Technologie)

| Grupa | Wpisów (otwartych) | ZGODNE-POLA | ROZBIEŻNE | NIEROZSTRZYGNIĘTY | Pola użyte do porównania |
|---|---:|---:|---:|---:|---|
| Budynki | 24 | 18 | 5 | 1 | koszt pracy, utrzymanie, maks. poziom, surowce (`buildings.json`) |
| Jednostki (+ Jednostki i walka, Wojsko i miasto) | 51 (49 jednostek + Bród + Manpower) | 7 | 42 | 2 | rekrutacja ¤, mieszkańcy, utrzymanie ¤, żywność/t (`units.json`) |
| Cuda świata (+ Kultura i cuda) | 20 (19 + przegląd) | 19 | 0 | 1 | koszt pracy, max na świecie, dostęp E/R (`wonders.json`) |
| Ulepszenia terenu (+ Mapa i ekspansja) | 18 | 15 | 1 | 2 | koszt pracy, tech (`terrain-improvements.json`) |
| Cywilizacje (+ Cywilizacje i dyplomacja, Dyplomacja) | 12 | 7 | 2 | 3 | jednostka unikalna (`civs.json`) |
| Pojęcia (+ Miasto i społeczeństwo, Nauka i epoki, Ekonomia imperium) | 10 | 0 | 0 | 10 | brak pól danych porównywalnych (proza) |
| Technologie (poza §5) | 32 | 4 | 28 | 0 | epoka, poziom, koszt PN, wymagania (`tech.json`) |
| **Razem otwarte** | **167** | **70** | **78** | **19** | |

### Maks. poziom i zestawienie Budynków (zastępuje błędne „6 / 17" z rundy 1)

- Wpisy Budynki z frazą „Maks. N poziom" (pola `wikiS` lub `wikiM`): **12** (w `wikiS` 9; w `wikiM` dodatkowo 3); w tym zamknięte 2 (Akademia, Targowisko), otwarte **10**. Zgodne z `maksPoziom` (`buildings.json`): **12/12**, w tym **10/10 otwartych** (ponowne liczenie rundy 2; runda 1 podała 8/8 — błąd liczenia).
- Wpisy Budynki bez frazy „Maks.": **14** (wszystkie otwarte; 26 − 12). Razem otwartych 10 + 14 = 24.
- Koszt pracy: 22/23 zgodne (jedyny rozjazd: Garnizon). Utrzymanie: 22/23 zgodne (Garnizon).
- Surowce (×5 względem wiki, zgodnie z §2c audytu, commit `e401c1c2`): **Baszta, Fort (Cytadela), Mury, Warsztat oblężniczy** — wiki podaje 1/5 wartości danych.

### Jednostki (zastępuje „0/51" z rundy 1)

- Parser działa (rekrutacja w wiki: `**N** ¤ + **M** mieszk.`; dane: `Pieniądz (koszt)`, `Ludność`). Dopasowanie po pełnej nazwie i — gdy brak — po nazwie bez nawiasu.
- Sprawdzone: **49/49 jednostek** (lista w §2). Zgodne 7 (wszystkie super-jednostki z kosztem 0 + ich utrzymanie 0/żywność 1). Rozbieżne 42: **38 z nich dokładnie 2× dane** (wiki = 2× dane, RJ-1); **4 o innych wartościach** (Łucznik sumeryjski 9 vs 5; Oszczepnik (Estólica) 9 vs 5; Wojownik tyrreński 15 vs 8; Wojownik germański 16 vs 0; patrz RJ-1 w §4).
- Dwa wpisy §5 („Bród", „Manpower") to pojęcia bez liczb rekrutacji → NIEROZSTRZYGNIĘTY.


## 2. Status per hasło — wszystkie 169 wpisów `encyklopedia`

Legenda: **ZGODNE-POLA** = porównane pola zgodne z danymi (proza nieprzeliczona; NIE jest to PASS hasła). **ROZBIEŻNE** = co najmniej jedno porównane pole różni się od danych (FAIL). **NIEROZSTRZYGNIĘTY** = brak pól porównywalnych, treść nieprzeliczona (jawna lista). Odtwarzalne przez `check.py`.

| # | ID wiki | Kategoria (§5) | Hasło | Status | Dowód (pole: wiki vs dane; ZGODNE = sprawdzone pola, proza nieprzeliczona) |
|---:|---|---|---|---|---|
| 1 | `budynki/akademia` | Budynki | Akademia | ZAMKNIĘTE (P1-16) | pominięte: zamknięte w P1-16 |
| 2 | `budynki/akademia_wojskowa` | Budynki | Akademia wojskowa | ZGODNE-POLA | zgodne: koszt pracy=80; utrzymanie=4; maks poziom=1 |
| 3 | `technologie/astronomia` | Technologie | Astronomia | ROZBIEŻNE | koszt PN: wiki 220 vs dane 440 |
| 4 | `budynki/baszta` | Budynki | Baszta | ROZBIEŻNE | surowiec drewno: wiki 10 vs dane 50; surowiec kamien: wiki 20 vs dane 100 |
| 5 | `jednostki/berserker-germanski` | Jednostki | Berserker germański | ROZBIEŻNE | rekrutacja ¤: wiki 16 vs dane 8 |
| 6 | `budynki/biblioteka` | Budynki | Biblioteka | ZGODNE-POLA | zgodne: koszt pracy=25; utrzymanie=1 |
| 7 | `pojecia/bogactwo` | Pojęcia | Bogactwo | NIEROZSTRZYGNIĘTY | pojęcie bez porównywalnego pola danych (proza) |
| 8 | `cuda/brama_narodow` | Cuda świata | Brama wszystkich narodów | ZGODNE-POLA | zgodne: koszt pracy=280; max na świecie=1; dostęp R=R |
| 9 | `technologie/brazownictwo` | Technologie | Brązownictwo | ROZBIEŻNE | koszt PN: wiki 90 vs dane 180 |
| 10 | `pojecia/brod` | Jednostki i walka | Bród (Ford) w bitwie | NIEROZSTRZYGNIĘTY | brak liczb rekrutacji w wiki (pojęcie, nie jednostka) |
| 11 | `technologie/budownictwo` | Technologie | Budownictwo | ROZBIEŻNE | koszt PN: wiki 170 vs dane 340 |
| 12 | `pojecia/bunt` | Miasto i społeczeństwo | Bunt | NIEROZSTRZYGNIĘTY | pojęcie bez porównywalnego pola danych (proza) |
| 13 | `ulepszenia/bydlo` | Ulepszenia terenu | Bydło | ZGODNE-POLA | zgodne: koszt pracy=20; tech=Oswojenie zwierząt |
| 14 | `cywilizacje/celtowie` | Cywilizacje | Celtowie | ROZBIEŻNE | jednostka unikalna: wiki Miecznik galijski vs dane Soldurii |
| 15 | `cywilizacje/chinczycy` | Cywilizacje | Chińczycy | ROZBIEŻNE | jednostka unikalna: wiki Kusznik (lepszy łucznik) vs dane Jeździec chiński |
| 16 | `pojecia/cuda-swiata` | Kultura i cuda | Cuda świata (przegląd) | NIEROZSTRZYGNIĘTY | przegląd/brak wpisu w wonders.json |
| 17 | `ulepszenia/droga` | Ulepszenia terenu | Droga | ZGODNE-POLA | zgodne: koszt pracy=15; tech=Koło |
| 18 | `technologie/drogi_brukowane` | Technologie | Drogi brukowane | ROZBIEŻNE | koszt PN: wiki 340 vs dane 680 |
| 19 | `pojecia/drzewko-technologii` | Nauka i epoki | Drzewko technologii | NIEROZSTRZYGNIĘTY | pojęcie bez porównywalnego pola danych (proza) |
| 20 | `cuda/dur_sharrukin` | Cuda świata | Dur-Sharrukin | ZGODNE-POLA | zgodne: koszt pracy=260; max na świecie=1; dostęp E=E |
| 21 | `cywilizacje/egipt` | Cywilizacje | Egipt | ZGODNE-POLA | zgodne: jednostka unikalna=Medżaj (Gwardia Faraona) |
| 22 | `jednostki/falanga` | Jednostki | Falanga | ROZBIEŻNE | rekrutacja ¤: wiki 18 vs dane 9 |
| 23 | `ulepszenia/farma` | Ulepszenia terenu | Farma | ZGODNE-POLA | zgodne: koszt pracy=20; tech=Rolnictwo |
| 24 | `technologie/filozofia` | Technologie | Filozofia | ROZBIEŻNE | koszt PN: wiki 300 vs dane 600 |
| 25 | `budynki/fort` | Budynki | Fort (Cytadela) | ROZBIEŻNE | surowiec drewno: wiki 10 vs dane 50; surowiec kamien: wiki 20 vs dane 100 |
| 26 | `ulepszenia/fort` | Ulepszenia terenu | Fort / umocnienia | ZGODNE-POLA | zgodne: koszt pracy=25; tech=Wojskowosc |
| 27 | `jednostki/gaesatae` | Jednostki | Gaesatae | ROZBIEŻNE | rekrutacja ¤: wiki 14 vs dane 7 |
| 28 | `jednostki/galera` | Jednostki | Galera | ROZBIEŻNE | rekrutacja ¤: wiki 18 vs dane 9 |
| 29 | `technologie/garncarstwo` | Technologie | Garncarstwo | ROZBIEŻNE | koszt PN: wiki 20 vs dane 40 |
| 30 | `budynki/garnizon` | Budynki | Garnizon | ROZBIEŻNE | koszt pracy: wiki 60 vs dane 30; utrzymanie: wiki 4 vs dane 2; drewno (koszt): wiki 60 vs dane 30 (koszt_surowce); "5 drewna/t" — pole nieobecne w danych; dane zatwierdzone przez właściciela (uwagi, ECHO 2026-09-05) |
| 31 | `cywilizacje/germanie` | Cywilizacje | Germanie | ZGODNE-POLA | zgodne: jednostka unikalna=Wojownik germański (framea) |
| 32 | `ulepszenia/glinianka` | Ulepszenia terenu | Glinianka | ZGODNE-POLA | zgodne: koszt pracy=20; tech=Garncarstwo |
| 33 | `technologie/gospodarka_wodna` | Technologie | Gospodarka wodna | ROZBIEŻNE | koszt PN: wiki 36 vs dane 72 |
| 34 | `cywilizacje/grecy` | Cywilizacje | Grecy | ZGODNE-POLA | zgodne: jednostka unikalna=Falanga (Hoplita) |
| 35 | `jednostki/gwardia-krolewska-sumeru` | Jednostki | Gwardia Królewska Sumeru | ZGODNE-POLA | zgodne: rekrutacja ¤=0; mieszkańcy=1; utrzymanie ¤=0; żywność/t=1 |
| 36 | `jednostki/halabardnik-shang` | Jednostki | Halabardnik Shang | ROZBIEŻNE | rekrutacja ¤: wiki 18 vs dane 9 |
| 37 | `technologie/handel` | Technologie | Handel | ROZBIEŻNE | koszt PN: wiki 148 vs dane 296 |
| 38 | `pojecia/handel-surowcami-dyplomacja` | Dyplomacja | Handel surowcami (dyplomacja) | NIEROZSTRZYGNIĘTY | brak liczb/pól porównywalnych w danych (proza) |
| 39 | `jednostki/hastati` | Jednostki | Hastati | ROZBIEŻNE | rekrutacja ¤: wiki 18 vs dane 9 |
| 40 | `jednostki/hieros-lochos-swiety-zastep` | Jednostki | Hieros Lochos (Święty Zastęp) | ZGODNE-POLA | zgodne: rekrutacja ¤=0; mieszkańcy=1; utrzymanie ¤=0; żywność/t=1 |
| 41 | `jednostki/hu-ben-wei-gwardia-tygrysa` | Jednostki | Hu Ben Wei (Gwardia Tygrysa) | ZGODNE-POLA | zgodne: rekrutacja ¤=0; mieszkańcy=1; utrzymanie ¤=0; żywność/t=1 |
| 42 | `technologie/hutnictwo_zelaza` | Technologie | Hutnictwo żelaza | ROZBIEŻNE | koszt PN: wiki 240 vs dane 480 |
| 43 | `jednostki/impi` | Jednostki | Impi | ROZBIEŻNE | rekrutacja ¤: wiki 16 vs dane 8 |
| 44 | `cywilizacje/inkowie` | Cywilizacje | Inkowie | ZGODNE-POLA | zgodne: jednostka unikalna=Chaska (maczuga gwiaździsta) + Królewska Gwardia (elita) |
| 45 | `technologie/inzynieria` | Technologie | Inżynieria | ROZBIEŻNE | koszt PN: wiki 260 vs dane 520 |
| 46 | `ulepszenia/irygacja` | Ulepszenia terenu | Irygacja | ZGODNE-POLA | zgodne: koszt pracy=30; tech=Irygacja |
| 47 | `jednostki/jezdziec-chinski` | Jednostki | Jeździec chiński | ROZBIEŻNE | rekrutacja ¤: wiki 28 vs dane 14 |
| 48 | `technologie/jezdziectwo` | Technologie | Jeździectwo | ROZBIEŻNE | koszt PN: wiki 112 vs dane 224 |
| 49 | `ulepszenia/kamieniolom` | Ulepszenia terenu | Kamieniołom | ZGODNE-POLA | zgodne: koszt pracy=22; tech=Murarstwo |
| 50 | `cuda/hamonga` | Cuda świata | Kamień Ha'amonga | ZGODNE-POLA | zgodne: koszt pracy=220; max na świecie=1; dostęp R=R |
| 51 | `jednostki/katapulta` | Jednostki | Katapulta | ROZBIEŻNE | rekrutacja ¤: wiki 18 vs dane 9 |
| 52 | `technologie/kodeks` | Technologie | Kodeks | ROZBIEŻNE | koszt PN: wiki 124 vs dane 248 |
| 53 | `cuda/kolos` | Cuda świata | Kolos Rodyjski | ZGODNE-POLA | zgodne: koszt pracy=230; max na świecie=1; dostęp E=E |
| 54 | `cuda/koloseum` | Cuda świata | Koloseum | ZGODNE-POLA | zgodne: koszt pracy=310; max na świecie=1; dostęp E=E |
| 55 | `technologie/ko_o` | Technologie | Koło | ROZBIEŻNE | koszt PN: wiki 44 vs dane 88 |
| 56 | `jednostki/konnica` | Jednostki | Konnica | ROZBIEŻNE | rekrutacja ¤: wiki 22 vs dane 11 |
| 57 | `ulepszenia/kopalnia` | Ulepszenia terenu | Kopalnia | ROZBIEŻNE | hasło opisuje ulepszenie usunięte z gry: brak wpisu "kopalnia" w terrain-improvements.json (dane: kopalnia_miedzi/_zelaza/_cyny/_zlota) |
| 58 | `budynki/koszary` | Budynki | Koszary | ZGODNE-POLA | zgodne: koszt pracy=25; utrzymanie=2; maks poziom=2 |
| 59 | `jednostki/krolewska-gwardia` | Jednostki | Królewska Gwardia | ZGODNE-POLA | zgodne: rekrutacja ¤=0; mieszkańcy=1; utrzymanie ¤=0; żywność/t=1 |
| 60 | `budynki/kuznia` | Budynki | Kuźnia brązu | ZGODNE-POLA | zgodne: koszt pracy=30; utrzymanie=2; maks poziom=1 |
| 61 | `budynki/kuznia_zelaza` | Budynki | Kuźnia żelaza | ZGODNE-POLA | zgodne: koszt pracy=60; utrzymanie=3; maks poziom=1 |
| 62 | `ulepszenia/lama` | Ulepszenia terenu | Lama | ZGODNE-POLA | zgodne: koszt pracy=20; tech=Oswojenie zwierząt |
| 63 | `budynki/laznia_publiczna` | Budynki | Łaźnia publiczna | ZGODNE-POLA | zgodne: koszt pracy=50; utrzymanie=2 |
| 64 | `ulepszenia/lodzie_rybackie` | Ulepszenia terenu | Łodzie rybackie | ZGODNE-POLA | zgodne: koszt pracy=20; tech=Żegluga |
| 65 | `technologie/owiectwo` | Technologie | Łowiectwo | ZGODNE-POLA | zgodne: epoka=Kamień; poziom=1; koszt PN=5 |
| 66 | `technologie/ucznictwo` | Technologie | Łucznictwo | ROZBIEŻNE | koszt PN: wiki 28 vs dane 56 |
| 67 | `jednostki/ucznik` | Jednostki | Łucznik | ROZBIEŻNE | rekrutacja ¤: wiki 6 vs dane 3 |
| 68 | `jednostki/ucznik-akadyjski` | Jednostki | Łucznik akadyjski | ROZBIEŻNE | rekrutacja ¤: wiki 16 vs dane 8 |
| 69 | `jednostki/ucznik-egipski` | Jednostki | Łucznik egipski | ROZBIEŻNE | rekrutacja ¤: wiki 14 vs dane 7 |
| 70 | `jednostki/ucznik-sumeryjski` | Jednostki | Łucznik sumeryjski | ROZBIEŻNE | rekrutacja ¤: wiki 9 vs dane 5 |
| 71 | `budynki/magazyn` | Budynki | Magazyn | ZGODNE-POLA | zgodne: koszt pracy=20; utrzymanie=1 |
| 72 | `pojecia/manpower-rekruci` | Wojsko i miasto | Manpower — pula rekrutów | NIEROZSTRZYGNIĘTY | brak liczb rekrutacji w wiki (pojęcie, nie jednostka) |
| 73 | `technologie/matematyka` | Technologie | Matematyka | ROZBIEŻNE | koszt PN: wiki 136 vs dane 272 |
| 74 | `technologie/medycyna` | Technologie | Medycyna | ROZBIEŻNE | koszt PN: wiki 324 vs dane 648 |
| 75 | `jednostki/medzaj-gwardia-faraona` | Jednostki | Medżaj (Gwardia Faraona) | ZGODNE-POLA | zgodne: rekrutacja ¤=0; mieszkańcy=1; utrzymanie ¤=0; żywność/t=1 |
| 76 | `technologie/mistycyzm` | Technologie | Mistycyzm | ROZBIEŻNE | koszt PN: wiki 20 vs dane 40 |
| 77 | `technologie/murarstwo` | Technologie | Murarstwo | ROZBIEŻNE | koszt PN: wiki 28 vs dane 56 |
| 78 | `budynki/mury` | Budynki | Mury | ROZBIEŻNE | surowiec drewno: wiki 8 vs dane 40; surowiec kamien: wiki 16 vs dane 80 |
| 79 | `technologie/obleznictwo` | Technologie | Oblężnictwo | ROZBIEŻNE | koszt PN: wiki 280 vs dane 560 |
| 80 | `ulepszenia/oboz_lowiecki` | Ulepszenia terenu | Obóz łowiecki | ZGODNE-POLA | zgodne: koszt pracy=18; tech=Łowiectwo |
| 81 | `technologie/obrobka_drewna` | Technologie | Obróbka drewna | ZGODNE-POLA | zgodne: epoka=Kamień; poziom=1; koszt PN=5 |
| 82 | `technologie/obrobka_zelaza` | Technologie | Obróbka żelaza | ROZBIEŻNE | koszt PN: wiki 370 vs dane 740 |
| 83 | `cuda/osada_aschaffenburg` | Cuda świata | Osada Aschaffenburg (hala dębowa) | ZGODNE-POLA | zgodne: koszt pracy=300; max na świecie=1; dostęp E=E |
| 84 | `technologie/oswojenie_zwierzat` | Technologie | Oswojenie zwierząt | ZGODNE-POLA | zgodne: epoka=Kamień; poziom=1; koszt PN=5 |
| 85 | `jednostki/oszczepnik` | Jednostki | Oszczepnik | ROZBIEŻNE | rekrutacja ¤: wiki 6 vs dane 3 |
| 86 | `jednostki/oszczepnik-estolica` | Jednostki | Oszczepnik (Estólica) | ROZBIEŻNE | rekrutacja ¤: wiki 9 vs dane 5 |
| 87 | `jednostki/oszczepnik-zulu-izijula` | Jednostki | Oszczepnik Zulu (Izijula) | ROZBIEŻNE | rekrutacja ¤: wiki 20 vs dane 10 |
| 88 | `ulepszenia/owce` | Ulepszenia terenu | Owce | ZGODNE-POLA | zgodne: koszt pracy=20; tech=Oswojenie zwierząt |
| 89 | `budynki/palac` | Budynki | Palac | ZGODNE-POLA | zgodne: koszt pracy=40; utrzymanie=2 |
| 90 | `cuda/palac_weiyang` | Cuda świata | Pałac Weiyang | ZGODNE-POLA | zgodne: koszt pracy=290; max na świecie=1; dostęp E=E |
| 91 | `cuda/petra` | Cuda świata | Petra | ZGODNE-POLA | zgodne: koszt pracy=165; max na świecie=1; dostęp E=E |
| 92 | `cuda/piramidy` | Cuda świata | Piramidy | ZGODNE-POLA | zgodne: koszt pracy=160; max na świecie=1; dostęp E=E |
| 93 | `technologie/pismo` | Technologie | Pismo | ROZBIEŻNE | koszt PN: wiki 90 vs dane 180 |
| 94 | `budynki/port` | Budynki | Port handlowy | ZGODNE-POLA | zgodne: koszt pracy=30; utrzymanie=2 |
| 95 | `pojecia/porzadek` | Miasto i społeczeństwo | Porządek | NIEROZSTRZYGNIĘTY | pojęcie bez porównywalnego pola danych (proza) |
| 96 | `cuda/posag_peruna` | Cuda świata | Posąg Peruna | ZGODNE-POLA | zgodne: koszt pracy=140; max na świecie=1; dostęp E=E |
| 97 | `ulepszenia/posterunek` | Ulepszenia terenu | Posterunek (Strażnica) | ZGODNE-POLA | zgodne: koszt pracy=30 |
| 98 | `technologie/prawo` | Technologie | Prawo | ROZBIEŻNE | koszt PN: wiki 310 vs dane 620 |
| 99 | `budynki/pretorium` | Budynki | Pretorium | ZGODNE-POLA | zgodne: koszt pracy=75; utrzymanie=3; maks poziom=1 |
| 100 | `jednostki/procarz` | Jednostki | Procarz | ROZBIEŻNE | rekrutacja ¤: wiki 8 vs dane 4 |
| 101 | `jednostki/procarz-huaracoc` | Jednostki | Procarz (Huaracoc) | ROZBIEŻNE | rekrutacja ¤: wiki 8 vs dane 4 |
| 102 | `technologie/religia` | Technologie | Religia | ROZBIEŻNE | koszt PN: wiki 96 vs dane 192 |
| 103 | `technologie/rolnictwo` | Technologie | Rolnictwo | ZGODNE-POLA | zgodne: epoka=Kamień; poziom=1; koszt PN=5 |
| 104 | `cuda/roquepertuse` | Cuda świata | Roquepertuse | ZGODNE-POLA | zgodne: koszt pracy=290; max na świecie=1; dostęp E=E |
| 105 | `jednostki/rydwan-wo-y` | Jednostki | Rydwan (woły) | ROZBIEŻNE | rekrutacja ¤: wiki 30 vs dane 15 |
| 106 | `jednostki/rydwan-celtycki` | Jednostki | Rydwan celtycki | ROZBIEŻNE | rekrutacja ¤: wiki 28 vs dane 14 |
| 107 | `jednostki/rydwan-egipski` | Jednostki | Rydwan egipski | ROZBIEŻNE | rekrutacja ¤: wiki 32 vs dane 16 |
| 108 | `jednostki/rydwan-konny` | Jednostki | Rydwan konny | ROZBIEŻNE | rekrutacja ¤: wiki 28 vs dane 14 |
| 109 | `jednostki/rydwan-mykenski` | Jednostki | Rydwan mykeński | ROZBIEŻNE | rekrutacja ¤: wiki 30 vs dane 15 |
| 110 | `jednostki/rydwan-shang` | Jednostki | Rydwan Shang | ROZBIEŻNE | rekrutacja ¤: wiki 32 vs dane 16 |
| 111 | `jednostki/rydwan-sumeryjski` | Jednostki | Rydwan sumeryjski | ROZBIEŻNE | rekrutacja ¤: wiki 38 vs dane 19 |
| 112 | `cywilizacje/rzymianie` | Cywilizacje | Rzymianie | ZGODNE-POLA | zgodne: jednostka unikalna=Legion (Legionista) |
| 113 | `budynki/sad` | Budynki | Sąd | ZGODNE-POLA | zgodne: koszt pracy=55; utrzymanie=2 |
| 114 | `jednostki/wojownik-celtycki` | Jednostki | Soldurii | ROZBIEŻNE | rekrutacja ¤: wiki 18 vs dane 9 |
| 115 | `budynki/spichlerz` | Budynki | Spichlerz | ZGODNE-POLA | zgodne: koszt pracy=20; utrzymanie=1 |
| 116 | `pojecia/spichlerz` | Miasto i społeczeństwo | Spichlerz — zapasy i wzrost | NIEROZSTRZYGNIĘTY | pojęcie bez porównywalnego pola danych (proza) |
| 117 | `budynki/stela` | Budynki | Stela / Pomnik | ZGODNE-POLA | zgodne: koszt pracy=15; utrzymanie=0 |
| 118 | `budynki/stolarnia` | Budynki | Stolarnia | ZGODNE-POLA | zgodne: koszt pracy=20; utrzymanie=1 |
| 119 | `budynki/studnia` | Budynki | Studnia | ZGODNE-POLA | zgodne: koszt pracy=15; utrzymanie=1 |
| 120 | `cuda/stupa_sanchi` | Cuda świata | Stupa w Sanchi | ZGODNE-POLA | zgodne: koszt pracy=210; max na świecie=1; dostęp E=E |
| 121 | `cywilizacje/sumer` | Cywilizacje | Sumerowie | ZGODNE-POLA | zgodne: jednostka unikalna=Gwardia Królewska Sumeru |
| 122 | `pojecia/suwak-handlu` | Pojęcia | Suwak handlu | NIEROZSTRZYGNIĘTY | pojęcie bez porównywalnego pola danych (proza) |
| 123 | `pojecia/suwak-pracy` | Pojęcia | Suwak pracy | NIEROZSTRZYGNIĘTY | pojęcie bez porównywalnego pola danych (proza) |
| 124 | `pojecia/suwak-zywnosci` | Pojęcia | Suwak żywności | NIEROZSTRZYGNIĘTY | pojęcie bez porównywalnego pola danych (proza) |
| 125 | `budynki/swiatynia` | Budynki | Swiatynia | ZGODNE-POLA | zgodne: koszt pracy=25; utrzymanie=1 |
| 126 | `pojecia/szczescie` | Pojęcia | Szczęście | NIEROZSTRZYGNIĘTY | pojęcie bez porównywalnego pola danych (proza) |
| 127 | `pojecia/szlaki-handlowe` | Ekonomia imperium | Szlaki handlowe | NIEROZSTRZYGNIĘTY | pojęcie bez porównywalnego pola danych (proza) |
| 128 | `technologie/sztuka_wojenna` | Technologie | Sztuka wojenna | ROZBIEŻNE | koszt PN: wiki 400 vs dane 800 |
| 129 | `cuda/mundo_perdido` | Cuda świata | Świątynia Mundo Perdido | ZGODNE-POLA | zgodne: koszt pracy=220; max na świecie=1; dostęp E=E |
| 130 | `jednostki/taran` | Jednostki | Taran | ROZBIEŻNE | rekrutacja ¤: wiki 14 vs dane 7 |
| 131 | `ulepszenia/tarasy` | Ulepszenia terenu | Tarasy uprawne | ZGODNE-POLA | zgodne: koszt pracy=25 |
| 132 | `budynki/targowisko` | Budynki | Targowisko (Rynek) | ZAMKNIĘTE (P1-16) | pominięte: zamknięte w P1-16 |
| 133 | `ulepszenia/tartak` | Ulepszenia terenu | Tartak | ZGODNE-POLA | zgodne: koszt pracy=25; tech=Obróbka drewna |
| 134 | `budynki/teatr` | Budynki | Teatr | ZGODNE-POLA | zgodne: koszt pracy=55; utrzymanie=2 |
| 135 | `cuda/terakotowa_armia` | Cuda świata | Terakotowa armia | ZGODNE-POLA | zgodne: koszt pracy=320; max na świecie=1; dostęp E=E |
| 136 | `jednostki/triari` | Jednostki | Triari | ZGODNE-POLA | zgodne: rekrutacja ¤=0; mieszkańcy=1; utrzymanie ¤=0; żywność/t=1 |
| 137 | `jednostki/uthulwana-bia-e-tarcze` | Jednostki | uThulwana (Białe Tarcze) | ZGODNE-POLA | zgodne: rekrutacja ¤=0; mieszkańcy=1; utrzymanie ¤=0; żywność/t=1 |
| 138 | `technologie/waluta` | Technologie | Waluta | ROZBIEŻNE | koszt PN: wiki 200 vs dane 400 |
| 139 | `budynki/kamieniarski` | Budynki | Warsztat kamieniarski | ZGODNE-POLA | zgodne: koszt pracy=20; utrzymanie=1 |
| 140 | `budynki/warsztat_oblezniczy` | Budynki | Warsztat oblężniczy | ROZBIEŻNE | surowiec drewno: wiki 10 vs dane 50; surowiec kamien: wiki 10 vs dane 50 |
| 141 | `ulepszenia/warzelnia_soli` | Ulepszenia terenu | Warzelnia soli | ZGODNE-POLA | zgodne: koszt pracy=20; tech=Garncarstwo |
| 142 | `pojecia/wiarygodnosc` | Dyplomacja | Wiarygodność | NIEROZSTRZYGNIĘTY | brak liczb/pól porównywalnych w danych (proza) |
| 143 | `budynki/wielka_kuznia` | Budynki | Wielka Kuźnia | NIEROZSTRZYGNIĘTY | brak porównywalnych pól |
| 144 | `cuda/wielka_stela` | Cuda świata | Wielka stela | ZGODNE-POLA | zgodne: koszt pracy=220; max na świecie=1; dostęp E=E |
| 145 | `jednostki/wieza-obleznicza` | Jednostki | Wieża oblężnicza | ROZBIEŻNE | rekrutacja ¤: wiki 20 vs dane 10 |
| 146 | `cuda/wiszace_ogrody` | Cuda świata | Wiszące ogrody | ZGODNE-POLA | zgodne: koszt pracy=150; max na świecie=1; dostęp E=E |
| 147 | `pojecia/wladcy` | Cywilizacje i dyplomacja | Władcy (portrety i imiona per epoka) | NIEROZSTRZYGNIĘTY | brak liczb/pól porównywalnych w danych (proza) |
| 148 | `jednostki/w-ocznik` | Jednostki | Włócznik | ROZBIEŻNE | rekrutacja ¤: wiki 16 vs dane 8 |
| 149 | `jednostki/w-ocznik-sumeryjski` | Jednostki | Włócznik sumeryjski | ROZBIEŻNE | rekrutacja ¤: wiki 18 vs dane 9 |
| 150 | `jednostki/wojownik` | Jednostki | Wojownik | ROZBIEŻNE | rekrutacja ¤: wiki 10 vs dane 5 |
| 151 | `jednostki/wojownik-germanski` | Jednostki | Wojownik germański | ROZBIEŻNE | rekrutacja ¤: wiki 16 vs dane 0 |
| 152 | `jednostki/wojownik-mykenski` | Jednostki | Wojownik mykeński | ROZBIEŻNE | rekrutacja ¤: wiki 18 vs dane 9 |
| 153 | `jednostki/wojownik-sherden` | Jednostki | Wojownik Sherden | ROZBIEŻNE | rekrutacja ¤: wiki 18 vs dane 9 |
| 154 | `jednostki/wojownik-szekelesz` | Jednostki | Wojownik szekelesz | ROZBIEŻNE | rekrutacja ¤: wiki 14 vs dane 7 |
| 155 | `jednostki/wojownik-tyrrenski` | Jednostki | Wojownik tyrreński | ROZBIEŻNE | rekrutacja ¤: wiki 15 vs dane 8 |
| 156 | `jednostki/wojownik-z-khopesh` | Jednostki | Wojownik z khopesh | ROZBIEŻNE | rekrutacja ¤: wiki 18 vs dane 9 |
| 157 | `jednostki/wojownik-z-maczuga-chaska` | Jednostki | Wojownik z maczugą (Chaska) | ROZBIEŻNE | rekrutacja ¤: wiki 26 vs dane 13 |
| 158 | `jednostki/wojownik-z-mieczem-i-tarcza` | Jednostki | Wojownik z mieczem i tarczą | ROZBIEŻNE | rekrutacja ¤: wiki 16 vs dane 8 |
| 159 | `jednostki/wojownik-z-toporem` | Jednostki | Wojownik z toporem | ROZBIEŻNE | rekrutacja ¤: wiki 18 vs dane 9 |
| 160 | `technologie/wojskowosc` | Technologie | Wojskowość | ROZBIEŻNE | koszt PN: wiki 104 vs dane 208 |
| 161 | `ulepszenia/wyrab` | Ulepszenia terenu | Wycinka | NIEROZSTRZYGNIĘTY | wiki bez liczby; brak porównywalnych pól |
| 162 | `technologie/wymiana` | Technologie | Wymiana | ROZBIEŻNE | koszt PN: wiki 32 vs dane 64 |
| 163 | `cuda/wyrocznia` | Cuda świata | Wyrocznia | ZGODNE-POLA | zgodne: koszt pracy=180; max na świecie=1; dostęp R=R |
| 164 | `cuda/yerkapi` | Cuda świata | Yerkapı (Brama w ziemi) | ZGODNE-POLA | zgodne: koszt pracy=240; max na świecie=1; dostęp E=E |
| 165 | `pojecia/zalozanie-miasta` | Mapa i ekspansja | Założenie miasta | NIEROZSTRZYGNIĘTY | brak liczby kosztu w wiki (Mapa i ekspansja lub brak pola) |
| 166 | `cuda/ziggurat` | Cuda świata | Ziggurat / Piramida Słońca | ZGODNE-POLA | zgodne: koszt pracy=240; max na świecie=1; dostęp E=E |
| 167 | `cywilizacje/zulusi` | Cywilizacje | Zulusi | ZGODNE-POLA | zgodne: jednostka unikalna=Impi |
| 168 | `jednostki/zwiadowca` | Jednostki | Zwiadowca | ROZBIEŻNE | rekrutacja ¤: wiki 8 vs dane 4; utrzymanie ¤: wiki 1 vs dane 0; żywność/t: wiki 1 vs dane 0 |
| 169 | `technologie/zegluga` | Technologie | Żegluga | ROZBIEŻNE | koszt PN: wiki 80 vs dane 160 |

## 3. Panele „ściąga" UI — 17 z listy „Skatalogowane" (`AUDYT` §3)

Lokalizacje na pinie `edb8fb56` (numery z audytu są przesunięte o +300…+3000 wierszy). Podsumowanie (po korekcie rundy 2): **PASS 2** (#4, #10), **PASS-WITH-NOTES 3** (#1, #2, #14), **NIEAKTUALNY 2** (#3, #13), **FAIL 1** (#6), **NIEROZSTRZYGNIĘTY 9** (#5, #7, #8, #9, #11, #12, #15, #16, #17). Razem 17.

| # | Panel | Lokalizacja (pin) | Status | Dowód / uwagi |
|---|---|---|---|---|
| 1 | Zdrowie — szczegóły | `cityPanel.ts:3582` | PASS-WITH-NOTES | Wzór „floor(Zdrowie÷10) × 1 p.p." zgodny z `population-growth-v85.ts:259`. Notatka: pomija mnożnik cywilizacji `lud_zdrowie_proc` (`:260`). |
| 2 | Religia — wariant fallback (bez CityView) | `cityPanel.ts:4112` `renderReligia`, gałąź `else` w callbacku sekcji (wiersze ~4118–4134) | PASS-WITH-NOTES | Źródło danych: hak `getReligionState` wpięty w `main.ts:7338–7351` (zwraca `dominujaca`, `udzialPct`, `wplywSzczescie`). Wiersze: „Dominująca" = `dom.religion`; „Udział" = `udzialPct`%; „Wpływ na Sz" = `religiaSzPunkty(wplywSzczescie)` (`cityPanel.ts:3050`, komentarz G4/G15: wskaźnik [−1,+1] → punkty epoki). Gałąź „Brak danych silnika (hak getReligionState)" (`:4131–4132`) jest osiągalna tylko, gdy hak zwróci `null` (miasto nieistniejące). **Równoważność „Wpływ na Sz" (korekta, zarzut nr 4):** `religiaSzPunkty` = `szPktDisplay(proporcjonalneSzczescie(kultReligScaleForEra(era, scale), ownShareFromSignal(wskaznik)))` (`cityPanel.ts:3034–3036, 3050–3058`) — ta sama kompozycja trzech funkcji co silnik `computeHappinessBreakdown` (`society-breakdown.ts:721, 726, 735–736`, gałąź bez jawnego `ownReligionShare` → `ownShareFromSignal(haRel)`). Jedyna różnica to zaokrąglenie do 0,1 w wyświetleniu (`szPktDisplay`). **Notatka:** źródło `era` i `difficulty` w panelu (`cfg.getEpoch`, `cfg.difficulty`) nie zostało prześledzone do wejścia silnika `input.era` / `difficulty`; porównanie liczbowe dla konkretnego przykładu nie wykonane. |
| 3 | Zamożność — wariant kompaktowy | `cityPanel.ts:4333` (`buildWealthCompactTooltipCard`, funkcja od `:4307`) | NIEAKTUALNY | Wiersz „Szczęście … (co 10 poziomów W +1)" (`:4333`). Pin: `wealth.ts:122,141` → `floor(poziom × zadowolenieMax / cap_epoki)`, cap = epoka×10; stara formuła „co 10 poziomów" usunięta. Ta sama fraza w pełnej karcie `cityPanel.ts:4874` (audyt ocenił ją „Poprawny" — werdykt wymaga korekty). |
| 4 | Rekruci (pobór) | `cityPanel.ts:5652` | PASS | Max = 10% ludn. absolutnej (`epoka-ludnosc-manpower.json`, manpowerNaLudka = ludekNaLudka/10); regen 2% (`manpower.ts:64`); blokada przy oblężeniu (`:65`). |
| 5 | Ludność — co to znaczy | `cityPanel.ts:5684` | NIEROZSTRZYGNIĘTY | Zweryfikowane: wzór wzrostu „ludność × WZROST% / 100, ułamek w buforze" = `population-growth-v85.ts:296–299` (`frac += pop*pct/100`); `WYZYWIENIE_MAX = 6` (`population-growth-v85.ts:28`). **Nieprzeliczone:** zdanie intro „wpływa na koszt racji, limit pól (👤) i koszty utrzymania"; układ kolumn. |
| 6 | Praca — co to znaczy | `cityPanel.ts:5770` | FAIL | Wzór zgodny: `doBudynkow = round(praca×%)`, `doPuli = praca − doBudynkow` (`production.ts:2068–2073` `splitPraca`; `cityPanel.ts:1361` `cityPracaSplit`). **Rozbieżność treści:** panel opisuje „Złoty dopisek = ten gród → kolejka budowy", także gdy kolejka jest pusta. Silnik: `pracaImperialPoolGain(split, queueEmpty)` → przy pustej kolejce `doPuli + doBudynkow` idzie do puli (`production.ts:2085–2090`). Brak wyjątku w opisie. |
| 7 | Pieniądz — co to znaczy | `cityPanel.ts:5824` | NIEROZSTRZYGNIĘTY | Zweryfikowane: „Targowisko, Mennica" jako źródła pieniądza (`buildings.json`: targowisko pieniadz baza 5 / przyrost 3; mennica baza 3 / przyrost 2). **Nieprzeliczone / rozjazd nazw:** formuła `pieniadzNetto = podatki + handel_netto + budynki − utrzymanie` — symbol `pieniadzNetto` nie występuje w `gra/src` poza napisem `cityPanel.ts:5894`. Silnik: `skarbiec += totalPieniadz` (`playerState.ts:25`; `main.ts:19052`). Składowe „− wydatki" nieprzeliczone. |
| 8 | Nauka — co to znaczy | `cityPanel.ts:5904` | NIEROZSTRZYGNIĘTY | Zweryfikowane: „Biblioteka + pola z nauką" (`biblioteka` nauka baza 3 / przyrost 2). **Nieprzeliczone:** formuła `nauka += plony + budynki + % handlu` — silnik sumuje `tk.nauka` per miasto (`turn-economy.ts:1216–1224`), skład `tk.nauka` nieprześledzony do końca. |
| 9 | Kultura — co to znaczy (chip) | `cityPanel.ts:5949` | NIEROZSTRZYGNIĘTY | Zweryfikowane: źródła „Teatr, Świątynia, cuda" (`teatr` kultura 4; `swiatynia` kultura 2). **Nieodnalezione:** „fioletowe pierścienie = zasięg kultury" — 0 trafień w `gra/src/render`, `gra/src/map`, `gra/src/ui` (3 zapytania; wynik negatywny, nie dowodzi braku). |
| 10 | Religia — co to znaczy (chip) | `cityPanel.ts:5992` | PASS | „100% własnej +X, 50/50 = 0, 100% obcej −X" zgodne z `2·udział−1` i skalą epoki (`culture-religion.ts` `religionOwnShare`, `society-breakdown.ts`). |
| 11 | Rekrutacja — szczegóły (zakładka) | `cityPanel.ts:8861` | NIEROZSTRZYGNIĘTY | Zgodne z komentarzem silnika: „Max 1 ukończenie / turę / miasto (v0.1)" (`production.ts:157`). **Nieprzeliczone:** czy limit jest egzekwowany w kodzie (nie prześledzono ścieżki kolejki rekrutacji). Znacznik „(v0.1)" to etykieta wersji z komentarza, nie fakt gry. |
| 12 | Skład bonusów — {budynek} | `cityPanel.ts:8979` | NIEROZSTRZYGNIĘTY | Grep: 0 literałów liczbowych w `cityPanel.ts:8979–9060`; liczby pochodzą z `upgradeChainSteps` / `upgradeCompositionLines` / `buildingUiDisplayLevel`. **Nieprzeliczone:** treść wyjściowa tych funkcji. |
| 13 | Garnizon — szczegóły | `cityPanel.ts:9428` | NIEAKTUALNY | (a) „1 jednostka = +20 pkt Prawa" — twardo; pin `society-params.json:767` (`prawo_garnizon_per_jednostka`): easy 25 / normal 20 / hard 15, więc panel jest poprawny tylko dla normal. (c) „Duże miasto bez wojska: Kara Prawa (≥6 mieszk.)" — NIEAKTUALNE: kara usunięta (`society-breakdown.ts:161–172`, R-PRAWO-PRZEBUDOWA-SKALI-Q1 D5). (b) „5+ jednostek → PrawPct do 100% (cap)": **korekta rundy 1** — zdanie zgodne dla normal (cap jednostek 5, `society-breakdown.ts:827`), niezgodne dla hard (cap 4); nie stanowi podstawy werdyktu. Werdykt NIEAKTUALNY opiera się na (a) i (c). |
| 14 | [Budynek] — karta charakterystyki | `cityPanel.ts:7561–7705` | PASS-WITH-NOTES | Wiersze liczbowe wiązane z polami definicji: „Koszt budowy" (`workCost`), „+przyrostKosztu pkt Pracy / poziom", „+przyrostUtrzymania pkt Pieniądza / poziom", „max `maksPoziom`" (`:7595` w tekście poziomu). Grep: brak innych literałów liczbowych w zakresie. **Nieprzeliczony tekst karty (korekta, zarzut nr 3):** „L1 (podgląd; w mieście rośnie z epoką, max N)" (`:7595`), „Plony i efekty (przychód na turę)" (`:7599`), „Pancerz (jednostki, trwale)" (`:7628`), „Koszty budowy i utrzymania" (`:7640`) — etykiety i opisy nie przeliczone wobec silnika. |
| 15 | Budynki w mieście (N) | `cityPanel.ts:7806–7860` | NIEROZSTRZYGNIĘTY | Grep: 0 literałów liczbowych; treść listy z helperów nieprzeliczona. |
| 16 | [Jednostka] — karta jednostki | `cityPanel.ts:7861` (`buildUnitDetailCardViaEntityCard`), fallback `:7885` (`buildUnitDetailCard`) | NIEROZSTRZYGNIĘTY | Ścieżka live = karta encji. W fallbacku wiersze z pól `u[...]` (np. `Utrzymanie (Pieniądz/turę)` jako ¤, `Próg dezercji (% health)` × 100). **Nieprzeliczone:** pełna treść obu ścieżek. |
| 17 | Zobacz szczegóły zużycia | `empireDetailPanel.ts:3289` (`resUsageDetailsHtml`), `<summary>` `:3299` | NIEROZSTRZYGNIĘTY | Etykiety i notatki zgodne z polami `usage.buildings` / `usage.citizens` / `usage.units` oraz `ratePerTurn`/`rateProductionPerTurn` (`:3291–3309`). **Nieprzeliczone:** twierdzenie „obywatele klamrowani do dostępnego zapasu" (silnik) — nie prześledzone. |

### Dodatkowe ustalenie (poza listą 17)

- Pełna karta „Zamożność — ściąga" (`cityPanel.ts:4874`) zawiera tę samą nieaktualną frazę „bonus do szczęścia co 10 poziomów W" — status NIEAKTUALNY (audyt: „Poprawny", wymaga korekty).


## 4. Rejestr rozbieżności (wpis wymagany przez korektę rundy 2, defekt #3)

Rejestr obejmuje rozbieżności wykryte w tej rundzie. Przyczyny techniczne są podane tylko tam, gdzie odtworzono je z historii pina; reszta jest oznaczona jako nieustalona.

| ID | Rozbieżność | Zakres | Dowód (pin edb8fb56) | Stan |
|---|---|---|---|---|
| RJ-1 | Koszt rekrutacji w wiki (`Pieniądz (koszt)`) ≠ `units.json`: wiki = 2× dane w **38** jednostkach; inne wartości w **4** (Łucznik sumeryjski 9 vs 5; Oszczepnik (Estólica) 9 vs 5; Wojownik tyrreński 15 vs 8; Wojownik germański 16 vs 0). Zwiadowca: utrzymanie 1 vs 0, żywność 1 vs 0. | 42 jednostki | `wikiBundle` generated 2026-09-05; `units.json`: commit `f5a1ce51` (2026-09-15, „AI and recruitment costs"), `4c1126de` (2026-09-16, „apply half recruitment and resource upkeep costs"). Wiki = wartość sprzed zmiany. | Wiki nieaktualna względem pina. Dane nie wymagają korekty w tym temacie. |
| RJ-2 | Wojownik germański: wiki „16 ¤", dane `Pieniądz (koszt)` = 0 (super-jednostka). | 1 | `units.json`; zgodne z audytem §2d/§5 (błąd generatora `\|\| 10` — `tools/generate-encyklopedia.cjs:97–99`) | NADAL ISTNIEJE (generator). |
| RB-1 | Surowce budowy wiki = 1/5 danych (×5) | Baszta, Fort (Cytadela), Mury, Warsztat oblężniczy | `buildings.json` `koszt_surowce` (np. mury: drewno 40, kamień 80 vs wiki 8/16). Zgodne z audytem §2c (commit `e401c1c2`, 2026-08-12). | **Przyczyna nieustalona** (korekta, zarzut nr 6): `e401c1c2` jest wcześniejszy niż bundle `generated` 2026-09-05, a wiki nadal ma 1/5. Źródło generatora do zbadania (jak RT-1). Stan: rozbieżność istnieje. |
| RB-2 | **Garnizon**: wiki „koszt 60 pkt Pracy + 60 drewna z magazynu, utrzymanie 4 ¤/t i 5 drewna/t" vs dane `kosztBudowy` 30, `koszt_surowce` drewno 30, `utrzymanie` 2, `przyrostUtrzymania` 1. | 1 | `buildings.json` pole `uwagi` garnizonu: „ZATWIERDZONE PRZEZ WŁAŚCICIELA bez zmian (ECHO 2026-09-05, ratyfikacja rundy 2 …)". „5 drewna/t" — brak pola w danych, nieweryfikowalne. | Dane zatwierdzone przez właściciela. **Wiki wymaga korekty** (poza tym tematem). Rundy 1 „0 rozbieżności" nie utrzymuje się. |
| RT-1 | Koszt badań PN w wiki = 1/2 danych (`Koszt nauki`) | 28 technologii (wszystkie poza tier 1) | `tech.json`; commit `ab75bb4f` (2026-08-29, „podwojenie Koszt nauki dla 28 technologii") — liczba i zakres zgodne z 28 rozbieżnościami. Tier 1 (Łowiectwo, Obróbka drewna, Oswojenie zwierząt, Rolnictwo) — zgodne (5 PN). | **Przyczyna nieustalona** (korekta, zarzut nr 5; nie „wiki nieaktualna"). Bundle `generated` 2026-09-05 powstał PO commicie `ab75bb4f` (2026-08-29), a mimo to pokazuje wartości sprzed zmiany. Nie ustalono, czy źródłem jest generator, czy stary zrzut danych wejściowych. Do zbadania osobno. |
| RU-1 | Hasło „Kopalnia" opisuje ulepszenie usunięte z gry (dane: 4 kopalnie `kopalnia_*`; audyt pisze o 3) | 1 | `terrain-improvements.json`: brak klucza `kopalnia`; są `kopalnia_miedzi`, `_zelaza`, `_cyny`, `_zlota` | Zgodne z audytem §5 (potwierdzone). |
| RC-1 | Celtowie: wiki „Jednostka unikalna: Miecznik galijski" vs `civs.json` `Jednostka specjalna` = Soldurii | 1 | `civs.json` | Zgodne z audytem §5 (potwierdzone). |
| RC-2 | Chińczycy: wiki „Kusznik (lepszy łucznik)" vs `civs.json` `Jednostka specjalna` = Jeździec chiński | 1 | `civs.json` | **Nowe** (audyt §5 nie wymienia tego rozjazdu). Wymaga weryfikacji, czy pole `Jednostka specjalna` jest jedyną wykładnią jednostki unikalnej. |

## 5. Korekty względem rundy 1

- Rundy 1 zdanie „0 rozbieżności w polach podanych przez wiki (Budynki)" — **błędne**: 5 haseł Budynki ROZBIEŻNE (Garnizon, Baszta, Fort, Mury, Warsztat oblężniczy), patrz §2 i RB-1/RB-2.
- Rundy 1 „Budynki 6 / 17" — zastąpione zestawieniem per hasło (§1, §2).
- Rundy 1 „Jednostki 0/51" — zastąpione: **49/49 jednostek** sprawdzonych (+2 pojęcia NIEROZSTRZYGNIĘTY). Parser nie był już przyczyną.
- Rundy 1 „Panel #2 nie zlokalizowany" — zlokalizowany i zweryfikowany (§3, #2).
- Rundy 1 uzasadnienie #13 pkt (b) — poprawione (§3, #13).
- Rundy 1 cytat „Zamożność compact: `cityPanel.ts:4307`" — poprawiony na **`cityPanel.ts:4333`** (fraza „(co 10 poziomów W +1)"); funkcja zaczyna się na `:4307`.
- Rundy 2 (zarzut nr 8) — **„13/25 maksymalnie 10 poziomów"** (AUDYT §5, `P1-16-EDGE-CASES.md` §9.5 linia 546, status NIEROZSTRZYGNIĘTY): **NIE ODTWORZONO**. Frazy „maksymalnie 10 poziom" nie ma w żadnym polu 169 wpisów wiki (`wikiS`, `wikiM`, `full`, `historia`) — 0 trafień. Trafienie „mury (negacja)" cytowane w §9.5 nie zostało odtworzone. Pozycja pozostaje NIEROZSTRZYGNIĘTY, nie NAPRAWIONY.
- Rundy 2 (zarzut nr 8) — **mapowanie defektów #1–#10 z rundy 1: nie wykonano.** Lista defektów nie jest w dispatchu rundy 2, a w `runs/R-RUSTPORT-P1-16D-OPISY-CIVPEDIA-UI-Q1/` nie ma raportu Evaluatora rundy 1. Wpisy §5 powyżej pokrywają jedynie korekty wykryte samodzielnie; numer-po-numerze mapowanie wymaga listy defektów od orkiestratora.

## 6. Nierozstrzygnięte — co zostaje (lista do osobnego tematu)

- **Hasła (19 NIEROZSTRZYGNIĘTY):** wypisane w §2 ze statusem; 10 pojęć bez pól danych, Bród, Manpower, przegląd cudów, Mapa „Założenie miasta", Wycinka (koszt „?"), Wielka Kuźnia (wpis parkowany), Handel surowcami (dyplomacja), Wiarygodność, Władcy.
- **Hasła ZGODNE-POLA (70):** prozę (opisy, efekty, „Strategia", „Typowe błędy") trzeba przeliczyć osobno.
- **Hasła ROZBIEŻNE (78):** korekta wiki (RJ-1, RT-1, RB-1, RB-2) albo decyzja, czy wiki ma wracać do danych. Poza zakresem Operatora (nie edytujemy `gra/**`).
- **Panele:** #5, #7, #8, #9, #11, #12, #15, #16, #17 — dociągnięcie formuł/treści; #6 — poprawka treści (wyjątek pustej kolejki).
- **Zakaz:** `gra/**` nietknięte; brak commitu i push (DEPLOY/PUSH: NIE WYKONANO).
