# B2-D18 — Pytania ABC dla Macieja (start gry × trudność)

| Pole | Wartość |
|------|---------|
| **Status** | 🟠 **U MASTERA** — lane B wdrożył · czeka playtest + ACK |
| **Kontekst** | Playtest po D16–D17 · propozycja liczb → `B2-D18-start-balans-trudnosc-PROPOZYCJA.md` |
| **Lane** | B (ekonomia / społeczeństwo) |
| **Jak odpowiadać** | Np. `D18-0: A · D18-1: B · D18-2: A · …` — możesz dopisać korektę liczby |

> **Zasada:** na **żadnej** trudności nie chcemy fałszywego **„Bunt skrajny” w T1** przy pierwszym mieście (pop=1) — to bug UX, nie zamierzona trudność. D18 dostraja **easy / normal / hard**, żeby różnica była odczuwalna, ale fair.

---

## D18-0 — Zakres wdrożenia (meta)

### O co chodzi

Mamy gotową **propozycję tabel** (bonus osady, immunitet Wealth, progi buntu, wagi Sz/Prawo, kary na hard). Pytanie: **ile z tego wdrażamy teraz** w jednym batchu?

### Opcja A — Pełny pakiet D18

- **Co zrobimy:** Wszystkie tabele z propozycji (§3–§7): JSON + kod tam, gdzie trzeba (progi buntu z kodu → `society-params.json`).
- **Co zobaczysz:** Easy wyraźnie łagodniejsze, normal = punkt odniesienia, hard = wcześniejsza presja — spójnie we wszystkich systemach (Porządek, Wealth, religia, woda).
- **Plusy:** Jedna decyzja, jeden playtest porównawczy, pełna różnica trudności.
- **Minusy:** Większy diff (JSON + kilka hooków w kodzie).
- **Szacunek:** 1 batch lane B + weryfikacja testów.

### Opcja B — Tylko liczby w JSON (bez progów buntu w kodzie)

- **Co zrobimy:** Aktualizujemy `society-params.json` / `econ-params.json` (bonus osada, immunitet Wealth, kary hard, wagi Sz/Prawo). **Progi buntu zostają w kodzie** jak dziś (10%, grace 2).
- **Co zobaczysz:** Miękkie różnice (łatwiej utrzymać Wealth na easy, inne kary). Progi „Bunt skrajny” **identyczne** na wszystkich trudnościach.
- **Plusy:** Mniejszy zakres, szybciej na playtest.
- **Minusy:** Hard nadal może „szarpać” przy tym samym progu 10% co easy — część propozycji nie działa.
- **Szacunek:** ~pół batcha.

### Opcja C — Pilot minimalny

- **Co zrobimy:** Tylko **immunitet Wealth per trudność** + **progi buntu per trudność** (5% / 8% / 10% + grace). Reszta **jak po D16–D17** (bez nowych wag Sz/Prawo, bez rozszerzonego pakietu kary).
- **Co zobaczysz:** Koniec fałszywego buntu T1 + bufor Wealth na starcie; reszta balansu bez zmian.
- **Plusy:** Najmniejsze ryzyko, szybka walidacja „czy T1 jest OK”.
- **Minusy:** Easy/hard mało się różnią poza tymi dwoma dźwigniami.
- **Szacunek:** najkrótszy batch.

### Rekomendacja lane B

**A** — jeśli playtest D16–D17 przeszedł; inaczej **C** na szybki fix T1, potem reszta tabeli.

---

## D18-1 — Hard: start w turze 1 (Porządek)

### O co chodzi

Symulacja propozycji daje na **hard** ok. **~8% Porządku** w T1 (pop=1, bez garnizonu) — to **poniżej progu „Bunt skrajny”** (dziś 10%). Czy hard ma być tak ostry od razu, czy łagodzimy start?

### Opcja A — Hard twardy, ale fair (propozycja tabeli)

