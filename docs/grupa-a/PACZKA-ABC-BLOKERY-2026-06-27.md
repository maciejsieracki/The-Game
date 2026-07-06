# Grupa A — Paczka ABC (blokery po audycie 2026-06-27)

> **Dla Macieja:** odpowiedz jedną linią, np. `Q1=A, Q2=B, Q3=A, Q4=A, Q5=B`  
> **Format:** `docs/decyzje/DYSPOZYCJA-STALA.md` §2  
> **Po odpowiedzi:** agent zapisuje decyzje → SILNIK / lane dostają dyspozycje.

**Kontekst:** Decyzje A1–A4 (HUD, panel [H], ulepszenia) są **zamknięte**. Poniższe pytania domykają **rozbieżności**, **sign-offy playtestu** i **priorytety v1.0** — bez nich część pracy SILNIK-a stoi lub idzie w złym kierunku.

---

## Q1 — Koniec tury: prostokąt czy też okrąg?

**[EKRAN: Mapa świata]**

**O co chodzi:** W decyzji **A1-Q10=A+B** był dolny pasek **i** okrąg MAPA (prawy-dół). Mockup **revB** ([I2]) ma **tylko prostokątny** „Zakończ turę". Kod lane `bottomBarHud.ts` = prostokąt. SILNIK nie wie, czy wdrażać **dwa** przyciski, czy jeden.

**A — Tylko prostokąt [I2] (jak mockup D1B revB)**  
- **Za:** jeden wyraźny przycisk; mniej bałaganu; zgodne z mockupem który zaakceptowałeś (ABC1=A)  
- **Przeciw:** gracze przyzwyczajeni do okręgu w innych grach; MAPA musiała by odłożyć okrąg  

**B — Oba: prostokąt [I2] + okrąg MAPA (A1-Q10 pierwotnie)**  
- **Za:** szybki skrót okręgiem dla power-userów; dwa wejścia do tej samej akcji  
- **Przeciw:** dwa elementy robią to samo; więcej pracy MAPA+UI; mockup revB tego nie pokazuje  

**C — Tylko okrąg MAPA (bez prostokąta na pasku)**  
- **Za:** więcej miejsca na pasku [I]  
- **Przeciw:** odchodzi od mockupu D1B; gorsza widoczność „Końca tury" dla nowych graczy  

**Rekomendacja:** **A** (prostokąt only — revB = kanon po ABC1=A)

---

## Q2 — Kiedy uznajemy HUD „gotowy do wpiecia" w grze?

**[EKRAN: Mapa świata]**

**O co chodzi:** Mockupy HTML (ABC1=A) są gotowe. SILNIK ma batch **F-HUD** (~40% już w `main.ts`). Brakuje: toolbar [C], WYKONAJ, panel [H], tryb 🔨 Budowa. Musisz powiedzieć, **co jest bramką** dla Ciebie.

**A — Mockup D1B wystarczy — SILNIK wpina bez Twojego playtestu ROBOCZA**  
- **Za:** najszybciej do grywalnej wersji; ABC1 już zaakceptowałeś układ  
- **Przeciw:** rozjazd mockup vs gra do momentu ROBOCZA; bugi zobaczysz późno  

**B — Czekaj na Gra-podglad-ROBOCZA.html — playtest dopiero w grze**  
- **Za:** oceniasz prawdziwe zachowanie; mniej „papierowych" obietnic  
- **Przeciw:** SILNIK stoi do ROBOCZA; dłużej bez grywalnego HUD  

**C — Dwa kroki: teraz mockup (checklist) + potem ROBOCZA jako twarda bramka przed finalną**  
- **Za:** szybki feedback wizualny teraz; ROBOCZA i tak wymagana przed kanonem (Opus)  
- **Przeciw:** dwa rundy Twojego czasu  

**Rekomendacja:** **C**

---

## Q3 — Power (Potęga) na środku paska [A′]

**[EKRAN: Mapa świata]**

**O co chodzi:** Mockup revB ma **Power** na środku górnego paska; klik → overlay ze składnikami potęgi. W kodzie `hud.ts` **nie ma** jeszcze Power ani overlay. SILNIK P1 czeka na priorytet.

