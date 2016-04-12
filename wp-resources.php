<?php
/**
 * Plugin Name: WordPress Resources Manager 
 * Plugin URI: http://github.com/leocornus/wp-resources
 * Veraion: 0.1
 * Author: Sean Chen <sean.chen@leocorn.com>
 */

// if the file is called directly, abort!
if(!defined('WPINC')) {
    die;
}

$the_plugin_file = __FILE__;
// define some constants, make sure your constants name are unique.
define('WPRSC_PLUGIN_FILE', $the_plugin_file);
define('WPRSC_PLUGIN_PATH', 
       WP_PLUGIN_DIR . '/' . basename(dirname($the_plugin_file)));

// load the web components, include js, css, fonts, etc.
require_once(WPRSC_PLUGIN_PATH . '/components/index.php');
