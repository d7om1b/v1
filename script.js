// حساب الـ vh الحقيقي للأجهزة المحمولة
function setRealHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('load', setRealHeight);
window.addEventListener('resize', setRealHeight);
window.addEventListener('orientationchange', setRealHeight);
// تسجيل Service Worker لـ PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}
// 1. التحكم في شاشة التحميل (Splash Screen)
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
            setTimeout(() => {
                splash.classList.add('hidden');
            }, 500);
        }

        if (container) {
            container.classList.remove('hidden');
        }

        setTimeout(() => {
            setRealHeight();
        }, 300);
    }, 2000);
});

// 2. التنقل بين الصفحات
function showScreen(screenId, element) {
    // إخفاء جميع الشاشات
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    
    // إظهار الشاشة المطلوبة
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
    }
    
    // تحديث حالة الأزرار في شريط التنقل
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }
    
    // تحديث التذكيرات إذا كانت الشاشة المطلوبة هي صفحة التذكيرات
    if (screenId === 'reminders-page') {
        renderReminders();
    }
    
    // تحديث المفضلات إذا كانت الشاشة المطلوبة هي صفحة البحث
    if (screenId === 'search-page') {
        renderFavorites();
    }
}

// --- نظام إدارة القاعات الجديد (الأدمن + البحث) ---

const defaultRooms = {
    "101": {
        floor: "Floor 1",
        building: "Building A",
             image: "./room101.jpg",
        desc: "Located near the North Elevator. Perfect for group studies and lectures.",
        nearby: { cafe: "1m", print: "30s" }
    }
};

let customRooms = JSON.parse(localStorage.getItem('pmu_custom_rooms')) || {};

function searchRoom() {
    const input = document.getElementById('roomInput').value.trim();
    const resultsArea = document.getElementById('search-results-area');
    const inputArea = document.getElementById('search-input-area');
    
    const allRooms = { ...defaultRooms, ...customRooms };
    const roomData = allRooms[input];

    if (roomData) {
        // عرض النتائج
        document.getElementById('roomImage').src = roomData.image;
        document.getElementById('roomTitleDisplay').innerHTML = `Room ${input}`;
        document.getElementById('roomDesc').innerHTML = roomData.desc;
        document.getElementById('roomTitle').innerHTML = `Room ${input}`;
        
        // تخزين رقم الغرفة الحالي للمفضلة
        window.currentRoomNumber = input;
        
        inputArea.classList.add('hidden');
        resultsArea.classList.remove('hidden');
    } else {
        showToast("Room not found! Try 101 or check Admin additions.", true);
    }
}

function addNewRoom() {
    const number = document.getElementById('newRoomNumber').value.trim();
    const building = document.getElementById('newRoomBuilding').value.trim();
    const floor = document.getElementById('newRoomFloor').value.trim();
    const desc = document.getElementById('newRoomDesc').value.trim();
    const imageFile = document.getElementById('newRoomImage').files[0];

    if (!number || !building) {
        showToast("Please fill Room Number and Building!", true);
        return;
    }

    const saveRoom = (imageData) => {
        customRooms[number] = {
            floor: floor || "N/A",
            building: building,
            image: imageData || "https://via.placeholder.com/400x200?text=New+Room",
            desc: desc || "No description provided.",
            nearby: { cafe: "Nearby", print: "Available" }
        };

        localStorage.setItem('pmu_custom_rooms', JSON.stringify(customRooms));
        
        refreshAdminRooms();
        updateAdminStats();
        
        showToast(`Room ${number} has been published! 🚀`);
        
        // تنظيف الحقول
        document.getElementById('newRoomNumber').value = '';
        document.getElementById('newRoomBuilding').value = '';
        document.getElementById('newRoomFloor').value = '';
        document.getElementById('newRoomDesc').value = '';
        document.getElementById('newRoomImage').value = '';
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            saveRoom(e.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveRoom(null);
    }
}

function goBack() {
    document.getElementById('search-results-area').classList.add('hidden');
    document.getElementById('search-input-area').classList.remove('hidden');
}

// 4. نظام الأدمن (الدخول والخروج)
function checkAdminLogin() {
    const user = document.getElementById('adminUser').value.trim();
    const pass = document.getElementById('adminPass').value.trim();
    
    if (user === 'admin' && pass === 'admin') {
        showScreen('admin-dashboard');
        refreshAdminEvents(); 
        refreshAdminRooms(); 
        updateAdminStats();
        
        document.getElementById('adminUser').value = '';
        document.getElementById('adminPass').value = '';
        showToast("Welcome Admin!");
    } else {
        showToast("Wrong username or password!", true);
    }
}

function logoutAdmin() {
    showScreen('home-page');
    showToast("Logged out successfully");
}

// 5. إدارة الألوان
function updateThemeColor(color) {
    document.documentElement.style.setProperty('--pmu-orange', color);
    localStorage.setItem('pmu_theme_color', color);
}

// 6. إدارة التقويم
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
    updateAdminStats();
}

