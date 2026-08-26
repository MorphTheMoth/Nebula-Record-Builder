#!/usr/bin/env python3
"""Download character head _XL images to data/heads and trim blank spaces.

Sources: https://raw.githubusercontent.com/AutumnVN/ssassets/main/export/assets/assetbundles/icon/head/head_<id><variant>_XL.webp
Output:  data/heads/head_<id><variant>_XL.webp  (trimmed)

Trimming removes fully/near-transparent borders (alpha <= threshold) so the
site can use tighter portraits.

Usage:
  python3 scripts/fetch-heads.py              # download all chars, trim
  python3 scripts/fetch-heads.py --no-trim    # download only
  python3 scripts/fetch-heads.py --check      # probe remote and report without downloading
  python3 scripts/fetch-heads.py --char 103   # only that char
  python3 scripts/fetch-heads.py --threshold 15
"""
import argparse
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
DATA_JSON = ROOT / "data" / "character.json"
OUT_DIR = ROOT / "data" / "heads"
BASE_ASSETS = "https://raw.githubusercontent.com/AutumnVN/ssassets/main/"

DEFAULT_THRESHOLD = 10
MAX_VARIANT = 20


def fetch_exists(url, timeout=15):
    """Check if remote webp exists via HEAD/GET range."""
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status == 200
    except Exception:
        # fallback to GET with small range check
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=timeout) as r:
                # peek first byte
                r.read(1)
                return True
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return False
            return False
        except Exception:
            return False


def download(url, dest: Path, timeout=30):
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "nebula-fetch-heads/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
        dest.write_bytes(data)
        return len(data)


def trim_image(path: Path, threshold=DEFAULT_THRESHOLD, verbose=False):
    """Crop near-transparent borders (alpha <= threshold). Returns (orig_size, new_size, trimmed)."""
    try:
        from PIL import Image
    except ImportError:
        print("Pillow not installed: pip install Pillow", file=sys.stderr)
        return None

    try:
        im = Image.open(path).convert("RGBA")
    except Exception as exc:
        print(f"  trim failed {path.name}: {exc}", file=sys.stderr)
        return None

    w, h = im.size
    alpha = im.split()[3]

    # Build mask where alpha > threshold, then get bbox
    mask = alpha.point(lambda p: 255 if p > threshold else 0)
    bbox = mask.getbbox()

    if not bbox:
        # fully transparent? keep original
        if verbose:
            print(f"  {path.name}: fully transparent, skip trim")
        return (w, h, w, h, False)

    # bbox is (left, upper, right, lower)
    left, upper, right, lower = bbox
    new_w, new_h = right - left, lower - upper

    # Only trim if we actually remove >= 2px border on any side (avoid tiny crops from artifacts)
    if left == 0 and upper == 0 and right == w and lower == h:
        if verbose:
            print(f"  {path.name}: no trim needed {w}x{h}")
        return (w, h, w, h, False)

    # Skip degenerate crops (too small)
    if new_w < 10 or new_h < 10:
        if verbose:
            print(f"  {path.name}: bbox too small {new_w}x{new_h}, skip")
        return (w, h, w, h, False)

    trimmed = im.crop(bbox)
    # Save as WEBP, preserve transparency, keep file size reasonable
    # Use lossless=False for smaller size; quality 90
    try:
        trimmed.save(path, "WEBP", quality=90, method=4)
    except Exception:
        # fallback to PNG if webp save fails
        trimmed.save(path, "PNG")

    if verbose:
        print(f"  {path.name}: {w}x{h} -> {new_w}x{new_h} (trimmed)")

    return (w, h, new_w, new_h, True)


def discover_char_ids(filter_id=None):
    if filter_id:
        return [str(filter_id)]
    if not DATA_JSON.exists():
        print(f"missing {DATA_JSON}", file=sys.stderr)
        return []
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    return sorted(data.keys(), key=lambda x: int(x) if x.isdigit() else x)


