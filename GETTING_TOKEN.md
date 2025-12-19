# How to Get Your Apple Podcast API Bearer Token

This guide provides step-by-step instructions for obtaining the Apple API Bearer Token needed to run the Podcast Transcript Exporter.

## What is the Bearer Token?

The Bearer Token is an authentication credential that allows your application to access Apple's Podcast API. It's tied to your Apple ID and expires every 30 days.

## Method 1: Browser Developer Tools (Recommended) ⭐

This is the easiest and most reliable method.

### Step 1: Open Apple Podcasts Web

1. Open your web browser (Chrome, Firefox, Edge, Safari)
2. Go to https://podcasts.apple.com
3. Sign in with your Apple ID if prompted

### Step 2: Open Developer Tools

**Chrome/Edge:**
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
- Press `Cmd+Option+I` (Mac)

**Firefox:**
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
- Press `Cmd+Option+I` (Mac)

**Safari:**
- Enable Developer menu: Safari → Preferences → Advanced → Check "Show Develop menu"
- Press `Cmd+Option+I`

### Step 3: Navigate to Network Tab

1. Click on the **Network** tab in Developer Tools
2. Make sure it's recording (there should be a red/green circle icon, or it should say "Recording")

### Step 4: Filter Requests

In the filter/search box at the top of the Network tab, type: `amp-api`

This will filter only relevant API requests.

### Step 5: Trigger an API Request

Do ONE of the following to trigger an API call:

**Option A:** Play a podcast
- Search for any podcast
- Click on an episode
- Press play (you can pause immediately after)

**Option B:** Browse podcasts
- Click on any podcast show
- Click on any episode to view its details

### Step 6: Find the Request

In the filtered Network tab, you should see requests to:
- `amp-api.podcasts.apple.com`

Click on any of these requests.

### Step 7: Extract the Token

1. In the request details panel (usually on the right), click the **Headers** tab
2. Scroll down to **Request Headers**
3. Find the `Authorization` header
4. The value will look like:
   ```
   Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IldlYlBsYXlLaWQifQ...
   ```
5. **Copy everything AFTER "Bearer "** (don't include the word "Bearer" itself)
6. Your token starts with `eyJ` and is a very long string

### Step 8: Save Your Token

Copy the token and save it somewhere secure. You'll need to:
- Add it to your `.env` file for local development
- Add it to Vercel environment variables for deployment

## Method 2: Browser Console

If you prefer using the console:

1. Go to https://podcasts.apple.com and sign in
2. Open the browser console (F12 → Console tab)
3. Paste this code:

```javascript
(async () => {
  try {
    const response = await fetch('https://sf-api-token-service.itunes.apple.com/apiToken', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    const data = await response.json();
    console.log('=====================================');
    console.log('YOUR APPLE API TOKEN:');
    console.log(data.token);
    console.log('=====================================');
    console.log('Copy the token above (starts with eyJ...)');
  } catch (error) {
    console.error('Error fetching token:', error);
    console.log('If this fails, use Method 1 (Developer Tools) instead');
  }
})();
```

4. Press Enter
5. Copy the token from the console output

## Method 3: Using curl (Advanced)

If you're comfortable with command-line tools:

```bash
curl 'https://sf-api-token-service.itunes.apple.com/apiToken' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
```

The response will contain your token in the `token` field.

## Verifying Your Token

To test if your token works, try this curl command:

```bash
curl -X GET \
  'https://amp-api.podcasts.apple.com/v1/catalog/us/podcast-episodes/1000123456789' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -H 'User-Agent: Podcasts/1.1.0 (Macintosh; OS X 15.5)'
```

If you get a valid JSON response, your token works!

## Common Issues

### Issue: "No amp-api requests showing up"

**Solution:**
- Make sure you're signed in to Apple Podcasts
- Try playing different podcasts
- Clear your Network tab and try again
- Make sure "Preserve log" is enabled in Network tab

### Issue: "Authorization header not found"

**Solution:**
- You might be looking at the wrong request
- Look for requests that go to `amp-api.podcasts.apple.com`
- Try clicking on different requests in the Network tab

### Issue: "Token doesn't work"

**Solution:**
- Make sure you copied the ENTIRE token (it's very long)
- Don't include the word "Bearer" or any spaces
- Don't include quotes around the token
- Token should start with `eyJ`

### Issue: "Can't access Developer Tools"

**Solution:**
- Try a different browser
- Make sure Developer Tools aren't disabled by your organization
- Try the Browser Console method instead

## Using the Token

### For Local Development:

1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

2. Add your token:
   ```
   APPLE_BEARER_TOKEN=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6...
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add new variable:
   - Name: `APPLE_BEARER_TOKEN`
   - Value: (paste your token)
   - Environments: Production, Preview, Development
4. Save and redeploy

## Token Maintenance

### Expiration

- Tokens expire every 30 days
- Set a calendar reminder to refresh your token monthly
- You'll know it expired when you get authentication errors

### Refreshing

1. Follow the same steps above to get a new token
2. Update it in:
   - Your `.env` file (local)
   - Vercel environment variables (production)
3. Redeploy if necessary

### Security

- ⚠️ **Never commit tokens to Git**
- ✅ Tokens are in `.gitignore`
- ✅ Use environment variables
- ✅ Vercel encrypts environment variables
- ⚠️ Don't share tokens publicly

## Still Having Trouble?

1. **Check the main README.md** for additional troubleshooting
2. **Open a GitHub issue** with:
   - Which method you tried
   - What error messages you're seeing
   - Your operating system and browser
3. **Check if Apple's API is working** by visiting podcasts.apple.com

## Quick Reference

**Token starts with:** `eyJ`

**Token length:** Very long (hundreds of characters)

**Expires:** Every 30 days

**Where to use it:**
- `.env` file: `APPLE_BEARER_TOKEN=your_token`
- Vercel: Environment Variables section

**Test endpoint:**
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "hasToken": true,
  "message": "API is configured and ready"
}
```
