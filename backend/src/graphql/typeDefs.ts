import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar DateTime

  enum Role {
    STUDENT
    TEACHER
    CC
    HOD
    ADMIN
    SUPERADMIN
  }

  enum UserStatus {
    ACTIVE
    INACTIVE
  }

  type User {
    id: ID!
    uid: String!
    name: String!
    email: String!
    roles: [Role!]!
    is_active: UserStatus!
    default_dashboard: Role!
    profile_image: String
    phone: String
    created_at: DateTime!
    updated_at: DateTime!
  }

  type Department {
    id: ID!
    dept_name: String!
    dean_id: String
    created_by: String!
    created_at: DateTime!
    updated_at: DateTime!
    dean: User
    creator: User!
    courses: [Course!]!
  }

  type Course {
    id: ID!
    course_name: String!
    course_code: String!
    description: String
    dept_id: String!
    created_by: String!
    created_at: DateTime!
    updated_at: DateTime!
    department: Department!
    creator: User!
    sections: [Section!]!
  }

  type Section {
    id: ID!
    section_name: String!
    course_id: String!
    created_at: DateTime!
    updated_at: DateTime!
    course: Course!
    enrollments: [Enrollment!]!
    videos: [Video!]!
  }

  type Enrollment {
    id: ID!
    user_id: String!
    section_id: String!
    role: Role!
    enrolled_at: DateTime!
    user: User!
    section: Section!
  }

  type Video {
    id: ID!
    title: String!
    description: String
    video_url: String!
    thumbnail: String
    section_id: String!
    uploaded_by: String!
    deadline: DateTime
    duration: Int
    created_at: DateTime!
    updated_at: DateTime!
    section: Section!
    uploader: User!
    quizzes: [Quiz!]!
  }

  type Quiz {
    id: ID!
    video_id: String!
    title: String!
    questions: String! # JSON string
    created_at: DateTime!
    updated_at: DateTime!
    video: Video!
  }

  type Analytics {
    course_id: String!
    total_students: Int!
    total_videos: Int!
    average_completion: Float!
    total_quiz_attempts: Int!
    average_quiz_score: Float!
  }

  type Query {
    # User queries
    me: User
    users(role: Role): [User!]!
    user(id: ID!): User

    # Department queries
    departments: [Department!]!
    department(id: ID!): Department

    # Course queries
    courses(dept_id: String): [Course!]!
    course(id: ID!): Course
    myCourses: [Course!]!

    # Section queries
    sections(course_id: String!): [Section!]!
    section(id: ID!): Section

    # Analytics queries
    courseAnalytics(course_id: String!): Analytics
    studentProgress(user_id: String!, course_id: String!): String # JSON
    dashboardStats: String # JSON
  }

  type Mutation {
    # User mutations
    createUser(input: CreateUserInput!): User!
    updateUserRoles(user_id: String!, roles: [Role!]!): User!
    toggleUserStatus(user_id: String!): User!

    # Department mutations
    createDepartment(input: CreateDepartmentInput!): Department!
    updateDepartment(id: ID!, input: UpdateDepartmentInput!): Department!
    deleteDepartment(id: ID!): Boolean!

    # Course mutations
    createCourse(input: CreateCourseInput!): Course!
    updateCourse(id: ID!, input: UpdateCourseInput!): Course!
    deleteCourse(id: ID!): Boolean!

    # Section mutations
    createSection(input: CreateSectionInput!): Section!
    enrollStudents(section_id: String!, user_ids: [String!]!): [Enrollment!]!
  }

  input CreateUserInput {
    uid: String!
    name: String!
    email: String!
    password: String!
    roles: [Role!]!
    phone: String
  }

  input CreateDepartmentInput {
    dept_name: String!
    dean_id: String
  }

  input UpdateDepartmentInput {
    dept_name: String
    dean_id: String
  }

  input CreateCourseInput {
    course_name: String!
    course_code: String!
    description: String
    dept_id: String!
  }

  input UpdateCourseInput {
    course_name: String
    description: String
  }

  input CreateSectionInput {
    section_name: String!
    course_id: String!
  }
`;
