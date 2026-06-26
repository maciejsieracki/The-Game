# HANDOFF (DRAFT): MAPA → MASTER — ULEPSZENIA TERENU + bonusy

**Data:** 24.06.2026 · **Od:** Civ-MAPA · **Status:** PROPOZYCJA (lista do akceptacji Macieja).
**Podział:** MAPA = GDZIE wolno (teren/zasób + ograniczenia) + render + stan na heksie. MIASTO/ekonomia = KONKRETNE liczby bonusów + koszt w Produkcji. Silnik/master = przepływ tury.

## ZASADA KLUCZOWA (Maciej)
**Irygacja TYLKO na heksie bezpośrednio przylegającym do RZEKI.** Brak łańcuchowania irygacji przez pola nieprzylegające do rzeki (jak w innych Civ). Gdzie nie ma rzeki → **Farma** (słabszy +Żywność).

## Lista ulepszeń
| Ulepszenie | Gdzie wolno (ograniczenie placementu — MAPA) | Główny bonus dla miasta (kierunek — liczby = MIASTO) |
|---|---|---|
| **Farma** | Łąka / Równina (gleby uprawne). Bez wymogu rzeki. | +Żywność (podstawowy) |
| **Irygacja** | Łąka / Równina / **Pustynia** — ale TYLKO heks sąsiadujący z Rzeką. | +Żywność (większy niż Farma); kluczowa nad Nilem |
| **Pastwisko / Zagroda** | zasób zwierzęcy: Koń / Krowa / Owca / Lama (Łąka/Równina/Wzgórza) | +Żywność/+Produkcja; **odblokowuje zasób** (Konie → rydwany/kawaleria) |
| **Kopalnia** | Wzgórza / Góry, oraz złoże **Rudy** | +Produkcja; **odblokowuje metal** (miedź/brąz → jednostki, mury) |
| **Glinianka** | złoże **Gliny** | +Produkcja/budulec (cegła — istotne w epoce brązu) |
| **Kamieniołom** | Wzgórza/Góry ze złożem kamienia | +Produkcja/budulec (mury, budynki) |
| **Obóz łowiecki** | zasób dzikiej zwierzyny / Las | +Żywność/+Pieniądz |
| **Wyrąb (obóz leśny)** | Las | +Produkcja (drewno) |
| **Tarasy uprawne** | Wzgórza (kulturowe — Inkowie) | +Żywność na wzgórzach |
| **Łodzie rybackie** | Wybrzeże/Morze z rybami (jeśli morskie w zakresie) | +Żywność |
| **Droga** | każdy heks przejezdny; łączy TYLKO miasta + posterunki | +Ruch, +Handel (połączenie ekonomiczne) |
| **Posterunek** | patrz osobny handoff (węzeł dróg + zasięg) | wizja/kontrola; nie produkuje |

## Dodatkowe bonusy (czego miasto „używa")
- **+Żywność** → wzrost ludności / nowych wiosek (ekspansja).
- **+Produkcja (Praca)** → szybsze budowanie zleceń.
- **+Pieniądz** → skarbiec/ekonomia.
- **Zasób strategiczny odblokowany** → Konie (rydwany/kawaleria), Miedź/Brąz (jednostki+mury), Kamień (mury/budynki), Glina (cegła).
- **+Nauka/+Kultura** → opcjonalnie, jeśli model ekonomii to przewiduje (decyzja MIASTO/ekonomia).
- **Droga** → premia do ruchu i handlu między połączonymi miastami/posterunkami.

## Reguły wspólne (propozycja)
- **1 ulepszenie / heks** (Droga może nakładać się na inne). 
- Ulepszenie buduje się tylko w **granicach/zasięgu miasta** (panel budowania blokuje poza granicą).
- Stan na heksie (MAPA): `typ ulepszenia` + `postęp 0–100%`; po ukończeniu flaga „gotowe" (wpina master).

## Do potwierdzenia (Maciej)
1. Czy Łodzie rybackie / morskie ulepszenia są teraz w zakresie, czy później?
2. Czy Kamieniołom osobno, czy scalony z Kopalnią?
3. Czy +Nauka/+Kultura w grze (wpływa na Tarasy/niektóre ulepszenia)?
