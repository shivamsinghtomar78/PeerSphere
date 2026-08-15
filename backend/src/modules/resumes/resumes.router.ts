import { Router, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer, { FileFilterCallback } from 'multer';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { ApiError } from '../../errors/ApiError';
import { AuthRequest } from '../../types';
import { getStudentByUserId } from '../students/students.service';
import * as resumeService from './resumes.service';

// ─── Constants ────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB ?? 5);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');

// ─── Multer configuration ─────────────────────────────────────────

/**
 * Use memoryStorage so the file buffer is available for SHA-256 checksum
 * computation before we write it to the final destination.
 */
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'INVALID_FILE_TYPE', 'Only PDF files are accepted'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// ─── Router ───────────────────────────────────────────────────────

const router = Router();

// All resume routes are student-only
router.use(authenticate, requireRole('STUDENT'));

/**
 * POST /api/v1/students/me/resumes
 * Upload a new resume PDF.
 */
router.post(
  '/students/me/resumes',
  upload.single('resume'),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(ApiError.unauthorized());
        return;
      }

      if (!req.file) {
        next(ApiError.badRequest('No file uploaded. Use field name "resume".'));
        return;
      }

      const { id: studentId } = await getStudentByUserId(req.user.userId);
      const record = await resumeService.uploadResume(studentId, req.file);

      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/students/me/resumes
 * List all non-deleted resume versions for the authenticated student.
 */
router.get(
  '/students/me/resumes',
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(ApiError.unauthorized());
        return;
      }

      const { id: studentId } = await getStudentByUserId(req.user.userId);
      const resumes = await resumeService.listResumes(studentId);

      res.json({ success: true, data: resumes });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/v1/students/me/resumes/:id
 * Soft-delete a resume version (sets deletedAt + state=DELETED, file stays on disk).
 */
router.delete(
  '/students/me/resumes/:id',
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(ApiError.unauthorized());
        return;
      }

      const { id: studentId } = await getStudentByUserId(req.user.userId);
      const deleted = await resumeService.deleteResume(studentId, req.params.id);

      res.json({ success: true, data: deleted });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/students/me/resumes/:id/download
 * Stream the resume file back with Content-Disposition: attachment.
 */
router.get(
  '/students/me/resumes/:id/download',
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(ApiError.unauthorized());
        return;
      }

      const { id: studentId } = await getStudentByUserId(req.user.userId);
      const resume = await resumeService.getResumeFile(studentId, req.params.id);

      const filePath = path.join(UPLOAD_DIR, resume.storageKey);

      if (!fs.existsSync(filePath)) {
        next(ApiError.notFound('Resume file'));
        return;
      }

      res.setHeader('Content-Type', resume.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(resume.originalName)}"`
      );
      res.setHeader('Content-Length', resume.sizeBytes);

      const stream = fs.createReadStream(filePath);
      stream.on('error', (err) => next(err));
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
