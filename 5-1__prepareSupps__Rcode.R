library(tidyverse)

### Import and process the data
targets_d 	<- read_tsv("C:/PHP_dev/automated_pt/data/targets_h_m_d.tsv", guess_max = 900000) |> mutate(tid = str_c("target_", tid, spe = "")) |> select(-target_organism)
targets_i 	<- read_tsv("C:/PHP_dev/automated_pt/data/targets_h_m_i.tsv", guess_max = 900000) |> mutate(tid = str_c("target_", tid, spe = "")) |> select(-target_organism)

### Export results
write_tsv(targets_d, "C:/PHP_dev/automated_pt/data/targets_d_supps.tsv")
write_tsv(targets_i, "C:/PHP_dev/automated_pt/data/targets_i_supps.tsv")