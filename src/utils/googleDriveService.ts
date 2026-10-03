export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  trashed?: boolean;
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3/files';

/**
 * List files from Google Drive
 */
export async function listDriveFiles(
  accessToken: string,
  options: {
    query?: string;
    folderId?: string;
    pageSize?: number;
    pageToken?: string;
  } = {}
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const { query, folderId, pageSize = 25, pageToken } = options;

  const queryParts = ['trashed = false'];

  if (folderId) {
    queryParts.push(`'${folderId}' in parents`);
  }

  if (query && query.trim()) {
    const escaped = query.replace(/'/g, "\\'");
    queryParts.push(`name contains '${escaped}'`);
  }

  const q = encodeURIComponent(queryParts.join(' and '));
  const fields = encodeURIComponent(
    'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink, parents, trashed)'
  );

  let url = `${DRIVE_API_BASE}/files?q=${q}&fields=${fields}&pageSize=${pageSize}&orderBy=modifiedTime desc`;
  if (pageToken) {
    url += `&pageToken=${encodeURIComponent(pageToken)}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list Google Drive files: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return {
    files: data.files || [],
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Get or create a dedicated app folder in Google Drive
 */
export async function getOrCreateAppFolder(
  accessToken: string,
  folderName = 'FreshKeep Health & Pantry'
): Promise<string> {
  // Check if folder already exists
  const q = encodeURIComponent(
    `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await fetch(`${DRIVE_API_BASE}/files?q=${q}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create folder
  const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    throw new Error('Failed to create folder in Google Drive');
  }

  const created = await createRes.json();
  return created.id;
}

/**
 * Upload a text, json, or markdown file to Google Drive using multipart upload
 */
export async function uploadTextFileToDrive(
  accessToken: string,
  options: {
    name: string;
    content: string;
    mimeType?: string;
    folderId?: string;
  }
): Promise<DriveFile> {
  const { name, content, mimeType = 'text/plain', folderId } = options;

  const metadata: any = {
    name,
    mimeType,
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------FreshKeepBoundary' + Date.now().toString(16);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch(
    `${DRIVE_UPLOAD_BASE}?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to upload file to Google Drive: ${err}`);
  }

  return await res.json();
}

/**
 * Download text / json content of a file from Google Drive
 */
export async function downloadDriveFileContent(
  accessToken: string,
  fileId: string
): Promise<string> {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to download file content from Google Drive (${res.status})`);
  }

  return await res.text();
}

/**
 * Delete a file from Google Drive (DESTRUCTIVE OPERATION - Must have UI confirmation first)
 */
export async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete Google Drive file (${res.status})`);
  }
}

/**
 * Backup full app state (pantry items, medications, custom recipes) to Google Drive
 */
export async function backupAppDataToDrive(
  accessToken: string,
  data: {
    foodItems: any[];
    medications: any[];
    customRecipes?: any[];
  }
): Promise<DriveFile> {
  const folderId = await getOrCreateAppFolder(accessToken);
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const fileName = `FreshKeep_Backup_${dateStr}_${timeStr}.json`;

  const payload = {
    app: 'Health+Online FreshKeep',
    version: '1.0',
    exportDate: new Date().toISOString(),
    totalFoodItems: data.foodItems.length,
    totalMedications: data.medications.length,
    foodItems: data.foodItems,
    medications: data.medications,
    customRecipes: data.customRecipes || [],
  };

  const content = JSON.stringify(payload, null, 2);

  return await uploadTextFileToDrive(accessToken, {
    name: fileName,
    content,
    mimeType: 'application/json',
    folderId,
  });
}

/**
 * Save a formatted Recipe Document into the user's Google Drive
 */
export async function saveRecipeToDrive(
  accessToken: string,
  recipe: any
): Promise<DriveFile> {
  const folderId = await getOrCreateAppFolder(accessToken);
  const cleanTitle = (recipe.title || 'Recipe').replace(/[^a-zA-Z0-9_\- ]/g, '');
  const fileName = `${cleanTitle}.md`;

  let content = `# ${recipe.title}\n\n`;
  content += `> ${recipe.description || 'Pantry healthy recipe'}\n\n`;
  content += `## Quick Overview\n`;
  content += `- **Prep Time:** ${recipe.prepTime || 'N/A'}\n`;
  content += `- **Cook Time:** ${recipe.cookTime || 'N/A'}\n`;
  content += `- **Servings:** ${recipe.servings || 2}\n`;
  content += `- **Calories:** ${recipe.caloriesPerServing || 'N/A'} kcal\n`;
  if (recipe.macros) {
    content += `- **Macros:** Protein: ${recipe.macros.protein}, Carbs: ${recipe.macros.carbs}, Fat: ${recipe.macros.fat}, Fiber: ${recipe.macros.fiber}\n`;
  }
  content += `\n## Ingredients\n`;
  if (recipe.ingredientsRequired && Array.isArray(recipe.ingredientsRequired)) {
    recipe.ingredientsRequired.forEach((ing: any) => {
      content += `- [x] **${ing.amount}** ${ing.name} ${ing.inPantry ? '(From Pantry)' : '(Needed)'}\n`;
      if (ing.substitute) {
        content += `  - *Substitute:* ${ing.substitute}\n`;
      }
    });
  }

  content += `\n## Step-by-Step Instructions\n`;
  if (recipe.instructions && Array.isArray(recipe.instructions)) {
    recipe.instructions.forEach((step: string, idx: number) => {
      content += `${idx + 1}. ${step}\n`;
    });
  }

  if (recipe.healthBenefits) {
    content += `\n## Health Benefits\n${recipe.healthBenefits}\n`;
  }
  if (recipe.rotPreventionTip) {
    content += `\n## Food Rot Prevention Tip\n${recipe.rotPreventionTip}\n`;
  }
  if (recipe.recipeUrl) {
    content += `\n## Online Reference\n[Full Recipe Link](${recipe.recipeUrl})\n`;
  }

  return await uploadTextFileToDrive(accessToken, {
    name: fileName,
    content,
    mimeType: 'text/markdown',
    folderId,
  });
}

/**
 * Save Medication & Schedule Summary to Google Drive
 */
export async function saveMedicationScheduleToDrive(
  accessToken: string,
  medications: any[]
): Promise<DriveFile> {
  const folderId = await getOrCreateAppFolder(accessToken);
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `My_Medication_Schedule_${dateStr}.md`;

  let content = `# 💊 My Daily Medication & Supplement Schedule\n`;
  content += `*Generated by Health+Online on ${dateStr}*\n\n`;

  medications.forEach((m, idx) => {
    content += `### ${idx + 1}. ${m.name} (${m.dosage})\n`;
    content += `- **Purpose:** ${m.purpose}\n`;
    content += `- **Scheduled Times:** ${m.times?.join(', ')} ${m.specificTimes ? `(${m.specificTimes.join(', ')})` : ''}\n`;
    content += `- **Food Rule:** ${m.foodRule === 'with_meal' ? '⚠️ Take with a meal' : m.foodRule === 'empty_stomach' ? '⚠️ Take on an empty stomach' : 'Anytime'}\n`;
    content += `- **Doctor Instructions:** ${m.doctorInstructions || 'None specified'}\n`;
    content += `- **Remaining Pills:** ${m.pillsRemaining} of ${m.totalPills}\n\n`;
  });

  return await uploadTextFileToDrive(accessToken, {
    name: fileName,
    content,
    mimeType: 'text/markdown',
    folderId,
  });
}
