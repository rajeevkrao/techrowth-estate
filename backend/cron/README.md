# Property Expiration Cron Job

This directory contains automated scheduled tasks for the real estate platform.

## Features

### 1. Automatic Property Expiration

**File**: `propertyExpiration.js`

**Schedule**: Runs daily at midnight (00:00)

**Function**: Automatically marks properties as `EXPIRED` when their expiration date has passed.

#### How It Works

1. **Scheduled Task**: The cron job runs every day at midnight
2. **Query**: Finds all posts with:
   - Status: `ACTIVE`
   - `expiresAt` date in the past
3. **Update**: Changes status from `ACTIVE` to `EXPIRED`
4. **Logging**: Logs the number of expired properties and their details

#### Manual Trigger

Admins can manually trigger the expiration check using the API:

```bash
POST /api/admin/expire-properties
Headers: Cookie with valid admin JWT token

Response:
{
  "success": true,
  "message": "Successfully marked 5 properties as EXPIRED",
  "count": 5,
  "expiredPosts": [
    { "id": "post-id-1", "title": "Property Title 1" },
    { "id": "post-id-2", "title": "Property Title 2" }
  ]
}
```

#### Check Expiring Soon

Admins can check properties expiring within 7 days:

```bash
GET /api/admin/expiring-soon
Headers: Cookie with valid admin JWT token

Response:
{
  "success": true,
  "count": 3,
  "expiringPosts": [
    {
      "id": "post-id",
      "title": "Property Title",
      "expiresAt": "2025-11-09T00:00:00.000Z",
      "owner": "username",
      "email": "user@example.com",
      "daysRemaining": 5
    }
  ]
}
```

## Configuration

### Cron Schedule Format

The cron schedule uses the standard format:
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

**Current Schedule**: `0 0 * * *` (Every day at midnight)

### Changing the Schedule

To run at a different time, modify the schedule in `propertyExpiration.js`:

```javascript
// Run at 2:00 AM daily
cron.schedule('0 2 * * *', async () => { ... });

// Run every 12 hours
cron.schedule('0 */12 * * *', async () => { ... });

// Run every hour
cron.schedule('0 * * * *', async () => { ... });
```

## Testing

### Test Locally

You can test the cron job immediately without waiting for the scheduled time:

```javascript
import { checkExpiredPropertiesNow } from './cron/propertyExpiration.js';

// Call this function in your code
const result = await checkExpiredPropertiesNow();
console.log(result);
```

### Using Admin API

1. Create an admin user in the database:
   ```javascript
   await prisma.user.update({
     where: { email: 'your-email@example.com' },
     data: { role: 'ADMIN' }
   });
   ```

2. Login as admin and use the API endpoints to test

3. Check the server logs for cron job execution

## Future Enhancements

### Email Notifications

To add email notifications for expiring properties:

1. Install Nodemailer:
   ```bash
   npm install nodemailer
   ```

2. Configure email service in `propertyExpiration.js`:
   ```javascript
   import nodemailer from 'nodemailer';

   const transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASSWORD
     }
   });

   // Add email sending in the cron job
   for (const post of expiredPosts) {
     await transporter.sendMail({
       from: process.env.EMAIL_USER,
       to: post.user.email,
       subject: 'Your property listing has expired',
       html: `<p>Your property "${post.title}" has expired...</p>`
     });
   }
   ```

### Reminder Notifications

Add a cron job to send reminders 7 days before expiration:

```javascript
// Run daily at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  const result = await checkExpiringPropertiesSoon();

  // Send reminder emails
  for (const post of result.expiringPosts) {
    await sendReminderEmail(post);
  }
});
```

## Deployment Considerations

### Production Environment

- Ensure the server stays running (use PM2 or similar process manager)
- Set correct timezone for the server
- Monitor cron job execution logs
- Consider using a dedicated task queue (Bull, Agenda) for high-scale applications

### Using PM2

```bash
npm install -g pm2
pm2 start app.js --name "estate-api"
pm2 logs estate-api  # View logs including cron job execution
```

### Environment Variables

Add to your `.env` file:
```env
# Email configuration (if using email notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

## Troubleshooting

### Cron Job Not Running

1. Check server logs for initialization message:
   ```
   Property expiration cron job scheduled - runs daily at midnight
   ```

2. Verify node-cron is installed:
   ```bash
   npm list node-cron
   ```

3. Test manually using the admin API endpoint

### Timezone Issues

If the cron job runs at the wrong time, set the timezone:

```javascript
cron.schedule('0 0 * * *', async () => { ... }, {
  timezone: "Asia/Kolkata"  // Set your timezone
});
```

## Logs

The cron job logs the following information:

- When it starts running
- Number of expired properties found
- Details of each expired property
- Success/failure status
- Any errors encountered

Check your application logs to monitor cron job execution.
