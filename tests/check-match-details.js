async function checkMatchDetails() {
    const eventId = 'U16RGVsSrNMic49p6EUi';
    const matchesUrl = `https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents:runQuery`;
    const body = {
        structuredQuery: {
            from: [{ collectionId: 'entrenos_matches' }],
            where: {
                fieldFilter: {
                    field: { fieldPath: 'americana_id' },
                    op: 'EQUAL',
                    value: { stringValue: eventId }
                }
            }
        }
    };

    const resM = await fetch(matchesUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const matchesData = await resM.json();
    matchesData.forEach(m => {
        if (!m.document) return;
        const f = m.document.fields || {};
        console.log(`\nDoc ID: ${m.document.name.split('/').pop()} | createTime: ${m.document.createTime} | updateTime: ${m.document.updateTime}`);
        console.log(`R${f.round?.integerValue} P${f.court?.integerValue}:`);
        console.log(`team_a_ids:`, f.team_a_ids?.arrayValue?.values?.map(v => v.stringValue));
        console.log(`team_b_ids:`, f.team_b_ids?.arrayValue?.values?.map(v => v.stringValue));
        console.log(`team_a_names:`, f.team_a_names?.arrayValue?.values?.map(v => v.stringValue));
        console.log(`team_b_names:`, f.team_b_names?.arrayValue?.values?.map(v => v.stringValue));
        console.log(`created_by:`, f.created_by?.stringValue, `createdAt:`, f.createdAt?.stringValue);
        console.log(`ai_metrics:`, f.ai_metrics);
    });
}

checkMatchDetails();
