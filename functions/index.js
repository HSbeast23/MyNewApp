/**
 * Firebase Cloud Functions for Blood Link App
 * - Handles sending FCM push notifications
 * - Triggered by Firestore document changes
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin with service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Send push notification to a donor when a blood request matches their blood group and city
 * Triggered when a new blood request is created
 */
exports.sendBloodRequestNotification = functions.firestore
  .document('Bloodreceiver/{requestId}')
  .onCreate(async (snapshot, context) => {
    try {
      const requestData = snapshot.data();
      const { bloodGroup, city, name, requiredDateTime, purpose, hospital, mobile, uid } = requestData;
      
      if (!bloodGroup || !city) {
        console.log('Blood request missing required fields:', requestData);
        return null;
      }

      console.log(`Processing new blood request: ${bloodGroup} in ${city}`);
      
      // Find matching donors with the same blood group and city
      const donorSnapshot = await db.collection('BloodDonors')
        .where('bloodGroup', '==', bloodGroup)
        .where('city', '==', city)
        .where('isActive', '==', true)
        .get();
      
      // If no donors found, try looking in users collection as fallback
      let matchingDonors = [];
      if (donorSnapshot.empty) {
        console.log('No matching donors found in BloodDonors collection, checking users collection');
        const usersSnapshot = await db.collection('users')
          .where('bloodGroup', '==', bloodGroup)
          .where('city', '==', city)
          .get();
          
        matchingDonors = usersSnapshot.docs
          .filter(doc => doc.id !== uid && doc.data().pushToken)
          .map(doc => ({
            uid: doc.id,
            pushToken: doc.data().pushToken,
            name: doc.data().name || 'Unknown',
          }));
      } else {
        matchingDonors = donorSnapshot.docs
          .filter(doc => doc.id !== uid)
          .map(doc => ({
            uid: doc.id,
            pushToken: doc.data().pushToken || doc.data().expoPushToken,
            name: doc.data().name || 'Unknown',
          }));
      }
      
      console.log(`Found ${matchingDonors.length} matching donors`);
      
      if (matchingDonors.length === 0) {
        // No matching donors found
        console.log('No matching donors found with push tokens');
        return null;
      }
      
      // Format urgency text
      let urgencyText = '';
      if (requiredDateTime) {
        urgencyText = requiredDateTime.includes('ASAP') ? 
          'URGENT - NEEDED IMMEDIATELY' : 
          `NEEDED BY: ${requiredDateTime}`;
      } else {
        urgencyText = 'URGENT REQUEST';
      }
      
      // Create notification messages for all matching donors
      const notificationPromises = matchingDonors
        .filter(donor => donor.pushToken)
        .map(async (donor) => {
          // Create notification for this donor
          const title = `🚨 URGENT: ${bloodGroup} Blood Needed in ${city}`;
          const body = `${name || 'Someone'} urgently needs ${bloodGroup} blood${purpose ? ' for ' + purpose : ''}. ${urgencyText}. Can you help save a life today?`;
          
          const notificationData = {
            type: 'blood_request_match',
            requestId: context.params.requestId,
            bloodGroup,
            city,
            receiverName: name || 'Patient',
            requiredDateTime: requiredDateTime || 'ASAP',
            purpose: purpose || 'Medical emergency',
            hospital: hospital || '',
            mobile: mobile || '',
            screen: 'Notifications',
            action: 'view_request',
            urgent: true,
            timestamp: Date.now()
          };
          
          // Add donor to seen list to prevent duplicate notifications
          try {
            await db.collection('Bloodreceiver').doc(context.params.requestId).update({
              seenBy: admin.firestore.FieldValue.arrayUnion(donor.uid)
            });
          } catch (err) {
            console.log('Error updating seen status:', err);
          }
          
          // Send FCM notification
          try {
            const message = {
              token: donor.pushToken,
              notification: {
                title,
                body,
                sound: 'default',
              },
              data: notificationData,
              android: {
                priority: 'high',
                notification: {
                  sound: 'default',
                  channelId: 'blood-requests',
                  priority: 'max',
                  visibility: 'public',
                  vibrateTimingsMillis: [0, 250, 250, 250],
                }
              },
              apns: {
                payload: {
                  aps: {
                    sound: 'default',
                    badge: 1,
                    contentAvailable: true,
                  }
                }
              }
            };
            
            return admin.messaging().send(message);
          } catch (err) {
            console.error(`Error sending notification to donor ${donor.uid}:`, err);
            return null;
          }
        });
      
      const results = await Promise.all(notificationPromises);
      console.log(`Sent ${results.filter(Boolean).length} notifications successfully`);
      return { success: true };
    } catch (error) {
      console.error('Error in sendBloodRequestNotification:', error);
      return { error: error.message };
    }
  });

