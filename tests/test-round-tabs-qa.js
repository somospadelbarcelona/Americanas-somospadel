const fs = require('fs');
global.window = {};
require('../js/modules/ui/EventHeader.js');

console.log('Testing with 4 rounds passed in:');
const html4 = window.EventHeader.renderRoundTabs([{number: 1}, {number: 2}, {number: 3}, {number: 4}], 1, { isEntreno: false }, []);
const matches4 = html4.match(/<button[^>]*class="round-tab/g) || [];
console.log('Button round-tab matches:', matches4.length);
console.log('All "round-tab" matches:', (html4.match(/round-tab/g) || []).length);
if (matches4.length !== 6) throw new Error('Expected 6 buttons, got ' + matches4.length);

console.log('Testing with 0 rounds passed in:');
const html0 = window.EventHeader.renderRoundTabs([], 1, { isEntreno: false }, []);
const count0 = (html0.match(/<button[^>]*class="round-tab/g) || []).length;
console.log('Tabs rendered for 0 rounds input:', count0);
if (count0 !== 6) throw new Error('Expected 6 tabs, got ' + count0);

console.log('Testing with 7 rounds passed in:');
const html7 = window.EventHeader.renderRoundTabs(Array.from({length: 7}, (_, i) => ({number: i+1})), 1, { isEntreno: false }, []);
const count7 = (html7.match(/<button[^>]*class="round-tab/g) || []).length;
console.log('Tabs rendered for 7 rounds input:', count7);
if (count7 !== 7) throw new Error('Expected 7 tabs, got ' + count7);

console.log('Testing chip texts for R1 through R6:');
for (let i = 1; i <= 6; i++) {
    if (!html4.includes(`>R${i}</span>`)) {
        throw new Error(`Missing text >R${i}</span> in rendered tabs`);
    }
}

console.log('ALL ROUND TESTS PASSED OK! ✅');
