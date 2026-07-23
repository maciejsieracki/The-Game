# REJESTR PRÓŚB I ZADAŃ — jedyne miejsce śledzenia próśb Macieja

## ⛔ ZASADA PROCESU (Maciej 2026-07-24, obowiązkowa dla KAŻDEJ sesji)
**KAŻDA prośba Macieja, która powinna skończyć się jakąkolwiek zmianą w grze/kodzie/danych,
MUSI zostać natychmiast zapisana TUTAJ** — nawet jeśli padła mimochodem w czacie i nie jest
od razu realizowana. Powód: prośby z samego czatu giną (potwierdzony przypadek: „osobny poziom
trudności per państwo/miasto" — poproszona dawno, nigdzie nie zapisana, nie wdrożona, nikt tego
nie pilnował). Narracja w czacie NIE jest śledzeniem. Ten plik jest jedynym rejestrem statusu.

**Format wiersza:** ID · data zgłoszenia · prośba (zwięźle) · STATUS (`NOWE` / `W TOKU` / `WDROŻONE` / `ZDEPLOYOWANE` / `ODRZUCONE` / `CZEKA-NA-DECYZJĘ`) · commit/deploy · uwagi.
Przy zamknięciu tematu: aktualizuj STATUS + wpisz commit/md5. Szczegóły decyzji ekonomicznych → `DECYZJE-SUROWCE-EKONOMIA-2026-07-23.md`.

---

