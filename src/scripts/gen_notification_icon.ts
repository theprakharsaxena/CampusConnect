import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

async function generate() {
  const source = '/Users/prakharsaxena/Downloads/CampusConnectApp/assets/icon/app_icon.png';
  const destDir = '/Users/prakharsaxena/Downloads/CampusConnectApp/android/app/src/main/res/drawable';
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const destPath = path.join(destDir, 'ic_notification.png');
  
  // Resize to standard notification icon size (96x96) and tint all non-transparent pixels to solid white
  await sharp(source)
    .resize(96, 96)
    .tint('#FFFFFF')
    .toFile(destPath);
    
  console.log('Successfully generated ic_notification.png at:', destPath);
}

generate().catch(console.error);
