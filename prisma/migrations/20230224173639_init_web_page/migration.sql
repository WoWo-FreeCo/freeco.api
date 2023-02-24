-- CreateTable
CREATE TABLE `WebPage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- InsertData
INSERT INTO `WebPage` (`name`, `content`, `createdAt`, `updatedAt`) VALUES ('關於我們', '', NOW(), NOW());
INSERT INTO `WebPage` (`name`, `content`, `createdAt`, `updatedAt`) VALUES ('常見問題', '', NOW(), NOW());
INSERT INTO `WebPage` (`name`, `content`, `createdAt`, `updatedAt`) VALUES ('退換貨說明', '', NOW(), NOW());
