const PC_STORAGE_PREFIX = 'pc_';
const PC_SCHEMA_VERSION = 1;
const PC_SYNC_META_KEY = 'pc_sync_meta';
const PC_SHARED_STATE_FIELD = '__shared_state_v1';
const PC_SHARED_STATE_KEYS = [
  'pc_navle_practice_session_v1',
  'pc_navle_practice_emergency_session_v1',
  'pc_navle_free_usage_v1',
  'pc_free_questions_today',
  'pc_free_questions_date',
  'pc_last_learning_url_v1',
  'pc_last_learning_seen_at_v1'
];

function pcSafeParse(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function pcSafeGetRaw(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function pcSafeSetRaw(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function pcUnwrapSyncField(value) {
  if (value && typeof value === 'object' && value.data && typeof value.data === 'object') {
    return {
      data: value.data,
      updatedAt: value.updatedAt || value.updated_at || ''
    };
  }

  if (value && typeof value === 'object') {
    return {
      data: value,
      updatedAt: value.updatedAt || value.updated_at || ''
    };
  }

  return {
    data: {},
    updatedAt: ''
  };
}

const PCStorage = {
  // Core methods
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(PC_STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Storage get error:', e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PC_STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  merge(key, partialValue) {
    const existing = this.get(key, {});
    const merged = { ...existing, ...partialValue };
    return this.set(key, merged);
  },

  remove(key) {
    localStorage.removeItem(PC_STORAGE_PREFIX + key);
  },

  // Date handling (Toronto timezone without external libs)
  getTodayKey() {
    const now = new Date();
    // Create date string in Toronto timezone
    const torontoOffset = -300; // EST offset in minutes (simplified)
    const localOffset = now.getTimezoneOffset();
    const diff = (torontoOffset - localOffset) * 60 * 1000;
    const torontoTime = new Date(now.getTime() + diff);

    return torontoTime.toISOString().split('T')[0]; // YYYY-MM-DD
  },

  // Schema management
  checkSchema() {
    const currentVersion = this.get('schema_version', 0);
    if (currentVersion < PC_SCHEMA_VERSION) {
      this.migrate(currentVersion, PC_SCHEMA_VERSION);
      this.set('schema_version', PC_SCHEMA_VERSION);
    }
  },

  migrate(fromVersion, toVersion) {
    console.log(`Migrating storage from v${fromVersion} to v${toVersion}`);
    // Migration logic here if needed in future
  },

  // Specific data getters/setters
  getPrefs() {
    return this.get('prefs', { mode: 'pro', theme: 'light' });
  },

  setPrefs(prefs) {
    return this.set('prefs', prefs);
  },

  getCaseCompletion(caseId) {
    const completions = this.get('case_completion', {});
    return completions[caseId] || null;
  },

  setCaseCompletion(caseId, data) {
    const completions = this.get('case_completion', {});
    completions[caseId] = {
      completedAt: new Date().toISOString(),
      ...data
    };
    return this.set('case_completion', completions);
  },

  getStudyProgress() {
    return this.get('study_progress', {
      currentStreak: 0,
      lastActiveDate: null,
      topics: {}
    });
  },

  updateStudyProgress(topicId, status) {
    const progress = this.getStudyProgress();
    progress.topics[topicId] = {
      status,
      updatedAt: new Date().toISOString()
    };
    return this.set('study_progress', progress);
  },

  getDaily(dateKey) {
    return this.get('daily_' + dateKey, {
      dateKey,
      tasks: [],
      completedCount: 0,
      lastActivityAt: null
    });
  },

  setDaily(dateKey, data) {
    return this.set('daily_' + dateKey, data);
  },

  getStreak() {
    return this.get('streak', { current: 0, lastActiveDateKey: null });
  },

  updateStreak(dateKey) {
    const streak = this.getStreak();
    const lastDate = streak.lastActiveDateKey;

    if (!lastDate) {
      // First activity ever
      streak.current = 1;
    } else if (lastDate === dateKey) {
      // Already active today, no change
      return streak;
    } else {
      // Check if consecutive
      const last = new Date(lastDate);
      const today = new Date(dateKey);
      const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak.current += 1; // Consecutive day
      } else if (diffDays > 1) {
        streak.current = 1; // Streak broken, start new
      }
    }

    streak.lastActiveDateKey = dateKey;
    this.set('streak', streak);
    return streak;
  },

  recordGameLaunch(gameId) {
    const launches = this.get('game_launches', {});
    launches[gameId] = {
      lastLaunchedAt: new Date().toISOString(),
      launchCount: (launches[gameId]?.launchCount || 0) + 1
    };
    return this.set('game_launches', launches);
  },

  wasGamePlayedToday(gameId) {
    const launches = this.get('game_launches', {});
    const launch = launches[gameId];
    if (!launch) return false;

    const todayKey = this.getTodayKey();
    const launchDate = launch.lastLaunchedAt.split('T')[0];
    return launchDate === todayKey;
  },

  markTaskComplete(taskId) {
    if (!taskId) return false;

    const todayKey = this.getTodayKey();
    const daily = this.getDaily(todayKey);

    if (!daily.tasks || !Array.isArray(daily.tasks)) {
      return false;
    }

    const task = daily.tasks.find(t => t.taskId === taskId);
    if (!task || task.completed) {
      return false;
    }

    task.completed = true;
    daily.completedCount = (daily.completedCount || 0) + 1;
    daily.lastActivityAt = new Date().toISOString();

    this.setDaily(todayKey, daily);
    this.updateStreak(todayKey);
    return true;
  },

  // Export/Import
  exportAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PC_STORAGE_PREFIX)) {
        const shortKey = key.replace(PC_STORAGE_PREFIX, '');
        data[shortKey] = this.get(shortKey);
      }
    }
    return {
      schema_version: PC_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data
    };
  },

  importAll(exportData) {
    if (!exportData || !exportData.data) {
      throw new Error('Invalid export data');
    }

    // Merge rather than replace
    Object.keys(exportData.data).forEach(key => {
      const existing = this.get(key);
      const incoming = exportData.data[key];

      if (existing && typeof existing === 'object' && typeof incoming === 'object') {
        this.set(key, { ...existing, ...incoming });
      } else {
        this.set(key, incoming);
      }
    });

    return true;
  }
};

