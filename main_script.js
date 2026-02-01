////////////////////////////////////////////////////////////////////////////////////////////////
// Interface Functions
////////////////////////////////////////////////////////////////////////////////////////////////
function open_about() {
	const dlg = document.querySelector("#about_dlg");
	dlg.showModal();
	dlg.className = "dlg_on";
}
function open_interp() {
	const dlg = document.querySelector("#interp_dlg");
	dlg.showModal();
	dlg.className = "dlg_on";
}
function open_contact() {
	const dlg = document.querySelector("#contact_dlg");
	dlg.showModal();
	dlg.className = "dlg_on";
}
function open_draw() {
	const dlg = document.querySelector("#draw_dlg");
	dlg.showModal();
	dlg.className = "dlg_on";
}
function close_dlg() {
	const dlg = document.querySelector(".dlg_on"); 
	dlg.showModal();
	dlg.close();
	dlg.className = "dlg_off";
}
////////////////////////////////////////////////////////////////////////////////////////////////
// Send chemical structure
////////////////////////////////////////////////////////////////////////////////////////////////
async function send_cs() {
	let pic, molfile;
	// Get the input
	let input_cs = main_input.value.trim();
	input_cs = input_cs.replaceAll("\r\n", "\n");
	input_cs = input_cs.replaceAll("\n", "\r\n");
	if (input_cs.length < 1) {
		window.alert("Empty input");
		return;
	}
	mol_test = input_cs;
	// Check minimally, i.e. is it possible to parse structure using RDKit.JS (?)
	try {
		let mol;
		// Check if it is MOL or SMILES
		const n_lines = input_cs.split(/\r\n/).length
		if (n_lines < 2) {
			// SMILES
			mol = RDKit.get_mol(input_cs);
		} else {
			// MOL -> check where the counts line start
			// Get the substring from start to V2000
			const initial_substr = input_cs.substring(0,input_cs.indexOf("V2000\r\n"));
			// Count number of lines before the counts line
			const preline_count = (initial_substr.match(/\r\n/g) || []).length;
			// Act according to the results
			if (preline_count > 3) {
				window.alert("Something is wrong with the input");
				return;
			}
			if (preline_count === 3) {
				input_cs = input_cs.replace(/.*\r\n/, "\r\n");
			}
			if (preline_count == 2) {
				input_cs = "\r\n" + input_cs;
			}
			if (preline_count === 1) {
				input_cs = "\r\n" + "\r\n" + input_cs;
			}
			if (preline_count === 0) {
				input_cs = "\r\n" + "\r\n" + "\r\n" + input_cs;
			}
			mol = RDKit.get_mol(input_cs);
		}
		pic = mol.get_svg();
		molfile = mol.get_molblock();
	} catch {
		window.alert("Something is wrong with the input");
		return;
	}
	//Gather data to JSON
	data_toServer = {"molfile": molfile};
	//Send to the srever
	let response = await fetch('process.php', {
		method: 'POST',
		headers: {'Content-Type': 'application/json;charset=utf-8'},
 		body: JSON.stringify(data_toServer)
	});
	let result = await response.json();
	if (result === "no_result") {
		window.alert("Please, check the input structure (see About) or try again latter");
		return;
	}
	// Process the response
	// Add the propensity score
	// Delete the additional targets
	const result_p = result[0];
	const result_i = Object.values(result[1]).filter((rec) => rec['id'].length === 2);
	const result_d = Object.values(result[2]).filter((rec) => rec['id'].length === 2);
	const go_arr = [];
	const class_arr = [];
	// Run through the result_d: add propensity, fill the class_arr and go_arr
	for (let i = 0; i < result_d.length; i++) {
		// Correct the ID
		result_d[i]['id'] = result_d[i]['id'][0];
		// Add the propensity
		if (result_p.hasOwnProperty(result_d[i]['id_gen'])) {
			result_d[i]['propensity'] = result_p[result_d[i]['id_gen']]['propensity'];
		} else {
			result_d[i]['propensity'] = -1;
		}
		// Fill the class_arr
		let classes = result_d[i]['class'].split(' | ');
		for (let k = 0; k < classes.length; k++) {
			class_arr.push(classes[k]);
		}
		// Fill the class_arr
		let gos = result_d[i]['process'].split(' | ');
		for (let k = 0; k < gos.length; k++) {
			go_arr.push(gos[k]);
		}
	}
	// Run through the result_i: add propensity, fill the class_arr and go_arr
	for (let i = 0; i < result_i.length; i++) {
		// Correct the ID
		result_i[i]['id'] = result_i[i]['id'][0];
		// Add the propensity
		if (result_p.hasOwnProperty(result_i[i]['id_gen'])) {
			result_i[i]['propensity'] = result_p[result_i[i]['id_gen']]['propensity'];
		} else {
			result_i[i]['propensity'] = -1;
		}
		// Fill the class_arr
		let classes = result_i[i]['class'].split(' | ');
		for (let k = 0; k < classes.length; k++) {
			class_arr.push(classes[k]);
		}
		// Fill the class_arr
		let gos = result_i[i]['process'].split(' | ');
		for (let k = 0; k < gos.length; k++) {
			go_arr.push(gos[k]);
		}
	}
	// Reduce go-terms and classes, SEE: https://stackoverflow.com/questions/5667888/counting-the-occurrences-frequency-of-array-elements
	const class_acc = class_arr.reduce(function (acc, curr) {
  		return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
	}, {});
	const go_acc = go_arr.reduce(function (acc, curr) {
  		return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
	}, {});
	// Sort to get the most frequent terms and classes, SEE for a quick reference: https://stackoverflow.com/questions/1069666/sorting-object-property-by-values
	go_sorted = Object.keys(go_acc).sort(function(a,b){return go_acc[b]-go_acc[a]});
	class_sorted = Object.keys(class_acc).sort(function(a,b){return class_acc[b]-class_acc[a]});
	// Concat D and I and sort, SEE: https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
	const result_di = result_d.concat(result_i);
	result_di.sort((a,b) => b.val - a.val);
	result[0] = result_di;
	result[1] = class_sorted;
	result[2] = go_sorted;
	result[3] = pic;
	//Open new tab and bring the data there
	const representation_tab = window.open("http://.../represent.php", '_blank');
	if (representation_tab) {
    representation_tab.data = result;
	}
	//Clear form
	main_input.value = "";
}
// SEE: https://stackoverflow.com/questions/15547198/export-html-table-to-csv-using-vanilla-javascript
function download_tab() {
	// Prepare some vars
	const tab = [];
	const rows = document.querySelectorAll('table#' + 'table_data' + ' tr');
	// Prepare the data
	for (let i = 0; i < rows.length; i++) {
        const row = [], cols = rows[i].querySelectorAll('td, th');
        for (let j = 0; j < cols.length; j++) {
        	let current_cell = cols[j].innerText.trim();
        	row.push(current_cell + '\t');
        }
    const row_str = row.join('');
    tab.push(row_str + '\r\n');
    }
    const tab_str = tab.join('').trim();
    // Prepare the file and download it
    const filename = 'pt_' + 'predictions' + '.tsv';
    const link = document.createElement('a');
    link.style.display = 'none';
    link.setAttribute('target', '_blank');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(tab_str));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
///////////////////////////////////////////////////////////////////////////////////////////////
//Elements
///////////////////////////////////////////////////////////////////////////////////////////////
const btn_close_about = document.querySelector("#btn_close_about");
const btn_close_interp = document.querySelector("#btn_close_interp");
const btn_close_contact = document.querySelector("#btn_close_contact");
const btn_close_draw = document.querySelector("#btn_close_draw");
const btn_predict = document.querySelector("#predict_btn");
const btn_download = document.querySelector("#dwnld_btn");
const btn_open_draw = document.querySelector("#open_draw_btn");
const main_input = document.querySelector("#main_input");
//Elements & events
btn_close_about?.addEventListener("click", close_dlg, false);
btn_close_interp?.addEventListener("click", close_dlg, false);
btn_close_contact?.addEventListener("click", close_dlg, false);
btn_close_draw?.addEventListener("click", close_dlg, false);
btn_open_draw?.addEventListener("click", open_draw, false);
btn_predict?.addEventListener("click", send_cs, false);
btn_download?.addEventListener("click", download_tab, false);