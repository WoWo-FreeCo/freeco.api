-- AlterTable
ALTER TABLE `User` MODIFY `password` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `GoogleUser` (
    `id` VARCHAR(36) NOT NULL,
    `accountId` VARCHAR(255) NOT NULL,
    `email` VARCHAR(191) NULL,
    `family_name` VARCHAR(255) NULL,
    `given_name` VARCHAR(255) NULL,
    `gsuite_domain` VARCHAR(255) NULL,
    `local` VARCHAR(10) NULL,
    `name` VARCHAR(255) NULL,
    `picture` VARCHAR(255) NULL,
    `status` TINYINT NOT NULL DEFAULT 0,
    `last_login_at` TIMESTAMP(0) NULL,
    `userId` VARCHAR(36) NULL,

    UNIQUE INDEX `GoogleUser_email_key`(`email`),
    UNIQUE INDEX `GoogleUser_userId_key`(`userId`),
    INDEX `GoogleUser_accountId_email_idx`(`accountId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FacebookUser` (
    `id` VARCHAR(36) NOT NULL,
    `asid` VARCHAR(500) NOT NULL,
    `email` VARCHAR(191) NULL,
    `name` VARCHAR(255) NULL,
    `first_name` VARCHAR(255) NULL,
    `last_name` VARCHAR(255) NULL,
    `middle_name` VARCHAR(255) NULL,
    `picture` VARCHAR(255) NULL,
    `status` TINYINT NOT NULL DEFAULT 0,
    `last_login_at` TIMESTAMP(0) NULL,
    `userId` VARCHAR(36) NULL,

    UNIQUE INDEX `FacebookUser_email_key`(`email`),
    UNIQUE INDEX `FacebookUser_userId_key`(`userId`),
    INDEX `FacebookUser_asid_email_idx`(`asid`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GoogleUser` ADD CONSTRAINT `GoogleUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacebookUser` ADD CONSTRAINT `FacebookUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