function loadEventsFromStorage() {
    const saved = localStorage.getItem('pmu_calendar_events');
    if (saved) {
        const events = JSON.parse(saved);
        const calendarSection = document.querySelector('.calendar-section');
        const sectionTitle = calendarSection.querySelector('.section-title');
        
        // حذف الأحداث القديمة مع الاحتفاظ بالعنوان
        const oldEvents = document.querySelectorAll('#home-page .event-card');
        oldEvents.forEach(el => el.remove());

        events.forEach(ev => {
            const html = `
                <div class="event-card">
                    <div class="event-date">${ev.month}<span>${ev.day}</span></div>
                    <div class="event-info"><h4>${ev.title}</h4><p>Academic Event</p></div>
                </div>`;
            sectionTitle.insertAdjacentHTML('afterend', html);
        });
    }
}

function addNewEvent() {
    const month = document.getElementById('eventMonth').value.toUpperCase();
    const day = document.getElementById('eventDay').value;
    const title = document.getElementById('eventTitle').value;

    if (month && day && title) {
        const calendarSection = document.querySelector('.calendar-section');
        const sectionTitle = calendarSection.querySelector('.section-title');
        const newEventHTML = `
            <div class="event-card">
                <div class="event-date">${month}<span>${day}</span></div>
                <div class="event-info"><h4>${title}</h4><p>Added via Admin Panel</p></div>
            </div>`;
        sectionTitle.insertAdjacentHTML('afterend', newEventHTML);
        saveAllEvents();
        refreshAdminEvents();
        showToast("Event Added!");
        
        document.getElementById('eventMonth').value = '';
        document.getElementById('eventDay').value = '';
        document.getElementById('eventTitle').value = '';
    } else {
        showToast("Please fill all fields!", true);
    }
}

function deleteEvent(index) {
    const homeEvents = document.querySelectorAll('#home-page .event-card');
    if (confirm('Are you sure?')) {
        homeEvents[index].remove();
        saveAllEvents();
        refreshAdminEvents();
        showToast("Event deleted");
    }
}

function refreshAdminEvents() {
    const listContainer = document.getElementById('admin-events-list');
    const homeEvents = document.querySelectorAll('#home-page .event-card');
    if(!listContainer) return;
    listContainer.innerHTML = ''; 
    homeEvents.forEach((event, index) => {
        const month = event.querySelector('.event-date').childNodes[0].textContent;
        const day = event.querySelector('.event-date span').textContent;
        const title = event.querySelector('.event-info h4').textContent;
        listContainer.innerHTML += `
            <div class="admin-event-item" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px; border-radius:10px; margin-bottom:10px; border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:12px; color:white;">
                    <strong style="color:var(--pmu-orange);">${month} ${day}</strong>: ${title}
                </div>
                <button onclick="deleteEvent(${index})" style="background:none; border:none; color:#ff4444; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>`;
    });
}

// --- نظام التذكيرات ---
let reminders = JSON.parse(localStorage.getItem('pmu_reminders')) || [];

function addReminder() {
    const title = document.getElementById('remindTitle').value;
    const date = document.getElementById('remindDate').value;
    if (title && date) {
        const newRemind = { id: Date.now(), title: title, targetDate: new Date(date).getTime() };
        reminders.push(newRemind);
        localStorage.setItem('pmu_reminders', JSON.stringify(reminders));
        document.getElementById('remindTitle').value = '';
        document.getElementById('remindDate').value = '';
        renderReminders();
        showToast("Reminder added!");
    } else {
        showToast("Please fill all fields!", true);
    }
}

