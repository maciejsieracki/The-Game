# Grupa B — pytania do Macieja (format 1ABC, 2ABC…)

> **Nowe pytania ABC:** tylko [`docs/obieg/_ABC-JAK-PYTASZ.md`](../obieg/_ABC-JAK-PYTASZ.md) — stary format **WYCOFANY**.  
> Poniżej = **archiwum** zamkniętej paczki 1–11 (2026-06-27).

> **Odpowiedź (archiwum):** `1C 2A 3Spec 4C 5A 6A 7A 8A 9A 10A 11A`  
> **Mockup okolica:** `Gra-podglad-OKOLICA-UX.html`  
> **Zamknięte — nie pytaj:** B2-Q1…Q12, B3, B4, B5, paczka 1–11, B1-tech (**Q3 posterunek odłożone**).

**Kolejność wysyłki (historyczna):** paczka **1–3** → **4–6** → **7–10** → **11** — **wykonane 2026-06-27**.

---

## 1 — Jak liczyć Szczęście w silniku? *(blokuje Porządek, koszyki, sens buntu)*

**O co chodzi:** Dziś silnik ma jedną liczbę netto (4 składniki), a w Spec/Excel jest pełna lista ~15 czynników. Panel pokazuje koszyki 😊/😐/😠, ale **bez rozpiski skąd +/-** (w przeciwieństwie do Zdrowia). Od tego zależy implementacja `computeHappiness` i sekcja w panelu.

**A — Punkt netto (jak dziś, bez rozpiski)**  
- Jedna liczba netto → Porządek → 3 tiery; koszyki tylko **wizualizacja** z netto.  
- **Za:** najszybsze v1.0; mniej UI; spójne z obecnym kodem.  
- **Przeciw:** gracz nie widzi „dlaczego”; trudniej balansować; rozjazd z Spec/Excel.

**B — Model ludzi (Spec 21.06)**  
- Silnik liczy zadowolonych / niezadowolonych z czynników; strajk gdy ≥3 niezadowolonych (każdy nie daje Pracy).  
- **Za:** najbliżej Civ; czytelna konsekwencja buntu.  
- **Przeciw:** więcej kodu; trudniejsze testy; inna logika niż dziś.

**C — Netto + rozpiska +/- w panelu (jak Zdrowie), opcjonalnie procent**  
- Suma bonusów/kar widoczna wiersz po wierszu; opcjonalnie **% Szczęścia** (`Netto / SzMax` epoki miasta, cap 120%) — szczegóły: `B2-model-szczescie-procent.md`.  
- **Za:** gracz rozumie liczby; łatwy balans w Excel; spójne z sekcją Zdrowie.  
- **Przeciw:** więcej UI i kodu niż A; bez % nadal abstrakcyjna liczba.

**Mapowanie:** B2-Q7 → **1**

---

## 2 — Jakie czynniki Szczęścia wpiąć na v1.0? *(tylko jeśli 1=A lub 1=C)*

**O co chodzi:** Pełna lista **już jest** w `MIASTO/Spec-spoleczenstwo.md` + `society-params.json`. Pytanie: **które** wchodzą do silnika teraz, a które po v1.0.

**A — Pełna lista Spec**  
- Budynki, kultura %, religia, Wealth, zagęszczenie, wojna, podatki, małe miasto, świątynia/amfiteatr itd.  
- **Za:** zgodność z Excelem; pełna głębia Civ.  
- **Przeciw:** najdłuższa implementacja; więcej haków w main.

**B — Minimum rozszerzone**  
- Jak dziś (budynki + kultura + religia + Wealth) **+ wojna + podatki + zagęszczenie**.  
- **Za:** sensowny gameplay bez pełnego scope; umiarkowany koszt.  
- **Przeciw:** reszta Spec „martwa” do później.

**C — Minimum (4 składniki jak dziś)**  
- Reszta czynników **po v1.0**.  
- **Za:** zero ryzyka opóźnienia; panel może pokazać rozpiskę z 4 pozycji.  
- **Przeciw:** słabe odzwierciedlenie Spec; wojna/podatki nie wpływają na nastrój.

**Mapowanie:** B2-Q8 → **2**

---

## 3 — Składnik „Prawo” w Porządku *(Order = f(Szczęście, Prawo))*

**O co chodzi:** W Spec Porządek = mix Szczęścia i Prawa (garnizon, Ratusz). W kodzie Prawo często = 0.

**A — Prawo = 0 na v1.0**  
- Porządek liczy się **tylko** ze Szczęścia (waga 1.0).  
- **Za:** prosto; mniej danych; szybciej domknąć bunt.  
- **Przeciw:** wojsko w mieście nie daje „spokoju”; odchylenie od Spec.

**B — Prawo z garnizonu + Ratusz**  
- Prosty bonus punktowy za jednostki/obronę i budynek Ratusz.  
- **Za:** nagroda za garnizon; zgodność z Spec.  
- **Przeciw:** kolejna mechanika do balansu i UI.

