/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
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

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'habibeatsteam@gmail.com',
    pass: 'kajw uxpq maih nyqd',
  }
});

exports.sendOTP = functions.https.onCall(async (data, context) => {
  const { email, otp, isEmailChange } = data;

  let subject, text;

  if (isEmailChange) {
    subject = 'Email Change Verification';
    text = `Your OTP for email change verification is: ${otp}. Please enter this code to confirm your email change request.`;
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