<?php
//Path to software
$pass_path = "...\\";
// IDs
$uid = uniqid();
$sdf_name = $pass_path.$uid.".SDF";
$task_p_name = $pass_path.$uid."_p.task";
$task_i_name = $pass_path.$uid."_i.task";
$task_d_name = $pass_path.$uid."_d.task";
//Get the data
$data_str = file_get_contents('php://input');
$data = json_decode($data_str, true);
$structure = "\r\n".trim($data['molfile'])."\r\n>  <id>\r\n".$uid."\r\n\r\n$$$$";

// Prepare the tasks for prediction
$task_p = "InputName=".$uid.".SDF\r\nOutputName=".$uid."_p.csv\r\nBaseName=pt36p.SAR\r\nIdKeyField=<id>";
$task_i = "InputName=".$uid.".SDF\r\nOutputName=".$uid."_i.csv\r\nBaseName=pt36i.SAR\r\nIdKeyField=<id>";
$task_d = "InputName=".$uid.".SDF\r\nOutputName=".$uid."_d.csv\r\nBaseName=pt36d.SAR\r\nIdKeyField=<id>";
// Write the structure and task
$structure_file = fopen($sdf_name, "w");
$task_file = fopen($task_p_name, "w");
fwrite($structure_file, $structure);
fwrite($task_file, $task_p);
fclose($structure_file);
fclose($task_file);
$task_file = fopen($task_i_name, "w");
fwrite($task_file, $task_i);
fclose($task_file);
$task_file = fopen($task_d_name, "w");
fwrite($task_file, $task_d);
fclose($task_file);

