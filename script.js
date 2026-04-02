// 1. التحكم في شاشة التحميل (Splash Screen)
window.addEventListener('load', function() {
    const savedColor = localStorage.getItem('pmu_theme_color');
    if (savedColor) {
        document.documentElement.style.setProperty('--pmu-orange', savedColor);
    }
    
    loadEventsFromStorage();

    setTimeout(function() {
        const splash = document.getElementById('splash-screen');
        const container = document.querySelector('.app-container');
        if (splash) {
            splash.style.opacity = '0';
            splash.style.visibility = 'hidden';
        }
        if (container) {
            container.classList.remove('hidden');
        }
    }, 2000); 
});

// 2. التنقل بين الصفحات
function showScreen(screenId, element) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
    }
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }
}

// --- نظام إدارة القاعات الجديد (الأدمن + البحث) ---

const defaultRooms = {
    "101": {
        floor: "Floor 1",
        building: "Building A",
        image: "room101.jpg",
        desc: "Located near the North Elevator. Perfect for group studies and lectures.",
        nearby: { cafe: "1m", print: "30s" }
    }
};

let customRooms = JSON.parse(localStorage.getItem('pmu_custom_rooms')) || {};

function searchRoom() {
    const input = document.getElementById('roomInput').value.trim();
    const resultsArea = document.getElementById('search-results-area');
    
    const allRooms = { ...defaultRooms, ...customRooms };
    const roomData = allRooms[input];

    if (roomData) {
        resultsArea.innerHTML = `
            <div class="result-card" style="animation: fadeIn 0.5s ease;">
                
                <img src="${roomData.image}" id="roomImage" style="width:100%; border-radius:15px; margin-bottom:15px;">
                <h2 id="roomTitleDisplay" style="color:var(--pmu-orange);">Room ${input}</h2>
                <p id="roomDesc" style="color:#ccc; font-size:14px; line-height:1.6;">${roomData.desc}</p>
                <div class="result-header">
                    <span class="badge">${roomData.floor}</span>
                    <span class="badge highlight">${roomData.building}</span>
                </div>
                <div class="nearby-info" style="display:flex; gap:10px; margin-top:15px;">
                    <small><i class="fa-solid fa-coffee"></i> Cafeteria (${roomData.nearby ? roomData.nearby.cafe : 'Nearby'})</small>
                    <small><i class="fa-solid fa-print"></i> Printer (${roomData.nearby ? roomData.nearby.print : 'Available'})</small>
                </div>

                <div class="action-buttons" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:20px;">
                    <button class="btn-secondary" onclick="saveToFav('${input}')"><i class="fa-regular fa-heart"></i> Favorite</button>
                    <button class="btn-primary" onclick="goBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>
                </div>
            </div>
        `;
        
        document.getElementById('search-input-area').classList.add('hidden');
        resultsArea.classList.remove('hidden');
    } else {
        alert("Room not found! Try 101 or check Admin additions.");
    }
}

function addNewRoom() {
    const number = document.getElementById('newRoomNumber').value.trim();
    const building = document.getElementById('newRoomBuilding').value.trim();
    const floor = document.getElementById('newRoomFloor').value.trim();
    const desc = document.getElementById('newRoomDesc').value.trim();
    const imageFile = document.getElementById('newRoomImage').files[0];

    if (!number || !building || !imageFile) {
     // داخل وظيفة addNewRoom عند النجاح:
// بدلاً من: alert(`Room ${number} added successfully!`);
showToast(`Room ${number} has been published! 🚀`);
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result; 

        customRooms[number] = {
            floor: floor || "N/A",
            building: building,
            image: imageData,
            desc: desc || "No description provided.",
            nearby: { cafe: "Nearby", print: "Available" }
        };

        localStorage.setItem('pmu_custom_rooms', JSON.stringify(customRooms));
        
        // --- التعديل هنا: تحديث القائمة والإحصائيات فوراً ---
        refreshAdminRooms(); 
        updateAdminStats();
        
        alert(`Room ${number} added successfully!`);
        
        document.getElementById('newRoomNumber').value = '';
        document.getElementById('newRoomBuilding').value = '';
        document.getElementById('newRoomFloor').value = '';
        document.getElementById('newRoomDesc').value = '';
        document.getElementById('newRoomImage').value = '';
    };
    reader.readAsDataURL(imageFile);
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
        updateAdminStats(); // تحديث الإحصائيات عند الدخول
        
        document.getElementById('adminUser').value = '';
        document.getElementById('adminPass').value = '';
    } else {
        alert('Wrong username or password!');
    }
}

function logoutAdmin() {
    showScreen('home-page');
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
    updateAdminStats(); // تحديث الأرقام عند الحفظ
}

