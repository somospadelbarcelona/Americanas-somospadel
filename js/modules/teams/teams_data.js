/**
 * teams_data.js - Centralized Club Teams Data
 * Reconstrucción Maestra (Full Standings + Schedules) - 10/05/2026
 */
(function () {
    window.ClubTeamsData = [
        {
            id: 'somos-padel-bcn-4m',
            name: 'SOMOS PÁDEL BCN 4M',
            category: 'Masculina',
            division: 'Cuarta (M4)',
            group: '4MA FASE 2 G4',
            captain: 'Miguel Muñoz Melero',
            ranking: 6,
            points: 0,
            stats: { pj: 1, pg: 0, pp: 1, sf: 0, sc: 3 },
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
                { j: 1, date: '09 May', time: '13:30', opponent: 'CEM TENNIS HOSPITALET 4M', venue: 'Hospitalet', isHome: false, score: '0 - 3', status: 'completed' },
                { j: 2, date: '16 May', time: '16:30', opponent: 'PAPIOL PADEL CLUB 4M', venue: 'Padel BCN - El Prat', isHome: true, score: 'Pendiente', status: 'upcoming' },
                { j: 3, date: '23 May', time: '16:30', opponent: 'PÁDEL OXIGEN 4M', venue: 'Padel BCN - El Prat', isHome: true, score: 'Pendiente', status: 'upcoming' },
                { j: 4, date: '31 May', time: '18:00', opponent: 'PADELAND 4M', venue: 'Padeland', isHome: false, score: 'Pendiente', status: 'upcoming' },
                { j: 5, date: '06 Jun', time: '16:30', opponent: 'BYE', venue: '-', isHome: true, score: '-', status: 'upcoming' },
                { j: 6, date: '13 Jun', time: '08:00', opponent: 'INDOOR RUBI 4M', venue: 'Rubí', isHome: false, score: 'Pendiente', status: 'upcoming' },
                { j: 7, date: '20 Jun', time: '16:30', opponent: 'CLUB PADEL VALLIRANA 4M', venue: 'Padel BCN - El Prat', isHome: true, score: 'Pendiente', status: 'upcoming' }
            ],
            groupStandings: [
                { pos: 1, team: 'CEM TENNIS HOSPITALET 4M', pj: 1, pg: 1, pp: 0, sf: 3, sc: 0, df: 3, pts: 3 },
                { pos: 2, team: 'CLUB PADEL VALLIRANA 4M', pj: 1, pg: 1, pp: 0, sf: 2, sc: 1, df: 1, pts: 3 },
                { pos: 3, team: 'PAPIOL PADEL CLUB 4M', pj: 0, pg: 0, pp: 0, sf: 0, sc: 0, df: 0, pts: 0 },
                { pos: 4, team: 'PÁDEL OXIGEN 4M', pj: 0, pg: 0, pp: 0, sf: 0, sc: 0, df: 0, pts: 0 },
                { pos: 5, team: 'PADELAND 4M', pj: 1, pg: 0, pp: 1, sf: 1, sc: 2, df: -1, pts: 0 },
                { pos: 6, team: 'SOMOS PÁDEL BCN 4M', pj: 1, pg: 0, pp: 1, sf: 0, sc: 3, df: -3, pts: 0, isCurrent: true }
            ],
            logo: 'img/logo_somospadel.png',
            link: 'https://summapadel.com/event/151'
        },
        {
            id: 'somos-padel-bcn-3m-b',
            name: 'SOMOS PÁDEL BCN 3M B',
            category: 'Masculina',
            division: 'Tercera (3M B)',
            group: '3MA FASE 2 G5',
            captain: 'Alex Cuadra Cabezas',
            ranking: 8,
            points: 0,
            stats: { pj: 1, pg: 0, pp: 1, sf: 0, sc: 3 },
            roster: [
                { name: 'Nil Espinosa Cañas', pts: 65.0 },
                { name: 'Pol Berenguer Pagán', pts: 58.0 },
                { name: 'Xavier Mondragon Artiga', pts: 47.0 },
                { name: 'Carlos Canosa', pts: 44.0 },
                { name: 'Toni Millan Deu', pts: 44.0 },
                { name: 'Ernesto Rodera', pts: 42.0 },
                { name: 'Dani Ramoneda', pts: 38.0 },
                { name: 'Albert Garcia Edo', pts: 35.5 },
                { name: 'Vladimir Starciuc', pts: 32.0 },
                { name: 'Victor Espinosa Sanchez', pts: 30.0 },
                { name: 'Toni García Morales', pts: 28.5 },
                { name: 'Sergi Díez', pts: 25.0 },
                { name: 'José María Pellejero Recio', pts: 22.0 },
                { name: 'David Navea Vida', pts: 18.5 },
                { name: 'Alberto Muñoz Algora', pts: 15.0 },
                { name: 'Juan José Jiménez', pts: 12.0 }
            ],
            schedule: [
                { j: 1, date: '09 May', time: '12:00', opponent: 'PÁDEL OXIGEN 3M', venue: 'Crazyxpadel', isHome: false, score: '0 - 3', status: 'completed' },
                { j: 2, date: '16 May', time: '16:30', opponent: 'Club Tennis Vilanova 3M', venue: 'Padel BCN - El Prat', isHome: true, score: 'Pendiente', status: 'upcoming' },
                { j: 3, date: '25 May', time: 'TBD', opponent: 'Cpt R El Centre - Castellar', venue: 'Castellar', isHome: false, score: 'Pendiente', status: 'upcoming' },
                { j: 4, date: '30 May', time: '16:30', opponent: 'Horizon Padel 3M', venue: 'Padel BCN - El Prat', isHome: true, score: 'Pendiente', status: 'upcoming' },
                { j: 5, date: '06 Jun', time: 'TBD', opponent: 'La Paleda Indoor Padel A', venue: 'La Paleda', isHome: false, score: 'Pendiente', status: 'upcoming' },
                { j: 6, date: '13 Jun', time: '16:30', opponent: 'VILA PADEL INDOOR A', venue: 'Padel BCN - El Prat', isHome: true, score: 'Pendiente', status: 'upcoming' },
                { j: 7, date: '20 Jun', time: 'TBD', opponent: 'LAS PISTAS', venue: 'Las Pistas', isHome: false, score: 'Pendiente', status: 'upcoming' }
            ],
            groupStandings: [
                { pos: 1, team: 'PÁDEL OXIGEN 3M', pj: 1, pg: 1, pp: 0, sf: 3, sc: 0, df: 3, pts: 3 },
                { pos: 2, team: 'CPI B EL CASINO GASTROBAR', pj: 1, pg: 1, pp: 0, sf: 2, sc: 1, df: 1, pts: 3 },
                { pos: 3, team: 'LA PALETA INDOOR PÁDEL A', pj: 1, pg: 1, pp: 0, sf: 2, sc: 1, df: 1, pts: 3 },
                { pos: 4, team: 'VILA PADEL INDOOR A', pj: 1, pg: 0, pp: 1, sf: 1, sc: 2, df: -1, pts: 0 },
                { pos: 5, team: 'HORIZON PADEL 3M', pj: 1, pg: 0, pp: 1, sf: 1, sc: 2, df: -1, pts: 0 },
                { pos: 6, team: 'Club Tennis Vilanova 3M', pj: 0, pg: 0, pp: 0, sf: 0, sc: 0, df: 0, pts: 0 },
                { pos: 7, team: 'LAS PISTAS', pj: 0, pg: 0, pp: 0, sf: 0, sc: 0, df: 0, pts: 0 },
                { pos: 8, team: 'SOMOS PÁDEL BCN 3MB', pj: 1, pg: 0, pp: 1, sf: 0, sc: 3, df: -3, pts: 0, isCurrent: true }
            ],
            logo: 'img/logo_somospadel.png',
            link: 'https://summapadel.com/event/151'
        },
        {
            id: 'somos-padel-bcn-3ma',
            name: 'SOMOS PÁDEL BCN 3MA',
            category: 'Masculina',
            division: 'Tercera (3M A)',
            group: '3MB FASE 2 G3',
            captain: 'Abraham Rosell',
            ranking: 2,
            points: 3,
            stats: { pj: 1, pg: 1, pp: 0, sf: 2, sc: 1 },
            roster: [
                { name: 'Xavier Gimenez', pts: 40.0 },
                { name: 'Ivan Torres', pts: 35.0 },
                { name: 'Carlos David Asmadt Calderon', pts: 34.0 },
                { name: 'Joel Sanchez Portillo', pts: 32.5 },
                { name: 'Pablo Kellermann', pts: 31.0 },
                { name: 'Adrian Muñoz Perez', pts: 29.0 },
                { name: 'Arnau Santamaria Piñol', pts: 28.5 },
                { name: 'Alvaro Fernandez Serrano', pts: 25.0 },
                { name: 'Carlos López Mestre', pts: 22.0 },
                { name: 'David Coca Piné', pts: 20.0 },
                { name: 'David Pastor', pts: 18.0 },
                { name: 'Román Guzman', pts: 15.5 },
                { name: 'Luis Pino Vazquez', pts: 12.0 },
                { name: 'Aitor Davalillo Manteca', pts: 10.0 }
            ],
            schedule: [
                { j: 1, date: '08 May', time: '19:00', opponent: 'CRAZYXPADEL 3M GRIS', venue: 'Padel BCN - El Prat', isHome: true, score: '2 - 1', status: 'completed' },
                { j: 2, date: '15 May', time: '20:00', opponent: 'CT ANDRÉS GIMENO 3M', venue: 'Andrés Gimeno', isHome: false, score: 'Pendiente', status: 'upcoming' },
                { j: 3, date: '22 May', time: '19:00', opponent: 'PADEL INDOOR HOSPITALET 3M', venue: 'Padel BCN - El Prat', isHome: true, score: 'Pendiente', status: 'upcoming' },
                { j: 4, date: '29 May', time: '18:00', opponent: 'CLUB EGARA 3M', venue: 'Club Egara', isHome: false, score: 'Pendiente', status: 'upcoming' },
                { j: 5, date: '05 Jun', time: '19:00', opponent: 'TENNIS DESPI 3M', venue: 'Padel BCN - El Prat', isHome: true, score: 'Pendiente', status: 'upcoming' },
                { j: 6, date: '12 Jun', time: '20:30', opponent: 'PADEL BARCELONA EL PRAT 3M', venue: 'El Prat', isHome: false, score: 'Pendiente', status: 'upcoming' },
                { j: 7, date: '19 Jun', time: '19:00', opponent: 'AURIAL PADEL CORNELLA 3M', venue: 'Padel BCN - El Prat', isHome: true, score: 'Pendiente', status: 'upcoming' }
            ],
            groupStandings: [
                { pos: 1, team: 'CT ANDRÉS GIMENO 3M', pj: 1, pg: 1, pp: 0, sf: 3, sc: 0, df: 3, pts: 3 },
                { pos: 2, team: 'SOMOS PÁDEL BCN 3MA', pj: 1, pg: 1, pp: 0, sf: 2, sc: 1, df: 1, pts: 3, isCurrent: true },
                { pos: 3, team: 'DAVID LLOYD 3 M', pj: 0, pg: 0, pp: 0, sf: 0, sc: 0, df: 0, pts: 0 },
                { pos: 4, team: 'PÁDEL PEÑA MALAGA 3G', pj: 0, pg: 0, pp: 0, sf: 0, sc: 0, df: 0, pts: 0 },
                { pos: 5, team: 'CRAZYXPADEL 3M GRIS', pj: 1, pg: 0, pp: 1, sf: 1, sc: 2, df: -1, pts: 0 },
                { pos: 6, team: 'CLUB TENNIS I PADEL SEGUR 3M', pj: 1, pg: 0, pp: 1, sf: 0, sc: 3, df: -3, pts: 0 }
            ],
            logo: 'img/logo_somospadel.png',
            link: 'https://summapadel.com/event/151'
        },
        {
            id: 'somos-padel-bcn-4xa',
            name: 'SOMOS PÁDEL BCN 4XA',
            category: 'Mixta',
            division: 'Cuarta (4X)',
            group: '4XB FASE 2 G1',
            captain: 'Capitán por definir',
            ranking: 3,
            points: 3,
            stats: { pj: 2, pg: 1, pp: 1, sf: 2, sc: 4 },
            roster: [
                { name: 'Alejandro Coscolin Peregrin', pts: 54.0 },
                { name: 'Kevin Mancilla Serrano', pts: 48.0 },
                { name: 'Laura Martínez Ruiz', pts: 42.0 },
                { name: 'Marta Gómez Sánchez', pts: 36.0 },
                { name: 'David Asensio Guerrero', pts: 35.0 },
                { name: 'Cristina Soler Martín', pts: 28.0 },
                { name: 'Patricia Losa Cubero', pts: 24.0 }
            ],
            schedule: [
                { j: 1, date: '10 May', time: '12:00', opponent: 'SOMOS PÁDEL BCN 4XB', venue: 'Padel BCN - El Prat', isHome: true, score: '2 - 1', status: 'completed' },
                { j: 2, date: '17 May', time: '17:00', opponent: 'CLUB TENNIS VILANOVA 4X', venue: 'Vilanova', isHome: false, score: '0 - 3', status: 'completed' },
                { j: 3, date: '24 May', time: '16:30', opponent: 'PÁDEL OXIGEN 4X', venue: 'Padel BCN - El Prat', isHome: true, score: 'Pendiente', status: 'upcoming' },
                { j: 4, date: '31 May', time: '18:00', opponent: 'CEM TENNIS HOSPITALET 4X', venue: 'Hospitalet', isHome: false, score: 'Pendiente', status: 'upcoming' },
                { j: 5, date: '07 Jun', time: '16:30', opponent: 'PAPIOL PADEL CLUB 4X', venue: 'Padel BCN - El Prat', isHome: true, score: 'Pendiente', status: 'upcoming' },
                { j: 6, date: '14 Jun', time: '12:00', opponent: 'BYE', venue: '-', isHome: false, score: '-', status: 'upcoming' },
                { j: 7, date: '21 Jun', time: '16:30', opponent: 'CLUB PADEL VALLIRANA 4X', venue: 'Padel BCN - El Prat', isHome: true, score: 'Pendiente', status: 'upcoming' }
            ],
            groupStandings: [
                { pos: 1, team: 'CLUB TENNIS VILANOVA 4X', pj: 2, pg: 2, pp: 0, df: 4, pts: 6 },
                { pos: 2, team: 'PÁDEL OXIGEN 4X', pj: 2, pg: 1, pp: 1, df: 2, pts: 3 },
                { pos: 3, team: 'SOMOS PÁDEL BCN 4XA', pj: 2, pg: 1, pp: 1, df: -2, pts: 3, isCurrent: true },
                { pos: 4, team: 'SOMOS PÁDEL BCN 4XB', pj: 2, pg: 1, pp: 1, df: -1, pts: 3 },
                { pos: 5, team: 'CEM TENNIS HOSPITALET 4X', pj: 1, pg: 1, pp: 0, df: 1, pts: 3 },
                { pos: 6, team: 'PAPIOL PADEL CLUB 4X', pj: 1, pg: 0, pp: 1, df: -2, pts: 0 },
                { pos: 7, team: 'CLUB PADEL VALLIRANA 4X', pj: 2, pg: 0, pp: 2, df: -4, pts: 0 }
            ],
            logo: 'img/logo_somospadel.png',
            link: 'https://summapadel.com/event/151'
        },
        {
            id: 'somos-padel-bcn-4xb',
            name: 'SOMOS PÁDEL BCN 4XB',
            category: 'Mixta',
            division: 'Cuarta (4X)',
            group: '4XB FASE 2 G1',
            captain: 'Capitán por definir',
            ranking: 4,
            points: 3,
            stats: { pj: 2, pg: 1, pp: 1, sf: 3, sc: 3 },
            roster: [
                { name: 'Miquel Muñoz Melero', pts: 46.0 },
                { name: 'Alex Cuadra Cabezas', pts: 44.0 },
                { name: 'Sandra Vilas Flores', pts: 38.0 },
                { name: 'Carla Domènech Solé', pts: 34.0 },
                { name: 'Oscar Coscolín Génova', pts: 22.0 },
                { name: 'Silvia Valls Vidal', pts: 20.0 },
                { name: 'Nuria Estévez Ruiz', pts: 18.0 }
            ],
            schedule: [
                { j: 1, date: '10 May', time: '12:00', opponent: 'SOMOS PÁDEL BCN 4XA', venue: 'Padel BCN - El Prat', isHome: false, score: '1 - 2', status: 'completed' },
                { j: 2, date: '17 May', time: '16:30', opponent: 'PAPIOL PADEL CLUB 4X', venue: 'Padel BCN - El Prat', isHome: true, score: '2 - 1', status: 'completed' },
                { j: 3, date: '24 May', time: '18:00', opponent: 'CLUB PADEL VALLIRANA 4X', venue: 'Vallirana', isHome: false, score: 'Pendiente', status: 'upcoming' },
                { j: 4, date: '31 May', time: '16:30', opponent: 'PÁDEL OXIGEN 4X', venue: 'Padel BCN - El Prat', isHome: true, score: 'Pendiente', status: 'upcoming' },
                { j: 5, date: '07 Jun', time: '13:30', opponent: 'CLUB TENNIS VILANOVA 4X', venue: 'Vilanova', isHome: false, score: 'Pendiente', status: 'upcoming' },
                { j: 6, date: '14 Jun', time: '16:30', opponent: 'CEM TENNIS HOSPITALET 4X', venue: 'Padel BCN - El Prat', isHome: true, score: 'Pendiente', status: 'upcoming' },
                { j: 7, date: '21 Jun', time: '12:00', opponent: 'BYE', venue: '-', isHome: false, score: '-', status: 'upcoming' }
            ],
            groupStandings: [
                { pos: 1, team: 'CLUB TENNIS VILANOVA 4X', pj: 2, pg: 2, pp: 0, df: 4, pts: 6 },
                { pos: 2, team: 'PÁDEL OXIGEN 4X', pj: 2, pg: 1, pp: 1, df: 2, pts: 3 },
                { pos: 3, team: 'SOMOS PÁDEL BCN 4XA', pj: 2, pg: 1, pp: 1, df: -2, pts: 3 },
                { pos: 4, team: 'SOMOS PÁDEL BCN 4XB', pj: 2, pg: 1, pp: 1, df: -1, pts: 3, isCurrent: true },
                { pos: 5, team: 'CEM TENNIS HOSPITALET 4X', pj: 1, pg: 1, pp: 0, df: 1, pts: 3 },
                { pos: 6, team: 'PAPIOL PADEL CLUB 4X', pj: 1, pg: 0, pp: 1, df: -2, pts: 0 },
                { pos: 7, team: 'CLUB PADEL VALLIRANA 4X', pj: 2, pg: 0, pp: 2, df: -4, pts: 0 }
            ],
            logo: 'img/logo_somospadel.png',
            link: 'https://summapadel.com/event/151'
        },
        {
            id: 'somos-padel-bcn-3xa',
            name: 'SOMOS PÁDEL BCN 3XA',
            category: 'Mixta',
            division: 'Tercera (3X)',
            group: '3XB FASE 2 G3',
            captain: 'Capitán por definir',
            ranking: 0,
            points: 0,
            stats: { pj: 0, pg: 0, pp: 0, sf: 0, sc: 0 },
            roster: [],
            schedule: [],
            groupStandings: [],
            logo: 'img/logo_somospadel.png',
            link: 'https://summapadel.com/event/151'
        },
        {
            id: 'somos-padel-bcn-4fa',
            name: 'SOMOS PÁDEL BCN 4FA',
            category: 'Femenina',
            division: 'Cuarta (4F)',
            group: '4FB FASE 2 G3',
            captain: 'Gemma Saavedra',
            subcaptain: 'Nadia Flora Costa',
            ranking: 1,
            points: 6,
            stats: { pj: 2, pg: 2, pp: 0, sf: 4, sc: 2 },
            roster: [
                { name: 'Lola Caro Burguillos', pts: 66.0 },
                { name: 'Cristina Matamala', pts: 60.0 },
                { name: 'Nadia Flora Costa', pts: 51.0 },
                { name: 'Saray Muñoz Carod', pts: 48.0 },
                { name: 'Marta Bassons Turú', pts: 48.0 },
                { name: 'Berta Cañas Porte', pts: 33.0 },
                { name: 'Mayte Vega Santos', pts: 33.0 }
            ],
            schedule: [
                { j: 1, date: '10 May', time: '10:00', opponent: 'ACCURA SANT BOI 4F', venue: 'Accura sant boi', isHome: false, score: '2 - 1', status: 'completed' },
                { j: 2, date: '16 May', time: '09:00', opponent: 'PCP FEMENÍ 4', venue: 'Padel bcn - el prat', isHome: true, score: '2 - 1', status: 'completed' },
                { j: 3, date: '23 May', time: '11:40', opponent: 'VALKIRIAS CPV', venue: 'Club padel vilanova', isHome: false, score: 'Pendiente', status: 'upcoming' },
                { j: 4, date: '30 May', time: '13:30', opponent: 'CEM TENNIS HOSPITALET 4F', venue: 'Padel bcn - el prat', isHome: true, score: 'Pendiente', status: 'upcoming' },
                { j: 5, date: '06 Jun', time: '13:30', opponent: 'PADEL CLUB SAN JUST 4F', venue: 'Padel bcn - el prat', isHome: true, score: 'Pendiente', status: 'upcoming' },
                { j: 6, date: '14 Jun', time: '10:00', opponent: 'INDOOR RUBI 4F', venue: 'Rubí', isHome: false, score: 'Pendiente', status: 'upcoming' },
                { j: 7, date: '21 Jun', time: '13:30', opponent: 'BYE', venue: '-', isHome: true, score: '-', status: 'upcoming' }
            ],
            groupStandings: [
                { pos: 1, team: 'SOMOS PÁDEL BCN 4FA', pj: 2, pg: 2, pp: 0, df: 2, pts: 6, isCurrent: true },
                { pos: 2, team: 'VALKIRIAS CPV', pj: 2, pg: 1, pp: 1, df: 0, pts: 3 },
                { pos: 3, team: 'ACCURA SANT BOI 4F', pj: 2, pg: 1, pp: 1, df: 0, pts: 3 },
                { pos: 4, team: 'CEM TENNIS HOSPITALET 4F', pj: 2, pg: 1, pp: 1, df: 0, pts: 3 },
                { pos: 5, team: 'PADEL CLUB SAN JUST 4F', pj: 2, pg: 1, pp: 1, df: 0, pts: 3 },
                { pos: 6, team: 'PCP FEMENÍ 4', pj: 2, pg: 0, pp: 2, df: -2, pts: 0 }
            ],
            logo: 'img/logo_somospadel.png',
            link: 'https://summapadel.com/event/151'
        }
    ];
})();
