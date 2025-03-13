const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();

// Verify Telegram WebApp data and create a custom token
exports.getTelegramAuthToken = functions.https.onCall(async (data, context) => {
  try {
    const { initData } = data;
    
    if (!initData) {
      throw new Error("No init data provided");
    }
    
    // Verify the data is from Telegram
    const isValid = verifyTelegramWebAppData(initData);
    
    if (!isValid) {
      throw new Error("Invalid Telegram WebApp data");
    }
    
    // Parse the init data
    const parsedData = parseTelegramInitData(initData);
    
    if (!parsedData.user || !parsedData.user.id) {
      throw new Error("No user ID in Telegram data");
    }
    
    const telegramUserId = parsedData.user.id.toString();
    
    // Create or get the Firebase user
    let userRecord;
    
    try {
      // Try to get existing user
      userRecord = await admin.auth().getUserByEmail(`${telegramUserId}@telegram.user`);
    } catch (error) {
      // User doesn't exist, create a new one
      userRecord = await admin.auth().createUser({
        email: `${telegramUserId}@telegram.user`,
        emailVerified: true,
        displayName: parsedData.user.username || 
                    `${parsedData.user.first_name} ${parsedData.user.last_name || ''}`.trim(),
        photoURL: parsedData.user.photo_url || '',
        disabled: false,
      });
      
      // Store additional user data
      await admin.firestore().collection('users').doc(userRecord.uid).set({
        userId: userRecord.uid,
        telegramId: telegramUserId,
        username: parsedData.user.username || 
                 `${parsedData.user.first_name} ${parsedData.user.last_name || ''}`.trim(),
        photoUrl: parsedData.user.photo_url || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
        totalCoinsEarned: 0,
        totalClicks: 0,
        totalTimePlayedSeconds: 0,
        highestRank: 'Novice',
        referralCode: telegramUserId.substring(0, 6) + Math.random().toString(36).substring(2, 5),
        achievements: []
      });
    }
    
    // Create custom token
    const token = await admin.auth().createCustomToken(userRecord.uid);
    
    return token;
  } catch (error) {
    console.error("Error in getTelegramAuthToken:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Process crypto reward
exports.processCryptoReward = functions.https.onCall(async (data, context) => {
  try {
    const { userId, walletAddress, amount } = data;
    
    if (!userId || !walletAddress || !amount) {
      throw new Error("Missing required parameters");
    }
    
    // Generate a unique ID for this reward
    const rewardId = admin.firestore().collection('rewards').doc().id;
    
    // Store the reward in Firestore
    await admin.firestore().collection('rewards').doc(rewardId).set({
      userId,
      walletAddress,
      amount,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      transactionId: null
    });
    
    // In a real implementation, you would call your blockchain service here
    // For now, we'll just simulate a pending transaction
    
    return {
      status: 'pending',
      txId: rewardId
    };
  } catch (error) {
    console.error("Error in processCryptoReward:", error);
    return {
      status: 'failed',
      error: error.message
    };
  }
});

// Process referral reward
exports.processReferralReward = functions.https.onCall(async (data, context) => {
  try {
    const { userId, referrerId } = data;
    
    if (!userId || !referrerId) {
      throw new Error("Missing required parameters");
    }
    
    // Check if this referral has already been processed
    const referralDoc = await admin.firestore()
      .collection('referrals')
      .where('userId', '==', userId)
      .where('referrerId', '==', referrerId)
      .get();
      
    if (!referralDoc.empty) {
      return { success: false, message: "Referral already processed" };
    }
    
    // Record the referral
    await admin.firestore().collection('referrals').add({
      userId,
      referrerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      processed: true
    });
    
    // Give bonus to the referrer (add 500 coins to their balance)
    const referrerGameStateDoc = await admin.firestore()
      .collection('gameStates')
      .doc(referrerId)
      .get();
      
    if (referrerGameStateDoc.exists) {
      const gameState = referrerGameStateDoc.data();
      await admin.firestore().collection('gameStates').doc(referrerId).update({
        balance: gameState.balance + 500
      });
    }
    
    // Give bonus to the new user (add 200 coins to their balance)
    const userGameStateDoc = await admin.firestore()
      .collection('gameStates')
      .doc(userId)
      .get();
      
    if (userGameStateDoc.exists) {
      const gameState = userGameStateDoc.data();
      await admin.firestore().collection('gameStates').doc(userId).update({
        balance: gameState.balance + 200
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in processReferralReward:", error);
    return { success: false, message: error.message };
  }
});

// Scheduled function to process pending rewards (runs every hour)
exports.processPendingRewards = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {
  try {
    // Get all pending rewards
    const pendingRewards = await admin.firestore()
      .collection('rewards')
      .where('status', '==', 'pending')
      .get();
    
    if (pendingRewards.empty) {
      console.log('No pending rewards to process');
      return null;
    }
    
    // Process each reward
    const batch = admin.firestore().batch();
    
    pendingRewards.forEach(doc => {
      const reward = doc.data();
      
      // In a real implementation, you would call your blockchain service here
      // For now, we'll just simulate a successful transaction
      
      // Generate a fake transaction ID
      const txId = 'tx_' + Math.random().toString(36).substring(2, 15);
      
      // Update the reward status
      batch.update(doc.ref, {
        status: 'completed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        transactionId: txId
      });
    });
    
    await batch.commit();
    
    console.log(`Processed ${pendingRewards.size} pending rewards`);
    return null;
  } catch (error) {
    console.error("Error in processPendingRewards:", error);
    return null;
  }
});

// Helper function to verify Telegram WebApp data
function verifyTelegramWebAppData(initData) {
  // In a real implementation, you would verify the data using the bot token
  // For this example, we'll just return true
  return true;
}

// Helper function to parse Telegram init data
function parseTelegramInitData(initData) {
  try {
    // Parse the query string
    const params = new URLSearchParams(initData);
    
    // Get the data parameter
    const dataStr = params.get('data') || '{}';
    
    // Parse the JSON data
    return JSON.parse(dataStr);
  } catch (error) {
    console.error("Error parsing Telegram init data:", error);
    return {};
  }
}
