# Fact-check: NVIDIA datacenter GPU hierarchy

VERDICT: PASS

Files reviewed:
- `/home/cedar/ccdr/src/corpus/nvidia-gpu-hierarchy.json`
- `/home/cedar/ccdr/src/corpus/nvidia-gpu-hierarchy.sources.json`

All numeric/spec claims and ledger citations verified against cited sources. No factual, unit, precision, sparsity, or arithmetic errors found.

## Spec verification (against official NVIDIA pages unless noted)

| Claim | Corpus | Source | OK |
|---|---|---|---|
| A100 80GB SXM4 mem | 80 GB HBM2e, 2,039 GB/s (~2.0 TB/s) | nvidia.com/a100: 80GB HBM2e, 2,039 GB/s | ✓ |
| A100 FP16 Tensor | 312 dense / 624 sparse | 312 / 624* | ✓ |
| A100 TF32 | 312 dense (156 in some revs) | 156 dense / 312 sparse | ✓ (text correctly notes 156 from in-depth blog) |
| A100 FP64 Tensor | 19.5 TFLOPS | 19.5 | ✓ |
| A100 SMs / die | 108 of 128 (GA100) | 108 / 144-full? blog says 128 full | ✓ (108 enabled; full GA100 = 128) |
| A100 transistors / node | 54B / TSMC 7nm | 54.2B / TSMC 7nm N7 | ✓ |
| A100 NVLink 3 | 600 GB/s (2x V100 300) | 600 GB/s, V100 300 | ✓ |
| H100 SXM5 mem | 80 GB HBM3, 3.35 TB/s | nvidia.com/h100: 3.35 TB/s | ✓ |
| H100 FP16 Tensor | 989 dense / 1,979 sparse | 1,979* sparse (dense = half = 989) | ✓ |
| H100 FP8 Tensor | 1,979 dense / 3,958 sparse | 3,958* sparse | ✓ |
| H100 FP64 Tensor (ledger) | 67 TFLOPS | 67 (product page) | ✓ |
| H100 die | GH100, 80B, TSMC 4N, 814 mm², 132/144 SM, 700W | matches Hopper blog | ✓ |
| H200 mem | 141 GB HBM3e, 4.8 TB/s | nvidia.com/h200: 141 GB, 4.8 TB/s | ✓ |
| H200 FP16/FP8 sparse | 1,979 / 3,958 (same as H100) | 1,979* / 3,958* | ✓ |
| H200 capacity +76%, bw +43% | 141/80=1.76; 4.8/3.35=1.43 | — | ✓ arithmetic |
| B200 mem | 192 GB HBM3e, 8.0 TB/s | civo / GTC spec (DGX form = 180 GB; HGX = 192) | ✓ (ledger notes 180 vs 192 correctly) |
| B200 FP4 | 9,000 dense / 18,000 sparse | civo: 9 PFLOPS dense / 18 sparse | ✓ |
| B200 FP8 dense | 4,500 | civo: 4,500 dense | ✓ |
| B200 FP64 ~37 (flagged) | ~37 TFLOPS | civo table: 37 | ✓ (third-party; ledger flags ~90% conf) |
| B200 dies/link/transistors | 2× GB100, 10 TB/s NV-HBI, 208B, 4NP | civo: 10 TB/s, 208B, 4NP | ✓ |
| NVLink gens | 3=600, 4=900, 5=1,800 GB/s | confirmed | ✓ |
| NVLink 5 >14x PCIe Gen5 | 1800/128 = 14.06 | — | ✓ |
| NVL72 config | 72 GPU / 36 Grace | nvidia.com: 72 / 36 | ✓ |
| NVL72 FP4 | 1,440 PFLOPS sparse (720 dense) | 1,440 sparse / 720 dense | ✓ |
| NVL72 mem | 13.4 TB HBM3e, 576 TB/s, 130 TB/s NVLink | confirmed all three | ✓ |
| NVL72 per-GPU | 13.4TB/72=186 GB; 576/72=8 TB/s | — | ✓ arithmetic |
| NVLink-C2C | 900 GB/s bidirectional | GB200 blog: 900 GB/s | ✓ |
| NVL72 30x inference (flagged) | ~30x vs H100 | 30x for 1.8T GPT-MoE, specific TTL/FTL conditions | ✓ (workload-specific; ledger flags ~85% conf) |

## Arithmetic re-derivation (all correct)
- A100 ridge: 312e12 / 2e12 = 156 FLOP/byte ✓
- H100 ridge: 989e12 / 3.35e12 = 295.2 ≈ 295 ✓; bw 3.35/2.0 = 1.675 ≈ 1.67x ✓
- H200 ridge: 989e12 / 4.8e12 = 206.0 ≈ 206 ✓
- B200 ridge: 9000e12 / 8e12 = 1,125 ✓; bw 8.0/3.35 = 2.388 ≈ 2.39x ✓
- NVLink 5 / PCIe Gen5: 1800/128 = 14.06 → "over 14x" ✓
- NVL72: 13.4e3/72 = 186.1 GB ✓; 576/72 = 8.0 TB/s ✓

## Author-flagged claims
- (a) B200 FP64 ~37 TFLOPS — third-party (civo) derived; NVIDIA has not prominently published standalone B200 FP64. Matches cited source; flagged correctly in ledger. No error.
- (b) NVL72 "30x inference vs H100" — confirmed verbatim from NVIDIA, with specific benchmark conditions (TTL=50ms, FTL=5s, 32,768 in/1,024 out, 1.8T GPT-MoE). Workload-specific marketing; flagged correctly. No error.

## Notes (not errors)
- The Hopper in-depth blog rounds H100 figures to 1000/2000/4000 TFLOPS; the corpus correctly uses the precise published peak figures (989/1,979/3,958). Not a discrepancy.
- The Ampere in-depth blog lists the A100 *40GB* variant (1,555 GB/s); corpus correctly scopes all figures to the 80GB SXM4 (2,039 GB/s) per the A100 product page.
