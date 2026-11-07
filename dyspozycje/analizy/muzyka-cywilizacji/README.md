# Muzyka cywilizacji (dyplomacja) — WDROŻONA (R-WEB-DIPLO-CIV-MUSIC-Q1)

Polecenie właściciela 2026-11-07: w dyplomacji gra muzyka charakterystyczna dla
cywilizacji rozmówcy (nie gracza): **przywitanie** (raz, po otwarciu rozmowy), potem
**negocjacje** (pętla). Po zamknięciu dyplomacji wraca muzyka gry. Wyciszona muzyka
gry = dyplomacja też milczy; suwak głośności działa jak dla reszty muzyki.

## Tabela utworów (materiał źródłowy od właściciela → pliki w grze)

| civId | Przywitanie | Negocjacje | Uwagi |
|---|---|---|---|
| grecy | Gesture at the Threshold (0:43) | Before the Treaty (2:20) | |
| rzymianie | The Consul's Welcome (0:59) | A Measure of Authority (2:30) | stare utwory `dyplomacja/rzymianie/` zostają jako awaryjny zapas |
| chinczycy | The Scholar's Respite (0:47) | A Measured Consideration (2:24) | |
| zulusi | Courtyard Greeting (0:42) | The Patient Indaba (2:33) | |
| egipt | Offering To The Throne (0:40) | The King's Audience (2:29) | |
| sumer | The Ziggurat Gates (0:39) | — brak | po przywitaniu gra dotychczasowy utwór dyplomacji (`Gilded_Porticos`) |
| inkowie | — brak | Breath on the Stone (2:29) + Summit of Ancient Air (2:25) | oba w pętli na zmianę (losowo, bez powtórzenia z rzędu); rozmowa zaczyna od negocjacji |

Pozostałe cywilizacje (celtowie, germanie, harappa, hetyci, slowianie, babilonia,
asyria, fenicjanie): bez zmian (dotychczasowy utwór dyplomacji).

**civId = `ikonaId` z `gra/data/civs.json`** (Sumerowie = `sumer`, nie `sumerowie`).

## Gdzie to jest w kodzie

- Pliki gry (przekodowane, mp3 ~64 kbps negocjacje / 96 kbps przywitania, cisza na początku i końcu
  ucięta poniżej −50 dB, razem ~10,7 MiB = 11 241 168 B):
  `gra/src/audio/utwory/dyplomacja/_civ/<civId>/<plik>.mp3`
- Manifest: `gra/data/civ-music.json` — `civId → { greeting?: "plik.mp3", negotiation?: ["plik.mp3", …] }`
- Wybór utworów (czysta funkcja): `gra/src/audio/civMusic.ts` (`resolveCivDiplomacyTracks`)
- Odtwarzanie: `gra/src/audio/filePlayer.ts` (`createPlaylist(..., leadCount)` — przywitanie raz,
  potem pętla negocjacji z crossfade 1,5 s) i `diplomacyPlaylistForCiv()`; start/stop z
  `showDiplomacyAudience` / `hideDiplomacyAudience` (bez zmian — już wołały `startDiplomacyMusic(otherCivId)`).
- Testy: `gra/tools/civ-music-test.cjs` (jednostkowy), `gra/tools/civ-music-live-test.cjs` (Chromium).

## Jak dodać kolejną cywilizację (plik + wpis, bez zmian w kodzie)

1. Przekoduj utwory i utnij ciszę na początku/końcu (inaczej pętla ma przerwę ~1,5–2,7 s):
   `ffmpeg -i wejscie.mp3 -vn -map_metadata -1 -af "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse" -c:a libmp3lame -b:a 64k -joint_stereo 1 wyjscie.mp3`
   (negocjacje 64 kbps, przywitanie 96 kbps; budżet łączny wszystkich utworów ≤ ~12 MiB — sprawdza `civ-music-test.cjs`).
2. Wrzuć do `gra/src/audio/utwory/dyplomacja/_civ/<civId>/` (civId = `ikonaId` z `civs.json`),
   nazwy np. `<civId>_przywitanie.mp3`, `<civId>_negocjacje.mp3`.
3. Dopisz wpis w `gra/data/civ-music.json`, np.
   `"celtowie": { "greeting": "celtowie_przywitanie.mp3", "negotiation": ["celtowie_negocjacje.mp3"] }`.
   Brak `greeting` = rozmowa zaczyna od negocjacji; brak `negotiation` = po przywitaniu gra dotychczasowy utwór.
4. `node tools/civ-music-test.cjs` — sprawdza zgodność manifestu z plikami i budżet rozmiaru.

## Historia materiału

Sumerowie: drugi wrzucony plik był identyczny z negocjacjami Egiptu (ten sam MD5) i został
odrzucony — stąd brak negocjacji Sumerów. Surowe pliki źródłowe (3,4–3,7 MB każdy) nie są w repo
poza gałęzią dispatchu; w grze działają wersje przekodowane.