- **Co zrobimy:** Bonus osady hard **+2**, próg buntu **10%**, grace **2 tury**, wagi **45% Sz / 55% Prawo**. Akceptujemy niski PorPct T1, ale **grace** daje czas na reakcję (obniż podatki / wojsko — B2-Q12).
- **Co zobaczysz:** Na hard od T1 może być **„Strefa krytyczna”** lub napięcie, ale **bez natychmiastowej rebelii**; presja administracyjna od początku.
- **Plusy:** Hard odczuwalnie trudniejszy bez „cheatu” na easy.
- **Minusy:** Wymaga, że gracz **rozumie alert** i dźwignie (podatki / garnizon).

### Opcja B — Hard wymusza PorPct ≥ ~15% w T1 (miększy start)

- **Co zrobimy:** Podbijamy start hard: bonus osady **+3**, ewent. **waga Sz 60%** tylko gdy pop ≤ 4, próg buntu **8%** (łatwiej wyjść ze strefy krytycznej).
- **Co zobaczysz:** T1 na hard = **napięcie**, rzadko „Bunt skrajny”; więcej presji pojawia się od T3–T5.
- **Plusy:** Mniej fałszywych alarmów na hard; nadal trudniej niż normal przez kary i utrzymanie Wealth.
- **Minusy:** Hard mniej „bezlitosny” na starcie — część graczy może nie poczuć różnicy w T1.

### Opcja C — Hard jak normal w T1, różnica od T5+

- **Co zrobimy:** **Te same** parametry startowe co **normal** (bonus osady +3, wagi 50/50). Różnicę hard robimy **tylko** karami późniejszymi (utrzymanie Wealth, garnizon, progi gęstości).
- **Co zobaczysz:** T1–T4 podobne na normal i hard; hard boli od rozbudowy miasta i armii.
- **Plusy:** Prostsze do wyjaśnienia graczowi.
- **Minusy:** Słabsze poczucie „gram na hard” na początku kampanii.

### Rekomendacja lane B

**B** — spełnia zasadę „brak fałszywego buntu T1”, a hard nadal ma ostrzejsze kary i słabszy immunitet Wealth niż normal.

---

## D18-2 — Religia na trudności Hard

### O co chodzi

Po **D16** na easy/normal **nie ma kary** za brak dominującej religii, dopóki **nie ma świątyni**. Propozycja D18: na **hard** kara **−1 Szczęścia od razu**, nawet bez świątyni. Czy tak ma być?

### Opcja A — Jedna logika wszędzie (jak D16)

- **Co zrobimy:** Kara `religia_kara_brak_religii` **tylko gdy jest świątynia**, a brak dominacji — na **easy, normal i hard**.
- **Co zobaczysz:** Na starcie (T0–T10) religia **neutralna**; presja religijna dopiero po budowie świątyni.
- **Plusy:** Spójne z lore (wiara cywilizacji jest od startu w panelu — po fixie T0); mniej szumu w T1.
- **Minusy:** Hard mniej „karze” za zaniedbanie religii wcześnie.

### Opcja B — Hard: kara −1 od startu bez dominacji (propozycja tabeli)

- **Co zrobimy:** Easy/normal = warunek świątyni; **hard = −1** gdy brak dominującej wiary (nawet bez świątyni).
- **Co zobaczysz:** Na hard od T1 **widać** wpływ religii w breakdown Szczęścia; easy/normal spokojniejsze.
- **Plusy:** Wyraźny „podpis” trudności hard w społeczeństwie.
- **Minusy:** Może mylić, skoro panel już pokazuje domyślną wiarę nacji (100%) — kara dotyczyłaby edge case’ów / obcej dominacji.

### Opcja C — Wszędzie 0 kary bez świątyni (ultra-łagodne)

- **Co zrobimy:** Usuwamy karę braku religii **całkowicie**, dopóki gracz nie zbuduje świątyni — także na hard (wartość −1 w JSON ignorowana bez świątyni).
- **Co zobaczysz:** Religia na starcie **czysto informacyjna**; kary dopiero mid-game.
- **Plusy:** Zero stresu religijnego na starcie na każdej trudności.
- **Minusy:** Hard traci jedną dźwignię różnicującą.

### Rekomendacja lane B

**A** — spójne z D16 i fixem religii T0; różnicę hard robimy Wealth / Porządkiem / wodą, nie religią w T1.

