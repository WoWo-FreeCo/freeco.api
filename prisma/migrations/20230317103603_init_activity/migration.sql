-- CreateTable
CREATE TABLE `Activity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `text` LONGTEXT NOT NULL,
    `videoUrls` JSON NOT NULL,
    `answer` VARCHAR(255) NOT NULL,
    `awardee` VARCHAR(255) NOT NULL,
    `startAt` TIMESTAMP(0) NOT NULL,
    `endAt` TIMESTAMP(0) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
