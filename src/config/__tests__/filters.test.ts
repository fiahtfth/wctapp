import { 
  FilterSchemas, 
  validateFilters, 
  sanitizeFilters, 
  FilterConfig 
} from '../filters';

describe('Filter Validation', () => {
  describe('Subject Validation', () => {
    it('should validate valid subject filters', () => {
      const validSubjects = ['Economics', 'Polity and Governance'];
      const result = FilterSchemas.subject.safeParse(validSubjects);
      expect(result.success).toBe(true);
    });

    it('should reject empty subject filters', () => {
      const invalidSubjects = [''];
      const result = FilterSchemas.subject.safeParse(invalidSubjects);
      expect(result.success).toBe(false);
    });

    it('should reject too many subjects', () => {
      const tooManySubjects = Array(51).fill('Subject');
      const result = FilterSchemas.subject.safeParse(tooManySubjects);
      expect(result.success).toBe(false);
    });
  });

  describe('Module Validation', () => {
    it('should validate valid module filters', () => {
      const validModules = ['Microeconomics', 'Macroeconomics'];
      const result = FilterSchemas.module.safeParse(validModules);
      expect(result.success).toBe(true);
    });

    it('should reject empty module filters', () => {
      const invalidModules = [''];
      const result = FilterSchemas.module.safeParse(invalidModules);
      expect(result.success).toBe(false);
    });
  });

  describe('Question Type Validation', () => {
    it('should validate valid question types', () => {
      const validTypes = ['Objective', 'Subjective'];
      const result = FilterSchemas.questionType.safeParse(validTypes);
      expect(result.success).toBe(true);
    });

    it('should reject invalid question types', () => {
      const invalidTypes = ['Multiple Choice'];
      const result = FilterSchemas.questionType.safeParse(invalidTypes);
      expect(result.success).toBe(false);
    });

    it('should reject too many question types', () => {
      const tooManyTypes = ['Objective', 'Subjective', 'Other'];
      const result = FilterSchemas.questionType.safeParse(tooManyTypes);
      expect(result.success).toBe(false);
    });
  });

  describe('Search Validation', () => {
    it('should validate valid search queries', () => {
      const validSearch = 'Economic principles';
      const result = FilterSchemas.search.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it('should reject overly long search queries', () => {
      const longSearch = 'a'.repeat(201);
      const result = FilterSchemas.search.safeParse(longSearch);
      expect(result.success).toBe(false);
    });
  });

  describe('Comprehensive Filter Validation', () => {
    it('should validate a complete set of filters', () => {
      const completeFilters = {
        subject: ['Economics'],
        module: ['Microeconomics'],
        topic: ['Supply and Demand'],
        questionType: ['Objective'],
        search: 'Market equilibrium'
      };

      const result = validateFilters(completeFilters);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should catch multiple filter validation errors', () => {
      const invalidFilters = {
        subject: Array(51).fill('Invalid Subject'),
        module: [''],
        questionType: ['Invalid Type'],
        search: 'a'.repeat(201)
      };

      const result = validateFilters(invalidFilters);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });
  });

  describe('Filter Sanitization', () => {
    it('should sanitize filters by removing empty values', () => {
      const dirtyFilters = {
        subject: ['', 'Economics', null],
        module: ['Microeconomics', ''],
        search: '  Economic Principles  '
      };

      const sanitized = sanitizeFilters(dirtyFilters);
      expect(sanitized.subject).toEqual(['Economics']);
      expect(sanitized.module).toEqual(['Microeconomics']);
      expect(sanitized.search).toBe('Economic Principles');
    });

    it('should limit number of filter values', () => {
      const manyFilters = {
        subject: Array(100).fill('Subject'),
        module: ['Module1', 'Module2']
      };

      const sanitized = sanitizeFilters(manyFilters);
      expect(sanitized.subject).toHaveLength(FilterConfig.maxFilterValues);
      expect(sanitized.module).toHaveLength(2);
    });
  });
});
