window = {};
require('../js/modules/dashboard/NewsCatalog.js');
const posts = [
  { id: "modos-juego-twister-individual-guia", title: "Guía Táctica Twister: Cómo Adaptarte al Instante a una Nueva Pareja", category: "💡 CONSEJOS", imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55" },
  { id: "salud-lesiones", title: "Prevención de lesiones de codo en pádel", category: "💪 SALUD" },
  { id: "nutricion-post", title: "Nutrición deportiva para torneos", category: "🍎 NUTRICIÓN" },
  { id: "torneo-post", title: "Gran Torneo de Pádel", category: "🏆 TORNEOS" }
];
const assigned = window.NewsCatalog.assignUniquePhotos(posts);
console.log("Assigned photos:", JSON.stringify(assigned, null, 2));

if (assigned["modos-juego-twister-individual-guia"] !== "img/blog_padel_twister_team.jpg") {
  console.error("FAIL: Twister post did not get padel team photo!");
  process.exit(1);
}
if (!assigned["salud-lesiones"].includes("health")) {
  console.error("FAIL: Salud post did not get health photo!");
  process.exit(1);
}
if (!assigned["nutricion-post"].includes("nutrition")) {
  console.error("FAIL: Nutricion post did not get nutrition photo!");
  process.exit(1);
}
if (!assigned["torneo-post"].includes("trophy") && !assigned["torneo-post"].includes("event")) {
  console.error("FAIL: Torneo post did not get trophy photo!");
  process.exit(1);
}
console.log("SUCCESS: All photo assignments verified 100%!");
