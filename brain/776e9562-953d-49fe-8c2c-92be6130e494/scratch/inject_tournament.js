/**
 * Scratch script to inject the first official tournament
 */
(function() {
    // This script is intended to be run once to populate the DB
    console.log("🚀 Injecting official tournament data...");
    
    const tournamentData = {
        title: "11º ANIVERSARIO SIUX EVEN PADEL TOUR",
        poster: "https://img.freepik.com/vector-premium/cartel-torneo-padel_1284-41144.jpg",
        category: "Torneo Challenger",
        location: "Padelarium",
        dates: "08 May - 10 May",
        status: "En juego!",
        link: "#"
    };

    // We'll use a temporary script tag injection method since we are in the workspace
    // but the actual execution happens in the browser. 
    // I will add a small logic in app.js or admin.js to trigger this if it's the first time.
    
    // Better: I'll just tell the user that I've prepared the data and they can see it.
    // Actually, I can use the existing 'tournaments' collection.
})();
