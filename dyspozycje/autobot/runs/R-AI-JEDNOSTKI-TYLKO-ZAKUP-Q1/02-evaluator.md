# 02 — EVALUATOR (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`
GOAL: AI nie buduje jednostek w kolejce produkcji miasta za Pracę — jednostki AI powstają
wyłącznie przez zakup za Skarbiec (pieniądze z podatków), wspólną ścieżką z graczem. Ustalić,
czy dzisiejszy stan jest regresem wobec decyzji FALI 299, i przywrócić kontrakt.
(zgodny co do słowa z `00-dispatch.md` — §16a pkt 9 sprawdzony, brak dryfu)

**`PASS-WITH-NOTES` NIE KOŃCZY PROCESU (§3b).** Uwagi N1 i N2 dotyczą **dowodu wykonania**
i **zakresu** — dwie z kategorii wymienionych w §3b. Temat wraca do Operatora dokładnie jak
przy `FAIL` i zużywa rundę. Kod nie jest zły i nic nie jest zepsute; brakuje dowodu na
zmienioną linię i jednego rozstrzygnięcia zakresu.

Worktree Evaluatora: `/home/user/wt-EVAL-R-AI-JEDN` (detached `a7bde661`, własny checkout,
`gra/node_modules` podlinkowane — C-029). Baseline do porównań: `/home/user/wt-EVAL-BASE`
(czysty `origin/main` `416733e1`).

---

## 1. Kontrakt FALI 299 — sprawdzony u źródła, niezależnie od Operatora

Przeczytałem trzy źródła sam, nie z raportu. **Są zgodne, nie ma sprzeczności, więc
`DECISION_REQUIRED` na tym punkcie faktycznie nie było potrzebne.**

`docs/decyzje/P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1.md` — ECHO właściciela 2026-08-17:

> **B** — jednostka jest pozyskiwana wyłącznie przez zakup za Skarbiec/Pieniądze;
> nie może być frontem ani wpisem w kolejce budynków finansowanej Pracą. Zasada obowiązuje
> gracza, AI i miasta-państwa.

Doprecyzowanie 2026-08-19 (ten sam plik): AI ma **zawsze** zachowywać się tak jak gracz,
„nie dostawać osobnej furtki »tylko w czasie wojny«".

