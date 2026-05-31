// ============================================
// HOD DASHBOARD FUNCTIONS
// ============================================

let currentHODId = null;

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.data()?.role !== 'hod') {
        window.location.href = 'login.html';
        return;
    }
    currentHODId = user.uid;
    document.getElementById('hodName').innerHTML = userDoc.data().name;
    loadHODDashboard();
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = 'login.html';
});

document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('active');
});

window.loadHODPage = function(page) {
    if (page === 'dashboard') loadHODDashboard();
    else if (page === 'courses') loadHODCourses();
    else if (page === 'approve') loadHODApprove();
    else if (page === 'report') loadHODReport();
};

async function loadHODDashboard() {
    const courses = await db.collection('courses').get();
    const lecturers = await db.collection('lecturers').get();
    const pendingResults = await db.collection('results').where('status', '==', 'pending').get();
    
    document.getElementById('mainContent').innerHTML = `
        <div class="welcome-banner">
            <h2>Head of Department Dashboard</h2>
            <p>Manage courses, assign lecturers, and approve results</p>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-book"></i></div>
                <h2 class="stat-number">${courses.size}</h2>
                <p class="stat-label">Department Courses</p>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-chalkboard-user"></i></div>
                <h2 class="stat-number">${lecturers.size}</h2>
                <p class="stat-label">Lecturers</p>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i class="fas fa-clock"></i></div>
                <h2 class="stat-number">${pendingResults.size}</h2>
                <p class="stat-label">Pending Results</p>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h5>Quick Actions</h5></div>
            <div class="card-body">
                <button class="btn btn-primary" onclick="loadHODPage('courses')"><i class="fas fa-book me-2"></i>Assign Courses</button>
                <button class="btn btn-success" onclick="loadHODPage('approve')"><i class="fas fa-check-double me-2"></i>Approve Results</button>
            </div>
        </div>
    `;
}

async function loadHODCourses() {
    const courses = await db.collection('courses').get();
    const lecturers = await db.collection('lecturers').get();
    
    let html = `
        <div class="card">
            <div class="card-header"><h5>Assign Courses to Lecturers</h5></div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr><th>Course Code</th><th>Course Title</th><th>Current Lecturer</th><th>Assign Lecturer</th><th>Action</th>
                        </thead>
                        <tbody>
    `;
    
    for (const doc of courses.docs) {
        const c = doc.data();
        let currentLecturer = 'Not Assigned';
        if (c.assignedLecturer) {
            const lec = await db.collection('lecturers').doc(c.assignedLecturer).get();
            if (lec.exists) currentLecturer = lec.data().name;
        }
        
        let lecturerOptions = '<option value="">Select Lecturer</option>';
        lecturers.forEach(lecDoc => {
            lecturerOptions += `<option value="${lecDoc.id}">${lecDoc.data().name}</option>`;
        });
        
        html += `
            <tr>
                <td><strong>${c.courseCode}</strong></td>
                <td>${c.courseTitle}</td>
                <td>${currentLecturer}</td>
                <td><select id="assign_${doc.id}" class="form-select form-select-sm">${lecturerOptions}</select></td>
                <td><button class="btn btn-primary btn-sm" onclick="assignCourse('${doc.id}', document.getElementById('assign_${doc.id}').value)">Assign</button></td>
            </tr>
        `;
    }
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = html;
}

async function loadHODApprove() {
    const pendingResults = await db.collection('results').where('status', '==', 'pending').get();
    let html = `
        <div class="card">
            <div class="card-header"><h5>Pending Results for Approval</h5></div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr><th>Student</th><th>Matric No</th><th>Course</th><th>CA Score</th><th>Exam Score</th><th>Total</th><th>Grade</th><th>Action</th>
                        </thead>
                        <tbody>
    `;
    
    for (const doc of pendingResults.docs) {
        const r = doc.data();
        const student = await db.collection('students').doc(r.studentId).get();
        const course = await db.collection('courses').doc(r.courseId).get();
        const total = (r.caScore || 0) + (r.examScore || 0);
        const grade = calculateGrade(total);
        
        html += `
            <tr>
                <td>${student.data()?.name || 'N/A'}</td>
                <td>${student.data()?.matricNumber || 'N/A'}</td>
                <td>${course.data()?.courseCode || 'N/A'}</td>
                <td>${r.caScore || 0}</td>
                <td>${r.examScore || 0}</td>
                <td><strong>${total}</strong></td>
                <td><span class="grade-${grade.grade}">${grade.grade}</span></td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="approveResult('${doc.id}')">Approve</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectResult('${doc.id}')">Reject</button>
                </td>
            </tr>
        `;
    }
    
    if (pendingResults.size === 0) {
        html += `<tr><td colspan="8" class="text-center">No pending results for approval.</td></tr>`;
    }
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = html;
}

async function loadHODReport() {
    const students = await db.collection('students').get();
    const results = await db.collection('results').where('status', '==', 'approved').get();
    let passedCount = 0;
    for (const doc of results.docs) {
        const r = doc.data();
        if ((r.caScore + r.examScore) >= 40) passedCount++;
    }
    const passRate = results.size > 0 ? (passedCount / results.size * 100).toFixed(1) : 0;
    
    document.getElementById('mainContent').innerHTML = `
        <div class="card">
            <div class="card-header"><h5>Department Performance Report</h5></div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <div class="stat-card">
                            <div class="stat-icon blue"><i class="fas fa-users"></i></div>
                            <h2 class="stat-number">${students.size}</h2>
                            <p class="stat-label">Total Students</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="stat-card">
                            <div class="stat-icon green"><i class="fas fa-chart-line"></i></div>
                            <h2 class="stat-number">${passRate}%</h2>
                            <p class="stat-label">Pass Rate</p>
                        </div>
                    </div>
                </div>
                <canvas id="deptChart" height="200"></canvas>
                <button class="btn btn-primary mt-3" onclick="alert('Report exported')"><i class="fas fa-download me-2"></i>Export Report</button>
            </div>
        </div>
    `;
    
    new Chart(document.getElementById('deptChart'), {
        type: 'bar',
        data: {
            labels: ['Passed', 'Failed'],
            datasets: [{
                label: 'Student Performance',
                data: [passedCount, results.size - passedCount],
                backgroundColor: ['#28a745', '#dc3545']
            }]
        }
    });
}

window.assignCourse = async function(courseId, lecturerId) {
    if (!lecturerId) {
        showMessage('Please select a lecturer', 'danger');
        return;
    }
    await db.collection('courses').doc(courseId).update({ assignedLecturer: lecturerId, assignedAt: new Date() });
    showMessage('Course assigned successfully!', 'success');
    loadHODCourses();
};

window.approveResult = async function(resultId) {
    await db.collection('results').doc(resultId).update({ status: 'approved', approvedBy: 'hod', approvedAt: new Date() });
    showMessage('Result approved!', 'success');
    loadHODApprove();
};

window.rejectResult = async function(resultId) {
    await db.collection('results').doc(resultId).update({ status: 'rejected', rejectedAt: new Date() });
    showMessage('Result rejected. Lecturer needs to re-enter.', 'warning');
    loadHODApprove();
};