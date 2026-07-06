# DYSPOZYCJA: „Test wydajności" — analizator sprzętowo-programowy dla gracza (pomysł Macieja 2026-07-05)

Cel: przycisk **„Test wydajności"** w menu głównym. Gracz klika → gra sprawdza jego sprzęt
i przeglądarkę → wypluwa czytelny raport PL („działa / popraw / włącz") + JEDNYM KLIKIEM
ustawia zalecane opcje. Gra ma się sama dostosować do słabszych maszyn (nie każdy ma 16 wątków
i RTX-a). Batch 7 — niezależny od 4-6, może iść równolegle (dotyka menu/UI, nie silnika mapy).

## 1. Wykrywanie (bez benchmarku, natychmiast, standardowe API)
- GPU: nazwa karty (`WEBGL_debug_renderer_info` → UNMASKED_RENDERER), WebGL2 tak/nie,
  WebGPU tak/nie, maxTextureSize.
- **Renderowanie programowe (najważniejszy czerwony alarm):** renderer zawiera
  „SwiftShader" / „Software" / „Basic Render" → komunikat: „Gra działa na procesorze zamiast
  karty graficznej — włącz akcelerację sprzętową: chrome://settings/system".
- CPU: `navigator.hardwareConcurrency` (liczba wątków).
- RAM: `navigator.deviceMemory` (przybliżenie; brak API → „nieznane").
- Ekran: rozdzielczość, devicePixelRatio, częstotliwość (pomiar z requestAnimationFrame ~1 s).
- Web Workery: test faktycznego startu workera (spawn + echo < 500 ms).
- Wersja builda gry (stempel z zasad stałych) — do zgłoszeń błędów.

## 2. Mikro-benchmark (~10-15 s, pasek postępu, można przerwać)
- CPU 1 wątek: generacja mapy „malenki" (76×52, stały seed 42) w workerze — czas.
- CPU wiele wątków: 4 takie generacje równolegle — skala przyspieszenia (wykrywa throttling).
- GPU: scena testowa Three.js (stała liczba instancji hex, offscreen) — średni frame time / FPS.
- Wyniki mapowane na klasy: MOCNY / ŚREDNI / SŁABY (progi zapisać w jednym miejscu, łatwe strojenie).

## 3. Raport dla gracza (prosty język, trzy kolory)
Każda pozycja: ✅ OK / ⚠️ do poprawy / ❌ problem + JEDNO zdanie co zrobić, np.:
- ❌ „Renderowanie programowe — włącz akcelerację sprzętową w ustawieniach Chrome i zrestartuj."
- ⚠️ „4 wątki CPU — zalecany rozmiar mapy: Standardowy. Super Huge będzie generować się kilka minut."
- ⚠️ „Wykryto kartę zintegrowaną — w Windows: Ustawienia→System→Ekran→Grafika → Chrome → Wysoka wydajność."
- ✅ „WebGL na NVIDIA RTX 5070 — pełna moc."
Przycisk **„Kopiuj raport"** (tekst do schowka — idealne do zgłoszeń błędów od testerów).

## 4. Auto-preset „Zastosuj zalecane" (sedno pomysłu Macieja)
Na podstawie klas sprzętu proponuje i jednym klikiem zapisuje:
- jakość renderu (Niska/Średnia/Wysoka) i gęstość dekoracji,
- maks. zalecany rozmiar mapy w kreatorze (podświetlenie/ostrzeżenie przy większych),
- limit workerów: `min(max(1, hardwareConcurrency - 2), 4)` — NIGDZIE w kodzie nie zakładać
  16 wątków; wszystkie przyszłe pule (Batch 6: AI/pathfinding, H2: szum) mają czytać ten limit
  z jednego modułu `src/perf/hardwareProfile.ts` + fallback sync gdy workery niedostępne,
- zapis profilu (localStorage) + możliwość ponownego testu w każdej chwili.

## 4b. KALIBRACJA PROGÓW (dane wzorcowe z maszyny Macieja, 2026-07-05)
Panel działa end-to-end, ale klasyfikacja jest ŹLE skalibrowana: wynik
`CPU 1w: 614 ms · 4 równolegle: 768 ms (skala ×3.2) · GPU: 0.1 ms/klatkę` na
RTX 5070 + 16 wątków dał klasę **ŚREDNI** (a detekcja natychmiastowa dawała MOCNY)
i obniżył zalecenia do „Średnia/Ogromny". Poprawka w `HW_THRESHOLDS`:
- Ten zestaw wyników = wyraźny **MOCNY** (kalibracja: MOCNY gdy CPU1w ≤ ~900 ms
  ORAZ GPU ≤ ~4 ms/klatkę; SŁABY gdy CPU1w ≥ ~2500 ms LUB GPU ≥ ~12 ms LUB
  software-rendering; reszta ŚREDNI — progi do 1 iteracji strojenia).
- Klasa z benchmarku nie może być NIŻSZA niż z detekcji bez wyraźnego powodu
  (dodać log który próg zdecydował — pokazywać w raporcie „Kopiuj").
Wykonać przy najbliższym przelocie subagenta (razem z B0.8b/B0.10).

## 5. Kryteria akceptacji
1. Pełny raport < 20 s; działa też na słabym sprzęcie (benchmark się nie wiesza — timeouty).
2. Test z wymuszonym software-rendering (chrome://settings → wyłącz akcelerację) daje ❌ z instrukcją.
3. „Zastosuj zalecane" realnie zmienia ustawienia gry i zapamiętuje je między sesjami.
4. Moduł `hardwareProfile.ts` używany przez workery generacji (i przyszłe pule z Batch 6).
5. Zero wpływu na determinizm map i zero kosztu, gdy gracz nie uruchomi testu.
6. `tsc --noEmit`=0, strażnik publishu, stempel wersji — zasady stałe z master-planu.
