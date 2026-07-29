# Utwory muzyczne — wrzucaj tutaj

Katalog na pliki muzyczne wkompilowywane do bundla gry (Vite inline'uje je jako
base64, więc gra zostaje pojedynczym plikiem HTML i działa z `file://`).

## Jak wrzucać
Skopiuj pliki audio do tego katalogu. Nazewnictwo dowolne — kod czyta katalog,
nie polega na konkretnych nazwach.

## Katalogi kontekstowe (kod czyta katalog, nazwy plików dowolne)
- `kamien/`     — muzyka rozgrywki epoki kamienia (shuffle, 3× pod rząd)
- `intro/`      — muzyka ekranów przed rozgrywką (STAŁA kolejność — patrz
  `INTRO_KOLEJNOSC` w `filePlayer.ts`; nowy plik NIE wskoczy sam we właściwe
  miejsce, trzeba dopisać nazwę do listy)
- `dyplomacja/` — utwór panelu audiencji dyplomatycznej (gra póki panel otwarty;
  fallback: jeden plik w katalogu głównym; per-civ: podkatalog `<civId>/` z
  własną playlistą — patrz `DYPLOMACJA_CIV_TRACK_ORDER` w `filePlayer.ts`)
- `prebattle/`  — utwór nakładki pre-battle (przed bitwą)
- `bitwa/`      — utwór sceny bitwy właściwej
- `zwyciestwo/` — utwór ekranu końca WYGRANEJ bitwy
- `porazka/`    — utwór ekranu końca PRZEGRANEJ bitwy

Katalogi kontekstowe (dyplomacja/prebattle/bitwa/zwyciestwo/porazka) grają JEDEN
utwór w pętli póki dany ekran otwarty (overlay w `muzyka-antyczna.ts` — muzyka gry
milknie na ten czas i wraca po zamknięciu).

## Uwaga o wadze
Każdy plik rośnie o ~33% po zakodowaniu do base64. Bundel gry ma dziś ~10 MB.
