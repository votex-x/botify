// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBglmC1ru_cmEjBlT_LuGNnEOoBO-iOO78",
    authDomain: "firehx-786aa.firebaseapp.com",
    databaseURL: "https://firehx-786aa-default-rtdb.firebaseio.com",
    projectId: "firehx-786aa",
    storageBucket: "firehx-786aa.appspot.com",
    messagingSenderId: "504229083597",
    appId: "1:504229083597:web:eb9435991138c47eb12c84",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Current user state
let currentUser = null;

// Monitor authentication state
auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateUIBasedOnAuth();
    if (user) {
        console.log("User logged in:", user.email);
        loadUserData();
    } else {
        console.log("User logged out");
    }
});

// Update UI based on authentication state
function updateUIBasedOnAuth() {
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const dashboardLink = document.getElementById('dashboardLink');

    if (currentUser) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'block';
        dashboardLink.style.display = 'block';
    } else {
        loginLink.style.display = 'block';
        logoutLink.style.display = 'none';
        dashboardLink.style.display = 'none';
    }
}

// Load user data from database
async function loadUserData() {
    if (!currentUser) return;

    try {
        const userRef = database.ref('users/' + currentUser.uid);
        userRef.on('value', (snapshot) => {
            const userData = snapshot.val();
            if (!userData) {
                // Create new user record
                createUserRecord();
            } else {
                console.log("User data loaded:", userData);
            }
        });
    } catch (error) {
        console.error("Error loading user data:", error);
    }
}

// Create new user record
async function createUserRecord() {
    if (!currentUser) return;

    try {
        const newUserData = {
            email: currentUser.email,
            createdAt: new Date().toISOString(),
            bites: 0,
            bots: {},
            purchases: {},
            monetizationEnabled: false,
            totalBotsPublished: 0
        };

        await database.ref('users/' + currentUser.uid).set(newUserData);
        console.log("User record created");
    } catch (error) {
        console.error("Error creating user record:", error);
    }
}

// Get user data
async function getUserData() {
    if (!currentUser) return null;

    try {
        const snapshot = await database.ref('users/' + currentUser.uid).get();
        return snapshot.val();
    } catch (error) {
        console.error("Error getting user data:", error);
        return null;
    }
}

// Update user data
async function updateUserData(updates) {
    if (!currentUser) return false;

    try {
        await database.ref('users/' + currentUser.uid).update(updates);
        return true;
    } catch (error) {
        console.error("Error updating user data:", error);
        return false;
    }
}

// Get all bots
async function getAllBots() {
    try {
        const snapshot = await database.ref('bots').get();
        return snapshot.val() || {};
    } catch (error) {
        console.error("Error getting bots:", error);
        return {};
    }
}

// Get user's bots
async function getUserBots() {
    if (!currentUser) return {};

    try {
        const userData = await getUserData();
        return userData?.bots || {};
    } catch (error) {
        console.error("Error getting user bots:", error);
        return {};
    }
}

// Add new bot
async function addBot(botData) {
    if (!currentUser) return false;

    try {
        const botId = database.ref('bots').push().key;
        const botWithMetadata = {
            ...botData,
            id: botId,
            userId: currentUser.uid,
            createdAt: new Date().toISOString(),
            downloads: 0,
            rating: 0,
            reviews: []
        };

        // Add to global bots list
        await database.ref('bots/' + botId).set(botWithMetadata);

        // Add to user's bots
        const userData = await getUserData();
        const totalBots = (userData?.totalBotsPublished || 0) + 1;
        
        const updates = {
            ['bots/' + botId]: true,
            'totalBotsPublished': totalBots
        };

        // Check if user can enable monetization (2 or more bots)
        if (totalBots >= 2 && !userData?.monetizationEnabled) {
            updates['monetizationEnabled'] = true;
        }

        await database.ref('users/' + currentUser.uid).update(updates);
        return botId;
    } catch (error) {
        console.error("Error adding bot:", error);
        return false;
    }
}

// Update bot
async function updateBot(botId, updates) {
    if (!currentUser) return false;

    try {
        await database.ref('bots/' + botId).update(updates);
        return true;
    } catch (error) {
        console.error("Error updating bot:", error);
        return false;
    }
}

