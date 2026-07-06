# HANDOFF (DRAFT): MAPA → MASTER — POSTERUNKI (outpost / strażnica)

**Data:** 24.06.2026 · **Od:** Grupa A · **Status:** PROPOZYCJA — NIE wpinać przed akceptacją Macieja (decyzja projektowa Jego).
**Kontekst:** master deleguje do MAPA definicję „posterunków". Spina się to z regułą zakładania miast („w zasięgu miast LUB po **Strażnicy**") i z „drogi tylko między miastami + posterunkami".

## 1. Czym jest posterunek
Lekka placówka na heksie POZA miastem. To **nie miasto** (brak ludności-produkcji-kolejki). Pełni 3 role:
- **Węzeł sieci dróg** — drogi łączą miasta ↔ posterunki; posterunek przedłuża/rozgałęzia sieć poza pojedyncze miasto.
- **Przedłużenie zasięgu** — odblokowuje budowanie/zakładanie w swojej okolicy (realizacja „LUB po Strażnicy"). Mały promień kontroli (proponuję **1 heks**) → te heksy wchodzą do terytorium właściciela.
- **Kontrola/wizja** — odsłania mgłę w promieniu; może trzymać garnizon (1 jednostka) → obrona + widoczność.

## 2. Zakładanie (placement — lane MAPA)
- Z panelu budowania: klik na heks, **tylko w zasięgu sieci gracza** (terytorium miasta LUB istniejący posterunek) — żeby był „forward".
- **NIE** podlega regule miast ≥5. Min. odstęp posterunek↔posterunek: proponuję **≥2 heksy** (anty-spam).
- Nie na Morzu/Górach (nieprzejezdne). Na Wzgórzu = bonus wizji (opcja).

## 3. Stan na heksie + render (lane MAPA)
- Stan: `typ = POSTERUNEK` + `postęp budowy 0–100%`; po ukończeniu flaga „gotowy".
- Render: mała **strażnica** — drewniana wieża + ostrokół/palisada, wyraźnie mniejsza niż miasto L1. Wariant „w budowie" (rusztowanie) i „gotowy". Chorągiew w kolorze właściciela.

## 4. Cross-lane (NIE mój lane — do rozdziału przez mastera)
- **MIASTO/ekonomia:** koszt + utrzymanie (propozycja: tani jednorazowy w Produkcji/Pracy, rząd ~10–20% kosztu miasta; utrzymanie niskie/zerowe) + efekty/bonusy (zasięg kontroli, ew. bonus do dróg/handlu, wizja). Liczby = MIASTO.
- **Silnik/master:** przepływ w turze (praca → postęp zlecenia → ukończenie → flaga na heksie) + check granic przy placemencie.

## 5. Do potwierdzenia przez Macieja (decyzje projektowe)
1. Sposób zakładania: **panel budowania (klik) + praca miasta** [propozycja] vs jednostka (osadnik/robotnik)?
2. Czy posterunek jest bazą do **zakładania miast** (tak = spójne ze Strażnicą)? [propozycja: TAK]
3. Promień kontroli **1 heks** + min. odstęp **≥2**? [propozycja]
4. Poziom kosztu: tani jednorazowy [propozycja] — konkret ustala MIASTO.

> Po akceptacji Macieja: doprecyzuję render+placement u siebie, a master rozdzieli koszt/efekty do MIASTO i wepnie przepływ.
