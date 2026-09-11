-- CreateTable
CREATE TABLE "Friend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preferredName" TEXT NOT NULL,
    "legalName" TEXT,
    "nickname" TEXT,
    "photoPath" TEXT,
    "pronouns" TEXT,
    "howWeMet" TEXT NOT NULL,
    "howWeMetNote" TEXT,
    "university" TEXT NOT NULL DEFAULT 'UNSW',
    "campus" TEXT,
    "faculty" TEXT,
    "degreeProgram" TEXT,
    "yearOfStudy" TEXT,
    "expectedGraduationYear" INTEGER,
    "residential" TEXT DEFAULT 'none',
    "collegeName" TEXT,
    "usuallySeeThem" TEXT,
    "relationshipStatus" TEXT NOT NULL DEFAULT 'unknown',
    "openTo" TEXT NOT NULL DEFAULT 'unknown',
    "myIntent" TEXT NOT NULL DEFAULT 'friend',
    "closeness" INTEGER NOT NULL DEFAULT 1,
    "crush" TEXT NOT NULL DEFAULT 'none',
    "crushIntensity" INTEGER,
    "stayInTouchDays" INTEGER,
    "privateNote" TEXT,
    "lastContactedAt" DATETIME,
    "lastSeenInPersonAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContactPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "friendId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    CONSTRAINT "ContactPoint_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Friend" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FriendInterest" (
    "friendId" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,

    PRIMARY KEY ("friendId", "interestId"),
    CONSTRAINT "FriendInterest_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Friend" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FriendInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Society" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FriendSociety" (
    "friendId" TEXT NOT NULL,
    "societyId" TEXT NOT NULL,

    PRIMARY KEY ("friendId", "societyId"),
    CONSTRAINT "FriendSociety_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Friend" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FriendSociety_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FriendCourse" (
    "friendId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    PRIMARY KEY ("friendId", "courseId"),
    CONSTRAINT "FriendCourse_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Friend" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FriendCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "happenedAt" DATETIME NOT NULL,
    "channel" TEXT NOT NULL,
    "hangoutType" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "location" TEXT,
    "vibe" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EventAttendee" (
    "eventId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,

    PRIMARY KEY ("eventId", "friendId"),
    CONSTRAINT "EventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventAttendee_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Friend" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "friendId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Suggestion_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Friend" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Friend_closeness_idx" ON "Friend"("closeness");

-- CreateIndex
CREATE INDEX "Friend_lastContactedAt_idx" ON "Friend"("lastContactedAt");

-- CreateIndex
CREATE INDEX "ContactPoint_friendId_idx" ON "ContactPoint"("friendId");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_name_key" ON "Interest"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Society_name_key" ON "Society"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Course_name_key" ON "Course"("name");

-- CreateIndex
CREATE INDEX "Event_happenedAt_idx" ON "Event"("happenedAt");

-- CreateIndex
CREATE INDEX "EventAttendee_friendId_idx" ON "EventAttendee"("friendId");

-- CreateIndex
CREATE INDEX "Suggestion_friendId_idx" ON "Suggestion"("friendId");

-- CreateIndex
CREATE INDEX "Suggestion_status_idx" ON "Suggestion"("status");