function loadEventsFromStorage() {
    const saved = localStorage.getItem('pmu_calendar_events');
    if (saved) {
        const events = JSON.parse(saved);
        const calendarSection = document.querySelector('.calendar-section');
        const sectionTitle = calendarSection.querySelector('.section-title');
        document.querySelectorAll('#home-page .event-card').forEach(el => el.remove());

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
        alert('Event Added!');
        document.getElementById('eventMonth').value = '';
        document.getElementById('eventDay').value = '';
        document.getElementById('eventTitle').value = '';
    } else {
        alert('Please fill all fields!');
    }
}

function deleteEvent(index) {
    const homeEvents = document.querySelectorAll('#home-page .event-card');
    if (confirm('Are you sure?')) {
        homeEvents[index].remove();
        saveAllEvents();
        refreshAdminEvents(); 
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
                <button onclick="deleteEvent(${index})" style="background:none; border:none; color:#ff4444;"><i class="fa-solid fa-trash"></i></button>
            </div>`;
    });
}

// --- نظام التذكيرات ---
let reminders = JSON.parse(localStorage.getItem('pmu_reminders')) || [];

document.addEventListener('DOMContentLoaded', () => {
    renderReminders();
    renderFavorites(); // تشغيل المفضلات أيضاً
    setInterval(updateCountdowns, 1000);
});

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
    } else {
        alert("Please fill fields!");
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
                    <span class="reminder-title"><i class="fa-regular fa-bell" style="color:var(--pmu-orange); margin-right:8px;"></i>${rem.title}</span>
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

            values[0].innerText = d;
            values[1].innerText = h;
            values[2].innerText = m;
            values[3].innerText = s;
        }
    });
}

function deleteReminder(id) {
    reminders = reminders.filter(r => r.id !== id);
    localStorage.setItem('pmu_reminders', JSON.stringify(reminders));
    renderReminders();
}

// --- نظام المفضلة ---
let favorites = JSON.parse(localStorage.getItem('pmu_favorites')) || [];

function saveToFav(roomNumber) {
    if (!favorites.includes(roomNumber)) {
        favorites.push(roomNumber);
        localStorage.setItem('pmu_favorites', JSON.stringify(favorites));
        
        // استبدال الـ alert بـ Toast احترافي
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
        favContainer.innerHTML = '<p style="color:gray; font-size:12px; text-align:center;">Empty</p>';
        return;
    }
    favorites.forEach(room => {
        favContainer.innerHTML += `
            <div class="fav-item-card" onclick="goToRoom('${room}')" style="background:rgba(255,255,255,0.05); padding:12px; border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; cursor:pointer;">
                <span style="color:white;"><i class="fa-solid fa-location-arrow" style="color:var(--pmu-orange);"></i> Room ${room}</span>
                <button onclick="event.stopPropagation(); removeFromFav('${room}')" style="background:none; border:none; color:#ff4444;"><i class="fa-solid fa-trash-can"></i></button>
            </div>`;
    });
}

function removeFromFav(roomNumber) {
    favorites = favorites.filter(r => r !== roomNumber);
    localStorage.setItem('pmu_favorites', JSON.stringify(favorites));
    renderFavorites();
}

function goToRoom(roomNumber) {
    const input = document.getElementById('roomInput');
    if (input) input.value = roomNumber;
    searchRoom();
    const navItems = document.querySelectorAll('.nav-item');
    let navigateBtn;
    navItems.forEach(item => { if(item.innerText.includes('Navigate')) navigateBtn = item; });
    showScreen('search-page', navigateBtn);
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
        updateAdminStats(); // تحديث الإحصائيات بعد الحذف
        alert('Room deleted successfully!');
    }
}

// --- تحديث الإحصائيات الشامل ---

function updateAdminStats() {
    // 1. حساب الغرف
    const allRoomsCount = Object.keys({ ...defaultRooms, ...customRooms }).length;
    const roomsStatElement = document.getElementById('stat-rooms-count');
    if (roomsStatElement) roomsStatElement.innerText = allRoomsCount;

    // 2. حساب الفعاليات من صفحة الهوم مباشرة لضمان الدقة
    const homeEventsCount = document.querySelectorAll('#home-page .event-card').length;
    const eventsStatElement = document.getElementById('stat-events-count');
    if (eventsStatElement) eventsStatElement.innerText = homeEventsCount;
    
    console.log("Stats updated:", allRoomsCount, homeEventsCount);
}

function showToast(message) {
    const toast = document.getElementById('custom-toast');
    if (!toast) return; // للتأكد من وجود العنصر في HTML

    // تحديث النص داخل الرسالة
    toast.querySelector('span').innerText = message;
    
    // إظهار العنصر
    toast.classList.remove('toast-hidden');
    toast.classList.add('toast-show');
    
    // إخفاء التوست تلقائياً بعد ثانيتين
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => {
            toast.classList.add('toast-hidden');
        }, 300); 
    }, 2000);
}