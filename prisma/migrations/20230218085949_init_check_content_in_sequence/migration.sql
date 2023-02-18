-- CreateTable
CREATE TABLE `CheckContentInSequence` (
    `index` INTEGER UNSIGNED NOT NULL,
    `video` VARCHAR(191) NULL,
    `credit` INTEGER NOT NULL,
    `isMission` BOOLEAN NOT NULL,

    PRIMARY KEY (`index`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
