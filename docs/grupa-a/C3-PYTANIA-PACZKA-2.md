# C3 — Pytania ABC paczka 2 (C3-Q6…Q10)

**Grupa:** **A (mapa świata)** — nie Grupa C Walka  
**Status:** **GOTOWE DO WYSŁANIA** — po odpowiedzi na paczkę 1  
**Format:** pełny ABC wg `docs/decyzje/DYSPOZYCJA-STALA.md` §2

---

### [EKRAN: Mapa świata] C3-Q6 — Milicja przy szturmie miasta

**O co chodzi i dlaczego decydujemy**

Gdy oblężenie przechodzi w **szturm** (przycisk Szturm → overlay preBattle → scena bitwy), obrońca musi mieć **skład garnizonu**. Oprócz jednostek wojskowych stacjonujących w mieście, w kanonie projektu (SS9c) miasto pod presją wystawia **milicję z populacji** — słabsze jednostki cywilne z widłami, ok. 20% mieszkańców.

To wpływa na trudność szturmu małych miast (dużo ludności = więcej milicji) vs fortec. Bez decyzji implementacja albo pomija milicję, albo dodaje ją bez Twojej zgody.

**A — 20% populacji jako milicja (kanon SS9c)**

- **Co to znaczy w grze:** Miasto 10 ludności → ok. 2 jednostki milicji (~połowa siły Wojownika Kamienia) dołączają do obrońców przy szturmie. Widzisz je w preBattle po prawej i na polu bitwy.
- **Za:**
  - Małe miasta nie padają „pusto" — ludność broni domów.
  - Zgodne z dokumentem master i `siege.ts` (MILITIA_POP_FRACTION = 0.2).
  - Realistyczne oblężenia — szturm kosztowny nawet bez armii.
- **Przeciw:**
  - Duże miasta (wysoka populacja) mogą mieć **dużo** słabej milicji — balans do strojenia.
  - Więcej jednostek na scenie bitwy = więcej UI/performance.

**B — 10% populacji (słabsza milicja)**

- **Co to znaczy w grze:** Połowa kanonu — mniej „wioski z widłami", garnizon liczy się bardziej niż ludność.
- **Za:**
  - Łatwiejsze szturmy na duże miasta demograficzne.
  - Mniej jednostek na ekranie bitwy.
- **Przeciw:**
  - Małe miasta prawie bez obrony cywilnej.
  - Odejście od SS9c i od analiz UNITS.

**C — Brak milicji — tylko jednostki wojskowe w mieście**

- **Co to znaczy w grze:** Do obrony liczą się **wyłącznie** jednostki, które sam umieściłeś w garnizonie. Pusta baza = łatwy szturm.
- **Za:**
  - Prosta reguła — zero automatycznych jednostek.
  - Szybsze bitwy, mniej chaosu na polu bitwy.
- **Przeciw:**
  - Miasto bez garnizonu pada od razu — mało „civ-like".
  - Słabsze oblężenia — głodzenie dominuje nad szturmem.

**Rekomendacja:** **A** — kanon projektu i sens oblężeń.

---

### [EKRAN: Mapa świata] C3-Q7 — Gdzie na ekranie jest panel oblężenia?

**O co chodzi i dlaczego decydujemy**

W trybie oblężenia gracz **zostaje na mapie świata** (nie wchodzi od razu w bitwę 3D). Potrzebuje **panelu**, z którego czyta: zapasy żywności, turę oblężenia, stan garnizonu, kolejkę machin i przyciski **Kontynuuj / Szturm / Odwrót**.

To decyzja **layoutu na mapie strategicznej** — nie mylić z panelem miasta (produkcja) ani z HUD bitwy (C2).

**A — Overlay na mapie świata (panel boczny lub dolny)**

- **Co to znaczy w grze:** Zaznaczasz oblężone miasto → po prawej (lub na dole) pojawia się **panel oblężenia**: machiny, zapasy, atrycja, przyciski. Mapa 3D w tle nadal widoczna.
- **Za:**
  - Wszystko w jednym miejscu — widzisz mapę i decyzje oblężenia.
  - Spójne z handoffem C1→MAPA (oblężenie bez preBattle).
  - Nie miesza się z produkcją miasta (panel B).
- **Przeciw:**
  - Kolejny panel na mapie — trzeba uniknąć przeładowania z HUD (A1).
  - UI musi zaprojektować layout od zera.

