# Zasadzka

## Metadane

| id | `zasadzka` |
| tytuł | Zasadzka |
| kategoria | Jednostki i walka |
| poradnik_ref | Część X (Walka) |
| json_ref | — (reguła w kodzie: `gra/src/game/ambush.ts`) |

---

## Wiki‑S

**Zasadzka** to akcja armii poza miastem, **tylko z generałem** (bez generała w armii nie da się jej zastawić): zużywa **cały ruch** armii, a sama armia staje się **niewidoczna dla wrogów**. Wróg w wojnie z tobą, który wejdzie na jej heks, **zatrzymuje się** i wpada w bitwę. Poruszenie armii, odwołanie lub wyzwolenie kończy zasadzkę.

---

## Wiki‑M

### Jak zastawić
Wybierz armię i użyj akcji **Zasadzka** (obok „Czuwaj"). Akcja jest zablokowana — z powodem w podpowiedzi — gdy armia: **nie ma generała** („Zasadzkę może zastawić tylko armia z generałem”), jest w mieście, oblega, nie ma ruchu, jest w bitwie albo już stoi w zasadzce. Ta sama reguła dotyczy AI. Zastawienie zużywa całą pulę ruchu armii; odwołanie („Odwołaj zasadzkę") nic nie kosztuje.

### Co widzi wróg
- Armia w zasadzce **nie jest rysowana** wrogom i **nie zajmuje heksu** dla ich ruchu — AI i trasy wroga traktują heks jak pusty.
- Ty widzisz własną armię z wyraźnym oznaczeniem **„W zasadzce"**: oko na żetonie stosu na mapie, odznaka w karcie i panelu armii oraz zielona odznaka na liście armii.
- Zasadzka nie ujawnia wrogowi istnienia Twojej cywilizacji: sama ukryta armia nie otwiera audiencji pierwszego kontaktu, nie budzi czuwających jednostek i nie jest celem kliknięcia.
- Sojusznik i strona w pokoju nie wyzwalają zasadzki; heks pozostaje dla nich zajęty.

### Co się dzieje po wejściu wroga
Wróg będący w **wojnie** z właścicielem zasadzki (także **barbarzyńcy**, którzy są w wojnie ze wszystkimi), który wchodzi na jej heks, ma ruch **przerwany tuż przed nią** (także zaplanowany marsz) i zaczyna się bitwa. Zaskoczony widzi „Wpadłeś w zasadzkę!", zastawiający „Zasadzka się powiodła". Wróg stojący obok nie uruchamia zasadzki. Zasadzka trwa bez limitu tur, dopóki jej nie wyzwolisz, nie odwołasz ani nie ruszysz armii.

### Rozstawienie w bitwie z zasadzki
Bitwa z zasadzki otwiera się z własnym rozstawieniem (bez premii liczbowych — tylko geometria):
- **Zastawiający** (ty albo AI) rozstawia armię na **całym polu bitwy**, także na terenie wroga — to zaskoczenie. AI zastawiający ustawia się na skrzydłach i z tyłu linii zaskoczonych, bez nakładania jednostek.
- **Zaskoczeni** (strona, która wpadła w zasadzkę) rozstawiają się w **długiej linii o szerokości najwyżej 3 jednostek** w jednym szeregu poprzek pola. Konnica i rydwany stoją w tej linii, a nie na skrzydłach — nie da się ich ustawić dalej niż linia.
- Gdy zaskoczonym jest gracz, może przeciągać jednostki tylko w obrębie tej linii („Wpadłeś w zasadzkę — jednostki w długiej linii").
- Zwykła bitwa (bez zasadzki) rozstawia się jak dotąd.

### Kiedy zasadzka wygasa
Ruch armii, odwrót po bitwie, relokacja, wejście do miasta, zmiana właściciela, **utrata generała** (gdy w zastawionym stosie nie zostaje żaden generał, zasadzka wygasa dla całego stosu), **Czuwaj** lub **Ufortyfikuj** (zasadzka i czuwanie/fortyfikacja wykluczają się). **Podział** armii: część, która odeszła, traci zasadzkę, reszta zostaje. **Scalenie** z widoczną jednostką nie ujawnia reszty stosu: dołączona jednostka nie ma zasadzki, pozostałe ją zachowują.

### Strategia
Zastawiaj zasadzkę na przesmykach i drogach marszu wroga; pamiętaj, że po zastawieniu armia nie ma już ruchu w tej turze.

Powiązane: [[Czuwanie]] · [[Ruch i cios w bitwie]]
