import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';

/**
 * @description Creates a unique temporary directory for an analysis session.
 * @param sessionId The unique ID for the session.
 * @returns The path to the created directory.
 */
export const createTempDir = (sessionId: string): string => {
  const dirPath = path.join('uploads', `temp_${sessionId}`);
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
};

/**
 * @description Unzips a project file into a destination directory.
 * @param zipFile The Multer file object for the zip.
 * @param destination The absolute path to unzip into.
 * @returns A promise that resolves with an array of the unzipped file paths.
 */
export const unzipProject = (zipFile: Express.Multer.File, destination: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const filePaths: string[] = [];
    fs.createReadStream(zipFile.path)
      .pipe(unzipper.Parse())
      .on('entry', (entry) => {
        const safePath = path.join(destination, entry.path);
        if (!safePath.startsWith(destination)) {
          console.warn(`[ZipService] Skipped potentially malicious path: ${entry.path}`);
          entry.autodrain();
          return;
        }

        if (entry.type === 'File') {
          filePaths.push(entry.path);
          const dir = path.dirname(safePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          entry.pipe(fs.createWriteStream(safePath));
        } else {
          entry.autodrain();
        }
      })
      .on('finish', () => resolve(filePaths))
      .on('error', reject);
  });
};