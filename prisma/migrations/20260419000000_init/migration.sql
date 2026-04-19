-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'employee',
    "title" TEXT,
    "managerName" TEXT,
    "practice" TEXT,
    "isContractor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_utilization" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "periodType" TEXT NOT NULL DEFAULT 'monthly',
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "monthNumber" INTEGER NOT NULL,
    "quarter" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "targetHours" DOUBLE PRECISION NOT NULL,
    "project" DOUBLE PRECISION NOT NULL,
    "pmn" DOUBLE PRECISION NOT NULL,
    "utilization" DOUBLE PRECISION NOT NULL,
    "fringeImpact" DOUBLE PRECISION NOT NULL,
    "fringe" DOUBLE PRECISION NOT NULL,
    "wPresales" DOUBLE PRECISION NOT NULL,
    "mentor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_utilization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedDate" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "utilization" DOUBLE PRECISION,
    "projectHours" DOUBLE PRECISION,
    "menteeCount" INTEGER,
    "improvement" DOUBLE PRECISION,
    "otherData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badge_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mp_projects" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "deliveryPOC" TEXT NOT NULL,
    "deliveryOwner" TEXT NOT NULL,
    "fmRCNames" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "accountManager" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "techstack" TEXT NOT NULL,
    "salesFolder" TEXT,
    "practice" TEXT NOT NULL,
    "projectTerritory" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mp_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_resources" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_availability" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "currentProject" TEXT NOT NULL,
    "isAvailable" TEXT NOT NULL,
    "tentativeProject" TEXT,
    "availableFrom" TIMESTAMP(3),
    "practice" TEXT NOT NULL,
    "mentor" TEXT,
    "managerName" TEXT NOT NULL,
    "isContractor" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "currentProjectUtilization" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_metadata" (
    "id" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateRange" JSONB,

    CONSTRAINT "upload_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "monthly_utilization_userEmail_idx" ON "monthly_utilization"("userEmail");

-- CreateIndex
CREATE INDEX "monthly_utilization_financialYear_quarter_idx" ON "monthly_utilization"("financialYear", "quarter");

-- CreateIndex
CREATE INDEX "monthly_utilization_date_idx" ON "monthly_utilization"("date");

-- CreateIndex
CREATE INDEX "monthly_utilization_periodType_idx" ON "monthly_utilization"("periodType");

-- CreateIndex
CREATE INDEX "monthly_utilization_fromDate_toDate_idx" ON "monthly_utilization"("fromDate", "toDate");

-- CreateIndex
CREATE INDEX "badge_history_userEmail_idx" ON "badge_history"("userEmail");

-- CreateIndex
CREATE INDEX "badge_history_badgeId_idx" ON "badge_history"("badgeId");

-- CreateIndex
CREATE INDEX "badge_history_earnedDate_idx" ON "badge_history"("earnedDate");

-- CreateIndex
CREATE INDEX "mp_projects_status_idx" ON "mp_projects"("status");

-- CreateIndex
CREATE INDEX "mp_projects_practice_idx" ON "mp_projects"("practice");

-- CreateIndex
CREATE INDEX "mp_projects_region_idx" ON "mp_projects"("region");

-- CreateIndex
CREATE INDEX "mp_projects_startDate_endDate_idx" ON "mp_projects"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "project_resources_projectId_idx" ON "project_resources"("projectId");

-- CreateIndex
CREATE INDEX "project_resources_userId_idx" ON "project_resources"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_resources_projectId_userId_key" ON "project_resources"("projectId", "userId");

-- CreateIndex
CREATE INDEX "employee_availability_userEmail_idx" ON "employee_availability"("userEmail");

-- CreateIndex
CREATE INDEX "employee_availability_isAvailable_idx" ON "employee_availability"("isAvailable");

-- CreateIndex
CREATE INDEX "employee_availability_practice_idx" ON "employee_availability"("practice");

-- CreateIndex
CREATE INDEX "upload_metadata_dataType_idx" ON "upload_metadata"("dataType");

-- CreateIndex
CREATE INDEX "upload_metadata_uploadedAt_idx" ON "upload_metadata"("uploadedAt");

-- AddForeignKey
ALTER TABLE "monthly_utilization" ADD CONSTRAINT "monthly_utilization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_history" ADD CONSTRAINT "badge_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "mp_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_availability" ADD CONSTRAINT "employee_availability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

