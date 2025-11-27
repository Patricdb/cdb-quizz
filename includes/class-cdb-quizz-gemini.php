<?php
/**
 * Gemini client wrapper for CdB Quizz.
 */
class CDB_Quizz_Gemini {
    /**
     * Generate quiz questions using Gemini.
     *
     * @param array $args Arguments for the generation prompt.
     * @return array|WP_Error
     */
    public function generate_questions( array $args ) {
        if ( ! defined( 'CDB_QUIZZ_GEMINI_API_KEY' ) || ! CDB_QUIZZ_GEMINI_API_KEY ) {
            return new WP_Error( 'cdb_quizz_no_api_key', __( 'Gemini API key is not configured.', 'cdb-quizz' ) );
        }

        if ( '' === trim( CDB_QUIZZ_GEMINI_API_KEY ) ) {
            return new WP_Error( 'cdb_quizz_no_api_key', __( 'Gemini API key is not configured.', 'cdb-quizz' ) );
        }

        $language      = ! empty( $args['language'] ) ? $args['language'] : 'es';
        $topic         = isset( $args['topic'] ) ? $args['topic'] : '';
        $max_preguntas = ! empty( $args['max_preguntas'] ) ? (int) $args['max_preguntas'] : 3;
        $app_mode      = isset( $args['app_mode'] ) ? $args['app_mode'] : '';
        $config_ia     = isset( $args['config_ia'] ) ? $args['config_ia'] : null;

        $model = 'models/gemini-1.5-flash-latest';
        if ( $config_ia ) {
            $decoded_config = is_array( $config_ia ) ? $config_ia : json_decode( (string) $config_ia, true );
            if ( is_array( $decoded_config ) && ! empty( $decoded_config['model'] ) && is_string( $decoded_config['model'] ) ) {
                $model = 0 === strpos( $decoded_config['model'], 'models/' ) ? $decoded_config['model'] : 'models/' . $decoded_config['model'];
            }
        }

        $prompt = $this->build_prompt( $language, $topic, $max_preguntas, $app_mode );
        $body   = array(
            'model'    => $model,
            'contents' => array(
                array(
                    'parts' => array(
                        array(
                            'text' => $prompt,
                        ),
                    ),
                ),
            ),
        );

        $endpoint = add_query_arg(
            array( 'key' => CDB_QUIZZ_GEMINI_API_KEY ),
            sprintf( 'https://generativelanguage.googleapis.com/v1beta/%s:generateContent', rawurlencode( $model ) )
        );

        $response = wp_remote_post(
            $endpoint,
            array(
                'headers' => array(
                    'Content-Type' => 'application/json',
                ),
                'body'    => wp_json_encode( $body ),
                'timeout' => 30,
            )
        );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        $raw_body    = wp_remote_retrieve_body( $response );

        if ( $status_code < 200 || $status_code >= 300 ) {
            return new WP_Error(
                'cdb_quizz_gemini_http_error',
                __( 'Gemini API returned an error response.', 'cdb-quizz' ),
                array(
                    'status_code' => $status_code,
                    'body'        => $raw_body,
                )
            );
        }

        $decoded = json_decode( $raw_body, true );
        if ( null === $decoded ) {
            return new WP_Error( 'cdb_quizz_gemini_parse_error', __( 'Unable to parse Gemini API response.', 'cdb-quizz' ) );
        }

        $questions_data = array();
        if ( isset( $decoded['questions'] ) && is_array( $decoded['questions'] ) ) {
            $questions_data = $decoded;
        } else {
            $questions_json = $this->extract_questions_json( $decoded );
            if ( is_wp_error( $questions_json ) ) {
                return $questions_json;
            }

            $questions_data = json_decode( $questions_json, true );
            if ( null === $questions_data ) {
                return new WP_Error( 'cdb_quizz_gemini_parse_error', __( 'Unable to parse Gemini API response.', 'cdb-quizz' ) );
            }
        }

        if ( empty( $questions_data['questions'] ) || ! is_array( $questions_data['questions'] ) ) {
            return new WP_Error( 'cdb_quizz_invalid_ai_payload', __( 'Gemini response does not contain valid questions.', 'cdb-quizz' ) );
        }

        $normalized = $this->normalize_questions( $questions_data['questions'] );

        if ( empty( $normalized ) ) {
            return new WP_Error( 'cdb_quizz_invalid_ai_payload', __( 'Gemini response does not contain valid questions.', 'cdb-quizz' ) );
        }

        return $normalized;
    }

