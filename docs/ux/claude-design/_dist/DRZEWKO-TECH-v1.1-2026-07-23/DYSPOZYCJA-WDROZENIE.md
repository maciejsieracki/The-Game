# DYSPOZYCJA — PACZKA „DRZEWKO-TECH-v1.1" (2026-07-23)
Odpowiedź na werdykt Macieja (krawędzie nieczytelne) + ponowne dosłanie KANON-SYNC-6 + STANDALONE (proxy).

## 1. DRZEWKO v1.1 — co zmienione (wg werdyktu, punkt po punkcie)
1. KLATKA A: usunięte WSZYSTKIE krawędzie/strzałki/mostki; zdjęty badge „Przecięcia…" i pozycje
   legendy dot. krawędzi. Zostały: pasma epok, 4 stany węzłów, gwiazdki awansu, powody blokad na węzłach.
2. KLATKA B: bez zmian (zależności AND ✓/✗ na karcie węzła).
3. KLATKA C: bez krawędzi; „Pokaż ścieżkę do: Sztuka wojenna" = podświetlenie WĘZŁÓW łańcucha AND
   (reszta wygaszona), również na minimapie — zero linii.
4. Wariant „kotwice AND" — zaniechany (decyzja: brak krawędzi w ogóle).
5. Karty węzłów i karty w klatce B BEZ ikon epok — tylko nazwa odkrycia (uwaga Macieja); ikony epok
   zostają na nagłówkach pasm i pasku skoków. Docelowo (osobne zlecenie): ikona per technologia — 32 szt.
Plik: `brand-book/KANON/mockupy/The Game - Drzewko technologii siatka v1.1 (1E).dc.html`. Graf v1 w paczce tylko dla ciągłości linku „stare" w hubie.

## 2. Wgranie (Maciej) → `docs/ux/claude-design/01-propozycje-z-design/brand-book/`
| Plik | Uwaga |
|---|---|
| KANON/mockupy/…Drzewko technologii siatka v1.1 (1E).dc.html | NOWY KANON |
| KANON/mockupy/…Drzewko technologii graf v1 (1E).dc.html | stare (cel linku z hubu) |
| KANON/mockupy/ A08 · A04 · C23 v1 · C12 v3 · Jednostki infografiki v1 · Atlas ikon (6 plików) | **KANON-SYNC-6, ponownie** — poprzednio nie dojechały |
| KANON/mockupy/support.js | runtime (jeśli brak) |
| KANON/CANON.md · KANON/START….dc.html · WYMIANA-UI-DESIGN.md | NADPISZ (wiersz SIATKA v1.1, karta ★ v1.1 + „stare", log) |
| standalone/Drzewko technologii siatka v1.1 - STANDALONE.html | podgląd za proxy — patrz §3 |

Commit: `DRZEWKO siatka v1.1 (bez krawędzi, werdykt 2026-07-23) + KANON-SYNC-6 + STANDALONE`

## 3. Proxy / unpkg — rozwiązanie
`standalone/…STANDALONE.html` = **jeden plik z wbudowanym React/ReactDOM/Babel + wszystkimi ikonami**
(~1 MB) — otwiera się offline/za proxy bez unpkg. To wariant PODGLĄDOWY (do oglądania makiety);
źródłem kanonu pozostaje .dc.html. Mogę wygenerować STANDALONE dla każdej makiety kanonu na życzenie
(np. cały KANON jedną paczką). Vendored `mockupy/vendor/` z mojej strony odpada (brak dostępu
sieciowego do pobrania bibliotek unpkg); jeśli wolicie vendor: pobierzcie 3 pliki z URL-i
wymienionych w support.js (sekcja `src/cdn.ts`, wersje przypięte z SRI) — runtime honoruje
`window.__resources[url]`, więc podmiana źródeł jest po stronie loadera, bez edycji makiet.

## 4. Weryfikacja po wgraniu
START hub → „★ Badania · drzewko SIATKA v1.1" → 3 klatki bez linii; klatka C: węzły ścieżki
podświetlone złotem, reszta wygaszona; za proxy: otworzyć plik standalone.

## 5. Status zleceń
- Zlecenie 3: ZAMKNIĘTE tą paczką (v1.1). · Zlecenie 5: dosłane tu ponownie.
- Zlecenie 4 (CUDA): w toku — 19 cudów z wonders.json rozpisane, makieta w następnej paczce.
- Zlecenie 6 (PORTRETY ŻELAZA): czeka na arkusz od Macieja.
