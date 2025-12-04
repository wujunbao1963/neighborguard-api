# Refactored NestJS Application

## Overview
This is a refactored version of the Circle Events application with improved code quality, structure, and best practices.

## Key Improvements

### 1. Architecture & Code Organization
- ✅ Modular architecture with clear separation of concerns
- ✅ Domain-driven design principles
- ✅ Repository pattern for data access
- ✅ Service layer for business logic
- ✅ Proper DTO validation and transformation

### 2. Code Quality
- ✅ TypeScript strict mode enabled
- ✅ Removed all `any` types
- ✅ English comments and documentation
- ✅ Consistent naming conventions
- ✅ JSDoc documentation
- ✅ Removed magic numbers and strings

### 3. Error Handling
- ✅ Global exception filter
- ✅ Consistent error responses
- ✅ Proper error codes
- ✅ Detailed error logging

### 4. Security
- ✅ Helmet for security headers
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ Rate limiting ready
- ✅ SQL injection protection via TypeORM

### 5. Performance
- ✅ Optimized database queries
- ✅ Proper indexing
- ✅ Connection pooling
- ✅ Query result pagination
- ✅ Reduced N+1 queries

### 6. Developer Experience
- ✅ Swagger/OpenAPI documentation
- ✅ Consistent API responses
- ✅ Logging interceptor
- ✅ Request/response transformation
- ✅ Environment configuration validation

## Project Structure

```
src/
├── common/                 # Shared utilities and components
│   ├── constants/          # Application constants and enums
│   ├── decorators/         # Custom decorators
│   ├── dto/                # Common DTOs
│   ├── filters/            # Exception filters
│   ├── guards/             # Auth guards
│   ├── interceptors/       # Request/response interceptors
│   ├── interfaces/         # TypeScript interfaces
│   ├── pipes/              # Validation pipes
│   ├── repositories/       # Base repository pattern
│   └── utils/              # Utility functions
│
├── config/                 # Configuration modules
│   ├── app/                # App configuration
│   ├── database/           # Database configuration
│   └── swagger/            # API documentation config
│
├── database/               # Database related files
│   ├── migrations/         # TypeORM migrations
│   └── seeds/              # Database seeders
│
├── modules/                # Feature modules
│   ├── auth/               # Authentication
│   ├── circles/            # Circle management
│   ├── events/             # Event management
│   ├── health/             # Health checks
│   ├── home/               # Dashboard/Home
│   ├── media/              # Media uploads
│   ├── notifications/      # Notifications
│   └── users/              # User management
│
├── app.module.ts           # Root module
└── main.ts                 # Application bootstrap
```

## Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your environment variables
nano .env
```

### Environment Variables

```env
# Application
NODE_ENV=development
APP_PORT=3000
APP_HOST=0.0.0.0
FRONTEND_ORIGIN=http://localhost:3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=circle_events
DB_SSL=false
DB_SYNCHRONIZE=false
DB_LOGGING=true
DB_POOL_MAX=10
DB_POOL_MIN=2
```

### Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod

# Run migrations
npm run migration:run

# Revert migrations
npm run migration:revert
```

### API Documentation

When running in development mode, Swagger documentation is available at:
```
http://localhost:3000/api/docs
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Key Features

### 1. Event Management
- Create, read, update events
- Event status management
- Event comments and notes
- Video attachments

### 2. Circle Management
- Create and manage circles
- Invite members
- Role-based permissions (Owner, Resident, Neighbor, Observer)
- Circle-specific events

### 3. Notifications
- Real-time notifications
- Event-based notifications
- User preferences

### 4. Media Management
- Video upload and processing
- File storage
- Media attachments

## API Endpoints

### Events
- `POST /api/events` - Create event
- `GET /api/events/circle/:id` - List events by circle
- `GET /api/events/:id` - Get event details
- `PATCH /api/events/:id/status` - Update event status
- `POST /api/events/:id/comments` - Add comment
- `POST /api/events/:id/notes` - Add note

### Circles
- `GET /api/circles` - List user's circles
- `POST /api/circles` - Create circle
- `GET /api/circles/:id` - Get circle details
- `POST /api/circles/:id/members` - Add member
- `DELETE /api/circles/:id/members/:userId` - Remove member

### Users
- `GET /api/users/me` - Get current user

### Notifications
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## Best Practices Implemented

### 1. Code Organization
- Feature-based module structure
- Single Responsibility Principle
- Dependency Injection
- Interface segregation

### 2. Error Handling
- Centralized exception handling
- Meaningful error messages
- Proper HTTP status codes
- Error logging and monitoring

### 3. Validation
- Class-validator decorators
- DTO validation
- Custom validation pipes
- Sanitization

### 4. Security
- Parameterized queries
- Input sanitization
- XSS protection
- CSRF protection
- Rate limiting (configurable)

### 5. Performance
- Database indexing
- Query optimization
- Connection pooling
- Caching strategy (ready to implement)
- Pagination

### 6. Testing
- Unit test structure
- Integration test setup
- E2E test examples
- Mock factories

## Migration from Original Code

### Major Changes

1. **Removed Chinese Comments**: All comments are now in English
2. **Type Safety**: Eliminated all `any` types
3. **Constants**: Extracted magic strings and numbers to constants
4. **Error Handling**: Implemented global exception filter
5. **Logging**: Added comprehensive logging
6. **Documentation**: Added JSDoc and Swagger docs
7. **Structure**: Reorganized into logical modules

### Breaking Changes

None - API endpoints remain the same, only internal implementation improved.

## Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Update documentation
4. Follow TypeScript strict mode
5. Use meaningful commit messages

## Support

For issues and questions, please open an issue in the repository.

## License

[Your License Here]
