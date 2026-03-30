const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const path = require("path");

/**
 * Routes for Admin Dashboard and Catalog APIs.
 * The UI is served from the root of /admin.
 */

// API: Verify Admin Password
router.post("/login", adminController.verifyLogin.bind(adminController));

// API: Search TMDB (Movies or TV Shows)
router.get("/tmdb/search", adminController.searchTMDB.bind(adminController));

// API: Save content to catalog
router.post("/catalog", adminController.saveToCatalog.bind(adminController));

// API: Get all items from catalog
router.get("/catalog", adminController.getCatalog.bind(adminController));

// API: Delete catalog entry
router.delete("/catalog/:id", adminController.deleteFromCatalog.bind(adminController));

// UI: Serve the Admin Dashboard HTML
// This should be served by server.js as a static file, 
// but we add a specific route to redirect/serve /admin index.
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/admin/index.html"));
});

module.exports = router;