**A — v1.0: Power jak w mockupie (liczba + klik → overlay składników)**  
- **Za:** spójność z mockupem; gracz widzi „siłę imperium"  
- **Przeciw:** więcej UI do zrobienia przed v1.0; dane składników musi dostarczyć CYWILIZACJE/EKONOMIA  

**B — v1.0: tylko liczba Power (bez overlay po kliku)**  
- **Za:** szybciej; widać potęgę na pasku  
- **Przeciw:** klik nic nie robi albo trzeba ukryć — gorsze UX  

**C — v1.0: bez Power na HUD (odłóż po v1.0)**  
- **Za:** najmniej pracy; reszta paska wystarczy  
- **Przeciw:** mockup revB traci centralny element; mniej „Civ-feel"  

**Rekomendacja:** **B** (kompromis v1.0) lub **A** jeśli chcesz pełny mockup

---

## Q4 — Toggle zasięgu kultury/religii (F2) na mapie 3D

**[EKRAN: Mapa świata]**

**O co chodzi:** **A1-Q12a/b=A** — klik 🎭/⛪ otwiera **overlay parametrów**. **MAPA-F2-Q1** — obok minimapy przyciski włączające **zasięg na mapie** (kolorowe obrysy). To **dwa różne** efekty. SILNIK/MAPA P2 — czy musi być w v1.0?

**A — v1.0: overlay po kliku ikon [C] TAK; zasięg na mapie 3D (F2) NIE — po v1.0**  
- **Za:** najważniejsze parametry w panelu; mniej renderu MAPA  
- **Przeciw:** nie widać zasięgu na heksach do momentu późniejszej wersji  

**B — v1.0: overlay + toggle F2 na mapie (oba)**  
- **Za:** pełna wizja jak w mockupie D1B; gracz widzi zasięg kultury/religii  
- **Przeciw:** więcej pracy MAPA; ryzyko spowolnienia renderu  

**C — v1.0: tylko F2 na mapie (bez pełnych overlayów — same liczby w tooltipie)**  
- **Za:** mapa jako główne narzędzie  
- **Przeciw:** odchodzi od A1-Q12a/b=A  

**Rekomendacja:** **A**

---

## Q5 — Miasta epoki brązu (D12=A): sign-off wizualny

**[EKRAN: Mapa świata]**

**O co chodzi:** Decyzja **D12=A** jest zapisana. MAPA ma `bronzeCity.ts` i podgląd `Civ-MAPA/Gra-podglad-MIASTA-BRAZU.html` (lub bronzepreview). SILNIK nie wie, czy **akceptujesz wygląd** na v1.0.

**A — Tak, 4 modele brązu OK na v1.0 (bez poprawek)**  
- **Za:** odblokowuje render miast w grze; decyzja D12 domknięta  
- **Przeciw:** jeśli coś Ci nie pasuje — zostaje na stałe do patcha  

**B — Poprawki (opisz w czacie co zmienić — kolor, rozmiar, 4 nacje)**  
- **Za:** doprecyzowujesz wizualnie  
- **Przeciw:** MAPA kolejna iteracja; opóźnia wpięcie  

**C — v1.0: zostaw modele kamienia; brąz po v1.0**  
- **Za:** zero ryzyka wizualnego teraz  
- **Przeciw:** sprzeczne z D12=A; mniej różnorodności miast  

**Rekomendacja:** **A** (jeśli nie playtestowałeś — otwórz podgląd MAPA przed odpowiedzią)

---

## Q6 — Porządki plików: stare mockupy HUD

**[EKRAN: Mapa świata]** *(organizacja projektu — nie gameplay, ale blokuje bałagan)*

**O co chodzi:** `Makieta-HUD-mapa-swiata.html` i `Gra-podglad-HUD.html` są **superseded** przez D1B. Audyt proponuje archiwum. Ty decydujesz, czy kasować.

**A — Przenieś do `UI/_archiwum/`, nie kasuj**  
- **Za:** historia zachowana; zero ryzyka utraty  
- **Przeciw:** nadal zajmują miejsce w repo  

