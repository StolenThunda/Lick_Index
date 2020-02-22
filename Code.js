function doGet(e) {
    Logger.log(JSON.stringify(e))
    return HtmlService.createTemplateFromFile('Index').evaluate();
}

/* @Include JavaScript and CSS Files */
function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename)
        .getContent();
}

function extract_form_data_(frm) {
    var num_notes = parseInt(frm.total_notes);
    return [
        frm.lbl_lick,
        parseInt(frm.finger_diff),
        parseInt(frm.pick_diff),
        parseInt(frm.legato_cnt),
        parseInt(frm.legato_cnt / num_notes),
        parseInt(frm.bending_cnt),
        parseInt(frm.bending_cnt / num_notes),
        frm.has_slides == 'on',
        frm.has_vib == 'on',
        frm.has_mutes == 'on','',
        frm.boxes_used,
        parseInt(frm.intensity),
        frm.chords, '',
        num_notes,
        parseInt(frm.speed_diff),
        parseInt(frm.timing_diff),
    ]
}
/* @Process Form */
function processForm(frm) {
    var ws = get_sheet_by_course_title_(frm.course_title);
    if (ws != null) return ws.appendRow(extract_form_data_(frm));
    Logger.log('Sheet %s: Not Found', frm.course_title)
}

function update_lick(frm) {
    var ws = get_sheet_by_course_title_(frm.course_title);
    var lick_row = get_lick_row_(ws, frm.lbl_lick);
    var frm_data = extract_form_data_(frm)
    Logger.log(`Frmdata: ${frm_data}`);
    Logger.log(`Lick Range: ${lick_row.data_range}`);
    lick_row.data_range.setValues([]);
    return update_chart(frm.course_title, frm.lbl_lick);
}

function get_sheet_names() {
    var out = new Array()
    var sn;
    var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
    for (var i = 0; i < sheets.length; i++) {
        sn = sheets[i].getName()
        if (sn.indexOf('_data') < 0) out.push(sn)
    }
    return [out, 'course_title'];
}

function get_licks_for_course(sheet) {
    var out = new Array()
    var ws = get_sheet_by_course_title_(sheet);
    var lr = ws.getLastRow();
    for (var i = 2; i <= lr; i++) {
        out.push(ws.getRange(i, 1).getValue());
    }
    return [out, 'lick_names'];
}

function update_chart(sheet, lick) {
    var data_sheet = get_sheet_by_course_title_(sheet);
    var ws = get_sheet_by_course_title_(sheet)
    var newRange = get_lick_row_(data_sheet, lick);
    var chart_data = {
        data : process_chart_data([get_header_row_(ws), newRange.data]),
        title: lick + ' Lick Detail'
    };
    Logger.log(chart_data);
    return chart_data;
}

function process_chart_data(data){
    // return data;
    var rem1, rem2, msgs = [];
    head = data[0];
    info = data[1];
    idx = [4, 6, 10];  // column index on sheet
    for (var i = idx.length-1; i >= 0; i--){
        // Logger.log(`REMOVING (${idx[i]}): ${head[idx[i]]} == ${info[idx[i]]}`);
        rem1 = head.splice(idx[i], 1);
        rem2 = info.splice(idx[i], 1);
        msgs.push(`Removed (${idx[i]}): ${rem1} == ${rem2}`);
    }
    // remove text fields, percentages, and checkboxes from data
    for (var j = info.length-1; j >= 0; j--) {        
        if (typeof info[j] !== 'number') {
            // Logger.log(`${info[j]} : ${typeof info[j]}`)
            rem1 = head.splice(j, 1);
            rem2 = info.splice(j, 1);
            msgs.push(`Removed (${j}): ${rem1} == ${rem2}`);
        }
    }
    var vals = [["Attribute", "value"]];
    for (var x = 0; x <= info.length -1; x++){
        vals.push([head[x], info[x]]);
    }
    // Logger.log(`Removed: ${msgs}`);
    return vals;
    return [head, info];
}

function delete_lick(sheet, lick) {
    ws.deleteRow(get_lick_row_(get_sheet_by_course_title_(sheet), lick).idx);
}

function get_lick(sheet, lick) {
    var zip = (ks, vs) => ks.reduce((o, k, i) => {
        o[k] = vs[i];
        return o;
    }, {});
    var ws = get_sheet_by_course_title_(sheet)
    var row = get_lick_row_(ws, lick).data;
    var form_ctrls = [
        'lbl_lick',
        'finger_diff',
        'pick_diff',
        'legato_cnt', 'L_dense',
        'bending_cnt', 'B_dense',
        'has_slides',
        'has_vib',
        'has_mutes',
        'boxes_used',
        'intensity',
        'chords', 'GEN',
        'total_notes',
        'speed_diff',
        'timing_diff',
    ];
    var final = zip(form_ctrls, row);
    Logger.log(final)
    return final;
}

function read_all_values(sheet) {
    var sh = get_sheet_by_course_title_(sheet);
    var data = {};
    data.records = read_data_(sh);
    output = ContentService.createTextOutput(JSON.stringify(data)),
        output.setMimeType(ContentService.MimeType.JSON);
    Logger.log(output);
    return JSON.stringify(data);
}

function get_sheet_by_course_title_(sheet) {   
    return get_SS_().getSheetByName(sheet);
}

function get_lick_row_(ws, lick) {

    var lr = ws.getLastRow();
    var lc = ws.getLastColumn()
    var header = ws.getRange(1, 1, 1, lc);
    var range = {
        lr: lr,
        lc: lc,
        idx: -1,
        data: [],
        h_range: header,
        notation: "A:1",
        range: null
    }
    for (var i = 1; i <= lr; i++) {
        var lick_id = ws.getRange(i, 1).getValue();
        if (lick_id == lick) {
            r = ws.getRange(i, 1, 1, lc);
            range.data_range = r;
            range.idx = i;
            range.data = r.getValues()[0];
            range.notation = r.getA1Notation();
            break;
        }
    }
    // Logger.log(range);
    return range;
}

function read_data_(sheetname, properties) {
    var sh = get_sheet_by_course_title_(sheetname);
    if (typeof properties == "undefined") {
        properties = get_header_row_(sh);
        properties = properties.map(function (p) {
            return p.replace(/\s+/g, '_');
        });
    }

    var rows = get_data_rows_(sh),
        data = [];

    for (var r = 0, l = rows.length; r < l; r++) {
        var row = rows[r],
            record = {};

        for (var p in properties) {
            record[properties[p]] = row[p];
        }

        data.push(record);

    }
    return data;
}

function get_data_rows_(sh) {
    return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
}

function get_header_row_(sh) {
    return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
}

function get_SS_() {
    var url = PropertiesService.getScriptProperties().getProperty('SPREADSHEET');
    return SpreadsheetApp.openByUrl(url);
}