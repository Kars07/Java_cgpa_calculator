package com.example.restapi.controller;

import com.example.restapi.dto.CGPAResponse;
import com.example.restapi.model.CourseRecord;
import com.example.restapi.service.CourseRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CourseRecordController {
    
    private final CourseRecordService courseRecordService;
    
    @GetMapping
    public ResponseEntity<List<CourseRecord>> getAllCourseRecords() {
        return ResponseEntity.ok(courseRecordService.getAllCourseRecords());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CourseRecord> getCourseRecordById(@PathVariable Long id) {
        return ResponseEntity.ok(courseRecordService.getCourseRecordById(id));
    }
    
    @GetMapping("/semester/{semester}")
    public ResponseEntity<List<CourseRecord>> getCourseRecordsBySemester(@PathVariable String semester) {
        return ResponseEntity.ok(courseRecordService.getCourseRecordsBySemester(semester));
    }
    
    @PostMapping
    public ResponseEntity<CourseRecord> createCourseRecord(@RequestBody CourseRecord courseRecord) {
        CourseRecord created = courseRecordService.createCourseRecord(courseRecord);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CourseRecord> updateCourseRecord(
            @PathVariable Long id, 
            @RequestBody CourseRecord courseRecord) {
        CourseRecord updated = courseRecordService.updateCourseRecord(id, courseRecord);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourseRecord(@PathVariable Long id) {
        courseRecordService.deleteCourseRecord(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/cgpa")
    public ResponseEntity<CGPAResponse> calculateOverallCGPA() {
        return ResponseEntity.ok(courseRecordService.calculateOverallCGPA());
    }
    
    @GetMapping("/cgpa/semester/{semester}")
    public ResponseEntity<CGPAResponse> calculateSemesterGPA(@PathVariable String semester) {
        return ResponseEntity.ok(courseRecordService.calculateSemesterGPA(semester));
    }
}