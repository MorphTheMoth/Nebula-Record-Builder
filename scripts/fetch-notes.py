#!/usr/bin/env python3
"""Download melody/sub-note icons to data/notes and crop their transparent border.

Sources: https://raw.githubusercontent.com/AutumnVN/ssassets/main/export/assets/assetbundles/icon/note/note_<id>_S.webp
Output:  data/notes/note_<id>_S.webp

The upstream note icons are 76x76 with transparent padding. Anti-aliased halo
pixels make each icon's raw alpha bounding box differ wildly, so trimming every
icon independently makes them look different sizes. Instead one shared square
crop box is computed from the union of the icons' real content (alpha above
ALPHA_THRESHOLD) and applied to every icon. Nothing is resized or stretched:
all output files are the same pixel size and every icon keeps its native scale.

The site loads these local files via noteImg() and falls back to the remote
ssassets icon if a local file is missing.

Usage:
  python3 scripts/fetch-notes.py              # download originals, crop
  python3 scripts/fetch-notes.py --check      # probe remote and report only
  python3 scripts/fetch-notes.py --size 54    # force output square size
  python3 scripts/fetch-notes.py --force      # rewrite outputs even if identical
"""
import argparse
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
OUT_DIR = ROOT / "data" / "notes"
BASE_ASSETS = "https://raw.githubusercontent.com/AutumnVN/ssassets/main/"
NOTE_PATH = "export/assets/assetbundles/icon/note/note_{id}_S.webp"

# Melody / sub-note ids (kept in sync with NOTE_IDS in js/data.js).
NOTE_IDS = [90011, 90012, 90013, 90014, 90015, 90016, 90017,
            90018, 90019, 90020, 90021, 90022, 90023]

# Alpha above this counts as real content; below it is anti-aliased halo noise.
ALPHA_THRESHOLD = 32
# Transparent border kept around the shared content box on every side.
PAD = 2


def fetch_exists(url, timeout=15):
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status == 200
    except urllib.error.HTTPError as e:
        return e.code != 404
    except Exception:
        return False


def download(url, dest: Path, timeout=30):
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "nebula-fetch-notes/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
        dest.write_bytes(data)
        return len(data)


def content_bbox(im, threshold=ALPHA_THRESHOLD):
    """Alpha bounding box ignoring near-transparent halo pixels."""
    alpha = im.split()[3]
    mask = alpha.point(lambda v: 255 if v > threshold else 0)
    return mask.getbbox()


def same_image(a, b):
    """True when two RGBA images match visually.

    WebP zeroes RGB under fully transparent pixels, so compare the alpha
    channel everywhere but RGB only where the pixel is actually visible.
    """
    if a.size != b.size:
        return False
    a = a.convert("RGBA").tobytes()
    b = b.convert("RGBA").tobytes()
    if a == b:
        return True
    for i in range(0, len(a), 4):
        if a[i + 3] != b[i + 3]:
            return False
        if a[i + 3] and a[i:i + 3] != b[i:i + 3]:
            return False
    return True


def main():
    ap = argparse.ArgumentParser(description="Download and crop melody note icons")
    ap.add_argument("--check", action="store_true", help="probe remote without downloading")
    ap.add_argument("--force", action="store_true", help="rewrite outputs even if identical")
    ap.add_argument("--size", type=int, default=None,
                    help="target square size (default: derived from the shared content box)")
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    try:
        from PIL import Image
    except ImportError:
        print("Pillow not installed: pip install Pillow", file=sys.stderr)
        return 1

    if args.check:
        found = 0
        for nid in NOTE_IDS:
            url = BASE_ASSETS + NOTE_PATH.format(id=nid)
            if fetch_exists(url):
                print(f"  note_{nid}_S.webp: exists at {url}")
                found += 1
            else:
                print(f"  note_{nid}_S.webp: MISSING at {url}")
        print(f"\nFound {found}/{len(NOTE_IDS)} note icons (probe only).")
        return 0

    print(f"Notes: {len(NOTE_IDS)} | out={OUT_DIR.relative_to(ROOT)}")

    with tempfile.TemporaryDirectory(prefix="nrb-notes-") as tmp:
        tmp_dir = Path(tmp)

        # 1) Always (re)fetch the pristine originals so we can re-crop cleanly.
        originals = {}
        images = {}
        for nid in NOTE_IDS:
            url = BASE_ASSETS + NOTE_PATH.format(id=nid)
            dest = tmp_dir / f"note_{nid}_S.webp"
            try:
                size = download(url, dest)
            except urllib.error.HTTPError as e:
                print(f"  note_{nid}_S.webp: HTTP {e.code}", file=sys.stderr)
                continue
            except Exception as exc:
                print(f"  note_{nid}_S.webp: download failed: {exc}", file=sys.stderr)
                continue
            try:
                images[nid] = Image.open(dest).convert("RGBA")
            except Exception as exc:
                print(f"  note_{nid}_S.webp: not an image: {exc}", file=sys.stderr)
                continue
            originals[nid] = size

        if not images:
            print("No note icons downloaded; nothing to crop.", file=sys.stderr)
            return 1

        # 2) One shared crop box for every icon, derived from the union of
        #    their real content. Same box -> same output size, native scale.
        min_l = min_t = 10 ** 9
        max_r = max_b = -1
        for nid, im in images.items():
            bbox = content_bbox(im)
            if not bbox:
                print(f"  note_{nid}_S.webp: fully transparent, skipped", file=sys.stderr)
                continue
            min_l = min(min_l, bbox[0])
            min_t = min(min_t, bbox[1])
            max_r = max(max_r, bbox[2])
            max_b = max(max_b, bbox[3])

        if max_r < 0:
            print("No note content found; nothing to crop.", file=sys.stderr)
            return 1

        union_w, union_h = max_r - min_l, max_b - min_t
        canvases = {im.size for im in images.values()}
        if len(canvases) != 1:
            print(f"Warning: mixed source sizes {sorted(canvases)}", file=sys.stderr)
        canvas_w, canvas_h = max(canvases, key=lambda s: s[0] * s[1])

        side = args.size or max(union_w, union_h) + 2 * PAD
        side = max(1, min(side, canvas_w, canvas_h))
        cx = (min_l + max_r) // 2
        cy = (min_t + max_b) // 2
        left = max(0, min(cx - side // 2, canvas_w - side))
        top = max(0, min(cy - side // 2, canvas_h - side))
        box = (left, top, left + side, top + side)
        print(f"Shared content {union_w}x{union_h} -> crop box {box} ({side}x{side}), no resize")

        # 3) Apply the exact same crop to every icon (no stretching).
        written = unchanged = 0
        for nid in NOTE_IDS:
            im = images.get(nid)
            if im is None:
                continue
            cropped = im.crop(box)
            out = OUT_DIR / f"note_{nid}_S.webp"

            if out.exists() and not args.force:
                try:
                    with Image.open(out) as existing:
                        if same_image(existing, cropped):
                            unchanged += 1
                            continue
                except Exception:
                    pass

            cropped.save(out, "WEBP", lossless=True, method=6)
            written += 1

    print(f"\nDone: {written} written, {unchanged} unchanged -> {OUT_DIR.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
