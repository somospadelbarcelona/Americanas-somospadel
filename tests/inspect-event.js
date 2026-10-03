async function inspectEvent() {
    const eventId = 'U16RGVsSrNMic49p6EUi';
    const url = `https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/entrenos/${eventId}`;
    const res = await fetch(url);
    const doc = await res.json();
    console.log("=== EVENT DOCUMENT ===");
    console.log(JSON.stringify(doc.fields, null, 2));

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
    console.log("\n=== MATCHES IN entrenos_matches ===");
    if (Array.isArray(matchesData)) {
        matchesData.forEach(m => {
            if (!m.document) return;
            const f = m.document.fields || {};
            console.log(`R${f.round?.integerValue} P${f.court?.integerValue}: ${f.team_a?.stringValue || f.team_a_names?.arrayValue?.values?.map(v => v.stringValue).join('/')} (${f.score_a?.integerValue}) vs ${f.team_b?.stringValue || f.team_b_names?.arrayValue?.values?.map(v => v.stringValue).join('/')} (${f.score_b?.integerValue}) status=${f.status?.stringValue}`);
        });
    }

    // Probar también collection 'matches'
    const body2 = {
        structuredQuery: {
            from: [{ collectionId: 'matches' }],
            where: {
                fieldFilter: {
                    field: { fieldPath: 'americana_id' },
                    op: 'EQUAL',
                    value: { stringValue: eventId }
                }
            }
        }
    };
    const resM2 = await fetch(matchesUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body2)
    });
    const matchesData2 = await resM2.json();
    console.log("\n=== MATCHES IN matches ===");
    if (Array.isArray(matchesData2)) {
        matchesData2.forEach(m => {
            if (!m.document) return;
            const f = m.document.fields || {};
            console.log(`R${f.round?.integerValue} P${f.court?.integerValue}: ${f.team_a?.stringValue || f.team_a_names?.arrayValue?.values?.map(v => v.stringValue).join('/')} (${f.score_a?.integerValue}) vs ${f.team_b?.stringValue || f.team_b_names?.arrayValue?.values?.map(v => v.stringValue).join('/')} (${f.score_b?.integerValue}) status=${f.status?.stringValue}`);
        });
    }
}

inspectEvent();
