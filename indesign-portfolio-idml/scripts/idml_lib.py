"""
Shared helpers for reading/writing InDesign IDML packages.

An IDML file is a ZIP archive of XML parts. This module avoids a full XML DOM
rewrite (which reorders attributes and can upset InDesign). Instead it does
targeted, structure-preserving edits:

  * Text  -> rewrite the <Content>/<Br/> run inside a Story's FIRST
             CharacterStyleRange, keeping applied paragraph + character styles.
  * Image -> inject an <Image> (with <Link>) into an empty GraphicType
             <Rectangle>, fitted "fill proportionally" and centred.

Nothing here requires InDesign to be installed.
"""

import os
import re
import shutil
import zipfile
import html
from xml.sax.saxutils import escape


# --------------------------------------------------------------------------
# ZIP / package handling
# --------------------------------------------------------------------------

def unpack(idml_path, dest_dir):
    """Extract an .idml into dest_dir (cleared first), made writable."""
    if os.path.exists(dest_dir):
        _force_rmtree(dest_dir)
    os.makedirs(dest_dir)
    with zipfile.ZipFile(idml_path) as z:
        z.extractall(dest_dir)
    # Uploaded templates may be read-only; make the working copy writable.
    for root, dirs, files in os.walk(dest_dir):
        for d in dirs:
            try:
                os.chmod(os.path.join(root, d), 0o755)
            except OSError:
                pass
        for fn in files:
            try:
                os.chmod(os.path.join(root, fn), 0o644)
            except OSError:
                pass
    return dest_dir


def _force_rmtree(path):
    def onerr(func, p, exc):
        try:
            os.chmod(p, 0o700)
            func(p)
        except OSError:
            pass
    shutil.rmtree(path, onerror=onerr)


def repack(src_dir, out_idml):
    """
    Re-zip an unpacked IDML directory into a valid .idml. 'mimetype' MUST be the
    first entry and stored uncompressed, or InDesign rejects the file.
    """
    if os.path.exists(out_idml):
        os.remove(out_idml)
    mimetype_path = os.path.join(src_dir, "mimetype")
    with zipfile.ZipFile(out_idml, "w", zipfile.ZIP_DEFLATED) as z:
        if os.path.exists(mimetype_path):
            z.write(mimetype_path, "mimetype", compress_type=zipfile.ZIP_STORED)
        for root, _dirs, files in os.walk(src_dir):
            for name in files:
                full = os.path.join(root, name)
                rel = os.path.relpath(full, src_dir).replace(os.sep, "/")
                if rel == "mimetype":
                    continue
                z.write(full, rel)
    return out_idml


# --------------------------------------------------------------------------
# Story (text) helpers
# --------------------------------------------------------------------------

def story_files(unpacked_dir):
    d = os.path.join(unpacked_dir, "Stories")
    if not os.path.isdir(d):
        return []
    return [os.path.join(d, f) for f in sorted(os.listdir(d)) if f.endswith(".xml")]


def story_id(path):
    m = re.search(r"Story_(u[0-9a-f]+)\.xml$", os.path.basename(path))
    return m.group(1) if m else os.path.basename(path)


def read_story_text(path):
    """Plain text of a story (Content joined, <Br/> -> newline)."""
    xml = open(path, encoding="utf-8").read()
    parts = []
    for token in re.findall(r"<Content>.*?</Content>|<Br\s*/>", xml, re.S):
        if token.startswith("<Br"):
            parts.append("\n")
        else:
            inner = re.search(r"<Content>(.*?)</Content>", token, re.S).group(1)
            parts.append(html.unescape(inner))
    return "".join(parts).strip()


def applied_styles(path):
    """(paragraph_style, character_style) of the first ranges, for display."""
    xml = open(path, encoding="utf-8").read()
    p = re.search(r'AppliedParagraphStyle="([^"]*)"', xml)
    c = re.search(r'AppliedCharacterStyle="([^"]*)"', xml)
    return (p.group(1) if p else "", c.group(1) if c else "")


def _content_block(text):
    """Build a <Content>/<Br/> run; newlines -> soft <Br/> within the paragraph."""
    lines = text.split("\n")
    out = []
    for i, line in enumerate(lines):
        if i > 0:
            out.append("<Br />")
        out.append("<Content>%s</Content>" % escape(line))
    return "".join(out)


