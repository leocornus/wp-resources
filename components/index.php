<?php

// if the file is called directly, abort!
if(!defined('WPINC')) {
    die;
}

/**
 * register web resources.
 */
add_action('init', 'register_web_components');
function register_web_components() {

    // web components folder.
    $components_folder = 'wp-resources/components';

    // register resource for jquery ui theme.
    $ui_theme_folder = "{$components_folder}/jquery-ui/themes";
    // register the jquery ui base theme.
    wp_register_style('wprsc-jquery-ui-base',
        plugins_url("{$ui_theme_folder}/base/jquery-ui.css"),
        array(), '1.11.3');

    // register resources for bootstrap at version 3.3.5
    $bootstrap_folder = "{$components_folder}/bootstrap";
    wp_register_style('wprsc-bootstrap',
        plugins_url("{$bootstrap_folder}/css/bootstrap.css"),
        array(), '3.3.5');
    wp_register_style('wprsc-bootstrap-theme',
        plugins_url("{$bootstrap_folder}/css/bootstrap-theme.css"),
        array('wprsc-bootstrap'), '3.3.5');

    // bootstrap javascript lib
    wp_register_script('wprsc-bootstrap-js',
        plugins_url("{$bootstrap_folder}/js/bootstrap.js"),
        array('jquery'), '3.3.5');

    // jquery ui bootstrap theme.
    $ui_bootstrap_folder = "{$components_folder}/jquery-ui-bootstrap";
    wp_register_style('wprsc-jquery-ui-bootstrap',
        plugins_url("{$ui_bootstrap_folder}/jquery.ui.theme.css"),
        // this depends on bootstrap and ui base theme.
        array('wprsc-bootstrap-theme', 'wprsc-jquery-ui-base'), 
        '0.2.5');
}
