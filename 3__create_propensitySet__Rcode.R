library(tidyverse)

# Import the data
targets 	<- read_tsv("C:/.../targets.tsv", guess_max = 900000) |> select(tid, target_id) |> distinct()
assays 		<- read_tsv("C:/.../assays.tsv", guess_max = 900000)
activities 	<- read_tsv("C:/.../activities_upd.tsv", guess_max = 900000)
structs 	<- read_tsv("C:/.../structs.tsv", guess_max = 900000) |> mutate(molfile = str_trim(molfile)) |>
																	   mutate(molfile = case_when(
																	   		str_match(molfile, regex(".*V2000", dotall = TRUE)) |> str_count("\n") == 3 ~ molfile,
				  															str_match(molfile, regex(".*V2000", dotall = TRUE)) |> str_count("\n") == 2 ~ str_c("\r\n", molfile, sep = ""),
				  															str_match(molfile, regex(".*V2000", dotall = TRUE)) |> str_count("\n") == 1 ~ str_c("\r\n\r\n", molfile, sep = ""),
				  															str_match(molfile, regex(".*V2000", dotall = TRUE)) |> str_count("\n") == 0 ~ str_c("\r\n\r\n\r\n", molfile, sep = ""),
				  															.default = molfile
																	   	))

# Join the datasets
data <- targets |> inner_join(assays) |> inner_join(activities) |> inner_join(structs, by = c("molregno" = "id"))
data_prop <- data |> select(molfile, tid, molregno, all_chembl_ids) |> distinct() |>
						mutate(target_id = str_c("target_", tid, sep = "")) |>
						group_by(molregno) |>
						mutate(activity = str_c(target_id, collapse = "\r\n")) |>
						slice_head(n = 1) |>
						ungroup()

# Export dataset
sdf_prop <- data_prop |> distinct() |>
                   mutate(id_fld = "\r\n>  <compound_id>\r\n", chembl_id_fld = "\r\n\r\n>  <chembl_ids>\r\n",
                   					  activity_fld = "\r\n\r\n>  <activity>\r\n", end_rec = "\r\n\r\n$$$$",
                                      molfile = str_trim(molfile, side = "right")) |>
                              select(molfile, id_fld, molregno, chembl_id_fld, all_chembl_ids,
                                      activity_fld, activity, end_rec) |>
                              unite("record", molfile:end_rec, sep = "")
write_lines(sdf_prop[[1]], "C:/.../propensity_set.SDF", sep = "\r\n")