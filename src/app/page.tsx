"use client";
import React, { useState, useEffect, Suspense } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import CloseIcon from "@mui/icons-material/Close";
import { QuestionList } from "@/components/QuestionList";
import { addQuestionToCart, getCartItems } from "@/lib/actions";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [testId] = useState(uuidv4());
  const [filters, setFilters] = useState<{
    subject?: string[];
    module?: string[];
    topic?: string[];
    sub_topic?: string[];
    question_type?: string[];
    search?: string;
  }>({});

  const handleAddToCart = async (questionId: number) => {
    try {
      await addQuestionToCart(questionId, testId);
    } catch (error) {
      console.error('Error adding question to cart:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleCloseLogoutDialog = () => {
    setLogoutDialogOpen(false);
  };

  return (
    <MainLayout title="Questions" subtitle="Browse and manage your question bank">
      <Suspense fallback={
        <Box className="flex justify-center items-center h-full">
          <CircularProgress />
        </Box>
      }>
        <QuestionList
          testId={testId}
          filters={filters}
        />
      </Suspense>
      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleCloseLogoutDialog}
        aria-labelledby="logout-dialog-title"
      >
        <DialogTitle id="logout-dialog-title">
          Confirm Logout
          <IconButton
            aria-label="close"
            onClick={handleCloseLogoutDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to log out?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLogoutDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogout} color="primary" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
