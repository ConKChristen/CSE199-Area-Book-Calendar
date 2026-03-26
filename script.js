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
      closeColorModal();
    }
  });

  // ── Week / Day Navigation ──
  document.getElementById('prevWeek')?.addEventListener('click', prevWeek);
  document.getElementById('nextWeek')?.addEventListener('click', nextWeek);
  document.getElementById('todayButton')?.addEventListener('click', goToToday);

  document.getElementById('prevDay')?.addEventListener('click', prevDay);
  document.getElementById('nextDay')?.addEventListener('click', nextDay);
  document.getElementById('todayDayButton')?.addEventListener('click', goToDayToday);

  window.addEventListener('resize', () => {
    if (typeof gapi !== 'undefined' && gapi.client && gapi.client.getToken()) {
      listUpcomingEvents();
    }
  });

  // ── Event Type Config (mirrors inline script; reads live from window.EVENT_TYPES) ──
  // We use window.EVENT_TYPES (set in index.html) so color changes propagate everywhere.
  // For convenience, alias it:
  function getTypes() { return window.EVENT_TYPES; }

  function encodeEventType(type, description) {
    return `[type:${type}]${description ? '\n' + description : ''}`;
  }

  function decodeEventType(description) {
    const types = getTypes();
    if (!description) return { type: 'other', description: '' };
    const match = description.match(/^\[type:(\w+)\]/);
    if (match) {
      const type = match[1];
      const desc = description.replace(/^\[type:\w+\]\n?/, '');
      return { type: types[type] ? type : 'other', description: desc };
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
  const newEventBtn       = document.getElementById('newEventBtn');
  const newEventBtnMobile = document.getElementById('newEventBtnMobile');
  const modalOverlay      = document.getElementById('modalOverlay');
  const eventModal        = document.getElementById('eventModal');
  const modalClose        = document.getElementById('modalClose');
  const modalCancel       = document.getElementById('modalCancel');
  const saveEventBtn      = document.getElementById('saveEvent');
  const modalError        = document.getElementById('modalError');

  function openModal() {
    document.getElementById('eventTitle').value       = '';
    document.getElementById('eventDate').value        = new Date().toISOString().split('T')[0];
    document.getElementById('eventDescription').value = '';
    modalError.textContent = '';

    selectedEventType = 'study';
    document.querySelectorAll('.event-type-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.type === 'study');
    });

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
    delete saveEventBtn.dataset.editId;
    document.querySelector('#eventModal .modal-header h3').textContent = 'New Event';
    saveEventBtn.textContent = 'Save Event';
  }

  newEventBtn?.addEventListener('click', openModal);
  newEventBtnMobile?.addEventListener('click', openModal);
  modalClose?.addEventListener('click',  closeModal);
  modalCancel?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // ── Save / Update Event ──
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
    const editId = saveEventBtn.dataset.editId;

    try {
      if (editId) {
        await gapi.client.calendar.events.patch({
          calendarId: 'primary',
          eventId: editId,
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
      } else {
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
      }

      closeModal();
      await listUpcomingEvents();
    } catch (err) {
      modalError.textContent = err.result?.error?.message || 'Failed to save. Please try again.';
    } finally {
      saveEventBtn.textContent = editId ? 'Update Event' : 'Save Event';
      saveEventBtn.disabled    = false;
    }
  });

  // ── Event Detail Modal ──
  function openEventDetail(event) {
    const types = getTypes();
    const start = new Date(event.start.dateTime || event.start.date);
    const end   = new Date(event.end.dateTime   || event.end.date);

    const timeStr = event.start.dateTime
      ? `${start.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'})} – ${end.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'})}`
      : 'All day';

    const { type, description } = decodeEventType(event.description);
    const typeConfig = types[type] || types.other;

    const detail = document.getElementById('eventDetailModal');
    document.getElementById('detailTitle').textContent       = event.summary || 'Untitled';
    document.getElementById('detailTime').textContent        = timeStr;
    document.getElementById('detailDate').textContent        = start.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'});
    document.getElementById('detailDescription').textContent = description || 'No description.';

    const badge = document.getElementById('detailTypeBadge');
    badge.textContent      = `${typeConfig.icon} ${typeConfig.label}`;
    badge.style.background = typeConfig.color;

    detail.dataset.eventId   = event.id;
    detail.dataset.eventJson = JSON.stringify(event);

    document.getElementById('modalOverlay').classList.add('active');
    requestAnimationFrame(() => detail.classList.add('active'));
  }

  document.getElementById('detailClose')?.addEventListener('click', () => {
    document.getElementById('eventDetailModal').classList.remove('active');
    document.getElementById('modalOverlay').classList.remove('active');
  });

  // ── Edit Event ──
  document.getElementById('editEvent')?.addEventListener('click', () => {
    const detail = document.getElementById('eventDetailModal');
    const event  = JSON.parse(detail.dataset.eventJson);

    detail.classList.remove('active');
    document.getElementById('modalOverlay').classList.remove('active');

    openModal();

    const start = new Date(event.start.dateTime || event.start.date);
    const end   = new Date(event.end.dateTime   || event.end.date);

    document.getElementById('eventTitle').value       = event.summary || '';
    document.getElementById('eventDescription').value = decodeEventType(event.description).description || '';

    const yyyy = start.getFullYear();
    const mm   = String(start.getMonth() + 1).padStart(2, '0');
    const dd   = String(start.getDate()).padStart(2, '0');
    document.getElementById('eventDate').value = `${yyyy}-${mm}-${dd}`;

    const { type } = decodeEventType(event.description);
    selectedEventType = type;
    document.querySelectorAll('.event-type-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.type === type);
    });

    timeState.startHour  = start.getHours() % 12 || 12;
    timeState.startMin   = start.getMinutes();
    timeState.startAmpm  = start.getHours() < 12 ? 'AM' : 'PM';
    timeState.endHour    = end.getHours() % 12 || 12;
    timeState.endMin     = end.getMinutes();
    timeState.endAmpm    = end.getHours() < 12 ? 'AM' : 'PM';
    updateTimeDisplays();

    document.querySelector('#eventModal .modal-header h3').textContent = 'Edit Event';
    saveEventBtn.textContent    = 'Update Event';
    saveEventBtn.dataset.editId = event.id;
  });

  // ── Delete Event ──
  document.getElementById('deleteEvent')?.addEventListener('click', async () => {
    const detail  = document.getElementById('eventDetailModal');
    const eventId = detail.dataset.eventId;
    if (!eventId) return;

    const btn = document.getElementById('deleteEvent');
    btn.textContent = 'Deleting…';
    btn.disabled    = true;

    try {
      await gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId:    eventId,
      });
      detail.classList.remove('active');
      document.getElementById('modalOverlay').classList.remove('active');
      await listUpcomingEvents();
    } catch (err) {
      alert('Failed to delete event: ' + (err.result?.error?.message || err.message));
    } finally {
      btn.textContent = 'Delete';
      btn.disabled    = false;
    }
  });

  // ── Content Click Handler ──
  document.getElementById('content')?.addEventListener('click', (e) => {
    const eventEl = e.target.closest('.event');
    if (eventEl) {
      e.stopPropagation();
      const event = JSON.parse(eventEl.dataset.event);
      openEventDetail(event);
      return;
    }

    const cell = e.target.closest('.day-cell');
    if (!cell) return;

    const dayIndex = parseInt(cell.dataset.day);
    const hour     = parseInt(cell.dataset.hour);
    const min      = parseInt(cell.dataset.min);

    let clickedDay;

    if (isMobile()) {
      const today = new Date();
      clickedDay  = new Date(today);
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

  // ═══════════════════════════════════════════════════
  // ── Color Customization Modal ──
  // ═══════════════════════════════════════════════════

  const colorModal     = document.getElementById('colorModal');
  const colorModalOverlay = document.getElementById('modalOverlay'); // reuses same overlay
  const colorGrid      = document.getElementById('colorCustomizerGrid');

  // Preset palette swatches — a curated set of accessible colors
  const COLOR_PRESETS = [
    '#2563eb', '#1d4ed8', '#3b82f6', '#60a5fa',  // blues
    '#7c3aed', '#6d28d9', '#8b5cf6', '#a78bfa',  // purples
    '#db2777', '#be185d', '#ec4899', '#f472b6',  // pinks
    '#dc2626', '#b91c1c', '#ef4444', '#f87171',  // reds
    '#d97706', '#b45309', '#f59e0b', '#fbbf24',  // ambers
    '#059669', '#047857', '#10b981', '#34d399',  // greens
    '#0891b2', '#0e7490', '#06b6d4', '#22d3ee',  // cyans
    '#6b7280', '#4b5563', '#9ca3af', '#374151',  // grays
  ];

  function buildColorModal() {
    const types = getTypes();
    colorGrid.innerHTML = '';

    Object.keys(types).forEach(typeKey => {
      const cfg = types[typeKey];

      const row = document.createElement('div');
      row.className = 'color-row';
      row.dataset.type = typeKey;

      // Label
      const label = document.createElement('div');
      label.className = 'color-row-label';
      label.innerHTML = `<span class="color-row-icon">${cfg.icon}</span><span>${cfg.label}</span>`;

      // Current swatch + native color picker
      const swatchWrap = document.createElement('div');
      swatchWrap.className = 'color-swatch-wrap';

      const swatch = document.createElement('div');
      swatch.className = 'color-current-swatch';
      swatch.style.background = cfg.color;
      swatch.title = 'Click to open color picker';

      const hiddenPicker = document.createElement('input');
      hiddenPicker.type = 'color';
      hiddenPicker.value = cfg.color;
      hiddenPicker.className = 'color-hidden-input';

      // Clicking swatch opens native picker
      swatch.addEventListener('click', () => hiddenPicker.click());
      hiddenPicker.addEventListener('input', (e) => {
        applyColorChange(typeKey, e.target.value);
        swatch.style.background = e.target.value;
        highlightActivePreset(row, e.target.value);
      });

      swatchWrap.appendChild(swatch);
      swatchWrap.appendChild(hiddenPicker);

      // Preset swatches row
      const presets = document.createElement('div');
      presets.className = 'color-presets';

      COLOR_PRESETS.forEach(hex => {
        const dot = document.createElement('button');
        dot.className = 'color-preset-dot';
        dot.style.background = hex;
        dot.title = hex;
        dot.setAttribute('aria-label', `Set color to ${hex}`);
        if (hex.toLowerCase() === cfg.color.toLowerCase()) dot.classList.add('active');

        dot.addEventListener('click', () => {
          applyColorChange(typeKey, hex);
          // Update swatch and picker
          swatch.style.background = hex;
          hiddenPicker.value = hex;
          highlightActivePreset(row, hex);
        });

        presets.appendChild(dot);
      });

      row.appendChild(label);
      row.appendChild(swatchWrap);
      row.appendChild(presets);
      colorGrid.appendChild(row);
    });
  }

  function highlightActivePreset(row, hex) {
    row.querySelectorAll('.color-preset-dot').forEach(dot => {
      dot.classList.toggle('active', dot.style.background === hex || hexToRgb(dot.title) === hexToRgb(hex));
    });
  }

  // Normalize hex for comparison (browser may convert #abc → rgb())
  function hexToRgb(hex) {
    const c = document.createElement('canvas').getContext('2d');
    c.fillStyle = hex;
    return c.fillStyle;
  }

  function applyColorChange(typeKey, color) {
    // Update runtime config
    window.EVENT_TYPES[typeKey].color = color;
    // Persist
    window.saveEventTypeColors(window.EVENT_TYPES);
    // Update CSS variable immediately
    document.documentElement.style.setProperty(`--event-${typeKey}`, color);
    // Update legend dot
    const legendDot = document.querySelector(`.legend-dot.${typeKey}`);
    if (legendDot) legendDot.style.background = color;
    // Update event type button background (if selected)
    const typeBtn = document.querySelector(`.event-type-btn[data-type="${typeKey}"]`);
    if (typeBtn) typeBtn.style.setProperty('--type-color', color);
  }

  function openColorModal() {
    buildColorModal();
    colorModalOverlay.classList.add('active');
    requestAnimationFrame(() => colorModal.classList.add('active'));
  }

  function closeColorModal() {
    colorModal?.classList.remove('active');
    // Only remove overlay if event modal isn't also open
    if (!document.getElementById('eventModal').classList.contains('active') &&
        !document.getElementById('eventDetailModal').classList.contains('active')) {
      colorModalOverlay?.classList.remove('active');
    }
  }

  document.getElementById('colorModalClose')?.addEventListener('click', closeColorModal);
  document.getElementById('colorModalDone')?.addEventListener('click', closeColorModal);

  document.getElementById('customizeColorsBtn')?.addEventListener('click', openColorModal);
  document.getElementById('customizeColorsBtnMobile')?.addEventListener('click', openColorModal);

  // Reset to defaults
  document.getElementById('resetColors')?.addEventListener('click', () => {
    const defaults = window.EVENT_TYPE_DEFAULTS;
    Object.keys(defaults).forEach(typeKey => {
      applyColorChange(typeKey, defaults[typeKey].color);
    });
    // Rebuild modal to reflect reset
    buildColorModal();
    // Re-render calendar if loaded
    if (typeof gapi !== 'undefined' && gapi.client && gapi.client.getToken()) {
      listUpcomingEvents();
    }
  });

  // Also re-render calendar after closing color modal (colors may have changed)
  document.getElementById('colorModalDone')?.addEventListener('click', () => {
    if (typeof gapi !== 'undefined' && gapi.client && gapi.client.getToken()) {
      listUpcomingEvents();
    }
  });

});