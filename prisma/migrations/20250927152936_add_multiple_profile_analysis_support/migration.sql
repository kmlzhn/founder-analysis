-- AlterTable
ALTER TABLE "public"."Analysis" ADD COLUMN     "analysisContext" TEXT,
ADD COLUMN     "averageScore" INTEGER,
ADD COLUMN     "filesProcessed" INTEGER DEFAULT 0,
ADD COLUMN     "isMultiProfile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedInUrlsFound" INTEGER DEFAULT 0,
ADD COLUMN     "perplexityEnhanced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileAnalyses" JSONB,
ADD COLUMN     "profileSource" TEXT,
ADD COLUMN     "profilesAnalyzed" INTEGER DEFAULT 1,
ADD COLUMN     "totalProfiles" INTEGER;
