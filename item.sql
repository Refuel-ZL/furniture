/*
 Navicat Premium Data Transfer

 Source Server         : localhost_3306
 Source Server Type    : MySQL
 Source Server Version : 50553
 Source Host           : localhost:3306
 Source Schema         : item

 Target Server Type    : MySQL
 Target Server Version : 50553
 File Encoding         : 65001

 Date: 27/12/2017 10:47:00
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for _mysql_session_store
-- ----------------------------
DROP TABLE IF EXISTS `_mysql_session_store`;
CREATE TABLE `_mysql_session_store`  (
  `id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `expires` bigint(20) NULL DEFAULT NULL,
  `data` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `_mysql_session_store__expires`(`expires`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for admininfo
-- ----------------------------
DROP TABLE IF EXISTS `admininfo`;
CREATE TABLE `admininfo`  (
  `u_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `u_password` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  PRIMARY KEY (`u_name`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for orderinfo
-- ----------------------------
DROP TABLE IF EXISTS `orderinfo`;
CREATE TABLE `orderinfo`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pid` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '订单id',
  `fromtime` datetime NOT NULL,
  `entertime` datetime NOT NULL,
  `status` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `category` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `customer` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `endcustomer` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `partstate` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '0' COMMENT '配件',
  `parttime` datetime NULL DEFAULT NULL COMMENT '配件完成时间',
  `partuser` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '配件完成用户',
  PRIMARY KEY (`id`, `pid`) USING BTREE,
  INDEX `pid`(`pid`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 29 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for userinfo
-- ----------------------------
DROP TABLE IF EXISTS `userinfo`;
CREATE TABLE `userinfo`  (
  `userid` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `openid` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `usercreatetime` datetime NOT NULL,
  `usermtime` datetime NOT NULL,
  `workpart` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '0',
  PRIMARY KEY (`userid`) USING BTREE,
  INDEX `opneid`(`openid`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for userworkinfo
-- ----------------------------
DROP TABLE IF EXISTS `userworkinfo`;
CREATE TABLE `userworkinfo`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `userwork` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `level` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `userid`(`userid`) USING BTREE,
  CONSTRAINT `userworkinfo_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `userinfo` (`userid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 170 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for workrecord
-- ----------------------------
DROP TABLE IF EXISTS `workrecord`;
CREATE TABLE `workrecord`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `workstageid` int(11) NOT NULL,
  `recordtime` datetime NOT NULL,
  `kind` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `workstageid`(`workstageid`) USING BTREE,
  INDEX `userid`(`userid`) USING BTREE,
  CONSTRAINT `workrecord_ibfk_2` FOREIGN KEY (`workstageid`) REFERENCES `workstageinfo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `workrecord_ibfk_3` FOREIGN KEY (`userid`) REFERENCES `userinfo` (`userid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for workstageinfo
-- ----------------------------
DROP TABLE IF EXISTS `workstageinfo`;
CREATE TABLE `workstageinfo`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workstage` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `orderinfo` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `index` int(11) NOT NULL,
  `num` int(11) UNSIGNED ZEROFILL NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `workstage`(`workstage`) USING BTREE,
  INDEX `orderinfo`(`orderinfo`) USING BTREE,
  CONSTRAINT `workstageinfo_ibfk_1` FOREIGN KEY (`orderinfo`) REFERENCES `orderinfo` (`pid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 48 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;

SET FOREIGN_KEY_CHECKS = 1;
