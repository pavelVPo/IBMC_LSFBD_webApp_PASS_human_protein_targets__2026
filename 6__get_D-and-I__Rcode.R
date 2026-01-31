library(tidyverse)

# During the experiment aiming to assess the biological activity it is quite beneficial to have control over the as many parameters as possible,
# Especially if this activity is an effect on the particular biomacromolecular target.
# Simply to know that pertrubant actually interacts exactly with its target
# However, experiments having more degrees of freedom have their own benefits
# Often they are essential to know something
# Given all this, we will try to build distinct classifiers using data
# a) obtained in the experiments where molecular target is well defined and/or theorethically there is nothing except this target in the system, which could interfere with the results, D.
# b) obtained in the experimental systems having additional biological components, experiments conducted in cells, for example, I.

### Import the data
targets 	<- read_tsv("C:/.../targets_h_m_described.tsv", guess_max = 900000) |> mutate(tid = as.character(tid))
assays 		<- read_tsv("C:/.../assays_h_m.tsv", guess_max = 900000) |> mutate(tid = as.character(tid))
# What do we have here?
# target type -> only CHIMERIC PROTEIN and SINGLE PROTEIN are good for D
# assay type  -> both B and F are good for D
# bao_format  ->
# BAO_0000221 - tissue-based, not good for D; BAO_0000219 - cell_based, not good for D;
# BAO_0000357 - single_protein, good for D; BAO_0000019 - just assay_format, not good enough for D, but could detalised latter;
# BAO_0000249 - cell membrane, not good for D; BAO_0000223 - protein complex, not good for D;
# BAO_0000223 - cell-free, not enough for D;
# BAO_0000253 - mitochondrion format, not enough for D;
# BAO_0000220 - subcellular format, not enough for D;
# BAO_0000224 - protein format, not enough for D;
# So, experiments conducted using CHIMERIC PROTEIN and SINGLE PROTEIN targets in single-protein assays will go to D, other assays - to I
# all this could checked latter via reading or analyzing somehow assay descriptions, or, even re-reading the articles

### Subset targets and assays
# initial targets subsetting
targets_d <- targets |> filter(target_type == 'CHIMERIC PROTEIN' | target_type == 'SINGLE PROTEIN')
targets_i <- targets |> filter(target_type != 'CHIMERIC PROTEIN' | target_type != 'SINGLE PROTEIN')
# initial assays subsetting
assays_d <- assays |> filter(bao_format == "BAO_0000357")
assays_i <- assays |> filter(bao_format != "BAO_0000357")
# Make sure that targets_d and assays_d both have the same list of targets; also, make sure that targets_i and assays_i both have the same list of targets;
targets_d <- targets_d |> semi_join(assays_d)
assays_d  <- assays_d  |> semi_join(targets_d)
targets_i <- targets_i |> semi_join(assays_i)
assays_i  <- assays_i  |> semi_join(targets_i)

# Export the results
write_tsv(targets_d, "C:/.../targets_h_m_d.tsv")
write_tsv(targets_i, "C:/.../targets_h_m_i.tsv")
write_tsv(assays_d, "C:/.../assays_h_m_d.tsv")
write_tsv(assays_i, "C:/.../assays_h_m_i.tsv")