PCStorage.getSyncMeta = function getSyncMeta() {
  return pcSafeParse(pcSafeGetRaw(PC_SYNC_META_KEY), {});
};

PCStorage.setSyncMeta = function setSyncMeta(meta) {
  return pcSafeSetRaw(PC_SYNC_META_KEY, JSON.stringify(meta && typeof meta === 'object' ? meta : {}));
};

PCStorage.touchField = function touchField(fieldName) {
  const meta = this.getSyncMeta();
  const now = new Date().toISOString();
  const normalized = String(fieldName || '').trim();

  if (normalized === 'case_completion' || normalized === 'case_completions') {
    meta.case_completions = now;
  } else if (normalized === 'study_plan') {
    meta.study_plan = now;
  } else if (normalized === 'game_activity') {
    meta.game_activity = now;
  }

  meta.updated_at = now;
  this.setSyncMeta(meta);
  return now;
};

PCStorage.setLastSyncedAt = function setLastSyncedAt(isoValue) {
  const meta = this.getSyncMeta();
  const value = String(isoValue || new Date().toISOString());
  meta.last_synced_at = value;
  this.setSyncMeta(meta);
  return value;
};

PCStorage.getLastSyncedAt = function getLastSyncedAt() {
  const meta = this.getSyncMeta();
  return meta.last_synced_at || '';
};

