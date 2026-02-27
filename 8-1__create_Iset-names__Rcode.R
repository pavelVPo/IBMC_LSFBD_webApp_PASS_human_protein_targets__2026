library(tidyverse)

# The main thing here is to aggregate activity records by structures and make the final judgement whether CS iteracts with the particula target significantly or not
# There are quantitative measures of interaction and pertrubation of the target's activity,
# their median value will be used, since the filtering was quite basic and some outliers could be present characterizing the interaction from unusual side
# Next, some cut-off value will be used to discriminate between actives and inactives
# Traditionally, cut-off values of 10 uM, 1 uM and so on are used widely with regards to activity against the protein targets
# However, such cut-offs, when applied universally, do not take into account degree of the target's novelty:
# novel targets can have lesser amount of the known interactants, thus, cut-off may be higher to find something interesting
# established targets can have large number of the known interactants, thus, cut-off should be lower to approach/facilitate the findings of something interesting
# Thus, it is also not uncommon to select the cut-off value based solely on the distribution of activity measures for the known interactants
# This approach seems to be quite rational, but, because of the some pecularities of the chemical and biological studies, the results could end up to be dubious
# Probably these approaches could be combined nicely to highlight their positive sides and mitigate the limitations:
# Median value will be computed
# Several cut-offs, which seems to be reasonable, will be tried: 1 uM, 5 uM and 10 uM
# Among them the one cut-off will be selected for each target independently
# The particular cut-off will be selected in such a way that it divides the dataset in two subsets having approximately equal sizes
# More or less equal sizes of the subsets could be beneficial latter


### Import the data
targets 	<- read_tsv("C:/.../targets_h_m_i.tsv", guess_max = 900000) |> mutate(tid = as.character(tid))
assays 		<- read_tsv("C:/.../assays_h_m_i.tsv", guess_max = 900000) |> mutate(tid = as.character(tid))
activities 	<- read_tsv("C:/.../activities_upd.tsv", guess_max = 900000)
structs 	<- read_tsv("C:/.../structs.tsv") |> mutate(molfile = str_trim(molfile)) |>
																	   mutate(molfile = case_when(
																	   		str_match(molfile, regex(".*V2000", dotall = TRUE)) |> str_count("\n") == 3 ~ molfile,
				  															str_match(molfile, regex(".*V2000", dotall = TRUE)) |> str_count("\n") == 2 ~ str_c("\r\n", molfile, sep = ""),
				  															str_match(molfile, regex(".*V2000", dotall = TRUE)) |> str_count("\n") == 1 ~ str_c("\r\n\r\n", molfile, sep = ""),
				  															str_match(molfile, regex(".*V2000", dotall = TRUE)) |> str_count("\n") == 0 ~ str_c("\r\n\r\n\r\n", molfile, sep = ""),
				  															.default = molfile
																	   	))

### Process activities
# Join assays and activities
activities_a <- assays |> inner_join(activities)
# Calculate median activity values
activities_a_m <- activities_a |> group_by(tid, molregno) |>
								  mutate(p_act = median(p_act)) |>
								  slice_head(n = 1) |>
								  ungroup()
# Check cut-offs
activities_a_m_c <- activities_a_m |> mutate(activity_1 = if_else(p_act >= 6, "active", "inactive" ),
											 activity_5 = if_else(p_act >= 5.3, "active", "inactive" ),
											 activity_10 = if_else(p_act >= 5, "active", "inactive" )) |>
									  mutate(active_dummy = "active") |>
									  mutate(inactive_dummy = "inactive") |>
									  pivot_longer(cols = c(active_dummy, inactive_dummy), names_to = "activity_dummy", values_to = "activity" )
cutoffs <- activities_a_m_c |> group_by(tid, activity) |> summarize(n = n()) |>
				  left_join( activities_a_m_c |> group_by(tid, activity_1) |> summarize(n_1 = n()) |> rename(activity = activity_1) ) |>
				  left_join( activities_a_m_c |> group_by(tid, activity_5) |> summarize(n_5 = n()) |> rename(activity = activity_5) ) |>
				  left_join( activities_a_m_c |> group_by(tid, activity_10) |> summarize(n_10 = n()) |> rename(activity = activity_10) ) |>
				  replace_na(list(n_1 = 0, n_5 = 0, n_10 = 0)) |>
				  pivot_wider(names_from = activity, values_from = c(n, n_1, n_5, n_10)) |>
				  select(-n_active, -n_inactive) |>
				  rowwise() |>
				  mutate(ratio_1  = n_1_active / n_1_inactive) |>
				  mutate(ratio_5  = n_5_active / n_5_inactive) |>
				  mutate(ratio_10 = n_10_active / n_10_inactive) |>
				  ungroup() |>
				  select(tid, ratio_1, ratio_5, ratio_10) |>
				  mutate(cutoff = case_when(
				  			abs(1 - ratio_1) <= abs(1 - ratio_5) & abs(1 - ratio_1) <= abs(1 - ratio_10) ~ 6,
				  			abs(1 - ratio_5) <= abs(1 - ratio_1) & abs(1 - ratio_5) <= abs(1 - ratio_10) ~ 5.3,
				  			abs(1 - ratio_10) <= abs(1 - ratio_1) & abs(1 - ratio_10) <= abs(1 - ratio_5) ~ 5,
				  			.default = 1
				  	)) |>
				  select(tid, cutoff)
# Apply the selected cut-off
activities_all <- activities_a_m_c |> inner_join(targets, by = "tid") |>
										select(tid, target_name, target_id, target_organism, molregno, p_act) |>
										distinct() |>
										inner_join(cutoffs) |>
										mutate(activity = if_else(p_act >= cutoff, str_glue("{target_name} ({target_id}; {target_organism})"),
														str_glue("!{target_name} ({target_id}; {target_organism})")), activity_n = if_else(p_act >= cutoff, 1, 0)) |>
										select(-target_name, -target_id, -target_organism)
actives <- activities_all |> filter(activity_n == 1) |> group_by(molregno) |>
									mutate(activity 	= str_c(activity, collapse = "\r\n"),
										   activity_val = str_c(p_act, collapse = "\r\n"),
										   cutoff = str_c(cutoff, collapse = "\r\n")) |>
									slice_head(n=1) |>
									ungroup() |>
									select(molregno, activity, activity_val, cutoff)

### Prepare the dataset
sdf <- structs |> select(-mna) |> inner_join(actives, by = c("id" = "molregno")) |>
								  mutate(id_fld = "\r\n>  <compound_id>\r\n", chembl_id_fld = "\r\n\r\n>  <chembl_ids>\r\n",
                   					  	 activity_fld = "\r\n\r\n>  <activity>\r\n", activity_fld = "\r\n\r\n>  <activity>\r\n",
                   					  	 activity_val_fld = "\r\n\r\n>  <activity_value>\r\n", cutoff_fld = "\r\n\r\n>  <cutoffs>\r\n", end_rec = "\r\n\r\n$$$$",
                                      molfile = str_trim(molfile, side = "right")) |>
                              select(molfile, id_fld, id, chembl_id_fld, all_chembl_ids,
                                      activity_fld, activity, activity_val_fld, activity_val, cutoff_fld, cutoff, end_rec) |>
                              unite("record", molfile:end_rec, sep = "")

### Export the Direct dataset
write_lines(sdf[[1]], "C:/.../PT_36_i-names.SDF", sep = "\r\n")