**B — Usuń superseded (tylko te 2 pliki HUD)**  
- **Za:** czysty folder UI; mniej pomyłek „który mockup otworzyć"  
- **Przeciw:** brak wstecznej referencji bez gita  

**C — Zostaw jak jest (nic nie ruszaj)**  
- **Za:** zero operacji  
- **Przeciw:** dwie wersje HUD mylą przy playteście  

**Rekomendacja:** **A**

---

## Q7 — Łączenie armii na mapie (A3 / D7)

**[EKRAN: Mapa świata]**

**O co chodzi:** Na mapie świata możesz **łączyć armie** na sąsiednich heksach. Dziś jest proste okno „Połącz / nie". **D7=B** — pełny panel Total War **po v1.0**. Kod `armyStackPrompt.ts` istnieje. Czy to wystarczy na v1.0?

**A — Okno „Połącz armie" wystarczy na v1.0 (D7=B)**  
- **Za:** już działa / jest w lane; szybciej do v1.0  
- **Przeciw:** mniej wygodne niż panel TW  

**B — Chcę bogatszy panel łączenia przed v1.0 (mockup `Makieta-panel-armii.html` jako wzór)**  
- **Za:** lepszy UX wojska na mapie  
- **Przeciw:** duży scope UI+UNITS; opóźnia inne P0 (HUD, Budowa)  

**C — v1.0: bez ręcznego łączenia (tylko auto-merge lub w ogóle nie)**  
- **Za:** minimum scope  
- **Przeciw:** gorsze zarządzanie wojskiem; sprzeczne z obecnym kodem  

**Rekomendacja:** **A**

---

## Q8 — Żywność na pasku HUD (legacy Q1 → B5)

**[EKRAN: Mapa świata]**

**O co chodzi:** RevA przewiduje **Żywność** jako 1. zasób na pasku [A]. Model **B5** (hybryda państwo+miasto) **nie jest domknięty** w UI — stub `empire-food.ts`. SILNIK nie wie, czy pokazywać Żywność na HUD w v1.0.

**A — v1.0: pokaż Żywność na HUD (placeholder lub prosta suma — dane dociągnie EKONOMIA później)**  
- **Za:** zgodne z mockupem revA; gracz widzi zapas  
- **Przeciw:** liczby mogą być niespójne do B5  

**B — v1.0: ukryj Żywność na HUD — dopnij po decyzji B5 (Grupa B)**  
- **Za:** nie wprowadzasz w błąd gracza złymi liczbami  
- **Przeciw:** pasek [A] ma 6 zamiast 7 pozycji; mockup revA nie pasuje  

**C — v1.0: tylko ikona Żywność bez liczby („—" / „?" do B5)**  
- **Za:** sygnalizuje mechanikę bez fałszywych danych  
- **Przeciw:** wygląda niedokończenie  

**Rekomendacja:** **B** (→ synchronizacja z Grupą B) lub **C** kompromis

---

## Co NIE jest pytaniem ABC (SILNIK robi sam)

| Temat | Dlaczego nie ABC |
|-------|------------------|
| Wpięcie toolbar [C], WYKONAJ, panel [H], tryb Budowa | Technika po zamkniętych A1/A2/A4 |
| Raycaster ulepszeń + koszt Pracy | Handoff gotowy |
| Bramka testów / ROBOCZA / Opus | Workflow Grupa F |
| Pastwisko wymaga zwierząt, tarasy Inkowie | **A4-D4-Q1=A** już zamknięte |

---

## Odpowiedź Macieja (wzór)

```
Q1=A, Q2=C, Q3=B, Q4=A, Q5=A, Q6=A, Q7=A, Q8=B
```

*Opcjonalnie przy Q5B:* dopisz co zmienić w miastach brązu.

---

*Powiązane: `docs/grupa-a/AUDIT-2026-06-27.md` · zapis decyzji → `docs/decyzje/A1-hud-mapy.md` / nowy `A-PACZKA-2026-06-27.md`*
