<?php
/**
 * Installation SQL queries
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Add latitude and longitude columns to ps_address table
 */
$sql = array();

$sql[] = 'ALTER TABLE `' . _DB_PREFIX_ . 'address`
    ADD COLUMN `latitude` DECIMAL(10, 8) NULL DEFAULT NULL AFTER `id_country`,
    ADD COLUMN `longitude` DECIMAL(11, 8) NULL DEFAULT NULL AFTER `latitude`';

foreach ($sql as $query) {
    if (Db::getInstance()->execute($query) == false) {
        return false;
    }
}
