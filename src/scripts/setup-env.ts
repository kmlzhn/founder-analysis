import fs from 'fs';
import path from 'path';

// Create or update the .env file with required variables
function setupEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  // Read existing .env file if it exists
  let existingEnv = '';
  try {
    existingEnv = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.log('Creating new .env file');
  }

  // Define the variables we want to ensure are set
  const requiredVars = {
    'APIFY_API_TOKEN': 'apify_api_0zdKa3uB4dUDGCuKTlBcFeIMYXN6AD1wMJPQ',
    'LINKEDIN_COOKIES': '', // Empty by default, user needs to fill this
  };

  // Update or add each variable
  let updatedEnv = existingEnv;
  for (const [key, value] of Object.entries(requiredVars)) {
    // Check if variable already exists
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(updatedEnv)) {
      // Variable exists, update it if necessary
      if (value && !updatedEnv.match(regex)[0].includes(value)) {
        updatedEnv = updatedEnv.replace(regex, `${key}=${value}`);
        console.log(`Updated ${key} in .env file`);
      }
    } else {
      // Variable doesn't exist, add it
      updatedEnv += `\n${key}=${value}`;
      console.log(`Added ${key} to .env file`);
    }
  }

  // Write the updated content back to the .env file
  fs.writeFileSync(envPath, updatedEnv.trim() + '\n');
  console.log('.env file has been updated with required variables');
}

// Run the setup
setupEnvFile();
