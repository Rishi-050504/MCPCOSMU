// import { Request, Response } from 'express';
// import fsExtra from 'fs-extra';
// import path from 'path';
// import archiver from 'archiver';
// import { v4 as uuidv4 } from 'uuid';
// import { generateChecklistFromSrs, analyzeProjectWithAgent } from '../services/geminiService';
// import { createTempDir, unzipProject } from '../services/zipService';
// import { FilesystemMcp } from '../mcp/filesystem.service';

// // In-memory store for active analysis sessions.
// const activeSessions: Record<string, { tempDir: string }> = {};

// /**
//  * @description Handles SRS file upload and generates a compliance checklist.
//  */
// export const generateChecklist = async (req: Request, res: Response) => {
//   const files = (req.files as { [fieldname: string]: Express.Multer.File[] })?.srs;
  
//   if (!files || files.length === 0) {
//     return res.status(400).json({ message: "SRS file(s) are required." });
//   }

//   try {
//     const checklist = await generateChecklistFromSrs(files);
//     res.status(200).json({ checklist });
//   } catch (error: any) {
//     res.status(500).json({ message: "Failed to generate checklist.", error: error.message });
//   } finally {
//     files.forEach(file => fsExtra.remove(file.path).catch(console.error));
//   }
// };

// /**
//  * @description Handles project zip upload, creates a session, and analyzes code.
//  */
// export const analyzeCode = async (req: Request, res: Response) => {
//   const projectZip = (req.files as any)?.project?.[0];
//   const checklist = req.body.checklist ? JSON.parse(req.body.checklist) : null;

//   if (!projectZip || !checklist) {
//     return res.status(400).json({ message: "A project ZIP file and a checklist are required." });
//   }
  
//   const sessionId = uuidv4();
//   const tempDir = createTempDir(sessionId);
//   activeSessions[sessionId] = { tempDir };

//   try {
//     await unzipProject(projectZip, tempDir);
//     const filesystemMcp = new FilesystemMcp(tempDir);
//     // Note: We will update geminiService in the next step. For now, this is the correct call.
//     const analysisResult = await analyzeProjectWithAgent(filesystemMcp, checklist);
    
//     res.status(200).json({ ...analysisResult, sessionId });

//   } catch (error: any) {
//     console.error("Error in analyzeCode controller:", error);
//     res.status(500).json({ message: "An internal server error during analysis.", error: error.message });
//     fsExtra.remove(tempDir).catch(console.error);
//     delete activeSessions[sessionId];
//   } finally {
//     if (projectZip) {
//       fsExtra.remove(projectZip.path).catch(console.error);
//     }
//   }
// };

// /**
//  * @description Updates a single file in a specific session's directory.
//  */
// export const updateFile = async (req: Request, res: Response) => {
//   const { filePath, newContent, sessionId } = req.body;
  
//   if (!sessionId || !filePath || typeof newContent !== 'string') {
//     return res.status(400).send({ message: "Session ID, file path, and new content are required." });
//   }

//   const session = activeSessions[sessionId];
//   if (!session) {
//     return res.status(404).send({ message: "Session not found or expired." });
//   }

//   try {
//     const filesystemMcp = new FilesystemMcp(session.tempDir);
//     await filesystemMcp.writeFile(filePath, newContent); 
//     res.status(200).send({ message: "File updated successfully." });
//   } catch (error: any) {
//     console.error("Error updating file:", error);
//     res.status(500).send({ message: `Failed to update file: ${error.message}` });
//   }
// };

// /**
//  * @description Zips and sends the refactored project for a specific session.
//  */
// export const downloadProject = async (req: Request, res: Response) => {
//   const sessionId = req.query.sessionId as string;
//   if (!sessionId) {
//     return res.status(400).send({ message: "Session ID is required." });
//   }

//   const session = activeSessions[sessionId];
//   if (!session || !fsExtra.existsSync(session.tempDir)) {
//     return res.status(404).send({ message: "No project found or session expired." });
//   }

//   res.attachment('refactored-project.zip');
//   const archive = archiver('zip', { zlib: { level: 9 } });

