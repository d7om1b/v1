// ========== إضافة دوال البحث المفقودة ==========

// دالة البحث المحسنة مع دعم البيانات الجديدة
function searchRoom() {
    const input = document.getElementById('roomInput').value.trim();
    const resultsArea = document.getElementById('search-results-area');
    const inputArea = document.getElementById('search-input-area');
    
    const allRooms = { ...defaultRooms, ...customRooms };
    const roomData = allRooms[input];

    if (roomData) {
        // تحديث الصورة
        const roomImage = document.getElementById('roomImage');
        if (roomImage) roomImage.src = roomData.image;
        
        // تحديث عنوان الغرفة
        const roomTitleDisplay = document.getElementById('roomTitleDisplay');
        if (roomTitleDisplay) roomTitleDisplay.innerHTML = `ROOM ${input}`;
        
        // تحديث الوصف
        const roomDesc = document.getElementById('roomDesc');
        if (roomDesc) roomDesc.innerHTML = roomData.desc || "When you enter through the gate, head to the right where your classroom is located.";
        
        const roomDescAr = document.getElementById('roomDescAr');
        if (roomDescAr) roomDescAr.innerHTML = roomData.descAr || "عند دخولك من البوابة، اتجه إلى اليمين حيث يقع صفك الدراسي";
        
        // تحديث عنوان الصفحة
        const roomTitle = document.getElementById('roomTitle');
        if (roomTitle) roomTitle.innerHTML = `ROOM ${input}`;
        
        // تحديث الطوابق
        const roomFloor1 = document.getElementById('roomFloor1');
        if (roomFloor1) roomFloor1.innerHTML = roomData.floor1 || "Second floor";
        
        const roomFloor2 = document.getElementById('roomFloor2');
        if (roomFloor2) roomFloor2.innerHTML = roomData.floor2 || "First Floor";
        
        const roomFloor3 = document.getElementById('roomFloor3');
        if (roomFloor3) roomFloor3.innerHTML = roomData.floor3 || "ground floor";
        
        // حفظ رقم الغرفة الحالي
        window.currentRoomNumber = input;
        
        // إظهار منطقة النتائج وإخفاء منطقة البحث
        if (inputArea) inputArea.classList.add('hidden');
        if (resultsArea) resultsArea.classList.remove('hidden');
        
        showToast(`📍 Room ${input} found!`);
    } else {
        showToast("Room not found! Try 101 or check Admin additions.", true);
    }
}

// دالة الرجوع
function goBack() {
    const resultsArea = document.getElementById('search-results-area');
    const inputArea = document.getElementById('search-input-area');
    
    if (resultsArea) resultsArea.classList.add('hidden');
    if (inputArea) inputArea.classList.remove('hidden');
}

// دالة مشاركة الموقع
function shareLocation() {
    const roomNumber = window.currentRoomNumber;
    if (roomNumber) {
        const text = `📍 Room ${roomNumber} at PMU - Check it out!`;
        if (navigator.share) {
            navigator.share({
                title: 'PMU Room Location',
                text: text,
            }).catch(() => showToast("Share cancelled"));
        } else {
            navigator.clipboard.writeText(text);
            showToast("📍 Location copied to clipboard!");
        }
    } else {
        showToast("No room selected to share", true);
    }
}

// دالة toggleFavorite (إذا لم تكن موجودة)
function toggleFavorite() {
    const roomNumber = window.currentRoomNumber;
    if (!roomNumber) {
        showToast("No room selected!", true);
        return;
    }
    
    if (favorites.includes(roomNumber)) {
        favorites = favorites.filter(r => r !== roomNumber);
        showToast(`❤️ Room ${roomNumber} removed from favorites`);
    } else {
        favorites.push(roomNumber);
        showToast(`❤️ Room ${roomNumber} added to Favorites!`);
    }
    
    localStorage.setItem('pmu_favorites', JSON.stringify(favorites));
    renderFavorites();
}

