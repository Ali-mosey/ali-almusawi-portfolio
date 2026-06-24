#!/usr/bin/env python3
"""
Inspect an IDML template and emit a starter content.json.

Usage:
    python3 inspect_idml.py TEMPLATE.idml [-o content.json] [--map fieldmap.json]

What it does:
  * Lists every editable text story (id, applied style, current text).
  * Lists every image slot (graphic frame) with its size, in document order.
  * Writes a content.json scaffold you fill in:
      - "text": { story_id: "new text", ... }   (pre-filled with current text)
      - "images": [ { "frame": self_id, "file": "" }, ... ]
  * If --map is given (id -> human label), labels are added as comments/keys.

The content.json it produces is consumed by fill_idml.py.
"""
import argparse
import json
import os
import tempfile

import idml_lib as L


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("template")
    ap.add_argument("-o", "--out", default="content.json")
    ap.add_argument("--print", action="store_true", help="print summary only")
    args = ap.parse_args()

    work = tempfile.mkdtemp(prefix="idml_inspect_")
    L.unpack(args.template, work)

    text = {}
    text_meta = []
    for sp in L.story_files(work):
        sid = L.story_id(sp)
        txt = L.read_story_text(sp)
        if not txt:
            continue  # skip empty/structural stories
        pstyle, cstyle = L.applied_styles(sp)
        text[sid] = txt
        preview = (txt[:60] + "...") if len(txt) > 60 else txt
        text_meta.append({"id": sid, "style": pstyle, "preview": preview})

    frames = L.list_image_frames(work)
    images = [{"frame": f["self"], "file": ""} for f in frames]

    content = {
        "_README": "Edit 'text' values and set 'images[].file' to image paths. "
                   "Keys in 'text' are Story IDs; do not change them.",
        "text": text,
        "images": images,
    }

    print("== TEXT STORIES (%d editable) ==" % len(text_meta))
    for m in text_meta:
        print("  %-6s [%s] %s" % (m["id"], m["style"].split("/")[-1], m["preview"]))
    print("\n== IMAGE SLOTS (%d) ==" % len(frames))
    for f in frames:
        print("  %-6s %s  %.0f x %.0f pt  %s"
              % (f["self"], f["spread"], f["width"] or 0, f["height"] or 0,
                 "(filled)" if f["has_image"] else ""))

    if not args.print:
        with open(args.out, "w", encoding="utf-8") as fh:
            json.dump(content, fh, indent=2, ensure_ascii=False)
        print("\nWrote scaffold -> %s" % args.out)


if __name__ == "__main__":
    main()
