// src/events/event-notes.controller.ts
import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { EventNotesService } from './event-notes.service';
import { UsersService } from '../users/users.service';

import { CreateEventNoteDto } from './dto/create-event-note.dto';
import { EventNoteResponseDto } from './dto/event-note-response.dto';

@Controller('events/:eventId/notes')
export class EventNotesController {
  constructor(
    private readonly notesService: EventNotesService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async listNotes(
    @Req() req: Request,
    @Param('eventId') eventId: string,
  ): Promise<EventNoteResponseDto[]> {
    const headerUserIdRaw = req.headers['x-user-id'];
    const headerUserId = Array.isArray(headerUserIdRaw)
      ? headerUserIdRaw[0]
      : (headerUserIdRaw ?? null);

    const user = await this.usersService.resolveCurrentUser(
      headerUserId as string | null,
    );

    return this.notesService.listForEvent(eventId, user.id);
  }

  @Post()
  async createNote(
    @Req() req: Request,
    @Param('eventId') eventId: string,
    @Body() dto: CreateEventNoteDto,
  ): Promise<EventNoteResponseDto> {
    const headerUserIdRaw = req.headers['x-user-id'];
    const headerUserId = Array.isArray(headerUserIdRaw)
      ? headerUserIdRaw[0]
      : (headerUserIdRaw ?? null);

    const user = await this.usersService.resolveCurrentUser(
      headerUserId as string | null,
    );

    return this.notesService.create(eventId, dto, user.id);
  }
}
