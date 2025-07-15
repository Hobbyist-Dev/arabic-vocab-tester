let firstLine = '';
let lines = [];

const csvInput = document.getElementById('csvFile');
const form = document.getElementById('info');
const arText = document.getElementById('arabic');
const enteredAnsForm = document.getElementById('answerForm');
const quNum = document.getElementById('quNum');
const feedback = document.getElementById('feedback');
const nextQuestionForm = document.getElementById('nextQuestionForm');

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


form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const selectedLesson = formData.get('lesson'); // e.g. "Lesson 2"
  const selectedLessonNum = parseInt(selectedLesson.split(' ')[1]); // e.g. 2
  const questionTotal = parseInt(formData.get('questions'), 10);

  form.style.display = 'none';
  document.getElementsByClassName('quiz')[0].style.display = 'block';

  // ✅ Filter lines up to and including selected lesson
  const availableLines = lines.filter((row, i) => {
    if (i === 0) return false; // skip header
    const lessonLabel = row[0];
    const rowLessonNum = parseInt(lessonLabel.split(' ')[1]);
    return rowLessonNum <= selectedLessonNum;
  });

  // ✅ Shuffle available lines
  for (let i = availableLines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableLines[i], availableLines[j]] = [availableLines[j], availableLines[i]];
  }

  let currentQuestion = 0;

  function waitForSubmit(formX) {
    return new Promise(resolve => {
      const handler = (e) => {
        e.preventDefault();          // Prevent form submission/reload
        formX.removeEventListener('submit', handler);
        resolve();                  // Resume the async function
      };
      formX.addEventListener('submit', handler);
    });
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

    const [lesson, english, arabic] = availableLines[i];

    quNum.innerHTML = "Question " + (i + 1);
    arText.innerHTML = arabic;

    enteredAnsForm.reset();

    enteredAnsForm.onsubmit = async function (e) {
      e.preventDefault();
      const answerData = new FormData(enteredAnsForm);
      const enteredAns = answerData.get('answer');

      enteredAnsForm.style.display = 'none';
      feedback.style.display = 'block';
      nextQuestionForm.style.display = 'block';

      if (enteredAns.trim().toLowerCase() === english.trim().toLowerCase()) {
        
        feedback.innerHTML = 'You got it right!';
      } else {
        feedback.innerHTML = 'Incorrect! it is: <br><strong>' + english +'</strong>';
      }
      
      await waitForSubmit(document.getElementById('nextQuestionForm'));
      askQuestion(i + 1);
      

      
    };
  }

  askQuestion(currentQuestion);
});
