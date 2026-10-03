async function testPatch() {
    const docId = '3bvHEQzCF7YS8ZuLEHRm'; // R2 P1 match
    const url = `https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/entrenos_matches/${docId}?updateMask.fieldPaths=dummy`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fields: { dummy: { stringValue: 'test' } }
        })
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data));
}
testPatch();
