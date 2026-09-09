"""Optional asset maintenance: python -m pip install fonttools brotli, then run this file.
Generate portable static TTFs for Satori from the existing OFL-licensed WOFF2 subsets.
The generated files are committed; Python is not needed to build or run the website.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

font_dir = Path(__file__).resolve().parents[1] / "public" / "fonts"
for subset in ("latin", "cyrillic"):
    font = TTFont(font_dir / f"manrope-{subset}.woff2")
    font = instantiateVariableFont(font, {"wght": 600}, inplace=True)
    font.flavor = None
    font.save(font_dir / f"manrope-{subset}-og.ttf")
