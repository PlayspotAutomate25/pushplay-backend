const { db, admin } = require("../config/firebase");

/**
 * Service to handle Firestore common operations.
 */
class FirestoreService {
  /**
   * Retrieves the favorites array for a given user UID.
   */
  async getFavorites(uid) {
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) return [];
    return userDoc.data().favorites || [];
  }

  /**
   * Toggles a favorite item (adds if not present, removes if it is).
   */
  async toggleFavorite(uid, contentId) {
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) throw new Error("User document found in Firestore.");

    const favorites = userDoc.data().favorites || [];
    const isFavorited = favorites.includes(contentId);

    if (isFavorited) {
      await db.collection("users").doc(uid).update({
        favorites: admin.firestore.FieldValue.arrayRemove(contentId)
      });
      return { favorited: false, message: "Removed from favorites." };
    } else {
      await db.collection("users").doc(uid).update({
        favorites: admin.firestore.FieldValue.arrayUnion(contentId)
      });
      return { favorited: true, message: "Added to favorites." };
    }
  }

  /**
   * Clears the active_ips array for a given user UID.
   */
  async resetActiveIps(uid) {
    await db.collection("users").doc(uid).update({
      active_ips: [] // Clear the list to allow new devices
    });
    return { success: true, message: "All active devices/locations reset." };
  }

  /**
   * Retrieves playback position for a specific content.
   */
  async getPlaybackStatus(uid, contentId) {
    const doc = await db.collection("users").doc(uid)
      .collection("playback_status").doc(contentId).get();
    if (!doc.exists) return { position: 0 };
    return doc.data();
  }

  /**
   * Saves playback position for a specific content.
   */
  async savePlaybackStatus(uid, contentId, position) {
    await db.collection("users").doc(uid)
      .collection("playback_status").doc(contentId).set({
        position: position,
        last_updated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    return { success: true };
  }

  /**
   * Saves the FCM token for a user.
   */
  async saveFcmToken(uid, token) {
    await db.collection("users").doc(uid).set({
      fcm_token: token,
      last_token_update: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { success: true };
  }
}

module.exports = new FirestoreService();
