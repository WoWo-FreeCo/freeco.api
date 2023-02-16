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
CREATE TABLE `UserActivation` (
    `YouTubeChannelActivated` BOOLEAN NOT NULL DEFAULT false,
    `FacebookGroupActivated` BOOLEAN NOT NULL DEFAULT false,
    `VIPActivated` BOOLEAN NOT NULL DEFAULT false,
    `SVIPActivated` BOOLEAN NOT NULL DEFAULT false,
    `userId` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `UserActivation_userId_key`(`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(191) NULL,
    `cellphone` VARCHAR(15) NOT NULL,
    `telephone` VARCHAR(15) NULL,
    `addressOne` VARCHAR(191) NOT NULL,
    `addressTwo` VARCHAR(191) NULL,
    `addressThree` VARCHAR(191) NULL,
    `taxIDNumber` VARCHAR(18) NULL,
    `rewardCredit` INTEGER NOT NULL,
    `recommendCode` VARCHAR(36) NOT NULL,
    `recommendedBy` VARCHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_recommendCode_key`(`recommendCode`),
    INDEX `User_cellphone_idx`(`cellphone`),
    INDEX `User_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserDailyCheck` ADD CONSTRAINT `UserDailyCheck_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserActivation` ADD CONSTRAINT `UserActivation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
