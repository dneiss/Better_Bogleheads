#!/usr/bin/env python3
"""Resize an image for Chrome Web Store listing screenshots."""

import os

import click
from PIL import Image

SIZES = [
    (1280, 800),
    (640, 400),
]


@click.command()
@click.argument("input_file", type=click.Path(exists=True))
def resize(input_file):
    """Resize INPUT_FILE to Chrome Web Store screenshot sizes.

    Generates PNG and JPG at 1280x800 and 640x400 in the same directory.
    """
    img = Image.open(input_file)
    output_dir = os.path.dirname(os.path.abspath(input_file))

    for width, height in SIZES:
        resized = img.resize((width, height), Image.LANCZOS)
        base = f"screenshot_{width}x{height}"

        png_path = os.path.join(output_dir, f"{base}.png")
        resized.save(png_path)
        click.echo(f"Saved {png_path}")

        jpg_path = os.path.join(output_dir, f"{base}.jpg")
        resized.convert("RGB").save(jpg_path)
        click.echo(f"Saved {jpg_path}")


if __name__ == "__main__":
    resize()