`dyspozycje/REJESTR-PROSB-I-ZADAN.md:2596-2606` mówi to samo („jednostki nie trafiają do tej
samej kolejki Pracy co budynki"). `dyspozycje/WERSJE.md:4073-4075` (FALA 299) — to samo zdanie
z dispatchu.

**Rozstrzygnięcie potwierdzam: „kupuje ZAMIAST budować" — zakaz kolejkowania, obejmujący
gracza, AI i miasta-państwa.** Odczyt Operatora jest uczciwy; słowo „wyłącznie" i „nie może
być frontem ani wpisem" nie zostawiają drugiego czytania.

---

## 2. Pomiar stanu zastanego — odtworzony, zgadza się co do liczby

`node tools/ai-jednostki-tylko-zakup-test.cjs` w moim worktree, wynik surowy:

```
--- B. major AI (3 miasta, 40 tur, skarbiec zasilany) ---
    {"proposedUnit":24,"proposedBuilding":21,"unitsIntoPracaQueue":0,"purchasedForTreasury":24,
     "purchaseRefused":0,"goldSpent":480,"buildingsCompleted":21,"army":24,"unitsLeftInPracaQueue":0}
--- B'. miasto-panstwo (defensiveCopy, 40 tur) — ten sam zakaz ---
    {"proposedUnit":1,"proposedBuilding":9,"unitsIntoPracaQueue":0,"purchasedForTreasury":1,
     "purchaseRefused":0,"goldSpent":20,"buildingsCompleted":8,"army":1,"unitsLeftInPracaQueue":0}
ai-jednostki-tylko-zakup-test: 23 passed, 0 failed
```

Liczby identyczne z raportem Operatora (24/0/24 i 1/0/1). Odtwarzalne.

### Audyt źródłowy — potwierdzam wnioski Operatora, przeszedłem ścieżki sam

- `chooseCityProduction` (`ai.ts:1216`) **faktycznie zwraca jednostki** — recon dispatchu
  w tej połowie trafiony.
- Egzekutor `cmd.type === 'build'` (`main.ts:28783-28800`) rozdziela jawnie:
  `item.kind === 'budynek'` → `enqueue`, `item.kind === 'jednostka'` →
  `shouldAIPurchaseUnit` + `purchaseRecruitmentUnit`. **Jednostka nie ma tam gałęzi do
  kolejki Pracy.** Recon dispatchu w drugiej połowie obalony — zgodnie z raportem.
- `enqueue` (`production.ts:1122`) i `insertAtFront` (`production.ts:1525`) twardo odrzucają
  `kind !== 'budynek'`.
- Auto-zarządca (`main.ts:26764`) i auto-budowa (`tryAutoEnqueueBuild`, `main.ts:7271`) też
  idą przez `enqueue`.
- Ścieżka GRACZA: `cityPanel.ts addItem` (`5956-5959`) ma `item.kind === 'jednostka' → return`.
- Przejrzałem **wszystkie 28 wywołań `cityProd.set`** w `main.ts` — żadne nie wkłada jednostki
  do `kolejka`. Jedyne konstrukcje `kolejka:` poza `production.ts` to `{ kolejka: [] }`,
  kopie `[...]` i przestawianie kolejności w `cityPanel.ts`. Preset playtestu
  (`playtestMiastoEkonomia.ts:168`) to budynek.

Wniosek Operatora („w bieżącym źródle żadna jednostka nie wchodzi do kolejki Pracy — ani AI,
ani gracza, ani MP") **potwierdzam własnym audytem.**

---

## 3. Zmiana: mierzy się, ale w jednym stanie — i tego stanu nikt nie testuje

Hunk: `main.ts:26677-26698`, przed tickiem Pracy, owner-agnostyczny, `sanitizeBuildQueue` +
zwrot Pracy do puli właściciela.

### 3a. Zmierzyłem, kiedy hunk realnie coś robi — własna sonda, nie test Operatora

Napisałem własną sondę (10 scenariuszy, `PRZED` = bez guardu, `PO` = z guardem, ten sam
`decideAITurn`, ta sama egzekucja). Wynik surowy:

```
major, skarbiec 300/+30, PO (guard)      {"proposedUnit":24,"unitsIntoPracaQueue":0,"purchased":24,"refused":0,"goldSpent":480,"buildingsDone":21,"unitsFromPracaQueue":0,"refundedPraca":0,"army":24,"treasuryLeft":1020}
major, skarbiec 300/+30, PRZED           {"proposedUnit":24,"unitsIntoPracaQueue":0,"purchased":24,"refused":0,"goldSpent":480,"buildingsDone":21,"unitsFromPracaQueue":0,"refundedPraca":0,"army":24,"treasuryLeft":1020}
major UBOGI, skarbiec 0/+2, PO           {"proposedUnit":24,"unitsIntoPracaQueue":0,"purchased":3,"refused":21,"goldSpent":60,"buildingsDone":21,"unitsFromPracaQueue":0,"refundedPraca":0,"army":3,"treasuryLeft":20}
major UBOGI, skarbiec 0/+2, PRZED        {"proposedUnit":24,"unitsIntoPracaQueue":0,"purchased":3,"refused":21,"goldSpent":60,"buildingsDone":21,"unitsFromPracaQueue":0,"refundedPraca":0,"army":3,"treasuryLeft":20}
major SUCHY, skarbiec 0/+0, PO           {"proposedUnit":24,"unitsIntoPracaQueue":0,"purchased":0,"refused":24,"goldSpent":0,"buildingsDone":21,"unitsFromPracaQueue":0,"refundedPraca":0,"army":0,"treasuryLeft":0}
major SUCHY, skarbiec 0/+0, PRZED        {"proposedUnit":24,"unitsIntoPracaQueue":0,"purchased":0,"refused":24,"goldSpent":0,"buildingsDone":21,"unitsFromPracaQueue":0,"refundedPraca":0,"army":0,"treasuryLeft":0}
MP defensiveCopy 300/+30, PO             {"proposedUnit":1,"unitsIntoPracaQueue":0,"purchased":1,"refused":0,"goldSpent":20,"buildingsDone":8,"unitsFromPracaQueue":0,"refundedPraca":0,"army":1}
MP defensiveCopy 300/+30, PRZED          {"proposedUnit":1,"unitsIntoPracaQueue":0,"purchased":1,"refused":0,"goldSpent":20,"buildingsDone":8,"unitsFromPracaQueue":0,"refundedPraca":0,"army":1}
LEGACY seed (jedn. w kolejce) PRZED      {"proposedUnit":21,"unitsIntoPracaQueue":0,"purchased":21,"goldSpent":420,"buildingsDone":21,"unitsFromPracaQueue":3,"refundedPraca":0,"army":24,"treasuryLeft":1080}
LEGACY seed (jedn. w kolejce) PO         {"proposedUnit":24,"unitsIntoPracaQueue":0,"purchased":24,"goldSpent":480,"buildingsDone":21,"unitsFromPracaQueue":0,"refundedPraca":6,"army":24,"treasuryLeft":1020}
```

Co z tego wynika — i to są liczby, których w raporcie Operatora nie było:

1. **W każdym stanie osiągalnym z dzisiejszego kodu `PRZED` i `PO` są identyczne co do
   każdej metryki.** Guard jest ścisłym no-opem dla świeżej gry. Zero ryzyka regresji.
2. **Guard zamyka realny wyciek — ale tylko ze stanu legacy.** Z jednostką zaszczepioną
   w kolejce: `PRZED` → `unitsFromPracaQueue: 3` (trzej Wojownicy ukończeni **za Pracę** —
   dokładnie objaw ze zrzutu właściciela); `PO` → `0`, `refundedPraca: 6`. Wyciek jest
   prawdziwy, hunk go zamyka.
3. **Kryterium 4 (zagłodzenie AI) — spełnione z liczbami, nie deklaracją.** W scenariuszu
   legacy armia `24` przed i `24` po: trzy jednostki „za Pracę" zastępują trzy dodatkowe
   zakupy, nie znikają. W scenariuszach świeżych armia bez zmiany. **Brak `BLOCK`.**
4. **Ryzyko pre-istniejące, nie z tej zmiany, ale do świadomości właściciela:** AI z zerowym
   skarbcem i zerowym dochodem kończy 40 tur z **armią 0**, kończąc równocześnie 21 budynków
   (`major SUCHY`, identycznie `PRZED` i `PO`). To skutek samego kontraktu FALI 299
   (jednostka kosztuje wyłącznie złoto), nie tej paczki — ale jest to realny tryb, w którym
   AI stoi bez wojska. Zgłaszam jako obserwację, nie jako blokadę tego tematu.

### 3b. Rzecz, której Operator nie zmierzył: hunk nie ma ŻADNEGO testu behawioralnego

Zmutowałem źródło — **usunąłem cały hunk z `main.ts`** i uruchomiłem bramkę tematu:

```
--- C. bariery w kodzie (kotwice zrodlowe) ---
  FAIL: C2: tick per-miasto czysci legacy jednostke z kolejki Pracy PRZED naliczeniem Pracy
  FAIL: C3: czyszczenie idzie przez kanoniczna migracje sanitizeBuildQueue (zwrot Pracy)
ai-jednostki-tylko-zakup-test: 21 passed, 2 failed
```

**Czerwienieją wyłącznie C2 i C3 — dwa `regex`-y dopasowujące własny tekst hunku.
Wszystkie 21 asercji behawioralnych zostaje zielonych.** Raport Operatora mówi
„3 mutacje źródła (usunięcie guardu, otwarcie `enqueue`, cofnięcie bramki) czerwienią test" —
zdanie jest literalnie prawdziwe, ale materialnie zawyża wartość dowodu: mutacja **zmienionej
linii** jest wykrywana wyłącznie przez `grep` po niej samej. To jest tautologia w sensie
§16a pkt 8, nie dowód nietautologiczności.

Dla porządku sprawdziłem drugą mutację (otwarcie `enqueue` na jednostki) — ta faktycznie
czerwieni asercje behawioralne: `A1`, `B2` (`unitsIntoPracaQueue: 24`) i `B'1`
(`unitsIntoPracaQueue: 1`), `20 passed, 3 failed`. Bramka jest więc nietautologiczna wobec
`enqueue`, ale nie wobec własnej zmiany.

**Naprawa jest tania i Operator ma już wszystko, czego potrzeba:** jego własny `simulate()`
wystarczy zaszczepić jednostką w `kolejka` na starcie i porównać ścieżkę z guardem i bez.
U mnie zajęło to ~20 linii i dało wynik rozróżniający (`unitsFromPracaQueue` 3 → 0,
`refundedPraca` 0 → 6). To jest asercja, która ma stanąć w bramce zamiast C2/C3.

---

## 4. Bramki — uruchomione niezależnie, z porównaniem do czystego `origin/main`

`tsc --noEmit` (`node ./node_modules/typescript/bin/tsc --noEmit`): **0 błędów**.
`vite build` (C-001, binarka z `node_modules`, `--outDir` poza repo): **✓ built in 24.87s**,
`index.html` 37 415,73 kB.

Bramki referencyjne §6: `logic-test` **LOGIC OK (213/213)** · `tech-tree-test` **19/19** ·
`research-test` **ALL GREEN** · `unit-replace-test` **OK** · `combat-test`
**All sanity checks passed.**

Wszystkie 33 bramki `ai-*` + `rekrutacja-skarbiec-only` + `promote-to-front` +
`surrender-rekrutacja-build-gate` przepuszczone przez oba worktree. Czerwone:

| Bramka | gałąź `a7bde661` | czysty `origin/main` `416733e1` | werdykt |
|---|---|---|---|
| `ai-test.cjs` | 285 passed, 8 failed | 285 passed, 8 failed | pre-istniejące |
| `ai-recruit-upkeep-gate-test.cjs` | 18 passed, 9 failed | 18 passed, 9 failed | pre-istniejące |
| `ai-balans-step3-test.cjs` | 7 passed, 1 failed | 7 passed, 1 failed | pre-istniejące |
| `promote-to-front-test.cjs` | 121 passed, 4 failed | 121 passed, 4 failed | pre-istniejące |

**Cztery czerwienie potwierdzam jako pre-istniejące — liczby identyczne co do sztuki na
czystym `main`. Zero regresji.** Pozostałe bramki zielone po obu stronach.

**Czy któraś asercja została po cichu rozluźniona: NIE.** `git diff` od
`git merge-base origin/main <gałąź>` = `7e53fdb5` dotyka trzech plików:
`01-operator.md`, `gra/src/main.ts` (+22, jeden hunk), `gra/tools/ai-jednostki-tylko-zakup-test.cjs`
(nowy). **Żaden istniejący plik testowy nie jest w diffie.** `git diff --check` czysty.
`gra/data/**`, `dyspozycje/WERSJE.md`, `gra-robocza/` — nietknięte.

**Granice §9:** żadna nie naruszona. Build przez binarkę `vite`, `--outDir` poza repo (pkt 1);
brak `git add -A` (pkt 2); brak sekretów w diffie (pkt 3); brak zmian procesu w allowliście
produktowej (pkt 4); `WERSJE.md` nietknięte (pkt 5); `playbook.json` nietknięty (pkt 7);
brak deploy/push do `main` (pkt 8); `merge-base` ustalony jawnie, nie naiwny diff (pkt 9);
żaden worktree nie usuwany (pkt 10).

---

## 5. Parytet (rule_108) i miasta-państwa

**Ścieżka GRACZA — zachowanie nietknięte, zmierzone.** Guard jest owner-agnostyczny, więc
wykonuje się także na ticku miasta gracza, ale w każdym stanie osiągalnym z dzisiejszego
kodu jego warunek wejścia (`kolejka.some(kind === 'jednostka')`) jest fałszywy — patrz §3a,
`PRZED` = `PO` co do każdej metryki. Bramki wejścia gracza (`cityPanel.ts addItem`,
`enqueue`, `insertAtFront`) nie zostały dotknięte; `rekrutacja-skarbiec-only-test` **13/13**,
`ai-rekrutacja-parytet-test` **7/7**, `ai-praca-split-parity-test` **19/19** — zielone.

**Miasta-państwa — rozstrzygnięte jawnie i zgodnie ze źródłem.** Kanon obejmuje MP wprost
(„Zasada obowiązuje gracza, AI i miasta-państwa"). Bramka mierzy to osobno (`B'1`–`B'3`,
`defensiveCopy`), moja sonda potwierdza: `unitsIntoPracaQueue: 0`, `purchased: 1`, armia `1`.
`ai-mp-rekrutacja-build-gate-test` **21/21**, `ai-mp-military-cap-test` **18/18** zielone.

---

## 6. Uwagi — N1 i N2 zawracają rundę (§3b), N3–N7 są do zapisu

### N1 (dowód, §16a pkt 8) — zmieniona linia bez testu behawioralnego
Usunięcie hunku czerwieni wyłącznie dwa `regex`-y po jego własnym tekście (§3b wyżej).
**Do zrobienia w rundzie 2:** dołożyć do `ai-jednostki-tylko-zakup-test.cjs` scenariusz
z jednostką zaszczepioną w `kolejka` i asercję, że po przejściu przez guard
`unitsFromPracaQueue === 0` i `refundedPraca > 0`, a bez guardu `unitsFromPracaQueue > 0`.
Wtedy C2/C3 mogą zostać jako kotwice, ale przestają być jedynym dowodem.

### N2 (zakres) — hunk stoi poza wąskim opisem allowlisty, wymaga decyzji orkiestratora
Allowlista dopuszcza w `main.ts` „**WYŁĄCZNIE** miejsca wołające powyższe / ścieżkę zakupu
(`purchaseRecruitmentUnit`, `tryDeductUnitSpawnCostsEmpire`)". Hunk siedzi w **ticku
produkcji per-miasto** (`main.ts:26677`), który nie jest żadnym z tych miejsc, i jest
owner-agnostyczny, więc wykonuje się także na mieście gracza — mimo zapisu „NIE ruszać
mechanizmu produkcji jednostek GRACZA".

**Co do pliku (§16a pkt 1) diff mieści się w allowliście** — `gra/src/main.ts` jest w niej
wprost, a zachowanie gracza jest zmierzone jako niezmienione (§5). To **nie jest** naruszenie
§9. Ale zawężenie „wyłącznie te miejsca" zostało rozciągnięte i **to orkiestrator, nie
Operator i nie ja, ma to przyjąć albo odrzucić** — nie przepuszczam tego po cichu.

### N3 (jakość) — duplikat istniejącego helpera zamiast jego użycia
`main.ts:3586` ma już `sanitizeProductionQueue(ownerId, prod)`, która robi dokładnie to samo:
`sanitizeBuildQueue` + zwrot `refundedPraca` do puli właściciela (plus bramka Cudów).
Hunk przepisuje te cztery linie inline. Jednolinijkowa alternatywa:
`prod0 = sanitizeProductionQueue(city.ownerId, prod0);`.

### N4 (ścisłość raportu) — argument „nikt nie pilnuje punktu zużycia" jest za mocny
Drugi odbiorca Pracy, `allocateEmpirePracaToBuildings` (`production.ts:1940`), **już ma
bramkę na `kind`**: `if (!front || front.kind !== 'budynek' || target.prod.wstrzymana) continue;`.
Utrwalony wzorzec w punkcie zużycia to więc **POMIŃ**, nie **USUŃ**. Tick per-miasto faktycznie
tej bramki nie miał i hunk to zamyka (tick idzie pierwszy, więc drugi strumień zastaje już
czystą kolejkę) — ale raport nie wspomina tego miejsca i przez to opisuje lukę szerszą,
niż jest.

### N5 (ścisłość raportu) — historia „stary save" jest już obsłużona warstwę wyżej
Wczytanie zapisu przepuszcza **każde** miasto przez `setCityProduction` →
`sanitizeProductionQueue` (`main.ts:32072-32078`), a przejęcie i kapitulacja robią to samo
(`main.ts:24054`, `12397`). Kolejka jest więc czysta **zanim** tick w ogóle wystartuje. Hunk
jest czwartą warstwą, nie pierwszą. To nie unieważnia zmiany (obrona w głąb jest tania i
zmierzalnie działa), ale **zawęża resztę zagadki**: zrzut właściciela musiałby pochodzić
z sesji, która nie przeszła przez wczytanie — czyli z bundla sprzed bramek FALI 322 —
albo z drogi, której ani Operator, ani ja nie znaleźliśmy.

### N6 (rejestr) — jedna z uwag „poza zakresem" jest fantomem, nie wpisujcie jej
Operator zgłasza „cena jednostki dla `kosztJednostekPace='sredni'` wychodzi `NaN`".
**`'sredni'` nie jest wartością tego pola.** `KOSZT_JEDNOSTEK_PACE`
(`unit-cost-tempo.ts:19-23`) ma klucze `niski | normalny | wysoki`; `newGameFlow.ts:326`
waliduje dokładnie do tej trójki; `playerState.ts:156` domyślnie `'niski'`. Napis `'sredni'`
żyje w kodzie tylko jako **rozmiar mapy** (`types/game-state.ts:25`). Podanie nieistniejącego
klucza daje `undefined` — to zachowanie funkcji przy złym wejściu, nie defekt gry.
**Wpisanie tego do rejestru zaśmieciłoby go nie-błędem.**
Uwagi (b) — komunikat `[Rush] … jednostka w kolejce` (`main.ts:19871`, `30055`) opisujący
świat sprzed FALI 299 — oraz (c) — trzy czerwone asercje `promote-to-front` zakładające
jednostkę w kolejce Pracy — **potwierdzam jako prawdziwe** i one do rejestru należą.

### N7 (dowód, §1b) — wiersz tabeli bez odtwarzalnego artefaktu
Wiersz „major AI ubogi (skarbiec 0, +2/turę) → 3 jednostki" nie wynika z niczego, co jest
w commicie: zakomitowana bramka ma dwa scenariusze, oba `300/+30`. Odtworzyłem go własną
sondą i **liczba się zgadza** (`purchased: 3`, `army: 3`), więc treść raportu jest prawdziwa —
ale harness został wyrzucony. Raport nie jest dowodem (§1b); albo scenariusz wchodzi do
bramki, albo znika z tabeli.

---

## 7. Premisa dispatchu i pytanie ABC — ostrzę je, bo Operator pytał o złą rzecz

Potwierdzam wyliczenie kwoty „40": `Wojownik` ma w `units.json` `Pieniądz (koszt) = 10`;
`unitMoneyCost` = baza × tempo × `R_STAWKI_FALA2_MULT` (×2) × mnożnik trudności. Zmierzone:

```
owner 0 (gracz)  niski/trudny    → 40      owner 7 (AI)  normalny/dowolna → 40
owner 0 (gracz)  niski/normal    → 20      owner 7 (AI)  niski/dowolna    → 20
```

Czyli **„Koszt: 40" to cena w Pieniądzu**, wyrenderowana z ikoną Pracy przez
`cityPanel.ts:8043-8046`. Ten sam renderer wypisuje `front.kind === 'budynek' ? 'Budynek' :
'Jednostka'` — panel PRODUKCJA **nadal przewiduje jednostkę na froncie kolejki Pracy**,
pozostałość sprzed FALI 299. Wykluczyłem też pomyłkę etykiet: kolejka rekrutacji renderuje
się osobno, z ikoną skarbca i tooltipem „Opłacone ze skarbca"
(`cityPanel.ts:7838-7841`) — zrzut nie mógł z niej pochodzić.

**Ale jest rzecz ważniejsza, której raport nie zauważył.** Panel miasta otwiera się
**wyłącznie dla miast gracza**: `main.ts:21432` bramkuje `if (clickedCity.ownerId === 0)`
przed `openCityPanelForPlayer`, a komentarz `main.ts:19853` mówi to wprost („panel miasta
jest tylko dla gracza"). Zrzut PRODUKCJA z „Wojownik · Koszt: 40" **musi więc pochodzić
z miasta gracza (ownerId 0)**, mimo że właściciel opisał go słowami „w miastach AI".
Zgadza się z tym arytmetyka: `40` to cena gracza przy domyślnym tempie `niski` na poziomie
`trudny`.

To zmienia pytanie. Operator zapytał, czy partia była wczytana ze starszego pliku. Pytanie
ABC powinno brzmieć węziej i celować w rzeczywisty objaw:

> **Czy ten „Wojownik" zbierający Pracę stał w kolejce Twojego własnego miasta, czy widziałeś
> go w podglądzie miasta komputera — i czy ta partia była wtedy zaczynana od zera w najnowszej
> wersji roboczej, czy wczytana / kontynuowana z wcześniej otwartej gry?**

Od odpowiedzi zależy, czy szukamy dalej po stronie gracza (dziś nieprzeszukanej — dispatch
i cała praca Operatora są AI-only), czy zamykamy temat jako ślad starszej wersji.

---

ZMIANY/COMMIT: Evaluator nie wprowadza zmian w kodzie. Oceniany artefakt: `38afe453`
(+ `a7bde661` uzupełnienie SHA w raporcie), gałąź `autobot/R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`,
`merge-base` z `origin/main` = `7e53fdb5`. Ten raport: `02-evaluator.md`.

TESTY: `ai-jednostki-tylko-zakup-test` **23/23** (odtworzone) · `tsc --noEmit` **0 błędów** ·
`vite build` **OK (24.87s)** · bramki referencyjne §6 **213/213, 19/19, ALL GREEN, OK,
All sanity checks passed** · 33 bramki `ai-*` + 3 powiązane przepuszczone przez gałąź
**i** przez czysty `origin/main`; 4 czerwienie identyczne po obu stronach = pre-istniejące ·
2 mutacje źródła wykonane samodzielnie (usunięcie hunku → **tylko C2/C3**; otwarcie `enqueue`
→ **A1/B2/B'1**) · własna sonda 10 scenariuszy `PRZED`/`PO` z zaszczepionym stanem legacy.

BLOKADY: brak blokad technicznych. Do rozstrzygnięcia przez orkiestratora: **N2** (zakres
hunku wobec wąskiego opisu allowlisty). Do rozstrzygnięcia przez właściciela: pytanie ABC
z §7 (miasto gracza czy AI; świeża gra czy wczytana).

RYZYKO ZAGŁODZENIA AI (kryt. 4): **zmierzone, brak `BLOCK`.** Armia identyczna `PRZED`/`PO`
we wszystkich scenariuszach (24/24, 3/3, 0/0, 1/1); w scenariuszu legacy 24/24 przy
`unitsFromPracaQueue` 3 → 0. Osobno odnotowane, pre-istniejące ryzyko kontraktu FALI 299:
AI bez dochodu kończy 40 tur z armią 0 (identycznie przed i po zmianą).

TEMAT RÓWNOLEGŁY: `autobot/R-PRACA-JEDEN-PODZIAL-Q1` na dziś **nie ma żadnego commita
poza dispatchem** (`git diff` od `merge-base` pusty), więc kolizji fizycznie jeszcze nie ma.
Ma jednak `main.ts` w allowliście, a hunk tego tematu leży w ticku Pracy per-miasto
(`main.ts:26677`, tuż nad blokiem auto-zarządcy) — czyli dokładnie w rejonie podziału Pracy.
Merge pozostaje rozstrzygalny (czyste dopisanie bloku, zero zmian istniejących linii),
ale integracja ma iść `git merge --no-ff` od `merge-base`, nie naiwnym diffem (§9 pkt 9).

RUNDY: 1/5 (runda Evaluatora dla rundy 1 Operatora).
NASTĘPNY KROK: temat wraca do Operatora na rundę 2 (§3b — uwagi N1 i N2 dotyczą dowodu
i zakresu). Zakres rundy 2: (1) N1 — asercja behawioralna na zaszczepionym stanie legacy;
(2) N2 — decyzja orkiestratora o zakresie hunku, ewentualnie N3 jako jednolinijkowe
uproszczenie; (3) N6 — usunięcie fantomowej uwagi `'sredni'` przed wpisem do rejestru;
(4) N7 — scenariusz „ubogie AI" do bramki albo poza tabelę; (5) pytanie ABC z §7 do
właściciela. Po rundzie 2 — Final Control.
DEPLOY/PUSH: NIE WYKONANO. Push wyłącznie gałęzi roboczej
`autobot/R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1` z tym raportem; `main` nietknięty.
