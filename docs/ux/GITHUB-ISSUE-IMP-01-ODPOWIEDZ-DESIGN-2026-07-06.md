# GitHub Issue — ODPOWIEDŹ Design · Panel Moc imperium (IMP-01)

**Hasło w repo:** `IMP-01-MOC-ODPOWIEDZ-2026-07-06`  
**Repo:** https://github.com/maciejsieracki/The-Game (gałąź `main`)  
**Status:** KANON GRY — mockup v1 z **6 filarami = błędny model** · prosimy o **v2**

**Powiązane zlecenie:** B3 IMP-01 · decyzja Macieja **D16 = opcja A** (slide-in z prawej)

---

## Tytuł issue (skopiuj przy tworzeniu)

```
[IMP-01] Odpowiedź UI — Panel Moc imperium (9 składników, nie 6 filarów)
```

---

## Treść issue (pełna — Design czyta TYLKO to + linki poniżej)

Design zapytał o mockup `Panel Moc imperium v1 2026-07-05`. Poniżej odpowiedzi kanonowe z silnika gry.

---

### P1 · Skąd wchodzi panel? Slide-in czy modal?

| Trigger | Zachowanie |
|---------|------------|
| Klik **środek górnego paska** — medalion cywilizacji + liczba **Moc** | Otwiera panel slide-in · scroll do sekcji **Moc** |
| Klik **chipów lewego paska:** Skarbiec · Praca · Nauka · Kultura · Ludność · Rekruci | **Ten sam** slide-in · scroll do sekcji zasobu |
| Klik **liczby rekrutów** pod medalionem Mocy | Panel · sekcja Rekruci |
| Skrót klawiaturowy | **Brak** w v1.0 |

**Forma UI (MUST):**
- **Slide-in z prawej** — **NIE** modal na środku ekranu
- Szerokość: **`min(420px, 94vw)`** — **nie 460px**
- Zamknięcie: **✕** w nagłówku + **Esc**
- Stary modal centrum (`powerOverlayHud`) = legacy · **wycofujemy** po mockupie v2

---

### P2 · Ile filarów? Jakie dokładnie?

**NIE 6.** W silniku **nie ma** filarów Wojsko · Gospodarka · Nauka · Kultura · Religia · Populacja.

**Kanon = tabela 9 składników Mocy** (wiersze w sekcji „Moc imperium”):

| # | Etykieta UI (PL) | × wsp. | Skąd liczba w grze |
|---|------------------|--------|---------------------|
| 1 | **Armia** | 25 | Suma **M_pole** jednostek bojowych na mapie (oblężnicze w polu = 0) |
| 2 | **Wygrane bitwy** | 1 | Suma M_pole pokonanego wroga **przed walką** (nie „liczba wygranych ×25”) |
| 3 | **Ludki** | 5 | Suma **slotów populacji (ludki)** we wszystkich miastach — nie ludność absolutna |
| 4 | **Rekruci (ekw. jedn.)** | 5 | `floor(rekruci_bieżący / koszt_werbu[epoka])` |
| 5 | **Miasta** | 50 | Liczba miast imperium |
| 6 | **Terytorium (heksy)** | 0.5 | Heks w zasięgu terytorium miast |
| 7 | **Infrastruktura (budynki)** | 5 | Każdy wybudowany budynek we wszystkich miastach |
| 8 | **Odkrycia / tech** | 20 | Liczba zbadanych technologii |
| 9 | **Ulepszenia terenu** | 5 | Farmy, drogi, hodowle… w terytorium |

**Gospodarka / Kultura / Religia** = **osobne sekcje** tego samego slide-in (chipy HUD) — **nie wchodzą do sumy Mocy.  
Religia = osobny overlay — **poza** zakresem mockupu IMP-01.

---

### P3 · Skąd liczby? Jeden łączny wynik mocy?

**Jeden wynik „Moc” na HUD i w panelu:**

```
Moc = round( suma wszystkich: ilość × współczynnik )
```

