// ============================================
// STUDENT DASHBOARD FUNCTIONS
// ============================================

let currentStudentId = null;

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.data()?.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }
    currentStudentId = user.uid;
    document.getElementById('studentName').innerHTML = userDoc.data().name;
    loadStudentDashboard();
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = 'login.html';
});

document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('active');
});

window.loadStudentPage = function(page) {
    if (page === 'dashboard') loadStudentDashboard();
    else if (page === 'results') loadStudentResults();
    else if (page === 'courses') loadStudentCourses();
    else if (page === 'transcript') loadStudentTranscript();
    else if (page === 'profile') loadStudentProfile();
};

async function loadStudentDashboard() {
    const cgpa = await calculateCGPA(currentStudentId);
    const classification = getClassification(cgpa);
    const results = await db.collection('results').where('studentId', '==', currentStudentId).where('status', '==', 'published').get();
    
    document.getElementById('mainContent').innerHTML = `
        <div class="welcome-banner">
            <h2>Welcome to Your Dashboard</h2>
            <p>JPTS University Academic Portal - Track your progress</p>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-book"></i></div>
                <h2 class="stat-number">${results.size}</h2>
                <p class="stat-label">Courses Taken</p>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-chart-line"></i></div>
                <h2 class="stat-number">${cgpa}</h2>
                <p class="stat-label">CGPA</p>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><i class="fas fa-trophy"></i></div>
                <h2 class="stat-number">${classification}</h2>
                <p class="stat-label">Classification</p>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i class="fas fa-credit-card"></i></div>
                <h2 class="stat-number">Paid</h2>
                <p class="stat-label">Fee Status</p>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h5>Latest Announcements</h5></div>
            <div class="card-body">
                <ul class="list-unstyled">
                    <li class="mb-2"><i class="fas fa-circle text-primary me-2" style="font-size: 8px;"></i> First Semester Examination results now available</li>
                    <li class="mb-2"><i class="fas fa-circle text-primary me-2" style="font-size: 8px;"></i> Course registration deadline: December 15th, 2024</li>
                    <li class="mb-2"><i class="fas fa-circle text-primary me-2" style="font-size: 8px;"></i> Second semester begins January 8th, 2025</li>
                </ul>
            </div>
        </div>
    `;
}

async function loadStudentResults() {
    const results = await db.collection('results').where('studentId', '==', currentStudentId).where('status', '==', 'published').get();
    let totalPoints = 0;
    let totalCredits = 0;
    let html = `
        <div class="card">
            <div class="card-header"><h5>My Academic Results</h5></div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr><th>Course Code</th><th>Course Title</th><th>Credit Unit</th><th>CA Score</th><th>Exam Score</th><th>Total</th><th>Grade</th><th>Grade Point</th>
                        </thead>
                        <tbody>
    `;
    
    for (const doc of results.docs) {
        const r = doc.data();
        const course = await db.collection('courses').doc(r.courseId).get();
        if (course.exists) {
            const c = course.data();
            const total = (r.caScore || 0) + (r.examScore || 0);
            const grade = calculateGrade(total);
            totalPoints += grade.gradePoint * c.creditUnit;
            totalCredits += c.creditUnit;
            html += `
                <tr>
                    <td>${c.courseCode}</td>
                    <td>${c.courseTitle}</td>
                    <td class="text-center">${c.creditUnit}</td>
                    <td class="text-center">${r.caScore || 0}</td>
                    <td class="text-center">${r.examScore || 0}</td>
                    <td class="text-center"><strong>${total}</strong></td>
                    <td class="text-center"><span class="grade-${grade.grade}">${grade.grade}</span></td>
                    <td class="text-center">${grade.gradePoint}</td>
                </tr>
            `;
        }
    }
    
    const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    html += `
                        </tbody>
                    </table>
                </div>
                <div class="alert alert-info mt-3">
                    <strong>Semester Summary:</strong> Total Credits: ${totalCredits} | Total Points: ${totalPoints.toFixed(2)} | CGPA: ${cgpa}
                </div>
                <button class="btn btn-primary" onclick="downloadTranscript()"><i class="fas fa-file-pdf me-2"></i>Download Transcript</button>
                <button class="btn btn-info" onclick="window.print()"><i class="fas fa-print me-2"></i>Print Results</button>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = html;
}

async function loadStudentCourses() {
    const courses = await db.collection('courses').get();
    const registrations = await db.collection('registrations').where('studentId', '==', currentStudentId).get();
    const registeredIds = registrations.docs.map(d => d.data().courseId);
    
    let html = `
        <div class="card">
            <div class="card-header"><h5>Course Registration - 2024/2025 Session</h5></div>
            <div class="card-body">
                <div class="courses-grid" id="coursesGrid">
    `;
    
    for (const doc of courses.docs) {
        const c = doc.data();
        const isRegistered = registeredIds.includes(doc.id);
        html += `
            <div class="course-item">
                <input type="checkbox" class="course-check" value="${doc.id}" id="course_${doc.id}" ${isRegistered ? 'checked disabled' : ''}>
                <label for="course_${doc.id}">
                    <div class="course-code">${c.courseCode}</div>
                    <div class="course-title">${c.courseTitle}</div>
                    <div class="course-credit">${c.creditUnit} Credits</div>
                </label>
            </div>
        `;
    }
    
    html += `
                </div>
                <button class="btn btn-primary mt-3" onclick="submitRegistration()">Submit Registration</button>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = html;
}

async function loadStudentTranscript() {
    const transcriptHtml = await generateTranscript(currentStudentId);
    document.getElementById('mainContent').innerHTML = `
        <div class="card">
            <div class="card-header"><h5>Official Transcript</h5></div>
            <div class="card-body">
                ${transcriptHtml}
                <div class="text-center mt-4">
                    <button class="btn btn-danger" onclick="downloadTranscriptAsPDF()"><i class="fas fa-download me-2"></i>Download PDF</button>
                </div>
            </div>
        </div>
    `;
}

async function loadStudentProfile() {
    const userDoc = await db.collection('users').doc(currentStudentId).get();
    const student = userDoc.data();
    document.getElementById('mainContent').innerHTML = `
        <div class="card">
            <div class="card-header"><h5>Student Profile</h5></div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 text-center">
                        <div class="user-avatar" style="width: 120px; height: 120px; font-size: 48px; margin: 0 auto;"><i class="fas fa-user-graduate"></i></div>
                        <h4 class="mt-3">${student.name}</h4>
                        <p>${student.regNumber}</p>
                    </div>
                    <div class="col-md-8">
                        <table class="table">
                            <tr><th style="width: 40%">Full Name</th><td>${student.name}</td></tr>
                            <tr><th>Matric Number</th><td>${student.regNumber}</td></tr>
                            <tr><th>Email</th><td>${student.email}</td></tr>
                            <tr><th>Department</th><td>${student.department || 'Computer Science'}</td></tr>
                            <tr><th>Level</th><td>200 Level</td></tr>
                            <tr><th>Faculty</th><td>Computing & Engineering</td></tr>
                            <tr><th>Session of Admission</th><td>2023/2024</td></tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.submitRegistration = async function() {
    const selected = [];
    document.querySelectorAll('.course-check:checked:not(:disabled)').forEach(cb => selected.push(cb.value));
    for (const courseId of selected) {
        await db.collection('registrations').add({
            studentId: currentStudentId,
            courseId: courseId,
            registeredAt: new Date(),
            session: '2024/2025'
        });
    }
    showMessage(`${selected.length} courses registered successfully!`, 'success');
    loadStudentCourses();
};

window.downloadTranscript = function() {
    alert('Transcript PDF will be generated');
};ss