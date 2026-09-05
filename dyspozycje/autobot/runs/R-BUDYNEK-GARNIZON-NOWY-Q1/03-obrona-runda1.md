# R-BUDYNEK-GARNIZON-NOWY-Q1 — Operator, OBRONA, runda 1/5

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-BUDYNEK-GARNIZON-NOWY-Q1
GOAL: Nowy budynek Garnizon — kompletny, na równi z każdym innym budynkiem w grze (bez wpinania do Prawa i bez obrony cywilnej).
ZMIANY/COMMIT: `1132d4cd` (obrona + 3 przegenerowane PNG + 2 hunki bramki) i `060bd2d8` (korekta własnego dowodu w zarzucie 4). Jedyna zmiana kodu w tej fazie: `gra/tools/budynek-garnizon-test.cjs` — wyłącznie rusztowanie zrzutu, **bez zmiany asercji**. `gra/data/buildings.json` **przeze mnie nietknięty**; zakres rundy 1 pozostaje `42 wstawienia, 0 usunięć`, wyłącznie rekord `garnizon`. Z pliku bramki zaindeksowałem **tylko własne dwa hunki** — równoległa sesja miała wtedy w tym samym pliku swoje niezacommitowane asercje `[R2-A]` i nie wciągnąłem ich do swojego commita (BLOKADY 1).
TESTY: `tsc --noEmit` **exit 0**. Bramka tematu **55/0**. Komplet **39** bramek rodziny budynków (kryterium końca 5) uruchomiony na `dc355979`: **29 zielonych, 9 czerwonych, 1 pominięta**. Z czerwonych — siedem pre-istniejących (liczby zgodne z Evaluatorem), jedna nie-powtarzalna (flake, solo 24/0), **jedna realna i nowa: `civpedia-budynki-historia` 136/0 → 138/3, regres rundy 2 (R2-C) na zaszytym liczniku `25`**. Szczegóły w §BRAMKI-39.
BLOKADY: patrz §BLOKADY — w tym **naruszenie izolacji worktree** (nowa, nie znana w rundzie 1).
RUNDY: 1/5 (druga faza tej samej rundy — obrona, nie nowa runda)
NASTĘPNY KROK: Final Control — werdykt per zarzut (§3c).
DEPLOY/PUSH: NIE WYKONANO

**Werdykt własny: 5 zarzutów, 5× PRZYJMUJĘ, 0× ODRZUCAM.** Wszystkie pięć są trafne.
Cztery dotyczą **raportu**, nie wytworu (dane, ikona, bramka i zachowanie gry są w nich
niekwestionowane); jeden — zarzut 5 — dotyczył pliku dowodu i **poprawiłem go u źródła**,
nie opisem. Poniżej dowód z wytworu przy każdym.

---

## OBRONA: 1 → PRZYJMUJĘ

**Zarzut:** kryterium końca 5 wykonane częściowo — grep dispatchu daje 39 bramek, Operator uruchomił 21.

