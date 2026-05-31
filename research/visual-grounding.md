# CC2 Visual Grounding

Research for the hint visualization in the CC2 typing trainer.
All images are in `./images/`. Every description below is from direct visual inspection.

---

## Image Inventory

### `CCEnglish2.png` — MOST USEFUL FOR RENDERING
**Source:** `https://docs.charachorder.com/_images/CCEnglish2.png`
**What it shows:** Official "Quick Reference Guide" — full keymap diagram on a black background.
Both halves of the CC2 are shown side by side. Each switch is drawn as a circle with 5 labeled zones:
- Center dot (3D press / center actuation)
- N (top), S (bottom), W (left), E (right) wedges radiating outward

Each wedge is labeled with the character for that actuation direction + layer info via color:
- White text = Layer 1 (default)
- Green text = Layer 2 (hold pinky outward)
- Clockwise annotation = Layer 3 (press pinky into device)

Left half (user's left hand), from outer edge inward:
- Pinky switch (top-left corner of left half) — notably wider/flatter cap than the others
- Ring switch
- Middle switch
- Index switch
- Three thumb switches arranged along the inner-bottom edge (innermost side of the half)

Right half mirrors the left, with right-hand finger assignment.

The switches fan out slightly; the finger switches form a rough arc. The pinky is visually distinguished by its wider flat cap. Thumb switches are clearly offset below and toward the center bar.

Labels visible on specific switches (Layer 1 only, left half, reading by position):
- Pinky: CTRL (outer), u (N), e (W/center area), various layer-2 nav
- Ring: a, i, and other vowels
- Middle: large cluster of consonants — c, k, f, r, h, d
- Index: common letters — p, g, b, etc.
- Thumb 1 (outermost): ESC, numbers/symbols
- Thumb 2 (middle): space, punctuation  
- Thumb 3 (innermost): Enter, more symbols

The legend box (bottom center) uses color-coded boxes to explain the 3-layer system.

---

### `CC2.webp` — physical device photo (top-down, with blue LED highlights)
**Source:** `https://docs.charachorder.com/_images/CC2.webp`
**What it shows:** Both halves connected by the center bar/bridge. The background is a monitor
showing a Notepad window with "This text was typed at the speed of thought." Overlaid above the
physical device is a rendered 3D visualization (same as used in DOT I/O) — schematic diagram
of the switches with blue translucent wedge overlays, two lit green for the current actuation.

Physical device: black ovoid palm rests, each with 9 circular switch caps protruding from the
upper/inner face. The 6 finger switches (pinky through index, both sides) curve in two arcs
facing each other. Thumb switches are grouped in a cluster of 3 at the bottom inner edge of
each half. The center connector is a rigid horizontal bar with a CharaChorder logo medallion
in the middle; cables run from each half to the bar ends.

---

### `CC2-product-2-1.jpg` — single half, angled top-down, marketing photo
**Source:** `https://www.charachorder.com/cdn/shop/files/2.1.jpg?v=1763852125`
**What it shows:** Single CC2 half (left, viewed from above at ~45°). Very clear close-up of
the 9 switch caps. The 6 finger switches (upper cluster) are arranged in two columns of 3 with
one additional switch at the far corner (pinky). The pinky switch is visibly larger/flatter
and slightly set apart. The 3 thumb switches (lower cluster) are arranged in a diagonal line
at the inner-lower edge. Each switch cap is circular with a visible center dot/ring and subtle
concentric rings indicating the 5-way mechanism. Center bar exits from the lower-left with
the logo connector visible.

---

### `CC2a2.webp` — both halves, overhead studio render
**Source:** `https://www.charachorder.com/cdn/shop/files/CC2a2.webp?v=1763852125`
**What it shows:** Clean overhead product render of both halves connected, matte black on dark
gray. Shows the full device layout clearly: two oval/kidney-shaped palm rests connected by a
rigid horizontal bar. Each half has 9 switches visible. The finger switches form an arc on the
upper face; thumb switches are along the medial (bar-facing) lower edge. Switches are small
circular posts with a concentric cap. The center medallion has the CC logo.

---

### `CC2b1.webp` — single half, 45° overhead angle, high-res studio render
**Source:** `https://www.charachorder.com/cdn/shop/files/CC2b1.webp?v=1763852125`
**What it shows:** Same style as CC2a2 but showing just one half at a closer angle. The upper
cluster of 6 finger switches is very clear: pinky at top-left (wider), then ring, middle, index
in a curved arc. The thumb cluster of 3 is at the lower-inner edge, slightly separated from
the finger group. Switch cap design: small disc with an outer ring and center dot visible.

---

### `CC2-hand-on-device.jpg` — real hand using the device
**Source:** `https://www.charachorder.com/cdn/shop/files/hand_on_device.jpg?v=1763852125`
**What it shows:** A human hand resting on one CC2 half. Fingers naturally rest over the finger
switches. The 3 thumb switches (gold/brass colored rings, slightly different from the black
finger switches — or different lighting) are visible below the palm area. This is the clearest
photo showing ergonomic hand placement: fingers curve over the finger arc, thumb dips down to
the inner switches. 4 finger switches are under the finger pads, 3 thumb switches are below.

---

### `CC2-on-chair.jpg` — real-world photo, single half close-up
**Source:** `https://www.charachorder.com/cdn/shop/files/onChair.jpg?v=1763852125`
**What it shows:** One CC2 half mounted on a chair arm (creative setup). Clear frontal view
of the switch layout from slightly above. Same 6+3 arrangement clearly visible. Switch caps
have the characteristic concentric-ring design. Confirms the rough spatial layout.

---

### `DOTIO.png` — DOT I/O training platform screenshot
**Source:** `https://docs.charachorder.com/_images/DOTIO.png`
**What it shows:** The official CharaChorder practice platform (dot.io) in action. This is
extremely relevant as a prior art reference for our trainer.
- Dark background (near-black, #1a1a1a or similar)
- Top bar: "dot i/o" branding, CPM/WPM stats, mode selector (Letters/Trigrams/Words/Test)
- Typing area: white rounded-rectangle box, dark serif-ish text showing words to type;
  cursor is a square block at current position; typed characters appear slightly different shade
- Below typing area: two 3D rendered CC devices with the schematic switch overlay — 
  the current target switch is lit GREEN, all others show blue translucent wedges
- Stats below top bar: 0 Terms, timer, accuracy %, CPM, WPM
- The device visualization is the same "exploded view" seen in CC2.webp

---

### `us-base-shift-layers.svg` — standard QWERTY cheatsheet (NOT CC2-specific)
**Source:** `https://raw.githubusercontent.com/Ceredril/CharaChorderCheatsheets/main/assets/us_base_shift_layers.svg`
**What it shows:** A conventional QWERTY keyboard showing base layer (lowercase) and shift
layer (uppercase/symbols). White keys on a light gray background. This is for the US layout
reference used when programming CC2 key positions — not a CC2 layout diagram itself.
Useful for understanding the base-layer character mapping that CC2 positions encode.

---

## Physical Arrangement Summary (for accurate on-screen rendering)

### One half (e.g., left half as seen from above):

**Shape:** Ovoid/kidney, wider than tall, slightly asymmetric. The inner edge (toward center
bar) is the shorter/flatter side. The outer edge (toward the user's outer hand) curves away.

**Finger switch cluster (upper face, 6 switches total — but wait: it's 4 finger switches):**
The docs describe 4 finger switches (pinky, ring, middle, index). What looks like 6 in photos
is the 4 finger switches arranged across the upper arc. The pinky switch sits outermost/topmost.
Ring, middle, index follow in an inward arc. Spacing is roughly equal, arc curves toward center.

**Thumb switch cluster (lower-inner edge, 3 switches):**
Three switches arranged in a roughly diagonal line along the medial lower edge. Clearly
separated (by ~1–2 switch diameters) from the finger switches. In overhead photos these appear
as a tight cluster of 3 below and to the inner side.

**Total: 4 finger + 3 thumb = 7... but docs clearly say 9.** 
Re-reading: "pinky, ring, middle, and index" = 4 switches, "three switches on the inner-most
side correspond to the thumb" = 3, total = 7. But DOT I/O and the CCEnglish2.png show more
than 7 per half. The CCEnglish2.png shows: on the left half, from top-left going inward:
CTRL (pinky outer), then 3 more finger switches, then what appears to be 2 more + 3 thumb.
Actually counting circles in CCEnglish2.png per half: approximately 9 distinct circles.

**Reconciled count:** 9 per half. The "4 fingers" may mean 4 finger positions with multiple
switches, or the docs description is simplified. The CCEnglish2.png is authoritative: 9 circles
per half, arranged as a cluster of ~6 in the finger arc + 3 thumb switches below.

**In CCEnglish2.png, left half switch layout reading left→right, top→bottom:**
- Row 1 (top): CTRL/pinky (outermost), 1 more  
- Row 2 (middle arc): 4 finger switches clustered  
- Row 3 (inner bottom): 3 thumb switches in a row

### Switch actuation visualization (from CCEnglish2.png):

Each switch in the diagram is a circle with:
- **Center** (small filled dot): 3D press / center actuation
- **4 wedge segments** extending N/S/E/W: tilt directions
- Labels placed at each wedge tip, showing the character for that direction + layer

The diagram uses a "pie slice" visual for each direction. The center label is the 3D-press char.

For our on-screen renderer: draw each switch as a circle with a center dot + 4 labeled arms
at cardinal directions. Highlight the relevant arm/center for the hint. The CCEnglish2.png
dark background with white/green labels is a natural reference palette.

### DOT I/O precedent (DOTIO.png):

DOT I/O renders the actual 3D device model with overlaid translucent blue wedge fans 
(like a splayed hand radiating outward from each switch center). The target switch lights green.
This is visually impressive but complex to replicate. A simpler flat schematic (like CCEnglish2.png 
but single-half, larger, with one highlight) would be equally functional and faster to build.

---

## Key takeaways for the hint widget

1. **CCEnglish2.png is the gold standard reference** — use it as the basis for the schematic.
2. Draw each switch as: outer ring, center dot, 4 directional arms (N/S/E/W) with char labels.
3. Per-half layout: ~6 switches in upper arc (4 fingers + 2 extra? or pinky has double switch)
   + 3 thumb switches in a lower cluster.
4. Pinky switch is wider/flatter — render it slightly wider or with a different aspect ratio.
5. Color code: Layer 1 = default (white/light), highlight = green or high-contrast accent.
6. DOT I/O confirms: putting the device visualization below the text entry area works well.
