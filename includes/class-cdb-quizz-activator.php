<?php
/**
 * Handles plugin activation tasks.
 */
class CDB_Quizz_Activator {
    /**
     * Run on plugin activation.
     */
    public static function activate() {
        self::create_tables();
        flush_rewrite_rules();
    }

    /**
     * Create necessary database tables for the plugin.
     */
    private static function create_tables() {
        global $wpdb;

        if ( ! defined( 'CDB_QUIZZ_DB_VERSION' ) ) {
            define( 'CDB_QUIZZ_DB_VERSION', '1.0.0' );
        }

        $charset_collate = $wpdb->get_charset_collate();

        $table_perfiles     = "{$wpdb->prefix}cdb_quizz_perfiles";
        $table_definicion   = "{$wpdb->prefix}cdb_quizz_definicion";
        $table_intentos     = "{$wpdb->prefix}cdb_quizz_intentos";
        $table_indicadores  = "{$wpdb->prefix}cdb_quizz_indicadores";

        $tables_sql = array(
            "CREATE TABLE $table_perfiles (
                id BIGINT(20) unsigned NOT NULL AUTO_INCREMENT,
                user_id BIGINT(20) unsigned DEFAULT NULL,
                empleado_id BIGINT(20) unsigned DEFAULT NULL,
                nickname VARCHAR(100) DEFAULT '',
                avatar VARCHAR(100) DEFAULT '',
                xp_total INT(11) NOT NULL DEFAULT 0,
                nivel INT(11) NOT NULL DEFAULT 1,
                badges LONGTEXT NULL,
                historial_resumido LONGTEXT NULL,
                settings LONGTEXT NULL,
                quiz_sources LONGTEXT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                PRIMARY KEY  (id),
                KEY user_id (user_id),
                KEY empleado_id (empleado_id)
            ) $charset_collate;",
            "CREATE TABLE $table_definicion (
                id BIGINT(20) unsigned NOT NULL AUTO_INCREMENT,
                slug VARCHAR(190) NOT NULL,
                titulo VARCHAR(255) NOT NULL,
                descripcion TEXT NULL,
                app_mode VARCHAR(50) NOT NULL,
                default_language VARCHAR(50) DEFAULT NULL,
                default_topic VARCHAR(100) DEFAULT NULL,
                max_preguntas INT(11) NOT NULL DEFAULT 10,
                origen_preguntas VARCHAR(50) NOT NULL DEFAULT 'google_ai_studio',
                config_ia LONGTEXT NULL,
                config_fuentes LONGTEXT NULL,
                activo TINYINT(1) NOT NULL DEFAULT 1,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                PRIMARY KEY  (id),
                UNIQUE KEY slug (slug)
            ) $charset_collate;",
            "CREATE TABLE $table_intentos (
                id BIGINT(20) unsigned NOT NULL AUTO_INCREMENT,
                quizz_definicion_id BIGINT(20) unsigned NOT NULL,
                perfil_id BIGINT(20) unsigned DEFAULT NULL,
                user_id BIGINT(20) unsigned DEFAULT NULL,
                empleado_id BIGINT(20) unsigned DEFAULT NULL,
                bar_id BIGINT(20) unsigned DEFAULT NULL,
                app_mode VARCHAR(50) NOT NULL,
                language VARCHAR(50) DEFAULT NULL,
                topic VARCHAR(100) DEFAULT NULL,
                questions_payload LONGTEXT NULL,
                history LONGTEXT NULL,
                score FLOAT DEFAULT NULL,
                nivel_al_cerrar INT(11) DEFAULT NULL,
                xp_ganada INT(11) DEFAULT 0,
                duracion_segundos INT(11) DEFAULT NULL,
                completado TINYINT(1) NOT NULL DEFAULT 0,
                used_sources LONGTEXT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                PRIMARY KEY  (id),
                KEY quizz_definicion_id (quizz_definicion_id),
                KEY perfil_id (perfil_id),
                KEY empleado_id (empleado_id),
                KEY bar_id (bar_id)
            ) $charset_collate;",
            "CREATE TABLE $table_indicadores (
                id BIGINT(20) unsigned NOT NULL AUTO_INCREMENT,
                intento_id BIGINT(20) unsigned NOT NULL,
                target_tipo VARCHAR(50) NOT NULL,
                target_id BIGINT(20) unsigned NOT NULL,
                codigo_indicador VARCHAR(100) NOT NULL,
                valor FLOAT NOT NULL,
                peso FLOAT NOT NULL DEFAULT 1,
                unidad VARCHAR(20) DEFAULT '',
                metadata LONGTEXT NULL,
                created_at DATETIME NOT NULL,
                PRIMARY KEY  (id),
                KEY intento_id (intento_id),
                KEY target (target_tipo,target_id),
                KEY codigo_indicador (codigo_indicador)
            ) $charset_collate;",
        );

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        foreach ( $tables_sql as $sql ) {
            dbDelta( $sql );
        }

        update_option( 'cdb_quizz_db_version', '1.0.0' );
    }
}
