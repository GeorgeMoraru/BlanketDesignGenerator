/**
 * Blanket Design Generator - Firebase & Google Authentication & Cloud Sync
 */
(function() {
    'use strict';

    // Default Firebase Web Config
    const defaultConfig = {
        apiKey: "AIzaSyDpFiagvaW_i7cRFxslzC3pwuPnQoe_UXY",
        authDomain: "foodex-a9dee.firebaseapp.com",
        projectId: "foodex-a9dee",
        storageBucket: "foodex-a9dee.appspot.com",
        messagingSenderId: "123456789012",
        appId: "1:123456789012:web:a1b2c3d4e5f6"
    };

    const firebaseConfig = window.FIREBASE_CONFIG || defaultConfig;

    let app = null;
    let auth = null;
    let db = null;

    const initFirebase = () => {
        if (typeof firebase !== 'undefined') {
            if (!firebase.apps.length) {
                app = firebase.initializeApp(firebaseConfig);
            } else {
                app = firebase.app();
            }
            auth = firebase.auth();
            db = firebase.firestore();
            
            // Set persistence to LOCAL
            auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(err => {
                console.warn('[Firebase Auth] Persistence error:', err);
            });

            // Process redirect result if returning from signInWithRedirect
            auth.getRedirectResult().then(result => {
                if (result && result.user) {
                    console.log('[Firebase Auth] Signed in via redirect:', result.user.displayName);
                }
            }).catch(err => {
                console.error('[Firebase Auth] Redirect result error:', err.code, err.message);
                if (err.code === 'auth/unauthorized-domain') {
                    alert(`Firebase Auth Error (unauthorized-domain):\nThe domain "${window.location.hostname}" is not authorized in your Firebase Console.\n\nPlease add "${window.location.hostname}" under Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
                } else if (err.code && err.code !== 'auth/popup-closed-by-user') {
                    alert(`Firebase Auth Error (${err.code}):\n${err.message}`);
                }
            });
            console.log('[Firebase] Initialized successfully with project:', firebaseConfig.projectId);
        } else {
            console.warn('[Firebase] Firebase SDK not loaded.');
        }
    };

    // Google Sign-In helper with explicit error diagnostics & fallback
    const loginWithGoogle = async () => {
        if (!auth) initFirebase();
        if (!auth) {
            alert('Firebase SDK is not initialized. Please refresh the page.');
            return;
        }
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            const result = await auth.signInWithPopup(provider);
            return result;
        } catch (err) {
            console.warn('[Google Login] signInWithPopup error:', err.code, err.message);
            if (err.code === 'auth/unauthorized-domain') {
                alert(`Firebase Auth Error (unauthorized-domain):\nThe domain "${window.location.hostname}" is not authorized in your Firebase Console.\n\nPlease add "${window.location.hostname}" under Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
                throw err;
            }
            if (err.code === 'auth/operation-not-allowed') {
                alert(`Firebase Auth Error (operation-not-allowed):\nGoogle Sign-In is disabled in your Firebase Console.\n\nPlease go to Firebase Console -> Authentication -> Sign-in method -> Google and enable it.`);
                throw err;
            }
            if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                console.log('[Google Login] Popup blocked/closed, falling back to signInWithRedirect...');
                try {
                    return await auth.signInWithRedirect(provider);
                } catch (redErr) {
                    alert(`Google Sign-In Redirect Error (${redErr.code}):\n${redErr.message}`);
                    throw redErr;
                }
            }
            alert(`Google Sign-In Error (${err.code}):\n${err.message}`);
            throw err;
        }
    };

    // Sign out helper
    const logoutGoogle = async () => {
        if (!auth) initFirebase();
        if (auth) {
            await auth.signOut();
        }
    };

    // Listen for auth state changes
    const onAuthChange = (callback) => {
        if (!auth) initFirebase();
        if (auth) {
            return auth.onAuthStateChanged(callback);
        }
    };

    // Save/sync a single design to Cloud Firestore
    const saveDesignToCloud = async (uid, design) => {
        if (!db) initFirebase();
        if (!db || !uid || !design || !design.id) return;
        const docRef = db.collection('users').doc(uid).collection('designs').doc(String(design.id));
        await docRef.set({
            ...design,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    };

    // Delete a design from Cloud Firestore
    const deleteDesignFromCloud = async (uid, designId) => {
        if (!db) initFirebase();
        if (!db || !uid || !designId) return;
        await db.collection('users').doc(uid).collection('designs').doc(String(designId)).delete();
    };

    // Listen in real-time to designs stored in Cloud Firestore
    const subscribeCloudDesigns = (uid, callback) => {
        if (!db) initFirebase();
        if (!db || !uid) return () => {};
        return db.collection('users').doc(uid).collection('designs')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                const cloudDesigns = [];
                snapshot.forEach((doc) => {
                    cloudDesigns.push(doc.data());
                });
                callback(cloudDesigns);
            }, (err) => {
                console.warn('[Firebase Sync] Subscription error:', err);
            });
    };

    // Expose global interface
    window.FirebaseAuthSync = {
        initFirebase,
        loginWithGoogle,
        logoutGoogle,
        onAuthChange,
        saveDesignToCloud,
        deleteDesignFromCloud,
        subscribeCloudDesigns
    };

    // Initialize immediately
    initFirebase();
})();
