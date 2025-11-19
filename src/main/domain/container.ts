/**
 * Dependency Injection Container
 * Provides singleton instances of all services and repositories
 */

import { EntryRepository, EntryService } from './entries';
import { JournalRepository, JournalService } from './journals';
import { SettingsRepository, SettingsService } from './settings';

/**
 * Service Container
 * Manages the lifecycle and dependencies of domain services
 */
class ServiceContainer {
  private static instance: ServiceContainer;

  private _journalRepository?: JournalRepository;
  private _entryRepository?: EntryRepository;
  private _settingsRepository?: SettingsRepository;

  private _journalService?: JournalService;
  private _entryService?: EntryService;
  private _settingsService?: SettingsService;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Reset the container (useful for testing)
   */
  static reset(): void {
    ServiceContainer.instance = new ServiceContainer();
  }

  /**
   * Get JournalRepository instance
   */
  get journalRepository(): JournalRepository {
    if (!this._journalRepository) {
      this._journalRepository = new JournalRepository();
    }
    return this._journalRepository;
  }

  /**
   * Get EntryRepository instance
   */
  get entryRepository(): EntryRepository {
    if (!this._entryRepository) {
      this._entryRepository = new EntryRepository();
    }
    return this._entryRepository;
  }

  /**
   * Get SettingsRepository instance
   */
  get settingsRepository(): SettingsRepository {
    if (!this._settingsRepository) {
      this._settingsRepository = new SettingsRepository();
    }
    return this._settingsRepository;
  }

  /**
   * Get JournalService instance
   */
  get journalService(): JournalService {
    if (!this._journalService) {
      this._journalService = new JournalService(this.journalRepository);
    }
    return this._journalService;
  }

  /**
   * Get EntryService instance
   */
  get entryService(): EntryService {
    if (!this._entryService) {
      this._entryService = new EntryService(this.entryRepository, this.journalRepository);
    }
    return this._entryService;
  }

  /**
   * Get SettingsService instance
   */
  get settingsService(): SettingsService {
    if (!this._settingsService) {
      this._settingsService = new SettingsService(this.settingsRepository);
    }
    return this._settingsService;
  }
}

/**
 * Get the service container instance
 */
export function getContainer(): ServiceContainer {
  return ServiceContainer.getInstance();
}

/**
 * Reset the container (useful for testing)
 */
export function resetContainer(): void {
  ServiceContainer.reset();
}

/**
 * Convenience exports for direct service access
 */
export function getJournalService(): JournalService {
  return getContainer().journalService;
}

export function getEntryService(): EntryService {
  return getContainer().entryService;
}

export function getSettingsService(): SettingsService {
  return getContainer().settingsService;
}
