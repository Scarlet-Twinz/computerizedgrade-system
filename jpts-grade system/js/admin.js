// ============================================
// ADMIN DASHBOARD FUNCTIONS
// ============================================

let currentAdminId = null;

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.data()?.role !== 'admin') {
        window.location.href = 'student-dashboard.html';
        return;
    }
    currentAdminId = user.uid;
    document.getElementById('adminName').innerHTML = userDoc.data().name;
    loadAdminDashboard();
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = 'login.html';
});

document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('active');
});

window.loadAdminPage = function(page) {
    if (page === 'dashboard') loadAdminDashboard();
    else if (page === 'students') loadAdminStudents();
    else if (page === 'courses') loadAdminCourses();
    else if (page === 'results') loadAdminResults();
    else if (page === 'lecturers') loadAdminLecturers();
    else if (page === 'analytics') loadAdminAnalytics();
    else if (page === 'settings') loadAdminSettings();
};

async function loadAdminDashboard() {
    const students = await db.collection('students').get();
    const courses = await db.collection('courses').get();
    const results = await db.collection('results').get();
    const lecturers = await db.collection('lecturers').get();
    
    document.getElementById('mainContent').innerHTML = `
        <div class="welcome-banner">
            <h2>Admin Dashboard</h2>
            <p>Welcome to JPTS University Administration Portal</p>
        </div>
        <div class="stats-grid">
            <div class="stat-card" onclick="loadAdminPage('students')">
                <div class="stat-icon blue"><i class="fas fa-users"></i></div>
                <h2 class="stat-number">${students.size}</h2>
                <p class="stat-label">Total Students</p>
            </div>
            <div class="stat-card" onclick="loadAdminPage('lecturers')">
                <div class="stat-icon green"><i class="fas fa-chalkboard-user"></i></div>
                <h2 class="stat-number">${lecturers.size}</h2>
                <p class="stat-label">Total Lecturers</p>
            </div>
            <div class="stat-card" onclick="loadAdminPage('courses')">
                <div class="stat-icon purple"><i class="fas fa-book"></i></div>
                <h2 class="stat-number">${courses.size}</h2>
                <p class="stat-label">Active Courses</p>
            </div>
            <div class="stat-card" onclick="loadAdminPage('results')">
                <div class="stat-icon orange"><i class="fas fa-chart-line"></i></div>
                <h2 class="stat-number">${results.size}</h2>
                <p class="stat-label">Results Processed</p>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h5>Quick Actions</h5></div>
            <div class="card-body">
                <button class="btn btn-primary" onclick="showAddStudentModal()"><i class="fas fa-user-plus me-2"></i>Add Student</button>
                <button class="btn btn-success" onclick="showAddCourseModal()"><i class="fas fa-book-plus me-2"></i>Add Course</button>
                <button class="btn btn-info" onclick="showAddLecturerModal()"><i class="fas fa-chalkboard-user me-2"></i>Add Lecturer</button>
                <button class="btn btn-warning" onclick="showBulkUploadModal()"><i class="fas fa-upload me-2"></i>Bulk Upload</button>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h5>System Overview</h5></div>
            <div class="card-body">
                <canvas id="overviewChart" height="200"></canvas>
            </div>
        </div>
    `;
    
    new Chart(document.getElementById('overviewChart'), {
        type: 'bar',
        data: {
            labels: ['Students', 'Lecturers', 'Courses', 'Results'],
            datasets: [{
                label: 'Count',
                data: [students.size, lecturers.size, courses.size, results.size],
                backgroundColor: '#0a1e3c'
            }]
        }
    });
}

