// Filter mappings based on actual database content
export const FILTER_MAPPINGS: {
  subjects: string[];
  modulesBySubject: Record<string, string[]>;
  topicsByModule: Record<string, string[]>;
  subTopicsByTopic: Record<string, string[]>;
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
  topicsByModule: {
    'Module_1': ['Economic Growth', 'Development Economics', 'Fiscal Policy'],
    'Module_2': ['Monetary Policy', 'Banking', 'Financial Markets'],
    'Module_3': ['International Trade', 'Balance of Payments', 'Exchange Rates'],
    'Ancient History and Culture_1': ['Indus Valley Civilization', 'Vedic Period', 'Buddhism and Jainism'],
    'Medieval History': ['Delhi Sultanate', 'Mughal Empire', 'Vijayanagara Empire'],
    'Indian Geography_1': ['Physical Features', 'Rivers', 'Climate'],
    'Physical Geography_1': ['Geomorphology', 'Climatology', 'Oceanography']
  },
  subTopicsByTopic: {
    'Economic Growth': ['GDP Measurement', 'Growth Models', 'Sustainable Development'],
    'Development Economics': ['Poverty', 'Inequality', 'Human Development Index'],
    'Fiscal Policy': ['Taxation', 'Government Expenditure', 'Fiscal Deficit'],
    'Indus Valley Civilization': ['Urban Planning', 'Trade and Commerce', 'Art and Craft'],
    'Delhi Sultanate': ['Slave Dynasty', 'Khilji Dynasty', 'Tughlaq Dynasty'],
    'Physical Features': ['Himalayas', 'Indo-Gangetic Plain', 'Peninsular Plateau'],
    'Geomorphology': ['Landforms', 'Weathering and Erosion', 'Rock Types']
  },
  questionTypes: ['Objective', 'Subjective', 'Multiple Choice', 'Short Answer', 'Long Answer', 'Case Study']
};
