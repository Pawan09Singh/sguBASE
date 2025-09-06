t3049 teacher
2345 student
npx prisma studio
# University Learning Management System (LMS)

A full-stack Learning Management System designed for universities with role-based access control, course management, video streaming, quiz system, and comprehensive analytics.

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Apollo Client (GraphQL)
- Zustand (State Management)

**Backend:**
- Node.js with Express
- TypeScript
- GraphQL (Apollo Server)
- PostgreSQL with Prisma ORM
- JWT Authentication
- Winston Logging

**Security:**
- Role-based Access Control (RBAC)
- JWT Tokens with Refresh
- Input Validation
- Rate Limiting
- Helmet.js Security Headers
- CORS Protection

## 👥 User Roles Hierarchy

1. **SUPERADMIN** (Highest Authority)
   - Manage departments and users
   - System-wide configurations
   - Access all logs and analytics
   - Hardcoded credentials: UID: 12345, Password: 12345

2. **ADMIN (Dean)**
   - Manage courses in their department
   - Create teachers and students
   - Department-level analytics
   - Announcements

3. **HOD (Head of Department)**
   - Manage assigned courses
   - Approve content submissions
   - Teacher management
   - Course-level analytics

4. **CC (Course Coordinator)**
   - Section management
   - Student enrollment
   - Playlist management
   - Section-level analytics

5. **TEACHER**
   - Upload videos and create quizzes
   - Monitor student progress
   - Forum moderation
   - Issue certificates

6. **STUDENT** (Lowest Level)
   - Access enrolled courses
   - Take quizzes and watch videos
   - Participate in forums
   - View certificates and progress

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lms
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb lms_db
   
   # Copy environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   
   # Update DATABASE_URL in backend/.env
   DATABASE_URL="postgresql://username:password@localhost:5432/lms_db"
   ```

4. **Database Migration**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start Development Servers**
   ```bash
   # From root directory
   npm run dev
   
   # Or start individually
   npm run dev:frontend  # Starts on http://localhost:3000
   npm run dev:backend   # Starts on http://localhost:4000
   ```

## 📂 Project Structure

```
lms/
├── frontend/                 # Next.js Frontend Application
│   ├── app/                 # App Router Pages
│   │   ├── auth/           # Authentication Pages
│   │   ├── dashboard/      # Main Dashboard
│   │   └── layout.tsx      # Root Layout
│   ├── components/         # Reusable Components
│   │   ├── dashboards/     # Role-specific Dashboards
│   │   └── Sidebar.tsx     # Navigation Sidebar
│   ├── hooks/              # Custom React Hooks
│   ├── utils/              # Utility Functions
│   └── styles/             # CSS and Styling
│
├── backend/                 # Node.js Backend API
│   ├── src/
│   │   ├── controllers/    # Route Controllers
│   │   ├── routes/         # Express Routes
│   │   ├── middlewares/    # Custom Middleware
│   │   ├── services/       # Business Logic
│   │   ├── models/         # Data Models
│   │   ├── graphql/        # GraphQL Schema & Resolvers
│   │   └── utils/          # Utility Functions
│   ├── prisma/             # Database Schema
│   └── tests/              # Test Files
│
└── database/               # Database Scripts and Migrations
```

## 🔐 Authentication Flow

### Login Process
1. User enters UID/Email + Password
2. Backend validates credentials
3. JWT tokens generated (Access + Refresh)
4. User redirected to role-specific dashboard

### Role Switching
- Users with multiple roles can switch between them
- Default dashboard based on highest role
- Dropdown selector in sidebar

### Password Reset
1. User requests reset with email
2. OTP sent via email
3. User enters OTP + new password
4. Password updated in database

## 🎯 Key Features

### Dashboard Features by Role

**SuperAdmin Dashboard:**
- User management (Create, Edit, Deactivate)
- Department management
- System logs and analytics
- Permission management
- CSV import for bulk user creation

**Dean Dashboard:**
- Course creation and management
- Teacher assignment
- Department analytics
- Student enrollment oversight
- Announcements to department

**HOD Dashboard:**
- Course content approval workflow
- Teacher performance monitoring
- Section management
- Course-level analytics

**CC Dashboard:**
- Section enrollment management
- Video playlist organization
- Student progress tracking
- Section-specific announcements

**Teacher Dashboard:**
- Video upload with approval workflow
- Quiz creation and management
- Student progress monitoring
- Certificate issuance
- Forum moderation

**Student Dashboard:**
- Course access and video streaming
- Quiz taking and progress tracking
- Forum participation
- Certificate downloads
- Personal analytics

### Core Functionalities

**Course Management:**
- Hierarchical course structure (Department → Course → Section)
- Video content with deadlines
- Interactive quizzes with randomized questions
- Progress tracking and analytics

**Video System:**
- Upload with thumbnail generation
- Approval workflow (Teacher → CC → HOD → Dean)
- Watch time tracking
- Deadline management

**Quiz System:**
- Question bank with multiple options
- Randomized question order
- Timed quizzes
- Instant feedback and scoring

**Forum System:**
- Course/Section-based discussions
- Teacher moderation
- Q&A functionality
- Real-time notifications

**Analytics & Reporting:**
- Student progress tracking
- Course completion rates
- Quiz performance analysis
- Video watch time analytics
- Custom reports for each role

**Announcement System:**
- Role-based targeting
- Course/Section specific
- Expiry date management
- Notification system

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/lms_db"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=4000
NODE_ENV=development
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
SUPERADMIN_UID=12345
SUPERADMIN_PASSWORD=12345
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_APP_NAME="University LMS"
```

