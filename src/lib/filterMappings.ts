export const FILTER_MAPPINGS = {
  subjects: [
    " Geography",
    "Ecology and Environment",
    "Economics",
    "History",
    "Polity and Governance",
    "Science and Technology",
  ],

  modulesBySubject: {
    " Geography": [
      " Indian Geography_1",
      " Indian Geography_2",
      " Indian Geography_3",
      "Physical Geography_1",
      "Physical Geography_2",
      "World Geography",
    ],
    "Ecology and Environment": ["Module_1", "Module_2", "Module_3"],
    Economics: ["Module_1 ", "Module_2 ", "Module_4", "Module_7"],
    History: [
      "Ancient History and Culture_1",
      "Ancient History and Culture_2",
      "Medieval History",
      "Modern History_1",
      "Modern History_2",
    ],
    "Polity and Governance": ["Module_4", "Module_5", "Module_6"],
    "Science and Technology": ["Module_5"],
  },

  topicsByModule: {
    // This would be a very long object, so I'll show a few examples
    " Indian Geography_1": ["Geomorphology", "Oceanography"],
    Module_1: [
      "Biodiversity",
      "Ecology and Environment--Basic Concepts",
      "Introduction to the Constitution",
    ],
    Module_2: ["Fundamental Rights", "Space", "Standard Model of Physics"],
  },

  questionTypes: [
    "Multiple Choice",
    "True/False",
    "Fill in the Blanks",
    "Short Answer",
    "Long Answer",
  ],
};
