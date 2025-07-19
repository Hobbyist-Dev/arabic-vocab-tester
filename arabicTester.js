let firstLine = '';
let lines = [];

const csvInput = document.getElementById('csvFile');
const form = document.getElementById('info');
const translateText = document.getElementById('translateText');
const enteredAnsForm = document.getElementById('answerForm');
const quNum = document.getElementById('quNum');
const feedback = document.getElementById('feedback');
const nextQuestionForm = document.getElementById('nextQuestionForm');
const langDirectionButton = document.getElementById('langDirection');
const langText = document.getElementById('langText');
let isArabicToEnglish = true;

/*csvInput.addEventListener('change', (e) => {
  const file = csvInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const csvText = event.target.result;
    const rawLines = csvText.replace(/\r/g, '').split('\n').filter(line => line.trim() !== '');
    lines = rawLines.map(line => line.split(','));
    firstLine = lines[0].join(' , ');
  };

  reader.readAsText(file);
});*/

// Remove csvInput event listener and replace with fetch at page load or when ready
fetch('arabic_vocab_list.csv')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    return response.text();
  })
  .then(csvText => {
    const rawLines = csvText.replace(/\r/g, '').split('\n').filter(line => line.trim() !== '');
    lines = rawLines.map(line => line.split(','));
    firstLine = lines[0].join(' , ');
    // You can trigger initialization or enable UI here if needed
  })
  .catch(error => {
    console.error('Failed to load CSV file:', error);
  });


langDirectionButton.addEventListener('click', changeLangDirection);

function changeLangDirection() {
  isArabicToEnglish = !isArabicToEnglish;

  if (langText.innerHTML.includes("English to Arabic")) {
    langText.innerHTML = "Arabic to English&nbsp;&nbsp;";
    translateText.lang = "ar";
  } else {
    langText.innerHTML = "English to Arabic&nbsp;&nbsp;";
    translateText.lang = "en";
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const selectedLesson = formData.get('lesson');
  const selectedLessonNum = parseInt(selectedLesson.split(' ')[1]);
  const questionTotal = parseInt(formData.get('questions'), 10);

  form.style.display = 'none';
  document.querySelector('.quiz').style.display = 'block';

  const availableLines = lines.filter((row, i) => {
    if (i === 0) return false;
    const lessonLabel = row[0];
    const rowLessonNum = parseInt(lessonLabel.split(' ')[1]);
    return rowLessonNum <= selectedLessonNum;
  });

  for (let i = availableLines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableLines[i], availableLines[j]] = [availableLines[j], availableLines[i]];
  }

  let currentQuestion = 0;

  function waitForSubmit(formX) {
    return new Promise(resolve => {
      const handler = (e) => {
        e.preventDefault();
        formX.removeEventListener('submit', handler);
        resolve();
      };
      formX.addEventListener('submit', handler);
    });
  }

  function normalize(str) {
    return str
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')  // Remove punctuation
      .trim();
  }

  function askQuestion(i) {
    enteredAnsForm.style.display = 'block';
    feedback.style.display = 'none';
    nextQuestionForm.style.display = 'none';

    if (i >= questionTotal || i >= availableLines.length) {
      feedback.innerHTML = 'Quiz finished!';
      setTimeout(() => { location.reload(); }, 200);
      return;
    }

    const [lesson, ...rest] = availableLines[i];
    const arabic = rest.pop();
    const english = rest.join(', ');

    quNum.innerHTML = "Question " + (i + 1);
    translateText.innerHTML = isArabicToEnglish ? arabic : english;
    translateText.lang = isArabicToEnglish ? "ar" : "en";

    enteredAnsForm.reset();

    enteredAnsForm.onsubmit = async function (e) {
      e.preventDefault();

      const answerData = new FormData(enteredAnsForm);
      const entered = normalize(answerData.get('answer'));

      enteredAnsForm.style.display = 'none';
      feedback.style.display = 'block';
      nextQuestionForm.style.display = 'block';

      const acceptedAnswers = (isArabicToEnglish ? english : arabic)
        .split(',')
        .map(ans => normalize(ans));

      if (acceptedAnswers.includes(entered)) {
        feedback.style.color = 'rgb(0, 145, 0)';
        feedback.innerHTML = 'You got it right!';
      } else {
        feedback.style.color = 'rgb(145,0,0)';
        feedback.innerHTML = `Incorrect! It is:<br><strong>${isArabicToEnglish ? english : arabic}</strong>`;
      }

      await waitForSubmit(nextQuestionForm);
      askQuestion(i + 1);
    };
  }

  askQuestion(currentQuestion);
});