## 🗄️ Database Schema

### Key Tables

**Users Table:**
- Basic user information
- Role assignments (array)
- Authentication data
- Profile settings

**Departments:**
- Department information
- Dean assignments
- Creation tracking

**Courses:**
- Course details
- Department association
- Creator tracking

**Sections:**
- Course subdivisions
- Student enrollments
- Teacher assignments

**Videos:**
- Video metadata
- Approval workflow status
- Deadline management

**Quizzes:**
- Question storage (JSON)
- Associated video content
- Attempt tracking

**Enrollments:**
- User-Section relationships
- Role-based access
- Enrollment dates

## 🚦 API Endpoints

### REST API Routes

**Authentication:**
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

**Users:**
- `GET /api/users` - List users (Admin+)
- `POST /api/users` - Create user (Admin+)
- `PUT /api/users/:id/roles` - Update user roles (SuperAdmin)

**Courses:**
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (Dean+)

### GraphQL Endpoints

**Queries:**
- `me` - Current user information
- `users` - User list with filtering
- `courses` - Course list with sections
- `dashboardStats` - Role-specific statistics

**Mutations:**
- `createUser` - User creation
- `createCourse` - Course creation
- `enrollStudents` - Bulk enrollment

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Production Build

```bash
# Build all
npm run build

# Build individually
npm run build:frontend
npm run build:backend
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Environment Setup

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Start application servers
5. Configure reverse proxy (nginx)
6. Set up SSL certificates

## 🔒 Security Features

- **Input Validation:** Express-validator for all inputs
- **SQL Injection Prevention:** Prisma ORM with parameterized queries
- **XSS Protection:** Content Security Policy headers
- **CSRF Protection:** SameSite cookies and CSRF tokens
- **Rate Limiting:** Express-rate-limit middleware
- **Password Security:** bcrypt with salt rounds
- **JWT Security:** Short-lived access tokens with refresh mechanism

## 📱 Mobile Responsiveness

- Responsive design with TailwindCSS
- Mobile-optimized navigation
- Touch-friendly interface
- Progressive Web App (PWA) capabilities

## 🔄 Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] Video streaming with HLS/DASH
- [ ] AI-powered content recommendations
- [ ] Advanced analytics with machine learning
- [ ] Mobile application (React Native)
- [ ] Integration with external LTI tools
- [ ] Advanced quiz types (fill-in-the-blank, drag-drop)
- [ ] Plagiarism detection for assignments
- [ ] Virtual classroom integration
- [ ] Offline content access

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Email: support@university-lms.edu
- Documentation: [Wiki](wiki-link)

## 🙏 Acknowledgments

- University stakeholders for requirements gathering
- Open source community for excellent tools and libraries
- Beta testers for valuable feedback

---

**Note:** This LMS is designed specifically for university environments with hierarchical role management. All features are built with scalability and security in mind.
#   s g u B A S E  
 