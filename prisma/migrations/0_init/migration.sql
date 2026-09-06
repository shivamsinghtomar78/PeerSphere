-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PLACEMENT_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "ResumeState" AS ENUM ('UPLOADED', 'QUARANTINED', 'SCANNED', 'EXTRACTING', 'EXTRACTED', 'NEEDS_MANUAL_REVIEW', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'INTERNSHIP', 'CONTRACT');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('ONSITE', 'REMOTE', 'HYBRID');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('HARD', 'SOFT');

-- CreateEnum
CREATE TYPE "EligibilityStatus" AS ENUM ('ELIGIBLE', 'INELIGIBLE', 'CONDITIONAL', 'PENDING');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'REVIEW_REQUIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "SkillMatchState" AS ENUM ('STRONG', 'PARTIAL', 'MISSING');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'OFFER_ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "SkillSource" AS ENUM ('RESUME', 'MANUAL', 'VERIFIED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roll_number" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "cgpa" DECIMAL(4,2),
    "active_backlogs" INTEGER NOT NULL DEFAULT 0,
    "total_backlogs" INTEGER NOT NULL DEFAULT 0,
    "profile_completeness" INTEGER NOT NULL DEFAULT 0,
    "placement_readiness" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "taxonomy_version" TEXT NOT NULL DEFAULT '1.0',
    "aliases" TEXT[],
    "deprecated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_skill_evidence" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "resume_version_id" TEXT,
    "source" "SkillSource" NOT NULL DEFAULT 'MANUAL',
    "evidence_text" TEXT,
    "proficiency" INTEGER,
    "confidence" INTEGER NOT NULL DEFAULT 80,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_skill_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_versions" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "state" "ResumeState" NOT NULL DEFAULT 'UPLOADED',
    "parser_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "resume_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_versions" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "work_mode" "WorkMode" NOT NULL DEFAULT 'HYBRID',
    "job_type" "JobType" NOT NULL DEFAULT 'FULL_TIME',
    "salary" TEXT,
    "description" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "min_cgpa" DECIMAL(4,2),
    "max_backlogs" INTEGER NOT NULL DEFAULT 0,
    "allowed_departments" TEXT[],
    "allowed_programs" TEXT[],
    "application_count" INTEGER NOT NULL DEFAULT 0,
    "shortlisted_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_requirements" (
    "id" TEXT NOT NULL,
    "job_version_id" TEXT NOT NULL,
    "type" "RequirementType" NOT NULL DEFAULT 'SOFT',
    "skill_id" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "label" TEXT NOT NULL,

    CONSTRAINT "job_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "job_version_id" TEXT NOT NULL,
    "input_snapshot" JSONB NOT NULL,
    "snapshot_hash" TEXT NOT NULL,
    "eligibility" "EligibilityStatus" NOT NULL DEFAULT 'PENDING',
    "status" "EvaluationStatus" NOT NULL DEFAULT 'QUEUED',
    "overall_score" INTEGER,
    "confidence_score" INTEGER,
    "coverage_percent" INTEGER,
    "match_summary" TEXT,
    "algorithm_version" TEXT NOT NULL DEFAULT '2.1.0',
    "requires_review" BOOLEAN NOT NULL DEFAULT false,
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_matches" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "skill_id" TEXT,
    "match_state" "SkillMatchState" NOT NULL,
    "contribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "explanation" TEXT,

    CONSTRAINT "requirement_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "skill_name" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "steps" TEXT[],
    "potential_lift" INTEGER,
    "estimated_weeks" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "notes" TEXT,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_overrides" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "request_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_roll_number_key" ON "students"("roll_number");

-- CreateIndex
CREATE UNIQUE INDEX "skills_canonical_name_key" ON "skills"("canonical_name");

-- CreateIndex
CREATE UNIQUE INDEX "student_skill_evidence_student_id_skill_id_key" ON "student_skill_evidence"("student_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "resume_versions_storage_key_key" ON "resume_versions"("storage_key");

-- CreateIndex
CREATE UNIQUE INDEX "job_versions_job_id_version_key" ON "job_versions"("job_id", "version");

-- CreateIndex
CREATE INDEX "evaluations_student_id_created_at_idx" ON "evaluations"("student_id", "created_at");

-- CreateIndex
CREATE INDEX "evaluations_job_version_id_overall_score_idx" ON "evaluations"("job_version_id", "overall_score");

-- CreateIndex
CREATE INDEX "evaluations_snapshot_hash_idx" ON "evaluations"("snapshot_hash");

-- CreateIndex
CREATE INDEX "requirement_matches_match_state_idx" ON "requirement_matches"("match_state");

-- CreateIndex
CREATE INDEX "applications_job_id_status_idx" ON "applications"("job_id", "status");

-- CreateIndex
CREATE INDEX "applications_status_applied_at_idx" ON "applications"("status", "applied_at");

-- CreateIndex
CREATE UNIQUE INDEX "applications_student_id_job_id_key" ON "applications"("student_id", "job_id");

-- CreateIndex
CREATE INDEX "audit_events_resource_type_resource_id_created_at_idx" ON "audit_events"("resource_type", "resource_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_created_at_idx" ON "audit_events"("created_at");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_skill_evidence" ADD CONSTRAINT "student_skill_evidence_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_skill_evidence" ADD CONSTRAINT "student_skill_evidence_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_skill_evidence" ADD CONSTRAINT "student_skill_evidence_resume_version_id_fkey" FOREIGN KEY ("resume_version_id") REFERENCES "resume_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_versions" ADD CONSTRAINT "job_versions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requirements" ADD CONSTRAINT "job_requirements_job_version_id_fkey" FOREIGN KEY ("job_version_id") REFERENCES "job_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requirements" ADD CONSTRAINT "job_requirements_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_job_version_id_fkey" FOREIGN KEY ("job_version_id") REFERENCES "job_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_matches" ADD CONSTRAINT "requirement_matches_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_matches" ADD CONSTRAINT "requirement_matches_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "job_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_matches" ADD CONSTRAINT "requirement_matches_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_overrides" ADD CONSTRAINT "review_overrides_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_overrides" ADD CONSTRAINT "review_overrides_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

