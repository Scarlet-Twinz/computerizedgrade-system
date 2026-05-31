// js/course-mgt.js
let coursesTable;

async function loadCoursesPage() {
    const content = `
        <div class="page-header d-flex justify-content-between align-items-center mb-4">
            <h2><i class="fas fa-book me-2"></i>Course Management</h2>
            <button class="btn btn-primary" onclick="showCourseModal()">
                <i class="fas fa-plus me-2"></i>Add New Course
            </button>
        </div>
        
        <div class="card">
            <div class="card-body">
                <table id="coursesTable" class="table table-striped">
                    <thead>
                        <tr>
                            <th>Course Code</th>
                            <th>Course Title</th>
                            <th>Credit Unit</th>
                            <th>Department</th>
                            <th>Level</th>
                            <th>Semester</th>
                            <th>Lecturer</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="coursesTableBody"></tbody>
                </table>
            </div>
        </div>
    `;
    
    document.getElementById('pageContent').innerHTML = content;
    
    coursesTable = $('#coursesTable').DataTable({
        pageLength: 10,
        responsive: true
    });
    
    await loadCourses();
}

async function loadCourses() {
    try {
        const snapshot = await db.collection('courses').get();
        const tbody = document.getElementById('coursesTableBody');
        tbody.innerHTML = '';
        
        for (const doc of snapshot.docs) {
            const course = { id: doc.id, ...doc.data() };
            
            // Get lecturer name
            let lecturerName = 'Not Assigned';
            if (course.lecturerId) {
                const lecturerDoc = await db.collection('lecturers').doc(course.lecturerId).get();
                if (lecturerDoc.exists) {
                    lecturerName = lecturerDoc.data().name;
                }
            }
            
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${course.courseCode}</td>
                <td>${course.courseTitle}</td>
                <td><span class="badge bg-info">${course.creditUnit} Units</span></td>
                <td>${formatDepartment(course.department)}</td>
                <td>${course.level}</td>
                <td>${course.semester}</td>
                <td>${lecturerName}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editCourse('${course.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCourse('${course.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="assignLecturer('${course.id}')">
                        <i class="fas fa-user-graduate"></i>
                    </button>
                </td>
            `;
        }
        
        coursesTable.clear().rows.add($('#coursesTable tbody tr')).draw();
        
    } catch (error) {
        console.error('Error loading courses:', error);
        showNotification('Error loading courses', 'error');
    }
}

function showCourseModal(courseId = null) {
    const modalHtml = `
        <div class="modal fade" id="courseModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${courseId ? 'Edit' : 'Add'} Course</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="courseForm">
                            <div class="mb-3">
                                <label>Course Code *</label>
                                <input type="text" class="form-control" name="courseCode" required>
                            </div>
                            <div class="mb-3">
                                <label>Course Title *</label>
                                <input type="text" class="form-control" name="courseTitle" required>
                            </div>
                            <div class="mb-3">
                                <label>Credit Unit *</label>
                                <input type="number" class="form-control" name="creditUnit" min="1" max="6" required>
                            </div>
                            <div class="mb-3">
                                <label>Department *</label>
                                <select class="form-select" name="department" required>
                                    <option value="computer_science">Computer Science</option>
                                    <option value="engineering">Engineering</option>
                                    <option value="business">Business Administration</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Level *</label>
                                <select class="form-select" name="level" required>
                                    <option value="100">100 Level</option>
                                    <option value="200">200 Level</option>
                                    <option value="300">300 Level</option>
                                    <option value="400">400 Level</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Semester *</label>
                                <select class="form-select" name="semester" required>
                                    <option value="first">First Semester</option>
                                    <option value="second">Second Semester</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveCourse()">Save Course</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('courseModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    if (courseId) {
        document.getElementById('courseModal').dataset.courseId = courseId;
        loadCourseData(courseId);
    }
    
    const modal = new bootstrap.Modal(document.getElementById('courseModal'));
    modal.show();
}

async function saveCourse() {
    const form = document.getElementById('courseForm');
    const formData = new FormData(form);
    const courseData = Object.fromEntries(formData);
    
    try {
        const courseId = document.getElementById('courseModal').dataset.courseId;
        
        if (courseId) {
            await db.collection('courses').doc(courseId).update(courseData);
            showNotification('Course updated successfully', 'success');
        } else {
            await db.collection('courses').add(courseData);
            showNotification('Course added successfully', 'success');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('courseModal')).hide();
        loadCourses();
        
    } catch (error) {
        console.error('Error saving course:', error);
        showNotification('Error saving course', 'error');
    }
}

async function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course?')) {
        try {
            await db.collection('courses').doc(courseId).delete();
            showNotification('Course deleted successfully', 'success');
            loadCourses();
        } catch (error) {
            console.error('Error deleting course:', error);
            showNotification('Error deleting course', 'error');
        }
    }
}

async function assignLecturer(courseId) {
    const lecturers = await db.collection('lecturers').get();
    const lecturerOptions = [];
    
    lecturers.forEach(doc => {
        lecturerOptions.push(`<option value="${doc.id}">${doc.data().name}</option>`);
    });
    
    const modalHtml = `
        <div class="modal fade" id="assignModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Assign Lecturer</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <select id="lecturerSelect" class="form-select">
                            <option value="">Select Lecturer</option>
                            ${lecturerOptions.join('')}
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveLecturerAssignment('${courseId}')">Assign</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('assignModal'));
    modal.show();
}

async function saveLecturerAssignment(courseId) {
    const lecturerId = document.getElementById('lecturerSelect').value;
    
    if (!lecturerId) {
        showNotification('Please select a lecturer', 'error');
        return;
    }
    
    try {
        await db.collection('courses').doc(courseId).update({
            lecturerId: lecturerId,
            assignedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Lecturer assigned successfully', 'success');
        bootstrap.Modal.getInstance(document.getElementById('assignModal')).hide();
        loadCourses();
        
    } catch (error) {
        console.error('Error assigning lecturer:', error);
        showNotification('Error assigning lecturer', 'error');
    }
}