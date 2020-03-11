/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
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
    parseInt(frm.legato_cnt) || 0 / num_notes,
    parseInt(frm.bending_cnt) || 0,
    parseInt(frm.bending_cnt) || 0 / num_notes,
    frm.has_slides == 'on',
    frm.has_vib == 'on',
    frm.has_mutes == 'on',
    frm.boxes_used,
    parseInt(frm.intensity) || 0,
    frm.chords, 'TBD',
    num_notes,
    parseInt(frm.speed_diff) || 0,
    parseInt(frm.timing_diff) || 0,
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
      return v;
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
  return update_chart(frm.course_title, frm.lbl_lick);
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
  const lr = ws.getLastRow();
  for (let i = 2; i <= lr; i++) {
    out.push(ws.getRange(i, 1).getValue());
  }
  return out;
}

function process_chart_data(data) {
  // return data;
  let rem1; let rem2; const msgs = [];
  head = data.header;
  info = data.data;
  // replace count values with density values
  // TODO: remove hard coded idx
  const total_notes = info[head.indexOf('Total Notes')];
  const bnd_cnt = info[head.indexOf('Bending Count')];
  const leg_cnt = info[head.indexOf('Legato Count')];
  const vals = [
    ['Attribute', 'value'],
  ];
  Logger.log(head);
  Logger.log(info);
  idx = [4, 6, 10, 17, 18]; // column index on sheet

  for (let i = idx.length - 1; i >= 0; i--) {
    Logger.log(`REMOVING (${idx[i]}): ${head[idx[i]]} == ${info[idx[i]]}`);
    rem1 = head.splice(idx[i], 1);
    rem2 = info.splice(idx[i], 1);
    msgs.push(`Removed (${idx[i]}): ${rem1} == ${rem2}`);
  }

  // remove text fields, percentages, and checkboxes from data
  for (let j = info.length - 1; j >= 0; j--) {
    if (typeof info[j] !== 'number') {
      Logger.log(`${info[j]} : ${typeof info[j]}`);
      rem1 = head.splice(j, 1);
      rem2 = info.splice(j, 1);
      msgs.push(`Removed (${j}): ${rem1} == ${rem2}`);
    }
  }

  //  change labels
  head[leg_cnt] = `${head[leg_cnt].split(' ')[0]} Density %(cnt: ${leg_cnt})`;
  head[bnd_cnt] = `${head[bnd_cnt].split(' ')[0]} Density %(cnt: ${bnd_cnt})`;

  // calc and set vals
  info[leg_cnt] = parseInt((leg_cnt / total_notes) * 100);
  info[bnd_cnt] = parseInt((bnd_cnt / total_notes) * 100);


  for (let x = 0; x <= info.length - 1; x++) {
    vals.push([head[x], info[x]]);
  }
  Logger.log(`Removed: ${msgs}`);
  // return vals;
  return {
    xs: head,
    ys: info,
  };
}

function delete_lick(sheet, lick) {
  const ws = get_sheet_by_course_title_(sheet);
  const r_idx = get_lick_row_(ws, lick).idx;
  Logger.log(`Row idx: ${r_idx}`);
  return ws.deleteRow(r_idx);
}

function update_chart(sheet, lick, action) {
  const ws = get_sheet_by_course_title_(sheet);
  const newRange = get_lick_row_(ws, lick, action);
  const data = process_chart_data({
    header: get_header_row_(ws),
    data: newRange.data,
  });
  const chart_data = {
    xs: data.xs,
    ys: data.ys,
    title: newRange.lick + ' Lick Landscape',
  };
  Logger.log(chart_data);
  return chart_data;
}

function get_lick(sheet, lick, sibling) {
  let final = null;
  const ws = get_sheet_by_course_title_(sheet);
  const row = get_lick_row_(ws, lick, sibling);
  Logger.log(`sibling: ${sibling}`);
  Logger.log(`get_lick_row :`);
  const form_ctrls = [
    'lbl_lick',
    'finger_diff',
    'pick_diff',
    'legato_cnt',
    'L_dense',
    'bending_cnt',
    'B_dense',
    'has_slides',
    'has_vib',
    'has_mutes',
    'boxes_used',
    'intensity',
    'chords', 'GEN',
    'total_notes',
    'speed_diff',
    'timing_diff',
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
  let row = [];
  const meta_route = 'Course meta_data';
  const meta_sh = get_sheet_by_course_title_(meta_route);
  const lc = meta_sh.getLastColumn();
  const lr = meta_sh.getLastRow();
  for (let i = 2; i <= lr; i++) {
    const c = meta_sh.getRange(i, 1).getValue();
    if (c == course) {
      // row = meta_sh.getRange(i, 1, 1, lc).getValue();
      for (let j = 1; j <= lc; j++) {
        value = meta_sh.getRange(i, j).getValue();
        row.push(value);
        // Logger.log(value);
      }
      Logger.log(row);
      break;
    }
  }
  const head = get_simple_header(meta_sh);
  head[0] = 'course';
  Logger.log(head);
  return zip(head, row);
}

function get_simple_header(sh) {
  return get_header_row_(sh).map( (x) => x.toLowerCase().replace(' ', '_'));
}
/**
 * Get a row of lick information
 * @param {WORKSHEET} ws Current worksheet obj
 * @param {string} lick Name of lick
 * @param {tri-state bit} action (-1, 0 , 1 = prev, current, next)
 * @param {bool} trim don't count last 2 columns (loop: start/end)
 */
function get_lick_row_(ws, lick, action, trim) {
  let offset = (action === null) ? 0 : (action === 'prev') ? -1 : 1;
  const lr = ws.getLastRow();
  const lc = ws.getLastColumn();
  const header = ws.getRange(1, 1, 1, lc);
  const range = {
    lr: lr,
    lc: lc,
    lick: lick,
    idx: -1,
    data: [],
    h_range: header,
    notation: 'A:1',
    data_range: null,
  };
  for (let i = 2; i <= lr; i++) {
    const lick_id = ws.getRange(i, 1).getValue();
    if (lick_id == lick) {
      offset = (i + offset === 1 || i + offset > lr) ? 0 : offset;
      r = ws.getRange(i + offset, 1, 1, (trim) ? lc - 2 : lc);
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
