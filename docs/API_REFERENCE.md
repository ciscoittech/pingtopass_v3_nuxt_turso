# 📚 PingToPass API Reference

## Authentication

### GET /api/auth/me
Get current user session
```json
Response: {
  "user": {
    "id": "usr_xxx",
    "email": "user@example.com",
    "fullName": "John Doe",
    "isAdmin": false,
    "isActive": true
  }
}
```

### GET /auth/oauth/google
Initiate Google OAuth flow (redirects to Google)

## Vendors

### GET /api/vendors
List all vendors
```json
Response: {
  "success": true,
  "data": [{
    "id": "vnd_xxx",
    "name": "CompTIA",
    "description": "...",
    "website": "https://...",
    "logoUrl": "/logos/comptia.png",
    "createdAt": 1752440842,
    "updatedAt": 1752440842
  }]
}
```

### GET /api/vendors/[id]
Get single vendor
```json
Response: {
  "success": true,
  "data": { vendor object }
}
```

### POST /api/vendors
Create new vendor
```json
Request: {
  "name": "New Vendor",
  "description": "Description",
  "website": "https://...",
  "logoUrl": "/logos/new.png"
}
Response: {
  "success": true,
  "data": { created vendor }
}
```

### PUT /api/vendors/[id]
Update vendor
```json
Request: {
  "name": "Updated Name",
  "description": "Updated description"
}
Response: {
  "success": true,
  "data": { updated vendor }
}
```

### DELETE /api/vendors/[id]
Delete vendor (fails if vendor has exams)
```json
Response: {
  "success": true,
  "message": "Vendor deleted successfully"
}
```

## Exams

### GET /api/exams
List all exams with optional vendor filter
```
Query params:
  - vendor: vendor ID to filter by

Response: {
  "success": true,
  "data": [{
    "id": "exm_xxx",
    "examCode": "220-1101",
    "examName": "CompTIA A+ Core 1",
    "vendorId": "vnd_xxx",
    "vendorName": "CompTIA",
    "passingScore": 675,
    "examDuration": 90,
    "numberOfQuestions": 90,
    "isActive": true,
    "updatedAt": 1752440842
  }]
}
```

### GET /api/exams/[id]
Get exam details with objectives
```json
Response: {
  "success": true,
  "data": {
    ...exam fields,
    "objectives": [{
      "id": "obj_xxx",
      "title": "Mobile Devices",
      "description": "...",
      "weight": 14
    }]
  }
}
```

## 🚧 Pending Implementation

### Questions API
- GET /api/questions?examId=xxx
- GET /api/questions/[id]
- POST /api/questions
- PUT /api/questions/[id]
- DELETE /api/questions/[id]

### Study Sessions API
- POST /api/study/start
- POST /api/study/answer
- GET /api/study/progress

### Test Sessions API
- POST /api/test/start
- POST /api/test/submit
- GET /api/test/results/[id]

### Progress API
- GET /api/progress/overview
- GET /api/progress/exam/[examId]
- GET /api/progress/objectives/[examId]

---

*Note: All endpoints require authentication except GET /api/auth/me*