**C — Prawo odłożone (formalnie: tylko Szczęście, bez planu B)**  
- Jak A, ale zapis „Prawo wróci po v1.0” — bez kodu garnizonu teraz.  
- **Za:** jasny komunikat graczowi; brak połowicznej implementacji.  
- **Przeciw:** to samo co A w praktyce; może mylić z B.

**Mapowanie:** B2-Q9 → **3**

---

## 4 — Kto wybiera pola pracy (okolica miasta)? — **ZAMKNIĘTE → 4C**

**Decyzja:** Auto + **4 profile** (Żywność / Produkcja / Podatki / Zrównoważone) + ręczna korekta 👤 + Przywróć auto · **v1.0 pełne**. Spec: `docs/decyzje/B1-okolica-pola.md`.

---

### Archiwum ABC

**O co chodzi:** Silnik **auto** przypisuje N najlepszych pól (N = populacja). Panel pokazuje podgląd bez kliku. Ty opisywałeś ręczne dodawanie/odejmowanie „jednostek” na heksach i widoczne plony. Bilans w panelu dziś **≠** ekonomia tury (stary promień r≤1).

**A — Tylko auto (gracz nie klika pól)**  
- `assignWorkedTiles` co turę; okolica = **podgląd** + ewentualnie podświetlenie obrabianych.  
- **Za:** zero UX do nauki; Civ6-style auto; najmniej kodu.  
- **Przeciw:** brak kontroli; słabsze dla graczy Civ5; mockup bez 👤.

**B — Ręczny wybór pól w sekcji Okolica**  
- Gracz klika heksy / +/- 👤 na polu; silnik respektuje wybór (limit = populacja).  
- **Za:** pełna kontrola; zgodne z Twoją wizją; głębsza gra.  
- **Przeciw:** więcej UI + save/load; ryzyko „złego” przypisania przez gracza.

**C — Auto domyślnie + opcjonalna korekta**  
- Start z auto; przycisk „Dostosuj pola” → tryb ręczny; „Przywróć auto”.  
- **Za:** łagodny onboarding; moc dla zaawansowanych.  
- **Przeciw:** dwa tryby = więcej kodu i testów niż A lub B.

**Mapowanie:** B1.4 → **4**

---

## 5 — Wykup produkcji (rush) — przycisk „Wykup”

**O co chodzi:** W panelu można zapłacić z puli Pracy i dokończyć budynek/jednostkę w tej turze. Już jest w kodzie.

**A — Zostaje na v1.0 (budynki i jednostki)**  
- **Za:** tempo gry; wygodne dla gracza.  
- **Przeciw:** może ułatwić zbyt mocno; mniej znaczenia kolejki.

**B — Wyłączyć na v1.0**  
- **Za:** prostszy balans; tylko kolejka tur.  
- **Przeciw:** wolniejsza gra; usuwasz gotowy feature.

**C — Tylko budynki (nie jednostek w kolejce)**  
- **Za:** pośredni kompromis; miasto rośnie szybciej, armia nie.  
- **Przeciw:** niespójność UI (czasem Wykup, czasem nie).

**Mapowanie:** B1.2 → **5**

---

## 6 — Przycisk auto-zarządca ⚙ w nagłówku panelu

**O co chodzi:** Przełącznik w tle ustawia kolejkę produkcji; dziś **bez** wizualnego ON/OFF.

**A — Zostaje + widać ON/OFF (podświetlenie gdy włączony)**  
- **Za:** jasny stan; gracz wie kto steruje kolejką.  
- **Przeciw:** drobna praca UI.

**B — Zostaje bez wizualnego stanu (jak dziś)**  
- **Za:** zero zmian; mniej szumu.  
- **Przeciw:** gracz nie wie czy ⚙ działa.

**C — Ukryć przycisk na v1.0**  
- Auto tylko w tle lub wyłączone.  
- **Za:** czystszy nagłówek; mniej pytań od gracza.  
- **Przeciw:** trudniej testować auto-zarządcę; feature niewidoczny.

**Mapowanie:** B1.3 → **6**

---

## 7 — Kultura w panelu miasta

**O co chodzi:** Hak w kodzie istnieje, **nie wpięty** w main. Placeholder w panelu.

**A — Pełna sekcja v1.0**  
- Kultura, progi granic terytorium, źródła (+/turę).  
- **Za:** pełny obraz miasta; zgodność z Spec.  
- **Przeciw:** dużo UI; zależność od haków F.

**B — Skrót v1.0**  
- Suma kultury + przyrost/turę (1–2 linie).  
- **Za:** szybko; gracz widzi trend.  
- **Przeciw:** bez szczegółów granic.

**C — Placeholder „wkrótce” do po v1.0**  
- **Za:** zero pracy teraz.  
- **Przeciw:** luka w panelu; kultura tylko na mapie/HUD.

