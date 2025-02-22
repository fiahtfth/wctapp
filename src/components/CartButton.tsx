import React from 'react';
import { IconButton, Tooltip, Badge } from '@mui/material';
import { ShoppingCart as CartIcon } from '@mui/icons-material';
import { useCartStore } from '@/store/cartStore';
import { Question } from '@/types/question';
interface CartButtonProps {
  question: Question;
  size?: 'small' | 'medium' | 'large';
}
export default function CartButton({ question, size = 'medium' }: CartButtonProps) {
  const { addQuestion, removeQuestion, isInCart } = useCartStore();
  const inCart = question.id ? isInCart(question.id) : false;
  const handleClick = () => {
    if (!question.id) return;
    if (inCart) {
      removeQuestion(question.id);
    } else {
      addQuestion(question);
    }
  };
  return (
    <Tooltip title={inCart ? 'Remove from Cart' : 'Add to Cart'}>
      <IconButton
        onClick={handleClick}
        color={inCart ? 'primary' : 'default'}
        size={size}
        sx={{
          transition: 'transform 0.2s',
          '&:active': {
            transform: 'scale(0.95)',
          },
          '&:hover': {
            transform: 'scale(1.1)',
          },
        }}
      >
        <CartIcon />
      </IconButton>
    </Tooltip>
  );
}