---

## D18-3 — Immunitet Wealth (utrzymanie nie obniża poziomu W)

### O co chodzi

Nowe miasto dostaje **N tur**, w których utrzymanie **nie zrzuca** poziomu Wealth (W). Propozycja: **8 / 5 / 3** (easy / normal / hard). D16 wdrożyło na sztywno **5** tur — D18 ma to rozłożyć per trudność.

### Opcja A — 8 / 5 / 3 (propozycja)

- **Co zrobimy:** Easy **8 tur**, normal **5**, hard **3** (`wealth_immunitet_utrzymania_tur`).
- **Co zobaczysz:** Easy = długi „okres ochronny” na naukę Wealth; hard = szybciej czujesz presję ekonomiczną.
- **Plusy:** Czytelna różnica trudności bez dotykania core formuły W.
- **Minusy:** Easy może być zbyt wyrozumiałe przez ~8 tur.

### Opcja B — 10 / 5 / 3 („miodowe” easy)

- **Co zrobimy:** Easy **10 tur**, normal **5**, hard **3**.
- **Co zobaczysz:** Pierwsze ~10 tur na easy bez spadków W z utrzymania — focus na mechanikach miasta/map.
- **Plusy:** Idealne pod tutorial / pierwszą kampanię.
- **Minusy:** Dłuższy okres, w którym Wealth „nie boli” na easy.

### Opcja C — 5 / 5 / 0 (krótko i równo)

- **Co zrobimy:** Easy i normal **5 tur** (jak dziś po D16), hard **0** (brak immunitetu).
- **Co zobaczysz:** Różnica głównie na hard — od T2 możliwy spadek W.
- **Plusy:** Minimalna zmiana względem stanu po D16.
- **Minusy:** Słaba różnica easy vs normal.

### Rekomendacja lane B

**A** — kompromis między nauką (easy) a presją (hard); **B** jeśli chcesz maksymalnie przyjazny pierwszy kontakt z grą.

---

## D18-4 — Easy: bonus „pierwsze miasto imperium” (stolica)

### O co chodzi

Opcjonalny **dodatkowy** bonus tylko na **easy**, tylko dla **pierwszego miasta gracza**, przez **T1–T10** — żeby onboarding nie kończył się alarmem Porządku.

### Opcja A — Tak: +1 Szczęście (stolica, easy, T1–T10)

- **Co zrobimy:** Nowy wpis w breakdown / JSON: **+1 netto Sz** dla `ownerId=0`, pierwsze miasto, `turn ≤ 10`, tylko difficulty easy.
- **Co zobaczysz:** Na easy pierwsze miasto ma **łagodniejszy** pasek nastroju na początku kampanii.
- **Plusy:** Tarcza tylko dla nowych graczy; nie psuje normal/hard.
- **Minusy:** Kolejna reguła „tylko easy” do zapamiętania w designie.

### Opcja B — Nie — wystarczy bonus osady + immunitet Wealth (propozycja bez D18-Q4)

- **Co zrobimy:** Bez dodatkowego bonusu stolicy; polegamy na `prawo_bonus_osada`, immunitet Wealth i łagodniejszych progach na easy.
- **Co zobaczysz:** Mniej „tajnych” bonusów — wszystko widać w istniejących liniach UI.
- **Plusy:** Mniej wyjątków w kodzie.
- **Minusy:** Jeśli symulacja easy nadal daje niskie PorPct, trzeba podbić inne parametry.

### Opcja C — Tak, ale +1 Prawo (administracja, nie nastrój)

- **Co zrobimy:** Jak A, ale bonus idzie w **Prawo** (+1 PrawPct efektywnie), nie Szczęście — „królewski urząd w stolicy”.
- **Co zobaczysz:** Na easy stabilniejszy **Porządek**, nie sztucznie podbite Szczęście.
- **Plusy:** Pasuje do fantazji „stolica = porządek”; mniej inflacji Sz.
- **Minusy:** Gracz może nie zauważyć, skoro UI mówi o Sz/Prawo łącznie w Porządku.

