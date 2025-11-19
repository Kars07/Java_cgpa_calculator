package com.example.restapi.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "course_records")
public class CourseRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String semester;
    
    @Column(nullable = false)
    private String courseName;

    @Column(nullable = false)
    private Integer unit;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Grade grade;

    @Transient
    private Integer gradePoint;

    public enum Grade {
        A(5), B(4), C(3), D(2), E(1), F(0);

        private final int points;

        Grade(int points) {
            this.points = points;
        }

        public int getPoints() {
            return points;
        }
    }

    public Integer getGradePoint() {
        return grade != null ? grade.getPoints() : 0;
    }

}
