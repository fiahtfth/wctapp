"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import CloseIcon from "@mui/icons-material/Close";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import QuestionList from "@/components/QuestionList";
import { addQuestionToCart, getCartItems } from "@/lib/actions";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/MainLayout";

export default function Home() {
  const [testId] = useState("home-question-list");
  const [cartCount, setCartCount] = useState(0);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [filters, setFilters] = useState<{
    subject?: string[];
    module?: string[];
    topic?: string[];
    sub_topic?: string[];
    question_type?: string[];
    search?: string;
  }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Load cart count on mount
    const fetchCartCount = async () => {
      try {
        const cartItems = await getCartItems(testId);
        setCartCount(cartItems.count);
      } catch (error) {
        console.error("Failed to fetch cart items", error);
      }
    };
    fetchCartCount();
  }, [testId, router]);

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    localStorage.removeItem('token');
    window.location.href = "/login"; // Redirect to login page
  };

  const handleAddToCart = async (questionId: number) => {
    try {
      await addQuestionToCart(questionId, testId);
      setCartCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error adding question to cart:", error);
    }
  };

  return (
    <MainLayout title="Questions" subtitle="Browse and manage your question bank">
      <QuestionList
        testId={testId}
        filters={filters}
        onFilterChange={setFilters}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        totalPages={totalPages}
        onTotalPagesChange={setTotalPages}
        pageSize={pageSize}
        onAddToCart={handleAddToCart}
      />
      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 2,
            minWidth: 300,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Confirm Logout</DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography
            variant="body2"
            sx={{
              mb: 0.5,
              display: "block",
            }}
          >
            Are you sure you want to logout?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            variant="text"
            sx={{
              textTransform: "none",
              transition: "all 0.2s",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmLogout}
            variant="contained"
            color="error"
            sx={{
              textTransform: "none",
              transition: "all 0.2s",
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