### Rekomendacja lane B

**B** najpierw — po playteście D16–D17; jeśli easy nadal alarmuje → **C** (bardziej thematyczne niż A).

---

## D18-5 — Wagi Szczęście vs Prawo w Porządku (per trudność)

### O co chodzi

Porządek = mix **Sz** i **Prawo**. Propozycja: easy **55/45**, normal **50/50**, hard **45/55** — na easy bardziej liczy się nastrój, na hard administracja/wojsko.

### Opcja A — Propozycja 55/45 · 50/50 · 45/55

- **Co zrobimy:** Klucze `porzadek_waga_szczescie` / `porzadek_waga_prawo` per difficulty w JSON.
- **Co zobaczysz:** Ta sama akcja (np. garnizon) **mocniej** podbija Porządek na hard; festiwele/kultura — na easy.
- **Plusy:** Różne „style” grania per trudność bez nowych mechanik.
- **Minusy:** Trudniejszy do balansowania w głowie („dlaczego mój % skoczył inaczej niż na normal?”).

### Opcja B — Wszędzie 50/50 (prościej)

- **Co zrobimy:** Wagi **identyczne** na easy/normal/hard; różnicę trudności robimy **tylko** karami, bonusami i progami.
- **Co zobaczysz:** Porządek liczy się tak samo wszędzie — łatwiej uczyć gracza.
- **Plusy:** Mniej parametrów, spójny komunikat w UI.
- **Minusy:** Mniej „charakteru” per difficulty.

### Opcja C — Tylko hard 45/55; easy i normal 50/50

- **Co zrobimy:** Asymetria **tylko na hard** (Prawo ważniejsze); easy/normal bez zmiany wag.
- **Co zobaczysz:** Hard nagradza garnizon/budynki prawa; easy/normal jak dziś.
- **Plusy:** Mały diff, celowany w hardcore.
- **Minusy:** Easy bez dodatkowego „poduszki” przez wagę Sz.

### Rekomendacja lane B

**C** — jeśli D18-0 = A lub B; **B** jeśli priorytetem jest prostota UX.

---

## D18-6 — Bonus osady (+Prawo gdy małe miasto)

### O co chodzi

**Bonus osady** = dodatkowe punkty **Prawa**, gdy miasto ma **≤4** ludności (linia „Osada” w panelu). Propozycja: **+4 / +3 / +2** (easy / normal / hard). D16 wdrożyło **+4 normal** (kalibracja pod PorPct ≥20%).

### Opcja A — +4 / +3 / +2 (propozycja tabeli)

- **Co zrobimy:** Dokładnie jak w propozycji §3.
- **Co zobaczysz:** Easy najłatwiej utrzymać Porządek w małym mieście; hard najtrudniej.
- **Plusy:** Spójne z całą tabelą D18.

### Opcja B — +4 / +4 / +3 (mocniejszy normal i hard)

- **Co zrobimy:** Podbijamy normal do **+4** (jak dziś po kalibracji D16) i hard do **+3**.
- **Co zobaczysz:** Mniej „Bunt” na normal/hard w T1–T3 przy małej populacji.
- **Plusy:** Bezpieczniejsze po playteście, jeśli T1 nadal czerwony.
- **Minusy:** Hard bliżej normal.

### Opcja C — +3 / +3 / +2 (oszczędniej)

- **Co zrobimy:** Obniżamy easy do **+3**; normal **+3**, hard **+2**.
- **Co zobaczysz:** Ogólnie wyższa presja Porządku we wczesnej grze na wszystkich poziomach.
- **Plusy:** Bardziej „Civ-like” napięcie od początku.
- **Minusy:** Ryzyko powrotu problemu T1 na normal.

### Rekomendacja lane B

**B**, jeśli playtest D16–D17 na normal nadal pokazywał niskie PorPct; inaczej **A**.

---

## Szybka ściąga (propozycja liczb)