function renderReminders() {
    const list = document.getElementById('reminders-list');
    if(!list) return;
    list.innerHTML = '';
    
    if (reminders.length === 0) {
        list.innerHTML = '<p style="color:gray; text-align:center; margin-top:20px;">No reminders set.</p>';
        return;
    }

    reminders.forEach(rem => {
        list.innerHTML += `
            <div class="reminder-card">
                <div class="reminder-header">
                    <span class="reminder-title"><i class="fa-regular fa-bell" style="color:var(--pmu-orange); margin-right:8px;"></i>${escapeHtml(rem.title)}</span>
                    <button onclick="deleteReminder(${rem.id})" class="delete-rem-btn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                <div class="modern-countdown" data-date="${rem.targetDate}">
                    <div class="time-box"><span class="time-value">0</span><span class="time-label">Days</span></div>
                    <div class="time-box"><span class="time-value">0</span><span class="time-label">Hours</span></div>
                    <div class="time-box"><span class="time-value">0</span><span class="time-label">Mins</span></div>
                    <div class="time-box"><span class="time-value">0</span><span class="time-label">Secs</span></div>
                </div>
            </div>`;
    });
    updateCountdowns();
}

function updateCountdowns() {
    document.querySelectorAll('.modern-countdown').forEach(timer => {
        const target = parseInt(timer.getAttribute('data-date'));
        const diff = target - new Date().getTime();
        const values = timer.querySelectorAll('.time-value');

        if (diff <= 0) {
            timer.innerHTML = "<p style='color:var(--pmu-orange); font-weight:bold; width:100%; text-align:center;'>🔔 Time is Up!</p>";
        } else {
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);

            if (values.length === 4) {
                values[0].innerText = d;
                values[1].innerText = h;
                values[2].innerText = m;
                values[3].innerText = s;
            }
        }
    });
}

function deleteReminder(id) {
    reminders = reminders.filter(r => r.id !== id);
    localStorage.setItem('pmu_reminders', JSON.stringify(reminders));
    renderReminders();
    showToast("Reminder deleted");
}

// --- نظام المفضلة ---
let favorites = JSON.parse(localStorage.getItem('pmu_favorites')) || [];

function toggleFavorite() {
    const roomNumber = window.currentRoomNumber;
    if (!roomNumber) {
        showToast("No room selected!", true);
        return;
    }
    
    if (favorites.includes(roomNumber)) {
        favorites = favorites.filter(r => r !== roomNumber);
        showToast(`Room ${roomNumber} removed from favorites`);
    } else {
        favorites.push(roomNumber);
        showToast(`Room ${roomNumber} added to Favorites! ❤️`);
    }
    
    localStorage.setItem('pmu_favorites', JSON.stringify(favorites));
    renderFavorites();
}

function saveToFav(roomNumber) {
    if (!favorites.includes(roomNumber)) {
        favorites.push(roomNumber);
        localStorage.setItem('pmu_favorites', JSON.stringify(favorites));
        showToast(`Room ${roomNumber} added to Favorites! ❤️`);
        renderFavorites();
    } else {
        showToast("Already in favorites!");
    }
}

function renderFavorites() {
    const favContainer = document.getElementById('favorites-list');
    if (!favContainer) return;
    favContainer.innerHTML = '';
    if (favorites.length === 0) {
        favContainer.innerHTML = '<p style="color:gray; font-size:12px; text-align:center;">No favorites yet</p>';
        return;
    }
    favorites.forEach(room => {
        favContainer.innerHTML += `
            <div class="fav-item-card" onclick="goToRoom('${room}')" style="background:rgba(255,255,255,0.05); padding:12px; border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; cursor:pointer;">
                <span style="color:white;"><i class="fa-solid fa-location-arrow" style="color:var(--pmu-orange);"></i> Room ${room}</span>
                <button onclick="event.stopPropagation(); removeFromFav('${room}')" style="background:none; border:none; color:#ff4444; cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>
            </div>`;
    });
}

function removeFromFav(roomNumber) {
    favorites = favorites.filter(r => r !== roomNumber);
    localStorage.setItem('pmu_favorites', JSON.stringify(favorites));
    renderFavorites();
    showToast(`Room ${roomNumber} removed`);
}

function goToRoom(roomNumber) {
    const input = document.getElementById('roomInput');
    if (input) input.value = roomNumber;
    searchRoom();
    const navItems = document.querySelectorAll('.nav-item');
    let navigateBtn;
    navItems.forEach(item => { 
        if(item.innerText.includes('Navigate')) navigateBtn = item; 
    });
    showScreen('search-page', navigateBtn);
}

