import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

/**
 * Base repository providing common CRUD operations
 */
export abstract class BaseRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * Find entity by ID or throw NotFoundException
   */
  async findByIdOrFail(id: string, relations?: string[]): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
      relations,
    });

    if (!entity) {
      throw new NotFoundException(
        `${this.repository.metadata.tableName} with id ${id} not found`,
      );
    }

    return entity;
  }

  /**
   * Find all entities with optional filtering
   */
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  /**
   * Create new entity
   */
  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as any);
    return this.repository.save(entity);
  }

  /**
   * Update entity
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    await this.repository.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  /**
   * Delete entity (soft delete if supported)
   */
  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `${this.repository.metadata.tableName} with id ${id} not found`,
      );
    }
  }

  /**
   * Check if entity exists
   */
  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({ where });
    return count > 0;
  }

  /**
   * Count entities
   */
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where });
  }
}
