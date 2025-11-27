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

        register_rest_route(
            'cdb-quizz/v1',
            '/generate',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'handle_generate' ),
                'permission_callback' => '__return_true',
            )
        );

        register_rest_route(
            'cdb-quizz/v1',
            '/finish',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'handle_finish' ),
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

    /**
     * Handle generate endpoint.
     *
     * @param WP_REST_Request $request REST request instance.
     * @return WP_REST_Response
     */
    public function handle_generate( WP_REST_Request $request ) {
        $slug      = $request->get_param( 'slug' );
        $questions = array(
            array(
                'id'             => 'q1',
                'questionText'   => 'What is the capital of France?',
                'options'        => array( 'Paris', 'Berlin', 'Madrid', 'Rome' ),
                'correctAnswer'  => 'Paris',
                'explanation'    => 'Paris is the capital and most populous city of France.',
                'difficulty'     => 'easy',
            ),
            array(
                'id'             => 'q2',
                'questionText'   => 'Which planet is known as the Red Planet?',
                'options'        => array( 'Earth', 'Mars', 'Jupiter', 'Saturn' ),
                'correctAnswer'  => 'Mars',
                'explanation'    => 'Mars is often called the “Red Planet” because of its reddish appearance.',
                'difficulty'     => 'medium',
            ),
            array(
                'id'             => 'q3',
                'questionText'   => 'In which year did the World War II end?',
                'options'        => array( '1940', '1942', '1945', '1948' ),
                'correctAnswer'  => '1945',
                'explanation'    => 'World War II ended in 1945 with the surrender of the Axis powers.',
                'difficulty'     => 'medium',
            ),
        );

        $response = array(
            'ok'        => true,
            'slug'      => $slug,
            'questions' => $questions,
        );

        return rest_ensure_response( $response );
    }

    /**
     * Handle finish endpoint.
     *
     * @param WP_REST_Request $request REST request instance.
     * @return WP_REST_Response|WP_Error
     */
    public function handle_finish( WP_REST_Request $request ) {
        global $wpdb;

        $table    = $wpdb->prefix . 'cdb_quizz_intentos';
        $slug     = $request->get_param( 'slug' );
        $score    = $request->get_param( 'score' );
        $questions = $request->get_param( 'questions' );
        $history   = $request->get_param( 'history' );
        $app_mode  = $request->get_param( 'app_mode' );

        $quizz_definicion_id = 0;

        if ( ! empty( $slug ) ) {
            $quizz_definicion_id = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT id FROM {$wpdb->prefix}cdb_quizz_definicion WHERE slug = %s LIMIT 1",
                    $slug
                )
            );
        }

        $inserted = $wpdb->insert(
            $table,
            array(
                'quizz_definicion_id' => $quizz_definicion_id,
                'user_id'             => get_current_user_id(),
                'app_mode'            => $app_mode ? $app_mode : 'CULTURA',
                'questions_payload'   => wp_json_encode( $questions ),
                'history'             => wp_json_encode( $history ),
                'score'               => $score,
                'completado'          => 1,
                'created_at'          => current_time( 'mysql' ),
                'updated_at'          => current_time( 'mysql' ),
            ),
            array( '%d', '%d', '%s', '%s', '%s', '%f', '%d', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'cdb_quizz_insert_failed', __( 'Failed to save attempt.', 'cdb-quizz' ) );
        }

        $response = array(
            'ok'         => true,
            'intento_id' => (int) $wpdb->insert_id,
        );

        return rest_ensure_response( $response );
    }
}
