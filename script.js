// ========================================
// PMU WAY - MAIN SCRIPT (CLEAN VERSION)
// ========================================

// ========== UTILITY FUNCTIONS ==========
function setRealHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== SPLASH SCREEN ==========
window.addEventListener('load', function() {
    const savedColor = localStorage.getItem('pmu_theme_color');
    if (savedColor) {
        document.documentElement.style.setProperty('--pmu-orange', savedColor);
    }
    
    loadEventsFromStorage();
    renderReminders();
    renderFavorites();

    setTimeout(function() {
        const splash = document.getElementById('splash-screen');
        const container = document.querySelector('.app-container');

        if (splash) {
            splash.style.opacity = '0';
            splash.style.visibility = 'hidden';
            setTimeout(() => splash.classList.add('hidden'), 500);
        }

        if (container) {
            container.classList.remove('hidden');
        }

        setTimeout(() => setRealHeight(), 300);
    }, 2000);
});

window.addEventListener('resize', setRealHeight);
window.addEventListener('orientationchange', setRealHeight);

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('✅ Service Worker registered:', registration.scope))
            .catch(error => console.log('❌ Service Worker failed:', error));
    });
}

// ========== SCREEN NAVIGATION ==========
function showScreen(screenId, element) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(screenId);
    if (target) target.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');
    
    if (screenId === 'reminders-page') renderReminders();
    if (screenId === 'search-page') renderFavorites();
}

// ========== DEFAULT ROOMS ==========
const defaultRooms = {
    "101": {
        floor: "Floor 1",
        building: "Building A",
        image: "./room1.png",
        desc: "Located near the North Elevator. Perfect for group studies and lectures.",
        descAr: "يقع بالقرب من المصعد الشمالي. مثالي للدراسات الجماعية والمحاضرات",
        floor1: "Second floor",
        floor2: "First Floor",
        floor3: "ground floor"
    }
};

let customRooms = JSON.parse(localStorage.getItem('pmu_custom_rooms')) || {};

// ========== SEARCH FUNCTIONS ==========
function searchRoom() {
    const input = document.getElementById('roomInput').value.trim();
    const resultsArea = document.getElementById('search-results-area');
    const inputArea = document.getElementById('search-input-area');
    const allRooms = { ...defaultRooms, ...customRooms };
    const roomData = allRooms[input];

    if (roomData) {
        document.getElementById('roomImage').src = roomData.image;
        document.getElementById('roomTitleDisplay').innerHTML = `ROOM ${input}`;
        document.getElementById('roomDesc').innerHTML = roomData.desc || "When you enter through the gate, head to the right where your classroom is located.";
        document.getElementById('roomDescAr').innerHTML = roomData.descAr || "عند دخولك من البوابة، اتجه إلى اليمين حيث يقع صفك الدراسي";
        document.getElementById('roomTitle').innerHTML = `ROOM ${input}`;
        document.getElementById('roomFloor1').innerHTML = roomData.floor1 || "Second floor";
        document.getElementById('roomFloor2').innerHTML = roomData.floor2 || "First Floor";
        document.getElementById('roomFloor3').innerHTML = roomData.floor3 || "ground floor";
        
        window.currentRoomNumber = input;
        inputArea.classList.add('hidden');
        resultsArea.classList.remove('hidden');
        showToast(`📍 Room ${input} found!`);
    } else {
        showToast("Room not found! Try 101", true);
    }
}

function goBack() {
    document.getElementById('search-results-area').classList.add('hidden');
    document.getElementById('search-input-area').classList.remove('hidden');
}

// ========== FAVORITES ==========
let favorites = JSON.parse(localStorage.getItem('pmu_favorites')) || [];

function toggleFavorite() {
    const roomNumber = window.currentRoomNumber;
    if (!roomNumber) { showToast("No room selected!", true); return; }
    
    if (favorites.includes(roomNumber)) {
        favorites = favorites.filter(r => r !== roomNumber);
        showToast(`Room ${roomNumber} removed`);
    } else {
        favorites.push(roomNumber);
        showToast(`Room ${roomNumber} added! ❤️`);
    }
    localStorage.setItem('pmu_favorites', JSON.stringify(favorites));
    renderFavorites();
}

