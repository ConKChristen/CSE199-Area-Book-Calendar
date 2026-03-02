document.addEventListener('DOMContentLoaded', () => {

  // ── Dark Mode ──
  const darkModeToggle = document.getElementById('darkModeToggle');
  const savedTheme = localStorage.getItem('theme') || localStorage.getItem('darkMode');
  if (savedTheme === 'dark' || savedTheme === 'enabled') {
    document.body.classList.add('dark-mode');
  }
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      localStorage.removeItem('darkMode');
    });
  }

  // ── Sidebar ──
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarClose  = document.getElementById('sidebarClose');
  const sidebar       = document.getElementById('sidebar');
  const overlay       = document.getElementById('sidebarOverlay');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    sidebarToggle.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    sidebarToggle.classList.remove('open');
    document.body.style.overflow = '';
  }

  sidebarToggle?.addEventListener('click', openSidebar);
  sidebarClose?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  sidebar?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeSidebar);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
      closeModal();
    }
  });

  // ── Week Navigation ──
  document.getElementById('prevWeek')?.addEventListener('click', () => { currentWeekOffset--; listUpcomingEvents(); });
  document.getElementById('nextWeek')?.addEventListener('click', () => { currentWeekOffset++; listUpcomingEvents(); });
  document.getElementById('todayButton')?.addEventListener('click', () => { currentWeekOffset = 0; listUpcomingEvents(); });

  // ── Clock Picker State ──
  let clockMode = null; // 'startHour' | 'startMin' | 'endHour' | 'endMin'
  let timeState = {
    startHour: 9,  startMin: 0,  startAmpm: 'AM',
    endHour:   10, endMin:   0,  endAmpm:   'AM',
  };

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function updateTimeDisplays() {
    document.getElementById('startHourBtn').textContent = pad(timeState.startHour);
    document.getElementById('startMinBtn').textContent  = pad(timeState.startMin);
    document.getElementById('endHourBtn').textContent   = pad(timeState.endHour);
    document.getElementById('endMinBtn').textContent    = pad(timeState.endMin);

    document.getElementById('startAmBtn').classList.toggle('active', timeState.startAmpm === 'AM');
    document.getElementById('startPmBtn').classList.toggle('active', timeState.startAmpm === 'PM');
    document.getElementById('endAmBtn').classList.toggle('active',   timeState.endAmpm   === 'AM');
    document.getElementById('endPmBtn').classList.toggle('active',   timeState.endAmpm   === 'PM');
  }

 function setActiveSegment(mode) {
  clockMode = mode;
  ['startHourBtn', 'startMinBtn', 'endHourBtn', 'endMinBtn'].forEach(id => {
    document.getElementById(id)?.classList.remove('active');
  });
  const map = {
    startHour: 'startHourBtn',
    startMin:  'startMinBtn',
    endHour:   'endHourBtn',
    endMin:    'endMinBtn',
  };
  document.getElementById(map[mode])?.classList.add('active');

  // Show the clock whenever a segment is active
  document.getElementById('clockPicker')?.classList.add('visible');

  renderClockNumbers();
  updateClockHand();
}

  function renderClockNumbers() {
    const face = document.getElementById('clockNumbers');
    if (!face || !clockMode) return;

    const isMin = clockMode.includes('Min');
    const nums  = isMin
      ? [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
      : [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    const radius = 100;
    const cx = 130, cy = 130;

    face.innerHTML = '';
    nums.forEach((n, i) => {
      const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      const el = document.createElement('div');
      el.className = 'clock-num';
      el.textContent = pad(n);
      el.style.left = x + 'px';
      el.style.top  = y + 'px';

      const currentVal = timeState[clockMode];
      const isSelected = isMin
        ? currentVal === n
        : (currentVal === n || (n === 12 && currentVal === 12));

      if (isSelected) el.classList.add('selected');

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        timeState[clockMode] = n;

        // Auto-advance to next segment
        if      (clockMode === 'startHour') setActiveSegment('startMin');
        else if (clockMode === 'startMin')  setActiveSegment('endHour');
        else if (clockMode === 'endHour')   setActiveSegment('endMin');
        // endMin: just stay, user is done

        renderClockNumbers();
        updateClockHand();
        updateTimeDisplays();
      });

      face.appendChild(el);
    });
  }

  function updateClockHand() {
    const hand = document.getElementById('clockHand');
    if (!hand || !clockMode) return;

    const isMin = clockMode.includes('Min');
    let val = timeState[clockMode];
    const total = isMin ? 60 : 12;

    // 12 o'clock = 0 degrees
    if (!isMin && val === 12) val = 0;

    const deg = (val / total) * 360;
    hand.style.height = '88px';
    hand.style.transform = `translateX(-50%) rotate(${deg}deg)`;
  }

  function getTimeAs24(hour, ampm) {
    if (ampm === 'AM') return hour === 12 ? 0 : hour;
    return hour === 12 ? 12 : hour + 12;
  }

  // ── Segment Button Listeners ──
  document.getElementById('startHourBtn')?.addEventListener('click', () => setActiveSegment('startHour'));
  document.getElementById('startMinBtn')?.addEventListener('click',  () => setActiveSegment('startMin'));
  document.getElementById('endHourBtn')?.addEventListener('click',   () => setActiveSegment('endHour'));
  document.getElementById('endMinBtn')?.addEventListener('click',    () => setActiveSegment('endMin'));

  document.getElementById('startAmBtn')?.addEventListener('click', () => { timeState.startAmpm = 'AM'; updateTimeDisplays(); });
  document.getElementById('startPmBtn')?.addEventListener('click', () => { timeState.startAmpm = 'PM'; updateTimeDisplays(); });
  document.getElementById('endAmBtn')?.addEventListener('click',   () => { timeState.endAmpm   = 'AM'; updateTimeDisplays(); });
  document.getElementById('endPmBtn')?.addEventListener('click',   () => { timeState.endAmpm   = 'PM'; updateTimeDisplays(); });

  // ── Modal Open / Close ──
  const newEventBtn  = document.getElementById('newEventBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const eventModal   = document.getElementById('eventModal');
  const modalClose   = document.getElementById('modalClose');
  const modalCancel  = document.getElementById('modalCancel');
  const saveEventBtn = document.getElementById('saveEvent');
  const modalError   = document.getElementById('modalError');

  function openModal() {
    document.getElementById('eventTitle').value       = '';
    document.getElementById('eventDate').value        = new Date().toISOString().split('T')[0];
    document.getElementById('eventDescription').value = '';
    modalError.textContent = '';

    // Reset clock state
    clockMode = null;  // ← add this
    timeState = {
      startHour: 9,  startMin: 0,  startAmpm: 'AM',
      endHour:   10, endMin:   0,  endAmpm:   'AM',
    };
    updateTimeDisplays();
    // No setActiveSegment call — clock stays hidden

    modalOverlay.classList.add('active');
    requestAnimationFrame(() => eventModal.classList.add('active'));
    document.getElementById('eventTitle').focus();
  }

  function closeModal() {
    eventModal?.classList.remove('active');
    modalOverlay?.classList.remove('active');
    document.getElementById('clockPicker')?.classList.remove('visible'); // ← add this
  }

  newEventBtn?.addEventListener('click', openModal);
  modalClose?.addEventListener('click',  closeModal);
  modalCancel?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // ── Save Event ──
  saveEventBtn?.addEventListener('click', async () => {
    const title = document.getElementById('eventTitle').value.trim();
    const date  = document.getElementById('eventDate').value;
    const desc  = document.getElementById('eventDescription').value.trim();

    if (!title) return (modalError.textContent = 'Please add a title.');
    if (!date)  return (modalError.textContent = 'Please pick a date.');

    const sh = String(getTimeAs24(timeState.startHour, timeState.startAmpm)).padStart(2, '0');
    const sm = pad(timeState.startMin);
    const eh = String(getTimeAs24(timeState.endHour, timeState.endAmpm)).padStart(2, '0');
    const em = pad(timeState.endMin);
    const startTime = `${sh}:${sm}`;
    const endTime   = `${eh}:${em}`;

    if (startTime >= endTime) {
      return (modalError.textContent = 'End time must be after start time.');
    }

    modalError.textContent    = '';
    saveEventBtn.textContent  = 'Saving…';
    saveEventBtn.disabled     = true;

    try {
      await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: {
          summary:     title,
          description: desc || undefined,
          start: {
            dateTime: `${date}T${startTime}:00`,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: `${date}T${endTime}:00`,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
      });

      closeModal();
      await listUpcomingEvents(); // Refresh calendar
    } catch (err) {
      modalError.textContent = err.result?.error?.message || 'Failed to save. Please try again.';
    } finally {
      saveEventBtn.textContent = 'Save Event';
      saveEventBtn.disabled    = false;
    }
  });

});