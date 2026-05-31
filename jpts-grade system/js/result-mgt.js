// ============================================
// RESULT ENGINE - GPA/CGPA CALCULATION
// ============================================

// Grading System based on score
function calculateGrade(score) {
    if (score >= 70) return { grade: 'A', gradePoint: 5.0, remark: 'Excellent' };
    if (score >= 60) return { grade: 'B', gradePoint: 4.0, remark: 'Very Good' };
    if (score >= 50) return { grade: 'C', gradePoint: 3.0, remark: 'Good' };
    if (score >= 45) return { grade: 'D', gradePoint: 2.0, remark: 'Fair' };
    if (score >= 40) return { grade: 'E', gradePoint: 1.0, remark: 'Pass' };
    return { grade: 'F', gradePoint: 0.0, remark: 'Fail' };
}

// Calculate GPA for a single semester
async function calculateGPA(studentId, session, semester) {
    try {
        const results = await db.collection('results')
            .where('studentId', '==', studentId)
            .where('session', '==', session)
            .where('semester', '==', semester)
            .where('status', '==', 'published')
            .get();
        
        let totalGradePoints = 0;
        let totalCredits = 0;
        
        for (const doc of results.docs) {
            const result = doc.data();
            const course = await db.collection('courses').doc(result.courseId).get();
            if (course.exists) {
                totalGradePoints += result.gradePoint * course.data().creditUnit;
                totalCredits += course.data().creditUnit;
            }
        }
        
        return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
    } catch (error) {
        console.error('Error calculating GPA:', error);
        return 0;
    }
}

// Calculate CGPA (Cumulative GPA)
async function calculateCGPA(studentId) {
    try {
        const results = await db.collection('results')
            .where('studentId', '==', studentId)
            .where('status', '==', 'published')
            .get();
        
        let totalGradePoints = 0;
        let totalCredits = 0;
        
        for (const doc of results.docs) {
            const result = doc.data();
            const course = await db.collection('courses').doc(result.courseId).get();
            if (course.exists) {
                totalGradePoints += result.gradePoint * course.data().creditUnit;
                totalCredits += course.data().creditUnit;
            }
        }
        
        return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
    } catch (error) {
        console.error('Error calculating CGPA:', error);
        return 0;
    }
}

// Get classification based on CGPA
function getClassification(cgpa) {
    const numCgpa = parseFloat(cgpa);
    if (numCgpa >= 4.5) return 'First Class Honours';
    if (numCgpa >= 3.5) return 'Second Class Honours (Upper)';
    if (numCgpa >= 2.5) return 'Second Class Honours (Lower)';
    if (numCgpa >= 1.5) return 'Third Class Honours';
    return 'Pass';
}

// Bulk upload results processing
async function processBulkUpload(resultsData) {
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const record of resultsData) {
        try {
            const studentQuery = await db.collection('students')
                .where('matricNumber', '==', record.matricNumber)
                .get();
            
            if (studentQuery.empty) {
                errors.push(`Student not found: ${record.matricNumber}`);
                errorCount++;
                continue;
            }
            const studentId = studentQuery.docs[0].id;
            
            const courseQuery = await db.collection('courses')
                .where('courseCode', '==', record.courseCode)
                .get();
            
            if (courseQuery.empty) {
                errors.push(`Course not found: ${record.courseCode}`);
                errorCount++;
                continue;
            }
            const courseId = courseQuery.docs[0].id;
            
            const totalScore = (parseFloat(record.caScore) || 0) + (parseFloat(record.examScore) || 0);
            const gradeInfo = calculateGrade(totalScore);
            
            await db.collection('results').add({
                studentId, courseId,
                caScore: parseFloat(record.caScore) || 0,
                examScore: parseFloat(record.examScore) || 0,
                totalScore: totalScore,
                grade: gradeInfo.grade,
                gradePoint: gradeInfo.gradePoint,
                session: record.session,
                semester: record.semester,
                status: 'pending',
                enteredAt: new Date()
            });
            successCount++;
        } catch (error) {
            errorCount++;
            errors.push(error.message);
        }
    }
    
    return { successCount, errorCount, errors };
}