//   archive.on('error', (err) => res.status(500).send({ error: err.message }));
//   archive.pipe(res);
//   archive.directory(session.tempDir, false);
  
//   await archive.finalize();

//   fsExtra.remove(session.tempDir).catch(console.error);
//   delete activeSessions[sessionId];
// };
import { Request, Response } from 'express';
import fsExtra from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
// Corrected: Import 'analyzeProject' which now exists in geminiService
import { generateChecklistFromSrs, analyzeProject } from '../services/geminiService';
import { createTempDir, unzipProject } from '../services/zipService';
import { FilesystemMcp } from '../mcp/filesystem.service';

const activeSessions: Record<string, { tempDir: string }> = {};

/**
 * @description Handles SRS file upload and generates a compliance checklist.
 */
export const generateChecklist = async (req: Request, res: Response) => {
  const files = (req.files as { [fieldname: string]: Express.Multer.File[] })?.srs;

  if (!files || files.length === 0) {
    return res.status(400).json({ message: "SRS file(s) are required." });
  }

  try {
    const checklist = await generateChecklistFromSrs(files);
    res.status(200).json({ checklist });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to generate checklist.", error: error.message });
  } finally {
    files.forEach(file => fsExtra.remove(file.path).catch(console.error));
  }
};

/**
 * @description Handles project zip upload, creates a session, and analyzes code.
 */
export const analyzeCode = async (req: Request, res: Response) => {
  const projectZip = (req.files as any)?.project?.[0];
  const checklist = req.body.checklist ? JSON.parse(req.body.checklist) : null;

  if (!projectZip || !checklist) {
    return res.status(400).json({ message: "A project ZIP file and a checklist are required." });
  }

  const sessionId = uuidv4();
  const tempDir = createTempDir(sessionId);
  activeSessions[sessionId] = { tempDir };

  try {
    await unzipProject(projectZip, tempDir);
    const filesystemMcp = new FilesystemMcp(tempDir);
    const fileContents = await filesystemMcp.getAllFileContents();

    // Corrected: Call the new 'analyzeProject' function
    const analysisResult = await analyzeProject(fileContents, checklist);
    
    res.status(200).json({ ...analysisResult, sessionId });

  } catch (error: any) {
    console.error("Error in analyzeCode controller:", error);
    res.status(500).json({ message: "An internal server error during code analysis.", error: error.message });
    fsExtra.remove(tempDir).catch(console.error);
    delete activeSessions[sessionId];
  } finally {
    if (projectZip) {
      fsExtra.remove(projectZip.path).catch(console.error);
    }
  }
};

/**
 * @description Updates a single file in a specific session's directory.
 */
export const updateFile = async (req: Request, res: Response) => {
  const { filePath, newContent, sessionId } = req.body;

  if (!sessionId || !filePath || typeof newContent !== 'string') {
    return res.status(400).send({ message: "Session ID, file path, and new content are required." });
  }

  const session = activeSessions[sessionId];
  if (!session) {
    return res.status(404).send({ message: "Session not found or expired." });
  }

  try {
    const filesystemMcp = new FilesystemMcp(session.tempDir);
    await filesystemMcp.writeFile(filePath, newContent);
    res.status(200).send({ message: "File updated successfully." });
  } catch (error: any) {
    console.error("Error updating file:", error);
    res.status(500).send({ message: `Failed to update file: ${error.message}` });
  }
};

/**
 * @description Zips and sends the refactored project for a specific session.
 */
export const downloadProject = async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    return res.status(400).send({ message: "Session ID is required." });
  }

  const session = activeSessions[sessionId];
  if (!session || !fsExtra.existsSync(session.tempDir)) {
    return res.status(404).send({ message: "No project found to download or session expired." });
  }

  res.attachment('refactored-project.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err) => res.status(500).send({ error: err.message }));
  archive.pipe(res);
  archive.directory(session.tempDir, false);

  await archive.finalize();

  fsExtra.remove(session.tempDir).catch(console.error);
  delete activeSessions[sessionId];
};