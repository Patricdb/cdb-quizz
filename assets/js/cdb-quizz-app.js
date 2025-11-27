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
                renderQuestions(container, slug, data.questions);
            } else {
                showError(container);
            }
        } catch (error) {
            showError(container);
        }
    }

    function renderQuestions(container, slug, questions) {
        container.innerHTML = '';

        const title = document.createElement('h3');
        title.textContent = `CdB Quizz (slug: ${slug})`;
        container.appendChild(title);

        const list = document.createElement('ol');

        questions.forEach((question) => {
            const item = document.createElement('li');

            const questionText = document.createElement('div');
            questionText.textContent = question.questionText || question.text || '';
            item.appendChild(questionText);

            if (Array.isArray(question.options) && question.options.length > 0) {
                const optionsList = document.createElement('ul');

                question.options.forEach((option) => {
                    const optionItem = document.createElement('li');
                    optionItem.textContent = option;
                    optionsList.appendChild(optionItem);
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
            const history = questions.map((question) => ({
                questionId: question.id,
                selectedAnswer: question.correctAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect: true,
            }));

            try {
                const response = await fetch(`${cdbQuizzSettings.restUrl}cdb-quizz/v1/finish`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        slug,
                        score: 100,
                        app_mode: 'CULTURA',
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