// Delete bot
async function deleteBot(botId) {
    if (!currentUser) return false;

    try {
        // Get bot info first
        const botSnapshot = await database.ref('bots/' + botId).get();
        const bot = botSnapshot.val();

        // Check if user owns the bot
        if (bot?.userId !== currentUser.uid) {
            console.error("User does not own this bot");
            return false;
        }

        // Delete from global bots
        await database.ref('bots/' + botId).remove();

        // Delete from user's bots
        await database.ref('users/' + currentUser.uid + '/bots/' + botId).remove();

        // Delete files from storage
        if (bot?.fileUrl) {
            try {
                const fileRef = storage.refFromURL(bot.fileUrl);
                await fileRef.delete();
            } catch (error) {
                console.warn("Could not delete file from storage:", error);
            }
        }

        return true;
    } catch (error) {
        console.error("Error deleting bot:", error);
        return false;
    }
}

// Upload file to storage
async function uploadFile(file, path) {
    try {
        const storageRef = storage.ref(path);
        const snapshot = await storageRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file:", error);
        return null;
    }
}

// Add transaction
async function addTransaction(type, amount, description) {
    if (!currentUser) return false;

    try {
        const transactionId = database.ref('transactions').push().key;
        const transaction = {
            id: transactionId,
            userId: currentUser.uid,
            type: type, // 'earn', 'spend', 'purchase', 'sale'
            amount: amount,
            description: description,
            timestamp: new Date().toISOString()
        };

        await database.ref('transactions/' + transactionId).set(transaction);
        return true;
    } catch (error) {
        console.error("Error adding transaction:", error);
        return false;
    }
}

// Get user transactions
async function getUserTransactions() {
    if (!currentUser) return [];

    try {
        const snapshot = await database.ref('transactions').orderByChild('userId').equalTo(currentUser.uid).get();
        const transactions = [];
        snapshot.forEach((childSnapshot) => {
            transactions.push(childSnapshot.val());
        });
        return transactions.reverse(); // Most recent first
    } catch (error) {
        console.error("Error getting transactions:", error);
        return [];
    }
}

// Grant bites to user (admin function)
async function grantBites(userId, amount, reason) {
    try {
        const userRef = database.ref('users/' + userId);
        const snapshot = await userRef.get();
        const userData = snapshot.val();
        const currentBites = userData?.bites || 0;

        await userRef.update({
            bites: currentBites + amount
        });

        // Add transaction record
        await database.ref('transactions').push().set({
            userId: userId,
            type: 'earn',
            amount: amount,
            description: 'Admin grant: ' + reason,
            timestamp: new Date().toISOString()
        });

        return true;
    } catch (error) {
        console.error("Error granting bites:", error);
        return false;
    }
}

// Purchase bot
async function purchaseBot(botId) {
    if (!currentUser) return false;

    try {
        const botSnapshot = await database.ref('bots/' + botId).get();
        const bot = botSnapshot.val();

        if (!bot) {
            console.error("Bot not found");
            return false;
        }

        const price = bot.price || 0;
        const userData = await getUserData();
        const currentBites = userData?.bites || 0;

        if (price > 0 && currentBites < price) {
            console.error("Insufficient bites");
            return false;
        }

        // Add to purchases
        const purchaseId = database.ref('purchases').push().key;
        await database.ref('purchases/' + purchaseId).set({
            id: purchaseId,
            userId: currentUser.uid,
            botId: botId,
            botTitle: bot.title,
            price: price,
            timestamp: new Date().toISOString()
        });

        // Update user bites
        if (price > 0) {
            await updateUserData({
                bites: currentBites - price,
                ['purchases/' + botId]: true
            });

            // Add transaction
            await addTransaction('purchase', price, 'Purchased: ' + bot.title);

            // Give bites to bot owner
            const botOwnerData = await database.ref('users/' + bot.userId).get();
            const ownerBites = botOwnerData.val()?.bites || 0;
            await database.ref('users/' + bot.userId).update({
                bites: ownerBites + price
            });

            // Add transaction for bot owner
            await database.ref('transactions').push().set({
                userId: bot.userId,
                type: 'sale',
                amount: price,
                description: 'Sale: ' + bot.title,
                timestamp: new Date().toISOString()
            });
        } else {
            // Free bot
            await updateUserData({
                ['purchases/' + botId]: true
            });
        }

        return true;
    } catch (error) {
        console.error("Error purchasing bot:", error);
        return false;
    }
}

// Check if user owns bot
async function userOwnsBotId(botId) {
    if (!currentUser) return false;

    try {
        const userData = await getUserData();
        return userData?.bots?.[botId] === true;
    } catch (error) {
        console.error("Error checking bot ownership:", error);
        return false;
    }
}

// Check if user has purchased bot
async function userHasPurchasedBot(botId) {
    if (!currentUser) return false;

    try {
        const userData = await getUserData();
        return userData?.purchases?.[botId] === true;
    } catch (error) {
        console.error("Error checking bot purchase:", error);
        return false;
    }
}
