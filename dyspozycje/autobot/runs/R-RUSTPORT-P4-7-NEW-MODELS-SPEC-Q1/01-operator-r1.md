STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-7-NEW-MODELS-SPEC-Q1
GOAL: Specyfikacja nowych modeli 3D po decyzjach D-MOD-3=B, D-MOD-4=C, D-MOD-5=B, D-MOD-9=A: lista brakujących modeli z dowodem, kanon stylu z liczbami, karty nowych modeli z kryteriami akceptacji, porty „nieużywanych”, reguła modelu jednostki, wycena z paczkami, D-NM-n.
ZMIANY/COMMIT: dyspozycje/rust-port/p4/P4-7-NEW-MODELS-SPEC.md (NOWY); dyspozycje/autobot/runs/R-RUSTPORT-P4-7-NEW-MODELS-SPEC-Q1/{01-operator-r1.md, skrypty/{run_measure.py,measure.ts,three-mock.js}, wyniki/{measure.txt,loc.txt}}. Zero zmian w gra/**, rust-port/**, src-tauri/**, innych dokumentach. SHA: commit Operatora w worktree (bez push).
TESTY: python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-7-NEW-MODELS-SPEC-Q1/skrypty/run_measure.py → EXIT=0; walidacja mocka: zmierzone tri 30 konfiguracji miast = wartości zapisane w kodzie (MIASTO_KAMIEN_LAYOUT/MIASTO_BRAZ_LAYOUT), mur +324/+344 = deklarowane. git diff --cached --check → brak wyjścia (czysto). Kontrola tabel Markdown (liczba kolumn) → 0 rozjazdów. Brak buildu, npm, uruchamiania weba.
BLOKADY: brak. Ograniczenia jawne w §7 dokumentu (NIE_ZMIERZONO: koszt nakładki Żelaza 0,5 J, dni, podkatalogi P4.6, epoka buildCrossbowman, wygląd kart — brak renderu).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium) → Final Control → integracja orkiestratora; równolegle pytania właściciela D-NM-1..15 (§6).
DEPLOY/PUSH: NIE WYKONANO

Kluczowe liczby: 37 osiągalnych kombinacji państwo×epoka, 27 na fallbacku (12 Brąz + 15 Żelazo); rekomendacja B = 8 zestawów Brązu + 10 nakładek Żelaza (≈13 J; 1 J ≈ 300 linii TS, zmierzone 299/308); budżet miasta L1..L10 = 207..1087 tri / 17..86 mesh; mur ≤ 368 tri; cud parkowany ≤ 320 tri / ≤ 25 mesh (5 kart: 68–276 tri); 11 portów „nieużywanych”; tabela UnitTypeId→ModelId (77) usuwa 3 rozjazdy bitwy; 10 paczek NM-00..09 (9 z oceną wizualną właściciela).
