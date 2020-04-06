/* eslint-disable camelcase */

/* eslint-disable valid-jsdoc */
/* eslint-disable no-unused-vars */
/* eslint-disable require-jsdoc */
const zip = (ks, vs) => ks.reduce((o, k, i) => {
  o[k] = vs[i];
  return o;
}, {});

function doGet(e) {
  // Logger.log(e);
  return HtmlService.createTemplateFromFile('Index').evaluate();
}

/* @Include JavaScript and CSS Files */
function include(filename) {
  return HtmlService
      .createHtmlOutputFromFile(filename)
      .getContent();
}

function extract_form_data_(frm) {
  const num_notes = parseInt(frm.total_notes);
  return [
    frm.lbl_lick,
    parseInt(frm.finger_diff) || 0,
    parseInt(frm.pick_diff) || 0,
    parseInt(frm.legato_cnt) || 0,
    parseInt(frm.bending_cnt) || 0,
    parseInt(frm.intensity) || 0,
    parseInt(frm.speed_diff) || 0,
    parseInt(frm.timing_diff) || 0,
    num_notes,
    frm.has_slides == 'on',
    frm.has_vib == 'on',
    frm.has_mutes == 'on',
    parseInt(frm.legato_cnt) || 0 / num_notes,
    parseInt(frm.bending_cnt) || 0 / num_notes,
    frm.boxes_used,
    frm.chords, 'TBD',
  ];
}
/* @Process Form */
function processForm(frm) {
  Logger.log(frm);
  const ws = get_sheet_by_course_title_(frm.course_title);
  if (ws != null) {
    if (!get_lick_row_(ws, frm.lbl_lick).data_range) {
      Logger.log(frm);
      return ws.appendRow(extract_form_data_(frm));
    } else {
      const v = update_lick(frm, ws);
      Logger.log(v);
      return v; //
    }
  }
  Logger.log('Sheet %s: Not Found', frm.course_title);
}

function update_lick(frm, ws) {
  ws = ws || get_sheet_by_course_title_(frm.course_title);
  const lick_row = get_lick_row_(ws, frm.lbl_lick, null, true);
  const frm_data = extract_form_data_(frm);
  Logger.log(frm_data);
  lick_row.data_range.setValues([frm_data]);
  return update_chart(frm.course_title, lick_row.lick);
}

function get_sheet_names() {
  const out = [];
  let sn;
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (let i = 0; i < sheets.length; i++) {
    sn = sheets[i].getName();
    if (sn.indexOf('_data') < 0) out.push(sn);
  }
  Logger.log(out);
  return out;
}

function get_licks_names(sheet) {
  const out = [];
  const ws = get_sheet_by_course_title_(sheet);
  const lastRow = ws.getLastRow();
  for (let i = 2; i <= lastRow; i++) {
    out.push(ws.getRange(i, 1).getValue());
  }
  return out;
}

function delete_lick(sheet, lick) {
  const ws = get_sheet_by_course_title_(sheet);
  const r_idx = get_lick_row_(ws, lick).idx;
  Logger.log(`Row idx: ${r_idx}`);
  return ws.deleteRow(r_idx);
}

function update_chart(sheet, lick, action) {
  ws = get_sheet_by_course_title_(sheet);
  const newRange = get_lick_row_(ws, lick, action);
  const data = {
    xs: get_header_row_(ws).slice(1, 8),
    ys: newRange.data.slice(1, 8),
  };
  Logger.log(`cd: ${JSON.stringify(data, 2, null)}`);
  return {
    xs: data.xs,
    ys: data.ys,
    title: newRange.lick + ' Lick Landscape',
  };
}

function get_sheet_id_() {
  const id = PropertiesService
      .getScriptProperties()
      .getProperty('SPREADSHEET_ID');
  return id;
}

function get_landscape(sheet, b_all) {
  const ws = get_sheet_by_course_title_(sheet);
  let data = [];
  if (ws) {
    const numRows = ws.getLastRow();
    const numCols = b_all ? ws.getLastColumn() : 8
    ;
    data = ws.getRange(1, 1, numRows, numCols).getDisplayValues();
  }
  Logger.log(data);
  return data;
}

