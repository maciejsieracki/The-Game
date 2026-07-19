# DYSPOZYCJA MUZYKA — wpięcie proceduralnej muzyki tła (epoki: kamień + brąz)
(MASTER, 2026-07-10 · wykonawca: CODE-INTEGRATOR · na hasło Macieja „start MUZYKA" po jego akceptacji odsłuchowej)

## 0. CO TO JEST I PO CO
Muzyka tła generowana W LOCIE przez Web Audio API — **zero plików audio** (gra zostaje single-file; moduł ≈ +30 KB w bundlu). Muzyka jest GENERATYWNA (nie zapętla się nachalnie — motywy wracają z wariacjami) i ma DWIE osie:
- **EPOKA** (brzmienie świata): `era 1 = KAMIEŃ` — pejzaż natury (wiatr zawsze, ptaki, świerszcze, odległe wycia) + kościana piszczałka (pentatonika, 2 powracające motywy) + bębny-kłody, klekot kamieni, grzechotka, rzadkie odległe pomruki ludzkie; `era 2+ = BRĄZ` — antyczne instrumenty: lira/kithara, aulos, dron, bęben ramowy, greckie modusy (dorycki/frygijski/miksolidyjski), 2 rodziny melodii. Epoki ≥3 na razie grają brązem (przyszłe programy dodadzą własne).
- **NASTRÓJ** (sytuacja w grze): `mapa` = spokojne tło strategiczne (kontemplacyjne, nie męczy przy 2 h grania); `bitwa` = intensywniej (kamień: gęste kłody + okrzyki wojenne + piszczałka alarmowa; brąz: gęstsze bębny, frygijski, ostinata liry). Przejścia: nastrój crossfade 4 s, epoka 6 s (awans epoki ma być SŁYSZALNY).

## 1. PLIK
`gra-robocza/_sandbox/MASTER/muzyka/muzyka-antyczna.ts` (56,8 KB, tsc --strict czysty, zero zależności) → skopiuj do **`gra/src/`** (np. `gra/src/audio/`). **KANON = gra/src** (raport subagenta wskazał srcKopiaMaster — to zamrożone drzewo, ZWERYFIKUJ punkty wpięcia w kanonie!). Demo i próbki MP3 zostają w _sandbox (nie wchodzą do gry).
API: `startMusic(mood?)`, `setMood('mapa'|'bitwa')`, `setEra(1|2|…)`, `setMusicVolume(0..1)`, `stopMusic()`, `isMusicPlaying()`, `getMood()`, `getEra()`. AudioContext tworzy się leniwie — start MUSI nastąpić po geście użytkownika (polityka autoplay przeglądarek).

## 2. WPIĘCIA (wszystkie w kanonie gra/src; szukaj odpowiedników funkcji, nie numerów linii)
1. **START:** `startMusic('mapa')` + `setEra(eraGracza)` po PIERWSZYM geście: (a) start nowej gry z kreatora (przycisk „Rozpocznij" → doStartGame), (b) wczytanie save / „Kontynuuj", (c) wejście w playtest-skróty. NIE startować na load strony (autoplay!).
2. **BITWA:** `setMood('bitwa')` przy tworzeniu/otwieraniu BattleScene (arena taktyczna); `setMood('mapa')` w callbacku wyniku bitwy ORAZ w ścieżce anulowania/wyjścia. **Auto-rozstrzyganie bitwy (bez areny) NIE zmienia nastroju.**
3. **EPOKA:** `setEra(nowaEra)` w miejscu awansu epoki gracza (tam gdzie toast „nowa epoka"); dodatkowo `setEra(era)` przy starcie gry i po wczytaniu save (pkt 1).
4. **OPCJE/UI:** suwak głośności → `setMusicVolume` (domyślnie ~0.7) + przełącznik Muzyka WŁ/WYŁ → `stopMusic()`/`startMusic(getMood())`. Zapisywać ustawienie jak inne preferencje gracza. Muzyka domyślnie WŁĄCZONA.
5. Bitwa dotyczy TYLKO gracza — bitwy AI↔AI poza ekranem nie zmieniają nastroju.

## 3. BRAMKI I TEST MACIEJA
tsc --noEmit=0 · vite bez prebuildu · bundle rośnie ≤~40 KB · żadnych błędów konsoli o AudioContext przed gestem.
Test: (1) nowa gra epoka 1 → po kliknięciu Start słychać pejzaż kamienia; (2) wejście w bitwę → muzyka gęstnieje, po bitwie wraca; (3) awans do brązu → w ciągu ~6 s wchodzi lira (słyszalna nagroda); (4) suwak i wyłącznik działają, ustawienie przeżywa save/load; (5) 15 minut grania — nic nie kłuje w uszy, motywy wracają, ale nie ma nachalnej pętli.
Meldunek w kanale ze stemplem + „bez zmian danych balansu" (§8).
