import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PreviewIcon from "@mui/icons-material/Preview";
import type { Question } from "@/types/question";
import { useCartStore } from "@/store/cartStore";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import {
  getSubjects,
  getModules,
  getTopics,
} from "@/lib/database/hierarchicalData";

const formatQuestion = (questionText: string): React.ReactNode => {
  if (!questionText) return null;

  const lines = questionText
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const formattedParts: React.ReactNode[] = [];

  let introText = "";
  let statements: { text: string; index: number }[] = [];
  let questionPart = "";
  let options: { text: string; index: number }[] = [];
  let currentSection: "intro" | "statements" | "question" | "options" = "intro";

  lines.forEach((line, lineIndex) => {
    // Prioritize capturing context lines
    if (
      line.toLowerCase().includes("consider the following") ||
      line.toLowerCase().includes("with respect to") ||
      line.toLowerCase().includes("based on")
    ) {
      introText += line + " ";
      currentSection = "intro";
    }
    // Capture statements
    else if (line.match(/^\d+\./)) {
      statements.push({ text: line, index: lineIndex });
      currentSection = "statements";
    }
    // Capture question part
    else if (
      line.toLowerCase().includes("which of the statements") ||
      line.toLowerCase().includes("how many") ||
      line.toLowerCase().includes("select")
    ) {
      questionPart += line + " ";
      currentSection = "question";
    }
    // Capture options - ALWAYS ensure parentheses
    else if (
      line.match(/^[a-d]\)/) ||
      line.match(/^\([a-d]\)/) ||
      line.match(/^[a-d]\./)
    ) {
      // Normalize to (a), (b), (c), (d) format
      const normalizedLine = line.replace(/^([a-d])[).]/, "($1)");
      options.push({ text: normalizedLine, index: lineIndex });
      currentSection = "options";
    }
    // Fallback for other lines
    else {
      // Add line to the most recent section
      if (currentSection === "intro") introText += line + " ";
      else if (currentSection === "question") questionPart += line + " ";
    }
  });

  // Add intro text if present
  if (introText.trim()) {
    formattedParts.push(
      <Box key="intro" sx={{ mb: 0.5 }}>
        {introText.trim()}
      </Box>,
    );
  }

  // Add statements if any
  if (statements.length > 0) {
    formattedParts.push(
      <Box key="statements-container" sx={{ ml: 1 }}>
        {statements.map((stmt) => (
          <Box key={`statement-${stmt.index}`} sx={{ mb: 0.25 }}>
            {stmt.text}
          </Box>
        ))}
      </Box>,
    );
  }

  // Add question part if any
  if (questionPart) {
    formattedParts.push(
      <Box key={`question-final`} sx={{ my: 0.5 }}>
        {questionPart.trim()}
      </Box>,
    );
  }

  // Add options if any
  if (options.length > 0) {
    formattedParts.push(
      <Box key="options-container" sx={{ ml: 1 }}>
        {options.map((opt) => (
          <Box key={`option-${opt.index}`} sx={{ mb: 0.25 }}>
            {opt.text}
          </Box>
        ))}
      </Box>,
    );
  }

  return <>{formattedParts}</>;
};

interface QuestionCardProps {
  question: Question;
  onQuestionUpdate: (question: Question) => void;
  onEdit?: (question: Question) => void;
  initialInCart?: boolean;
  onRemove?: () => void;
  showCartButton?: boolean;
}

