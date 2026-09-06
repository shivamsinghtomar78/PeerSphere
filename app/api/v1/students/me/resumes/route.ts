import { NextRequest } from 'next/server';
import { getAuthUser } from '@/middleware';
import * as studentsService from '@/lib/services/students.service';
import * as resumesService from '@/lib/services/resumes.service';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';

// ─── GET /students/me/resumes ───────────────────────────────────────────────
// List all non-deleted resume versions for the authenticated student.

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'STUDENT') {
      return forbiddenError();
    }

    const student = await studentsService.getStudentByUserId(user.userId);
    if (!student) return notFoundError('Student profile');

    const resumes = await resumesService.listResumes(student.id);
    return successResponse(resumes);
  } catch (error: any) {
    console.error('[RESUMES_GET_ERROR]', error);
    return internalError();
  }
}

// ─── POST /students/me/resumes ──────────────────────────────────────────────
// Upload a new resume PDF.
// Note: In Next.js API routes, we handle file uploads differently than Express.
// For simplicity, we'll use base64-encoded file data from the client.

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'STUDENT') {
      return forbiddenError();
    }

    const student = await studentsService.getStudentByUserId(user.userId);
    if (!student) return notFoundError('Student profile');

    // Parse form data or JSON body
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return badRequestError('No file uploaded. Use field name "resume".');
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return badRequestError('Only PDF files are accepted');
    }

    // Validate file size (5MB limit)
    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return badRequestError('File size exceeds 5MB limit');
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    const record = await resumesService.uploadResume(student.id, {
      buffer,
      originalname: file.name,
      mimetype: file.type,
      size: file.size,
    });

    return successResponse(record, undefined, 201);
  } catch (error: any) {
    if (error.statusCode === 400) {
      return badRequestError(error.message);
    }
    if (error.statusCode === 404) {
      return notFoundError(error.message);
    }
    console.error('[RESUMES_POST_ERROR]', error);
    return internalError();
  }
}
