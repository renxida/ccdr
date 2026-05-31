# CC2 "CC English" A1 base-layer derivation notes

## Device identity
- Trainer target: **CharaChorder Two (CC2)**.
- Internal/serial names (from `DeviceManager/src/lib/serial/device.ts`):
  - USB id `TWO S3` → `usbProductId: 0x8253, usbVendorId: 0x303a`.
  - `DEVICE_ALIASES`: `"CC2" => {"TWO S3", "two_s3", "TWO S3 (pre-production)"}`.
  - Firmware/report device enum value is `"TWO"`; key count `TWO: 90`.
- **M4G** is the closely related split variant (`"M4G" => {"M4G S3", ...}`), also 90 keys. The CC2 firmware ships the same 90-position layout grid; the position→switch geometry file used here is `m4g.layout.yml` (the only checked-in 5-way-switch layout that matches the CC2/TWO 90-key grid; `one.layout.yml` is identical in IDs but adds a center `d:` direction and a 3rd thumb row).

## Sources used

### 1. Position-ID → (switch, direction) geometry
File: `/tmp/DeviceManager/src/lib/assets/layouts/m4g.layout.yml` (`name: M4G`).
Each physical 5-way switch lists the firmware position-ID for each compass direction. Snippet (left ring/middle row, and the thumb rows):

```yaml
# Ring / Middle
- offset: [2, 0]
  row:
    - switch: { e: 26, n: 27, w: 28, s: 29 }   # left ring
    - switch: { e: 21, n: 22, w: 23, s: 24 }   # left middle
    - offset: [4, 0]
      switch: { w: 66, n: 67, e: 68, s: 69 }   # right middle
    - switch: { w: 71, n: 72, e: 73, s: 74 }   # right ring
# Pinkie / Index
- offset: [0, -3]
  row:
    - switch: { e: 31, n: 32, w: 33, s: 34 }   # left pinky
    - offset: [4, 0]
      switch: { e: 16, n: 17, w: 18, s: 19 }   # left index
    - switch: { w: 61, n: 62, e: 63, s: 64 }   # right index
    - offset: [4, 0]
      switch: { w: 76, n: 77, e: 78, s: 79 }   # right pinky
# Thumbs
- row:
    - offset: [5.5, 0.5]
      switch: { e: 11, n: 12, w: 13, s: 14 }   # left thumb (near, thumbIndex 0)
    - offset: [1, 0.5]
      switch: { w: 56, n: 57, e: 58, s: 59 }   # right thumb (near, thumbIndex 0)
- row:
    - offset: [4.5, -0.25]
      switch: { e: 6, n: 7, w: 8, s: 9 }       # left thumb (mid, thumbIndex 1)
    - offset: [3, -0.25]
      switch: { w: 51, n: 52, e: 53, s: 54 }   # right thumb (mid, thumbIndex 1)
```

Note: there is a third pair of finger-cluster switches (`m4g.layout.yml` group with IDs 36–44 / 81–89) that on the base layer hold only modifier/mirror actions (no letters), and a third thumb switch per hand (present in `one.layout.yml` as IDs 0–4 / 45–49, omitted from `m4g.layout.yml`) that also holds no base-layer letters. Neither affects the a–z mapping.

### 2. Action-ID → character keymap
File: `/tmp/DeviceManager/src/lib/assets/keymaps/ascii.yml`. Printable letters use their ASCII code as the action id, e.g.:
```yaml
97:  { id: "a", keyCode: KeyA }
...
122: { id: "z", keyCode: KeyZ }
```
So action id == `ord(char)` for a–z (97–122).

### 3. Default layout (which action sits at each position) — Firmware Meta API
- Device listing: `https://charachorder.io/firmware/two_s3/` (note: lowercase `two_s3`, not `TWO`; the `/firmware/` path is the SvelteKit app, the data is the directory-listing JSON at the device sub-paths).
- meta.json URL used: **`https://charachorder.io/firmware/two_s3/3.0.0/meta.json`** (latest stable; `target: "two_s3"`, `version: "3.0.0"`, `git_commit: 0a7736d`, `git_date: 2026-01-28`).
- `meta.factory_defaults.layout = "factory_layout.json"` →
  **`https://charachorder.io/firmware/two_s3/3.0.0/factory_layout.json`**.
