# Phylomatic -- JOSS publication roadmap

Work needed to make the JOSS submission bulletproof. Ordered roughly by impact on reviewers.

---

## 1. Validation study

The single most important thing missing. Download 20+ publicly available `.ab1` pairs with known species identities (NCBI SRA, ATCC collections, or teaching lab datasets). Run each through Phylomatic. Report a table:

| Sample | Known species | Phylomatic top hit | Identity % | Tree placement agrees? |
|--------|--------------|-------------------|------------|----------------------|

Show that Phylomatic gets the right answer. Compute accuracy (% correct at genus level, % correct at species level). Include this table as a figure or supplementary in the paper.

Where to find `.ab1` files with known species:
- NCBI Trace Archive (search for 16S + organism name)
- ATCC 16S reference strains (many have public chromatograms)
- Ask teaching lab colleagues if they have archived student data with confirmed IDs
- Generate your own from a few lab strains if needed

This alone turns the paper from "we built a tool" into "we built and validated a tool."

---

## 2. Species-level confidence scoring

BLAST identity alone doesn't tell you how trustworthy the identification is. Two scenarios feel very different:

- Top hit: *E. coli* at 99.8%, second-best different species: *Salmonella* at 94.2% --> high confidence
- Top hit: *E. coli* at 98.7%, second-best different species: *Shigella* at 98.5% --> low confidence

Implement a confidence metric based on:
- **Identity gap**: difference in identity % between the top hit and the best hit from a *different* species
- **Tree separation**: branch length distance between the query and the nearest clade boundary in the NJ tree
- **Coverage consistency**: whether the top N hits all point to the same genus

Output a confidence level (HIGH / MODERATE / LOW) alongside the top hit. Display it in the UI next to the species name.

This is genuinely useful, easy to implement, and nobody does it automatically for single-isolate Sanger ID.

---

## 3. Smarter consensus assembly

The current approach picks the higher-quality base at each position, assuming the reads are already aligned from position 0. That's what people do by hand and it has two problems:

**Problem A: no proper overlap detection.** The forward and reverse reads don't start at the same position. Right now we just zip them together from index 0. Instead:
- Use BioPython's `PairwiseAligner` to find the actual overlap region between the trimmed forward read and the reverse-complemented reverse read
- Only call consensus within the overlap; use single-read sequence outside it
- This produces a longer, more accurate consensus

**Problem B: naive base calling.** Picking the higher-PHRED base is fine but not optimal. A better approach:
- At each overlapping position, compute a weighted consensus using PHRED scores as log-probability weights
- If both reads agree, the effective quality is higher than either alone
- If they disagree and qualities are close, flag the position as ambiguous (N) rather than guessing
- Report the number of ambiguous positions as a quality metric

Benchmark: compare the old and new assembly on the validation dataset. Show fewer Ns, longer consensus, or higher BLAST identity.

---

## 4. Contamination and quality checks

Before burning 3 minutes on BLAST, catch bad samples early:

- **Mixed peak detection**: scan the chromatogram for positions where two peaks are nearly equal height (secondary peak > 50% of primary). If more than 10% of positions have mixed peaks, flag as possible contamination or mixed culture.
- **Minimum quality threshold**: if the trimmed consensus is shorter than some minimum (say 200 bp for 16S), warn the user that the read quality is too low for reliable identification.
- **N content check**: if more than 5% of the consensus is ambiguous bases, warn before proceeding.

Display warnings in the UI before the pipeline runs. Let the user decide whether to continue.

---

## 5. ML tree option

Neighbor-Joining is fast but not the method most reviewers would choose for a publication figure. Add FastTree as an optional tree method:

```python
# In tree.py, add:
import subprocess

def build_ml_tree(aligned_fasta: str) -> str:
    """Build a maximum-likelihood tree using FastTree."""
    # Write aligned FASTA to temp file
    # Run: FastTree -nt -gtr aligned.fasta
    # Parse stdout as Newick
    ...
```

- Make it a toggle in the UI: "Tree method: NJ (fast) / ML (recommended)"
- NJ stays the default for speed; ML is the option for publication-quality trees
- Add FastTree to the Docker image
- In the paper, mention that both methods are available and that ML should be preferred for publication

---

## 6. Expand test coverage

JOSS reviewers check tests. Current state: 3 test files, all mocked. Needed:

- **Integration test with real `.ab1` files**: include a small pair of real chromatograms in `tests/sample_data/` and mark the test as `@pytest.mark.integration`
- **Entrez module tests**: currently zero. Add tests for batch splitting, retry logic, and response parsing with mocked HTTP
- **Alignment module tests**: currently zero. Add tests for multi-FASTA construction, poll timeout handling, and the "Query must be in output" validation
- **End-to-end pipeline test**: mock all external APIs, run the full `jobs.run_pipeline()`, and verify the result dict has all expected keys

Target: every module has at least 3 tests (assembly and blast already do, tree has 4).

---

## Suggested order for the weekend

1. **Validation study** (highest impact, can do with existing code)
2. **Confidence scoring** (small code change, big reviewer impression)
3. **ML tree option** (if FastTree is easy to install on your machine)
4. **Expand tests** (do this as you go)
5. **Smarter assembly** and **QC checks** (if time permits)

Items 1 and 2 together are probably enough to make the paper clearly publishable. Items 3-5 make it strong.

---

## Paper updates after implementation

Once the above is done, update `paper.md`:
- Add the validation table or reference a supplementary file
- Mention confidence scoring in the Software Design section
- Mention ML tree support
- Update the Research Impact section with any classroom usage data
- Bump word count if needed (JOSS allows up to 1750 words)
