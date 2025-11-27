<?php
/**
 * Plugin Name:       CdB Quizz
 * Description:       Plugin skeleton for CdB Quizz functionality.
 * Version:           0.1.1
 * Author:            Your Name
 * Text Domain:       cdb-quizz
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! defined( 'CDB_QUIZZ_VERSION' ) ) {
    define( 'CDB_QUIZZ_VERSION', '0.1.1' );
}

if ( ! defined( 'CDB_QUIZZ_PLUGIN_FILE' ) ) {
    define( 'CDB_QUIZZ_PLUGIN_FILE', __FILE__ );
}

if ( ! defined( 'CDB_QUIZZ_PLUGIN_DIR' ) ) {
    define( 'CDB_QUIZZ_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}

if ( ! defined( 'CDB_QUIZZ_PLUGIN_URL' ) ) {
    define( 'CDB_QUIZZ_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
}

require_once CDB_QUIZZ_PLUGIN_DIR . 'includes/class-cdb-quizz-activator.php';
require_once CDB_QUIZZ_PLUGIN_DIR . 'includes/class-cdb-quizz-shortcodes.php';
require_once CDB_QUIZZ_PLUGIN_DIR . 'includes/class-cdb-quizz-gemini.php';
require_once CDB_QUIZZ_PLUGIN_DIR . 'includes/class-cdb-quizz-rest.php';

register_activation_hook( CDB_QUIZZ_PLUGIN_FILE, array( 'CDB_Quizz_Activator', 'activate' ) );

function cdb_quizz_init() {
    new CDB_Quizz_Shortcodes();
    new CDB_Quizz_REST();
}
add_action( 'plugins_loaded', 'cdb_quizz_init' );
