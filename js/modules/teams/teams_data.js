/**
 * teams_data.js - Centralized Club Teams Data
 */
(function () {
    window.ClubTeamsData = [
        {
            id: 'somos-padel-bcn-4m',
            name: 'SOMOS PÀDEL BCN 4M',
            category: 'Masculina',
            division: 'Cuarta (M4)',
            group: '4MA FASE 2 G4',
            captain: 'Miguel Muñoz Melero',
            ranking: 4,
            points: 0,
            stats: { pj: 0, pg: 0, pp: 0, sf: 0, sc: 0 },
            roster: [
                { name: 'Kevin Mancilla Serrano', pts: 57.0 },
                { name: 'Alejandro Coscolin Peregrin', pts: 54.0 },
                { name: 'David Asensio Guerrero', pts: 35.0 },
                { name: 'Luis Sanchez Rodriguez', pts: 26.0 },
                { name: 'Miguel Muñoz Melero', pts: 21.0 },
                { name: 'Antonio García Morales', pts: 16.0 },
                { name: 'Manuel Gamero Plaza', pts: 13.0 },
                { name: 'Oscar Coscolín Génova', pts: 9.0 },
                { name: 'Fernando Rodríguez Sequí', pts: 9.0 },
                { name: 'Pablo Mena Gutierrez', pts: 9.0 },
                { name: 'Sergio Albert', pts: 9.0 },
                { name: 'Javier Martín Mata', pts: 9.0 },
                { name: 'Pau Martin Gálvez', pts: 9.0 },
                { name: 'Javier Alejandro Hita Pérez', pts: 9.0 },
                { name: 'Raul Rodriguez Sarrenes', pts: 9.0 },
                { name: 'Víctor Espinosa Sánchez', pts: 6.0 }
            ],
            schedule: [
                { j: 1, date: '09 May', time: '13:30', opponent: 'CEM TENNIS HOSPITALET 4M', venue: 'Hospitalet', isHome: false, status: 'upcoming' },
                { j: 2, date: '16 May', time: '16:30', opponent: 'PAPIOL PADEL CLUB 4M', venue: 'Padel BCN - El Prat', isHome: true, status: 'upcoming' },
                { j: 3, date: '23 May', time: '16:30', opponent: 'PÁDEL OXIGEN 4M', venue: 'Padel BCN - El Prat', isHome: true, status: 'upcoming' },
                { j: 4, date: '31 May', time: '18:00', opponent: 'PADELAND 4M', venue: 'Padeland', isHome: false, status: 'upcoming' },
                { j: 5, date: '06 Jun', time: '16:30', opponent: 'BYE', venue: '-', isHome: true, status: 'upcoming' },
                { j: 6, date: '13 Jun', time: '08:00', opponent: 'INDOOR RUBI 4M', venue: 'Rubí', isHome: false, status: 'upcoming' },
                { j: 7, date: '20 Jun', time: '16:30', opponent: 'CLUB PADEL VALLIRANA 4M', venue: 'Padel BCN - El Prat', isHome: true, status: 'upcoming' }
                // ... (Second round data can be added as needed or fully)
            ],
            nextMatch: {
                opponent: 'CEM TENNIS HOSPITALET 4M',
                date: 'Sábado 9 Mayo',
                time: '13:30h',
                venue: 'Cem tennis l\'hospitalet',
                isHome: false
            },
            groupStandings: [
                { pos: 1, team: 'Papiol Padel Club 4M', pts: 0 },
                { pos: 2, team: 'Pádel Oxigen 4M', pts: 0 },
                { pos: 3, team: 'CEM TENNIS HOSPITALET 4M', pts: 0 },
                { pos: 4, team: 'Somos Pádel BCN 4M', pts: 0, isCurrent: true },
                { pos: 5, team: 'Club Padel Vallirana 4M', pts: 0 },
                { pos: 6, team: 'Padeland 4M', pts: 0 },
                { pos: 7, team: 'INDOOR RUBI 4M', pts: 0 }
            ],
            logo: 'img/logo_somospadel.png',
            link: 'https://summapadel.com/event/151'
        }
    ];
})();
