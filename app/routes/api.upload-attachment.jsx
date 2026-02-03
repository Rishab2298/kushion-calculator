import { unauthenticated } from "../shopify.server";

/**
 * API endpoint for uploading customer attachments to Shopify's Files CDN.
 *
 * Flow:
 * 1. Receive file from storefront (base64 encoded)
 * 2. Request staged upload URL from Shopify
 * 3. Upload file to staged URL
 * 4. Create file in Shopify's Files
 * 5. Return CDN URL to store as line item property
 *
 * Constraints:
 * - File types: PNG, JPG, JPEG only
 * - Max size: 2MB
 */

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg'];

// Handle CORS preflight requests
export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(),
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
  });
};

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { shop, fileName, fileType, fileData } = body;

    // Validate required fields
    if (!shop || !fileName || !fileType || !fileData) {
      return new Response(JSON.stringify({
        error: "Missing required fields: shop, fileName, fileType, fileData"
      }), {
        status: 400,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(fileType.toLowerCase())) {
      return new Response(JSON.stringify({
        error: "Invalid file type. Only PNG, JPG, and JPEG are allowed."
      }), {
        status: 400,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    // Validate file extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return new Response(JSON.stringify({
        error: "Invalid file extension. Only .png, .jpg, and .jpeg are allowed."
      }), {
        status: 400,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    // Decode base64 and check file size
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    if (fileBuffer.length > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({
        error: "File too large. Maximum size is 2MB."
      }), {
        status: 400,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    // Get the admin context for this shop
    const { admin } = await unauthenticated.admin(shop);

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `cushion-attachment-${timestamp}-${fileName}`;

    // Step 1: Request staged upload URL from Shopify
    console.log(`Requesting staged upload for ${uniqueFileName}...`);

    const stagedUploadResponse = await admin.graphql(
      `#graphql
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: [
            {
              filename: uniqueFileName,
              mimeType: fileType,
              httpMethod: "POST",
              resource: "FILE",
              fileSize: fileBuffer.length.toString(),
            },
          ],
        },
      }
    );

    const stagedResult = await stagedUploadResponse.json();

    if (stagedResult.data?.stagedUploadsCreate?.userErrors?.length > 0) {
      const errors = stagedResult.data.stagedUploadsCreate.userErrors;
      console.error("Staged upload errors:", errors);
      return new Response(JSON.stringify({
        error: "Failed to create upload URL",
        details: errors[0].message
      }), {
        status: 500,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    const stagedTarget = stagedResult.data?.stagedUploadsCreate?.stagedTargets?.[0];
    if (!stagedTarget) {
      return new Response(JSON.stringify({
        error: "Failed to get upload target"
      }), {
        status: 500,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    // Step 2: Upload file to staged URL
    console.log(`Uploading file to staged URL...`);

    const formData = new FormData();

    // Add all parameters from Shopify first
    for (const param of stagedTarget.parameters) {
      formData.append(param.name, param.value);
    }

    // Add the file last
    const blob = new Blob([fileBuffer], { type: fileType });
    formData.append('file', blob, uniqueFileName);

    const uploadResponse = await fetch(stagedTarget.url, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Upload failed:", errorText);
      return new Response(JSON.stringify({
        error: "Failed to upload file to Shopify",
        details: errorText.substring(0, 200)
      }), {
        status: 500,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    // Step 3: Create file in Shopify's Files
    console.log(`Creating file in Shopify Files...`);

    const fileCreateResponse = await admin.graphql(
      `#graphql
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            alt
            createdAt
            ... on MediaImage {
              id
              image {
                url
                originalSrc
              }
            }
            ... on GenericFile {
              id
              url
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          files: [
            {
              alt: `Customer attachment for custom cushion - ${timestamp}`,
              contentType: "IMAGE",
              originalSource: stagedTarget.resourceUrl,
            },
          ],
        },
      }
    );

    const fileResult = await fileCreateResponse.json();

    if (fileResult.data?.fileCreate?.userErrors?.length > 0) {
      const errors = fileResult.data.fileCreate.userErrors;
      console.error("File create errors:", errors);
      return new Response(JSON.stringify({
        error: "Failed to create file in Shopify",
        details: errors[0].message
      }), {
        status: 500,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    const createdFile = fileResult.data?.fileCreate?.files?.[0];

    // Get the URL from the file
    let fileUrl = null;
    if (createdFile?.image?.url) {
      fileUrl = createdFile.image.url;
    } else if (createdFile?.image?.originalSrc) {
      fileUrl = createdFile.image.originalSrc;
    } else if (createdFile?.url) {
      fileUrl = createdFile.url;
    }

    // If no URL yet, poll for it (file processing may take a moment)
    if (!fileUrl && createdFile?.id) {
      console.log("File created but URL not ready, polling...");

      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const pollResponse = await admin.graphql(
          `#graphql
          query getFile($id: ID!) {
            node(id: $id) {
              ... on MediaImage {
                id
                image {
                  url
                  originalSrc
                }
              }
              ... on GenericFile {
                id
                url
              }
            }
          }`,
          {
            variables: { id: createdFile.id }
          }
        );

        const pollResult = await pollResponse.json();
        const node = pollResult.data?.node;

        if (node?.image?.url) {
          fileUrl = node.image.url;
          break;
        } else if (node?.image?.originalSrc) {
          fileUrl = node.image.originalSrc;
          break;
        } else if (node?.url) {
          fileUrl = node.url;
          break;
        }
      }
    }

    if (!fileUrl) {
      // Return the resourceUrl as fallback - it should work
      fileUrl = stagedTarget.resourceUrl;
    }

    console.log(`File uploaded successfully: ${fileUrl}`);

    return new Response(JSON.stringify({
      success: true,
      fileId: createdFile?.id,
      fileUrl: fileUrl,
      fileName: uniqueFileName,
    }), {
      status: 200,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error uploading attachment:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error.message
    }), {
      status: 500,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }
};

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