| Parametr | Easy | Normal | Hard |
|----------|------|--------|------|
| Bonus osady (`prawo_bonus_osada`) | 4 | 3 | 2 |
| Immunitet Wealth (tury) | 8 | 5 | 3 |
| Próg „Bunt skrajny” | 5% | 8% | 10% |
| Grace po wejściu w kryzys | 3 | 2 | 2 |
| Waga Sz / Prawo | 55/45 | 50/50 | 45/55 |
| Kara brak religii (bez świątyni) | 0 | 0 | 0* |

\* przy **D18-2 = A**; przy **B** hard = −1 bez świątyni.

---

## Po Twojej decyzji

1. Lane B zapisze odpowiedzi w `docs/obieg/REJESTR-DECYZJI.md` (status 🟡 ZAPISANA).
2. Aktualizacja JSON + ewent. kod → testy regresji → meldunek Integratorowi.
3. Playtest: **3 trudności**, ten sam seed, T1–T5 — checklist `MACIEJ-PLAYTEST-CHECKLIST.md` PT-Z05.

**Powiązane:** `B2-D18-start-balans-trudnosc-PROPOZYCJA.md` · D16–D17 (✅) · B2-Q12 (grace / rebelia)

---

## Decyzja Macieja (formularz ABC — 2026-07-02)

| ID | Wybór | Skutek |
|----|-------|--------|
| **D18-0** | **A** | Pełny pakiet D18 (tabele §3–§7 + progi buntu do JSON) |
| **D18-1** | **A** | Hard ostry start: bonus osady +2, próg buntu 10%, grace 2 |
| **D18-2** | **A** | Religia: kara tylko ze świątynią (easy/normal/hard) |
| **D18-3** | **B** | Immunitet Wealth **10 / 5 / 3** tur |
| **D18-4** | **A+C** | Easy stolica T1–T10: **+1 Szczęście i +1 Prawo** |
| **D18-5** | **A** | Wagi Porządku **55/45 · 50/50 · 45/55** |
| **D18-6** | **A** | Bonus osady **+4 / +3 / +2** |

> *Wcześniejsza odpowiedź tekstowa „C — kompromis D16" **nadpisana** przez formularz.*

**Lane B (po START=Tak):** JSON `society-params.json` + `econ-params.json` · kod: progi buntu per trudność · bonus stolica easy · immunitet founding z JSON per difficulty.

---

## Decyzja Macieja (2026-07-02) — ARCHIWUM (nadpisane)

> ~~**„C — Obecny kompromis (D16)"**~~

**Znaczenie:** Pełna propozycja D18 (osobne tabele easy/normal/hard, progi buntu w JSON, wagi Sz/Prawo, bonus stolicy) **nie wchodzi**. Zostaje **stan po D16–D17** (+ fix religii T0 w panelu).

| Obszar | Co obowiązuje (kompromis D16) | Czego **nie** robimy (odłożone D18) |
|--------|-------------------------------|-------------------------------------|
| Bonus osady | `prawo_bonus_osada` **4 / 4 / 2**, prog pop ≤ 4 | Propozycja 4/3/2 lub 3/3/2 |
| Religia | Kara brak dominacji **tylko ze świątynią** (easy/normal/hard) | Hard −1 od startu bez świątyni |
| Wealth W=0 | Kara **0 / 0 / −1** | — |
| Immunitet utrzymania W | JSON **6 / 5 / 4** tur (`wealth_immunitet_tur`); founding **5** tur w kodzie | Propozycja 8/5/3 lub 10/5/3 |
| Progi buntu | **10%** + grace **2** (stałe w kodzie, B2-Q12) | 5/8/10% per trudność w JSON |
| Wagi Porządku | **50/50** Sz/Prawo (domyślnie) | 55/45 · 45/55 per trudność |
| Bonus stolicy easy | **Brak** | +1 Sz lub Prawo T1–T10 |
| Woda (D17) | `cityHasWaterAccess` — bez zmian | — |

**Lane B:** brak nowego batcha D18 — tylko utrzymanie D16–D17. Ewentualna **sesja balansu później** = nowa decyzja (np. D18-bis) po dłuższym playteście.

**Cytat do REJESTR:** `docs/obieg/REJESTR-DECYZJI.md` → B2-D18 🟡 ZAPISANA.
