# content.json schema

```jsonc
{
  "text": {
    "<storyId>": "new text; use \\n for line breaks within a block"
  },
  "images": [
    { "frame": "<frameSelf>", "file": "path/to/image.jpg" }
  ]
}
```

## text
- Keys are **Story IDs** exactly as printed by `inspect_idml.py` (e.g. `u47d`).
  Do not invent or change them.
- Values are the replacement text. `\n` becomes a soft line break (`<Br/>`),
  matching how the template stacks multi-line titles.
- The story's paragraph and character styles are preserved automatically.
- Omit a Story ID to leave that text untouched. Page numbers and the
  `<?ACE ?>` auto-markers should normally be left out.

## images
- One object per image you want to place.
- `frame` is the rectangle's **Self** id from the inspector's IMAGE SLOTS list.
- `file` is resolved against `--images-dir` (default: the content.json folder),
  or may be an absolute path. Empty `file` = skip that frame.
- Fitting is fill-proportional, centred. JPEG/PNG supported; install Pillow for
  exact pixel-size detection (otherwise the image is assumed to match the frame
  aspect ratio).
```
