import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { ResumeVersion } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../errors/ApiError';

/**
 * Base directory for resume file storage.
 * Defaults to <project-root>/uploads when UPLOAD_DIR is not set.
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');

/**
 * Upload a resume file for a student.
 *
 * Steps:
 *  1. Build a unique storage key under resumes/<studentId>/<uuid><ext>
 *  2. Compute SHA-256 checksum from the in-memory buffer (multer memoryStorage)
 *  3. Write the buffer to UPLOAD_DIR/<storageKey>, creating any missing directories
 *  4. Persist a ResumeVersion record with state = UPLOADED
 */
export async function uploadResume(
  studentId: string,
  file: Express.Multer.File
): Promise<ResumeVersion> {
  const ext = path.extname(file.originalname);
  const storageKey = `resumes/${studentId}/${uuidv4()}${ext}`;

  // Compute SHA-256 checksum of the in-memory buffer
  const checksum = crypto
    .createHash('sha256')
    .update(file.buffer)
    .digest('hex');

  // Resolve the absolute destination path and ensure the directory exists
  const destPath = path.join(UPLOAD_DIR, storageKey);
  const destDir = path.dirname(destPath);
  fs.mkdirSync(destDir, { recursive: true });

  // Write the buffer to disk
  fs.writeFileSync(destPath, file.buffer);

  // Persist the record
  const record = await prisma.resumeVersion.create({
    data: {
      studentId,
      storageKey,
      originalName: file.originalname,
      checksum,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      state: 'UPLOADED',
    },
  });

  return record;
}

/**
 * List all non-deleted resume versions for a student, newest first.
 */
export async function listResumes(studentId: string): Promise<ResumeVersion[]> {
  return prisma.resumeVersion.findMany({
    where: {
      studentId,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Soft-delete a resume version.
 *
 * Verifies the record belongs to the given student before marking it deleted.
 * The physical file is intentionally left on disk for audit purposes.
 */
export async function deleteResume(
  studentId: string,
  resumeId: string
): Promise<ResumeVersion> {
  const resume = await prisma.resumeVersion.findUnique({
    where: { id: resumeId },
  });

  if (!resume || resume.deletedAt !== null) {
    throw ApiError.notFound('Resume');
  }

  if (resume.studentId !== studentId) {
    throw ApiError.forbidden();
  }

  return prisma.resumeVersion.update({
    where: { id: resumeId },
    data: {
      deletedAt: new Date(),
      state: 'DELETED',
    },
  });
}

/**
 * Retrieve a (non-deleted) resume version for file serving.
 *
 * Returns the full record so the router can read `storageKey` and stream the
 * file back to the client.
 */
export async function getResumeFile(
  studentId: string,
  resumeId: string
): Promise<ResumeVersion> {
  const resume = await prisma.resumeVersion.findUnique({
    where: { id: resumeId },
  });

  if (!resume || resume.deletedAt !== null) {
    throw ApiError.notFound('Resume');
  }

  if (resume.studentId !== studentId) {
    throw ApiError.forbidden();
  }

  return resume;
}
