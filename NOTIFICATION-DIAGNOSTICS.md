# Notification System Diagnostic Tools

This folder contains tools to help diagnose and test the notification system in the Blood-Link app.

## In-App Diagnostic Tool

The notification diagnostics tool is now available within the app from the drawer menu. This tool helps you:

1. Check device information
2. Verify notification permissions
3. Test the notification channels
4. Verify Firebase connection
5. Send test notifications

## Server-Side Testing Tools

### notification-test-server.js

This Node.js script allows you to send test push notifications directly to devices without going through the app.

#### How to use:

1. Run the script with Node.js:

   ```
   node notification-test-server.js
   ```

2. Enter the Expo Push Token when prompted (get this from the in-app diagnostics)

3. Choose the type of notification you want to send:

   - Blood Request Match (High Priority)
   - Donor Response (Accepted/Declined)
   - General App Update
   - Custom Notification

4. Confirm to send the notification

### notification-system-test.js

This script runs automated tests on various components of the notification system to identify potential issues.

#### How to use:

1. Run the script with Node.js:

   ```
   node notification-system-test.js
   ```

2. The script will automatically run a series of tests and output the results
3. Test results are also saved to `notification-test-results.json`

## Common Issues & Solutions

### "No Immediate Matches" Error

- Verify that you have users with the matching blood type and city
- Check that users have valid push tokens registered

### Multiple Identical Notifications

- The deduplication system prevents identical notifications within a 30-second window
- If you're still seeing duplicates, check for multiple instances of the same event

### Notifications Not Being Received

- Verify that notification permissions are granted
- Check that the correct push token is registered in Firebase
- Ensure the device has an internet connection

### Android Channel Issues

- Channels are automatically created on app startup
- If channels are missing, try reinstalling the app

## Need Further Help?

Use the in-app diagnostic tool to gather detailed information about your setup, then contact support with those details for faster resolution.