def set_story_text(path, new_text):
    """
    Replace a story's text, preserving the FIRST paragraph + character style.
    Keeps everything up to the first <CharacterStyleRange ...> open tag, swaps
    the inner Content/Br run, then restores the closing tags. Extra style ranges
    are collapsed into the first range's style (template stories are single
    style, so this is safe and predictable).
    """
    xml = open(path, encoding="utf-8").read()
    csr_open = re.search(r"<CharacterStyleRange\b[^>]*>", xml)
    if not csr_open:
        raise ValueError("No CharacterStyleRange in %s" % path)
    psr_close_idx = xml.rfind("</ParagraphStyleRange>")
    if psr_close_idx == -1:
        raise ValueError("No ParagraphStyleRange in %s" % path)

    head = xml[: csr_open.end()]
    tail = "</CharacterStyleRange>\n\t\t" + xml[psr_close_idx:]
    new_xml = head + _content_block(new_text) + tail
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_xml)


# --------------------------------------------------------------------------
# Image frame helpers
# --------------------------------------------------------------------------

def spread_files(unpacked_dir):
    d = os.path.join(unpacked_dir, "Spreads")
    return [os.path.join(d, f) for f in sorted(os.listdir(d)) if f.endswith(".xml")]


def _frame_size(rect_xml):
    anchors = re.findall(r'Anchor="([^"]+)"', rect_xml)
    xs, ys = [], []
    for a in anchors:
        x, y = a.split()
        xs.append(float(x)); ys.append(float(y))
    if not xs:
        return None
    return (max(xs) - min(xs), max(ys) - min(ys), min(xs), min(ys))


def list_image_frames(unpacked_dir):
    """Every GraphicType rectangle (an image slot), in spread/document order."""
    frames = []
    for sp in spread_files(unpacked_dir):
        xml = open(sp, encoding="utf-8").read()
        for m in re.finditer(r"<Rectangle\b.*?</Rectangle>", xml, re.S):
            blk = m.group(0)
            if 'ContentType="GraphicType"' not in blk:
                continue
            self_id = re.search(r'Self="([^"]+)"', blk).group(1)
            size = _frame_size(blk)
            frames.append({
                "spread": os.path.basename(sp),
                "self": self_id,
                "width": round(size[0], 2) if size else None,
                "height": round(size[1], 2) if size else None,
                "has_image": "<Image" in blk,
            })
    return frames


def _image_px_size(img_path):
    try:
        from PIL import Image
        with Image.open(img_path) as im:
            return im.size
    except Exception:
        return None


def place_image(unpacked_dir, frame_self, img_uri, img_path):
    """
    Inject an <Image> into the rectangle whose Self == frame_self, fitted to
    FILL the frame proportionally and centred. img_uri is a file: URI;
    img_path is read locally for pixel dimensions.
    """
    px = _image_px_size(img_path)
    for sp in spread_files(unpacked_dir):
        xml = open(sp, encoding="utf-8").read()
        m = re.search(r'(<Rectangle\b[^>]*Self="%s".*?</Rectangle>)' % re.escape(frame_self),
                      xml, re.S)
        if not m:
            continue
        blk = m.group(1)
        size = _frame_size(blk)
        if not size:
            return False
        fw, fh, fx, fy = size
        if px:
            iw, ih = float(px[0]), float(px[1])   # px == pt at 72ppi baseline
        else:
            iw, ih = fw, fh
        scale = max(fw / iw, fh / ih)             # fill proportionally
        draw_w, draw_h = iw * scale, ih * scale
        tx = fx - (draw_w - fw) / 2.0             # centre over frame
        ty = fy - (draw_h - fh) / 2.0

        image_el = (
            '\n\t\t\t<Image Self="%s_img" ItemTransform="%s 0 0 %s %s %s" '
            'ImageTypeName="$ID/JPEG" ActualPpi="72 72" EffectivePpi="72 72">\n'
            '\t\t\t\t<Properties>\n'
            '\t\t\t\t\t<Profile type="string">$ID/Embedded</Profile>\n'
            '\t\t\t\t\t<GraphicBounds Left="0" Top="0" Right="%s" Bottom="%s" />\n'
            '\t\t\t\t</Properties>\n'
            '\t\t\t\t<Link Self="%s_link" LinkResourceURI="%s" '
            'LinkResourceFormat="$ID/JPEG" StoredState="Normal" '
            'LinkClassID="35906" LinkClientID="257" '
            'LinkResourceModified="false" LinkObjectModified="false" '
            'ShowInUI="true" CanEmbed="true" CanUnembed="true" '
            'CanPackage="true" ImportPolicy="NoAutoImport" />\n'
            '\t\t\t</Image>\n\t\t'
        ) % (frame_self, scale, scale, tx, ty, iw, ih, frame_self, img_uri)

        new_blk = blk.replace("</Rectangle>", image_el + "</Rectangle>")
        xml = xml[:m.start()] + new_blk + xml[m.end():]
        with open(sp, "w", encoding="utf-8") as f:
            f.write(xml)
        return True
    return False
