document.addEventListener('DOMContentLoaded', () => {

  // ── Dark Mode ──
  const darkModeToggle = document.getElementById('themeToggle');
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

  // ── Week / Day Navigation ──
  document.getElementById('prevWeek')?.addEventListener('click', () => { currentWeekOffset--; listUpcomingEvents(); });
  document.getElementById('nextWeek')?.addEventListener('click', () => { currentWeekOffset++; listUpcomingEvents(); });
  document.getElementById('todayButton')?.addEventListener('click', () => { currentWeekOffset = 0; listUpcomingEvents(); });


  // Re-render on window resize to swap between weekly and daily view
  window.addEventListener('resize', () => {
    if (typeof gapi !== 'undefined' && gapi.client && gapi.client.getToken()) {
      listUpcomingEvents();
    }
  });

  // ── Event Type Config ──
  const EVENT_TYPES = {
    study:   { label: 'Study',   icon: '📚', color: '#2563eb' },
    task:    { label: 'Task',    icon: '✅', color: '#d97706' },
    meeting: { label: 'Meeting', icon: '🤝', color: '#7c3aed' },
    travel:  { label: 'Travel',  icon: '✈️', color: '#0891b2' },
    food:    { label: 'Food',    icon: '🍽️', color: '#dc2626' },
    plan:    { label: 'Plan',    icon: '📋', color: '#059669' },
    social:  { label: 'Social',  icon: '🎉', color: '#db2777' },
    other:   { label: 'Other',   icon: '📌', color: '#6b7280' },
  };

  function encodeEventType(type, description) {
    return `[type:${type}]${description ? '\n' + description : ''}`;
  }

  function decodeEventType(description) {
    if (!description) return { type: 'other', description: '' };
    const match = description.match(/^\[type:(\w+)\]/);
    if (match) {
      const type = match[1];
      const desc = description.replace(/^\[type:\w+\]\n?/, '');
      return { type: EVENT_TYPES[type] ? type : 'other', description: desc };
    }
    return { type: 'other', description };
  }

  // ── Event Type Button Selection ──
  let selectedEventType = 'study';

  document.querySelectorAll('.event-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.event-type-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedEventType = btn.dataset.type;
    });
  });

  // ── Clock Picker State ──
  let clockMode = null;
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
        if      (clockMode === 'startHour') setActiveSegment('startMin');
        else if (clockMode === 'startMin')  setActiveSegment('endHour');
        else if (clockMode === 'endHour')   setActiveSegment('endMin');
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
  const newEventBtn      = document.getElementById('newEventBtn');
  const newEventBtnMobile = document.getElementById('newEventBtnMobile');
  const modalOverlay     = document.getElementById('modalOverlay');
  const eventModal       = document.getElementById('eventModal');
  const modalClose       = document.getElementById('modalClose');
  const modalCancel      = document.getElementById('modalCancel');
  const saveEventBtn     = document.getElementById('saveEvent');
  const modalError       = document.getElementById('modalError');

  function openModal() {
    document.getElementById('eventTitle').value       = '';
    document.getElementById('eventDate').value        = new Date().toISOString().split('T')[0];
    document.getElementById('eventDescription').value = '';
    modalError.textContent = '';

    // Reset event type to 'study'
    selectedEventType = 'study';
    document.querySelectorAll('.event-type-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.type === 'study');
    });

    // Reset clock state
    clockMode = null;
    timeState = {
      startHour: 9,  startMin: 0,  startAmpm: 'AM',
      endHour:   10, endMin:   0,  endAmpm:   'AM',
    };
    updateTimeDisplays();

    modalOverlay.classList.add('active');
    requestAnimationFrame(() => eventModal.classList.add('active'));
    document.getElementById('eventTitle').focus();
  }

  function closeModal() {
    eventModal?.classList.remove('active');
    modalOverlay?.classList.remove('active');
    document.getElementById('clockPicker')?.classList.remove('visible');
  }

  newEventBtn?.addEventListener('click', openModal);
  newEventBtnMobile?.addEventListener('click', openModal);
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

    modalError.textContent   = '';
    saveEventBtn.textContent = 'Saving…';
    saveEventBtn.disabled    = true;

    const encodedDescription = encodeEventType(selectedEventType, desc);

    try {
      await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: {
          summary:     title,
          description: encodedDescription,
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
      await listUpcomingEvents();
    } catch (err) {
      modalError.textContent = err.result?.error?.message || 'Failed to save. Please try again.';
    } finally {
      saveEventBtn.textContent = 'Save Event';
      saveEventBtn.disabled    = false;
    }
  });

  // ── Event Detail Modal ──
  function openEventDetail(event) {
    const start = new Date(event.start.dateTime || event.start.date);
    const end   = new Date(event.end.dateTime   || event.end.date);

    const timeStr = event.start.dateTime
      ? `${start.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'})} – ${end.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'})}`
      : 'All day';

    const { type, description } = decodeEventType(event.description);
    const typeConfig = EVENT_TYPES[type] || EVENT_TYPES.other;

    const detail = document.getElementById('eventDetailModal');
    document.getElementById('detailTitle').textContent = event.summary || 'Untitled';
    document.getElementById('detailTime').textContent  = timeStr;
    document.getElementById('detailDate').textContent  = start.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'});
    document.getElementById('detailDescription').textContent = description || 'No description.';

    const badge = document.getElementById('detailTypeBadge');
    badge.textContent = `${typeConfig.icon} ${typeConfig.label}`;
    badge.style.background = typeConfig.color;

    detail.dataset.eventId = event.id;

    document.getElementById('modalOverlay').classList.add('active');
    requestAnimationFrame(() => detail.classList.add('active'));
  }

  document.getElementById('detailClose')?.addEventListener('click', () => {
    document.getElementById('eventDetailModal').classList.remove('active');
    document.getElementById('modalOverlay').classList.remove('active');
  });

  document.getElementById('deleteEvent')?.addEventListener('click', async () => {
    const detail  = document.getElementById('eventDetailModal');
    const eventId = detail.dataset.eventId;
    if (!eventId) return;

    const btn = document.getElementById('deleteEvent');
    btn.textContent = 'Deleting…';
    btn.disabled = true;

    try {
      await gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
      detail.classList.remove('active');
      document.getElementById('modalOverlay').classList.remove('active');
      await listUpcomingEvents();
    } catch (err) {
      alert('Failed to delete event: ' + (err.result?.error?.message || err.message));
    } finally {
      btn.textContent = 'Delete';
      btn.disabled = false;
    }
  });

  // ── Content Click Handler ──
  document.getElementById('content')?.addEventListener('click', (e) => {
    // Check for event click FIRST
    const eventEl = e.target.closest('.event');
    if (eventEl) {
      e.stopPropagation();
      const event = JSON.parse(eventEl.dataset.event);
      openEventDetail(event);
      return;
    }

    // Click on empty cell → open modal pre-filled
    const cell = e.target.closest('.day-cell');
    if (!cell) return;

    const dayIndex = parseInt(cell.dataset.day);
    const hour     = parseInt(cell.dataset.hour);
    const min      = parseInt(cell.dataset.min);

    let clickedDay;

    if (isMobile()) {
      // In day view, the displayed day is today + currentDayOffset
      const today = new Date();
      clickedDay = new Date(today);
      clickedDay.setDate(today.getDate() + currentDayOffset);
      clickedDay.setHours(0, 0, 0, 0);
    } else {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + (currentWeekOffset * 7));
      startOfWeek.setHours(0, 0, 0, 0);
      clickedDay = new Date(startOfWeek);
      clickedDay.setDate(startOfWeek.getDate() + dayIndex);
    }

    openModal();

    const yyyy = clickedDay.getFullYear();
    const mm   = String(clickedDay.getMonth() + 1).padStart(2, '0');
    const dd   = String(clickedDay.getDate()).padStart(2, '0');
    document.getElementById('eventDate').value = `${yyyy}-${mm}-${dd}`;

    const startAmpm   = hour < 12 ? 'AM' : 'PM';
    const startHour12 = hour % 12 || 12;
    timeState.startHour  = startHour12;
    timeState.startMin   = min;
    timeState.startAmpm  = startAmpm;

    const endHour24 = (hour + 1) % 24;
    const endAmpm   = endHour24 < 12 ? 'AM' : 'PM';
    const endHour12 = endHour24 % 12 || 12;
    timeState.endHour  = endHour12;
    timeState.endMin   = min;
    timeState.endAmpm  = endAmpm;

    updateTimeDisplays();
  });

});