package com.example.restapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CGPAResponse {
    private Double cgpa;
    private Integer totalUnits;
    private Integer totalGradePoints;
    private String semester; // null for overall CGPA, specific for semester GPA
}