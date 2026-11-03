const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const handler = html.slice(html.indexOf('$("form").onsubmit='), html.indexOf('\nfunction edit('));

function submit(values = {}, existing = null) {
  const fields = new Map();
  const defaults = {f_price: '500', f_ram: '', f_ssd: '', f_ramType: 'DDR4', f_look: 'neutral', f_avail: true};
  for (const [id, value] of Object.entries({...defaults, ...values})) {
    fields.set(id, {value: typeof value === 'boolean' ? '' : value, checked: value === true});
  }
  const $ = id => {
    if (!fields.has(id)) fields.set(id, {value: '', checked: false, textContent: ''});
    return fields.get(id);
  };
  let saved = 0;
  const context = {
    window: {AssayImport: require('../listing-import.js')}, $, pk: {cpu: {val: ['Test CPU', 21000]}, gpu: {val: ['Test GPU', 17000]}},
    items: existing ? [existing] : [], editIdx: existing ? 0 : -1, uid: () => 'new-id',
    saveI: () => saved++, resetForm() {}, renderAll() {}, go() {}, toast() {},
  };
  vm.runInNewContext(handler, context);
  $('form').onsubmit({preventDefault() {}});
  return {items: context.items, saved, fields};
}

const assumed = submit();
assert.equal(assumed.saved, 1);
assert.equal(assumed.items[0].ram, 16);
assert.equal(assumed.items[0].ramType, 'DDR4');
assert.equal(assumed.items[0].ssd, 1000);
assert.equal(assumed.items[0].ramUnknown, true);
assert.equal(assumed.items[0].ssdUnknown, true);

const explicit = submit({f_ram: '32', f_ramType: 'DDR5', f_ssd: '0'});
assert.equal(explicit.items[0].ram, 32);
assert.equal(explicit.items[0].ramType, 'DDR5');
assert.equal(explicit.items[0].ssd, 0, 'Known absence of SSD must not become an assumption');
assert.equal(explicit.items[0].ramUnknown, false);
assert.equal(explicit.items[0].ssdUnknown, false);

const invalid = submit({f_ram: '-1'});
assert.equal(invalid.saved, 0);
assert.equal(invalid.fields.get('memoryDetails').open, true, 'Reveal invalid optional field');
assert.match(invalid.fields.get('formErr').textContent, /RAM/);
assert.equal(submit({f_price: '0'}).saved, 0);
assert.equal(submit({f_setup: true, f_setupAmt: '500'}).saved, 0);

const edited = submit({}, {id: 'existing-id', favorite: true});
assert.equal(edited.items.length, 1);
assert.equal(edited.items[0].id, 'existing-id');
assert.equal(edited.items[0].favorite, true);
console.log('UI entry tests passed: assumptions, explicit capacities, validation, and edit identity.');
