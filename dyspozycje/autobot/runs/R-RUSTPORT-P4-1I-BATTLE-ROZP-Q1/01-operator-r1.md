# 01 — Operator r1 — R-RUSTPORT-P4-1I-BATTLE-ROZP-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (DTO renderera, zdarzenia bitwy; rozpoznanie tylko do odczytu)
TEMAT: R-RUSTPORT-P4-1I-BATTLE-ROZP-Q1 (P4-1I / #218)
GOAL: rozpoznanie producenta zdarzeń bitwy (`BattleEventsDto`/snapshot) — co web wysyła do renderera bitwy (pin 07d2fbd72), co ma odpowiednik w Rust, luki, pola DTO, podział na wdrożenia.
BAZA: origin/rust-port/parity-v2 = c3e3617b2aaaede5f708d2c425b0222c4af78549 (stan przy starcie); gałąź robocza `op/R-RUSTPORT-P4-1I-BATTLE-ROZP-Q1`.
ZMIANY/COMMIT: dokument `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` (NOWY) + ten raport; zero zmian kodu; SHA = commit zawierający ten plik (podany w wyniku Operatora).
TESTY: NIE DOTYCZY (dokument, bez cargo). Sprawdzone: `git diff --cached --check`, allowlista (2 pliki).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO

## Kryteria końca
1. Tabela zdarzenie pinu (plik:linia) → dane → Rust (plik:linia) | BRAK | ROZBIEŻNE — §1 dokumentu, 30 wierszy.
2. Pola `BattleEventsDto` z wejściami z modelu bitwy — §2 (2a wynik, 2b stan po kroku, 2c akcje przejściowe).
3. Propozycja podziału na wdrożenia (nazwa, allowlista, wektory) — §4 (I1–I5); nic nie wdrożono.
4. Niepewne jako NIE_ZMIERZONO — §5.

## Najważniejsze ustalenia (uwagi do PASS-WITH-NOTES)
- Web NIE emituje zdarzeń bitwy: logika w `battleScene.ts` woła metody sceny bezpośrednio; grep z dispatchu nie znajduje emitera.
- `eventLog` (`BattleEventLog`, `units/battleRoster.ts:21-39`) to wyłącznie listy ID rosterów dla `post-battle-map.ts:96-113`, budowane raz w `onFinish` (`battleScene.ts:10724-10727`). Wpis `REJESTR-RUST.md:1534` łączy go z przebiegiem bitwy — to dwie różne rzeczy.
- Snapshot wg webu pokrywa wynik i paski; akcji przejściowych (pudło, lunge, lot pocisku, taran, kamień) nie da się odtworzyć z różnicy stanu → propozycja: snapshot + lista akcji w kroku (§5; decyzja techniczna orkiestratora, nie pytanie ABC).
- Kontrakt `P4-1-RENDER-DTO-CONTRACT.md` nie istnieje w drzewie bazy parity (jest w historii, `f2b246ff3`); czytany stamtąd.