// Assess propensity
//Descriptors
$descriptorspec = array(
   0 => array("pipe", "r"),
   1 => array("pipe", "w"),
   2 => array("pipe", "w")
);
//Command
$command = $pass_path."PASS2CSV.exe ".$task_p_name;
//Process
$process = proc_open(
        $command,
        $descriptorspec,
        $pipes
);
//Do the thing
if (is_resource($process)) {
	//Write
	//fwrite($pipes[0]);
   fclose($pipes[0]);
   //Get the results
   $process_result = stream_get_contents($pipes[1]);
   fclose($pipes[1]);
   fclose($pipes[2]);
   //Shutdown the process
   proc_close($process);
}
// Predict indirect
//Descriptors
$descriptorspec = array(
   0 => array("pipe", "r"),
   1 => array("pipe", "w"),
   2 => array("pipe", "w")
);
//Command
$command = $pass_path."PASS2CSV.exe ".$task_i_name;
//Process
$process = proc_open(
        $command,
        $descriptorspec,
        $pipes
);
//Do the thing
if (is_resource($process)) {
   //Write
   //fwrite($pipes[0]);
   fclose($pipes[0]);
   //Get the results
   $process_result = stream_get_contents($pipes[1]);
   fclose($pipes[1]);
   fclose($pipes[2]);
   //Shutdown the process
   proc_close($process);
}
// Predict direct
//Descriptors
$descriptorspec = array(
   0 => array("pipe", "r"),
   1 => array("pipe", "w"),
   2 => array("pipe", "w")
);
//Command
$command = $pass_path."PASS2CSV.exe ".$task_d_name;
//Process
$process = proc_open(
        $command,
        $descriptorspec,
        $pipes
);
//Do the thing
if (is_resource($process)) {
   //Write
   //fwrite($pipes[0]);
   fclose($pipes[0]);
   //Get the results
   $process_result = stream_get_contents($pipes[1]);
   fclose($pipes[1]);
   fclose($pipes[2]);
   //Shutdown the process
   proc_close($process);
}
//Check if predicted
$is_done = preg_match("|.*1 of 1 Substances are predicted.*|", @file_get_contents($pass_path.$uid."_d.HST"));
if ($is_done == '1') {
//Read the supps, SEE: https://stackoverflow.com/questions/9139202/how-to-parse-a-csv-file-using-php
// D
$supps_d = [];
$index_d = 0;
$handle = fopen($pass_path."targets_d_supps.stable", "r");
while (($row = fgetcsv($handle, null, "\t")) !== FALSE) {
    // do something with the row values
    $supps_d[$row[0]]['id'] = $row[0];
    $supps_d[$row[0]]['chembl_id'] = $row[1];
    $supps_d[$row[0]]['name'] = $row[2];
    $supps_d[$row[0]]['type'] = $row[3];
    $supps_d[$row[0]]['class'] = $row[4];
    $supps_d[$row[0]]['process'] = $row[5];
    $index_d++;
}
fclose($handle);
//echo "</br>";
//print_r($supps_d);
//echo "</br>";
// I
$supps_i = [];
$index_i = 0;
$handle = fopen($pass_path."targets_i_supps.stable", "r");
while (($row = fgetcsv($handle, null, "\t")) !== FALSE) {
    // do something with row values
    $supps_i[$row[0]]['id'] = $row[0];
    $supps_i[$row[0]]['chembl_id'] = $row[1];
    $supps_i[$row[0]]['name'] = $row[2];
    $supps_i[$row[0]]['type'] = $row[3];
    $supps_i[$row[0]]['class'] = $row[4];
    $supps_i[$row[0]]['process'] = $row[5];
    $index_i++;
}
fclose($handle);
//Prepare the results
// D
$result = trim(file_get_contents($pass_path.$uid."_d.csv"));
$result = str_replace("<id>", "id", $result);
$result = str_replace(">", "-", $result); 
$result = trim(str_replace(",", ".", $result));
$result = str_replace(";", ",", $result);
//Values to array
$result_arr = array_map("str_getcsv", explode("\r\n", $result));
$result_arr = array_combine($result_arr['0'], $result_arr['1']);
unset($result_arr['id']);
unset($result_arr['Substructure Descriptors']);
unset($result_arr['New Descriptors']);
unset($result_arr['Possible Activities at Pa-Pi']);
arsort($result_arr);
$result_arr = array_filter($result_arr, function ($v) {
   return $v > 0;
});
//Make normal array
$result_norm = array();
foreach ($result_arr as $key => $value) {
   $arrLine = array();
   $id_gen = substr($key, 0, strpos($key, "_", 7));
   if ($id_gen == "") {
      $id_gen = $key;
   } else {
      $id_gen = $id_gen;
   }
   $arrLine['id'] = $key;
   $arrLine['id_gen'] = $id_gen;
   $arrLine['val'] = trim($value);
   $arrLine['system'] = "D";
   $result_norm[$key] = $arrLine;
}
$result_d = array_merge_recursive($result_norm, $supps_d);
// I
$result = trim(file_get_contents($pass_path.$uid."_i.csv"));
$result = str_replace("<id>", "id", $result);
$result = str_replace(">", "-", $result); 
$result = trim(str_replace(",", ".", $result));
$result = str_replace(";", ",", $result);
//Values to array
$result_arr = array_map("str_getcsv", explode("\r\n", $result));
$result_arr = array_combine($result_arr['0'], $result_arr['1']);
unset($result_arr['id']);
unset($result_arr['Substructure Descriptors']);
unset($result_arr['New Descriptors']);
unset($result_arr['Possible Activities at Pa-Pi']);
arsort($result_arr);
$result_arr = array_filter($result_arr, function ($v) {
   return $v > 0;
});
//Make normal array
$result_norm = array();
foreach ($result_arr as $key => $value) {
   $arrLine = array();
   $id_gen = substr($key, 0, strpos($key, "_", 7));
   if ($id_gen == "") {
      $id_gen = $key;
   } else {
      $id_gen = $id_gen;
   }
   $arrLine['id'] = $key;
   $arrLine['id_gen'] = $id_gen;
   $arrLine['val'] = trim($value);
   $arrLine['system'] = "I";
   $result_norm[$key] = $arrLine;
}
$result_i = array_merge_recursive($result_norm, $supps_i);
// P
$result = trim(file_get_contents($pass_path.$uid."_p.csv"));
$result = str_replace("<id>", "id", $result);
$result = str_replace(">", "-", $result); 
$result = trim(str_replace(",", ".", $result));
$result = str_replace(";", ",", $result);
//Values to array
$result_arr = array_map("str_getcsv", explode("\r\n", $result));
$result_arr = array_combine($result_arr['0'], $result_arr['1']);
unset($result_arr['id']);
unset($result_arr['Substructure Descriptors']);
unset($result_arr['New Descriptors']);
unset($result_arr['Possible Activities at Pa-Pi']);
arsort($result_arr);
$result_arr = array_filter($result_arr, function ($v) {
   return $v > 0;
});
//Make normal array
$result_p = array();
foreach ($result_arr as $key => $value) {
   $arrLine = array();
   $arrLine['id_gen'] = $key;
   $arrLine['propensity'] = trim($value);
   $result_p[$key] = $arrLine;
}
//Convert to JSON
$result_json = json_encode([$result_p, $result_i, $result_d]);
}
if ($is_done != '1') {
   $result_json = json_encode("no_result");
}
//Delete temporary things
@unlink($pass_path.$uid.".SDF");
@unlink($pass_path.$uid."_d.task");
@unlink($pass_path.$uid."_p.task");
@unlink($pass_path.$uid."_i.task");
@unlink($pass_path.$uid."_d.csv");
@unlink($pass_path.$uid."_p.csv");
@unlink($pass_path.$uid."_i.csv");
@unlink($pass_path.$uid."_d.HST");
@unlink($pass_path.$uid."_p.HST");
@unlink($pass_path.$uid."_i.HST");
// Return the results to browser
echo $result_json;
//Exit
exit();