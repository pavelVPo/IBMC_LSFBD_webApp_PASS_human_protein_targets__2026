library(tidyverse)
library(RMariaDB)
library(DBI)

## Prepare SDF to compute MNA descriptors
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

# Import activity data to be modified latter
activity <- read_tsv("C:/.../activities.tsv")
# Import CSs IDs
cs_ids <- activity |> arrange(molregno) |> mutate(molregno = as.integer(molregno)) |> pull(molregno) |> unique()
n_cs_ids <- length(cs_ids)
cs_ids <- cs_ids |> str_c(collapse = ', ')
# Prepare the query to extract the CSs
structs__query <- dbSendQuery(con, str_glue('SELECT mh.molregno as original_id, mh.parent_molregno, cs.molfile, md.chembl_id as compound_id
                      FROM molecule_hierarchy mh JOIN
                           compound_structures cs JOIN
                           molecule_dictionary md
                      WHERE mh.molregno IN ({cs_ids}) AND
                      mh.parent_molregno = cs.molregno AND
                      mh.molregno = md.molregno'))
# Execute the query
structs__result <- dbFetch(structs__query)
structs__result <- structs__result |> distinct() |>
                        mutate(molfile = str_replace_all(molfile, "\r\n", "\n")) |>
                        mutate(molfile = str_replace_all(molfile, "\n", "\r\n"))
dbClearResult(structs__query)
dbDisconnect(con)

# Prepare SDF
structs <- structs__result |> distinct() |>
                              mutate(id_fld = "\r\n>  <id>\r\n", original_id_fld = "\r\n\r\n>  <original_id>\r\n",
                                      chembl_id_fld = "\r\n\r\n>  <chembl_id>\r\n", end_rec = "\r\n\r\n$$$$",
                                      molfile = str_trim(molfile, side = "right")) |>
                              select(molfile, id_fld, parent_molregno, original_id_fld, original_id,
                                      chembl_id_fld, compound_id, end_rec) |>
                              unite("record", molfile:end_rec, sep = "")

# Export CSs
write_lines(str_c("", structs[[1]]), "C:/.../structs_raw.SDF")

## Read the CSs along with the MNA [Filimonov, Dmitrii, et al. "Chemical similarity assessment through multilevel neighborhoods of atoms: definition and comparison with the other descriptors." Journal of chemical information and computer sciences 39.4 (1999): 666-670.] descriptors computed externally, any other descriptors, ordered and written as the string, could be used instead.
structs_described <- read_file("C:/.../structs_raw_SD.SDF") |> as_tibble()

## Gather based on MNA
# Parse
structs_ <- structs_described |>
                          separate_longer_delim(value, delim = "\r\n\r\n$$$$") |>
                          separate_wider_delim(value, delim = "\r\n>  <id>\r\n", names = c("molfile", "id"), too_many = "merge", too_few = "align_start") |>
                          separate_wider_delim(id, delim = "\r\n\r\n>  <original_id>\r\n", names = c("id", "rest"), too_many = "merge", too_few = "align_start") |>
                          separate_wider_delim(rest, delim = "\r\n\r\n>  <chembl_id>\r\n", names = c("orig_id", "rest"), too_many = "merge", too_few = "align_start") |>
                          filter(!is.na(id) & !str_detect(id, "PASS_ERR")) |>
                          separate_wider_delim(rest, delim = "\r\n>  <MNA_DESCRIPTORS>\r\n", names = c("chembl_id", "mna"), too_many = "merge", too_few = "align_start") |>
                          mutate(id = str_trim(id), orig_id = str_trim(orig_id),
                                  chembl_id = str_trim(chembl_id), mna = str_trim(mna), molfile = str_trim(molfile, side = "right")) |>
                          select(molfile, id, orig_id, chembl_id, mna)
# Gather
structs <- structs_ |> group_by(mna) |>
                        mutate(all_chembl_ids = str_c(chembl_id, collapse = ", ")) |>
                        mutate(all_orig_ids = str_c(orig_id, collapse = ", ")) |>
                        select(molfile, id, all_orig_ids, all_chembl_ids, mna) |>
                        slice_head(n = 1) |>
                        ungroup()

## Modify the activity data
structs_ids <- structs |> select(id, all_orig_ids) |> separate_longer_delim(all_orig_ids, delim = ", ")
activity_updated <- activity |> mutate(molregno = as.character(molregno)) |>
                                inner_join(structs_ids, by = c("molregno" = "all_orig_ids")) |>
                                mutate(molregno = id) |>
                                select(activity_id, aid, molregno, p_act)
# Export current results
write_tsv(activity_updated, "C:/.../activities_upd.tsv")
write_tsv(structs, "C:/.../structs.tsv", quote = "all")