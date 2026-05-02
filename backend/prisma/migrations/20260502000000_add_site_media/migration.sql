CREATE TYPE "SiteMediaType" AS ENUM ('IMAGE', 'VIDEO');

CREATE TYPE "SiteMediaPlacement" AS ENUM (
  'HERO_BACKGROUND',
  'CATALOG_SUPPORT',
  'ABOUT_SUPPORT',
  'CONTACT_SUPPORT'
);

CREATE TABLE "SiteMedia" (
  "id" TEXT NOT NULL,
  "placement" "SiteMediaPlacement" NOT NULL,
  "type" "SiteMediaType" NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "url" TEXT NOT NULL,
  "posterUrl" TEXT,
  "altText" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SiteMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteMedia_placement_isActive_sortOrder_idx"
  ON "SiteMedia"("placement", "isActive", "sortOrder");