PCStorage.countCaseCompletions = function countCaseCompletions() {
  const completions = this.get('case_completion', {});
  const ids = new Set();
  if (completions && typeof completions === 'object') {
    Object.keys(completions).forEach((id) => ids.add(String(id)));
  }

  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.indexOf('pc_case_') === 0 && key.indexOf('_date') === -1 && localStorage.getItem(key) === 'completed') {
        ids.add(String(key).replace(/^pc_case_/, ''));
      }
    }
  } catch (error) {
    // Ignore localStorage read failures.
  }

  return ids.size;
};

PCStorage.getCurrentStreak = function getCurrentStreak() {
  const streak = this.getStreak();
  return streak && Number.isFinite(Number(streak.current)) ? Number(streak.current) : 0;
};

PCStorage.markCaseCompleted = function markCaseCompleted(caseKey) {
  if (!caseKey) {
    return false;
  }

  const now = new Date().toISOString();
  const normalized = String(caseKey).replace(/^pc_case_/, '');
  const storageKey = normalized.indexOf('pc_case_') === 0 ? normalized : 'pc_case_' + normalized;
  const dateKey = storageKey + '_date';

  pcSafeSetRaw(storageKey, 'completed');
  pcSafeSetRaw(dateKey, now);
  this.setCaseCompletion(normalized, { completedAt: now, status: 'completed' });
  this.touchField('case_completions');
  return true;
};

PCStorage.collectSharedState = function collectSharedState() {
  const shared = {};

  for (let i = 0; i < PC_SHARED_STATE_KEYS.length; i += 1) {
    const key = PC_SHARED_STATE_KEYS[i];
    const value = pcSafeGetRaw(key);
    if (value !== null && value !== undefined && value !== '') {
      shared[key] = value;
    }
  }

  return shared;
};

PCStorage.restoreSharedState = function restoreSharedState(sharedState) {
  if (!sharedState || typeof sharedState !== 'object') {
    return 0;
  }

  let restored = 0;
  const keys = Object.keys(sharedState);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const value = sharedState[key];
    if (typeof value === 'string') {
      if (pcSafeSetRaw(key, value)) {
        restored += 1;
      }
    }
  }

  return restored;
};

PCStorage.buildLocalSyncPayload = function buildLocalSyncPayload() {
  const caseCompletions = {};
  const completionMap = this.get('case_completion', {});
  if (completionMap && typeof completionMap === 'object') {
    Object.keys(completionMap).forEach((id) => {
      caseCompletions['pc_case_' + id] = 'completed';
    });
  }

  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || key.indexOf('pc_case_') !== 0 || key.indexOf('_date') !== -1) {
        continue;
      }
      if (localStorage.getItem(key) === 'completed') {
        caseCompletions[key] = 'completed';
      }
    }
  } catch (error) {
    // Ignore localStorage read errors.
  }

  const studyPlanRaw = pcSafeGetRaw('pc_study_plan');
  const studyPlan = pcSafeParse(studyPlanRaw, {});
  if (studyPlan && typeof studyPlan === 'object') {
    studyPlan[PC_SHARED_STATE_FIELD] = this.collectSharedState();
  }

  const gameActivityRaw = pcSafeGetRaw('pc_game_activity');
  const gameActivity = pcSafeParse(gameActivityRaw, {});
  const meta = this.getSyncMeta();

  return {
    case_completions: {
      data: caseCompletions,
      updatedAt: meta.case_completions || ''
    },
    study_plan: {
      data: studyPlan && typeof studyPlan === 'object' ? studyPlan : {},
      updatedAt: meta.study_plan || ''
    },
    game_activity: {
      data: gameActivity && typeof gameActivity === 'object' ? gameActivity : {},
      updatedAt: meta.game_activity || ''
    },
    updated_at: meta.updated_at || ''
  };
};

