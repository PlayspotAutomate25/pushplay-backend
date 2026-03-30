require('dotenv').config({ path: 'c:/Antigravity projects/pushplay/backend/.env' });
const tmdbService = require('./src/services/tmdbService');

async function testTMDB() {
  try {
    console.log("Searching for 'The Matrix'...");
    const results = await tmdbService.search("The Matrix", "movie");
    console.log("Found:", results.length, "results");
    if (results.length > 0) {
      console.log("First Result Sample:", results[0]);
    }
  } catch (error) {
    console.error("Test Error:", error.message);
  }
}

testTMDB();