    /**
     * Build the prompt for Gemini generation.
     *
     * @param string $language Language of the questions.
     * @param string $topic Topic of the quiz.
     * @param int    $max_preguntas Number of questions to generate.
     * @param string $app_mode Context or application mode.
     * @return string
     */
    protected function build_prompt( $language, $topic, $max_preguntas, $app_mode ) {
        $topic_text = $topic ? sprintf( 'sobre el tema "%s"', $topic ) : 'sobre un tema general';
        $app_mode   = $app_mode ? sprintf( 'Modo de aplicación: %s.', $app_mode ) : '';

        $prompt = sprintf(
            'Eres un generador de quizzes. Idioma: %1$s. Genera como máximo %2$d preguntas de opción múltiple %3$s. %4$s Devuelve únicamente JSON válido con esta estructura exacta (sin texto adicional): {"questions": [{"id": "q1", "questionText": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "...", "explanation": "...", "difficulty": "easy|medium|hard"}]}. Cada pregunta debe tener exactamente cuatro opciones de texto, un id único, correctAnswer, explanation, difficulty y puede incluir tags opcionales.',
            $language,
            $max_preguntas,
            $topic_text,
            $app_mode
        );

        return $prompt;
    }

    /**
     * Extract the JSON content from Gemini response payload.
     *
     * @param array $decoded Decoded response body.
     * @return string|WP_Error
     */
    protected function extract_questions_json( $decoded ) {
        if ( empty( $decoded['candidates'] ) || ! is_array( $decoded['candidates'] ) ) {
            return new WP_Error( 'cdb_quizz_gemini_missing_candidates', __( 'Gemini response is missing candidates.', 'cdb-quizz' ) );
        }

        foreach ( $decoded['candidates'] as $candidate ) {
            if ( empty( $candidate['content']['parts'] ) || ! is_array( $candidate['content']['parts'] ) ) {
                continue;
            }

            foreach ( $candidate['content']['parts'] as $part ) {
                if ( ! empty( $part['text'] ) ) {
                    return $part['text'];
                }
            }
        }

        return new WP_Error( 'cdb_quizz_gemini_no_text', __( 'Gemini response did not include text content.', 'cdb-quizz' ) );
    }

    /**
     * Normalize the question payload to the expected structure.
     *
     * @param array $questions_data Raw questions from Gemini.
     * @return array
     */
    protected function normalize_questions( array $questions_data ) {
        $normalized = array();

        foreach ( $questions_data as $question ) {
            $options = array_values( (array) ( $question['options'] ?? array() ) );
            $options = array_map( 'strval', $options );

            $question_text = (string) ( $question['questionText'] ?? ( $question['text'] ?? '' ) );

            $normalized_item = array(
                'id'            => (string) ( $question['id'] ?? '' ),
                'questionText'  => $question_text,
                'options'       => $options,
                'correctAnswer' => isset( $question['correctAnswer'] ) ? (string) $question['correctAnswer'] : '',
                'explanation'   => isset( $question['explanation'] ) ? (string) $question['explanation'] : '',
                'difficulty'    => isset( $question['difficulty'] ) ? (string) $question['difficulty'] : '',
                'tags'          => isset( $question['tags'] ) ? array_values( (array) $question['tags'] ) : array(),
            );

            if ( '' !== trim( $normalized_item['questionText'] ) && ! empty( $normalized_item['options'] ) ) {
                $normalized[] = $normalized_item;
            }
        }

        return $normalized;
    }
}
