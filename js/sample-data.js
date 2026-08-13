/* ============================================================
   ME-RIISE QUIZ — Sample quiz content (for demos / first run)
   ============================================================ */
window.MR = window.MR || {};

MR.SAMPLE_QUIZ = {
  title: 'ME-RIISE Innovation Challenge',
  event: 'TechRise 2026',
  description: 'A fast-paced quiz on technology, innovation and general aptitude.',
  timePerQuestion: 20,
  pointsPerQuestion: 1000,
  questions: [
    { q: 'What does "AI" stand for?', options: ['Automated Internet', 'Artificial Intelligence', 'Analog Input', 'Applied Innovation'], correct: 1 },
    { q: 'Which company developed the Claude family of AI models?', options: ['OpenAI', 'Google', 'Anthropic', 'Meta'], correct: 2 },
    { q: 'What is the primary language of the web browser?', options: ['Python', 'C++', 'JavaScript', 'Ruby'], correct: 2 },
    { q: 'HTTP status code 404 means?', options: ['Server Error', 'Not Found', 'OK', 'Unauthorized'], correct: 1 },
    { q: 'Which data structure uses FIFO order?', options: ['Stack', 'Queue', 'Tree', 'Graph'], correct: 1 },
    { q: 'Malnad College of Engineering is located in?', options: ['Mysuru', 'Hassan', 'Mangaluru', 'Bengaluru'], correct: 1 },
    { q: 'What does "IoT" stand for?', options: ['Internet of Things', 'Input on Time', 'Index of Tables', 'Internal Object Type'], correct: 0 },
    { q: 'Binary 1010 equals which decimal number?', options: ['8', '10', '12', '20'], correct: 1 }
  ]
};

MR.SAMPLE_EVENT = { name: 'TechRise 2026', date: '2026-08-20', venue: 'MCE Main Auditorium',
  description: 'Annual innovation & technology festival by ME-RIISE Foundation.' };