- Bez mnożnika epoki  
- Bez normalizacji 0–100  
- Ta sama liczba co **Moc {N}** w centrum górnego paska

**Kolumny tabeli w mockupie (proponowane):**  
Składnik · Ilość · × wsp. · = pkt · % udziału · pasek · (opcj.) Skąd

**Referencja danych (tylko czytanie, nie edytuj):** plik `gra/data/power-params.json` sekcja `skladniki` — po push będzie na GitHubie.

---

### P4 · Ranking rywali — czy pokazujemy?

**TAK** — pod tabelą 9 składników.

| Element | Wartość |
|---------|---------|
| Dane | Wszystkie cywilizacje na mapie · Moc każdej = ten sam wzór co gracz |
| Sortowanie | Malejąco po Moc |
| Gracz | Wiersz z **▸** + wyróżnienie wizualne |
| Format | `#rank NazwaCywilizacji — Moc {N}` |

**Respekt** (osobna linia pod rankingiem, nie w rankingu):
- Wobec **pierwszego znanego kontaktu dyplomatycznego**
- `round(100 × powerSelf / (powerSelf + powerPartner))`
- Copy: „Respekt wobec {AI}: {X}% (Twoja moc A vs B)"

---

### P5 · Trend (▲/▼) — porównanie do której tury?

**NIE w v1.0** — brak historii Mocy w silniku i UI.

**Prośba:** **usuń** ▲/▼ z mockupu. Ewentualna funkcja = osobna decyzja Macieja + praca silnika.

---

### P6 · Screeny PRZED

Panel **już istnieje** w grze (brzydki slide-in, ale **prawdziwe dane**).

**Playtest PRZED (jeśli masz build HTML):**
1. Otwórz `gra-kanon/START.html` (Ctrl+F5) → nowa gra → kilka tur  
2. Klik **Moc** (centrum HUD) → screenshot slide-in z tabelą  
3. Klik **Skarbiec** → ten sam panel · inna sekcja  

**GAP HTML (otwórz w Chrome z GitHub):**  
https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/IMP-01-MOC-PANEL-GAP-DLA-DESIGN.html

Maciej może dosłać 1–2 PNG w `docs/ux/export/screenshots/` — wtedy dopasuj 1:1.

---

## Co poprawić w mockupie v1 → v2

| v1 (błąd) | v2 (kanon) |
|-----------|------------|
| 6 filarów Wojsko/Gospodarka/… | Tabela **9 składników** (patrz P2) |
| 460px slide-in | **420px** (±20 OK po review) |
| Trend ▲/▼ | **Usuń** |
| Gospodarka w sumie Mocy | **Oddzielna sekcja** „Zasoby imperium” |

---

## Deliverable po korekcie

**Plik:** `The Game - Panel Moc imperium v2 2026-07-06 (1E).dc.html`

**Min. 4 klatki:** Moc (9 wierszy) · Skarbiec · Praca · Rekruci  
**Styl:** tokeny 1E · zero emoji · slide-in 420px

**Reszta paczki B-P0** (A-08, HEX, C23, C12) — **niezależna** · możesz domykać równolegle.

---

## Linki GitHub (po `git pull main`)

| Co | URL |
|----|-----|
| **Ta odpowiedź** | `docs/ux/GITHUB-ISSUE-IMP-01-ODPOWIEDZ-DESIGN-2026-07-06.md` |
| Zlecenie IMP-01 | `docs/ux/DESIGN-ZLECENIE-IMP-01-MOC-2026-07-06.md` |
| GAP HTML | `docs/ux/export/IMP-01-MOC-PANEL-GAP-DLA-DESIGN.html` |
| Hasła Design | `docs/ux/DESIGN-GITHUB-HASLA.md` |

**Szukaj w repo:** `IMP-01-MOC-ODPOWIEDZ-2026-07-06`

---

*Lane UI · odpowiedź na pytania Design · 2026-07-06*
