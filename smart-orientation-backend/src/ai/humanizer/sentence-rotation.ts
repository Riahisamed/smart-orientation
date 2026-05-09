/**
 * Sentence pools for natural variation
 */
export const PHRASE_POOLS = {

  intros: [
    "من كلامك يظهر أن...",
    "في حالتك...",
    "واضح تميل أكثر لـ...",
    "حسب اللي قلتو...",
    "أقرب حاجة ليك...",
    "الاختيار هذا ينجم يناسبك...",
    "لو كنت بلاصتك...",
    "بصراحة...",
    "مع السكور متاعك...",
    "الاختيار هذا منطقي أكثر...",
    "الحل الأنسب حالياً...",
    "من الناحية العملية...",
  ],

  transitions: [
    "تبقى option باهية",
    "تنجم تخمم فيها زادة",
    "مازال اختيار قوي",
    "تنجم تكون Plan B محترمة",
    "تبقى possibility معقولة",
    "ليس سيئ على الإطلاق",
    "فيه فرص حلوة فيه",
    "نشوف فيه مستقبل باهي",
    "تبقى من الخيارات الجيدة",
  ],

  positive: [
    "فرصتك باهية",
    "تنجم تطمح فيها بثقة",
    "هي خيار ممتاز",
    "تتناسبك تماماً",
    "الاحتمالات قوية",
    "فيها طلب كتير",
  ],

  warning: [
    "يلزم يكون عندك plan B",
    "لازم تكون عالدرجة تزيد شوية",
    "ممكن تكون فيها منافسة",
    "ما تنساش تحضر جيداً",
  ],

  followupStarters: [
    "تحب",
    "تميل أكثر",
    "الاختيار اللي يعجبك",
    "يشوف نفسك أكثر في",
    "تخدم",
    "تفضل",
  ],

  conclusions: [
    "فالخيار في النهاية موجود بين يديك",
    "كلو يعتمد على اللي تحب أكثر",
    "أي واحد فيهم خيار صحيح",
    "أهم حاجة تحب اللي تعملو",
    "اختر اللي تريح قلبك",
  ]

}

/**
 * Rotation system that remembers last used phrases
 */
export class PhraseRotation {
  private lastUsed: Record<string, number> = {};

  /**
   * Get random phrase from pool that was not used recently
   */
  getRandom(pool: string[], key: string): string {
    const lastIndex = this.lastUsed[key] ?? -1;

    // Filter out last used phrase
    const available = pool.filter((_, i) => i !== lastIndex);

    // Pick random from available
    const selectedIndex = Math.floor(Math.random() * available.length);
    const actualIndex = pool.indexOf(available[selectedIndex]);

    // Remember for next time
    this.lastUsed[key] = actualIndex;

    return available[selectedIndex];
  }

  /**
   * Get intro phrase
   */
  getIntro(): string {
    return this.getRandom(PHRASE_POOLS.intros, 'intros');
  }

  /**
   * Get transition phrase
   */
  getTransition(): string {
    return this.getRandom(PHRASE_POOLS.transitions, 'transitions');
  }

  /**
   * Get positive confirmation phrase
   */
  getPositive(): string {
    return this.getRandom(PHRASE_POOLS.positive, 'positive');
  }

  /**
   * Get warning phrase
   */
  getWarning(): string {
    return this.getRandom(PHRASE_POOLS.warning, 'warning');
  }

  /**
   * Get follow up starter
   */
  getFollowupStarter(): string {
    return this.getRandom(PHRASE_POOLS.followupStarters, 'followupStarters');
  }

  /**
   * Get conclusion phrase
   */
  getConclusion(): string {
    return this.getRandom(PHRASE_POOLS.conclusions, 'conclusions');
  }

  /**
   * Reset rotation memory
   */
  reset(): void {
    this.lastUsed = {};
  }
}