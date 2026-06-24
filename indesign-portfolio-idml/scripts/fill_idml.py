#!/usr/bin/env python3
"""
Fill an IDML template from a content.json and write a new .idml.

Usage:
    python3 fill_idml.py TEMPLATE.idml content.json -o OUTPUT.idml [--images-dir DIR]

content.json:
    {
      "text":   { "<story_id>": "new text (use \\n for line breaks)", ... },
      "images": [ { "frame": "<frame_self>", "file": "relative/or/abs.jpg" }, ... ]
    }

Notes:
  * Text replacement preserves the story's paragraph + character styles.
  * Images are embedded as links. Image paths are resolved against --images-dir
    (default: the folder containing content.json), then made absolute file: URIs.
  * Image fitting is "fill frame proportionally, centred". If a placed image
    looks slightly off in InDesign, select the frame and choose
    Object > Fitting > Fill Frame Proportionally to snap it.
  * Adding NEW project pages (beyond the slots already in the template) is NOT
    done here -- duplicate the spread/pages in InDesign first, then re-run.
"""
import argparse
import json
import os
import sys
import tempfile
import urllib.parse
import urllib.request

import idml_lib as L


def to_file_uri(path):
    return "file:" + urllib.request.pathname2url(os.path.abspath(path))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("template")
    ap.add_argument("content")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--images-dir", default=None)
    ap.add_argument("--strict", action="store_true",
                    help="error (not warn) on missing stories/frames/images")
    args = ap.parse_args()

    with open(args.content, encoding="utf-8") as f:
        content = json.load(f)
    images_dir = args.images_dir or os.path.dirname(os.path.abspath(args.content))

    work = tempfile.mkdtemp(prefix="idml_fill_")
    L.unpack(args.template, work)

    warnings = []

    # ---- text ----
    story_by_id = {L.story_id(p): p for p in L.story_files(work)}
    text = content.get("text", {})
    n_text = 0
    for sid, new_text in text.items():
        path = story_by_id.get(sid)
        if not path:
            warnings.append("text: unknown story id '%s'" % sid)
            continue
        L.set_story_text(path, new_text)
        n_text += 1

    # ---- images ----
    valid_frames = {f["self"] for f in L.list_image_frames(work)}
    n_img = 0
    for entry in content.get("images", []):
        frame = entry.get("frame")
        rel = (entry.get("file") or "").strip()
        if not rel:
            continue
        if frame not in valid_frames:
            warnings.append("image: unknown frame '%s'" % frame)
            continue
        img_path = rel if os.path.isabs(rel) else os.path.join(images_dir, rel)
        if not os.path.exists(img_path):
            warnings.append("image: file not found '%s'" % img_path)
            continue
        ok = L.place_image(work, frame, to_file_uri(img_path), img_path)
        if ok:
            n_img += 1
        else:
            warnings.append("image: failed to place into '%s'" % frame)

    L.repack(work, args.out)

    print("Filled %d text stories, placed %d images -> %s" % (n_text, n_img, args.out))
    for w in warnings:
        print("  WARN  " + w)
    if warnings and args.strict:
        sys.exit(1)


if __name__ == "__main__":
    main()
