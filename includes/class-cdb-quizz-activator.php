<?php
/**
 * Handles plugin activation tasks.
 */
class CDB_Quizz_Activator {
    /**
     * Run on plugin activation.
     */
    public static function activate() {
        flush_rewrite_rules();
    }
}
