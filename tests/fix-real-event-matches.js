async function fixRealEvent() {
    const eventId = 'U16RGVsSrNMic49p6EUi';
    const baseUrl = `https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents`;

    // 1. Obtener todos los partidos de R2
    const matchesUrl = `${baseUrl}:runQuery`;
    const query = {
        structuredQuery: {
            from: [{ collectionId: 'entrenos_matches' }],
            where: {
                compositeFilter: {
                    op: 'AND',
                    filters: [
                        { fieldFilter: { field: { fieldPath: 'americana_id' }, op: 'EQUAL', value: { stringValue: eventId } } },
                        { fieldFilter: { field: { fieldPath: 'round' }, op: 'EQUAL', value: { integerValue: '2' } } }
                    ]
                }
            }
        }
    };

    const res = await fetch(matchesUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
    });
    const matches = await res.json();
    console.log("Found R2 matches:", matches.length);

    let docP1 = null;
    let docP2 = null;

    matches.forEach(m => {
        if (!m.document) return;
        const court = parseInt(m.document.fields.court?.integerValue || 1);
        const docId = m.document.name.split('/').pop();
        if (court === 1) docP1 = docId;
        if (court === 2) docP2 = docId;
    });

    console.log("P1 Doc ID:", docP1, "P2 Doc ID:", docP2);

    if (!docP1 || !docP2) {
        throw new Error("Could not find both P1 and P2 documents for R2");
    }

    // 2. Actualizar P1 con los ganadores de P1 (Abraham y Agata separados) y ganadores de P2 (Alvaro y Carles separados)
    const p1Payload = {
        fields: {
            americana_id: { stringValue: eventId },
            round: { integerValue: "2" },
            court: { integerValue: "1" },
            status: { stringValue: "scheduled" },
            score_a: { integerValue: "0" },
            score_b: { integerValue: "0" },
            teamA: { stringValue: "ABRAHAM ROSELL CLAVERAS / ALVARO FERNANDEZ SERRANO" },
            teamB: { stringValue: "AGATA DEL REAL PEÑA / CARLES GARCIA CASTELLANOS" },
            team_a: { stringValue: "ABRAHAM ROSELL CLAVERAS / ALVARO FERNANDEZ SERRANO" },
            team_b: { stringValue: "AGATA DEL REAL PEÑA / CARLES GARCIA CASTELLANOS" },
            team_a_ids: { arrayValue: { values: [{ stringValue: "u_656989230" }, { stringValue: "u_640677832" }] } },
            team_b_ids: { arrayValue: { values: [{ stringValue: "u_609405289" }, { stringValue: "u_660103947" }] } },
            team_a_names: { arrayValue: { values: [{ stringValue: "ABRAHAM ROSELL CLAVERAS" }, { stringValue: "ALVARO FERNANDEZ SERRANO" }] } },
            team_b_names: { arrayValue: { values: [{ stringValue: "AGATA DEL REAL PEÑA" }, { stringValue: "CARLES GARCIA CASTELLANOS" }] } }
        }
    };

    const updateP1Url = `${baseUrl}/entrenos_matches/${docP1}`;
    const resP1 = await fetch(updateP1Url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p1Payload)
    });
    console.log("Update P1 status:", resP1.status);

    // 3. Actualizar P2 con los perdedores de P1 (Luis y Juan José separados) y perdedores de P2 (Arnau y Yolanda separados)
    const p2Payload = {
        fields: {
            americana_id: { stringValue: eventId },
            round: { integerValue: "2" },
            court: { integerValue: "2" },
            status: { stringValue: "scheduled" },
            score_a: { integerValue: "0" },
            score_b: { integerValue: "0" },
            teamA: { stringValue: "LUIS PINO VAZQUEZ / ARNAU SANTAMARIA PIÑOL" },
            teamB: { stringValue: "JUAN JOSÉ JIMÉNEZ / YOLANDA SANZ GONZALEZ" },
            team_a: { stringValue: "LUIS PINO VAZQUEZ / ARNAU SANTAMARIA PIÑOL" },
            team_b: { stringValue: "JUAN JOSÉ JIMÉNEZ / YOLANDA SANZ GONZALEZ" },
            team_a_ids: { arrayValue: { values: [{ stringValue: "u_664020122" }, { stringValue: "u_699572103" }] } },
            team_b_ids: { arrayValue: { values: [{ stringValue: "u_608209007" }, { stringValue: "u_699217479" }] } },
            team_a_names: { arrayValue: { values: [{ stringValue: "LUIS PINO VAZQUEZ" }, { stringValue: "ARNAU SANTAMARIA PIÑOL" }] } },
            team_b_names: { arrayValue: { values: [{ stringValue: "JUAN JOSÉ JIMÉNEZ" }, { stringValue: "YOLANDA SANZ GONZALEZ" }] } }
        }
    };

    const updateP2Url = `${baseUrl}/entrenos_matches/${docP2}`;
    const resP2 = await fetch(updateP2Url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p2Payload)
    });
    console.log("Update P2 status:", resP2.status);

    // 4. Actualizar las pistas en el array de jugadores del entreno
    const eventUrl = `${baseUrl}/entrenos/${eventId}`;
    const eventRes = await fetch(eventUrl);
    const eventDoc = await eventRes.json();
    const currentPlayers = eventDoc.fields.players.arrayValue.values;

    const updatedPlayers = currentPlayers.map(pv => {
        const pFields = pv.mapValue.fields;
        const uid = pFields.uid?.stringValue || pFields.id?.stringValue;
        let court = 2;
        // Ganadores van a pista 1
        if (['u_656989230', 'u_609405289', 'u_640677832', 'u_660103947'].includes(uid)) {
            court = 1;
        }
        return {
            mapValue: {
                fields: {
                    ...pFields,
                    current_court: { integerValue: String(court) }
                }
            }
        };
    });

    const patchEventUrl = `${baseUrl}/entrenos/${eventId}?updateMask.fieldPaths=players`;
    const resEvent = await fetch(patchEventUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fields: {
                players: { arrayValue: { values: updatedPlayers } }
            }
        })
    });
    console.log("Update Event players status:", resEvent.status);

    console.log("✅ Evento 'prueba MIXTO 03/10/2026' actualizado en Firestore al 100%!");
}

fixRealEvent();
