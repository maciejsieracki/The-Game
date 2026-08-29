# Szablon — jedno pytanie ABC (kopiuj per pytanie)

> **Grupy A–E + Master:** każde pytanie = **pełny kontekst w czacie** + **krótki Ask na końcu**.  
> Reguła Cursor: `.cursor/rules/abc-pelna-forma.mdc` · Kanon Macieja: `ABC-FORMAT-KANON-MACIEJ.md`

---

## Kolejność obowiązkowa

```
1. SYTUACJA      → opis sytuacyjny (pełne nazwy, bez skrótów)
2. CEL PYTANIA   → po co pytamy / jaki efekt ma mieć decyzja
3. DLACZEGO TERAZ → czemu akurat w tym momencie
4. OPCJE A/B/C   → opis decyzji + Za (≥2) + Przeciw (≥2) — każda osobno
4b. REKOMENDACJA → zawsze A, B albo C + jedno zdanie
4c. KONSEKWENCJE → dla KAŻDEGO wariantu, nie tylko rekomendowanego:
      IMPLEMENTACYJNE — co trzeba napisać albo przepisać (pliki/obszary, nie linie)
      TESTOWE        — które bramki i testy tematu się zmieniają, a które dochodzą
5. ASK           → dopiero potem: krótki formularz (etykiety A/B/C)
```

**Podział:** pełny opis w **czacie** · w `AskQuestion` **tylko krótkie etykiety** · **ZAKAZ** samego formularza bez tekstu.

**Checklista przed wysłaniem — konsekwencje implementacyjne i testowe:** wypisane
per wariant. Wariant, przy którym nie umiesz nazwać ani jednej zmiany w kodzie i
ani jednej bramki, albo jest pozorny, albo nie został przemyślany do końca.

---

## [EKRAN: Mapa świata]  ← zmień na właściwy ekran

### C4-Q2 — Przykład tytułu (jedno zdanie)

**Sytuacja** (2–4 zdania, język gracza):

Kiedy dwie armie stoją obok siebie na mapie świata, gra dziś pokazuje okno z trzema przyciskami: Auto, Ręczna, Wycofaj. Po wyborze „Ręczna" przechodzisz na osobną mapę bitwy 3D. Nie ma jeszcze ustalonego, czy przed bitwą widzisz podgląd składów obu stron.

**Cel pytania** (1–2 zdania):

Ustalić, **czy gracz przed bitwą ręczną widzi ekran porównania armii**, czy wchodzi od razu w walkę — żeby dokończyć flow walki ręcznej bez przebudowy.

**Dlaczego teraz** (1–3 zdania):

Bez tej decyzji Grupa Walki nie wie, czy budować ekran podglądu przed mapą bitwy trójwymiarową, czy od razu ładować scenę. Blokuje to też spójność z ekranem przed bitwą na mapie świata (Grupa Mapa).

**A — Od razu mapa bitwy 3D (bez podglądu)**

- **Co w grze:** Klik „Ręczna" → natychmiast ładowanie sceny Total War.
- **Za:** szybsze wejście w akcję; mniej ekranów do zrobienia na v1.0; prostszy flow dla gracza doświadczonego.
- **Przeciw:** brak szansy sprawdzenia składów; trudniej ocenić szanse przed walką; słabsze dla nowych graczy.

**B — Ekran podglądu armii (pre-battle) przed 3D**

- **Co w grze:** Po „Ręczna" — panel: obie armie, liczebność, morale, przycisk „Rozpocznij bitwę".
- **Za:** gracz widzi szanse; spójne z grami 4X; miejsce na tipy UI.
- **Przeciw:** dodatkowy klik; więcej pracy UI (A+C); ryzyko duplikacji z preBattle na mapie.

**C — Krótki podgląd (3 sek / jeden ekran) + skip**

- **Co w grze:** Jedna karta z liczbami obu armii + „Enter = start" / „Esc = wycofaj".
- **Za:** kompromis tempo vs informacja; łatwiejsze niż pełny ekran B.
- **Przeciw:** może być za krótkie dla analizy; wymaga osobnej logiki timera/skip.

**Rekomendacja:** **B** — czytelność i spójność z oczekiwaniem gracza 4X.

---

## Formularz Ask (na końcu paczki — krótki)

Po **pełnym tekście** wszystkich pytań w czacie → **jeden** `AskQuestion`:

| Pole | Wartość |
|------|---------|
| `id` | `C4-Q2` |
| `prompt` | `Pre-bitwa ręczna — podgląd armii?` |
| `options` | `A — od razu 3D` · `B — ekran podglądu (Rekomendacja)` · `C — krótki podgląd + skip` |

Max **3 pytania** = 3 wpisy w **jednym** formularzu. Więcej → **kolejna paczka** (`[PACZKA 2/N]`). *(Historycznie max 10 — wycofane 2026-07-04: zerwanie sesji w połowie.)*

---

## Checklist przed wysłaniem

- [ ] `[EKRAN: …]` lub `[TEMAT: …]` w nagłówku + ID pytania
- [ ] **Sytuacja** · **Cel pytania** · **Dlaczego teraz** — osobne sekcje, ta kolejność
- [ ] **Pełne nazwy** — bez skrótów (Panel-C, Auto-walka, ekran przed bitwą…)
- [ ] **A, B, C** — każda: opis decyzji + **Za** (≥2) + **Przeciw** (≥2)
- [ ] **Rekomendacja** — **zawsze** litera A, B albo C + jedno zdanie
- [ ] Pełny tekst w czacie **przed** `AskQuestion`
- [ ] **Jeden** `AskQuestion` — krótkie etykiety, bez Za/Przeciw
- [ ] Po odpowiedzi → **ECHO → START** → **AKCJA** (`.cursor/rules/decyzje-echo.mdc`)

**Odpowiedź Macieja:** formularz (klik) lub litera → agent zapisuje `→ C4-Q2=B` i **wdraża od razu**.
