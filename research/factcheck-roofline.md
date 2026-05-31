# Factcheck: roofline-math

VERDICT: PASS

Reviewed `src/corpus/roofline-math.json` and `.sources.json`. All formulas, definitions, and worked arithmetic verified against cited canonical sources.

## Formula verification (against sources)
- Roofline `P = min(π, β×I)` — confirmed verbatim on Wikipedia Roofline article ("P = min {π, β × I}"), itself sourced from Williams/Waterman/Patterson CACM 2009. ✓
- Arithmetic intensity = FLOPs / DRAM-bytes — confirmed (I = W/Q, FLOPs/byte; DRAM traffic not cache). ✓
- Ridge point `I_ridge = π/β`, memory-bound iff `I < π/β` — confirmed. Wikipedia uses `≤` on both sides because at I=π/β both bounds give P=π (boundary coincides); corpus's strict-`<` / `≥` split is mathematically equivalent at the boundary. Not an error. ✓
- Little's Law `L = λW` — confirmed verbatim; valid for any stable/stationary system regardless of arrival or service distribution. ✓
- Throughput = concurrency/latency (= L/W) — correct rearrangement. ✓
- Ring all-reduce per-node = `2(N−1)/N × S`, saturating at 2S — confirmed (source notation 2N(P−1)/P with their N=data, P=procs; reduce-scatter + all-gather, each (N−1)/N×S). Direction correct: per-node volume, approaches 2S as N→∞. ✓

## Worked arithmetic (re-derived by hand)
- A100 roofline: min(312, 2×10) = 20 TFLOP/s; 20/312 = 6.4% ≈ "6%"; double I→ min(312,40)=40 TFLOP/s. ✓
- DGEMM intensity: 2N³/(3N²·8) = 2N³/24N² = N/12. ✓
- Vector add: N ops / (3N·8) = 1/24 ≈ 0.0417 ≈ "0.04". ✓
- Ridge point: 312/2 = 156 FLOP/byte. ✓
- Attention I=20: min(312,40)=40 TFLOP/s; 40/312 = 12.8% ≈ "13%"; 87% idle. ✓
- Little's Law: 2e12 × 4e-7 = 8.0e5 = 800,000 bytes; ÷64 = 12,500 requests. ✓
- All-reduce N=8: 2×7/8×1GB = 1.75 GB; 1.75/200 = 8.75 ms. ✓
- All-reduce N=64: 2×63/64×1GB = 1.96875 ≈ 1.97 GB; /200 = 9.84 ms ≈ "9.8 ms"; 9.84/8.75 = +12%; 64/8 = 8× GPUs. ✓

No factual, formula, or arithmetic errors found.
