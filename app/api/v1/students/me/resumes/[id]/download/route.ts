import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/middleware';
import * as studentsService from '@/lib/services/students.service';
import * as resumesService from '@/lib/services/resumes.service';
import {
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';

// ─── GET /students/me/resumes/:id/download ────────────────────────────────────
// Stream the resume file back with Content-Disposition: attachment.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'STUDENT') {
      return forbiddenError();
    }

    const { id } = await params;
    const student = await studentsService.getStudentByUserId(user.userId);
    if (!student) return notFoundError('Student profile');

    const resume = await resumesService.getResumeFile(student.id, id);
    const filePath = resumesService.getFilePath(resume.storageKey);

    if (!resumesService.fileExists(filePath)) {
      return notFoundError('Resume file');
    }

    // Read the file as a buffer for streaming
    const fileBuffer = await new Promise<Uint8Array>((resolve, reject) => {
      const stream = resumesService.streamResumeFile(filePath);
      const chunks: Uint8Array[] = [];
      stream.on('data', (chunk) => chunks.push(new Uint8Array(chunk)));
      stream.on('end', () => {
        const total = chunks.reduce((sum, c) => sum + c.length, 0);
        const result = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        resolve(result);
      });
      stream.on('error', reject);
    });

    // Create response with file
    const response = new NextResponse(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': resume.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(resume.originalName)}"`,
        'Content-Length': resume.sizeBytes.toString(),
      },
    });

    return response;
  } catch (error: any) {
    if (error.statusCode === 404) {
      return notFoundError(error.message);
    }
    console.error('[RESUMES_DOWNLOAD_ERROR]', error);
    return internalError();
  }
}
