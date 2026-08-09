# R-AI-FOUNDING-THROTTLE-Q1 — AI zjada własną ludność (Zulusi utknięci na populacji 1)

**Data:** 2026-08-08 · **Decyzja:** Maciej, `A` (zmodyfikowane: próg 3, nie 4-5 z pierwotnej propozycji A)

## Sytuacja
Cywilizacje AI z ujemną karą wzrostu ludności i wysoką ekspansywnością (potwierdzone: Zulusi)
wpadają w samopodtrzymującą się pętlę 1↔2: osadnik kosztuje 1 pkt ludności, zawsze z
najludniejszego miasta, próg wejściowy AI (`AI_FOUNDING_SOURCE_MIN_POP`) to 2 — więc gdy
miasto urośnie 1→2, natychmiast jest ścinane pod kolejnego osadnika. Pełna diagnoza w
`dyspozycje/PYTANIA-OTWARTE.md`, sekcja `BUG-CYWILIZACJA-BEZ-GRANIC + BRAK-WZROSTU-LUDNOSCI`.

**Kontekst ważny dla tej decyzji:** 4 dni wcześniej (`AI-FOUND-Q1=A`, 2026-08-04) próg został
świadomie OBNIŻONY z 5 do 2, żeby AI się rozwijało (`P-AI-MOC-GAP`, luka mocy AI).

## Decyzja
**A, zmodyfikowane liczbowo:** podnieść `AI_FOUNDING_SOURCE_MIN_POP` z **2 do 3** pkt
ludności (nie do 4-5, jak w pierwotnej propozycji A turnieju ABC — Maciej wybrał łagodniejszą
wartość, prawdopodobnie by zminimalizować ryzyko ponownego otwarcia luki mocy AI z 04.08).

## Uzasadnienie (z turnieju ABC)
Najprostsza zmiana — jedna stała, zero nowego stanu, zero ryzyka save/load. Miasto musi
urosnąć do 3, zanim odda mieszkańca na osadnika — łagodniejsze niż pełne cofnięcie do 5,
więc mniejsze ryzyko dla tempa ekspansji AI ustalonego decyzją `AI-FOUND-Q1=A`.

**Świadomie zaakceptowane ryzyko (z Przeciw #1 wariantu A):** to nie naprawia przyczyny, tylko
ją odsuwa — miasto wciąż może zostać oskubane od razu po osiągnięciu progu 3. Jeśli po
playteście problem nadal będzie widoczny (szczególnie dla cywilizacji z karą wzrostu typu
Zulusi), do rozważenia wariant B (cooldown per-miasto) jako dopełnienie.

## Wdrożenie
`gra/src/game/city-founding.ts` — stała `AI_FOUNDING_SOURCE_MIN_POP` z 2 na 3.

## Status
WDROŻONE w kodzie (patrz `dyspozycje/REJESTR-PROSB-I-ZADAN.md` za commit).