**B — Zakładka „Oblężenie" w istniejącym panelu miasta**

- **Co to znaczy w grze:** Klik w miasto → ten sam panel co budynki/produkcja, ale **nowa zakładka** „Oblężenie" gdy `oblegane=true`.
- **Za:**
  - Reużycie istniejącego panelu — mniej nowego UI.
  - Gracz już wie, gdzie klikać w miasto.
- **Przeciw:**
  - Mylące: produkcja vs oblężenie w jednym oknie.
  - Atakujący może **nie** mieć panelu miasta (to wrogi gród) — trzeba osobny UI dla oblężnika.

**C — Pełnoekranowy tryb „Oblężenie" (jak osobny ekran)**

- **Co to znaczy w grze:** Wejście w oblężenie = **prawie pełny ekran** dedykowany (mapa mini + statystyki + machiny), mapa świata w tle przyciemniona.
- **Za:**
  - Najczytelniejszy fokus — zero rozpraszaczy.
  - Łatwo zmieścić dużo informacji (machiny, zegary, prognozy).
- **Przeciw:**
  - Najdroższe w implementacji.
  - Przerwanie flow mapy świata — więcej klików w/wy.

**Rekomendacja:** **A** — overlay na mapie; osobny widok dla **atakującego** obok zaznaczenia miasta.

---

### [EKRAN: Mapa świata] C3-Q8 — Tempo budowy machin oblężniczych

**O co chodzi i dlaczego decydujemy**

Podczas oblężenia atakujący może budować **machiny**: **Taran** (Kamień), **Wieża oblężnicza** (Brąz) — budowane **w trakcie** oblężenia na mapie; **Katapulta** (Żelazo, D10=A) zwykle z armii. Reguła wpływa na tempo: czy 3 tarany = 3 tury czekania, czy szybciej przy dużej armii.

**A — Ściśle 1 machina gotowa co turę (v1.0)**

- **Co to znaczy w grze:** W panelu wybierasz typ (Taran/Wieża) → **następna tura** masz gotową machinę. Chcesz 3 — czekasz 3 tury oblężenia. Kolejka: jedna budowa naraz.
- **Za:**
  - Proste, przewidywalne — gracz liczy tury.
  - Zgodne z kontraktem UNITS (decyzja Naster 1/turę).
  - Łatwe do balansu i AI.
- **Przeciw:**
  - Duże armie nie przyspieszają budowy — mniej „epickie" dla mega-wojsk.
  - Długie oblężenia przy wielu machinach.

**B — 1 machina/turę, ale można **planować kolejkę** (Taran→Wieża→Taran)**

- **Co to znaczy w grze:** Nadal **jedna** aktywna budowa/turę, ale ustawiasz **kolejność** z góry — nie musisz klikać co turę. Automatycznie buduje następną po ukończeniu poprzedniej.
- **Za:**
  - Mniej klików przy długim oblężeniu.
  - Ta sama szybkość co A — zero balansu do przebudowy.
- **Przeciw:**
  - Trochę więcej UI (lista kolejki).
  - Gracz może „zapomnieć" co zaplanował.

**C — Tempo zależy od wielkości armii (np. +1 machina na 10 jednostek)**

- **Co to znaczy w grze:** Duża armia buduje **więcej** machin na turę — oblężenie przyspiesza z masą wojsk.
- **Za:**
  - Nagradza zgrupowanie armii — sensowne strategicznie.
  - Krótsze oblężenia przy dużych kampaniach.
- **Przeciw:**
  - Trudniejszy balans (progi, cap).
  - AI musi to liczyć; **odłożone** elementy z UNITS (generał, wielkość armii) — ryzyko scope creep na v1.0.

**Rekomendacja:** **A** na v1.0; **B** akceptowalne jako wariant A z QoL.

---

### [EKRAN: Mapa świata] C3-Q9 — Odwrót z oblężenia (koszt)

**O co chodzi i dlaczego decydujemy**

Gracz rozpoczął oblężenie, zbudował machiny, głodzi miasto — potem chce **zrezygnować** i odjechać armią. Czy odwrót jest **bezpłatny**, kosztuje **ruch/turę**, czy **karze** stratami?

Spójność z **C1-Q5=A** (Wycofaj z preBattle bez strat) — pytanie, czy ta sama zasada obowiązuje w **długim** oblężeniu na mapie.

