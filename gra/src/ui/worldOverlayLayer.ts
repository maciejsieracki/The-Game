/**
 * R-WEB-SIEGE-BADGE-ZORDER-Q1: wspolna warstwa HTML-nakladek SWIATA (przyklejonych do hexow mapy,
 * np. plakietka "OBLEZENIE"). Musi lezec NAD kanwa 3D, ale POD kazdym elementem interfejsu.
 * Najnizszy z-index UI w grze to winieta `.civ-ux-dim-full` (298), potem panele (305+), HUD (310+),
 * toasty (320+), modale (400+). Nakladka swiata < 298, wiec nigdy nie "przebija" paneli/okien.
 * EN: shared layer for map-anchored HTML overlays; above the 3D canvas, below all UI.
 */
export const WORLD_OVERLAY_Z_INDEX = 250;
