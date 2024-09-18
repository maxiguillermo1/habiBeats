//  index.js 
//  index.js file for google cloud function connection 
//  allows user to use functions on the cloud 


//  Maxwell Guillermo 



  // START of Google Cloud Functions Implementation/Contribution
  // START of Maxwell Guillermo


/**
 * This file contains Google Cloud Functions for a Firebase-based application.
 * It uses Firebase Admin SDK, Firebase Functions, and Nodemailer for various operations.
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
admin.initializeApp();

// Configure the email transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'habibeatsteam@gmail.com',
    pass: 'kajw uxpq maih nyqd',
  }
});

// Cloud Function: Send OTP via email
exports.sendOTP = functions.https.onCall(async (data, context) => {
  const { email, otp, isEmailChange } = data;

  let subject, text;

  if (isEmailChange) {
    subject = 'Email Change OTP';
    text = `Your OTP for email change is: ${otp}. If you didn't request this change, please ignore this email.`;
  } else {
    subject = 'Password Reset OTP';
    text = `Your OTP for password reset is: ${otp}`;
  }

  const mailOptions = {
    from: 'habibeatsteam@gmail.com',
    to: email,
    subject: subject,
    text: text
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send OTP email');
  }
});

// Cloud Function: Reset Password
exports.resetPassword = functions.https.onCall(async (data, context) => {
  const { email, otp, newPassword } = data;

  // Verify OTP
  const db = admin.firestore();
  const q = db.collection('password_resets')
    .where('email', '==', email)
    .where('otp', '==', otp)
    .where('used', '==', false)
    .limit(1);

  const snapshot = await q.get();

  if (snapshot.empty) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid OTP');
  }

  const doc = snapshot.docs[0];
  const otpData = doc.data();

  // Check if OTP is expired (15 minutes)
  const now = admin.firestore.Timestamp.now();
  const expirationTime = 15 * 60 * 1000; // 15 minutes
  if (now.toMillis() - otpData.timestamp.toMillis() > expirationTime) {
    throw new functions.https.HttpsError('deadline-exceeded', 'OTP has expired');
  }

  // Reset password
  try {
    // Get the user by email
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        throw new functions.https.HttpsError('not-found', 'No user found with this email address');
      }
      throw error;
    }
    
    // Update the password
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword,
    });

    // Mark OTP as used
    await doc.ref.update({ used: true });

    return { message: 'Password reset successfully' };
  } catch (error) {
    console.error('Error resetting password:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to reset password: ' + error.message);
  }
});

// Cloud Function: Update email in Firestore when changed in Auth
exports.onUserChanged = functions.auth.user().onUpdate(async (change, context) => {
  const beforeUser = change.before.data();
  const afterUser = change.after.data();

  // Check if email has changed
  if (beforeUser.email !== afterUser.email) {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(afterUser.uid);

    try {
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.pendingEmail === afterUser.email) {
          // Update the email in Firestore
          await userRef.update({
            email: afterUser.email,
            pendingEmail: null
          });
          console.log(`Updated email for user ${afterUser.uid} in Firestore`);
        }
      }
    } catch (error) {
      console.error(`Error updating user ${afterUser.uid} in Firestore:`, error);
    }
  }
});


  // END of Google Cloud Functions Implementation/Contribution
  // END of Maxwell Guillermo