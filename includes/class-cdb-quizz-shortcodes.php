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
            '<div class="cdb-quizz-container" data-slug="%s" data-bar-id="%s" data-empleado-id="%s">%s</div>',
            $slug,
            $bar_id,
            $empleado_id,
            esc_html__( 'CdB Quizz placeholder', 'cdb-quizz' )
        );
    }
}