const QuestionCard = ({
  question,
  onQuestionUpdate,
  onEdit,
}: QuestionCardProps) => {
  const [mounted, setMounted] = useState(false);
  const { addQuestion, removeQuestion, isInCart } = useCartStore();
  const [inCart, setInCart] = useState(question.initialInCart ?? false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState<Question>({
    ...question,
    Explanation: question.Explanation || "",
    "Sub Topic": question["Sub Topic"] || "",
    "Micro Topic": question["Micro Topic"] || "",
    "Difficulty Level": question["Difficulty Level"] || "",
    "Nature of Question": question["Nature of Question"] || "",
    Objective: question.Objective || "",
  });
  const [editChanges, setEditChanges] = useState<{ [key: string]: any }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string>("");

  // State for cascading dropdowns
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    // Check if question is already in cart
    const checkInCart = isInCart(question.id);
    setInCart(checkInCart);
  }, []);

  // Cascading dropdown logic
  useEffect(() => {
    // Update available modules based on selected subject
    if (editedQuestion.Subject) {
      const modules = getModules(editedQuestion.Subject);
      setAvailableModules(modules);

      // Reset module and topic if they're not in the new list
      if (!modules.includes(editedQuestion["Module Name"])) {
        handleEditChange("Module Name", "");
        handleEditChange("Topic", "");
      }
    } else {
      // Reset modules and topics when no subject is selected
      setAvailableModules([]);
      setAvailableTopics([]);
    }
  }, [editedQuestion.Subject]);

  useEffect(() => {
    // Update available topics based on selected subject and module
    if (editedQuestion.Subject && editedQuestion["Module Name"]) {
      const topics = getTopics(
        editedQuestion.Subject,
        editedQuestion["Module Name"],
      );
      setAvailableTopics(topics);

      // Reset topic if it's not in the new list
      if (!topics.includes(editedQuestion.Topic)) {
        handleEditChange("Topic", "");
      }
    } else {
      // Reset topics when subject or module is not selected
      setAvailableTopics([]);
    }
  }, [editedQuestion.Subject, editedQuestion["Module Name"]]);

  // Cart toggle functionality
  const handleCartToggle = () => {
    try {
      if (question.id) {
        if (isInCart(question.id)) {
          // Remove from cart
          removeQuestion(question.id);
          setInCart(false);
        } else {
          // Add to cart
          addQuestion({
            ...question,
            id: question.id,
            Answer: question.Answer || "",
            Explanation: question.Explanation || "",
            Question_Type: question.Question_Type || "",
          });
          setInCart(true);
        }
      }
    } catch (error) {
      console.error("Error toggling cart:", error);
    }
  };

  const difficultyLevels = ["Easy", "Medium", "Hard"];
  const questionTypes = ["Objective", "Subjective"];

  const natureOfQuestions = ["Factual", "Conceptual", "Analytical"];

  const handleAddToTest = async () => {
    try {
      if (question.id) {
        // await onAddToTest(question.id);
      }
    } catch (error) {
      console.error("Error adding question to test:", error);
    }
  };

  const handleEditClick = () => {
    console.group("Edit Click Difficulty Level Debug");
    console.log("Original Question Object:", question);
    console.log("Original Difficulty Level:", question["Difficulty Level"]);
    console.log("Difficulty Level Type:", typeof question["Difficulty Level"]);

    // Normalize difficulty level
    const normalizedDifficultyLevel =
      question["Difficulty Level"]?.toLowerCase() === "difficult"
        ? "Hard"
        : question["Difficulty Level"]?.toLowerCase() === "easy"
          ? "Easy"
          : "Medium";

    console.log("Normalized Difficulty Level:", normalizedDifficultyLevel);

    // Ensure the normalized level is one of the valid options
    const validDifficultyLevels = ["Easy", "Medium", "Hard"];
    const finalDifficultyLevel = validDifficultyLevels.includes(
      normalizedDifficultyLevel,
    )
      ? normalizedDifficultyLevel
      : "Medium";

    console.log("Final Difficulty Level:", finalDifficultyLevel);
    console.groupEnd();

    setEditModalOpen(true);
    setEditedQuestion({
      ...question,
      "Difficulty Level": finalDifficultyLevel,
    });
  };

  const handleEditChange = (field: string, value: any) => {
    console.group("Edit Change Difficulty Level Debug");
    console.log(`Editing field: ${field}, Original Value:`, value);
    console.log("Current Edited Question:", editedQuestion);

    // Convert null or undefined to empty string
    if (value === null || value === undefined) {
      value = "";
    }

    // Ensure value is a string
    const stringValue = String(value).trim();

    // Capitalize Difficulty Level
    if (field === "Difficulty Level") {
      const validDifficultyLevels = ["Easy", "Medium", "Hard"];

      console.log("Input Difficulty Level:", stringValue);
      console.log("Input Difficulty Level Type:", typeof stringValue);

      // Normalize input to match UI expectations
      const normalizedDifficulty =
        stringValue.toLowerCase() === "difficult"
          ? "Hard"
          : stringValue.toLowerCase() === "easy"
            ? "Easy"
            : stringValue.toLowerCase() === "medium"
              ? "Medium"
              : "Medium";

      console.log("Normalized Difficulty:", normalizedDifficulty);

      // Validate and correct difficulty level
      value = validDifficultyLevels.includes(normalizedDifficulty)
        ? normalizedDifficulty
        : "Medium";

      console.log("Final Difficulty Level:", value);
    }

    // Question Type processing remains the same
    if (field === "Question_Type") {
      const validQuestionTypes = [
        "Objective",
        "Subjective",
        "MCQ",
        "True/False",
        "Fill in the Blank",
      ];

      const capitalizedType = stringValue
        ? stringValue
            .split(" ")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ")
        : "Objective";

      // Validate and correct question type
      if (!validQuestionTypes.includes(capitalizedType)) {
        console.warn(
          `Invalid question type: ${value}. Defaulting to 'Objective'`,
        );
        value = "Objective";
      } else {
        value = capitalizedType;
      }
    }

    // Nature of Question processing remains the same
    if (field === "Nature of Question") {
      const validNatureOfQuestions = ["Factual", "Conceptual", "Analytical"];

      const capitalizedNature = stringValue
        ? stringValue.charAt(0).toUpperCase() +
          stringValue.slice(1).toLowerCase()
        : "Factual";

      // Validate and correct nature of question
      if (!validNatureOfQuestions.includes(capitalizedNature)) {
        console.warn(
          `Invalid nature of question: ${value}. Defaulting to 'Factual'`,
        );
        value = "Factual";
      } else {
        value = capitalizedNature;
      }
    }

    // Update the local state with the potentially modified value
    setEditedQuestion((prevQuestion) => {
      const updatedQuestion = {
        ...prevQuestion,
        [field]: value || "", // Ensure empty string for falsy values
      };

      console.log("Updated Edited Question:", updatedQuestion);
      console.groupEnd();

      return updatedQuestion;
    });
  };

  const handleSaveEdit = async () => {
    try {
      console.group("Question Edit Process");
      console.log("Original Edited Question:", editedQuestion);

      // Enhanced ID conversion with type checking
      const questionId =
        typeof editedQuestion.id === "string"
          ? parseInt(editedQuestion.id, 10)
          : Number(editedQuestion.id);

      // Validate ID
      if (isNaN(questionId) || questionId <= 0) {
        console.error("Invalid question ID:", editedQuestion.id);
        setEditError("Invalid question ID. Please refresh and try again.");
        console.groupEnd();
        return;
      }

      // Normalize Difficulty Level
      const normalizedDifficultyLevel =
        editedQuestion["Difficulty Level"]?.toLowerCase() === "difficult"
          ? "Hard"
          : editedQuestion["Difficulty Level"]?.toLowerCase() === "easy"
            ? "Easy"
            : "Medium";

      // Prepare payload with intentional capitalization variations for testing
      const editPayload = {
        ...editedQuestion,
        id: questionId, // Use validated ID
        "Difficulty Level": normalizedDifficultyLevel,
        Question_Type: editedQuestion["Question_Type"] || "Objective",
        "Nature of Question": editedQuestion["Nature of Question"] || "Factual",
      };

      console.log("Prepared Edit Payload:", editPayload);

      const response = await fetch("/api/questions/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Edit failed:", errorText);
        setEditError(errorText);
        console.groupEnd();
        return;
      }

      const updatedQuestion = await response.json();
      console.log("Successfully edited question:", updatedQuestion);

      // Verify the processed values
      console.log(
        "Processed Difficulty Level:",
        updatedQuestion["Difficulty Level"],
      );
      console.log("Processed Question Type:", updatedQuestion["Question_Type"]);
      console.log(
        "Processed Nature of Question:",
        updatedQuestion["Nature of Question"],
      );

      // Update local state with the processed question
      if (onQuestionUpdate) {
        onQuestionUpdate(updatedQuestion);
      }

      // Reset edit mode
      setIsEditing(false);
      setEditError("");

      console.groupEnd();
    } catch (error) {
      console.error("Critical error during question edit:", error);
      setEditError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
      console.groupEnd();
    }
  };

  const getDifficultyColor = (level?: string) => {
    const normalizedLevel = level?.toLowerCase();
    return normalizedLevel === "easy"
      ? "success"
      : normalizedLevel === "medium"
        ? "warning"
        : normalizedLevel === "hard"
          ? "error"
          : "default";
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <CardContent
        sx={{
          flexGrow: 1,
          pb: "0 !important",
          pt: 1,
          px: 1.5,
          "&:last-child": { pb: "0 !important" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: "error.main",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {question.Subject}
          </Typography>
          <Chip
            label={question["Module Name"]}
            size="small"
            variant="outlined"
            sx={{
              fontSize: "0.75rem",
              height: 22,
            }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mb: 1,
            alignItems: "center",
          }}
        >
          {question.Topic && (
            <Chip
              label={`Topic: ${question.Topic}`}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ fontSize: "0.675rem", height: 20 }}
            />
          )}
          {question["Sub Topic"] && (
            <Chip
              label={`Sub Topic: ${question["Sub Topic"]}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: "0.675rem", height: 20 }}
            />
          )}
          {question["Micro Topic"] && (
            <Chip
              label={`Micro Topic: ${question["Micro Topic"]}`}
              size="small"
              color="info"
              variant="outlined"
              sx={{ fontSize: "0.675rem", height: 20 }}
            />
          )}
        </Box>
        <Box
          sx={{
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: "0.75rem",
            lineHeight: 1.3,
            letterSpacing: "0.01em",
            mb: 0.5,
          }}
        >
          {formatQuestion(question.Question)}
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            flexWrap: "wrap",
            alignItems: "center",
            mt: 0.25,
          }}
        >
          <Chip
            label={question["Difficulty Level"] || "Unknown"}
            size="small"
            sx={{ fontSize: "0.625rem", height: 20 }}
            color={getDifficultyColor(question["Difficulty Level"])}
          />
          <Chip
            label={question["Nature of Question"] || "Unknown"}
            size="small"
            sx={{ fontSize: "0.625rem", height: 20 }}
          />
        </Box>
      </CardContent>
      <CardActions
        sx={{
          position: "absolute",
          bottom: 8,
          right: 8,
          display: "flex",
          gap: 1,
          justifyContent: "flex-end",
        }}
      >
        {onEdit && (
          <IconButton
            size="small"
            onClick={() => setEditModalOpen(true)}
            title="Edit Question"
          >
            <EditIcon />
          </IconButton>
        )}
        {question.showCartButton !== false && (
          <IconButton
            size="small"
            onClick={handleCartToggle}
            title={inCart ? "Remove from Cart" : "Add to Cart"}
            color={inCart ? "primary" : "default"}
            sx={{
              transition: "transform 0.2s",
              "&:active": {
                transform: "scale(0.95)",
              },
              "&:hover": {
                transform: "scale(1.1)",
              },
            }}
          >
            <AddShoppingCartIcon />
          </IconButton>
        )}
      </CardActions>

      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Question Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {/* Question and Answer */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Question"
                variant="outlined"
                value={String(editedQuestion.Question)}
                onChange={(e) => handleEditChange("Question", e.target.value)}
                sx={{
                  marginBottom: 2,
                  "& .MuiOutlinedInput-root": editChanges.Question
                    ? {
                        "& fieldset": {
                          borderColor: "primary.main",
                          borderWidth: 2,
                        },
                      }
                    : {},
                }}
                InputProps={{
                  endAdornment: editChanges.Question ? (
                    <InputAdornment position="end">
                      <Chip label="Changed" color="primary" size="small" />
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Answer"
                variant="outlined"
                value={String(editedQuestion.Answer)}
                onChange={(e) => handleEditChange("Answer", e.target.value)}
                sx={{
                  marginBottom: 2,
                  "& .MuiOutlinedInput-root": editChanges.Answer
                    ? {
                        "& fieldset": {
                          borderColor: "primary.main",
                          borderWidth: 2,
                        },
                      }
                    : {},
                }}
                InputProps={{
                  endAdornment: editChanges.Answer ? (
                    <InputAdornment position="end">
                      <Chip label="Changed" color="primary" size="small" />
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Explanation"
                variant="outlined"
                value={String(editedQuestion["Explanation"] || "")}
                onChange={(e) =>
                  handleEditChange("Explanation", e.target.value)
                }
                sx={{
                  marginBottom: 2,
                  "& .MuiOutlinedInput-root": editChanges.Explanation
                    ? {
                        "& fieldset": {
                          borderColor: "primary.main",
                          borderWidth: 2,
                        },
                      }
                    : {},
                }}
                InputProps={{
                  endAdornment: editChanges.Explanation ? (
                    <InputAdornment position="end">
                      <Chip label="Changed" color="primary" size="small" />
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>

            {/* Metadata Fields */}
            <Grid item xs={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>Subject</InputLabel>
                <Select
                  value={String(editedQuestion.Subject)}
                  onChange={(e) => {
                    const selectedSubject = String(e.target.value);
                    handleEditChange("Subject", selectedSubject);

                    // Reset dependent fields when subject changes
                    handleEditChange("Module Name", "");
                    handleEditChange("Topic", "");
                  }}
                  label="Subject"
                >
                  {getSubjects().map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>Module Name</InputLabel>
                <Select
                  value={String(editedQuestion["Module Name"])}
                  onChange={(e) =>
                    handleEditChange("Module Name", String(e.target.value))
                  }
                  label="Module Name"
                >
                  {availableModules.map((module) => (
                    <MenuItem key={module} value={module}>
                      {module}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Module Number"
                value={String(editedQuestion["Module Number"])}
                onChange={(e) =>
                  handleEditChange("Module Number", e.target.value)
                }
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>Topic</InputLabel>
                <Select
                  value={String(editedQuestion.Topic)}
                  onChange={(e) =>
                    handleEditChange("Topic", String(e.target.value))
                  }
                  label="Topic"
                >
                  {availableTopics.map((topic) => (
                    <MenuItem key={topic} value={topic}>
                      {topic}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Sub Topic"
                value={String(editedQuestion["Sub Topic"])}
                onChange={(e) => handleEditChange("Sub Topic", e.target.value)}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Micro Topic"
                value={String(editedQuestion["Micro Topic"])}
                onChange={(e) =>
                  handleEditChange("Micro Topic", e.target.value)
                }
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  value={String(editedQuestion["Difficulty Level"])}
                  onChange={(e) =>
                    handleEditChange("Difficulty Level", String(e.target.value))
                  }
                  label="Difficulty Level"
                  sx={
                    editChanges["Difficulty Level"]
                      ? {
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "primary.main",
                            borderWidth: 2,
                          },
                        }
                      : {}
                  }
                >
                  {difficultyLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
                {editChanges["Difficulty Level"] && (
                  <Chip
                    label="Changed"
                    color="primary"
                    size="small"
                    sx={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                )}
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={String(editedQuestion["Question_Type"])}
                  onChange={(e) =>
                    handleEditChange("Question_Type", String(e.target.value))
                  }
                  label="Question Type"
                >
                  {questionTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>Nature of Question</InputLabel>
                <Select
                  value={String(editedQuestion["Nature of Question"])}
                  onChange={(e) =>
                    handleEditChange(
                      "Nature of Question",
                      String(e.target.value),
                    )
                  }
                  label="Nature of Question"
                >
                  {natureOfQuestions.map((nature) => (
                    <MenuItem key={nature} value={nature}>
                      {nature}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Additional Metadata */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!editedQuestion["Faculty Approved"]}
                      onChange={(e) =>
                        handleEditChange("Faculty Approved", e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label="Faculty Approved"
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} color="primary" variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default QuestionCard;
