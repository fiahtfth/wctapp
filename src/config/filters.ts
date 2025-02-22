import { z } from 'zod';

// Comprehensive filter validation schemas
export const FilterSchemas = {
    subject: z.array(z.string().min(1, "Subject must not be empty"))
        .max(50, "Maximum 50 subjects allowed")
        .optional(),
    
    module: z.array(z.string().min(1, "Module must not be empty"))
        .max(50, "Maximum 50 modules allowed")
        .optional(),
    
    topic: z.array(z.string().min(1, "Topic must not be empty"))
        .max(50, "Maximum 50 topics allowed")
        .optional(),
    
    subTopic: z.array(z.string().min(1, "Subtopic must not be empty"))
        .max(50, "Maximum 50 subtopics allowed")
        .optional(),
    
    questionType: z.enum(['Objective', 'Subjective'], {
        errorMap: () => ({ message: "Invalid question type" })
    }).array()
        .max(2, "Maximum 2 question types allowed")
        .optional(),
    
    search: z.string()
        .max(200, "Search query too long")
        .optional()
};

// Comprehensive filter configuration
export const FilterConfig = {
    maxFilterValues: 50,
    maxSearchLength: 200,
    supportedFilterKeys: [
        'subject', 
        'module', 
        'topic', 
        'subTopic', 
        'questionType', 
        'search'
    ] as const,
    
    // Predefined filter options
    predefinedOptions: {
        subjects: [
            'Economics', 
            'Polity and Governance', 
            'World Geography', 
            'Science and Technology'
        ],
        questionTypes: ['Objective', 'Subjective'],
        
        // Dynamic options can be fetched from database
        modules: async () => {
            const { getModules } = await import('@/lib/database/hierarchicalData');
            return getModules();
        },
        
        topics: async (subject: string, module: string) => {
            const { getTopics } = await import('@/lib/database/hierarchicalData');
            return getTopics(subject, module);
        }
    }
};

// Comprehensive filter validator
export function validateFilters(filters: Record<string, unknown>) {
    const errors: Record<string, string[]> = {};
    
    // Validate each supported filter key
    FilterConfig.supportedFilterKeys.forEach(key => {
        const schema = FilterSchemas[key];
        const value = filters[key];
        
        try {
            // Skip validation if value is undefined
            if (value === undefined) return;
            
            // Validate using Zod schema
            schema.parse(value);
        } catch (error) {
            if (error instanceof z.ZodError) {
                errors[key] = error.errors.map(e => e.message);
            }
        }
    });
    
    // Return validation result
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

// Logging utility for filter processing
export function logFilterProcessing(
    context: string, 
    input: Record<string, unknown>, 
    result: ReturnType<typeof validateFilters>
) {
    console.group(`Filter Processing: ${context}`);
    console.log('Input Filters:', input);
    
    if (result.isValid) {
        console.log('✅ Filters are valid');
    } else {
        console.warn('❌ Filter Validation Errors:');
        Object.entries(result.errors).forEach(([key, messages]) => {
            console.warn(`  ${key}:`, messages);
        });
    }
    
    console.groupEnd();
}

// Filter sanitization utility
export function sanitizeFilters(
    filters: Record<string, unknown>
): Record<string, string[] | string> {
    const sanitized: Record<string, string[] | string> = {};
    
    Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined) return;
        
        switch (key) {
            case 'subject':
            case 'module':
            case 'topic':
            case 'subTopic':
            case 'questionType':
                // Ensure array of non-empty strings
                const arrayValue = Array.isArray(value) 
                    ? value.filter(v => typeof v === 'string' && v.trim() !== '')
                    : [value].filter(v => typeof v === 'string' && v.trim() !== '');
                
                if (arrayValue.length > 0) {
                    sanitized[key] = arrayValue.slice(0, FilterConfig.maxFilterValues);
                }
                break;
            
            case 'search':
                // Trim and truncate search
                if (typeof value === 'string') {
                    const trimmedSearch = value.trim().slice(0, FilterConfig.maxSearchLength);
                    if (trimmedSearch) sanitized[key] = trimmedSearch;
                }
                break;
        }
    });
    
    return sanitized;
}

// Export for use in various components
export type FilterKey = keyof typeof FilterSchemas;
export type FilterValidationResult = ReturnType<typeof validateFilters>;
