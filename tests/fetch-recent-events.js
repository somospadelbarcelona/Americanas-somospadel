async function runStructuredQuery() {
    const collections = ['americanas', 'entrenos'];
    for (const col of collections) {
        console.log(`\n=== Querying collection: ${col} ===`);
        const url = `https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents:runQuery`;
        const body = {
            structuredQuery: {
                from: [{ collectionId: col }],
                orderBy: [{ field: { fieldPath: 'updatedAt' }, direction: 'DESCENDING' }],
                limit: 10
            }
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const results = await res.json();
        if (Array.isArray(results)) {
            for (const r of results) {
                if (!r.document) continue;
                const id = r.document.name.split('/').pop();
                const f = r.document.fields || {};
                const name = f.name?.stringValue || f.title?.stringValue || 'Sin nombre';
                const pair_mode = f.pair_mode?.stringValue || 'N/A';
                const category = f.category?.stringValue || 'N/A';
                const format = f.format?.stringValue || 'N/A';
                const status = f.status?.stringValue || 'N/A';
                const date = f.date?.stringValue || 'N/A';
                console.log(`[${col}] ID: ${id} | Name: "${name}" | pair_mode: "${pair_mode}" | category: "${category}" | format: "${format}" | date: "${date}"`);
            }
        } else {
            console.log("No array or error:", results);
        }
    }
}

runStructuredQuery();
