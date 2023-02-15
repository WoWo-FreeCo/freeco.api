-- CreateTable
CREATE TABLE `UserDailyCheck` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `userId` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `UserDailyCheck_userId_key`(`userId`),
    INDEX `UserDailyCheck_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRecord` (
    `reward` INTEGER NOT NULL,
    `userId` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `UserRecord_userId_key`(`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserActivity` (
    `isAddedYTChannel` BOOLEAN NOT NULL DEFAULT false,
    `isAddedFBFanGroup` BOOLEAN NOT NULL DEFAULT false,
    `userId` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `UserActivity_userId_key`(`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserAddress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `address` VARCHAR(191) NOT NULL,
    `telephone` VARCHAR(15) NULL,
    `userId` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `UserAddress_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(191) NULL,
    `cellphone` VARCHAR(15) NOT NULL,
    `telephone` VARCHAR(15) NULL,
    `unifiedBusinessNo` VARCHAR(18) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_cellphone_idx`(`cellphone`),
    INDEX `User_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserDailyCheck` ADD CONSTRAINT `UserDailyCheck_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRecord` ADD CONSTRAINT `UserRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserActivity` ADD CONSTRAINT `UserActivity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAddress` ADD CONSTRAINT `UserAddress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
