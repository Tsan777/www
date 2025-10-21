// script.js - cleaned and DOM-safe

// Notification setup (runs immediately)
if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') console.log('Notification permission granted.');
    });
  }
  function sendNotification(task) {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Nhiệm Vụ Tiếp Theo:', {
          body: `Tên: ${task}\n`,
          icon: './icon.png'
        });
      });
    }
  }
  // check every 120s for main task
  setInterval(() => {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const mainTask = tasks.find(t => t.isMainTask);
    if (mainTask) sendNotification(mainTask.name);
  }, 120000);
  
  // All DOM wiring inside DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const todoInput = document.getElementById('todo-name');
    const timeSelect = document.getElementById('time');
    const addTodoBtn = document.getElementById('add-todo');
    const morningTodoList = document.getElementById('morning-todo-list');
    const afternoonTodoList = document.getElementById('afternoon-todo-list');
    const eveningTodoList = document.getElementById('evening-todo-list');
  
    const taskInput = document.getElementById('task-name');
    const topicInput = document.getElementById('topic');
    const addTaskBtn = document.getElementById('add-task');
    const taskList = document.getElementById('task-list');
  
    const goalInput = document.getElementById('goal-name');
    const addGoalBtn = document.getElementById('add-goal');
    const goalList = document.getElementById('goal-list');
  
    const queueInput = document.getElementById('queue-name');
    const addQueueBtn = document.getElementById('add-queue');
    const queueList = document.getElementById('queue-list');
  
    const noteInput = document.getElementById('note-name');
    const addNoteBtn = document.getElementById('add-note');
    const noteList = document.getElementById('note-list');
  
    const diaryNameInput = document.getElementById('diary-name');
    const diaryContentInput = document.getElementById('diary-content');
    const addDiaryBtn = document.getElementById('add-diary');
    const diaryList = document.getElementById('diary-list');
  
    // --- Todo ---
    function loadTodosFromFile(fileName = './todo.txt') {
      fetch(fileName)
        .then(r => {
          if (!r.ok) throw new Error('Không tìm thấy file: ' + fileName);
          return r.text();
        })
        .then(data => {
          const todos = [];
          let currentTime = null;
    
          data.split('\n').forEach(line => {
            line = line.trim();
            if (!line) return;
    
            // Nhận dạng tiêu đề buổi
            if (line.endsWith(':')) {
              currentTime = line.replace(':', '').toLowerCase();
            } else if (currentTime) {
              todos.push({ name: line, time: currentTime });
            }
          });
    
          localStorage.setItem('todos', JSON.stringify(todos));
          renderTodos(todos);
        })
        .catch(err => console.error(err));
    }
    
    function renderTodos(todos) {
      morningTodoList.innerHTML = '';
      afternoonTodoList.innerHTML = '';
      eveningTodoList.innerHTML = '';
      todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${escapeHtml(todo.name)}</span>
          <button class="delete-btn" data-index="${index}">Delete</button>`;
        if (todo.time === 'morning') morningTodoList.appendChild(li);
        else if (todo.time === 'afternoon') afternoonTodoList.appendChild(li);
        else eveningTodoList.appendChild(li);
      });
    }
    function loadTodos() {
      const todos = JSON.parse(localStorage.getItem('todos')) || [];
      renderTodos(todos);
    }
    function deleteTodoAt(index) {
      const todos = JSON.parse(localStorage.getItem('todos')) || [];
      todos.splice(index, 1);
      localStorage.setItem('todos', JSON.stringify(todos));
      renderTodos(todos);
    }
    addTodoBtn && addTodoBtn.addEventListener('click', () => {
      const name = todoInput.value.trim();
      const time = timeSelect.value;
      if (!name) return alert('Please enter a todo name!');
      const todos = JSON.parse(localStorage.getItem('todos')) || [];
      todos.push({ name, time });
      localStorage.setItem('todos', JSON.stringify(todos));
      todoInput.value = '';
      renderTodos(todos);
    });
    // delegate delete buttons for todos
    [morningTodoList, afternoonTodoList, eveningTodoList].forEach(list => {
      list && list.addEventListener('click', e => {
        if (e.target.matches('.delete-btn')) {
          const idx = parseInt(e.target.dataset.index, 10);
          deleteTodoAt(idx);
        }
      });
    });
  
    // --- Tasks (from task.txt) ---
    function groupTasksByTopic(tasks) {
      return tasks.reduce((groups, task) => {
        if (!groups[task.topic]) groups[task.topic] = [];
        groups[task.topic].push(task);
        return groups;
      }, {});
    }
    function renderTasks(tasks) {
      taskList.innerHTML = '';
      const grouped = groupTasksByTopic(tasks);
      Object.keys(grouped).forEach(topic => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('topic-group');
        const title = document.createElement('h2'); title.textContent = topic;
        wrapper.appendChild(title);
        grouped[topic].forEach(task => {
          const li = document.createElement('li');
          li.innerHTML = `<label class="main-checkbox"><input type="checkbox"${task.isMainTask ? ' checked' : ''}><span>${escapeHtml(task.name)}</span></label>
                          <button class="delete-task">Delete</button>`;
          // checkbox: toggle main
          li.querySelector('input[type="checkbox"]').addEventListener('change', () => {
            toggleMainTask(task, tasks);
          });
          li.querySelector('.delete-task').addEventListener('click', () => {
            removeTask(task.name, task.topic);
          });
          wrapper.appendChild(li);
        });
        taskList.appendChild(wrapper);
      });
    }
    function toggleMainTask(selectedTask, allTasks) {
      allTasks.forEach(t => t.isMainTask = false);
      selectedTask.isMainTask = true;
      localStorage.setItem('tasks', JSON.stringify(allTasks));
      renderTasks(allTasks);
    }
    function removeTask(name, topic) {
      let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
      tasks = tasks.filter(t => !(t.name === name && t.topic === topic));
      localStorage.setItem('tasks', JSON.stringify(tasks));
      renderTasks(tasks);
    }
    // load tasks from file
    function loadTasksFromFile(fileName = './task.txt') {
      fetch(fileName).then(r => {
        if (!r.ok) throw new Error('File not found: ' + fileName);
        return r.text();
      }).then(data => {
        const lines = data.trim().split('\n');
        const tasks = lines.map(line => {
          const [topic, main, name] = line.split('<ww>');
          return { topic: topic === '0.None' ? 'None' : topic, isMainTask: main === '1', name: name.trim() };
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks(tasks);
      }).catch(err => console.error(err));
    }
  
    // --- Goals ---
    function renderGoals(goals) {
      goalList.innerHTML = '';
      goals.forEach(goal => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${escapeHtml(goal)}</span><button class="delete-goal">Delete</button>`;
        li.querySelector('.delete-goal').addEventListener('click', () => removeGoal(goal));
        goalList.appendChild(li);
      });
    }
    function loadGoalsFromFile(fileName = './goal.txt') {
      fetch(fileName).then(r => {
        if (!r.ok) throw new Error('File not found: ' + fileName);
        return r.text();
      }).then(data => {
        const lines = data.trim().split('\n').map(l => l.trim()).filter(Boolean);
        localStorage.setItem('goals', JSON.stringify(lines));
        renderGoals(lines);
      }).catch(err => console.error(err));
    }
    addGoalBtn && addGoalBtn.addEventListener('click', () => {
      const name = goalInput.value.trim();
      if (!name) return alert('Please enter a goal!');
      let goals = JSON.parse(localStorage.getItem('goals')) || [];
      goals.push(name);
      localStorage.setItem('goals', JSON.stringify(goals));
      renderGoals(goals);
      goalInput.value = '';
    });
    function removeGoal(goalToRemove) {
      let goals = JSON.parse(localStorage.getItem('goals')) || [];
      goals = goals.filter(g => g !== goalToRemove);
      localStorage.setItem('goals', JSON.stringify(goals));
      renderGoals(goals);
    }
  
    // --- Queues ---
    function renderQueues(queues) {
      queueList.innerHTML = '';
      queues.forEach(q => {
        const li = document.createElement('li');
        li.textContent = q;
        queueList.appendChild(li);
      });
    }
    function loadQueuesFromFile(fileName = './queue.txt') {
      fetch(fileName).then(r => {
        if (!r.ok) throw new Error('File not found: ' + fileName);
        return r.text();
      }).then(data => {
        const queues = data.trim().split('\n').filter(Boolean);
        renderQueues(queues);
      }).catch(err => console.error(err));
    }
    addQueueBtn && addQueueBtn.addEventListener('click', () => {
      const name = queueInput.value.trim();
      if (!name) return alert('Please enter a task for the queue!');
      const li = document.createElement('li'); li.textContent = name; queueList.appendChild(li);
      queueInput.value = '';
    });
  
    // --- Notes (note.txt parser) ---
    async function loadNotesFromFile(fileName = './note.txt') {
      try {
        const r = await fetch(fileName);
        if (!r.ok) throw new Error('File not found: ' + fileName);
        const data = await r.text();
        parseNotes(data);
      } catch (e) { console.error(e); }
    }
    function parseNotes(data) {
      noteList.innerHTML = '';
      const lines = data.split('\n');
      let currentTopic = null;
      let ul = null;
      lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        if (line.startsWith('TOPIC:')) {
          currentTopic = line.replace('TOPIC:', '').trim();
          const h3 = document.createElement('h3'); h3.textContent = `Topic: ${currentTopic}`;
          noteList.appendChild(h3);
          ul = document.createElement('ul'); noteList.appendChild(ul);
        } else if (ul) {
          const li = document.createElement('li'); li.textContent = line; ul.appendChild(li);
        }
      });
    }
    addNoteBtn && addNoteBtn.addEventListener('click', () => {
      const v = noteInput.value.trim();
      if (!v) return alert('Enter a note');
      const li = document.createElement('li'); li.textContent = v; noteList.appendChild(li);
      noteInput.value = '';
    });
  
    // --- Diary ---
    addDiaryBtn && addDiaryBtn.addEventListener('click', () => {
      const name = diaryNameInput.value.trim();
      const content = diaryContentInput.value.trim();
      if (!name || !content) return alert('Please enter both name and content for the diary entry.');
      const li = document.createElement('li');
      li.innerHTML = `<details><summary>${escapeHtml(name)}</summary><p>${escapeHtml(content)}</p></details>`;
      diaryList.appendChild(li);
      diaryNameInput.value = ''; diaryContentInput.value = '';
    });
    async function loadDiaryFromFile(fileName = './diary.txt') {
      try {
        const r = await fetch(fileName);
        if (!r.ok) throw new Error('File not found: ' + fileName);
        const data = await r.text();
        parseDiary(data);
      } catch (e) { console.error(e); }
    }
    function parseDiary(data) {
      diaryList.innerHTML = '';
      const entries = data.split('<diarysplit>').map(s => s.trim()).filter(Boolean);
      entries.forEach(entry => {
        const lines = entry.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length >= 2) {
          const day = lines[0], name = lines[1], content = lines.slice(2).join('\n');
          const li = document.createElement('li');
          li.innerHTML = `<details><summary>${escapeHtml(day)} - ${escapeHtml(name)}</summary><p>${escapeHtml(content)}</p></details>`;
          diaryList.appendChild(li);
        }
      });
    }
  
    // --- Info / Charts ---
    function parseInfoData(data) {
      const lines = data.trim().split('\n');
      const info = {};
      lines.forEach(line => {
        const [key, ...rest] = line.split(':');
        if (!key) return;
        const value = rest.join(':').trim();
        if (key === 'bar' || key === 'pie') {
          try { info[key] = JSON.parse(value); } catch { info[key] = []; }
        } else info[key] = value;
      });
      return info;
    }
    function updateInfo(info) {
      const nameLabel = document.querySelector('label[for="name"]');
      const moneyLabel = document.querySelector('label[for="money"]');
      const levelLabel = document.querySelector('label[for="level"]');
      if (nameLabel) nameLabel.textContent = info.name || 'None';
      if (moneyLabel) moneyLabel.textContent = info.money || '0$';
      if (levelLabel) levelLabel.textContent = `Lv ${info.level || 0}`;
      const progressBar = document.getElementById('current-progress');
      if (progressBar && typeof info.value !== 'undefined') progressBar.value = info.value * 100;
    }
    function updateCharts(info) {
      try {
        const barCtx = document.getElementById('barChart').getContext('2d');
        new Chart(barCtx, {
          type: 'bar',
          data: {
            labels: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
            datasets: [{ label: 'Tasks Completed', data: info.bar || [0,0,0,0,0,0,0] }]
          },
          options: { responsive: true }
        });
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        new Chart(pieCtx, { type: 'pie', data: { labels: ['Queue','Todo','Task','Goal'], datasets: [{ data: info.pie || [1,1,1,1] }] }, options: { responsive: true } });
      } catch (e) { console.error('Chart error', e); }
    }
    async function loadInfoFromFile(fileName = './info.txt') {
      try {
        const r = await fetch(fileName);
        if (!r.ok) throw new Error('File not found: ' + fileName);
        const data = await r.text();
        const info = parseInfoData(data);
        updateInfo(info);
        updateCharts(info);
      } catch (e) { console.error(e); }
    }
  
    // --- initial loads ---
    loadTodos();
    loadTodosFromFile();  // đọc todo.txt
    loadTasksFromFile();
    loadGoalsFromFile();
    loadQueuesFromFile();
    loadNotesFromFile();
    loadDiaryFromFile();
    loadInfoFromFile();
  });
  
  // --- small util ---
  function escapeHtml(str = '') {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }
  