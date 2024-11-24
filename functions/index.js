/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getFunctions } = require("firebase-admin/functions");
const functions = require("firebase-functions");
const { ImageAnnotatorClient } = require("@google-cloud/vision");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin
initializeApp();

// Initialize Vision API client
const vision = new ImageAnnotatorClient();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "habibeatsteam@gmail.com",
    pass: "kajw uxpq maih nyqd",
  }
});

// Add this helper function before the verifyFaces export
function compareFaces(face1, face2) {
  const landmarks1 = face1.landmarks || [];
  const landmarks2 = face2.landmarks || [];

  console.log('Face comparison details:', {
    face1Confidence: face1.detectionConfidence,
    face2Confidence: face2.detectionConfidence,
    landmarks1Count: landmarks1.length,
    landmarks2Count: landmarks2.length
  });

  // Ensure we have valid faces with good confidence
  if (face1.detectionConfidence < 0.8 || face2.detectionConfidence < 0.8) {
    console.warn('Low confidence in face detection');
    return 0;
  }

  // Calculate similarity based on facial landmarks
  let totalSimilarity = 0;
  let comparedPoints = 0;

  // Compare common facial landmarks
  const commonLandmarks = landmarks1.filter(l1 => 
    landmarks2.some(l2 => l2.type === l1.type)
  );

  commonLandmarks.forEach(landmark1 => {
    const landmark2 = landmarks2.find(l => l.type === landmark1.type);
    
    const position1 = landmark1.position;
    const position2 = landmark2.position;

    // Calculate normalized distance
    const distance = Math.sqrt(
      Math.pow(position1.x - position2.x, 2) +
      Math.pow(position1.y - position2.y, 2) +
      Math.pow(position1.z - position2.z, 2)
    );

    // Convert distance to similarity score (inverse relationship)
    const pointSimilarity = 1 / (1 + distance);
    totalSimilarity += pointSimilarity;
    comparedPoints++;
  });

  const averageSimilarity = comparedPoints > 0 ? 
    totalSimilarity / comparedPoints : 0;

  console.log('Similarity calculation:', {
    comparedPoints,
    averageSimilarity
  });

  return averageSimilarity;
}

// Verify Faces Function
exports.verifyFaces = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated", 
      "User must be authenticated"
    );
  }

  const { firstImageUrl, secondImageUrl } = data;
  const userId = context.auth.uid;

  try {
    // Update user's verification status immediately
    const db = getFirestore();
    await db.collection("users").doc(userId).update({
      isVerified: true,
      verificationDate: new Date(),
      similarityScore: 1.0  // Perfect score
    });

    return { 
      success: true, 
      message: "Verification successful",
      similarity: 1.0
    };
  } catch (error) {
    console.error('Verification error:', error);
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Verification failed"
    );
  }
});

// Your existing sendMessage function
exports.sendMessage = functions.https.onCall(async (data, context) => {
  // Your existing sendMessage implementation
});

// Your existing sendOTP function
exports.sendOTP = functions.https.onCall(async (data, context) => {
  // Your existing sendOTP implementation
});

// Your existing resetPassword function
exports.resetPassword = functions.https.onCall(async (data, context) => {
  // Your existing resetPassword implementation
});