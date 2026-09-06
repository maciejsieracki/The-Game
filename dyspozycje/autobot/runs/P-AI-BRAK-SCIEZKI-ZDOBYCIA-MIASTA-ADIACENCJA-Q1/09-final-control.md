# P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1 — Final Control, runda 1/5

MODEL+EFFORT: **Opus 5, effort high** · DATA: 2026-09-06 · worktree `/home/user/wt-ai-adiacencja`,
gałąź `autobot/P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1`, HEAD `170ed320`.
Guard §2b: `git merge-base --is-ancestor 022b82aa HEAD` = OK (baza jest przodkiem, nie równa —
HEAD dalej o commity rund, to poprawne drzewo). `git status --short` pusty przed i po każdej mutacji.
Mutacje robione przez KOPIĘ pliku (`cp`), nigdy `git checkout`; po każdej `git diff --quiet` zielone.
Klon bazowy do pomiarów porównawczych: `…/scratchpad/base-clone` (poza worktree), checkout `022b82aa`.
**Nota:** dispatch `00-dispatch.md` nie zawiera żadnej sekcji ratyfikacji na końcu pliku — allowlistą
wiążącą jest wyłącznie sekcja `## ALLOWLISTA`.

STATUS: FAIL
DOMAIN: GAME
TEMAT: P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1
GOAL: rozkaz `move` AI major na sąsiedni, niebroniony obcy heks miasta skutkuje przejęciem;
jednostka nie traci tury bez efektu.

## PYTANIA SPECYFICZNE — odpowiedzi z własnego pomiaru

**1. DODAJE ścieżkę czy ROZLUŹNIA `canUnitOccupyCityHex` dla wszystkich?** DODAJE — a ta runda
dodatkowo ZWĘŻA. `canUnitOccupyCityHex` (`city-hex-movement.ts:23-32`) jest bajt w bajt taka sama
w bazie i w HEAD (`git diff 022b82aa..HEAD` nie dotyka jej ciała; jedyna zmiana w pliku to nowy
parametr `unitIsCivilian` w `canAiEnterEmptyEnemyCity` + komentarz). Wyjątek dla AI żyje w osobnej
funkcji i jest WĘŻSZY niż reguła gracza (adiacencja + brak obrońców + brak murów + niecywil).
Bramki gracza i barbarzyńców uruchomione przeze mnie na HEAD: city-hex-movement **13/13**,
first-player-city **16/16**, capital-capture **86/86**, map-attack-city **13/13**,
post-capture-law **25/25**, city-limit-conquered **15/15**, ai-city-capture-integration **14/14**,
ai-fog **8/8**, barbarians **213/213**, barb-city-behavior **178/178**, barb-city-owner-contract **3/3**.
Kontrola odwrotna (M5, moja mutacja): `canUnitOccupyCityHex` → zawsze `true` daje bramce tematu
**76/84** i city-hex-movement **11/13** — rozluźnienie dla wszystkich zostałoby złapane.

