library(tidyverse)
library(tableHTML)

## Import the data
targets_described <- read_tsv(".../targets.tsv") |>
						select(tid, target_id, target_name) |>
						mutate(tid = as.character(tid)) |>
						mutate(target_id = str_glue('&#60;a class = "link_target_chembl" href="https://www.ebi.ac.uk/chembl/explore/target/{target_id}" target = "_blank"&#62; {target_id} &#60;/a&#62;')) |>
						distinct()
targets_p <- read_tsv("C:/.../pt_36_p.tsv") |> filter( Number > 9 ) |>
						rename(`Number, propensity` = Number, `IAP, propensity` = IAP, activity_id = `Activity Type`) |>
						mutate(tid = str_replace(activity_id, "target_", "") |> str_trim()) |>
						inner_join(targets_described) |>
						rename(chembl_id = target_id) |>
						select(-activity_id)
targets_i <- read_tsv("C:/.../pt_36_i.tsv") |> filter( Number > 9 ) |>
						rename(`Number, indirect` = Number, `IAP, indirect` = IAP, activity_id = `Activity Type`) |>
						mutate(tid = str_replace(activity_id, "target_", "")) |>
						mutate(variant = str_extract(tid, "_.*") |> str_replace("_", "")) |>
						mutate(tid = str_replace(tid, "_.*", "")) |>
						distinct()
targets_d <- read_tsv("C:/.../pt_36_d.tsv") |> filter( Number > 9 ) |>
						rename(`Number, direct` = Number, `IAP, direct` = IAP, activity_id = `Activity Type`) |>
						mutate(tid = str_replace(activity_id, "target_", "")) |>
						mutate(variant = str_extract(tid, "_.*") |> str_replace("_", "")) |>
						mutate(tid = str_replace(tid, "_.*", "")) |>
						distinct()

## Prepare the data
hp_targets_i <- targets_p |> left_join(targets_i, by = "tid") |>
								filter(!is.na(`IAP, indirect`))
hp_targets_d <- targets_p |> left_join(targets_d, by = "tid") |>
						   		filter(!is.na(`IAP, direct`))

## Prepare and export lists of activities, which are allowed for prediction
# allowed I-targets
i_list <- hp_targets_i |> pull(activity_id) |> unique()
# allowed D-targets
d_list <- hp_targets_d |> pull(activity_id) |> unique()
# export
write_lines(i_list, "C:/.../allowed_i.txt")
write_lines(d_list, "C:/.../allowed_d.txt")

## Prepare and export tabless of activities, which are allowed for prediction
hp_targets_i |> arrange(target_name) |>
		select(target_name, chembl_id, variant, `Number, propensity`, `Number, indirect`, `IAP, propensity`, `IAP, indirect`) |>
		tableHTML() |>
		str_replace_all("&#60;", "<") |>
		str_replace_all("&#62;", ">") |>
		write_lines("C:/.../allowed_i.html")
hp_targets_d |> arrange(target_name) |>
		select(target_name, chembl_id, variant, `Number, propensity`, `Number, direct`, `IAP, propensity`, `IAP, direct`) |>
		tableHTML() |>
		str_replace_all("&#60;", "<") |>
		str_replace_all("&#62;", ">") |>
		write_lines("C:/.../allowed_d.html")
