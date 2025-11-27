(function () {
    function showError(container) {
        container.textContent = 'No se han podido cargar las preguntas en este momento.';
    }

    async function loadQuizz(container) {
        const { slug } = container.dataset;

        if (!slug || typeof cdbQuizzSettings === 'undefined' || !cdbQuizzSettings.restUrl) {
            showError(container);
            return;
        }

        container.textContent = 'Cargando preguntas…';

        try {
            const response = await fetch(`${cdbQuizzSettings.restUrl}cdb-quizz/v1/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ slug }),
            });

            const data = await response.json();

            if (response.ok && data && data.ok === true && Array.isArray(data.questions) && data.questions.length > 0) {
                renderQuestions(container, slug, data);
            } else {
                showError(container);
            }
        } catch (error) {
            showError(container);
        }
    }

    function renderQuestions(container, slug, data) {
        const quizState = {
            questions: data.questions || [],
            answers: {},
            startedAt: Date.now(),
        };

        const { questions } = quizState;
        container.innerHTML = '';

        const title = document.createElement('h3');
        title.textContent = `CdB Quizz (slug: ${slug})`;
        container.appendChild(title);

        const list = document.createElement('ol');

        questions.forEach((question, index) => {
            const item = document.createElement('li');

            const questionText = document.createElement('div');
            questionText.textContent = question.questionText || question.text || '';
            item.appendChild(questionText);

            if (Array.isArray(question.options) && question.options.length > 0) {
                const optionsList = document.createElement('div');
                const questionId = question.id || `q${index + 1}`;

                question.options.forEach((option, optionIndex) => {
                    const optionWrapper = document.createElement('label');
                    const input = document.createElement('input');

                    input.type = 'radio';
                    input.name = `cdb-quizz-q-${questionId}`;
                    input.value = optionIndex;

                    input.addEventListener('change', () => {
                        quizState.answers[questionId] = { selectedIndex: optionIndex };
                    });

                    optionWrapper.appendChild(input);
                    optionWrapper.append(` ${option}`);
                    optionsList.appendChild(optionWrapper);
                    optionsList.appendChild(document.createElement('br'));
                });

                item.appendChild(optionsList);
            }

            list.appendChild(item);
        });

        container.appendChild(list);

        const finishButton = document.createElement('button');
        finishButton.type = 'button';
        finishButton.textContent = 'Registrar intento de prueba';

        const statusDiv = document.createElement('div');
        statusDiv.className = 'cdb-quizz-status';

        finishButton.addEventListener('click', async () => {
            const finishedAt = Date.now();
            const durationSeconds = Math.round((finishedAt - quizState.startedAt) / 1000);

            const history = questions.map((question, idx) => {
                const id = question.id || `q${idx + 1}`;
                const answerState = quizState.answers[id] || {};
                const selectedIndex = typeof answerState.selectedIndex === 'number' ? answerState.selectedIndex : null;
                const selectedAnswer = selectedIndex !== null && Array.isArray(question.options)
                    ? question.options[selectedIndex]
                    : null;
                const hasCorrectAnswer = typeof question.correctAnswer === 'string' && question.correctAnswer.trim() !== '';
                const correctAnswer = hasCorrectAnswer ? question.correctAnswer : null;
                const isCorrect = selectedAnswer !== null && correctAnswer !== null && selectedAnswer === correctAnswer;

                return {
                    questionId: id,
                    selectedIndex,
                    selectedAnswer,
                    correctAnswer,
                    isCorrect,
                };
            });

            const total = questions.length || 1;
            const correctCount = history.filter((h) => h.isCorrect).length;
            const score = (correctCount / total) * 100;

            try {
                const response = await fetch(`${cdbQuizzSettings.restUrl}cdb-quizz/v1/finish`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        slug,
                        app_mode: data.app_mode || 'CULTURA',
                        language: data.language || 'es',
                        topic: data.topic || null,
                        duration_seconds: durationSeconds,
                        score,
                        questions,
                        history,
                    }),
                });

                const result = await response.json();

                if (response.ok && result && result.ok === true && result.intento_id) {
                    statusDiv.textContent = `Intento guardado con ID: ${result.intento_id}`;
                } else {
                    statusDiv.textContent = 'No se ha podido guardar el intento.';
                }
            } catch (error) {
                statusDiv.textContent = 'No se ha podido guardar el intento.';
            }
        });

        container.appendChild(finishButton);
        container.appendChild(statusDiv);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const containers = document.querySelectorAll('.cdb-quizz-container');

        containers.forEach((container) => {
            loadQuizz(container);
        });
    });
})();
