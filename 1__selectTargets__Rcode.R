library(tidyverse)
library(RMariaDB)
library(DBI)

# Convinience, SEE: https://stackoverflow.com/questions/5831794/opposite-of-in-exclude-rows-with-values-specified-in-a-vector
`%not_in%` <- Negate(`%in%`)

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

### Targets
# Prepare the query to extract the IDs, classes (L1)
targets__query <- dbSendQuery(con, 'SELECT t.tid, t.chembl_id as target_id, t.pref_name as target_name, t.organism as target_organism, t.target_type,
                            tc.component_id,
                            cc.comp_class_id as component_class_id, pc.pref_name as target_class,
                            cg.go_id, gc.pref_name as target_process
                      FROM target_dictionary as t JOIN
                         target_components as tc JOIN
                         component_class as cc JOIN
                         protein_classification as pc JOIN
                         component_go as cg JOIN
                         go_classification as gc
                      WHERE t.tid = tc.tid AND
                          tc.component_id = cc.component_id AND
                          cc.protein_class_id = pc.protein_class_id AND
                          cg.component_id = cc.component_id AND
                          cg.go_id = gc.go_id')
# Execute the query
targets__result <- dbFetch(targets__query)
dbClearResult(targets__query)
# Stats
targets_description_1     <- targets__result |> group_by(target_id) |> summarize(n = n())
n_targets_1               <- targets__result |> pull(target_id) |> unique() |> length()
# Filter by target_type
targets_mol <- targets__result |> filter(target_type %in% c('CHIMERIC PROTEIN', 'PROTEIN COMPLEX', 'PROTEIN-PROTEIN INTERACTION',
                                                              'SINGLE PROTEIN'))
# Stats
targets_description_2   <- targets_mol |> group_by(target_id) |> summarize(n = n())
n_targets_2             <- targets_mol |> pull(target_id) |> unique() |> length()
# Vector of tids
tids_1 <- targets_mol |> pull(tid) |> str_c(collapse = ", ")

### Assays
# prepare main query
assays__query <- dbSendQuery(con, str_glue('SELECT a.tid, a.assay_id as aid, a.chembl_id as assay_id, a.assay_type, a.assay_test_type, a.assay_category, a.relationship_type, a.bao_format, a.variant_id, a.src_id, a.description
                                        FROM assays as a
                                        WHERE a.tid IN ({tids_1})'))
# Execute main query
assays__result <- dbFetch(assays__query) |> mutate(description = str_replace_all(description, "\t", " "))
dbClearResult(assays__query)
# prepare bao query
bao__query <- dbSendQuery(con, 'SELECT bao_id, label FROM bioassay_ontology')
# Execute bao query
bao__result <- dbFetch(bao__query)
dbClearResult(bao__query)
# Stats
assay_type_sum          <- assays__result |> group_by(assay_type) |> summarise(n = n())                                        # only binding and functional are needed (B and F)
assay_testtype_sum      <- assays__result |> group_by(assay_test_type) |> summarise(n = n())                                   # in vitro and NA are good
assay_category          <- assays__result |> group_by(assay_category) |> summarise(n = n())                                    # screening and other should be filtered out
assay_relation          <- assays__result |> group_by(relationship_type) |> summarise(n = n())                                 # D - direct, H - homolog, S - subcellular thing, U - no curration
assay_bao_sum           <- assays__result |> group_by(bao_format) |> summarise(n = n()) |> inner_join(bao__result, by = c('bao_format' = 'bao_id'))
assay_variant           <- assays__result |> group_by(variant_id) |> summarise(n = n())
assay_source            <- assays__result |> group_by(src_id) |> summarise(n = n())
n_assays                <- nrow(assays__result)
# So, which assays will be used?
# type: B, F
# test type: in vitro, NA
# category: no preferences
# relationship: D and S
# bao: BAO_0000357, BAO_0000219, BAO_0000019, BAO_0000221, BAO_0000223, BAO_0000249, BAO_0000251, BAO_0000220, BAO_0000366, BAO_0000224, BAO_0000252, BAO_0000217
# variant: just consider it latter
# source: exclude other major databases and patents (src_id: 38, 37, 7)
assays_all <- assays__result |> filter( (is.na(assay_test_type) | assay_test_type == 'in vitro') &
                                         assay_type %in% c('B', 'F') &
                                         ( is.na(assay_category) | (assay_category != 'screening' & assay_category != 'other' ) ) &
                                         relationship_type %in% c('D', 'S') &
                                         src_id != 38 &
                                         src_id != 37 &
                                         src_id != 7 &
                                         bao_format %in% c('BAO_0000357', 'BAO_0000219', 'BAO_0000019', 'BAO_0000221', 'BAO_0000223',
                                                            'BAO_0000249', 'BAO_0000251', 'BAO_0000220', 'BAO_0000366', 'BAO_0000224',
                                                            'BAO_0000252', 'BAO_0000217'))
# Stats
assay_type_sum_2          <- assays_all |> group_by(assay_type) |> summarise(n = n())                                        # only binding and functional are needed (B and F)
assay_testtype_sum_2      <- assays_all |> group_by(assay_test_type) |> summarise(n = n())                                   # in vitro and NA are good
assay_category_2          <- assays_all |> group_by(assay_category) |> summarise(n = n())                                    # screening and other should be filtered out
assay_relation_2          <- assays_all |> group_by(relationship_type) |> summarise(n = n())                                 # D - direct, H - homolog, S - subcellular thing, U - no curration
assay_bao_sum_2           <- assays_all |> group_by(bao_format) |> summarise(n = n()) |> inner_join(bao__result, by = c('bao_format' = 'bao_id'))
assay_variant_2           <- assays_all |> group_by(variant_id) |> summarise(n = n())
assay_source_2            <- assays_all |> group_by(src_id) |> summarise(n = n())
n_assays_2                <- nrow(assays_all)
# Prepare the vector of assay ids
aids <- assays_all |> pull(aid) |> unique() |> str_c(collapse = ", ")

### Activities
# Prepare the query
activity__query <- dbSendQuery(con, str_glue('SELECT a.activity_id, a.assay_id as aid, a.molregno, cp.full_mwt as mw, a.standard_type,
                                                a.standard_relation, a.standard_value, a.standard_units, a.activity_comment, a.data_validity_comment, a.potential_duplicate
                                              FROM activities as a JOIN 
                                                compound_properties as cp WHERE
                                              a.molregno = cp.molregno AND 
                                              a.assay_id IN ({aids})'))
# Execute activity query
activity__result <- dbFetch(activity__query)
dbClearResult(activity__query)
# Stats
act_standard_type_sum           <- activity__result |> group_by(standard_type) |> summarise(n = n())
act_standard_rel_sum            <- activity__result |> group_by(standard_relation) |> summarise(n = n())
act_standard_units_sum          <- activity__result |> group_by(standard_units) |> summarise(n = n())
act_comment_sum                 <- activity__result |> group_by(activity_comment) |> summarise(n = n())
act_dvc_sum                     <- activity__result |> group_by(data_validity_comment) |> summarise(n = n())
act_dupl_sum                    <- activity__result |> group_by(potential_duplicate) |> summarise(n = n())
n_activities <- nrow(activity__result)
# Basic filtering
activity_inter <- activity__result |> filter(standard_relation == '=' & potential_duplicate == '0' &
                                              (data_validity_comment == 'Manually_validated' | is.na(data_validity_comment)) & 
                                              standard_units %in% c('nM', 'uM', 'ug.mL-1') )
# Stats
act_standard_type_sum_2           <- activity_inter |> group_by(standard_type) |> summarise(n = n())
act_standard_rel_sum_2            <- activity_inter |> group_by(standard_relation) |> summarise(n = n())
act_standard_units_sum_2          <- activity_inter |> group_by(standard_units) |> summarise(n = n())
act_comment_sum_2                 <- activity_inter |> group_by(activity_comment) |> summarise(n = n())
act_dvc_sum_2                     <- activity_inter |> group_by(data_validity_comment) |> summarise(n = n())
act_dupl_sum_2                    <- activity_inter |> group_by(potential_duplicate) |> summarise(n = n())
n_activities_2                    <- nrow(activity_inter)
# Eliminate records having the following comments:
# c('Not Determined', 'Not Evaluated', 'Nd(Insoluble)', 'ND(Insoluble)', 'Not Tested', 'Not determined', 'ND(toxic)', 'Nd(Toxic)', 'Insoluble', 'NT', 'Not Determined(Insoluble)', 'ND(Unstable)', 'not determined', 'Not assayed', 'compound not obtained', 'Unstable')
# Leave only major activity types: c('IC50', 'Ki', 'EC50', 'Kd')
activity_filtered <- activity_inter |> filter(standard_type %in% c('IC50', 'Ki', 'EC50', 'Kd') & 
                                        (is.na(activity_comment) | activity_comment %not_in% c('Not Determined', 'Not Evaluated', 'Nd(Insoluble)', 'ND(Insoluble)', 'Not Tested', 'Not determined', 'ND(toxic)',
                                                                                            'Nd(Toxic)', 'Insoluble', 'NT', 'Not Determined(Insoluble)',
                                                                                            'ND(Unstable)', 'not determined', 'Not assayed', 'compound not obtained', 'Unstable'))) |>
                                  mutate(p_act = case_when(
                                                    standard_units == 'nM' ~ -log10(standard_value/10^9),
                                                    standard_units == 'uM' ~ -log10(standard_value/10^6),
                                                    standard_units == 'ug.mL-1' ~ -log10(standard_value/(mw *1000)),
                                                    .default = standard_value)
                                  )
# Stats
act_standard_type_sum_3           <- activity_filtered |> group_by(standard_type) |> summarise(n = n())
act_standard_rel_sum_3            <- activity_filtered |> group_by(standard_relation) |> summarise(n = n())
act_standard_units_sum_3          <- activity_filtered |> group_by(standard_units) |> summarise(n = n())
act_comment_sum_3                 <- activity_filtered |> group_by(activity_comment) |> summarise(n = n())
act_dvc_sum_3                     <- activity_filtered |> group_by(data_validity_comment) |> summarise(n = n())
act_dupl_sum_3                    <- activity_filtered |> group_by(potential_duplicate) |> summarise(n = n())
n_activities_3                    <- nrow(activity_filtered)

### Filtering join to leave only the targets and assays having activities at this point
assays_filtered   <- assays_all   |> semi_join(activity_filtered)
targets_filtered  <- targets_mol  |> semi_join(assays_filtered)
## Stats
# Assays
assay_type_sum_3          <- assays_filtered |> group_by(assay_type) |> summarise(n = n())                                        # only binding and functional are needed (B and F)
assay_testtype_sum_3      <- assays_filtered |> group_by(assay_test_type) |> summarise(n = n())                                   # in vitro and NA are good
assay_category_3          <- assays_filtered |> group_by(assay_category) |> summarise(n = n())                                    # screening and other should be filtered out
assay_relation_3          <- assays_filtered |> group_by(relationship_type) |> summarise(n = n())                                 # D - direct, H - homolog, S - subcellular thing, U - no curration
assay_bao_sum_3           <- assays_filtered |> group_by(bao_format) |> summarise(n = n()) |> inner_join(bao__result, by = c('bao_format' = 'bao_id'))
assay_variant_3           <- assays_filtered |> group_by(variant_id) |> summarise(n = n())
assay_source_3            <- assays_filtered |> group_by(src_id) |> summarise(n = n())
n_assays_3                <- nrow(assays_filtered)
# Targets
targets_description_3   <- targets_filtered |> group_by(target_id) |> summarize(n = n())
n_targets_3             <- targets_filtered  |> pull(target_id) |> unique() |> length()


### Export the results
dbDisconnect(con)
write_tsv(targets_filtered, "C:/.../targets.tsv")
write_tsv(assays_filtered, "C:/.../assays.tsv")
write_tsv(activity_filtered,"C:/.../activities.tsv")