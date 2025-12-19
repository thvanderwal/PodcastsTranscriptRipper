// Vercel Serverless Function for health check
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const hasToken = !!process.env.APPLE_BEARER_TOKEN;
  
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasToken,
    message: hasToken 
      ? 'API is configured and ready' 
      : 'API token not configured. Please set APPLE_BEARER_TOKEN in environment variables.'
  });
};