// تحديث دالة renderFavorites لتتناسب مع التصميم الجديد
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
            </div>`;
    });
}

// تحديث دالة goToRoom
function goToRoom(roomNumber) {
    const input = document.getElementById('roomInput');
    if (input) input.value = roomNumber;
    searchRoom();
    
    // تفعيل تبويب البحث في شريط التنقل
    const navItems = document.querySelectorAll('.nav-item');
    let navigateBtn;
    navItems.forEach(item => { 
        if(item.innerText.includes('Navigate') || item.innerText.includes('search')) navigateBtn = item; 
    });
    if (navigateBtn) {
        showScreen('search-page', navigateBtn);
    } else {
        showScreen('search-page');
    }
}

// تحديث البيانات الافتراضية للغرف لتشمل الوصف العربي والطوابق
const defaultRooms = {
    "101": {
        floor: "Floor 1",
        building: "Building A",
        image: "./room101.jpg",
        desc: "When you enter through the gate, head to the right where your classroom is located.",
        descAr: "عند دخولك من البوابة، اتجه إلى اليمين حيث يقع صفك الدراسي",
        floor1: "Second floor",
        floor2: "First Floor",
        floor3: "ground floor",
        nearby: { cafe: "1m", print: "30s" }
    },
    "102": {
        floor: "Floor 1",
        building: "Building A",
        image: "./room102.jpg",
        desc: "Located near the south elevator, next to the faculty office.",
        descAr: "يقع بالقرب من المصعد الجنوبي، بجوار مكتب الكلية",
        floor1: "Second floor",
        floor2: "First Floor",
        floor3: "ground floor",
        nearby: { cafe: "2m", print: "1m" }
    },
    "201": {
        floor: "Floor 2",
        building: "Building B",
        image: "./room201.jpg",
        desc: "Computer lab with 30 workstations.",
        descAr: "معمل حاسوب مزود بـ 30 محطة عمل",
        floor1: "Third floor",
        floor2: "Second Floor",
        floor3: "First floor",
        nearby: { cafe: "30s", print: "15s" }
    }
};

// إضافة بيانات الغرف المخصصة من localStorage
let customRooms = JSON.parse(localStorage.getItem('pmu_custom_rooms')) || {};

// تحديث دالة addNewRoom لتشمل الوصف العربي والطوابق
function addNewRoom() {
    const number = document.getElementById('newRoomNumber').value.trim();
    const building = document.getElementById('newRoomBuilding').value.trim();
    const floor = document.getElementById('newRoomFloor').value.trim();
    const desc = document.getElementById('newRoomDesc').value.trim();
    const descAr = document.getElementById('newRoomDescAr')?.value.trim() || "";
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
            descAr: descAr || "لا يوجد وصف",
            floor1: "Second floor",
            floor2: "First Floor",
            floor3: "ground floor",
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
        if (document.getElementById('newRoomDescAr')) {
            document.getElementById('newRoomDescAr').value = '';
        }
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

// تحديث دالة refreshAdminRooms
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
                <div style="display:flex; align-items:center; gap:10px; flex:1;">
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

// تحديث دالة deleteCustomRoom
function deleteCustomRoom(roomNumber) {
    if (confirm(`Are you sure you want to delete Room ${roomNumber}?`)) {
        delete customRooms[roomNumber];
        localStorage.setItem('pmu_custom_rooms', JSON.stringify(customRooms));
        refreshAdminRooms();
        updateAdminStats();
        showToast(`Room ${roomNumber} deleted`);
    }
}

// تحديث دالة updateAdminStats
function updateAdminStats() {
    const allRoomsCount = Object.keys({ ...defaultRooms, ...customRooms }).length;
    const roomsStatElement = document.getElementById('stat-rooms-count');
    if (roomsStatElement) roomsStatElement.innerText = allRoomsCount;

    const homeEventsCount = document.querySelectorAll('#home-page .event-card').length;
    const eventsStatElement = document.getElementById('stat-events-count');
    if (eventsStatElement) eventsStatElement.innerText = homeEventsCount;
}

// Toast Notification
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

// دالة للحماية من XSS
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

// تحديث دالة renderReminders
function renderReminders() {
    const list = document.getElementById('reminders-list');
    if(!list) return;
    list.innerHTML = '';
    
    if (reminders.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.5);"><i class="fa-regular fa-bell-slash" style="font-size:40px; margin-bottom:10px; display:block;"></i>No reminders set</div>';
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

// تحديث دالة updateCountdowns
function updateCountdowns() {
    document.querySelectorAll('.modern-countdown').forEach(timer => {
        const target = parseInt(timer.getAttribute('data-date'));
        const diff = target - new Date().getTime();
        const values = timer.querySelectorAll('.time-value');

        if (diff <= 0) {
            timer.innerHTML = "<p style='color:var(--pmu-orange); font-weight:bold; width:100%; text-align:center;'><i class='fa-regular fa-bell' style='margin-right:5px;'></i> Time is Up!</p>";
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

// تحديث دالة deleteReminder
function deleteReminder(id) {
    if (confirm('Delete this reminder?')) {
        reminders = reminders.filter(r => r.id !== id);
        localStorage.setItem('pmu_reminders', JSON.stringify(reminders));
        renderReminders();
        showToast("Reminder deleted");
    }
}

// تحديث دالة addReminder
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
        showToast("✅ Reminder added!");
    } else {
        showToast("Please fill all fields!", true);
    }
}

// تحديث دالة showScreen
function showScreen(screenId, element) {
    requestAnimationFrame(() => {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.remove('hidden');
        }
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
    });
}

// تحديث دالة checkAdminLogin
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
        showToast("Welcome Admin! 🛡️");
    } else {
        showToast("Wrong username or password!", true);
    }
}
