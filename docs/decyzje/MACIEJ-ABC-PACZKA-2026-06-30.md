# Paczka ABC — 2026-06-30 (pełna forma)

> **Odpowiedź:** jedna linia na końcu, np. `T1A T2A T3A T4A · R7A · Q3C · INKA`  
> **Formularz:** zaznacz opcje w czacie (Agent) — szczegóły poniżej.

**Kontekst:** Cztery tematy odłożone jako opcjonalne — teraz je domykamy, żeby lane’y (MAPA, EKONOMIA, CYWILIZACJE, UI) mogły wdrożyć bez zgadywania. **Nie blokują** v1.0 core (kontakt, wojna, pokój już działają); D3 v1.1 = rozszerzenie audiencji.

---

### D3-T1 — Trybut co turę (dyplomacja v1.1)

**[EKRAN: Audiencja dyplomatyczna]**

**O co chodzi i dlaczego decydujemy**

Gdy AI (lub gracz) **akceptuje trybut**, co turę płacisz pieniądze wrogiemu. Musimy ustalić, **skąd** gra odejmuje te pieniądze — ze **skarbca całego imperium**, **z miast** proporcjonalnie, czy **tylko raz** przy podpisaniu umowy. Od tego zależy ekonomia co turę, zerwanie traktatu i casus belli.

**A — Ze skarbca państwa (`player.pieniadz`); brak środków = zerwanie + casus belli**

- **Co zobaczysz:** na HUDzie spada jedna liczba pieniędzy imperium; gdy skarbiec pusty — AI może zerwać umowę i uzasadnić wojnę.
- **Za:** proste dla gracza (jedna liczba); łatwe w kodzie i panelu EKONOMIA; standard Civ (państwo płaci); AI łatwo ocenia, czy opłaca się wymuszać trybut.
- **Przeciw:** duże imperium z wieloma miastami „czuje” trybut mocniej niż przy podziale; słabsze miasto-start może szybciej wpaść w spiralę długu.

**B — Proporcjonalnie z miast (wealth per-city)**

- **Co zobaczysz:** trybut rozłożony na miasta według bogactwa — bogatsze płacą więcej.
- **Za:** bardziej „realistyczne” dla wielu miast; słabsze miasta mniej dotknięte.
- **Przeciw:** trudniejszy UI (skąd dokładnie zniknęły pieniądze); więcej kodu w EKONOMIA; gracz może nie rozumieć, dlaczego trybut „gryzie” nierówno.

**C — Tylko jednorazowa płatność przy akceptacji (bez co-tur)**

- **Co zobaczysz:** płacisz raz dużą kwotę przy podpisaniu; potem nic co turę.
- **Za:** najprostsze w v1.1; brak ticka co turę; mniej ryzyka bugów save/load.
- **Przeciw:** mniej jak Civ/TW; słabsza presja długoterminowa; AI trudniej „wyciska” imperium w czasie.

**Rekomendacja:** **A** — spójne z resztą ekonomii imperium i planem lane EKONOMIA.

---

### D3-T2 — Sojusz wojskowy (dyplomacja v1.1)

**[EKRAN: Audiencja dyplomatyczna]**

**O co chodzi i dlaczego decydujemy**

**Sojusz** to umowa, że wchodzisz w wojnę po stronie partnera. Musimy ustalić, **kiedy** gra Cię wciąga w konflikt — tylko gdy **sojusznik jest ofiarą**, zawsze gdy on **atakuje**, czy na razie sojusz tylko **podnosi relacje** bez auto-wojny.

**A — Defensywny: wchodzisz w wojnę tylko gdy sojusznik zaatakowany**

- **Co zobaczysz:** jeśli sąsiad uderzy w sojusznika — dostajesz wybór/obowiązek wstąpienia; jeśli sojusznik sam napada — **nie** jesteś z automatu w wojnie.
- **Za:** mniej „wciągnięć” w cudze wojny; gracz czuje kontrolę; bezpieczniejsze v1.1 dla AI.
- **Przeciw:** mniej jak Total War (pełny sojusz); agresywny sojusznik może wykorzystać Cię bez wzajemności.

