# P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1 — Final Control, runda 2/5

MODEL+EFFORT: **Opus 5, effort high** · DATA: 2026-09-06 · worktree `/home/user/wt-ai-adiacencja`,
gałąź `autobot/P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1`, HEAD `7a27c6ee`.
Guard §2b: `git merge-base --is-ancestor 022b82aa HEAD` OK, `--is-ancestor acd672fb HEAD` OK
(sprawdzane przodkostwem, nie równością); `git status --short` pusty przed pracą, po każdej
mutacji i na końcu. Mutacje wyłącznie przez KOPIĘ pliku (backup poza worktree), nigdy
`git checkout`; po każdej `git diff --quiet` zielone, na końcu `md5sum` czterech plików
produkcyjnych identyczny z kopią sprzed pracy. Kod nietknięty przeze mnie.
Raport `10-operator-runda2.md` traktowany jako HIPOTEZA — każdą jego liczbę odtworzyłem sam.

STATUS: PASS
DOMAIN: GAME
TEMAT: P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1
GOAL: rozkaz `move` AI major na sąsiedni, niebroniony obcy heks miasta skutkuje przejęciem;
jednostka nie traci tury bez efektu.

## MOJE MUTACJE (14, każda cofnięta kopią, `git diff --quiet` po każdej)

| # | Mutacja | Bramka tematu | Faile |
|---|---|---|---|
| **FC1** | `main.ts`: `unitIsCivilian: isCivilianUnit(u)` → `false` (**powtórzenie M3 — dowód domknięcia F1**) | **87/88, exit 1** | **1** (`A5g`) |
| FC2 | `main.ts`: `hasCityDefenders(destinationCity, units)` → `…, [])` | 87/88, exit 1 | 1 (`A5d`) |
| FC3 | `main.ts`: `onCapture` rozpięty od `tryAutoCaptureEmptyCityAt` (`false &&`) | 87/88, exit 1 | 1 (`A5c`) |
| FC4 | `city-hex-movement.ts`: zdjęta bramka **adiacencji** (`hexDistance !== 1`) | **88/88 ZIELONE** | 0 — patrz FC-N1 |
| FC5 | `city-hex-movement.ts`: zdjęta bramka `maMur` | exit 1 | 4 (`K4-MAMURa-d`) |
| FC6 | `city-hex-movement.ts`: `cityBuiltIds` (mury/palisada/fort/baszta) → `return true` | 84/88, exit 1 | 4 (`K4-MURYa-d`) |
| FC7 | `city-hex-movement.ts`: zdjęta bramka cywila **w produkcji** | exit 1 | **6** (`K3g`, `K7-Robotnikc/d`, `K7-Osadnikc/d`, `K8a`) |
| FC8 | egzekutor: `opts.unitIsCivilian` → `false` (powtórzenie M8) | 83/88, exit 1 | **5** — liczba z raportu FC r1 potwierdzona |
| **FC9** | **pełny revert naprawy** (4 pliki → `022b82aa`) | exit 1 | **11** (`K3g`, `K7a`×2, `K7-*c/d`×4, `A5e/A5g/A5h`, `K8a`) |
| FC10 | `main.ts`: `canUnitOccupyCityHex(…, cities)` → `…, [])` | 87/88, exit 1 | 1 (`A5b`) |
| FC11 | `main.ts`: `targetVisible` → `true` (mgła wojny martwa we wpięciu) | **88/88 ZIELONE** | 0 — patrz FC-N2 |
| **FC12** | `city-hex-movement.ts`: zdjęte `if (hasDefenders) return false;` (powtórzenie M9) | exit 1 | **3** (`K4-BRONIONEc/d`, `K8c`) |
| FC13 | `main.ts`: KOPIA formuły zamiast `isCivilianUnit(u)` | 88/88 | 0 — patrz FC-N4 |
| FC14 | egzekutor cofnięty do bazy → `tsc` | — | **2 błędy TS** (TS2554, TS2353) |

## WERDYKTY

