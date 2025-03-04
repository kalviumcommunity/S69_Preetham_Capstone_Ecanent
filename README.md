# Ecanent - The Model Connecting Platform

### Idea:-

The Primary idea to build a university communications portal where:
Students can receive official notifications from the university (like exam schedules, holiday announcements, event reminders, etc).
There’s a messaging system so students can communicate with faculty in a separate interface (not cluttering class groups).
Class groups and subject subgroups exist for teachers to share important notices, study materials, and updates.
A “Treat Me To Coffee” button (or similar) for small donations, integrating a payment system (like UPI).
OAuth using Google, Apple  and Microsoft ( if allowed by Apple and Microsoft).
Overall, it’s a full-stack application aimed at improving communication and organization for university students and faculty.

If there is enough time after implementation of these features, I would optionally add:-


 - Timetables are visible to students, with real-time updates for any last-minute schedule changes.
 - Google Calendar integration, so schedules sync automatically.
 - Chatting feature for general purpose users.

### Features:-
- User Authentication – Clients and professionals can register, log in, and manage profiles.
- Dashboard for seeing their messages and other things.
- Can join groups.
- Send Messages personally.
- Can upload Images, documents, etc.




### Summary of the 30-Day timeline
#### Week 1 (Days 1–7): Research, Planning & Basic Setup
- List all essential features (user auth, messaging, timetables, notifications, admin dashboard, etc.).
- Identify user roles (Admin, Faculty, Student) and note any - unique permissions each requires.
- Create a GitHub repository to store and version your code and also install required files for Frontend and Backend.
- Low-Fidelity Wireframes .
- High-Fidelity Designs.
- Side by Side code by Frontend for Signup, Login, Profile, etc.

---

#### Week 2 (Days 8–14): Authentication, Database
- User Model
- Use bcrypt for password hashing.
- JWT Setup.
- OAuth Setup (Google, Microsoft, Apple)
- User authentication.
- Reset Password.
- OTP.
- Testing.
- Additional Schemas For Chat.

---

#### Week 3 (Days 15–21): Messaging, Notifications, Admin Dashboard
- Socket.io Setup
- Message Schema
- Basic Routes between two users.
- Implement a chat window using React. Show messages in a scrollable view.

---

#### Week 4 (Days 22–25): Function Management
- Connect the front-end to Socket.io.
- Notifications (Push & Email)
- Admin Dashboard & Faculty functions
- Payment Integration (“Treat Me To Coffee”)

---

#### Week 5 (Days 26–30): Final Polish, Deployment, and Review
- Load & Performance Testing
- Security Review
- Documentation
- Deployment 
- User Feedback 
- Final Review


