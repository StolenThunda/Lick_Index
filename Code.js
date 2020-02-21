function doGet(e) {
    Logger.log(JSON.stringify(e))
    return HtmlService.createTemplateFromFile('Index').evaluate();
}

/* @Include JavaScript and CSS Files */
function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename)
        .getContent();
}

/* @Process Form */
function processForm(frm) {
    var url = PropertiesService.getScriptProperties().getProperty('SPREADSHEET') //"https://docs.google.com/spreadsheets/d/1zh-oGZOGsz6-iZ5nk33CyJQ5cXYF1KEiM-wx8fAunv4/edit#gid=2102881368";
    var ss = SpreadsheetApp.openByUrl(url);
    var ws = ss.getSheetByName(frm.course_title);
    if (ws != null) {
        var row = new Array();
        row.push(frm.lbl_lick,
            parseInt(frm.finger_diff),
            parseInt(frm.pick_diff),
            frm.legato_cnt,
            frm.legato_cnt / frm.total_notes,
            frm.bending_cnt,
            frm.bending_cnt / frm.total_notes,
            frm.has_slides == 'on',
            frm.has_mutes == 'on',
            frm.has_vib == 'on',
            frm.boxes_used,
            frm.intensity,
            frm.chords, '',
            frm.total_notes,
            frm.speed_diff,
            frm.timing_diff
        );
        Logger.log(JSON.stringify(row));
        ws.appendRow(row);
    } else {
        Logger.log('Sheet %s: Not Found', frm.course_title)
    }
}

function sheetnames() {
    var out = new Array()
    var sn;
    var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
    for (var i = 0; i < sheets.length; i++) {
        sn = sheets[i].getName()
        if (sn.indexOf('_data') < 0) out.push(sn)
    }
    return [out, 'course_title'];
}

function licks_for_course(sheet) {
    var out = new Array()
    var url = PropertiesService.getScriptProperties().getProperty('SPREADSHEET');
    var ss = SpreadsheetApp.openByUrl(url);
    var ws = ss.getSheetByName(sheet);
    var lr = ws.getLastRow();
    for (var i = 2; i <= lr; i++) {
        out.push(ws.getRange(i, 1).getValue());
    }
    return [out, 'lick_names'];
}
//  
//function insert_value(request,sheet){
// 
// 
//   var id = request.parameter.id;
//  var country = request.parameter.name;
//  
//  var flag=1;
//  var lr= sheet.getLastRow();
//  for(var i=1;i<=lr;i++){
//    var id1 = sheet.getRange(i, 2).getValue();
//    if(id1==id){
//      flag=0;
//  var result="Id already exist..";
//    } }
//  //add new row with recieved parameter from client
//  if(flag==1){
//  var d = new Date();
//    var currentTime = d.toLocaleString();
//  var rowData = sheet.appendRow([currentTime,id,country]);  
//  var result="Insertion successful";
//  }
//     result = JSON.stringify({
//    "result": result
//  });  
//    
//  return ContentService
//  .createTextOutput(request.parameter.callback + "(" + result + ")")
//  .setMimeType(ContentService.MimeType.JAVASCRIPT);   
//  }


function update_chart(sheet, lick) {
    var url = PropertiesService.getScriptProperties().getProperty('SPREADSHEET');
    var ss = SpreadsheetApp.openByUrl(url);
    var sheet = ss.getSheetByName(sheet + '_data');
    if (sheet != null) {
        var lick_chart = sheet.getCharts()[0];

        var lick_title = lick + ' Lick Detail';

        var lr = sheet.getLastRow();
        return lr;
        for (var i = 1; i <= lr; i++) {
            var lick_id = sheet.getRange(i, 1).getValue();
            if (lick_id == lick) {
                var newRange = sheet.getRange(i, 1, 1, sheet.getLastColumn());
                return newRange;
                var newChart = lick_chart
                    .modify()
                    .clearRanges()
                    .addRange(newRange)
                    .setOption('title', lick_title)
                    .build();
                sheet.updateChart(newChart);
                return lick_title;
            }
        }
    } else {
        return "SHEET HAS NO CHART DATA"
    }
}

function read_value(sheet, lick) {
    var toObj = (ks, vs) => ks.reduce((o, k, i) => {
        o[k] = vs[i];
        return o;
    }, {});

    var url = PropertiesService.getScriptProperties().getProperty('SPREADSHEET');
    var ss = SpreadsheetApp.openByUrl(url);
    var ws = ss.getSheetByName(sheet);
    var flag = 0;
    var lr = ws.getLastRow();
    for (var i = 1; i <= lr; i++) {
        var lick_id = ws.getRange(i, 1).getValue();
        if (lick_id == lick) {
            var row = ws.getRange(i, 1, 1, ws.getLastColumn()).getValues()[0];
            var headers = ['lbl_lick',
                'finger_diff',
                'pick_diff',
                'legato_cnt',
                'bending_cnt',
                'has_slides',
                'has_mutes',
                'has_vib',
                '',
                'boxes_used',
                'intensity',
                'chords',
                '',
                'total_notes',
                'speed_diff',
                'timing_diff',
            ];
            return toObj(headers, row);
        }
    }
}


function read_all_values(sheet) {

    var url = PropertiesService.getScriptProperties().getProperty('SPREADSHEET')
    var ss = SpreadsheetApp.openByUrl(url);

    var data = {};

    data.records = readData_(ss, sheet);
    output = ContentService.createTextOutput(JSON.stringify(data)),
        output.setMimeType(ContentService.MimeType.JSON);
    Logger.log(output);
    return JSON.stringify(data);
}


function readData_(ss, sheetname, properties) {

    if (typeof properties == "undefined") {
        properties = getHeaderRow_(ss, sheetname);
        properties = properties.map(function (p) {
            return p.replace(/\s+/g, '_');
        });
    }

    var rows = getDataRows_(ss, sheetname),
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



function getDataRows_(ss, sheetname) {
    var sh = ss.getSheetByName(sheetname);

    return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
}


function getHeaderRow_(ss, sheetname) {
    var sh = ss.getSheetByName(sheetname);

    return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
}