async function loadAdminStudents() {
    const snapshot = await db.collection('students').get();
    let html = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5>Student Management</h5>
                <button class="btn btn-primary btn-sm" onclick="showAddStudentModal()">+ Add Student</button>
            </div>
            <div class="card-body">
                <div class="search-box mb-3">
                    <i class="fas fa-search"></i>
                    <input type="text" id="searchStudent" class="form-control" placeholder="Search students...">
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr><th>Matric No</th><th>Name</th><th>Department</th><th>Level</th><th>Email</th><th>Actions</th>
                        </thead>
                        <tbody id="studentsList">
                </tbody>
            <table>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = html;
    
    const tbody = document.getElementById('studentsList');
    tbody.innerHTML = '';
    for (const doc of snapshot.docs) {
        const s = doc.data();
        tbody.innerHTML += `
            <tr>
                <td><strong>${s.matricNumber}</strong></td>
                <td>${s.name}</td>
                <td>${s.department || '-'}</td>
                <td>${s.level || '-'}</td>
                <td>${s.email}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editStudent('${doc.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStudent('${doc.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }
    
    document.getElementById('searchStudent').addEventListener('keyup', function() {
        const term = this.value.toLowerCase();
        const rows = document.querySelectorAll('#studentsList tr');
        rows.forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
        });
    });
}

async function loadAdminCourses() {
    const snapshot = await db.collection('courses').get();
    let html = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5>Course Management</h5>
                <button class="btn btn-success btn-sm" onclick="showAddCourseModal()">+ Add Course</button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr><th>Code</th><th>Title</th><th>Credit</th><th>Department</th><th>Level</th><th>Actions</th>
                        </thead>
                        <tbody id="coursesList">
                </tbody>
            </table>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = html;
    
    const tbody = document.getElementById('coursesList');
    tbody.innerHTML = '';
    for (const doc of snapshot.docs) {
        const c = doc.data();
        tbody.innerHTML += `
            <tr>
                <td><strong>${c.courseCode}</strong></td>
                <td>${c.courseTitle}</td>
                <td>${c.creditUnit}</td>
                <td>${c.department || '-'}</td>
                <td>${c.level || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editCourse('${doc.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCourse('${doc.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }
}

async function loadAdminResults() {
    const snapshot = await db.collection('results').get();
    let html = `
        <div class="card">
            <div class="card-header">
                <h5>Result Management</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr><th>Student</th><th>Course</th><th>CA</th><th>Exam</th><th>Total</th><th>Grade</th><th>Status</th>
                        </thead>
                        <tbody id="resultsList">
                </tbody>
            </table>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = html;
    
    const tbody = document.getElementById('resultsList');
    tbody.innerHTML = '';
    for (const doc of snapshot.docs) {
        const r = doc.data();
        const student = await db.collection('students').doc(r.studentId).get();
        const course = await db.collection('courses').doc(r.courseId).get();
        const total = (r.caScore || 0) + (r.examScore || 0);
        const grade = calculateGradeLetter(total);
        tbody.innerHTML += `
            <tr>
                <td>${student.data()?.name || 'N/A'}</td>
                <td>${course.data()?.courseCode || 'N/A'}</td>
                <td>${r.caScore || 0}</td>
                <td>${r.examScore || 0}</td>
                <td><strong>${total}</strong></td>
                <td><span class="grade-${grade}">${grade}</span></td>
                <td><span class="badge ${r.status === 'approved' ? 'bg-success' : 'bg-warning'}">${r.status || 'pending'}</span></td>
            </tr>
        `;
    }
}

async function loadAdminLecturers() {
    const snapshot = await db.collection('lecturers').get();
    let html = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5>Lecturer Management</h5>
                <button class="btn btn-info btn-sm" onclick="showAddLecturerModal()">+ Add Lecturer</button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr><th>Staff ID</th><th>Name</th><th>Email</th><th>Department</th><th>Actions</th>
                        </thead>
                        <tbody id="lecturersList">
                </tbody>
            </table>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = html;
    
    const tbody = document.getElementById('lecturersList');
    tbody.innerHTML = '';
    for (const doc of snapshot.docs) {
        const l = doc.data();
        tbody.innerHTML += `
            <tr>
                <td><strong>${l.staffId}</strong></td>
                <td>${l.name}</td>
                <td>${l.email}</td>
                <td>${l.department || '-'}</td>
                <td><button class="btn btn-sm btn-danger" onclick="deleteLecturer('${doc.id}')"><i class="fas fa-trash"></i></button></td>
            </tr>
        `;
    }
}

async function loadAdminAnalytics() {
    await loadAnalytics();
}

async function loadAdminSettings() {
    document.getElementById('mainContent').innerHTML = `
        <div class="card">
            <div class="card-header"><h5>System Settings</h5></div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Grading System</h6>
                        <table class="table table-sm">
                            <thead><tr><th>Grade</th><th>Min</th><th>Max</th><th>Point</th></tr></thead>
                            <tbody>
                                <tr><td>A</td><td>70</td><td>100</td><td>5.0</td></tr>
                                <tr><td>B</td><td>60</td><td>69</td><td>4.0</td></tr>
                                <tr><td>C</td><td>50</td><td>59</td><td>3.0</td></tr>
                                <tr><td>D</td><td>45</td><td>49</td><td>2.0</td></tr>
                                <tr><td>E</td><td>40</td><td>44</td><td>1.0</td></tr>
                                <tr><td>F</td><td>0</td><td>39</td><td>0.0</td></tr>
                            </tbody>
                        ~
                        <button class="btn btn-warning mt-2" onclick="alert('Edit grading feature')">Edit Grading Scale</button>
                    </div>
                    <div class="col-md-6">
                        <h6>Academic Sessions</h6>
                        <ul class="list-group">
                            <li class="list-group-item">2023/2024 - Active</li>
                            <li class="list-group-item">2024/2025 - Current</li>
                        </ul>
                        <button class="btn btn-primary mt-2" onclick="alert('Add session')">Add Session</button>
                        <button class="btn btn-danger mt-2" onclick="alert('Backup database')">Backup Database</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Student CRUD
window.showAddStudentModal = function() {
    const modalHtml = `
        <div class="modal fade" id="studentModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header"><h5>Add Student</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
                    <div class="modal-body">
                        <input type="text" id="stuName" class="form-control mb-2" placeholder="Full Name">
                        <input type="text" id="stuMatric" class="form-control mb-2" placeholder="Matric Number">
                        <input type="email" id="stuEmail" class="form-control mb-2" placeholder="Email">
                        <select id="stuDept" class="form-select mb-2">
                            <option>Computer Science</option><option>Engineering</option><option>Business</option>
                        </select>
                        <select id="stuLevel" class="form-select mb-2">
                            <option>100</option><option>200</option><option>300</option><option>400</option>
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button class="btn btn-primary" onclick="saveStudent()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    $('#studentModal').modal('show');
};

window.saveStudent = async function() {
    await db.collection('students').add({
        name: document.getElementById('stuName').value,
        matricNumber: document.getElementById('stuMatric').value,
        email: document.getElementById('stuEmail').value,
        department: document.getElementById('stuDept').value,
        level: document.getElementById('stuLevel').value,
        createdAt: new Date()
    });
    $('#studentModal').modal('hide');
    showMessage('Student added!', 'success');
    loadAdminStudents();
};

window.deleteStudent = async function(id) {
    if(confirm('Delete this student?')) {
        await db.collection('students').doc(id).delete();
        showMessage('Student deleted', 'success');
        loadAdminStudents();
    }
};

// Course CRUD
window.showAddCourseModal = function() {
    const modalHtml = `
        <div class="modal fade" id="courseModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header"><h5>Add Course</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
                    <div class="modal-body">
                        <input type="text" id="crsCode" class="form-control mb-2" placeholder="Course Code">
                        <input type="text" id="crsTitle" class="form-control mb-2" placeholder="Course Title">
                        <input type="number" id="crsCredit" class="form-control mb-2" placeholder="Credit Unit">
                        <select id="crsLevel" class="form-select mb-2">
                            <option>100</option><option>200</option><option>300</option><option>400</option>
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button class="btn btn-success" onclick="saveCourse()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    $('#courseModal').modal('show');
};

window.saveCourse = async function() {
    await db.collection('courses').add({
        courseCode: document.getElementById('crsCode').value,
        courseTitle: document.getElementById('crsTitle').value,
        creditUnit: parseInt(document.getElementById('crsCredit').value),
        level: document.getElementById('crsLevel').value,
        createdAt: new Date()
    });
    $('#courseModal').modal('hide');
    showMessage('Course added!', 'success');
    loadAdminCourses();
};

window.deleteCourse = async function(id) {
    if(confirm('Delete this course?')) {
        await db.collection('courses').doc(id).delete();
        showMessage('Course deleted', 'success');
        loadAdminCourses();
    }
};

// Lecturer CRUD
window.showAddLecturerModal = function() {
    const modalHtml = `
        <div class="modal fade" id="lecturerModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header"><h5>Add Lecturer</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
                    <div class="modal-body">
                        <input type="text" id="lecName" class="form-control mb-2" placeholder="Full Name">
                        <input type="text" id="lecStaffId" class="form-control mb-2" placeholder="Staff ID">
                        <input type="email" id="lecEmail" class="form-control mb-2" placeholder="Email">
                        <select id="lecDept" class="form-select mb-2">
                            <option>Computer Science</option><option>Engineering</option><option>Business</option>
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button class="btn btn-info" onclick="saveLecturer()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    $('#lecturerModal').modal('show');
};

window.saveLecturer = async function() {
    await db.collection('lecturers').add({
        name: document.getElementById('lecName').value,
        staffId: document.getElementById('lecStaffId').value,
        email: document.getElementById('lecEmail').value,
        department: document.getElementById('lecDept').value,
        createdAt: new Date()
    });
    $('#lecturerModal').modal('hide');
    showMessage('Lecturer added!', 'success');
    loadAdminLecturers();
};

window.deleteLecturer = async function(id) {
    if(confirm('Delete this lecturer?')) {
        await db.collection('lecturers').doc(id).delete();
        showMessage('Lecturer deleted', 'success');
        loadAdminLecturers();
    }
};

window.showBulkUploadModal = function() {
    alert('Bulk upload feature - Upload CSV file with student results');
};

function calculateGradeLetter(score) {
    if (score >= 70) return 'A';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 45) return 'D';
    if (score >= 40) return 'E';
    return 'F';
}