- `factory_layout.json` shape: `{ charaVersion, type:"layout", device:"ONE", layout: [layer0, layer1, layer2, layer3] }`, each layer an array of 90 action-ids indexed by position-ID. **Layer 0 = A1 base layer.** (The embedded `device:"ONE"` string is a firmware-internal label for the 90-key keymap family shared by ONE/TWO/M4G; the file is what TWO 3.0.0 ships as its factory default.)
- Raw layer 0 (index = position-ID 0..89):
```
[600,47,45,515,297,601,119,562,103,122,602,107,118,109,99,603,114,298,32,101,
 604,105,127,46,111,605,39,512,44,117,552,513,514,550,540,607,335,338,336,337,
 608,565,568,566,567,609,563,63,519,297,610,98,120,536,113,611,102,112,104,100,
 612,97,296,544,116,613,108,299,106,110,614,121,516,59,115,553,517,518,551,542,
 616,336,338,335,337,617,566,568,565,567]
```
Cross-checked: `m4g_s3/3.0.0` exists with the identical structure.

## Derivation procedure
For each position-ID `p`, `layer0[p]` is an action-id; if it is in 97..122 it is a lowercase letter. Map `p` back through `m4g.layout.yml` to `(hand, finger, direction[, thumbIndex])`. All 26 letters resolve uniquely; none missing.

## Naming conventions
- **Directions**: device uses `n/s/e/w` (North/South/East/West) plus an unlisted center/press (`d` in `one.layout.yml`). Output uses full words `north|south|east|west|center`. No base-layer letter sits on a center/press, so `center` is never emitted.
- **Hand**: left = finger-cluster switches on the left half (computed x < gap) and left thumb switches; right = right half. Confirmed by the mirrored east/west id ordering (left switches list `e` first/inward, right switches list `w` first/inward).
- **Finger**: `pinky|ring|middle|index|thumb`, taken from the `# Ring / Middle` and `# Pinkie / Index` group comments combined with left→right switch order within each row.
- **thumbIndex** (CC2 has 3 thumb switches per half; docs: "the three switches on the inner-most side of each half correspond to the thumb"):
  - `0` = **near/inner** thumb switch (`m4g.layout.yml` group with ids L:11–14 / R:56–59).
  - `1` = **mid** thumb switch (ids L:6–9 / R:51–54).
  - `2` = **far/outer** thumb switch (ids L:0–4 / R:45–49) — *exists physically but carries no a–z letter on the base layer*, so it never appears in the output.
  - Non-thumb fingers: `thumbIndex: null`.

## Hand-verification of high-frequency letters
Against the documented CharaChorder CC English layout (`docs.charachorder.com/CharaChorder%20Two.html`, `Layout.html`) and the derived data — all consistent:
| letter | derived position | matches known CC English |
|---|---|---|
| e | left index, south | yes |
| t | right index, south | yes |
| a | right index, west | yes |
| o | left middle, south | yes |
| i | left middle, east | yes |
| n | right middle, south | yes |
| s | right ring, south | yes |

(The docs pages render the layout only as an image, so this was verified against the well-known CC English finger/direction assignments that the firmware data reproduces, not against scraped text.)

## Per-letter confidence
- **High confidence (all 26 letters)** for `(hand, finger, direction)`: every assignment is read directly from firmware `factory_layout.json` layer 0 + `m4g.layout.yml` geometry, two independent CharaChorder sources that agree.
- **thumbIndex 0 vs 1 naming (near vs mid)**: medium-high. The *grouping* of which letters share a thumb switch is certain (from the yml id groups); the human label "near=0 / mid=1 / far=2" is inferred from the inner→outer geometric offsets in `m4g.layout.yml`. If a trainer wants to match a specific physical photo, only the index numbering convention (not the letter grouping) would need confirmation.
- Letters on thumb switch 0 (near): c, d, f, h, k, m, p, v.
- Letters on thumb switch 1 (mid): b, g, q, w, x, z.
- No letters on thumb switch 2 (far) or on any center/press direction.
