library(tidyverse)

# Connect
mysql_password = '***'
con <- dbConnect(
  drv = RMariaDB::MariaDB(),
  dbname = 'chembl_36',
  username = 'root',
  password = mysql_password,
  host = NULL, 
  port = 3306
)

### Import the data
targets 	<- read_tsv("C:/.../targets_h_described.tsv", guess_max = 900000)
assays 		<- read_tsv("C:/.../assays.tsv", guess_max = 900000)

### Process
## filter out assays, which targets are not in targets table
assays <- assays |> semi_join(targets)
## Filtering based on assay descriptions
## some filtering for the assays could be done using text describing them, however, the most of the universally important parameters, which could be found in the assay descriptions,
## nowadays are present as the data_validity_comment, activity_comment, variant_id, etc.
## Probably other interesting and important things could be found there using modern AI-techniques or manually while dealing with the speciffic tasks, but
## this time preparing the dataset for modeling without additional restricting criteria,
## I decided to ommit this step

## Add the information on the variant of the target used in the assay
vars_ids <- assays |> filter(!is.na(variant_id)) |> arrange(variant_id) |> pull(variant_id) |> unique() |> str_c(collapse = ", ")
# Prepare the query to extract the variants
vars__query <- dbSendQuery(con, str_glue('SELECT variant_id, mutation
                      FROM variant_sequences
                      WHERE variant_id IN ({vars_ids})'))
# Execute query
vars__result <- dbFetch(vars__query)
dbClearResult(vars__query)
dbDisconnect(con)
# Add the mutation's designations to the assay info
assays_m <- (assays |> mutate(variant_id = as.integer(variant_id))) |> left_join(vars__result)
# Introduce mutations' designations to the target ids
tid_m <- assays_m |> filter(!is.na(mutation)) |> select(tid, mutation) |> distinct()
targets_m_only <- targets |> inner_join(tid_m) |>
							 rowwise() |>
							 mutate(tid = str_c(tid, mutation, sep = "_"), target_id = str_c(target_id, mutation, sep = "_")) |>
							 ungroup() |>
							 select(-mutation)
targets_m <- bind_rows(targets |> mutate(tid = as.character(tid)), targets_m_only)
# Introduce mutations' designations to the tids in assays
assays_m <- assays_m |> rowwise() |>
						mutate(tid = if_else(!is.na(mutation), str_c(tid, mutation, sep = "_"), as.character(tid))) |>
						ungroup()

### Export the results
write_tsv(targets_m, "C:/.../targets_h_m_described.tsv")
write_tsv(assays_m, "C:/.../assays_h_m.tsv")