**Dowód (mój własny, nie przepisany od Evaluatora).** `ls gra/tools/ | grep -Ei "budynk|building|civpedia|entity-card|kolejka|queue"` → **40 linii**, z czego `poll-integrator-queue.ps1` nie jest `.cjs` → **39 bramek `.cjs`**. Liczba Evaluatora potwierdzona co do jedności. Tabela rundy 1 („23 bramki") zawiera `administracja-stolica` i `prawo-siatka-v2`, których w tym grepie nie ma, oraz `koszty-surowcowe` i `szczescie-skala-normalizacja` — również spoza grepa. Zbiór raportu **nie jest** zbiorem zamówionym w dispatchu.

**Poprawka:** uruchomiłem komplet 39 — wyniki w §BRAMKI, wraz z jawnym oznaczeniem pozycji, których nie dało się zmierzyć w warunkach współdzielonego worktree (§BLOKADY).

---

## OBRONA: 2 → PRZYJMUJĘ

**Zarzut:** tabela G3 nie ma kolumn `baza`/`przyrost` (dispatch wymienia `przyrost` wprost), a wyjątek „Garnizon jedyny z zerami" został przemilczany.

**Dowód — pomiar uzupełniony, odczyt z `gra/data/buildings.json`:**

| budynek | ep | kB | pK | utrz | pU | maks | surowce | `baza` | `przyrost` |
|---|---|---|---|---|---|---|---|---|---|
| dom_starszyzny | 1 | 25 | 5 | 1 | 1 | 1 | drewno 30 | praca 1, pieniadz 1, kultura 2 | **zera** |
| palac | 1 | 40 | 12 | 2 | 1 | 1 | — | kultura 5, zadowolenie 2 | kultura 3, zadowolenie 1 |
| trybunal | 2 | 30 | 10 | 1 | 1 | 2 | drewno 30 + kamien 40 | pieniadz 1, zadowolenie 1 | pieniadz 1, zadowolenie 1 |
| dwor_zarzadcy | 2 | 45 | 9 | 2 | 1 | 1 | drewno 30 + kamien 30 | praca 1, pieniadz 2, kultura 3 | **zera** |
| sad | 3 | 55 | 12 | 2 | 1 | 1 | drewno 30 + cegla 50 | pieniadz 2, kultura 5, zadowolenie 2 | pieniadz 1, zadowolenie 1 |
| pretorium | 3 | 75 | 15 | 3 | 1 | 1 | drewno 40 + cegla 50 | praca 2, pieniadz 3, kultura 5 | praca 1, pieniadz 2 |
| **garnizon** | **1** | **30** | **6** | **2** | **1** | **1** | **drewno 30** | **zera** | **zera** |

**Korekta na korzyść wytworu, nie obrony:** zerowy `przyrost` **nie** jest wyjątkiem — mają go też `dom_starszyzny` i `dwor_zarzadcy`. Wyjątek jest wyłącznie na `baza`: w grupie „Prawo i administracja" (**9** rekordów, licząc łańcuch pałacowy) Garnizon jest **jedynym** z zerową `baza`. Zarzut zawężam do tego, i w tej zawężonej postaci go przyjmuję.

**Istotne dla właściciela:** ratyfikacja **R2-A** zatwierdziła `kosztBudowy / przyrostKosztu / utrzymanie / przyrostUtrzymania / koszt_surowce / maksPoziom`. **`baza` i `przyrost` nie były w tej tabeli** — decyzja o zerowych plonach do dziś nie stanęła przed właścicielem jako zmierzony wyjątek. → **kandydat DO DECYZJI CZŁOWIEKA** (§DO DECYZJI, poz. A). Rozstrzyga intencja, nie wytwór: dispatch (Tryb trzeci) oddaje balans właścicielowi.

---

## OBRONA: 3 → PRZYJMUJĘ

**Zarzut:** zerowy efekt w każdym systemie gry nie zgłoszony w polu BLOKADY.

**Dowód — sprawdziłem każdą drogę, którą budynek może dziś na cokolwiek wpłynąć:**

| droga | stan | dowód |
|---|---|---|
| plony na turę | brak | `baza` + `przyrost` = zera (tabela wyżej) |
| obrona strukturalna | brak | `gra/src/game/building-upgrades.ts:8-13` — `STRUCTURAL_DEFENSE_PARAM_KEY` ma wyłącznie `palisada`/`mury`/`fort`/`baszta` |
| Prawo | brak | `gra/data/society-params.json` blok `prawo` nie ma klucza budynkowego dla `garnizon` (są tylko jednostkowe — zarzut 4) |
| szczęście | brak | `grep -rn "dajeSzczescie" gra/src` → **0 trafień**; pole jest dziś martwe w całym repo |
| obrona cywilna | brak | `siegeDefenders.ts` słusznie nietknięty (granica dispatchu) |

Kontrola krzyżowa: jedyne inne budynki z zerowymi `baza`+`przyrost` to `palisada`, `mury`, `fort`, `baszta` — **wszystkie cztery mają wpis w `STRUCTURAL_DEFENSE_PARAM_KEY`**. Garnizon jest jedynym budynkiem w grze bez plonów i bez jakiegokolwiek zamiennika efektu.

Widać to na przegenerowanym zrzucie `dowody/garnizon-karta-encji.png`: **„Plony i efekty → Efekty —"**, przy jednoczesnym koszcie **60 pkt Pracy, 60 Drewno, 4 Pieniądza + −5 Drewno/turę**.

**Poprawka:** wpisane do §BLOKADY jako twarda **zależność kolejności deployu** — nie do prozy. Sama kolejność jest decyzją właściciela → **kandydat DO DECYZJI CZŁOWIEKA** (§DO DECYZJI, poz. B).

---

## OBRONA: 4 → PRZYJMUJĘ (i zaostrzam — zarzut był niedoszacowany)

**Zarzut:** kolizja `prawo_garnizon_per_jednostka` vs budynek `garnizon` nie zgłoszona.

**Dowód mocniejszy, niż podał zarzut.** Blok `prawo` w `gra/data/society-params.json` trzyma budynki pod konwencją **`prawo_<id_budynku>`**: `prawo_dom_starszyzny`, `prawo_dwor_zarzadcy`, `prawo_pretorium`, `prawo_trybunal`, `prawo_sad`, `prawo_palac`, `prawo_palac_ii`, `prawo_palac_iii`. Dla budynku o `id: "garnizon"` konwencja daje **`prawo_garnizon`** — a w tym samym bloku już stoją:

- `prawo_garnizon_per_jednostka` (linia **806**) i `prawo_garnizon_cap_jednostek` (**813**) — mechanika **JEDNOSTEK**, którą D1 jawnie trzyma **POZA** `prawMax`;
- `prawo_kara_brak_garnizonu` (**876**) i `prawo_kara_podboj_bez_garnizonu` (**883**) — które D5 każe **USUNĄĆ**.

Cztery klucze z prefiksem `prawo_garnizon*`/`…garnizonu` o mechanice **przeciwnej** do tej, którą temat Prawa ma dopisać.

**Gorzej — kolizja jest już w kodzie, nie tylko w nazwach.** `gra/src/game/society-breakdown.ts:638-647` wystawia linię jednostkową z **`id: 'garnizon'`** i etykietą `Garnizon (N jedn.)`. Budynkowa linia Prawa trafi do **tej samej tablicy `lines[]` z tym samym `id`**. Konsument `gra/src/ui/orderPanel.ts:129-137` renderuje po `label`, nie po `id`, i tnie liste — dla Prawa wywolanie to `linesHtml(s.prawLines, 6, pfx)` (`orderPanel.ts:167`), czyli **6 pozycji**, reszta pod „…" → gracz zobaczy **dwie pozycje „Garnizon"** w rozpisce Porządku, a przy komplecie administracji szósta realna pozycja może zostać wypchnięta poza kadr.

**Czego NIE robię:** naprawa wymaga `society-params.json` i `society-breakdown.ts` — **oba zakazane bezwzględnie** w mojej allowliście. Nie wchodzę w nie. Przekazuję jako ostrzeżenie wejściowe do `R-PRAWO-PRZEBUDOWA-SKALI-Q1` (§BLOKADY poz. 4).

---

## OBRONA: 5 → PRZYJMUJĘ — poprawione u ŹRÓDŁA, nie w opisie

**Zarzut:** `dowody/garnizon-karta-encji.png` jest ucięty z prawej; raport przypisał mu wartości, których w nim nie widać.

**Dowód, że zarzut jest trafny — i przyczyna, której zarzut nie podał.** Plik miał **482 × 834 px**. Przyczyna nie jest przycięciem viewportu, tylko **przelaniem treści poza własny kontener**: rusztowanie bramki miało `#card{width:460px}` (+ padding/border = 482 px), a kolumna wartości karty jest szersza — `page.locator('#card').screenshot()` zapisuje bounding box elementu, więc wartości wylądowały poza kadrem („60 D…").

**Poprawka w wytworze** (`gra/tools/budynek-garnizon-test.cjs`, sekcja rusztowania `[D/E-render]`):
`viewport` 1000×820 → **1240×900**, `#card` 460 px → **680 px**, plus komentarz regresyjny „nie zwężaj tej wartości" z odwołaniem do tego zarzutu.

**Wynik — obejrzałem osobiście:** `garnizon-karta-encji.png` ma teraz **702 × 834 px** i realnie zawiera komplet, który raport rundy 1 opisał: *Administracja · Kamień · Unikalny w mieście · 60 pkt Pracy · +6 pkt Pracy/poziom · 4 Pieniądza + −5 Drewno/t · +1 pkt Pieniądza/poziom · 60 Drewno — z magazynu państwa*, sekcja „Rys historyczny", medalion z własną ikoną, „Brak wymogu (startowa)". Opis rundy 1 **przestał być niezgodny** — nie dlatego, że go złagodziłem, tylko dlatego, że dowód jest teraz kompletny. Bramka po zmianie: **55 pass / 0 fail** (bez zmiany liczby asercji — zmiana dotyczy wyłącznie rusztowania zrzutu).

---

## DO DECYZJI CZŁOWIEKA — kandydaci (§3c: wytwór sam nie rozstrzyga)

**A. Zerowe plony Garnizonu (z zarzutu 2).** Czy Garnizon ma zostać jedynym budynkiem grupy „Prawo i administracja" bez `baza`? Za zerami: cała jego wartość to Prawo (25/35/47), a dopisanie kultury/pieniądza tutaj byłoby wymyślaniem balansu wbrew Trybowi trzeciemu. Przeciw: gracz płaci 60 Pracy i 4 Pieniądza/turę. **R2-A nie obejmowała `baza`/`przyrost`** — pytanie jest nadal otwarte.

**B. Kolejność deployu (z zarzutu 3).** Czy Garnizon może wejść do `main`/na ROBOCZĄ **przed** `R-PRAWO-PRZEBUDOWA-SKALI-Q1`? Wydany wcześniej jest dla gracza czystym kosztem bez jednej korzyści. Wytwór nie rozstrzyga — to decyzja o kolejności publikacji, nie o kodzie.

---

## BLOKADY

1. **NARUSZENIE IZOLACJI WORKTREE — nowa, priorytetowa.** W trakcie tej fazy w `/home/user/wt-garnizon` pracuje **równolegle druga sesja** (Operator rundy 2, realizujący R2-B/R2-D). Dowód: niezacommitowane, **nie moje** zmiany w `git status` — `gra/src/game/ai.ts` (+1 linia: `'garnizon'` do `infraOrder`) i `gra/tools/grupy-budynkow-test.cjs` (+35/−7: `TOTAL = 42`, grupy 9 i 7); oraz `ps`: trzy równoległe procesy `node tools/ai-buduje-budynki-test.cjs` (dwa cudze z 22:46, jeden mój z 22:53) i cudzy `tools/dyplo-mapa-odkrycie-live-test.cjs`. Bramki dzielą artefakty `gra/tools/.<test>-{entry.ts,bundle.cjs}`, więc **dwa równoległe uruchomienia TEGO SAMEGO testu nawzajem się psują** (Operator rundy 1 opisał dokładnie ten mechanizm; Evaluator na tym stracił `ai-buduje-budynki`). **Ubiłem własny przebieg**, żeby nie zepsuć cudzego, i wznowiłem z blokadą kolizji (nie uruchamiam bramki, którą trzyma cudzy proces). W trakcie tej fazy równoległa sesja **zacommitowała rundę 2 jako `dc355979`** — na moich dwóch commitach obrony, więc kolejność w historii jest poprawna, a drzewo wróciło do stanu czystego. Komplet 39 bramek zmierzyłem dopiero **po** tym commicie, na jednym zdefiniowanym stanie. Skutek dla odbioru: wyniki §BRAMKI-39 opisują **rundę 1 + rundę 2 razem**, nie samą rundę 1. Do rozstrzygnięcia przez orkiestratora: `R-PROC-AUTOBOT.md` §2b wymaga izolowanego worktree per temat, a tu dwie role tego samego tematu piszą do jednego drzewa równocześnie.
2. **Zerowy efekt w każdym systemie gry (zarzut 3).** Zintegrowany i wydany przed `R-PRAWO-PRZEBUDOWA-SKALI-Q1` Garnizon jest dla gracza czystym kosztem: 60 pkt Pracy + 60 Drewno jednorazowo, 4 Pieniądza + −5 Drewno na turę, „Efekty —". **Twarda zależność kolejności deployu.**
3. **Trzy pliki spoza allowlisty rundy 1** — rozstrzygnięte przez orkiestratora w R2-B/R2-C/R2-D (allowlista rozszerzona), realizuje runda 2, **nie ta faza**.
4. **Kolizja nazewnicza `garnizon` (zarzut 4)** — ostrzeżenie wejściowe dla `R-PRAWO-PRZEBUDOWA-SKALI-Q1`: klucz `prawo_garnizon` wejdzie do bloku, w którym stoją już cztery klucze `prawo_garnizon*`/`…garnizonu` o **przeciwnej** mechanice (D1 trzyma je poza `prawMax`, D5 każe dwa usunąć), a `society-breakdown.ts:645` zajmuje już `id: 'garnizon'` w tej samej tablicy `lines[]`. Naprawa poza moją allowlistą — **nie wchodziłem w te pliki**.
5. **REGRES `civpedia-budynki-historia` 136/0 → 138/3 — DECISION_REQUIRED, plik spoza allowlisty.** R2-C dołożył `docs/encyklopedia/budynki/garnizon.md` (26. plik) i wpis w `wikiBundle.json`, a `gra/tools/civpedia-budynki-historia-test.cjs` ma zaszyty licznik `25` w trzech miejscach (`:75`, `:123`, `:125-126`). **Ta sama klasa długu co R2-B**, tylko w drugim pliku, którego ratyfikacja nie objęła. Nie wchodzę w niego — poprawka to bump `25 → 26` plus komentarz o obowiązku bumpu, dokładnie jak R2-B zrobił w `grupy-budynkow-test.cjs`. Wykryte **wyłącznie dlatego, że uruchomiłem komplet 39** (zarzut 1): runda 1 mierzyła tę bramkę jeszcze przed R2-C i miała 136/0, Evaluator potwierdził zieloną — czerwień powstała dopiero w `dc355979` i do tej pory nikt jej nie zaraportował.

## BRAMKI — po poprawkach

**Uruchomione przeze mnie.** `tsc` i bramka tematu — na drzewie rundy 1 (przed commitem rundy 2). Komplet 39 — na `dc355979`, czyli **runda 1 + runda 2 razem**; tych wyników **nie wolno przypisać samej rundzie 1** (BLOKADY 1). Dotyczy to zwłaszcza `grupy-budynkow`, którą zazieleniła runda 2 (R2-B), a nie ta faza.

| bramka | wynik | uwaga |
|---|---|---|
| `tsc --noEmit` | **exit 0, 0 błędów** | jedyna dozwolona kompilacja (C-001) |
| `budynek-garnizon-test` (temat) | **55 pass / 0 fail** | po mojej zmianie rusztowania zrzutu; liczba asercji bez zmian |

## BRAMKI-39 — komplet z kryterium końca 5

**Zbiór.** `ls gra/tools/ | grep -Ei "budynk|building|civpedia|entity-card|kolejka|queue"` = 40 linii, minus `poll-integrator-queue.ps1` (nie `.cjs`) = **39 bramek**. Runda 1 uruchomiła **21**; różnicę **18** wyliczyłem `comm`-em (cały blok `civpedia-*` poza `budynki-historia`/`gra-id-mostek`, pięć `entity-card-*` i `march-attack-queue-persist`). **21 + 18 = 39** — arytmetyka zarzutu 1 potwierdzona co do jedności. Uwaga: bramka tematu `budynek-garnizon-test.cjs` do tego grepa **nie należy** („budynek" nie zawiera „budynk"), więc liczona jest osobno.

**Baza pomiaru: `dc355979`** — czyli **runda 1 + runda 2 razem**. Uruchomiłem komplet dopiero po tym, jak równoległa sesja zacommitowała rundę 2 i drzewo wróciło do stanu czystego, żeby wszystkie 39 mierzyły **jeden zdefiniowany stan**. Wyników **nie wolno przypisywać samej rundzie 1**.

| bramka | pass/fail | stan |
|---|---|---|
| `ai-buduje-budynki` | POMINIĘTA | kolizja — cudzy proces trzymał ten test |
| `building-cost-tempo` | 6/0 | zielona |
| `building-detail-card-entitycard-migration` | 51/1 | **czerwona** |
| `building-detail-card-hover-layout-real-render` | 11/0 | zielona |
| `building-gate-audit` | OK (informacyjna) | zielona |
| `building-happiness` | 8/0 | zielona |
| `building-queue-refund` | 2/3 | **czerwona** |
| `building-tech-gate` | 89/0 | zielona |
| `civpedia-budynki-historia` | 138/3 | **czerwona** |
| `civpedia-caly-wiersz-przyciskiem` | 85/0 | zielona |
| `civpedia-cross-link-style-real-render` | 20/0 | zielona |
| `civpedia-cuda-historia` | 126/0 | zielona |
| `civpedia-gra-id-mostek` | PASS | zielona |
| `civpedia-historia-infra` | 18/0 | zielona |
| `civpedia-jednostki-j1` | 161/0 | zielona |
| `civpedia-jednostki-j2` | 157/0 | zielona |
| `civpedia-karty-nazwa-przyciskiem` | 27/0 | zielona |
| `civpedia-karty-spojnosc-q1-c` | 23/1 | **czerwona** |
| `civpedia-technologie-rys-historyczny` | 324/0 | zielona |
| `civpedia-ulepszenia-historia-batch` | 116/0 | zielona |
| `civpedia-wikihubhud-rys-historyczny-duplikacja` | 7/0 | zielona |
| `deposit-building-gate` | 46/1 | **czerwona** |
| `entity-card-action-buttons-real-render` | 30/1 | **czerwona** |
| `entity-card-contract` | 75/0 | zielona |
| `entity-card-cross-links-button-style-real-render` | 34/0 | zielona |
| `entity-card-cross-links-nested-overlay` | 16/8 | **czerwona** |
| `entity-card-diorama-real-render` | 46/0 | zielona |
| `entity-card-historia-section` | 31/0 | zielona |
| `entity-card-single-dialog-real-render` | 25/0 | zielona |
| `entity-card-wonder` | 134/0 | zielona |
| `grupy-budynkow` | 84/0 | zielona |
| `march-attack-queue-persist` | 57/0 | zielona |
| `owned-building-detail-side` | 17/0 | zielona |
| `owned-building-inactive` | 4/0 | zielona |
| `panel-kolejka-pasek-postepu` | 82/0 | zielona |
| `plony-budynkow` | 68/0 | zielona |
| `prereq-budynkow` | 51/8 | **czerwona** |
| `unit-building-bonuses` | 82/0 | zielona |
| `upgrade-budynki` | 48/1 | **czerwona** |

**Bilans: 29 zielonych, 9 czerwonych, 1 pominięta.** Z dziewięciu czerwonych:

- **siedem pre-istniejących**, zgodnych co do liczby z pomiarem Evaluatora na obu stanach drzewa: `entitycard-migration` 51/1, `queue-refund` 2/3, `deposit-building-gate` 46/1, `entity-card-action-buttons` 30/1, `nested-overlay` 16/8 (dokładnie stan bazowy), `prereq-budynkow` 51/8, `upgrade-budynki` 48/1. Zero związku z Garnizonem.
- **jedna NIE-powtarzalna:** `civpedia-karty-spojnosc-q1-c` dała w sweepie 23/1, ale **przy powtórnym uruchomieniu solo: 24 PASS / 0 FAIL**. To flake z rywalizacji o przeglądarkę z równoległym sweepem drugiej sesji (BLOKADY 1), **nie regres**. Zgłaszam ją jako flake, nie jako czerwoną — bo dwukrotny pomiar tak mówi.
- **jedna REALNA, NOWA — regres rundy 2, patrz niżej.**

### REGRES WYKRYTY: `civpedia-budynki-historia` 136/0 → **138/3**

Evaluator zmierzył tę bramkę jako **zieloną 136/0**. Po commicie `dc355979` jest **138 pass / 3 fail**. Trzy faile to jedna przyczyna — **zaszyty licznik `25`**:

```text
FAIL: dokładnie 25 plików .md w docs/encyklopedia/budynki/ — 26
FAIL: realny wikiBundle.json: 25 wpisów folder=budynki — 26
FAIL: realny wikiBundle.json: WSZYSTKIE 25 wpisów budynki mają niepuste pole historia (≥100 znaków) — 26
```

Miejsce: `gra/tools/civpedia-budynki-historia-test.cjs:75` (`files.length === 25`), `:123` (`budynkiEntries.length === 25`), `:125-126` (`withHistoria.length === 25`). Przyczyna: **R2-C** dołożył `docs/encyklopedia/budynki/garnizon.md` (26. plik) i wpis w `wikiBundle.json`.

**To jest DOKŁADNIE ta sama klasa długu co R2-B** (`grupy-budynkow-test.cjs` z zaszytymi `40` i `8`), którą orkiestrator kazał naprawić „i nie zostawiać czerwonej jak była". R2-C nie przewidział, że hasło CivPedii trafia w **drugi** zaszyty licznik w innym pliku. `grupy-budynkow` po R2-B jest już zielona (**84/0**, było 79/4) — ta bramka czeka.

**Nie naprawiam.** `gra/tools/civpedia-budynki-historia-test.cjs` nie jest w allowliście rundy 1 ani w żadnym z trzech rozszerzeń (R2-B dotyczy `grupy-budynkow-test.cjs`, R2-C hasła i bundla, R2-D `ai.ts`). Zgodnie z dispatchem („NIE wchodź w niego, zgłoś `DECISION_REQUIRED`") zgłaszam do rozstrzygnięcia orkiestratorowi — poprawka to bump `25 → 26` w trzech miejscach plus komentarz o obowiązku bumpu, analogicznie do tego, co R2-B zrobił w `grupy-budynkow-test.cjs`.

### Pominięta

`ai-buduje-budynki` — **świadomie nie uruchomiona**. Dwa cudze procesy tego samego testu (start 22:46, bez wrappera `timeout`) wisiały do końca mojej fazy, a trzeci dołożyła druga sesja o 23:10. Bramki dzielą artefakty `gra/tools/.<test>-{entry.ts,bundle.cjs}`, więc czwarte równoległe uruchomienie zniszczyłoby cudzy przebieg i własny. Evaluator też jej nie domknął z tego samego powodu. Bramka **nie asertuje niczego o Garnizonie** (sprawdza, czy miasta AI mają jakikolwiek budynek), więc nie zmienia żadnego zarzutu — ale kryterium końca 5 pozostaje w tej jednej pozycji **niedomknięte**, i tak to raportuję, zamiast wpisać liczbę, której nie zmierzyłem.


## ZMIANY

- `gra/tools/budynek-garnizon-test.cjs` — rusztowanie zrzutu: `viewport` 1240×900, `#card` 680 px, komentarz regresyjny. **Bez zmiany liczby ani treści asercji** (55).
- `dyspozycje/autobot/runs/R-BUDYNEK-GARNIZON-NOWY-Q1/dowody/` — 3 pliki PNG przegenerowane tą samą bramką (`garnizon-karta-encji.png` 482→**702** px szerokości; pozostałe dwa bez zmiany treści, przegenerowane w tym samym przebiegu).
- `dyspozycje/autobot/runs/R-BUDYNEK-GARNIZON-NOWY-Q1/03-obrona-runda1.md` — ten raport.
- **Nie ruszałem** `gra/data/buildings.json`, `gra/src/game/ai.ts` ani `gra/tools/grupy-budynkow-test.cjs`. Dwa ostatnie są w drzewie zmienione **przez równoległą sesję** (BLOKADY 1) — commituję wyłącznie własne ścieżki, bez `git add -A`/`git add .`.

## OBSERWACJE (§R2-E, nie naprawiam)

`trybunal` bez wpisu w `building-icon-map.json`; `bld-pretorium.svg` istnieje, ale mapa kieruje `pretorium` na `bld-palac`; `civpedia-gra-id-mostek-test.cjs` przy uruchomieniu przepisuje stempel `generated` w śledzonym `gra/src/data/wikiBundle.json`. Potwierdzam wszystkie trzy — rejestruje orkiestrator.

**Czwarta, znaleziona przeze mnie w tej fazie — ta sama klasa co trzecia.** Uruchomienie kompletu 39 bramek **brudzi śledzone pliki dowodowe CUDZEGO tematu**: `entity-card-diorama-real-render` i sąsiednie bramki zapisują zrzuty do `dyspozycje/autobot/runs/R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1/dowody/`, przez co po moim sweepie 12 śledzonych PNG tamtego runu pokazywało się jako `M` w `git status`. **Cofnąłem je `git restore` tej jednej ścieżki** — do commita nie weszły, drzewo tamtego tematu jest nietknięte. Skutek dla procesu: każdy, kto uruchomi rodzinę bramek budynków, wygląda w `git status` jakby zmieniał cudzy run, a przy `git add -A` (zakazanym, §9 poz. 2) faktycznie by go nadpisał. Rejestruje orkiestrator — nie naprawiam, bo to bramki spoza mojej allowlisty.

**Uwaga o długości (§11):** limit ~400 słów przekroczony. §3c wymaga dowodu z wytworu przy **każdym** z pięciu zarzutów, a dispatch domagał się pomiaru G3, którego brak był treścią zarzutu 2. Kontrakt, blokady i werdykty są skondensowane; rozwlekłe są wyłącznie dowody.
