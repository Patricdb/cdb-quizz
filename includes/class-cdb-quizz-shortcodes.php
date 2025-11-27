<?php
/**
 * Shortcode definitions for CdB Quizz.
 */
class CDB_Quizz_Shortcodes {
    /**
     * Register hooks.
     */
    public function __construct() {
        add_shortcode( 'cdb_quizz', array( $this, 'render_quizz' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
    }

    /**
     * Enqueue frontend assets for the shortcode.
     */
    public function enqueue_assets() {
        wp_register_style(
            'cdb-quizz-frontend',
            CDB_QUIZZ_PLUGIN_URL . 'assets/css/cdb-quizz-frontend.css',
            array(),
            CDB_QUIZZ_VERSION
        );

        wp_enqueue_style( 'cdb-quizz-frontend' );

        wp_register_script(
            'cdb-quizz-frontend',
            CDB_QUIZZ_PLUGIN_URL . 'assets/js/cdb-quizz-frontend.js',
            array(),
            CDB_QUIZZ_VERSION,
            true
        );

        wp_localize_script(
            'cdb-quizz-frontend',
            'cdbQuizzSettings',
            array(
                'restUrl' => esc_url_raw( rest_url() ),
            )
        );

        wp_enqueue_script( 'cdb-quizz-frontend' );
    }

    /**
     * Render the CdB Quizz container.
     *
     * @param array  $atts Shortcode attributes.
     * @param string $content Shortcode content.
     * @return string
     */
    public function render_quizz( $atts, $content = '' ) {
        $atts = shortcode_atts(
            array(
                'slug'        => '',
                'bar_id'      => '',
                'empleado_id' => '',
            ),
            $atts,
            'cdb_quizz'
        );

        $slug        = esc_attr( $atts['slug'] );
        $bar_id      = esc_attr( $atts['bar_id'] );
        $empleado_id = esc_attr( $atts['empleado_id'] );

        return sprintf(
            '<div class="cdb-quizz-container" data-slug="%s" data-bar-id="%s" data-empleado-id="%s"></div>',
            $slug,
            $bar_id,
            $empleado_id
        );
    }
}
