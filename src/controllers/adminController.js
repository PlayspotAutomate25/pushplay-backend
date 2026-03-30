const tmdbService = require("../services/tmdbService");
const { db, admin } = require("../config/firebase");

/**
 * Controller for Administrative actions.
 * Manages Content Catalog and TMDB Search.
 */
class AdminController {
  
  /**
   * Search TMDB for content.
   */
  async searchTMDB(req, res) {
    const { query, type } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }
    
    try {
      const results = await tmdbService.search(query, type || "movie");
      res.json(results);
    } catch (error) {
      console.error("TMDB Search Error:", error.message);
      res.status(500).json({ error: "Failed to fetch data from TMDB" });
    }
  }

  /**
   * Save content to the Firestore 'catalog' collection.
   */
  async saveToCatalog(req, res) {
    const { 
      title, year, genre, description, 
      poster_url, magnet_url, tier, type, rating 
    } = req.body;

    if (!title || !magnet_url) {
      return res.status(400).json({ error: "Title and Magnet URL are required" });
    }

    try {
      const added_at = new Date().toISOString();
      const docRef = await db.collection("catalog").add({
        title, year, genre, description, 
        poster_url, magnet_url, tier, type, 
        rating, added_at
      });
      
      res.json({ success: true, id: docRef.id, message: "Content saved to catalog" });

      // Trigger Push Notification via FCM
      try {
        const message = {
          topic: "all_users",
          notification: {
            title: `New ${type === 'movie' ? 'Movie' : 'Show'} Added!`,
            body: `Watch "${title}" now on Pushplay.`,
          },
          data: {
            contentId: docRef.id,
            click_action: "FLUTTER_NOTIFICATION_CLICK" // Standard for many framework listeners
          }
        };

        await admin.messaging().send(message);
        console.log("FCM Notification sent for:", title);
      } catch (fcmError) {
        console.error("FCM Send Error (Non-fatal):", fcmError.message);
      }
    } catch (error) {
      console.error("Save Catalog Error:", error.message);
      res.status(500).json({ error: "Failed to save content to database" });
    }
  }

  /**
   * Get all entries from the catalog.
   */
  async getCatalog(req, res) {
    try {
      const snapshot = await db.collection("catalog")
        .orderBy("added_at", "desc")
        .get();
      
      const catalog = [];
      snapshot.forEach(doc => {
        catalog.push({ id: doc.id, ...doc.data() });
      });
      
      res.json(catalog);
    } catch (error) {
      console.error("Get Catalog Error:", error.message);
      res.status(500).json({ error: "Failed to retrieve catalog entries" });
    }
  }

  /**
   * Delete an entry from the catalog.
   */
  async deleteFromCatalog(req, res) {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    try {
      await db.collection("catalog").doc(id).delete();
      res.json({ success: true, message: "Entry deleted from catalog" });
    } catch (error) {
      console.error("Delete Catalog Error:", error.message);
      res.status(500).json({ error: "Failed to delete entry" });
    }
  }

  /**
   * Simple Password Verification for Admin Panel access.
   */
  async verifyLogin(req, res) {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
      // In a real app, you'd set a session or JWT. 
      // For this module, we'll keep it simple as requested.
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid Admin password" });
    }
  }
}

module.exports = new AdminController();