## OTWARTE / DO DECYZJI

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-TRUDNOSC-1 | „jakiś czas temu" (odtworzone 2026-07-24) | **Osobny suwak „Trudność miast-państw" w kreatorze gry**, niezależny od głównej trudności. Steruje 3 mechanizmami miast-państw: (1) startowe zaufanie do gracza, (2) skala sojuszu sióstr, (3) posiłki obronne (RESUP). | **ZDEPLOYOWANE `ea75f5ba`** | Suwak w Zaawansowanych opcjach; domyślnie=główna trudność. Recon 2026-07-24: te 3 elementy są pochodną globalnej `_menuDifficulty` (trust easy+10/normal+5/hard0; sojusz sióstr ×0,6/0,3/0,15; RESUP low/normal/strong) **ORAZ przeciek: `bonusWalka` +5% siły walki AI na hard (`trudnosc_poziom3_bonus_walka`) — miasta-państwa też go dostają z globalnej trudności.** Nowa opcja setupu odpina WSZYSTKO (3 mechanizmy + siłę walki miast-państw) od globalnej. Domyślnie = główna trudność (zero regresji). Główna `_menuDifficulty` steruje resztą (ekonomia/AI/mapa). Musi respektować parytet AI. |
| R-UNIT-KOSZT-ŁUCZ | 2026-07-24 | Łucznicy brązowi = 1 Brąz czy 0? | **WDROŻONE (redeploy 4.1)** | Decyzja: **0** (jednolicie — wszystkie dystansowe darmowe surowcowo, jak Procarz). Łucznik akadyjski/asyryjski 1→0. Reguła kosztów: dystansowe = 0. |
| R-STAWKI-STROJENIE | 2026-07-24 | Docelowe stawki/koszty po obejrzeniu licznika w playteście | CZEKA-NA-PLAYTEST | Placeholdery: stawki wydobycia, bonusy 10%, upkeep −1 Praca, progi CUDA/Ludy Morza, cap magazynu 100/+100, proporcje capa trudności 120/100/80 vs płaskie 100. |
| R-DYST-DREWNO | 2026-07-24 | Rozważyć wymóg DREWNA dla jednostek dystansowych (łucznicy) | CZEKA-NA-PLAYTEST (pomysł na przyszłość) | Dziś dystansowe = 0 surowca (Kamień: groty krzemienne/kościane; Brąz/Żelazo też 0). Ewentualnie wymusić drewno TYLKO jeśli playtest pokaże nadwyżki drewna. Blokada dziś: trudno na starcie postawić ulepszenia (brak produkcji drewna) + timing technologii (tech łuczników vs tech drewna mogą się wykluczać). NIE ruszać bez sygnału Macieja. |
| R-MP-DYPL-PROAKT | 2026-07-25 | Czy proaktywność miast-państw w dyplomacji (`agresjaMnoznik`/`dyplomacjaAktywnosc` w decideAIDiplomacy — propozycje wojna/pokój) też odpiąć od globalnej trudności pod suwak miast-państw? | CZEKA-NA-DECYZJĘ | Dziś globalne (wcześniejsza decyzja „ogólny parametr dla wszystkich AI", D-MP-DYPL Q1 cz.2). 3 mechanizmy (zaufanie/sojusze/posiłki) + aiDiffLevel JUŻ odpięte; to jest 4. potencjalny element. |

## W TOKU

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-MAGAZYN-PANSTWO | 2026-07-24 | Magazyn = pula PAŃSTWA: 100 + 100/Magazyn, nadmiar przepada, surowce wspólne dla imperium | **ZDEPLOYOWANE `ea75f5ba`** | Cap płaski 100/100/100. Parytet AI 44/44. |
| R-HANDEL-SUROWCE | 2026-07-24 | Handel surowcami w dyplomacji: za pieniądz/Pracę; jednorazowy i przez X tur; AI też | **ZDEPLOYOWANE `ea75f5ba`** | Parytet AI (AI↔AI) 42/42. |

## ZAMKNIĘTE (ta sesja, 2026-07-23/24)

| ID | Prośba | Status | Commit/Deploy |
|---|---|---|---|
| R-BYDLO | Bydło/owce/lama = NIE surowce (tylko koń) | ZDEPLOYOWANE | `d6c4f33` / `aa3c9b06` |
| R-LICZNIK | Licznik surowców w panelu imperium | ZDEPLOYOWANE | `d6c4f33` / `cd42837f` |
| R-CERAMIKA | Ceramika = tylko dostęp (Garncarnia); koszt 3 budynków→cegła | ZDEPLOYOWANE | `f136c09` / `cd42837f` |
| R-PROD-BEZ-PRAC | Produkcja per-ulepszenie bez wymogu pracowników | ZDEPLOYOWANE | `f136c09` / `cd42837f` |
| R-PALIWO | Usunąć Paliwo + Mielerz (konwertery→drewno) | ZDEPLOYOWANE | `2d9f173` / `cd42837f` |
| R-BONUSY-BUD | Stolarnia/Warsztat +10% civ, Garncarnia +10% lokalnie żywność | ZDEPLOYOWANE | `2d9f173` / `cd42837f` |
| R-KOSZT-BUD | Koszty surowcowe 28 budynków (Kamień/Brąz/Żelazo) | ZDEPLOYOWANE | `2d9f173` / `cd42837f` |
| R-CEGLA-A | Cegła-A: Cegielnia 3, Glinianka 5 | ZDEPLOYOWANE | `2d9f173`,`bcd818b` / `cd42837f` |
| R-UPKEEP-PRACA | −1 Praca/turę za ulepszenie surowcowe (wariant B) | ZDEPLOYOWANE | `bcd818b` / `cd42837f` |
| R-DEADLOCK-AI | Fix kolejności budowy AI (konwertery przed konsumentami) | ZDEPLOYOWANE | `bcd818b` / `cd42837f` |
| R-KOSZT-JEDN | Koszty jednostek (Kamień 0/Brąz/Żelazo, 1/2/3; Procarz 0) | WDROŻONE (redeploy 4.1) | `aff3435`,`2b0cd14` |
| R-SUPER-ARCHE | Super-jednostki: bezpłatne pieniężnie + max1/stolica + 3 surowca | WDROŻONE (redeploy 4.1) | `c2d77fe` |
| R-CUDA-AI | AI buduje cuda | ZDEPLOYOWANE | `d6c4f33` / `aa3c9b06` |
| R-CUDA-BONUS | Wonder-bonusy realnie w ekonomii (gracz+AI) | ZDEPLOYOWANE | `b5e7110` / `cd42837f` |
| R-LUDY-MORZA | #15 Ludy Morza (embarkacja+rajdy) | ZDEPLOYOWANE | `6859d9e` / `aa3c9b06` |
| R-PARYTET-AI | ZASADA: zero uproszczeń dla AI, kod ownerId-agnostic | ZAPISANE (obowiązuje) | `318ed6c` |
| R-X2-OBSADA | Reguła ×2 przy obsadzie ludnością | ODRZUCONE | — (dublowałoby upkeep) |
