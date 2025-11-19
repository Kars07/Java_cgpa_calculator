# CGPA Calculator REST API

A Spring Boot REST API for calculating Cumulative Grade Point Average (CGPA) based on course records.

## Features

- Create, read, update, and delete course records
- Automatic grade-to-grade-point conversion
- Calculate overall CGPA across all semesters
- Calculate semester-specific GPA
- Filter courses by semester

## Grade Point System

| Grade | Grade Points |
|-------|--------------|
| A     | 5            |
| B     | 4            |
| C     | 3            |
| D     | 2            |
| E     | 1            |
| F     | 0            |

## CGPA Calculation Formula

```
CGPA = (Sum of (Unit × Grade Point)) / (Sum of Units)
```

## Technologies Used

- Java 17
- Spring Boot 3.1.5
- Spring Data JPA
- Lombok
- Maven

## Project Structure

```
rest-grpc-demo/
│
├── pom.xml
│
└── src/
    └── main/
        ├── java/
        │   └── com/
        │       └── example/
        │           ├── Application.java
        │           │
        │           └── cgpa/
        │               ├── model/
        │               │   └── CourseRecord.java
        │               │
        │               ├── repository/
        │               │   └── CourseRecordRepository.java
        │               │
        │               ├── dto/
        │               │   └── CGPAResponse.java
        │               │
        │               ├── service/
        │               │   └── CourseRecordService.java
        │               │
        │               └── controller/
        │                   └── CourseRecordController.java
        │
        └── resources/
            └── application.properties
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.6+

### Build and Run

```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

## API Endpoints

### Course Records

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/courses` | Create a new course record |
| GET | `/api/courses` | Get all course records |
| GET | `/api/courses/{id}` | Get course record by ID |
| GET | `/api/courses/semester/{semester}` | Get courses by semester |
| PUT | `/api/courses/{id}` | Update a course record |
| DELETE | `/api/courses/{id}` | Delete a course record |
| GET | `/api/courses/cgpa` | Calculate overall CGPA |
| GET | `/api/courses/cgpa/semester/{semester}` | Calculate semester GPA |

## API Usage Examples

### Create a Course Record

```bash
curl -X POST http://localhost:8080/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "semester": "Fall 2024",
    "courseName": "Data Structures",
    "unit": 3,
    "grade": "A"
  }'
```

**Request Body:**
```json
{
  "semester": "Fall 2024",
  "courseName": "Data Structures",
  "unit": 3,
  "grade": "A"
}
```

**Response:**
```json
{
  "id": 1,
  "semester": "Fall 2024",
  "courseName": "Data Structures",
  "unit": 3,
  "grade": "A",
  "gradePoint": 5
}
```

### Get All Course Records

```bash
curl http://localhost:8080/api/courses
```

**Response:**
```json
[
  {
    "id": 1,
    "semester": "Fall 2024",
    "courseName": "Data Structures",
    "unit": 3,
    "grade": "A",
    "gradePoint": 5
  },
  {
    "id": 2,
    "semester": "Fall 2024",
    "courseName": "Algorithms",
    "unit": 4,
    "grade": "B",
    "gradePoint": 4
  }
]
```

### Calculate Overall CGPA

```bash
curl http://localhost:8080/api/courses/cgpa
```

**Response:**
```json
{
  "cgpa": 4.43,
  "totalUnits": 7,
  "totalGradePoints": 31,
  "semester": null
}
```

### Calculate Semester GPA

```bash
curl http://localhost:8080/api/courses/cgpa/semester/Fall%202024
```

**Response:**
```json
{
  "cgpa": 4.43,
  "totalUnits": 7,
  "totalGradePoints": 31,
  "semester": "Fall 2024"
}
```

### Get Courses by Semester

```bash
curl http://localhost:8080/api/courses/semester/Fall%202024
```

### Update a Course Record

```bash
curl -X PUT http://localhost:8080/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "semester": "Fall 2024",
    "courseName": "Advanced Data Structures",
    "unit": 4,
    "grade": "A"
  }'
```

### Delete a Course Record

```bash
curl -X DELETE http://localhost:8080/api/courses/1
```

## Testing with Sample Data

Create multiple course records to test CGPA calculation:

```bash
# Course 1
curl -X POST http://localhost:8080/api/courses \
  -H "Content-Type: application/json" \
  -d '{"semester": "Fall 2024", "courseName": "Data Structures", "unit": 3, "grade": "A"}'

# Course 2
curl -X POST http://localhost:8080/api/courses \
  -H "Content-Type: application/json" \
  -d '{"semester": "Fall 2024", "courseName": "Algorithms", "unit": 4, "grade": "B"}'

# Course 3
curl -X POST http://localhost:8080/api/courses \
  -H "Content-Type: application/json" \
  -d '{"semester": "Spring 2025", "courseName": "Database Systems", "unit": 3, "grade": "A"}'

# Calculate overall CGPA
curl http://localhost:8080/api/courses/cgpa
```

## Error Handling

The API includes validation for:
- Unit must be a positive number
- Course name is required
- Semester is required
- Grade must be one of: A, B, C, D, E, F

## License

This project is open source and available under the MIT License.



## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
