# DISPATCH R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1 (runda 1) — ROZPOZNANIE, tylko odczyt

STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: wypowiedzenie wojny przez gracza i zerwanie traktatu — rozpoznanie parytetu web ↔ Rust (CRED-HAK, zadanie #120/#171).
MODEL: Operator HAIKU 5.5; Obrona HAIKU 5.5; Evaluator SONNET 5.5; Final Control SONNET 5.5.

## ZASADA (CLAUDE.md zasada 11): NAJPIERW WEB
Wzorzec: pin `07d2fbd72`. Odczyt: `git show 07d2fbd72:gra/src/...`, `git grep -n ... 07d2fbd72 -- gra/src`.
Pytań do właściciela NIE zadajesz, o ile web rozstrzyga sprawę. Brak rozstrzygnięcia w webie = NIE_ZMIERZONO w raporcie.

## CEL
Mapa 1:1 ścieżki gracza z webu do Rust dla:
- `playerDeclareWarOnOwner` (web main.ts:13152–13185) — wypowiedzenie wojny przez gracza;
- `breakTreatyVoluntarily` (main.ts:22741) — dobrowolne zerwanie traktatu;
- `breakTreatiesOnWar` (main.ts:23688).

Dla każdego kroku funkcji webowej wskaż odpowiednik w Rust (plik:linia) LUB oznacz BRAK.
Znane z wcześniejszego rozpoznania (zweryfikować): w Rust BRAK (0 trafień w `rust-port/engine/src`):
`diplomacyLayerForOwner`, `playerDiplomacyActionAllowed`, `chargeWarDeclarationCredibility`, `applyAllianceObligationsOnWar`,
`pruneTributeNegotiationsBetween`, `recordWarDeclarationEvent`, `pruneInvalidNegotiations`, `applyDiploEventTracked`.
Obecne w Rust: `break_treaties_on_war` (diplomacy.rs:1690), `break_treaty_voluntarily` (diplomacy.rs:1708, część domenowa),
`voluntary_treaty_break_plan` (diplomacy.rs:4336), `zarejestruj_wypowiedzenie`, `przyczyna_wypowiedzenia`, `ma_casus_belli_aktywne`.

## BAZA
`origin/rust-port/parity-v2` = `a01363d5f`. Przed pracą: `git merge-base --is-ancestor a01363d5f HEAD`.

## ALLOWLISTA (tylko odczyt + raport)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1/**` (raport i dowody)
ZERO ZMIAN kodu, ZERO buildu. Nie commitować nic poza katalogiem runu.

## WYNIK (raport 01-rozpoznanie.md)
1. Tabela: krok webu (funkcja, plik:linia) → odpowiednik Rust (plik:linia) | BRAK | różnica.
2. Lista BRAKÓW z rekomendowanym zakresem dispatchu wdrożeniowego (nazwa, co dodać, pliki w allowliście silnika).
3. Lista punktów NIE_ZMIERZONO (co web robi, czego nie da się sprawdzić statycznie).
4. Wskazanie, które punkty web rozstrzyga jednoznacznie (bez pytania do właściciela) i które wymagają pytania ABC — z uzasadnieniem.

## PROCES
Operator → Evaluator → Final Control. Commit z jawnym `git add`. Commit bez nazwy modelu w treści; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. Bez push na parity.
