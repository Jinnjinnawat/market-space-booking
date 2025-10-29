// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true }); // ชั่วคราว: อนุญาตทุก origin (เดโมเท่านั้น)

admin.initializeApp();

/**
 * ⚠️ สาธารณะ: ใครก็เรียกได้ (เดโม)
 * แนะนำ: ภายหลังเปลี่ยนเป็นตรวจสอบสิทธิ์ (เช่นเช็ค API key/secret หรือใช้ onCall + admin claim)
 */
exports.listUsersPublic = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      // รองรับ pagination ด้วย nextPageToken
      let users = [];
      let nextPageToken = undefined;

      do {
        // คืนทีละ 1000 users สูงสุด
        const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
        listUsersResult.users.forEach((u) => {
          users.push({
            uid: u.uid,
            email: u.email || null,
            displayName: u.displayName || null,
            phoneNumber: u.phoneNumber || null,
            providerIds: u.providerData.map((p) => p.providerId), // ['password', 'google.com', ...]
            metadata: {
              creationTime: u.metadata.creationTime || null,
              lastSignInTime: u.metadata.lastSignInTime || null,
            },
          });
        });
        nextPageToken = listUsersResult.pageToken;
      } while (nextPageToken);

      res.status(200).json({ ok: true, count: users.length, users });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, error: err.message });
    }
  });
});
