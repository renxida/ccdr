# Fact-check: trainium-hierarchy

Date: 2026-05-31. Method: WebFetch of each cited source + hand re-derivation of computed figures.

## Sources fetched
- trn2-arch.html (Neuron docs, latest) — spec tables for chip / trn2.48xlarge / UltraServer
- trainium2.html (Neuron docs, latest) — Trainium2 chip + gen-over-gen comparison table
- neuron-core-v3.html (Neuron docs, latest) — NeuronCore-v3 engine specs
- trainium.html (Neuron docs, v2.9.1) — Trainium1 device specs
- trn1-arch.html (Neuron docs, latest) — Trn1 topology (memory/bw specs NOT on this page)
- aws.amazon.com/ec2/instance-types/trn1/ and /trn2/ — marketing spec pages

## Verified correct (no action)
- NeuronCore-v3: 4 engines (Tensor/Vector/Scalar/GPSIMD); 28 MB SRAM; 158 cFP8 TFLOPS; 79 BF16 TFLOPS; structured sparsity up to 316 TFLOPS/core. All match source.
- Trainium2 chip: 8 NeuronCore-v3; 96 GiB HBM; 2.9 TB/s; 1,299 FP8 TFLOPS dense; 667 BF16 TFLOPS. All match.
- Trainium1 device: 2x NeuronCore-v2; 190 BF16 TFLOPS; 32 GB HBM; 820 GB/s. All match (v2.9.1 trainium.html).
- NeuronLink-v2 384 GB/s/chip: the trainium2.html gen-comparison table lists "Inter-chip Interconnect 384 GB/sec/chip" for Trainium. Confirmed (see note below re. tension with AWS marketing 768 figure).
- trn2.48xlarge: 16 chips; 1,536 GiB; 46.4 TB/s; 20.8 FP8 PFLOPS; 10.7 BF16 PFLOPS; 3,200 Gbps EFAv3; 2D 4x4 torus. All match.
- Trn2 UltraServer: 64 chips; 6,144 GiB; 185.6 TB/s; 83.2 FP8 PFLOPS; 42.8 BF16 PFLOPS; inter-instance NeuronLink 256 GB/s/chip; 12,800 Gbps (12.8 Tbps) EFAv3. All match.
- Trn1.32xlarge: 16 chips; 512 GB HBM; 9.8 TB/s — confirmed by aws.amazon.com/ec2/instance-types/trn1/.
- Derived ~3 PFLOPS Trn1 BF16: 16 x 190 TFLOPS = 3.04 PFLOPS; AWS Trn1 page independently says "up to 3 petaflops of FP16/BF16." Correct.
- Derived roofline knee: 83,200 / 185.6 = 448.3 FLOPS/byte. Correct.
- Derived aggregate intra-server NeuronLink: 64 x 1,024 GB/s = 65,536 GB/s = 65.5 TB/s. Correct.
- Derived bisection 1.6 TB/s: 12,800 Gbps = 1,600 GB/s = 1.6 TB/s. Correct.

## Problems found

### 1. ERROR — arithmetic — ultracluster tier 3 ("8.6x lower")
Text: inter-server bisection ~1.6 TB/s is "about 8.6x lower than the aggregate intra-server NeuronLink-v3 bandwidth of 65.5 TB/s."
65.5 / 1.6 = ~41x, not 8.6x. Both endpoint numbers (65.5 and 1.6) are individually correct, so the ratio is simply mis-computed.
Fix: change "about 8.6x lower" to "about 41x lower."

### 2. ERROR — source mismatch — trainium2-chip tier 3 ("NeuronLink-v3 ... 1,024 GB/s chip-to-chip")
Cited source trainium2.html states NeuronLink-v3 is "1.28 TB/sec bandwidth per chip" (= 1,280 GB/s), and its gen-comparison table lists Trainium2 inter-chip interconnect = 1,280 GB/sec/chip. The claim of 1,024 contradicts the cited page.
Note: the trn2-arch.html spec table separately lists *intra-instance* NeuronLink-v3 = 1,024 GB/sec/chip. The two AWS doc pages genuinely disagree (1,024 vs 1,280); 1,280 appears to be the raw per-chip link bandwidth and 1,024 the usable intra-instance figure.
Fix: either re-cite this clause to trn2-arch.html (which says 1,024), or change the number to 1,280 to match trainium2.html. Recommend re-citing to trn2-arch.html and keeping 1,024 for internal consistency with the rest of the corpus.

### 3. ERROR — source mismatch — neuronlink tier 3 ("1,024 GB/s per chip—a 2.7x increase", cites trainium2.html)
Same conflict: trainium2.html gives 1,280 GB/s/chip, not 1,024. 1,024/384 = 2.67x (consistent with the stated 2.7x), but the source number is wrong. If corrected to the source's 1,280: 1,280/384 = 3.3x.
Fix: re-cite to trn2-arch.html (supports 1,024 and 2.7x), OR update to "1,280 GB/s per chip—a 3.3x increase" to match trainium2.html.

## Notes (not errors)
- NeuronLink-v2 384 vs 768: AWS marketing trn1 page says "up to 768 GB/s of NeuronLink" (a per-instance/aggregated framing); the cited Neuron-docs trainium2.html gen table says 384 GB/sec/chip. The corpus claim is per-chip and matches its cited source, so it passes. Be aware these are different aggregations.
- trn1-arch.html (latest) does NOT contain the 512 GB / 9.8 TB/s numbers cited for it in two ledger entries; those numbers are correct but are sourced from the AWS marketing trn1 page instead. Citation-target inaccuracy, not a numeric error — left out of the verdict list but worth fixing the source URL.
