-- CreateTable
CREATE TABLE `HomeBanner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `img` VARCHAR(255) NOT NULL,
    `href` VARCHAR(255) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
