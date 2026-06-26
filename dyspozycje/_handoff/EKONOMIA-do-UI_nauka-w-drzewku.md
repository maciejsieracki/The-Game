# HANDOFF: EKONOMIA → UI/UX — Nauka/Badania = w DRZEWKU TECHNOLOGII (wytyczne)

**Data:** 2026-06-25. Routing: przez mastera do UI/UX. **Decyzja Maciela:** research NIE jako osobny panel — ma być **DRZEWKO TECHNOLOGII**. Dotychczasowy widok nauki UX = do zastąpienia.

## Model (Maciej + korekta 1a)
- **Nauka sterowana graczem:** gracz wybiera CEL badań **klikając technologię w drzewku**. Globalna pula nauki (`playerState.nauka`) akumuluje na wybrany cel; po osiągnięciu `Koszt nauki` celu → tech odblokowana; gracz wybiera kolejny cel (może zmienić w trakcie — pula zostaje).
- **„Ile na co przeznaczać" = zaszyte w drzewku:** kierowanie puli = wybór celu w drzewku. BRAK osobnego panelu rozdzielania nauki.

## Wytyczne dla widoku (wzór: Civ / Freeciv-OpenCiv)
- Widok = **interaktywne drzewko**: węzły = technologie, krawędzie = prerekwizyty (`Wymaga`).
- Każdy węzeł pokazuje: nazwa, Epoka, **Koszt nauki**, co odblokowuje (budynki/jednostki/surowce), status (zbadana / dostępna / zablokowana prereqami / **aktualny CEL**).
- **Klik dostępnej tech** = ustaw jako CEL (callback `setResearchTarget(techId)` — kontrakt z EKONOMIA/master). Pasek postępu: pula vs Koszt celu + ETA (tury przy bieżącej Nauce/turę).
- Dane: `gra/data/tech.json` (Technologia / Epoka / Poziom / Wymaga / Koszt nauki / Odblokowuje*). **3 epoki v0.1: Kamień / Brąz / Żelazo** (Żelazo właśnie dodawane przez EKONOMIA).
- Render epokami (kolumny/rzędy), podświetlenie ścieżki do celu.

## Styk lane'ów
- **EKONOMIA:** produkcja Nauki/turę (strumień %Badania) + pula + stan celu badań.
- **MASTER:** wpięcie wyboru celu gracza (research.ts) zamiast auto-zakupu.
- **CYWILIZACJE:** koszty techów (`tech.json`) + AI (`chooseAIResearch`, własny cel).
- **UI/UX:** render drzewka + picker (klik = cel) + pasek postępu. Zastąpić obecny panel nauki.
