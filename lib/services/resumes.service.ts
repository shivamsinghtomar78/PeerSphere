import { prisma } from '@/lib/db/prisma';
import { ApiError } from '@/lib/errors/api-error';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// ─── Constants ────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB ?? 5);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Upload a new resume PDF for a student.
 */
export async function uploadResume(
  studentId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number }
) {
  // Validate file type
  if (file.mimetype !== 'application/pdf') {
    throw new ApiError(400, 'INVALID_FILE_TYPE', 'Only PDF files are accepted');
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ApiError(400, 'FILE_TOO_LARGE', `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
  }

  // Generate unique storage key
  const ext = path.extname(file.originalname) || '.pdf';
  const basename = crypto.randomBytes(16).toString('hex');
  const storageKey = `${basename}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storageKey);

  // Write file to disk
  fs.writeFileSync(filePath, file.buffer);

  // Compute SHA-256 checksum
  const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

  // Create database record
  const record = await prisma.resumeVersion.create({
    data: {
      studentId,
      originalName: file.originalname,
      storageKey,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      checksum,
      state: 'UPLOADED',
    },
  });

  // Update student's profileCompleteness if this is their first resume
  const resumeCount = await prisma.resumeVersion.count({
    where: { studentId, deletedAt: null },
  });

  if (resumeCount === 1) {
    // First active resume - recalculate completeness
    await recalculateStudentCompleteness(studentId);
  }

  return {
    ...record,
    checksum,
  };
}

/**
 * List all non-deleted resume versions for a student.
 */
export async function listResumes(studentId: string) {
  return prisma.resumeVersion.findMany({
    where: { studentId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Soft-delete a resume version.
 */
export async function deleteResume(studentId: string, resumeId: string) {
  const resume = await prisma.resumeVersion.findUnique({
    where: { id: resumeId, studentId },
  });

  if (!resume) {
    throw new ApiError(404, 'NOT_FOUND', 'Resume version');
  }

  const deleted = await prisma.resumeVersion.update({
    where: { id: resumeId },
    data: {
      deletedAt: new Date(),
      state: 'DELETED',
    },
  });

  // Check if this was the last active resume
  const activeCount = await prisma.resumeVersion.count({
    where: { studentId, deletedAt: null },
  });

  if (activeCount === 0) {
    // No more active resumes - recalculate completeness
    await recalculateStudentCompleteness(studentId);
  }

  return deleted;
}

/**
 * Get resume file metadata for download.
 */
export async function getResumeFile(studentId: string, resumeId: string) {
  const resume = await prisma.resumeVersion.findUnique({
    where: { id: resumeId, studentId },
  });

  if (!resume) {
    throw new ApiError(404, 'NOT_FOUND', 'Resume version');
  }

  return resume;
}

/**
 * Stream resume file for download.
 */
export function streamResumeFile(filePath: string): NodeJS.ReadableStream {
  return fs.createReadStream(filePath);
}

// ─── Helper: Recalculate student completeness ─────────────────────────────────

async function recalculateStudentCompleteness(studentId: string): Promise<void> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      name: true,
      cgpa: true,
      department: true,
      program: true,
      activeBacklogs: true,
      skillEvidence: { select: { id: true }, take: 1 },
      resumeVersions: {
        where: { deletedAt: null },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!student) return;

  const hasName = Boolean(student.name?.trim());
  const hasCgpa = student.cgpa !== null;
  const hasDepartment = Boolean(student.department?.trim());
  const hasProgram = Boolean(student.program?.trim());
  const hasBacklogsField = student.activeBacklogs !== null;
  const hasSkill = student.skillEvidence.length > 0;
  const hasResume = student.resumeVersions.length > 0;

  const complete =
    hasName && hasCgpa && hasDepartment && hasProgram && hasBacklogsField && hasSkill && hasResume;

  const completeness = complete ? 100 : 0;

  await prisma.student.update({
    where: { id: studentId },
    data: { profileCompleteness: completeness },
  });
}

// ─── File system helpers ────────────────────────────────────────────────────

export function getFilePath(storageKey: string): string {
  return path.join(UPLOAD_DIR, storageKey);
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}