PCStorage.applySyncData = function applySyncData(mergedPayload) {
  const meta = this.getSyncMeta();

  const caseField = pcUnwrapSyncField(mergedPayload && mergedPayload.case_completions);
  const caseData = caseField.data && typeof caseField.data === 'object' ? caseField.data : {};
  const normalizedCaseCompletion = this.get('case_completion', {});

  Object.keys(caseData).forEach((key) => {
    if (key.indexOf('pc_case_') !== 0) {
      return;
    }
    const value = caseData[key];
    if (value === true || value === 'completed') {
      const caseId = key.replace(/^pc_case_/, '');
      normalizedCaseCompletion[caseId] = normalizedCaseCompletion[caseId] || {
        completedAt: new Date().toISOString(),
        status: 'completed'
      };
      pcSafeSetRaw(key, 'completed');
      const dateKey = key + '_date';
      if (!pcSafeGetRaw(dateKey)) {
        pcSafeSetRaw(dateKey, normalizedCaseCompletion[caseId].completedAt || new Date().toISOString());
      }
    }
  });
  this.set('case_completion', normalizedCaseCompletion);

  const studyField = pcUnwrapSyncField(mergedPayload && mergedPayload.study_plan);
  const studyData = studyField.data && typeof studyField.data === 'object' ? studyField.data : {};
  const sharedState = studyData[PC_SHARED_STATE_FIELD];
  if (sharedState && typeof sharedState === 'object') {
    this.restoreSharedState(sharedState);
  }
  pcSafeSetRaw('pc_study_plan', JSON.stringify(studyData));

  const gameField = pcUnwrapSyncField(mergedPayload && mergedPayload.game_activity);
  const gameData = gameField.data && typeof gameField.data === 'object' ? gameField.data : {};
  pcSafeSetRaw('pc_game_activity', JSON.stringify(gameData));

  if (caseField.updatedAt) {
    meta.case_completions = caseField.updatedAt;
  }
  if (studyField.updatedAt) {
    meta.study_plan = studyField.updatedAt;
  }
  if (gameField.updatedAt) {
    meta.game_activity = gameField.updatedAt;
  }

  if (mergedPayload && mergedPayload.updated_at) {
    meta.updated_at = mergedPayload.updated_at;
  } else {
    meta.updated_at = new Date().toISOString();
  }

  this.setSyncMeta(meta);
  return true;
};

PCStorage.exportDataBundle = function exportDataBundle() {
  const payload = {
    schema_version: PC_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    keys: {}
  };

  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.indexOf(PC_STORAGE_PREFIX) === 0) {
        payload.keys[key] = localStorage.getItem(key);
      }
    }
  } catch (error) {
    // Keep export best-effort.
  }

  return payload;
};

PCStorage.importDataBundle = function importDataBundle(bundle) {
  if (!bundle || typeof bundle !== 'object') {
    return { success: false, imported: 0 };
  }

  const source = bundle.keys || bundle.data || bundle;
  if (!source || typeof source !== 'object') {
    return { success: false, imported: 0 };
  }

  let imported = 0;
  Object.keys(source).forEach((key) => {
    const rawValue = source[key];
    if (key.indexOf('pc_') === 0) {
      if (pcSafeSetRaw(key, String(rawValue))) {
        imported += 1;
      }
      return;
    }

    if (key && key.indexOf('schema_') !== 0 && key !== 'exportedAt') {
      const prefixed = 'pc_' + key;
      const serialized = typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue);
      if (pcSafeSetRaw(prefixed, serialized)) {
        imported += 1;
      }
    }
  });

  return { success: true, imported };
};

PCStorage.clearAllData = function clearAllData() {
  var removed = 0;
  var keys = [];

  try {
    for (var i = 0; i < localStorage.length; i += 1) {
      var key = localStorage.key(i);
      if (key && key.indexOf('pc_') === 0) {
        keys.push(key);
      }
    }

    for (var j = 0; j < keys.length; j += 1) {
      localStorage.removeItem(keys[j]);
      removed += 1;
    }
  } catch (error) {
    // Best effort clear.
  }

  return removed;
};

// Initialize on load
PCStorage.checkSchema();

// Make globally available
window.pcStorage = PCStorage;
window.PCStorage = PCStorage;
