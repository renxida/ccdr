# Factcheck: tpu-hierarchy

VERDICT: 5 ERRORS (+ 2 unverifiable, + notes)

## Method
Verified every numeric/spec claim against official Google Cloud TPU docs (v4, v5e, v5p, v6e, tpu7x), the
two Google Cloud blog announcements (v5p, Trillium, Ironwood), and the JAX scaling book (tpus/, roofline/).
Re-derived all computed figures by hand.

## ERRORS

### 1. v5p HBM bandwidth wrong (appears in 2 places + ledger)
- corpus tpu-chip tier 2: "2,765 GiBps"; ironwood tier 3: "2,765 GiBps (v5p)"; ledger tpu-chip tier 2.
- Source (https://docs.cloud.google.com/tpu/docs/v5p) spec table: **2,575 GiBps**.
- Fix: replace 2,765 -> 2,575 in all three locations.

### 2. v5e ICI bandwidth wrong ("1,600 Gbps")
- corpus torus tier 3: "v5p ... 4,800 Gbps—twice that of v5e's 2D torus at 1,600 Gbps".
- Source (https://docs.cloud.google.com/tpu/docs/v5e): v5e ICI = **400 GBps** (= 3,200 Gbps).
  Scaling book gives v5e bidi ICI 9.0e10 B/s = 720 Gbps. Neither is 1,600 Gbps.
- Also internally inconsistent: 4,800 is not "twice" 1,600 (it is 3x). The "twice" relationship that IS
  true is bidi bytes/s in the scaling book (v5p 1.8e11 vs v5e 9.0e10).
- Fix: remove the "1,600 Gbps" figure and the "twice" comparison, or recast in consistent units.

### 3. Ironwood per-chip vs v5p stated "~10×" but is ~5×
- corpus ironwood tier 3: "Ironwood is ~10× the peak compute of v5p per chip (2,307 vs 459 BF16 TFLOPS)".
- 2,307 / 459 = **5.03×** per chip. The blog's "10X peak performance improvement over TPU v5p"
  (https://cloud.google.com/blog/.../ironwood-tpus-...) is a pod/system-level claim, not per-chip.
  The parenthetical numbers contradict "10×".
- Fix: "~5× the peak BF16 compute of v5p per chip (2,307 vs 459 TFLOPS); Google cites ~10× at pod/system level".

### 4. Ironwood vs Trillium stated "~4×" but BF16 per chip is ~2.5× (author-flagged)
- corpus ironwood tier 3: "~4× that of Trillium (2,307 vs 918 TFLOPS)"; tensorcore/ironwood prose echoes 4×.
- 2,307 / 918 = **2.51×** raw BF16 per chip. The Google blog "more than 4X better performance per chip"
  is a training+inference workload claim (includes HBM/ICI/efficiency), NOT a raw FLOPS ratio. Stating "~4×"
  immediately beside "2,307 vs 918" is self-contradictory.
- Fix: "~2.5× the raw BF16 per chip (2,307 vs 918); Google's '4×' is a workload-level figure including memory/ICI gains".

### 5. tensorcore tier 3 "4.7× ... square of the matrix dimension" causal claim relies on unverified MXU sizing
- corpus tensorcore tier 2/3: "v6e MXUs are 256×256, doubling v5e's 128×128"; "throughput scales as the square
  of the matrix dimension" as the driver of 4.7×.
- Official v6e doc: each v6e TensorCore "has 2 matrix-multiply units (MXU)"; v5e/v4 docs say "four MXUs" per
  TensorCore. The fetched docs do NOT state 128×128 or 256×256 array dimensions. The 256×256 figure comes only
  from the system-architecture page citation and could not be confirmed in the v5e/v6e spec tables.
  4.7× is the blog's number and is correct (918/197 = 4.66); but a 128->256 side doubling alone gives 4× area,
  not 4.7×, and the MXU-count framing here is muddled.
- Status: 4.7× figure OK; the 256×256/128×128 dimensions are UNVERIFIABLE from cited docs — see Unverifiable.

## UNVERIFIABLE

### U1. MXU array dimensions 128×128 / 256×256
- corpus tensorcore tier 2/3; ledger "MXU array size v6e and v7 = 256×256".
- Not present in fetched v4/v5e/v6e/tpu7x spec tables (which quote MXU *count*, not dimensions). The cited
  system-architecture page did not surface the dimension figures on fetch. Flag for an authoritative confirmation.

### U2. Pod-to-pod "38× raw FP8" comparison
- corpus pod tier 3: "v4 pod 1.1 ExaFLOPS BF16 ... v7 pod ~42.5 ExaFLOPS FP8 — a 38× ... increase".
- Arithmetic checks (42.5/1.1 = 38.6) but compares v4 BF16 to v7 FP8 (different dtypes) — methodologically
  apples-to-oranges. Not a source error; numbers are individually correct. Recommend labeling the dtype mismatch.

## VERIFIED CORRECT (sample of re-derivations)
- v5p: 459 BF16 TFLOPS, 95 GiB HBM, 8,960 chips, 16×20×28 3D torus, 2 TensorCores/chip — all match doc.
- v5p ICI "4,800 Gbps/chip" — matches the cited v5p *blog* verbatim (note: official doc lists 1200 GBps;
  different measurement convention. The corpus value is blog-backed, OK.)
- v5p LLM training "2.8× faster than v4" and "4× more FLOPs/pod than v4" — match blog verbatim.
- v4: 275 TFLOPS, 4,096 chips, 16×16×16, pod 1.1 ExaFLOPS (275e12×4096 = 1.126E) — match.
  (minor: v4 HBM is "32 GiB" in doc; corpus tier3 writes "32 GB".)
- v5e: 197 TFLOPS, 16 GB, 800 GiBps, 256 chips, pod 50.63 PFLOPS (197e12×256 = 50.43; doc states 50.63) — match doc.
- v5e ridge point ~240 FLOPs/byte — scaling book states exactly "about 240 FLOPs/byte" (1.97e14 / 8.2e11). Correct.
- Trillium: 918 TFLOPS, 1,836 INT8 TOPS, 32 GB, 1,638 GiBps, 256 chips, pod 234.9 PFLOPS (918e12×256 = 235.0) — match.
  4.7× per-chip vs v5e and ">67% energy efficiency" — match blog. (Trillium ICI is 800 GBps per doc; not claimed in prose.)
- Ironwood: 2,307 BF16 / 4,614 FP8 TFLOPS, 192 GiB HBM3e, 7,380 GiBps, 1,200 GBps ICI, 9,216 chips,
  2 TensorCores + 4 SparseCores — all match tpu7x doc. ICI 9.6 Tb/s blog = 1,200 GB/s ✓.
- Ironwood ridge point 2,307e12/7,380e9 = 312.6 ≈ 313 FLOPs/byte (author-flagged) — CORRECT.
- Ironwood pod: 4,614e12×9,216 = 42.52 ExaFLOPS FP8 ✓; 192×9,216 GiB = 1.769 PB ≈ 1.77 PB ✓.
- v4 pod 3D torus, v7 pod 3D torus (doc: 4×4×4 cubes; corpus says 4×4×576 — see note).

## NOTES (not errors, verify if learning verbatim)
- Ironwood pod topology: corpus says "4×4×576"; tpu7x doc describes 4×4×4 "cubes" as building blocks and does
  not confirm 4×4×576 as the full-pod dimensions. 4×4×576 = 9,216 (arithmetically consistent) but the doc's
  stated unit is the 4×4×4 cube. Treat 4×4×576 as plausible-but-unconfirmed.
- v5p HBM capacity: doc uses "95 GiB"; corpus tier 2 writes "95 GB". Unit nit.
- v4/v7 per-chip BF16 growth "roughly 8×": 2,307/275 = 8.39× ✓.
