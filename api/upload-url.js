
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize R2 Client
const R2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(request, response) {
  // CORS Handling (Optional if Vercel handles it, but good safety)
  if (request.method === 'OPTIONS') {
    return response.status(200).send('OK');
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileType } = request.body || {}; // Vercel parses body automatically? dependent on settings usually yes for functions
    
    if(!fileName || !fileType) {
         // Fallback for body parsing if needed, but assuming standard Vercel function behavior
         if(!request.body) return response.status(400).json({ error: 'Missing body' });
    }

    // Use the provided fileName (shortId.ext) directly to keep URLs short
    // Frontend ensures uniqueness via random ID
    const uniqueFileName = fileName;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileType,
    });

    // Generate the "Permission Slip" (valid for 60 seconds only)
    const signedUrl = await getSignedUrl(R2, command, { expiresIn: 60 });

    return response.status(200).json({ 
      uploadUrl: signedUrl, 
      fileName: uniqueFileName 
    });

  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'Failed to create upload URL', details: error.message });
  }
}