**B — Pełny: atak sojusznika = obowiązek wojny (jak TW)**

- **Co zobaczysz:** wypowiadasz wojnę razem z sojusznikiem, gdy on atakuje **lub** gdy go atakują.
- **Za:** silniejsza więź strategiczna; prostsza reguła „sojusz = zawsze razem”.
- **Przeciw:** ryzyko wciągnięcia w wojnę, której nie chcesz; trudniejszy balans AI v1.1.

**C — Symboliczny v1.1: +Relacja, bez auto-wojny (pełna logika v1.2)**

- **Co zobaczysz:** podpisujesz sojusz — rośnie relacja, ale **sam** decydujesz o wojnie jak dotąd.
- **Za:** najmniej ryzyka bugów i frustracji w pierwszej iteracji; szybkie wdrożenie karty w UI.
- **Przeciw:** sojusz „na papierze”; gracz może czuć, że umowa nic nie znaczy.

**Rekomendacja:** **A** — sensowny kompromis v1.1 przed pełnym TW-like sojuszem.

---

### D3-T3 — Handel w audiencji (dyplomacja v1.1)

**[EKRAN: Audiencja dyplomatyczna]**

**O co chodzi i dlaczego decydujemy**

Akcja **Handel** w audiencji — wymiana surowców/pieniędzy za lepsze relacje. Czy to **jednorazowy** deal, **umowa co turę** przez N tur, czy **oba** wybory przy negocjacji.

**A — Jednorazowa wymiana + bonus relacji**

- **Co zobaczysz:** panel „dam X, wezmę Y" — jeden raz, relacja rośnie.
- **Za:** proste v1.1; bez ticka co turę; łatwy playtest.
- **Przeciw:** mniej głębi dyplomatycznej; brak długoterminowych umów handlowych.

**B — Umowa co turę (X pieniędzy/turę przez N tur)**

- **Co zobaczysz:** traktat handlowy leci tury — co turę transfer zasobów.
- **Za:** bogatsza dyplomacja; bliżej Civ; AI może proponować długie kontrakty.
- **Przeciw:** wymaga ticka EKONOMIA + save/load; więcej UI; więcej bugów.

**C — Oba warianty w UI (wybór przy negocjacji)**

- **Co zobaczysz:** przy handlu wybierasz „jednorazowo" lub „umowa N tur".
- **Za:** elastyczność; jeden ekran na przyszłość.
- **Przeciw:** więcej pracy UI i testów od razu; gracz początkujący może się pogubić.

**Rekomendacja:** **A** na start v1.1; **C** dopiero jeśli chcesz od razu pełny handel.

---

### D3-T4 — Kolejność wdrożenia dyplomacji v1.1

**[TEMAT: Priorytet prac — Grupa D / CYWILIZACJE]**

**O co chodzi i dlaczego decydujemy**

W audiencji jest **12 kart** (NAP, sojusz, granice, handel, tech, namów, trybut, ultimatum, wasal…). Nie musimy wszystkiego naraz. Kolejność wpływa na to, **co zobaczysz w grze za 2–4 tygodnie** i ile ryzyka regresji.

**A — Faza 1: NAP + trybut + handel pełny → F2: sojusz + namów → F3: reszta**

- **Co zobaczysz:** najpierw spokojne traktaty i pieniądze; potem wojsko; na końcu granice/tech/wasal.
- **Za:** małe batche = mniej bugów; każda faza do playtestu; lane’y równolegle bez chaosu.
- **Przeciw:** pełna audiencja „jak w spec" później; cierpliwość do końca listy.

**B — Wszystko naraz (1 sprint)**

- **Co zobaczysz:** od razu wszystkie karty aktywne po wdrożeniu.
- **Za:** najszybciej „pełna dyplomacja" na papierze.
- **Przeciw:** duży batch = trudny review; wysokie ryzyko regresji; długi playtest.

