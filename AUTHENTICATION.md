# Local Authentication System

This application now uses a local authentication system instead of Authorizer. The system includes user management, role-based access control, and an admin portal.

## Features

- **Local User Authentication**: JWT-based authentication with bcrypt password hashing
- **Role-Based Access Control**: Granular permissions for different features
- **Admin Portal**: Complete user and role management interface
- **User Registration**: Self-registration with pending approval workflow
- **Secure Password Storage**: Bcrypt hashing with salt rounds

## Setup Instructions

### 1. Database Migration

Run the database migration to create the new user and role tables:

```bash
npm run prisma:migrate
```

### 2. Seed Admin User

Create the initial admin user and roles:

```bash
npm run prisma:seed-admin
```

This creates:
- Admin user: `admin@example.com` / `admin123`
- All necessary roles for the application

**⚠️ Important**: Change the admin password in production!

### 3. Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# JWT Secret (change this in production!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=5000

# Optional: CORS settings
CORS_ORIGIN="http://localhost:5173"
```

### 4. Install Dependencies

Install the new dependencies:

```bash
npm install
```

## User Roles

The system includes the following roles:

- **admin**: Full administrative access
- **att-view**: Can view attendance occurrences
- **att-edit**: Can create and edit attendance occurrences
- **ca-view**: Can view corrective actions
- **ca-edit**: Can create and edit corrective actions
- **user-edit**: Can edit user information
- **report-edit**: Can generate and view reports
- **pending**: Pending approval (new registrations)

## Admin Portal

Access the admin portal at `/admin` (requires admin privileges) to:

- View all users
- Create new users
- Manage user roles
- Activate/deactivate users
- Grant admin privileges
- Create new roles
- Delete users

## API Endpoints

### Authentication
- `POST /zapi/auth/register` - Register new user
- `POST /zapi/auth/login` - Login user
- `GET /zapi/auth/me` - Get current user info
- `POST /zapi/auth/logout` - Logout user

### Admin (requires admin privileges)
- `GET /zapi/admin/users` - Get all users
- `GET /zapi/admin/roles` - Get all roles
- `POST /zapi/admin/users` - Create new user
- `POST /zapi/admin/roles` - Create new role
- `PATCH /zapi/admin/users/:id` - Update user
- `PATCH /zapi/admin/users/:id/roles` - Update user roles
- `DELETE /zapi/admin/users/:id` - Delete user

## Security Features

- **JWT Tokens**: 24-hour expiration
- **Password Hashing**: Bcrypt with 12 salt rounds
- **Role-Based Access**: Granular permissions
- **Admin Protection**: Admin-only routes
- **Token Validation**: Middleware on all protected routes

## Migration from Authorizer

The application has been migrated from Authorizer to local authentication:

1. **Removed**: Authorizer dependencies and configuration
2. **Added**: Local JWT authentication with bcrypt
3. **Updated**: All components to use new auth context
4. **Enhanced**: Added admin portal for user management

## Development

To start the development server:

```bash
npm run dev
```

This will start both the Vite dev server and the Express API server.

## Production Deployment

1. Set a strong `JWT_SECRET` in production
2. Change the default admin password
3. Use HTTPS in production
4. Set appropriate CORS origins
5. Configure database connection for production 