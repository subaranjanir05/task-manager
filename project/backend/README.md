# TaskFlow Backend API

AI-Powered Time & Task Manager Backend built with Node.js, Express, MongoDB, and OpenAI integration.

## 🚀 Features

- **User Authentication** - JWT-based auth with secure password hashing
- **Task Management** - Full CRUD operations with advanced filtering
- **Project Organization** - Multi-project support with team collaboration
- **AI Integration** - OpenAI-powered prioritization and daily reviews
- **Time Tracking** - Pomodoro timer with session analytics
- **Calendar Integration** - Time blocking and scheduling
- **Analytics Dashboard** - Comprehensive productivity insights
- **Real-time Updates** - WebSocket support for live updates

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcryptjs
- **AI**: OpenAI GPT-4 API
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **Scheduling**: node-cron for background jobs

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- OpenAI API Key
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd taskflow-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   MONGODB_URI=mongodb://localhost:27017/taskflow
   JWT_SECRET=your-super-secret-jwt-key-here
   OPENAI_API_KEY=your-openai-api-key-here
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt-token>
```

### Task Endpoints

#### Get All Tasks
```http
GET /api/tasks?status=todo&priority=high&page=1&limit=20
Authorization: Bearer <jwt-token>
```

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Complete project proposal",
  "description": "Write and review the Q4 project proposal",
  "projectId": "64a7b8c9d1e2f3g4h5i6j7k8",
  "priority": "high",
  "dueDate": "2024-01-15T10:00:00Z",
  "estimatedTime": 120,
  "tags": ["proposal", "urgent"]
}
```

#### Update Task
```http
PUT /api/tasks/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "status": "completed",
  "timeSpent": 90
}
```

#### Start Timer
```http
POST /api/tasks/:id/timer/start
Authorization: Bearer <jwt-token>
```

#### Stop Timer
```http
POST /api/tasks/:id/timer/stop
Authorization: Bearer <jwt-token>
```

### Project Endpoints

#### Get All Projects
```http
GET /api/projects
Authorization: Bearer <jwt-token>
```

#### Create Project
```http
POST /api/projects
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Website Redesign",
  "description": "Complete redesign of company website",
  "color": "#3B82F6"
}
```

### AI Endpoints

#### Get AI Prioritization
```http
POST /api/ai/prioritize
Authorization: Bearer <jwt-token>
```

#### Generate Daily Review
```http
POST /api/ai/daily-review
Authorization: Bearer <jwt-token>
```

#### Get Task Suggestions
```http
POST /api/ai/suggest-tasks
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "projectId": "64a7b8c9d1e2f3g4h5i6j7k8",
  "context": "E-commerce website development"
}
```

### Analytics Endpoints

#### Get Analytics Dashboard
```http
GET /api/analytics?period=30
Authorization: Bearer <jwt-token>
```

#### Get Focus Session Analytics
```http
GET /api/analytics/focus-sessions?period=7
Authorization: Bearer <jwt-token>
```

### Calendar Endpoints

#### Get Calendar Events
```http
GET /api/calendar/events?start=2024-01-01&end=2024-01-31
Authorization: Bearer <jwt-token>
```

#### Create Time Block
```http
POST /api/calendar/time-blocks
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "taskId": "64a7b8c9d1e2f3g4h5i6j7k8",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "title": "Focus work on proposal"
}
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs with salt rounds
- **Rate Limiting** - Prevent API abuse
- **CORS Protection** - Configurable cross-origin requests
- **Helmet Security** - Security headers
- **Input Validation** - express-validator for all inputs
- **MongoDB Injection Protection** - Mongoose built-in protection

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  preferences: {
    theme: String,
    notifications: Boolean,
    pomodoroSettings: Object,
    timezone: String
  },
  subscription: {
    plan: String,
    expiresAt: Date
  },
  timestamps: true
}
```

### Task Model
```javascript
{
  title: String,
  description: String,
  userId: ObjectId,
  projectId: ObjectId,
  status: String,
  priority: String,
  tags: [String],
  dueDate: Date,
  timeSpent: Number,
  timerSessions: [Object],
  aiInsights: Object,
  timestamps: true
}
```

### Project Model
```javascript
{
  name: String,
  description: String,
  color: String,
  userId: ObjectId,
  teamMembers: [Object],
  settings: Object,
  status: String,
  timestamps: true
}
```

## 🤖 AI Integration

The backend integrates with OpenAI GPT-4 for:

- **Smart Prioritization** - Analyzes tasks and suggests optimal priorities
- **Daily Reviews** - Generates personalized productivity insights
- **Task Suggestions** - AI-powered task recommendations
- **Pattern Recognition** - Learns from user behavior

### AI Fallback System
If OpenAI API is unavailable, the system falls back to rule-based algorithms to ensure continuous functionality.

## 🔄 Background Jobs

Automated cron jobs handle:

- **Daily Cleanup** - Stop stuck timers, clean up data
- **Weekly Analytics** - Update AI insights and metrics
- **Monthly Archiving** - Archive old completed tasks

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskflow
JWT_SECRET=your-production-jwt-secret
OPENAI_API_KEY=your-openai-api-key
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Health Check
The API includes a health check endpoint:
```http
GET /health
```

## 📈 Monitoring & Logging

- **Morgan** - HTTP request logging
- **Error Handling** - Comprehensive error middleware
- **Performance Monitoring** - Built-in metrics
- **Health Checks** - System status monitoring

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.