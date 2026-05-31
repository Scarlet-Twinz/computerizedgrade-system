// ============================================
// REPORTING & ANALYTICS MODULE
// ============================================

async function loadAnalytics() {
    const students = await db.collection('students').get();
    const courses = await db.collection('courses').get();
    const results = await db.collection('results').get();
    
    // Calculate pass/fail statistics
    let passedCount = 0;
    let failedCount = 0;
    let totalPoints = 0;
    let totalCredits = 0;
    let deptPerformance = {};
    
    for (const doc of results.docs) {
        const r = doc.data();
        if (r.status === 'published') {
            const course = await db.collection('courses').doc(r.courseId).get();
            if (course.exists) {
                if (r.totalScore >= 40) passedCount++;
                else failedCount++;
                totalPoints += r.gradePoint * course.data().creditUnit;
                totalCredits += course.data().creditUnit;
            }
        }
    }
    
    const passRate = results.size > 0 ? (passedCount / results.size * 100).toFixed(1) : 0;
    const avgGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    
    // Department performance
    const studentsByDept = {};
    for (const doc of students.docs) {
        const s = doc.data();
        const dept = s.department || 'Computer Science';
        if (!studentsByDept[dept]) {
            studentsByDept[dept] = { count: 0, totalGPA: 0 };
        }
        studentsByDept[dept].count++;
    }
    
    const analyticsHtml = `
        <div class="data-card">
            <h5 class="card-title">Academic Analytics</h5>
            <div class="row">
                <div class="col-md-3"><div class="stat-card"><div class="stat-icon blue"><i class="fas fa-chart-line"></i></div><h2 class="stat-number">${students.size}</h2><p class="stat-label">Total Students</p></div></div>
                <div class="col-md-3"><div class="stat-card"><div class="stat-icon green"><i class="fas fa-book"></i></div><h2 class="stat-number">${courses.size}</h2><p class="stat-label">Active Courses</p></div></div>
                <div class="col-md-3"><div class="stat-card"><div class="stat-icon purple"><i class="fas fa-check-circle"></i></div><h2 class="stat-number">${passRate}%</h2><p class="stat-label">Pass Rate</p></div></div>
                <div class="col-md-3"><div class="stat-card"><div class="stat-icon orange"><i class="fas fa-trophy"></i></div><h2 class="stat-number">${avgGPA}</h2><p class="stat-label">Average GPA</p></div></div>
            </div>
            <canvas id="performanceChart" height="200"></canvas>
            <canvas id="deptChart" height="200" class="mt-4"></canvas>
            <button class="btn btn-primary mt-3" onclick="exportAnalyticsReport()"><i class="fas fa-download me-2"></i>Export Report</button>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = analyticsHtml;
    
    // Create charts
    new Chart(document.getElementById('performanceChart'), {
        type: 'bar',
        data: {
            labels: ['Passed', 'Failed'],
            datasets: [{
                label: 'Student Performance',
                data: [passedCount, failedCount],
                backgroundColor: ['#28a745', '#dc3545']
            }]
        }
    });
    
    new Chart(document.getElementById('deptChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(studentsByDept),
            datasets: [{
                data: Object.values(studentsByDept).map(d => d.count),
                backgroundColor: ['#0a1e3c', '#1a3a6c', '#c49a2c', '#28a745', '#17a2b8']
            }]
        }
    });
}

function exportAnalyticsReport() {
    const report = {
        generatedAt: new Date().toISOString(),
        statistics: {
            totalStudents: document.querySelector('.stat-number')?.innerText || '0',
            passRate: document.querySelectorAll('.stat-number')[2]?.innerText || '0%',
            avgGPA: document.querySelectorAll('.stat-number')[3]?.innerText || '0'
        }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}