def main():
    ap = argparse.ArgumentParser(description="Download and trim _XL head images")
    ap.add_argument("--check", action="store_true", help="probe remote without downloading")
    ap.add_argument("--no-trim", action="store_true", help="skip trimming step")
    ap.add_argument("--threshold", type=int, default=DEFAULT_THRESHOLD, help="alpha threshold for trim (0-255, default 10)")
    ap.add_argument("--char", dest="char_filter", help="only process this charId")
    ap.add_argument("--max-variant", type=int, default=MAX_VARIANT, help="max variant number to probe")
    ap.add_argument("--force", action="store_true", help="re-download even if file exists")
    args = ap.parse_args()

    char_ids = discover_char_ids(args.char_filter)
    if not char_ids:
        print("no char ids found", file=sys.stderr)
        sys.exit(1)

    print(f"Characters: {len(char_ids)} | threshold={args.threshold} | out={OUT_DIR}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    total_found = 0
    total_downloaded = 0
    total_trimmed = 0
    total_bytes = 0

    for char_id in char_ids:
        for vnum in range(1, args.max_variant + 1):
            variant = f"{vnum:02d}"
            filename = f"head_{char_id}{variant}_XL.webp"
            url = f"{BASE_ASSETS}export/assets/assetbundles/icon/head/head_{char_id}{variant}_XL.webp"
            dest = OUT_DIR / filename

            # Probe existence
            if args.check:
                exists = fetch_exists(url)
                if exists:
                    print(f"  {filename}: exists at {url}")
                    total_found += 1
                else:
                    # first 404 -> assume no more variants for this char (like getAvailableHeadVariants)
                    if vnum == 1:
                        print(f"  {char_id}: no variants found")
                    break
                continue

            # Skip if already exists and not forced (cheap on re-runs)
            if dest.exists() and dest.stat().st_size > 0 and not args.force:
                total_found += 1
                if not args.no_trim:
                    # ensure existing file is trimmed (idempotent)
                    res = trim_image(dest, threshold=args.threshold)
                    if res and res[4]:
                        total_trimmed += 1
                        print(f"  {filename}: exists, re-trimmed -> {dest.relative_to(ROOT)}")
                continue

            # Normal mode: try download, break on first 404 (consistent with JS loop)
            try:
                size = download(url, dest)
                total_found += 1
                total_downloaded += 1
                total_bytes += size
                print(f"  {filename}: {size/1024:.0f} KB -> {dest.relative_to(ROOT)}")
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    if dest.exists() and dest.stat().st_size == 0:
                        dest.unlink(missing_ok=True)
                    if vnum == 1:
                        print(f"  {char_id}: no _XL variants (404)")
                    break
                else:
                    print(f"  {filename}: HTTP {e.code} {e}", file=sys.stderr)
                    break
            except Exception as exc:
                print(f"  {filename}: download failed: {exc}", file=sys.stderr)
                break

            # Trim after download
            if not args.no_trim:
                res = trim_image(dest, threshold=args.threshold)
                if res and res[4]:
                    total_trimmed += 1

    if args.check:
        print(f"\nFound {total_found} _XL images (probe only).")
        return

    print(f"\nDone: found {total_found}, downloaded {total_downloaded} ({total_bytes/1024:.0f} KB), trimmed {total_trimmed} images -> {OUT_DIR.relative_to(ROOT)}")
    if total_trimmed:
        print(f"Trim threshold: {args.threshold} (alpha > threshold kept)")

    # Write a small manifest for the site to know what's available (optional)
    manifest = {}
    for f in sorted(OUT_DIR.glob("head_*_XL.webp")):
        # head_10302_XL.webp -> charId=103 variant=02
        name = f.stem  # head_10302_XL
        try:
            # parse charId and variant
            # format head_<charId><variant>_XL
            core = name.replace("head_", "").replace("_XL", "")  # e.g., "10302"
            # variant is last 2 chars
            variant = core[-2:]
            char_id = core[:-2]
            manifest.setdefault(char_id, []).append(variant)
        except Exception:
            continue
    for k in manifest:
        manifest[k] = sorted(manifest[k])
    manifest_path = OUT_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Manifest written: {manifest_path.relative_to(ROOT)} ({len(manifest)} chars)")


if __name__ == "__main__":
    main()
