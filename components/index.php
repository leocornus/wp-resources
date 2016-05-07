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

    // font-awesome.
    $font_awesome_folder = "{$components_folder}/font-awesome";
    wp_register_style('wprsc-font-awesome',
        plugins_url("{$font_awesome_folder}/css/font-awesome.css"),
        array(), '4.5.0');

    // Galleria.io
    $galleria_folder = "{$components_folder}/galleria";
    wp_register_script('wprsc-galleria-js',
        plugins_url("{$galleria_folder}/galleria-1.4.2.min.js"),
        array('jquery'), '1.4.2');
    wp_register_script('wprsc-galleria-classic-js',
        plugins_url("{$galleria_folder}/themes/classic/galleria.classic.min.js"),
        array('wprsc-galleria-js'), '1.4.2');
}