function renderFavorites() {
    const favContainer = document.getElementById('favorites-list');
    if (!favContainer) return;
    favContainer.innerHTML = '';
    
    if (favorites.length === 0) {
        favContainer.innerHTML = '<p style="color:rgba(255,255,255,0.5); font-size:12px; text-align:center;">No favorites yet</p>';
        return;
    }
    
    favorites.forEach(room => {
        favContainer.innerHTML += `
            <div class="fav-item-card" onclick="goToRoom('${room}')">
                <span><i class="fa-solid fa-location-dot" style="color:var(--pmu-orange);"></i> Room ${room}</span>
                <button onclick="event.stopPropagation(); removeFromFav('${room}')"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    });
}

function removeFromFav(roomNumber) {
    favorites = favorites.filter(r => r !== roomNumber);
    localStorage.setItem('pmu_favorites', JSON.stringify(favorites));
    renderFavorites();
    showToast(`Room ${roomNumber} removed`);
}

function goToRoom(roomNumber) {
    document.getElementById('roomInput').value = roomNumber;
    searchRoom();
    showScreen('search-page');
}

function shareLocation() {
    const roomNumber = window.currentRoomNumber;
    if (!roomNumber) { showToast("No room selected", true); return; }
    const text = `📍 Room ${roomNumber} at PMU`;
    if (navigator.share) {
        navigator.share({ title: 'PMU Location', text: text });
    } else {
        navigator.clipboard.writeText(text);
        showToast("Copied!");
    }
}

// ========== REMINDERS ==========
let reminders = JSON.parse(localStorage.getItem('pmu_reminders')) || [];

function addReminder() {
    const title = document.getElementById('remindTitle').value;
    const date = document.getElementById('remindDate').value;
    if (title && date) {
        reminders.push({ id: Date.now(), title: title, targetDate: new Date(date).getTime() });
        localStorage.setItem('pmu_reminders', JSON.stringify(reminders));
        document.getElementById('remindTitle').value = '';
        document.getElementById('remindDate').value = '';
        renderReminders();
        showToast("✅ Reminder added!");
    } else {
        showToast("Please fill all fields!", true);
    }
}

function renderReminders() {
    const list = document.getElementById('reminders-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (reminders.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.5);"><i class="fa-regular fa-bell-slash" style="font-size:40px;"></i><br>No reminders</div>';
        return;
    }
    
    reminders.forEach(rem => {
        list.innerHTML += `
            <div class="reminder-card">
                <div class="reminder-header">
                    <span class="reminder-title">🔔 ${escapeHtml(rem.title)}</span>
                    <button onclick="deleteReminder(${rem.id})" class="delete-rem-btn"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modern-countdown" data-date="${rem.targetDate}">
                    <div class="time-box"><span class="time-value">0</span><span class="time-label">Days</span></div>
                    <div class="time-box"><span class="time-value">0</span><span class="time-label">Hours</span></div>
                    <div class="time-box"><span class="time-value">0</span><span class="time-label">Mins</span></div>
                    <div class="time-box"><span class="time-value">0</span><span class="time-label">Secs</span></div>
                </div>
            </div>
        `;
    });
    updateCountdowns();
}

function updateCountdowns() {
    document.querySelectorAll('.modern-countdown').forEach(timer => {
        const target = parseInt(timer.getAttribute('data-date'));
        const diff = target - new Date().getTime();
        const values = timer.querySelectorAll('.time-value');
        
        if (diff <= 0) {
            timer.innerHTML = "<p style='color:var(--pmu-orange); text-align:center;'>⏰ Time is Up!</p>";
        } else {
            values[0].innerText = Math.floor(diff / 86400000);
            values[1].innerText = Math.floor((diff % 86400000) / 3600000);
            values[2].innerText = Math.floor((diff % 3600000) / 60000);
            values[3].innerText = Math.floor((diff % 60000) / 1000);
        }
    });
}

function deleteReminder(id) {
    if (confirm('Delete reminder?')) {
        reminders = reminders.filter(r => r.id !== id);
        localStorage.setItem('pmu_reminders', JSON.stringify(reminders));
        renderReminders();
        showToast("Reminder deleted");
    }
}

setInterval(updateCountdowns, 1000);

// ========== CALENDAR EVENTS ==========
function saveAllEvents() {
    const events = [];
    document.querySelectorAll('#home-page .event-card').forEach(card => {
        events.push({
            month: card.querySelector('.event-date').childNodes[0].textContent.trim(),
            day: card.querySelector('.event-date span').textContent.trim(),
            title: card.querySelector('.event-info h4').textContent.trim()
        });
    });
    localStorage.setItem('pmu_calendar_events', JSON.stringify(events));
}

function loadEventsFromStorage() {
    const saved = localStorage.getItem('pmu_calendar_events');
    if (saved) {
        const events = JSON.parse(saved);
        const sectionTitle = document.querySelector('.calendar-section .section-title');
        document.querySelectorAll('#home-page .event-card').forEach(el => el.remove());
        events.forEach(ev => {
            sectionTitle.insertAdjacentHTML('afterend', `
                <div class="event-card">
                    <div class="event-date">${ev.month}<span>${ev.day}</span></div>
                    <div class="event-info"><h4>${ev.title}</h4><p>Academic Event</p></div>
                </div>
            `);
        });
    }
}

function addNewEvent() {
    const month = document.getElementById('eventMonth').value.toUpperCase();
    const day = document.getElementById('eventDay').value;
    const title = document.getElementById('eventTitle').value;
    if (month && day && title) {
        const sectionTitle = document.querySelector('.calendar-section .section-title');
        sectionTitle.insertAdjacentHTML('afterend', `
            <div class="event-card">
                <div class="event-date">${month}<span>${day}</span></div>
                <div class="event-info"><h4>${title}</h4><p>Added via Admin</p></div>
            </div>
        `);
        saveAllEvents();
        refreshAdminEvents();
        showToast("Event Added!");
        document.getElementById('eventMonth').value = '';
        document.getElementById('eventDay').value = '';
        document.getElementById('eventTitle').value = '';
    } else {
        showToast("Fill all fields!", true);
    }
}

function deleteEvent(index) {
    if (confirm('Delete event?')) {
        document.querySelectorAll('#home-page .event-card')[index]?.remove();
        saveAllEvents();
        refreshAdminEvents();
        showToast("Event deleted");
    }
}

function refreshAdminEvents() {
    const listContainer = document.getElementById('admin-events-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    document.querySelectorAll('#home-page .event-card').forEach((event, index) => {
        const month = event.querySelector('.event-date').childNodes[0].textContent;
        const day = event.querySelector('.event-date span').textContent;
        const title = event.querySelector('.event-info h4').textContent;
        listContainer.innerHTML += `
            <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; border-radius:10px; margin-bottom:8px;">
                <span><strong style="color:var(--pmu-orange);">${month} ${day}</strong>: ${title}</span>
                <button onclick="deleteEvent(${index})" style="background:none; border:none; color:#ff4444;"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
}

// ========== ADMIN ROOMS ==========
function addNewRoom() {
    const number = document.getElementById('newRoomNumber').value.trim();
    const building = document.getElementById('newRoomBuilding').value.trim();
    const desc = document.getElementById('newRoomDesc').value.trim();
    const descAr = document.getElementById('newRoomDescAr')?.value.trim() || "";
    const imageFile = document.getElementById('newRoomImage').files[0];

    if (!number || !building) {
        showToast("Please fill Room Number and Building!", true);
        return;
    }

    const saveRoom = (imageData) => {
        customRooms[number] = {
            building: building,
            image: imageData || "https://via.placeholder.com/400x200",
            desc: desc || "No description",
            descAr: descAr || "لا يوجد وصف",
            floor1: "Second floor",
            floor2: "First Floor",
            floor3: "ground floor"
        };
        localStorage.setItem('pmu_custom_rooms', JSON.stringify(customRooms));
        refreshAdminRooms();
        updateAdminStats();
        showToast(`Room ${number} added! 🚀`);
        
        document.getElementById('newRoomNumber').value = '';
        document.getElementById('newRoomBuilding').value = '';
        document.getElementById('newRoomDesc').value = '';
        if (document.getElementById('newRoomDescAr')) document.getElementById('newRoomDescAr').value = '';
        document.getElementById('newRoomImage').value = '';
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = e => saveRoom(e.target.result);
        reader.readAsDataURL(imageFile);
    } else {
        saveRoom(null);
    }
}

function refreshAdminRooms() {
    const listContainer = document.getElementById('admin-rooms-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    const allRooms = { ...defaultRooms, ...customRooms };
    Object.keys(allRooms).forEach(roomNum => {
        const room = allRooms[roomNum];
        const isDefault = defaultRooms.hasOwnProperty(roomNum);
        listContainer.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px; border-radius:10px; margin-bottom:8px;">
                <div><strong style="color:var(--pmu-orange);">Room ${roomNum}</strong><br><small>${room.building}</small></div>
                ${!isDefault ? `<button onclick="deleteCustomRoom('${roomNum}')" style="background:none; border:none; color:#ff4444;"><i class="fa-solid fa-trash"></i></button>` : '<i class="fa-solid fa-lock"></i>'}
            </div>
        `;
    });
}

function deleteCustomRoom(roomNumber) {
    if (confirm(`Delete Room ${roomNumber}?`)) {
        delete customRooms[roomNumber];
        localStorage.setItem('pmu_custom_rooms', JSON.stringify(customRooms));
        refreshAdminRooms();
        updateAdminStats();
        showToast(`Room ${roomNumber} deleted`);
    }
}

function updateAdminStats() {
    const roomsCount = Object.keys({ ...defaultRooms, ...customRooms }).length;
    const eventsCount = document.querySelectorAll('#home-page .event-card').length;
    const roomsStat = document.getElementById('stat-rooms-count');
    const eventsStat = document.getElementById('stat-events-count');
    if (roomsStat) roomsStat.innerText = roomsCount;
    if (eventsStat) eventsStat.innerText = eventsCount;
}

// ========== ADMIN LOGIN ==========
function checkAdminLogin() {
    const user = document.getElementById('adminUser').value.trim();
    const pass = document.getElementById('adminPass').value.trim();
    if (user === 'admin' && pass === 'admin') {
        showScreen('admin-dashboard');
        refreshAdminEvents();
        refreshAdminRooms();
        updateAdminStats();
        showToast("Welcome Admin!");
    } else {
        showToast("Wrong credentials!", true);
    }
}

function logoutAdmin() {
    showScreen('home-page');
    showToast("Logged out");
}

function updateThemeColor(color) {
    document.documentElement.style.setProperty('--pmu-orange', color);
    localStorage.setItem('pmu_theme_color', color);
}

// ========== TOAST ==========
function showToast(message, isError = false) {
    const toast = document.getElementById('custom-toast');
    if (!toast) return;
    toast.querySelector('span').innerText = message;
    toast.style.border = `1px solid ${isError ? '#ff4444' : 'var(--pmu-orange)'}`;
    toast.classList.remove('toast-hidden');
    toast.classList.add('toast-show');
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.classList.add('toast-hidden'), 300);
    }, 2000);
}

// ========== ADMIN PANEL ENHANCED ==========
let users = JSON.parse(localStorage.getItem('pmu_users')) || [
    { id: 1, name: "Hadeel", email: "hadeel@pmu.edu.sa", role: "admin", joinDate: "2024-01-15" },
    { id: 2, name: "Ahmed", email: "ahmed@pmu.edu.sa", role: "user", joinDate: "2024-02-20" },
    { id: 3, name: "Sarah", email: "sarah@pmu.edu.sa", role: "user", joinDate: "2024-03-10" }
];

let notifications = JSON.parse(localStorage.getItem('pmu_notifications')) || [];

function renderUsersList() {
    const container = document.getElementById('users-list-container');
    if (!container) return;
    container.innerHTML = '';
    users.forEach(user => {
        container.innerHTML += `
            <div class="user-item">
                <div class="user-info">
                    <div class="user-avatar"><i class="fa-solid fa-user"></i></div>
                    <div class="user-details">
                        <h4>${escapeHtml(user.name)}</h4>
                        <p>${escapeHtml(user.email)}</p>
                        <small>Joined: ${user.joinDate}</small>
                    </div>
                </div>
                <div class="user-actions">
                    ${user.role !== 'admin' ? `<button onclick="deleteUser(${user.id})" style="color:#ff4444;"><i class="fa-solid fa-trash"></i></button>` : '<i class="fa-solid fa-crown"></i>'}
                </div>
            </div>
        `;
    });
}

function deleteUser(userId) {
    if (confirm('Delete this user?')) {
        users = users.filter(u => u.id !== userId);
        localStorage.setItem('pmu_users', JSON.stringify(users));
        renderUsersList();
        showToast('User deleted');
    }
}

function sendNotification() {
    const title = document.getElementById('notificationTitle')?.value;
    const message = document.getElementById('notificationMessage')?.value;
    const type = document.getElementById('notificationType')?.value || 'info';
    
    if (!title || !message) {
        showToast('Please fill all fields', true);
        return;
    }
    
    notifications.unshift({ id: Date.now(), title, message, type, date: new Date().toISOString() });
    localStorage.setItem('pmu_notifications', JSON.stringify(notifications));
    
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
    }
    
    showToast('Notification sent!');
    document.getElementById('notificationTitle').value = '';
    document.getElementById('notificationMessage').value = '';
    loadNotificationHistory();
}

function loadNotificationHistory() {
    const container = document.getElementById('notification-history');
    if (!container) return;
    if (notifications.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:rgba(255,255,255,0.5); padding:20px;">No notifications yet</p>';
        return;
    }
    container.innerHTML = '';
    notifications.slice(0, 20).forEach(notif => {
        container.innerHTML += `
            <div class="notification-item ${notif.type}">
                <div class="title">${escapeHtml(notif.title)}</div>
                <div class="message">${escapeHtml(notif.message)}</div>
                <div class="date">${new Date(notif.date).toLocaleString()}</div>
            </div>
        `;
    });
}

function requestNotificationPermission() {
    if ('Notification' in window) Notification.requestPermission();
}

function exportData() {
    const data = { users, rooms: { ...defaultRooms, ...customRooms }, reminders, favorites, notifications };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pmu-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Data exported!');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.users) localStorage.setItem('pmu_users', JSON.stringify(data.users));
            if (data.rooms) {
                const imported = {};
                Object.entries(data.rooms).forEach(([k, v]) => { if (!defaultRooms[k]) imported[k] = v; });
                localStorage.setItem('pmu_custom_rooms', JSON.stringify(imported));
            }
            if (data.reminders) localStorage.setItem('pmu_reminders', JSON.stringify(data.reminders));
            if (data.favorites) localStorage.setItem('pmu_favorites', JSON.stringify(data.favorites));
            showToast('Data imported! Reloading...');
            setTimeout(() => location.reload(), 1500);
        } catch { showToast('Invalid file', true); }
    };
    reader.readAsText(file);
}

function resetApp() {
    if (confirm('⚠️ Delete ALL data?')) {
        localStorage.clear();
        showToast('App reset!');
        setTimeout(() => location.reload(), 1500);
    }
}

function deleteAllCustomRooms() {
    if (confirm('Delete ALL custom rooms?')) {
        customRooms = {};
        localStorage.setItem('pmu_custom_rooms', JSON.stringify(customRooms));
        refreshAdminRooms();
        updateAdminStats();
        showToast('All custom rooms deleted');
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('pmu_dark_mode', document.body.classList.contains('dark-mode'));
}

function toggleLanguage() {
    const newLang = document.documentElement.lang === 'en' ? 'ar' : 'en';
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('pmu_lang', newLang);
    showToast(newLang === 'en' ? 'Language: English' : 'اللغة: العربية');
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    setRealHeight();
    renderUsersList();
    loadNotificationHistory();
    updateAdminStats();
    
    // Admin tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = tab.getAttribute('data-tab');
            document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.add('hidden'));
            document.getElementById(`admin-tab-${tabName}`)?.classList.remove('hidden');
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (tabName === 'users') renderUsersList();
            if (tabName === 'notifications') loadNotificationHistory();
            if (tabName === 'rooms') refreshAdminRooms();
            if (tabName === 'events') refreshAdminEvents();
        });
    });
    
    // Dark mode toggle
    const darkToggle = document.getElementById('darkModeToggle');
    if (darkToggle && localStorage.getItem('pmu_dark_mode') === 'true') {
        document.body.classList.add('dark-mode');
        darkToggle.classList.add('active');
    }
    if (darkToggle) {
        darkToggle.addEventListener('click', () => {
            toggleDarkMode();
            darkToggle.classList.toggle('active');
        });
    }
    
    // Notification preview
    const notifTitle = document.getElementById('notificationTitle');
    const notifMsg = document.getElementById('notificationMessage');
    if (notifTitle && notifMsg) {
        notifTitle.addEventListener('input', () => {
            document.getElementById('previewTitle').innerText = notifTitle.value || 'Notification Title';
        });
        notifMsg.addEventListener('input', () => {
            document.getElementById('previewMessage').innerText = notifMsg.value || 'Your message will appear here';
        });
    }
    
    // Language
    const savedLang = localStorage.getItem('pmu_lang');
    if (savedLang === 'ar') {
        document.documentElement.lang = 'ar';
        document.documentElement.dir = 'rtl';
    }
});
