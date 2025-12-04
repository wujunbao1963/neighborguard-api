# Migration Guide: From Original to Refactored Code

## Overview
This guide helps you migrate from the original codebase to the refactored version.

## Step-by-Step Migration

### 1. Backup Your Current Code
```bash
# Create a backup of your current codebase
cp -r your-project your-project-backup
```

### 2. Install Dependencies
```bash
# The refactored code requires some additional packages
npm install --save @nestjs/swagger helmet
npm install --save-dev @types/helmet
```

### 3. Update Import Paths

#### Before:
```typescript
import { Event, EventStatus } from './event.entity';
```

#### After:
```typescript
import { Event } from './entities/event.entity';
import { EventStatus } from '../common/constants/event.enums';
```

### 4. Update Type Definitions

#### Removing `any` Types

**Before:**
```typescript
where: { circleId, userId } as any
```

**After:**
```typescript
where: { circleId, userId }
```

### 5. Update Services

#### Key Changes in Services:

1. **Method Names** - More descriptive
   ```typescript
   // Before
   async getMember(circleId: string, userId: string)
   
   // After  
   async getCircleMember(circleId: string, userId: string)
   ```

2. **Error Handling** - More specific
   ```typescript
   // Before
   if (!member) throw new ForbiddenException('...');
   
   // After
   if (!member) {
     this.logger.warn(`User ${userId} not found in circle ${circleId}`);
     throw new ForbiddenException('User is not a member of this circle');
   }
   ```

3. **Comments** - English only
   ```typescript
   // Before
   // 确认当前用户是圈内成员，否则抛 Forbidden
   
   // After
   /**
    * Assert that user is a member of the circle
    * @throws ForbiddenException if user is not a member
    */
   ```

### 6. Update Controllers

#### Add Swagger Decorators:

```typescript
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('events')
@Controller('events')
export class EventsController {
  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() dto: CreateEventDto) {
    // ...
  }
}
```

### 7. Update DTOs

#### Add Swagger Documentation:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ description: 'Circle ID where event occurred' })
  @IsString()
  @IsNotEmpty()
  circleId: string;

  @ApiPropertyOptional({ description: 'Event title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
```

### 8. Update Entities

#### No changes needed for basic entities, but you can add indexes:

```typescript
@Entity('events')
@Index(['circleId', 'status'])
@Index(['createdAt'])
export class Event {
  // ...
}
```

### 9. Configuration Changes

#### Update `app.module.ts`:

Replace TypeORM configuration with:
```typescript
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    DatabaseModule,
    // ... other modules
  ],
})
export class AppModule {}
```

#### Update `main.ts`:

Add global filters and interceptors:
```typescript
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // ... rest of bootstrap
}
```

### 10. Environment Variables

#### Add new environment variables to `.env`:

```env
# Logging
LOG_LEVEL=debug

# Database Pool
DB_POOL_MAX=10
DB_POOL_MIN=2

# Security
JWT_SECRET=your-secret-key

# File Upload
MAX_FILE_SIZE=52428800
```

### 11. Testing the Migration

#### Run tests to ensure everything works:

```bash
# Lint the code
npm run lint

# Run tests
npm run test

# Build the project
npm run build

# Start in development mode
npm run start:dev
```

## Common Issues and Solutions

### Issue 1: Import Errors

**Problem:** `Cannot find module '@common/constants'`

**Solution:** Update `tsconfig.json` paths:
```json
{
  "compilerOptions": {
    "paths": {
      "@common/*": ["src/common/*"]
    }
  }
}
```

### Issue 2: Type Errors

**Problem:** `Type 'any' is not assignable to type 'FindOptionsWhere<Entity>'`

**Solution:** Remove `as any` casts and use proper types:
```typescript
// Before
where: { id } as any

// After
where: { id }
```

### Issue 3: Missing Dependencies

**Problem:** `Cannot find module '@nestjs/swagger'`

**Solution:**
```bash
npm install @nestjs/swagger class-transformer class-validator
```

## Rollback Plan

If you need to rollback:

```bash
# Stop the application
npm run stop

# Restore backup
rm -rf src/
cp -r ../your-project-backup/src ./

# Reinstall original dependencies
npm install

# Restart
npm run start:dev
```

## Gradual Migration Strategy

You can migrate gradually:

1. **Phase 1:** Update configuration and utilities
   - Add new common modules
   - Update environment configuration
   - Add filters and interceptors

2. **Phase 2:** Migrate one module at a time
   - Start with the smallest module (e.g., Health)
   - Then move to larger modules (Events, Circles)

3. **Phase 3:** Update tests
   - Add unit tests for new code
   - Update integration tests

4. **Phase 4:** Documentation
   - Update API documentation
   - Add inline code documentation

## Benefits After Migration

1. **Type Safety:** No more `any` types
2. **Better Errors:** Consistent error handling and messages
3. **Documentation:** Auto-generated API docs with Swagger
4. **Logging:** Comprehensive request/response logging
5. **Performance:** Optimized queries and better pagination
6. **Maintainability:** Cleaner code structure
7. **Testing:** Easier to test with proper separation of concerns

## Support

If you encounter issues during migration:
1. Check the console logs for detailed error messages
2. Review the refactored code examples
3. Refer to NestJS official documentation
4. Open an issue if you find a bug

## Checklist

- [ ] Backup original code
- [ ] Install new dependencies
- [ ] Update configuration files
- [ ] Migrate common utilities
- [ ] Update one module at a time
- [ ] Run tests after each module
- [ ] Update environment variables
- [ ] Test API endpoints
- [ ] Check Swagger documentation
- [ ] Deploy to staging
- [ ] Monitor logs
- [ ] Deploy to production

## Timeline

Estimated migration time: **1-2 days** for a full migration

- Configuration: 2-3 hours
- Common modules: 2-3 hours
- Feature modules: 4-6 hours
- Testing: 2-3 hours
- Documentation: 1-2 hours

## Conclusion

The refactored codebase provides better structure, type safety, and maintainability while keeping the same API contracts. The migration can be done gradually to minimize risk.