function shareLocation() {
    const roomNumber = window.currentRoomNumber;
    if (roomNumber) {
        const text = `Check out Room ${roomNumber} at PMU!`;
        if (navigator.share) {
            navigator.share({
                title: 'PMU Room Location',
                text: text,
            }).catch(() => showToast("Share cancelled"));
        } else {
            navigator.clipboard.writeText(text);
            showToast("Link copied to clipboard!");
        }
    }
}

// --- إدارة القاعات في الأدمن ---

function refreshAdminRooms() {
    const listContainer = document.getElementById('admin-rooms-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const allRooms = { ...defaultRooms, ...customRooms };
    const roomKeys = Object.keys(allRooms);

    if (roomKeys.length === 0) {
        listContainer.innerHTML = '<p style="color:gray; font-size:12px; text-align:center;">No rooms in system.</p>';
        return;
    }

    roomKeys.forEach(roomNum => {
        const room = allRooms[roomNum];
        const isDefault = defaultRooms.hasOwnProperty(roomNum);

        listContainer.innerHTML += `
            <div class="admin-event-item" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px; border-radius:10px; margin-bottom:10px; border:1px solid ${isDefault ? 'rgba(239, 125, 0, 0.3)' : 'rgba(255,255,255,0.1)'};">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${room.image}" style="width:40px; height:40px; border-radius:5px; object-fit:cover; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="font-size:12px; color:white;">
                        <strong style="color:var(--pmu-orange);">Room ${roomNum}</strong> 
                        ${isDefault ? '<span style="font-size:9px; background:var(--pmu-orange); color:black; padding:1px 4px; border-radius:3px; margin-left:5px;">System</span>' : ''}
                        <br>
                        <span style="font-size:10px; color:#aaa;">${room.building}</span>
                    </div>
                </div>
                ${!isDefault ? `
                    <button onclick="deleteCustomRoom('${roomNum}')" style="background:none; border:none; color:#ff4444; cursor:pointer; padding:10px;">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                ` : '<i class="fa-solid fa-lock" style="color:rgba(255,255,255,0.2); font-size:12px; margin-right:10px;"></i>'}
            </div>`;
    });
}

function deleteCustomRoom(roomNumber) {
    if (confirm(`Are you sure you want to delete Room ${roomNumber}?`)) {
        delete customRooms[roomNumber];
        localStorage.setItem('pmu_custom_rooms', JSON.stringify(customRooms));
        refreshAdminRooms();
        updateAdminStats();
        showToast(`Room ${roomNumber} deleted`);
    }
}

// --- تحديث الإحصائيات ---

function updateAdminStats() {
    const allRoomsCount = Object.keys({ ...defaultRooms, ...customRooms }).length;
    const roomsStatElement = document.getElementById('stat-rooms-count');
    if (roomsStatElement) roomsStatElement.innerText = allRoomsCount;

    const homeEventsCount = document.querySelectorAll('#home-page .event-card').length;
    const eventsStatElement = document.getElementById('stat-events-count');
    if (eventsStatElement) eventsStatElement.innerText = homeEventsCount;
}

// --- Toast Notification ---
function showToast(message, isError = false) {
    const toast = document.getElementById('custom-toast');
    if (!toast) return;

    const toastMessage = toast.querySelector('span');
    const toastIcon = toast.querySelector('i');
    
    if (toastMessage) toastMessage.innerText = message;
    
    if (isError) {
        if (toastIcon) toastIcon.className = 'fa-solid fa-exclamation-triangle';
        toast.style.border = '1px solid rgba(255, 68, 68, 0.4)';
    } else {
        if (toastIcon) toastIcon.className = 'fa-solid fa-circle-check';
        toast.style.border = '1px solid rgba(239, 125, 0, 0.4)';
    }
    
    toast.classList.remove('toast-hidden');
    toast.classList.add('toast-show');
    
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => {
            toast.classList.add('toast-hidden');
            if (toastIcon && !isError) toastIcon.className = 'fa-solid fa-circle-check';
        }, 300);
    }, 2000);
}

// --- دالة للحماية من XSS ---
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// تحديث العدادات كل ثانية
setInterval(updateCountdowns, 1000);