**C — Tylko NAP + trybut; reszta v1.2**

- **Co zobaczysz:** minimum rozszerzenia — pokój płatny i trybut; reszta szara/wkrótce.
- **Za:** najmniejszy zakres; najszybsze domknięcie.
- **Przeciw:** handel/sojusz czekają; gracz może czuć, że audiencja „pusta".

**Rekomendacja:** **A** — fazowanie zgodne z `D3-v1.1-TIER23-paczka.md`.

---

### A-R7 — Łodzie rybackie poza terytorium miasta

**[EKRAN: Mapa świata — budowa ulepszenia]**

**O co chodzi i dlaczego decydujemy**

**Łodzie rybackie** można dziś postawić na **Wybrzeżu** i **Morzu** często **bez** sprawdzania, czy heks leży w **terytorium** Twojego miasta. Audit MAPA (R7) pyta: to **celowy** bonus (łowisz gdzie chcesz), **bug** (powinno jak Farma), czy **Morze** ma być wyłączone?

**A — Celowe: łowi poza granicą terytorium (jak dziś)**

- **Co zobaczysz:** stawiasz łodzie na wybrzeżu/morzu nawet daleko od miasta, jeśli teren pasuje.
- **Za:** prostsze dla gracza na archipelagach; mniej frustracji „mam morze, nie mam terytorium"; mniej kodu.
- **Przeciw:** rozjazd z innymi ulepszeniami (Farma wymaga zasięgu); możliwe „cheese" ekonomiczny; trudniejsze balansowanie.

**B — Wymaga terytorium miasta (jak większość ulepszeń)**

- **Co zobaczysz:** łodzie tylko w zasięgu granicy miasta (pop + fort/posterunek).
- **Za:** spójna reguła dla wszystkich ulepszeń; łatwiejszy balans; zgodne z Civ.
- **Przeciw:** na mapach z wąskim terytorium mniej miejsc na ryby; więcej pracy gracza (posterunki).

**C — Wyłączyć Morze: tylko heks Wybrzeże w zasięgu**

- **Co zobaczysz:** nie budujesz na czystym Morzu — tylko na linii wybrzeża (w terytorium lub nie — osobna decyzja w A/B).
- **Za:** mniej edge case’ów render/fog; wizualnie czytelniej.
- **Przeciw:** mniej żywności z głębokiego morza; odbiega od części spec JSON.

