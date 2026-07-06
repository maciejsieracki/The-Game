# LANE-UI-panel-miasta-UX_2026-06-26

## Metadane

| Pole | Wartość |
|------|---------|
| **Rola** | MASTER + Maciej (decydent UX) |
| **Model** | Composer (Agent w czacie MASTER) |
| **Temat czatu** | Civ — Grupa B / prototyp panelu miasta OKOLICA-UX |
| **Data sesji** | 2026-06-26 |
| **Slot eksportu** | GRUPA-B · `a28467c6-7830-4ab8-bdf3-d1343dacedcc` |
| **Powiązane pliki** | `gra/src/ui/cityPanel.ts`, `hoverDetailDock.ts`, `docs/archiwum-ux/panel-miasta-UX-TOPBAR-2026-06-26.md` |
| **Kontynuacja** | Temat #2 (większy) — nowa faza po archiwizacji |

---

## Podsumowanie sesji

- Prototyp **panelu miasta Civ V** (lewo=produkcja, prawo=społeczeństwo/okolica) iterowany w `okolicapreview` — **bez** integracji kanonu.
- **Okolica:** toolbar profili w jednej linii; ℹ szczegóły przy „Zarządzanie polami”; statystyki w karcie hover.
- **Zamożność:** główny widok = pasek postępu; szczegóły w hover.
- **Garnizon:** przeniesiony na **górny pasek** obok nazwy miasta (chipy + HP); lewy dock szczegółów.
- **Podział pracy:** na górze lewej kolumny (przed produkcją).
- **Listy budynków/rekrutacji:** 3 widoczne wiersze, reszta w scrollu.
- **Ikony:** obelisk (stela), deski (stolarnia), 🧱 mury, 🌾 spichlerz OK; kuźnia 🔨, procarz/oszczepnik dopasowane.
- **Topbar interaktywny:** wszystkie statystyki 👥🍞🔨💰🔬🎭🛕⚖ — hover/klik → karta w prawym docku (wzór: żywność → reszta).
- **`attachInteractiveDetail`** + `showHoverDetailNow` w `hoverDetailDock.ts`.
- Build: `Gra-podglad-OKOLICA-UX.html`, `Gra-podglad-PLAYTEST-MIASTO.html` (md5 `A7BFCEDF…`).

---

## Decyzje Macieja (UX — bez ABC produktowego)

| Temat | Ustalenie |
|-------|-----------|
| Garnizon | Obok nazwy miasta na pasku górnym, nie w lewej kolumnie |
| Listy | 3 wiersze budynków/jednostek, reszta scroll |
| Stela | Egipski obelisk (CSS), nie Moai |
| Stolarnia | Deski (CSS), nie pień |
| Mury | 🧱 mur, nie zamek |
| Spichlerz | 🌾 OK |
| Statystyki góry | Klik/hover → wyjaśnienie (pilot 🍞 → wszystkie) |

---

## Następne kroki (po archiwizacji)

1. **Temat #2** — nowy wątek (Maciej).
2. Integracja UX do kanonu: **MASTER** + review **Opus** (nie teraz).
3. Miniaturki 3D jednostek w panelu — odłożone (`unitMiniPreview.ts` istnieje, niepodpięty).
4. Pozostałe statystyki — ewentualne skrócenie kart po playteście Macieja.

---

## Notatki techniczne

- Archiwum UX: `docs/archiwum-ux/panel-miasta-UX-TOPBAR-2026-06-26.md`
- Backup: `cityPanel.ts.bak-UX-TOPBAR-2026-06-26`
- Eksport pełny: `docs/archiwum-czatow/eksport-pelny/GRUPA-B_KORESPONDENCJA.md` (2373 linii, sync 2026-06-26)
- Handoff: `docs/archiwum-czatow/eksport-pelny/GRUPA-B_HANDOFF-KONTEKST.md`

---

## Eksport pełny (automatyczny)

Pełna korespondencja zsynchronizowana skryptem — **nie wklejać ręcznie**.

→ `docs/archiwum-czatow/eksport-pelny/GRUPA-B_KORESPONDENCJA.md`
