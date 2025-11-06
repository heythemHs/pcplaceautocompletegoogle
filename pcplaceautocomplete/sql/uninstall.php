<?php
/**
 * Uninstallation SQL queries
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Remove latitude and longitude columns from ps_address table
 */
$sql = array();

$sql[] = 'ALTER TABLE `' . _DB_PREFIX_ . 'address`
    DROP COLUMN `latitude`,
    DROP COLUMN `longitude`';

foreach ($sql as $query) {
    if (Db::getInstance()->execute($query) == false) {
        return false;
    }
}
