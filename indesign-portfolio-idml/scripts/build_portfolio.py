#!/usr/bin/env python3
"""
Build a filled portfolio .idml from a PROJECT-BASED projects.json.

This is the high-level entry point. Instead of low-level Story IDs, you describe
each project with a hero image, other images, a description, etc. The script
uses a template profile (reference/template-profile.json) to know which Story
and image-frame each field maps to.

Usage:
    python3 build_portfolio.py TEMPLATE.idml projects.json -o OUTPUT.idml \
        [--profile reference/template-profile.json] [--images-dir DIR]

projects.json shape (every field optional -- omit to leave the template as-is):
{
  "cover":   { "title": "Portfolio", "subtitle": "...", "hero_image": "cover.jpg" },
  "contact": "ali-mosey@hotmail.com\\n0469798091",
  "projects": {
    "A": {
      "title": "Riverside Cultural Centre",
      "subtitle": "Sydney\\n2025",
      "description": "Long paragraph...",
      "captions": ["caption 1", "caption 2"],
      "hero_image": "a/hero.jpg",
      "images": ["a/01.jpg", "a/02.jpg"],
      "thumbnail": "a/thumb.jpg"          // optional; defaults to hero_image
    },
    "B": { ... }, "C": { ... }, "D": { ... }
  }
}

Image paths resolve against --images-dir (default: the projects.json folder) or
may be absolute. Fitting is fill-proportional, centred.
"""
import argparse
import json
import os
import sys
import urllib.request

import idml_lib as L

DEFAULT_PROFILE = os.path.join(os.path.dirname(__file__),
                               "..", "reference", "template-profile.json")


def to_file_uri(path):
    return "file:" + urllib.request.pathname2url(os.path.abspath(path))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("template")
    ap.add_argument("projects")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--profile", default=DEFAULT_PROFILE)
    ap.add_argument("--images-dir", default=None)
    ap.add_argument("--strict", action="store_true")
    args = ap.parse_args()

    profile = json.load(open(args.profile, encoding="utf-8"))
    data = json.load(open(args.projects, encoding="utf-8"))
    images_dir = args.images_dir or os.path.dirname(os.path.abspath(args.projects))

    import tempfile
    work = tempfile.mkdtemp(prefix="idml_build_")
    L.unpack(args.template, work)

    story_by_id = {L.story_id(p): p for p in L.story_files(work)}
    valid_frames = {f["self"] for f in L.list_image_frames(work)}
    warn = []
    n_text = n_img = 0

    def set_text(story_id, value):
        nonlocal n_text
        if not story_id or value is None:
            return
        p = story_by_id.get(story_id)
        if not p:
            warn.append("missing story %s" % story_id); return
        L.set_story_text(p, str(value))
        n_text += 1

    def place(frame, rel):
        nonlocal n_img
        if not frame or not rel:
            return
        if frame not in valid_frames:
            warn.append("missing frame %s" % frame); return
        path = rel if os.path.isabs(rel) else os.path.join(images_dir, rel)
        if not os.path.exists(path):
            warn.append("image not found: %s" % path); return
        if L.place_image(work, frame, to_file_uri(path), path):
            n_img += 1
        else:
            warn.append("could not place into %s" % frame)

    # ---- cover ----
    cover = data.get("cover", {})
    cp = profile.get("cover", {})
    set_text(cp.get("title_story"), cover.get("title"))
    set_text(cp.get("subtitle_story"), cover.get("subtitle"))
    place(cp.get("hero_frame"), cover.get("hero_image"))

    # ---- contact ----
    if "contact" in data:
        set_text(profile.get("contact", {}).get("story"), data["contact"])

    # ---- projects ----
    prof_projects = profile.get("projects", {})
    contents = profile.get("contents", {})
    thumb_frames = contents.get("thumb_frames", {})
    label_by_project = {e["project"]: e for e in contents.get("entries", [])}

    for key, proj in data.get("projects", {}).items():
        pp = prof_projects.get(key)
        if not pp:
            warn.append("unknown project key '%s' (profile has %s)"
                        % (key, ",".join(prof_projects))); continue
        set_text(pp.get("title_story"), proj.get("title"))
        set_text(pp.get("subtitle_story"), proj.get("subtitle"))
        set_text(pp.get("body_story"), proj.get("description"))

        # captions: zip provided captions onto the caption stories in order
        caps = proj.get("captions", []) or []
        for sid, cap in zip(pp.get("caption_stories", []), caps):
            set_text(sid, cap)

        # hero + other images
        place(pp.get("hero_frame"), proj.get("hero_image"))
        for frame, img in zip(pp.get("image_frames", []), proj.get("images", []) or []):
            place(frame, img)

        # contents page: label + thumbnail
        if proj.get("title") and key in label_by_project:
            set_text(label_by_project[key].get("label_story"), proj["title"])
        thumb = proj.get("thumbnail") or proj.get("hero_image")
        if thumb and key in thumb_frames:
            place(thumb_frames[key], thumb)

    L.repack(work, args.out)
    print("Built %s  (%d text fields, %d images)" % (args.out, n_text, n_img))
    for w in warn:
        print("  WARN  " + w)
    if warn and args.strict:
        sys.exit(1)


if __name__ == "__main__":
    main()
