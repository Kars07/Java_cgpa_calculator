package com.example.restapi.service;


import com.example.restapi.dto.CGPAResponse;
import com.example.restapi.model.CourseRecord;
import com.example.restapi.repository.CourseRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseRecordService {
    private final CourseRecordRepository courseRecordRepository;

    public List<CourseRecord> getAllCourseRecords() {
        return courseRecordRepository.findAll();
    }

    public List<CourseRecord> getCourseRecordsBySemester(String semester) {
        return courseRecordRepository.findBySemester(semester);
    }
    
    public CourseRecord getCourseRecordById(Long id) {
        return courseRecordRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Course record not found with id: " + id));
    }
    
    @Transactional
    public CourseRecord createCourseRecord(CourseRecord courseRecord) {
        validateCourseRecord(courseRecord);
        return courseRecordRepository.save(courseRecord);
    }
    
    @Transactional
    public CourseRecord updateCourseRecord(Long id, CourseRecord courseRecordDetails) {
        CourseRecord courseRecord = getCourseRecordById(id);
        validateCourseRecord(courseRecordDetails);
        
        courseRecord.setSemester(courseRecordDetails.getSemester());
        courseRecord.setCourseName(courseRecordDetails.getCourseName());
        courseRecord.setUnit(courseRecordDetails.getUnit());
        courseRecord.setGrade(courseRecordDetails.getGrade());
        
        return courseRecordRepository.save(courseRecord);
    }
    
    @Transactional
    public void deleteCourseRecord(Long id) {
        CourseRecord courseRecord = getCourseRecordById(id);
        courseRecordRepository.delete(courseRecord);
    }
    
    public CGPAResponse calculateOverallCGPA() {
        List<CourseRecord> allRecords = courseRecordRepository.findAll();
        return calculateCGPA(allRecords, null);
    }
    
    public CGPAResponse calculateSemesterGPA(String semester) {
        List<CourseRecord> semesterRecords = courseRecordRepository.findBySemester(semester);
        if (semesterRecords.isEmpty()) {
            throw new RuntimeException("No records found for semester: " + semester);
        }
        return calculateCGPA(semesterRecords, semester);
    }
    
    private CGPAResponse calculateCGPA(List<CourseRecord> records, String semester) {
        if (records.isEmpty()) {
            return new CGPAResponse(0.0, 0, 0, semester);
        }
        
        int totalUnits = 0;
        int totalGradePoints = 0;
        
        for (CourseRecord record : records) {
            int gradePoint = record.getGradePoint();
            totalUnits += record.getUnit();
            totalGradePoints += record.getUnit() * gradePoint;
        }
        
        double cgpa = totalUnits > 0 ? (double) totalGradePoints / totalUnits : 0.0;
        cgpa = Math.round(cgpa * 100.0) / 100.0; // Round to 2 decimal places
        
        return new CGPAResponse(cgpa, totalUnits, totalGradePoints, semester);
    }
    
    private void validateCourseRecord(CourseRecord courseRecord) {
        if (courseRecord.getUnit() == null || courseRecord.getUnit() <= 0) {
            throw new RuntimeException("Unit must be a positive number");
        }
        if (courseRecord.getCourseName() == null || courseRecord.getCourseName().trim().isEmpty()) {
            throw new RuntimeException("Course name is required");
        }
        if (courseRecord.getSemester() == null || courseRecord.getSemester().trim().isEmpty()) {
            throw new RuntimeException("Semester is required");
        }
    }
}