function get_lick(sheet, lick, sibling) {
  let final = null;
  const ws = get_sheet_by_course_title_(sheet);
  const row = get_lick_row_(ws, lick, sibling);
  Logger.log(`sibling: ${sibling}`);
  Logger.log(`get_lick_row : ${row.data}`);
  const form_ctrls = [
    'lbl_lick',
    'finger_diff',
    'pick_diff',
    'legato_cnt',
    'bending_cnt',
    'intensity',
    'speed_diff',
    'timing_diff',
    'total_notes',
    'has_slides',
    'has_vib',
    'has_mutes',
    'L_dense',
    'B_dense',
    'boxes_used',
    'chords', 'GEN',
    'loop_start',
    'loop_end',
  ];
  Logger.log(form_ctrls);
  Logger.log(row.data);
  try {
    if (row.data.length < 1) {
      // eslint-disable-next-line no-throw-literal
      throw {
        name: 'InvalidSearch',
        message: `${sheet} contains no record for lick: ${row.lick}`,
      };
    }

    final = zip(form_ctrls, row.data);
  } catch (err) {
    return err;
  }

  Logger.log(` (final):`);
  Logger.log(final);
  return final;
}

function read_all_values(sheet) {
  const sh = get_sheet_by_course_title_(sheet);
  const data = {};
  data.records = read_data_(sh);
  Logger.log(data);
  return data;
}

function get_sheet_by_course_title_(sheet) {
  return get_SS_().getSheetByName(sheet);
}

function get_course_meta(course) {
  const row = [];
  const meta_route = 'Course meta_data';
  const meta_sh = get_sheet_by_course_title_(meta_route);
  const lastCol = meta_sh.getLastColumn();
  const lastRow = meta_sh.getLastRow();
  for (let i = 2; i <= lastRow; i++) {
    const c = meta_sh.getRange(i, 1).getValue();
    if (c == course) {
      // row = meta_sh.getRange(i, 1, 1, lastCol).getValue();
      for (let j = 1; j <= lastCol; j++) {
        value = meta_sh.getRange(i, j).getValue();
        row.push(value);
        // Logger.log(value);
      }
      // Logger.log(row);
      break;
    }
  }
  const head = get_simple_header(meta_sh);
  head[0] = 'course';
  head.push('wsid');
  row.push(get_sheet_id_());
  const final = zip(head, row);
  Logger.log(final);
  return final;
}

function get_simple_header(sh) {
  return get_header_row_(sh).map((x) => x.toLowerCase().replace(' ', '_'));
}

/**
 * Get a row of lick information
 * @param {WORKSHEET} ws Current worksheet obj
 * @param {string} lick Name of lick
 * @param {tri-state bit} action (-1, 0 , 1 = prev, current, next)
 * @param {bool} trim don't count last 2 columns (loop: start/end)
 * @returns range object with Row data for lick
 */
function get_lick_row_(ws, lick, action, trim) {
  let offset = (action === null) ? 0 : (action === 'prev') ? -1 : 1;
  const lastRow = ws.getLastRow();
  const lastCol = ws.getLastColumn();
  const header = ws.getRange(1, 1, 1, lastCol);
  const range = {
    lastRow: lastRow,
    lastCol: lastCol,
    lick: lick,
    idx: -1,
    data: [],
    h_range: header,
    notation: 'A:1',
    data_range: null,
  };
  for (let i = 2; i <= lastRow; i++) {
    const lick_id = ws.getRange(i, 1).getValue();
    if (lick_id == lick) {
      // gives the ability to get the prev/next lick
      offset = (i + offset === 1 || i + offset > lastRow) ? 0 : offset;
      r = ws.getRange(i + offset, 1, 1, (trim) ? lastCol - 2 : lastCol);
      range.lick = ws.getRange(i + offset, 1).getValue();
      range.data_range = r;
      range.idx = i;
      range.data = r.getValues()[0];
      range.notation = r.getA1Notation();
      break;
    }
  }
  return range;
}

function read_data_(sh, properties) {
  if (typeof properties == 'undefined') {
    properties = get_header_row_(sh);
    properties = properties.map(function(p) {
      return p.replace(/\s+/g, '_');
    });
  }

  const rows = get_data_rows_(sh);
  const data = [];

  for (let r = 0, l = rows.length; r < l; r++) {
    const row = rows[r];
    const record = {};

    // eslint-disable-next-line guard-for-in
    for (const p in properties) {
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
  const url = PropertiesService
      .getScriptProperties()
      .getProperty('SPREADSHEET');
  return SpreadsheetApp.openByUrl(url);
}
