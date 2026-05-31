// js/dashboard.js
// Page navigation
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    auth.onAuthStateChanged(async (user) => {
        if (!user && !window.location.href.includes('login.html')) {
            window.location.href = 'login.html';
            return;
        }
        
        if (user) {
            // Load user data
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            document.getElementById('userName').textContent = userData?.name || 'User';
            
            // Load default page
            loadDashboard();
            
            // Load notifications
            loadNotifications();
        }
    });
    
    // Sidebar toggle for mobile
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });
    
    // Handle navigation
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            
            // Update active state
            document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
            
            // Load page based on role
            loadPage(page);
        });
    });
    
    // Logout handler
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await auth.signOut();
        localStorage.clear();
        window.location.href = 'login.html';
    });
});

async function loadDashboard() {
    const role = localStorage.getItem('userRole');
    
    let dashboardHtml = `
        <div class="row">
            <div class="col-md-12">
                <h2 class="mb-4">Welcome to your Dashboard</h2>
            </div>
        </div>
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="stat-card-dashboard">
                    <i class="fas fa-users fa-2x mb-2"></i>
                    <h3 id="statStudents">0</h3>
                    <p>Total Students</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card-dashboard" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <i class="fas fa-chalkboard-user fa-2x mb-2"></i>
                    <h3 id="statCourses">0</h3>
                    <p>Active Courses</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card-dashboard" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <i class="fas fa-chart-line fa-2x mb-2"></i>
                    <h3 id="statResults">0</h3>
                    <p>Results Processed</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card-dashboard" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                    <i class="fas fa-trophy fa-2x mb-2"></i>
                    <h3 id="statPassRate">0%</h3>
                    <p>Pass Rate</p>
                </div>
            </div>
        </div>
    `;
    
    if (role === 'admin') {
        dashboardHtml += `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5>Recent Activity</h5>
                        </div>
                        <div class="card-body" id="activityFeed"></div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5>Quick Actions</h5>
                        </div>
                        <div class="card-body">
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" onclick="showStudentModal()">
                                    <i class="fas fa-user-plus me-2"></i>Add New Student
                                </button>
                                <button class="btn btn-success" onclick="bulkUploadResults()">
                                    <i class="fas fa-upload me-2"></i>Upload Results
                                </button>
                                <button class="btn btn-info" onclick="generateSystemReport()">
                                    <i class="fas fa-chart-bar me-2"></i>Generate Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (role === 'student') {
        dashboardHtml += `
            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5>Your Academic Summary</h5>
                        </div>
                        <div class="card-body" id="studentSummary"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    document.getElementById('pageContent').innerHTML = dashboardHtml;
    
    // Load statistics
    await loadStatistics();
    
    if (role === 'student') {
        await loadStudentSummary();
    }
}

async function loadStatistics() {
    try {
        const studentsSnap = await db.collection('students').get();
        const coursesSnap = await db.collection('courses').get();
        const resultsSnap = await db.collection('results').get();
        
        document.getElementById('statStudents').textContent = studentsSnap.size;
        document.getElementById('statCourses').textContent = coursesSnap.size;
        document.getElementById('statResults').textContent = resultsSnap.size;
        
        // Calculate pass rate
        let passedResults = 0;
        for (const doc of resultsSnap.docs) {
            const result = doc.data();
            const totalScore = (result.caScore || 0) + (result.examScore || 0);
            if (totalScore >= 40) passedResults++;
        }
        
        const passRate = resultsSnap.size > 0 ? (passedResults / resultsSnap.size * 100).toFixed(1) : 0;
        document.getElementById('statPassRate').textContent = `${passRate}%`;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

 async function loadNotifications(notifications) {
    try {
        document.getElementById('notificationCount').textContent = notifications.size;
        
        const notificationList = document.getElementById('notificationList');
        notificationList.innerHTML = '';

        if (notifications.empty) {
            notificationList.innerHTML = '<div class="dropdown-item text-muted">No new notifications</div>';
            return;
        }

        notifications.forEach(doc => {
            const notif = doc.data();
            const item = document.createElement('div');
            item.className = 'notification-item';
            
            // Rebuilding the notification content structure safely
            const dateStr = notif.createdAt ? new Date(notif.createdAt.toDate()).toLocaleDateString() : '';
            item.innerHTML = `<p class="text-muted">${dateStr}</p>`;
            
            notificationList.appendChild(item);
        });

    } catch (error) {
        console.error("Error loading notifications:", error);
    }
}  