import { Injectable, Logger } from '@nestjs/common';
import { ConversationMemory, MemoryService, ExtractedIntent } from './memory.service';

/**
 * 💾 PERSISTENT SESSION MEMORY SERVICE
 * 
 * Stores user conversation state across sessions, page refreshes and navigation
 * Makes AI remember user preferences permanently during interaction
 */

export type SessionData = {
  sessionId: string;
  userId?: string;
  createdAt: number;
  lastActivity: number;
  memory: ConversationMemory;
  
  // Additional session state
  lastDetectedField: string | null;
  lastQuestionAsked: string | null;
  lastRecommendations: string[];
  isActive: boolean;
};

@Injectable()
export class SessionMemoryService {
  private readonly logger = new Logger(SessionMemoryService.name);
  private readonly sessions: Map<string, SessionData> = new Map();

  // Session expires after 2 hours of inactivity
  private readonly SESSION_TIMEOUT = 2 * 60 * 60 * 1000;

  constructor(private readonly memoryService: MemoryService) {}

  /**
   * 📥 GET OR CREATE SESSION
   * Load existing session or initialize new one
   */
  getSession(sessionId: string, userId?: string): SessionData {
    // Clean expired sessions first
    this.cleanExpiredSessions();

    let session = this.sessions.get(sessionId);

    if (!session) {
      session = this.createNewSession(sessionId, userId);
      this.logger.log(`[SESSION] Created new session: ${sessionId}`);
    } else {
      session.lastActivity = Date.now();
      this.logger.debug(`[SESSION] Loaded existing session: ${sessionId}`);
    }

    return session;
  }

  /**
   * ✨ CREATE NEW EMPTY SESSION
   */
  private createNewSession(sessionId: string, userId?: string): SessionData {
    const session: SessionData = {
      sessionId,
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      memory: this.memoryService.initializeMemory(),
      lastDetectedField: null,
      lastQuestionAsked: null,
      lastRecommendations: [],
      isActive: true
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * 🔄 UPDATE SESSION MEMORY FROM USER MESSAGE
   * Automatically extracts and updates memory
   */
  updateSessionFromMessage(sessionId: string, message: string): SessionData {
    const session = this.getSession(sessionId);
    
    // Extract intent from message
    const extracted = this.memoryService.extractFromMessage(message, session.memory);
    
    // Update memory
    session.memory = this.memoryService.updateMemory(session.memory, extracted, message);
    
    // Update session metadata
    session.lastActivity = Date.now();
    
    // Track last detected field
    if (extracted.interest) {
      session.lastDetectedField = extracted.interest;
    }

    // Check for reset command
    if (this.isResetCommand(message)) {
      return this.resetSession(sessionId);
    }

    this.logger.log(`[SESSION] Updated memory for session ${sessionId}, interest: ${session.memory.interest}, track: ${session.memory.preferredTrack}`);

    return session;
  }

  /**
   * ✏️ MANUALLY UPDATE SESSION MEMORY
   */
  updateSession(sessionId: string, updates: Partial<ConversationMemory>): SessionData {
    const session = this.getSession(sessionId);
    session.memory = { ...session.memory, ...updates };
    session.lastActivity = Date.now();
    return session;
  }

  /**
   * ❌ TRACK ASKED QUESTION
   */
  trackAskedQuestion(sessionId: string, question: string): void {
    const session = this.getSession(sessionId);
    session.memory = this.memoryService.trackQuestion(session.memory, question);
    session.lastQuestionAsked = question;
  }

  /**
   * 📝 STORE LAST RECOMMENDATIONS
   */
  storeRecommendations(sessionId: string, programIds: string[]): void {
    const session = this.getSession(sessionId);
    session.lastRecommendations = programIds;
  }

  /**
   * 🔍 CHECK IF QUESTION WAS ALREADY ASKED
   */
  wasQuestionAsked(sessionId: string, question: string): boolean {
    const session = this.getSession(sessionId);
    return this.memoryService.wasQuestionAsked(session.memory, question);
  }

  /**
   * 🔄 RESET SESSION
   */
  resetSession(sessionId: string): SessionData {
    this.logger.log(`[SESSION] Resetting session: ${sessionId}`);
    
    const session = this.createNewSession(sessionId);
    this.sessions.set(sessionId, session);
    
    return session;
  }

  /**
   * 🗑️ DELETE SESSION
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.logger.log(`[SESSION] Deleted session: ${sessionId}`);
  }

  /**
   * 🧹 CLEAN EXPIRED SESSIONS
   */
  private cleanExpiredSessions(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.debug(`[SESSION] Cleaned up ${expiredCount} expired sessions`);
    }
  }

  /**
   * 🔄 RESET COMMAND DETECTION
   */
  private isResetCommand(message: string): boolean {
    const normalized = message.toLowerCase().trim();
    const resetPatterns = [
      /\b(restart|reset|recommencer|nouveau|commencer depuis le début)\b/i,
      /\b(ابدأ من جديد|اعادة|البداية|صفر|أبدا من أول)\b/i
    ];

    return resetPatterns.some(pattern => pattern.test(normalized));
  }

  /**
   * 📊 GET SESSION SUMMARY
   */
  getSessionSummary(sessionId: string): string {
    const session = this.getSession(sessionId);
    return this.memoryService.getMemorySummary(session.memory);
  }

  /**
   * 📈 GET ACTIVE SESSION COUNT
   */
  getActiveSessionCount(): number {
    this.cleanExpiredSessions();
    return this.sessions.size;
  }

  /**
   * 💾 SERIALIZE SESSION FOR STORAGE
   */
  serializeSession(sessionId: string): string {
    const session = this.getSession(sessionId);
    return JSON.stringify(session);
  }

  /**
   * 📂 DESERIALIZE SESSION
   */
  deserializeSession(data: string): SessionData | null {
    try {
      return JSON.parse(data) as SessionData;
    } catch (e) {
      this.logger.error('Failed to deserialize session', e);
      return null;
    }
  }
}