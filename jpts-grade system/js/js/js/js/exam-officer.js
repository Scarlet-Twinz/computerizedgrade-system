// ============================================
// EXAM OFFICER DASHBOARD FUNCTIONS
// ============================================

let currentExamId = null;

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.data()?.role !== 'exam_officer') {
        window.location.href = 'login.html';
        return;
    }
    currentExamId = user.uid;
    document.getElementById('examName').innerHTML = userDoc.data().name;
    loadExamDashboard();
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = 'login.html';
});

document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('active');
});

window.loadExamPage = function(page) {
    if (page === 'dashboard') loadExamDashboard();
    else if (page === 'publish') loadExamPublish();
    else if (page === 'transcripts') loadExamTranscripts();
    else if (page === 'reports') loadExamReports();
};

async function loadExamDashboard() {
    const results = await db.collection('results').get();
    const approvedResults = await db.collection('results').where('status', '==', 'approved').get();
    const students = await db.collection('students').get();
    
    document.getElementById('mainContent').innerHTML = `
        <div class="welcome-banner">
            <h2>Examination Office Dashboard</h2>
            <p>Publish results and generate transcripts</p>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-chart-line"></i></div>
                <h2 class="stat-number">${results.size}</h2>
                <p class="stat-label">Total Results</p>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
                <h2 class="stat-number">${approvedResults.size}</h2>
                <p class="stat-label">Approved Results</p>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><i class="fas fa-users"></i></div>
                <h2 class="stat-number">${students.size}</h2>
                <p class="stat-label">Students</p>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h5>Quick Actions</h5></div>
            <div class="card-body">
                <button class="btn btn-primary" onclick="loadExamPage('publish')"><i class="fas fa-clipboard-list me-2"></i>Publish Results</button>
                <button class="btn btn-info" onclick="loadExamPage('transcripts')"><i class="fas fa-file-pdf me-2"></i>Generate Transcripts</button>
            </div>
        </div>
    `;
}

async function loadExamPublish() {
    const approvedResults = await db.collection('results').where('status', '==', 'approved').get();
    let html = `
        <div class="card">
            <div class="card-header"><h5>Results Ready for Publication</h5></div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr><th>Student</th><th>Matric No</th><th>Course</th><th>CA Score</th><th>Exam Score</th><th>Total</th><th>Grade</th><th>Action</th>
                        </thead>
                        <tbody>
    `;
    
    for (const doc of approvedResults.docs) {
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
                <td><button class="btn btn-success btn-sm" onclick="publishResult('${doc.id}')">Publish</button></td>
            </tr>
        `;
    }
    
    if (approvedResults.size === 0) {
        html += `<tr><td colspan="8" class="text-center">No approved results ready for publication.</td></tr>`;
    }
    
    html += `
                        </tbody>
                    </table>
                </div>
                <button class="btn btn-primary mt-3" onclick="publishAllResults()">Publish All Results</button>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = html;
}

async function loadExamTranscripts() {
    const students = await db.collection('students').get();
    let html = `
        <div class="card">
            <div class="card-header"><h5>Generate Student Transcripts</h5></div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <select id="transcriptStudent" class="form-select">
                            <option value="">Select Student</option>
    `;
    
    for (const doc of students.docs) {
        const s = doc.data();
        html += `<option value="${doc.id}">${s.name} (${s.matricNumber})</option>`;
    }
    
    html += `
                        </select>
                    </div>
                    <div class="col-md-6">
                        <button class="btn btn-primary" onclick="generateStudentTranscript()">Generate Transcript</button>
                    </div>
                </div>
                <div id="transcriptPreview" class="mt-4"></div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = html;
}

async function loadExamReports() {
    const students = await db.collection('students').get();
    const results = await db.collection('results').get();
    const publishedResults = await db.collection('results').where('status', '==', 'published').get();
    
    document.getElementById('mainContent').innerHTML = `
        <div class="card">
            <div class="card-header"><h5>Examination Reports</h5></div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4">
                        <div class="stat-card">
                            <h2 class="stat-number">${students.size}</h2>
                            <p class="stat-label">Total Students</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-card">
                            <h2 class="stat-number">${results.size}</h2>
                            <p class="stat-label">Results Processed</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-card">
                            <h2 class="stat-number">${publishedResults.size}</h2>
                            <p class="stat-label">Results Published</p>
                        </div>
                    </div>
                </div>
                <canvas id="resultsChart" height="200"></canvas>
                <button class="btn btn-primary mt-3" onclick="alert('Report exported')"><i class="fas fa-download me-2"></i>Export Report</button>
            </div>
        </div>
    `;
    
    new Chart(document.getElementById('resultsChart'), {
        type: 'bar',
        data: {
            labels: ['Pending', 'Approved', 'Published'],
            datasets: [{
                label: 'Results Status',
                data: [
                    results.docs.filter(r => r.data().status === 'pending').length,
                    results.docs.filter(r => r.data().status === 'approved').length,
                    results.docs.filter(r => r.data().status === 'published').length
                ],
                backgroundColor: ['#ffc107', '#17a2b8', '#28a745']
            }]
        }
    });
}

window.publishResult = async function(resultId) {
    await db.collection('results').doc(resultId).update({ status: 'published', publishedAt: new Date(), publishedBy: currentExamId });
    showMessage('Result published! Student can now view.', 'success');
    loadExamPublish();
};

window.publishAllResults = async function() {
    const approvedResults = await db.collection('results').where('status', '==', 'approved').get();
    for (const doc of approvedResults.docs) {
        await db.collection('results').doc(doc.id).update({ status: 'published', publishedAt: new Date() });
    }
    showMessage('All results published!', 'success');
    loadExamPublish();
};

window.generateStudentTranscript = async function() {
    const studentId = document.getElementById('transcriptStudent').value;
    if (!studentId) {
        showMessage('Please select a student', 'danger');
        return;
    }
    const transcriptHtml = await generateTranscript(studentId);
    document.getElementById('transcriptPreview').innerHTML = transcriptHtml;
    document.getElementById('transcriptPreview').innerHTML += `<div class="text-center mt-3"><button class="btn btn-danger" onclick="downloadTranscriptAsPDF()">Download PDF</button></div>`;
};