**Mapowanie:** B4.1 → **7**

---

## 8 — Religia w panelu miasta

**O co chodzi:** Podobnie jak kultura — placeholder „Religia: wkrótce”.

**A — W tej samej sekcji co kultura (v1.0)**  
- Wyznawcy, dominacja, wpływ na Szczęście.  
- **Za:** spójny blok „Kultura i religia”.  
- **Przeciw:** duży panel; więcej danych z silnika.

**B — Jedna linia „Religia: wkrótce” (jak dziś)**  
- **Za:** minimum zmian.  
- **Przeciw:** brak informacji gameplay.

**C — Ukryć do po v1.0**  
- **Za:** czystszy panel.  
- **Przeciw:** religia niewidoczna w mieście.

**Mapowanie:** B4.2 → **8**

---

## 9 — Gdzie suwak split żywności (miasta ↔ zapasy państwa/wojsko)?

**O co chodzi:** Model Q1 (hybryda) **zamknięty** — brak implementacji. Suwak decyduje ile nadwyżki idzie do magazynów miast vs imperium.

**A — W panelu miasta, sekcja „Imperium / wojsko”**  
- Global per gracz, widoczny przy otwarciu dowolnego miasta.  
- **Za:** blisko ekonomii miasta; jeden ekran.  
- **Przeciw:** mix lokalnego i globalnego w panelu.

**B — Osobny mały panel obok suwaków Handel/Praca**  
- **Za:** logiczny podział suwaków.  
- **Przeciw:** więcej elementów w prawej kolumnie.

**C — Tylko na HUD mapy (nie w panelu miasta)**  
- **Za:** żywność imperium = strategia mapy.  
- **Przeciw:** Grupa A musi to zrobić; mniej wygodne przy zarządzaniu miastem.

**Mapowanie:** B5.1 → **9** *(eskalacja do Grupy A jeśli C)*

---

## 10 — Domyślny split żywności (gdy gracz nie rusza suwaka)

**O co chodzi:** Startowa proporcja między rozwojem miast a zapasami państwa (wojsko, głód −8% HP).

**A — 70% rozwój miast / 30% zapasy państwa**  
- Zgodne ze spec EKONOMIA.  
- **Za:** priorytet wzrostu miast; zapasy uzupełniają się wolniej.  
- **Przeciw:** wojsko może głodować na starcie przy agresywnym stylu.

**B — 50% / 50%**  
- **Za:** bezpieczniejsze wojsko; prostsze liczenie.  
- **Przeciw:** wolniejszy rozwój miast.

**C — Inny — napisz procenty w odpowiedzi**  
- Np. `10C 60/40`.  
- **Za:** pełna kontrola balansu.  
- **Przeciw:** wymaga Twojej liczby; agent nie zgaduje.

**Mapowanie:** B5.2 → **10**

---

## 11 — Ulepszenia terenu a plony na v1.0? *(blokuje Civ5-parity, okolica)*

**O co chodzi:** 15 ulepszeń w JSON; budowa z mapy (A4=A). **`tileYield()` dziś ignoruje ulepszenia** — farma na polu nie daje bonusu. Decyzja A4 nie mówi *kiedy* wire do ekonomii.

**A — Pełne v1.0 (wszystkie 15 typów wpływają na plony)**  
- **Za:** pełna głębia; okolica ma sens z 👤.  
- **Przeciw:** największy batch EKONOMIA+MAPA+F.

**B — v1.0 minimum (farma, kopalnia, pastwisko — ~5 podstawowych)**  
- **Za:** szybsze; pokrywa 80% rozgrywki.  
- **Przeciw:** reszta ulepszeń „dekoracja” do później.

**C — Po v1.0 (najpierw panel okolica + auto-assign)**  
- **Za:** kolejność: UX pól przed bonusami.  
- **Przeciw:** długa luka vs Civ; ulepszenia bez efektu ekonomicznego.

**Mapowanie:** nowe (B1-Q ulepszenia) → **11**

---

## Odpowiedź Macieja (wzór)

```
1C 2B 3A 4B 5A 6A 7B 8B 9A 10A 11B
```

Opcjonalnie przy **10C:** dopisz procenty.  
Agent zapisuje mapowanie do `B2-spoleczenstwo.md`, `B1-panel-budowa.md`, `B4-wealth.md`, `B5-zywnosc.md` i `B-OTWARTE-PYTANIA.md`.

---

## Co NIE jest pytaniem ABC (implementacja po decyzjach)

| Temat | Status | Lane |
|-------|--------|------|
| B2-Q5 ikona 🔥 hex | **ZAMKNIĘTE C** | MAPA → F |
| Haki okolica w main | po **4** | F |
| Tick `advanceEmpireFood` | po **9–10** | EKONOMIA → F |
| Mockup MIASTO sync | po **4** (+ **11**) | UI |