/**
 * Send push notification to a requester when a donor responds
 * Triggered when a donor accepts/declines a blood request
 */
exports.sendDonorResponseNotification = functions.firestore
  .document('Bloodreceiver/{requestId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      
      // Get arrays of responses before and after
      const beforeResponses = beforeData.responses || [];
      const afterResponses = afterData.responses || [];
      
      // If there are no new responses, exit
      if (afterResponses.length <= beforeResponses.length) {
        return null;
      }
      
      // Find the new response(s)
      const newResponses = afterResponses.filter(newResp => {
        return !beforeResponses.some(oldResp => 
          oldResp.donorUid === newResp.donorUid && 
          oldResp.status === newResp.status
        );
      });
      
      if (newResponses.length === 0) {
        return null;
      }
      
      // Process each new response
      const promises = newResponses.map(async (response) => {
        const { donorName, status, donorMobile } = response;
        
        // Get requester's push token
        const requesterId = afterData.uid;
        if (!requesterId) {
          console.log('No requester ID found in the document');
          return null;
        }
        
        // Get requester document
        const requesterDoc = await db.collection('users').doc(requesterId).get();
        if (!requesterDoc.exists || !requesterDoc.data().pushToken) {
          console.log('Requester not found or no push token available');
          return null;
        }
        
        const pushToken = requesterDoc.data().pushToken;
        
        // Prepare notification based on status
        const emoji = status === 'accepted' ? '✅' : '❌';
        const actionText = status === 'accepted' ? 'ACCEPTED' : 'declined';
        const title = `${emoji} ${donorName} ${actionText.toUpperCase()}!`;
        
        let body;
        if (status === 'accepted') {
          body = `Great news! ${donorName} accepted your ${afterData.bloodGroup || ''} blood request${afterData.city ? ' in ' + afterData.city : ''}.${donorMobile ? ` Contact: ${donorMobile}` : ' Check the app for contact details.'}`;
        } else {
          body = `${donorName} declined your ${afterData.bloodGroup || ''} blood request${afterData.city ? ' in ' + afterData.city : ''}. Don't worry, other donors may still respond.`;
        }
        
        const notificationData = {
          type: 'donor_response',
          requestId: context.params.requestId,
          donorName,
          status,
          bloodGroup: afterData.bloodGroup || '',
          city: afterData.city || '',
          donorMobile: donorMobile || '',
          screen: 'Notifications',
          action: 'view_response',
          urgent: status === 'accepted',
          timestamp: Date.now()
        };
        
        // Send FCM notification
        const message = {
          token: pushToken,
          notification: {
            title,
            body,
            sound: 'default',
          },
          data: notificationData,
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'donor-responses',
              priority: 'max',
              visibility: 'public',
              vibrateTimingsMillis: [0, 250, 250, 250],
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
                contentAvailable: true,
              }
            }
          }
        };
        
        try {
          await admin.messaging().send(message);
          console.log(`Notification sent to requester ${requesterId} about donor ${donorName}'s response`);
          
          // Mark the response as sent
          const updatedResponses = afterResponses.map(r => {
            if (r.donorUid === response.donorUid && r.status === response.status) {
              return { ...r, notificationSent: true };
            }
            return r;
          });
          
          await db.collection('Bloodreceiver').doc(context.params.requestId).update({
            responses: updatedResponses
          });
          
          return { success: true };
        } catch (err) {
          console.error('Error sending donor response notification:', err);
          return null;
        }
      });
      
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Error in sendDonorResponseNotification:', error);
      return { error: error.message };
    }
  });

// Export functions for deployment
module.exports = {
  sendBloodRequestNotification: exports.sendBloodRequestNotification,
  sendDonorResponseNotification: exports.sendDonorResponseNotification,
};
