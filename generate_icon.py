from PIL import Image, ImageDraw
import os

ASSETS = os.path.join(os.path.dirname(__file__), "assets")

BG    = (30, 30, 30)       # #1E1E1E  dark background
WHITE = (255, 255, 255)


def draw_lines_on(img: Image.Image, size: int) -> None:
    """Draw the three descending white lines onto an existing image."""
    draw    = ImageDraw.Draw(img)
    line_x0 = int(size * 0.18)
    lengths = [0.64, 0.44, 0.26]          # long -> medium -> short
    line_h  = max(int(size * 0.10), 2)
    gap     = int(size * 0.16)

    total_h = line_h * 3 + gap * 2
    start_y = (size - total_h) // 2

    for i, frac in enumerate(lengths):
        y  = start_y + i * (line_h + gap)
        x1 = line_x0 + int(size * frac)
        draw.rounded_rectangle(
            [line_x0, y, x1, y + line_h],
            radius=line_h // 2,
            fill=WHITE,
        )


def make_full_icon(size: int) -> Image.Image:
    """Full icon: dark rounded-square background + white lines.
       Used for icon.png (iOS / notification icon / general fallback)."""
    img  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    r    = int(size * 0.18)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=BG)
    draw_lines_on(img, size)
    return img


def make_adaptive_foreground(size: int) -> Image.Image:
    """Android adaptive-icon foreground: transparent background + white lines.
       Android system supplies the background colour (#1E1E1E set in app.json).
       The safe zone for adaptive icons is the inner 66 % of the image."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_lines_on(img, size)
    return img


def save(img: Image.Image, path: str) -> None:
    img.save(path, "PNG")
    print(f"  saved -> {path}")


if __name__ == "__main__":
    # iOS / general icon  — full dark rounded square with lines
    save(make_full_icon(1024),           os.path.join(ASSETS, "icon.png"))

    # Android adaptive foreground — transparent bg, lines only
    # app.json sets backgroundColor: "#1E1E1E" so Android fills the bg
    save(make_adaptive_foreground(1024), os.path.join(ASSETS, "adaptive-icon.png"))

    # Web favicon — full icon, small size
    save(make_full_icon(64),             os.path.join(ASSETS, "favicon.png"))

    print("\nDone. Remember: set android.adaptiveIcon.backgroundColor to #1E1E1E in app.json")