**A — Wolny odwrót zawsze (bez kary)**

- **Co to znaczy w grze:** Przycisk **Odwrót** w panelu oblężenia — armia odjeżdża, oblężenie się kończy, **bez** utraty HP/ruchu. Machiny zbudowane **przepadają** (lub zostają — do doprecyzowania w implementacji, domyślnie: tracisz postęp oblężenia).
- **Za:**
  - Spójne z C1-Q5 — gracz nie jest „uwięziony".
  - Łatwe cofnięcie pomyłki (przypadkowe oblężenie).
  - Prosta implementacja.
- **Przeciw:**
  - Zero kosztu eksperymentów — można „głodzić" bez ryzyka.
  - Oblężenie mniej „commitujące".

**B — Odwrót kosztuje pozostały ruch / turę**

- **Co to znaczy w grze:** Odwrót zużywa **ruch** jednostki lub kończy turę oblężnika — nie odjedziesz daleko od razu.
- **Za:**
  - Oblężenie ma **wagę** — nie flip-flop co turę.
  - Spójne z ruchem na mapie strategicznej.
- **Przeciw:**
  - Frustrujące po długim oblężeniu (3 tury machin + odwrót = stracona praca).
  - Trudniejsze dla gracza do zrozumienia niż „wolny wyjście".

**C — Odwrót po stratach (np. −10% HP armii po zbudowaniu machin)**

- **Co to znaczy w grze:** Im więcej zainwestowałeś (machiny, tury), tym **droższy** odwrót — np. kara HP lub utrata części machin.
- **Za:**
  - Realizm — chaotyczne porzucenie oblężenia kosztuje.
  - Zachęca do dokończenia oblężenia lub szturmu.
- **Przeciw:**
  - Karne — gracz może czuć się ukariony za testowanie mechaniki.
  - Więcej parametrów do balansu.

**Rekomendacja:** **A** — spójność z C1-Q5; oblężenie i tak traci postęp (machiny/tury).

---

### [EKRAN: Mapa świata] C3-Q10 — Wygląd oblężenia na mapie 3D

**O co chodzi i dlaczego decydujemy**

Gdy miasto jest oblężone, **na mapie świata** (widok 3D hexów) gracz musi **od razu widzieć**, że trwa oblężenie — nie tylko z panelu. To warstwa **MAPA** (render), nie logika.

**A — Obóz + pierścień wokół miasta + ikona oblężenia**

- **Co to znaczy w grze:** Wokół miasta: **pierścień**/obwódka w kolorze atakującego, **obóz** (prosty model lub billboard), **ikona** ⚔/🏕 na heksie miasta. Z daleka widać „tu się oblega".
- **Za:**
  - Czytelne na pierwszy rzut oka — nie musisz klikać miasta.
  - Wystarczające na v1.0 bez pełnej grafiki obozów.
  - MAPA może zrobić iteracyjnie (pierścień → potem obóz).
- **Przeciw:**
  - Więcej pracy renderu niż sama ikona.
  - Przy wielu oblężeniach mapa może być „kolorowa".

**B — Tylko mała ikona na heksie miasta (minimum)**

- **Co to znaczy w grze:** Jedna **ikona** na hexie — reszta informacji tylko w panelu po kliknięciu.
- **Za:**
  - Najszybsza implementacja — odblokowuje logikę C3 wcześniej.
  - Zero ryzyka clutteru wizualnego.
- **Przeciw:**
  - Słabo widoczne przy zoom out — łatwo przeoczyć oblężenie.
  - Mniej „filmowe" / mniej immersji.

**C — Pełne modele 3D obozów oblężniczych (polish)**

- **Co to znaczy w grze:** Rozbudowane **modele obozów**, machiny na mapie strategicznej, animacje — jak w dużych strategiach.
- **Za:**
  - Najlepszy efekt wizualny — gra wygląda premium.
  - Oblężenia „czytelne" bez UI.
- **Przeciw:**
  - **Duży** koszt lane MAPA — opóźnia v1.0.
  - Ryzyko performance na dużej mapie.

**Rekomendacja:** **A** na v1.0; **C** jako polish po v1.0 jeśli zostanie czas.

---

**Odpowiedź Macieja (po paczce 1):**
```
C3-Q6=
C3-Q7=
C3-Q8=
C3-Q9=
C3-Q10=
```
