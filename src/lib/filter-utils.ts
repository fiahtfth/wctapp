export function safeParseFilters(filters: Record<string, any>): Record<string, any> {
  const safeFilters: Record<string, any> = {};

  // Validate and sanitize page number
  if (filters.page && typeof filters.page === 'number' && filters.page > 0) {
    safeFilters.page = filters.page;
  } else {
    safeFilters.page = 1;
  }

  // Validate and sanitize page size
  if (filters.pageSize && typeof filters.pageSize === 'number' && filters.pageSize > 0) {
    safeFilters.pageSize = filters.pageSize;
  } else {
    safeFilters.pageSize = 10;
  }

  // Validate and sanitize search filter
  if (filters.search && typeof filters.search === 'string') {
    safeFilters.search = filters.search.trim();
  } else {
    safeFilters.search = '';
  }

  // Validate and sanitize subject filter
  if (filters.subject) {
    if (Array.isArray(filters.subject)) {
      safeFilters.subject = filters.subject.filter(s => typeof s === 'string');
    } else if (typeof filters.subject === 'string') {
      safeFilters.subject = [filters.subject];
    }
  } else {
    safeFilters.subject = [];
  }

  // Validate and sanitize topic filter
  if (filters.topic) {
    if (Array.isArray(filters.topic)) {
      safeFilters.topic = filters.topic.filter(t => typeof t === 'string');
    } else if (typeof filters.topic === 'string') {
      safeFilters.topic = [filters.topic];
    }
  } else {
    safeFilters.topic = [];
  }

  // Validate and sanitize question type filter
  if (filters.questionType) {
    if (Array.isArray(filters.questionType)) {
      safeFilters.questionType = filters.questionType.filter(qt => typeof qt === 'string');
    } else if (typeof filters.questionType === 'string') {
      safeFilters.questionType = [filters.questionType];
    }
  } else {
    safeFilters.questionType = [];
  }

  // Validate and sanitize difficulty level filter
  if (filters.difficultyLevel) {
    if (Array.isArray(filters.difficultyLevel)) {
      safeFilters.difficultyLevel = filters.difficultyLevel.filter(dl => typeof dl === 'string');
    } else if (typeof filters.difficultyLevel === 'string') {
      safeFilters.difficultyLevel = [filters.difficultyLevel];
    }
  } else {
    safeFilters.difficultyLevel = [];
  }

  return safeFilters;
}
