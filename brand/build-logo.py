#!/usr/bin/env python3
"""Compone el logo de AWSpectrum en SVG a partir de los trazados de potrace.

El degradado del logo original es cónico —los centroides de los cinco colores de
marca describen un arco de ~255° alrededor del centro de la nube—, y SVG no tiene
degradados cónicos. Se reproduce con cuñas angulares recortadas por la silueta del
anillo: cada cuña lleva un degradado lineal entre los colores de sus dos bordes, de
modo que las mezclas sólo ocurren entre tonos vecinos y nunca aparecen grises.
"""

import math
import pathlib

DIR = pathlib.Path(__file__).parent / "logo"
OUT = pathlib.Path(__file__).parent / "out"
W, H = 2080, 1368

# Paradas de marca, verbatim del tailwind.config de awspectrum-latam.vercel.app
BRAND = [(0xEF, 0x44, 0x44), (0xF9, 0x73, 0x16), (0x22, 0xC5, 0x5E),
         (0x25, 0x63, 0xEB), (0x7C, 0x3A, 0xED)]
SMILE = "#FE4902"   # medido sobre el JPG original
EYES = "#1C1C1C"    # medido sobre el JPG original

# Geometría del barrido, medida sobre el original (ver arc.json)
ARC0, ARC1 = 150, 405          # tramo donde el color realmente cambia
SWEEP0, SWEEP1 = 100, 460      # tramo que hay que pintar para cubrir la silueta
STEP = 5                       # a 5° el bandeado es invisible
CX, CY = 0.52 * W, 0.60 * H
R_COLOR, R_WEDGE = 0.42 * W, 1.9 * W


def brand_at(t: float) -> str:
    """Color de marca interpolado en t ∈ [0,1], recortado en los extremos."""
    t = max(0.0, min(1.0, t)) * (len(BRAND) - 1)
    i = min(int(t), len(BRAND) - 2)
    f = t - i
    a, b = BRAND[i], BRAND[i + 1]
    return "#%02X%02X%02X" % tuple(round(a[k] + (b[k] - a[k]) * f) for k in range(3))


def wedges() -> tuple[str, str]:
    """Devuelve (defs, paths) del degradado cónico simulado."""
    defs, paths = [], []
    for n, d0 in enumerate(range(SWEEP0, SWEEP1, STEP)):
        d1 = d0 + STEP
        c0 = brand_at((d0 - ARC0) / (ARC1 - ARC0))
        c1 = brand_at((d1 - ARC0) / (ARC1 - ARC0))
        # Medio grado de solape a cada lado: evita costuras blancas entre cuñas.
        e0, e1 = math.radians(d0 - 0.6), math.radians(d1 + 0.6)
        px0, py0 = CX + R_WEDGE * math.cos(e0), CY + R_WEDGE * math.sin(e0)
        px1, py1 = CX + R_WEDGE * math.cos(e1), CY + R_WEDGE * math.sin(e1)
        shape = (f'M{CX:.0f} {CY:.0f}L{px0:.0f} {py0:.0f}'
                 f'A{R_WEDGE:.0f} {R_WEDGE:.0f} 0 0 1 {px1:.0f} {py1:.0f}Z')
        if c0 == c1:                      # fuera del arco el color es constante
            paths.append(f'<path fill="{c0}" d="{shape}"/>')
            continue
        a0, a1 = math.radians(d0), math.radians(d1)
        gx0, gy0 = CX + R_COLOR * math.cos(a0), CY + R_COLOR * math.sin(a0)
        gx1, gy1 = CX + R_COLOR * math.cos(a1), CY + R_COLOR * math.sin(a1)
        defs.append(
            f'<linearGradient id="w{n}" gradientUnits="userSpaceOnUse" '
            f'x1="{gx0:.0f}" y1="{gy0:.0f}" x2="{gx1:.0f}" y2="{gy1:.0f}">'
            f'<stop offset="0" stop-color="{c0}"/>'
            f'<stop offset="1" stop-color="{c1}"/></linearGradient>')
        paths.append(f'<path fill="url(#w{n})" d="{shape}"/>')
    return "".join(defs), "".join(paths)


def read(name: str) -> str:
    return (DIR / f"{name}.path").read_text().strip()


def build(*, uid: str, square: bool = False, inner: str = "#FFFFFF") -> str:
    """Genera el SVG.

    `uid` prefija los ids para poder inlinear varias copias sin que colisionen.
    `inner` rellena la nube interior: el logo original la deja transparente porque
    asume fondo blanco, y sobre el fondo oscuro del sitio la cara desaparecería.
    """
    ring, eyes, smile = read("ring"), read("eyes"), read("smile")
    inner_path = read("inner")
    defs, paths = wedges()
    defs = defs.replace('id="w', f'id="{uid}w')
    paths = paths.replace('url(#w', f'url(#{uid}w')
    # Cuadrado y centrado para el favicon; el original es apaisado 2080×1368.
    box = f'0 {-(W - H) / 2:.0f} {W} {W}' if square else f'0 0 {W} {H}'
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" '
        f'role="img" aria-label="AWSpectrum LATAM">'
        f'<defs>{defs}'
        f'<clipPath id="{uid}c"><path fill-rule="evenodd" d="{ring}"/></clipPath>'
        f'</defs>'
        f'<path fill="{inner}" fill-rule="evenodd" d="{inner_path}"/>'
        f'<g clip-path="url(#{uid}c)">{paths}</g>'
        f'<path fill="{SMILE}" fill-rule="evenodd" d="{smile}"/>'
        f'<path fill="{EYES}" fill-rule="evenodd" d="{eyes}"/>'
        f'</svg>')


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for name, kwargs in {
        "logo-mark": dict(uid="m"),
        "favicon": dict(uid="f", square=True),
    }.items():
        svg = build(**kwargs)
        (OUT / f"{name}.svg").write_text(svg)
        print(f"{name}.svg  {len(svg):>6} bytes")
