package com.example.restapi.repository;

import com.example.restapi.model.CourseRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRecordRepository extends JpaRepository<CourseRecord, Long> {
    List<CourseRecord> findBySemester(String semester);
}