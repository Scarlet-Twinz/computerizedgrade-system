// ============================================
// TRANSCRIPT GENERATION MODULE
// ============================================

async function generateTranscript(studentId) {
    try {
        // Get student data
        const studentDoc = await db.collection('students').doc(studentId).get();
        if (!studentDoc.exists) {
            throw new Error('Student not found');
        }
        const student = studentDoc.data();
        
        // Get all published results
        const results = await db.collection('results')
            .where('studentId', '==', studentId)
            .where('status', '==', 'published')
            .get();
        
        // Group results by session and semester
        const academicRecords = {};
        let totalPoints = 0;
        let totalCredits = 0;
        
        for (const doc of results.docs) {
            const result = doc.data();
            const course = await db.collection('courses').doc(result.courseId).get();
            if (course.exists) {
                const courseData = course.data();
                const key = `${result.session}_${result.semester}`;
                
                if (!academicRecords[key]) {
                    academicRecords[key] = {
                        session: result.session,
                        semester: result.semester,
                        courses: [],
                        semesterPoints: 0,
                        semesterCredits: 0
                    };
                }
                
                academicRecords[key].courses.push({
                    code: courseData.courseCode,
                    title: courseData.courseTitle,
                    creditUnit: courseData.creditUnit,
                    score: result.totalScore,
                    grade: result.grade,
                    gradePoint: result.gradePoint
                });
                
                academicRecords[key].semesterPoints += result.gradePoint * courseData.creditUnit;
                academicRecords[key].semesterCredits += courseData.creditUnit;
                academicRecords[key].gpa = (academicRecords[key].semesterPoints / academicRecords[key].semesterCredits).toFixed(2);
                
                totalPoints += result.gradePoint * courseData.creditUnit;
                totalCredits += courseData.creditUnit;
            }
        }
        
        const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
        const classification = getClassification(cgpa);
        
        // Generate HTML for transcript
        let transcriptHtml = `
            <div class="transcript-container" id="transcriptContent">
                <div class="text-center mb-4">
                    <h2>JPTS UNIVERSITY</h2>
                    <h4>Academic Transcript</h4>
                    <hr>
                    <div class="row mt-3">
                        <div class="col-md-6 text-start">
                            <p><strong>Name:</strong> ${student.name}</p>
                            <p><strong>Matric Number:</strong> ${student.matricNumber}</p>
                            <p><strong>Department:</strong> ${student.department || 'Computer Science'}</p>
                        </div>
                        <div class="col-md-6 text-start">
                            <p><strong>Faculty:</strong> Computing & Engineering</p>
                            <p><strong>Programme:</strong> Undergraduate</p>
                            <p><strong>Duration:</strong> 4 Years</p>
                        </div>
                    </div>
                    <hr>
                </div>
        `;
        
        // Sort sessions chronologically
        const sortedSessions = Object.keys(academicRecords).sort();
        
        for (const session of sortedSessions) {
            const record = academicRecords[session];
            transcriptHtml += `
                <div class="mb-4">
                    <h5>${record.session.toUpperCase()} - ${record.semester.toUpperCase()} SEMESTER</h5>
                    <table class="table table-bordered">
                        <thead class="table-dark">
                            <tr><th>Course Code</th><th>Course Title</th><th>Credit Unit</th><th>Score</th><th>Grade</th><th>Grade Point</th>
                        </thead>
                        <tbody>
            `;
            
            for (const course of record.courses) {
                transcriptHtml += `
                    <tr>
                        <td>${course.code}</td>
                        <td>${course.title}</td>
                        <td class="text-center">${course.creditUnit}</td>
                        <td class="text-center">${course.score}</td>
                        <td class="text-center">${course.grade}</td>
                        <td class="text-center">${course.gradePoint}</td>
                    </tr>
                `;
            }
            
            transcriptHtml += `
                        </tbody>
                        <tfoot>
                            <tr class="table-info">
                                <td colspan="2"><strong>Semester GPA:</strong></td>
                                <td colspan="4"><strong>${record.gpa}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        }
        
        transcriptHtml += `
            <div class="alert alert-info text-center">
                <h4>Cumulative GPA (CGPA): ${cgpa}</h4>
                <h5>Classification: ${classification}</h5>
            </div>
            <div class="text-center mt-4">
                <div class="row">
                    <div class="col-4">
                        <p>_____________________</p>
                        <p>Student's Signature</p>
                    </div>
                    <div class="col-4">
                        <p>_____________________</p>
                        <p>Head of Department</p>
                    </div>
                    <div class="col-4">
                        <p>_____________________</p>
                        <p>Registrar</p>
                    </div>
                </div>
                <p class="mt-4"><small>Generated on ${new Date().toLocaleDateString()}</small></p>
                <div class="mt-3">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.href)}" alt="QR Code">
                </div>
            </div>
        </div>
        `;
        
        return transcriptHtml;
    } catch (error) {
        console.error('Error generating transcript:', error);
        return `<div class="alert alert-danger">Error generating transcript: ${error.message}</div>`;
    }
}

function downloadTranscriptAsPDF() {
    const element = document.getElementById('transcriptContent');
    if (!element) return;
    
    const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `transcript_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
}