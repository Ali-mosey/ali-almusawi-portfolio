# projects.json schema (project-based, used by build_portfolio.py)

```jsonc
{
  "cover": {
    "title": "Portfolio",
    "subtitle": "Bachelor of Architecture\nUTS · Ali Almusawi",
    "hero_image": "cover.jpg"            // optional cover image
  },
  "contact": "ali-mosey@hotmail.com\n0469798091",

  "projects": {
    "A": {
      "title": "Riverside Cultural Centre",
      "subtitle": "Sydney\n2025",        // \n = line break
      "description": "Body paragraph for the project...",
      "captions": ["Image 1 caption", "Image 2 caption"],
      "hero_image": "a/hero.jpg",        // main/largest frame
      "images": ["a/01.jpg"],            // other frames, in order
      "thumbnail": "a/thumb.jpg"         // optional; defaults to hero_image
    },
    "B": { "...": "..." },
    "C": { "...": "..." },
    "D": { "...": "..." }
  }
}
```

## Rules
- **Every field is optional.** Omit anything to keep the template's default.
- Project keys (`A`,`B`,`C`,`D`) must match `reference/template-profile.json`.
- `hero_image` -> the project's `hero_frame`. `images[]` -> `image_frames[]` in
  order; extra images beyond the available frames are ignored (a warning is
  printed). Frame counts per project:
  - A: hero + 2 others  - B: hero + 2 others
  - C: hero + 2 others  - D: hero + 2 others
- `captions[]` map onto the project's caption stories in order.
- Each project's `title` also updates its label on the contents page, and its
  `thumbnail` (or `hero_image`) fills the contents thumbnail.
- Image paths resolve against `--images-dir` (default: the projects.json
  folder), or may be absolute. JPEG/PNG; install Pillow for exact fit math.
