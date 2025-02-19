export interface ExportedTest {
  id: string;
  name: string;
  batch: string;
  createdAt: Date;
  questionCount: number;
}

export async function getExportedTests(): Promise<ExportedTest[]> {
  // Mock data for exported tests
  const mockTests: ExportedTest[] = [
    {
      id: "1",
      name: "Math Midterm",
      batch: "Spring 2024",
      createdAt: new Date("2024-02-15"),
      questionCount: 25,
    },
    {
      id: "2",
      name: "Science Quiz",
      batch: "Spring 2024",
      createdAt: new Date("2024-02-10"),
      questionCount: 20,
    },
    {
      id: "3",
      name: "English Comprehension",
      batch: "Spring 2024",
      createdAt: new Date("2024-02-05"),
      questionCount: 15,
    },
  ];

  try {
    // Simulate async operation
    return mockTests;
  } catch (error) {
    console.error("Error fetching exported tests:", error);
    return [];
  }
}
