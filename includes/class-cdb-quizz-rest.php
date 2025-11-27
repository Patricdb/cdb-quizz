<?php
/**
 * REST API endpoints for CdB Quizz.
 */
class CDB_Quizz_REST {
    /**
     * Returns the default mock questions used when Gemini or DB are not available.
     *
     * @return array
     */
    private function get_mock_questions() {
        return array(
            array(
                'id'            => 'q1',
                'questionText'  => 'What is the capital of France?',
                'options'       => array( 'Paris', 'Berlin', 'Madrid', 'Rome' ),
                'correctAnswer' => 'Paris',
                'explanation'   => 'Paris is the capital and most populous city of France.',
                'difficulty'    => 'easy',
            ),
            array(
                'id'            => 'q2',
                'questionText'  => 'Which planet is known as the Red Planet?',
                'options'       => array( 'Earth', 'Mars', 'Jupiter', 'Saturn' ),
                'correctAnswer' => 'Mars',
                'explanation'   => 'Mars is often called the “Red Planet” because of its reddish appearance.',
                'difficulty'    => 'medium',
            ),
            array(
                'id'            => 'q3',
                'questionText'  => 'In which year did the World War II end?',
                'options'       => array( '1940', '1942', '1945', '1948' ),
                'correctAnswer' => '1945',
                'explanation'   => 'World War II ended in 1945 with the surrender of the Axis powers.',
                'difficulty'    => 'medium',
            ),
        );
    }

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
     * Expected parameters (POST):
     * - slug (string, required): quiz identifier used to fetch the quizz_definicion record. Defaults to "demo" when empty.
     *
     * Response contract (always HTTP 200 with ok => true and at least mock questions):
     * - ok (bool): true when the request is processed.
     * - slug (string): slug received/normalized.
     * - quizz_definicion_id (int|null): definition id if found, otherwise null.
     * - app_mode (string): app mode resolved (from DB or default CULTURA).
     * - language (string): language code resolved (from DB or default es).
     * - topic (string|null): topic resolved or null when not set.
     * - source (string): 'gemini' when AI payload is valid, otherwise 'mock'.
     * - questions (array): list of associative arrays with the normalized quiz questions.
     *
     * Example response array:
     * array(
     *   'ok'                  => true, // Always true even if using fallback.
     *   'slug'                => 'demo',
     *   'quizz_definicion_id' => 12, // Null when slug is not in DB.
     *   'app_mode'            => 'CULTURA',
     *   'language'            => 'es',
     *   'topic'               => 'Concepto CdB',
     *   'source'              => 'gemini', // Or 'mock' when Gemini is unavailable/invalid.
     *   'questions'           => array(
     *       array(
     *           'id'            => 'q1',
     *           'questionText'  => 'Pregunta en el idioma solicitado',
     *           'options'       => array( 'Opción A', 'Opción B', 'Opción C', 'Opción D' ),
     *           'correctAnswer' => 'Opción A',
     *           'explanation'   => 'Explicación breve',
     *           'difficulty'    => 'easy',
     *           'tags'          => array( 'tag1', 'tag2' ),
     *       ),
     *   ),
     * );
     *
     * Notes:
     * - If there is no definition for the slug or Gemini fails (no API key, HTTP error, invalid payload),
     *   the response will use 'source' => 'mock' and questions from the internal mock.
     *
     * @param WP_REST_Request $request REST request instance.
     * @return WP_REST_Response
     */
    public function handle_generate( WP_REST_Request $request ) {
        global $wpdb;

        $slug = $request->get_param( 'slug' );
        if ( empty( $slug ) ) {
            $slug = 'demo';
        }

        $questions           = $this->get_mock_questions();
        $quizz_definicion_id = null;
        $app_mode            = 'CULTURA';
        $language            = 'es';
        $topic               = null;
        $source              = 'mock';

        $table_def  = $wpdb->prefix . 'cdb_quizz_definicion';
        $definicion = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$table_def} WHERE slug = %s LIMIT 1",
                $slug
            )
        );

        if ( $definicion ) {
            $quizz_definicion_id = (int) $definicion->id;
            $app_mode            = $definicion->app_mode ? $definicion->app_mode : $app_mode;
            $language            = $definicion->default_language ? $definicion->default_language : $language;
            $topic               = $definicion->default_topic ? $definicion->default_topic : $topic;
        }

        if ( $definicion ) {
            $client = new CDB_Quizz_Gemini();

            $result = $client->generate_questions(
                array(
                    'slug'           => $slug,
                    'app_mode'       => $app_mode,
                    'language'       => $language,
                    'topic'          => $topic,
                    'max_preguntas'  => (int) $definicion->max_preguntas,
                    'config_ia'      => $definicion->config_ia,
                )
            );

            if ( ! is_wp_error( $result ) && is_array( $result ) ) {
                $gemini_questions = null;

                if ( isset( $result['questions'] ) && is_array( $result['questions'] ) ) {
                    $gemini_questions = $result['questions'];
                } elseif ( array_values( $result ) === $result ) {
                    $gemini_questions = $result;
                }

                if ( ! empty( $gemini_questions ) ) {
                    $questions = $gemini_questions;
                    $source    = 'gemini';
                }
            }
        }

        $response = array(
            'ok'                  => true,
            'slug'                => $slug,
            'quizz_definicion_id' => $quizz_definicion_id,
            'app_mode'            => $app_mode,
            'language'            => $language,
            'topic'               => $topic,
            'source'              => $source,
            'questions'           => $questions,
        );

        return rest_ensure_response( $response );
    }

    /**
     * Handle finish endpoint.
     *
     * Expected parameters: slug (string), score (float), app_mode (string), questions (array), history (array).
     * Optional parameters: language (string), topic (string), duration_seconds (int|float).
     * Each history entry should minimally include:
     * array(
     *  'questionId'        => 'q1',
     *  'selectedIndex'     => 0,
     *  'selectedAnswer'    => 'Paris',
     *  'correctAnswer'     => 'Paris',
     *  'isCorrect'         => true,
     *  'timeSpentSeconds'  => 12, // optional
     * ).
     *
     * Currently persisted columns in wp_cdb_quizz_intentos: quizz_definicion_id, user_id, app_mode,
     * language, topic, questions_payload, history, score, duracion_segundos, completado, created_at, updated_at.
     * Reserved for future iterations: xp_ganada, nivel_al_cerrar, used_sources.
     *
     * @param WP_REST_Request $request REST request instance.
     * @return WP_REST_Response|WP_Error
     */
    public function handle_finish( WP_REST_Request $request ) {
        global $wpdb;

        $table             = $wpdb->prefix . 'cdb_quizz_intentos';
        $slug              = $request->get_param( 'slug' );
        $score             = floatval( $request->get_param( 'score' ) );
        $questions         = $request->get_param( 'questions' );
        $history           = $request->get_param( 'history' );
        $app_mode          = $request->get_param( 'app_mode' );
        $language          = $request->get_param( 'language' );
        $topic             = $request->get_param( 'topic' );
        $duration_seconds  = $request->get_param( 'duration_seconds' );

        if ( ! is_array( $questions ) || empty( $questions ) ) {
            $questions = array();
        }

        if ( ! is_array( $history ) || empty( $history ) ) {
            $history = array();
        }

        $quizz_definicion_id = 0;

        if ( ! empty( $slug ) ) {
            $quizz_definicion_id = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT id FROM {$wpdb->prefix}cdb_quizz_definicion WHERE slug = %s LIMIT 1",
                    $slug
                )
            );
        }

        $data = array(
            'quizz_definicion_id' => $quizz_definicion_id,
            'user_id'             => get_current_user_id(),
            'app_mode'            => $app_mode ? $app_mode : 'CULTURA',
            'questions_payload'   => wp_json_encode( $questions ),
            'history'             => wp_json_encode( $history ),
            'score'               => $score,
            'completado'          => 1,
            'created_at'          => current_time( 'mysql' ),
            'updated_at'          => current_time( 'mysql' ),
        );

        $formats = array( '%d', '%d', '%s', '%s', '%s', '%f', '%d', '%s', '%s' );

        if ( null !== $language ) {
            $data['language'] = sanitize_text_field( (string) $language );
            $formats[]        = '%s';
        }

        if ( null !== $topic ) {
            $data['topic'] = sanitize_text_field( (string) $topic );
            $formats[]     = '%s';
        }

        if ( null !== $duration_seconds ) {
            $data['duracion_segundos'] = floatval( $duration_seconds );
            $formats[]                 = '%f';
        }

        $inserted = $wpdb->insert( $table, $data, $formats );

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
