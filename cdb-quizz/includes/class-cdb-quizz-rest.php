<?php
/**
 * REST API endpoints for CdB Quizz.
 */
class CDB_Quizz_REST {
    /**
     * Hook REST route registration.
     */
    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    /**
     * Register plugin REST routes.
     */
    public function register_routes() {
        register_rest_route(
            'cdb-quizz/v1',
            '/ping',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'handle_ping' ),
                'permission_callback' => '__return_true',
            )
        );
    }

    /**
     * Handle ping endpoint.
     *
     * @param WP_REST_Request $request REST request instance.
     * @return WP_REST_Response
     */
    public function handle_ping( $request ) {
        return rest_ensure_response(
            array(
                'ok'   => true,
                'time' => current_time( 'mysql' ),
            )
        );
    }
}
