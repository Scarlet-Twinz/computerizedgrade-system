// ============================================
// LECTURER DASHBOARD FUNCTIONS
// ============================================

let currentLecturerId = null;

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.data()?.role !== 'lecturer') {
        window.location.href = 'login.html';
        return;
    }
    currentLecturerId = user.uid;
    document.getElementById('lecturerName').innerHTML = userDoc.data().name;
    loadLecturerDashboard();
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = 'login.html';
});

document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('active');
});

window.loadLecturerPage = function(page) {
    if (page === 'dashboard') loadLecturerDashboard();
    else if (page === 'courses') loadLecturerCourses();
    else if (page === 'scores') loadLecturerScores();
    else if (page === 'students') loadLecturerStudents();
};

async function loadLecturerDashboard() {
    const assignedCourses = await db.collection('courses').where('assignedLecturer', '==', currentLecturerId).get();
    const results = await db.collection('results').where('enteredBy', '==', currentLecturerId).get();
    
    document.getElementById('mainContent').innerHTML = `
        <div class="welcome-banner">
            <h2>Welcome to Lecturer Portal</h2>
            <p>Manage your courses and enter student scores</p>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-book"></i></div>
                <h2 class="stat-number">${assignedCourses.size}</h2>
                <p class="stat-label">Assigned Courses</p>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-chart-line"></i></div>
                <h2 class="stat-number">${results.size}</h2>
                <p class="stat-label">Results Entered</p>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><i class="fas fa-clock"></i></div>
                <h2 class="stat-number">${results.docs.filter(r => r.data().status === 'pending').length}</h2>
                <p class="stat-label">Pending Approval</p>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h5>Quick Actions</h5></div>
            <div class="card-body">
                <button class="btn btn-info" onclick="loadLecturerPage('scores')"><i class="fas fa-edit me-2"></i>Enter Scores</button>
                <button class="btn btn-primary" onclick="loadLecturerPage('courses')"><i class="fas fa-book me-2"></i>View Courses</button>
            </div>
        </div>
    `;
}

async function loadLecturerCourses() {
    const assignedCourses = await db.collection('courses').where('assignedLecturer', '==', currentLecturerId).get();
    let html = `
        <div class="card">
            <div class="card-header"><h5>My Assigned Courses</h5></div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr><th>Course Code</th><th>Course Title</th><th>Credit Unit</th><th>Department</th><th>Level</th><th>Action</th>
                        </thead>
                        <tbody>
    `;
    
    for (const doc of assignedCourses.docs) {
        const c = doc.data();
        html += `
            <tr>
                <td><strong>${c.courseCode}</strong></td>
                <td>${c.courseTitle}</td>
                <td>${c.creditUnit}</td>
                <td>${c.department || '-'}</td>
                <td>${c.level || '-'}</td>
                <td><button class="btn btn-info btn-sm" onclick="enterScores('${doc.id}')">Enter Scores</button></td>
            </tr>
        `;
    }
    
    if (assignedCourses.size === 0) {
        html += `<tr><td colspan="6" class="text-center">No courses assigned yet. Contact HOD.</td></tr>`;
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

async function loadLecturerScores() {
    const assignedCourses = await db.collection('courses').where('assignedLecturer', '==', currentLecturerId).get();
    let html = `
        <div class="card">
            <div class="card-header"><h5>Enter Student Scores</h5></div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <select id="selectCourse" class="form-select" onchange="loadCourseStudents()">
                            <option value="">Select Course</option>
    `;
    
    for (const doc of assignedCourses.docs) {
        const c = doc.data();
        html += `<option value="${doc.id}">${c.courseCode} - ${c.courseTitle}</option>`;
    }
    
    html += `
                        </select>
                    </div>
                    <div class="col-md-6">
                        <select id="selectStudent" class="form-select">
                            <option value="">Select Student</option>
                        </select>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-md-6">
                        <input type="number" id="caScore" class="form-control" placeholder="CA Score (0-40)">
                    </div>
                    <div class="col-md-6">
                        <input type="number" id="examScore" class="form-control" placeholder="Exam Score (0-60)">
                    </div>
                </div>
                <div id="gradePreview" class="alert alert-info mt-3">Total: 0 | Grade: -</div>
                <button class="btn btn-primary mt-3" onclick="saveStudentScore()">Save Score</button>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = html;
    
    document.getElementById('caScore').oninput = updatePreview;
    document.getElementById('examScore').oninput = updatePreview;
}

async function loadLecturerStudents() {
    const results = await db.collection('results').where('enteredBy', '==', currentLecturerId).get();
    let html = `
        <div class="card">
            <div class="card-header"><h5>My Students</h5></div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr><th>Student Name</th><th>Matric Number</th><th>Course</th><th>CA Score</th><th>Exam Score</th><th>Total</th><th>Grade</th><th>Status</th>
                        </thead>
                        <tbody>
    `;
    
    for (const doc of results.docs) {
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
                <td><span class="badge ${r.status === 'approved' ? 'bg-success' : 'bg-warning'}">${r.status || 'pending'}</span></td>
            </tr>
        `;
    }
    
    if (results.size === 0) {
        html += `<tr><td colspan="8" class="text-center">No students yet. Enter scores to see them here.</td></tr>`;
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

window.loadCourseStudents = async function() {
    const courseId = document.getElementById('selectCourse').value;
    if (!courseId) return;
    
    const students = await db.collection('students').get();
    let html = '<option value="">Select Student</option>';
    students.forEach(doc => {
        html += `<option value="${doc.id}">${doc.data().name} (${doc.data().matricNumber})</option>`;
    });
    document.getElementById('selectStudent').innerHTML = html;
    window.currentCourseId = courseId;
};

function updatePreview() {
    const ca = parseInt(document.getElementById('caScore').value) || 0;
    const exam = parseInt(document.getElementById('examScore').value) || 0;
    const total = ca + exam;
    const grade = calculateGrade(total);
    document.getElementById('gradePreview').innerHTML = `Total: ${total} | Grade: ${grade.grade} (${grade.gradePoint} points)`;
}

window.saveStudentScore = async function() {
    const studentId = document.getElementById('selectStudent').value;
    const courseId = window.currentCourseId;
    const caScore = parseInt(document.getElementById('caScore').value) || 0;
    const examScore = parseInt(document.getElementById('examScore').value) || 0;
    const total = caScore + examScore;
    const grade = calculateGrade(total);
    
    if (!studentId) {
        showMessage('Please select a student', 'danger');
        return;
    }
    
    if (!courseId) {
        showMessage('Please select a course', 'danger');
        return;
    }
    
    await db.collection('results').add({
        studentId, courseId, caScore, examScore, totalScore: total,
        grade: grade.grade, gradePoint: grade.gradePoint,
        status: 'pending', enteredBy: currentLecturerId, enteredAt: new Date()
    });
    
    showMessage('Score saved! Pending HOD approval.', 'success');
    document.getElementById('caScore').value = '';
    document.getElementById('examScore').value = '';
    document.getElementById('gradePreview').innerHTML = 'Total: 0 | Grade: -';
};

window.enterScores = function(courseId) {
    loadLecturerPage('scores');
    setTimeout(() => {
        document.getElementById('selectCourse').value = courseId;
        loadCourseStudents();
    }, 100);
};s