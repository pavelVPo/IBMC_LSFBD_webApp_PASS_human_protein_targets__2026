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
	// Delete not allowed targets
	// Sets to store the unique protein classes and go-processes
	unique_classes = new Set();
	unique_gos = new Set();
	// Sets of the allowed targets
	const allowed_d = new Set(["target_12937", "target_10194", "target_103924", "target_12327", "target_12700", "target_241", "target_10585", "target_12828", "target_101231", "target_101602", "target_103641", "target_105198", "target_109610", "target_10372", "target_30019", "target_11431", "target_10040", "target_100951", "target_101282", "target_101407", "target_11908", "target_30001", "target_101182", "target_119185", "target_11390", "target_11909", "target_104231", "target_120078", "target_100833", "target_10778", "target_12810", "target_103991", "target_101036", "target_10743", "target_11187", "target_12282", "target_154", "target_122240", "target_12037", "target_101078", "target_10371", "target_120400", "target_11729", "target_12886", "target_119217", "target_30046", "target_12026", "target_100069", "target_10016", "target_119095", "target_100931", "target_101503", "target_30027", "target_100853", "target_12399", "target_117994", "target_119169", "target_10542", "target_101191", "target_10909", "target_11201", "target_107614", "target_102719", "target_101593", "target_119107", "target_103542", "target_119262", "target_120890", "target_101508", "target_105676", "target_11567", "target_108007", "target_100906", "target_12721", "target_10279", "target_117991", "target_102667", "target_10984", "target_11619", "target_11629", "target_101496", "target_30010", "target_11722", "target_100071", "target_120969", "target_11517", "target_109607", "target_119051", "target_11569", "target_101340", "target_109477", "target_103465", "target_20008", "target_102459", "target_105610", "target_10885", "target_10639", "target_101499", "target_11044", "target_10373", "target_105640", "target_100637", "target_101473", "target_120179", "target_100293", "target_109606", "target_30029", "target_100981", "target_100616", "target_103054", "target_104458", "target_103936", "target_101359", "target_108363", "target_100144", "target_11046", "target_10706", "target_101410", "target_100226", "target_10659", "target_10206", "target_11443", "target_104580", "target_30009", "target_30049", "target_100852", "target_101189", "target_12642", "target_12983", "target_117414", "target_100876", "target_100411", "target_13081", "target_109747", "target_121136", "target_104220", "target_11088", "target_109837", "target_107603", "target_121381", "target_100913", "target_101204", "target_120180_UNDEFINED MUTATION", "target_12114", "target_20073", "target_12684", "target_101521", "target_10160", "target_10618", "target_101484", "target_100908", "target_30004", "target_11163", "target_279", "target_104218", "target_104560", "target_117990", "target_11209", "target_100993", "target_12179", "target_102447", "target_104433", "target_100220", "target_101183", "target_20015", "target_12851", "target_100828", "target_117345", "target_101347", "target_11453", "target_11720", "target_100789", "target_120726", "target_101358", "target_100415", "target_105660", "target_109900", "target_101057", "target_107970", "target_10992", "target_105421", "target_104071", "target_12088", "target_10505", "target_118257", "target_120690", "target_11364", "target_101495", "target_100416", "target_121767", "target_109524", "target_103720", "target_10032", "target_11150", "target_105446", "target_109909", "target_12186", "target_12757", "target_12770", "target_100485", "target_10250", "target_101202", "target_101251", "target_30007", "target_102678_L858R", "target_109480", "target_322", "target_118006", "target_10842", "target_108024", "target_103481", "target_104017", "target_100474", "target_10201", "target_11047", "target_10051", "target_105691", "target_11622", "target_12029", "target_119238", "target_30042", "target_131", "target_12723", "target_100476", "target_10583", "target_119207", "target_11969", "target_10684", "target_18047", "target_10177", "target_107968", "target_30012", "target_77", "target_105222", "target_10697", "target_104420", "target_19689", "target_10939", "target_108008", "target_30021", "target_104419", "target_248", "target_101613", "target_118073", "target_10977", "target_19623", "target_10926", "target_12028", "target_10732", "target_11848", "target_10168", "target_11815", "target_11441", "target_11214", "target_20171", "target_109479", "target_100907", "target_101233", "target_12038", "target_11870", "target_100127", "target_100909", "target_101406", "target_10815", "target_101433", "target_12919", "target_104228", "target_117930", "target_11308", "target_11192", "target_101026", "target_79", "target_103152", "target_107969", "target_101219", "target_10929", "target_12291", "target_104532", "target_101472", "target_100478", "target_100827", "target_100155", "target_11131", "target_11176", "target_103091", "target_11843", "target_11637", "target_109901", "target_11483", "target_104248", "target_100140", "target_104531", "target_101332", "target_104117", "target_11172", "target_30033", "target_169", "target_108032", "target_103690", "target_74", "target_20057", "target_103593", "target_11440", "target_11617", "target_104387", "target_101203", "target_190", "target_100168", "target_109455", "target_109954", "target_12013", "target_103624", "target_104126", "target_100947", "target_102699", "target_103670", "target_11628", "target_10880", "target_11019", "target_10903", "target_105457", "target_109587", "target_104314", "target_100650", "target_100305", "target_12685", "target_107590", "target_102669", "target_11751", "target_11254", "target_100467", "target_101239", "target_12847", "target_10850", "target_13005", "target_10588", "target_100147", "target_20007", "target_101368", "target_102770", "target_103625", "target_101333", "target_11922", "target_117243", "target_120478", "target_104383", "target_101476", "target_104219", "target_42", "target_100952", "target_104468", "target_107671", "target_103659", "target_12587", "target_100151", "target_11940", "target_101179", "target_104264", "target_100925", "target_102423", "target_12643", "target_12376", "target_100995", "target_104279", "target_57", "target_12448", "target_102631", "target_102744", "target_30045", "target_18072", "target_30008", "target_24", "target_12593", "target_102441", "target_108002", "target_103102", "target_101589", "target_12353", "target_100424", "target_11160", "target_104547", "target_12214", "target_11500", "target_10087", "target_11132", "target_30026", "target_101188", "target_11396", "target_104421", "target_100781", "target_117999", "target_101600", "target_10844", "target_11379", "target_117303_R172K", "target_117303_R140Q", "target_100412", "target_10277", "target_104604", "target_107998", "target_109514", "target_104329", "target_109807", "target_104320", "target_108027", "target_101591", "target_30032", "target_105649", "target_101232", "target_30006", "target_100792", "target_11785", "target_104223", "target_123", "target_12584", "target_105346", "target_117333", "target_105227", "target_103061", "target_30035", "target_270", "target_12947", "target_102663", "target_104422", "target_10892", "target_12944", "target_12388", "target_10754", "target_11966", "target_103430", "target_109874", "target_101345", "target_11399", "target_12795", "target_84", "target_30017", "target_101411", "target_119220", "target_38", "target_105632", "target_105619", "target_11570", "target_30024", "target_100418", "target_104445", "target_69", "target_30005", "target_120423", "target_11416", "target_10133", "target_11204", "target_101054", "target_107999", "target_11639", "target_10899", "target_100075", "target_18033", "target_12915", "target_100854", "target_91", "target_105352", "target_11288", "target_20132", "target_10694", "target_11096", "target_100146", "target_119055", "target_11395", "target_10150", "target_101624", "target_101504", "target_13055", "target_180", "target_118046", "target_11755", "target_101532", "target_10244", "target_100414", "target_240", "target_12861", "target_10692", "target_12786", "target_101610", "target_10069", "target_20035", "target_110226", "target_11092", "target_100949", "target_10911", "target_10120", "target_10034", "target_10320", "target_20127", "target_101611", "target_10278", "target_100856", "target_10605", "target_108248", "target_10480", "target_104265", "target_175", "target_10845", "target_10108", "target_107664", "target_247", "target_12718", "target_100989", "target_11574", "target_10553", "target_286", "target_10785", "target_100875", "target_101044", "target_11596", "target_104103", "target_185", "target_10074", "target_101254", "target_10216", "target_119168", "target_103590", "target_100627", "target_104197", "target_12780", "target_101019", "target_17041", "target_12724", "target_100997", "target_120", "target_11842", "target_105216", "target_12703", "target_12690", "target_11691", "target_102420", "target_10477", "target_10679", "target_100633", "target_103767", "target_105661", "target_12855", "target_108020", "target_103042", "target_11627", "target_150", "target_11723", "target_11241", "target_222", "target_11520", "target_10751", "target_116735", "target_104670", "target_103104", "target_30047", "target_11488", "target_11535", "target_101287", "target_11636", "target_12683", "target_104274", "target_12704", "target_11504", "target_102671", "target_10139", "target_12910", "target_104573", "target_100129", "target_105674", "target_10584", "target_10900", "target_62", "target_12829", "target_101373", "target_10531", "target_266", "target_11061", "target_10323", "target_20143", "target_101464", "target_10624", "target_10199", "target_103134", "target_100077", "target_143", "target_321", "target_105188", "target_10138", "target_10183", "target_10185", "target_73", "target_12699", "target_10878", "target_71", "target_10612", "target_10582", "target_11653", "target_100613", "target_103537", "target_10967", "target_236", "target_11758", "target_104486", "target_10332", "target_101324", "target_18080", "target_108054", "target_30016", "target_105596", "target_102728", "target_11255", "target_1", "target_116734", "target_102780", "target_11882", "target_12920", "target_277", "target_12946", "target_103147", "target_100194", "target_10696", "target_107979", "target_11752", "target_12396", "target_101079", "target_101130", "target_107653", "target_103688", "target_101351", "target_10711", "target_30015", "target_30023", "target_108000", "target_102452", "target_11522", "target_100157", "target_11507", "target_117443", "target_10170", "target_105247", "target_103060", "target_103657", "target_11797", "target_11941", "target_117391", "target_109449", "target_20020", "target_100622", "target_11402", "target_10472", "target_108005", "target_100988", "target_11562", "target_11573", "target_68", "target_101213", "target_100878", "target_100080", "target_12955", "target_102698", "target_11221", "target_12738", "target_100666", "target_100446", "target_103725", "target_11017_UNDEFINED MUTATION", "target_11017", "target_100917", "target_12283", "target_12000", "target_104266", "target_101386", "target_17050", "target_104667", "target_243", "target_142", "target_103069", "target_116752", "target_170", "target_10808", "target_10189", "target_101365", "target_249", "target_59", "target_220", "target_184", "target_12862", "target_35", "target_101379", "target_103722", "target_10674", "target_216", "target_10733", "target_11910", "target_30000", "target_101181", "target_102", "target_117", "target_105223", "target_10695", "target_100851", "target_10809", "target_10330", "target_11130", "target_116749", "target_10200", "target_11968", "target_10331", "target_276", "target_100186", "target_12247", "target_30025", "target_10368", "target_12054", "target_11847", "target_30018", "target_12949", "target_10567", "target_193", "target_80", "target_11565", "target_237", "target_10945", "target_11261", "target_28", "target_104499", "target_12268", "target_101034", "target_12067", "target_105447", "target_282", "target_12023", "target_11267", "target_101598_R206H", "target_101598", "target_103079", "target_12659", "target_10044", "target_10982", "target_11006", "target_11904", "target_218", "target_20025", "target_12071", "target_12", "target_12443", "target_102767", "target_63", "target_12725", "target_100912", "target_12021", "target_30003", "target_10579", "target_30034", "target_109917", "target_12109", "target_105130", "target_10184", "target_104593", "target_20139", "target_102621", "target_10147", "target_11265", "target_104196", "target_12923", "target_11624", "target_246", "target_103165", "target_10102", "target_10186", "target_10544", "target_12883", "target_11442", "target_11626", "target_11926_K650M", "target_11926_V555M", "target_11926", "target_64", "target_10608", "target_10264_V564F", "target_10264_N549H", "target_10264", "target_11871", "target_101300", "target_115", "target_144", "target_101477", "target_149", "target_11942", "target_242", "target_11912", "target_11635", "target_20154", "target_11407", "target_10547", "target_10511", "target_10918", "target_10702", "target_12425", "target_30037", "target_10979", "target_11037", "target_100874", "target_11409", "target_11869", "target_30014", "target_30036", "target_105196", "target_20137", "target_10904", "target_103167", "target_12627", "target_104811", "target_100956", "target_100413", "target_100948", "target_11279", "target_119127", "target_23", "target_100835", "target_116492", "target_12622", "target_11336", "target_275", "target_101502", "target_100933", "target_11110", "target_10653", "target_117512", "target_12665", "target_20130", "target_11748", "target_12913", "target_271", "target_100579", "target_100790", "target_105451_G12V", "target_105451_G12C,C51S,C80L,C118S", "target_105451_G13D", "target_105451", "target_105451_G12C,C118A", "target_105451_G12D", "target_105451_G12C", "target_100855", "target_13053", "target_101312", "target_100098", "target_10927", "target_101462", "target_11156", "target_11003", "target_10258", "target_11016", "target_101310", "target_11356", "target_168", "target_11054", "target_101234", "target_11154", "target_101568", "target_10594", "target_112", "target_30011", "target_102783", "target_105", "target_10141", "target_101412", "target_10198", "target_262", "target_102672", "target_100217", "target_10473", "target_106", "target_100990", "target_104004", "target_19904", "target_146", "target_11082", "target_6", "target_52", "target_100481", "target_215", "target_11480", "target_100448", "target_10811", "target_11042", "target_11415", "target_116", "target_103", "target_20151", "target_101414", "target_11232", "target_48", "target_100079_V804L", "target_100079_M918T", "target_100079_V804M", "target_100079", "target_261", "target_10752", "target_101014", "target_10056", "target_11109", "target_10517", "target_128", "target_10329", "target_11084", "target_100450", "target_105440_Y641N", "target_105440_A677G", "target_105440_Y641F", "target_105440", "target_234", "target_11472", "target_30013", "target_11063", "target_197", "target_10548", "target_100857", "target_11638", "target_11925", "target_47", "target_235", "target_11682", "target_11085", "target_11269", "target_118", "target_10950", "target_11408", "target_11287", "target_10773", "target_10131", "target_13000", "target_10906", "target_100166", "target_10635", "target_96", "target_11678", "target_104483", "target_104483_R132C", "target_104483_R132H", "target_100594", "target_104106", "target_20113", "target_12261", "target_10003", "target_100447", "target_10140", "target_11541", "target_11523", "target_134", "target_10907", "target_30043", "target_238_V559D,V654A", "target_238_V559D", "target_238_V654A", "target_238_V559D,T670I", "target_238_D816V", "target_238", "target_11242", "target_100304_G101V", "target_100304", "target_157", "target_12895", "target_226", "target_11473", "target_11290", "target_12825", "target_250", "target_88", "target_13004_T204D", "target_13004", "target_100410", "target_50", "target_11359", "target_12840", "target_124", "target_20095", "target_3", "target_100193", "target_11149", "target_19639", "target_101277", "target_11213", "target_10378", "target_127", "target_20092", "target_125", "target_214", "target_10009", "target_176", "target_20131", "target_219", "target_100624", "target_10781", "target_103154", "target_103154_G2019S", "target_8_Y253F", "target_8_Q252H", "target_8_H396P", "target_8_M351T", "target_8_D382N", "target_8_T315I", "target_8", "target_11536", "target_12666", "target_100974", "target_100417_C1156Y", "target_100417_F1174L", "target_100417_G1202R", "target_100417_L1196M", "target_100417", "target_11272", "target_12967", "target_10417", "target_101271", "target_188", "target_43", "target_10580", "target_10266", "target_138", "target_20014", "target_12694", "target_12968", "target_100010", "target_101608", "target_227", "target_36", "target_11291", "target_12592", "target_10434", "target_100468", "target_10495", "target_10656", "target_61", "target_11225", "target_10599", "target_11024", "target_12896", "target_20174", "target_12576", "target_11902_G623R", "target_11902_F589L", "target_11902_G667C", "target_11902_G595R", "target_11902", "target_10498", "target_174", "target_12227", "target_11534", "target_12090", "target_11180", "target_11208", "target_11575", "target_10839", "target_55", "target_102439", "target_11060", "target_11400", "target_11280", "target_155", "target_11398", "target_13001", "target_11631", "target_10919", "target_100431", "target_10849", "target_11206", "target_11", "target_10142", "target_90", "target_100", "target_10869", "target_56", "target_10938", "target_25", "target_100126", "target_100126_V600E", "target_163", "target_100097", "target_86", "target_11939", "target_11727", "target_100643", "target_278", "target_11663", "target_10260", "target_65", "target_12670_N841I", "target_12670_D835H", "target_12670_D835Y", "target_12670_UNDEFINED MUTATION", "target_12670", "target_136", "target_11489", "target_10197", "target_13061", "target_10209", "target_108", "target_126", "target_103982", "target_19", "target_18061", "target_10188", "target_11177", "target_19905", "target_194", "target_10532", "target_11451_Y1230H", "target_11451_D1228V", "target_11451", "target_11140", "target_137", "target_133", "target_121", "target_12252", "target_10280", "target_11362_H1047R", "target_11362", "target_130", "target_129", "target_107", "target_10627", "target_11307", "target_280", "target_104", "target_93", "target_51", "target_87", "target_103454_N140A", "target_103454_N433A", "target_103454_Y97A", "target_103454_Y390A", "target_103454", "target_114", "target_10980", "target_259", "target_12209", "target_252", "target_12697", "target_72", "target_9_G719S", "target_9_L861Q", "target_9_G719C", "target_9_C797S,L858R", "target_9_T790M,C797S", "target_9_T790M", "target_9_L858R", "target_9_UNDEFINED MUTATION", "target_9_L858R,T790M,C797S", "target_9_L858R,T790M", "target_9", "target_12952", "target_10193", "target_15", "target_165"]);
	const allowed_i = new Set(["target_12652", "target_109638", "target_118369", "target_115877", "target_103792", "target_120499", "target_121232", "target_118333", "target_121503", "target_119877", "target_117177", "target_119903", "target_119427", "target_119851", "target_10893", "target_11542", "target_105655", "target_12500", "target_109763", "target_103055", "target_12954", "target_120172", "target_118371", "target_103511", "target_105089", "target_116892", "target_118406", "target_119398", "target_11881", "target_105111", "target_107879", "target_10476", "target_103114", "target_12608", "target_224", "target_104941", "target_119947", "target_101493", "target_119211", "target_119421", "target_118389", "target_104774", "target_104985", "target_117017", "target_100939", "target_105023", "target_109578", "target_119878", "target_118341", "target_118973", "target_120517", "target_120957", "target_105121", "target_102718", "target_10836", "target_117156", "target_120660", "target_11089", "target_107912", "target_120191", "target_162", "target_11275", "target_11090", "target_11382", "target_121487", "target_104068", "target_109661", "target_104275", "target_117406", "target_119217", "target_172", "target_100935", "target_11414", "target_100785", "target_120727", "target_161", "target_101494", "target_103453", "target_108273", "target_115502", "target_10123", "target_122129", "target_117594", "target_101137", "target_104251", "target_108143", "target_119388", "target_103088", "target_120654", "target_11120", "target_11360", "target_101268", "target_109761", "target_105712", "target_116736", "target_109547", "target_121746", "target_101159", "target_109513", "target_30028", "target_11105", "target_108404", "target_10769", "target_107966", "target_120457", "target_119911", "target_103531", "target_108007", "target_116091", "target_121535", "target_108139", "target_100008", "target_116861", "target_101430", "target_121269", "target_104950", "target_117098", "target_108137", "target_120518", "target_11684", "target_102394", "target_10257", "target_11055", "target_117694", "target_107897", "target_118953", "target_120119", "target_11422", "target_117577", "target_121534", "target_103646", "target_101055", "target_109477", "target_166", "target_12737", "target_106197", "target_105747", "target_105610", "target_120781", "target_11114", "target_104392", "target_11744", "target_109762", "target_119390", "target_120179", "target_107640", "target_103516", "target_117438", "target_12930", "target_119884", "target_117123", "target_105617", "target_104487", "target_116859", "target_119953", "target_108376", "target_117710", "target_12378", "target_109434", "target_118388", "target_12943", "target_101328", "target_109097", "target_119149", "target_120098", "target_104987", "target_106141", "target_119713", "target_10985", "target_117429", "target_119943", "target_119957", "target_118298", "target_119358", "target_101353", "target_120160", "target_13064", "target_117001", "target_102393", "target_104268", "target_10397", "target_109643", "target_120785", "target_100976", "target_12804", "target_11854", "target_100916", "target_121511", "target_101405", "target_103151", "target_20077", "target_12914", "target_119259", "target_103665", "target_116705", "target_109929", "target_121136", "target_103662", "target_103660", "target_107591", "target_117043_L1152R", "target_117043_S1206Y", "target_117043_C1156Y", "target_117043_F1174L", "target_117043_G1269A", "target_117043_L1196M", "target_117043_G1202R", "target_117043", "target_123316", "target_104988", "target_120180", "target_11795", "target_109656", "target_104067", "target_104285", "target_101281", "target_109636", "target_100108", "target_99", "target_119153", "target_30004", "target_20162", "target_279", "target_116989", "target_105038", "target_100993", "target_104399", "target_119640", "target_104433", "target_116822", "target_108124", "target_105173", "target_100828", "target_12585", "target_101509", "target_117259", "target_104473", "target_103784", "target_10089", "target_102680", "target_10954", "target_20053", "target_11652", "target_108406", "target_114829", "target_107970", "target_104063", "target_10992", "target_104071", "target_102403", "target_103848", "target_11231", "target_12088", "target_100138", "target_117102", "target_119181", "target_117437", "target_103121", "target_120285", "target_104282", "target_100159", "target_104368", "target_101056", "target_11452", "target_12594", "target_10032", "target_109456", "target_102648", "target_103630", "target_109909", "target_244", "target_12186", "target_2", "target_117363", "target_95", "target_107918", "target_103548", "target_117062", "target_103780", "target_10978", "target_30007", "target_102678_L858R", "target_18079", "target_108006", "target_105506", "target_102791", "target_118006", "target_103481", "target_109635", "target_101505", "target_78", "target_107658", "target_104930", "target_105603", "target_104852", "target_100474", "target_10201", "target_118347", "target_11047", "target_12615", "target_12956", "target_120153", "target_105691", "target_11622", "target_10103", "target_119238", "target_30042", "target_131", "target_103574", "target_116952", "target_118980", "target_113", "target_101510", "target_105079", "target_18047", "target_119260", "target_107968", "target_107893", "target_118346", "target_19689", "target_108369", "target_101097", "target_102691", "target_102688", "target_119972", "target_108008", "target_117033", "target_251", "target_30021", "target_248", "target_105351", "target_101613", "target_118073", "target_10936", "target_19623", "target_118941", "target_103791", "target_10732", "target_11165", "target_11214", "target_102692", "target_100866", "target_101280", "target_101233", "target_100944", "target_12038", "target_107910", "target_11870", "target_107901", "target_101406", "target_101433", "target_11281", "target_105510", "target_12919", "target_10535", "target_104228", "target_104759", "target_101357", "target_117930", "target_11308", "target_10868", "target_79", "target_10028", "target_107969", "target_101219", "target_105200", "target_12291", "target_18043", "target_11113", "target_10143", "target_100290", "target_105353", "target_100478", "target_100827", "target_100155", "target_101317", "target_105602", "target_11176", "target_104782", "target_109901", "target_104570", "target_109644", "target_104248", "target_100140", "target_140", "target_104890", "target_103787", "target_101332", "target_105044", "target_10901", "target_11172", "target_30033", "target_116863", "target_103075", "target_169", "target_100432", "target_11538", "target_107881", "target_103593", "target_18056", "target_104016", "target_117708", "target_104387", "target_10486", "target_101203", "target_190", "target_100168", "target_109455", "target_109954", "target_160", "target_104123", "target_116982", "target_107977", "target_103629", "target_107903", "target_117029", "target_104126", "target_104126_UNDEFINED MUTATION", "target_10015", "target_117484", "target_102699", "target_109645", "target_11019", "target_119192", "target_105349", "target_10903", "target_105457", "target_109587", "target_104314", "target_117041", "target_10857", "target_100305", "target_107590", "target_102669", "target_101392", "target_100467", "target_101356", "target_104921", "target_10850", "target_100147", "target_12588", "target_20007", "target_102770", "target_101592", "target_11922", "target_107601", "target_104219", "target_100952", "target_104468", "target_107671", "target_103659", "target_10541", "target_12587", "target_104264", "target_10167", "target_108311", "target_100925", "target_102423", "target_12376", "target_100995", "target_105189", "target_104279", "target_108414", "target_101283", "target_57", "target_12448", "target_102631", "target_102744", "target_30045", "target_18072", "target_30008", "target_24", "target_103757", "target_102441", "target_119716", "target_103102", "target_109642", "target_101589", "target_119932", "target_100430", "target_101176", "target_12353", "target_109664", "target_12214", "target_11500", "target_10144", "target_10087", "target_11132", "target_30026", "target_119853", "target_104421", "target_11821", "target_117036", "target_101600", "target_109446", "target_10844", "target_11379", "target_10814", "target_117303_R140Q", "target_100412", "target_10277", "target_104604", "target_107998", "target_109514", "target_104329", "target_109807", "target_104320", "target_108027", "target_101591", "target_117187", "target_119320", "target_30032", "target_105649", "target_101232", "target_100822", "target_117701", "target_100792", "target_12640", "target_11785", "target_105103", "target_107925", "target_104223", "target_123", "target_12584", "target_105346", "target_117333", "target_11560", "target_105227", "target_103749", "target_104568", "target_11134", "target_104773", "target_103726", "target_270", "target_104708", "target_101240", "target_101354", "target_109920", "target_102663", "target_109649", "target_18075", "target_10892", "target_12944", "target_12944_D18H,T412E", "target_12944_T412E", "target_12388", "target_10754", "target_103644", "target_11966", "target_103430", "target_109874", "target_101345", "target_104709", "target_12795", "target_107896", "target_103525", "target_30017", "target_101411", "target_119220", "target_105632", "target_105619", "target_11570", "target_115990", "target_30024", "target_100418", "target_104445", "target_69", "target_121411", "target_121411_G12D", "target_121411_G12C", "target_30005", "target_103508", "target_120423", "target_108405", "target_10133", "target_11204", "target_101054", "target_107999", "target_11639", "target_329_I1061T", "target_329", "target_100075", "target_12915", "target_100854", "target_91", "target_105352", "target_20132", "target_10694", "target_11096", "target_100146", "target_119055", "target_11395", "target_101624", "target_101504", "target_101016", "target_180", "target_118046", "target_11755", "target_101532_UNDEFINED MUTATION", "target_101532", "target_10244", "target_102733", "target_104677", "target_100414", "target_240", "target_10692", "target_12786", "target_101610", "target_10069", "target_20035", "target_110226", "target_11092", "target_100949", "target_10911", "target_100436", "target_114868", "target_10120", "target_10410", "target_102734", "target_107898", "target_11907", "target_10034", "target_10012", "target_104298", "target_104911", "target_10320", "target_20127", "target_101611", "target_10278", "target_100856", "target_10605", "target_101113", "target_108248", "target_10480", "target_104265", "target_175", "target_10845", "target_10108", "target_117739", "target_104712", "target_107664", "target_247", "target_12718", "target_100989", "target_11574", "target_10553", "target_286", "target_10785", "target_100875", "target_100862", "target_101044", "target_11596", "target_104103", "target_108391", "target_185", "target_100444", "target_101254", "target_104749", "target_10216", "target_119168", "target_103590", "target_100627", "target_104197", "target_12780", "target_100982", "target_101019", "target_17041", "target_12724", "target_100997", "target_120", "target_11842", "target_104977", "target_118692", "target_12690_H257G", "target_12690", "target_11691", "target_12909", "target_101208", "target_102420", "target_10477", "target_103655", "target_10679", "target_103170", "target_100633", "target_103767", "target_100101", "target_105661", "target_265", "target_104598", "target_108020", "target_11627", "target_150", "target_11723", "target_11239", "target_18071", "target_11241", "target_104816", "target_222", "target_11520", "target_10751", "target_116735", "target_104670_D161E,R162K", "target_104670", "target_103104", "target_100486", "target_30047", "target_11488", "target_11535", "target_11636", "target_12683", "target_107914", "target_104274", "target_12704_V50M", "target_12704", "target_11504", "target_102671", "target_10139", "target_12910", "target_104573", "target_100129", "target_105674", "target_107915", "target_10900", "target_104757", "target_62", "target_12829", "target_101373", "target_266", "target_11173", "target_108118", "target_11061", "target_10323", "target_20143", "target_107917", "target_101464", "target_10624", "target_10199", "target_103134", "target_100077", "target_104702", "target_143", "target_104297", "target_321", "target_105188", "target_10138", "target_10183", "target_101361", "target_10185", "target_73", "target_12699", "target_10878", "target_71", "target_10612", "target_117069", "target_179", "target_10582", "target_11653", "target_104768", "target_100613", "target_103537", "target_10967", "target_236", "target_11758", "target_104486", "target_100867", "target_10332", "target_101324", "target_18080", "target_108054", "target_30016", "target_105596", "target_102728", "target_11255", "target_116734", "target_102780", "target_11882", "target_12920", "target_277", "target_104798", "target_12946", "target_103147", "target_100194", "target_10696", "target_107979", "target_11752", "target_12396", "target_101079_T654M", "target_101079", "target_101130", "target_107653", "target_103688", "target_101351", "target_104703", "target_10711_S670A", "target_10711", "target_30015", "target_30023", "target_108000", "target_107899", "target_103699", "target_102452", "target_11522", "target_100157", "target_11507", "target_117443", "target_105067", "target_10170", "target_105247", "target_103657", "target_101400_V404M", "target_101400_D473H", "target_101400", "target_108117", "target_11797", "target_11941", "target_117391_C8Q,C67R,C84N", "target_117391", "target_109449", "target_20020", "target_100622", "target_11402", "target_10472", "target_108005", "target_100988", "target_11562", "target_11573", "target_12030", "target_104830", "target_104924", "target_101213", "target_101567", "target_100878", "target_100080", "target_12955", "target_102698", "target_104704", "target_11221", "target_100446", "target_104965", "target_103725", "target_11017", "target_10475", "target_100917", "target_12283", "target_104266", "target_103700", "target_104778", "target_101386", "target_104667", "target_243", "target_12679", "target_142", "target_103069", "target_116752", "target_170", "target_10808", "target_10189", "target_101365_S549D", "target_101365", "target_249", "target_59", "target_220", "target_184", "target_12862", "target_109566", "target_35", "target_101379", "target_103722", "target_10674", "target_216", "target_10733", "target_10733_N409S", "target_11910", "target_30000", "target_101181", "target_102", "target_117", "target_104710", "target_105223", "target_10695", "target_100851", "target_10809", "target_10330", "target_11130", "target_100848", "target_116749", "target_10200", "target_11968", "target_276", "target_100186", "target_103800", "target_12247", "target_30025", "target_10368", "target_12054", "target_11847", "target_103144", "target_30018", "target_12949", "target_10567", "target_80", "target_13010", "target_11565", "target_237", "target_10945", "target_11261", "target_104499", "target_12268", "target_101034", "target_12067", "target_105447", "target_282", "target_12023", "target_11267", "target_101598_R206H", "target_101598", "target_107936", "target_103079", "target_12659", "target_10044", "target_10982", "target_11006", "target_11904", "target_218", "target_20025", "target_12071", "target_12443", "target_102767", "target_63", "target_12725", "target_100912", "target_12021", "target_30003", "target_104296", "target_10579", "target_30034", "target_109917", "target_12109", "target_105130", "target_10184", "target_105117", "target_104593", "target_20139", "target_102621", "target_10147", "target_11265", "target_104196", "target_12923", "target_11624", "target_246", "target_103165", "target_10102", "target_10186", "target_10544", "target_12883", "target_11442", "target_11626", "target_100338", "target_11926_K650E", "target_11926", "target_116040", "target_4", "target_64", "target_10608", "target_10264", "target_11871_UNDEFINED MUTATION", "target_11871", "target_101300", "target_115_N111G", "target_115", "target_144", "target_101477", "target_149", "target_11942", "target_18036", "target_148", "target_104288", "target_242", "target_11912", "target_11635", "target_20154", "target_11407", "target_10547", "target_10511", "target_10918", "target_10702", "target_12425", "target_30037", "target_10979", "target_11037", "target_100100", "target_100325", "target_100874", "target_11409_S218E,S222E", "target_11409", "target_11869", "target_30014", "target_30036", "target_105196", "target_20137", "target_10904_Y340E,Y341E", "target_10904", "target_103167", "target_12627_V561D", "target_12627", "target_104811_T315I", "target_104811", "target_100956", "target_100413", "target_100948", "target_11279", "target_119127_R293Q", "target_119127_UNDEFINED MUTATION", "target_119127_G230A,R293Q", "target_119127_R71H,G230A,R293Q", "target_119127", "target_23", "target_100835", "target_116492_C330S", "target_116492", "target_12622", "target_11336", "target_275", "target_101502", "target_100933", "target_11110", "target_10653", "target_117512", "target_12665", "target_20130", "target_11748", "target_12913", "target_271", "target_100579", "target_100790", "target_105451_G13D", "target_105451", "target_105451_G12D", "target_105451_G12C", "target_100855", "target_13053", "target_104295", "target_101312", "target_100098", "target_10927", "target_101462", "target_11156", "target_11003", "target_10258", "target_11016", "target_101310", "target_11356", "target_168", "target_107900", "target_11054", "target_11512", "target_101234", "target_11154", "target_101568", "target_10594", "target_112", "target_30011", "target_102783", "target_105", "target_10141", "target_101412", "target_10198", "target_107924", "target_262", "target_102672", "target_100217", "target_10473", "target_106", "target_100990", "target_104004", "target_19904", "target_146", "target_11082", "target_6", "target_52", "target_100481", "target_215", "target_11480", "target_100448", "target_10811", "target_11042", "target_11415", "target_116", "target_103", "target_104305_L33E", "target_104305", "target_20151", "target_101414", "target_11540_G551D", "target_11540_N1303K", "target_11540", "target_11540_F508del", "target_11232", "target_48_C808S", "target_48", "target_76", "target_104293", "target_100079_V804M", "target_100079", "target_261", "target_10752", "target_101014", "target_10056", "target_104690", "target_11109", "target_10517", "target_128", "target_10329", "target_11084", "target_100450", "target_105440_Y641F", "target_105440_Y641N", "target_105440", "target_234", "target_11472", "target_30013", "target_11063", "target_197", "target_10548", "target_100857", "target_11638", "target_11925", "target_47", "target_11682", "target_104283", "target_11085", "target_11269", "target_118", "target_10950", "target_11408", "target_105055_H1047R", "target_105055", "target_11287", "target_10773", "target_10131", "target_13000", "target_10906", "target_100166", "target_10635", "target_96", "target_11678", "target_104483_R132L", "target_104483", "target_104483_R132C", "target_104483_R132H", "target_100594", "target_104292", "target_104106", "target_20113", "target_12261", "target_10003", "target_100447", "target_10140", "target_104943", "target_11541", "target_11523", "target_134", "target_10907_T210D", "target_10907", "target_30043", "target_104299", "target_238_D816H", "target_238_V559D,T670I", "target_238_UNDEFINED MUTATION", "target_238", "target_11242", "target_100304", "target_157", "target_12895", "target_226", "target_11473", "target_11290", "target_12825", "target_107895", "target_250", "target_88", "target_13004_T204D", "target_13004", "target_100410", "target_50", "target_11359", "target_12840", "target_104294", "target_124", "target_20095", "target_3", "target_100193", "target_11149", "target_19639", "target_101277", "target_11213", "target_10378", "target_127", "target_20092", "target_125", "target_214", "target_105083", "target_10009", "target_176", "target_20131", "target_219", "target_104685", "target_100624", "target_10781", "target_103154_G2019S", "target_103154", "target_8", "target_8_T315I", "target_11536", "target_12666", "target_100974", "target_119710", "target_100417_G1269A", "target_100417_F1174L", "target_100417_C1156Y", "target_100417_G1202R", "target_100417_L1196M", "target_100417", "target_11272", "target_12967", "target_10417", "target_101271", "target_188", "target_43", "target_10580", "target_10266", "target_138", "target_20014", "target_12694", "target_12968", "target_100010", "target_101608", "target_227", "target_36", "target_11291", "target_12592_Q279R", "target_12592", "target_10434", "target_100468", "target_10495", "target_10656", "target_61", "target_11225", "target_10599_S133D", "target_10599", "target_11024", "target_12896", "target_20174", "target_12576", "target_11902_F589L", "target_11902_G667C", "target_11902_G595R", "target_11902", "target_10498", "target_174", "target_12227", "target_11534", "target_12090", "target_11180", "target_11208", "target_11575_I40L", "target_11575", "target_10839", "target_55", "target_102439", "target_11060", "target_11400", "target_11280", "target_155", "target_11398", "target_13001", "target_11631", "target_10919", "target_100431", "target_10849", "target_11206", "target_11", "target_10142_L106P", "target_10142", "target_90", "target_100", "target_10869", "target_56_F877L", "target_56_T878A", "target_56", "target_10938_V617F", "target_10938", "target_25", "target_100126", "target_100126_V600E", "target_163", "target_100097_C481R", "target_100097_T474I", "target_100097_C481S", "target_100097", "target_86", "target_11939", "target_11727", "target_104717", "target_100643_S167A", "target_100643", "target_278", "target_11663", "target_10260", "target_65", "target_12670_D835H", "target_12670_D835Y", "target_12670_UNDEFINED MUTATION", "target_12670", "target_136", "target_11489", "target_10197_UNDEFINED MUTATION", "target_10197", "target_13061", "target_10209", "target_108", "target_126", "target_103982", "target_19_S463P", "target_19_D538G", "target_19_Y537S", "target_19", "target_18061", "target_10188", "target_11177", "target_19905", "target_194", "target_10532", "target_11451_Y1235D", "target_11451_D1228N", "target_11451_Y1230H", "target_11451", "target_11140", "target_137", "target_133", "target_121_I179C", "target_121_W103A", "target_121", "target_12252", "target_10280", "target_11362_H1047R", "target_11362", "target_130_V87F", "target_130", "target_129", "target_107", "target_10627", "target_11307", "target_280", "target_104", "target_93", "target_51", "target_87", "target_103454_Y97A", "target_103454_Y390A", "target_103454", "target_114", "target_10980", "target_259_Q63R", "target_259", "target_12209", "target_252", "target_12697", "target_72", "target_9_T790M,L858M", "target_9_C797S,L858R", "target_9_L861Q", "target_9_L858R,T790M,C797S", "target_9_T790M", "target_9_UNDEFINED MUTATION", "target_9_L858R", "target_9_L858R,T790M", "target_9", "target_12952", "target_10193", "target_15_N67I", "target_15", "target_165"]);
	const result_p = result[0];
	let result_i = Object.values(result[1]).filter((rec) => rec['id'].length === 2);
	let result_d = Object.values(result[2]).filter((rec) => rec['id'].length === 2);
	const go_arr = [];
	const class_arr = [];
	// Run through the result_d and correct the IDs
	for (let i = 0; i < result_d.length; i++) {
		// Correct the ID
		result_d[i]['id'] = result_d[i]['id'][0];
	}
	// Filter the result_d
	result_d = result_d.filter((rec) => allowed_d.has(rec['id']));
	// Run through the result_d: add propensity, fill the class_arr and go_arr
	for (let i = 0; i < result_d.length; i++) {
		// Filter out additional targets
		// Add the propensity
		if (result_p.hasOwnProperty(result_d[i]['id_gen'])) {
			result_d[i]['propensity'] = result_p[result_d[i]['id_gen']]['propensity'];
		} else {
			result_d[i]['propensity'] = -1;
		}
		// Fill the class_arr
		let classes = result_d[i]['class'].split(' | ');
		for (let k = 0; k < classes.length; k++) {
			if (classes[k] != "NA") {
				class_arr.push({class: classes[k], val: parseFloat(result_d[i]['val'])});
				unique_classes.add(classes[k]);
			}
		}
		// Fill the gos_arr
		let gos = result_d[i]['process'].split(' | ');
		for (let k = 0; k < gos.length; k++) {
			if (gos[k] != "NA") {
				go_arr.push({go: gos[k], val: parseFloat(result_d[i]['val'])});
				unique_gos.add(gos[k]);
			}
		}
	}
	// Run through the result_i and correct the IDs
	for (let i = 0; i < result_i.length; i++) {
		// Correct the ID
		result_i[i]['id'] = result_i[i]['id'][0];
	}
	// Filter the result_i
	result_i = result_i.filter((rec) => allowed_i.has(rec['id']));
	// Run through the result_i: add propensity, fill the class_arr and go_arr
	for (let i = 0; i < result_i.length; i++) {
		// Add the propensity
		if (result_p.hasOwnProperty(result_i[i]['id_gen'])) {
			result_i[i]['propensity'] = result_p[result_i[i]['id_gen']]['propensity'];
		} else {
			result_i[i]['propensity'] = -1;
		}
		// Fill the class_arr
		let classes = result_i[i]['class'].split(' | ');
		for (let k = 0; k < classes.length; k++) {
			if (classes[k] != "NA") {
				class_arr.push({class: classes[k], val: parseFloat(result_i[i]['val'])});
				unique_classes.add(classes[k]);
			}
		}
		// Fill the gos_arr
		let gos = result_i[i]['process'].split(' | ');
		for (let k = 0; k < gos.length; k++) {
			if (gos[k] != "NA") {
				go_arr.push({go: gos[k], val: parseFloat(result_i[i]['val'])});
				unique_gos.add(gos[k]);
			}
		}
	}
	// Summ Pa-Pi values for each class and term, for example SEE: https://stackoverflow.com/questions/29364262/how-to-group-by-and-sum-an-array-of-objects?noredirect=1&lq=1
	// More straightforward approach will be used here
	// arrays to store the accumulated classes and processes 
	const class_avg = [];
	const go_avg = [];
	for (const value of unique_classes) {
		// Filter the class_arr to get the records on this class
		let thisClass = class_arr.filter(function(class_arr){
			return class_arr.class === value;
		});
		// Summarize with reduce
		let sum_val = thisClass.reduce(
  			(accumulator, currentValue) => accumulator + currentValue.val,
  			0,
		);
		// Find max with reduce
		let max_val = thisClass.reduce((prev, current) => (prev && prev.val > current.val) ? prev : current)['val'];
		// Push the sum
		class_avg.push({class: value, val: ( max_val + (sum_val / (2 * thisClass.length)) ) });
	}
	for (const value of unique_gos) {
		// Filter the class_arr to get the records on this class
		let thisGo = go_arr.filter(function(go_arr){
			return go_arr.go === value;
		});
		// Summarize with reduce
		let sum_val = thisGo.reduce(
  			(accumulator, currentValue) => accumulator + currentValue.val,
  			0,
		);
		// Find max with reduce, SEE: https://stackoverflow.com/questions/4020796/finding-the-max-value-of-a-property-in-an-array-of-objects
		let max_val = thisGo.reduce((prev, current) => (prev && prev.val > current.val) ? prev : current)['val'];
		// Push the sum
		go_avg.push({go: value, val: ( max_val + (sum_val / (2 * thisGo.length)) ) });
	}
	// Sort to get the most frequent terms and classes, SEE for a quick reference: https://stackoverflow.com/questions/1069666/sorting-object-property-by-values
	go_sorted    = Object(go_avg).sort(function(a,b){return b.val-a.val}).map(obj => obj.go);
	class_sorted = Object(class_avg).sort(function(a,b){return b.val-a.val}).map(obj => obj.class);
	// Concat D and I and sort, SEE: https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
	const result_di = result_d.concat(result_i);
	result_di.sort((a,b) => b.val - a.val);
	result[0] = result_di;
	result[1] = class_sorted;
	result[2] = go_sorted;
	result[3] = pic;
	//Open new tab and bring the data there
	const representation_tab = window.open("https://way2drug.com/passtargets/represent.php", '_blank');
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