| # | Pozycja | Werdykt | Dowód z własnego przebiegu |
|---|---|---|---|
| **R2-F1** | Wpięcie `unitIsCivilian` niepilnowane asercją (jedyny `NAPRAW` poprzedniego Final Control) | **ODDAL — DOMKNIĘTE** | Powtórzyłem M3 sam (FC1): bramka **87/88, exit 1, 1 fail `A5g`**. `A5e-A5h` wycinają wyrażenie z `main.ts` i URUCHAMIAJĄ je na cywilu i jednostce bojowej — FC1 (`false`), FC9 (brak pola, 3 faile A5e/A5g/A5h) czerwienią. Zabezpieczone są OBA końce: FC8 pokazuje, że sam napis w `main.ts` bez użycia w egzekutorze też czerwieni (5 faili) |
| **R2-F2** | `ai-city-capture-executor.ts` — ratyfikacja właściciela: plik wchodzi do allowlisty, „ani jednej zmiany ponad to, co wymusza `tsc`" | **ODDAL** | Diff = `8 insertions(+), 0 deletions(-)`, z tego 6 linii komentarza, 1 pole interfejsu, 1 argument. Wymuszenie dowiedzione FC14: cofnięcie pliku daje `TS2554 Expected 7 arguments, but got 6` i `TS2353 'unitIsCivilian' does not exist`. `AiCityMoveUnit` nie niesie `typeId`/`category`, więc egzekutor NIE MOŻE policzyć tego sam — pole jest jedyną drogą. Zero logiki własnej |
| K2/R2 | Liczba asercji ≥ 84 | **ODDAL** | **88/88**. Diff rundy 2 = `+28/−0` — zero skasowanych linii, więc osłabienie asercji jest wykluczone maszynowo, nie deklaracją |
| K4/R2 | Asercja negatywna „miasto BRONIONE" zielona i nietautologiczna | **ODDAL** | Zielona (`K4-BRONIONEa-d`); FC12 (moje powtórzenie M9) → **3 faile, exit 1**. Dodatkowo FC5/FC6 czerwienią granicę fortyfikacji po 4 faile |
| K5/R2 | `tsc --noEmit` + pięć bramek referencyjnych | **ODDAL** | `tsc` **exit 0, 0 linii**. logic **213/213** · tech-tree **19/19** · research **33/33** · unit-replace **13/13** · combat **6/6**, wszystkie exit 0 — uruchomione przeze mnie |
| K6/R2 | Bramki gracza i barbarzyńców zielone | **ODDAL** | Uruchomione przeze mnie, exit 0: city-hex-movement **13/13** · first-player-city **16/16** · capital-capture **86/86** · map-attack-city **13/13** · post-capture-law **25/25** · city-limit-conquered **15/15** · ai-city-capture-integration **14/14** · ai-fog **8/8** · barbarians **213/213** · barb-city-behavior **178/178** · barb-city-owner-contract **3/3** |
| ZAKRES | Runda 2 nie ruszyła kodu gry | **ODDAL** | `git diff --name-status acd672fb..HEAD -- gra/` = jeden wpis `M gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs`. `barbarians.ts` nietknięty (§2b). Cały diff od bazy = 8 plików, wszystkie w allowliście po ratyfikacji R2-F2 |
| **FC-N1** | *(własne)* `K4-DYSTANS` jest TAUTOLOGICZNA — przechodzi dzięki atrapie `computePath` bramki, nie dzięki produkcyjnej bramce adiacencji | **ODDAL + nota** | FC4: zdjęcie `hexDistance !== 1` zostawia bramkę tematu **88/88 ZIELONĄ**. Sprawdziłem jednak siatkę: ta sama mutacja czerwieni **city-hex-movement-test 12/13 (exit 1)** i **ai-city-capture-integration-test 10/14 (exit 1)** — obie w rodzinie wymaganej kryterium 9, więc regres BYŁBY złapany. Dodatkowo planista trzyma niezależną bramkę (`isWithinCityAttackRange` = `hexDistance === 1`, `ai.ts:800`), a egzekutor nie ma innej ścieżki na odległy heks. Nie jest to luka produkcyjna ani luka rundy 2 (kod adiacencji jest sprzed tematu) — jest to nota o jakości JEDNEJ asercji, do rejestru |
| **FC-N2** | *(własne)* wpięcie `targetVisible` w `main.ts` nie jest pilnowane NIGDZIE | **ODDAL + obowiązek rejestracji (§3b)** | FC11: `targetVisible: true` zostawia bramkę tematu 88/88 i całą rodzinę zieloną — AI mogłoby przejmować miasta spoza widoczności, a `ai-fog-test` testuje moduł, nie wpięcie. Linia jest SPRZED tego tematu (diff `main.ts` od bazy to 4 linie: komentarz + `unitIsCivilian`), więc nie jest defektem tej rundy — osobny temat, klasa dokładnie ta sama co F1 |
| **FC-N3** | *(własne)* raport Operatora 542 słowa vs „maksymalnie ok. 400" | **ODDAL + nota** | Bez wymuszonego kryterium 3 bloku `diff` — **483 słowa**. Ratyfikacja sama nakazała wpisać pełny diff, listę faili i komplet rodziny; przekroczenie jest skutkiem wymagań, nie rozwlekłości |
| **FC-N4** | *(własne)* `A5f-A5h` przepuszczają behawioralnie równoważną KOPIĘ formuły zamiast `isCivilianUnit` | **ODDAL + nota** | FC13 → 88/88. Ratyfikacja żądała asercji pilnującej WPIĘCIA i dowodu przez M3 — oba są. Sonda bada zachowanie na cywilu i jednostce bojowej, więc kopia jest wyłapywalna dopiero przy przyszłym rozejściu się definicji cywila. Nota do rejestru, nie defekt rundy |
| **FC-N5** | *(własne)* runda 2 przeszła **Operator → Final Control**, bez raportu Evaluatora; `10-operator-runda2.md` nie niesie noty proceduralnej o faktycznym autorstwie (raport spisany przez orkiestratora po limicie sesji) | **ODDAL + obowiązek integracji** | §OBIEG dispatchu i §3c normy przewidują Evaluatora w rundzie. Funkcja adwersaryjna została jednak faktycznie wykonana: 14 własnych mutacji, w tym powtórzenia M3/M8/M9 i pełny revert; runda 2 nie zmieniła ANI JEDNEJ linii kodu gry, a kod produkcyjny jest bajt w bajt tym, co Final Control rundy 1 przebadał 9 mutacjami. Ryzyko rezydualne zerowe. Do domknięcia w integracji: dopisać do run-folderu notę o pominiętym Evaluatorze rundy 2 i o autorstwie raportu 10 |
| F3 (r1) | Wyzwalacz dispatchu i wiersz rejestru nieaktualne | **ODDAL, obowiązek integracji podtrzymany** | Potwierdzone niezależnie: FC9 (pełny revert do `022b82aa`) zostawia `K1` i `K2` ZIELONE — na bazie AI **już** przejmowało miasto, delta tego tematu to zawężenie cywilne. `REJESTR-PROSB-I-ZADAN.md:5722` („cywilizacje major zero") pozostaje fałszywy i wymaga korekty przy integracji. ECHO właściciela spełnione |
| F4 (r1) | Bramka crashuje zamiast czystego FAIL przy zniknięciu kotwicy mutanta | **ODDAL, kosmetyczne** | Zaobserwowane pod FC5, FC7, FC9, FC12: stack trace po wypisaniu faili, ale exit ≠ 0 zawsze — **fałszywa zieleń niemożliwa**. Osobny temat |

**AGREGAT (§3c pkt 3, §16b pkt 8): zero `NAPRAW`, zero `DO DECYZJI` → `PASS`.**
Jedyny `NAPRAW` poprzedniego Final Control (R2-F1) domknięty i sprawdzony powtórzeniem tej
samej mutacji. Temat gotowy do integracji orkiestratora.

## OBOWIĄZKI INTEGRACJI (nie defekty rundy, nie blokady techniczne)

1. Wpis nowej bramki `gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs` do tabeli §6 `R-PROC-AUTOBOT.md`.
2. Korekta `REJESTR-PROSB-I-ZADAN.md:5722` (F3) — twierdzenie „cywilizacje major zero" jest fałszywe od `744c4374`.
3. Rejestracja osobnych tematów: FC-N2 (`targetVisible` bez asercji — priorytet wyższy, ta sama klasa co F1), FC-N1, FC-N4, F4.
4. Nota proceduralna w run-folderze: pominięty Evaluator rundy 2 + faktyczne autorstwo `10-operator-runda2.md` (FC-N5).
5. Allowlista tematu jest po ratyfikacji R2-F2 zgodna z drzewem końcowym — sprawdzone na HEAD, nie na commicie pośrednim.

RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (allowlist-only, per plik i per hunk), potem `READY_FOR_DEPLOY`
DEPLOY/PUSH: NIE WYKONANO
