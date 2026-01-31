library(tidyverse)
library(RMariaDB)
library(DBI)

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
targets 	<- read_tsv("C:/.../targets.tsv", guess_max = 900000)
assays 		<- read_tsv("C:/.../assays.tsv", guess_max = 900000)

### Process the data
## Select human protein targets
targets_h <- targets |> filter(target_organism == 'Homo sapiens') |> distinct()
## Protein classes
target_class <- targets_h |> select(target_class) |> group_by(target_class) |> summarize(n = n())
# So, many of the classes are too particular to be useful in the context of the PT application.
# Thus, it is needed to extract the classes of the higher level
# It is needed to extract the top level parent for EACH child
# SQL-query will be complex and big, probably, this is the case when it will be easier to extract * and process the data outside
# prepare simple class query
class__query <- dbSendQuery(con, str_glue('SELECT *
                                        FROM protein_classification'))
# Execute class query
class__result <- dbFetch(class__query)
dbClearResult(class__query)
# Which level will be more useful: 1 or 2?
# level 1
level_1 <- class__result |> filter(class_level == 1)
level_1 <- level_1 |> arrange(pref_name) |> pull(pref_name)
level_1
# "Adhesion", "Auxiliary transport protein", "Enzyme",
# "Epigenetic regulator", "Ion channel", "Membrane receptor",
# "Other cytosolic protein", "Other membrane protein", "Other nuclear protein",
# "Secreted protein", "Structural protein", "Surface antigen",
# "Transcription factor", "Transporter", "Unclassified protein"
# 15 entities, pretty clear and concise
# level 1
level_2 <- class__result |> filter(class_level == 2)
level_2 <- level_2 |> arrange(pref_name) |> pull(pref_name)
level_2
# 40 entities, information content is much higher, but it will be hard to navigate through them using the planned graphical interface
# So, the choice is to use Level 1 at the moment
# The task is to find the class of the level one for each component_class_id
# The cool thing about the data is that the whole hierarchy is given for each entity, see: protein_class_desc in class_result
classes <- class__result |> select(pref_name, protein_class_desc) |> distinct()
targets_hc <- targets_h |> inner_join(classes, by = c("target_class" = "pref_name"), relationship = "many-to-many") |>
									mutate(target_class = str_replace(protein_class_desc, "  .*", "")) |>
									select(tid, target_id, target_name, target_organism, target_type, target_class) |>
									group_by(target_id) |>
									mutate(target_class = str_c(target_class |> sort() |> unique(), collapse = " | ")) |>
									ungroup() |>
									distinct()
# 4 775 human protein targets at this point, some targets belong to the several classes simultaneously, i.e. Integrin alpha-L: adhesion & membrane receptor
## GO-terms for biological processes
target_proc <- targets_h |> select(target_process) |> group_by(target_process) |> summarize(n = n())
# Here is the similar situation: at this point there are 254 GO-terms describing various aspects at the various levels,
# It is needed to select level one terms describing biological processes
# prepare simple GO query
go__query <- dbSendQuery(con, str_glue('SELECT *
                                        FROM go_classification
                                        WHERE class_level = 1 AND
                                        	aspect = "P"'))
# Execute class query
go__result <- dbFetch(go__query)
dbClearResult(go__query)
# So, there are 52 terms describing biological processes in general, it is time to join them with the targets
targets_hp <- targets_h |> inner_join(go__result) |>
							select(tid, target_process) |>
							distinct() |>
							group_by(tid) |>
							mutate(target_process = str_c(target_process |> sort() |> unique(), collapse = " | ")) |>
							ungroup() |>
							distinct()
# So, about 50 level one GO-terms for biological processes are available for the 4095 human protein targets
# Still, 50 is few to many for the planned graphical interface, thus, about 10 of the most represented terms will be shown to the user
## Prepare full description of the targets
targets_h_described <- targets_hc |> left_join(targets_hp)

### Export the results
write_tsv(targets_h_described, "C:/.../targets_h_described.tsv")
dbDisconnect(con)