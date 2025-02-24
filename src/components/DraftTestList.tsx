import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Collapse,
  Typography,
  Box,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

interface DraftTest {
  id: string;
  name: string;
  date: string;
  questions: any[];
}

const DraftTestList: React.FC = () => {
  const [draftTests, setDraftTests] = useState<DraftTest[]>([]);
  const [open, setOpen] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch draft tests from local storage and the database
    const fetchDraftTests = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get test IDs from local storage
        const testIdsString = localStorage.getItem('testIds');
        const testIds = testIdsString ? JSON.parse(testIdsString) : [];

        if (testIds.length === 0) {
          setDraftTests([]);
          setLoading(false);
          return;
        }

        // Fetch draft tests from the database for each test ID
        const draftTestsData = await Promise.all(
          testIds.map(async (testId: string) => {
            try {
              const response = await fetch(`/api/cart?testId=${testId}`);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              const data = await response.json();
              // Transform the data to match the DraftTest interface
              const testName = localStorage.getItem(`testName-${testId}`) || `Test ${testId}`;
              return {
                id: testId,
                name: testName,
                date: new Date().toLocaleDateString(),
                questions: data.questions || [],
              };
            } catch (error) {
              console.error(`Error fetching draft test ${testId}:`, error);
              return null;
            }
          })
        );

        // Filter out any null results (failed fetches)
        const validDraftTests = draftTestsData.filter(Boolean);
        setDraftTests(validDraftTests as DraftTest[]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching draft tests:', error);
        setError('Failed to load draft tests.');
        setLoading(false);
      }
    };

    fetchDraftTests();
  }, []);

  const handleClick = (id: string) => {
    setOpen({
      ...open,
      [id]: !open[id],
    });
  };

  if (loading) {
    return <Typography>Loading draft tests...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (draftTests.length === 0) {
    return <Typography>No draft tests found.</Typography>;
  }

  return (
    <List>
      {draftTests.map((test) => (
        <React.Fragment key={test.id}>
          <ListItem button onClick={() => handleClick(test.id)}>
            <ListItemText
              primary={test.name}
              secondary={`${test.date} - ${test.questions.length} Questions`}
            />
            {open[test.id] ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={open[test.id]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {test.questions.map((question) => (
                <ListItem key={question.id} sx={{ pl: 4 }}>
                  <ListItemText primary={question.Question} />
                </ListItem>
              ))}
              {test.questions.length === 0 && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2">No questions in this test.</Typography>
                </Box>
              )}
            </List>
          </Collapse>
        </React.Fragment>
      ))}
    </List>
  );
};

export default DraftTestList;
