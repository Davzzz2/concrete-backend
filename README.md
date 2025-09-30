# Concrete Pour Tracker - Backend

Express.js API with MongoDB for the Concrete Pour Tracker application.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your MongoDB URI and JWT secret.

3. **Run the server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

The API will run on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Pours (requires authentication)
- `GET /api/pours` - Get all pours for authenticated user
- `POST /api/pours` - Create new pour
- `DELETE /api/pours/:id` - Delete pour

### Health Check
- `GET /api/health` - Server health check

## Environment Variables

- `PORT` - Server port (default: 3001)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)