**Rekomendacja:** **B** — spójność z resztą systemu ulepszeń (chyba że świadomie chcesz „wolne łowienie").

---

### B1-tech-Q3 — Jaka technologia odblokowuje posterunek (Strażnicę)?

> **STATUS: ODŁOŻONE 2026-06-29 — NIE PYTAJ PONOWNIE.** Hover 🔒 wdrożony; decyzja tech czeka dyspozycji Macieja. Kanon: `B1-tech-MACIEJ-2026-06-29.md`.

*(Archiwum opcji A/B/C poniżej — tylko gdy Maciej wróci do tematu.)*

**[EKRAN: Mapa — budowa ulepszenia + drzewko badań]**

**O co chodzi i dlaczego decydujemy**

**Posterunek** (Strażnica) rozszerza terytorium i daje bonus obrony. W JSON jest **epoka 2**, pole tech **puste** — gracz widzi 🔒 „kołek Kamienia". Wcześniej odłożyłeś decyzję z hintem: ścieżka **Obróbka drewna + Murarstwo**. Musimy to domknąć, żeby drzewko, hover mapy i Panel-A były zgodne.

**A — Tech Wojskowosc (Brąz)**

- **Co zobaczysz:** po zbadaniu Wojskowosci odblokowujesz posterunek na mapie.
- **Za:** logiczne z wojskiem/obroną; jedna tech = prosty hover; zgodne z fortem (B1-Q4 Wojskowosc).
- **Przeciw:** posterunek dostępny „za wcześnie" bez infrastruktury; mniej związku z drewnem/murami.

**B — Tech Brązownictwo**

- **Co zobaczysz:** posterunek po wejściu w metal Brązu (Brązownictwo).
- **Za:** spójne z epoką Brązu w JSON; prosta jedna bramka.
- **Przeciw:** słabszy związek z palisadą/drewnem; Wojskowosc i posterunek rozdzielone.

**C — Obróbka drewna AND Murarstwo (obie tech)**

- **Co zobaczysz:** posterunek odblokowany dopiero po **obu** badaniach — palisada + mury.
- **Za:** zgodne z Twoją wcześniejszą propozycją; posterunek = infrastruktura, nie czysta wojskowość; głębsza progresja.
- **Przeciw:** późniejszy unlock; trudniejszy komunikat w UI („wymaga 2 tech"); więcej testów.

**Rekomendacja:** **C** — jeśli posterunek ma być „oboz warowny", nie czysty koszary.

---

### INK-Q1 — Inkowie a epoka Brązu (historycznie)

**[EKRAN: Kreator nowej gry + mapa startu]**

**O co chodzi i dlaczego decydujemy**

**Inkowie** mają dziś w `civs.json` ten sam zestaw startów co Rzym (**Kamień, Brąz, Żelazo**). Historycznie Andy nie mają „epoki Brązu" w sensie Bliskiego Wschodu/Europy. Musimy wybrać: **gameplay** (pełna gra), **kreator** (ograniczone epoki), czy **tech/złoża** (narracja bez miedzi).

**A — Bez zmian: pełny zestaw epok (gameplay > historia)**

- **Co zobaczysz:** w kreatorze Inkowie jak inni — Kamień/Brąz/Żelazo; miedź i brąz jak u wszystkich.
- **Za:** zero pracy balansu „wyjątku"; prostszy onboarding; Celtowie/Germanie już mają wyjątek — nie mnożymy.
- **Przeciw:** historyczna niespójność; Ty sam zwróciłeś na to uwagę.

**B — Inkowie bez Brązu w kreatorze (start Kamień lub późniejsza ścieżka bez „Epoki Brązu")**

- **Co zobaczysz:** wybierasz Inków → w kreatorze **nie ma** opcji startu w Brązu (np. tylko Kamień + Żelazo lub tylko Kamień).
- **Za:** honoruje historię bez psucia innych cyw; spójne z logiką Celtów (epoki per cyw).
- **Przeciw:** więcej wyjątków w danych; gracz może nie rozumieć, czemu Brąz szary.

**C — Brąz w kreatorze OK, ale bez miedzi/brązu w tech i złożach (narracja andyjska)**

- **Co zobaczysz:** możesz startować „epoką Brązu" jako Inkowie, ale **nie** masz europejskiej ścieżki miedzi — inne tech/złoża (kamień, lokalna miedź, tarasy).
- **Za:** kompromis gameplay + flavor; tarasy/Inkowie już są unikalne.
- **Przeciw:** najwięcej pracy (osobna ścieżka tech/map dla jednej cyw); ryzyko bugów.

**Rekomendacja:** **A** na v1.0 (zostawiamy jak jest); **B** jeśli historia w kreatorze ważniejsza niż pełna symetria.

---

## Odpowiedź Macieja (wpisz lub zaznacz formularz)

**2026-06-26 (paczka odłożona):** `B1-tech-Q3=C · A-R7=B · INK-Q1=B`

| ID | Decyzja | Plik |
|----|---------|------|
| B1-tech-Q3 | **C** — Obróbka drewna + Murarstwo | `B1-tech-MACIEJ-2026-06-29.md` |
| A-R7 | **B** — łodzie tylko w terytorium miasta | `A-R7-lodzie-terytorium.md` |
| INK-Q1 | **B** — Inkowie bez startu w Brązu | `E1-epoka-przed-cyw.md` |

Przykład (archiwum): `T1A T2A T3A T4A · R7B · Q3C · INKA`