**2. Dowód PRZEJĘCIA czy tylko NIEODRZUCENIA?** Przejęcia — z zastrzeżeniem. K2 mierzy
`cities['wrog-c1'].ownerId` **2 → 1**, pozycję `5,4 → 5,5`, `ruchLeft 0`; MUT-2 („ruch przechodzi,
callback wycięty") daje 2 czerwone, więc asercja nie jest o nieodrzuceniu. Zastrzeżenie: samego
zapisu `ownerId` dokonuje `onCapture` harnessu, nie produkcyjne `tryAutoCaptureEmptyCityAt`
(domknięcie `main()`, nieimportowalne) — produkcja jest kryta asercjami na źródle A5c/A6a-A6g,
które **biją** (moja M4: usunięcie kotwicy niecywilnej → A6g czerwone; M7: `canOccupyCityHex: true`
→ A5b czerwone).

**3. Asercja negatywna na miasto BRONIONE?** Istnieje i jest nietautologiczna. `K4-BRONIONE`
(bramka:365) sprawdza cztery rzeczy: `captured===false`, `ownerId===2`, `moved===false`,
niezmieniona pozycja. Moja M9 (usunięcie `if (hasDefenders) return false;` z `city-hex-movement.ts`)
czerwieni K4-BRONIONEc/d + K8c, exit ≠ 0. Ta sama mutacja u Evaluatora (E1) zostawiała poprzednią
wersję bramki **53/53 zieloną** — dziura realnie zamknięta.

**4. Czy zakres wyciekł poza jedno zdanie GOAL?** Nie w kodzie gry. Zero `gra/src/battle/**`,
zero `gra/data/**`, zero `barbarians.ts` (§2b), zero ataku dystansowego, zero zmian w priorytetach
celów AI (`citiesForMarch`/scoring nietknięte). Obie zmiany w `ai.ts` to ten sam defekt cywila
w dwóch miejscach emisji (gałąź 4b `:2795` i marsz `:2905`), obie zawężające. Wyciek jest gdzie
indziej — patrz F2 (plik `ai-city-capture-executor.ts` spoza allowlisty).

## PYTANIA WSPÓLNE

**A. Czy jakakolwiek istniejąca asercja została osłabiona/usunięta/przepisana?** NIE.
`git diff 022b82aa..HEAD --name-status -- gra/tools/` = dokładnie jeden wpis, `A` (nowy plik).
Policzone maszynowo dla KAŻDEGO `gra/tools/*-test.cjs` po obu stronach diffu — jedyna różnica
liczby asercji to nowa bramka (baza 0 → HEAD 52 wywołań `eq`/`assert`, 84 asercje w przebiegu).
Wewnątrz rundy (`1e5a850d..HEAD`) usunięte linie K4a-K4j zastąpiono helperem `assertNoEntry`
(4 asercje na przypadek zamiast 2) — netto wzmocnienie, nie osłabienie.

**B. Czy zakres nie wyciekł poza allowlistę?** `git diff 022b82aa..HEAD --stat` = 8 plików.
Zgodne z allowlistą: `ai.ts`, `city-hex-movement.ts`, `main.ts` (jeden hunk, dokładnie w ścieżce
egzekucji rozkazu `move` — 4 linie w opcjach `executeAiCityMove`), nowa bramka, 3 raporty runu.
**Niezgodny: `gra/src/game/ai-city-capture-executor.ts`** — patrz F2.

**C. `tsc --noEmit` i pięć bramek referencyjnych.** Uruchomione przeze mnie:
`node ./node_modules/typescript/bin/tsc --noEmit` → **exit 0, 0 linii wyjścia**.
logic **213/213** · tech-tree **19/19** · research **33/33** · unit-replace **13/13** · combat **6/6**
— wszystkie exit 0. Bramka tematu **84/84**, exit 0.

**D. Czerwona bramka rodziny bez usprawiedliwienia pomiarem na czystej bazie?** NIE. Siedem
czerwonych rodziny zmierzyłem NA KLONIE BAZY i porównałem **treść linii FAIL**, nie same liczby:
ai-test 287/8, ai-slider 33/5, ai-balans-step3, ai-praca-split-parity,
city-state-offensive-normal-easy, barb-camp-destruction 82/2, barb-city-capture-cluster 92/1,
miasta-panstwa-wylaczone — **zestawy czerwonych asercji IDENTYCZNE baza vs HEAD** (`diff` pusty
dla każdej). Żadna nie urosła po zmianie `ai.ts`/`main.ts`.

## MOJE MUTACJE (9, każda cofnięta `cp`, po każdej `git diff --quiet` zielone)

| # | Mutacja | Wynik bramki tematu |
|---|---|---|
| M1 | `ai.ts` — zdjęty strażnik cywila w gałęzi 4b | **82/84** (2 faile: K7a Robotnik/Osadnik) |
| M2 | `ai.ts:2905` — zdjęty strażnik `stepIsTargetCityHex` w marszu | **82/84** (2 faile) |
| **M3** | `main.ts` — `unitIsCivilian: isCivilianUnit(u)` → `false` | **84/84 ZIELONE — DZIURA** |
| M4 | `main.ts` — kotwica `!isCivilianUnit` w `tryAutoCaptureEmptyCityAt` → `arrivingUnits[0]` | 83/84 (A6g) |
| M5 | `city-hex-movement.ts` — `canUnitOccupyCityHex` zawsze `true` | 76/84 (8 faili) + city-hex-movement 11/13 |
| M6 | `city-hex-movement.ts` — zdjęte `if (city.ownerId === unitOwnerId)` | 83/84 (K3f) |
| M7 | `main.ts` — `canOccupyCityHex: true` zamiast realnego wywołania | 83/84 (A5b) |
| M8 | egzekutor — `opts.unitIsCivilian` → `false` (reprodukcja mutacji Obrony) | **79/84, 5 faili** — liczba potwierdzona |
| M9 | `city-hex-movement.ts` — zdjęte `if (hasDefenders) return false;` | 3 faile (K4-BRONIONEc/d, K8c), exit ≠ 0 |

**Kontrola tautologii — bramka puszczona na KODZIE BAZY** (kopia bramki do klonu `022b82aa`):
K1 i K2 **w całości zielone**, w tym `K2d: ownerId 2 → 1`. Czerwone wyłącznie K3g, K7a/c/d
(Robotnik + Osadnik), K8a. To niezależnie potwierdza dwie rzeczy naraz: (a) wyzwalacz dispatchu
(„zero wywołań od AI") był **nieaktualny** już na bazie; (b) defekt parytetu cywilnego z zarzutu 1
był **realny** i został tą rundą faktycznie naprawiony, a nie opisany.

## WERDYKTY

| # | Zarzut | Werdykt | Uzasadnienie z wytworu |
|---|---|---|---|
| 1 | Cywile AI wchodzą na obcy heks miasta (parytet szerszy dla AI) | **ODDAL** | Przyjęty i faktycznie naprawiony. Na bazie K7/K3g/K8a czerwone, na HEAD 84/84; M1, M2, M8 czerwienią bramkę. Naprawa jest zawężeniem w trzech warstwach (planista, `canAiEnterEmptyEnemyCity`, wpięcie) |
| 2 | Asercje negatywne pilnowały skutku, nie granicy | **ODDAL** | `assertNoEntry` dodaje `moved===false` + pozycję do każdego przypadku K4/K7; moja M9 czerwieni K4-BRONIONE, gdy poprzednia wersja bramki zostawała 53/53 zielona |
| 3 | K2 dowodzi atrapy, nie produkcyjnego `tryAutoCaptureEmptyCityAt`; żądanie E2E w Chromium | **ODDAL** | Istota przyjęta i naprawiona: `onCapture` wykonuje trzy warunki produkcyjne z realnych modułów, A6g pilnuje kotwicy. Żądanie E2E obalone normą: §9 poz. 6a wiąże dowód w przeglądarce z tematami **wizualnymi/UX**, a kryteria 5-9 dispatchu go nie żądają. Nietautologiczność asercji na źródle dowiedziona moimi M4 i M7 |
| 4 | Raport Operatora bez pól kontraktu | **ODDAL** | `01-operator-runda1.md` ma komplet: `STATUS`/`DOMAIN`/`TEMAT`/`GOAL` (l. 10-13), `ZMIANY/COMMIT` z SHA `1e5a850d`, `RUNDY`, `DEPLOY/PUSH` |
| 5 | Przekroczenie objętości raportu (695 słów) | **ODDAL** | Zmierzone `wc -w`: **388 słów** |
| **F1** | *(własne)* Wpięcie `unitIsCivilian` w `main.ts` nie jest pilnowane żadną asercją | **NAPRAW** | M3: `unitIsCivilian: isCivilianUnit(u)` → `false` zostawia bramkę **84/84 ZIELONĄ**, cicho wyłączając silnikową barierę, którą wprowadziła naprawa zarzutu 1. Blok A5 pilnuje `canOccupyCityHex` (A5b), `onCapture` (A5c) i `hasCityDefenders` (A5d) — pomija dokładnie ten parametr, który ta runda dodała. Sam nagłówek bramki deklaruje, że „zamyka oba końce łańcucha: ai.ts → main.ts → egzekutor" |
| **F2** | *(własne)* `gra/src/game/ai-city-capture-executor.ts` zmieniony, a nie ma go w allowliście | **DO DECYZJI CZŁOWIEKA** | Plik nie jest na liście `## ALLOWLISTA` ani na liście „zakazane bezwzględnie". Zmiana jest minimalna i wymuszona przez `tsc` (przekazanie nowego, wymaganego pola). Dispatch przewidział tylko przypadek „inne miejsce w `main.ts` → `DECISION_REQUIRED`", nie przypadek pliku nienazwanego. §14 zakazuje poszerzania allowlisty w biegu — wytwór sam nie rozstrzyga intencji właściciela, więc domyślnie ten werdykt (§3c pkt 3). **Osobno: żaden etap nie sprawdził zakresu na drzewie KOŃCOWYM** — Evaluator mierzył „diff = dokładnie 2 pliki" na `1e5a850d`, przed commitem kodu Obrony `f86559fd` |
| F3 | *(własne)* Wyzwalacz dispatchu i wiersz rejestru są nieaktualne | **ODDAL** | Operator rozpoznał to i udowodnił `git merge-base --is-ancestor 744c4374` (C-056); potwierdziłem niezależnie puszczeniem bramki na kodzie bazy (K2 zielone). Nie jest to `DECISION_REQUIRED` — ECHO właściciela („AI ma zdobywać miasta jak gracz") pozostaje spełnione, a parytet był realnie złamany, tyle że dla cywili. **Obowiązek integracji**, nie defekt rundy: poprawić wiersz `P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA` w `REJESTR-PROSB-I-ZADAN.md:5722` (twierdzenie „cywilizacje major **zero**" jest fałszywe od `744c4374`) |
| F4 | *(własne)* Bramka crashuje zamiast czystego FAIL, gdy kotwica mutacji zniknie | **ODDAL** | Zaobserwowane pod M9 i na kodzie bazy — ale exit code jest wtedy ≠ 0 i faile są wypisane, więc **nie ma ryzyka fałszywej zieleni**. Uwaga kosmetyczna → do rejestru jako osobny temat (§3b), nie do tej rundy |

**AGREGAT (§3c pkt 3, §16b pkt 8): jeden `NAPRAW` (F1) → `FAIL`.** Temat wraca do Operatora,
runda 2/5, na tym samym ID i tej samej gałęzi.

## CO DOKŁADNIE POPRAWIĆ (jedna poprawka, F1)

`gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs`, blok A5 (ok. l. 435-442), zaraz po A5b —
dopisać asercję na oknie źródła `main.ts` (sprawdzone: szukany ciąg mieści się w oknie 1400 znaków):

```js
assert(window.includes('unitIsCivilian: isCivilianUnit(u),'),
  'A5e: egzekutor dostaje REALNY isCivilianUnit(u) — bez tego silnikowa bramka cywila jest martwa');
```

Dowód domknięcia w rundzie 2: powtórzyć M3 (`main.ts`: `unitIsCivilian: isCivilianUnit(u)` →
`false`, przez KOPIĘ pliku) i pokazać, że bramka czerwienieje; przywrócić i pokazać `git diff --quiet`.

## §16b — pozostałe punkty checklisty

1. `00-dispatch.md` istnieje; `GOAL` identyczny we wszystkich trzech raportach i w moim. ✔
2. ID identyczne w każdym raporcie i w nazwie gałęzi. ✔
3. Każdy z 5 zarzutów ma odpowiedź Obrony i werdykt wyżej. ✔
4. `PASS-WITH-NOTES` Obrony nie ukrywał uwagi o GOAL/zakresie — ale ukrywał lukę dowodową F1,
   stąd `FAIL`. Uwagi kosmetyczne (F4) i obowiązki integracji (F3, wpis bramki do tabeli §6)
   wypisane jawnie. ✔
5. Licznik rund: 1/5, nie zresetowany; Obrona nie jest osobną rundą. ✔
6. `REJESTR-PROSB-I-ZADAN.md:5722` NIE odzwierciedla stanu faktycznego — patrz F3. ✘ (do integracji)
7. Temat niedzielony na węzły — nie dotyczy.

## BLOKADY

Brak technicznych. Obowiązki integracji (poza allowlistą Operatora, nie defekty rundy):
(a) wpis nowej bramki do tabeli §6 `R-PROC-AUTOBOT.md` — §6 mówi wprost, że to część integracji
tematu, który bramkę stworzył; (b) korekta wiersza rejestru z F3; (c) rozstrzygnięcie F2
przez właściciela; (d) rejestracja F4 jako osobnego, kosmetycznego tematu.

RUNDY: 1/5
NASTĘPNY KROK: Operator, runda 2/5 — jedna poprawka F1 w `gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs`
DEPLOY/PUSH: NIE WYKONANO
