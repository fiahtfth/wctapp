// Filter mappings based on actual database content
export const FILTER_MAPPINGS: {
  subjects: string[];
  modulesBySubject: Record<string, string[]>;
  topicsByModule: Record<string, string[]>;
  questionTypes: string[];
} = {
  subjects: ['Economics', 'History', 'Geography', 'Polity and Governance', 'Science and Technology', 'Ecology and Environment'],
  modulesBySubject: {
    'Economics': ['Module_1', 'Module_2', 'Module_3', 'Module_4', 'Module_5', 'Module_6', 'Module_7'],
    'History': [
      'Ancient History and Culture_1',
      'Ancient History and Culture_2',
      'Medieval History',
      'Modern History_1',
      'Modern History_2'
    ],
    'Geography': [
      'Indian Geography_1',
      'Indian Geography_2',
      'Indian Geography_3',
      'Physical Geography_1',
      'Physical Geography_2',
      'World Geography'
    ],
    'Polity and Governance': ['Module_1', 'Module_2', 'Module_3', 'Module_4', 'Module_5', 'Module_6'],
    'Science and Technology': ['Module_1', 'Module_2', 'Module_3', 'Module_4', 'Module_5'],
    'Ecology and Environment': ['Module_1', 'Module_2', 'Module_3', 'Module_4']
  },
  topicsByModule: {},
  questionTypes: ['Objective', 'Subjective']
};
