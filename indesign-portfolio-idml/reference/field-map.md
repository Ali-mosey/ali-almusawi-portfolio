# Field map for "Portfolio Architecture Minimal.idml"

Story IDs are stable for THIS template file. Re-run `inspect_idml.py` if the
template is re-saved, as IDs can change.

## Cover & front matter
| Story ID | Style | Field |
|----------|-------|-------|
| u182 | Normal | Cover title ("Portfolio") |
| u1ac | Normal | Cover subtitle (school / name) |
| u38a | Normal | "Contents" heading |
| u915 | Normal | Contact (email / phone) |

## Contents page (keep in sync with project titles + page numbers)
| Story ID | Field |
|----------|-------|
| u211 | Contents: Project A label |
| u230 | Contents: Project B label |
| u98f | Contents: Project C label |
| u9a6 | Contents: Project D label |
| u261 / u278 / u9bd / u9d5 | Contents page numbers (4 / 6 / 8 / 10) |

## Project A
| Story ID | Style | Field |
|----------|-------|-------|
| u466 | Project Title | "Project A" |
| u47d | Project Subtitle | Project A subtitle |
| u494 | Body Text | Project A description |
| u52d, u656 | Caption | Project A image captions |

## Project B
| u4d9 | Project Title | "Project B" |
| u4f0 | Project Subtitle | Project B subtitle |
| u507 | Body Text | Project B description |
| u60c, u623 | Caption | Project B image captions |

## Project C
| u7b2 | Project Title | "Project C" |
| u7c9 | Project Subtitle | Project C subtitle |
| u795 | Body Text | Project C description |
| u7f0, u808 | Caption | Project C image captions |
| u7f0, u808, u821, u838, u866 | Caption | Project C image captions |

## Project D
| u739 | Project Title | "Project D" |
| u750 | Project Subtitle | Project D subtitle |
| u767 | Body Text | Project D description |
| u821, u838, u866 | Caption | Project D image captions |

## Image slots (Self id -> spread, size in pt)
| Frame | Spread | Size | Likely use |
|-------|--------|------|-----------|
| u693 | Spread_u34d | 638x642 | Project A main |
| u69f, u6ae | Spread_u34d | 638x309 | Project A secondary |
| u701 | Spread_u689 | 638x991 | Project B main (full height) |
| u705, u7dd | Spread_u689 | smaller | Project B secondary |
| u179, u72e | Spread_uce / u713 | 354x981 | full-bleed verticals |
| u1f9, u1fa, u98a, u98b | Spread_udd | ~300x395 | Project C 4-up grid |
| u445, u4c8 | Spread_ude | mixed | Project D |
| u555, u58c, u890 | Spread_udf | mixed | Project D |

> Slot purpose is inferred from size/position. Confirm against the visual
> layout in InDesign the first time, then reuse the mapping.
